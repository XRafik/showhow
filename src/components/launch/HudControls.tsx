import { Check, Languages, Settings, SquarePen } from "lucide-react";
import {
	createContext,
	memo,
	type ReactElement,
	type KeyboardEvent as ReactKeyboardEvent,
	type ReactNode,
	useContext,
	useEffect,
	useId,
	useRef,
	useState,
} from "react";
import { formatTimePadded } from "../../utils/timeUtils";
import { Button } from "../ui/button";
import { TOOLTIP_GAP_PX, Tooltip } from "../ui/tooltip";
import {
	CameraIcon,
	CursorIcon,
	getIcon,
	ICON_SIZE,
	MicIcon,
	OpenInEditorIcon,
	OrientationIcon,
	RecordGlyph,
	SourceIcon,
	VolumeIcon,
} from "./HudIcons";
import { computeHudTooltipClearance } from "./hudGeometry";
import styles from "./LaunchWindow.module.css";

// Every control below is a `memo` boundary on purpose. The HUD's root re-renders
// once a second for the whole duration of a recording (the elapsed-time counter),
// and without these boundaries each of those ticks rebuilt ~15 Radix tooltip trees
// and ~60 host elements. Props are kept primitive (or stable refs/callbacks from
// the parent) so the boundaries actually hold.
//
// The Final look (dark panel, sage offset shadow, mono labels, sage Record, orange
// Stop) lives in LaunchWindow.module.css on the design tokens; these components only
// pick the classes and keep the inherited names, states and test ids.

// The bar's orientation decides which side its tooltips open on. A horizontal bar has all the
// reserve of the transparent window above it, so its tooltips go up. In a vertical bar "up" is
// over the controls above the one under the pointer, the ones the user reaches for next, so the
// tooltips go beside it: the bar is centred in a window about 650px wide or more (hudGeometry.ts),
// so the 260px maximum fits on either side.
const HudVerticalContext = createContext(false);
export const HudLayoutProvider = HudVerticalContext.Provider;

// Keeps a tooltip off the window's own edge, where its shadow would be cut.
const HUD_TOOLTIP_EDGE_PADDING = 8;

// Radix places a tooltip against its trigger, but what the eye sees is the bar around it. The
// bar pads the button, and a vertical bar widens to fit the timer while recording, so a gap
// measured from the trigger left the tooltip overlapping the bar. The distance to the bar's
// edge is measured when the tooltip opens (hence the controlled `open`: the offset has to be
// right in the render that shows it, not one effect later) and added to the primitive's gap.
function HudTooltip({ content, children }: { content: string; children: ReactElement }) {
	const vertical = useContext(HudVerticalContext);
	const side = vertical ? "right" : "top";
	const triggerRef = useRef<HTMLButtonElement | null>(null);
	const [open, setOpen] = useState(false);
	const [clearance, setClearance] = useState(0);

	const handleOpenChange = (next: boolean) => {
		const trigger = triggerRef.current;
		const bar = trigger?.closest("[data-tray-layout]");
		if (next && trigger && bar) {
			setClearance(
				computeHudTooltipClearance(
					trigger.getBoundingClientRect(),
					bar.getBoundingClientRect(),
					side,
				),
			);
		}
		setOpen(next);
	};

	return (
		<Tooltip
			ref={triggerRef}
			content={content}
			side={side}
			sideOffset={TOOLTIP_GAP_PX + clearance}
			collisionPadding={HUD_TOOLTIP_EDGE_PADDING}
			open={open}
			onOpenChange={handleOpenChange}
		>
			{children}
		</Tooltip>
	);
}

const iconButton = `${styles.hudIconButton} ${styles.electronNoDrag}`;

export const HudDivider = memo(function HudDivider({ vertical }: { vertical: boolean }) {
	return (
		<span
			className={`${styles.hudDivider} ${vertical ? styles.hudDividerVertical : styles.hudDividerHorizontal}`}
			aria-hidden
		/>
	);
});

