import { EventEmitter } from "node:events";
import type { BrowserWindow, IpcMain, Tray } from "electron";
import { describe, expect, it, vi } from "vitest";
import {
	closeWindowForTrayHud,
	decideTrayClick,
	focusHudWindowWhenReady,
	registerTrayActivationHandler,
} from "./trayClick";

describe("focusHudWindowWhenReady", () => {
	it("focuses the HUD only after it is ready to show", () => {
		const events = new EventEmitter();
		const focus = vi.fn();
		const window = Object.assign(events, { focus }) as unknown as BrowserWindow;

		focusHudWindowWhenReady(window);
		expect(focus).not.toHaveBeenCalled();

		events.emit("ready-to-show");

		expect(focus).toHaveBeenCalledOnce();
	});
});

describe("registerTrayActivationHandler", () => {
	it("uses only mouse-up for macOS activation", () => {
		const events = new EventEmitter();
		const handleActivation = vi.fn();

		registerTrayActivationHandler(events as unknown as Tray, true, handleActivation);

		expect(events.listenerCount("mouse-up")).toBe(1);
		expect(events.listenerCount("click")).toBe(0);
		expect(events.listenerCount("double-click")).toBe(0);
		events.emit("mouse-up");
		expect(handleActivation).toHaveBeenCalledOnce();
	});

	it("keeps click and double-click activation on non-macOS", () => {
		const events = new EventEmitter();
		const handleActivation = vi.fn();

		registerTrayActivationHandler(events as unknown as Tray, false, handleActivation);

		expect(events.listenerCount("mouse-up")).toBe(0);
		expect(events.listenerCount("click")).toBe(1);
		expect(events.listenerCount("double-click")).toBe(1);
		events.emit("click");
		events.emit("double-click");
		expect(handleActivation).toHaveBeenCalledTimes(2);
	});
});

describe("decideTrayClick", () => {
	it("shows and focuses an existing HUD while idle", () => {
		const hud = {};
		expect(decideTrayClick(false, hud, hud)).toBe("focus");
	});

	it("creates the HUD when no window exists", () => {
		expect(decideTrayClick(false, null, null)).toBe("create");
	});

	it("does nothing while recording", () => {
		const hud = {};
		expect(decideTrayClick(true, hud, hud)).toBe("ignore");
	});
});

describe("closeWindowForTrayHud", () => {
	function createWindow(id = 1) {
		const events = new EventEmitter();
		const window = Object.assign(events, {
			webContents: { id },
			close: vi.fn(),
		}) as unknown as BrowserWindow;
		return { events, window };
	}

	function createIpc() {
		const events = new EventEmitter();
		return { events, ipc: events as unknown as IpcMain };
	}

	it("keeps the editor open after close confirmation is canceled", () => {
		const { events: windowEvents, window } = createWindow();
		const { events: ipcEvents, ipc } = createIpc();
		const onClosed = vi.fn();
		const onCancelled = vi.fn();

		closeWindowForTrayHud(window, ipc, onClosed, onCancelled);
		ipcEvents.emit("close-confirm-response", { sender: { id: 1 } }, "cancel");
		windowEvents.emit("closed");

		expect(window.close).toHaveBeenCalledOnce();
		expect(onCancelled).toHaveBeenCalledOnce();
		expect(onClosed).not.toHaveBeenCalled();
	});

	it("keeps the editor open when saving before close fails", () => {
		const { events: windowEvents, window } = createWindow();
		const { events: ipcEvents, ipc } = createIpc();
		const onClosed = vi.fn();
		const onCancelled = vi.fn();

		closeWindowForTrayHud(window, ipc, onClosed, onCancelled);
		ipcEvents.emit("close-confirm-response", { sender: { id: 1 } }, "save");
		ipcEvents.emit("save-before-close-done", { sender: { id: 1 } }, false);
		windowEvents.emit("closed");

		expect(onCancelled).toHaveBeenCalledOnce();
		expect(onClosed).not.toHaveBeenCalled();
	});

	it("waits for the saved editor to close before creating the HUD", () => {
		const { events: windowEvents, window } = createWindow();
		const { events: ipcEvents, ipc } = createIpc();
		const onClosed = vi.fn();
		const onCancelled = vi.fn();

		closeWindowForTrayHud(window, ipc, onClosed, onCancelled);
		ipcEvents.emit("close-confirm-response", { sender: { id: 1 } }, "save");
		ipcEvents.emit("save-before-close-done", { sender: { id: 1 } }, true);
		expect(onClosed).not.toHaveBeenCalled();

		windowEvents.emit("closed");

		expect(onClosed).toHaveBeenCalledOnce();
		expect(onCancelled).not.toHaveBeenCalled();
	});
});
