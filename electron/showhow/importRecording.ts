import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { lstat, mkdir, mkdtemp, open, realpath, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
	ImportRecordingProgress,
	ImportRecordingResult,
} from "../../src/lib/showhow/recordingLibrary";
import { resolveFfmpeg } from "../media/audioPeaks";
import { buildMeta, renderStepsMarkdown, serializeStepsJson } from "./bundle";
import { createShowhowMediaUrl } from "./mediaProtocol";
import { readRecordingEntry } from "./recordingLibrary";

export interface ImportRecordingInput {
	sourcePath: string;
	recordingsRoot: string;
	requestId: string;
	signal: AbortSignal;
	onProgress: (progress: ImportRecordingProgress) => void;
}

async function validateVideo(video: string, signal: AbortSignal): Promise<number> {
	const ffmpeg = resolveFfmpeg() ?? "ffmpeg";
	const output = await new Promise<string>((resolve, reject) => {
		const child = spawn(
			ffmpeg,
			[
				"-nostdin",
				"-hide_banner",
				"-xerror",
				"-err_detect",
				"explode",
				"-i",
				video,
				"-map",
				"0:v:0",
				"-map",
				"0:a?",
				"-f",
				"null",
				"-",
			],
			{ signal, windowsHide: true, stdio: ["ignore", "ignore", "pipe"] },
		);
		let stderr = "";
		child.stderr.on("data", (chunk: Buffer) => {
			if (stderr.length < 65536) stderr += chunk.toString();
		});
		let startError: Error | undefined;
		child.on("error", (error) => {
			startError = error;
		});
		child.on("close", (code) =>
			startError
				? reject(
						signal.aborted
							? startError
							: new Error(
									"Video validation could not start. Check that Showhow's video tools are installed, then try again.",
								),
					)
				: code === 0
					? resolve(stderr)
					: reject(
							new Error(
								"This MP4 is damaged or incomplete. Choose a complete H.264/AAC MP4 and try again.",
							),
						),
		);
	});
	const duration = /Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/u.exec(output);
	if (
		!/Video: h264\b/u.test(output) ||
		(/Audio:/u.test(output) && !/Audio: aac\b/u.test(output)) ||
		!duration
	)
		throw new Error(
			"Choose an MP4 with H.264 video and AAC audio. Other codecs are not supported for import.",
		);
	const durationMs =
		(Number(duration[1]) * 3600 + Number(duration[2]) * 60 + Number(duration[3])) * 1000;
	if (!Number.isFinite(durationMs) || durationMs <= 0)
		throw new Error("This MP4 has no playable duration. Choose a complete video.");
	return durationMs;
}

export async function importRecording(input: ImportRecordingInput): Promise<ImportRecordingResult> {
	const { signal, onProgress, requestId } = input;
	let staging: string | undefined;
	try {
		signal.throwIfAborted();
		if (
			!path.isAbsolute(input.sourcePath) ||
			input.sourcePath.split(/[\\/]/u).includes("..") ||
			path.extname(input.sourcePath).toLowerCase() !== ".mp4"
		)
			throw new Error("Choose one local .mp4 file.");
		const sourceInfo = await lstat(input.sourcePath);
		if (!sourceInfo.isFile() || (sourceInfo.mode & 0o444) === 0)
			throw new Error("This file cannot be read. Choose a readable local MP4 file.");
		const source = await open(input.sourcePath, constants.O_RDONLY | constants.O_NOFOLLOW);
		let copied = 0;
		const total = sourceInfo.size;
		const fileName = path.basename(input.sourcePath);
		const progress = (phase: ImportRecordingProgress["phase"]) =>
			onProgress({ requestId, phase, fileName, bytesCopied: copied, totalBytes: total });
		let durationMs: number;
		let root: string;
		try {
			const header = Buffer.alloc(12);
			await source.read(header, 0, 12, 0);
			if (header.toString("ascii", 4, 8) !== "ftyp")
				throw new Error("This file is not a valid MP4. Choose a complete H.264/AAC MP4.");
			await mkdir(input.recordingsRoot, { recursive: true });
			root = await realpath(input.recordingsRoot);
			staging = await mkdtemp(path.join(root, ".import-"));
			const destination = await open(path.join(staging, "video.mp4"), "wx");
			try {
				progress("copying");
				const buffer = Buffer.alloc(256 * 1024);
				let lastReport = 0;
				while (copied < total) {
					signal.throwIfAborted();
					const { bytesRead } = await source.read(
						buffer,
						0,
						Math.min(buffer.length, total - copied),
						copied,
					);
					if (!bytesRead)
						throw new Error(
							"The source changed or was truncated while copying. Choose a complete MP4 and try again.",
						);
					let written = 0;
					while (written < bytesRead) {
						const result = await destination.write(
							buffer,
							written,
							bytesRead - written,
							copied + written,
						);
						if (!result.bytesWritten)
							throw new Error("Could not save this video. Check free disk space and try again.");
						written += result.bytesWritten;
					}
					copied += bytesRead;
					if (copied === total || Date.now() - lastReport >= 100) {
						progress("copying");
						lastReport = Date.now();
					}
				}
				await destination.sync();
			} finally {
				await destination.close();
			}
			const after = await source.stat();
			if (after.size !== total || after.mtimeMs !== sourceInfo.mtimeMs)
				throw new Error(
					"The source changed while copying. Try again when the file has finished saving.",
				);
			signal.throwIfAborted();
			progress("validating");
			durationMs = await validateVideo(path.join(staging, "video.mp4"), signal);
		} finally {
			await source.close();
		}
		signal.throwIfAborted();
		progress("saving");
		const meta = buildMeta({
			createdAt: Date.now(),
			durationMs,
			source: "imported",
			videoFileName: "video.mp4",
			hasWebcam: false,
			hasCursorTelemetry: false,
		});
		meta.title = path.basename(fileName, path.extname(fileName));
		meta.stepCapture = {
			status: "unavailable",
			reason: "no-clicks",
			message:
				"Imported video has no cursor or click capture. Guides can use narration when speech is available.",
		};
		await mkdir(path.join(staging, "screenshots"));
		await writeFile(path.join(staging, "steps.json"), serializeStepsJson([]), { flag: "wx" });
		await writeFile(path.join(staging, "steps.md"), renderStepsMarkdown([]), { flag: "wx" });
		await writeFile(path.join(staging, "transcript.txt"), "(transcription pending)\n", {
			flag: "wx",
		});
		await writeFile(path.join(staging, "meta.json"), JSON.stringify(meta, null, 2), { flag: "wx" });
		const prepared = await readRecordingEntry(staging);
		if (!prepared)
			throw new Error("Could not finish the imported bundle. Check free disk space and try again.");
		signal.throwIfAborted();
		const bundle = path.join(root, `imported-${randomUUID()}`);
		await rename(staging, bundle);
		staging = undefined;
		// Publication is the commit point: late cancellation must not remove a complete bundle.
		return {
			status: "imported",
			entry: {
				...prepared,
				bundleDir: bundle,
				videoUrl: createShowhowMediaUrl(bundle, "video.mp4"),
			},
		};
	} catch (error) {
		return signal.aborted
			? { status: "cancelled" }
			: {
					status: "failed",
					error:
						error instanceof Error
							? "code" in error
								? "Could not read or save this MP4. Check that the file is local and readable and that there is enough disk space, then try again."
								: error.message
							: "Could not import this MP4. Check that it is readable and try again.",
				};
	} finally {
		if (staging) await rm(staging, { recursive: true, force: true });
	}
}

