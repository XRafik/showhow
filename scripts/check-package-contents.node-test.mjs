import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createPackage } from "@electron/asar";

const fixture = JSON.parse(
	await readFile(new URL("./fixtures/package-contents/valid.json", import.meta.url)),
);
async function audit(
	t,
	{ extra = false, duplicate = false, budget = "330", locales = fixture.locales } = {},
) {
	const root = await mkdtemp(path.join(os.tmpdir(), "showhow-package-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	const app = path.join(root, "Showhow.app");
	const resources = path.join(app, "Contents/Resources");
	const archive = path.join(root, "archive");
	await mkdir(path.join(archive, "node_modules/ws"), { recursive: true });
	await writeFile(path.join(archive, "node_modules/ws/index.js"), "module.exports = {};\n");
	if (extra) {
		await mkdir(path.join(resources, "app.asar.unpacked/node_modules/@example/extra"), {
			recursive: true,
		});
		await writeFile(
			path.join(resources, "app.asar.unpacked/node_modules/@example/extra/index.js"),
			"extra",
		);
	}
	await mkdir(path.join(resources, "wallpapers"), { recursive: true });
	for (const wallpaper of fixture.wallpapers) {
		await writeFile(path.join(resources, "wallpapers", wallpaper), "fixture image");
	}
	if (duplicate) {
		await mkdir(path.join(archive, "dist/wallpapers"), { recursive: true });
		await cp(
			path.join(resources, "wallpapers", fixture.wallpaper),
			path.join(archive, "dist/wallpapers", fixture.wallpaper),
		);
	}
	for (const locale of locales) {
		await mkdir(
			path.join(
				app,
				"Contents/Frameworks/Electron Framework.framework/Versions/A/Resources",
				`${locale}.lproj`,
			),
			{ recursive: true },
		);
	}
	await createPackage(archive, path.join(resources, "app.asar"));
	const result = spawnSync(
		process.execPath,
		["scripts/check-package-contents.mjs", app, "--budget-mb", budget],
		{ encoding: "utf8" },
	);
	assert.equal(result.stderr, "");
	return { status: result.status, report: JSON.parse(result.stdout) };
}

test("extra unpacked node_modules package fails the audit", async (t) => {
	const { status, report } = await audit(t, { extra: true });
	assert.equal(status, 1);
	assert.ok(report.failures.some((failure) => failure.startsWith("R1:")));
});

test("ws alone with required locales and wallpapers passes", async (t) => {
	const { status, report } = await audit(t);
	assert.equal(status, 0);
	assert.deepEqual(report.node_modules, ["ws"]);
});

test("a duplicate wallpaper in the archive fails", async (t) => {
	const { status, report } = await audit(t, { duplicate: true });
	assert.equal(status, 1);
	assert.ok(report.failures.some((failure) => failure.startsWith("R3:")));
});

test("an installed app over the budget fails", async (t) => {
	const { status, report } = await audit(t, { budget: "0.001" });
	assert.equal(status, 1);
	assert.ok(report.failures.some((failure) => failure.startsWith("R5:")));
});

test("missing or extra Chromium locales fail even with the expected count", async (t) => {
	const { status, report } = await audit(t, {
		locales: [...fixture.locales.filter((locale) => locale !== "ar"), "de"],
	});
	assert.equal(status, 1);
	assert.ok(report.failures.some((failure) => failure.startsWith("R2:")));
});
