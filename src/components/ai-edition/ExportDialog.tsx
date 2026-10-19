// Export for the new editor (Editor-04/05): the inspector's share panel, and the rendering sheet
// it raises over the editor. Wires together:
// 1. pickExportSavePath (native save dialog)
// 2. the native D3D exporter (exportMultiNative / exportGifNative)
// 3. per-job GIF cancellation, with native cleanup before returning to the panel
//
// Format/quality/GIF options live in the panel's local state. The sheet says "exported" only
// once the native call has resolved, i.e. once the file is written.

import { Download, FileVideo, FolderOpen, Loader2, Star, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useScopedT } from "@/contexts/I18nContext";
import {
	collectEffectiveClipDims,
	type Dims,
	pickExtremeDims,
	referenceClipDims,
	resolveAspectRatioValue,
} from "@/lib/ai-edition/document/outputFormat";
import type { AxcutDocument } from "@/lib/ai-edition/schema";
import { getEditorSettings } from "@/lib/ai-edition/store/editorSettings";
import { assetCameraSource } from "@/lib/ai-edition/timeline/camera";
import { resolveClipSourceEndSec } from "@/lib/ai-edition/timeline/clipDuration";
import {
	type ExportFormat,
	type ExportProgress,
	type ExportQuality,
	GIF_FRAME_RATES,
	GIF_SIZE_PRESETS,
	type GifFrameRate,
	type GifSizePreset,
} from "@/lib/exporter";
import { calculateMp4ExportSettings, wouldUpscale } from "@/lib/exporter/mp4ExportSettings";
import { outputFrameCount } from "@/lib/exporter/outputFrameCount";
import {
	cancelGifExportNative,
	exportGifNative,
	exportMultiNative,
	useIsCpuCompositor,
} from "@/native";
import { NativeBridgeRequestError } from "@/native/client";
import type { CompositorClipInput } from "@/native/contracts";
import { buildSceneDescription, resolveVisibleClips } from "@/native/sceneDescription";
import { ModalShell } from "./Modals";
import styles from "./NewEditorShell.module.css";
import { Toggle } from "./RightPanes";

type Phase = "idle" | "configuring" | "rendering" | "writing" | "done" | "error";

interface ActiveExport {
	id?: string;
	cancelRequested: boolean;
	unsubscribe?: () => void;
}

function disposeExport(exportJob: ActiveExport | null) {
	exportJob?.unsubscribe?.();
	if (exportJob?.id) {
		void cancelGifExportNative(exportJob.id).catch((error) => {
			console.warn("[export] failed to cancel detached GIF export", error);
		});
	}
}

/** hh:mm:ss (always shows hours, unlike the shared mm:ss `formatTimePadded`) — exports can run
 *  past an hour on either axis (video duration or render wall-time). */
function formatHms(totalSeconds: number): string {
	const s = Math.max(0, Math.round(totalSeconds));
	const h = Math.floor(s / 3600);
	const m = Math.floor((s % 3600) / 60);
	const sec = s % 60;
	return [h, m, sec].map((v) => v.toString().padStart(2, "0")).join(":");
}

/** Opens the exported file's containing folder, selecting the file itself where the OS supports
 *  it. The main handler owns the fallback (`shell.openPath` on the parent directory) for the
 *  cases `showItemInFolder` rejects — a file moved or deleted since the export, or a platform
 *  that cannot reveal — so nothing here has to pre-check that the file still exists.
 *
 *  Shared by the success toast's action and the done panel's button so the two can't drift.
 *  `revealInFolder` is a bare ipcRenderer.invoke, so it rejects when the main handler throws,
 *  and resolves `{ success: false }` when even the fallback failed. The export already
 *  succeeded — failing to open the folder is not worth a second error toast, but it is worth
 *  a line. */
/** The URL itself lives in electron/star-prompt.ts and is never sent from here: main opens the
 *  repo root for every surface that offers a star, so the app menu and this prompt cannot drift
 *  to different links — and a Store copy cannot be walked towards Releases or an .exe. */
function openRepoPage(): void {
	void window.electronAPI
		?.openRepoPage?.()
		.catch((err) => console.warn("[export] could not open the repo page:", err));
}

function revealExportedFile(filePath: string): void {
	void window.electronAPI
		?.revealInFolder?.(filePath)
		.then((result) => {
			if (!result?.success) {
				console.warn("[export] could not open the exported file's folder:", result?.error);
			}
		})
		.catch((err) => {
			console.warn("[export] failed to reveal the file in its folder:", err);
		});
}

