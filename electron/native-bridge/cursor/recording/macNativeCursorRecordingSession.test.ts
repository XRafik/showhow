import { afterEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ accessSync: vi.fn() }));
vi.mock("node:fs", async (original) => ({
	...(await original<typeof import("node:fs")>()),
	accessSync: mocks.accessSync,
}));
vi.mock("electron", () => ({ screen: {}, systemPreferences: {} }));

import { findMacCursorHelperPath } from "./macNativeCursorRecordingSession";

afterEach(() => {
	vi.unstubAllEnvs();
	mocks.accessSync.mockReset();
});
it("retains a supported Showhow cursor override ahead of the legacy override", () => {
	vi.stubEnv("SHOWHOW_MAC_CURSOR_HELPER_EXE", "/owned-fixture/showhow-cursor");
	vi.stubEnv("OPENSCREEN_MAC_CURSOR_HELPER_EXE", "/owned-fixture/legacy-cursor");
	mocks.accessSync.mockImplementation((p) => {
		if (p !== "/owned-fixture/showhow-cursor") throw new Error("ENOENT");
	});
	expect(findMacCursorHelperPath()).toBe("/owned-fixture/showhow-cursor");
});
it("keeps the existing upstream override when the Showhow value is empty", () => {
	vi.stubEnv("SHOWHOW_MAC_CURSOR_HELPER_EXE", " ");
	vi.stubEnv("OPENSCREEN_MAC_CURSOR_HELPER_EXE", "/owned-fixture/legacy-cursor");
	mocks.accessSync.mockImplementation((p) => {
		if (p !== "/owned-fixture/legacy-cursor") throw new Error("ENOENT");
	});
	expect(findMacCursorHelperPath()).toBe("/owned-fixture/legacy-cursor");
});
it("reads an already-installed Showhow-named cursor helper without renaming stable targets", () => {
	vi.stubEnv("SHOWHOW_MAC_CURSOR_HELPER_EXE", "");
	vi.stubEnv("OPENSCREEN_MAC_CURSOR_HELPER_EXE", "");
	mocks.accessSync.mockImplementation((p) => {
		if (!String(p).endsWith("/showhow-macos-cursor-helper")) throw new Error("ENOENT");
	});
	expect(findMacCursorHelperPath()).toMatch(/\/showhow-macos-cursor-helper$/);
});
