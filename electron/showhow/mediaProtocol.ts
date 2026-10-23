import type { FileHandle } from "node:fs/promises";
import fs from "node:fs/promises";
import path from "node:path";

export const SHOWHOW_MEDIA_SCHEME = "showhow-media";

/**
 * Upper bound for a single streamed chunk. Range requests and full reads are
 * pulled incrementally so a 16 MiB (or larger) recording never buffers in the
 * main process.
 */
const MAX_STREAM_CHUNK_BYTES = 64 * 1024;

const SCREENSHOTS_DIRECTORY = "screenshots";

const VIDEO_ARTIFACT_TYPES = new Map<string, string>([
	["video.mp4", "video/mp4"],
	["video.webm", "video/webm"],
]);

const RASTER_CONTENT_TYPES = new Map<string, string>([
	[".png", "image/png"],
	[".jpg", "image/jpeg"],
	[".jpeg", "image/jpeg"],
	[".webp", "image/webp"],
]);

function assertSafeRelativePath(relativePath: string): void {
	if (
		relativePath.length === 0 ||
		path.isAbsolute(relativePath) ||
		relativePath.split(/[\\/]/u).some((segment) => segment === ".." || segment === ".")
	) {
		throw new Error("Unsafe Showhow media path");
	}
}

export function createShowhowMediaUrl(bundleDir: string, relativePath: string): string {
	assertSafeRelativePath(relativePath);
	const bundleName = path.basename(bundleDir);
	if (bundleName.length === 0 || bundleName === "." || bundleName === "..") {
		throw new Error("Unsafe Showhow bundle path");
	}
	return `${SHOWHOW_MEDIA_SCHEME}://recordings/${encodeURIComponent(bundleName)}/${relativePath
		.split(/[\\/]/u)
		.map((segment) => encodeURIComponent(segment))
		.join("/")}`;
}

/**
 * A protocol request: the WHATWG `Request` surface this module actually uses.
 * Tests pass full `Request` objects; Electron's handler passes its own
 * request object, which satisfies the same structural shape.
 */
export type ShowhowMediaRequest = Pick<Request, "headers" | "url"> &
	Partial<Pick<Request, "method" | "signal">>;

type MediaUrlComponents = {
	bundleName: string;
	relativeSegments: string[];
};

/**
 * Decodes one URL path segment strictly: malformed percent-encoding, embedded
 * path separators, NUL bytes, and dot segments all fail containment and are
 * rejected before any filesystem access happens.
 */
function decodePathSegment(segment: string): string | null {
	if (segment.length === 0) {
		return null;
	}
	let decoded: string;
	try {
		decoded = decodeURIComponent(segment);
	} catch {
		return null;
	}
	if (
		decoded.length === 0 ||
		decoded === "." ||
		decoded === ".." ||
		decoded.includes("/") ||
		decoded.includes("\\") ||
		decoded.includes("\0")
	) {
		return null;
	}
	return decoded;
}

function parseShowhowMediaUrl(requestUrl: string): MediaUrlComponents | null {
	let url: URL;
	try {
		url = new URL(requestUrl);
	} catch {
		return null;
	}
	if (url.protocol !== `${SHOWHOW_MEDIA_SCHEME}:` || url.hostname !== "recordings") {
		return null;
	}
	const rawSegments = url.pathname.split("/").filter((segment) => segment.length > 0);
	if (rawSegments.length < 2) {
		return null;
	}
	const segments: string[] = [];
	for (const rawSegment of rawSegments) {
		const decoded = decodePathSegment(rawSegment);
		if (decoded === null) {
			return null;
		}
		segments.push(decoded);
	}
	const [bundleName, ...relativeSegments] = segments;
	if (bundleName === undefined || bundleName === "." || bundleName === "..") {
		return null;
	}
	return { bundleName, relativeSegments };
}

/**
 * Resolves a media URL to its lexical path below the recordings root, or null
 * when the URL is malformed or lexically escapes the root. Symlink and
 * file-type checks happen separately in {@link fetchShowhowMedia}.
 */
