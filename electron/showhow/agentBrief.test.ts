import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
	AGENT_BRIEF_JSON,
	AGENT_BRIEF_MD,
	agentClipboardText,
	BriefValidationError,
	buildBriefRequest,
	parseBriefResponse,
	readAgentBrief,
	renderBriefMarkdown,
	runAgentBrief,
} from "./agentBrief";
import { renderStepsMarkdown, type Step, serializeStepsJson } from "./bundle";

const steps: Step[] = [
	{
		label: "Select the draft",
		ts: 12_000,
		coords: { cx: 0.2, cy: 0.3 },
		tier: "desktop",
		redaction: false,
		screenshot: "",
	},
	{
		label: "Click Publish",
		ts: 31_000,
		coords: { cx: 0.6, cy: 0.1 },
		tier: "desktop",
		redaction: false,
		screenshot: "",
	},
	{
		label: "secret token abc123",
		ts: 40_000,
		coords: { cx: 0.1, cy: 0.1 },
		tier: "desktop",
		redaction: true,
		screenshot: "",
	},
];
const response = {
	title: "Publish button does nothing",
	requestedChange: { text: "Make Publish complete the post", sourceIds: ["2"] },
	observed: { text: "Clicking Publish leaves the status at Draft", sourceIds: ["1", "2"] },
	expected: null,
	actual: { text: "Status stays Draft", sourceIds: ["2"] },
	evidence: [
		{ sourceId: "2", text: "Publish clicked; status unchanged" },
		{ sourceId: "1", text: "Draft selected" },
	],
	unknowns: ["Whether a network request was sent"],
};

async function bundle() {
	const dir = await mkdtemp(path.join(os.tmpdir(), "showhow-brief-"));
	await writeFile(
		path.join(dir, "meta.json"),
		JSON.stringify({ title: "Take", video: "video.mp4" }),
	);
	await writeFile(path.join(dir, "steps.json"), serializeStepsJson(steps));
	await writeFile(path.join(dir, "steps.md"), renderStepsMarkdown(steps));
	await writeFile(path.join(dir, "transcript.txt"), "[0:31] Publish does nothing here\n");
	return dir;
}
const sources = async (dir: string) => ({
	steps: await readFile(path.join(dir, "steps.json"), "utf8"),
	md: await readFile(path.join(dir, "steps.md"), "utf8"),
	meta: await readFile(path.join(dir, "meta.json"), "utf8"),
	transcript: await readFile(path.join(dir, "transcript.txt"), "utf8"),
});

describe("parseBriefResponse", () => {
	it("keeps only cited claims and takes evidence times from the source steps", () => {
		const brief = parseBriefResponse(JSON.stringify(response), steps);
		expect(brief.title).toBe("Publish button does nothing");
		expect(brief.expected).toBeUndefined();
		expect(brief.actual).toEqual({ text: "Status stays Draft", sourceIds: ["2"] });
		expect(brief.evidence).toEqual([
			{ sourceId: "1", ts: 12_000, text: "Draft selected" },
			{ sourceId: "2", ts: 31_000, text: "Publish clicked; status unchanged" },
		]);
		expect(brief.unknowns).toEqual(["Whether a network request was sent"]);
	});

	it.each([
		["not JSON", "nope"],
		["missing observed", JSON.stringify({ ...response, observed: null })],
		["uncited claim", JSON.stringify({ ...response, actual: { text: "x", sourceIds: [] } })],
		["unknown source", JSON.stringify({ ...response, evidence: [{ sourceId: "9", text: "x" }] })],
		[
			"invented time format",
			JSON.stringify({ ...response, evidence: [{ sourceId: "0", text: "x" }] }),
		],
		["no evidence", JSON.stringify({ ...response, evidence: [] })],
		["bad unknowns", JSON.stringify({ ...response, unknowns: [3] })],
	])("rejects %s", (_name, raw) => {
		expect(() => parseBriefResponse(raw, steps)).toThrow(BriefValidationError);
	});
});

describe("buildBriefRequest", () => {
	it("redacts hidden text, drops frames of redacted steps and honours the reviewed toggles", () => {
		const request = buildBriefRequest({
			steps,
			segments: [{ startMs: 31_000, text: "Publish does nothing here" }],
			frames: [
				{ sourceId: "2", ts: 31_000, dataUrl: "data:image/jpeg;base64,AA" },
				{ sourceId: "3", ts: 40_000, dataUrl: "data:image/jpeg;base64,BB" },
			],
			options: { transcript: false, frames: true },
		});
		const sent = JSON.stringify(request.messages);
		expect(sent).not.toContain("abc123");
		expect(sent).toContain("[redacted]");
		expect(sent).not.toContain("Publish does nothing here");
		expect(request.frames.map((frame) => frame.sourceId)).toEqual(["2"]);
		expect(sent).not.toContain("BB");
		expect(request.messages[0]?.content).toContain("Never diagnose a cause");
	});
});

