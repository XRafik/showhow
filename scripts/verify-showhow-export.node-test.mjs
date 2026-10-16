import assert from "node:assert/strict";
import { test } from "node:test";
import { launchAfterDoctor } from "./verify-showhow-export.mjs";

const good = { node: "v22.22.1", npm: "10.9.4", codex: "codex-cli 0.160.0", missing: [] };
test("missing tools, build, fixture or dependencies fail before launch", () => {
	for (const missing of [
		"ffmpeg",
		"dist-electron/main.js",
		"tests/fixtures/sample.webm",
		"playwright",
	]) {
		let launches = 0;
		assert.throws(
			() => launchAfterDoctor({ ...good, missing: [missing] }, () => launches++),
			/prerequisite/,
		);
		assert.equal(launches, 0);
	}
});

test("an existing evidence directory is rejected without touching its bytes", async () => {
	const { mkdtempSync, writeFileSync, readFileSync, rmSync } = await import("node:fs");
	const { tmpdir } = await import("node:os");
	const { join } = await import("node:path");
	const { reserveEvidence } = await import("./verify-showhow-export.mjs");
	const dir = mkdtempSync(join(tmpdir(), "showhow-evidence-test-"));
	try {
		writeFileSync(join(dir, "result.json"), "original proof");
		assert.throws(() => reserveEvidence(dir), /exist/i);
		assert.equal(readFileSync(join(dir, "result.json"), "utf8"), "original proof");
	} finally {
		rmSync(dir, { recursive: true });
	}
});

test("successful media cannot mask cleanup failure or fixture mutation", async () => {
	const { accepted } = await import("./verify-showhow-export.mjs");
	const result = {
		media: { valid: true },
		journey: true,
		cleanup: { processesGone: true, rootGone: true },
		fixture: { before: "abc", after: "abc" },
	};
	assert.equal(accepted(result), true);
	assert.equal(accepted({ ...result, cleanup: { processesGone: false, rootGone: true } }), false);
	assert.equal(accepted({ ...result, cleanup: { processesGone: true, rootGone: false } }), false);
	assert.equal(accepted({ ...result, fixture: { before: "abc", after: "changed" } }), false);
});

const validProbe = {
	streams: [{ width: 640, height: 480, nb_read_frames: "60", duration: "2.0" }],
	format: { duration: "2.0" },
};
test("a corrupt GIF or incomplete independent decoder cannot establish export proof", async () => {
	const { validateGif } = await import("./verify-showhow-export.mjs");
	assert.throws(() => validateGif(Buffer.alloc(2048), validProbe, { status: 0 }), /GIF/);
});

test("full FFmpeg decode failure rejects a GIF with plausible signature and probe", async () => {
	const { validateGif } = await import("./verify-showhow-export.mjs");
	const bytes = Buffer.alloc(2048);
	bytes.write("GIF89a");
	assert.throws(
		() => validateGif(bytes, validProbe, { status: 1, stderr: "decoder error" }),
		/decode/,
	);
});

test("exact engine and Codex pins reject substitutions", () => {
	for (const [key, value] of [
		["node", "v24.14.0"],
		["npm", "11.9.0"],
		["codex", "codex-cli 0.159.0"],
	]) {
		assert.throws(
			() => launchAfterDoctor({ ...good, [key]: value }, () => undefined),
			/prerequisite/,
		);
	}
});

test("probe frame, dimension and duration bounds reject implausible media", async () => {
	const { validateGif } = await import("./verify-showhow-export.mjs");
	const bytes = Buffer.alloc(2048);
	bytes.write("GIF89a");
	for (const stream of [
		{ width: 0 },
		{ height: 0 },
		{ nb_read_frames: "1" },
		{ duration: "0.5" },
		{ duration: "5" },
	]) {
		assert.throws(
			() =>
				validateGif(bytes, { streams: [{ ...validProbe.streams[0], ...stream }] }, { status: 0 }),
			/bounds/,
		);
	}
	assert.equal(validateGif(bytes, validProbe, { status: 0 }).valid, true);
});

test("supporting bootstrap ordering sets private paths before production import", async () => {
	const { makeBootstrap } = await import("./verify-showhow-export.mjs");
	const source = makeBootstrap("/synthetic/main.js", {
		appData: "/synthetic/private/appData",
		temp: "/synthetic/private/temp",
	});
	assert.ok(source.indexOf("app.setPath") < source.indexOf("await import("));
	assert.ok(source.includes("file:///synthetic/main.js"));
	// Real native results, rather than this string check, must prove isolation.
});

