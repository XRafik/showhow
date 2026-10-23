import type { Dirent } from "node:fs";
import { constants } from "node:fs";
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type {
	RecordingLibraryEntry,
	StepCaptureReason,
} from "../../src/lib/showhow/recordingLibrary";
import { getRecordingsRoot, regenerateDocArtifacts } from "./bundle";
import { createShowhowMediaUrl } from "./mediaProtocol";

export type { RecordingLibraryEntry };

interface RawMeta {
	schemaVersion?: unknown;
	title?: unknown;
	source?: unknown;
	createdAt?: unknown;
	durationMs?: unknown;
	video?: unknown;
	stepCapture?: unknown;
	guide?: unknown;
}

interface RawStep {
	label?: unknown;
	ts?: unknown;
	screenshot?: unknown;
	redaction?: unknown;
	includeRevealedText?: unknown;
	kind?: unknown;
}

function isValidSource(value: unknown): value is "desktop" | "browser" | "imported" {
	return value === "desktop" || value === "browser" || value === "imported";
}

function isVideoName(value: unknown): value is "video.mp4" | "video.webm" {
	return value === "video.mp4" || value === "video.webm";
}

const STEP_CAPTURE_REASONS: readonly StepCaptureReason[] = [
	"no-clicks",
	"frame-extraction",
	"accessibility-denied",
	"companion-unpaired",
	"companion-disconnected",
];

function isStepCapture(
	value: unknown,
): value is { status: "available" | "unavailable"; message?: string; reason?: StepCaptureReason } {
	return (
		typeof value === "object" &&
		value !== null &&
		"status" in value &&
		(value.status === "available" || value.status === "unavailable") &&
		(!("message" in value) || typeof value.message === "string") &&
		// `reason` is optional; when present it must be a known reason so an
		// unknown value never reaches the renderer. Legacy bundles without it
		// continue to deserialize (preserve legacy reads).
		(!("reason" in value) ||
			(typeof value.reason === "string" &&
				(STEP_CAPTURE_REASONS as readonly string[]).includes(value.reason)))
	);
}

async function fileExists(filePath: string): Promise<boolean> {
	try {
		await access(filePath, constants.F_OK);
		return true;
	} catch {
		return false;
	}
}

async function readSteps(
	bundleDir: string,
): Promise<NonNullable<RecordingLibraryEntry["steps"]> | undefined> {
	let rawSteps: unknown;
	try {
		rawSteps = JSON.parse(await readFile(path.join(bundleDir, "steps.json"), "utf-8")) as unknown;
	} catch {
		return undefined;
	}
	if (!Array.isArray(rawSteps)) {
		return undefined;
	}
	return Promise.all(
		rawSteps.flatMap(async (raw): Promise<NonNullable<RecordingLibraryEntry["steps"]>> => {
			if (
				typeof raw !== "object" ||
				raw === null ||
				!isFiniteStep(raw as RawStep) ||
				raw.screenshot.split(/[\\/]/u).length !== 1
			) {
				return [];
			}
			const screenshotPath =
				raw.screenshot === "" ? undefined : path.join(bundleDir, "screenshots", raw.screenshot);
			return [
				{
					label: raw.label,
					ts: raw.ts,
					screenshot: raw.screenshot,
					...(raw.kind === "narration" || raw.kind === "click" ? { kind: raw.kind } : {}),
					...(typeof raw.redaction === "boolean" ? { redaction: raw.redaction } : {}),
					...(typeof raw.includeRevealedText === "boolean"
						? { includeRevealedText: raw.includeRevealedText }
						: {}),
					...(screenshotPath !== undefined && (await fileExists(screenshotPath))
						? { screenshotUrl: createShowhowMediaUrl(bundleDir, `screenshots/${raw.screenshot}`) }
						: {}),
				},
			];
		}),
	).then((steps) => steps.flat());
}

function isFiniteStep(value: RawStep): value is { label: string; ts: number; screenshot: string } {
	return (
		typeof value.label === "string" &&
		value.label.length > 0 &&
		typeof value.ts === "number" &&
		Number.isFinite(value.ts) &&
		typeof value.screenshot === "string"
	);
}

