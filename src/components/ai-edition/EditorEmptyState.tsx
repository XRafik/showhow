// Empty state for the editor's preview.
//
// Import video + load project + drag/drop on top of the project store: a
// "no project" branch offers `createProject` + `loadProject`, and a
// "has project, no asset" branch offers the file picker + load (for the rare
// user who already has a .openscreen project without media attached).
//
// ponytail: the actions map to project-store operations rather than the
// `nativeBridgeClient.project.*` ones, which this shell no longer uses. The
// deprecated editor and its own `EditorEmptyState` were deleted in 1320121d,
// so this is the single render path for the feature.

import { AlertCircle, Circle, Film, FolderOpen, Library, Play, Upload, X } from "lucide-react";
import { useCallback, useId, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useI18n, useScopedT } from "@/contexts/I18nContext";
import {
	migrateProjectDataToAxcutDocument,
	migrateRawDocumentToCurrent,
} from "@/lib/ai-edition/document/migrate";
import { documentSchema } from "@/lib/ai-edition/schema";
import { useProjectStore } from "@/lib/ai-edition/store/projectStore";
import { nativeBridgeClient } from "@/native";
import type { AiEditionProjectSummary } from "@/native/contracts";
import styles from "./NewEditorShell.module.css";

type DropError = "unsupported-format" | "load-failed" | null;

interface EditorEmptyStateProps {
	/** True when a project exists (so the copy becomes "add a video" not "no project"). */
	hasProject: boolean;
	/** Switches the editor to its Record mode: Editor-06 offers it beside importing a video. */
	onRecord?: () => void;
	/** Editor-06's Open library: back to the Library window. Absent, the button is not drawn. */
	onOpenLibrary?: () => void;
	/** Editor-06's Recent list, newest first as the store lists them. */
	recentProjects?: readonly AiEditionProjectSummary[];
	onOpenRecent?: (projectId: string) => void;
}

