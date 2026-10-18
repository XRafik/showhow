import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ShellProps extends HTMLAttributes<HTMLDivElement> {
	sidebar: ReactNode;
}

export function Shell({ sidebar, children, className, ...props }: ShellProps) {
	return (
		<div
			className={cn("flex h-full min-h-0 bg-ds-surface font-ds-body text-ds-ink", className)}
			{...props}
		>
			{sidebar}
			<main className="min-w-0 flex-1 overflow-auto">{children}</main>
		</div>
	);
}