async function readEntryForDir(
	recordingsRoot: string,
	name: string,
): Promise<RecordingLibraryEntry | null> {
	const bundleDir = path.join(recordingsRoot, name);
	const metaPath = path.join(bundleDir, "meta.json");
	let raw: RawMeta;
	try {
		raw = JSON.parse(await readFile(metaPath, "utf-8")) as RawMeta;
	} catch {
		return null;
	}
	if (
		typeof raw.title !== "string" ||
		raw.title === "" ||
		!isValidSource(raw.source) ||
		typeof raw.createdAt !== "number" ||
		!Number.isFinite(raw.createdAt)
	) {
		return null;
	}
	const entry: RecordingLibraryEntry = {
		bundleDir,
		title: raw.title,
		source: raw.source,
		createdAt: raw.createdAt,
	};
	if (typeof raw.durationMs === "number" && Number.isFinite(raw.durationMs)) {
		entry.durationMs = raw.durationMs;
	}
	if (isVideoName(raw.video)) {
		const videoPath = path.join(bundleDir, raw.video);
		if (await fileExists(videoPath)) {
			entry.video = raw.video;
			entry.videoUrl = createShowhowMediaUrl(bundleDir, raw.video);
		}
	}
	if (isStepCapture(raw.stepCapture)) {
		entry.stepCapture = raw.stepCapture;
	}
	if (typeof raw.guide === "object" && raw.guide !== null && "status" in raw.guide) {
		const status = raw.guide.status;
		if (status === "none" || status === "making" || status === "ready" || status === "failed")
			entry.guideStatus = status;
	}
	const steps = await readSteps(bundleDir);
	if (steps !== undefined) {
		entry.steps = steps;
	}
	return entry;
}

/**
 * Scan the recordings root and return a `RecordingLibraryEntry` for every
 * valid bundle directory, sorted newest-first by `createdAt`.
 *
 * A valid bundle is a subdirectory whose `meta.json` has at minimum:
 * - `title` (non-empty string)
 * - `source` ("desktop" | "browser")
 * - `createdAt` (finite number)
 *
 * Directories with missing or unreadable `meta.json`, missing required fields,
 * or an unrecognised `source` value are silently skipped. Plain files in the
 * root are also skipped.
 *
 * Returns `[]` without throwing when the root directory does not exist.
 */
export async function listRecordings(
	recordingsRoot = getRecordingsRoot(),
): Promise<RecordingLibraryEntry[]> {
	let entries: Dirent[];
	try {
		entries = await readdir(recordingsRoot, { withFileTypes: true });
	} catch (error: unknown) {
		if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") {
			return [];
		}
		throw error;
	}
	const results = await Promise.all(
		entries
			.filter((entry) => entry.isDirectory() && !entry.name.startsWith(".import-"))
			.map((entry) => readEntryForDir(recordingsRoot, entry.name)),
	);
	return results
		.filter((entry): entry is RecordingLibraryEntry => entry !== null)
		.sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Scan a single bundle directory by absolute path and return its
 * `RecordingLibraryEntry`, or `null` when it is not a valid bundle (missing or
 * unreadable `meta.json`, or missing required fields). Used to refresh one
 * recording's entry after a doc-layer derivation without re-scanning the whole
 * recordings root.
 */
export async function readRecordingEntry(bundleDir: string): Promise<RecordingLibraryEntry | null> {
	return readEntryForDir(path.dirname(bundleDir), path.basename(bundleDir));
}

/**
 * The result of regenerating a single bundle's workflow doc and refreshing its
 * library entry. `success` mirrors `regenerateDocArtifacts`; `entry` is the
 * re-scanned bundle (or `null` when the bundle can no longer be scanned).
 * Never throws and never removes source video/meta/transcript -- a derivation
 * failure is returned as `{ success: false }` with the prior artifacts and
 * sources left intact.
 */
export interface RegenerateRecordingDocResult {
	bundleDir: string;
	success: boolean;
	stepsWritten: number;
	transcriptAvailable: boolean;
	entry: RecordingLibraryEntry | null;
}

/**
 * Regenerate a bundle's `steps.json`/`steps.md` from its stored cursor
 * telemetry + transcript, then re-scan the bundle into a refreshed library
 * entry. This is the re-runnable doc engine behind the renderer's Create /
 * Retry action: it never throws and never discards the video, meta, or
 * transcript. On failure the prior artifact pair and all sources are left
 * untouched and `{ success: false }` is returned.
 */
export async function regenerateRecordingDoc(
	bundleDir: string,
): Promise<RegenerateRecordingDocResult> {
	const regen = await regenerateDocArtifacts(bundleDir);
	let entry: RecordingLibraryEntry | null = null;
	try {
		entry = await readRecordingEntry(bundleDir);
	} catch (error) {
		// A scan failure must never mask a successful regeneration or discard
		// sources; report the regeneration outcome with a null entry.
		console.error("[showhow] readRecordingEntry failed after regeneration:", error);
	}
	return {
		bundleDir,
		success: regen.success,
		stepsWritten: regen.stepsWritten,
		transcriptAvailable: regen.transcriptAvailable,
		entry,
	};
}
