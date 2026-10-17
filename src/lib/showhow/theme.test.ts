// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	applyResolvedTheme,
	initTheme,
	LEGACY_THEME_STORAGE_KEY,
	readStoredThemePreference,
	resolveTheme,
	setThemePreference,
	THEME_STORAGE_KEY,
	writeThemePreference,
} from "./theme";

function createStorage(initial: Record<string, string> = {}): Storage {
	const values = new Map(Object.entries(initial));
	return {
		getItem: (key) => values.get(key) ?? null,
		setItem: (key, value) => values.set(key, String(value)),
		removeItem: (key) => values.delete(key),
		clear: () => values.clear(),
		key: (index) => [...values.keys()][index] ?? null,
		get length() {
			return values.size;
		},
	};
}

afterEach(() => {
	Reflect.deleteProperty(window, "electronAPI");
	document.documentElement.removeAttribute("data-sh-theme");
	vi.restoreAllMocks();
});

describe("theme preferences", () => {
	it("prefers the Showhow key over the legacy key", () => {
		const storage = createStorage({
			[THEME_STORAGE_KEY]: "dark",
			[LEGACY_THEME_STORAGE_KEY]: "light",
		});
		expect(readStoredThemePreference(storage)).toBe("dark");
	});

	it("falls back to a valid legacy preference when Showhow is invalid", () => {
		const storage = createStorage({
			[THEME_STORAGE_KEY]: "invalid",
			[LEGACY_THEME_STORAGE_KEY]: "light",
		});
		expect(readStoredThemePreference(storage)).toBe("light");
		expect(readStoredThemePreference(createStorage({ [THEME_STORAGE_KEY]: "" }))).toBe("system");
	});

	it("uses system for absent or invalid preferences and normalizes valid values", () => {
		expect(readStoredThemePreference(createStorage())).toBe("system");
		expect(readStoredThemePreference(createStorage({ [THEME_STORAGE_KEY]: "  DaRk " }))).toBe(
			"dark",
		);
		expect(readStoredThemePreference(createStorage({ [THEME_STORAGE_KEY]: "sepia" }))).toBe(
			"system",
		);
	});

	it("writes only the Showhow preference key", () => {
		const storage = createStorage();
		writeThemePreference(storage, "system");
		expect(storage.getItem(THEME_STORAGE_KEY)).toBe("system");
		expect(storage.getItem(LEGACY_THEME_STORAGE_KEY)).toBeNull();
	});

	it("applies a selected preference immediately through the selection API", () => {
		const storage = createStorage();

		setThemePreference("light", { storage, systemIsDark: true });
		expect(document.documentElement.dataset.shTheme).toBe("light");
		setThemePreference("dark", { storage, systemIsDark: false });
		expect(document.documentElement.dataset.shTheme).toBe("dark");
		setThemePreference("system", { storage, systemIsDark: true });
		expect(document.documentElement.dataset.shTheme).toBe("dark");
		expect(storage.getItem(THEME_STORAGE_KEY)).toBe("system");
	});

	it("ignores a stale system theme after a newer manual selection", async () => {
		const storage = createStorage();
		let resolveSystemTheme: ((isDark: boolean) => void) | undefined;
		const systemTheme = new Promise<boolean>((resolve) => {
			resolveSystemTheme = resolve;
		});
		window.electronAPI = {
			...window.electronAPI,
			showhowGetSystemTheme: () => systemTheme,
		};

		setThemePreference("system", { storage });
		expect(document.documentElement.dataset.shTheme).toBe("light");
		setThemePreference("light", { storage });
		expect(document.documentElement.dataset.shTheme).toBe("light");
		resolveSystemTheme?.(true);
		await systemTheme;
		await Promise.resolve();

		expect(document.documentElement.dataset.shTheme).toBe("light");
		expect(storage.getItem(THEME_STORAGE_KEY)).toBe("light");
	});

	it("re-arms the stale completion guard for a second system selection", async () => {
		const storage = createStorage();
		const resolvers: Array<(isDark: boolean) => void> = [];
		window.electronAPI = {
			...window.electronAPI,
			showhowGetSystemTheme: () =>
				new Promise<boolean>((resolve) => {
					resolvers.push(resolve);
				}),
		};

		setThemePreference("system", { storage });
		setThemePreference("light", { storage });
		setThemePreference("system", { storage });
		expect(document.documentElement.dataset.shTheme).toBe("light");

		resolvers[0](true);
		await Promise.resolve();
		expect(document.documentElement.dataset.shTheme).toBe("light");
		resolvers[1](true);
		await Promise.resolve();
		expect(document.documentElement.dataset.shTheme).toBe("dark");
		expect(storage.getItem(THEME_STORAGE_KEY)).toBe("system");
	});

	it("resolves fixed and system preferences", () => {
		expect(resolveTheme("light", true)).toBe("light");
		expect(resolveTheme("dark", false)).toBe("dark");
		expect(resolveTheme("system", true)).toBe("dark");
		expect(resolveTheme("system", false)).toBe("light");
	});

	it("applies the resolved theme attribute", () => {
		expect(applyResolvedTheme("dark")).toBe("dark");
		expect(document.documentElement.getAttribute("data-sh-theme")).toBe("dark");
	});

	it("applies stored preference and follows Electron system changes", () => {
		const storage = createStorage({ [THEME_STORAGE_KEY]: "system" });
		let listener: ((isDark: boolean) => void) | undefined;
		const unsubscribe = vi.fn();
		window.electronAPI = {
			...window.electronAPI,
			showhowGetSystemTheme: async () => false,
			showhowOnSystemThemeChanged: (callback) => {
				listener = callback;
				return unsubscribe;
			},
		};
		const cleanup = initTheme({ storage, systemIsDark: false });
		expect(document.documentElement.dataset.shTheme).toBe("light");
		listener?.(true);
		expect(document.documentElement.dataset.shTheme).toBe("dark");
		cleanup?.();
		expect(unsubscribe).toHaveBeenCalledOnce();
	});

	it("uses matchMedia when Electron theme API is absent and tolerates it being absent", () => {
		const addEventListener = vi.fn();
		const removeEventListener = vi.fn();
		vi.stubGlobal("matchMedia", () => ({
			matches: true,
			addEventListener,
			removeEventListener,
		}));
		const cleanup = initTheme({ storage: createStorage() });
		expect(document.documentElement.dataset.shTheme).toBe("dark");
		expect(addEventListener).toHaveBeenCalledWith("change", expect.any(Function));
		cleanup?.();
		expect(removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
		vi.stubGlobal("matchMedia", undefined);
		let noMediaCleanup: (() => void) | void = undefined;
		expect(() => {
			noMediaCleanup = initTheme({ storage: createStorage() });
		}).not.toThrow();
		(noMediaCleanup as (() => void) | undefined)?.();
	});

	it("renders the synchronous system appearance while the Electron theme request is pending", () => {
		const storage = createStorage({ [THEME_STORAGE_KEY]: "system" });
		vi.stubGlobal("matchMedia", () => ({
			matches: true,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		}));
		window.electronAPI = {
			...window.electronAPI,
			showhowGetSystemTheme: () =>
				new Promise<boolean>(() => {
					// Keep the IPC result pending to inspect the synchronous initial render.
				}),
			showhowOnSystemThemeChanged: () => vi.fn(),
		};

		const cleanup = initTheme({ storage });
		expect(document.documentElement.dataset.shTheme).toBe("dark");
		cleanup?.();
	});

	it("re-reads preference after a storage event and cleans up listeners", () => {
		const storage = createStorage({ [THEME_STORAGE_KEY]: "light" });
		const addSpy = vi.spyOn(window, "addEventListener");
		const removeSpy = vi.spyOn(window, "removeEventListener");
		const cleanup = initTheme({ storage, systemIsDark: false });
		storage.setItem(THEME_STORAGE_KEY, "dark");
		window.dispatchEvent(new StorageEvent("storage", { key: THEME_STORAGE_KEY }));
		expect(document.documentElement.dataset.shTheme).toBe("dark");
		cleanup?.();
		expect(addSpy).toHaveBeenCalledWith("storage", expect.any(Function));
		expect(removeSpy).toHaveBeenCalledWith("storage", expect.any(Function));
	});
});
