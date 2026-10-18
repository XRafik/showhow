import { execFile as execFileCallback } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import type { StepCaptureReason } from "../../src/lib/showhow/recordingLibrary";
import type { WorkflowDocumentUpdate } from "../../src/lib/showhow/workflowDocument";

const execFile = promisify(execFileCallback);

/** Root for all Showhow recording bundles. One folder per recording; the folder IS the recording. */
export const SHOWHOW_RECORDINGS_ROOT = path.join(os.homedir(), "Showhow", "Recordings");

export interface ShowhowMeta {
	guide?: import("../../src/lib/showhow/aiGuide").GuideState;
	schemaVersion: 1;
	title: string;
	/**
	 * Recordings use `"desktop"` or `"browser"`; imported local MP4s use `"imported"`.
	 */
	source: "desktop" | "browser" | "imported";
	createdAt: number;
	durationMs?: number;
	video: "video.webm" | "video.mp4";
	webcam?: "webcam.webm";
	/** Kept at the editor's `${videoPath}.cursor.json` convention -- see handlers.ts telemetry loading. */
	cursorTelemetry?: "video.webm.cursor.json" | "video.mp4.cursor.json";
	transcript: "transcript.txt";
	/** Filled by the Phase 2 doc engine. */
	steps: null;
	stepCapture?: {
		status: "available" | "unavailable";
		message?: string;
		reason?: StepCaptureReason;
	};
}

export interface BuildMetaInput {
	createdAt: number;
	durationMs?: number;
	hasWebcam: boolean;
	hasCursorTelemetry: boolean;
	videoFileName?: "video.webm" | "video.mp4";
	/** Recording source; defaults to "desktop". "browser" is forward-compatible. */
	source?: "desktop" | "browser" | "imported";
}

export interface CreateBundleInput {
	screenVideoPath: string;
	webcamVideoPath?: string;
	createdAt: number;
	durationMs?: number;
	/** Test seam; production callers omit it. */
	recordingsRoot?: string;
	/** Test seam; production callers omit it. */
	extractFrames?: FrameExtractor;
	/**
	 * Test seam; production callers omit it. When provided, the text is written
	 * to `transcript.txt` in the bundle before step generation so the doc engine
	 * can match transcript segments to clicks. In production, transcript.txt is
	 * written by the separate caption pipeline; if it is not present at bundle
	 * time, step labels fall back to `Step N`.
	 */
	transcriptContent?: string;
	/**
	 * Structured step-capture degradation reason supplied by the caller (e.g.
	 * `accessibility-denied` when the recorder degraded to system-cursor mode).
	 * When provided, it takes precedence over the derived no-clicks reason so
	 * the root cause is distinguishable from a genuine zero-click recording.
	 * Frame-extraction failures still surface their own reason regardless.
	 */
	stepCaptureReason?: StepCaptureReason;
	/** Recording source written to meta.json; defaults to "desktop". */
	source?: "desktop" | "browser";
}

export interface CreateBundleResult {
	bundleDir: string;
	screenVideoPath: string;
	webcamVideoPath?: string;
}

interface ClickSample {
	timeMs: number;
	cx: number;
	cy: number;
	interactionType?: string;
	/**
	 * Whether the click landed inside the recorded window. Legacy samples omit
	 * it; only an explicit `false` (an outside click, e.g. on the Stop control)
	 * is excluded from steps.
	 */
	visible?: boolean;
	/** Zero-based occurrence among valid click samples before visibility filtering. */
	sourceClickIndex?: number;
}

export interface StepFrame {
	timeMs: number;
	cx: number;
	cy: number;
	outputPath: string;
}

export interface FrameExtractorInput {
	videoPath: string;
	screenshotsDir: string;
	clicks: StepFrame[];
}

export type FrameExtractor = (input: FrameExtractorInput) => Promise<void>;

const pad = (n: number) => String(n).padStart(2, "0");

// --- Phase 2 doc engine: deterministic steps.json / steps.md -----------------

/** A parsed transcript segment. `startMs` is the segment start in milliseconds. */
export interface TranscriptSegment {
	startMs: number;
	text: string;
}

/** A single click fed to the step builder. */
export interface ClickInput {
	timeMs: number;
	cx: number;
	cy: number;
	/** The `step-NN.png` filename already assigned to this click's frame. */
	outputPath: string;
}

/** The source-of-truth Step record written to steps.json. */
export interface Step {
	kind?: "click" | "narration";
	label: string;
	/** Click time in milliseconds (integer, source of truth). */
	ts: number;
	coords: { cx: number; cy: number };
	tier: "desktop" | "browser";
	redaction: boolean;
	/** User opt-in: only then may a redacted step's label appear in steps.md. */
	includeRevealedText?: boolean;
	/** The `step-NN.png` filename inside `screenshots/`, or "" when no screenshot exists. */
	screenshot: string;
}

const TRANSCRIPT_LINE = /^\[(\d+):(\d{2})\]\s+(.*)$/u;
const TRANSCRIPT_MARKERS = new Set(["(no speech detected)", "(transcription failed)"]);

