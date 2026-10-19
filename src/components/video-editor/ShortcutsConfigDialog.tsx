import { RotateCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useScopedT } from "@/contexts/I18nContext";
import { useShortcuts } from "@/contexts/ShortcutsContext";
import {
	DEFAULT_SHORTCUTS,
	FIXED_SHORTCUTS,
	findConflict,
	formatBinding,
	formatFixedShortcut,
	SHORTCUT_ACTIONS,
	type ShortcutAction,
	type ShortcutBinding,
	type ShortcutConflict,
	type ShortcutsConfig,
} from "@/lib/shortcuts";

const MODIFIER_KEYS = new Set(["Control", "Shift", "Alt", "Meta"]);

// The Final sheet (Editor-08): the HUD sheets' ink border and offset sage shadow, mono labels,
// key chips. Tailwind values rather than a module: this dialog is shared with the legacy editor.
const LABEL = "font-[JetBrains_Mono,ui-monospace,monospace] uppercase tracking-[0.08em]";
const SECTION = `mb-1 mt-3 text-[10px] text-[var(--ds-ink-soft)] ${LABEL}`;
const ROW = "flex items-center justify-between gap-3 py-2 border-b border-[var(--ds-line)]";
const CHIP =
	"inline-flex min-w-[28px] items-center justify-center rounded-[4px] border px-1.5 py-1 text-[11px] font-[JetBrains_Mono,ui-monospace,monospace]";
const FOOT_BUTTON = `inline-flex h-8 items-center gap-1.5 rounded-[4px] px-3 text-[11px] ${LABEL} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-ink)]`;

