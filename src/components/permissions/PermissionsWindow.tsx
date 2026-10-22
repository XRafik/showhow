import {
	Accessibility,
	Check,
	ExternalLink,
	Mic,
	MonitorPlay,
	RotateCw,
	Video,
	Volume2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/showhow/Button";
import { useScopedT } from "@/contexts/I18nContext";

type PermissionsApi = Window["electronAPI"]["permissions"];
type Snapshot = Awaited<ReturnType<PermissionsApi["get"]>>;
type Kind = Parameters<PermissionsApi["request"]>[0];
type Status = Snapshot["screen"];

/**
 * How often the statuses are re-read while the window is open. The user changes them in
 * System Settings, which tells no one, so polling is the only way to follow along; each
 * Screen Recording read spawns a short-lived helper, which is cheap at this rate.
 */
export const PERMISSIONS_POLL_MS = 500;

type Row = {
	kind: Kind;
	level: "required" | "recommended" | "optional";
	Icon: typeof MonitorPlay;
};

const OTHER_ROWS: readonly Row[] = [
	{ kind: "accessibility", level: "recommended", Icon: Accessibility },
	{ kind: "microphone", level: "optional", Icon: Mic },
	{ kind: "camera", level: "optional", Icon: Video },
];

/**
 * With the app's own picker, Screen Recording is required and also covers system audio.
 * With Apple's picker (macOS 15.2+) nothing is required: the pick is the consent, and
 * system audio comes from a Core Audio tap under its own, optional grant.
 */
function rowsFor(snapshot: Snapshot): readonly Row[] {
	const first: Row = snapshot.screenRequired
		? { kind: "screen", level: "required", Icon: MonitorPlay }
		: { kind: "systemAudio", level: "optional", Icon: Volume2 };
	return [first, ...OTHER_ROWS];
}

/**
 * From macOS 15, any app that uses ScreenCaptureKit outside Apple's system picker gets an
 * alert asking whether it may "bypass the system private window picker", on top of the
 * Screen Recording grant and again periodically. It cannot be raised on demand (replayd
 * shows it on its own schedule, whatever the last answer was), and its approval cannot be
 * read, so it cannot be a row with a status. What the window can do is say it is coming,
 * and which button to press, before the first recording meets it.
 */
const RECURRING_SCREEN_ALERT_FROM_MACOS = 15;

export function PermissionsWindow() {
	const t = useScopedT("launch");
	const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
	const [busy, setBusy] = useState<Kind | null>(null);
	const mounted = useRef(true);

	const refresh = useCallback(async () => {
		try {
			const next = await window.electronAPI.permissions.get();
			if (mounted.current) {
				setSnapshot(next);
			}
		} catch (error) {
			console.warn("[permissions] read failed:", error);
		}
	}, []);

	useEffect(() => {
		mounted.current = true;
		let timer: number | undefined;
		// Sequential rather than setInterval: a slow read must not stack up behind itself.
		const tick = async () => {
			await refresh();
			if (mounted.current) {
				timer = window.setTimeout(tick, PERMISSIONS_POLL_MS);
			}
		};
		void tick();
		return () => {
			mounted.current = false;
			window.clearTimeout(timer);
		};
	}, [refresh]);

	const act = useCallback(
		async (kind: Kind, status: Status) => {
			setBusy(kind);
			try {
				if (status === "denied" || status === "requested") {
					await window.electronAPI.permissions.openSettings(kind);
				} else {
					await window.electronAPI.permissions.request(kind);
				}
				await refresh();
			} finally {
				if (mounted.current) {
					setBusy(null);
				}
			}
		},
		[refresh],
	);

	if (!snapshot) {
		return <div className="h-screen bg-ds-surface" />;
	}

	const screenReady =
		!snapshot.screenRequired || (snapshot.screen === "granted" && !snapshot.screenRequiresRelaunch);
	const needsRelaunch = snapshot.screen === "granted" && snapshot.screenRequiresRelaunch;

	return (
		<div className="flex h-screen flex-col bg-ds-surface px-7 pt-6 pb-6 font-ds-body text-ds-ink select-none">
			<p className="font-ds-label text-[10px] leading-[normal] font-medium uppercase tracking-[1px] text-ds-ink-faint">
				{t("sheets.eyebrow")}
			</p>
			<h1 className="mt-[6px] font-ds-display text-[22px] leading-[normal] font-semibold tracking-[-0.02em] text-ds-ink">
				{t("permissions.title")}
			</h1>
			<p className="mt-[6px] max-w-[440px] text-[13px] leading-5 text-ds-muted">
				{t("permissions.subtitle")}
			</p>

			<ul className="mt-5 mb-6 shrink-0 overflow-hidden rounded-[8px] border border-ds-line bg-ds-surface-raised">
				{rowsFor(snapshot).map(({ kind, level, Icon }) => {
					const status = snapshot[kind];
					return (
						<li
							key={kind}
							data-testid={`permission-${kind}`}
							data-status={status}
							className="border-t border-ds-line px-4 py-[14px] first:border-t-0"
						>
							<div className="grid grid-cols-[18px_minmax(0,1fr)_auto] items-center gap-[14px]">
								<Icon
									className={`h-[18px] w-[18px] shrink-0 stroke-[1.75] ${level === "required" ? "text-ds-rec" : "text-ds-ink-soft"}`}
									aria-hidden
								/>
								<div className="min-w-0">
									<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
										<span className="font-ds-body text-[14px] leading-[normal] font-medium text-ds-ink">
											{t(`permissions.rows.${kind}.name`)}
										</span>
										<span
											className={`rounded-[3px] px-[6px] py-[2px] font-ds-label text-[10px] leading-[normal] font-medium uppercase tracking-[0.6px] ${
												level === "required"
													? "bg-ds-rec-wash text-ds-rec-ink dark:text-ds-rec-soft"
													: level === "recommended"
														? "bg-ds-accent-tint text-ds-accent-strong dark:text-ds-accent"
														: "bg-ds-chip text-ds-muted"
											}`}
										>
											{t(`permissions.level.${level}`)}
										</span>
									</div>
									<p className="mt-[2px] font-ds-body text-[12.5px] leading-[18px] text-ds-muted">
										{t(`permissions.rows.${kind}.description`)}
									</p>
								</div>
								<PermissionAction
									kind={kind}
									status={status}
									busy={busy === kind}
									onAct={() => void act(kind, status)}
									t={t}
								/>
							</div>
							{kind === "screen" && (
								<ScreenHelp snapshot={snapshot} needsRelaunch={needsRelaunch} t={t} />
							)}
							{kind === "systemAudio" && <SystemAudioHelp status={status} t={t} />}
						</li>
					);
				})}
			</ul>

			<div className="mt-auto flex items-center justify-between gap-4 border-t border-ds-line pt-4">
				<p className="flex min-w-0 items-center gap-2 text-[13px] leading-[18px] text-ds-muted">
					<span
						aria-hidden
						className={`h-[6px] w-[6px] shrink-0 rounded-full ${screenReady && !needsRelaunch ? "bg-ds-accent" : "bg-ds-rec"}`}
					/>
					{needsRelaunch
						? t("permissions.footer.restart")
						: screenReady
							? t("permissions.footer.ready")
							: t("permissions.footer.screenRequired")}
				</p>
				{needsRelaunch ? (
					<Button
						variant="dark"
						type="button"
						data-testid="permissions-relaunch"
						onClick={() => void window.electronAPI.permissions.relaunch()}
						icon={RotateCw}
						className="shrink-0 px-4 py-2.5 leading-[normal] disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-40 dark:bg-ds-accent dark:text-ds-on-accent dark:hover:bg-[var(--showhow-accent-hover)]"
					>
						{t("permissions.actions.restart")}
					</Button>
				) : (
					<Button
						variant="dark"
						type="button"
						data-testid="permissions-start"
						disabled={!screenReady}
						onClick={() => void window.electronAPI.permissions.close()}
						className="shrink-0 px-4 py-2.5 leading-[normal] disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-40 dark:bg-ds-accent dark:text-ds-on-accent dark:hover:bg-[var(--showhow-accent-hover)]"
					>
						{t("permissions.actions.start")}
					</Button>
				)}
			</div>
		</div>
	);
}

type T = ReturnType<typeof useScopedT>;

function PermissionAction({
	kind,
	status,
	busy,
	onAct,
	t,
}: {
	kind: Kind;
	status: Status;
	busy: boolean;
	onAct: () => void;
	t: T;
}) {
	if (status === "granted") {
		return (
			<span className="flex shrink-0 items-center gap-1.5 font-ds-label text-[11px] leading-[normal] font-medium tracking-[0.6px] text-ds-accent-strong uppercase dark:text-ds-accent">
				<Check className="h-[14px] w-[14px] stroke-[1.75]" aria-hidden />
				{t("permissions.status.granted")}
			</span>
		);
	}
	if (status === "restricted") {
		return (
			<span className="max-w-[120px] shrink-0 text-right font-ds-body text-[12px] leading-[18px] text-ds-muted">
				{t("permissions.status.restricted")}
			</span>
		);
	}

	// Screen Recording's first step says "Continue", not "Allow": macOS' own prompt has no
	// Allow button, only a way into System Settings, and the label must not promise one.
	// `requested` is system audio's "asked, answer unknown": all that is left to offer is the
	// pane where the answer can be changed.
	const label =
		status === "denied" || status === "requested"
			? t("permissions.actions.openSettings")
			: kind === "screen"
				? t("permissions.actions.continue")
				: t("permissions.actions.allow");

	return (
		<Button
			variant="secondary"
			type="button"
			data-testid={`permission-${kind}-action`}
			disabled={busy}
			onClick={onAct}
			icon={status === "denied" || status === "requested" ? ExternalLink : undefined}
			className="shrink-0 gap-1 px-3 py-2 leading-[normal]"
		>
			{label}
		</Button>
	);
}

function ScreenHelp({
	snapshot,
	needsRelaunch,
	t,
}: {
	snapshot: Snapshot;
	needsRelaunch: boolean;
	t: T;
}) {
	const lines: string[] = [];
	if (needsRelaunch) {
		lines.push(t("permissions.help.screenRestart"));
	} else if (snapshot.screen === "denied") {
		lines.push(t("permissions.help.screenSettings"), t("permissions.help.screenNotListed"));
	} else if (snapshot.screen === "not-requested") {
		lines.push(t("permissions.help.screenPrompt"));
	}
	// Captures started from Apple's picker never raise that alert, so there is nothing to
	// warn about when the picker owns the choice.
	if (
		snapshot.screenRequired &&
		snapshot.screen === "granted" &&
		snapshot.macosMajor >= RECURRING_SCREEN_ALERT_FROM_MACOS
	) {
		lines.push(t("permissions.help.screenRecurring"));
	}
	if (lines.length === 0) {
		return null;
	}
	return (
		<div className="mt-3 ml-8 space-y-1 border-t border-ds-line pt-2.5">
			{lines.map((line, index) => (
				<p
					key={line}
					className={`font-ds-body text-[12.5px] leading-[18px] ${snapshot.screen === "denied" && index > 0 ? "text-ds-muted" : "text-ds-ink-soft"}`}
				>
					{line}
				</p>
			))}
		</div>
	);
}

function SystemAudioHelp({ status, t }: { status: Status; t: T }) {
	const line =
		status === "not-requested"
			? t("permissions.help.systemAudioPrompt")
			: status === "requested"
				? t("permissions.help.systemAudioRequested")
				: null;
	if (!line) {
		return null;
	}
	return (
		<div className="mt-3 ml-8 border-t border-ds-line pt-2.5">
			<p className="font-ds-body text-[12.5px] leading-[18px] text-ds-ink-soft">{line}</p>
		</div>
	);
}
