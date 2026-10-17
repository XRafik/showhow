import { mkdir, mkdtemp, readFile, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { type GuideIpcHandler, registerAiGuideHandlers } from "./aiGuideConsent";
import { renderStepsMarkdown, type Step, serializeStepsJson } from "./bundle";

const step: Step = {
	label: "Open settings",
	ts: 1000,
	coords: { cx: 0.5, cy: 0.5 },
	tier: "desktop",
	redaction: false,
	screenshot: "",
};
async function setup(key: string | null = "fake-offline-key") {
	const dir = await mkdtemp(path.join(os.tmpdir(), "showhow-ipc-ai-"));
	const root = path.join(dir, "Recordings");
	const bundle = path.join(root, "one");
	await mkdir(bundle, { recursive: true });
	await writeFile(
		path.join(bundle, "meta.json"),
		JSON.stringify({ title: "Example", video: "video.mp4" }),
	);
	await writeFile(path.join(bundle, "steps.json"), serializeStepsJson([step]));
	await writeFile(path.join(bundle, "steps.md"), renderStepsMarkdown([step]));
	await writeFile(path.join(bundle, "transcript.txt"), "[0:01] private words\n");
	const handlers = new Map<string, GuideIpcHandler>();
	const model = vi.fn(async () =>
		JSON.stringify({ title: "New title", steps: [{ sourceIds: ["1"], label: "Open settings" }] }),
	);
	const createModel = vi.fn(async () => model);
	let storedKey = key;
	let config = { provider: "openrouter", model: "fake-model" };
	registerAiGuideHandlers({
		handle: (name, handler) => handlers.set(name, handler),
		recordingsRoot: root,
		preferencesDir: dir,
		getStore: () => ({
			getApiKey: () => storedKey,
			getConfig: () => config,
			setConfig: async (c) => {
				config = c;
			},
			setCredential: async (_p, c) => {
				storedKey = c.apiKey;
			},
			removeCredential: async () => {
				storedKey = null;
			},
		}),
		createModel,
	});
	const event = { sender: { id: 1, send: vi.fn() } };
	const call = async (name: string, ...args: unknown[]) => {
		const handler = handlers.get(`showhow:ai-guide-${name}`);
		expect(handler, `registered ${name}`).toBeTypeOf("function");
		return (await handler!(event, ...args)) as Record<string, unknown>;
	};
	return { dir, root, bundle, call, createModel, model, event };
}
describe("registered AI guide IPC boundary", () => {
	it("blocks run with no stored key even with a forged consent/token", async () => {
		const s = await setup(null);
		expect(await s.call("run", s.bundle, "forged")).toMatchObject({ success: false });
		expect(s.createModel).not.toHaveBeenCalled();
	});
});

it("preview is local; run requires main-process provider consent and uses the reviewed payload exactly", async () => {
	const s = await setup();
	const preview = await s.call("preview", s.bundle, { transcript: false, frames: false });
	expect(s.model).not.toHaveBeenCalled();
	expect(await s.call("run", s.bundle, preview.token)).toMatchObject({ success: false });
	expect(s.createModel).not.toHaveBeenCalled();
	expect(await s.call("consent", s.bundle, preview.token, true)).toMatchObject({ success: true });
	expect(await s.call("run", s.bundle, preview.token)).toMatchObject({ success: true });
	expect(s.model).toHaveBeenCalledTimes(1);
	expect(JSON.stringify(s.model.mock.calls)).not.toContain("private words");
	const consent = JSON.parse(
		await readFile(path.join(s.dir, "showhow-ai-guide-consent.json"), "utf8"),
	);
	expect(consent.openrouter.reviewedAt).toBeGreaterThan(0);
	expect(consent.openrouter.options.transcript).toBe(false);
	expect(consent.openai).toBeUndefined();
	expect(await s.call("run", s.bundle, preview.token)).toMatchObject({ success: false });
});
it("rejects outside-root and symlink escapes before preview or sends", async () => {
	const s = await setup();
	const outside = path.join(s.dir, "outside");
	await mkdir(outside);
	const link = path.join(s.root, "escape");
	await symlink(outside, link);
	for (const target of [outside, link, path.join(s.root, "..", "outside")]) {
		expect(await s.call("preview", target, { transcript: true, frames: true })).toMatchObject({
			success: false,
		});
		expect(await s.call("run", target, "forged")).toMatchObject({ success: false });
	}
	expect(s.createModel).not.toHaveBeenCalled();
});
it("rejects changed bundle contents after review and tokens from another sender", async () => {
	const s = await setup();
	const p = await s.call("preview", s.bundle, { transcript: true, frames: false });
	await s.call("consent", s.bundle, p.token, true);
	await writeFile(path.join(s.bundle, "transcript.txt"), "[0:01] Changed after review\n");
	expect(await s.call("run", s.bundle, p.token)).toMatchObject({ success: false });
	expect(s.createModel).not.toHaveBeenCalled();
});

it("processes a real large image locally to JPEG at most 1024px and sends exactly the preview selection", async () => {
	const { execFile } = await import("node:child_process");
	const { promisify } = await import("node:util");
	const exec = promisify(execFile);
	const s = await setup();
	await mkdir(path.join(s.bundle, "screenshots"));
	await exec("ffmpeg", [
		"-y",
		"-f",
		"lavfi",
		"-i",
		"color=c=red:s=2400x1200",
		"-frames:v",
		"1",
		path.join(s.bundle, "screenshots", "frame.png"),
	]);
	await writeFile(
		path.join(s.bundle, "steps.json"),
		serializeStepsJson([{ ...step, screenshot: "frame.png" }]),
	);
	const preview = await s.call("preview", s.bundle, { transcript: false, frames: true });
	const frames = preview.frames as { dataUrl: string }[];
	expect(frames).toHaveLength(1);
	expect(frames[0].dataUrl).toMatch(/^data:image\/jpeg;base64,/);
	const image = path.join(s.dir, "reviewed.jpg");
	await writeFile(image, Buffer.from(frames[0].dataUrl.split(",")[1], "base64"));
	const probe = JSON.parse(
		(await exec("ffprobe", ["-v", "quiet", "-show_streams", "-of", "json", image])).stdout,
	);
	expect(probe.streams[0]).toMatchObject({ codec_name: "mjpeg", width: 1024, height: 512 });
	await s.call("consent", s.bundle, preview.token, true);
	expect(await s.call("run", s.bundle, preview.token)).toMatchObject({ success: true });
	expect(JSON.stringify(s.model.mock.calls)).toContain(frames[0].dataUrl);
});

it("handles provider factory failure through the deterministic failure path and rejects foreign renderer tokens", async () => {
	const s = await setup();
	const p = await s.call("preview", s.bundle, { transcript: true, frames: false });
	await s.call("consent", s.bundle, p.token, true);
	s.event.sender.id = 2;
	expect(await s.call("run", s.bundle, p.token)).toMatchObject({ success: false });
	expect(s.createModel).not.toHaveBeenCalled();
	s.event.sender.id = 1;
	s.createModel.mockRejectedValueOnce(new Error("offline provider factory failure"));
	expect(await s.call("run", s.bundle, p.token)).toMatchObject({ success: false });
	expect(await readFile(path.join(s.bundle, "steps.json"), "utf8")).toBe(
		serializeStepsJson([step]),
	);
	expect(JSON.parse(await readFile(path.join(s.bundle, "meta.json"), "utf8")).guide.status).toBe(
		"failed",
	);
});
it("rejects source-file and screenshot symlink escapes", async () => {
	const s = await setup();
	const { unlink } = await import("node:fs/promises");
	const outside = path.join(s.dir, "outside.txt");
	await writeFile(outside, "private external content");
	await unlink(path.join(s.bundle, "transcript.txt"));
	await symlink(outside, path.join(s.bundle, "transcript.txt"));
	expect(await s.call("preview", s.bundle, { transcript: true, frames: false })).toMatchObject({
		success: false,
	});
	await unlink(path.join(s.bundle, "transcript.txt"));
	await writeFile(path.join(s.bundle, "transcript.txt"), "");
	await mkdir(path.join(s.bundle, "screenshots"));
	await symlink(outside, path.join(s.bundle, "screenshots", "escape.png"));
	await writeFile(
		path.join(s.bundle, "steps.json"),
		serializeStepsJson([{ ...step, screenshot: "escape.png" }]),
	);
	expect(await s.call("preview", s.bundle, { transcript: false, frames: true })).toMatchObject({
		success: false,
	});
	expect(s.createModel).not.toHaveBeenCalled();
});

it("does not follow a pre-existing temporary-file symlink during guide writes", async () => {
	const s = await setup();
	const p = await s.call("preview", s.bundle, { transcript: true, frames: false });
	await s.call("consent", s.bundle, p.token, true);
	const external = path.join(s.dir, "unrelated.txt");
	await writeFile(external, "untouched");
	await symlink(external, path.join(s.bundle, ".ai-guide.meta.json.tmp"));
	expect(await s.call("run", s.bundle, p.token)).toMatchObject({ success: false });
	expect(await readFile(external, "utf8")).toBe("untouched");
	expect(s.model).not.toHaveBeenCalled();
});

it("extracts narration-only frames from local video at transcript times and preserves empty click sources", async () => {
	const { execFile } = await import("node:child_process");
	const { promisify } = await import("node:util");
	const exec = promisify(execFile);
	const s = await setup();
	await writeFile(path.join(s.bundle, "steps.json"), "[]\n");
	await writeFile(
		path.join(s.bundle, "transcript.txt"),
		"[0:01] Open settings\n[0:02] Save changes\n",
	);
	await exec("ffmpeg", [
		"-y",
		"-f",
		"lavfi",
		"-i",
		"color=c=blue:s=1600x900:d=3",
		"-c:v",
		"libx264",
		path.join(s.bundle, "video.mp4"),
	]);
	const p = await s.call("preview", s.bundle, { transcript: true, frames: true });
	expect(p.frames as unknown[]).toHaveLength(2);
	expect(p.steps).toEqual([
		{ sourceId: "1", ts: 1000, label: "Open settings" },
		{ sourceId: "2", ts: 2000, label: "Save changes" },
	]);
	await s.call("consent", s.bundle, p.token, true);
	expect(await s.call("run", s.bundle, p.token)).toMatchObject({ success: true });
	const output = JSON.parse(await readFile(path.join(s.bundle, "steps.json"), "utf8"));
	expect(output[0]).toMatchObject({
		ts: 1000,
		kind: "narration",
		coords: { cx: 0, cy: 0 },
		screenshot: "narration-01.jpg",
	});
	expect(await readFile(path.join(s.bundle, "steps.deterministic.json"), "utf8")).toBe("[]\n");
	expect((await s.call("status", s.bundle)).narrationOnly).toBe(true);
});