export function resolveShowhowMediaPath(recordingsRoot: string, requestUrl: string): string | null {
	const components = parseShowhowMediaUrl(requestUrl);
	if (!components) {
		return null;
	}
	const resolvedRoot = path.resolve(recordingsRoot);
	const resolvedPath = path.resolve(
		resolvedRoot,
		components.bundleName,
		...components.relativeSegments,
	);
	return resolvedPath.startsWith(`${resolvedRoot}${path.sep}`) ? resolvedPath : null;
}

function createAbortError(reason: unknown): Error {
	const error: Error & { cause?: unknown } = new Error("Showhow media request aborted");
	error.name = "AbortError";
	error.cause = reason;
	return error;
}

function isAbortError(error: unknown): boolean {
	return error instanceof Error && error.name === "AbortError";
}

/**
 * Only approved bundle media is exposed, matched by exact decoded shape:
 * the bundle's canonical screen recording (`video.mp4` / `video.webm`), or a
 * raster screenshot directly inside `screenshots/`. Documents, transcripts,
 * cursor telemetry, and anything else in a bundle stay private.
 */
function resolveApprovedMediaType(relativeSegments: string[]): string | null {
	if (relativeSegments.length === 1) {
		const videoType = VIDEO_ARTIFACT_TYPES.get(relativeSegments[0] ?? "");
		return videoType ?? null;
	}
	if (relativeSegments.length === 2 && relativeSegments[0] === SCREENSHOTS_DIRECTORY) {
		const extension = path.extname(relativeSegments[1] ?? "").toLowerCase();
		const rasterType = RASTER_CONTENT_TYPES.get(extension);
		return rasterType ?? null;
	}
	return null;
}

/** Inclusive byte range within a representation of `size` bytes. */
type ByteRange = { start: number; end: number };

type RangeDecision = ByteRange | "full" | "unsatisfiable";

const SINGLE_BYTE_RANGE_PATTERN = /^(\d*)-(\d*)$/u;

/**
 * Parses a `Range` header. Unknown range units are ignored (full response);
 * anything claiming the `bytes` unit but malformed, multi-range, or
 * unsatisfiable fails closed as 416.
 */
function decideByteRange(rangeHeader: string | null, size: number): RangeDecision {
	if (rangeHeader === null) {
		return "full";
	}
	const trimmed = rangeHeader.trim();
	if (trimmed.length === 0 || !trimmed.toLowerCase().startsWith("bytes=")) {
		return "full";
	}
	const spec = trimmed.slice("bytes=".length);
	const match = SINGLE_BYTE_RANGE_PATTERN.exec(spec);
	if (!match) {
		return "unsatisfiable";
	}
	const first = match[1] ?? "";
	const last = match[2] ?? "";
	if (first.length > 0) {
		const start = Number.parseInt(first, 10);
		if (!Number.isSafeInteger(start) || start < 0 || start >= size) {
			return "unsatisfiable";
		}
		let end = size - 1;
		if (last.length > 0) {
			const requestedEnd = Number.parseInt(last, 10);
			if (!Number.isSafeInteger(requestedEnd) || requestedEnd < start) {
				return "unsatisfiable";
			}
			end = Math.min(requestedEnd, size - 1);
		}
		return { start, end };
	}
	if (last.length === 0) {
		return "unsatisfiable";
	}
	const suffixLength = Number.parseInt(last, 10);
	if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0 || size <= 0) {
		return "unsatisfiable";
	}
	return { start: Math.max(0, size - suffixLength), end: size - 1 };
}

function isWithinDirectory(parentDirectory: string, childPath: string): boolean {
	const parentWithSeparator = parentDirectory.endsWith(path.sep)
		? parentDirectory
		: `${parentDirectory}${path.sep}`;
	return childPath.startsWith(parentWithSeparator);
}

function notFoundResponse(): Response {
	return new Response("Not found", { status: 404 });
}

