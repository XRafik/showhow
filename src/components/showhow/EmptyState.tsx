import type { ReactNode } from "react";

export interface EmptyStateProps {
	title: string;
	body: string;
	action?: ReactNode;
}

export function EmptyState({ title, body, action }: EmptyStateProps) {
	return (
		<div className="flex flex-col items-center gap-[10px] rounded-[8px] bg-ds-surface-raised px-5 py-9 text-center">
			<h3 className="font-ds-display text-xl font-semibold text-ds-ink">{title}</h3>
			<p className="max-w-[280px] font-ds-body text-[12.5px] leading-[1.55] text-ds-ink-soft">
				{body}
			</p>
			{action}
		</div>
	);
}
