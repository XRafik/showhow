import type { Rectangle } from "electron";

// windows.ts owns the HUD and registers its drawn-controls rects here; the IPC layer reads them
// without importing windows.ts (which has startup side effects) (#124).
let provider: () => Rectangle[] = () => [];

export function setHudOwnUiProvider(next: () => Rectangle[]): void {
	provider = next;
}

export function hudOwnUiBounds(): Rectangle[] {
	return provider();
}