/**
 * Parse transcript.txt content into `{ startMs, text }` segments, preserving
 * file order. Lines that are blank, marker lines (`(no speech detected)` /
 * `(transcription failed)`), or lack the `[m:ss]` prefix are ignored.
 * Deterministic: no locale, no Date, no random.
 */
export function parseTranscript(content: string): TranscriptSegment[] {
	const segments: TranscriptSegment[] = [];
	for (const rawLine of content.split("\n")) {
		const line = rawLine.trim();
		if (line === "") continue;
		if (TRANSCRIPT_MARKERS.has(line)) continue;
		const match = TRANSCRIPT_LINE.exec(line);
		if (!match) continue;
		const minutes = Number(match[1]);
		const seconds = Number(match[2]);
		const text = match[3].trim();
		segments.push({ startMs: minutes * 60_000 + seconds * 1_000, text });
	}
	return segments;
}

/**
 * Format a click time in milliseconds as the same `[m:ss]` chip transcript.txt
 * uses. Parity with `src/lib/showhow/transcriptFormat.ts#formatTimestamp` is
 * asserted by a dedicated test across a range of inputs.
 */
export function formatStepTimestamp(ms: number): string {
	const total = Math.max(0, Math.floor(ms / 1000));
	const m = Math.floor(total / 60);
	const s = total % 60;
	return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Build the Steps array from clicks and transcript segments. For each click (in
 * order, 1-based), the label is the text of the transcript segment with the
 * greatest `startMs <= click.timeMs`. If the click precedes all segments (or
 * there are no segments), the label falls back to `Step N`. Pure and
 * deterministic: no Date, no random, no filesystem iteration order.
 */
export function buildSteps(clicks: ClickInput[], segments: TranscriptSegment[]): Step[] {
	return clicks.map((click, index) => {
		let labelIndex: number | undefined;
		let labelStartMs = -Infinity;
		for (const [segmentIndex, seg] of segments.entries()) {
			if (seg.startMs <= click.timeMs && seg.startMs >= labelStartMs) {
				labelStartMs = seg.startMs;
				labelIndex = segmentIndex;
			}
		}
		const label = labelIndex === undefined ? undefined : phraseLabelAt(segments, labelIndex);
		return {
			label: label && label.trim() !== "" ? label.trim() : `Step ${index + 1}`,
			ts: click.timeMs,
			coords: { cx: click.cx, cy: click.cy },
			tier: "desktop",
			redaction: false,
			screenshot: click.outputPath,
		};
	});
}

function phraseLabelAt(segments: TranscriptSegment[], index: number): string {
	const isWord = (segment: TranscriptSegment) => !/\s/u.test(segment.text.trim());
	if (!isWord(segments[index]!)) return segments[index]!.text.trim();

	let start = index;
	while (
		start > 0 &&
		isWord(segments[start - 1]!) &&
		!/[.!?]$/u.test(segments[start - 1]!.text.trim())
	) {
		start -= 1;
	}
	let end = index;
	while (
		end < segments.length - 1 &&
		isWord(segments[end + 1]!) &&
		!/[.!?]$/u.test(segments[end]!.text.trim())
	) {
		end += 1;
	}
	if (!/[.!?]$/u.test(segments[end]!.text.trim())) return segments[index]!.text.trim();
	return segments
		.slice(start, end + 1)
		.map((segment) => segment.text.trim())
		.join(" ");
}

const TRANSCRIPT_ONLY_NOTE =
	"# Workflow doc\n\nNo desktop clicks were captured; this is a transcript-only doc. See transcript.txt.\n";

/**
 * Render the human/agent-readable steps.md from the Steps array. Each step is
 * `N. [m:ss] label` followed by a screenshot reference. The `[m:ss]` chip is
 * derived from `ts` via `formatStepTimestamp` -- never recomputed from a second
 * source. With zero steps, returns a deterministic transcript-only note.
 */
export function renderStepsMarkdown(steps: Step[]): string {
	if (steps.length === 0) return TRANSCRIPT_ONLY_NOTE;
	const lines: string[] = ["# Workflow doc", ""];
	for (const [i, step] of steps.entries()) {
		const label = step.redaction && step.includeRevealedText !== true ? "[redacted]" : step.label;
		lines.push(`${i + 1}. [${formatStepTimestamp(step.ts)}] ${label}`);
		if (step.screenshot !== "") {
			lines.push(`   ![${step.screenshot}](screenshots/${step.screenshot})`);
		}
	}
	return `${lines.join("\n")}\n`;
}

export type { WorkflowDocumentUpdate } from "../../src/lib/showhow/workflowDocument";

/**
 * Apply a single user edit to the bundle source of truth and regenerate its
 * Markdown. Redacted labels remain excluded unless that individual step has
 * explicitly opted in. All document artifacts are staged before promotion.
 */
export async function updateWorkflowDocument(
	bundleDir: string,
	update: WorkflowDocumentUpdate,
): Promise<void> {
	await serializePerBundle(bundleDir, async () => {
		const metaPath = path.join(bundleDir, "meta.json");
		if (update.type === "title") {
			if (update.title.trim() === "") throw new Error("workflow document title cannot be empty");
			const meta = parseEditableMeta(await fs.readFile(metaPath, "utf-8"));
			if (meta.title !== update.title.trim()) markGuideEdited(meta);
			meta.title = update.title.trim();
			const metaTmp = path.join(bundleDir, "meta.json.tmp");
			try {
				await fs.writeFile(metaTmp, `${JSON.stringify(meta, null, 2)}\n`, "utf-8");
				await fs.rename(metaTmp, metaPath);
			} catch (error) {
				await fs.rm(metaTmp, { force: true });
				throw error;
			}
			return;
		}

		const stepsPath = path.join(bundleDir, "steps.json");
		const markdownPath = path.join(bundleDir, "steps.md");
		const [rawMeta, rawSteps] = await Promise.all([
			fs.readFile(metaPath, "utf-8"),
			fs.readFile(stepsPath, "utf-8"),
		]);
		const meta = parseEditableMeta(rawMeta);
		const steps = parseEditableSteps(rawSteps);
		const priorSteps = serializeStepsJson(steps);

		if (!Number.isInteger(update.index) || update.index < 0 || update.index >= steps.length) {
			throw new Error("workflow document step index is out of range");
		}
		if (update.type === "delete-step") {
			steps.splice(update.index, 1);
		} else {
			const step = steps[update.index]!;
			if (update.label !== undefined) {
				if (update.label.trim() === "")
					throw new Error("workflow document instruction cannot be empty");
				step.label = update.label.trim();
			}
			if (update.includeRevealedText !== undefined) {
				step.includeRevealedText = update.includeRevealedText;
			} else if (step.redaction && step.includeRevealedText === undefined) {
				step.includeRevealedText = false;
			}
		}

		if (serializeStepsJson(steps) !== priorSteps) markGuideEdited(meta);

		const metaTmp = path.join(bundleDir, "meta.json.tmp");
		const stepsTmp = path.join(bundleDir, "steps.json.tmp");
		const markdownTmp = path.join(bundleDir, "steps.md.tmp");
		try {
			await Promise.all([
				fs.writeFile(metaTmp, `${JSON.stringify(meta, null, 2)}\n`, "utf-8"),
				fs.writeFile(stepsTmp, serializeStepsJson(steps), "utf-8"),
				fs.writeFile(markdownTmp, renderStepsMarkdown(steps), "utf-8"),
			]);
		} catch (error) {
			await Promise.all([
				fs.rm(metaTmp, { force: true }),
				fs.rm(stepsTmp, { force: true }),
				fs.rm(markdownTmp, { force: true }),
			]);
			throw error;
		}
		await promoteWorkflowEdit(metaPath, metaTmp, stepsPath, stepsTmp, markdownPath, markdownTmp);
	});
}

function markGuideEdited(meta: Record<string, unknown>) {
	const guide = meta.guide;
	if (typeof guide === "object" && guide !== null && "status" in guide && guide.status === "ready")
		meta.guide = { ...guide, editedSinceAi: true };
}

function parseEditableMeta(raw: string): Record<string, unknown> & { title: string } {
	const parsed: unknown = JSON.parse(raw);
	if (
		typeof parsed !== "object" ||
		parsed === null ||
		!("title" in parsed) ||
		typeof parsed.title !== "string"
	) {
		throw new Error("workflow document meta.json is invalid");
	}
	return parsed as Record<string, unknown> & { title: string };
}

function parseEditableSteps(raw: string): Step[] {
	const parsed: unknown = JSON.parse(raw);
	if (!Array.isArray(parsed) || !parsed.every(isEditableStep)) {
		throw new Error("workflow document steps.json is invalid");
	}
	return parsed;
}

function isEditableStep(value: unknown): value is Step {
	return (
		typeof value === "object" &&
		value !== null &&
		typeof (value as Step).label === "string" &&
		typeof (value as Step).ts === "number" &&
		typeof (value as Step).redaction === "boolean" &&
		typeof (value as Step).screenshot === "string" &&
		((value as Step).includeRevealedText === undefined ||
			typeof (value as Step).includeRevealedText === "boolean")
	);
}

/**
 * Serialize the Steps array as the source-of-truth steps.json: a stable
 * `JSON.stringify(steps, null, 2)` followed by a single trailing newline.
 * Deterministic across runs from identical inputs.
 */
export function serializeStepsJson(steps: Step[]): string {
	return `${JSON.stringify(steps, null, 2)}\n`;
}

export function bundleDirName(createdAt: number): string {
	const d = new Date(createdAt);
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}-recording`;
}

export function buildMeta(input: BuildMetaInput): ShowhowMeta {
	const d = new Date(input.createdAt);
	const title = `Recording ${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
	const videoFileName = input.videoFileName ?? "video.webm";
	return {
		schemaVersion: 1,
		title,
		source: input.source ?? "desktop",
		createdAt: input.createdAt,
		...(input.durationMs !== undefined ? { durationMs: input.durationMs } : {}),
		video: videoFileName,
		...(input.hasWebcam ? { webcam: "webcam.webm" as const } : {}),
		...(input.hasCursorTelemetry
			? { cursorTelemetry: `${videoFileName}.cursor.json` as ShowhowMeta["cursorTelemetry"] }
			: {}),
		transcript: "transcript.txt",
		steps: null,
	};
}

function clickSamplesFromTelemetry(raw: string): ClickSample[] {
	try {
		const telemetry = JSON.parse(raw) as { samples?: unknown };
		if (!Array.isArray(telemetry.samples)) return [];
		return telemetry.samples.filter(
			(sample): sample is ClickSample =>
				typeof sample === "object" &&
				sample !== null &&
				(sample as ClickSample).interactionType === "click" &&
				(sample as ClickSample).visible !== false &&
				typeof (sample as ClickSample).timeMs === "number" &&
				typeof (sample as ClickSample).cx === "number" &&
				typeof (sample as ClickSample).cy === "number",
		);
	} catch {
		return [];
	}
}

function markerFilter(cx: number, cy: number): string {
	const x = Math.min(1, Math.max(0, cx)).toFixed(6);
	const y = Math.min(1, Math.max(0, cy)).toFixed(6);
	return `drawbox=x=iw*${x}-16:y=ih*${y}-16:w=32:h=32:color=red@0.9:t=fill,drawbox=x=iw*${x}-20:y=ih*${y}-20:w=40:h=40:color=white@0.9:t=4`;
}

export const extractDesktopStepFrames: FrameExtractor = async ({
	videoPath,
	screenshotsDir,
	clicks,
}) => {
	for (const click of clicks) {
		await execFile("ffmpeg", [
			"-y",
			"-ss",
			String(click.timeMs / 1000),
			"-i",
			videoPath,
			"-frames:v",
			"1",
			"-vf",
			markerFilter(click.cx, click.cy),
			path.join(screenshotsDir, click.outputPath),
		]);
	}
};

/** Move with cross-device fallback: userData and $HOME are usually one volume, but never assume. */
async function moveFile(src: string, dest: string): Promise<void> {
	try {
		await fs.rename(src, dest);
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== "EXDEV") throw error;
		await fs.copyFile(src, dest);
		await fs.rm(src, { force: true });
	}
}

