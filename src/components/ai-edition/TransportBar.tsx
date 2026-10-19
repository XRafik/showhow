import { Pause, Play } from "lucide-react";
import { type KeyboardEvent, memo, type PointerEvent, useEffect, useRef } from "react";
import { Tooltip } from "@/components/ui/tooltip";
import { useScopedT } from "@/contexts/I18nContext";
import { useShortcuts } from "@/contexts/ShortcutsContext";
import type { AxcutClip } from "@/lib/ai-edition/schema";
import { useProjectStore } from "@/lib/ai-edition/store/projectStore";
import { formatSec } from "@/lib/ai-edition/timeline/format";
import { formatBinding } from "@/lib/shortcuts";
import styles from "./NewEditorShell.module.css";

interface TransportBarProps {
	playing: boolean;
	/** Live scrub position while a timeline drag is in flight; null = follow the store. */
	overrideTimeSec: number | null;
	clips: AxcutClip[];
	onTogglePlay: () => void;
	/**
	 * Under the preview (Editor-01) the transport carries its own seek bar, which seeks the
	 * same timeline time the ruler does. Without it the bar is the compact play + timecode.
	 */
	onSeek?: (timeSec: number) => void;
}

/** One arrow press moves the playhead this far; ←/→ on the timeline still step a frame. */
const SEEK_STEP_SEC = 1;

// The timecode is animated during playback, so it subscribes to the playhead directly instead of
// forcing the whole editor shell above it to re-render once per frame to hand it down as a prop
// (same reason as PlayheadOverlay in V4Timeline.tsx).
export const TransportBar = memo(function TransportBar({
	playing,
	overrideTimeSec,
	clips,
	onTogglePlay,
	onSeek,
}: TransportBarProps) {
	const te = useScopedT("editor");
	const { shortcuts, isMac } = useShortcuts();
	const storeTimeSec = useProjectStore((s) => s.currentTimeSec);
	const currentTimeSec = overrideTimeSec ?? storeTimeSec;
	const virtualDurationSec = clips.reduce(
		(acc, c) => acc + (c.timelineEndSec - c.timelineStartSec),
		0,
	);
	const clamp = (sec: number) => Math.min(virtualDurationSec, Math.max(0, sec));

	// The icon swaps, so the name swaps with it: an action button, not a toggle (no aria-pressed).
	const playLabel = playing ? te("transport.pause") : te("transport.play");

	const onSeekKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (!onSeek) return;
		const next =
			event.key === "ArrowRight" || event.key === "ArrowUp"
				? currentTimeSec + SEEK_STEP_SEC
				: event.key === "ArrowLeft" || event.key === "ArrowDown"
					? currentTimeSec - SEEK_STEP_SEC
					: event.key === "Home"
						? 0
						: event.key === "End"
							? virtualDurationSec
							: null;
		if (next === null) return;
		event.preventDefault();
		// The editor's own Space/arrow shortcuts listen on the window; the bar owns these keys.
		event.stopPropagation();
		onSeek(clamp(next));
	};

	// A drag seeks at most once a frame, like the ruler's scrub: every seek re-renders the shell
	// and goes to the native compositor, and pointermove fires far more often than that.
	const endDragRef = useRef<(() => void) | null>(null);
	useEffect(() => () => endDragRef.current?.(), []);

	const onSeekPointerDown = (event: PointerEvent<HTMLDivElement>) => {
		if (!onSeek || virtualDurationSec <= 0 || event.button !== 0) return;
		endDragRef.current?.();
		const bar = event.currentTarget;
		const seekAt = (clientX: number) => {
			const rect = bar.getBoundingClientRect();
			if (rect.width <= 0) return;
			onSeek(clamp(((clientX - rect.left) / rect.width) * virtualDurationSec));
		};
		seekAt(event.clientX);
		bar.setPointerCapture?.(event.pointerId);
		let frame = 0;
		let pendingX: number | null = null;
		const move = (ev: globalThis.PointerEvent) => {
			pendingX = ev.clientX;
			if (frame) return;
			frame = requestAnimationFrame(() => {
				frame = 0;
				if (pendingX !== null) seekAt(pendingX);
			});
		};
		const end = () => {
			cancelAnimationFrame(frame);
			window.removeEventListener("pointermove", move);
			window.removeEventListener("pointerup", end);
			window.removeEventListener("pointercancel", end);
			endDragRef.current = null;
		};
		endDragRef.current = end;
		window.addEventListener("pointermove", move);
		window.addEventListener("pointerup", end);
		window.addEventListener("pointercancel", end);
	};

	const progressPct = virtualDurationSec > 0 ? (currentTimeSec / virtualDurationSec) * 100 : 0;

	return (
		<div
			className={`${styles.transport}${onSeek ? ` ${styles.transportStage}` : ""}`}
			role="toolbar"
			aria-label={te("transport.playbackControls")}
		>
			<Tooltip content={playLabel} shortcut={formatBinding(shortcuts.playPause, isMac)}>
				<button
					type="button"
					className={`${styles.tbtn} ${styles.play}`}
					aria-label={playLabel}
					data-playing={playing}
					onClick={onTogglePlay}
				>
					{playing ? (
						<Pause size={16} fill="currentColor" />
					) : (
						<Play size={16} fill="currentColor" />
					)}
				</button>
			</Tooltip>
			{onSeek ? (
				<>
					<span className={styles.time}>{formatSec(currentTimeSec)}</span>
					<div
						className={styles.seekBar}
						role="slider"
						tabIndex={0}
						aria-label={te("transport.seek")}
						aria-valuemin={0}
						aria-valuemax={Number(virtualDurationSec.toFixed(1))}
						aria-valuenow={Number(currentTimeSec.toFixed(1))}
						aria-valuetext={`${formatSec(currentTimeSec)} / ${formatSec(virtualDurationSec)}`}
						onKeyDown={onSeekKeyDown}
						onPointerDown={onSeekPointerDown}
					>
						<span className={styles.seekTrack} aria-hidden>
							<span className={styles.seekFill} style={{ width: `${progressPct}%` }} />
						</span>
					</div>
					<span className={styles.total} data-testid="transport-total">
						{formatSec(virtualDurationSec)}
					</span>
				</>
			) : (
				<span className={styles.time}>
					<span>{formatSec(currentTimeSec)}</span>
					<span className={styles.sep}>/</span>
					<span className={styles.total}>{formatSec(virtualDurationSec)}</span>
				</span>
			)}
		</div>
	);
});
