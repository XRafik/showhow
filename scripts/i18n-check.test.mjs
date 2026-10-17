import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, expect, it } from "vitest";

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = fs.mkdtempSync(path.join(os.tmpdir(), "showhow-i18n-check-"));
fs.mkdirSync(path.join(root, "src"));
fs.cpSync(path.join(repository, "src/i18n"), path.join(root, "src/i18n"), { recursive: true });
const builder = fs.readFileSync(path.join(repository, "electron-builder.json5"), "utf8");
afterAll(() => fs.rmSync(root, { recursive: true, force: true }));
function check(content) {
	fs.writeFileSync(path.join(root, "electron-builder.json5"), content);
	return spawnSync(process.execPath, [path.join(repository, "scripts/i18n-check.mjs")], {
		cwd: root,
		encoding: "utf8",
	});
}
it("checks the shipped locale list when the NSIS package has no AppX channel", () => {
	const result = check(builder);
	expect(result.status, result.stderr).toBe(0);
	expect(result.stdout).toContain("align with electronLanguages");
});
it("still rejects a missing shipped Electron locale", () => {
	const result = check(builder.replace('"en-US",', ""));
	expect(result.status).toBe(1);
	expect(result.stderr).toContain('MISSING in electron-builder.json5 electronLanguages: "en-US"');
});
it("still rejects an explicitly configured AppX channel without its languages", () => {
	const result = check(builder.replace('"appId":', '"appx": { "identityName": "test" }, "appId":'));
	expect(result.status).toBe(1);
	expect(result.stderr).toContain("Could not find appx.languages");
});