describe("runAgentBrief", () => {
	it("writes a validated versioned JSON and Markdown pair without touching guide sources", async () => {
		const dir = await bundle();
		const before = await sources(dir);
		const phases: string[] = [];
		const result = await runAgentBrief(dir, {
			model: async () => JSON.stringify(response),
			modelSlug: "fake/model",
			onPhase: (phase) => phases.push(phase),
			now: () => 1234,
		});
		expect(result).toEqual({ success: true });
		expect(phases).toEqual(["reading", "writing", "evidence"]);
		const saved = await readAgentBrief(dir);
		expect(saved).toMatchObject({
			version: 1,
			provider: "openrouter",
			model: "fake/model",
			madeAt: 1234,
			title: "Publish button does nothing",
		});
		expect(saved?.sourceRevision).toMatch(/^[a-f0-9]{64}$/);
		const md = await readFile(path.join(dir, AGENT_BRIEF_MD), "utf8");
		expect(md).toBe(renderBriefMarkdown(saved!));
		expect(md).toContain("0:31");
		expect(md).toContain("## Unknowns");
		expect(md).not.toContain("Expected result");
		expect(await sources(dir)).toEqual(before);
	});

	it.each([
		["invalid model output", async () => "{}", { success: false, error: "invalid" }],
		[
			"provider error",
			async () => {
				throw new Error("offline");
			},
			{ success: false, error: "provider" },
		],
	])("keeps the previous brief after %s", async (_name, model, expected) => {
		const dir = await bundle();
		await runAgentBrief(dir, { model: async () => JSON.stringify(response), modelSlug: "m" });
		const json = await readFile(path.join(dir, AGENT_BRIEF_JSON), "utf8");
		const md = await readFile(path.join(dir, AGENT_BRIEF_MD), "utf8");
		const before = await sources(dir);
		expect(await runAgentBrief(dir, { model, modelSlug: "m" })).toMatchObject(expected);
		expect(await readFile(path.join(dir, AGENT_BRIEF_JSON), "utf8")).toBe(json);
		expect(await readFile(path.join(dir, AGENT_BRIEF_MD), "utf8")).toBe(md);
		expect(await sources(dir)).toEqual(before);
	});

	it("writes nothing when cancelled, even if the provider answers after the cancel", async () => {
		const dir = await bundle();
		const controller = new AbortController();
		const result = await runAgentBrief(dir, {
			model: async () => {
				controller.abort();
				return JSON.stringify(response);
			},
			modelSlug: "m",
			signal: controller.signal,
		});
		expect(result).toEqual({ success: false, cancelled: true });
		expect(await readAgentBrief(dir)).toBeUndefined();
	});

	it("rejects a reviewed payload when the recording changed", async () => {
		const dir = await bundle();
		const model = vi.fn(async () => JSON.stringify(response));
		const prepared = { signature: "stale" } as Parameters<typeof runAgentBrief>[1]["prepared"];
		expect(await runAgentBrief(dir, { model, modelSlug: "m", prepared })).toMatchObject({
			success: false,
			error: "changed",
		});
		expect(model).not.toHaveBeenCalled();
	});
});

describe("readAgentBrief", () => {
	it("reads older bundles and incomplete or invalid pairs as not made", async () => {
		const dir = await bundle();
		expect(await readAgentBrief(dir)).toBeUndefined();
		await writeFile(path.join(dir, AGENT_BRIEF_JSON), JSON.stringify({ version: 99 }));
		await writeFile(path.join(dir, AGENT_BRIEF_MD), "# x\n");
		expect(await readAgentBrief(dir)).toBeUndefined();
		const other = await bundle();
		await runAgentBrief(other, { model: async () => JSON.stringify(response), modelSlug: "m" });
		await mkdir(path.join(other, "x"));
		await writeFile(path.join(other, AGENT_BRIEF_MD), "");
		expect(await readAgentBrief(other)).toBeUndefined();
	});
});

describe("agentClipboardText", () => {
	it("joins the saved brief and the exact local bundle path", () => {
		const text = agentClipboardText("# Brief\n", "/Users/me/Showhow/Recordings/take 1");
		expect(text.startsWith("# Brief\n")).toBe(true);
		expect(text).toContain("`/Users/me/Showhow/Recordings/take 1`");
	});
});
