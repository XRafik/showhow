import { CircleDot, FileText, Folder, Scissors, Search, Settings, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	AgentBriefPanel,
	AgentBriefSheets,
	CopyForAgentButton,
	useAgentBrief,
} from "@/components/showhow/AgentBriefPanel";
import { AiGuidePanel } from "@/components/showhow/AiGuidePanel";
import { Button } from "@/components/showhow/Button";
import { EmptyState } from "@/components/showhow/EmptyState";
import { ExportPdfSheet } from "@/components/showhow/ExportPdfSheet";
import { Field } from "@/components/showhow/Field";
import { GuideStep, Mosaic } from "@/components/showhow/GuideStep";
import { ImportVideoSheet } from "@/components/showhow/ImportVideoSheet";
import { LibraryRow } from "@/components/showhow/LibraryRow";
import { Progress } from "@/components/showhow/Progress";
import { SettingsView } from "@/components/showhow/SettingsView";
import { Shell } from "@/components/showhow/Shell";
import { Sidebar } from "@/components/showhow/Sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/showhow/Tabs";
import { Tag } from "@/components/showhow/Tag";
import { VideoPlayer } from "@/components/showhow/VideoPlayer";
import { useScopedT } from "@/contexts/I18nContext";
import type { RecordingLibraryEntry } from "@/lib/showhow/recordingLibrary";
import type { WorkflowDocumentUpdate } from "@/lib/showhow/workflowDocument";
import { filterRecordings } from "./library-search";

// ---- helpers -----------------------------------------------------------------

function formatDuration(ms: number): string {
	const totalSec = Math.floor(ms / 1000);
	const m = Math.floor(totalSec / 60);
	const s = totalSec % 60;
	return `${m}:${String(s).padStart(2, "0")}`;
}

