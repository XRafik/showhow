import { useEffect, useState } from "react";
import { useScopedT } from "@/contexts/I18nContext";

/**
 * HUD-02: the Final countdown tile, a cream square with the signature sage offset shadow and a
 * dark caption chip. The window (420x260, click-through, never focused) is the inherited one.
 * The caption says the cancel path that exists: pressing Record again ends the countdown.
 */
export function CountdownOverlay() {
	const t = useScopedT("launch");
	const [value, setValue] = useState<number | null>(null);

	useEffect(() => {
		const unsubscribe = window.electronAPI.onCountdownOverlayValue((nextValue) => {
			setValue(nextValue);
		});

		return () => unsubscribe();
	}, []);

	if (value === null) {
		return null;
	}

	return (
		<div className="flex h-screen w-screen flex-col items-center justify-center gap-5 bg-transparent pointer-events-none select-none">
			<div
				data-testid="countdown-tile"
				className="flex h-[150px] w-[150px] items-center justify-center rounded-[2px] border border-[var(--ds-ink)] bg-[var(--ds-surface)] shadow-[10px_10px_0_var(--ds-accent)]"
			>
				<span
					// Keyed by the number so each one re-mounts and pops in (reduced motion: none).
					key={value}
					data-testid="countdown-number"
					data-value={value}
					className="font-[family-name:var(--ds-font-display)] text-[96px] font-semibold leading-none tabular-nums text-[var(--ds-ink)] motion-safe:animate-in motion-safe:zoom-in-90 motion-safe:fade-in-0 motion-safe:duration-200"
				>
					{value}
				</span>
			</div>
			<div className="flex items-center gap-2 rounded-[4px] bg-[var(--ds-panel)] px-2.5 py-1.5 font-[family-name:var(--ds-font-label)] text-[10px] uppercase tracking-[0.08em] text-[var(--ds-on-panel)]">
				<span className="h-2 w-2 bg-[var(--ds-rec)]" aria-hidden="true" />
				{t("countdown.caption")}
			</div>
		</div>
	);
}
