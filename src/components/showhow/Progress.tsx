import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
	label: string;
	value?: number;
	failed?: boolean;
	frontier?: ReactNode;
}

export function Progress({
	label,
	value,
	failed = false,
	frontier,
	className,
	...props
}: ProgressProps) {
	const percent =
		value === undefined || !Number.isFinite(value) ? undefined : Math.min(100, Math.max(0, value));
	return (
		<div
			{...props}
			role="progressbar"
			aria-label={label}
			aria-valuemin={0}
			aria-valuemax={100}
			aria-valuenow={percent}
			data-state={failed ? "failed" : percent === undefined ? "indeterminate" : "active"}
			className={cn("relative h-[6px] overflow-hidden rounded-[3px] bg-ds-chip", className)}
		>
			<div
				aria-hidden="true"
				className={cn("relative h-full", failed ? "bg-ds-rec-ink" : "bg-ds-accent-strong")}
				style={{ width: percent === undefined ? "100%" : `${percent}%` }}
			>
				{frontier && (
					<span className="absolute inset-y-0 right-0 w-7 overflow-hidden">{frontier}</span>
				)}
			</div>
		</div>
	);
}
