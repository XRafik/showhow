import { motion, useReducedMotion } from "motion/react";
import { type ComponentType, type Ref, useCallback, useRef } from "react";
import { usePressDepth } from "./vendor/interior/press-depth";
import AppleBrandLogo from "./vendor/itshover/apple-brand-logo";
import DownloadIcon from "./vendor/itshover/download-icon";
import GithubIcon from "./vendor/itshover/github-icon";
import type { AnimatedIconHandle, AnimatedIconProps } from "./vendor/itshover/types";

type IconComponent = ComponentType<AnimatedIconProps & { ref?: Ref<AnimatedIconHandle> }>;

const ICONS: Record<string, IconComponent> = {
	apple: AppleBrandLogo as IconComponent,
	download: DownloadIcon as IconComponent,
	github: GithubIcon as IconComponent,
};

type CtaProps = {
	href: string;
	label: string;
	variant?: "primary" | "outline";
	icon?: keyof typeof ICONS;
	className?: string;
};

/** Link styled as Button/Primary or Button/Outline. The icon plays on hover and focus; the press sinks with a spring. */
export default function Cta({ href, label, variant = "outline", icon, className = "" }: CtaProps) {
	const reduced = useReducedMotion();
	const iconRef = useRef<AnimatedIconHandle>(null);
	const { pressed, ref, bind } = usePressDepth();
	const Icon = icon ? ICONS[icon] : null;

	const play = useCallback(() => {
		if (!reduced) iconRef.current?.startAnimation();
	}, [reduced]);
	const rest = useCallback(() => iconRef.current?.stopAnimation(), []);

	return (
		<motion.a
			ref={ref as Ref<HTMLAnchorElement>}
			href={href}
			className={`button${variant === "primary" ? " button--primary" : ""} ${className}`.trim()}
			animate={{ scale: pressed && !reduced ? 0.97 : 1 }}
			transition={{ type: "spring", stiffness: 520, damping: 34, mass: 0.45 }}
			onPointerEnter={play}
			onPointerLeave={rest}
			onFocus={play}
			onBlur={(event) => {
				rest();
				bind.onBlur();
				void event;
			}}
			onPointerDown={bind.onPointerDown}
			onKeyDown={bind.onKeyDown}
			onKeyUp={bind.onKeyUp}
		>
			{Icon ? (
				<span className="button__icon" aria-hidden="true">
					<Icon ref={iconRef} size={16} strokeWidth={2} />
				</span>
			) : null}
			{label}
		</motion.a>
	);
}
