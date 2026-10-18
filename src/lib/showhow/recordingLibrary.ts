/**
 * Shared types for a single local recording-library entry.
 * Used by both the main-process scanner and the renderer UI.
 */

/**
 * A single workflow step parsed from a bundle's `steps.json`.
 *
 * `screenshot` is the bare `step-NN.png` filename inside the bundle's
 * `screenshots/` directory. `screenshotUrl` is the safe `file://` URL the
 * renderer can load directly; it is only present when the screenshot file
 * exists on disk (missing frames are surfaced as absent, never as a URL that
 * 404s).
 */
export interface WorkflowStep {
	/** Instruction label (from transcript-matched step label). */
	label: string;
	/** Missing on legacy click steps. */
	kind?: "click" | "narration";
	/** Click time in milliseconds (source of truth for the timestamp chip). */
	ts: number;
	/** `step-NN.png` filename inside the bundle's `screenshots/` directory. */
	screenshot: string;
	/** Safe `file://` URL to the screenshot, when the file exists. */
	screenshotUrl?: string;
	/** Whether this step originated from capture-time sensitive text redaction. */
	redaction?: boolean;
	/** Explicit per-step permission to include revealed text in steps.md. */
	includeRevealedText?: boolean;
}

/**
 * Step-capture availability, mirrored from `ShowhowMeta.stepCapture`. Surfaced
 * so the renderer can distinguish a transcript-only doc (`unavailable`) from a
 * doc whose steps are ready to render (`available`).
 *
 * `reason` is a structured degradation cause, distinguishable across the
 * sources of unavailability. It is optional so legacy bundles (and any reader
 * that predates it) continue to deserialize exactly as before.
 */
export type StepCaptureReason =
	| "no-clicks"
	| "frame-extraction"
	| "accessibility-denied"
	| "companion-unpaired"
	| "companion-disconnected";

export interface StepCaptureStatus {
	status: "available" | "unavailable";
	message?: string;
	reason?: StepCaptureReason;
}

/**
 * A local recording-library entry.
 *
 * The core fields (`bundleDir`, `title`, `source`, `createdAt`, `durationMs`)
 * are always present and match the pre-issue-#23 contract. The workflow-document
 * fields (`video`, `videoUrl`, `steps`, `stepCapture`) are optional and only
 * attached when the corresponding artifacts exist on disk, so legacy/minimal
 * bundles continue to serialize exactly as before.
 */
export interface RecordingLibraryEntry {
	/** Validated optional existing guide status, absent on legacy bundles. */
	guideStatus?: "none" | "making" | "ready" | "failed";
	/** Absolute path to the bundle directory. */
	bundleDir: string;
	/** Human-readable title from meta.json. */
	title: string;
	/** Recording source: desktop capture, browser companion, or imported local video. */
	source: "desktop" | "browser" | "imported";
	/** Unix epoch ms when the recording started (from meta.json). */
	createdAt: number;
	/** Recording duration in milliseconds, if known. */
	durationMs?: number;
	/** Bundle video filename, mirroring `ShowhowMeta.video`. Only present when the video file exists. */
	video?: "video.mp4" | "video.webm";
	/** Safe `file://` URL to the bundle video, when the file exists. */
	videoUrl?: string;
	/** Steps parsed from the bundle's `steps.json`. Only present when steps.json exists. */
	steps?: WorkflowStep[];
	/** Step-capture availability from meta.json, when present. */
	stepCapture?: StepCaptureStatus;
}

export interface ImportRecordingRequest {
	requestId: string;
}

export interface ImportRecordingProgress {
	requestId: string;
	phase: "picking" | "copying" | "validating" | "saving";
	fileName?: string;
	bytesCopied: number;
	totalBytes: number;
}

export type ImportRecordingResult =
	| { status: "imported"; entry: RecordingLibraryEntry }
	| { status: "cancelled" }
	| { status: "failed"; error: string };
