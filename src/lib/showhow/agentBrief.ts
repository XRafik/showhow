import type { GuideOptions } from "./aiGuide";

export const AGENT_BRIEF_VERSION = 1;
export type BriefPhase = "reading" | "writing" | "evidence";

/** A brief statement the model may make only when it cites recording evidence. */
export interface BriefClaim {
	text: string;
	sourceIds: string[];
}
export interface BriefEvidence {
	sourceId: string;
	/** Copied from the cited source step, never from model output. */
	ts: number;
	text: string;
}
export interface AgentBrief {
	version: typeof AGENT_BRIEF_VERSION;
	title: string;
	requestedChange?: BriefClaim;
	observed: BriefClaim;
	expected?: BriefClaim;
	actual?: BriefClaim;
	evidence: BriefEvidence[];
	unknowns: string[];
	provider: "openrouter";
	model: string;
	/** Hash of the bundle sources the brief was made from. */
	sourceRevision: string;
	madeAt: number;
}
export type BriefState = "none" | "making" | "ready" | "failed";
export interface AgentBriefStatus {
	connected: boolean;
	model: string;
	reviewed: boolean;
	alwaysSend: boolean;
	options: GuideOptions;
	state: BriefState;
	phase?: BriefPhase;
	/** True when the bundle has no steps and no transcript: there is nothing to make a brief from. */
	noInput?: boolean;
	brief?: AgentBrief;
	error?: string;
}
export interface AgentBriefPreview {
	token: string;
	provider: "openrouter";
	model: string;
	transcript: { startMs: number; text: string }[];
	wordCount: number;
	frames: { sourceId: string; ts: number; dataUrl: string }[];
	steps: { sourceId: string; ts: number; label: string }[];
	options: GuideOptions;
}
export type AgentBriefRunResult =
	| { success: true }
	| { success: false; cancelled?: boolean; error?: string };
export type AgentBriefCopyResult =
	| { success: true }
	| { success: false; reason: "absent" | "error" };

export type BriefView = "none" | "connect" | "review" | "making" | "ready" | "failed";
export interface BriefPanelState {
	view: BriefView;
	phase?: BriefPhase;
	/** Whether a validated brief is saved for the bundle. */
	hasBrief: boolean;
	/** Copy for agent started this run: copy only after generation succeeds. */
	copyAfter: boolean;
}
export type BriefPanelEvent =
	| { type: "status"; status: AgentBriefStatus }
	| { type: "connect"; copyAfter: boolean }
	| { type: "review"; copyAfter: boolean }
	| { type: "run"; copyAfter: boolean }
	| { type: "phase"; phase: BriefPhase }
	| { type: "result"; result: AgentBriefRunResult }
	| { type: "close" };

export const initialBriefState: BriefPanelState = {
	view: "none",
	hasBrief: false,
	copyAfter: false,
};

export function briefTransition(state: BriefPanelState, event: BriefPanelEvent): BriefPanelState {
	const settled = (hasBrief: boolean): BriefPanelState => ({
		view: hasBrief ? "ready" : "none",
		hasBrief,
		copyAfter: false,
	});
	switch (event.type) {
		case "status": {
			const hasBrief = Boolean(event.status.brief);
			if (event.status.state === "making")
				return { ...state, view: "making", phase: event.status.phase ?? "reading", hasBrief };
			if (event.status.state === "failed") return { view: "failed", hasBrief, copyAfter: false };
			return state.view === "connect" || state.view === "review"
				? { ...state, hasBrief }
				: settled(hasBrief);
		}
		case "connect":
			return { ...state, view: "connect", copyAfter: event.copyAfter };
		case "review":
			return { ...state, view: "review", copyAfter: event.copyAfter };
		case "run":
			return { ...state, view: "making", phase: "reading", copyAfter: event.copyAfter };
		case "phase":
			return state.view === "making" ? { ...state, phase: event.phase } : state;
		case "result":
			if (event.result.success)
				return { ...state, view: "ready", phase: undefined, hasBrief: true };
			if (event.result.cancelled) return settled(state.hasBrief);
			return { view: "failed", hasBrief: state.hasBrief, copyAfter: false };
		case "close":
			return settled(state.hasBrief);
	}
}

export function formatBriefTime(ms: number): string {
	const totalSec = Math.floor(ms / 1000);
	return `${Math.floor(totalSec / 60)}:${String(totalSec % 60).padStart(2, "0")}`;
}