/** The Showhow mark at the bar's start: decoration, not a control. */
export const HudLogoMark = memo(function HudLogoMark() {
	return (
		<span data-testid="hud-logo-mark" className={styles.hudLogoMark} aria-hidden="true">
			<CursorIcon />
		</span>
	);
});

export const HudDragHandle = memo(function HudDragHandle({
	vertical,
	nativeDrag,
	onPointerDown,
	onPointerMove,
	onPointerEnd,
}: {
	vertical: boolean;
	/**
	 * Hand the gesture to the compositor instead of the pointer handlers below.
	 *
	 * Wayland forbids a client from reading or setting its own global position:
	 * `getPosition()` answers [0, 0] and `setPosition()` only updates Electron's
	 * own cache, so the origin+delta scheme the handlers implement cannot move
	 * the window there. `-webkit-app-region: drag` is the one path that does —
	 * it routes to `xdg_toplevel.move` and the compositor performs the move.
	 *
	 * A drag region swallows pointer events, so the two are mutually exclusive:
	 * platforms that can position themselves keep the handler path, which gives
	 * finer control and lets the HUD suppress resizes mid-gesture.
	 */
	nativeDrag: boolean;
	onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
	onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
	onPointerEnd: (event: React.PointerEvent<HTMLDivElement>) => void;
}) {
	return (
		<div
			data-testid="hud-drag-handle"
			className={`${styles.hudDragHandle} ${vertical ? styles.hudDragHandleVertical : ""} ${
				nativeDrag ? styles.electronDrag : styles.electronNoDrag
			}`}
			onPointerDown={onPointerDown}
			onPointerMove={onPointerMove}
			onPointerUp={onPointerEnd}
			onPointerCancel={onPointerEnd}
		>
			{getIcon("drag")}
		</div>
	);
});

export const HudTrayLayoutButton = memo(function HudTrayLayoutButton({
	vertical,
	label,
	onClick,
}: {
	vertical: boolean;
	label: string;
	onClick: () => void;
}) {
	return (
		<HudTooltip content={label}>
			<button
				data-testid="launch-tray-layout-button"
				type="button"
				aria-label={label}
				className={iconButton}
				onClick={onClick}
			>
				<OrientationIcon vertical={vertical} />
			</button>
		</HudTooltip>
	);
});

export const HudSourceButton = memo(function HudSourceButton({
	vertical,
	label,
	tooltip,
	remembered = false,
	disabled,
	onClick,
}: {
	vertical: boolean;
	/** The source's name: what the button shows, and its accessible name. */
	label: string;
	/** What a click does, which the name alone does not say. */
	tooltip: string;
	/** The label names the last pick, which is not live: same button, rest colour. */
	remembered?: boolean;
	disabled: boolean;
	onClick: () => void;
}) {
	return (
		<HudTooltip content={tooltip}>
			<button
				type="button"
				data-testid="launch-source-selector-button"
				data-remembered={remembered || undefined}
				className={`${styles.hudSourceChip} ${vertical ? styles.hudSourceChipVertical : ""} ${styles.electronNoDrag}`}
				onClick={onClick}
				disabled={disabled}
				aria-label={label}
			>
				<SourceIcon className="shrink-0" />
				<span className={vertical ? "sr-only" : styles.hudSourceChipLabel}>{label}</span>
				{vertical ? null : getIcon("chevron", styles.hudSourceChipChevron)}
			</button>
		</HudTooltip>
	);
});

// The three toggles below and the cursor button share one pattern: a constant `name`, the state
// in `aria-pressed`, and one `tooltip` sentence. While a take runs they are `locked`: still
// there, still focusable and hoverable, still saying what is being recorded, and inert. A
// natively disabled button takes no pointer events, so its tooltip could never open: they say
// `aria-disabled` instead.

