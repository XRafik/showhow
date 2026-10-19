import { useEffect, useState } from "react";
import { useScopedT } from "@/contexts/I18nContext";
import { DEFAULT_GUIDE_MODEL } from "@/lib/showhow/aiGuide";
import { nativeBridgeClient } from "@/native/client";
import { Button } from "./Button";
export function AiConnections({
	onSaved,
	onRemoved,
}: {
	onSaved?: () => void;
	onRemoved?: () => void;
}) {
	const t = useScopedT("common");
	const [model, setModel] = useState(DEFAULT_GUIDE_MODEL);
	const [key, setKey] = useState("");
	const [connected, setConnected] = useState(false);
	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState("");
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
			<h3 className="font-ds-body text-lg font-medium">OpenRouter</h3>
			<p className="text-sm text-ds-ink-soft">{t("showhowGuide.ownKey")}</p>
			<p className="text-xs text-ds-ink-soft">
				{t("showhowGuide.defaultModel")}: {DEFAULT_GUIDE_MODEL}
			</p>
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
			<label className="grid gap-2 text-sm">
				{t("showhowGuide.modelSlug")}
				<input
					value={model}
					onChange={(event) => setModel(event.target.value)}
					className="rounded border border-ds-line bg-ds-surface p-2 text-ds-ink"
				/>
			</label>
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
