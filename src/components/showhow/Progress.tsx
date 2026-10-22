import { type HTMLAttributes, type ReactNode, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(
	(value) => (value + 0.5) / 16,
);
const PITCH = 4;
const CELL = 3;
const ROWS = 3;
const HEIGHT = 11;
const FRONTIER = 96;

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
	const track = useRef<HTMLDivElement>(null);
	const canvas = useRef<HTMLCanvasElement>(null);
	const shown = useRef(percent ?? 100);
	void frontier;

	useEffect(() => {
		const element = track.current;
		const bitmap = canvas.current;
		if (!element || !bitmap || typeof window.matchMedia !== "function") return;
		const context = bitmap.getContext("2d");
		if (!context) return;

		const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
		const target = percent ?? 100;
		let frame = 0;
		let moving = false;
		const draw = () => {
			const width = element.clientWidth;
			if (!width) return;
			const scale = window.devicePixelRatio || 1;
			bitmap.width = Math.round(width * scale);
			bitmap.height = HEIGHT * scale;
			context.setTransform(scale, 0, 0, scale, 0, 0);
			context.clearRect(0, 0, width, HEIGHT);

			const edge = (shown.current / 100) * (width + FRONTIER) - FRONTIER / 2;
			const columns = Math.floor((width + PITCH - CELL) / PITCH);
			const failureColor = getComputedStyle(element).getPropertyValue("--ds-rec-ink").trim();
			for (let row = 0; row < ROWS; row++) {
				for (let column = 0; column < columns; column++) {
					const x = column * PITCH;
					const y = row * PITCH;
					const amount = Math.max(0, Math.min(1, (edge - (x + CELL / 2)) / FRONTIER + 0.5));
					const base = BAYER[(row % 4) * 4 + (column % 4)];
					const threshold =
						moving && amount > 0 && amount < 1
							? Math.max(0.02, Math.min(0.98, base + (Math.random() - 0.5) * 0.2))
							: base;
					if (amount > threshold) {
						context.fillStyle = failed ? failureColor : amount < 0.6 ? "#C4DBCE" : "#82B09A";
						context.fillRect(x, y, CELL, CELL);
					} else {
						context.fillStyle = "#FFFCF71F";
						context.fillRect(x + 1, y + 1, 1, 1);
					}
				}
			}
		};
		const animate = () => {
			const distance = target - shown.current;
			if (Math.abs(distance) < 0.02) {
				shown.current = target;
				moving = false;
				draw();
				return;
			}
			shown.current += distance * 0.2;
			moving = true;
			draw();
			frame = window.requestAnimationFrame(animate);
		};
		const updateMotion = () => {
			window.cancelAnimationFrame(frame);
			if (reduceMotion.matches) {
				shown.current = target;
				moving = false;
				draw();
			} else if (shown.current !== target) {
				frame = window.requestAnimationFrame(animate);
			} else {
				moving = false;
				draw();
			}
		};

		if (reduceMotion.matches) {
			shown.current = target;
			draw();
		} else if (shown.current === target) {
			draw();
		} else {
			frame = window.requestAnimationFrame(animate);
		}
		const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(draw);
		resizeObserver?.observe(element);
		reduceMotion.addEventListener("change", updateMotion);
		return () => {
			window.cancelAnimationFrame(frame);
			resizeObserver?.disconnect();
			reduceMotion.removeEventListener("change", updateMotion);
		};
	}, [failed, percent]);

	return (
		<div
			{...props}
			ref={track}
			role="progressbar"
			aria-label={label}
			aria-valuemin={0}
			aria-valuemax={100}
			aria-valuenow={percent}
			data-state={failed ? "failed" : percent === undefined ? "indeterminate" : "active"}
			className={cn(
				"relative h-[11px] min-h-[11px] overflow-hidden rounded-[3px] bg-ds-chip",
				className,
			)}
		>
			<canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
		</div>
	);
}
