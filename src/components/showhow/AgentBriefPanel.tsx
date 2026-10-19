import {
	Circle,
	CircleAlert,
	CircleCheck,
	Copy,
	LoaderCircle,
	RefreshCw,
	Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from "react";
import { useScopedT } from "@/contexts/I18nContext";
import {
	type AgentBriefPreview,
	type AgentBriefStatus,
	type BriefClaim,
	type BriefPhase,
	briefTransition,
	formatBriefTime,
	initialBriefState,
} from "@/lib/showhow/agentBrief";
import type { GuideOptions } from "@/lib/showhow/aiGuide";
import { cn } from "@/lib/utils";
import { AiConnections } from "./AiConnections";
import { GuideConnectSheet, GuideSheet } from "./AiGuideSheets";
import { Button } from "./Button";
import { Mosaic } from "./GuideStep";
import { Progress } from "./Progress";

const PHASES: BriefPhase[] = ["reading", "writing", "evidence"];
const COPIED_MS = 2000;

/**
 * Brief state for one bundle. The owning view is keyed by bundle, so a result that
 * resolves after the user picks another recording lands on an inactive hook and is dropped.
 */
export function useAgentBrief(bundleDir: string) {
	const [state, dispatch] = useReducer(briefTransition, initialBriefState);
	const [status, setStatus] = useState<AgentBriefStatus>();
	const [preview, setPreview] = useState<AgentBriefPreview>();
	const [options, setOptions] = useState<GuideOptions>({ transcript: true, frames: true });
	const [alwaysSend, setAlwaysSend] = useState(false);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string>();
	const [copy, setCopy] = useState<"idle" | "copied" | "failed">("idle");
	const [settings, setSettings] = useState(false);
	const active = useRef(true);
	const copyTimer = useRef<ReturnType<typeof setTimeout>>();
	// Main keeps one preview token per renderer; only the newest request may be shown or sent.
	const previewRequest = useRef(0);
	// True while this view awaits its own run; its result handling owns the outcome.
	const ownRun = useRef(false);
	const invoker = useRef<HTMLElement | null>(null);
	const api = window.electronAPI;

	const applyStatus = useCallback((value: AgentBriefStatus) => {
		setStatus(value);
		if (value.state === "failed") setError(value.error);
		dispatch({ type: "status", status: value });
	}, []);
	useEffect(() => {
		active.current = true;
		void window.electronAPI
			.showhowAgentBriefStatus?.(bundleDir)
			.then((value) => {
				if (active.current) applyStatus(value);
			})
			.catch(() => {
				/* The recording stays usable; Make brief reports a retryable error. */
			});
		const dispose = window.electronAPI.showhowOnAgentBriefProgress?.((event) => {
			if (event.bundleDir === bundleDir && active.current)
				dispatch({ type: "phase", phase: event.phase });
		});
		const disposeSettled = window.electronAPI.showhowOnAgentBriefSettled?.((event) => {
			if (event.bundleDir !== bundleDir || !active.current || ownRun.current) return;
			void window.electronAPI
				.showhowAgentBriefStatus(bundleDir)
				.then((value) => {
					if (active.current) applyStatus(value);
				})
				.catch(() => undefined);
		});
		return () => {
			active.current = false;
			clearTimeout(copyTimer.current);
			dispose?.();
			disposeSettled?.();
		};
	}, [bundleDir, applyStatus]);

	const refresh = async () => {
		const value = await api.showhowAgentBriefStatus(bundleDir);
		if (active.current) applyStatus(value);
	};
	const writeClipboard = async () => {
		clearTimeout(copyTimer.current);
		setCopy("idle");
		try {
			const result = await api.showhowAgentBriefCopy(bundleDir);
			if (!active.current) return;
			if (!result.success) {
				setCopy("failed");
				return;
			}
			setCopy("copied");
			copyTimer.current = setTimeout(() => {
				if (active.current) setCopy("idle");
			}, COPIED_MS);
		} catch {
			if (active.current) setCopy("failed");
		}
	};
	const run = async (payload: AgentBriefPreview, accept: boolean, copyAfter: boolean) => {
		ownRun.current = true;
		setBusy(true);
		setError(undefined);
		setPreview(undefined);
		dispatch({ type: "run", copyAfter });
		try {
			if (
				accept &&
				!(await api.showhowAgentBriefConsent(bundleDir, payload.token, alwaysSend)).success
			)
				throw new Error("Consent failed");
			const result = await api.showhowAgentBriefRun(bundleDir, payload.token);
			// A late result for a recording the user has left is not theirs to copy.
			if (!active.current) return;
			dispatch({ type: "result", result });
			if (!result.success) {
				if (!result.cancelled) setError(result.error ?? "provider");
				return;
			}
			await refresh();
			if (copyAfter && active.current) await writeClipboard();
		} catch {
			if (active.current) {
				setError("prepare");
				dispatch({ type: "result", result: { success: false } });
			}
		} finally {
			ownRun.current = false;
			if (active.current) setBusy(false);
		}
	};
	const begin = async ({ copyAfter = false, reviewOnly = false } = {}) => {
		if (busy || state.view === "making") return;
		setBusy(true);
		setError(undefined);
		setCopy("idle");
		try {
			const fresh = await api.showhowAgentBriefStatus(bundleDir);
			if (!active.current) return;
			setStatus(fresh);
			setOptions(fresh.options);
			setAlwaysSend(fresh.alwaysSend);
			if (!fresh.connected) {
				dispatch({ type: "connect", copyAfter });
				return;
			}
			const request = ++previewRequest.current;
			const value = await api.showhowAgentBriefPreview(bundleDir, fresh.options);
			if (!active.current || request !== previewRequest.current) return;
			if (value.success === false) throw new Error("Preview failed");
			if (reviewOnly || !(fresh.reviewed && fresh.alwaysSend)) {
				setPreview(value);
				dispatch({ type: "review", copyAfter });
				return;
			}
			await run(value, false, copyAfter);
		} catch {
			if (active.current) {
				setError("prepare");
				dispatch({ type: "result", result: { success: false } });
			}
		} finally {
			if (active.current) setBusy(false);
		}
	};
	const changeOptions = async (next: GuideOptions) => {
		setOptions(next);
		setPreview(undefined);
		const request = ++previewRequest.current;
		try {
			const value = await api.showhowAgentBriefPreview(bundleDir, next);
			if (active.current && request === previewRequest.current && value.success !== false)
				setPreview(value);
		} catch {
			if (active.current) setError("prepare");
		}
	};
	return {
		bundleDir,
		state,
		status,
		preview,
		options,
		alwaysSend,
		busy,
		error,
		copy,
		settings,
		invoker,
		setAlwaysSend,
		setSettings,
		begin,
		run,
		changeOptions,
		copyForAgent: () =>
			state.hasBrief && state.view !== "making" ? writeClipboard() : begin({ copyAfter: true }),
		cancel: () => void api.showhowAgentBriefCancel(bundleDir),
		close: () => {
			setPreview(undefined);
			dispatch({ type: "close" });
		},
	};
}
export type AgentBriefController = ReturnType<typeof useAgentBrief>;

export function CopyForAgentButton({ brief }: { brief: AgentBriefController }) {
	const t = useScopedT("common");
	const button = useRef<HTMLButtonElement>(null);
	const idleWidth = useRef(0);
	// Copy after a run stays "Making brief…" until the clipboard write settles: no idle flash.
	const making =
		brief.state.view === "making" ||
		(brief.state.copyAfter && brief.busy && brief.copy !== "copied");
	const idle = !making && brief.copy !== "copied";
	// Keep the label swap from shifting the action row: hold the idle width.
	useLayoutEffect(() => {
		if (idle && button.current) idleWidth.current = button.current.offsetWidth;
	});
	return (
		<Button
			ref={button}
			type="button"
			variant="dark"
			icon={making ? LoaderCircle : idle ? Copy : undefined}
			// A run keeps the solid label (Library-23) and focus; clicks are ignored until it ends.
			disabled={brief.busy && !making}
			aria-disabled={making || undefined}
			aria-busy={making}
			style={!idle && idleWidth.current ? { minWidth: `${idleWidth.current}px` } : undefined}
			className={cn(
				making &&
					"cursor-default hover:bg-ds-ink [&>svg]:animate-spin [&>svg]:motion-reduce:animate-none",
			)}
			onClick={(event) => {
				if (making) return;
				brief.invoker.current = event.currentTarget;
				void brief.copyForAgent();
			}}
		>
			{making
				? t("showhowBrief.makingBrief")
				: idle
					? t("showhowBrief.copy")
					: t("showhowBrief.copied")}
		</Button>
	);
}

function Label({ children }: { children: string }) {
	return (
		<p className="mb-2 font-ds-label text-[10px] uppercase tracking-[0.8px] text-ds-ink-soft">
			{children}
		</p>
	);
}

function errorKey(error?: string) {
	return error === "invalid"
		? "showhowBrief.errorInvalid"
		: error === "changed"
			? "showhowBrief.errorChanged"
			: error === "save"
				? "showhowBrief.errorSave"
				: error === "prepare"
					? "showhowBrief.errorPrepare"
					: "showhowBrief.errorProvider";
}

function PhaseList({
	phase,
	failedAt,
	error,
}: {
	phase?: BriefPhase;
	failedAt?: BriefPhase;
	error?: string;
}) {
	const t = useScopedT("common");
	const at = PHASES.indexOf(failedAt ?? phase ?? "reading");
	const names = {
		reading: ["showhowBrief.phaseReading", "showhowBrief.phaseReadingHint"],
		writing: ["showhowBrief.phaseWriting", "showhowBrief.phaseWritingHint"],
		evidence: ["showhowBrief.phaseEvidence", "showhowBrief.phaseEvidenceHint"],
	} as const;
	return (
		<ol className="grid gap-2">
			{PHASES.map((item, index) => {
				const done = index < at;
				const current = index === at;
				const failed = current && failedAt !== undefined;
				const Icon = done ? CircleCheck : failed ? CircleAlert : current ? LoaderCircle : Circle;
				return (
					<li
						key={item}
						className={cn(
							"flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px]",
							!done && !current && "text-ds-ink-soft",
						)}
					>
						<Icon
							aria-hidden="true"
							className={cn(
								"size-4 shrink-0",
								failed && "text-ds-rec-ink",
								current &&
									!failed &&
									"animate-spin text-ds-accent-strong motion-reduce:animate-none",
							)}
						/>
						{t(names[item][0])}
						<span
							className={cn(
								"font-ds-label text-[10px] uppercase tracking-[0.8px]",
								failed ? "text-ds-rec-ink" : "text-ds-ink-soft",
							)}
						>
							{failed
								? t(errorKey(error))
								: failedAt !== undefined && index > at
									? t("showhowBrief.notStarted")
									: t(names[item][1])}
						</span>
					</li>
				);
			})}
		</ol>
	);
}

function Claim({ label, claim }: { label: string; claim?: BriefClaim }) {
	if (!claim) return null;
	return (
		<div className="border-b border-ds-line px-6 py-4">
			<Label>{label}</Label>
			<p className="text-[16px] leading-relaxed">{claim.text}</p>
		</div>
	);
}

function BriefCard({ brief }: { brief: AgentBriefController }) {
	const t = useScopedT("common");
	const value = brief.status?.brief;
	if (!value) return null;
	return (
		<>
			<div className="overflow-hidden rounded-[8px] border border-ds-line bg-ds-surface-raised">
				<Claim label={t("showhowBrief.requestedChange")} claim={value.requestedChange} />
				<Claim label={t("showhowBrief.observed")} claim={value.observed} />
				<Claim label={t("showhowBrief.expected")} claim={value.expected} />
				<Claim label={t("showhowBrief.actual")} claim={value.actual} />
				<div className="border-b border-ds-line px-6 py-4">
					<Label>{t("showhowBrief.evidence")}</Label>
					<ol className="grid gap-2 rounded-[4px] bg-ds-surface-sunken px-4 py-3 font-ds-label text-[13px]">
						{value.evidence.map((item) => (
							<li key={`${item.sourceId}-${item.ts}`} className="flex gap-6">
								<span className="shrink-0 text-ds-ink-soft">{formatBriefTime(item.ts)}</span>
								<span className="min-w-0 break-words">{item.text}</span>
							</li>
						))}
					</ol>
				</div>
				<div className="px-6 py-4">
					<Label>{t("showhowBrief.unknowns")}</Label>
					<ul className="list-disc pl-5 text-[15px] leading-relaxed">
						{value.unknowns.length ? (
							value.unknowns.map((item) => <li key={item}>{item}</li>)
						) : (
							<li>{t("showhowBrief.noUnknowns")}</li>
						)}
					</ul>
				</div>
			</div>
			<div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-ds-ink-soft">
				<p>{t("showhowBrief.copyNote")}</p>
				<span className="flex items-center gap-3">
					<span className="font-ds-label text-[10px] uppercase tracking-[0.8px]">
						{t("showhowBrief.madeWith", { model: value.model })}
					</span>
					<Button
						type="button"
						variant="ghost"
						className="px-1 py-1"
						disabled={brief.busy}
						onClick={(event) => {
							brief.invoker.current = event.currentTarget;
							void brief.begin();
						}}
					>
						{t("showhowBrief.remake")}
					</Button>
				</span>
			</div>
		</>
	);
}

/** The Agent brief tab body: not made, making, failed or ready. */
export function AgentBriefPanel({ brief }: { brief: AgentBriefController }) {
	const t = useScopedT("common");
	const { view, phase, hasBrief } = brief.state;
	const failedAt: BriefPhase =
		brief.error === "save"
			? "evidence"
			: brief.error === "prepare" || brief.error === "changed"
				? "reading"
				: "writing";
	return (
		<section aria-label={t("showhowBrief.panel")} className="font-ds-body text-ds-ink">
			<button
				type="button"
				disabled={brief.busy || view === "making"}
				className="mb-4 text-sm text-ds-ink-soft underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2"
				onClick={(event) => {
					brief.invoker.current = event.currentTarget;
					void brief.begin({ reviewOnly: true });
				}}
			>
				{t("showhowBrief.check")}
			</button>
			{view === "making" && (
				<>
					<div
						role="status"
						aria-live="polite"
						className="rounded-[8px] border border-ds-line bg-ds-surface-raised p-6"
					>
						<div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
							<h3 className="font-ds-display text-xl font-semibold tracking-[-0.4px]">
								{t("showhowBrief.making")}
							</h3>
							<span className="font-ds-label text-[10px] uppercase tracking-[0.8px] text-ds-ink-soft">
								{t("showhowBrief.stepOf", { current: PHASES.indexOf(phase ?? "reading") + 1 })}
							</span>
						</div>
						<Progress
							label={t("showhowBrief.progress")}
							value={((PHASES.indexOf(phase ?? "reading") + 0.5) / 3) * 100}
							frontier={<Mosaic edge={0.5} />}
							className="mb-5 h-[10px]"
						/>
						<PhaseList phase={phase} />
						<div className="mt-5 flex flex-wrap items-center justify-between gap-3">
							<p className="font-ds-label text-[10px] uppercase tracking-[0.8px] text-ds-ink-soft">
								{t("showhowBrief.keepUsing")}
							</p>
							<Button type="button" variant="secondary" onClick={brief.cancel}>
								{t("showhowBrief.cancel")}
							</Button>
						</div>
					</div>
					<p className="mt-3 text-sm text-ds-ink-soft">{t("showhowBrief.safeMaking")}</p>
				</>
			)}
			{view === "failed" && (
				<>
					<div
						role="alert"
						className="rounded-[8px] border border-ds-line bg-ds-surface-raised p-6"
					>
						<div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-[4px] bg-ds-rec-wash px-3 py-3">
							<h3 className="font-ds-display text-xl font-semibold tracking-[-0.4px] text-ds-rec-ink">
								{t("showhowBrief.failed")}
							</h3>
							<span className="font-ds-label text-[10px] uppercase tracking-[0.8px] text-ds-ink-soft">
								{t("showhowBrief.stopped")}
							</span>
						</div>
						<Progress
							label={t("showhowBrief.progress")}
							value={failedAt === "reading" ? 20 : 55}
							failed
							frontier={<Mosaic failed />}
							className="mb-5 h-[10px]"
						/>
						<PhaseList failedAt={failedAt} error={brief.error} />
						<div className="mt-5 flex flex-wrap justify-end gap-2">
							<Button
								type="button"
								variant="secondary"
								onClick={(event) => {
									brief.invoker.current = event.currentTarget;
									brief.setSettings(true);
								}}
							>
								{t("showhowLibrary.changeProvider")}
							</Button>
							<Button
								type="button"
								variant="dark"
								icon={RefreshCw}
								disabled={brief.busy}
								onClick={() => void brief.begin()}
							>
								{t("showhowBrief.tryAgain")}
							</Button>
						</div>
					</div>
					<p className="mt-3 text-sm text-ds-ink-soft">{t("showhowBrief.safeFailed")}</p>
					{hasBrief && (
						<p className="mb-3 mt-6 text-sm font-medium">{t("showhowBrief.previousKept")}</p>
					)}
				</>
			)}
			{hasBrief && <BriefCard brief={brief} />}
			{!hasBrief && view !== "making" && view !== "failed" && (
				<>
					<div className="rounded-[8px] border border-ds-line bg-ds-surface-raised p-5">
						<Label>{t("showhowBrief.nextStep")}</Label>
						<h3 className="mb-3 font-ds-display text-2xl font-semibold tracking-[-0.48px]">
							{t("showhowBrief.makeTitle")}
						</h3>
						<p className="mb-4 text-[15px] leading-relaxed">{t("showhowBrief.makeBody")}</p>
						<Button
							type="button"
							icon={Sparkles}
							disabled={brief.busy}
							onClick={(event) => {
								brief.invoker.current = event.currentTarget;
								void brief.begin();
							}}
						>
							{t("showhowBrief.make")}
						</Button>
					</div>
					<p className="mt-3 text-sm text-ds-ink-soft">{t("showhowBrief.local")}</p>
				</>
			)}
		</section>
	);
}

/** Sheets and copy feedback live outside the tabs so Copy for agent works from either tab. */
export function AgentBriefSheets({ brief }: { brief: AgentBriefController }) {
	const t = useScopedT("common");
	const { view, copyAfter } = brief.state;
	const preview = brief.preview;
	return (
		<>
			{brief.copy === "copied" && (
				<div
					role="status"
					className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-[6px] bg-ds-panel px-[18px] py-[11px] font-ds-label text-[11px] uppercase tracking-[0.8px] text-ds-on-panel shadow-[4px_4px_0_var(--ds-accent)]"
				>
					<CircleCheck aria-hidden="true" className="size-[14px] text-ds-accent" />
					{t("showhowBrief.copiedToast")}
				</div>
			)}
			{brief.copy === "failed" && (
				<p role="alert" className="mt-2 text-sm text-ds-rec-ink">
					{t("showhowBrief.copyFailed")}
				</p>
			)}
			{view === "connect" && (
				<GuideConnectSheet
					returnFocusTo={brief.invoker.current}
					onClose={brief.close}
					onConnect={() => brief.setSettings(true)}
				/>
			)}
			{brief.settings && (
				<GuideSheet
					title={t("showhowGuide.settings")}
					description={t("showhowGuide.ownKey")}
					returnFocusTo={brief.invoker.current}
					onClose={() => brief.setSettings(false)}
				>
					<AiConnections
						onSaved={() => {
							brief.setSettings(false);
							brief.close();
							void brief.begin({ copyAfter });
						}}
					/>
				</GuideSheet>
			)}
			{view === "review" && (
				<GuideSheet
					title={t("showhowBrief.reviewTitle")}
					description={t("showhowBrief.reviewBody")}
					returnFocusTo={brief.invoker.current}
					onClose={brief.close}
				>
					<label className="flex items-center justify-between border-t border-ds-line py-3">
						<span>{t("showhowGuide.transcriptWords", { count: preview?.wordCount ?? 0 })}</span>
						<input
							type="checkbox"
							aria-label={t("showhowGuide.sendTranscript")}
							checked={brief.options.transcript}
							onChange={(event) =>
								void brief.changeOptions({ ...brief.options, transcript: event.target.checked })
							}
						/>
					</label>
					<label className="flex items-center justify-between border-t border-ds-line py-3">
						<span>{t("showhowGuide.selectedFrames", { count: preview?.frames.length ?? 0 })}</span>
						<input
							type="checkbox"
							aria-label={t("showhowGuide.sendFrames")}
							checked={brief.options.frames}
							onChange={(event) =>
								void brief.changeOptions({ ...brief.options, frames: event.target.checked })
							}
						/>
					</label>
					<div className="flex flex-wrap gap-2">
						{preview?.frames.map((frame) => (
							<img
								key={frame.sourceId}
								src={frame.dataUrl}
								alt={t("showhowGuide.frameAlt", { seconds: frame.ts / 1000 })}
								className="h-12 w-20 rounded object-contain outline outline-1 outline-black/10 dark:outline-white/10"
							/>
						))}
					</div>
					<p className="border-t border-ds-line py-3 text-sm">
						OpenRouter · {preview?.model ?? brief.status?.model}
					</p>
					<details className="text-sm">
						<summary className="cursor-pointer">{t("showhowGuide.evidence")}</summary>
						<pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-xs">
							{JSON.stringify({ steps: preview?.steps, transcript: preview?.transcript }, null, 2)}
						</pre>
					</details>
					<label className="flex items-center gap-2 py-3 text-sm">
						<input
							type="checkbox"
							checked={brief.alwaysSend}
							onChange={(event) => brief.setAlwaysSend(event.target.checked)}
						/>
						{t("showhowBrief.always")}
					</label>
					<div className="flex justify-end gap-2 border-t border-ds-line pt-3">
						<Button type="button" variant="ghost" onClick={brief.close}>
							{t("showhowBrief.cancel")}
						</Button>
						<Button
							type="button"
							disabled={!preview}
							onClick={() => {
								if (preview) void brief.run(preview, true, copyAfter);
							}}
						>
							{copyAfter ? t("showhowBrief.makeAndCopy") : t("showhowBrief.make")}
						</Button>
					</div>
				</GuideSheet>
			)}
		</>
	);
}