function formatWhen(createdAt: number): string {
	const d = new Date(createdAt);
	return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function fallbackBundleUrl(bundleDir: string, relativePath: string): string {
	return `file://${bundleDir.replace(/\\/g, "/")}/${relativePath}`;
}

// ---- empty state (no recordings in the library) ------------------------------

function EmptyLibraryState() {
	return (
		<div
			data-testid="empty-library-state"
			className="flex min-h-[520px] flex-col items-center justify-center gap-5 [&>div]:bg-transparent [&_h3]:text-[32px]"
		>
			<div className="h-[200px] w-full max-w-[440px] overflow-hidden rounded-[8px]">
				<Mosaic />
			</div>
			<EmptyState
				title="Show it once."
				body="Record a browser tab or your whole desktop, and it'll show up here as a folder — video, transcript and screenshots ready to turn into a doc."
			/>
			<p className="text-sm text-ds-ink-soft">No recordings yet</p>
		</div>
	);
}

function ErrorLibraryState() {
	return (
		<div
			data-testid="recording-library-error-state"
			className="flex min-h-[520px] flex-col items-center justify-center gap-5 [&>div]:bg-transparent [&_h3]:text-[32px]"
		>
			<div className="h-[200px] w-full max-w-[440px] overflow-hidden rounded-[8px]">
				<Mosaic failed />
			</div>
			<EmptyState
				title="Couldn't load recordings"
				body="Check folder permissions or disk access, then reopen the library."
			/>
		</div>
	);
}

// ---- main panel (active recording detail) -----------------------------------

function RecordingDetail({
	entry,
	onEntryChange,
	onTitleChange,
	onStepsChange,
	onGuideStatusChange,
}: {
	entry: RecordingLibraryEntry;
	onEntryChange: (entry: RecordingLibraryEntry) => void;
	onTitleChange: (bundleDir: string, title: string) => void;
	onStepsChange: (bundleDir: string, steps: RecordingLibraryEntry["steps"]) => void;
	onGuideStatusChange: (
		bundleDir: string,
		status: NonNullable<RecordingLibraryEntry["guideStatus"]>,
	) => void;
}) {
	const t = useScopedT("common");
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const [pendingSeekMs, setPendingSeekMs] = useState<number | null>(null);
	const [editingTitle, setEditingTitle] = useState(false);
	const [titleDraft, setTitleDraft] = useState(entry.title);
	const [titleStatus, setTitleStatus] = useState<"idle" | "saving" | "success" | "failure">("idle");
	const [editorError, setEditorError] = useState(false);
	const [copyStatus, setCopyStatus] = useState<"idle" | "copying" | "success" | "failure">("idle");
	const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);
	const [instructionDraft, setInstructionDraft] = useState("");
	const [stepBusy, setStepBusy] = useState(false);
	const [stepError, setStepError] = useState(false);
	const [revealedSteps, setRevealedSteps] = useState<Set<number>>(() => new Set());
	const [docStatus, setDocStatus] = useState<"idle" | "generating" | "failure">("idle");
	const [tab, setTab] = useState("guide");
	const [pdfOpen, setPdfOpen] = useState(false);
	const pdfButton = useRef<HTMLButtonElement>(null);
	const brief = useAgentBrief(entry.bundleDir);
	const isMountedRef = useRef(true);
	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);
	const isDesktop = entry.source === "desktop";
	const sourceLabel =
		entry.source === "imported" ? t("importVideo.imported") : isDesktop ? "Desktop" : "Browser";
	const videoSrc =
		entry.videoUrl ?? (entry.video ? fallbackBundleUrl(entry.bundleDir, entry.video) : undefined);
	const openInEditor = async () => {
		setEditorError(false);
		try {
			const result = await window.electronAPI.showhowOpenRecording(entry.bundleDir);
			if (!result.success) setEditorError(true);
		} catch {
			setEditorError(true);
		}
	};
	const copyPath = async () => {
		setCopyStatus("copying");
		try {
			const result = await window.electronAPI.showhowCopyPath(entry.bundleDir);
			if (isMountedRef.current) setCopyStatus(result.success ? "success" : "failure");
		} catch (error) {
			console.error("[RecordingLibrary] copy path failed:", error);
			if (isMountedRef.current) setCopyStatus("failure");
		}
	};
	const persist = async (update: WorkflowDocumentUpdate, nextEntry: RecordingLibraryEntry) => {
		if (stepBusy) return false;
		setStepBusy(true);
		setStepError(false);
		try {
			const result = await window.electronAPI.showhowUpdateWorkflowDocument(
				entry.bundleDir,
				update,
			);
			if (result.success) onStepsChange(entry.bundleDir, nextEntry.steps);
			if (isMountedRef.current) setStepError(!result.success);
			return result.success;
		} catch {
			if (isMountedRef.current) setStepError(true);
			return false;
		} finally {
			if (isMountedRef.current) setStepBusy(false);
		}
	};
	const saveTitle = async () => {
		const title = titleDraft.trim();
		if (title === "") return;
		setTitleStatus("saving");
		try {
			const result = await window.electronAPI.showhowUpdateWorkflowDocument(entry.bundleDir, {
				type: "title",
				title,
			});
			if (result.success) {
				onTitleChange(entry.bundleDir, title);
				if (!isMountedRef.current) return;
				setEditingTitle(false);
				setTitleStatus("success");
			} else if (isMountedRef.current) {
				setTitleStatus("failure");
			}
		} catch (error) {
			console.error("[RecordingLibrary] save title failed:", error);
			if (isMountedRef.current) setTitleStatus("failure");
		}
	};
	const cancelTitleEdit = () => {
		setTitleDraft(entry.title);
		setTitleStatus("idle");
		setEditingTitle(false);
	};
	const saveStep = async (index: number) => {
		const label = instructionDraft.trim();
		if (label === "" || !entry.steps) return;
		const steps = entry.steps.map((step, stepIndex) =>
			stepIndex === index ? { ...step, label } : step,
		);
		if (await persist({ type: "step", index, label }, { ...entry, steps }))
			setEditingStepIndex(null);
	};
	const deleteStep = async (index: number) => {
		const steps = entry.steps?.filter((_, stepIndex) => stepIndex !== index);
		if (!steps) return;
		if (await persist({ type: "delete-step", index }, { ...entry, steps })) {
			setRevealedSteps(new Set());
		}
	};
	const createDoc = async () => {
		setDocStatus("generating");
		try {
			const result = await window.electronAPI.showhowRegenerateDoc(entry.bundleDir);
			if (result.success && result.entry) {
				onEntryChange(result.entry);
				setDocStatus("idle");
			} else {
				setDocStatus("failure");
			}
		} catch (error) {
			console.error("[RecordingLibrary] regenerate doc failed:", error);
			setDocStatus("failure");
		}
	};
	const seekToStep = (timestampMs: number) => {
		if (videoRef.current) {
			videoRef.current.currentTime = timestampMs / 1000;
			setPendingSeekMs(
				videoRef.current.readyState < HTMLMediaElement.HAVE_METADATA ? timestampMs : null,
			);
			return;
		}
		setPendingSeekMs(timestampMs);
	};
	const applyPendingSeek = () => {
		if (videoRef.current && pendingSeekMs !== null) {
			videoRef.current.currentTime = pendingSeekMs / 1000;
			setPendingSeekMs(null);
		}
	};

	const copyPathButton = (
		<Button
			title={entry.bundleDir}
			variant="secondary"
			icon={Folder}
			disabled={copyStatus === "copying"}
			onClick={() => void copyPath()}
		>
			{copyStatus === "copying" ? "Copying…" : "Copy path"}
		</Button>
	);
	const tabList = (
		<TabsList className="border-b-0">
			<TabsTrigger value="guide">{t("showhowGuide.walkthrough")}</TabsTrigger>
			<TabsTrigger value="brief">{t("showhowBrief.tab")}</TabsTrigger>
		</TabsList>
	);
	const guideBody = (
		<>
			{entry.steps && entry.steps.length > 0 && <StepCaptureDegradationNotice entry={entry} />}
			{stepError && (
				<p role="alert" className="mb-3 text-sm text-ds-rec-ink">
					Couldn't save step. The saved guide is unchanged. Try again.
				</p>
			)}
			{entry.steps && entry.steps.length > 0 ? (
				<section aria-label="Workflow steps">
					<h2 className="sr-only">Steps</h2>
					<ol>
						{entry.steps.map((step, index) => {
							const hidden = step.redaction && !revealedSteps.has(index);
							const screenshotSrc =
								step.screenshot === ""
									? undefined
									: (step.screenshotUrl ??
										fallbackBundleUrl(entry.bundleDir, `screenshots/${step.screenshot}`));
							return (
								<li key={`${step.ts}-${step.screenshot}`}>
									<GuideStep
										number={index + 1}
										title={hidden ? "Sensitive text hidden" : step.label}
										shot={
											hidden ? (
												<Mosaic />
											) : screenshotSrc ? (
												<img
													src={screenshotSrc}
													alt={`Step ${index + 1}: ${step.label}`}
													className="h-full w-full object-contain"
												/>
											) : (
												<span className="px-3 text-center font-ds-label text-[10px] uppercase text-ds-on-panel-soft">
													{step.kind === "narration" ? "Narration" : "No screenshot"}
												</span>
											)
										}
										actions={
											<>
												<Button
													variant="ghost"
													className="p-0 text-ds-rec-ink"
													onClick={() => seekToStep(step.ts)}
												>
													{formatDuration(step.ts)}
												</Button>
												<Button
													variant="ghost"
													className="px-1 py-1"
													aria-label={`Edit step ${index + 1}`}
													disabled={Boolean(hidden) || stepBusy}
													onClick={() => {
														setInstructionDraft(step.label);
														setEditingStepIndex(index);
													}}
												>
													Edit
												</Button>
												<Button
													variant="ghost"
													className="px-1 py-1"
													aria-label={`Delete step ${index + 1}`}
													disabled={stepBusy}
													onClick={() => void deleteStep(index)}
												>
													Delete
												</Button>
												{step.redaction && hidden && (
													<Button
														variant="ghost"
														className="px-1 py-1"
														aria-label={`Reveal step ${index + 1} text`}
														onClick={() =>
															setRevealedSteps((current) => new Set(current).add(index))
														}
													>
														Reveal
													</Button>
												)}
											</>
										}
									>
										{editingStepIndex === index && (
											<div className="flex flex-wrap items-end gap-2">
												<Field
													label={`Step ${index + 1} instruction`}
													value={instructionDraft}
													disabled={stepBusy}
													onChange={(event) => setInstructionDraft(event.target.value)}
													onKeyDown={(event) => {
														if (event.key === "Enter" && !stepBusy) void saveStep(index);
														if (event.key === "Escape" && !stepBusy) setEditingStepIndex(null);
													}}
													autoFocus
												/>
												<Button
													variant="secondary"
													disabled={stepBusy || !instructionDraft.trim()}
													onClick={() => void saveStep(index)}
												>
													Save step
												</Button>
												<Button
													variant="ghost"
													disabled={stepBusy}
													onClick={() => setEditingStepIndex(null)}
												>
													Cancel
												</Button>
											</div>
										)}
										{step.redaction && !hidden && (
											<label className="flex items-center gap-2 text-sm">
												<input
													type="checkbox"
													disabled={stepBusy}
													checked={step.includeRevealedText === true}
													onChange={(event) => {
														const includeRevealedText = event.target.checked;
														const steps = entry.steps?.map((current, stepIndex) =>
															stepIndex === index ? { ...current, includeRevealedText } : current,
														);
														if (steps)
															void persist(
																{ type: "step", index, includeRevealedText },
																{ ...entry, steps },
															);
													}}
												/>
												Include revealed text in steps.md
											</label>
										)}
									</GuideStep>
								</li>
							);
						})}
					</ol>
				</section>
			) : entry.steps === undefined ? (
				<MissingDocSection entry={entry} docStatus={docStatus} onCreate={() => void createDoc()} />
			) : (
				<TranscriptOnlyDocSection entry={entry} />
			)}
		</>
	);

	return (
		<div className="min-w-0">
			<header className="mb-3 flex flex-wrap items-start justify-between gap-3">
				{editingTitle ? (
					<div className="flex w-full flex-wrap items-end gap-2">
						<div className="min-w-0 flex-1">
							<Field
								label="Recording title"
								value={titleDraft}
								disabled={titleStatus === "saving"}
								onChange={(event) => setTitleDraft(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === "Enter" && titleStatus !== "saving") void saveTitle();
									if (event.key === "Escape" && titleStatus !== "saving") cancelTitleEdit();
								}}
								autoFocus
							/>
						</div>
						<Button
							aria-label="Cancel title edit"
							variant="ghost"
							disabled={titleStatus === "saving"}
							onClick={cancelTitleEdit}
						>
							Cancel
						</Button>
						<Button
							aria-label="Save title"
							disabled={titleStatus === "saving" || !titleDraft.trim()}
							onClick={() => void saveTitle()}
						>
							Save
						</Button>
					</div>
				) : (
					<>
						<h1 className="min-w-0 flex-1 break-words font-ds-display text-[32px] font-semibold leading-[1.15] tracking-[-0.64px]">
							{entry.title}
						</h1>
						<div className="flex flex-wrap gap-2">
							{entry.video && (
								<Button
									aria-label="Open in editor"
									variant="primary"
									icon={Scissors}
									onClick={() => void openInEditor()}
								>
									Edit video
								</Button>
							)}
							<Button
								aria-label="Edit title"
								variant="secondary"
								onClick={() => {
									setTitleDraft(entry.title);
									setTitleStatus("idle");
									setEditingTitle(true);
								}}
							>
								Rename
							</Button>
						</div>
					</>
				)}
			</header>
			{titleStatus !== "idle" && (
				<p role="status" className="mb-3 text-sm text-ds-ink-soft">
					{titleStatus === "saving"
						? "Saving title…"
						: titleStatus === "success"
							? "Title saved"
							: "Couldn't save title"}
				</p>
			)}
			<p className="mb-5 font-ds-label text-[10px] uppercase tracking-[0.8px] text-ds-ink-soft">
				<span>
					{sourceLabel} {entry.source === "imported" ? "video" : "recording"}
				</span>{" "}
				· {entry.durationMs !== undefined && `${formatDuration(entry.durationMs)} · `}
				{formatWhen(entry.createdAt)}
			</p>
			{videoSrc && (
				<VideoPlayer
					src={videoSrc}
					durationMs={entry.durationMs ?? 0}
					preload="metadata"
					aria-label="Recording video"
					onVideoReady={(video) => {
						videoRef.current = video;
					}}
					onLoadedMetadata={applyPendingSeek}
				/>
			)}
			{editorError && (
				<p role="alert" className="mt-3 text-sm text-ds-rec-ink">
					Couldn’t open this recording in the editor. The recording is still saved.
				</p>
			)}
			<Tabs value={tab} onValueChange={setTab}>
				{/* One tab row stays mounted across tabs, so arrow keys keep focus on it. */}
				<AiGuidePanel
					entry={entry}
					onEntryChange={onEntryChange}
					onStatusChange={onGuideStatusChange}
					tabs={tabList}
					selected={tab === "guide"}
					actions={
						<>
							{tab === "guide" && entry.steps && entry.steps.length > 0 && (
								<Button
									ref={pdfButton}
									type="button"
									variant="secondary"
									icon={FileText}
									onClick={() => setPdfOpen(true)}
								>
									{t("showhowPdf.export")}
								</Button>
							)}
							{copyPathButton}
							{(tab === "guide" || (brief.state.hasBrief && brief.state.view !== "making")) && (
								<CopyForAgentButton brief={brief} />
							)}
						</>
					}
				/>
				<TabsContent value="guide" className="mt-0">
					{guideBody}
				</TabsContent>
				<TabsContent value="brief" className="-mt-4">
					<AgentBriefPanel brief={brief} />
				</TabsContent>
			</Tabs>
			<AgentBriefSheets brief={brief} />
			<ExportPdfSheet
				entry={entry}
				open={pdfOpen}
				onOpenChange={setPdfOpen}
				onCloseAutoFocus={(event) => {
					event.preventDefault();
					pdfButton.current?.focus();
				}}
			/>
			{copyStatus !== "idle" && (
				<p role="status" className="mt-2 text-sm text-ds-ink-soft">
					{copyStatus === "copying"
						? "Copying path…"
						: copyStatus === "success"
							? "Path copied"
							: "Couldn't copy path"}
				</p>
			)}
			<details className="mt-6 text-xs text-ds-ink-soft">
				<summary className="cursor-pointer font-ds-label uppercase">Recording folder</summary>
				<p className="mt-2 break-all font-ds-label">{entry.bundleDir}</p>
			</details>
		</div>
	);
}

