import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import {
	chmod,
	mkdir,
	mkdtemp,
	readdir,
	readFile,
	realpath,
	rm,
	symlink,
	writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
	type ImportIpcHandler,
	importRecording,
	registerImportRecordingHandlers,
} from "./importRecording";
import { listRecordings } from "./recordingLibrary";

const exec = promisify(execFile);
let scratch: string;
let source: string;
const hash = async (file: string) =>
	createHash("sha256")
		.update(await readFile(file))
		.digest("hex");
beforeAll(async () => {
	scratch = await realpath(await mkdtemp(path.join(os.tmpdir(), "showhow-import-test-")));
	source = path.join(scratch, "Demo.mp4");
	await exec("ffmpeg", [
		"-hide_banner",
		"-y",
		"-f",
		"lavfi",
		"-i",
		"color=c=blue:s=64x64:r=10:d=1",
		"-f",
		"lavfi",
		"-i",
		"sine=frequency=440:duration=1",
		"-c:v",
		"libx264",
		"-c:a",
		"aac",
		"-movflags",
		"+faststart",
		"-shortest",
		source,
	]);
});
afterAll(async () => {
	if (scratch) await rm(scratch, { recursive: true, force: true });
});

describe("importRecording", () => {
	it("publishes a separate complete imported bundle and preserves the source", async () => {
		const root = path.join(scratch, "success");
		const originalHash = await hash(source);
		const result = await importRecording({
			sourcePath: source,
			recordingsRoot: root,
			requestId: "success",
			signal: new AbortController().signal,
			onProgress: () => undefined,
		});
		expect(result.status).toBe("imported");
		if (result.status !== "imported") throw new Error(JSON.stringify(result));
		expect(result.entry).toMatchObject({
			source: "imported",
			title: "Demo",
			video: "video.mp4",
			stepCapture: { status: "unavailable" },
		});
		expect(
			JSON.parse(await readFile(path.join(result.entry.bundleDir, "meta.json"), "utf8")),
		).toMatchObject({
			title: "Demo",
			titleSource: "user",
		});
		expect(result.entry.durationMs).toBeGreaterThanOrEqual(900);
		expect(await hash(path.join(result.entry.bundleDir, "video.mp4"))).toBe(originalHash);
		expect(await hash(source)).toBe(originalHash);
		expect(await readdir(result.entry.bundleDir)).not.toContain("video.mp4.cursor.json");
		expect(await listRecordings(root)).toEqual([result.entry]);
		expect(await readFile(path.join(result.entry.bundleDir, "steps.json"), "utf8")).toBe("[]\n");
	});
	it("imports duplicate names into distinct complete bundles", async () => {
		const root = path.join(scratch, "duplicates");
		const run = (requestId: string) =>
			importRecording({
				sourcePath: source,
				recordingsRoot: root,
				requestId,
				signal: new AbortController().signal,
				onProgress: () => undefined,
			});
		const first = await run("one");
		const second = await run("two");
		expect(first.status).toBe("imported");
		expect(second.status).toBe("imported");
		if (first.status !== "imported" || second.status !== "imported")
			throw new Error("Import failed");
		expect(first.entry.bundleDir).not.toBe(second.entry.bundleDir);
		expect(await listRecordings(root)).toHaveLength(2);
		expect(await hash(source)).toBe(await hash(path.join(first.entry.bundleDir, "video.mp4")));
	});

	it("cancels during copying with no completed row, preserves source and other imports", async () => {
		const root = path.join(scratch, "cancel");
		const before = await hash(source);
		const controller = new AbortController();
		const result = await importRecording({
			sourcePath: source,
			recordingsRoot: root,
			requestId: "cancel",
			signal: controller.signal,
			onProgress: (progress) => {
				if (progress.phase === "copying" && progress.bytesCopied > 0) controller.abort();
			},
		});
		expect(result).toEqual({ status: "cancelled" });
		expect(await listRecordings(root)).toEqual([]);
		expect(await readdir(root)).toEqual([]);
		expect(await hash(source)).toBe(before);
		const next = await importRecording({
			sourcePath: source,
			recordingsRoot: root,
			requestId: "next",
			signal: new AbortController().signal,
			onProgress: () => controller.abort(),
		});
		expect(next.status).toBe("imported");
		expect(await listRecordings(root)).toHaveLength(1);
	});

	it("rejects a truncated faststart MP4 that still has readable metadata", async () => {
		const broken = path.join(scratch, "truncated.mp4");
		const bytes = await readFile(source);
		await writeFile(broken, bytes.subarray(0, bytes.length - 1000));
		const before = await hash(broken);
		const root = path.join(scratch, "truncated-root");
		const result = await importRecording({
			sourcePath: broken,
			recordingsRoot: root,
			requestId: "broken",
			signal: new AbortController().signal,
			onProgress: () => undefined,
		});
		expect(result.status).toBe("failed");
		expect(await listRecordings(root)).toEqual([]);
		expect(await hash(broken)).toBe(before);
	});

	it("reports exact final copied bytes without exposing the incomplete staging bundle", async () => {
		const root = path.join(scratch, "progress");
		const progress: import("../../src/lib/showhow/recordingLibrary").ImportRecordingProgress[] = [];
		const observedRows: Promise<unknown>[] = [];
		const result = await importRecording({
			sourcePath: source,
			recordingsRoot: root,
			requestId: "progress",
			signal: new AbortController().signal,
			onProgress: (value) => {
				progress.push(value);
				observedRows.push(listRecordings(root).then((rows) => expect(rows).toEqual([])));
			},
		});
		await Promise.all(observedRows);
		expect(result.status).toBe("imported");
		const copied = progress.filter((value) => value.phase === "copying");
		expect(copied.at(-1)?.bytesCopied).toBe((await readFile(source)).length);
		expect(copied.at(-1)?.totalBytes).toBe((await readFile(source)).length);
		expect(progress.map((value) => value.phase)).toContain("validating");
	});

	it("cancels an in-flight full decode without publishing a bundle", async () => {
		const controller = new AbortController();
		const root = path.join(scratch, "cancel-validation");
		const result = await importRecording({
			sourcePath: source,
			recordingsRoot: root,
			requestId: "cancel-decode",
			signal: controller.signal,
			onProgress: (value) => {
				if (value.phase === "validating") setTimeout(() => controller.abort(), 0);
			},
		});
		expect(result).toEqual({ status: "cancelled" });
		expect(await readdir(root)).toEqual([]);
	});

	it.each([
		"directory",
		"non-mp4",
		"unreadable",
		"symlink",
		"relative",
		"fake-mp4",
	])("rejects %s without writing a finished row", async (kind) => {
		const target = path.join(scratch, `${kind}.mp4`);
		let sourcePath = target;
		if (kind === "directory") await mkdir(target);
		else if (kind === "symlink") await symlink(source, target);
		else if (kind === "relative") sourcePath = "../escape.mp4";
		else if (kind === "escape") sourcePath = `${scratch}/../${path.basename(scratch)}/Demo.mp4`;
		else {
			await writeFile(target, kind === "fake-mp4" ? "not a video" : await readFile(source));
			if (kind === "unreadable") await chmod(target, 0o000);
			if (kind === "non-mp4") {
				sourcePath = path.join(scratch, "video.txt");
				await writeFile(sourcePath, await readFile(source));
			}
		}
		const root = path.join(scratch, `reject-${kind}`);
		const result = await importRecording({
			sourcePath,
			recordingsRoot: root,
			requestId: kind,
			signal: new AbortController().signal,
			onProgress: () => undefined,
		});
		expect(result.status).toBe("failed");
		expect(await listRecordings(root)).toEqual([]);
	});
});