export interface ImportIpcEvent {
	sender: {
		id: number;
		send: (channel: string, payload: unknown) => void;
		isDestroyed?: () => boolean;
	};
}
export type ImportIpcHandler = (event: ImportIpcEvent, ...args: unknown[]) => Promise<unknown>;
export interface ImportHandlerDependencies {
	handle: (channel: string, handler: ImportIpcHandler) => void;
	selectFile: () => Promise<string | null>;
	recordingsRoot: string;
	onImported?: (
		entry: import("../../src/lib/showhow/recordingLibrary").RecordingLibraryEntry,
	) => void;
}
export function registerImportRecordingHandlers(deps: ImportHandlerDependencies) {
	const active = new Map<number, { requestId: string; controller: AbortController }>();
	const validRequest = (value: unknown): value is { requestId: string } =>
		typeof value === "object" &&
		value !== null &&
		"requestId" in value &&
		typeof value.requestId === "string" &&
		/^[a-zA-Z0-9-]{1,100}$/u.test(value.requestId) &&
		Object.keys(value).length === 1;
	deps.handle("showhow:cancel-import", async (event, value) => {
		if (!validRequest(value)) return { cancelled: false };
		const running = active.get(event.sender.id);
		if (running?.requestId !== value.requestId) return { cancelled: false };
		running.controller.abort();
		return { cancelled: true };
	});
	deps.handle("showhow:import-recording", async (event, value): Promise<ImportRecordingResult> => {
		if (!validRequest(value))
			return { status: "failed", error: "Invalid import request. Close this sheet and try again." };
		if (active.has(event.sender.id))
			return {
				status: "failed",
				error: "An import is already running. Cancel it before choosing another video.",
			};
		const controller = new AbortController();
		active.set(event.sender.id, { requestId: value.requestId, controller });
		const progress = (payload: ImportRecordingProgress) => {
			if (!event.sender.isDestroyed?.()) event.sender.send("showhow:import-progress", payload);
			else controller.abort();
		};
		try {
			progress({ requestId: value.requestId, phase: "picking", bytesCopied: 0, totalBytes: 0 });
			const sourcePath = await deps.selectFile();
			if (!sourcePath || controller.signal.aborted) return { status: "cancelled" };
			const result = await importRecording({
				sourcePath,
				recordingsRoot: deps.recordingsRoot,
				requestId: value.requestId,
				signal: controller.signal,
				onProgress: progress,
			});
			if (result.status === "imported") {
				try {
					deps.onImported?.(result.entry);
				} catch (error) {
					console.error("Showhow import transcript could not start:", error);
				}
			}
			return result;
		} catch (error) {
			return controller.signal.aborted
				? { status: "cancelled" }
				: {
						status: "failed",
						error:
							error instanceof Error ? error.message : "Could not open the file picker. Try again.",
					};
		} finally {
			active.delete(event.sender.id);
		}
	});
}