type MediaFileStream = {
	stream: ReadableStream<Uint8Array>;
	/**
	 * Errors the stream controller so a locked reader rejects with the given
	 * error; a no-op once the stream already finished. Never calls
	 * `stream.cancel()`, which would throw on a locked stream.
	 */
	error: (error: Error) => void;
};

/**
 * Streams `byteLength` bytes starting at `start` directly from an open file
 * descriptor. Each pull reads at most {@link MAX_STREAM_CHUNK_BYTES}, and the
 * passed cleanup runs exactly once on end, error, or cancellation.
 */
function createMediaFileStream(
	handle: FileHandle,
	start: number,
	byteLength: number,
	cleanup: () => void,
): MediaFileStream {
	let position = start;
	let remaining = byteLength;
	let finished = false;
	let streamController: ReadableStreamDefaultController<Uint8Array> | null = null;
	const finish = (): void => {
		if (finished) {
			return;
		}
		finished = true;
		cleanup();
	};
	const stream = new ReadableStream<Uint8Array>({
		start(controller): void {
			streamController = controller;
		},
		async pull(controller): Promise<void> {
			if (remaining <= 0) {
				finish();
				controller.close();
				return;
			}
			try {
				const length = Math.min(MAX_STREAM_CHUNK_BYTES, remaining);
				const buffer = new Uint8Array(length);
				const { bytesRead } = await handle.read(buffer, 0, length, position);
				if (bytesRead <= 0) {
					finish();
					controller.close();
					return;
				}
				position += bytesRead;
				remaining -= bytesRead;
				controller.enqueue(bytesRead === length ? buffer : buffer.subarray(0, bytesRead));
			} catch (error) {
				finish();
				controller.error(error);
			}
		},
		cancel(): void {
			finish();
		},
	});
	return {
		stream,
		error(error: Error): void {
			finish();
			streamController?.error(error);
		},
	};
}

/**
 * Serves one media request for the recordings root without any Electron
 * `net.fetch` / file-URL indirection. Cancellation is honored end to end: a
 * request whose signal is already aborted, or aborts during path resolution or
 * descriptor acquisition, rejects with an `AbortError` instead of answering,
 * and an abort during streaming errors the active stream and releases the
 * descriptor. Every other failure path resolves to a clean 404, so malformed
 * or untrusted URLs can never throw into the protocol handler.
 */
export async function fetchShowhowMedia(
	recordingsRoot: string | (() => string),
	request: ShowhowMediaRequest,
): Promise<Response> {
	try {
		return await serveShowhowMedia(
			typeof recordingsRoot === "function" ? recordingsRoot() : recordingsRoot,
			request,
		);
	} catch (error) {
		if (isAbortError(error)) {
			throw error;
		}
		return notFoundResponse();
	}
}