async function fileExists(p: string): Promise<boolean> {
	try {
		await fs.stat(p);
		return true;
	} catch {
		return false;
	}
}

export async function createRecordingBundle(input: CreateBundleInput): Promise<CreateBundleResult> {
	const root = input.recordingsRoot ?? SHOWHOW_RECORDINGS_ROOT;
	const bundleDir = path.join(root, bundleDirName(input.createdAt));
	await fs.mkdir(path.join(bundleDir, "screenshots"), { recursive: true });

	const videoFileName =
		path.extname(input.screenVideoPath).toLowerCase() === ".mp4" ? "video.mp4" : "video.webm";
	const screenDest = path.join(bundleDir, videoFileName);
	await moveFile(input.screenVideoPath, screenDest);

	const cursorSrc = `${input.screenVideoPath}.cursor.json`;
	const hasCursorTelemetry = await fileExists(cursorSrc);
	if (hasCursorTelemetry) {
		await moveFile(cursorSrc, `${screenDest}.cursor.json`);
	}

	const screenshotsDir = path.join(bundleDir, "screenshots");
	const clicks = hasCursorTelemetry
		? clickSamplesFromTelemetry(await fs.readFile(`${screenDest}.cursor.json`, "utf-8"))
		: [];
	const stepFrames = clicks.map((click, index) => ({
		timeMs: click.timeMs,
		cx: click.cx,
		cy: click.cy,
		outputPath: `step-${String(index + 1).padStart(2, "0")}.png`,
	}));
	let stepCapture: ShowhowMeta["stepCapture"];
	if (stepFrames.length === 0) {
		// A caller-supplied degradation reason (e.g. accessibility-denied) is the
		// root cause of there being no click coordinates; it takes precedence over
		// the generic no-clicks reason so the cause stays distinguishable.
		stepCapture = {
			status: "unavailable",
			reason: input.stepCaptureReason ?? "no-clicks",
			message:
				input.stepCaptureReason === "accessibility-denied"
					? "macOS accessibility was denied; recorded in system-cursor mode, so semantic steps are unavailable."
					: "No desktop clicks were captured; this bundle has a transcript-only doc.",
		};
	} else {
		try {
			await (input.extractFrames ?? extractDesktopStepFrames)({
				videoPath: screenDest,
				screenshotsDir,
				clicks: stepFrames,
			});
			stepCapture = { status: "available" };
		} catch (error) {
			console.warn("[showhow] desktop click frame extraction unavailable:", error);
			// Frame-extraction failure must not be mislabeled as no-clicks: clicks
			// WERE captured, but their frames could not be extracted.
			stepCapture = {
				status: "unavailable",
				reason: "frame-extraction",
				message:
					"Desktop click frames could not be extracted; this bundle has a transcript-only doc.",
			};
		}
	}

	let webcamDest: string | undefined;
	if (input.webcamVideoPath && (await fileExists(input.webcamVideoPath))) {
		webcamDest = path.join(bundleDir, "webcam.webm");
		await moveFile(input.webcamVideoPath, webcamDest);
	}

	const meta = buildMeta({
		createdAt: input.createdAt,
		durationMs: input.durationMs,
		hasWebcam: webcamDest !== undefined,
		hasCursorTelemetry,
		videoFileName,
		...(input.source !== undefined ? { source: input.source } : {}),
	});
	if (stepCapture) {
		meta.stepCapture = stepCapture;
	}
	await fs.writeFile(path.join(bundleDir, "meta.json"), JSON.stringify(meta, null, 2), "utf-8");

	// Phase 2 doc engine: generate deterministic steps.json + steps.md from the
	// immutable inputs (clicks + transcript). Transcript.txt may not be present
	// yet (the caption pipeline writes it later); in that case labels fall back
	// to `Step N`. Generation never throws -- a doc-layer failure must never
	// discard a valid recording.
	try {
		if (input.transcriptContent !== undefined) {
			await fs.writeFile(path.join(bundleDir, "transcript.txt"), input.transcriptContent, "utf-8");
		}
		await writeDocArtifacts(bundleDir, stepFrames);
	} catch (error) {
		console.warn("[showhow] step artifact generation failed; bundle remains complete:", error);
	}

	return {
		bundleDir,
		screenVideoPath: screenDest,
		...(webcamDest ? { webcamVideoPath: webcamDest } : {}),
	};
}

