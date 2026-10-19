import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { BUNDLED_TRANSCRIPTION } from "../../src/lib/showhow/settings";
import { BUNDLED_STT_FILES } from "../stt/modelManager";
import { registerShowhowSettingsHandlers } from "./settings";

describe("Showhow settings info", () => {
	it("reports the fixed recordings folder relative to home", async () => {
		const handlers = new Map<string, () => Promise<unknown>>();
		const home = os.homedir();
		registerShowhowSettingsHandlers({
			handle: (channel, handler) => handlers.set(channel, handler),
			recordingsRoot: path.join(home, "Showhow", "Recordings"),
			homeDir: home,
		});
		expect(await handlers.get("showhow:settings-info")!()).toEqual({
			recordingsFolder: "~/Showhow/Recordings",
		});
	});

	it("names the transcription model that actually ships in the bundle", () => {
		expect(BUNDLED_TRANSCRIPTION.file).toBe(BUNDLED_STT_FILES.whisper.name);
		expect(BUNDLED_TRANSCRIPTION.sizeMb).toBe(
			Math.round(BUNDLED_STT_FILES.whisper.approximateBytes / 1_000_000),
		);
	});
});
