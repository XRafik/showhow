import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 px-[14px] py-[10px] rounded-[4px] font-ds-label text-[11px] font-medium tracking-[0.6px] uppercase cursor-pointer transition-[background-color,transform] duration-150 active:scale-[0.96] motion-reduce:transform-none motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ds-ink disabled:pointer-events-none disabled:opacity-50",
	{
		variants: {
			variant: {
				primary: "bg-ds-accent text-ds-on-accent hover:bg-[var(--showhow-accent-hover)]",
				secondary:
					"border border-ds-line bg-transparent px-[13px] py-[9px] text-ds-ink hover:bg-ds-ink-wash",
				ghost: "bg-transparent text-ds-ink-soft hover:underline",
				dark: "bg-ds-ink text-ds-surface hover:bg-ds-ink-soft",
				rec: "bg-ds-rec-ink text-ds-surface",
				sidebar:
					"w-full justify-start bg-ds-on-panel-wash text-ds-on-panel hover:bg-ds-on-panel-line focus-visible:outline-ds-on-panel",
				toolbar: "gap-1.5 bg-transparent px-2 py-1.5 text-ds-on-panel-soft",
			},
		},
		defaultVariants: { variant: "primary" },
	},
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
	icon?: LucideIcon;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, asChild = false, icon: Icon, children, ...props }, ref) => {
		const Comp = asChild ? Slot : "button";
		return (
			<Comp className={cn(buttonVariants({ variant, className }))} ref={ref} {...props}>
				{Icon && (
					<Icon
						aria-hidden="true"
						className={cn(variant === "toolbar" ? "size-[13px]" : "size-[14px]", "shrink-0")}
					/>
				)}
				{children}
			</Comp>
		);
	},
);
Button.displayName = "ShowhowButton";

export { Button, buttonVariants };
