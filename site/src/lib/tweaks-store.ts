import { useSyncExternalStore } from "react";

export type ShaderTweaks = {
	colors: string[];
	speed: number;
	flow: number;
	softness: number;
	silk: number;
	grainAmount: number;
	stir: number;
	interactive: boolean;
	clickSwirl: boolean;
};

/** Defaults match the design. The tweak pane overwrites them live; nothing else changes them. */
export const SHADER_DEFAULTS: ShaderTweaks = {
	colors: ["#161616", "#1F3A31", "#82B09A", "#E3582D"],
	speed: 0.55,
	flow: 0.7,
	softness: 1.2,
	silk: 0.4,
	grainAmount: 0.12,
	stir: 1.4,
	interactive: true,
	clickSwirl: true,
};

let shader = SHADER_DEFAULTS;
const listeners = new Set<() => void>();

export function setShaderTweaks(next: ShaderTweaks) {
	shader = next;
	for (const listener of listeners) listener();
}

export function useShaderTweaks(): ShaderTweaks {
	return useSyncExternalStore(
		(listener) => {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
		() => shader,
		() => SHADER_DEFAULTS,
	);
}
