import { describe, expect, it } from "vitest";
import { parseGuideResponse } from "./aiGuide";
import type { Step } from "./bundle";

const steps: Step[] = [1, 2, 3].map((n) => ({
	label: `Step ${n}`,
	ts: n * 1000,
	coords: { cx: n / 10, cy: 0.5 },
	tier: "desktop",
	redaction: n === 3,
	includeRevealedText: n === 2,
	screenshot: `step-0${n}.png`,
}));
describe("AI guide validation", () => {
	it("merges sources using the earliest source metadata and preserves flags", () => {
		const result = parseGuideResponse(
			JSON.stringify({
				title: "  Set up account  ",
				steps: [
					{ label: "  Open settings  ", sourceIds: ["3", "2"] },
					{ label: "Start", sourceIds: ["1"] },
				],
			}),
			steps,
		);
		expect(result.title).toBe("Set up account");
		expect(result.steps).toEqual([
			{ ...steps[0], label: "Start" },
			{ ...steps[1], label: "Open settings", redaction: true, includeRevealedText: true },
		]);
	});
});

it.each([
	{ title: "Guide", steps: [{ label: "Open", sourceIds: ["unknown"] }] },
	{ title: "Guide", steps: [] },
	{ title: "Guide", steps: [{ label: "Open", sourceIds: ["1", "1"] }] },
	{
		title: "Guide",
		steps: [
			{ label: "Open", sourceIds: ["1"] },
			{ label: "Again", sourceIds: ["1"] },
		],
	},
	{ title: "Guide", steps: [{ label: "Open", sourceIds: [] }] },
	{ title: "Guide", steps: [{ label: "  ", sourceIds: ["1"] }] },
	{ title: "  ", steps: [{ label: "Open", sourceIds: ["1"] }] },
])("rejects invalid guide %j", (raw) =>
	expect(() => parseGuideResponse(JSON.stringify(raw), steps)).toThrow());
it("limits title and label length", () => {
	const result = parseGuideResponse(
		JSON.stringify({
			title: "a".repeat(90),
			steps: [{ label: "b".repeat(130), sourceIds: ["1"] }],
		}),
		steps,
	);
	expect(result.title).toHaveLength(80);
	expect(result.steps[0].label).toHaveLength(120);
});

it("builds narration-only sources at real segment starts with local frame filenames", async () => {
	const { narrationSteps } = await import("./aiGuide");
	expect(
		narrationSteps([
			{ startMs: 4000, text: "Open settings" },
			{ startMs: 17000, text: "Save" },
		]),
	).toEqual([
		{
			label: "Open settings",
			ts: 4000,
			coords: { cx: 0, cy: 0 },
			tier: "desktop",
			redaction: false,
			screenshot: "narration-01.jpg",
			kind: "narration",
		},
		{
			label: "Save",
			ts: 17000,
			coords: { cx: 0, cy: 0 },
			tier: "desktop",
			redaction: false,
			screenshot: "narration-02.jpg",
			kind: "narration",
		},
	]);
});

it("review and request share only opted-in transcript, evenly capped frames and source labels", async () => {
	const { buildGuideRequest } = await import("./aiGuide");
	const frames = Array.from({ length: 41 }, (_, i) => ({
		sourceId: String(i + 1),
		ts: i * 1000,
		dataUrl: `data:image/jpeg;base64,${i}`,
	}));
	const result = buildGuideRequest({
		steps,
		segments: [{ startMs: 1000, text: "private narration" }],
		frames,
		options: { transcript: false, frames: true },
	});
	expect(result.transcript).toEqual([]);
	expect(result.frames).toHaveLength(20);
	expect(result.frames[0].sourceId).toBe("1");
	expect(result.frames[19].sourceId).toBe("41");
	expect(JSON.stringify(result.messages)).not.toContain("private narration");
	expect(result.steps).toEqual([
		{ sourceId: "1", ts: 1000, label: "Step 1" },
		{ sourceId: "2", ts: 2000, label: "Step 2" },
		{ sourceId: "3", ts: 3000, label: "[redacted]" },
	]);
	expect(JSON.stringify(result.messages)).toContain(
		JSON.stringify(result.steps).replaceAll('"', '\\"'),
	);
	const off = buildGuideRequest({
		steps,
		segments: [{ startMs: 1, text: "two words" }],
		frames,
		options: { transcript: true, frames: false },
	});
	expect(off.wordCount).toBe(2);
	expect(off.frames).toEqual([]);
});

it("keeps the previous guide while awaiting a model, then restores deterministic artifacts on failure without touching media", async () => {
	const { mkdtemp, writeFile, readFile, mkdir } = await import("node:fs/promises");
	const os = await import("node:os");
	const path = await import("node:path");
	const { runAiGuide } = await import("./aiGuide");
	const { serializeStepsJson, renderStepsMarkdown } = await import("./bundle");
	const dir = await mkdtemp(path.join(os.tmpdir(), "showhow-ai-"));
	await mkdir(path.join(dir, "screenshots"));
	const baseline = serializeStepsJson(steps);
	await writeFile(path.join(dir, "steps.deterministic.json"), baseline);
	await writeFile(path.join(dir, "steps.json"), "previous guide");
	await writeFile(path.join(dir, "steps.md"), "previous markdown");
	await writeFile(
		path.join(dir, "meta.json"),
		JSON.stringify({
			title: "Previous",
			video: "video.mp4",
			guide: { status: "ready", editedSinceAi: true },
		}),
	);
	await writeFile(path.join(dir, "video.mp4"), "video bytes");
	await writeFile(path.join(dir, "transcript.txt"), "[0:01] Narration\n");
	let called = false;
	const result = await runAiGuide(dir, {
		model: async () => {
			called = true;
			expect(await readFile(path.join(dir, "steps.json"), "utf8")).toBe("previous guide");
			throw new Error("provider failed secret must not persist");
		},
	});
	expect(called).toBe(true);
	expect(result.success).toBe(false);
	expect(await readFile(path.join(dir, "steps.json"), "utf8")).toBe(baseline);
	expect(await readFile(path.join(dir, "steps.md"), "utf8")).toBe(renderStepsMarkdown(steps));
	expect(await readFile(path.join(dir, "video.mp4"), "utf8")).toBe("video bytes");
	expect(await readFile(path.join(dir, "transcript.txt"), "utf8")).toBe("[0:01] Narration\n");
	expect(JSON.parse(await readFile(path.join(dir, "meta.json"), "utf8")).guide.status).toBe(
		"failed",
	);
});

