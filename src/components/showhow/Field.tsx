import { forwardRef, type InputHTMLAttributes, useId } from "react";
import { cn } from "@/lib/utils";

export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
	label: string;
	error?: string;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(
	({ label, error, id, className, "aria-describedby": describedBy, ...props }, ref) => {
		const generatedId = useId();
		const inputId = id ?? generatedId;
		const errorId = `${inputId}-error`;
		return (
			<div className="flex flex-col gap-2 font-ds-body text-ds-ink">
				<label
					htmlFor={inputId}
					className="font-ds-label text-[10px] uppercase tracking-[1px] text-ds-ink-soft"
				>
					{label}
				</label>
				<input
					{...props}
					ref={ref}
					id={inputId}
					aria-invalid={error ? true : props["aria-invalid"]}
					aria-describedby={
						[describedBy, error ? errorId : undefined].filter(Boolean).join(" ") || undefined
					}
					className={cn(
						"w-full rounded-[4px] border border-ds-line bg-ds-surface px-3 py-[10px] text-[14px] placeholder:text-ds-ink-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-ds-ink disabled:opacity-50",
						error && "border-ds-rec",
						className,
					)}
				/>
				{error && (
					<p id={errorId} role="alert" className="text-[13px] text-ds-rec-ink">
						{error}
					</p>
				)}
			</div>
		);
	},
);
Field.displayName = "ShowhowField";