export const HudSystemAudioButton = memo(function HudSystemAudioButton({
	enabled,
	locked,
	name,
	tooltip,
	onClick,
}: {
	enabled: boolean;
	locked: boolean;
	name: string;
	tooltip: string;
	onClick: () => void;
}) {
	return (
		<HudTooltip content={tooltip}>
			<button
				type="button"
				data-testid="launch-system-audio-button"
				className={iconButton}
				aria-label={name}
				aria-pressed={enabled}
				aria-disabled={locked || undefined}
				onClick={locked ? undefined : onClick}
			>
				<VolumeIcon muted={!enabled} />
			</button>
		</HudTooltip>
	);
});

export const HudMicButton = memo(function HudMicButton({
	enabled,
	locked,
	name,
	tooltip,
	onClick,
}: {
	enabled: boolean;
	locked: boolean;
	name: string;
	tooltip: string;
	onClick: () => void;
}) {
	return (
		<HudTooltip content={tooltip}>
			<button
				type="button"
				data-testid="launch-microphone-button"
				className={iconButton}
				aria-label={name}
				aria-pressed={enabled}
				aria-disabled={locked || undefined}
				onClick={locked ? undefined : onClick}
			>
				<MicIcon muted={!enabled} />
			</button>
		</HudTooltip>
	);
});

export const HudCameraButton = memo(function HudCameraButton({
	enabled,
	locked,
	name,
	tooltip,
	onClick,
}: {
	enabled: boolean;
	locked: boolean;
	name: string;
	tooltip: string;
	onClick: () => void;
}) {
	return (
		<HudTooltip content={tooltip}>
			<button
				type="button"
				data-testid="launch-webcam-button"
				className={iconButton}
				aria-label={name}
				aria-pressed={enabled}
				aria-disabled={locked || undefined}
				onClick={locked ? undefined : onClick}
			>
				<CameraIcon off={!enabled} />
			</button>
		</HudTooltip>
	);
});

export const HudSettingsButton = memo(function HudSettingsButton({
	locked,
	expanded,
	label,
	onClick,
	buttonRef,
}: {
	locked: boolean;
	expanded: boolean;
	label: string;
	onClick: () => void;
	buttonRef: React.MutableRefObject<HTMLButtonElement | null>;
}) {
	return (
		<HudTooltip content={label}>
			<button
				ref={buttonRef}
				type="button"
				data-testid="launch-device-settings-button"
				aria-label={label}
				aria-expanded={expanded}
				aria-haspopup="dialog"
				aria-disabled={locked || undefined}
				// Dimmer at rest than the toggles it configures, so it reads as their
				// accessory rather than a fourth peer control.
				className={`${iconButton} ${styles.hudIconButtonQuiet}`}
				onClick={locked ? undefined : onClick}
			>
				<Settings size={ICON_SIZE} strokeWidth={1.75} aria-hidden="true" />
			</button>
		</HudTooltip>
	);
});

export const HudCursorButton = memo(function HudCursorButton({
	editableOverlay,
	locked,
	name,
	tooltip,
	onClick,
}: {
	editableOverlay: boolean;
	locked: boolean;
	name: string;
	/** One sentence per mode: each defines the mode it names. */
	tooltip: string;
	onClick: () => void;
}) {
	return (
		<HudTooltip content={tooltip}>
			<button
				type="button"
				data-testid="launch-cursor-mode-button"
				aria-label={name}
				aria-pressed={editableOverlay}
				aria-disabled={locked || undefined}
				className={iconButton}
				onClick={locked ? undefined : onClick}
			>
				<CursorIcon off={!editableOverlay} />
			</button>
		</HudTooltip>
	);
});

