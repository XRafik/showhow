import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createShowhowMediaUrl, fetchShowhowMedia } from "./mediaProtocol";

describe("createShowhowMediaUrl", () => {
	it("creates a renderer-loadable URL scoped to one recording bundle artifact", () => {
		expect(
			createShowhowMediaUrl(
				"/Users/mohamedb/Showhow/Recordings/2026-07-25_175438-recording",
				"screenshots/step-01.png",
			),
		).toBe("showhow-media://recordings/2026-07-25_175438-recording/screenshots/step-01.png");
	});

	it("rejects media paths that escape the selected recording bundle", () => {
		expect(() =>
			createShowhowMediaUrl(
				"/Users/mohamedb/Showhow/Recordings/2026-07-25_175438-recording",
				"../video.mp4",
			),
		).toThrow(/unsafe/i);
	});
});

describe("fetchShowhowMedia full and range responses", () => {
	let recordingsRoot: string;
	let videoUrl: string;
	let fixtureBytes: Uint8Array;

	beforeEach(async () => {
		recordingsRoot = await fs.mkdtemp(path.join(os.tmpdir(), "showhow-media-protocol-"));
		const bundleDir = path.join(recordingsRoot, "2026-07-25_175438-recording");
		await fs.mkdir(bundleDir, { recursive: true });
		fixtureBytes = Uint8Array.from({ length: 256 }, (_, index) => index);
		await fs.writeFile(path.join(bundleDir, "video.mp4"), fixtureBytes);
		videoUrl = createShowhowMediaUrl(bundleDir, "video.mp4");
	});

	afterEach(async () => {
		await fs.rm(recordingsRoot, { recursive: true, force: true });
	});

	it("returns the expected full response when the request has no Range header", async () => {
		const request = new Request(videoUrl);

		const response = await fetchShowhowMedia(recordingsRoot, request);

		expect(response.status).toBe(200);
		expect(response.headers.get("content-length")).toBe("256");
		expect(response.headers.get("accept-ranges")).toBe("bytes");
		expect(response.headers.get("content-type")).toBe("video/mp4");
		expect(new Uint8Array(await response.arrayBuffer())).toEqual(fixtureBytes);
	});

	it("answers a bytes=0-99 Range request with 206, Content-Range, and exactly the first 100 bytes", async () => {
		const request = new Request(videoUrl, { headers: { Range: "bytes=0-99" } });

		const response = await fetchShowhowMedia(recordingsRoot, request);

		expect(response.status).toBe(206);
		expect(response.headers.get("content-range")).toBe("bytes 0-99/256");
		expect(response.headers.get("content-length")).toBe("100");
		expect(new Uint8Array(await response.arrayBuffer())).toEqual(fixtureBytes.subarray(0, 100));
	});
});

