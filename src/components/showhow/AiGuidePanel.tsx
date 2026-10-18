import { type ReactNode, useEffect, useReducer, useRef, useState } from "react";
import { useScopedT } from "@/contexts/I18nContext";
import {
	type GuideOptions,
	type GuidePreview,
	type GuideStatus,
	guidePanelTransition,
} from "@/lib/showhow/aiGuide";
import type { RecordingLibraryEntry } from "@/lib/showhow/recordingLibrary";
import { AiConnections } from "./AiConnections";
import { GuideConnectSheet, GuideSheet } from "./AiGuideSheets";
import { Button } from "./Button";
import { Mosaic } from "./GuideStep";
import { Progress } from "./Progress";
export function AiGuidePanel({
	entry,
	onEntryChange,
	onStatusChange,
	actions,
}: {
	entry: RecordingLibraryEntry;
	actions?: ReactNode;
	onEntryChange: (entry: RecordingLibraryEntry) => void;
	onStatusChange?: (
		bundleDir: string,
		status: NonNullable<RecordingLibraryEntry["guideStatus"]>,
	) => void;
}) {
	const t = useScopedT("common");
	const [state, dispatch] = useReducer(guidePanelTransition, { view: "idle" });
	const [status, setStatus] = useState<GuideStatus>();
	const [preview, setPreview] = useState<GuidePreview>();
	const [options, setOptions] = useState<GuideOptions>({ transcript: true, frames: true });
	const [alwaysSend, setAlwaysSend] = useState(true);
	const [settings, setSettings] = useState(false);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState("");
	const active = useRef(true);
	const requestId = useRef(0);
	const statusRequestId = useRef(0);
	const invoker = useRef<HTMLElement | null>(null);
	const settingsInvoker = useRef<HTMLElement | null>(null);
	useEffect(() => {
		active.current = true;
		let currentEffect = true;
		const statusId = ++statusRequestId.current;
		void window.electronAPI
			.showhowAiGuideStatus?.(entry.bundleDir)
			.then((value) => {
				if (currentEffect && statusId === statusRequestId.current) {
					setStatus(value);
					setOptions(value.options);
					if (value.guide?.status === "making") dispatch({ type: "run" });
					else if (value.guide?.status === "ready" || value.guide?.status === "failed")
						dispatch({ type: "result", success: value.guide.status === "ready" });
				}
			})
			.catch(() => {
				/* Keep the recording usable; Make guide reports a retryable status error. */
			});
		const dispose = window.electronAPI.showhowOnAiGuideProgress?.((event) => {
			if (event.bundleDir === entry.bundleDir && active.current)
				dispatch({ type: "phase", phase: event.phase });
		});
		return () => {
			currentEffect = false;
			active.current = false;
			requestId.current++;
			dispose?.();
		};
	}, [entry.bundleDir, entry.title, entry.steps]);
	useEffect(() => {
		const next =
			state.view === "making"
				? "making"
				: state.view === "failed"
					? "failed"
					: state.view === "ready"
						? "ready"
						: status?.guide?.status;
		if (next) onStatusChange?.(entry.bundleDir, next);
	}, [entry.bundleDir, state.view, status?.guide?.status, onStatusChange]);
	async function refresh() {
		const entries = await window.electronAPI.showhowListRecordings();
		const next = entries.find((value) => value.bundleDir === entry.bundleDir);
		// Completion belongs to the library entry even after its detail unmounts.
		if (next) onEntryChange(next);
		if (!active.current) return;
		const statusId = ++statusRequestId.current;
		const nextStatus = await window.electronAPI.showhowAiGuideStatus(entry.bundleDir);
		if (active.current && statusId === statusRequestId.current) setStatus(nextStatus);
	}
	async function run(payload: GuidePreview, accept = false) {
		setBusy(true);
		setError("");
		dispatch({ type: "run" });
		try {
			if (
				accept &&
				!(
					await window.electronAPI.showhowAiGuideConsent(entry.bundleDir, payload.token, alwaysSend)
				).success
			)
				throw new Error("Consent failed");
			const result = await window.electronAPI.showhowAiGuideRun(entry.bundleDir, payload.token);
			if (active.current) {
				dispatch({ type: "result", success: result.success });
				if (result.error) setError(result.error);
			}
			await refresh();
		} catch {
			if (active.current) {
				dispatch({ type: "result", success: false });
				setError(t("showhowGuide.runError"));
			}
		} finally {
			if (active.current) setBusy(false);
		}
	}
	const isCurrentRequest = (id: number) => active.current && requestId.current === id;
	async function loadPreview(nextOptions: GuideOptions, id: number) {
		setBusy(true);
		try {
			const value = await window.electronAPI.showhowAiGuidePreview(entry.bundleDir, nextOptions);
			if (!isCurrentRequest(id)) return;
			if (value.success === false) throw new Error("Preview failed");
			setPreview(value);
			return value;
		} finally {
			if (isCurrentRequest(id)) setBusy(false);
		}
	}
	async function begin(confirmed = false, reviewOnly = false) {
		if (busy || state.view === "making") return;
		const id = ++requestId.current;
		statusRequestId.current++;
		setBusy(true);
		setError("");
		try {
			const fresh = await window.electronAPI.showhowAiGuideStatus(entry.bundleDir);
			if (!isCurrentRequest(id)) return;
			setStatus(fresh);
			setOptions(fresh.options);
			setAlwaysSend(fresh.alwaysSend ?? true);
			const next = guidePanelTransition(state, { type: "begin", status: fresh, confirmed });
			dispatch({ type: "begin", status: fresh, confirmed });
			if (next.view === "connect" || next.view === "confirm") return;
			if (reviewOnly) dispatch({ type: "review" });
			const value = await loadPreview(fresh.options, id);
			if (value && isCurrentRequest(id) && next.view === "making" && !reviewOnly) await run(value);
		} catch {
			if (isCurrentRequest(id)) {
				dispatch({ type: "result", success: false });
				setError(t("showhowGuide.previewError"));
			}
		} finally {
			if (isCurrentRequest(id)) setBusy(false);
		}
	}
	async function changeOptions(next: GuideOptions) {
		const id = ++requestId.current;
		setOptions(next);
		setPreview(undefined);
		try {
			await loadPreview(next, id);
		} catch {
			if (isCurrentRequest(id)) setError(t("showhowGuide.previewError"));
		}
	}
	const close = () => {
		requestId.current++;
		setBusy(false);
		setError("");
		setPreview(undefined);
		dispatch({ type: "cancel" });
	};
	const isReady = status?.guide?.status === "ready" || state.view === "ready";
	const failed =
		state.view === "failed" || (state.view === "idle" && status?.guide?.status === "failed");
	return (
		<section aria-label={t("showhowGuide.panel")} className="my-7 font-ds-body text-ds-ink">
			<div className="mb-3 flex flex-wrap items-center justify-between gap-3">
				<h2 className="border-b-2 border-ds-ink pb-2 font-ds-label text-[11px] uppercase tracking-wider">
					{t("showhowGuide.walkthrough")}
				</h2>
				<div className="flex flex-wrap gap-2">
					<Button
						type="button"
						variant="secondary"
						disabled={busy || state.view === "making"}
						onClick={(event) => {
							invoker.current = event.currentTarget;
							void begin();
						}}
					>
						{isReady ? t("showhowGuide.remake") : t("showhowGuide.make")}
					</Button>
					{actions}
				</div>
			</div>
			{!isReady && (
				<button
					type="button"
					disabled={busy || state.view === "making"}
					className="mb-4 text-xs text-ds-ink-soft underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2"
					onClick={(event) => {
						invoker.current = event.currentTarget;
						void begin(true, true);
					}}
				>
					{t("showhowGuide.check")}
				</button>
			)}
			{!isReady && state.view !== "making" && !failed && (
				<div className="rounded-[8px] border border-ds-line bg-ds-surface-raised p-6">
					<h3 className="mb-2 text-xl font-medium">{t("showhowGuide.turnInto")}</h3>
					<p className="max-w-xl text-sm leading-relaxed text-ds-ink-soft">
						{t("showhowGuide.localBody")}
					</p>
				</div>
			)}
			{state.view === "making" && (
				<div
					role="status"
					aria-live="polite"
					className="rounded-[8px] border border-ds-line bg-ds-surface-raised p-6"
				>
					<h3 className="mb-4 text-xl font-medium">{t("showhowGuide.making")}</h3>
					<Progress
						label={t("showhowGuide.progress")}
						value={state.phase === "writing" ? 100 : state.phase === "sorting" ? 200 / 3 : 100 / 3}
						aria-valuetext={t(
							state.phase === "writing"
								? "showhowGuide.phaseWriting"
								: state.phase === "sorting"
									? "showhowGuide.phaseSorting"
									: "showhowGuide.phaseTranscript",
						)}
						frontier={<Mosaic edge={state.phase === "writing" ? 0.8 : 0.42} />}
						className="mb-5"
					/>
					<ol className="grid gap-2 text-sm">
						<li>{t("showhowGuide.phaseTranscript")}</li>
						<li>
							{t("showhowGuide.phaseSorting")}
							{state.phase === "sorting" && "…"}
						</li>
						<li>
							{t("showhowGuide.phaseWriting")}
							{state.phase === "writing" && "…"}
						</li>
					</ol>
					<p className="mt-4 text-xs text-ds-ink-soft">{t("showhowGuide.keepUsing")}</p>
				</div>
			)}
			{failed && (
				<div
					role="alert"
					className="overflow-hidden rounded-[8px] border border-ds-rec bg-ds-rec-wash p-6"
				>
					<Progress
						label={t("showhowGuide.progress")}
						failed
						frontier={<Mosaic failed />}
						className="mb-4"
					/>
					<h3 className="mb-3 text-xl font-medium text-ds-rec-ink">{t("showhowGuide.failed")}</h3>
					<p className="mb-4 text-sm text-ds-ink-soft">
						{error || status?.guide?.error || t("showhowGuide.safe")}
					</p>
					<Button type="button" disabled={busy} onClick={() => void begin(true)}>
						{t("showhowGuide.retry")}
					</Button>
					<Button
						type="button"
						variant="secondary"
						className="ml-2"
						onClick={(event) => {
							settingsInvoker.current = event.currentTarget;
							setSettings(true);
						}}
					>
						{t("showhowLibrary.changeProvider")}
					</Button>
				</div>
			)}
			{isReady && status?.narrationOnly && (
				<p className="my-3 text-sm text-ds-ink-soft">{t("showhowGuide.narrationOnly")}</p>
			)}
			{isReady && status?.noSpeech && (
				<div className="my-3 rounded-lg border border-ds-line p-4">
					<h3 className="font-medium">{t("showhowGuide.noSpeech")}</h3>
					<p className="text-sm text-ds-ink-soft">{t("showhowGuide.clickOnly")}</p>
				</div>
			)}
			{state.view === "connect" && (
				<GuideConnectSheet
					returnFocusTo={invoker.current}
					onClose={close}
					onConnect={(trigger) => {
						settingsInvoker.current = trigger;
						setSettings(true);
					}}
				/>
			)}
			{settings && (
				<GuideSheet
					title={t("showhowGuide.settings")}
					description={t("showhowGuide.ownKey")}
					returnFocusTo={settingsInvoker.current ?? invoker.current}
					onClose={() => setSettings(false)}
				>
					<AiConnections
						onSaved={() => {
							setSettings(false);
							dispatch({ type: "cancel" });
							void begin();
						}}
					/>
				</GuideSheet>
			)}
			{state.view === "confirm" && (
				<GuideSheet
					title={t("showhowGuide.remakeTitle")}
					description={t("showhowGuide.previousStays")}
					returnFocusTo={invoker.current}
					onClose={close}
				>
					<div className="flex flex-wrap justify-end gap-2">
						<Button type="button" variant="ghost" onClick={() => void begin(true, true)}>
							{t("showhowGuide.check")}
						</Button>
						<Button type="button" variant="ghost" onClick={close}>
							{t("showhowGuide.cancel")}
						</Button>
						<Button type="button" onClick={() => void begin(true)}>
							{t("showhowGuide.remake")}
						</Button>
					</div>
				</GuideSheet>
			)}
			{state.view === "review" && (
				<GuideSheet
					title={t("showhowGuide.reviewTitle")}
					description={t("showhowGuide.sentOnly")}
					returnFocusTo={invoker.current}
					onClose={close}
				>
					<label className="flex items-center justify-between border-t border-ds-line py-3">
						<span>{t("showhowGuide.transcriptWords", { count: preview?.wordCount ?? 0 })}</span>
						<input
							type="checkbox"
							aria-label={t("showhowGuide.sendTranscript")}
							checked={options.transcript}
							onChange={(event) =>
								void changeOptions({ ...options, transcript: event.target.checked })
							}
						/>
					</label>
					<label className="flex items-center justify-between border-t border-ds-line py-3">
						<span>{t("showhowGuide.selectedFrames", { count: preview?.frames.length ?? 0 })}</span>
						<input
							type="checkbox"
							aria-label={t("showhowGuide.sendFrames")}
							checked={options.frames}
							onChange={(event) => void changeOptions({ ...options, frames: event.target.checked })}
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
						OpenRouter · {preview?.model ?? status?.model}
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
							checked={alwaysSend}
							onChange={(event) => setAlwaysSend(event.target.checked)}
						/>
						{t("showhowGuide.always")}
					</label>
					{error && <p role="alert">{error}</p>}
					<div className="flex justify-end gap-2 border-t border-ds-line pt-3">
						<Button type="button" variant="ghost" onClick={close}>
							{t("showhowGuide.cancel")}
						</Button>
						<Button
							type="button"
							disabled={busy || !preview}
							onClick={() => {
								if (preview) void run(preview, true);
							}}
						>
							{t("showhowGuide.make")}
						</Button>
					</div>
				</GuideSheet>
			)}
		</section>
	);
}
