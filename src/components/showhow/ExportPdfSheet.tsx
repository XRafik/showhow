import { Check, CircleCheck, FileText, Folder } from "lucide-react";
import { type ComponentProps, useEffect, useRef, useState } from "react";
import { useScopedT } from "@/contexts/I18nContext";
import {
	DEFAULT_PDF_OPTIONS,
	type PdfExportOptions,
	type PdfExportResult,
} from "@/lib/showhow/pdfExport";
import type { RecordingLibraryEntry } from "@/lib/showhow/recordingLibrary";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { Sheet } from "./Sheet";

const PARTS = ["screenshots", "narration", "timestamps"] as const;

function formatDuration(ms: number) {
	const total = Math.floor(ms / 1000);
	return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function Toggle({
	label,
	checked,
	disabled,
	onChange,
}: {
	label: string;
	checked: boolean;
	disabled: boolean;
	onChange: (checked: boolean) => void;
}) {
	return (
		<div className="flex items-center justify-between border-t border-ds-line py-3">
			<span id={`pdf-${label}`}>{label}</span>
			<button
				type="button"
				role="switch"
				aria-checked={checked}
				aria-labelledby={`pdf-${label}`}
				disabled={disabled}
				onClick={() => onChange(!checked)}
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
		</div>
	);
}

/** A schematic of the page: real title and step count, placeholder rows for each included part. */
function PdfPreview({
	entry,
	options,
	label,
	meta,
}: {
	entry: RecordingLibraryEntry;
	options: PdfExportOptions;
	label: string;
	meta: string;
}) {
	return (
		<figure
			aria-label={label}
			className="flex min-h-[250px] flex-col rounded-[6px] border border-ds-line bg-ds-surface-raised p-[14px] text-ds-ink"
		>
			<p className="line-clamp-3 break-words font-ds-display text-[12px] font-semibold leading-tight">
				{entry.title}
			</p>
			<p className="mb-3 mt-1 font-ds-label text-[7px] uppercase tracking-[0.6px] text-ds-ink-soft">
				{meta}
			</p>
			{Array.from({ length: Math.min(3, entry.steps?.length ?? 0) }, (_, index) => (
				<div key={index} aria-hidden="true" className="flex gap-2 border-t border-ds-line py-[7px]">
					{options.screenshots && (
						<span className="h-[32px] w-[50px] shrink-0 rounded-[2px] border border-ds-line bg-ds-surface-sunken" />
					)}
					<span className="flex flex-1 flex-col gap-[4px] pt-[3px]">
						<span className="h-[3px] w-4/5 rounded bg-ds-chip" />
						{options.narration && <span className="h-[3px] w-3/5 rounded bg-ds-line" />}
						{options.timestamps && <span className="h-[3px] w-[18px] rounded bg-ds-rec/50" />}
					</span>
				</div>
			))}
		</figure>
	);
}

export function ExportPdfSheet({
	entry,
	open,
	onOpenChange,
	onCloseAutoFocus,
}: {
	entry: RecordingLibraryEntry;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onCloseAutoFocus?: ComponentProps<typeof Sheet>["onCloseAutoFocus"];
}) {
	const t = useScopedT("common");
	const [options, setOptions] = useState<PdfExportOptions>(DEFAULT_PDF_OPTIONS);
	const [destination, setDestination] = useState<string>();
	const [status, setStatus] = useState<"idle" | "exporting" | "failed" | "choose-failed">("idle");
	const [saved, setSaved] = useState<Extract<PdfExportResult, { status: "saved" }>>();
	const [revealFailed, setRevealFailed] = useState(false);
	const active = useRef(true);
	useEffect(() => {
		active.current = true;
		if (!open) return;
		setOptions(DEFAULT_PDF_OPTIONS);
		setSaved(undefined);
		setStatus("idle");
		setRevealFailed(false);
		void window.electronAPI
			.showhowPdfDestination(entry.bundleDir)
			.then((value) => {
				if (active.current) setDestination(value.display);
			})
			.catch(() => undefined);
		return () => {
			active.current = false;
		};
	}, [open, entry.bundleDir]);

	const count = entry.steps?.length ?? 0;
	const meta = [
		count === 1 ? t("showhowPdf.oneStep") : t("showhowPdf.steps", { count }),
		...(entry.durationMs === undefined ? [] : [formatDuration(entry.durationMs)]),
	].join(" · ");
	const included = PARTS.filter((part) => options[part]).map((part) =>
		t(`showhowPdf.${part}`).toLowerCase(),
	);
	const listed =
		included.length > 1
			? t("showhowPdf.list", {
					items: included.slice(0, -1).join(", "),
					last: included.at(-1) ?? "",
				})
			: (included[0] ?? t("showhowPdf.stepsOnly"));
	const summary = listed[0]!.toUpperCase() + listed.slice(1);
	const exporting = status === "exporting";

	const exportNow = async () => {
		setStatus("exporting");
		try {
			const result = await window.electronAPI.showhowPdfExport(entry.bundleDir, options);
			if (!active.current) return;
			if (result.status === "saved") {
				setSaved(result);
				setStatus("idle");
			} else setStatus("failed");
		} catch {
			if (active.current) setStatus("failed");
		}
	};
	const change = async () => {
		setStatus("idle");
		try {
			const result = await window.electronAPI.showhowPdfChooseDestination(entry.bundleDir);
			if (!active.current) return;
			if ("display" in result) setDestination(result.display);
			else if (result.status === "failed") setStatus("choose-failed");
		} catch {
			if (active.current) setStatus("choose-failed");
		}
	};

	return (
		<Sheet
			open={open}
			onOpenChange={(next) => {
				if (!exporting) onOpenChange(next);
			}}
			onCloseAutoFocus={onCloseAutoFocus}
			eyebrow={t("showhowPdf.eyebrow")}
			title={t("showhowPdf.title")}
			footer={
				saved ? (
					<div className="flex w-full justify-end">
						<Button type="button" variant="dark" icon={Check} onClick={() => onOpenChange(false)}>
							{t("showhowPdf.done")}
						</Button>
					</div>
				) : (
					<div className="flex w-full flex-wrap items-center justify-between gap-3">
						<p className="font-ds-label text-[10px] uppercase tracking-[0.8px] text-ds-ink-soft">
							{summary}
						</p>
						<div className="flex gap-2">
							<Button
								type="button"
								variant="secondary"
								disabled={exporting}
								onClick={() => onOpenChange(false)}
							>
								{t("showhowPdf.cancel")}
							</Button>
							<Button
								type="button"
								variant="dark"
								icon={FileText}
								disabled={exporting}
								onClick={() => void exportNow()}
							>
								{exporting ? t("showhowPdf.exporting") : t("showhowPdf.export")}
							</Button>
						</div>
					</div>
				)
			}
		>
			<div className="grid gap-5 min-[520px]:grid-cols-[180px_1fr]">
				<PdfPreview entry={entry} options={options} label={t("showhowPdf.preview")} meta={meta} />
				{saved ? (
					<div role="status" className="flex min-w-0 flex-col items-start gap-2 pt-1">
						<CircleCheck aria-hidden="true" className="mb-2 size-6 text-ds-accent-strong" />
						<p className="text-[15px]">
							<span>{t("showhowPdf.saved")}</span> ·{" "}
							<button
								type="button"
								className="underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2"
								onClick={() => {
									setRevealFailed(false);
									void window.electronAPI
										.showhowPdfReveal(saved.revealId)
										.then((result) => {
											if (active.current && !result.success) setRevealFailed(true);
										})
										.catch(() => {
											if (active.current) setRevealFailed(true);
										});
								}}
							>
								{t("showhowPdf.showInFinder")}
							</button>
						</p>
						<p className="max-w-full break-words text-sm text-ds-ink-soft">
							{t("showhowPdf.savedTo", { folder: saved.display })}
						</p>
						{revealFailed && (
							<p role="alert" className="text-sm text-ds-rec-ink">
								{t("showhowPdf.revealFailed")}
							</p>
						)}
					</div>
				) : (
					// min-w-0 lets a long destination truncate instead of widening the sheet.
					<div className="min-w-0">
						<p className="font-ds-label text-[10px] uppercase tracking-[0.8px] text-ds-ink-soft">
							{t("showhowPdf.include")}
						</p>
						<div className="mt-2">
							{PARTS.map((part) => (
								<Toggle
									key={part}
									label={t(`showhowPdf.${part}`)}
									checked={options[part]}
									disabled={exporting}
									onChange={(checked) => setOptions((current) => ({ ...current, [part]: checked }))}
								/>
							))}
							<div className="flex items-center justify-between gap-3 border-t border-ds-line py-3">
								<span className="flex min-w-0 items-center gap-2">
									<Folder aria-hidden="true" className="size-[15px] shrink-0" />
									<span className="sr-only">{t("showhowPdf.saveTo")}</span>
									<span className="truncate" title={destination}>
										{destination ?? "…"}
									</span>
								</span>
								<Button
									type="button"
									variant="ghost"
									className="px-1 py-1 text-ds-ink"
									disabled={exporting}
									onClick={() => void change()}
								>
									{t("showhowPdf.change")}
								</Button>
							</div>
						</div>
						{(status === "failed" || status === "choose-failed") && (
							<p role="alert" className="mt-2 text-sm text-ds-rec-ink">
								{t(status === "failed" ? "showhowPdf.failed" : "showhowPdf.chooseFailed")}
							</p>
						)}
					</div>
				)}
			</div>
		</Sheet>
	);
}