export interface RegenerateDocArtifactsResult {
	bundleDir: string;
	success: boolean;
	stepsWritten: number;
	transcriptAvailable: boolean;
}

/**
 * Test seam for the paired doc-artifact writer. Production omits it (uses real
 * `fs`); tests inject a `writeFile` that can simulate a failure on either
 * artifact to prove rollback safety.
 */
export interface WriteDocArtifactsSeam {
	writeFile: (filePath: string, content: string) => Promise<void>;
}

/**
 * Read the stored cursor telemetry from an existing bundle and reconstruct the
 * click ordering + `step-NN.png` screenshot filenames, then deterministically
 * regenerate `steps.json` and `steps.md` from the bundle's current
 * `transcript.txt`. Screenshot references reuse the filename the click's PRIOR
 * step already referenced (matched by the immutable ts + coords association);
 * clicks with no matching prior step get deterministic source-derived
 * `step-NN.png` filenames. Refs are never blanked based on filesystem
 * existence, because determinism derives from immutable inputs.
 *
 * This is the re-runnable doc engine: production calls it after the caption
 * pipeline writes `transcript.txt` (which happens AFTER `createRecordingBundle`
 * ran with no transcript and produced `Step N` fallback labels). It never
 * mutates the source inputs (video, transcript.txt, *.cursor.json) and never
 * discards the video -- it only writes the two steps artifacts.
 *
 * Paired writes are rollback-safe: both artifact strings are generated first,
 * then staged to temp files; only if BOTH stage successfully are they promoted
 * (renamed) into place. If either stage or promote fails, the prior pair is left
 * unchanged. Never throws; returns `{ success: false, ... }` on failure.
 *
 * Gracefully degrades: missing transcript -> `Step N` labels; missing/unparseable
 * telemetry -> empty steps.
 */
