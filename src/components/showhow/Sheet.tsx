import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { type ComponentProps, type ReactNode, useId } from "react";
import {
	Dialog,
	DialogClose,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "./Button";

export interface SheetProps extends ComponentProps<typeof Dialog> {
	title: string;
	eyebrow?: string;
	description?: string;
	trigger?: ReactNode;
	footer?: ReactNode;
}

export function Sheet({
	title,
	eyebrow,
	description,
	trigger,
	footer,
	children,
	...props
}: SheetProps) {
	const descriptionId = useId();
	return (
		<Dialog {...props}>
			{trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
			<DialogPortal>
				<DialogOverlay
					data-showhow-sheet-overlay=""
					className="motion-reduce:!animate-none motion-reduce:!transition-none"
				/>
				<DialogPrimitive.Content
					aria-modal="true"
					aria-describedby={description ? descriptionId : undefined}
					className="fixed left-1/2 top-1/2 z-[10000] -translate-x-1/2 -translate-y-1/2 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 flex max-h-[calc(100vh-48px)] w-[calc(100%-48px)] max-w-[560px] flex-col gap-0 overflow-auto rounded-[10px] border border-ds-line bg-ds-surface p-0 font-ds-body text-ds-ink shadow-[4px_4px_0_var(--ds-accent)] motion-reduce:!animate-none motion-reduce:!transition-none"
				>
					<DialogHeader className="border-b border-ds-line px-5 pb-[14px] pt-[18px] text-left">
						{eyebrow && (
							<span className="font-ds-label text-[10px] uppercase tracking-[1px] text-ds-ink-soft">
								{eyebrow}
							</span>
						)}
						<DialogTitle className="pr-6 font-ds-display text-xl font-semibold leading-[1.3] tracking-[-0.2px]">
							{title}
						</DialogTitle>
						{description && (
							<DialogDescription id={descriptionId} className="text-ds-ink-soft">
								{description}
							</DialogDescription>
						)}
					</DialogHeader>
					<div className="px-5 py-[18px]">{children}</div>
					{footer && (
						<DialogFooter className="border-t border-ds-line px-5 py-[14px]">{footer}</DialogFooter>
					)}

					<DialogClose asChild>
						<Button
							variant="ghost"
							aria-label="Close"
							className="absolute right-3 top-3 size-8 p-0"
							icon={X}
						/>
					</DialogClose>
				</DialogPrimitive.Content>
			</DialogPortal>
		</Dialog>
	);
}