export const HudRecordButton = memo(function HudRecordButton({
	recording,
	paused,
	saving,
	label,
	text,
	onClick,
}: {
	recording: boolean;
	paused: boolean;
	saving: boolean;
	/** The full sentence: the accessible name and the tooltip. */
	label: string;
	/** The short word the Final bar shows: Record, Stop or Saving. */
	text: string;
	onClick: () => void;
}) {
	const state = saving ? "saving" : recording ? "recording" : "idle";
	return (
		// The tooltip is the only one: it carries the name, and a native `title` beside it
		// stacked a second, OS-drawn tooltip on the same button.
		<HudTooltip content={label}>
			<button
				type="button"
				data-testid="launch-record-button"
				data-state={state}
				data-paused={paused || undefined}
				disabled={saving}
				aria-busy={saving || undefined}
				className={`${styles.hudRecordButton} ${styles.electronNoDrag}`}
				onClick={onClick}
				aria-label={label}
			>
				{saving ? (
					<span className={`${styles.hudSpinner} animate-spin`}>{getIcon("spinner")}</span>
				) : (
					<RecordGlyph className={styles.hudRecordGlyph} />
				)}
				<span className={styles.hudRecordText}>{text}</span>
			</button>
		</HudTooltip>
	);
});

/** Elapsed time beside Stop: an orange dot and tabular mono digits. */
export const HudRecordingTimer = memo(function HudRecordingTimer({
	elapsedSeconds,
	paused,
}: {
	elapsedSeconds: number;
	paused: boolean;
}) {
	return (
		<span role="timer" data-paused={String(paused)} className={styles.hudTimer}>
			<span className={styles.hudTimerDot} aria-hidden="true" />
			{formatTimePadded(elapsedSeconds)}
		</span>
	);
});

export const HudStudioButton = memo(function HudStudioButton({
	disabled,
	label,
	onClick,
}: {
	disabled: boolean;
	label: string;
	onClick: () => void;
}) {
	return (
		<HudTooltip content={label}>
			<button
				type="button"
				data-testid="launch-open-studio-button"
				aria-label={label}
				disabled={disabled}
				className={iconButton}
				onClick={onClick}
			>
				<OpenInEditorIcon />
			</button>
		</HudTooltip>
	);
});

export const HudNotesButton = memo(function HudNotesButton({
	disabled,
	label,
	onClick,
}: {
	disabled: boolean;
	label: string;
	onClick: () => void;
}) {
	return (
		<HudTooltip content={label}>
			<button
				type="button"
				aria-label={label}
				disabled={disabled}
				className={iconButton}
				onClick={onClick}
			>
				<SquarePen size={ICON_SIZE} strokeWidth={1.75} aria-hidden="true" />
			</button>
		</HudTooltip>
	);
});

export const HudRecordingControls = memo(function HudRecordingControls({
	vertical,
	paused,
	saving,
	canPause,
	pauseLabel,
	restartLabel,
	cancelLabel,
	onTogglePause,
	onRestart,
	onCancel,
}: {
	vertical: boolean;
	paused: boolean;
	saving: boolean;
	canPause: boolean;
	pauseLabel: string;
	restartLabel: string;
	cancelLabel: string;
	onTogglePause: () => void;
	onRestart: () => void;
	onCancel: () => void;
}) {
	return (
		<div className={`${styles.hudCluster} ${vertical ? styles.hudClusterVertical : ""}`}>
			{canPause && (
				<HudTooltip content={pauseLabel}>
					<button
						type="button"
						data-testid="launch-pause-button"
						className={iconButton}
						aria-label={pauseLabel}
						data-paused={paused || undefined}
						onClick={onTogglePause}
						disabled={saving}
					>
						{getIcon(paused ? "resume" : "pause")}
					</button>
				</HudTooltip>
			)}
			<HudTooltip content={restartLabel}>
				<button
					type="button"
					data-testid="launch-restart-button"
					className={iconButton}
					aria-label={restartLabel}
					onClick={onRestart}
					disabled={saving}
				>
					{getIcon("restart")}
				</button>
			</HudTooltip>
			<HudTooltip content={cancelLabel}>
				<button
					type="button"
					data-testid="launch-cancel-button"
					className={iconButton}
					aria-label={cancelLabel}
					onClick={onCancel}
					disabled={saving}
				>
					{getIcon("cancel")}
				</button>
			</HudTooltip>
		</div>
	);
});

