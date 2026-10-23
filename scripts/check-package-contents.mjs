import { execFileSync } from "node:child_process";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listPackage, statFile } from "@electron/asar";

// Runtime npm allow-list, with a reason required for each retained package.
// The stable-v2 main/preload chunks bundle their JavaScript dependencies. The
// universal LangChain provider loader is not used: Showhow passes constructed
// ChatOpenAI/ChatAnthropic/ChatMistralAI instances to createAgent. Electron,
// original-fs and Node builtins are supplied by Electron; compositor_view.node
// and ONNX Runtime are filesystem payloads under Resources/electron/native.
const runtimePackages = {};

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
		throw new Error("Usage: node scripts/check-package-contents.mjs <app-path> [--budget-mb 400]");
	}
	const budgetMb = options.length ? Number(options[1]) : 400;
	if (!Number.isFinite(budgetMb) || budgetMb <= 0) throw new Error("Budget must be positive");
	const resources = path.join(appPath, "Contents/Resources");
	const archive = path.join(resources, "app.asar");
	const archived = listPackage(archive).map((name) => ({
		name: name.replace(/^\//, ""),
		directory: Boolean(statFile(archive, name.replace(/^\//, "")).files),
		unpacked: Boolean(statFile(archive, name.replace(/^\//, "")).unpacked),
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
	for (const name of nodeModules) {
		if (!Object.hasOwn(runtimePackages, name))
			failures.push(`R1: unexpected runtime npm package ${name}`);
	}
	for (const entry of archived) {
		if (!entry.directory && entry.name.endsWith(".node") && !entry.unpacked)
			failures.push(`R1: native addon must stay unpacked: ${entry.name}`);
	}
	const expectedWallpapers = (
		await walk(fileURLToPath(new URL("../public/wallpapers", import.meta.url)))
	)
		.filter((entry) => !entry.directory)
		.map((entry) => entry.name)
		.sort();
	// Match the longest known relative suffix first: thumbs/wallpaper1.jpg is
	// a different asset from wallpaper1.jpg, even though their basenames agree.
	const wallpaperNames = [...expectedWallpapers].sort((a, b) => b.length - a.length);
	const wallpaperName = (entry) =>
		!entry.directory && wallpaperNames.find((name) => entry.name.endsWith(`/${name}`));
	const wallpaperCopies = Object.fromEntries(
		expectedWallpapers.map((name) => {
			const copies = [
				...archived
					.filter((entry) => wallpaperName(entry) === name)
					.map((entry) => `app.asar/${entry.name}`),
				...disk.filter((entry) => wallpaperName(entry) === name).map((entry) => entry.name),
			];
			if (copies.length !== 1 || copies[0] !== `Contents/Resources/wallpapers/${name}`)
				failures.push(`R3: ${name} must ship once at Resources/wallpapers`);
			return [name, copies];
		}),
	);
	const excludedPublicImages = [...archived, ...disk]
		.filter(
			(entry) =>
				!entry.directory && /^(demo\.gif|preview.*\.png)$/.test(path.posix.basename(entry.name)),
		)
		.map((entry) => entry.name);
	for (const name of excludedPublicImages)
		failures.push(`R3: unreferenced public image must not ship: ${name}`);
	// main.ts getTrayIcon loads these from VITE_PUBLIC (packaged: dist); see showhow/trayIcon.ts.
	// showhow.png is also the renderer favicon/logo; trayTemplate is the macOS menu bar icon and
	// tray-recording marks recording.
	const referencedPublicImages = Object.fromEntries(
		[
			"showhow.png",
			"trayTemplate.png",
			"trayTemplate@2x.png",
			"tray-recording.png",
			"tray-recording@2x.png",
		].map((name) => {
			const iconPath = `dist/${name}`;
			const entry = archived.find((item) => item.name === iconPath && !item.directory);
			const size = entry ? statFile(archive, iconPath).size : 0;
			if (!(size > 0)) failures.push(`R3: referenced icon must ship nonempty at ${iconPath}`);
			return [name, { path: iconPath, size }];
		}),
	);
	const expectedLocales = [
		"ar",
		"cs",
		"de",
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
		failures.push("R2: Chromium locales must match the 15 app locales plus en-GB");
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
				runtimePackages,
				chromiumLocales,
				lprojCount: chromiumLocales.length,
				wallpaperCopies,
				excludedPublicImages,
				referencedPublicImages,
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