async function serveShowhowMedia(
	recordingsRoot: string,
	request: ShowhowMediaRequest,
): Promise<Response> {
	const components = parseShowhowMediaUrl(request.url);
	if (!components) {
		return notFoundResponse();
	}
	const contentType = resolveApprovedMediaType(components.relativeSegments);
	if (contentType === null) {
		return notFoundResponse();
	}

	const signal = request.signal;
	if (signal?.aborted) {
		throw createAbortError(signal.reason);
	}

	// Cancellation state shared by the abort listener, the phase checks, and
	// the deterministic single cleanup below.
	let acquiredHandle: FileHandle | null = null;
	let handleClosed = false;
	let handleTransferred = false;
	let listenerRegistered = signal !== undefined;
	let abortError: Error | null = null;
	let failActiveStream: ((error: Error) => void) | null = null;

	const releaseHandle = (): void => {
		if (handleClosed || acquiredHandle === null) {
			return;
		}
		handleClosed = true;
		void acquiredHandle.close().catch(() => undefined);
	};

	const onAbort = (): void => {
		abortError = createAbortError(signal?.reason);
		// `{ once: true }` already detached the listener.
		listenerRegistered = false;
		releaseHandle();
		if (failActiveStream !== null && abortError !== null) {
			failActiveStream(abortError);
		}
	};

	const removeAbortListener = (): void => {
		if (!listenerRegistered || signal === undefined) {
			return;
		}
		listenerRegistered = false;
		signal.removeEventListener("abort", onAbort);
	};

	const cleanup = (): void => {
		releaseHandle();
		removeAbortListener();
	};

	const throwIfAborted = (): void => {
		if (abortError !== null) {
			throw abortError;
		}
	};

	// Registered before any async filesystem work so an abort at any later
	// point is observed exactly once.
	if (signal !== undefined) {
		signal.addEventListener("abort", onAbort, { once: true });
	}

	try {
		const resolvedRoot = path.resolve(recordingsRoot);
		let rootRealPath = "";
		let targetRealPath = "";
		let bundleRealPath = "";
		try {
			rootRealPath = await fs.realpath(resolvedRoot);
		} catch {
			throwIfAborted();
			return notFoundResponse();
		}
		throwIfAborted();
		const candidatePath = path.resolve(
			resolvedRoot,
			components.bundleName,
			...components.relativeSegments,
		);
		try {
			targetRealPath = await fs.realpath(candidatePath);
		} catch {
			throwIfAborted();
			return notFoundResponse();
		}
		throwIfAborted();
		try {
			bundleRealPath = await fs.realpath(path.resolve(resolvedRoot, components.bundleName));
		} catch {
			throwIfAborted();
			return notFoundResponse();
		}
		throwIfAborted();
		// Canonical containment: the resolved file must live under the real
		// recordings root AND under the real bundle directory, so symlinks cannot
		// escape either boundary even when they stay inside the root.
		if (
			!isWithinDirectory(rootRealPath, targetRealPath) ||
			!isWithinDirectory(bundleRealPath, targetRealPath)
		) {
			return notFoundResponse();
		}

		throwIfAborted();
		let handle: FileHandle;
		try {
			handle = await fs.open(targetRealPath, "r");
		} catch {
			throwIfAborted();
			return notFoundResponse();
		}
		acquiredHandle = handle;
		throwIfAborted();

		let stats;
		try {
			stats = await handle.stat();
		} catch {
			throwIfAborted();
			releaseHandle();
			return notFoundResponse();
		}
		throwIfAborted();
		if (!stats.isFile()) {
			releaseHandle();
			return notFoundResponse();
		}

		const size = stats.size;
		const metadataHeaders: Record<string, string> = {
			"content-type": contentType,
			"content-length": String(size),
			"accept-ranges": "bytes",
		};

		// HEAD describes the full representation, ignores Range, and never opens a
		// streaming body; the descriptor is closed immediately.
		if (request.method?.toUpperCase() === "HEAD") {
			releaseHandle();
			return new Response(null, { status: 200, headers: metadataHeaders });
		}

		const range = decideByteRange(request.headers.get("range"), size);
		if (range === "unsatisfiable") {
			releaseHandle();
			return new Response(null, {
				status: 416,
				headers: {
					"content-type": contentType,
					"accept-ranges": "bytes",
					"content-range": `bytes */${size}`,
				},
			});
		}
		if (range === "full") {
			handleTransferred = true;
			const mediaStream = createMediaFileStream(handle, 0, size, cleanup);
			failActiveStream = mediaStream.error;
			return new Response(mediaStream.stream, { status: 200, headers: metadataHeaders });
		}

		const { start, end } = range;
		const byteLength = end - start + 1;
		handleTransferred = true;
		const mediaStream = createMediaFileStream(handle, start, byteLength, cleanup);
		failActiveStream = mediaStream.error;
		return new Response(mediaStream.stream, {
			status: 206,
			headers: {
				...metadataHeaders,
				"content-length": String(byteLength),
				"content-range": `bytes ${start}-${end}/${size}`,
			},
		});
	} finally {
		// Once ownership transferred to a stream, the stream's own finish path
		// owns the single cleanup; otherwise clean up deterministically here.
		if (!handleTransferred) {
			cleanup();
		}
	}
}