export async function regenerateDocArtifacts(
	bundleDir: string,
	seam?: WriteDocArtifactsSeam,
): Promise<RegenerateDocArtifactsResult> {
	const result: RegenerateDocArtifactsResult = {
		bundleDir,
		success: false,
		stepsWritten: 0,
		transcriptAvailable: false,
	};
	try {
		const existingBrowserSteps = await readBrowserSteps(bundleDir);
		if (existingBrowserSteps !== null) {
			result.success = true;
			result.stepsWritten = existingBrowserSteps.length;
			result.transcriptAvailable = await fileExists(path.join(bundleDir, "transcript.txt"));
			return result;
		}
		// Reconstruct stepFrames from the stored cursor telemetry, reusing the
		// stored click ordering and associating each retained click with its
		// prior step's screenshot filename (deterministic numbering as fallback).
		const stepFrames = await stepFramesFromBundle(bundleDir);
		const { stepsWritten, transcriptAvailable } = await writeDocArtifacts(
			bundleDir,
			stepFrames,
			seam,
		);
		result.success = true;
		result.stepsWritten = stepsWritten;
		result.transcriptAvailable = transcriptAvailable;
	} catch (error) {
		console.warn("[showhow] regenerateDocArtifacts failed; bundle left intact:", error);
	}
	return result;
}

/** Browser steps are source-of-truth semantic capture and must never be replaced by desktop telemetry. */
async function readBrowserSteps(bundleDir: string): Promise<Step[] | null> {
	try {
		const parsed: unknown = JSON.parse(
			await fs.readFile(path.join(bundleDir, "steps.json"), "utf-8"),
		);
		if (!Array.isArray(parsed) || !parsed.some((step) => isBrowserStep(step))) return null;
		return parsed as Step[];
	} catch {
		return null;
	}
}

