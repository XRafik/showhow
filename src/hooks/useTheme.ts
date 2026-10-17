import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

import {
	applyResolvedTheme,
	LEGACY_THEME_STORAGE_KEY,
	readStoredThemePreference,
	resolveTheme,
	setThemePreference,
	THEME_STORAGE_KEY,
} from "@/lib/showhow/theme";

function readStoredTheme(): Theme {
	try {
		const pref = readStoredThemePreference(localStorage);
		const legacy = localStorage.getItem("openscreen-theme");
		if (
			localStorage.getItem(THEME_STORAGE_KEY) === null &&
			localStorage.getItem(LEGACY_THEME_STORAGE_KEY) === null &&
			(legacy === "light" || legacy === "dark")
		)
			return legacy;
		return resolveTheme(pref, window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false);
	} catch {
		return "light";
	}
}

function applyTheme(theme: Theme) {
	applyResolvedTheme(theme);
	if (theme === "dark") {
		document.documentElement.setAttribute("data-theme", "dark");
	} else {
		document.documentElement.removeAttribute("data-theme");
	}
	// Keep the legacy shadcn/Tailwind `.dark` class (index.css's `--accent`/
	// `--border`/`--muted` HSL-triplet tokens) in sync with the ai-edition
	// `data-theme` attribute — these are two separate token systems that
	// happen to share property names, so leaving `.dark` stuck on regardless
	// of the real theme silently overrides design-tokens.css's light values.
	document.documentElement.classList.toggle("dark", theme === "dark");

	// Repaint the native Windows/Linux window controls in the new theme, so the
	// titlebar reads as one continuous surface with the app. Reading the tokens
	// back keeps the palette in design-tokens.css only. No-op elsewhere.
	const css = getComputedStyle(document.documentElement);
	window.electronAPI?.setTitleBarOverlay?.(
		css.getPropertyValue("--bg").trim(),
		css.getPropertyValue("--muted").trim(),
	);
}

export function useTheme(): { theme: Theme; toggle: () => void; setTheme: (t: Theme) => void } {
	const [theme, setThemeState] = useState<Theme>(() => readStoredTheme());

	useEffect(() => {
		applyTheme(theme);
	}, [theme]);

	const toggle = useCallback(() => {
		setThemeState((prev) => {
			const next = prev === "dark" ? "light" : "dark";
			setThemePreference(next);
			return next;
		});
	}, []);

	const setTheme = useCallback((t: Theme) => {
		setThemePreference(t);
		setThemeState(t);
	}, []);

	return { theme, toggle, setTheme };
}