export function EditorEmptyState({
	hasProject,
	onRecord,
	onOpenLibrary,
	recentProjects = [],
	onOpenRecent,
}: EditorEmptyStateProps) {
	const t = useScopedT("editor");
	const tc = useScopedT("common");
	const { locale } = useI18n();
	const titleId = useId();
	const recentId = useId();
	// "Today", "Yesterday", else a short date in the app's language (Editor-06 "22 SEP").
	const recentWhen = (iso: string) => {
		const when = new Date(iso);
		if (Number.isNaN(when.getTime())) return "";
		const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
		const daysAgo = Math.round((day(new Date()) - day(when)) / 86_400_000);
		if (daysAgo === 0) return t("noProjectOpen.today");
		if (daysAgo === 1) return t("noProjectOpen.yesterday");
		return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(when);
	};
	const [isDraggingOver, setIsDraggingOver] = useState(false);
	const [dropError, setDropError] = useState<DropError>(null);
	const lastDropErrorRef = useRef<Exclude<DropError, null>>("unsupported-format");
	if (dropError !== null) {
		lastDropErrorRef.current = dropError;
	}

	const createProject = useProjectStore((s) => s.createProject);
	const addAsset = useProjectStore((s) => s.addAsset);
	const loadProject = useProjectStore((s) => s.loadProject);

	const ensureProject = useCallback(async (): Promise<string | null> => {
		const existing = useProjectStore.getState().projectId;
		if (existing) return existing;
		const doc = await createProject(`Project ${new Date().toLocaleString()}`);
		return doc.project.id;
	}, [createProject]);

	const handleImportVideo = useCallback(async () => {
		const result = await window.electronAPI?.openVideoFilePicker?.();
		if (!result || result.canceled || !result.success || !result.path) return;
		try {
			const projectId = await ensureProject();
			if (!projectId) return;
			const label = result.name || result.path.split(/[\\/]/).pop() || "Recording";
			await addAsset(result.path, label);
		} catch (err) {
			setDropError("load-failed");
			// ponytail: surface as a console message only — the dialog above
			// already tells the user something went wrong.
			console.error("Failed to import video", err);
		}
	}, [addAsset, ensureProject]);

	// A loaded project JSON is either a current AxcutDocument (has its own
	// `schemaVersion`) or a legacy EditorProjectData that must be migrated.
	// Discriminate on the version field so a current document is never fed to
	// the legacy migrator (which reads `.media`/`.editor` and would yield an
	// empty doc). Returns true once the project is saved and loaded.
	const openLoadedProject = useCallback(
		async (raw: unknown): Promise<boolean> => {
			const isAxcutDocument =
				typeof raw === "object" && raw !== null && "schemaVersion" in raw && "timeline" in raw;
			const doc = isAxcutDocument
				? documentSchema.parse(migrateRawDocumentToCurrent(raw)) // disk-load: upgrade v3/v4 → v5, then validate
				: migrateProjectDataToAxcutDocument(raw as never);
			const saved = await nativeBridgeClient.aiEdition.save(doc);
			if (!saved.success || !saved.document) return false;
			await loadProject(doc.project.id);
			return true;
		},
		[loadProject],
	);

	const handleLoadProject = useCallback(async () => {
		try {
			const result = await window.electronAPI?.loadProjectFile?.();
			if (!result?.success || !result.project) return;
			if (!(await openLoadedProject(result.project))) {
				setDropError("load-failed");
			}
		} catch {
			setDropError("load-failed");
		}
	}, [openLoadedProject]);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		if (e.dataTransfer.items.length > 0) {
			setIsDraggingOver(true);
		}
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		if (!e.currentTarget.contains(e.relatedTarget as Node)) {
			setIsDraggingOver(false);
		}
	}, []);

	const handleDrop = useCallback(
		async (e: React.DragEvent) => {
			e.preventDefault();
			setIsDraggingOver(false);
			const files = Array.from(e.dataTransfer.files);
			if (files.length === 0) return;
			const projectFile = files.find((f) => /\.(showhow|openscreen)$/i.test(f.name));
			if (!projectFile) {
				setDropError("unsupported-format");
				return;
			}
			let filePath: string;
			try {
				filePath = window.electronAPI?.getPathForFile(projectFile) ?? "";
			} catch {
				setDropError("load-failed");
				return;
			}
			if (!filePath) {
				setDropError("load-failed");
				return;
			}
			const result = await window.electronAPI?.loadProjectFileFromPath?.(filePath);
			if (!result?.success || !result.project) {
				setDropError("load-failed");
				return;
			}
			try {
				if (!(await openLoadedProject(result.project))) {
					setDropError("load-failed");
				}
			} catch {
				setDropError("load-failed");
			}
		},
		[openLoadedProject],
	);

	return (
		<div
			className={styles.previewEmptyDrop}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
		>
			{isDraggingOver ? (
				<div className={styles.previewEmptyDropOverlay}>
					<Upload className={styles.previewEmptyDropIcon} />
					<p className={styles.previewEmptyDropLabel}>{t("emptyState.dropOverlay")}</p>
				</div>
			) : null}

			<Dialog open={dropError !== null} onOpenChange={(open) => !open && setDropError(null)}>
				<DialogContent className={styles.previewEmptyDialog}>
					<DialogHeader className={styles.previewEmptyDialogHeader}>
						<div className={styles.previewEmptyDialogHeaderInner}>
							<img
								src="./showhow.png"
								alt=""
								aria-hidden="true"
								className={styles.previewEmptyDialogLogo}
							/>
							<DialogTitle className={styles.previewEmptyDialogTitle}>
								{lastDropErrorRef.current === "unsupported-format"
									? t("emptyState.dropErrors.unsupportedFormatTitle")
									: t("emptyState.dropErrors.couldNotOpenTitle")}
							</DialogTitle>
						</div>
					</DialogHeader>
					<div className={styles.previewEmptyDialogBody}>
						<div className={styles.previewEmptyDialogIcon}>
							<AlertCircle className={styles.previewEmptyDialogAlertIcon} />
						</div>
						<p className={styles.previewEmptyDialogMessage}>
							{lastDropErrorRef.current === "unsupported-format"
								? t("emptyState.dropErrors.unsupportedFormatMessage")
								: t("emptyState.dropErrors.couldNotOpenMessage")}
						</p>
					</div>
					<button
						type="button"
						onClick={() => setDropError(null)}
						className={styles.previewEmptyDialogClose}
					>
						<X className={styles.previewEmptyDialogCloseIcon} />
						{tc("actions.close")}
					</button>
				</DialogContent>
			</Dialog>

			{hasProject ? (
				// A project that only lacks media: import leads, and the drop zone still opens a file.
				<div className={styles.previewEmptyInner}>
					<img src="./showhow.png" alt="" aria-hidden="true" className={styles.previewEmptyLogo} />
					<div className={styles.previewEmptyHeading}>
						<h2 className={styles.previewEmptyTitle}>{t("emptyState.titleHasAsset")}</h2>
						<p className={styles.previewEmptyDescription}>{t("emptyState.descriptionHasAsset")}</p>
					</div>
					<div className={styles.previewEmptyActions}>
						<button
							type="button"
							onClick={() => void handleImportVideo()}
							className={styles.previewEmptyPrimaryButton}
						>
							<Film className={styles.previewEmptyButtonIcon} />
							{t("emptyState.importVideoButton")}
						</button>
					</div>
					<p className={styles.previewEmptyHint}>{t("emptyState.supportedFormats")}</p>
					<p className={styles.previewEmptyDragHint}>
						<Upload className={styles.previewEmptyDragHintIcon} />
						{t("emptyState.dragDropHint")}
					</p>
				</div>
			) : (
				// Editor-06. The same entry points as before, in the Final page: the Library and a
				// file first, then importing a video or recording, then the projects opened lately.
				<section className={styles.noProject} aria-labelledby={titleId}>
					<div className={styles.noProjectArt} aria-hidden="true">
						<span className={styles.noProjectArtEyebrow}>{t("noProjectOpen.eyebrow")}</span>
						<span className={styles.noProjectArtTransport}>
							<span className={styles.noProjectArtClips} />
							<Play size={10} fill="currentColor" />
							<span className={styles.noProjectArtLine} />
							<span>0:00</span>
						</span>
					</div>
					<h1 id={titleId} className={styles.noProjectTitle}>
						{t("noProjectOpen.title")}
					</h1>
					<p className={styles.noProjectBody}>{t("noProjectOpen.body")}</p>
					<div className={styles.noProjectActions}>
						{onOpenLibrary ? (
							<button type="button" className={styles.noProjectPrimary} onClick={onOpenLibrary}>
								<Library size={14} aria-hidden="true" />
								{t("noProjectOpen.openLibrary")}
							</button>
						) : null}
						<button
							type="button"
							className={onOpenLibrary ? styles.noProjectSecondary : styles.noProjectPrimary}
							onClick={() => void handleLoadProject()}
						>
							<FolderOpen size={14} aria-hidden="true" />
							{t("noProjectOpen.openFile")}
						</button>
					</div>
					<div className={styles.noProjectLinks}>
						<button type="button" onClick={() => void handleImportVideo()}>
							<Film size={14} aria-hidden="true" />
							{t("noProjectOpen.importVideo")}
						</button>
						{onRecord ? (
							<button type="button" onClick={onRecord}>
								<Circle size={12} fill="currentColor" aria-hidden="true" />
								{t("noProjectOpen.record")}
							</button>
						) : null}
					</div>
					{recentProjects.length > 0 ? (
						<div className={styles.noProjectRecent}>
							<p className={styles.noProjectRecentLabel} id={recentId}>
								{t("noProjectOpen.recent")}
							</p>
							<ul aria-labelledby={recentId}>
								{recentProjects.slice(0, RECENT_LIMIT).map((project) => (
									<li key={project.id}>
										<button type="button" onClick={() => onOpenRecent?.(project.id)}>
											<span data-recent-title className={styles.noProjectRecentTitle}>
												{project.title}
											</span>
											<span className={styles.noProjectRecentMeta}>
												{recentWhen(project.updatedAt)}
											</span>
										</button>
									</li>
								))}
							</ul>
						</div>
					) : null}
					<p className={styles.noProjectDragHint}>
						<Upload size={13} aria-hidden="true" />
						{t("emptyState.dragDropHint")}
					</p>
				</section>
			)}
		</div>
	);
}

/** How many recent projects Editor-06 lists; the Open dialog has the rest. */
const RECENT_LIMIT = 5;
