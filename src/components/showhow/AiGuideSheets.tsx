import { type ReactNode, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useScopedT } from "@/contexts/I18nContext";
import { Button } from "./Button";
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
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<DialogContent
				onCloseAutoFocus={(event) => {
					event.preventDefault();
					const target = returnFocusTo ?? fallbackReturnFocus.current;
					if (target?.isConnected) target.focus();
				}}
				className="max-h-[85vh] max-w-[560px] overflow-y-auto rounded-[12px] border-ds-line bg-ds-surface p-5 text-ds-ink shadow-[4px_4px_0_var(--showhow-accent)]"
			>
				<DialogTitle className="pr-8 font-ds-body text-[20px]">{title}</DialogTitle>
				<DialogDescription className="text-ds-ink-soft">{description}</DialogDescription>
				{children}
			</DialogContent>
		</Dialog>
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
