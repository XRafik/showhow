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
	{
		extra = false,
		ws = false,
		duplicate = false,
		missingWallpaper,
		publicImage,
		publicImageOnDisk = false,
		icons = fixture.icons,
		emptyIcon,
		nativeAddon,
		budget,
		locales = fixture.locales,
	} = {},
) {
	const root = await mkdtemp(path.join(os.tmpdir(), "showhow-package-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	const app = path.join(root, "Showhow.app");
	const resources = path.join(app, "Contents/Resources");
	const archive = path.join(root, "archive");
	await mkdir(archive, { recursive: true });
	await mkdir(path.join(archive, "dist"), { recursive: true });
	for (const icon of icons) {
		await cp(path.join("public", icon), path.join(archive, "dist", icon));
		if (icon === emptyIcon) await writeFile(path.join(archive, "dist", icon), "");
	}
	if (nativeAddon) {
		const nativeRoot =
			nativeAddon === "asar"
				? archive
				: nativeAddon === "unpacked"
					? path.join(resources, "app.asar.unpacked")
					: resources;
		const addon = path.join(nativeRoot, "electron/native/bin/darwin-arm64/compositor_view.node");
		await mkdir(path.dirname(addon), { recursive: true });
		// Structural fixture only; the lead proves actual native execution separately.
		await writeFile(addon, "native addon fixture");
	}
	if (publicImage) {
		const imageRoot = publicImageOnDisk ? resources : archive;
		await mkdir(path.join(imageRoot, "dist"), { recursive: true });
		await writeFile(path.join(imageRoot, "dist", publicImage), "fixture image");
	}
	if (ws) {
		await mkdir(path.join(archive, "node_modules/ws"), { recursive: true });
		await writeFile(path.join(archive, "node_modules/ws/index.js"), "module.exports = {};\n");
	}
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
		if (wallpaper === missingWallpaper) continue;
		await mkdir(path.dirname(path.join(resources, "wallpapers", wallpaper)), { recursive: true });
		await writeFile(path.join(resources, "wallpapers", wallpaper), "fixture image");
	}
	if (duplicate) {
		const wallpaper = duplicate === true ? fixture.wallpaper : duplicate;
		const destination = path.join(archive, "dist/wallpapers", wallpaper);
		await mkdir(path.dirname(destination), { recursive: true });
		await cp(path.join(resources, "wallpapers", wallpaper), destination);
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
		["scripts/check-package-contents.mjs", app, ...(budget ? ["--budget-mb", budget] : [])],
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

test("obsolete ws is rejected because the v2 main bundle does not load it", async (t) => {
	const { report } = await audit(t, { ws: true });
	assert.ok(report.failures.some((failure) => failure.startsWith("R1:")));
});

test("bundled JavaScript with required locales and wallpapers passes", async (t) => {
	const { status, report } = await audit(t);
	assert.equal(status, 0);
	assert.deepEqual(report.node_modules, []);
});

test("a duplicate wallpaper in the archive fails", async (t) => {
	for (const duplicate of ["wallpaper1.jpg", "thumbs/wallpaper1.jpg"]) {
		const { status, report } = await audit(t, { duplicate });
		assert.equal(status, 1);
		assert.ok(report.failures.includes(`R3: ${duplicate} must ship once at Resources/wallpapers`));
	}
});

test("full wallpapers and their same-named thumbnails each ship once", async (t) => {
	const { report } = await audit(t);
	assert.deepEqual(
		report.failures.filter((failure) => failure.startsWith("R3:")),
		[],
	);
	assert.deepEqual(report.wallpaperCopies["thumbs/wallpaper1.jpg"], [
		"Contents/Resources/wallpapers/thumbs/wallpaper1.jpg",
	]);
});

test("a missing wallpaper or thumbnail fails independently", async (t) => {
	for (const missingWallpaper of ["wallpaper1.jpg", "thumbs/wallpaper1.jpg"]) {
		const { report } = await audit(t, { missingWallpaper });
		assert.ok(
			report.failures.includes(`R3: ${missingWallpaper} must ship once at Resources/wallpapers`),
		);
	}
});

test("an installed app over the budget fails", async (t) => {
	const { status, report } = await audit(t, { budget: "0.001" });
	assert.equal(status, 1);
	assert.ok(report.failures.some((failure) => failure.startsWith("R5:")));
});

test("the default installed-size budget is 400 MiB", async (t) => {
	const { status, report } = await audit(t);
	assert.equal(report.budgetMb, 400);
	assert.equal(status, 0);
});

test("the compositor filesystem addon is allowed without an invented npm package", async (t) => {
	for (const nativeAddon of ["resources", "unpacked"]) {
		const { status, report } = await audit(t, { nativeAddon });
		assert.equal(status, 0);
		assert.deepEqual(report.node_modules, []);
	}
});

test("a native addon packed inside ASAR fails", async (t) => {
	const { report } = await audit(t, { nativeAddon: "asar" });
	assert.ok(report.failures.some((failure) => failure.includes("native addon must stay unpacked")));
});

test("referenced recording tray and Showhow icons are allowed", async (t) => {
	const { status, report } = await audit(t);
	assert.equal(status, 0, JSON.stringify(report.failures));
	assert.equal(report.referencedPublicImages["rec-button.png"].path, "dist/rec-button.png");
	assert.ok(report.referencedPublicImages["rec-button.png"].size > 0);
	assert.ok(report.referencedPublicImages["showhow.png"].size > 0);
});

for (const missing of ["showhow.png", "rec-button.png"]) {
	test(`missing runtime-referenced ${missing} fails the audit`, async (t) => {
		const { status, report } = await audit(t, {
			icons: fixture.icons.filter((icon) => icon !== missing),
		});
		assert.equal(status, 1, `missing ${missing} must fail`);
		assert.ok(
			report.failures.includes(`R3: referenced icon must ship nonempty at dist/${missing}`),
		);
	});
	test(`empty runtime-referenced ${missing} fails the audit`, async (t) => {
		const { status, report } = await audit(t, { emptyIcon: missing });
		assert.equal(status, 1, `empty ${missing} must fail`);
		assert.ok(
			report.failures.includes(`R3: referenced icon must ship nonempty at dist/${missing}`),
		);
	});
}

test("unreferenced public images fail but referenced icons remain allowed", async (t) => {
	for (const image of ["demo.gif", "preview3.png", "preview4.png"]) {
		for (const publicImageOnDisk of [false, true]) {
			const { report } = await audit(t, { publicImage: image, publicImageOnDisk });
			assert.ok(
				report.failures.some((failure) => failure.startsWith("R3:") && failure.includes(image)),
			);
		}
	}
	const { status } = await audit(t, { publicImage: "showhow.png" });
	assert.equal(status, 0);
});

test("missing or extra Chromium locales fail even with the expected count", async (t) => {
	const { status, report } = await audit(t, {
		locales: [...fixture.locales.filter((locale) => locale !== "ar"), "pl"],
	});
	assert.equal(status, 1);
	assert.ok(report.failures.some((failure) => failure.startsWith("R2:")));
});