export const HudLanguageButton = memo(function HudLanguageButton({
	vertical,
	code,
	label,
	disabled,
	expanded,
	onClick,
	buttonRef,
}: {
	vertical: boolean;
	code: string;
	label: string;
	disabled: boolean;
	expanded: boolean;
	onClick: () => void;
	buttonRef: React.MutableRefObject<HTMLButtonElement | null>;
}) {
	return (
		<HudTooltip content={label}>
			<button
				ref={buttonRef}
				type="button"
				aria-label={label}
				aria-expanded={expanded}
				aria-haspopup="menu"
				disabled={disabled}
				onClick={onClick}
				className={`${styles.hudLanguageButton} ${vertical ? styles.hudLanguageButtonVertical : ""} ${styles.electronNoDrag}`}
			>
				<Languages size={ICON_SIZE} strokeWidth={1.75} className="shrink-0" aria-hidden="true" />
				<span className={vertical ? "sr-only" : styles.hudMonoLabel}>{code}</span>
			</button>
		</HudTooltip>
	);
});

export const HudWindowControls = memo(function HudWindowControls({
	vertical,
	disabled,
	hideLabel,
	hideTooltip,
	closeLabel,
	onHide,
	onClose,
}: {
	vertical: boolean;
	disabled: boolean;
	/** The accessible name; the tooltip goes on to say how to get the bar back. */
	hideLabel: string;
	hideTooltip: string;
	closeLabel: string;
	onHide: () => void;
	onClose: () => void;
}) {
	return (
		<div className={`${styles.hudCluster} ${vertical ? styles.hudClusterVertical : ""}`}>
			<HudTooltip content={hideTooltip}>
				<button
					type="button"
					className={iconButton}
					aria-label={hideLabel}
					onClick={onHide}
					disabled={disabled}
				>
					{getIcon("minimize")}
				</button>
			</HudTooltip>
			<HudTooltip content={closeLabel}>
				<button
					type="button"
					className={`${iconButton} ${styles.hudCloseButton}`}
					aria-label={closeLabel}
					onClick={onClose}
					disabled={disabled}
				>
					{getIcon("close")}
				</button>
			</HudTooltip>
		</div>
	);
});

export const HudLanguageMenu = memo(function HudLanguageMenu({
	locales,
	activeLocale,
	getName,
	onSelect,
	panelRef,
	onEnsureInteractive,
}: {
	locales: readonly string[];
	activeLocale: string;
	getName: (locale: string) => string;
	onSelect: (locale: string) => void;
	panelRef: (el: HTMLDivElement | null) => void;
	onEnsureInteractive: () => void;
}) {
	return (
		<div
			ref={panelRef}
			data-hud-interactive="true"
			data-testid="hud-language-menu"
			role="menu"
			className={`${styles.hudPopover} ${styles.hudPopoverScroll} ${styles.hudScrollbar} animate-mic-panel-in ${styles.electronNoDrag}`}
			onPointerDown={(event) => event.stopPropagation()}
			onPointerEnter={onEnsureInteractive}
			onWheel={(event) => {
				onEnsureInteractive();
				event.stopPropagation();
			}}
		>
			{locales.map((loc) => (
				<button
					key={loc}
					type="button"
					role="menuitemradio"
					aria-checked={loc === activeLocale}
					onClick={() => onSelect(loc)}
					className={`${styles.languageMenuItem} ${loc === activeLocale ? styles.languageMenuItemActive : ""}`}
				>
					<span className="truncate">{getName(loc)}</span>
					{loc === activeLocale ? <Check size={14} aria-hidden="true" /> : null}
				</button>
			))}
		</div>
	);
});

export const HudNotice = memo(function HudNotice({
	title,
	description,
	dismissLabel,
	confirmLabel,
	onDismiss,
	onConfirm,
}: {
	title: string;
	description: string;
	dismissLabel: string;
	confirmLabel: string;
	onDismiss: () => void;
	onConfirm: () => void;
}) {
	return (
		<div
			data-hud-interactive="true"
			className={`${styles.hudNotice} w-full p-3 animate-in fade-in-0 zoom-in-95 duration-200 ${styles.electronNoDrag}`}
		>
			<div className={styles.hudNoticeTitle}>{title}</div>
			<div className={styles.hudNoticeBody}>{description}</div>
			<div className="mt-3 flex items-center justify-end gap-2">
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={onDismiss}
					className={styles.hudNoticeSecondary}
				>
					{dismissLabel}
				</Button>
				<Button type="button" size="sm" onClick={onConfirm} className={styles.hudNoticePrimary}>
					{confirmLabel}
				</Button>
			</div>
		</div>
	);
});

