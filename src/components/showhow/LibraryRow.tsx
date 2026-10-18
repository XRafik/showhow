import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface LibraryRowProps {
	title: string;
	meta: string;
	isNew?: boolean;
	selected?: boolean;
	onSelect: () => void;
	trailing?: ReactNode;
}

export function LibraryRow({ title, meta, isNew, selected, onSelect, trailing }: LibraryRowProps) {
	return (
		<button
			type="button"
			className={cn(
				"flex w-full flex-col items-stretch gap-[5px] rounded-[6px] p-[10px] text-left transition-colors [transition-duration:120ms] focus-visible:outline focus-visible:outline-2 focus-visible:outline-ds-accent motion-reduce:transition-none",
				selected ? "bg-ds-on-panel-wash" : "bg-transparent hover:bg-[#FFFCF70D]",
			)}
			aria-current={selected ? "true" : undefined}
			onClick={onSelect}
		>
			<span className="font-ds-body text-[13px] font-medium leading-[1.3] text-ds-on-panel">
				{title}
			</span>
			<span className="flex items-center gap-2 font-ds-label text-[10px] tracking-[0.6px] uppercase text-ds-on-panel-muted">
				{meta}
				{isNew && <span className="text-ds-accent">· NEW</span>}
				{trailing}
			</span>
		</button>
	);
}
