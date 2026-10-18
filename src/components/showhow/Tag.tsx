import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const tagVariants = cva(
	"inline-block px-[6px] py-[2px] rounded-[3px] font-ds-label text-[10px] tracking-[0.6px] uppercase",
	{
		variants: {
			variant: {
				neutral: "bg-ds-on-panel-wash text-ds-on-panel-soft",
				chip: "bg-ds-chip text-ds-ink",
				accent: "bg-ds-accent text-ds-on-accent",
				progress: "bg-ds-accent-tint text-ds-accent-strong",
				alert: "bg-ds-rec-wash text-ds-ink",
				failed: "bg-ds-rec-ink text-ds-surface",
			},
		},
		defaultVariants: { variant: "neutral" },
	},
);

export interface TagProps
	extends HTMLAttributes<HTMLSpanElement>,
		VariantProps<typeof tagVariants> {}

export function Tag({ className, variant, ...props }: TagProps) {
	return <span className={cn(tagVariants({ variant, className }))} {...props} />;
}
