import { execFileSync } from "node:child_process";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listPackage, statFile } from "@electron/asar";

// Do not follow symlinks: a macOS framework exposes Versions/A through two aliases.
async function walk(root, relative = "") {
	const entries = [];
	for (const item of await readdir(path.join(root, relative), { withFileTypes: true })) {
		const name = path.posix.join(relative, item.name);
		if (item.isSymbolicLink()) continue;
		entries.push({ name, directory: item.isDirectory() });
		if (item.isDirectory()) entries.push(...(await walk(root, name)));
	}
	return entries;
}

async function main() {
	const [appPath, ...options] = process.argv.slice(2);
	if (!appPath || (options.length && (options.length !== 2 || options[0] !== "--budget-mb"))) {
		throw new Error("Usage: node scripts/check-package-contents.mjs <app-path> [--budget-mb 330]");
	}
	const budgetMb = options.length ? Number(options[1]) : 330;
	if (!Number.isFinite(budgetMb) || budgetMb <= 0) throw new Error("Budget must be positive");
	const resources = path.join(appPath, "Contents/Resources");
	const archive = path.join(resources, "app.asar");
	const archived = listPackage(archive).map((name) => ({
		name: name.replace(/^\//, ""),
		directory: Boolean(statFile(archive, name.replace(/^\//, "")).files),
	}));
	const disk = await walk(appPath);
	const packages = new Set();
	for (const { name } of [...archived, ...disk]) {
		for (const match of name.matchAll(/(?:^|\/)node_modules\/((?:@[^/]+\/)?[^/]+)/g)) {
			if (!match[1].startsWith("@") || match[1].includes("/")) packages.add(match[1]);
		}
	}
	const nodeModules = [...packages].sort();
	const failures = [];
	if (JSON.stringify(nodeModules) !== '["ws"]')
		failures.push("R1: node_modules must contain only ws");
	const expectedWallpapers = (
		await walk(fileURLToPath(new URL("../public/wallpapers", import.meta.url)))
	)
		.filter((entry) => !entry.directory)
		.map((entry) => entry.name)
		.sort();
	const wallpaperCopies = Object.fromEntries(
		expectedWallpapers.map((name) => {
			const copies = [
				...archived
					.filter((entry) => !entry.directory && path.posix.basename(entry.name) === name)
					.map((entry) => `app.asar/${entry.name}`),
				...disk
					.filter((entry) => !entry.directory && path.posix.basename(entry.name) === name)
					.map((entry) => entry.name),
			];
			if (copies.length !== 1 || copies[0] !== `Contents/Resources/wallpapers/${name}`)
				failures.push(`R3: ${name} must ship once at Resources/wallpapers`);
			return [name, copies];
		}),
	);
	const expectedLocales = [
		"ar",
		"en",
		"en_GB",
		"es",
		"fr",
		"it",
		"ja",
		"ko",
		"pt_BR",
		"ru",
		"tr",
		"vi",
		"zh_CN",
		"zh_TW",
	].sort();
	const chromiumLocales = disk
		.filter(
			(entry) =>
				entry.directory &&
				entry.name.startsWith("Contents/Frameworks/Electron Framework.framework/") &&
				entry.name.endsWith(".lproj"),
		)
		.map((entry) => path.posix.basename(entry.name, ".lproj"))
		.sort();
	if (JSON.stringify(chromiumLocales) !== JSON.stringify(expectedLocales))
		failures.push("R2: Chromium locales must match the 14 supported language packs");
	// du -sk reports allocated KiB, matching the installed-size acceptance measurement.
	const installedBytes =
		Number(
			execFileSync("du", ["-sk", path.resolve(appPath)], { encoding: "utf8" }).split(/\s/)[0],
		) * 1024;
	if (!Number.isFinite(installedBytes)) throw new Error("Could not measure installed size");
	if (installedBytes > budgetMb * 1024 * 1024)
		failures.push(`R5: installed app exceeds ${budgetMb} MiB`);
	console.log(
		JSON.stringify(
			{
				node_modules: nodeModules,
				chromiumLocales,
				lprojCount: chromiumLocales.length,
				wallpaperCopies,
				installedBytes,
				installedMb: installedBytes / 1024 / 1024,
				budgetMb,
				failures,
			},
			null,
			2,
		),
	);
	process.exitCode = failures.length ? 1 : 0;
}

main().catch((error) => {
	console.log(JSON.stringify({ failures: [error.message] }, null, 2));
	process.exitCode = 1;
});
