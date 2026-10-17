import { useEffect, useRef, useState } from "react";
import { AiGuidePanel } from "@/components/showhow/AiGuidePanel";
import { AiGuideSettings } from "@/components/showhow/AiGuideSettings";
import type { RecordingLibraryEntry } from "@/lib/showhow/recordingLibrary";
import type { WorkflowDocumentUpdate } from "@/lib/showhow/workflowDocument";

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

// ---- icons -------------------------------------------------------------------

function GlobeIcon({ color }: { color: string }) {
	return (
		<svg
			width="15"
			height="15"
			viewBox="0 0 24 24"
			fill="none"
			stroke={color}
			strokeWidth="2.75"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<circle cx="12" cy="12" r="9" />
			<path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
		</svg>
	);
}

function MonitorIcon({ color }: { color: string }) {
	return (
		<svg
			width="15"
			height="15"
			viewBox="0 0 24 24"
			fill="none"
			stroke={color}
			strokeWidth="2.75"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<rect x="3" y="4" width="18" height="13" rx="2" />
			<path d="M8 21h8M12 17v4" />
		</svg>
	);
}

// ---- sidebar entry -----------------------------------------------------------

interface LibraryRowProps {
	entry: RecordingLibraryEntry;
	isActive: boolean;
	onSelect: () => void;
}

function LibraryRow({ entry, isActive, onSelect }: LibraryRowProps) {
	const iconColor = isActive ? "var(--sh-color-accent)" : "var(--sh-muted)";
	const sourceLabel = entry.source === "browser" ? "Browser" : "Desktop";
	const duration = entry.durationMs !== undefined ? formatDuration(entry.durationMs) : "";
	const subtitle = duration ? `${sourceLabel} · ${duration}` : sourceLabel;

	return (
		<button
			type="button"
			onClick={onSelect}
			aria-pressed={isActive}
			style={{
				display: "flex",
				alignItems: "center",
				gap: "10px",
				padding: "9px 8px",
				borderRadius: "var(--sh-radius-md)",
				cursor: "pointer",
				background: isActive ? "var(--sh-color-accent-100)" : "transparent",
				border: "none",
				width: "100%",
				textAlign: "left",
			}}
		>
			<span
				style={{
					width: "26px",
					height: "26px",
					flex: "none",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				{entry.source === "browser" ? (
					<GlobeIcon color={iconColor} />
				) : (
					<MonitorIcon color={iconColor} />
				)}
			</span>
			<span style={{ minWidth: 0, flex: 1 }}>
				<span
					style={{
						display: "block",
						fontSize: "13.5px",
						fontWeight: 600,
						color: "var(--sh-color-text)",
						whiteSpace: "nowrap",
						overflow: "hidden",
						textOverflow: "ellipsis",
					}}
				>
					{entry.title}
				</span>
				<span
					style={{
						display: "block",
						fontSize: "11.5px",
						color: "var(--sh-muted)",
						marginTop: "2px",
					}}
				>
					{subtitle}
				</span>
			</span>
		</button>
	);
}

// ---- empty state (no recordings in the library) ------------------------------

function EmptyLibraryState() {
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				textAlign: "center",
				gap: "16px",
				padding: "120px 40px",
				borderRadius: "var(--sh-radius-lg)",
				background: "var(--sh-card-bg)",
			}}
			data-testid="empty-library-state"
		>
			<div
				style={{
					width: "60px",
					height: "60px",
					borderRadius: "50%",
					background: "var(--sh-color-accent-100)",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<svg
					width="26"
					height="26"
					viewBox="0 0 24 24"
					fill="none"
					stroke="var(--sh-color-accent-700)"
					strokeWidth="2.75"
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden="true"
				>
					<rect x="3" y="4" width="18" height="13" rx="2" />
					<path d="M8 21h8M12 17v4" />
					<circle cx="12" cy="10.5" r="3" />
				</svg>
			</div>
			<h3 style={{ margin: 0, fontSize: "23px", color: "var(--sh-color-text)" }}>
				No recordings yet
			</h3>
			<p
				style={{
					margin: 0,
					maxWidth: "360px",
					fontSize: "14.5px",
					color: "var(--sh-muted)",
					lineHeight: 1.6,
				}}
			>
				Record a browser tab or your whole desktop, and it&apos;ll show up here as a folder — video,
				transcript and screenshots ready to turn into a doc.
			</p>
		</div>
	);
}

function ErrorLibraryState() {
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				textAlign: "center",
				gap: "16px",
				padding: "120px 40px",
				borderRadius: "var(--sh-radius-lg)",
				background: "var(--sh-card-bg)",
			}}
			data-testid="recording-library-error-state"
		>
			<h3 style={{ margin: 0, fontSize: "23px", color: "var(--sh-color-text)" }}>
				Couldn&apos;t load recordings
			</h3>
			<p
				style={{
					margin: 0,
					maxWidth: "360px",
					fontSize: "14.5px",
					color: "var(--sh-muted)",
					lineHeight: 1.6,
				}}
			>
				Check folder permissions or disk access, then reopen the library.
			</p>
		</div>
	);
}

