import { describe, expect, it } from "vitest";
import {
	type AgentBriefStatus,
	briefTransition,
	formatBriefTime,
	initialBriefState,
} from "./agentBrief";

const status = (patch: Partial<AgentBriefStatus> = {}): AgentBriefStatus => ({
	connected: true,
	model: "fake/model",
	reviewed: true,
	alwaysSend: true,
	options: { transcript: true, frames: true },
	state: "none",
	...patch,
});
const brief = {
	version: 1 as const,
	title: "Publish does nothing",
	observed: { text: "Status stays Draft", sourceIds: ["1"] },
	evidence: [],
	unknowns: [],
	provider: "openrouter" as const,
	model: "fake/model",
	sourceRevision: "abc",
	madeAt: 1,
};

describe("briefTransition", () => {
	it("reads older bundles without a brief as not made", () => {
		expect(briefTransition(initialBriefState, { type: "status", status: status() })).toMatchObject({
			view: "none",
			hasBrief: false,
		});
	});

	it("shows a saved brief as ready and a running one as making", () => {
		expect(
			briefTransition(initialBriefState, {
				type: "status",
				status: status({ state: "ready", brief }),
			}),
		).toMatchObject({ view: "ready", hasBrief: true });
		expect(
			briefTransition(initialBriefState, {
				type: "status",
				status: status({ state: "making", phase: "writing" }),
			}),
		).toMatchObject({ view: "making", phase: "writing" });
	});

	it("keeps copy-after through a run and clears it on failure or cancel", () => {
		const running = briefTransition(initialBriefState, { type: "run", copyAfter: true });
		expect(running).toMatchObject({ view: "making", phase: "reading", copyAfter: true });
		expect(briefTransition(running, { type: "result", result: { success: true } })).toMatchObject({
			view: "ready",
			hasBrief: true,
			copyAfter: true,
		});
		expect(briefTransition(running, { type: "result", result: { success: false } })).toMatchObject({
			view: "failed",
			copyAfter: false,
		});
		expect(
			briefTransition(running, { type: "result", result: { success: false, cancelled: true } }),
		).toMatchObject({ view: "none", copyAfter: false });
	});

	it("returns to the previous brief after a cancel or failed replacement", () => {
		const ready = briefTransition(initialBriefState, {
			type: "status",
			status: status({ state: "ready", brief }),
		});
		const running = briefTransition(ready, { type: "run", copyAfter: false });
		expect(
			briefTransition(running, { type: "result", result: { success: false, cancelled: true } }),
		).toMatchObject({ view: "ready", hasBrief: true });
		expect(briefTransition(running, { type: "result", result: { success: false } })).toMatchObject({
			view: "failed",
			hasBrief: true,
		});
	});

	it("ignores phases outside a run", () => {
		expect(briefTransition(initialBriefState, { type: "phase", phase: "writing" })).toBe(
			initialBriefState,
		);
	});

	it("formats evidence times", () => {
		expect(formatBriefTime(31_400)).toBe("0:31");
		expect(formatBriefTime(125_000)).toBe("2:05");
	});
});
