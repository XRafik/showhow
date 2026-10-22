import { Upload } from "lucide-react";
import { type ComponentProps, useEffect, useRef, useState } from "react";
import { useScopedT } from "@/contexts/I18nContext";
import type {
	ImportRecordingProgress,
	RecordingLibraryEntry,
} from "@/lib/showhow/recordingLibrary";
import { Button } from "./Button";
import { Progress } from "./Progress";
import { Sheet } from "./Sheet";

interface ImportVideoSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onImported: (entry: RecordingLibraryEntry) => void;
	onCloseAutoFocus?: ComponentProps<typeof Sheet>["onCloseAutoFocus"];
}

export function ImportVideoSheet({
	open,
	onOpenChange,
	onImported,
	onCloseAutoFocus,
}: ImportVideoSheetProps) {
	const t = useScopedT("common");
	const [progress, setProgress] = useState<ImportRecordingProgress | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [cancelling, setCancelling] = useState(false);
	const request = useRef<string | null>(null);
	useEffect(() => {
		if (!open) return;
		setError(null);
		return window.electronAPI.showhowOnImportProgress((value) => {
			if (value.requestId === request.current) setProgress(value);
		});
	}, [open]);
	useEffect(
		() => () => {
			if (request.current)
				void window.electronAPI
					.showhowCancelImport({ requestId: request.current })
					.catch(() => undefined);
		},
		[],
	);
	const close = () => {
		if (!request.current) {
			onOpenChange(false);
			return;
		}
		setCancelling(true);
		void window.electronAPI.showhowCancelImport({ requestId: request.current }).catch(() => {
			setCancelling(false);
			setError(t("importVideo.cancelFailed"));
		});
	};
	const choose = async () => {
		if (request.current) return;
		const requestId = crypto.randomUUID();
		request.current = requestId;
		setError(null);
		setCancelling(false);
		setProgress({ requestId, phase: "picking", bytesCopied: 0, totalBytes: 0 });
		try {
			const result = await window.electronAPI.showhowImportRecording({ requestId });
			if (result.status === "imported") {
				onImported(result.entry);
				onOpenChange(false);
			} else if (result.status === "failed") setError(result.error);
			else onOpenChange(false);
		} catch {
			setError(t("importVideo.failedBody"));
		} finally {
			request.current = null;
			setProgress(null);
			setCancelling(false);
		}
	};
	const phase = cancelling
		? t("importVideo.cancelling")
		: progress
			? t(`importVideo.${progress.phase}`)
			: "";
	return (
		<Sheet
			open={open}
			onOpenChange={(next) => {
				if (!next) close();
			}}
			onCloseAutoFocus={onCloseAutoFocus}
			title={error ? t("importVideo.failed") : t("importVideo.title")}
			eyebrow={t("importVideo.eyebrow")}
			description={t("importVideo.description")}
			footer={
				<>
					<Button variant="secondary" disabled={cancelling} onClick={close}>
						{t("importVideo.cancel")}
					</Button>
					{!progress && (
						<Button icon={Upload} onClick={() => void choose()}>
							{error ? t("importVideo.retry") : t("importVideo.choose")}
						</Button>
					)}
				</>
			}
		>
			{error && (
				<p role="alert" className="mb-4 break-words text-sm text-ds-rec-ink">
					{error}
				</p>
			)}
			{progress ? (
				<div className="space-y-4">
					<p role="status" className="font-ds-display text-lg">
						{phase}
					</p>
					{progress.fileName && (
						<p className="break-all text-sm text-ds-ink-soft">{progress.fileName}</p>
					)}
					<Progress
						label={phase}
						value={
							progress.phase === "picking"
								? 0
								: progress.phase === "copying" && progress.totalBytes > 0
									? (progress.bytesCopied / progress.totalBytes) * 100
									: progress.phase === "validating" || progress.phase === "saving"
										? 100
										: undefined
						}
					/>
					{progress.totalBytes > 0 && (
						<p className="font-ds-label text-xs tabular-nums text-ds-ink-soft">
							{t("importVideo.bytes", { copied: progress.bytesCopied, total: progress.totalBytes })}
						</p>
					)}
				</div>
			) : (
				<div className="rounded-[6px] border border-dashed border-ds-line p-6 text-center">
					<Upload aria-hidden="true" className="mx-auto mb-3 size-7 text-ds-ink-soft" />
					<p className="mb-2 font-ds-display text-lg">{t("importVideo.local")}</p>
					<p className="text-sm text-ds-ink-soft">{t("importVideo.body")}</p>
				</div>
			)}
		</Sheet>
	);
}
