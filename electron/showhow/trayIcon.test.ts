import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { trayIconSpecs } from "./trayIcon";

const publicDir = path.resolve(__dirname, "../../public");

describe("trayIconSpecs", () => {
	it("uses the unresized template pair on macOS and an orange recording icon", () => {
		const specs = trayIconSpecs("darwin");
		expect(specs.idle).toEqual({ file: "trayTemplate.png", template: true, size: null });
		expect(specs.recording).toEqual({ file: "tray-recording.png", template: false, size: null });
	});

	it("uses 24 px colour icons on other platforms", () => {
		for (const platform of ["win32", "linux"] as const) {
			const specs = trayIconSpecs(platform);
			expect(specs.idle).toMatchObject({ template: false, size: 24 });
			expect(specs.recording).toMatchObject({ template: false, size: 24 });
		}
	});

	it("points at files that exist, with the @2x pair beside each macOS icon", () => {
		for (const platform of ["darwin", "win32", "linux"] as const) {
			for (const spec of Object.values(trayIconSpecs(platform))) {
				expect(fs.existsSync(path.join(publicDir, spec.file))).toBe(true);
				if (spec.size === null) {
					expect(fs.existsSync(path.join(publicDir, spec.file.replace(".png", "@2x.png")))).toBe(
						true,
					);
				}
			}
		}
	});
});
