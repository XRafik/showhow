import { FolderOpen, KeyRound } from "lucide-react";
import {
	type KeyboardEvent,
	type ReactNode,
	useCallback,
	useEffect,
	useId,
	useRef,
	useState,
} from "react";
import { useScopedT } from "@/contexts/I18nContext";
import {
	BUNDLED_TRANSCRIPTION,
	RECORDING_COUNTDOWN_SECONDS,
	type RecordingsFolderAction,
	type RecordingsFolderChangeResult,
	type RecordingsFolderMoveProgress,
	type RecordingsFolderSelection,
	type ShowhowSettingsInfo,
} from "@/lib/showhow/settings";
import {
	readStoredThemePreference,
	setThemePreference,
	type ThemePreference,
} from "@/lib/showhow/theme";
import { cn } from "@/lib/utils";
import { AiConnections } from "./AiConnections";
import { Button } from "./Button";
import { Progress } from "./Progress";
import { Sheet } from "./Sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./Tabs";

const label = "font-ds-label text-[10px] uppercase tracking-[0.8px] text-ds-ink-soft";

function Badge({ tone, children }: { tone: "ok" | "muted"; children: ReactNode }) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-[3px] px-2 py-[3px] font-ds-label text-[10px] uppercase tracking-[0.8px]",
				tone === "ok" ? "bg-ds-accent-wash text-ds-accent-strong" : "bg-ds-chip text-ds-ink-soft",
			)}
		>
			<span aria-hidden="true" className="size-[5px] rounded-full bg-current" />
			{children}
		</span>
	);
}

function Row({
	title,
	meta,
	badge,
	children,
	muted,
}: {
	title: string;
	meta?: string;
	badge?: ReactNode;
	children?: ReactNode;
	muted?: boolean;
}) {
	return (
		<section className="border-b border-ds-line py-5">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h3
						className={cn(
							"font-ds-display text-xl font-semibold tracking-[-0.3px]",
							muted && "text-ds-ink-soft",
						)}
					>
						{title}
					</h3>
					{meta && <p className={cn(label, "mt-1")}>{meta}</p>}
				</div>
				{badge}
			</div>
			{children && <div className="mt-3">{children}</div>}
		</section>
	);
}

function Switch({
	name,
	checked,
	disabled,
	describedBy,
	onChange,
}: {
	name: string;
	checked: boolean;
	disabled?: boolean;
	describedBy?: string;
	onChange?: (checked: boolean) => void;
}) {
	return (
		<button
			type="button"
			role="switch"
			aria-label={name}
			aria-checked={checked}
			aria-describedby={describedBy}
			disabled={disabled}
			onClick={() => onChange?.(!checked)}
			className={cn(
				"relative h-[22px] w-[36px] shrink-0 rounded-full transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ds-ink disabled:opacity-50 motion-reduce:transition-none",
				checked ? "bg-ds-accent" : "bg-ds-chip",
			)}
		>
			<span
				aria-hidden="true"
				className={cn(
					"absolute top-[3px] size-4 rounded-full bg-ds-surface shadow-sm transition-[left] duration-150 motion-reduce:transition-none",
					checked ? "left-[17px]" : "left-[3px]",
				)}
			/>
		</button>
	);
}

/** `control` receives the note's id so a switch can be described by it. */
function SettingLine({
	name,
	note,
	control,
}: {
	name: string;
	note?: string;
	control: ReactNode | ((noteId: string | undefined) => ReactNode);
}) {
	const noteId = useId();
	return (
		<div className="flex flex-wrap items-center justify-between gap-3 border-b border-ds-line py-4">
			<div className="min-w-0">
				<p className="text-[15px]">{name}</p>
				{note && (
					<p id={noteId} className="mt-1 text-sm text-ds-ink-soft">
						{note}
					</p>
				)}
			</div>
			{typeof control === "function" ? control(note ? noteId : undefined) : control}
		</div>
	);
}

