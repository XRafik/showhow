import { type ReactNode, useId } from "react";

export interface GuideStepProps {
	number: number;
	title: string;
	quote?: string;
	shot?: ReactNode;
	timestamp?: string;
	actions?: ReactNode;
	flag?: ReactNode;
	children?: ReactNode;
}

export function GuideStep({
	number,
	title,
	quote,
	shot,
	timestamp,
	actions,
	flag,
	children,
}: GuideStepProps) {
	return (
		<article className="flex w-full flex-wrap gap-4 border-t border-ds-line py-5">
			<div className="w-9 shrink-0">
				<span className="font-ds-label text-[11px] font-medium tracking-[0.6px] text-ds-ink">
					{String(number).padStart(2, "0")}
				</span>
			</div>
			<div className="flex aspect-video w-[160px] min-[1100px]:h-[136px] min-[1100px]:w-[240px] shrink-0 items-center justify-center overflow-hidden rounded-[6px] bg-ds-panel outline outline-1 outline-black/10 dark:outline-white/10">
				{shot}
			</div>
			<div className="flex min-w-[160px] flex-1 flex-col gap-2">
				<h3 className="font-ds-body text-[15px] font-medium break-words text-ds-ink">{title}</h3>
				{quote && (
					<blockquote className="font-ds-body text-[13px] leading-[1.5] text-ds-ink-soft">
						{quote}
					</blockquote>
				)}
				<div className="flex flex-wrap items-center gap-2 pt-1">
					{timestamp && (
						<span className="font-ds-label text-[11px] tracking-[0.6px] text-ds-ink">
							{timestamp}
						</span>
					)}
					{actions}
					{flag}
				</div>
				{children}
			</div>
		</article>
	);
}

/** Static SVG rendition of design/mosaic.glsl; phase changes move only the frontier. */
export function Mosaic({ failed = false, edge = 0.42 }: { failed?: boolean; edge?: number }) {
	const id = useId();
	const fract = (value: number) => value - Math.floor(value);
	const hash = (x: number, y: number) => {
		let a = fract(x * 0.1031),
			b = fract(y * 0.1031),
			c = a;
		const dot = a * (b + 33.33) + b * (c + 33.33) + c * (a + 33.33);
		a += dot;
		b += dot;
		c += dot;
		return fract((a + b) * c);
	};
	return (
		<svg
			aria-hidden="true"
			viewBox="0 0 440 200"
			preserveAspectRatio="xMidYMid slice"
			className="h-full w-full"
			data-mosaic=""
		>
			<defs>
				<pattern id={id} width="4" height="4" patternUnits="userSpaceOnUse">
					<circle cx="2" cy="2" r="0.8" fill={failed ? "#E3582D" : "#82B09A"} opacity="0.45" />
				</pattern>
			</defs>
			<rect width="440" height="200" fill={failed ? "#2A2420" : "#242424"} />
			{Array.from({ length: 84 }, (_, index) => {
				const x = index % 14,
					y = Math.floor(index / 14);
				const t =
					Math.hypot((((x + 0.5) * 34) / 440 - 0.5) * 2.2, ((y + 0.5) * 34) / 200 - 0.5) * 1.4;
				const noise =
					(hash(x + 3, y + 3) - 0.5) * 0.8 +
					(hash(Math.floor(x / 2) + 20, Math.floor(y / 2) + 20) - 0.5) * 0.6;
				const value =
					Math.round(Math.min(1, Math.max(0, (edge - t) / 0.5 + 0.5 + noise * 0.9)) * 5) / 5;
				return (
					<rect
						key={index}
						x={x * 34}
						y={y * 34}
						width="34"
						height="34"
						fill={failed ? "#E3582D" : "#82B09A"}
						opacity={value}
					/>
				);
			})}
			<rect width="440" height="200" fill={`url(#${id})`} />
		</svg>
	);
}
