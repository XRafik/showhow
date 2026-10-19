import { Check, X } from "lucide-react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useScopedT } from "@/contexts/I18nContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import styles from "./SourceSelector.module.css";

interface DesktopSource {
	id: string;
	name: string;
	thumbnail: string | null;
	display_id: string;
	appIcon: string | null;
}

type SourceTab = "screens" | "windows";

/**
 * HUD-01: the Final source sheet. It fills the picker's own transparent window (680x580),
 * leaving room on the right and bottom for the signature offset shadow.
 */
export function SourceSelector() {
	const t = useScopedT("launch");
	const tc = useScopedT("common");
	const titleId = useId();
	const [sources, setSources] = useState<DesktopSource[]>([]);
	const [selectedSource, setSelectedSource] = useState<DesktopSource | null>(null);
	const [tab, setTab] = useState<SourceTab>("screens");
	const [loading, setLoading] = useState(true);
	const [loadFailed, setLoadFailed] = useState(false);
	const cardRefs = useRef(new Map<string, HTMLButtonElement>());

	const fetchSources = useCallback(async () => {
		setLoading(true);
		setLoadFailed(false);
		try {
			const rawSources = await window.electronAPI.getSources({
				types: ["screen", "window"],
				thumbnailSize: { width: 320, height: 180 },
				fetchWindowIcons: true,
			});
			setSources(
				rawSources.map((source) => ({
					id: source.id,
					name:
						source.id.startsWith("window:") && source.name.includes(" — ")
							? source.name.split(" — ")[1] || source.name
							: source.name,
					thumbnail: source.thumbnail,
					display_id: source.display_id,
					appIcon: source.appIcon,
				})),
			);
			setTab(rawSources.some((source) => source.id.startsWith("screen:")) ? "screens" : "windows");
			setSelectedSource((current) =>
				current && rawSources.some((source) => source.id === current.id) ? current : null,
			);
		} catch (error) {
			console.error("Error loading sources:", error);
			setSources([]);
			setSelectedSource(null);
			setLoadFailed(true);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchSources();
	}, [fetchSources]);

	const screenSources = sources.filter((s) => s.id.startsWith("screen:"));
	const windowSources = sources.filter((s) => s.id.startsWith("window:"));
	const hasNoSources = !loading && sources.length === 0;

	const handleSourceSelect = (source: DesktopSource) => setSelectedSource(source);
	// Roving tabIndex: within each category radio group, the selected card (or
	// the first card when nothing in that category is selected) is the single
	// Tab stop; every other card is programmatically focusable only.
	const isCardTabStop = (source: DesktopSource, index: number, category: DesktopSource[]) => {
		if (selectedSource?.id === source.id) return true;
		const selectionInCategory = category.some((item) => item.id === selectedSource?.id);
		return !selectionInCategory && index === 0;
	};

	const handleCardKeyDown =
		(source: DesktopSource, index: number, category: DesktopSource[]) =>
		(event: ReactKeyboardEvent<HTMLButtonElement>) => {
			// Space or Enter activates the focused radio.
			if (event.key === " " || event.key === "Enter") {
				event.preventDefault();
				setSelectedSource(source);
				return;
			}
			// Arrows move focus and selection in visual grid order, wrapping at
			// the ends. Tab/Shift+Tab are untouched so focus can leave the group.
			const delta =
				event.key === "ArrowRight" || event.key === "ArrowDown"
					? 1
					: event.key === "ArrowLeft" || event.key === "ArrowUp"
						? -1
						: 0;
			if (delta === 0) return;
			event.preventDefault();
			const nextSource = category[(index + delta + category.length) % category.length] ?? source;
			setSelectedSource(nextSource);
			cardRefs.current.get(nextSource.id)?.focus();
		};

	const handleShare = async () => {
		if (selectedSource) await window.electronAPI.selectSource(selectedSource);
	};

	const close = () => window.close();

	const handleDialogKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
		if (event.key === "Escape") {
			event.preventDefault();
			close();
		}
	};

	// The action names what it will record: the chosen card's kind, or the open tab's.
	const selectedKind = selectedSource
		? selectedSource.id.startsWith("window:")
			? "windows"
			: "screens"
		: tab;
	const useLabel =
		selectedKind === "windows" ? t("sourceSelector.useWindow") : t("sourceSelector.useScreen");

	const renderSourceCard = (source: DesktopSource, index: number, category: DesktopSource[]) => {
		const isSelected = selectedSource?.id === source.id;
		const sourceKind = source.id.startsWith("screen:") ? "screen" : "window";
		return (
			<button
				key={source.id}
				type="button"
				ref={(node) => {
					if (node) cardRefs.current.set(source.id, node);
					else cardRefs.current.delete(source.id);
				}}
				role="radio"
				aria-checked={isSelected}
				aria-label={source.name}
				tabIndex={isCardTabStop(source, index, category) ? 0 : -1}
				onKeyDown={handleCardKeyDown(source, index, category)}
				data-testid="source-selector-card"
				data-source-kind={sourceKind}
				className={`${styles.sourceCard} ${isSelected ? styles.selected : ""}`}
				onClick={(event) => {
					handleSourceSelect(source);
					event.currentTarget.focus();
				}}
			>
				<div className={styles.thumb}>
					{source.thumbnail ? (
						<img src={source.thumbnail} alt="" className={styles.thumbImage} />
					) : null}
					{isSelected ? (
						<span className={styles.selectedChip}>
							<Check size={11} strokeWidth={2.25} aria-hidden="true" />
							{t("sourceSelector.selected")}
						</span>
					) : null}
				</div>
				<div className={styles.cardFooter}>
					{source.appIcon ? <img src={source.appIcon} alt="" className={styles.icon} /> : null}
					<span className={styles.name}>{source.name}</span>
				</div>
			</button>
		);
	};

	const header = (
		<div className={styles.header}>
			<div>
				<div className={styles.eyebrow}>{t("sourceSelector.eyebrow")}</div>
				<h1 id={titleId} className={styles.title}>
					{t("sourceSelector.title")}
				</h1>
			</div>
			<button
				type="button"
				aria-label={t("sourceSelector.close")}
				className={styles.closeButton}
				onClick={close}
			>
				<X size={16} strokeWidth={1.75} aria-hidden="true" />
			</button>
		</div>
	);

	const renderGroup = (value: SourceTab, category: DesktopSource[], label: string) => (
		<TabsContent value={value} className={styles.tabPanel}>
			<div
				role="radiogroup"
				aria-label={label}
				className={`${styles.grid} ${styles.sourceGridScroll}`}
			>
				{category.map((source, index) => renderSourceCard(source, index, category))}
			</div>
		</TabsContent>
	);

	const screensLabel = t("sourceSelector.screens", { count: String(screenSources.length) });
	const windowsLabel = t("sourceSelector.windows", { count: String(windowSources.length) });

	return (
		<div className={styles.frame}>
			<div
				role="dialog"
				aria-labelledby={titleId}
				className={styles.sheet}
				onKeyDown={handleDialogKeyDown}
			>
				{header}
				{loading ? (
					<div className={styles.stateBlock} role="status">
						<span className={`${styles.spinner} animate-spin`} aria-hidden="true" />
						<p className={styles.stateText}>{t("sourceSelector.loading")}</p>
					</div>
				) : hasNoSources ? (
					<div className={styles.stateBlock}>
						<h2 className={styles.stateTitle}>{t("sourceSelector.emptyTitle")}</h2>
						<p className={styles.stateText}>
							{loadFailed
								? t("sourceSelector.loadFailedDescription")
								: t("sourceSelector.emptyDescription")}
						</p>
						<button
							type="button"
							className={styles.primaryButton}
							onClick={() => void fetchSources()}
						>
							{tc("actions.reload")}
						</button>
					</div>
				) : (
					<Tabs
						value={tab}
						onValueChange={(value) => setTab(value as SourceTab)}
						className={styles.tabs}
					>
						<TabsList className={styles.tabList}>
							<TabsTrigger value="screens" className={styles.tab}>
								{screensLabel}
							</TabsTrigger>
							<TabsTrigger value="windows" className={styles.tab}>
								{windowsLabel}
							</TabsTrigger>
						</TabsList>
						{renderGroup("screens", screenSources, screensLabel)}
						{renderGroup("windows", windowSources, windowsLabel)}
					</Tabs>
				)}
				<div className={styles.footer}>
					<button
						type="button"
						data-testid="source-selector-cancel-button"
						className={styles.secondaryButton}
						onClick={close}
					>
						{tc("actions.cancel")}
					</button>
					<button
						type="button"
						data-testid="source-selector-share-button"
						className={styles.primaryButton}
						onClick={handleShare}
						disabled={!selectedSource}
					>
						{useLabel}
					</button>
				</div>
			</div>
		</div>
	);
}
