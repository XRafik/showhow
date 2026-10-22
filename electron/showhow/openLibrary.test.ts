import { describe, expect, it, vi } from "vitest";
import { OPEN_LIBRARY_CHANNEL, registerOpenLibraryHandler } from "./openLibrary";

type Handler = (event: { sender: unknown }) => unknown;

function setup(windowUrl: string | null, isRecording = false) {
	let handler: Handler | null = null;
	const ipcMain = {
		handle: vi.fn((channel: string, fn: Handler) => {
			if (channel === OPEN_LIBRARY_CHANNEL) handler = fn;
		}),
	};
	const webContents = { getURL: () => windowUrl ?? "" };
	const mainWindow = windowUrl ? { isDestroyed: () => false, webContents } : null;
	const showLibrary = vi.fn();
	registerOpenLibraryHandler({
		ipcMain,
		getMainWindow: () => mainWindow,
		isRecording: () => isRecording,
		showLibrary,
	});
	return {
		invoke: (sender: unknown) => (handler as unknown as Handler)({ sender }),
		webContents,
		showLibrary,
	};
}

describe("showhow:open-library", () => {
	it("swaps the editor for the Library when the editor asks", () => {
		const { invoke, webContents, showLibrary } = setup(
			"file:///index.html?windowType=editor",
			true,
		);
		expect(invoke(webContents)).toEqual({ opened: true });
		expect(showLibrary).toHaveBeenCalledTimes(1);
	});

	it("refuses a sender that is not the main editor window", () => {
		const { invoke, showLibrary } = setup("file:///index.html?windowType=editor");
		expect(invoke({ getURL: () => "file:///index.html?windowType=editor" })).toEqual({
			opened: false,
		});
		expect(showLibrary).not.toHaveBeenCalled();
	});

	it("opens the Library from the current idle HUD window", () => {
		const { invoke, webContents, showLibrary } = setup("file:///index.html?windowType=hud-overlay");
		expect(invoke(webContents)).toEqual({ opened: true });
		expect(showLibrary).toHaveBeenCalledTimes(1);
	});

	it("refuses a non-current HUD sender", () => {
		const { invoke, showLibrary } = setup("file:///index.html?windowType=hud-overlay");
		expect(invoke({ getURL: () => "file:///index.html?windowType=hud-overlay" })).toEqual({
			opened: false,
		});
		expect(showLibrary).not.toHaveBeenCalled();
	});

	it("refuses the HUD while a recording is active", () => {
		const { invoke, webContents, showLibrary } = setup(
			"file:///index.html?windowType=hud-overlay",
			true,
		);
		expect(invoke(webContents)).toEqual({ opened: false });
		expect(showLibrary).not.toHaveBeenCalled();
	});

	it("refuses a main window with an unrelated window type", () => {
		const { invoke, webContents, showLibrary } = setup("file:///index.html?windowType=notes");
		expect(invoke(webContents)).toEqual({ opened: false });
		expect(showLibrary).not.toHaveBeenCalled();
	});
});