function Connections() {
	const t = useScopedT("common");
	const [connected, setConnected] = useState<boolean>();
	const [error, setError] = useState(false);
	const [editing, setEditing] = useState(false);
	const active = useRef(true);
	const refresh = useCallback(async () => {
		try {
			const status = await window.electronAPI.showhowAiGuideStatus();
			if (!active.current) return;
			setConnected(status.connected);
			setError(false);
		} catch {
			if (active.current) setError(true);
		}
	}, []);
	useEffect(() => {
		active.current = true;
		void refresh();
		return () => {
			active.current = false;
		};
	}, [refresh]);
	return (
		<>
			<Row
				title={t("showhowSettings.chatgpt")}
				meta={t("showhowSettings.chatgptMeta")}
				badge={<Badge tone="muted">{t("showhowSettings.comingLater")}</Badge>}
				muted
			>
				<p className="mb-3 text-[15px] text-ds-ink-soft">{t("showhowSettings.chatgptBody")}</p>
				<Button type="button" variant="secondary" disabled>
					{t("showhowSettings.chatgptSignIn")}
				</Button>
			</Row>
			<Row
				title="OpenRouter"
				meta={t("showhowSettings.openrouterMeta")}
				badge={
					connected === undefined ? undefined : connected ? (
						<Badge tone="ok">{t("showhowSettings.connected")}</Badge>
					) : (
						<Badge tone="muted">{t("showhowSettings.notConnected")}</Badge>
					)
				}
			>
				<p className="mb-3 text-[15px] text-ds-ink-soft">{t("showhowSettings.openrouterBody")}</p>
				{error && (
					<p role="alert" className="mb-3 text-sm text-ds-rec-ink">
						{t("showhowSettings.statusError")}
					</p>
				)}
				<Button
					type="button"
					variant="secondary"
					icon={KeyRound}
					aria-expanded={editing}
					disabled={connected === undefined && !error}
					onClick={() => {
						if (editing) void refresh();
						setEditing(!editing);
					}}
				>
					{editing
						? t("showhowSettings.hideKey")
						: connected === false
							? t("showhowSettings.addKey")
							: t("showhowSettings.manageKey")}
				</Button>
				{editing && (
					<div className="mt-4 max-w-[520px]">
						<AiConnections
							embedded
							onSaved={() => void refresh()}
							onRemoved={() => void refresh()}
						/>
					</div>
				)}
			</Row>
		</>
	);
}