/** Maps the document's timeline to the native multiclip export contract: ordered,
 *  trim-narrowed clips (`resolveVisibleClips` — shared with `buildSceneDescription` and
 *  `NativeCompositorOverlay`, so export/preview/scene all see the exact same clip stream),
 *  each with its asset's screen file + camera file (falls back to the screen when a clip has
 *  no camera — the no-webcam layout is a later step) and its source trim. */
function buildNativeClipList(document: AxcutDocument): CompositorClipInput[] {
	const assetById = new Map(document.assets.map((a) => [a.id, a]));
	return resolveVisibleClips(document).flatMap((clip) => {
		const asset = assetById.get(clip.assetId);
		if (!asset?.originalPath) {
			return [];
		}
		const camera = assetCameraSource(asset);
		// sourceEndSec is optional in the schema (unknown until probed) — fall back through
		// the single canonical precedence used by every consumer (clip.probe → asset.duration
		// → timeline-length guess). See `resolveClipSourceEndSec` for the full order.
		const sourceEndSec = resolveClipSourceEndSec(clip, asset);
		// ponytail: `hasAudio` stays optimistic for the same reason as in
		// `buildSceneDescription` — nothing populates `asset.audio` yet, and the
		// native side degrades cleanly on a stream-less file.
		return [
			{
				screenPath: asset.originalPath,
				webcamPath: camera.path,
				sourceStartSec: clip.sourceStartSec,
				sourceEndSec,
				webcamOffsetSec: camera.offsetSec,
				hasAudio: true,
			},
		];
	});
}

const QUALITY_OPTIONS: Array<{
	value: ExportQuality;
	labelKey: string;
}> = [
	{ value: "medium", labelKey: "exportQuality.low" },
	{ value: "good", labelKey: "exportQuality.medium" },
	{ value: "source", labelKey: "exportQuality.high" },
];

interface ExportDialogProps {
	open: boolean;
	onClose: () => void;
	document: AxcutDocument | null;
}

