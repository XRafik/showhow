import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useScopedT } from "@/contexts/I18nContext";
import { DEFAULT_GUIDE_MODEL } from "@/lib/showhow/aiGuide";
import { SHOWHOW_AI_MODELS } from "@/lib/showhow/aiModels";
import { nativeBridgeClient } from "@/native/client";
import { Button } from "./Button";

const OTHER_MODEL_OPTION = "other";

export function AiConnections({
	onSaved,
	onRemoved,
	embedded,
}: {
	onSaved?: () => void;
	onRemoved?: () => void;
	/** Inside a Settings row that already names OpenRouter and explains the key. */
	embedded?: boolean;
}) {
	const t = useScopedT("common");
	const [model, setModel] = useState(DEFAULT_GUIDE_MODEL);
	const [key, setKey] = useState("");
	const [connected, setConnected] = useState(false);
	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState("");
	const selectedModelOption = SHOWHOW_AI_MODELS.some((option) => option.id === model)
		? model
		: OTHER_MODEL_OPTION;
	useEffect(() => {
		let active = true;
		void window.electronAPI
			.showhowAiGuideStatus()
			.then((status) => {
				if (active) {
					setConnected(status.connected);
					setModel(status.model);
				}
			})
			.catch(() => {
				if (active) setMessage(t("showhowGuide.settingsError"));
			});
		return () => {
			active = false;
		};
	}, [t]);
	async function save() {
		setBusy(true);
		setMessage("");
		try {
			if (!model.trim() || (!key.trim() && !connected)) throw new Error("Missing connection");
			if (key.trim()) {
				const result = await nativeBridgeClient.aiEdition.llmSetApiKey("openrouter", key.trim());
				if (!result.success) throw new Error("Key save failed");
			}
			const result = await nativeBridgeClient.aiEdition.llmSetConfig({
				provider: "openrouter",
				model: model.trim(),
			});
			if (!result.success) throw new Error("Model save failed");
			setConnected(true);
			setKey("");
			setMessage(t("showhowGuide.saved"));
			onSaved?.();
		} catch {
			setMessage(t("showhowGuide.saveError"));
		} finally {
			setBusy(false);
		}
	}
	async function remove() {
		setBusy(true);
		try {
			const result = await nativeBridgeClient.aiEdition.llmRemoveApiKey("openrouter");
			if (!result.success) throw new Error("Remove failed");
			setConnected(false);
			setKey("");
			setMessage(t("showhowGuide.removed"));
			onRemoved?.();
		} catch {
			setMessage(t("showhowGuide.removeError"));
		} finally {
			setBusy(false);
		}
	}
	return (
		<section aria-label={t("showhowGuide.connections")} className="grid gap-4">
			{!embedded && <h3 className="font-ds-body text-lg font-medium">OpenRouter</h3>}
			<label className="grid gap-2 text-sm">
				{t("showhowGuide.apiKey")}
				<input
					type="password"
					autoComplete="new-password"
					value={key}
					onChange={(event) => setKey(event.target.value)}
					className="rounded border border-ds-line bg-ds-surface p-2 text-ds-ink"
					placeholder={connected ? "••••••••" : "sk-or-…"}
				/>
			</label>
			<div className="grid gap-2 text-sm">
				<span>{t("showhowGuide.model")}</span>
				<Select.Root
					value={selectedModelOption}
					disabled={busy}
					onValueChange={(value) => {
						if (value === OTHER_MODEL_OPTION) {
							if (selectedModelOption !== OTHER_MODEL_OPTION) setModel("");
						} else {
							setModel(value);
						}
					}}
				>
					<Select.Trigger
						aria-label={t("showhowGuide.model")}
						className="flex w-full items-center justify-between rounded border border-ds-line bg-ds-surface p-2 text-left text-ds-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ds-ink"
					>
						<Select.Value />
						<Select.Icon aria-hidden="true">
							<ChevronDown size={16} />
						</Select.Icon>
					</Select.Trigger>
					<Select.Portal>
						<Select.Content
							position="popper"
							sideOffset={4}
							className="z-50 max-h-[var(--radix-select-content-available-height)] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded border border-ds-line bg-ds-surface text-ds-ink shadow-lg"
						>
							<Select.Viewport className="p-1">
								{SHOWHOW_AI_MODELS.map((option) => (
									<Select.Item
										key={option.id}
										value={option.id}
										aria-label={`${option.label}, ${option.id}${option.id === DEFAULT_GUIDE_MODEL ? `, ${t("showhowGuide.modelDefault")}` : ""}`}
										className="relative flex cursor-default select-none items-center justify-between gap-3 rounded px-3 py-2 pr-8 outline-none data-[highlighted]:bg-ds-ink-wash"
									>
										<span className="flex min-w-0 flex-col gap-0.5">
											<Select.ItemText>{option.label}</Select.ItemText>
											<span aria-hidden="true" className="font-mono text-xs text-ds-ink-soft">
												{option.id}
											</span>
										</span>
										{option.id === DEFAULT_GUIDE_MODEL && (
											<span
												aria-hidden="true"
												className="rounded bg-ds-ink-wash px-1.5 py-0.5 text-xs text-ds-ink-soft"
											>
												{t("showhowGuide.modelDefault")}
											</span>
										)}
										<Select.ItemIndicator className="absolute right-2">
											<Check size={14} aria-hidden="true" />
										</Select.ItemIndicator>
									</Select.Item>
								))}
								<Select.Separator className="my-1 h-px bg-ds-line" />
								<Select.Item
									value={OTHER_MODEL_OPTION}
									className="relative flex cursor-default select-none items-center rounded px-3 py-2 pr-8 outline-none data-[highlighted]:bg-ds-ink-wash"
								>
									<Select.ItemText>{t("showhowGuide.modelOther")}</Select.ItemText>
									<Select.ItemIndicator className="absolute right-2">
										<Check size={14} aria-hidden="true" />
									</Select.ItemIndicator>
								</Select.Item>
							</Select.Viewport>
						</Select.Content>
					</Select.Portal>
				</Select.Root>
				{selectedModelOption === OTHER_MODEL_OPTION && (
					<div className="grid gap-2">
						<label className="grid gap-2">
							{t("showhowGuide.modelSlug")}
							<input
								value={model}
								onChange={(event) => setModel(event.target.value)}
								placeholder="vendor/model"
								autoComplete="off"
								spellCheck={false}
								className="rounded border border-ds-line bg-ds-surface p-2 text-ds-ink"
							/>
						</label>
						<p className="text-xs text-ds-ink-soft">{t("showhowGuide.modelOtherHelper")}</p>
					</div>
				)}
			</div>
			<div className="flex gap-2">
				<Button
					type="button"
					disabled={busy || !model.trim() || (!connected && !key.trim())}
					onClick={() => void save()}
				>
					{t("showhowGuide.saveConnection")}
				</Button>
				<Button
					type="button"
					variant="ghost"
					disabled={busy || !connected}
					onClick={() => void remove()}
				>
					{t("showhowGuide.removeKey")}
				</Button>
			</div>
			<p role="status" className="text-sm">
				{message}
			</p>
		</section>
	);
}
