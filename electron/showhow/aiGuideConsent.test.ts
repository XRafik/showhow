import { chmod, mkdir, mkdtemp, readFile, realpath, symlink, writeFile } from "node:fs/promises";
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
	const briefModel = vi.fn(async (_messages: unknown, _signal?: AbortSignal) =>
		JSON.stringify({
			title: "Settings brief",
			requestedChange: null,
			observed: { text: "Settings opened", sourceIds: ["1"] },
			expected: null,
			actual: null,
			evidence: [{ sourceId: "1", text: "Opened settings" }],
			unknowns: ["Why settings was opened"],
		}),
	);
	const createModel = vi.fn(async (_key: string, _model: string, payload?: string) =>
		payload === "brief" ? briefModel : model,
	);
	const clipboard = vi.fn((_text: string) => undefined);
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
		writeClipboard: (text) => clipboard(text),
	});
	const event = { sender: { id: 1, send: vi.fn() } };
	const call = async (name: string, ...args: unknown[]) => {
		const handler = handlers.get(`showhow:ai-guide-${name}`);
		expect(handler, `registered ${name}`).toBeTypeOf("function");
		return (await handler!(event, ...args)) as Record<string, unknown>;
	};
	const brief = async (name: string, ...args: unknown[]) => {
		const handler = handlers.get(`showhow:agent-brief-${name}`);
		expect(handler, `registered brief ${name}`).toBeTypeOf("function");
		return (await handler!(event, ...args)) as Record<string, unknown>;
	};
	const handler = (name: string) => handlers.get(name)!;
	const setModel = (model: string) => {
		config = { provider: "openrouter", model };
	};
	return {
		dir,
		root,
		bundle,
		call,
		brief,
		handler,
		setModel,
		createModel,
		model,
		briefModel,
		clipboard,
		event,
	};
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