export function ExportDialog({ open, onClose, document }: ExportDialogProps) {
	const t = useScopedT("editor");
	const ts = useScopedT("settings");
	// No usable GPU: the export still applies every effect (output is identical), it
	// just runs on the software encoder and takes minutes instead of seconds.
	const cpuCompositor = useIsCpuCompositor();
	const [format, setFormat] = useState<ExportFormat>("mp4");
	const [quality, setQuality] = useState<ExportQuality>("good");
	const [fps, setFps] = useState<24 | 30 | 60>(60);
	const [gifFrameRate, setGifFrameRate] = useState<GifFrameRate>(15);
	const [gifSize, setGifSize] = useState<GifSizePreset>("medium");
	const [gifLoop, setGifLoop] = useState(true);
	const [phase, setPhase] = useState<Phase>("idle");
	const [progress, setProgress] = useState<ExportProgress | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [savedPath, setSavedPath] = useState<string | null>(null);
	// Null until the main process says this export is the one that earns the ask, and null again
	// the moment the user answers. The renderer never sees the counters behind that decision.
	const [starPrompt, setStarPrompt] = useState<{ store: boolean } | null>(null);
	const activeExport = useRef<ActiveExport | null>(null);
	const [cancelPending, setCancelPending] = useState(false);
	const pickerGeneration = useRef(0);
	const titleId = useId();
	// The sheet's one live action (Cancel export, Done or Close), where its focus starts.
	const sheetActionRef = useRef<HTMLButtonElement>(null);

	useEffect(
		() => () => {
			pickerGeneration.current += 1;
			disposeExport(activeExport.current);
			activeExport.current = null;
		},
		[],
	);

	// (Old behavior: the native compositor overlay used to be a top-level OS window outside the
	//  Chromium surface, so we'd hide it here to put this modal in front. The compositor now
	//  streams into a normal `<canvas>` inside the DOM — CSS z-index handles stacking naturally
	//  and there's no OS window to hide. The hide/show dance is now dead code; removed.)

	// Source dimensions come straight off `asset.video`. This dialog used to probe missing ones
	// into local state as a fallback for recordings that were never probed; `useTimeline` now
	// backfills them on editor load (before this dialog can open) and persists them, so every
	// consumer reads the one populated source instead of each re-probing on its own.
	const primaryAsset = useMemo(
		() =>
			document
				? (document.assets.find((a) => a.id === document.project.primaryAssetId) ??
					document.assets[0])
				: null,
		[document],
	);

	// Per-clip EFFECTIVE (post-crop) dims — single source of truth for both the "largest"
	// and "smallest" picks below, computed once instead of two near-identical hand-rolled
	// reduce+fallback loops. Crop is per-clip, so this must iterate clips, not assets: the
	// same recording can be cropped differently in two different clips on the timeline.
	const effectiveClipDims = useMemo<Dims[]>(
		() => (document ? collectEffectiveClipDims(document) : []),
		[document],
	);
	// (The "largest clip" pick lived here for the old renderer-side GIF path, which
	// sized to the best available footage independently of the quality tier. GIF now
	// goes through the same native exporter as MP4 and starts from its "Source" size, so
	// only the smallest-clip pick below is still needed.)

	// Smallest clip's true (cropped) footprint on the timeline — a multiclip timeline can mix
	// crops/resolutions, so this is what "Source" quality actually targets: sizing to the
	// SMALLEST clip's own resolution means no clip on the timeline is ever upscaled past its
	// true footprint by picking Source. It also feeds the upscale badge on the fixed
	// 720p/1080p tiers, which can still genuinely upscale a small clip.
	// Never null while there is a document: with no probed dims, `referenceClipDims` is the same
	// fallback the scene's output frame is built from. A null here used to send no size at all,
	// and the native side then encoded its own 1920x1080, a 16:9 file for a 9:16 preview.
	const smallestSource = useMemo(
		() =>
			pickExtremeDims(effectiveClipDims, "smallest") ??
			(document ? referenceClipDims(document) : null),
		[effectiveClipDims, document],
	);

	// Aspect the export normalizes to: the timeline's selected ratio (mirrors documentExporter),
	// so the sizes shown match what the export produces. Read through `getEditorSettings` — the
	// same typed façade the ratio dropdown writes through and `buildSceneDescription` reads — so
	// this dialog can't drift from the compositor if the storage ever moves. `resolveAspectRatioValue`
	// owns the legacy "native" case (uncropped reference asset), previously hand-rolled here.
	const EXPORT_ASPECT = useMemo(
		() => resolveAspectRatioValue(document, getEditorSettings(document).aspectRatio),
		[document],
	);
	// Output dimensions the export will produce for a given tier, from the (crop-aware)
	// SMALLEST clip on the timeline — see `smallestSource` above for why. Only "Source"
	// quality actually uses these as its target size; 720p/1080p target a fixed short side
	// regardless (`calculateDimensionsForShortSide`), so this only changes what "Source"
	// resolves to.
	const tierOutputDims = (value: ExportQuality) =>
		smallestSource
			? calculateMp4ExportSettings({
					quality: value,
					sourceWidth: smallestSource.width,
					sourceHeight: smallestSource.height,
					aspectRatioValue: EXPORT_ASPECT,
					frameRate: fps,
				})
			: null;

	// GIF is 8-bit indexed and grows fast with area, so the size preset caps the output
	// height. It starts from the "Source" size, never from the quality tier: that control is
	// MP4-only and hidden while GIF is picked, yet the tier an MP4 choice left behind used to
	// size the GIF (a 640x360 clip gave 852x480 after the 1080p tier, 640x360 after Source).
	// So no preset upscales and `original` is the source size. The native side falls back
	// to its own defaults when undefined.
	const gifOutputDims = (preset: GifSizePreset): { width?: number; height?: number } => {
		const source = tierOutputDims("source");
		if (!source) return {};
		const maxHeight = GIF_SIZE_PRESETS[preset].maxHeight;
		if (source.height <= maxHeight) {
			return { width: source.width, height: source.height };
		}
		const scale = maxHeight / source.height;
		// Even dimensions: the compositor rasterises to this size and the readback
		// assumes a tightly-packed RGBA buffer.
		const even = (n: number) => Math.max(2, Math.round(n * scale) & ~1);
		return { width: even(source.width), height: even(source.height) };
	};

	useEffect(() => {
		if (!open) {
			pickerGeneration.current += 1;
			disposeExport(activeExport.current);
			activeExport.current = null;
			setPhase("idle");
			setProgress(null);
			setError(null);
			setSavedPath(null);
			setCancelPending(false);
			// This component stays mounted across `open`, so an unanswered prompt would otherwise
			// survive the close and reappear on a later export's done panel — a second ask, which
			// is the one thing the whole feature is built to avoid.
			setStarPrompt(null);
		}
	}, [open]);

	const handleClose = () => {
		if (phase === "rendering" || phase === "writing" || phase === "configuring") return;
		onClose();
	};

	const handleCancel = async () => {
		const job = activeExport.current;
		// Only a GIF job carries an id the native side can stop.
		if (phase !== "rendering" || !job?.id) return;
		if (job.cancelRequested) return;
		job.cancelRequested = true;
		setCancelPending(true);
		try {
			await cancelGifExportNative(job.id);
			// Native settlement decides the winner and confirms file cleanup.
		} catch (err) {
			if (activeExport.current !== job) return;
			job.cancelRequested = false;
			setCancelPending(false);
			const message = err instanceof Error ? err.message : String(err);
			setError(message);
			setPhase("error");
			toast.error(message);
		}
	};

	const handleStart = async () => {
		if (!document || activeExport.current || phase === "configuring") return;
		const generation = ++pickerGeneration.current;
		const asset = primaryAsset;
		if (!asset) {
			setError(t("exportDialog.addVideoBeforeExporting"));
			setPhase("error");
			return;
		}

		const safeName = (document.project.title || "Showhow")
			.replace(/[^a-z0-9-_]+/gi, "_")
			.replace(/^_+|_+$/g, "")
			.slice(0, 60);
		const suggested = `${safeName || "export"}${format === "gif" ? ".gif" : ".mp4"}`;

		setPhase("configuring");
		setError(null);
		setProgress(null);
		setSavedPath(null);
		setCancelPending(false);
		setStarPrompt(null);

		let pickedPath: string | undefined;
		try {
			const picker = await window.electronAPI?.pickExportSavePath?.(suggested);
			pickedPath = picker && "path" in picker ? picker.path : undefined;
		} catch (err) {
			if (generation !== pickerGeneration.current) return;
			setError(err instanceof Error ? err.message : String(err));
			setPhase("error");
			return;
		}
		if (generation !== pickerGeneration.current) return;
		if (!pickedPath) {
			setPhase("idle");
			return;
		}

		// Both formats go through the native D3D exporter — same clips, same scene,
		// same frame walk in the compositor crate; only the container differs. There
		// is no CPU/web fallback: that path silently regressed to an ultra-slow CPU
		// render once, which is exactly the failure mode a flag-gated fallback
		// invites. Background/layout/webcam/cursor/effects come from the same scene
		// as the live preview, so an export can no longer disagree with what the
		// user previewed.
		{
			const job: ActiveExport = {
				id: format === "gif" ? crypto.randomUUID() : undefined,
				cancelRequested: false,
			};
			activeExport.current = job;
			setPhase("rendering");
			// Render the real timeline when there are clips; else fall back to the fixture.
			const clips = buildNativeClipList(document);
			// GIF runs at its own frame rate, so the progress total has to use it.
			const outFps = format === "gif" ? gifFrameRate : fps;
			// Total frames the encoder will produce, known upfront from the timeline — the
			// native side only reports frames AFTER composing one (onNativeExportProgress),
			// it doesn't know or send a total, so this is computed here to turn that raw
			// count into a percentage.
			//
			// It has to count SPEED-ADJUSTED frames, not source seconds: a clip under a 1.25x
			// region emits 80% of `duration * fps`, which is where the "frozen at ~80%" of
			// OpenScreen#371 came from — the bar climbed to 80% and the export finished
			// there. `outputFrameCount` mirrors the compositor's own span arithmetic.
			const sceneDesc = buildSceneDescription(document);
			const totalFrames = outputFrameCount(clips, sceneDesc.speedRegions, outFps);
			const startedAt = Date.now();
			const unsubscribeProgress = window.electronAPI?.onNativeExportProgress?.(
				(frames, exportId) => {
					if (activeExport.current !== job || job.cancelRequested || exportId !== job.id) return;
					const elapsedS = (Date.now() - startedAt) / 1000;
					const fractionDone = Math.min(1, frames / totalFrames);
					const estimatedTimeRemaining = fractionDone > 0 ? elapsedS / fractionDone - elapsedS : 0;
					setProgress({
						currentFrame: frames,
						totalFrames,
						percentage: fractionDone * 100,
						estimatedTimeRemaining,
					});
				},
			);
			job.unsubscribe = unsubscribeProgress;
			try {
				// The webcam background effect is applied by the compositor from the scene,
				// so the clip list needs no pre-rendering pass.
				const exportClips = clips;

				const sceneJson = JSON.stringify(sceneDesc);
				const outDims = tierOutputDims(quality);
				if (exportClips.length === 0) {
					throw new Error(t("exportDialog.nothingToExport"));
				}
				const stats =
					format === "gif"
						? await exportGifNative(
								exportClips,
								pickedPath,
								sceneJson,
								{
									...gifOutputDims(gifSize),
									fps: gifFrameRate,
									// 0 = infinite, the historical GIF default; 1 = play once.
									loopCount: gifLoop ? 0 : 1,
								},
								job.id,
							)
						: await exportMultiNative(exportClips, pickedPath, sceneJson, {
								width: outDims?.width,
								height: outDims?.height,
								fps,
								// H.264 only. The native pipeline still encodes H.265, but nothing
								// offers it: it is software-only on Linux, slower than software on the
								// measured Macs, and the files half the players cannot open.
								codec: "h264",
								bitrate: outDims?.bitrate,
							});
				if (activeExport.current !== job) return;
				setSavedPath(pickedPath);
				setPhase("done");
				// Reported after the export succeeded, so a cancelled or failed run never counts.
				// Main owns the whole decision; a failure here simply means no ask, which is the
				// safe direction for something that may only ever happen once.
				void window.electronAPI
					?.starPromptExportFinished?.()
					.then((result) => {
						// The same generation guard the save picker uses: a close or a newer export
						// invalidates this answer, and an IPC round trip is long enough for either to
						// have happened. Without it a late "yes" lands on a dialog that has moved on.
						if (generation !== pickerGeneration.current) return;
						if (result?.offer) setStarPrompt({ store: result.store });
					})
					.catch((err) => console.warn("[export] star prompt check failed:", err));
				toast.success(t("exportDialog.exportedVideo"), {
					description: `${pickedPath} · ${formatHms(stats.videoDurationS)} ${t("exportDialog.exportedVideoOf")} ${formatHms(stats.wallS)}`,
					action: {
						label: t("exportDialog.showInFolder"),
						// The toast is gone in five seconds; the done panel below keeps the same
						// action around for as long as the dialog is open.
						onClick: () => revealExportedFile(pickedPath),
					},
				});
			} catch (err) {
				if (activeExport.current !== job) return;
				if (err instanceof NativeBridgeRequestError && err.code === "CANCELLED") {
					setPhase("idle");
					setProgress(null);
					setError(null);
					return;
				}
				setError(err instanceof Error ? err.message : String(err));
				setPhase("error");
				toast.error(t("exportDialog.exportFailed"), {
					description: err instanceof Error ? err.message : String(err),
				});
			} finally {
				unsubscribeProgress?.();
				if (activeExport.current === job) {
					activeExport.current = null;
					setCancelPending(false);
				}
			}
			return;
		}
	};

	const isBusy = phase === "rendering" || phase === "writing" || phase === "configuring";
	const pct = progress?.percentage ?? 0;
	const gifSizeLabel = GIF_SIZE_PRESETS[gifSize].label;
	const qualityLabel = ts(
		QUALITY_OPTIONS.find((q) => q.value === quality)?.labelKey ?? "exportQuality.medium",
	);
	// The sheet covers the editor from the first frame to the last word on the export. The save
	// picker ("configuring") is the OS's own window, so nothing of ours stands in front of it.
	const sheetOpen =
		phase === "rendering" || phase === "writing" || phase === "done" || phase === "error";
	const sheetTitle =
		phase === "done"
			? format === "gif"
				? t("exportDialog.exportedGif")
				: t("exportDialog.exportedVideo")
			: phase === "error"
				? t("exportDialog.exportFailed")
				: t("exportDialog.sheetRendering");
	const sheetSettings = t("exportDialog.sheetSettings", {
		format: format === "gif" ? ts("exportFormat.gif") : ts("exportFormat.mp4"),
		quality: format === "gif" ? gifSizeLabel : qualityLabel,
		fps: format === "gif" ? gifFrameRate : fps,
	});
	// What the panel promises before anything runs: the format, the frame it will be, how long
	// it plays (speed regions counted, as the encoder counts them) and that the user picks the
	// place. No file size: nothing here can know it before the encoder has run.
	const summaryFps = format === "gif" ? gifFrameRate : fps;
	const summaryDims = format === "gif" ? gifOutputDims(gifSize) : tierOutputDims(quality);
	const summaryLengthS = document
		? outputFrameCount(
				buildNativeClipList(document),
				buildSceneDescription(document).speedRegions,
				summaryFps,
			) / summaryFps
		: 0;
	// Back to the panel from a finished or failed export. Nothing to undo: a failed export
	// left no file (native cleanup), a finished one is on disk where the sheet said.
	const dismissSheet = () => {
		if (phase !== "done" && phase !== "error") return;
		pickerGeneration.current += 1;
		setPhase("idle");
		setProgress(null);
		setError(null);
		setSavedPath(null);
		setStarPrompt(null);
	};

	return (
		<>
			<section className={styles.exportPanel} aria-labelledby={titleId}>
				<header className={styles.exportHead}>
					<div>
						<span className={styles.sheetEyebrow}>{t("exportDialog.eyebrow")}</span>
						<h2 id={titleId} className={styles.exportTitle}>
							{t("exportDialog.title")}
						</h2>
					</div>
					<button
						type="button"
						className={styles.exportClose}
						aria-label={t("exportDialog.closePanel")}
						onClick={handleClose}
						disabled={isBusy}
					>
						<X size={16} />
					</button>
				</header>
				<div className={styles.exportBody}>
					<div className={styles.exportChoices2}>
						<FormatToggle
							active={format === "mp4"}
							label={ts("exportFormat.mp4")}
							icon={<FileVideo size={16} />}
							onClick={() => setFormat("mp4")}
							disabled={isBusy}
						/>
						<FormatToggle
							active={format === "gif"}
							label={ts("exportFormat.gif")}
							icon={<Download size={16} />}
							onClick={() => setFormat("gif")}
							disabled={isBusy}
						/>
					</div>

					{format === "mp4" ? (
						<>
							<section>
								<div className={styles.exportLabel}>{t("exportDialog.quality")}</div>
								<div className={styles.exportChoices3}>
									{QUALITY_OPTIONS.map((q) => {
										const dims = tierOutputDims(q.value);
										// The upscale badge asks whether the clip has to be STRETCHED to fill this
										// frame (`wouldUpscale`), a contain-fit question: a short-side compare read
										// the letterbox rows a non-16:9 source gets in a 16:9 project as stretched
										// pixels. "Source" is the source's long side at the project ratio, so its
										// contain scale is never above 1 and the general test covers it.
										const isUpscale =
											dims !== null &&
											smallestSource !== null &&
											wouldUpscale(dims, smallestSource);
										return (
											<button
												type="button"
												key={q.value}
												disabled={isBusy}
												aria-pressed={quality === q.value}
												onClick={() => setQuality(q.value)}
												className={styles.exportChoice}
											>
												<span className={styles.exportChoiceName}>{ts(q.labelKey)}</span>
												{dims ? (
													<span
														className={styles.exportChoiceMeta}
														data-warn={isUpscale || undefined}
													>
														{dims.width} × {dims.height}
														{isUpscale ? ` · ${t("exportDialog.qualityUpscaleWarning")}` : ""}
													</span>
												) : null}
											</button>
										);
									})}
								</div>
							</section>
							<section>
								<div className={styles.exportLabel}>{t("exportDialog.frameRate")}</div>
								<div className={styles.exportChoices3}>
									{([24, 30, 60] as const).map((r) => (
										<button
											type="button"
											key={r}
											disabled={isBusy}
											aria-pressed={fps === r}
											onClick={() => setFps(r)}
											className={styles.exportChoice}
										>
											{r}
										</button>
									))}
								</div>
							</section>
						</>
					) : (
						<>
							<section>
								<div className={styles.exportLabel}>{t("exportDialog.frameRate")}</div>
								<div className={styles.exportChoices4}>
									{GIF_FRAME_RATES.map((r) => (
										<button
											type="button"
											key={r.value}
											disabled={isBusy}
											aria-pressed={gifFrameRate === r.value}
											onClick={() => setGifFrameRate(r.value)}
											className={styles.exportChoice}
										>
											{r.value} FPS
										</button>
									))}
								</div>
							</section>
							<section>
								<div className={styles.exportLabel}>{t("exportDialog.size")}</div>
								<div className={styles.exportChoices2}>
									{(Object.keys(GIF_SIZE_PRESETS) as GifSizePreset[]).map((s) => (
										<button
											type="button"
											key={s}
											disabled={isBusy}
											aria-pressed={gifSize === s}
											onClick={() => setGifSize(s)}
											className={styles.exportChoice}
										>
											{GIF_SIZE_PRESETS[s].label}
										</button>
									))}
								</div>
							</section>
							<div className={styles.paneRow} style={{ margin: 0 }}>
								<span className={styles.label}>{t("exportDialog.loopGif")}</span>
								<Toggle
									checked={gifLoop}
									ariaLabel={t("exportDialog.loopGif")}
									disabled={isBusy}
									onChange={setGifLoop}
								/>
							</div>
						</>
					)}

					<ul className={styles.exportSummary} aria-label={t("exportDialog.summaryLabel")}>
						<li>
							<span>{t("exportDialog.summaryFormat")}</span>
							<span>
								{format === "gif"
									? `${ts("exportFormat.gif")} · ${gifFrameRate} FPS · ${gifLoop ? t("exportDialog.loopOn") : t("exportDialog.loopOff")}`
									: `${ts("exportFormat.mp4")} · H.264 · ${fps} FPS`}
							</span>
						</li>
						{summaryDims?.width && summaryDims.height ? (
							<li>
								<span>{t("exportDialog.size")}</span>
								<span>
									{summaryDims.width} × {summaryDims.height}
								</span>
							</li>
						) : null}
						<li>
							<span>{t("exportDialog.summaryLength")}</span>
							<span>{formatLength(summaryLengthS)}</span>
						</li>
						<li>
							<span>{t("exportDialog.savedTo")}</span>
							<span>{t("exportDialog.destinationChoose")}</span>
						</li>
					</ul>

					{cpuCompositor && (
						// Next to the export button, not in a toast: it has to land while the user is
						// still deciding. A CPU export renders every effect correctly but takes minutes
						// rather than seconds, and an unexplained ten-minute wait reads as a hang.
						<p data-testid="export-cpu-warning" className={styles.exportWarning}>
							{t("cpuCompositor.exportWarning")}
						</p>
					)}
				</div>
				<div className={styles.exportFoot}>
					<button
						type="button"
						className={styles.sheetPrimary}
						onClick={handleStart}
						disabled={isBusy || !document}
					>
						{phase === "configuring" ? (
							<>
								<Loader2 size={14} className="animate-spin" />
								{t("exportDialog.starting")}
							</>
						) : (
							<>
								<Download size={14} />
								{format === "gif" ? t("exportDialog.exportGif") : t("exportDialog.exportMp4")}
							</>
						)}
					</button>
				</div>
			</section>

			<ModalShell
				open={sheetOpen}
				onClose={dismissSheet}
				final
				dismissible={false}
				closeOnEscape={phase === "done" || phase === "error"}
				eyebrow={sheetSettings}
				title={sheetTitle}
				initialFocusRef={sheetActionRef}
			>
				<SheetBody
					phase={phase}
					format={format}
					progress={progress}
					error={error}
					pct={pct}
					savedPath={savedPath}
					cancelPending={cancelPending}
					actionRef={sheetActionRef}
					onCancel={() => void handleCancel()}
					onDismiss={dismissSheet}
					starPrompt={starPrompt}
					onAnswerStarPrompt={() => {
						// Starring and declining are the same answer here: the ask is over. Cleared
						// locally first so the block goes away on the click, not on the round trip.
						setStarPrompt(null);
						void window.electronAPI
							?.dismissStarPrompt?.()
							.catch((err) => console.warn("[export] could not record the star answer:", err));
					}}
				/>
			</ModalShell>
		</>
	);
}