// ---- missing-doc / regeneration section (issue #27) --------------------------

function MissingDocSection({
	entry,
	docStatus,
	onCreate,
}: {
	entry: RecordingLibraryEntry;
	docStatus: "idle" | "generating" | "failure";
	onCreate: () => void;
}) {
	const { heading, explanation } = getStepCaptureCopy(entry, {
		heading: "No workflow doc yet",
		explanation:
			"Create a workflow doc from this recording's video, transcript, and captured clicks.",
	});

	return (
		<section className="mt-8" aria-label="Workflow document">
			<h2 className="mb-4 font-ds-display text-lg font-semibold">Workflow doc</h2>
			{docStatus === "generating" ? (
				<div
					data-testid="generating-doc-state"
					className="rounded-[8px] border border-ds-line bg-ds-surface-raised p-6"
				>
					<p role="status" className="mb-4 text-sm text-ds-ink-soft">
						Generating workflow doc…
					</p>
					<Progress label="Generating workflow doc" frontier={<Mosaic />} />
				</div>
			) : docStatus === "failure" ? (
				<div
					data-testid="doc-failure-state"
					className="rounded-[8px] border border-ds-rec bg-ds-rec-wash p-6"
				>
					<p className="mb-3 font-medium">Couldn't generate the workflow doc</p>
					<p className="mb-4 text-sm leading-relaxed text-ds-ink-soft">
						The recording, transcript, and any existing steps are safe. Try again to regenerate the
						doc.
					</p>
					<Button variant="secondary" aria-label="Retry" onClick={onCreate}>
						Retry
					</Button>
				</div>
			) : (
				<div
					data-testid="missing-doc-state"
					className="rounded-[8px] border border-ds-line bg-ds-surface-raised p-6"
				>
					<p className="mb-3 font-medium">{heading}</p>
					<p className="mb-4 text-sm leading-relaxed text-ds-ink-soft">{explanation}</p>
					<Button variant="secondary" aria-label="Create workflow doc" onClick={onCreate}>
						Create workflow doc
					</Button>
				</div>
			)}
		</section>
	);
}

