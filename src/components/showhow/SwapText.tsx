import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const SWAP_MS = 240;

export function SwapText({ value, className }: { value: string; className?: string }) {
	const currentValue = useRef(value);
	const [current, setCurrent] = useState(value);
	const [previous, setPrevious] = useState<string | null>(null);
	const [staging, setStaging] = useState(false);

	useEffect(() => {
		if (value === currentValue.current) return;
		if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
			currentValue.current = value;
			setCurrent(value);
			setPrevious(null);
			setStaging(false);
			return;
		}

		setPrevious(currentValue.current);
		currentValue.current = value;
		setCurrent(value);
		setStaging(true);
		let timer: number | undefined;
		const frame = window.requestAnimationFrame(() => {
			setStaging(false);
			timer = window.setTimeout(() => setPrevious(null), SWAP_MS);
		});
		return () => {
			window.cancelAnimationFrame(frame);
			if (timer !== undefined) window.clearTimeout(timer);
		};
	}, [value]);

	return (
		<span data-swap-text="" aria-live="polite" className={cn("grid min-w-0", className)}>
			{previous !== null && (
				<span
					aria-hidden="true"
					data-swap-text-previous=""
					className={cn(
						"col-start-1 row-start-1 min-w-0 break-words transition-[filter,opacity] [transition-duration:240ms] [transition-timing-function:ease-out] motion-reduce:transition-none",
						staging ? "opacity-100 blur-0" : "opacity-0 blur-[4px]",
					)}
				>
					{previous}
				</span>
			)}
			<span
				data-swap-text-current=""
				className={cn(
					"col-start-1 row-start-1 min-w-0 break-words transition-[filter,opacity] [transition-duration:240ms] [transition-timing-function:ease-out] motion-reduce:transition-none",
					staging ? "opacity-0 blur-[4px]" : "opacity-100 blur-0",
				)}
			>
				{current}
			</span>
		</span>
	);
}
