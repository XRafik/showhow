// The macOS Screen Recording grant is a public IPC dependency here, not native runtime.
import { rmSync } from "node:fs";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fixture = vi.hoisted(() => {
	const nodeFs = require("node:fs") as typeof import("node:fs");
	const nodeOs = require("node:os") as typeof import("node:os");
	const nodePath = require("node:path") as typeof import("node:path");
	const userData = nodeFs.mkdtempSync(nodePath.join(nodeOs.tmpdir(), "showhow-open-selector-"));
	return { userData };
});

const handlerRegistry = vi.hoisted(() => new Map<string, (...args: unknown[]) => unknown>());
const permissions = vi.hoisted(() => ({
	read: vi.fn(async () => ({ screen: "denied", screenRequiresRelaunch: false })),
	showWindow: vi.fn(),
}));

vi.mock("../permissions", () => ({
	getMacPermissions: () => ({ read: permissions.read }),
	showPermissionsWindow: permissions.showWindow,
}));

// The app's own picker, not Apple's: that is the path that needs the Screen Recording grant.
vi.mock("../native-bridge/screen/macPickerSession", async (importOriginal) => {
	const actual = await importOriginal<typeof import("../native-bridge/screen/macPickerSession")>();
	return { ...actual, macSystemPickerEnabled: () => false };
});

vi.mock("electron", () => ({
	app: {
		getPath: () => fixture.userData,
		focus: () => undefined,
		on: () => undefined,
		getVersion: () => "1.6.0",
	},
	BrowserWindow: { getAllWindows: () => [] },
	clipboard: {},
	desktopCapturer: {},
	dialog: {},
	ipcMain: {
		handle: (channel: string, fn: (...args: unknown[]) => unknown) => {
			handlerRegistry.set(channel, fn);
		},
		on: () => undefined,
		removeHandler: () => undefined,
	},
	screen: {},
	shell: {},
	safeStorage: { isEncryptionAvailable: () => false },
	systemPreferences: {},
}));

vi.mock("../main", () => ({ RECORDINGS_DIR: fixture.userData }));

vi.mock("../showhow/bridgeServer", () => ({
	ShowhowBridgeServer: class {
		port = 0;
		async start() {
			// no-op: avoid binding a real WebSocket in tests
		}
		async stop() {
			// no-op
		}
	},
}));

// eslint-disable-next-line import/first
import { registerIpcHandlers } from "./handlers";

const createSourceSelectorWindow = vi.fn(() => ({}) as never);
registerIpcHandlers(
	() => undefined,
	createSourceSelectorWindow,
	() => ({}) as never,
	() => ({}) as never,
	() => null,
	() => null,
	() => null,
);

const senderAt = (url: string) => ({ sender: { getURL: () => url } });
const openSourceSelector = (url: string) =>
	handlerRegistry.get("open-source-selector")?.(senderAt(url)) as Promise<{
		opened: boolean;
		reason?: string;
	}>;

const realPlatform = Object.getOwnPropertyDescriptor(process, "platform");

beforeEach(() => {
	Object.defineProperty(process, "platform", { value: "darwin" });
	permissions.read.mockClear();
	permissions.showWindow.mockClear();
	createSourceSelectorWindow.mockClear();
});

afterEach(() => {
	if (realPlatform) Object.defineProperty(process, "platform", realPlatform);
});

afterAll(() => {
	rmSync(fixture.userData, { recursive: true, force: true });
});

describe("open-source-selector without the macOS Screen Recording grant", () => {
	it("answers the HUD without opening the permissions window, so the HUD sheet is the only surface", async () => {
		const result = await openSourceSelector("file:///index.html?windowType=hud-overlay");

		expect(result).toEqual({ opened: false, reason: "screen-access-required" });
		expect(permissions.showWindow).not.toHaveBeenCalled();
		expect(createSourceSelectorWindow).not.toHaveBeenCalled();
	});

	it("still opens the permissions window for the editor's Record stage", async () => {
		const result = await openSourceSelector("file:///index.html?windowType=editor");

		expect(result).toEqual({ opened: false, reason: "screen-access-required" });
		expect(permissions.showWindow).toHaveBeenCalledTimes(1);
	});

	it("treats a grant that only needs a relaunch the same way", async () => {
		permissions.read.mockResolvedValueOnce({ screen: "granted", screenRequiresRelaunch: true });

		const result = await openSourceSelector("file:///index.html?windowType=hud-overlay");

		expect(result).toEqual({ opened: false, reason: "screen-access-required" });
		expect(permissions.showWindow).not.toHaveBeenCalled();
	});
});
