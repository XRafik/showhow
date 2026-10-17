export const DEFAULT_GUIDE_MODEL = "anthropic/claude-haiku-5.5";
export type GuidePhase = "transcript" | "sorting" | "writing";
export interface GuideState {
	status: "none" | "making" | "ready" | "failed";
	provider: "openrouter";
	model: string;
	madeAt?: number;
	editedSinceAi: boolean;
	error?: string;
}
export interface GuideOptions {
	transcript: boolean;
	frames: boolean;
}
export interface GuidePreview {
	token: string;
	provider: "openrouter";
	model: string;
	transcript: { startMs: number; text: string }[];
	wordCount: number;
	frames: { sourceId: string; ts: number; dataUrl: string }[];
	steps: { sourceId: string; ts: number; label: string }[];
	options: GuideOptions;
}
export interface GuideStatus {
	alwaysSend?: boolean;
	narrationOnly?: boolean;
	noSpeech?: boolean;
	connected: boolean;
	model: string;
	reviewed: boolean;
	options: GuideOptions;
	guide?: GuideState;
}

export type GuidePanelState = {
	view: "idle" | "connect" | "review" | "confirm" | "making" | "ready" | "failed";
	phase?: GuidePhase;
};
export type GuidePanelEvent =
	| { type: "begin"; status: GuideStatus; confirmed?: boolean }
	| { type: "review" }
	| { type: "run" }
	| { type: "phase"; phase: GuidePhase }
	| { type: "result"; success: boolean }
	| { type: "cancel" };
export function guidePanelTransition(
	state: GuidePanelState,
	event: GuidePanelEvent,
): GuidePanelState {
	switch (event.type) {
		case "begin":
			if (!event.status.connected) return { view: "connect" };
			if (event.status.guide?.editedSinceAi && !event.confirmed) return { view: "confirm" };
			return event.status.reviewed ? { view: "making", phase: "transcript" } : { view: "review" };
		case "review":
			return { view: "review" };
		case "run":
			return { view: "making", phase: "transcript" };
		case "phase":
			return state.view === "making" ? { ...state, phase: event.phase } : state;
		case "result":
			return { view: event.success ? "ready" : "failed" };
		case "cancel":
			return { view: "idle" };
	}
}