test("real CLI doctor with missing tool PATH retains failure and never launches Electron", async () => {
	const fs = await import("node:fs");
	const path = await import("node:path");
	const { fileURLToPath } = await import("node:url");
	const { spawnSync } = await import("node:child_process");
	const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
	const parent = fs.mkdtempSync(path.join(root, "artifacts/verification-recipe/doctor-test-"));
	try {
		const bins = path.join(parent, "bins");
		fs.mkdirSync(bins);
		for (const name of ["node", "npm", "codex"]) {
			const executable =
				name === "node"
					? process.execPath
					: process.env.PATH.split(path.delimiter)
							.map((entry) => path.join(entry, name))
							.find((entry) => fs.existsSync(entry));
			assert.ok(executable, `${name} exists in test setup`);
			fs.symlinkSync(executable, path.join(bins, name));
		}
		const evidence = path.join(parent, "failure");
		const outcome = spawnSync(
			process.execPath,
			[path.join(root, "scripts/verify-showhow-export.mjs"), "--evidence-dir", evidence],
			{ env: { ...process.env, PATH: bins }, encoding: "utf8", timeout: 15000 },
		);
		assert.equal(outcome.status, 1, outcome.stderr);
		const result = JSON.parse(fs.readFileSync(path.join(evidence, "result.json"), "utf8"));
		assert.equal(result.failure.stage, "doctor");
		assert.match(result.failure.message, /ffmpeg/);
		assert.equal(result.electronPid, undefined);
		assert.equal(result.journey, false);
	} finally {
		fs.rmSync(parent, { recursive: true });
	}
});

test("installed Codex 0.162.1 is accepted without version substitution", () => {
	let launched = false;
	launchAfterDoctor({ ...good, codex: "codex-cli 0.162.1" }, () => {
		launched = true;
	});
	assert.equal(launched, true);
});

test("packaged launch resolves the app executable and archive, never dependency Electron", async (t) => {
	const fs = await import("node:fs/promises");
	const path = await import("node:path");
	const os = await import("node:os");
	const { createPackage } = await import("@electron/asar");
	const { resolvePackagedApp } = await import("./verify-showhow-export.mjs");
	const root = await fs.mkdtemp(path.join(os.tmpdir(), "showhow-packaged-test-"));
	t.after(() => fs.rm(root, { recursive: true, force: true }));
	const app = path.join(root, "Showhow.app");
	const binary = path.join(app, "Contents/MacOS/Showhow");
	const archive = path.join(app, "Contents/Resources/app.asar");
	await fs.mkdir(path.dirname(binary), { recursive: true });
	await fs.mkdir(path.dirname(archive), { recursive: true });
	await fs.writeFile(binary, "fixture executable", { mode: 0o700 });
	const source = path.join(root, "source");
	await fs.mkdir(path.join(source, "dist-electron"), { recursive: true });
	await fs.writeFile(
		path.join(source, "package.json"),
		JSON.stringify({ name: "showhow", main: "dist-electron/main.js" }),
	);
	await fs.writeFile(path.join(source, "dist-electron/main.js"), "// fixture\n");
	await fs.mkdir(path.join(source, "dist"));
	await fs.writeFile(path.join(source, "dist-electron/preload.mjs"), "// preload");
	await fs.writeFile(path.join(source, "dist/index.html"), "fixture");
	await createPackage(source, archive);
	const resolved = resolvePackagedApp(app);
	assert.equal(resolved.electronBinary, await fs.realpath(binary));
	assert.equal(resolved.archive, await fs.realpath(archive));
	assert.equal(resolved.appPath, await fs.realpath(app));
	assert.match(resolved.archiveSha256, /^[a-f0-9]{64}$/);
	await fs.rm(archive);
	assert.throws(() => resolvePackagedApp(app), /archive|ENOENT/);
	assert.throws(() => resolvePackagedApp(root), /\.app/);
});

test("inspector initialization runs before the actual entrypoint first statement", async (t) => {
	const fs = await import("node:fs/promises");
	const path = await import("node:path");
	const os = await import("node:os");
	const net = await import("node:net");
	const { spawn } = await import("node:child_process");
	const { once } = await import("node:events");
	const { initializeBeforeMain } = await import("./verify-showhow-export.mjs");
	const root = await fs.mkdtemp(path.join(os.tmpdir(), "showhow-startup-test-"));
	t.after(() => fs.rm(root, { recursive: true, force: true }));
	const entry = path.join(root, "entry.cjs");
	const output = path.join(root, "observed.json");
	await fs.writeFile(
		entry,
		`require("node:fs").writeFileSync(${JSON.stringify(output)}, JSON.stringify(globalThis.initializedBeforeMain));\n`,
	);
	const server = net.createServer();
	await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
	const port = server.address().port;
	await new Promise((resolve) => server.close(resolve));
	const child = spawn(process.execPath, [`--inspect-brk=127.0.0.1:${port}`, entry], {
		stdio: "pipe",
	});
	const exited = once(child, "exit");
	try {
		const initialized = await initializeBeforeMain(
			port,
			"globalThis.initializedBeforeMain = 42",
			entry,
		);
		assert.equal(initialized.value, 42);
		await exited;
		assert.equal(JSON.parse(await fs.readFile(output, "utf8")), 42);
	} finally {
		if (child.exitCode === null) child.kill();
		await exited;
	}
});

