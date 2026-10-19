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

it("tags a click on Showhow's own recorder controls so it never becomes a guide step (#124)", async () => {
	const { screen } = await import("electron");
	const { MacNativeCursorRecordingSession } = await import("./macNativeCursorRecordingSession");
	let cursor = { x: 960, y: 980 };
	Object.assign(screen, { getCursorScreenPoint: () => cursor });
	const session = new MacNativeCursorRecordingSession({
		getDisplayBounds: () => ({ x: 0, y: 0, width: 1920, height: 1080 }),
		// The HUD bar sits at the bottom centre of the recorded display.
		getOwnUiBounds: () => [{ x: 760, y: 950, width: 400, height: 60 }],
		maxSamples: 100,
		sampleIntervalMs: 33,
		startTimeMs: 0,
	});
	const capture = (
		session as unknown as {
			captureSample: (...args: [number, null, null, boolean, boolean, boolean]) => void;
		}
	).captureSample.bind(session);
	capture(28_850, null, null, true, true, false); // Stop press on the HUD
	cursor = { x: 300, y: 300 };
	capture(28_900, null, null, false, false, true);
	capture(29_000, null, null, true, true, false); // an ordinary click elsewhere
	const samples = (
		session as unknown as { samples: { interactionType: string; ownUi?: boolean }[] }
	).samples;
	const clicks = samples.filter((sample) => sample.interactionType === "click");
	expect(clicks.map((click) => click.ownUi === true)).toEqual([true, false]);
	// Moves are untouched so the editor cursor overlay still shows the pointer on the HUD.
	expect(
		samples.every((sample) => sample.interactionType === "click" || sample.ownUi === undefined),
	).toBe(true);
});