function isBrowserStep(value: unknown): value is Step {
	return (
		typeof value === "object" && value !== null && (value as { tier?: unknown }).tier === "browser"
	);
}

async function stepFramesFromBundle(bundleDir: string): Promise<StepFrame[]> {
	// meta.json is a required source: missing, unreadable, unparseable, or
	// structurally invalid are all source-read failures, not zero-click.
	const metaPath = path.join(bundleDir, "meta.json");
	if (!(await fileExists(metaPath))) {
		throw new Error("regenerateDocArtifacts: meta.json is missing");
	}
	let meta: ShowhowMeta;
	try {
		meta = JSON.parse(await fs.readFile(metaPath, "utf-8")) as ShowhowMeta;
	} catch (error) {
		throw new Error(`regenerateDocArtifacts: meta.json is unreadable: ${String(error)}`);
	}
	// Structurally validate: the `video` field is required to resolve the
	// telemetry path. An empty object `{}` or any record lacking it is invalid.
	if (
		meta === null ||
		typeof meta !== "object" ||
		typeof (meta as { video?: unknown }).video !== "string" ||
		(meta as { video?: unknown }).video === ""
	) {
		throw new Error("regenerateDocArtifacts: meta.json is structurally invalid (missing video)");
	}
	const videoFileName = meta.video;
	const telemetryPath = path.join(bundleDir, `${videoFileName}.cursor.json`);
	const telemetryExists = await fileExists(telemetryPath);
	// If meta explicitly declares cursorTelemetry, the telemetry file is a
	// required source: its absence is a source-read failure, not zero-click.
	const declaresTelemetry = meta.cursorTelemetry !== undefined;
	if (declaresTelemetry && !telemetryExists) {
		throw new Error(
			"regenerateDocArtifacts: meta.json declares cursorTelemetry but the telemetry file is missing",
		);
	}
	if (!telemetryExists) {
		// Valid meta without cursorTelemetry and no telemetry file -> true
		// zero-click bundle (no cursor tracking was recorded).
		return [];
	}
	let raw: string;
	try {
		raw = await fs.readFile(telemetryPath, "utf-8");
	} catch (error) {
		// Required source-read failure: telemetry file exists but is unreadable.
		throw new Error(`regenerateDocArtifacts: cursor telemetry is unreadable: ${String(error)}`);
	}
	const clicks = clickSamplesFromTelemetryStrict(raw);
	// Attempt-2 (#66): renumbering retained clicks after filtering would point a
	// retained step at a DIFFERENT click's extracted image (regeneration never
	// re-extracts frames). Reuse the prior step's screenshot filename, matched
	// by ts + coords -- the immutable per-click identity carried verbatim in
	// both telemetry samples and Step records. Unmatched clicks fall back to
	// deterministic step-NN.png numbering, skipping claimed filenames.
	const priorSteps = await readPriorDesktopSteps(bundleDir);
	// Existing extracted screenshot files. A fallback (unproven) filename that
	// already exists on disk may hold ANOTHER click's extracted frame, so it
	// must not be handed out (review cycle-2, draft PR #78 P2): fail safely
	// instead. An absent screenshots directory has nothing to collide with.
	// A directory that exists but cannot be read is a required-source failure.
	let existingScreenshots: Set<string>;
	try {
		existingScreenshots = new Set(await fs.readdir(path.join(bundleDir, "screenshots")));
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
			throw new Error(
				`regenerateDocArtifacts: screenshots directory is unreadable: ${String(error)}`,
			);
		}
		existingScreenshots = new Set();
	}
	const claimed = new Set<string>();
	const consumed = new Set<number>();
	const outputPathFor = (click: ClickSample): string => {
		if (priorSteps !== null) {
			const occurrenceIndex = click.sourceClickIndex;
			const occurrenceStep =
				occurrenceIndex === undefined ? undefined : priorSteps[occurrenceIndex];
			if (
				occurrenceIndex !== undefined &&
				occurrenceStep !== undefined &&
				occurrenceStep.ts === click.timeMs &&
				occurrenceStep.coords.cx === click.cx &&
				occurrenceStep.coords.cy === click.cy
			) {
				consumed.add(occurrenceIndex);
				claimed.add(occurrenceStep.screenshot);
				return occurrenceStep.screenshot;
			}
			for (const [index, step] of priorSteps.entries()) {
				if (consumed.has(index)) continue;
				if (
					step.ts === click.timeMs &&
					step.coords.cx === click.cx &&
					step.coords.cy === click.cy
				) {
					consumed.add(index);
					claimed.add(step.screenshot);
					return step.screenshot;
				}
			}
		}
		let n = 1;
		while (claimed.has(`step-${String(n).padStart(2, "0")}.png`)) n += 1;
		const filename = `step-${String(n).padStart(2, "0")}.png`;
		if (existingScreenshots.has(filename)) {
			// The screenshot association for this retained click cannot be
			// proven (prior mapping absent/unreadable/removed by step deletion),
			// and the deterministic filename is already an extracted image --
			// possibly another click's frame. Refuse to rewrite doc artifacts.
			throw new Error(
				`regenerateDocArtifacts: screenshot association for a retained click cannot be proven and ${filename} already exists; refusing to rewrite doc artifacts`,
			);
		}
		claimed.add(filename);
		return filename;
	};
	return clicks.map((click) => ({
		timeMs: click.timeMs,
		cx: click.cx,
		cy: click.cy,
		outputPath: outputPathFor(click),
	}));
}