function Recording({
	onRecordingsFolderChanged,
}: {
	onRecordingsFolderChanged?: () => Promise<void>;
}) {
	const t = useScopedT("common");
	const [info, setInfo] = useState<ShowhowSettingsInfo>();
	const [folderSelection, setFolderSelection] = useState<RecordingsFolderSelection | null>(null);
	const [folderChange, setFolderChange] = useState<RecordingsFolderChangeResult | null>(null);
	const [folderError, setFolderError] = useState<string | null>(null);
	const [folderBusy, setFolderBusy] = useState(false);
	const [moving, setMoving] = useState(false);
	const [moveProgress, setMoveProgress] = useState<RecordingsFolderMoveProgress | null>(null);
	const [hideIcons, setHideIcons] = useState<boolean>();
	const [status, setStatus] = useState<"idle" | "saving" | "error" | "load-error">("idle");
	useEffect(() => {
		let active = true;
		void window.electronAPI
			.showhowSettingsInfo()
			.then((value) => {
				if (active) setInfo(value);
			})
			.catch(() => undefined);
		window.electronAPI
			.getRecordingPrefs()
			.then((prefs) => {
				if (active) setHideIcons(prefs.hideDesktopIcons);
			})
			.catch(() => {
				if (active) setStatus("load-error");
			});
		// Another window (the HUD) can change the same preference.
		const dispose = window.electronAPI.onRecordingPrefsChanged?.((prefs) => {
			if (active) setHideIcons(prefs.hideDesktopIcons);
		});
		return () => {
			active = false;
			dispose?.();
		};
	}, []);
	useEffect(() => {
		if (!folderSelection) return;
		return window.electronAPI.showhowOnRecordingsFolderMoveProgress((progress) => {
			setMoveProgress(progress);
		});
	}, [folderSelection]);
	const chooseFolder = async () => {
		setFolderError(null);
		try {
			const result = await window.electronAPI.showhowChooseRecordingsFolder();
			if (result === null) return;
			if (result.status === "rejected") {
				setFolderError(
					t(
						result.reason === "same-folder"
							? "showhowSettings.folderSameError"
							: result.reason === "inside-current-folder"
								? "showhowSettings.folderNestedError"
								: "showhowSettings.folderInvalidError",
					),
				);
				return;
			}
			setFolderChange(null);
			setMoveProgress(null);
			setFolderSelection(result);
		} catch {
			setFolderError(t("showhowSettings.folderChooseError"));
		}
	};
	const changeFolder = async (action: RecordingsFolderAction) => {
		if (!folderSelection || folderBusy) return;
		setFolderBusy(true);
		setMoving(action === "move");
		setFolderError(null);
		setFolderChange(null);
		try {
			const result = await window.electronAPI.showhowChangeRecordingsFolder(
				folderSelection.token,
				action,
			);
			setFolderChange(result);
			if (result.recordingsFolder) {
				setInfo((current) => ({
					...(current ?? { recordingsFolder: folderSelection.currentRecordingsFolder }),
					recordingsFolder: result.recordingsFolder!,
				}));
				await onRecordingsFolderChanged?.();
			}
			if (result.success) setFolderSelection(null);
		} catch {
			setFolderError(t("showhowSettings.folderChangeError"));
		} finally {
			setFolderBusy(false);
			setMoving(false);
		}
	};
	const save = async (next: boolean) => {
		const previous = hideIcons;
		setHideIcons(next);
		setStatus("saving");
		try {
			const saved = await window.electronAPI.setRecordingPrefs({ hideDesktopIcons: next });
			setHideIcons(saved.hideDesktopIcons);
			setStatus("idle");
		} catch {
			setHideIcons(previous);
			setStatus("error");
		}
	};
	return (
		<>
			<SettingLine
				name={t("showhowSettings.folder")}
				note={t("showhowSettings.folderNote")}
				control={
					<div className="flex max-w-full items-center gap-3">
						<span className="break-all text-right font-ds-label text-[12px]">
							{info?.recordingsFolder ?? "…"}
						</span>
						<Button
							variant="secondary"
							icon={FolderOpen}
							disabled={!info || folderBusy}
							onClick={() => void chooseFolder()}
						>
							{t("showhowSettings.folderChange")}
						</Button>
					</div>
				}
			/>
			<SettingLine
				name={t("showhowSettings.countdown")}
				note={t("showhowSettings.countdownNote")}
				control={
					<span className="font-ds-label text-[12px]">
						{t("showhowSettings.countdownValue", { seconds: RECORDING_COUNTDOWN_SECONDS })}
					</span>
				}
			/>
			<SettingLine
				name={t("showhowSettings.hideIcons")}
				note={t("showhowSettings.hideIconsNote")}
				control={(noteId) => (
					<Switch
						name={t("showhowSettings.hideIcons")}
						describedBy={noteId}
						checked={hideIcons ?? false}
						disabled={hideIcons === undefined || status === "saving"}
						onChange={(next) => void save(next)}
					/>
				)}
			/>
			{(status === "error" || status === "load-error") && (
				<p role="alert" className="mt-3 text-sm text-ds-rec-ink">
					{t(status === "error" ? "showhowSettings.saveError" : "showhowSettings.loadError")}
				</p>
			)}
			{folderError && (
				<p role="alert" className="mt-3 text-sm text-ds-rec-ink">
					{folderError}
				</p>
			)}
			<Sheet
				open={folderSelection !== null}
				onOpenChange={(open) => {
					if (!open && !folderBusy) {
						setFolderSelection(null);
						setFolderChange(null);
					}
				}}
				eyebrow={t("showhowSettings.folderPickerEyebrow")}
				title={t("showhowSettings.folderPickerTitle", {
					count: folderSelection?.recordingCount ?? 0,
					plural: folderSelection?.recordingCount === 1 ? "" : "s",
				})}
				description={
					folderSelection
						? t("showhowSettings.folderPickerDescription", {
								count: folderSelection.recordingCount,
								plural: folderSelection.recordingCount === 1 ? "" : "s",
								folder: folderSelection.recordingsFolder,
								currentFolder: folderSelection.currentRecordingsFolder,
							})
						: ""
				}
				footer={
					folderChange ? (
						<Button
							variant="secondary"
							disabled={folderBusy}
							onClick={() => setFolderSelection(null)}
						>
							{t("showhowSettings.folderDone")}
						</Button>
					) : (
						<>
							<Button
								variant="secondary"
								disabled={folderBusy}
								onClick={() => setFolderSelection(null)}
							>
								{t("actions.cancel")}
							</Button>
							<Button
								variant="secondary"
								disabled={folderBusy}
								onClick={() => void changeFolder("keep")}
							>
								{t("showhowSettings.folderKeep")}
							</Button>
							<Button disabled={folderBusy} onClick={() => void changeFolder("move")}>
								{t("showhowSettings.folderMove", {
									count: folderSelection?.recordingCount ?? 0,
									plural: folderSelection?.recordingCount === 1 ? "" : "s",
								})}
							</Button>
						</>
					)
				}
			>
				{moving && moveProgress && (
					<div className="space-y-3">
						<p role="status" className="font-ds-display text-lg">
							{t("showhowSettings.folderMovingProgress", {
								current: moveProgress.current,
								total: moveProgress.total,
							})}
						</p>
						<Progress
							label={t("showhowSettings.folderMovingProgress", {
								current: moveProgress.current,
								total: moveProgress.total,
							})}
							value={moveProgress.total > 0 ? (moveProgress.current / moveProgress.total) * 100 : 0}
						/>
					</div>
				)}
				{folderChange && !folderChange.success && (
					<div role="alert" className="space-y-2 text-sm text-ds-rec-ink">
						<p>
							{folderChange.failedBundle
								? t("showhowSettings.folderMoveFailed", { name: folderChange.failedBundle })
								: t("showhowSettings.folderChangeError")}
						</p>
						{folderChange.movedBundles?.length ? (
							<p>
								{t("showhowSettings.folderMoved", { names: folderChange.movedBundles.join(", ") })}
							</p>
						) : null}
						{folderChange.remainingBundles?.length ? (
							<p>
								{t("showhowSettings.folderRemaining", {
									names: folderChange.remainingBundles.join(", "),
								})}
							</p>
						) : null}
						{folderChange.recoveryBundle && (
							<p>{t("showhowSettings.folderRecovery", { folder: folderChange.recoveryBundle })}</p>
						)}
					</div>
				)}
			</Sheet>
		</>
	);
}

