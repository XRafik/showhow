export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "showhow:theme";
export const LEGACY_THEME_STORAGE_KEY = "openscreen:theme";

let themePreferenceRequest = 0;

type ThemeStorage = Pick<Storage, "getItem">;

function normalizePreference(value: string | null): ThemePreference | null {
	const normalized = value?.trim().toLowerCase();
	return normalized === "system" || normalized === "light" || normalized === "dark"
		? normalized
		: null;
}

export function readStoredThemePreference(storage: ThemeStorage): ThemePreference {
	return (
		normalizePreference(storage.getItem(THEME_STORAGE_KEY)) ??
		normalizePreference(storage.getItem(LEGACY_THEME_STORAGE_KEY)) ??
		"system"
	);
}

export function writeThemePreference(
	storage: Pick<Storage, "getItem" | "setItem">,
	pref: ThemePreference,
): void {
	storage.setItem(THEME_STORAGE_KEY, pref);
}

export function resolveTheme(pref: ThemePreference, systemIsDark: boolean): ResolvedTheme {
	if (pref === "system") return systemIsDark ? "dark" : "light";
	return pref;
}

export function applyResolvedTheme(resolved: ResolvedTheme): ResolvedTheme {
	document.documentElement.dataset.shTheme = resolved;
	document.documentElement.dataset.theme = resolved;
	document.documentElement.classList.toggle("dark", resolved === "dark");
	return resolved;
}

interface SetThemePreferenceOptions {
	storage?: Pick<Storage, "getItem" | "setItem">;
	systemIsDark?: boolean;
}

function readSystemAppearance(): boolean {
	try {
		return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
	} catch {
		return false;
	}
}

export function setThemePreference(
	pref: ThemePreference,
	options: SetThemePreferenceOptions = {},
): ResolvedTheme {
	const request = ++themePreferenceRequest;
	let storage = options.storage;
	if (!storage) {
		try {
			storage = window.localStorage;
		} catch {
			storage = undefined;
		}
	}
	if (storage) writeThemePreference(storage, pref);

	const electronAPI = window.electronAPI;
	let electronTheme: Promise<boolean> | undefined;
	if (pref === "system" && options.systemIsDark === undefined) {
		try {
			electronTheme = electronAPI?.showhowGetSystemTheme?.();
		} catch {
			electronTheme = undefined;
		}
	}
	const systemIsDark = options.systemIsDark ?? readSystemAppearance();
	const resolved = applyResolvedTheme(resolveTheme(pref, systemIsDark));
	electronTheme
		?.then((isDark) => {
			if (request === themePreferenceRequest) {
				applyResolvedTheme(resolveTheme(pref, isDark));
			}
		})
		.catch(() => undefined);
	return resolved;
}

interface InitThemeOptions {
	storage?: Storage;
	systemIsDark?: boolean;
	onSystemChange?: (isDark: boolean) => void;
}

export function initTheme(options: InitThemeOptions = {}): (() => void) | void {
	let storage: Storage | undefined;
	try {
		storage = options.storage ?? window.localStorage;
	} catch {
		storage = options.storage;
	}

	let systemIsDark = options.systemIsDark ?? false;
	let active = true;
	let removeSystemListener: (() => void) | undefined;
	const renderTheme = () => {
		const pref = storage ? readStoredThemePreference(storage) : "system";
		setThemePreference(pref, { storage, systemIsDark });
	};
	const updateSystemTheme = (isDark: boolean) => {
		if (!active) return;
		systemIsDark = isDark;
		options.onSystemChange?.(isDark);
		renderTheme();
	};
	const electronAPI = window.electronAPI;
	const hasElectronTheme = typeof electronAPI?.showhowGetSystemTheme === "function";
	const hasElectronSubscription = typeof electronAPI?.showhowOnSystemThemeChanged === "function";
	let mediaQuery: MediaQueryList | undefined;

	if (options.systemIsDark === undefined && hasElectronTheme) {
		electronAPI
			.showhowGetSystemTheme()
			.then(updateSystemTheme)
			.catch(() => undefined);
	}
	try {
		mediaQuery = window.matchMedia?.("(prefers-color-scheme: dark)");
		if (mediaQuery && options.systemIsDark === undefined) {
			systemIsDark = mediaQuery.matches;
		}
	} catch {
		mediaQuery = undefined;
	}
	renderTheme();

	if (hasElectronSubscription) {
		removeSystemListener = electronAPI.showhowOnSystemThemeChanged(updateSystemTheme);
	} else if (mediaQuery?.addEventListener) {
		const listener = (event: MediaQueryListEvent) => updateSystemTheme(event.matches);
		mediaQuery.addEventListener("change", listener);
		removeSystemListener = () => mediaQuery?.removeEventListener("change", listener);
	} else if (mediaQuery?.addListener) {
		const listener = (event: MediaQueryListEvent) => updateSystemTheme(event.matches);
		mediaQuery.addListener(listener);
		removeSystemListener = () => mediaQuery?.removeListener(listener);
	}

	const onStorage = (event: StorageEvent) => {
		if (
			event.key === null ||
			event.key === THEME_STORAGE_KEY ||
			event.key === LEGACY_THEME_STORAGE_KEY
		) {
			renderTheme();
		}
	};
	window.addEventListener("storage", onStorage);
	return () => {
		active = false;
		removeSystemListener?.();
		window.removeEventListener("storage", onStorage);
	};
}