function getStepCaptureCopy(
	entry: RecordingLibraryEntry,
	fallback: { heading: string; explanation: string },
) {
	if (entry.stepCapture?.status !== "unavailable") {
		return fallback;
	}

	if (entry.source === "imported")
		return {
			heading: "Click capture unavailable",
			explanation:
				"Imported videos have no captured cursor or clicks. Guides can use narration when speech is available.",
		};
	const { message, reason } = entry.stepCapture;
	const detail = message ?? "Click capture was unavailable for this recording.";
	const frameExtractionFailed =
		reason === "frame-extraction" || /could not be extracted/iu.test(detail);
	if (
		reason === "companion-unpaired" ||
		reason === "companion-disconnected" ||
		entry.source === "browser"
	) {
		return {
			heading:
				reason === "companion-unpaired"
					? "Browser companion unavailable"
					: "Browser companion disconnected",
			explanation: `${detail} The desktop tier fallback is available for this recording.`,
		};
	}
	if (reason === "accessibility-denied") {
		return {
			heading: "Accessibility permission unavailable",
			explanation: `${detail} The transcript-only fallback is available.`,
		};
	}
	if (frameExtractionFailed) {
		return {
			heading: "Click frames unavailable",
			explanation: `${detail} The transcript-only fallback is available.`,
		};
	}
	return {
		heading: "No desktop clicks captured",
		explanation: `${detail} The transcript-only fallback is available.`,
	};
}