describe("production import IPC registration", () => {
	it("uses the system picker and publishes the real imported result", async () => {
		const handlers = new Map<string, ImportIpcHandler>();
		const root = path.join(scratch, "registered");
		let selected = 0;
		registerImportRecordingHandlers({
			handle: (channel, handler) => handlers.set(channel, handler),
			recordingsRoot: root,
			selectFile: async () => {
				selected++;
				return source;
			},
		});
		expect(handlers.has("showhow:import-recording")).toBe(true);
		const result = await handlers.get("showhow:import-recording")?.(
			{ sender: { id: 7, send: () => undefined } },
			{ requestId: "real-import" },
		);
		expect(selected).toBe(1);
		expect(result).toMatchObject({ status: "imported", entry: { source: "imported" } });
		expect(await listRecordings(root)).toHaveLength(1);
	});
	it("picker cancellation writes nothing", async () => {
		const handlers = new Map<string, ImportIpcHandler>();
		const root = path.join(scratch, "picker-cancel");
		registerImportRecordingHandlers({
			handle: (channel, handler) => handlers.set(channel, handler),
			recordingsRoot: root,
			selectFile: async () => null,
		});
		expect(
			await handlers.get("showhow:import-recording")?.(
				{ sender: { id: 1, send: () => undefined } },
				{ requestId: "cancel" },
			),
		).toEqual({ status: "cancelled" });
		expect(await readdir(scratch)).not.toContain("picker-cancel");
	});

	it("rejects renderer paths before invoking the system picker", async () => {
		const handlers = new Map<string, ImportIpcHandler>();
		let calls = 0;
		registerImportRecordingHandlers({
			handle: (channel, handler) => handlers.set(channel, handler),
			recordingsRoot: path.join(scratch, "malformed"),
			selectFile: async () => {
				calls++;
				return source;
			},
		});
		const event = { sender: { id: 1, send: () => undefined } };
		for (const request of [
			null,
			{ requestId: "../escape" },
			{ requestId: "valid", sourcePath: source },
			{ requestId: "valid", recordingsRoot: "/escape" },
		]) {
			expect(await handlers.get("showhow:import-recording")?.(event, request)).toMatchObject({
				status: "failed",
			});
		}
		expect(calls).toBe(0);
	});

	it("foreign sender and stale request cancellation cannot stop the active import", async () => {
		const handlers = new Map<string, ImportIpcHandler>();
		const root = path.join(scratch, "owner-only");
		let release!: (file: string) => void;
		registerImportRecordingHandlers({
			handle: (channel, handler) => handlers.set(channel, handler),
			recordingsRoot: root,
			selectFile: () =>
				new Promise((resolve) => {
					release = resolve;
				}),
		});
		const owner = { sender: { id: 1, send: () => undefined } };
		const run = handlers.get("showhow:import-recording")?.(owner, { requestId: "active" });
		expect(
			await handlers.get("showhow:cancel-import")?.(
				{ sender: { id: 2, send: () => undefined } },
				{ requestId: "active" },
			),
		).toEqual({ cancelled: false });
		expect(await handlers.get("showhow:cancel-import")?.(owner, { requestId: "old" })).toEqual({
			cancelled: false,
		});
		release(source);
		expect(await run).toMatchObject({ status: "imported" });
		expect(await listRecordings(root)).toHaveLength(1);
	});

	it("owner cancellation while picker is pending writes no files", async () => {
		const handlers = new Map<string, ImportIpcHandler>();
		const root = path.join(scratch, "owner-cancel");
		let release!: (file: string) => void;
		registerImportRecordingHandlers({
			handle: (channel, handler) => handlers.set(channel, handler),
			recordingsRoot: root,
			selectFile: () =>
				new Promise((resolve) => {
					release = resolve;
				}),
		});
		const event = { sender: { id: 1, send: () => undefined } };
		const run = handlers.get("showhow:import-recording")?.(event, { requestId: "active" });
		expect(await handlers.get("showhow:cancel-import")?.(event, { requestId: "active" })).toEqual({
			cancelled: true,
		});
		release(source);
		expect(await run).toEqual({ status: "cancelled" });
		expect(await readdir(scratch)).not.toContain("owner-cancel");
	});
});
