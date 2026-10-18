import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface LogoProps extends HTMLAttributes<HTMLDivElement> {
	size?: number;
	withWordmark?: boolean;
}

export function Logo({ size = 40, withWordmark = false, className, ...props }: LogoProps) {
	return (
		<div className={cn("inline-flex items-center gap-[14px]", className)} {...props}>
			<svg
				aria-label="Showhow"
				role="img"
				className="shrink-0 border border-[#2F2F2F] shadow-[4px_4px_0_var(--ds-accent)]"
				viewBox="0 0 50 50"
				width={size}
				height={size}
				fill="none"
			>
				<rect width="50" height="50" rx="0" fill="#FFFCF7" />
				<rect x="8" y="8" width="37" height="37" fill="#82B09A" />
				<rect x="6" y="6" width="37" height="37" fill="#2F2F2F" />
				<path
					transform="translate(10 10) scale(0.25)"
					d="M30 0l0 16m-30 14l16 0m-10-24l12 12"
					stroke="#82B09A"
					strokeWidth="6"
					strokeLinecap="square"
					fill="none"
				/>
				<path
					transform="translate(20 20) scale(0.5)"
					d="M0 0l31 22-13 1 7 13-7 4-7-14-11 8z"
					fill="#FFFCF7"
				/>
				<rect x="35.5" y="11.5" width="3" height="3" fill="#E4572E" />
			</svg>
			{withWordmark && (
				<span className="font-ds-display text-[17px] font-semibold tracking-[-0.17px] text-ds-on-panel">
					Showhow
				</span>
			)}
		</div>
	);
}