const FOCUSABLE = "button:not([disabled]), [href], [tabindex]:not([tabindex='-1'])";

/**
 * A recovery sheet above the bar (HUD-07 screen permission, HUD-08 missing microphone).
 * Modal for the HUD: the bar behind it is made inert by the parent, focus starts on the
 * main action, Tab and Shift+Tab wrap inside, and Escape, Close and Cancel all cancel.
 */
export function HudSheet({
	eyebrow,
	title,
	description,
	hint,
	status,
	icon,
	closeLabel,
	cancelLabel,
	primaryLabel,
	primaryIcon,
	onCancel,
	onPrimary,
	panelRef,
}: {
	eyebrow: string;
	title: string;
	description: string;
	hint: string;
	/** Announced result of the last attempt, such as a retry that still failed. */
	status?: string | null;
	icon: ReactNode;
	closeLabel: string;
	cancelLabel: string;
	primaryLabel: string;
	primaryIcon?: ReactNode;
	onCancel: () => void;
	onPrimary: () => void;
	panelRef?: (el: HTMLDivElement | null) => void;
}) {
	const id = useId();
	const dialogRef = useRef<HTMLDivElement | null>(null);
	const primaryRef = useRef<HTMLButtonElement | null>(null);

	useEffect(() => {
		primaryRef.current?.focus();
	}, []);

	const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
		if (event.key === "Escape") {
			event.preventDefault();
			event.stopPropagation();
			onCancel();
			return;
		}
		if (event.key !== "Tab") return;
		const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
		if (focusable.length === 0) return;
		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		const active = document.activeElement;
		if (event.shiftKey && (active === first || !dialogRef.current?.contains(active))) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && (active === last || !dialogRef.current?.contains(active))) {
			event.preventDefault();
			first.focus();
		}
	};

	return (
		<div
			ref={(el) => {
				dialogRef.current = el;
				panelRef?.(el);
			}}
			role="dialog"
			aria-modal="true"
			aria-labelledby={`${id}-title`}
			aria-describedby={`${id}-description ${id}-hint`}
			data-hud-interactive="true"
			className={`${styles.hudSheet} ${styles.electronNoDrag}`}
			onKeyDown={handleKeyDown}
		>
			<div className={styles.hudSheetHeader}>
				<div>
					<div className={styles.hudSheetEyebrow}>{eyebrow}</div>
					<h2 id={`${id}-title`} className={styles.hudSheetTitle}>
						{title}
					</h2>
				</div>
				<button
					type="button"
					aria-label={closeLabel}
					className={styles.hudSheetClose}
					onClick={onCancel}
				>
					{getIcon("close")}
				</button>
			</div>
			<div className={styles.hudSheetBody}>
				<span className={styles.hudSheetIcon} aria-hidden="true">
					{icon}
				</span>
				<p id={`${id}-description`} className={styles.hudSheetDescription}>
					{description}
				</p>
				<p id={`${id}-hint`} className={styles.hudSheetHint}>
					{hint}
				</p>
				<p role="status" className={styles.hudSheetStatus}>
					{status ?? ""}
				</p>
			</div>
			<div className={styles.hudSheetFooter}>
				<button type="button" className={styles.hudSheetSecondary} onClick={onCancel}>
					{cancelLabel}
				</button>
				<button
					ref={primaryRef}
					type="button"
					className={styles.hudSheetPrimary}
					onClick={onPrimary}
				>
					{primaryIcon}
					{primaryLabel}
				</button>
			</div>
		</div>
	);
}
