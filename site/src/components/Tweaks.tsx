import { DialRoot, useDialKit } from "dialkit";
import dialkitCss from "dialkit/styles.css?inline";
import { useEffect, useState } from "react";
import { setShaderTweaks } from "../lib/tweaks-store";

const root = document.documentElement;

// Inject the pane's styles at mount (not as a page stylesheet) and drop its Google Fonts @import:
// the page loads nothing from a third-party host.
if (!document.getElementById("tweaks-styles")) {
	const style = document.createElement("style");
	style.id = "tweaks-styles";
	style.textContent = dialkitCss.replace(/@import[^;]*;/g, "");
	document.head.append(style);
}
const px = (value: number) => `${value}px`;

/**
 * Live tweak pane (DialKit). Values apply while this component is mounted, even when the pane is hidden.
 * Shift+T shows or hides the pane. Values persist in this browser only.
 */
export default function Tweaks() {
	const [visible, setVisible] = useState(true);

	const v = useDialKit(
		"Showhow landing",
		{
			shader: {
				opacity: [0.3, 0, 1, 0.01],
				speed: [0.55, 0, 2, 0.05],
				flow: [0.7, 0, 2, 0.05],
				softness: [1.2, 0, 3, 0.05],
				silk: [0.4, 0, 1, 0.05],
				grain: [0.12, 0, 0.5, 0.01],
				stir: [1.4, 0, 2, 0.05],
				interactive: true,
				clickSwirl: true,
				room: "#161616",
				deep: "#1F3A31",
				sage: "#82B09A",
				ember: "#E3582D",
			},
			hero: {
				titleSize: [116, 60, 160, 1],
				stageHeight: [460, 300, 700, 10],
				windowShadow: [6, 0, 16, 1],
			},
			palette: {
				accent: "#82B09A",
				record: "#E3582D",
				background: "#161616",
			},
			motion: {
				scrollSmoothness: [0.1, 0.02, 0.4, 0.01],
			},
		},
		{ persist: { key: "showhow-landing-tweaks" } },
	);

	useEffect(() => {
		setShaderTweaks({
			colors: [v.shader.room, v.shader.deep, v.shader.sage, v.shader.ember],
			speed: v.shader.speed,
			flow: v.shader.flow,
			softness: v.shader.softness,
			silk: v.shader.silk,
			grainAmount: v.shader.grain,
			stir: v.shader.stir,
			interactive: v.shader.interactive,
			clickSwirl: v.shader.clickSwirl,
		});
		root.style.setProperty("--landing-shader-opacity", String(v.shader.opacity));
		root.style.setProperty("--hero-title-size", px(v.hero.titleSize));
		root.style.setProperty("--hero-stage-height", px(v.hero.stageHeight));
		root.style.setProperty("--window-shadow", px(v.hero.windowShadow));
		root.style.setProperty("--color-landing-accent", v.palette.accent);
		root.style.setProperty("--color-landing-record", v.palette.record);
		root.style.setProperty("--color-landing-bg", v.palette.background);
		if (window.__lenis) window.__lenis.options.lerp = v.motion.scrollSmoothness;
	}, [v]);

	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			const target = event.target as HTMLElement | null;
			if (target?.closest("input, textarea, select, [contenteditable]")) return;
			if (event.shiftKey && event.key.toLowerCase() === "t") {
				setVisible((open) => {
					const next = !open;
					try {
						localStorage.setItem("showhow-tweaks", next ? "1" : "0");
					} catch {
						// storage unavailable: the pane still works for this page view
					}
					return next;
				});
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);

	return visible ? <DialRoot productionEnabled position="top-right" theme="dark" /> : null;
}
