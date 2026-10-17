import { describe, expect, it } from "vitest";
import { type GuidePanelState, type GuideStatus, guidePanelTransition } from "./aiGuide";

const idle: GuidePanelState = { view: "idle" };
const connected: GuideStatus = {
	connected: true,
	reviewed: true,
	model: "fake",
	options: { transcript: true, frames: true },
};
describe("guide state machine C1–C7", () => {
	it.each([
		"C1 narrated clicks",
		"C2 clicks no speech",
		"C3 narration no clicks",
	])("%s runs after prior provider review", () => {
		expect(guidePanelTransition(idle, { type: "begin", status: connected })).toEqual({
			view: "making",
			phase: "transcript",
		});
		expect(guidePanelTransition({ view: "making" }, { type: "result", success: true })).toEqual({
			view: "ready",
		});
	});
	it("C4 missing key opens connection even with saved consent", () =>
		expect(
			guidePanelTransition(idle, { type: "begin", status: { ...connected, connected: false } }),
		).toEqual({ view: "connect" }));
	it("first review can be cancelled without starting; accept starts real phases", () => {
		expect(
			guidePanelTransition(idle, { type: "begin", status: { ...connected, reviewed: false } }),
		).toEqual({ view: "review" });
		expect(guidePanelTransition({ view: "review" }, { type: "cancel" })).toEqual(idle);
		expect(guidePanelTransition({ view: "review" }, { type: "run" })).toEqual({
			view: "making",
			phase: "transcript",
		});
		expect(guidePanelTransition({ view: "making" }, { type: "phase", phase: "writing" })).toEqual({
			view: "making",
			phase: "writing",
		});
	});
	it("C5 failure and retry skip accepted review", () => {
		const failed = guidePanelTransition({ view: "making" }, { type: "result", success: false });
		expect(failed.view).toBe("failed");
		expect(guidePanelTransition(failed, { type: "begin", status: connected }).view).toBe("making");
	});
	it("C6 edited Remake requires confirmation and cancel leaves idle", () => {
		const status = {
			...connected,
			guide: {
				status: "ready" as const,
				provider: "openrouter" as const,
				model: "fake",
				editedSinceAi: true,
			},
		};
		expect(guidePanelTransition(idle, { type: "begin", status }).view).toBe("confirm");
		expect(guidePanelTransition({ view: "confirm" }, { type: "cancel" })).toEqual(idle);
		expect(
			guidePanelTransition({ view: "confirm" }, { type: "begin", status, confirmed: true }).view,
		).toBe("making");
	});
	it("C7 unedited Remake runs immediately", () =>
		expect(
			guidePanelTransition(idle, {
				type: "begin",
				status: {
					...connected,
					guide: { status: "ready", provider: "openrouter", model: "fake", editedSinceAi: false },
				},
			}).view,
		).toBe("making"));
});