describe("agent brief IPC boundary", () => {
	async function reviewedBrief(s: Awaited<ReturnType<typeof setup>>) {
		const preview = await s.brief("preview", s.bundle, { transcript: true, frames: false });
		expect(await s.brief("consent", s.bundle, preview.token, true)).toEqual({ success: true });
		return preview;
	}

	it("reads an older bundle as not made and copy reports absent without touching the clipboard", async () => {
		const s = await setup();
		expect(await s.brief("status", s.bundle)).toMatchObject({
			state: "none",
			reviewed: false,
			connected: true,
			model: "fake-model",
		});
		expect(await s.brief("copy", s.bundle)).toEqual({ success: false, reason: "absent" });
		expect(s.clipboard).not.toHaveBeenCalled();
	});

	it("needs its own reviewed consent: guide consent does not authorise the brief payload", async () => {
		const s = await setup();
		const guide = await s.call("preview", s.bundle, { transcript: true, frames: false });
		await s.call("consent", s.bundle, guide.token, true);
		const preview = await s.brief("preview", s.bundle, { transcript: true, frames: false });
		expect(await s.brief("run", s.bundle, preview.token)).toMatchObject({ success: false });
		expect(s.briefModel).not.toHaveBeenCalled();
		expect(await s.brief("consent", s.bundle, preview.token, false)).toEqual({ success: true });
		expect(await s.brief("run", s.bundle, preview.token)).toEqual({ success: true });
		expect(s.createModel).toHaveBeenLastCalledWith("fake-offline-key", "fake-model", "brief");
		const consent = JSON.parse(
			await readFile(path.join(s.dir, "showhow-ai-guide-consent.json"), "utf8"),
		);
		expect(consent.openrouterBrief).toMatchObject({ alwaysSend: false });
		expect(await s.brief("status", s.bundle)).toMatchObject({
			state: "ready",
			reviewed: true,
			alwaysSend: false,
			brief: { title: "Settings brief", model: "fake-model" },
		});
	});

	it("rejects a token reviewed for another bundle", async () => {
		const s = await setup();
		const other = path.join(s.root, "two");
		await mkdir(other);
		for (const name of ["meta.json", "steps.json", "steps.md", "transcript.txt"])
			await writeFile(path.join(other, name), await readFile(path.join(s.bundle, name)));
		const preview = await reviewedBrief(s);
		expect(await s.brief("run", other, preview.token)).toMatchObject({ success: false });
		expect(s.briefModel).not.toHaveBeenCalled();
	});

	it("copies the saved brief and the exact bundle path", async () => {
		const s = await setup();
		const preview = await reviewedBrief(s);
		await s.brief("run", s.bundle, preview.token);
		expect(await s.brief("copy", s.bundle)).toEqual({ success: true });
		const text = s.clipboard.mock.calls[0]![0];
		expect(text).toContain("# Settings brief");
		expect(text).toContain(`\`${await realpath(s.bundle)}\``);
	});

	it("reports a clipboard rejection as an error, not as copied", async () => {
		const s = await setup();
		const preview = await reviewedBrief(s);
		await s.brief("run", s.bundle, preview.token);
		s.clipboard.mockImplementationOnce(() => {
			throw new Error("denied");
		});
		expect(await s.brief("copy", s.bundle)).toEqual({ success: false, reason: "error" });
	});

	it("cancels a running brief without writing it", async () => {
		const s = await setup();
		const preview = await reviewedBrief(s);
		let release!: () => void;
		s.briefModel.mockImplementationOnce(
			(_messages, signal) =>
				new Promise((_resolve, reject) => {
					release = () => reject(new Error("late"));
					signal?.addEventListener("abort", () => reject(new Error("aborted")));
				}),
		);
		const running = s.brief("run", s.bundle, preview.token);
		await vi.waitFor(() => expect(s.briefModel).toHaveBeenCalled());
		expect(await s.brief("status", s.bundle)).toMatchObject({ state: "making" });
		expect(await s.brief("cancel", s.bundle)).toEqual({ success: true });
		expect(await running).toEqual({ success: false, cancelled: true });
		release();
		expect(await s.brief("status", s.bundle)).toMatchObject({ state: "none" });
		await expect(readFile(path.join(s.bundle, "agent-brief.json"))).rejects.toThrow();
	});

	it("starts one run per reviewed token, even when run is fired twice", async () => {
		const s = await setup();
		const preview = await reviewedBrief(s);
		const [first, second] = await Promise.all([
			s.brief("run", s.bundle, preview.token),
			s.brief("run", s.bundle, preview.token),
		]);
		expect([first, second]).toContainEqual({ success: true });
		expect([first, second]).toContainEqual({ success: false });
		expect(s.briefModel).toHaveBeenCalledTimes(1);
	});

	it("reports a model changed after review as changed and tells the renderer the run settled", async () => {
		const s = await setup();
		const preview = await reviewedBrief(s);
		s.setModel("other/model");
		expect(await s.brief("run", s.bundle, preview.token)).toEqual({
			success: false,
			error: "changed",
		});
		expect(s.briefModel).not.toHaveBeenCalled();
		expect(s.event.sender.send).toHaveBeenCalledWith("showhow:agent-brief-settled", {
			bundleDir: await realpath(s.bundle),
		});
	});

	it("lets only the renderer that started a run cancel it", async () => {
		const s = await setup();
		const preview = await reviewedBrief(s);
		let answer!: (raw: string) => void;
		s.briefModel.mockImplementationOnce(() => new Promise((resolve) => (answer = resolve)));
		const running = s.brief("run", s.bundle, preview.token);
		await vi.waitFor(() => expect(answer).toBeTypeOf("function"));
		const other = { sender: { id: 2, send: vi.fn() } };
		expect(await s.handler("showhow:agent-brief-cancel")(other, s.bundle)).toEqual({
			success: false,
		});
		answer(
			JSON.stringify({
				title: "Settings brief",
				requestedChange: null,
				observed: { text: "Settings opened", sourceIds: ["1"] },
				expected: null,
				actual: null,
				evidence: [{ sourceId: "1", text: "Opened settings" }],
				unknowns: [],
			}),
		);
		expect(await running).toEqual({ success: true });
	});

	it("reports a failed save as save, not as a provider or prepare error", async () => {
		const s = await setup();
		const preview = await reviewedBrief(s);
		await chmod(s.bundle, 0o555);
		try {
			expect(await s.brief("run", s.bundle, preview.token)).toMatchObject({
				success: false,
				error: "save",
			});
		} finally {
			await chmod(s.bundle, 0o755);
		}
		expect(await s.brief("status", s.bundle)).toMatchObject({ state: "failed", error: "save" });
	});

	it("refuses an unreviewed token whose options differ from the stored brief consent", async () => {
		const s = await setup();
		await reviewedBrief(s);
		const wider = await s.brief("preview", s.bundle, { transcript: true, frames: true });
		expect(await s.brief("run", s.bundle, wider.token)).toMatchObject({ success: false });
		expect(s.briefModel).not.toHaveBeenCalled();
		const same = await s.brief("preview", s.bundle, { transcript: true, frames: false });
		expect(await s.brief("run", s.bundle, same.token)).toEqual({ success: true });
	});

	it("refuses an unreviewed token unless send without asking is stored", async () => {
		const s = await setup();
		const reviewed = await s.brief("preview", s.bundle, { transcript: true, frames: false });
		await s.brief("consent", s.bundle, reviewed.token, false);
		const next = await s.brief("preview", s.bundle, { transcript: true, frames: false });
		expect(await s.brief("run", s.bundle, next.token)).toMatchObject({ success: false });
		expect(s.briefModel).not.toHaveBeenCalled();
	});

	it("records a changed recording as a failure a remounted view can read", async () => {
		const s = await setup();
		const preview = await reviewedBrief(s);
		await writeFile(
			path.join(s.bundle, "steps.json"),
			serializeStepsJson([{ ...step, label: "Edited while reviewing" }]),
		);
		expect(await s.brief("run", s.bundle, preview.token)).toEqual({
			success: false,
			error: "changed",
		});
		expect(await s.brief("status", s.bundle)).toMatchObject({ state: "failed", error: "changed" });
	});

	it("records a model change after review as a failure a remounted view can read", async () => {
		const s = await setup();
		const preview = await reviewedBrief(s);
		s.setModel("other/model");
		await s.brief("run", s.bundle, preview.token);
		expect(await s.brief("status", s.bundle)).toMatchObject({ state: "failed", error: "changed" });
	});

	it("tells the renderer the run settled after success, cancel and a failed save", async () => {
		const settled = async (s: Awaited<ReturnType<typeof setup>>) => {
			const bundleDir = await realpath(s.bundle);
			return s.event.sender.send.mock.calls.filter(
				([channel, payload]) =>
					channel === "showhow:agent-brief-settled" &&
					(payload as { bundleDir: string }).bundleDir === bundleDir,
			).length;
		};
		const ok = await setup();
		await ok.brief("run", ok.bundle, (await reviewedBrief(ok)).token);
		expect(await settled(ok)).toBe(1);

		const cancelled = await setup();
		const token = (await reviewedBrief(cancelled)).token;
		cancelled.briefModel.mockImplementationOnce(
			(_messages, signal) =>
				new Promise((_resolve, reject) =>
					signal?.addEventListener("abort", () => reject(new Error("aborted"))),
				),
		);
		const running = cancelled.brief("run", cancelled.bundle, token);
		await vi.waitFor(() => expect(cancelled.briefModel).toHaveBeenCalled());
		expect(await settled(cancelled)).toBe(0);
		await cancelled.brief("cancel", cancelled.bundle);
		expect(await running).toEqual({ success: false, cancelled: true });
		expect(await settled(cancelled)).toBe(1);

		const save = await setup();
		const saveToken = (await reviewedBrief(save)).token;
		await chmod(save.bundle, 0o555);
		try {
			expect(await save.brief("run", save.bundle, saveToken)).toMatchObject({ error: "save" });
		} finally {
			await chmod(save.bundle, 0o755);
		}
		expect(await settled(save)).toBe(1);
	});

	it("marks a failed replacement as failed and keeps the previous brief", async () => {
		const s = await setup();
		await s.brief("run", s.bundle, (await reviewedBrief(s)).token);
		const saved = await readFile(path.join(s.bundle, "agent-brief.json"), "utf8");
		s.briefModel.mockResolvedValueOnce("{}");
		const preview = await s.brief("preview", s.bundle, { transcript: true, frames: false });
		expect(await s.brief("run", s.bundle, preview.token)).toEqual({
			success: false,
			error: "invalid",
		});
		expect(await s.brief("status", s.bundle)).toMatchObject({
			state: "failed",
			error: "invalid",
			brief: { title: "Settings brief" },
		});
		expect(await readFile(path.join(s.bundle, "agent-brief.json"), "utf8")).toBe(saved);
	});
});

describe("no-input bundle (#200)", () => {
	const noInputBundle = async (s: Awaited<ReturnType<typeof setup>>) => {
		await writeFile(path.join(s.bundle, "steps.json"), serializeStepsJson([]));
		await writeFile(path.join(s.bundle, "transcript.txt"), "(no speech detected)\n");
	};

	it("reports noInput on both the guide and the brief status", async () => {
		const s = await setup();
		await noInputBundle(s);
		expect(await s.call("status", s.bundle)).toMatchObject({ noInput: true });
		expect(await s.brief("status", s.bundle)).toMatchObject({ noInput: true });
	});

	it("does not report noInput when the transcript carries speech", async () => {
		const s = await setup();
		expect(await s.call("status", s.bundle)).toMatchObject({ noInput: false });
		expect(await s.brief("status", s.bundle)).toMatchObject({ noInput: false });
	});
});