// ---- main panel (active recording detail) -----------------------------------

function RecordingDetail({
	entry,
	onEntryChange,
	onTitleChange,
}: {
	entry: RecordingLibraryEntry;
	onEntryChange: (entry: RecordingLibraryEntry) => void;
	onTitleChange: (bundleDir: string, title: string) => void;
}) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const [pendingSeekMs, setPendingSeekMs] = useState<number | null>(null);
	const [editingTitle, setEditingTitle] = useState(false);
	const [titleDraft, setTitleDraft] = useState(entry.title);
	const [titleStatus, setTitleStatus] = useState<"idle" | "saving" | "success" | "failure">("idle");
	const [editorError, setEditorError] = useState(false);
	const [copyStatus, setCopyStatus] = useState<"idle" | "copying" | "success" | "failure">("idle");
	const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);
	const [instructionDraft, setInstructionDraft] = useState("");
	const [revealedSteps, setRevealedSteps] = useState<Set<number>>(() => new Set());
	const [docStatus, setDocStatus] = useState<"idle" | "generating" | "failure">("idle");
	const isMountedRef = useRef(true);
	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);
	const isDesktop = entry.source === "desktop";
	const sourceLabel = isDesktop ? "Desktop" : "Browser";
	const sourceTagStyle: React.CSSProperties = {
		fontSize: "12px",
		fontWeight: 600,
		color: isDesktop ? "var(--sh-color-accent-2-700)" : "var(--sh-color-accent-700)",
		background: isDesktop ? "var(--sh-color-accent-2-100)" : "var(--sh-color-accent-100)",
		padding: "3px 10px",
		borderRadius: "999px",
	};
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
		const result = await window.electronAPI.showhowUpdateWorkflowDocument(entry.bundleDir, update);
		if (result.success) onEntryChange(nextEntry);
		return result.success;
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

	return (
		<div>
			<div
				style={{
					display: "flex",
					alignItems: "flex-start",
					justifyContent: "space-between",
					gap: "16px",
					marginBottom: "8px",
				}}
			>
				{editingTitle ? (
					<>
						<input
							aria-label="Recording title"
							value={titleDraft}
							onChange={(event) => setTitleDraft(event.target.value)}
							onKeyDown={(event) => {
								if (event.key === "Enter") void saveTitle();
								if (event.key === "Escape") cancelTitleEdit();
							}}
							autoFocus
							style={{ fontSize: "30px", flex: 1 }}
						/>
						<div style={{ display: "flex", gap: "8px" }}>
							<button
								type="button"
								aria-label="Save title"
								disabled={titleStatus === "saving"}
								onClick={() => void saveTitle()}
							>
								Save
							</button>
							<button
								type="button"
								aria-label="Cancel title edit"
								disabled={titleStatus === "saving"}
								onClick={cancelTitleEdit}
							>
								Cancel
							</button>
						</div>
					</>
				) : (
					<h1 style={{ fontSize: "30px", margin: 0, color: "var(--sh-color-text)", flex: 1 }}>
						{entry.title}
					</h1>
				)}
				{!editingTitle && (
					<button
						type="button"
						aria-label="Edit title"
						onClick={() => {
							setTitleDraft(entry.title);
							setTitleStatus("idle");
							setEditingTitle(true);
						}}
					>
						Edit
					</button>
				)}
			</div>
			{titleStatus !== "idle" && (
				<p role="status" style={{ margin: "0 0 12px", color: "var(--sh-muted)", fontSize: "13px" }}>
					{titleStatus === "saving"
						? "Saving title…"
						: titleStatus === "success"
							? "Title saved"
							: "Couldn't save title"}
				</p>
			)}

			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: "8px",
					marginBottom: "18px",
					flexWrap: "wrap",
				}}
			>
				<span style={sourceTagStyle}>{sourceLabel} recording</span>
				<span style={{ color: "var(--sh-muted)", fontSize: "13px" }}>·</span>
				<span style={{ fontSize: "13px", color: "var(--sh-muted)" }}>
					{formatWhen(entry.createdAt)}
				</span>
				{entry.durationMs !== undefined && (
					<>
						<span style={{ color: "var(--sh-muted)", fontSize: "13px" }}>·</span>
						<span style={{ fontSize: "13px", color: "var(--sh-muted)" }}>
							{formatDuration(entry.durationMs)}
						</span>
					</>
				)}
			</div>

			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: "10px",
					padding: "10px 14px",
					borderRadius: "var(--sh-radius-md)",
					background: "var(--sh-card-bg)",
				}}
			>
				<svg
					width="15"
					height="15"
					viewBox="0 0 24 24"
					fill="none"
					stroke="var(--sh-muted)"
					strokeWidth="2.75"
					strokeLinecap="round"
					strokeLinejoin="round"
					style={{ flex: "none" }}
					aria-hidden="true"
				>
					<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
				</svg>
				<div
					style={{
						flex: 1,
						minWidth: 0,
						fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
						fontSize: "12.5px",
						color: "var(--sh-muted)",
						whiteSpace: "nowrap",
						overflow: "hidden",
						textOverflow: "ellipsis",
					}}
				>
					{entry.bundleDir}
				</div>
				{entry.video && (
					<button
						type="button"
						onClick={() => void openInEditor()}
						style={{
							border: "1px solid var(--sh-color-divider)",
							borderRadius: "8px",
							background: "transparent",
							color: "var(--sh-color-text)",
							padding: "6px 9px",
							fontSize: "12px",
							fontWeight: 600,
							cursor: "pointer",
							whiteSpace: "nowrap",
						}}
					>
						Open in editor
					</button>
				)}
				<button
					type="button"
					disabled={copyStatus === "copying"}
					onClick={() => void copyPath()}
					style={{
						border: "1px solid var(--sh-color-divider)",
						borderRadius: "8px",
						background: "transparent",
						color: "var(--sh-color-text)",
						padding: "6px 9px",
						fontSize: "12px",
						fontWeight: 600,
						cursor: "pointer",
						whiteSpace: "nowrap",
					}}
				>
					{copyStatus === "copying" ? "Copying…" : "Copy path"}
				</button>
			</div>
			{editorError && (
				<p role="alert">
					Couldn’t open this recording in the editor. The recording is still saved.
				</p>
			)}
			{copyStatus !== "idle" && (
				<p role="status" style={{ margin: "8px 0 0", color: "var(--sh-muted)", fontSize: "13px" }}>
					{copyStatus === "copying"
						? "Copying path…"
						: copyStatus === "success"
							? "Path copied"
							: "Couldn't copy path"}
				</p>
			)}

			{videoSrc && (
				<video
					ref={videoRef}
					src={videoSrc}
					controls
					preload="metadata"
					onLoadedMetadata={applyPendingSeek}
					style={{
						width: "100%",
						marginTop: "28px",
						borderRadius: "var(--sh-radius-lg)",
						background: "#171916",
						display: "block",
					}}
				>
					<track kind="captions" />
				</video>
			)}

			<AiGuidePanel entry={entry} onEntryChange={onEntryChange} />

			{entry.steps && entry.steps.length > 0 && <StepCaptureDegradationNotice entry={entry} />}

			{entry.steps && entry.steps.length > 0 ? (
				<section style={{ marginTop: "40px" }} aria-label="Workflow steps">
					<h2 style={{ fontSize: "20px", margin: "0 0 18px", color: "var(--sh-color-text)" }}>
						Steps
					</h2>
					<ol
						style={{
							display: "flex",
							flexDirection: "column",
							gap: "20px",
							margin: 0,
							padding: 0,
							listStyle: "none",
						}}
					>
						{entry.steps.map((step, index) => {
							const screenshotSrc =
								step.screenshot === ""
									? undefined
									: (step.screenshotUrl ??
										fallbackBundleUrl(entry.bundleDir, `screenshots/${step.screenshot}`));
							return (
								<li
									key={`${step.ts}-${step.screenshot}`}
									style={{
										display: "grid",
										gridTemplateColumns: "36px minmax(0, 1fr)",
										gap: "14px",
										padding: "18px",
										borderRadius: "var(--sh-radius-lg)",
										background: "var(--sh-card-bg)",
									}}
								>
									<span
										style={{
											width: "28px",
											height: "28px",
											borderRadius: "50%",
											background: "var(--sh-color-accent-100)",
											color: "var(--sh-color-accent-700)",
											display: "grid",
											placeItems: "center",
											fontWeight: 700,
											fontSize: "13px",
										}}
									>
										{index + 1}
									</span>
									<div style={{ minWidth: 0 }}>
										{screenshotSrc && (
											<img
												src={screenshotSrc}
												alt={`Step ${index + 1}: ${step.label}`}
												style={{
													width: "100%",
													display: "block",
													borderRadius: "var(--sh-radius-md)",
													marginBottom: "12px",
												}}
											/>
										)}
										<div
											style={{
												display: "flex",
												alignItems: "center",
												justifyContent: "space-between",
												gap: "12px",
											}}
										>
											<div style={{ minWidth: 0, flex: 1 }}>
												{editingStepIndex === index ? (
													<input
														aria-label={`Step ${index + 1} instruction`}
														value={instructionDraft}
														onChange={(event) => setInstructionDraft(event.target.value)}
														onKeyDown={(event) => {
															if (event.key === "Enter") void saveStep(index);
															if (event.key === "Escape") setEditingStepIndex(null);
														}}
														autoFocus
													/>
												) : (
													<p style={{ margin: 0, fontSize: "15px", fontWeight: 600 }}>
														{step.redaction && !revealedSteps.has(index)
															? "Sensitive text hidden"
															: step.label}
													</p>
												)}
												<div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
													<button
														type="button"
														aria-label={`Edit step ${index + 1}`}
														disabled={step.redaction && !revealedSteps.has(index)}
														onClick={() => {
															setInstructionDraft(step.label);
															setEditingStepIndex(index);
														}}
													>
														Edit
													</button>
													<button
														type="button"
														aria-label={`Delete step ${index + 1}`}
														onClick={() => void deleteStep(index)}
													>
														Delete
													</button>
													{step.redaction && (
														<button
															type="button"
															aria-label={`Reveal step ${index + 1} text`}
															onClick={() =>
																setRevealedSteps((current) => new Set(current).add(index))
															}
														>
															Reveal
														</button>
													)}
												</div>
												{step.redaction && revealedSteps.has(index) && (
													<label>
														<input
															type="checkbox"
															checked={step.includeRevealedText === true}
															onChange={(event) => {
																const includeRevealedText = event.target.checked;
																const steps = entry.steps?.map((current, stepIndex) =>
																	stepIndex === index
																		? { ...current, includeRevealedText }
																		: current,
																);
																if (steps) {
																	void persist(
																		{ type: "step", index, includeRevealedText },
																		{ ...entry, steps },
																	);
																}
															}}
														/>
														Include revealed text in steps.md
													</label>
												)}
											</div>
											<button
												type="button"
												onClick={() => seekToStep(step.ts)}
												style={{
													border: "none",
													borderRadius: "999px",
													background: "var(--sh-color-accent-100)",
													color: "var(--sh-color-accent-700)",
													padding: "5px 9px",
													fontWeight: 700,
													fontSize: "12px",
													cursor: "pointer",
												}}
											>
												{formatDuration(step.ts)}
											</button>
										</div>
									</div>
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
		<section style={{ marginTop: "40px" }} aria-label="Workflow document">
			<h2 style={{ fontSize: "20px", margin: "0 0 18px", color: "var(--sh-color-text)" }}>
				Workflow doc
			</h2>
			{docStatus === "generating" ? (
				<div
					data-testid="generating-doc-state"
					style={{
						padding: "28px 24px",
						borderRadius: "var(--sh-radius-lg)",
						background: "var(--sh-card-bg)",
						color: "var(--sh-muted)",
						fontSize: "14.5px",
					}}
				>
					Generating workflow doc…
				</div>
			) : docStatus === "failure" ? (
				<div
					data-testid="doc-failure-state"
					style={{
						padding: "28px 24px",
						borderRadius: "var(--sh-radius-lg)",
						background: "var(--sh-card-bg)",
					}}
				>
					<p
						style={{
							margin: "0 0 14px",
							fontSize: "15px",
							fontWeight: 600,
							color: "var(--sh-color-text)",
						}}
					>
						Couldn&apos;t generate the workflow doc
					</p>
					<p
						style={{
							margin: "0 0 18px",
							fontSize: "14.5px",
							color: "var(--sh-muted)",
							lineHeight: 1.6,
						}}
					>
						The recording, transcript, and any existing steps are safe. Try again to regenerate the
						doc.
					</p>
					<button
						type="button"
						aria-label="Retry"
						onClick={onCreate}
						style={{
							border: "1px solid var(--sh-color-divider)",
							borderRadius: "8px",
							background: "transparent",
							color: "var(--sh-color-text)",
							padding: "8px 14px",
							fontSize: "13px",
							fontWeight: 600,
							cursor: "pointer",
						}}
					>
						Retry
					</button>
				</div>
			) : (
				<div
					data-testid="missing-doc-state"
					style={{
						padding: "28px 24px",
						borderRadius: "var(--sh-radius-lg)",
						background: "var(--sh-card-bg)",
					}}
				>
					<p
						style={{
							margin: "0 0 8px",
							fontSize: "15px",
							fontWeight: 600,
							color: "var(--sh-color-text)",
						}}
					>
						{heading}
					</p>
					<p
						style={{
							margin: "0 0 18px",
							fontSize: "14.5px",
							color: "var(--sh-muted)",
							lineHeight: 1.6,
							maxWidth: "560px",
						}}
					>
						{explanation}
					</p>
					<button
						type="button"
						aria-label="Create workflow doc"
						onClick={onCreate}
						style={{
							border: "1px solid var(--sh-color-divider)",
							borderRadius: "8px",
							background: "transparent",
							color: "var(--sh-color-text)",
							padding: "8px 14px",
							fontSize: "13px",
							fontWeight: 600,
							cursor: "pointer",
						}}
					>
						Create workflow doc
					</button>
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
			style={{
				marginTop: "28px",
				padding: "14px 18px",
				borderRadius: "var(--sh-radius-md)",
				background: "var(--sh-card-bg)",
				color: "var(--sh-muted)",
				fontSize: "14px",
				lineHeight: 1.6,
			}}
		>
			<strong style={{ color: "var(--sh-color-text)" }}>{heading}. </strong>
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
		<section style={{ marginTop: "40px" }} aria-label="Workflow document">
			<h2 style={{ fontSize: "20px", margin: "0 0 18px", color: "var(--sh-color-text)" }}>
				Workflow doc
			</h2>
			<div
				data-testid="transcript-only-doc-state"
				style={{
					padding: "28px 24px",
					borderRadius: "var(--sh-radius-lg)",
					background: "var(--sh-card-bg)",
				}}
			>
				<p style={{ margin: "0 0 8px", fontSize: "15px", fontWeight: 600 }}>{heading}</p>
				<p style={{ margin: 0, fontSize: "14.5px", color: "var(--sh-muted)", lineHeight: 1.6 }}>
					{explanation}
				</p>
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
 * highlights the active row with the accent-100 background, and renders the
 * approved empty state when no recordings are present.
 */
export function RecordingLibrary() {
	const [entries, setEntries] = useState<RecordingLibraryEntry[]>([]);
	const [activeIndex, setActiveIndex] = useState(0);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState(false);

	useEffect(() => {
		window.electronAPI
			.showhowListRecordings()
			.then((result) => {
				setEntries(result);
				setActiveIndex(0);
				setLoadError(false);
			})
			.catch((err: unknown) => {
				console.error("[RecordingLibrary] failed to load recordings:", err);
				setEntries([]);
				setLoadError(true);
			})
			.finally(() => {
				setLoading(false);
			});
	}, []);

	const hasRecordings = entries.length > 0;
	const activeEntry = hasRecordings ? entries[activeIndex] : null;
	const replaceEntry = (nextEntry: RecordingLibraryEntry) => {
		setEntries((current) =>
			current.map((entry) => (entry.bundleDir === nextEntry.bundleDir ? nextEntry : entry)),
		);
	};
	const updateTitle = (bundleDir: string, title: string) => {
		setEntries((current) =>
			current.map((entry) => (entry.bundleDir === bundleDir ? { ...entry, title } : entry)),
		);
	};

	return (
		<div
			style={{
				display: "flex",
				height: "100vh",
				background: "var(--sh-color-bg)",
				color: "var(--sh-color-text)",
			}}
		>
			{/* ---- sidebar ---- */}
			<div
				style={{
					width: "272px",
					flex: "none",
					height: "100vh",
					display: "flex",
					flexDirection: "column",
					gap: "28px",
					padding: "26px 18px",
					background: "var(--sh-sidebar-bg)",
					borderRight: "1px solid var(--sh-color-divider)",
				}}
			>
				{/* wordmark */}
				<div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "0 8px" }}>
					<div
						style={{
							width: "32px",
							height: "32px",
							borderRadius: "10px",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							flex: "none",
							backgroundColor: "#8CB7A2",
						}}
					>
						<svg width="15" height="15" viewBox="0 0 24 24" fill="#FFFCF7" aria-hidden="true">
							<path d="M8 5v14l11-7z" />
						</svg>
					</div>
					<span
						style={{
							fontFamily: "var(--sh-font-heading)",
							fontSize: "19px",
							color: "var(--sh-color-text)",
						}}
					>
						Showhow
					</span>
				</div>

				<button
					type="button"
					onClick={() => window.electronAPI.switchToHud()}
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						gap: "8px",
						width: "100%",
						padding: "11px 14px",
						border: "none",
						borderRadius: "10px",
						background: "var(--sh-color-accent)",
						color: "white",
						fontFamily: "var(--sh-font-body)",
						fontSize: "13px",
						fontWeight: 700,
						cursor: "pointer",
					}}
				>
					New recording
				</button>

				{/* library list */}
				<div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
					<div
						style={{
							fontSize: "11px",
							letterSpacing: "0.09em",
							textTransform: "uppercase",
							color: "var(--sh-muted)",
							padding: "0 8px",
							marginBottom: "6px",
						}}
					>
						Library
					</div>

					{loading && (
						<div style={{ padding: "14px 8px", fontSize: "12.5px", color: "var(--sh-muted)" }}>
							Loading…
						</div>
					)}

					{!loading &&
						hasRecordings &&
						entries.map((entry, index) => (
							<LibraryRow
								key={entry.bundleDir}
								entry={entry}
								isActive={index === activeIndex}
								onSelect={() => setActiveIndex(index)}
							/>
						))}

					{!loading && loadError && (
						<div
							style={{
								padding: "14px 8px",
								fontSize: "12.5px",
								color: "var(--sh-muted)",
								lineHeight: 1.6,
							}}
						>
							Couldn&apos;t load recordings.
						</div>
					)}

					{!loading && !loadError && !hasRecordings && (
						<div
							style={{
								padding: "14px 8px",
								fontSize: "12.5px",
								color: "var(--sh-muted)",
								lineHeight: 1.6,
							}}
						>
							No recordings yet. Start one to see it here.
						</div>
					)}
				</div>

				<AiGuideSettings />

				<button
					type="button"
					onClick={() => window.electronAPI.switchToHud()}
					style={{
						marginTop: "auto",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						gap: "8px",
						width: "100%",
						padding: "10px 14px",
						border: "1px solid var(--sh-color-divider)",
						borderRadius: "10px",
						background: "var(--sh-card-bg)",
						color: "var(--sh-color-text)",
						fontFamily: "var(--sh-font-body)",
						fontSize: "13px",
						fontWeight: 600,
						cursor: "pointer",
					}}
				>
					<svg
						width="15"
						height="15"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2.25"
						strokeLinecap="round"
						strokeLinejoin="round"
						aria-hidden="true"
					>
						<path d="m15 18-6-6 6-6" />
					</svg>
					Back to recorder
				</button>
			</div>

			{/* ---- main panel ---- */}
			<div style={{ flex: 1, height: "100vh", overflowY: "auto" }}>
				<div style={{ maxWidth: "820px", margin: "0 auto", padding: "60px 40px 120px" }}>
					{!loading && loadError && <ErrorLibraryState />}
					{!loading && !loadError && !hasRecordings && <EmptyLibraryState />}
					{!loading && !loadError && activeEntry && (
						<RecordingDetail
							key={activeEntry.bundleDir}
							entry={activeEntry}
							onEntryChange={replaceEntry}
							onTitleChange={updateTitle}
						/>
					)}
				</div>
			</div>
		</div>
	);
}