export function ShortcutsConfigDialog() {
	const {
		shortcuts,
		isMac,
		isConfigOpen,
		openConfig,
		closeConfig,
		setShortcuts,
		persistShortcuts,
	} = useShortcuts();
	void openConfig;
	const t = useScopedT("shortcuts");
	const tc = useScopedT("common");
	const td = useScopedT("dialogs");

	const [draft, setDraft] = useState<ShortcutsConfig>(shortcuts);
	const [captureFor, setCaptureFor] = useState<ShortcutAction | null>(null);
	const [conflict, setConflict] = useState<{
		forAction: ShortcutAction;
		pending: ShortcutBinding;
		conflictWith: ShortcutConflict;
	} | null>(null);

	useEffect(() => {
		if (isConfigOpen) {
			setDraft(shortcuts);
			setCaptureFor(null);
			setConflict(null);
		}
	}, [isConfigOpen, shortcuts]);

	useEffect(() => {
		if (!captureFor) return;

		const handleCapture = (e: KeyboardEvent) => {
			e.preventDefault();
			e.stopPropagation();

			if (e.key === "Escape") {
				setCaptureFor(null);
				return;
			}

			if (MODIFIER_KEYS.has(e.key)) return;

			const binding: ShortcutBinding = {
				key: e.key.toLowerCase(),
				...(e.ctrlKey || e.metaKey ? { ctrl: true } : {}),
				...(e.shiftKey ? { shift: true } : {}),
				...(e.altKey ? { alt: true } : {}),
			};

			const found = findConflict(binding, captureFor, draft);
			setCaptureFor(null);

			if (found?.type === "fixed") {
				toast.error(t("reservedShortcut", { label: found.label }));
				return;
			}

			if (found?.type === "configurable") {
				setConflict({ forAction: captureFor, pending: binding, conflictWith: found });
				return;
			}

			setDraft((prev: ShortcutsConfig) => ({ ...prev, [captureFor]: binding }));
		};

		window.addEventListener("keydown", handleCapture, { capture: true });
		return () => window.removeEventListener("keydown", handleCapture, { capture: true });
	}, [captureFor, draft, t]);

	const handleSwap = useCallback(() => {
		if (!conflict || conflict.conflictWith.type !== "configurable") return;
		const { forAction, pending, conflictWith } = conflict;
		setDraft((prev: ShortcutsConfig) => ({
			...prev,
			[forAction]: pending,
			[conflictWith.action]: prev[forAction],
		}));
		setConflict(null);
	}, [conflict]);

	const handleCancelConflict = useCallback(() => setConflict(null), []);

	const handleSave = useCallback(async () => {
		const success = await persistShortcuts(draft);
		if (success) {
			setShortcuts(draft);
			toast.success(t("savedToast"));
			closeConfig();
		} else {
			toast.error(t("registrationFailed"));
		}
	}, [draft, setShortcuts, persistShortcuts, closeConfig, t]);

	const handleReset = useCallback(() => {
		setDraft({ ...DEFAULT_SHORTCUTS });
		toast.info(t("resetToast"));
	}, [t]);

	const handleClose = useCallback(() => {
		setCaptureFor(null);
		setConflict(null);
		closeConfig();
	}, [closeConfig]);

	return (
		<Dialog
			open={isConfigOpen}
			onOpenChange={(open: boolean) => {
				if (!open) handleClose();
			}}
		>
			<DialogContent className="flex max-h-[85vh] max-w-[440px] flex-col gap-0 rounded-[8px] border border-[var(--ds-ink)] bg-[var(--ds-surface)] p-0 text-[var(--ds-ink)] shadow-[4px_4px_0_var(--ds-accent)]">
				<DialogHeader className="shrink-0 space-y-1 border-b border-[var(--ds-line)] px-5 pb-3 pt-4 text-left">
					<span className={`text-[10px] text-[var(--ds-ink-soft)] ${LABEL}`}>
						{td("shortcuts.eyebrow")}
					</span>
					<DialogTitle className="font-['Inter_Tight',Inter,system-ui,sans-serif] text-lg font-semibold tracking-[-0.01em]">
						{t("title")}
					</DialogTitle>
				</DialogHeader>

				<div className="min-h-0 flex-1 overflow-y-auto px-5 pb-3">
					<p className={SECTION}>{t("configurable")}</p>
					{SHORTCUT_ACTIONS.map((action) => {
						const isCapturing = captureFor === action;
						const hasConflict = conflict?.forAction === action;
						const label = t(`actions.${action}`);
						const binding = formatBinding(draft[action], isMac);
						return (
							<div key={action}>
								<div className={ROW}>
									<span className="text-sm">{label}</span>
									<button
										type="button"
										onClick={() => {
											setConflict(null);
											setCaptureFor(isCapturing ? null : action);
										}}
										// The row's name and its key, so a screen reader hears what it rebinds.
										aria-label={`${label}: ${isCapturing ? t("pressKey") : binding}`}
										aria-pressed={isCapturing}
										title={isCapturing ? t("pressEscToCancel") : t("clickToChange")}
										className="cursor-pointer select-none rounded-[4px] border-0 bg-transparent p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-ink)]"
									>
										<kbd
											className={[
												CHIP,
												isCapturing
													? "animate-pulse border-[var(--ds-accent-strong)] bg-[var(--ds-accent-wash)] text-[var(--ds-ink)]"
													: hasConflict
														? "border-[var(--ds-rec-ink)] bg-[var(--ds-rec-wash)] text-[var(--ds-rec-ink)]"
														: "border-[var(--ds-line)] bg-[var(--ds-chip)] text-[var(--ds-ink)] hover:border-[var(--ds-ink)]",
											].join(" ")}
										>
											{isCapturing ? t("pressKey") : binding}
										</kbd>
									</button>
								</div>
								{hasConflict && conflict?.conflictWith.type === "configurable" && (
									<div
										role="alert"
										className="my-1 flex items-center justify-between gap-2 rounded-[4px] border border-[var(--ds-rec-ink)] bg-[var(--ds-rec-wash)] px-2 py-1.5 text-xs"
									>
										<span className="text-[var(--ds-rec-ink)]">
											{t("alreadyUsedBy", {
												action: t(`actions.${conflict.conflictWith.action}`),
											})}
										</span>
										<div className="flex gap-1.5">
											<button
												type="button"
												onClick={handleSwap}
												className={`${FOOT_BUTTON} h-6 border border-[var(--ds-ink)] bg-[var(--ds-ink)] text-[var(--ds-surface)]`}
											>
												{t("swap")}
											</button>
											<button
												type="button"
												onClick={handleCancelConflict}
												className={`${FOOT_BUTTON} h-6 border border-[var(--ds-line)] bg-[var(--ds-surface)] text-[var(--ds-ink)]`}
											>
												{tc("actions.cancel")}
											</button>
										</div>
									</div>
								)}
							</div>
						);
					})}

					<p className={SECTION}>{t("fixed")}</p>
					{FIXED_SHORTCUTS.map((shortcut) => (
						<div key={shortcut.i18nKey} className={ROW}>
							<span className="text-sm text-[var(--ds-ink-soft)]">
								{t(`fixedActions.${shortcut.i18nKey}`, { defaultValue: shortcut.label })}
							</span>
							<kbd className={`${CHIP} border-[var(--ds-line)] text-[var(--ds-ink-soft)]`}>
								{formatFixedShortcut(shortcut, isMac)}
							</kbd>
						</div>
					))}

					<p className="mt-3 text-xs leading-normal text-[var(--ds-ink-soft)]">{t("helpText")}</p>
				</div>

				<DialogFooter className="flex shrink-0 flex-row flex-wrap items-center gap-2 border-t border-[var(--ds-line)] px-5 py-3 sm:justify-between sm:space-x-0">
					<DialogDescription className="basis-full text-xs text-[var(--ds-ink-soft)]">
						{td("shortcuts.openHint")}
					</DialogDescription>
					<button
						type="button"
						className={`${FOOT_BUTTON} mr-auto border-0 bg-transparent text-[var(--ds-ink-soft)] hover:bg-[var(--ds-chip)]`}
						onClick={handleReset}
					>
						<RotateCcw className="h-3 w-3" />
						{t("resetToDefaults")}
					</button>
					<button
						type="button"
						className={`${FOOT_BUTTON} border border-[var(--ds-line)] bg-[var(--ds-surface)] text-[var(--ds-ink)] hover:bg-[var(--ds-chip)]`}
						onClick={handleClose}
					>
						{tc("actions.cancel")}
					</button>
					<button
						type="button"
						className={`${FOOT_BUTTON} border border-[var(--ds-ink)] bg-[var(--ds-ink)] text-[var(--ds-surface)] hover:opacity-90`}
						onClick={handleSave}
					>
						{tc("actions.save")}
					</button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
