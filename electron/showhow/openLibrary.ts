/**
 * The editor or idle HUD's way back to the Library (#146, Editor-01/06 "Library").
 *
 * The editor window replaces the Library window when it opens (createEditorWindowWrapper), so
 * going back is a window swap, not a focus. The renderer has already run its own
 * unsaved-changes prompt by the time it asks, which is why the swap force-closes the editor:
 * the main process's close guard would otherwise ask a second time.
 */
export const OPEN_LIBRARY_CHANNEL = "showhow:open-library";

interface SenderLike {
	getURL: () => string;
}

interface OpenLibraryDeps {
	ipcMain: { handle: (channel: string, handler: (event: { sender: unknown }) => unknown) => void };
	getMainWindow: () => { isDestroyed: () => boolean; webContents: SenderLike } | null;
	isRecording: () => boolean;
	/** Closes the current window without prompting again and opens the Library in its place. */
	showLibrary: () => void;
}

export function registerOpenLibraryHandler({
	ipcMain,
	getMainWindow,
	isRecording,
	showLibrary,
}: OpenLibraryDeps): void {
	ipcMain.handle(OPEN_LIBRARY_CHANNEL, (event) => {
		const main = getMainWindow();
		// Only the current editor or idle HUD may trade its window for the Library.
		if (
			!main ||
			main.isDestroyed() ||
			event.sender !== main.webContents ||
			(!main.webContents.getURL().includes("windowType=editor") &&
				(!main.webContents.getURL().includes("windowType=hud-overlay") || isRecording()))
		) {
			return { opened: false };
		}
		showLibrary();
		return { opened: true };
	});
}