describe("media range and trust boundaries", () => {
	let root: string;
	let bundle: string;
	let url: string;
	const bytes = Uint8Array.from({ length: 256 }, (_, i) => i);

	beforeEach(async () => {
		root = await fs.mkdtemp(path.join(os.tmpdir(), "showhow-media-ranges-"));
		bundle = path.join(root, "recording");
		await fs.mkdir(path.join(bundle, "screenshots"), { recursive: true });
		await fs.writeFile(path.join(bundle, "video.mp4"), bytes);
		url = createShowhowMediaUrl(bundle, "video.mp4");
	});

	afterEach(async () => {
		await fs.rm(root, { recursive: true, force: true });
	});

	it.each([
		["bytes=100-149", "bytes 100-149/256", "50", 100, 150],
		["bytes=200-", "bytes 200-255/256", "56", 200, 256],
		["bytes=-20", "bytes 236-255/256", "20", 236, 256],
		["bytes=250-999", "bytes 250-255/256", "6", 250, 256],
		["bytes=-999", "bytes 0-255/256", "256", 0, 256],
	])("serves %s with exact bounds and bytes", async (range, contentRange, length, start, end) => {
		const response = await fetchShowhowMedia(root, new Request(url, { headers: { Range: range } }));
		expect(response.status).toBe(206);
		expect(response.headers.get("content-range")).toBe(contentRange);
		expect(response.headers.get("content-length")).toBe(length);
		expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes.slice(start, end));
	});

	it.each([
		"bytes=256-",
		"bytes=9-2",
		"bytes=-0",
		"bytes=abc",
		"bytes=0-1,4-5",
	])("safely rejects invalid or unsatisfiable %s", async (range) => {
		const response = await fetchShowhowMedia(root, new Request(url, { headers: { Range: range } }));
		expect(response.status).toBe(416);
		expect(response.headers.get("content-range")).toBe("bytes */256");
		await response.body?.cancel();
	});

	it("HEAD ignores Range and returns full metadata without a body", async () => {
		const response = await fetchShowhowMedia(
			root,
			new Request(url, { method: "HEAD", headers: { Range: "bytes=0-99" } }),
		);
		expect(response.status).toBe(200);
		expect(response.headers.get("content-length")).toBe("256");
		expect(response.headers.get("content-range")).toBeNull();
		expect((await response.arrayBuffer()).byteLength).toBe(0);
	});

	it("serves empty files and rejects their unsatisfiable ranges", async () => {
		await fs.writeFile(path.join(bundle, "video.mp4"), new Uint8Array());
		const full = await fetchShowhowMedia(root, new Request(url));
		expect(full.status).toBe(200);
		expect(full.headers.get("content-length")).toBe("0");
		expect((await full.arrayBuffer()).byteLength).toBe(0);
		const ranged = await fetchShowhowMedia(
			root,
			new Request(url, { headers: { Range: "bytes=0-" } }),
		);
		expect(ranged.status).toBe(416);
		expect(ranged.headers.get("content-range")).toBe("bytes */0");
		await ranged.body?.cancel();
	});

	it.each([
		"screenshots/frame.png",
		"video.webm",
	])("preserves approved media %s", async (relative) => {
		await fs.writeFile(path.join(bundle, relative), bytes);
		const response = await fetchShowhowMedia(
			root,
			new Request(createShowhowMediaUrl(bundle, relative)),
		);
		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toBe(
			relative.endsWith("png") ? "image/png" : "video/webm",
		);
		expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
	});

	it.each([
		"%ZZ/video.mp4",
		"recording/%E0%A4%A",
		"recording/%2Fvideo.mp4",
		"recording/%5Cvideo.mp4",
		"recording/%00video.mp4",
		"recording/..%2Fother%2Fvideo.mp4",
	])("fails cleanly for malformed or unsafe URL path %s", async (pathname) => {
		const response = await fetchShowhowMedia(
			root,
			new Request(`showhow-media://recordings/${pathname}`),
		);
		expect(response.status).toBe(404);
		await response.body?.cancel();
	});

	it.each([
		"meta.json",
		"secrets.txt",
		"screenshots/active.svg",
		"private.mp4",
		"screenshots/video.mp4",
	])("does not expose nonmedia %s", async (relative) => {
		await fs.writeFile(path.join(bundle, relative), "private");
		const response = await fetchShowhowMedia(
			root,
			new Request(createShowhowMediaUrl(bundle, relative)),
		);
		expect(response.status).toBe(404);
		await response.body?.cancel();
	});

	it("rejects missing artifacts and directories", async () => {
		await fs.unlink(path.join(bundle, "video.mp4"));
		const missing = await fetchShowhowMedia(root, new Request(url));
		expect(missing.status).toBe(404);
		await missing.body?.cancel();
		await fs.mkdir(path.join(bundle, "video.mp4"));
		const directory = await fetchShowhowMedia(root, new Request(url));
		expect(directory.status).toBe(404);
		await directory.body?.cancel();
	});

	it("rejects file symlinks outside their bundle even inside recordings root", async () => {
		const other = path.join(root, "other");
		await fs.mkdir(other);
		await fs.writeFile(path.join(other, "video.mp4"), bytes);
		await fs.unlink(path.join(bundle, "video.mp4"));
		await fs.symlink(path.join(other, "video.mp4"), path.join(bundle, "video.mp4"));
		const response = await fetchShowhowMedia(root, new Request(url));
		expect(response.status).toBe(404);
		await response.body?.cancel();
	});

	it("rejects bundle symlinks outside the recordings root", async () => {
		const outside = await fs.mkdtemp(path.join(os.tmpdir(), "showhow-media-outside-"));
		try {
			await fs.writeFile(path.join(outside, "video.mp4"), bytes);
			await fs.symlink(outside, path.join(root, "escape"));
			const response = await fetchShowhowMedia(
				root,
				new Request("showhow-media://recordings/escape/video.mp4"),
			);
			expect(response.status).toBe(404);
			await response.body?.cancel();
		} finally {
			await fs.rm(outside, { recursive: true, force: true });
		}
	});

	it("does not open media for a request aborted before handling", async () => {
		const abort = new AbortController();
		abort.abort();
		const open = vi.spyOn(fs, "open");
		try {
			await expect(
				fetchShowhowMedia(root, new Request(url, { signal: abort.signal })),
			).rejects.toMatchObject({ name: "AbortError" });
			expect(open).not.toHaveBeenCalled();
		} finally {
			open.mockRestore();
		}
	});

	it("does not open media when cancellation happens during path resolution", async () => {
		const abort = new AbortController();
		const realpath = fs.realpath.bind(fs);
		const resolve = vi.spyOn(fs, "realpath").mockImplementationOnce(async (file) => {
			const resolved = await realpath(file);
			abort.abort();
			return resolved;
		});
		const open = vi.spyOn(fs, "open");
		try {
			await expect(
				fetchShowhowMedia(root, new Request(url, { signal: abort.signal })),
			).rejects.toMatchObject({ name: "AbortError" });
			expect(open).not.toHaveBeenCalled();
		} finally {
			resolve.mockRestore();
			open.mockRestore();
		}
	});

	it("closes a real descriptor when cancellation happens during open", async () => {
		const abort = new AbortController();
		const openFile = fs.open.bind(fs);
		let handle: Awaited<ReturnType<typeof fs.open>> | undefined;
		const open = vi.spyOn(fs, "open").mockImplementationOnce(async (...args) => {
			handle = await openFile(...args);
			abort.abort();
			return handle;
		});
		try {
			await expect(
				fetchShowhowMedia(root, new Request(url, { signal: abort.signal })),
			).rejects.toMatchObject({ name: "AbortError" });
			expect(handle).toBeDefined();
			await expect(handle?.stat()).rejects.toMatchObject({ code: "EBADF" });
		} finally {
			open.mockRestore();
			await handle?.close();
		}
	});

	it("aborting a locked response errors its reader and closes the real file", async () => {
		const file = await fs.open(path.join(bundle, "video.mp4"), "r+");
		await file.truncate(16 * 1024 * 1024);
		await file.close();
		const abort = new AbortController();
		const openFile = fs.open.bind(fs);
		let handle: Awaited<ReturnType<typeof fs.open>> | undefined;
		const open = vi.spyOn(fs, "open").mockImplementationOnce(async (...args) => {
			handle = await openFile(...args);
			return handle;
		});
		try {
			const response = await fetchShowhowMedia(root, new Request(url, { signal: abort.signal }));
			if (!response.body) throw new Error("Expected media stream");
			const reader = response.body.getReader();
			expect((await reader.read()).done).toBe(false);
			abort.abort();
			await expect(reader.read()).rejects.toMatchObject({ name: "AbortError" });
			expect(handle).toBeDefined();
			await expect(handle?.stat()).rejects.toMatchObject({ code: "EBADF" });
		} finally {
			open.mockRestore();
			await handle?.close();
		}
	});

	it.each([
		"complete",
		"cancel",
		"HEAD",
		"missing",
	])("detaches its abort listener after %s", async (ending) => {
		const request = new Request(url, { method: ending === "HEAD" ? "HEAD" : "GET" });
		const add = vi.spyOn(request.signal, "addEventListener");
		const remove = vi.spyOn(request.signal, "removeEventListener");
		try {
			if (ending === "missing") await fs.unlink(path.join(bundle, "video.mp4"));
			const response = await fetchShowhowMedia(root, request);
			if (ending === "cancel") await response.body?.cancel();
			else await response.arrayBuffer();
			const abortListeners = add.mock.calls.filter(([event]) => event === "abort");
			for (const [, listener] of abortListeners) {
				expect(
					remove.mock.calls.some(([event, removed]) => event === "abort" && removed === listener),
				).toBe(true);
			}
		} finally {
			add.mockRestore();
			remove.mockRestore();
		}
	});

	it("streams a large sparse video incrementally and permits cancellation", async () => {
		const handle = await fs.open(path.join(bundle, "video.mp4"), "r+");
		await handle.truncate(16 * 1024 * 1024);
		await handle.close();
		const response = await fetchShowhowMedia(root, new Request(url));
		expect(response.headers.get("content-length")).toBe("16777216");
		const reader = response.body?.getReader();
		expect(reader).toBeDefined();
		const first = await reader?.read();
		expect(first?.done).toBe(false);
		expect(first?.value?.byteLength).toBeGreaterThan(0);
		expect(first?.value?.byteLength).toBeLessThanOrEqual(65536);
		await reader?.cancel();
	});
});