/**
 * Leniently read a prior desktop-tier `steps.json` for screenshot-filename
 * association during regeneration. Returns null when the file is absent,
 * unparseable, or not an array of step-shaped records with numeric coords --
 * callers then fall back to deterministic numbering. Browser-tier bundles
 * never reach this path (`regenerateDocArtifacts` preserves them before
 * reconstructing frames).
 */
async function readPriorDesktopSteps(bundleDir: string): Promise<Step[] | null> {
	try {
		const parsed: unknown = JSON.parse(
			await fs.readFile(path.join(bundleDir, "steps.json"), "utf-8"),
		);
		if (!Array.isArray(parsed)) return null;
		if (
			!parsed.every(
				(value) =>
					isEditableStep(value) &&
					typeof (value as Step).coords.cx === "number" &&
					typeof (value as Step).coords.cy === "number",
			)
		) {
			return null;
		}
		return parsed as Step[];
	} catch {
		return null;
	}
}

/**
 * Strict variant of `clickSamplesFromTelemetry` used by the regeneration path.
 * Unlike the lenient variant (which returns `[]` on any parse failure, suitable
 * for the initial bundle pass where telemetry was just written), this THROWS on
 * unparseable JSON so the caller can distinguish a corrupt-telemetry source-read
 * failure from a valid zero-click bundle. A valid `samples: []` still returns
 * `[]` (true zero-click).
 */
function clickSamplesFromTelemetryStrict(raw: string): ClickSample[] {
	let telemetry: { samples?: unknown };
	try {
		telemetry = JSON.parse(raw) as { samples?: unknown };
	} catch (error) {
		throw new Error(`regenerateDocArtifacts: cursor telemetry is not valid JSON: ${String(error)}`);
	}
	if (!Array.isArray(telemetry.samples)) {
		// `samples` missing or wrong type is a structural failure, not zero clicks.
		throw new Error("regenerateDocArtifacts: cursor telemetry has no samples array");
	}
	let sourceClickIndex = 0;
	const clicks: ClickSample[] = [];
	for (const sample of telemetry.samples) {
		if (
			typeof sample === "object" &&
			sample !== null &&
			(sample as ClickSample).interactionType === "click" &&
			typeof (sample as ClickSample).timeMs === "number" &&
			typeof (sample as ClickSample).cx === "number" &&
			typeof (sample as ClickSample).cy === "number"
		) {
			const click = sample as ClickSample;
			if (click.visible !== false) {
				clicks.push({ ...click, sourceClickIndex });
			}
			sourceClickIndex += 1;
		}
	}
	return clicks;
}

/**
 * Shared doc-artifact writer used by both `createRecordingBundle` (initial pass)
 * and `regenerateDocArtifacts` (re-run after transcript arrives). Reads
 * `transcript.txt` from the bundle if present, builds steps from the given
 * stepFrames (screenshot refs are the `outputPath` filenames carried on each
 * frame -- deterministic `step-NN.png` numbering at initial generation, and
 * prior-step-associated filenames at regeneration), and writes deterministic
 * `steps.json` + `steps.md`.
 *
 * Paired writes are rollback-safe: both artifact strings are generated first,
 * then staged to temp files within the bundle dir; only if BOTH stage
 * successfully are they promoted (renamed) into place. If either stage or
 * promote fails, the prior pair is left unchanged (no new artifact paired with
 * a stale/missing companion). Returns the step count and whether a transcript
 * was available. Throws on failure so callers can decide rollback semantics.
 */
async function writeDocArtifacts(
	bundleDir: string,
	stepFrames: StepFrame[],
	seam?: WriteDocArtifactsSeam,
): Promise<{ stepsWritten: number; transcriptAvailable: boolean }> {
	const transcriptPath = path.join(bundleDir, "transcript.txt");
	let transcriptContent = "";
	let transcriptAvailable = false;
	if (await fileExists(transcriptPath)) {
		try {
			transcriptContent = await fs.readFile(transcriptPath, "utf-8");
			transcriptAvailable = true;
		} catch {
			// Degrade to fallback labels rather than failing generation.
			transcriptContent = "";
			transcriptAvailable = false;
		}
	}
	const segments = parseTranscript(transcriptContent);
	const stepClicks: ClickInput[] = stepFrames.map((frame) => ({
		timeMs: frame.timeMs,
		cx: frame.cx,
		cy: frame.cy,
		outputPath: frame.outputPath,
	}));
	const steps = buildSteps(stepClicks, segments);

	const jsonContent = serializeStepsJson(steps);
	const mdContent = renderStepsMarkdown(steps);

	const jsonPath = path.join(bundleDir, "steps.json");
	const mdPath = path.join(bundleDir, "steps.md");
	const jsonTmp = path.join(bundleDir, "steps.json.tmp");
	const mdTmp = path.join(bundleDir, "steps.md.tmp");

	const write = seam?.writeFile ?? defaultWriteFile;

	// Serialize the stage+promote per bundle. Overlapping regenerations of the
	// SAME bundle share the fixed steps.*.tmp staging paths, so without this an
	// interleaved sibling can rename a temp out from under this run (spurious
	// ENOENT) or promote a mismatched pair. Distinct bundles never contend.
	// (Addresses Greptile PR #31: shared regeneration temp paths.)
	await serializePerBundle(bundleDir, async () => {
		// Stage both artifacts to temp files first. If either fails, clean up any
		// staged temp and leave the prior pair untouched.
		await write(jsonTmp, jsonContent);
		try {
			await write(mdTmp, mdContent);
		} catch (error) {
			// Clean up the staged steps.json.tmp so no half-staged state remains.
			await fs.rm(jsonTmp, { force: true });
			throw error;
		}

		// Both staged successfully -> promote atomically (rename). If the second
		// rename fails, attempt to restore the first so we don't leave a new
		// artifact paired with a stale companion.
		await promotePaired(jsonPath, jsonTmp, mdPath, mdTmp);
	});

	return { stepsWritten: steps.length, transcriptAvailable };
}