/** m:ss, or h:mm:ss past the hour. */
function formatLength(totalSeconds: number): string {
	const s = Math.max(0, Math.round(totalSeconds));
	const h = Math.floor(s / 3600);
	const m = Math.floor((s % 3600) / 60);
	const sec = (s % 60).toString().padStart(2, "0");
	return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

function FormatToggle({
	active,
	label,
	icon,
	onClick,
	disabled,
}: {
	active: boolean;
	label: string;
	icon: React.ReactNode;
	onClick: () => void;
	disabled?: boolean;
}) {
	return (
		<button
			type="button"
			disabled={disabled}
			aria-pressed={active}
			onClick={onClick}
			className={`${styles.exportChoice} ${styles.exportFormat}`}
		>
			{icon}
			{label}
		</button>
	);
}

/** Editor-05: the rendering sheet's body, from the first frame to the saved file or the error. */
function SheetBody({
	phase,
	format,
	progress,
	error,
	pct,
	savedPath,
	cancelPending,
	actionRef,
	onCancel,
	onDismiss,
	starPrompt,
	onAnswerStarPrompt,
}: {
	phase: Phase;
	format: ExportFormat;
	progress: ExportProgress | null;
	error: string | null;
	pct: number;
	savedPath: string | null;
	cancelPending: boolean;
	actionRef: React.RefObject<HTMLButtonElement>;
	onCancel: () => void;
	onDismiss: () => void;
	starPrompt: { store: boolean } | null;
	onAnswerStarPrompt: () => void;
}) {
	const t = useScopedT("editor");
	// Same string as the permanent app-menu entry and the native Help menu. It lives in `common`
	// rather than in the orphaned `settings.support` block because the main process only bundles
	// `common` and `dialogs`, and one label split across two namespaces is one label that drifts.
	const tCommon = useScopedT("common");
	const noteId = useId();
	if (phase === "done") {
		return (
			<>
				<p className={styles.sheetText}>
					{t("exportDialog.savedTo")} <span className={styles.exportPath}>{savedPath}</span>
				</p>
				{starPrompt ? (
					<div className={styles.starPrompt} data-testid="export-star-prompt">
						<span className={styles.starPromptText}>{t("exportDialog.starPrompt")}</span>
						<div className={styles.starPromptActions}>
							<button
								type="button"
								data-testid="export-star-prompt-star"
								className={styles.sheetSecondary}
								onClick={() => {
									openRepoPage();
									onAnswerStarPrompt();
								}}
							>
								<Star size={14} />
								{tCommon("actions.starOnGithub")}
							</button>
							{starPrompt.store ? (
								// Deliberately NOT an answer: rating on the Store and starring the repo are
								// different favours, and dismissing on the first would quietly cost the user
								// the second.
								<button
									type="button"
									data-testid="export-star-prompt-store"
									className={styles.sheetSecondary}
									onClick={() => {
										void window.electronAPI
											?.openStoreReview?.()
											.catch((err) => console.warn("[export] could not open the Store:", err));
									}}
								>
									{t("exportDialog.rateOnStore")}
								</button>
							) : null}
							<button
								type="button"
								data-testid="export-star-prompt-no"
								className={styles.starPromptDecline}
								onClick={onAnswerStarPrompt}
							>
								{t("exportDialog.starPromptNoThanks")}
							</button>
						</div>
					</div>
				) : null}
				<div className={styles.sheetFoot}>
					{savedPath ? (
						<button
							type="button"
							data-testid="export-show-in-folder"
							className={styles.sheetSecondary}
							onClick={() => revealExportedFile(savedPath)}
						>
							<FolderOpen size={14} />
							{t("exportDialog.showInFolder")}
						</button>
					) : null}
					<span className={styles.sheetFootGap} />
					<button ref={actionRef} type="button" className={styles.sheetPrimary} onClick={onDismiss}>
						{t("exportDialog.done")}
					</button>
				</div>
			</>
		);
	}
	if (phase === "error") {
		return (
			<>
				<p role="alert" className={styles.exportError}>
					{error ?? t("exportDialog.exportFailedGeneric")}
				</p>
				<div className={styles.sheetFoot}>
					<span className={styles.sheetFootGap} />
					<button
						ref={actionRef}
						type="button"
						className={styles.sheetSecondary}
						onClick={onDismiss}
					>
						{t("exportDialog.close")}
					</button>
				</div>
			</>
		);
	}
	const current = progress?.currentFrame ?? 0;
	const total = progress?.totalFrames ?? 0;
	const eta = progress?.estimatedTimeRemaining ?? 0;
	const rounded = Math.round(Math.max(0, Math.min(100, pct)));
	// Only a GIF job can be stopped: the MP4 encoder has no cancel. Say so, on the button, rather
	// than offer a Cancel that does nothing.
	const canCancel = format === "gif" && phase === "rendering" && !cancelPending;
	return (
		<>
			<div className={styles.renderHead}>
				<span className={styles.renderPct}>{rounded}%</span>
				<span className={styles.sheetNote}>
					{phase === "writing" ? t("exportDialog.writingFile") : t("exportDialog.renderingFrames")}
				</span>
			</div>
			<div
				role="progressbar"
				aria-label={t("exportDialog.renderingFrames")}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={rounded}
				className={styles.renderBar}
			>
				<div className={styles.renderFill} style={{ width: `${rounded}%` }} />
			</div>
			<p className={styles.sheetNote}>
				{total > 0
					? t("exportDialog.framesEta", { current, total, eta: Math.max(0, Math.round(eta)) })
					: t("exportDialog.preparingEncoder")}
			</p>
			{format === "mp4" ? (
				<p id={noteId} className={styles.sheetNote}>
					{t("exportDialog.mp4CannotCancel")}
				</p>
			) : null}
			<div className={styles.sheetFoot}>
				<span className={styles.sheetFootGap} />
				<button
					ref={actionRef}
					type="button"
					className={styles.sheetSecondary}
					onClick={onCancel}
					disabled={!canCancel}
					aria-describedby={format === "mp4" ? noteId : undefined}
					aria-busy={cancelPending}
				>
					{cancelPending && <Loader2 size={14} className="animate-spin" />}
					{t("exportDialog.cancelExport")}
				</button>
			</div>
		</>
	);
}