function StepCaptureDegradationNotice({ entry }: { entry: RecordingLibraryEntry }) {
	if (entry.stepCapture?.status !== "unavailable") {
		return null;
	}
	const { heading, explanation } = getStepCaptureCopy(entry, {
		heading: "Click capture unavailable",
		explanation: "Workflow steps remain available.",
	});
	return (
		<div
			data-testid="step-capture-degradation-notice"
			className="my-5 rounded-[8px] border border-ds-line bg-ds-surface-sunken p-4 text-sm leading-relaxed text-ds-ink-soft"
		>
			<strong className="text-ds-ink">{heading}. </strong>
			{explanation}
		</div>
	);
}

function TranscriptOnlyDocSection({ entry }: { entry: RecordingLibraryEntry }) {
	const { heading, explanation } = getStepCaptureCopy(entry, {
		heading: "Transcript-only workflow doc",
		explanation: "This workflow doc has no captured click steps.",
	});
	return (
		<section className="mt-8" aria-label="Workflow document">
			<h2 className="mb-4 font-ds-display text-lg font-semibold">Workflow doc</h2>
			<div
				data-testid="transcript-only-doc-state"
				className="rounded-[8px] border border-ds-line bg-ds-surface-sunken p-6"
			>
				<p className="mb-2 font-medium">{heading}</p>
				<p className="text-sm leading-relaxed text-ds-ink-soft">{explanation}</p>
			</div>
		</section>
	);
}