it("marks AI title, label and deletion edits for Remake while preserving the deterministic backup", async () => {
	const fs = await import("node:fs/promises");
	const os = await import("node:os");
	const path = await import("node:path");
	const { runAiGuide } = await import("./aiGuide");
	const { serializeStepsJson, renderStepsMarkdown, updateWorkflowDocument } = await import(
		"./bundle"
	);
	const dir = await fs.mkdtemp(path.join(os.tmpdir(), "showhow-ai-edit-"));
	await fs.writeFile(path.join(dir, "steps.json"), serializeStepsJson(steps));
	await fs.writeFile(path.join(dir, "steps.md"), renderStepsMarkdown(steps));
	await fs.writeFile(
		path.join(dir, "meta.json"),
		JSON.stringify({ title: "Original", video: "video.mp4" }),
	);
	expect(
		(
			await runAiGuide(dir, {
				model: async () =>
					JSON.stringify({
						title: "AI title",
						steps: [
							{ label: "Click settings", sourceIds: ["1"] },
							{ label: "Save", sourceIds: ["2"] },
						],
					}),
			})
		).success,
	).toBe(true);
	let meta = JSON.parse(await fs.readFile(path.join(dir, "meta.json"), "utf8"));
	expect(meta.title).toBe("AI title");
	expect(meta.guide.editedSinceAi).toBe(false);
	for (const update of [
		{ type: "title", title: "Hand title" },
		{ type: "step", index: 0, label: "Hand instruction" },
		{ type: "delete-step", index: 1 },
	] as const) {
		await updateWorkflowDocument(dir, update);
		meta = JSON.parse(await fs.readFile(path.join(dir, "meta.json"), "utf8"));
		expect(meta.guide.editedSinceAi).toBe(true);
	}
	expect(await fs.readFile(path.join(dir, "steps.deterministic.json"), "utf8")).toBe(
		serializeStepsJson(steps),
	);
});

it("restores the deterministic pair after a partial filesystem promotion failure", async () => {
	const { promises: fs } = await import("node:fs");
	const { vi } = await import("vitest");
	const os = await import("node:os");
	const path = await import("node:path");
	const { runAiGuide } = await import("./aiGuide");
	const { serializeStepsJson, renderStepsMarkdown } = await import("./bundle");
	const dir = await fs.mkdtemp(path.join(os.tmpdir(), "showhow-ai-disk-"));
	const baseline = serializeStepsJson(steps);
	await fs.writeFile(path.join(dir, "steps.json"), baseline);
	await fs.writeFile(path.join(dir, "steps.md"), renderStepsMarkdown(steps));
	await fs.writeFile(
		path.join(dir, "meta.json"),
		JSON.stringify({ title: "Original", video: "video.mp4" }),
	);
	const rename = fs.rename.bind(fs);
	let failed = false;
	const spy = vi.spyOn(fs, "rename").mockImplementation(async (from, to) => {
		if (!failed && String(to).endsWith("steps.md")) {
			failed = true;
			throw new Error("simulated disk error");
		}
		await rename(from, to);
	});
	try {
		expect(
			await runAiGuide(dir, {
				model: async () =>
					JSON.stringify({ title: "AI", steps: [{ label: "Open", sourceIds: ["1"] }] }),
			}),
		).toEqual({ success: false });
	} finally {
		spy.mockRestore();
	}
	expect(failed).toBe(true);
	expect(await fs.readFile(path.join(dir, "steps.json"), "utf8")).toBe(baseline);
	expect(await fs.readFile(path.join(dir, "steps.md"), "utf8")).toBe(renderStepsMarkdown(steps));
	expect(JSON.parse(await fs.readFile(path.join(dir, "meta.json"), "utf8")).guide.status).toBe(
		"failed",
	);
});

it("does not mark a guide edited when saving unchanged title or instruction", async () => {
	const fs = await import("node:fs/promises");
	const os = await import("node:os");
	const path = await import("node:path");
	const { updateWorkflowDocument, serializeStepsJson, renderStepsMarkdown } = await import(
		"./bundle"
	);
	const dir = await fs.mkdtemp(path.join(os.tmpdir(), "showhow-ai-noop-"));
	await fs.writeFile(
		path.join(dir, "meta.json"),
		JSON.stringify({ title: "Same title", guide: { status: "ready", editedSinceAi: false } }),
	);
	await fs.writeFile(path.join(dir, "steps.json"), serializeStepsJson(steps));
	await fs.writeFile(path.join(dir, "steps.md"), renderStepsMarkdown(steps));
	await updateWorkflowDocument(dir, { type: "title", title: "Same title" });
	await updateWorkflowDocument(dir, { type: "step", index: 0, label: "Step 1" });
	expect(
		JSON.parse(await fs.readFile(path.join(dir, "meta.json"), "utf8")).guide.editedSinceAi,
	).toBe(false);
});
