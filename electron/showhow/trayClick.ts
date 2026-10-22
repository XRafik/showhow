import type { BrowserWindow, IpcMain, Tray } from "electron";

export type TrayClickAction = "focus" | "create" | "ignore";

export function focusHudWindowWhenReady(window: Pick<BrowserWindow, "once" | "focus">) {
	window.once("ready-to-show", () => window.focus());
}

export function registerTrayActivationHandler(
	tray: Pick<Tray, "on">,
	isMac: boolean,
	handleActivation: () => void,
) {
	if (isMac) {
		tray.on("mouse-up", handleActivation);
	} else {
		tray.on("click", handleActivation);
		tray.on("double-click", handleActivation);
	}
}

export function decideTrayClick<T extends object>(
	isRecording: boolean,
	currentWindow: T | null,
	hudWindow: T | null,
): TrayClickAction {
	if (isRecording) return "ignore";
	return currentWindow !== null && currentWindow === hudWindow ? "focus" : "create";
}

export function closeWindowForTrayHud(
	window: Pick<BrowserWindow, "webContents" | "once" | "removeListener" | "close">,
	ipc: Pick<IpcMain, "on" | "removeListener">,
	onClosed: () => void,
	onCancelled: () => void,
) {
	let saveDoneListener: ((event: Electron.IpcMainEvent, shouldClose: boolean) => void) | undefined;
	const cleanup = () => {
		ipc.removeListener("close-confirm-response", closeConfirmListener);
		if (saveDoneListener) ipc.removeListener("save-before-close-done", saveDoneListener);
	};
	const closedListener = () => {
		cleanup();
		onClosed();
	};
	const cancel = () => {
		window.removeListener("closed", closedListener);
		cleanup();
		onCancelled();
	};
	const closeConfirmListener = (
		event: Electron.IpcMainEvent,
		choice: "save" | "discard" | "cancel",
	) => {
		if (event.sender.id !== window.webContents.id) return;
		ipc.removeListener("close-confirm-response", closeConfirmListener);
		if (choice === "cancel") {
			cancel();
		} else if (choice === "save") {
			saveDoneListener = (saveEvent, shouldClose) => {
				if (saveEvent.sender.id !== window.webContents.id) return;
				if (!shouldClose) cancel();
			};
			ipc.on("save-before-close-done", saveDoneListener);
		}
	};

	window.once("closed", closedListener);
	ipc.on("close-confirm-response", closeConfirmListener);
	window.close();
}