// ---- root component ----------------------------------------------------------

/**
 * RecordingLibrary — sidebar + main panel for issue #22.
 *
 * Loads the local recording list via `window.electronAPI.showhowListRecordings`,
 * renders each valid bundle as a sidebar row (globe = browser, monitor = desktop),
 * highlights the selected bundle with the Final filled row, and renders the
 * approved empty state when no recordings are present.
 */
export function RecordingLibrary() {
	const t = useScopedT("common");
	const [entries, setEntries] = useState<RecordingLibraryEntry[]>([]);
	const [selectedBundleDir, setSelectedBundleDir] = useState<string | null>(null);
	const [query, setQuery] = useState("");
	const [importOpen, setImportOpen] = useState(false);
	const importButton = useRef<HTMLButtonElement>(null);
	const [overview, setOverview] = useState(false);
	// Settings replaces the detail pane; no recording reads as selected while it is open.
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState(false);
	useEffect(() => {
		let active = true;
		window.electronAPI
			.showhowListRecordings()
			.then((result) => {
				if (!active) return;
				setEntries(result);
				setSelectedBundleDir(result[0]?.bundleDir ?? null);
			})
			.catch((error: unknown) => {
				console.error("[RecordingLibrary] failed to load recordings:", error);
				if (active) setLoadError(true);
			})
			.finally(() => {
				if (active) setLoading(false);
			});
		return () => {
			active = false;
		};
	}, []);
	const visibleEntries = filterRecordings(entries, query);
	const activeEntry =
		visibleEntries.find((entry) => entry.bundleDir === selectedBundleDir) ?? visibleEntries[0];
	const onGuideStatusChange = useCallback(
		(bundleDir: string, status: NonNullable<RecordingLibraryEntry["guideStatus"]>) => {
			setEntries((current) =>
				current.map((entry) =>
					entry.bundleDir === bundleDir && entry.guideStatus !== status
						? { ...entry, guideStatus: status }
						: entry,
				),
			);
		},
		[],
	);
	const replaceEntry = (nextEntry: RecordingLibraryEntry) => {
		setEntries((current) =>
			current.map((entry) => (entry.bundleDir === nextEntry.bundleDir ? nextEntry : entry)),
		);
	};
	const updateSteps = (bundleDir: string, steps: RecordingLibraryEntry["steps"]) => {
		setEntries((current) =>
			current.map((entry) => (entry.bundleDir === bundleDir ? { ...entry, steps } : entry)),
		);
	};
	const updateTitle = (bundleDir: string, title: string) => {
		setEntries((current) =>
			current.map((entry) => (entry.bundleDir === bundleDir ? { ...entry, title } : entry)),
		);
	};
	return (
		<Shell
			className="h-screen"
			sidebar={
				<Sidebar
					primary={{ icon: CircleDot, onClick: () => void window.electronAPI.switchToHud() }}
					secondaryAction={
						<Button
							ref={importButton}
							disabled={loading}
							variant="sidebar"
							icon={Upload}
							onClick={() => setImportOpen(true)}
						>
							{t("importVideo.title")}
						</Button>
					}
					onLibrarySelect={() => {
						setSettingsOpen(false);
						setOverview(true);
					}}
					libraryLabel={`Library · ${entries.length}`}
					footer={
						<Button
							variant="sidebar"
							icon={Settings}
							aria-current={settingsOpen ? "page" : undefined}
							className={settingsOpen ? "!bg-ds-on-panel-line" : undefined}
							onClick={() => setSettingsOpen(true)}
						>
							{t("showhowSettings.title")}
						</Button>
					}
				>
					<label className="mb-1 flex items-center gap-2 rounded-[4px] border border-ds-on-panel-line bg-ds-on-panel-wash px-[10px] py-[9px] text-ds-on-panel-soft">
						<Search size={14} aria-hidden="true" />
						<input
							type="search"
							aria-label={t("showhowLibrary.search")}
							placeholder={t("showhowLibrary.search")}
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							className="min-w-0 flex-1 bg-transparent font-ds-body text-[13px] text-ds-on-panel placeholder:text-ds-on-panel-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-ds-accent"
						/>
					</label>

					{loading && (
						<p role="status" className="p-2 text-sm text-ds-on-panel-soft">
							Loading…
						</p>
					)}
					{!loading &&
						visibleEntries.map((entry) => (
							<LibraryRow
								key={entry.bundleDir}
								title={entry.title}
								meta={`${entry.source === "imported" ? t("importVideo.imported") : entry.source === "browser" ? "Browser" : "Desktop"}${entry.durationMs === undefined ? "" : ` · ${formatDuration(entry.durationMs)}`}`}
								trailing={
									<Tag
										variant={
											entry.guideStatus === "ready"
												? "accent"
												: entry.guideStatus === "failed"
													? "failed"
													: "neutral"
										}
									>
										{t(`showhowLibrary.${entry.guideStatus ?? "none"}`)}
									</Tag>
								}
								processing={entry.guideStatus === "making" ? <Mosaic /> : undefined}
								selected={!overview && !settingsOpen && entry.bundleDir === activeEntry?.bundleDir}
								onSelect={() => {
									setSettingsOpen(false);
									setOverview(false);
									setSelectedBundleDir(entry.bundleDir);
								}}
							/>
						))}
					{!loading && loadError && (
						<p className="p-2 text-sm text-ds-on-panel-soft">Couldn't load recordings.</p>
					)}
					{!loading && !loadError && entries.length === 0 && (
						<p className="p-2 text-sm text-ds-on-panel-soft">
							No recordings yet. Start one to see it here.
						</p>
					)}
				</Sidebar>
			}
		>
			<ImportVideoSheet
				open={importOpen}
				onOpenChange={setImportOpen}
				onCloseAutoFocus={(event) => {
					event.preventDefault();
					importButton.current?.focus();
				}}
				onImported={(entry) => {
					setEntries((current) => [
						entry,
						...current.filter((item) => item.bundleDir !== entry.bundleDir),
					]);
					setSelectedBundleDir(entry.bundleDir);
					setQuery("");
					setOverview(false);
					setSettingsOpen(false);
					setLoadError(false);
				}}
			/>
			<div className="mx-auto max-w-[928px] px-6 pb-16 pt-14 min-[1100px]:px-[54px]">
				{settingsOpen ? (
					<SettingsView />
				) : (
					<>
						{loading && (
							<div
								role="status"
								className="flex min-h-[420px] flex-col items-center justify-center gap-5"
							>
								<div className="h-[200px] w-full max-w-[440px] overflow-hidden rounded-[8px]">
									<Mosaic />
								</div>
								<h1 className="font-ds-display text-[32px] font-semibold">
									{t("showhowLibrary.loading")}
								</h1>
								<p className="text-ds-ink-soft">{t("showhowLibrary.finding")}</p>
							</div>
						)}
						{!loading && loadError && <ErrorLibraryState />}
						{!loading && !loadError && entries.length === 0 && <EmptyLibraryState />}
						{!loading && !loadError && entries.length > 0 && visibleEntries.length === 0 && (
							<div className="flex min-h-[420px] flex-col items-center justify-center gap-4 text-center">
								<h1 className="font-ds-display text-[32px] font-semibold">
									{t("showhowLibrary.noResults")}
								</h1>
								<p className="max-w-full break-words text-ds-ink-soft">
									{t("showhowLibrary.noMatch", { query })}
								</p>
								<Button variant="secondary" onClick={() => setQuery("")}>
									{t("showhowLibrary.clear")}
								</Button>
							</div>
						)}
						{!loading && !loadError && activeEntry && overview && (
							<div className="flex min-h-[520px] flex-col items-center justify-center gap-5 [&>div]:bg-transparent [&_h3]:text-[32px]">
								<div className="h-[200px] w-full max-w-[440px] overflow-hidden rounded-[8px]">
									<Mosaic />
								</div>
								<EmptyState title={t("showhowLibrary.pick")} body={t("showhowLibrary.pickBody")} />
							</div>
						)}
						{!loading && !loadError && activeEntry && !overview && (
							<RecordingDetail
								key={activeEntry.bundleDir}
								entry={activeEntry}
								onEntryChange={replaceEntry}
								onTitleChange={updateTitle}
								onStepsChange={updateSteps}
								onGuideStatusChange={onGuideStatusChange}
							/>
						)}
					</>
				)}
			</div>
		</Shell>
	);
}
