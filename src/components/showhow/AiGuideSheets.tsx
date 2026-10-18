import { type ReactNode, useRef } from "react";
import { useScopedT } from "@/contexts/I18nContext";
import { Button } from "./Button";
import { Sheet } from "./Sheet";
export function GuideSheet({
	title,
	description,
	onClose,
	returnFocusTo,
	children,
}: {
	title: string;
	description: string;
	onClose: () => void;
	returnFocusTo?: HTMLElement | null;
	children: ReactNode;
}) {
	const fallbackReturnFocus = useRef(
		document.activeElement instanceof HTMLElement ? document.activeElement : null,
	);
	return (
		<Sheet
			open
			title={title}
			description={description}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
			onCloseAutoFocus={(event) => {
				event.preventDefault();
				const target = returnFocusTo ?? fallbackReturnFocus.current;
				if (target?.isConnected) target.focus();
			}}
		>
			{children}
		</Sheet>
	);
}

export function GuideConnectSheet({
	onClose,
	onConnect,
	returnFocusTo,
}: {
	onClose: () => void;
	onConnect: (trigger: HTMLButtonElement) => void;
	returnFocusTo?: HTMLElement | null;
}) {
	const t = useScopedT("common");
	return (
		<GuideSheet
			title={t("showhowGuide.connectTitle")}
			description={t("showhowGuide.connectBody")}
			onClose={onClose}
			returnFocusTo={returnFocusTo}
		>
			<div className="border-b border-ds-line py-3">
				<h3 className="text-lg font-medium">ChatGPT</h3>
				<Button type="button" variant="secondary" disabled>
					ChatGPT · {t("showhowGuide.later")}
				</Button>
			</div>
			<div className="py-3">
				<h3 className="text-lg font-medium">OpenRouter</h3>
				<p className="mb-3 text-sm text-ds-ink-soft">{t("showhowGuide.ownKey")}</p>
				<Button type="button" onClick={(event) => onConnect(event.currentTarget)}>
					{t("showhowGuide.connect")}
				</Button>
			</div>
			<div className="flex justify-end border-t border-ds-line pt-3">
				<Button type="button" variant="ghost" onClick={onClose}>
					{t("showhowGuide.cancel")}
				</Button>
			</div>
		</GuideSheet>
	);
}