function Transcription() {
	const t = useScopedT("common");
	const termsId = useId();
	return (
		<>
			<Row title={BUNDLED_TRANSCRIPTION.engine} meta={t("showhowSettings.whisperMeta")}>
				<p className="mb-3 text-[15px] text-ds-ink-soft">{t("showhowSettings.whisperBody")}</p>
				<p className="inline-block rounded-[4px] border border-ds-line px-3 py-2 font-ds-label text-[11px] uppercase tracking-[0.6px]">
					{t("showhowSettings.model", {
						label: BUNDLED_TRANSCRIPTION.label,
						size: BUNDLED_TRANSCRIPTION.sizeMb,
					})}
				</p>
			</Row>
			<div className="py-5">
				<label htmlFor={termsId} className={label}>
					{t("showhowSettings.terms")}
				</label>
				<textarea
					id={termsId}
					disabled
					rows={3}
					placeholder={t("showhowSettings.comingLater")}
					aria-describedby={`${termsId}-note`}
					className="mt-2 w-full resize-none rounded-[6px] border border-ds-line bg-ds-surface-sunken p-3 text-[15px] disabled:cursor-not-allowed disabled:opacity-70"
				/>
				<p id={`${termsId}-note`} className="mt-2 text-sm text-ds-ink-soft">
					{t("showhowSettings.termsNote")}
				</p>
			</div>
		</>
	);
}

function Agents() {
	const t = useScopedT("common");
	return (
		<>
			<SettingLine
				name={t("showhowSettings.copyFormat")}
				control={
					<span className="rounded-[4px] border border-ds-line px-3 py-2 font-ds-label text-[11px] uppercase tracking-[0.6px]">
						{t("showhowSettings.copyFormatValue")}
					</span>
				}
			/>
			<SettingLine
				name={t("showhowSettings.mcp")}
				note={t("showhowSettings.mcpNote")}
				control={(noteId) => (
					<Switch name={t("showhowSettings.mcp")} checked={false} disabled describedBy={noteId} />
				)}
			/>
		</>
	);
}