/**
 * Per-bundle write serializer. Overlapping regeneration requests for the same
 * bundleDir are chained so their stage+promote critical sections run one at a
 * time; a rejected task never breaks the chain for the next caller, and distinct
 * bundles proceed concurrently. In-process only: there is a single writer per
 * recording on the desktop, so a cross-process lock is unnecessary.
 */
const bundleWriteQueue = new Map<string, Promise<unknown>>();

export function serializePerBundle<T>(bundleDir: string, task: () => Promise<T>): Promise<T> {
	const prior = bundleWriteQueue.get(bundleDir) ?? Promise.resolve();
	// Run task after prior settles either way, so one failure never stalls the queue.
	const result = prior.then(task, task);
	// Tail swallows rejections (chain stays alive) and drops the map entry once
	// this task is the last one queued for the bundle.
	const tail = result.then(
		() => undefined,
		() => undefined,
	);
	bundleWriteQueue.set(bundleDir, tail);
	tail.then(() => {
		if (bundleWriteQueue.get(bundleDir) === tail) {
			bundleWriteQueue.delete(bundleDir);
		}
	});
	return result;
}

async function defaultWriteFile(filePath: string, content: string): Promise<void> {
	await fs.writeFile(filePath, content, "utf-8");
}

/**
 * Promote two staged temp files into their final paths in a rollback-safe
 * manner. Renames are atomic on the same filesystem. If the second rename
 * fails, attempt to restore the first to its prior state (best-effort) so we
 * don't leave a new artifact paired with a stale/missing companion.
 */
async function promotePaired(
	finalJson: string,
	tmpJson: string,
	finalMd: string,
	tmpMd: string,
): Promise<void> {
	// Preserve prior steps.json for rollback (it may not exist on first write).
	// steps.md need not be preserved: if its rename fails, it was never
	// overwritten, so the prior steps.md (if any) is still on disk untouched.
	let priorJson: Buffer | undefined;
	try {
		priorJson = await fs.readFile(finalJson);
	} catch {
		priorJson = undefined;
	}

	// Promote steps.json.
	await fs.rename(tmpJson, finalJson);
	// Promote steps.md; if it fails, roll back steps.json to its prior state.
	try {
		await fs.rename(tmpMd, finalMd);
	} catch (error) {
		// Restore steps.json to its prior content (or remove if it didn't exist).
		if (priorJson !== undefined) {
			await fs.writeFile(finalJson, priorJson);
		} else {
			await fs.rm(finalJson, { force: true });
		}
		throw error;
	}
}

async function promoteWorkflowEdit(
	finalMeta: string,
	tmpMeta: string,
	finalJson: string,
	tmpJson: string,
	finalMarkdown: string,
	tmpMarkdown: string,
): Promise<void> {
	const [priorMeta, priorJson] = await Promise.all([
		readOptionalFile(finalMeta),
		readOptionalFile(finalJson),
	]);
	try {
		await fs.rename(tmpMeta, finalMeta);
		await fs.rename(tmpJson, finalJson);
		await fs.rename(tmpMarkdown, finalMarkdown);
	} catch (error) {
		await Promise.all([
			restoreOptionalFile(finalMeta, priorMeta),
			restoreOptionalFile(finalJson, priorJson),
			fs.rm(tmpMeta, { force: true }),
			fs.rm(tmpJson, { force: true }),
			fs.rm(tmpMarkdown, { force: true }),
		]);
		throw error;
	}
}

async function readOptionalFile(filePath: string): Promise<Buffer | undefined> {
	try {
		return await fs.readFile(filePath);
	} catch {
		return undefined;
	}
}

async function restoreOptionalFile(filePath: string, content: Buffer | undefined): Promise<void> {
	if (content === undefined) {
		await fs.rm(filePath, { force: true });
		return;
	}
	await fs.writeFile(filePath, content);
}
