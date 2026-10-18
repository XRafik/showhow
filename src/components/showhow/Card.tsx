import type { ReactNode } from "react";

export interface CardProps {
	eyebrow?: string;
	title?: string;
	children?: ReactNode;
	actions?: ReactNode;
}

export function Card({ eyebrow, title, children, actions }: CardProps) {
	return (
		<section className="flex w-[360px] max-w-full flex-col gap-4 rounded-[8px] border border-ds-line bg-ds-surface p-4">
			{eyebrow && (
				<span className="font-ds-label text-[11px] tracking-[0.8px] uppercase text-ds-ink-soft">
					{eyebrow}
				</span>
			)}
			{title && (
				<h2 className="font-ds-display text-2xl font-semibold tracking-[-0.5px] text-ds-ink">
					{title}
				</h2>
			)}
			<div className="font-ds-body text-[14px] leading-[1.5] text-ds-ink">{children}</div>
			{actions && <div className="flex gap-2">{actions}</div>}
		</section>
	);
}