const THEMES: ThemePreference[] = ["light", "dark", "system"];

function readTheme(): ThemePreference {
	try {
		return readStoredThemePreference(window.localStorage);
	} catch {
		return "system";
	}
}

function Appearance() {
	const t = useScopedT("common");
	const [theme, setTheme] = useState<ThemePreference>(readTheme);
	const buttons = useRef<(HTMLButtonElement | null)[]>([]);
	// Another window can change the theme; follow it here too.
	useEffect(() => {
		const onStorage = () => setTheme(readTheme());
		window.addEventListener("storage", onStorage);
		return () => window.removeEventListener("storage", onStorage);
	}, []);
	const choose = (option: ThemePreference) => {
		setTheme(option);
		// Stored where every Showhow window listens, so open windows follow.
		setThemePreference(option);
	};
	// One tab stop; arrows, Home and End move and select, as in the source picker.
	const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
		const last = THEMES.length - 1;
		const next =
			event.key === "ArrowRight" || event.key === "ArrowDown"
				? index === last
					? 0
					: index + 1
				: event.key === "ArrowLeft" || event.key === "ArrowUp"
					? index === 0
						? last
						: index - 1
					: event.key === "Home"
						? 0
						: event.key === "End"
							? last
							: undefined;
		if (next === undefined) return;
		event.preventDefault();
		choose(THEMES[next]!);
		buttons.current[next]?.focus();
	};
	return (
		<SettingLine
			name={t("showhowSettings.theme")}
			control={
				<div
					role="radiogroup"
					aria-label={t("showhowSettings.theme")}
					className="flex rounded-[6px] border border-ds-line p-[3px]"
				>
					{THEMES.map((option, index) => (
						<button
							key={option}
							ref={(element) => {
								buttons.current[index] = element;
							}}
							type="button"
							role="radio"
							aria-checked={theme === option}
							tabIndex={theme === option ? 0 : -1}
							onClick={() => choose(option)}
							onKeyDown={(event) => onKeyDown(event, index)}
							className={cn(
								"min-w-[86px] rounded-[4px] px-4 py-2 font-ds-label text-[11px] uppercase tracking-[0.8px] transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ds-ink motion-reduce:transition-none",
								theme === option
									? "bg-ds-ink text-ds-surface"
									: "text-ds-ink-soft hover:text-ds-ink",
							)}
						>
							{t(`showhowSettings.${option}`)}
						</button>
					))}
				</div>
			}
		/>
	);
}

const SECTIONS = [
	["connections", "tabConnections", "connectionsIntro", Connections],
	["recording", "tabRecording", "recordingIntro", Recording],
	["transcription", "tabTranscription", "transcriptionIntro", Transcription],
	["agents", "tabAgents", "agentsIntro", Agents],
	["appearance", "tabAppearance", "appearanceIntro", Appearance],
] as const;

export function SettingsView({
	onRecordingsFolderChanged,
}: {
	onRecordingsFolderChanged?: () => Promise<void>;
} = {}) {
	const t = useScopedT("common");
	return (
		<div className="font-ds-body text-ds-ink">
			<h1 className="mb-5 font-ds-display text-[40px] font-semibold leading-[1.1] tracking-[-0.8px]">
				{t("showhowSettings.title")}
			</h1>
			<Tabs defaultValue="connections">
				<TabsList aria-label={t("showhowSettings.sections")} className="w-full flex-wrap">
					{SECTIONS.map(([value, name]) => (
						<TabsTrigger key={value} value={value}>
							{t(`showhowSettings.${name}`)}
						</TabsTrigger>
					))}
				</TabsList>
				{SECTIONS.map(([value, , intro, Section]) => (
					<TabsContent key={value} value={value} className="mt-0">
						<p className="mb-2 mt-5 max-w-[700px] text-[15px] leading-relaxed text-ds-ink-soft">
							{t(`showhowSettings.${intro}`)}
						</p>
						{Section === Recording ? (
							<Recording onRecordingsFolderChanged={onRecordingsFolderChanged} />
						) : (
							<Section />
						)}
					</TabsContent>
				))}
			</Tabs>
		</div>
	);
}