test("packaged initialization sets appData before bootstrap can reset userData and leaves HOME unchanged", async () => {
	const vm = await import("node:vm");
	const { makePackagedInitialization } = await import("./verify-showhow-export.mjs");
	const observed = {};
	const app = {
		setPath: (key, value) => {
			observed[key] = value;
		},
		getPath: (key) => observed[key],
	};
	const originalHome = process.env.HOME;
	const paths = {
		appData: "/private/synthetic/appData",
		userData: "/private/synthetic/appData/Showhow",
		home: "/private/synthetic/home",
		temp: "/private/synthetic/temp",
	};
	vm.runInNewContext(makePackagedInitialization(paths), {
		require: (name) =>
			name === "electron"
				? { app }
				: name === "node:path"
					? { join: (...parts) => parts.join("/") }
					: {},
		process: { pid: 100, execPath: "/synthetic/Showhow.app/Contents/MacOS/Showhow" },
	});
	assert.deepEqual(observed, paths);
	// Production bootstrap selects appData/Showhow, so it must already be private.
	assert.equal(`${observed.appData}/Showhow`, paths.userData);
	assert.equal(process.env.HOME, originalHome);
});

test("explicit packaged CLI fails doctor on a missing app instead of falling back to dev Electron", async (t) => {
	const fs = await import("node:fs/promises");
	const path = await import("node:path");
	const { spawnSync } = await import("node:child_process");
	const parent = await fs.mkdtemp(path.resolve("artifacts/verification-recipe/packaged-doctor-"));
	t.after(() => fs.rm(parent, { recursive: true, force: true }));
	const evidence = path.join(parent, "failure");
	const outcome = spawnSync(
		process.execPath,
		[
			"scripts/verify-showhow-export.mjs",
			"--evidence-dir",
			evidence,
			"--app",
			path.join(parent, "Missing.app"),
		],
		{ encoding: "utf8", timeout: 15000 },
	);
	assert.equal(outcome.status, 1, outcome.stderr);
	const result = JSON.parse(await fs.readFile(path.join(evidence, "result.json"), "utf8"));
	assert.equal(result.failure.stage, "doctor");
	assert.equal(result.electronPid, undefined);
	assert.equal(result.launchMode, "packaged");
	assert.match(result.failure.message, /ENOENT/);
});

test("a rejected startup location terminates the paused owned child before its first statement", async (t) => {
	const fs = await import("node:fs/promises");
	const path = await import("node:path");
	const os = await import("node:os");
	const net = await import("node:net");
	const { spawn } = await import("node:child_process");
	const { once } = await import("node:events");
	const { initializeBeforeMain } = await import("./verify-showhow-export.mjs");
	const root = await fs.mkdtemp(path.join(os.tmpdir(), "showhow-startup-reject-"));
	t.after(() => fs.rm(root, { recursive: true, force: true }));
	const entry = path.join(root, "entry.cjs");
	const output = path.join(root, "unsafe-write");
	await fs.writeFile(
		entry,
		`require("node:fs").writeFileSync(${JSON.stringify(output)}, "must not run");\n`,
	);
	const server = net.createServer();
	await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
	const port = server.address().port;
	await new Promise((resolve) => server.close(resolve));
	const child = spawn(process.execPath, [`--inspect-brk=127.0.0.1:${port}`, entry], {
		stdio: "pipe",
	});
	const exited = once(child, "exit");
	try {
		await assert.rejects(
			initializeBeforeMain(port, "globalThis.shouldNotRun = true", path.join(root, "wrong.cjs")),
			/Unexpected startup pause/,
		);
		const exit = await Promise.race([
			exited,
			new Promise((resolve) => {
				const timer = setTimeout(() => resolve([null]), 500);
				timer.unref();
			}),
		]);
		assert.equal(exit[0], 1, "rejected initialization must terminate its paused child");
		await assert.rejects(fs.access(output), /ENOENT/);
	} finally {
		if (child.exitCode === null) child.kill();
		await exited;
	}
});
