import path from "node:path";
import type { ShowhowSettingsInfo } from "../../src/lib/showhow/settings";

/** Read-only facts the Settings screen shows; settings with an existing store keep using it. */
export function registerShowhowSettingsHandlers(deps: {
	handle: (channel: string, handler: () => Promise<unknown>) => void;
	recordingsRoot: string;
	homeDir: string;
}) {
	deps.handle("showhow:settings-info", async (): Promise<ShowhowSettingsInfo> => {
		const root = path.resolve(deps.recordingsRoot);
		const home = path.resolve(deps.homeDir);
		return {
			recordingsFolder: root.startsWith(home + path.sep) ? `~${root.slice(home.length)}` : root,
		};
	});
}
