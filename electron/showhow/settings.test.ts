import { promises as nodeFs } from "node:fs";
import {
	mkdir,
	mkdtemp,
	readdir,
	readFile,
	realpath,
	rm,
	symlink,
	writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { BUNDLED_TRANSCRIPTION } from "../../src/lib/showhow/settings";
import { BUNDLED_STT_FILES } from "../stt/modelManager";
import { getRecordingsRoot, saveNameRecordingsWithAi, saveRecordingsRoot } from "./bundle";
import { listRecordings } from "./recordingLibrary";
import { registerShowhowSettingsHandlers } from "./settings";

it("resolves the default recordings root when a scratch settings file is missing", async () => {
	const scratch = await mkdtemp(path.join(os.tmpdir(), "showhow-default-root-"));
	try {
		expect(getRecordingsRoot(path.join(scratch, "showhow-settings.json"))).toBe(
			path.join(os.homedir(), "Showhow", "Recordings"),
		);
	} finally {
		await rm(scratch, { recursive: true, force: true });
	}
});

describe("Showhow settings info", () => {
	it("reports the fixed recordings folder relative to home", async () => {
		const handlers = new Map<string, (...args: unknown[]) => Promise<unknown>>();
		const home = os.homedir();
		registerShowhowSettingsHandlers({
			handle: (channel, handler) => handlers.set(channel, handler),
			recordingsRoot: path.join(home, "Showhow", "Recordings"),
			homeDir: home,
		});
		expect(await handlers.get("showhow:settings-info")!()).toEqual({
			recordingsFolder: "~/Showhow/Recordings",
			nameRecordingsWithAi: true,
		});
	});

	it("persists the name-recordings preference through its IPC handler", async () => {
		const home = await mkdtemp(path.join(os.tmpdir(), "showhow-settings-title-pref-"));
		const settingsFile = path.join(home, "showhow-settings.json");
		const handlers = new Map<string, (...args: unknown[]) => Promise<unknown>>();
		try {
			await writeFile(
				settingsFile,
				JSON.stringify({ recordingsRoot: path.join(home, "Recordings") }),
			);
			registerShowhowSettingsHandlers({
				handle: (channel, handler) => handlers.set(channel, handler),
				recordingsRoot: path.join(home, "Recordings"),
				homeDir: home,
				settingsFile,
			});
			expect(await handlers.get("showhow:set-name-recordings-with-ai")?.(undefined, false)).toEqual(
				{
					success: true,
					nameRecordingsWithAi: false,
				},
			);
			expect(JSON.parse(await readFile(settingsFile, "utf8")).nameRecordingsWithAi).toBe(false);
			expect(await handlers.get("showhow:settings-info")?.()).toMatchObject({
				nameRecordingsWithAi: false,
			});
		} finally {
			await rm(home, { recursive: true, force: true });
		}
	});

	it("reports the persisted recordings folder on the next app start", async () => {
		const userData = await mkdtemp(path.join(os.tmpdir(), "showhow-settings-"));
		try {
			const recordingsRoot = path.join(userData, "Client work");
			const settingsFile = path.join(userData, "showhow-settings.json");
			await writeFile(settingsFile, JSON.stringify({ recordingsRoot }));
			const handlers = new Map<string, (...args: unknown[]) => Promise<unknown>>();
			const deps = {
				handle: (channel: string, handler: (...args: unknown[]) => Promise<unknown>) =>
					handlers.set(channel, handler),
				recordingsRoot: path.join(userData, "Showhow", "Recordings"),
				homeDir: userData,
				settingsFile,
			};
			registerShowhowSettingsHandlers(deps);

			expect(await handlers.get("showhow:settings-info")!()).toEqual({
				recordingsFolder: "~/Client work",
				nameRecordingsWithAi: true,
			});
		} finally {
			await rm(userData, { recursive: true, force: true });
		}
	});

	it("preserves the folder and AI naming toggle during concurrent settings patches", async () => {
		const home = await mkdtemp(path.join(os.tmpdir(), "showhow-settings-concurrent-"));
		const settingsFile = path.join(home, "showhow-settings.json");
		const recordingsRoot = path.join(home, "Client work");
		await writeFile(settingsFile, JSON.stringify({ recordingsRoot: path.join(home, "Old") }));
		try {
			await Promise.all([
				saveRecordingsRoot(recordingsRoot, settingsFile),
				saveNameRecordingsWithAi(false, settingsFile),
			]);
			expect(JSON.parse(await readFile(settingsFile, "utf8"))).toMatchObject({
				recordingsRoot,
				nameRecordingsWithAi: false,
			});
		} finally {
			await rm(home, { recursive: true, force: true });
		}
	});

	it("offers a selected folder with the number of current recordings", async () => {
		const home = await mkdtemp(path.join(os.tmpdir(), "showhow-folder-choice-"));
		try {
			const currentRoot = path.join(home, "Showhow", "Recordings");
			const targetRoot = path.join(home, "Client work");
			const bundle = path.join(currentRoot, "one-recording");
			await mkdir(targetRoot);
			await mkdir(bundle, { recursive: true });
			await writeFile(
				path.join(bundle, "meta.json"),
				JSON.stringify({
					schemaVersion: 1,
					title: "One recording",
					source: "desktop",
					createdAt: 1,
					video: "video.webm",
				}),
			);
			await writeFile(path.join(bundle, "video.webm"), "video");
			const handlers = new Map<string, (...args: unknown[]) => Promise<unknown>>();
			const deps = {
				handle: (channel: string, handler: (...args: unknown[]) => Promise<unknown>) =>
					handlers.set(channel, handler),
				recordingsRoot: currentRoot,
				homeDir: home,
				chooseFolder: async () => targetRoot,
			};
			registerShowhowSettingsHandlers(deps);
			const choose = handlers.get("showhow:choose-recordings-folder");

			expect(choose).toBeTypeOf("function");
			expect(await choose?.()).toMatchObject({
				status: "selected",
				recordingsFolder: "~/Client work",
				recordingCount: 1,
			});
		} finally {
			await rm(home, { recursive: true, force: true });
		}
	});

	it("rejects the current recordings folder through aliases and nested folders", async () => {
		const home = await mkdtemp(path.join(os.tmpdir(), "showhow-folder-aliases-"));
		try {
			const currentRoot = path.join(home, "Recordings");
			const alias = path.join(home, "Recordings alias");
			const nested = path.join(currentRoot, "nested");
			await mkdir(nested, { recursive: true });
			await symlink(currentRoot, alias, "dir");
			for (const targetRoot of [alias, nested]) {
				const handlers = new Map<string, (...args: unknown[]) => Promise<unknown>>();
				registerShowhowSettingsHandlers({
					handle: (channel, handler) => handlers.set(channel, handler),
					recordingsRoot: currentRoot,
					homeDir: home,
					chooseFolder: async () => targetRoot,
				});
				expect(await handlers.get("showhow:choose-recordings-folder")?.()).toMatchObject({
					status: "rejected",
				});
			}
		} finally {
			await rm(home, { recursive: true, force: true });
		}
	});

	it("keeps old bundles on disk and switches the persisted Library root", async () => {
		const home = await mkdtemp(path.join(os.tmpdir(), "showhow-folder-keep-"));
		try {
			const currentRoot = path.join(home, "Showhow", "Recordings");
			const targetRoot = path.join(home, "Client work");
			const bundle = path.join(currentRoot, "one-recording");
			const settingsFile = path.join(home, "showhow-settings.json");
			await mkdir(bundle, { recursive: true });
			await mkdir(targetRoot);
			await writeFile(settingsFile, JSON.stringify({ recordingsRoot: currentRoot }));
			await writeFile(
				path.join(bundle, "meta.json"),
				JSON.stringify({
					schemaVersion: 1,
					title: "One recording",
					source: "desktop",
					createdAt: 1,
					video: "video.webm",
				}),
			);
			await writeFile(path.join(bundle, "video.webm"), "video");
			const handlers = new Map<string, (...args: unknown[]) => Promise<unknown>>();
			registerShowhowSettingsHandlers({
				handle: (channel, handler) => handlers.set(channel, handler),
				recordingsRoot: () => currentRoot,
				homeDir: home,
				settingsFile,
				chooseFolder: async () => targetRoot,
			});
			const chosen = await handlers.get("showhow:choose-recordings-folder")?.();
			if (
				typeof chosen !== "object" ||
				chosen === null ||
				!("token" in chosen) ||
				typeof chosen.token !== "string"
			) {
				throw new Error("expected a selected recordings folder token");
			}
			const change = handlers.get("showhow:change-recordings-folder");

			expect(change).toBeTypeOf("function");
			if (!change) return;
			expect(await change(undefined, chosen.token, "keep")).toMatchObject({ success: true });
			expect(JSON.parse(await readFile(settingsFile, "utf8")).recordingsRoot).toBe(
				await realpath(targetRoot),
			);
			expect(await readFile(path.join(bundle, "video.webm"), "utf8")).toBe("video");
			expect(await listRecordings(targetRoot)).toEqual([]);
		} finally {
			await rm(home, { recursive: true, force: true });
		}
	});

	it("moves two complete bundles into the persisted recordings root", async () => {
		const home = await mkdtemp(path.join(os.tmpdir(), "showhow-folder-move-"));
		try {
			const currentRoot = path.join(home, "Showhow", "Recordings");
			const targetRoot = path.join(home, "Client work");
			const settingsFile = path.join(home, "showhow-settings.json");
			await mkdir(currentRoot, { recursive: true });
			await mkdir(targetRoot);
			await writeFile(settingsFile, JSON.stringify({ recordingsRoot: currentRoot }));
			for (const [name, createdAt] of [
				["first", 1],
				["second", 2],
			] as const) {
				const bundle = path.join(currentRoot, name);
				await mkdir(bundle);
				await writeFile(
					path.join(bundle, "meta.json"),
					JSON.stringify({
						schemaVersion: 1,
						title: name,
						source: "desktop",
						createdAt,
						video: "video.webm",
					}),
				);
				await writeFile(path.join(bundle, "video.webm"), `${name}-video`);
			}
			const handlers = new Map<string, (...args: unknown[]) => Promise<unknown>>();
			registerShowhowSettingsHandlers({
				handle: (channel, handler) => handlers.set(channel, handler),
				recordingsRoot: () => currentRoot,
				homeDir: home,
				settingsFile,
				chooseFolder: async () => targetRoot,
			});
			const chosen = await handlers.get("showhow:choose-recordings-folder")?.();
			if (
				typeof chosen !== "object" ||
				chosen === null ||
				!("token" in chosen) ||
				typeof chosen.token !== "string"
			) {
				throw new Error("expected a selected recordings folder token");
			}
			const change = handlers.get("showhow:change-recordings-folder");
			if (!change) throw new Error("showhow:change-recordings-folder handler is missing");

			expect(await change(undefined, chosen.token, "move")).toMatchObject({ success: true });
			expect(await listRecordings(currentRoot)).toEqual([]);
			expect(await listRecordings(targetRoot)).toHaveLength(2);
		} finally {
			await rm(home, { recursive: true, force: true });
		}
	});

	it("stops on the second failed rename and leaves the remaining bundles in place", async () => {
		const home = await mkdtemp(path.join(os.tmpdir(), "showhow-folder-partial-move-"));
		const currentRoot = path.join(home, "Showhow", "Recordings");
		const targetRoot = path.join(home, "Client work");
		const settingsFile = path.join(home, "showhow-settings.json");
		await mkdir(currentRoot, { recursive: true });
		await mkdir(targetRoot);
		await writeFile(settingsFile, JSON.stringify({ recordingsRoot: currentRoot }));
		for (const [name, createdAt] of [
			["first", 3],
			["second", 2],
			["third", 1],
		] as const) {
			const bundle = path.join(currentRoot, name);
			await mkdir(bundle);
			await writeFile(
				path.join(bundle, "meta.json"),
				JSON.stringify({
					schemaVersion: 1,
					title: name,
					source: "desktop",
					createdAt,
					video: "video.webm",
				}),
			);
			await writeFile(path.join(bundle, "video.webm"), `${name}-video`);
		}
		const handlers = new Map<string, (...args: unknown[]) => Promise<unknown>>();
		registerShowhowSettingsHandlers({
			handle: (channel, handler) => handlers.set(channel, handler),
			recordingsRoot: () => currentRoot,
			homeDir: home,
			settingsFile,
			chooseFolder: async () => targetRoot,
		});
		const chosen = await handlers.get("showhow:choose-recordings-folder")?.();
		if (
			typeof chosen !== "object" ||
			chosen === null ||
			!("token" in chosen) ||
			typeof chosen.token !== "string"
		) {
			throw new Error("expected a selected recordings folder token");
		}
		const change = handlers.get("showhow:change-recordings-folder");
		if (!change) throw new Error("showhow:change-recordings-folder handler is missing");
		const rename = nodeFs.rename.bind(nodeFs);
		const renameSpy = vi.spyOn(nodeFs, "rename").mockImplementation(async (source, destination) => {
			if (path.basename(String(source)) === "second") {
				throw Object.assign(new Error("second rename failed"), { code: "EIO" });
			}
			await rename(source, destination);
		});
		try {
			const result = await change(undefined, chosen.token, "move");

			expect(result).toMatchObject({
				success: false,
				movedBundles: ["first"],
				remainingBundles: ["second", "third"],
				failedBundle: "second",
			});
			expect(await listRecordings(currentRoot)).toHaveLength(2);
			expect(await listRecordings(targetRoot)).toHaveLength(1);
			expect(await readdir(currentRoot)).toEqual(["second", "third"]);
			expect(await readdir(targetRoot)).toEqual(["first"]);
			expect(await readFile(path.join(targetRoot, "first", "video.webm"), "utf8")).toBe(
				"first-video",
			);
			await expect(readFile(path.join(currentRoot, "first", "video.webm"))).rejects.toMatchObject({
				code: "ENOENT",
			});
			for (const name of ["second", "third"]) {
				expect(await readFile(path.join(currentRoot, name, "video.webm"), "utf8")).toBe(
					`${name}-video`,
				);
			}
			expect(JSON.parse(await readFile(settingsFile, "utf8")).recordingsRoot).toBe(
				await realpath(targetRoot),
			);
		} finally {
			renameSpy.mockRestore();
			await rm(home, { recursive: true, force: true });
		}
	});

	it("persists the chosen root before moving any bundle", async () => {
		const home = await mkdtemp(path.join(os.tmpdir(), "showhow-folder-persist-first-"));
		const currentRoot = path.join(home, "Recordings");
		const targetRoot = path.join(home, "New recordings");
		const settingsFile = path.join(home, "showhow-settings.json");
		await mkdir(currentRoot, { recursive: true });
		await mkdir(targetRoot);
		await writeFile(settingsFile, JSON.stringify({ recordingsRoot: currentRoot }));
		const bundle = path.join(currentRoot, "one-recording");
		await mkdir(bundle);
		await writeFile(
			path.join(bundle, "meta.json"),
			JSON.stringify({
				schemaVersion: 1,
				title: "One recording",
				source: "desktop",
				createdAt: 1,
				video: "video.webm",
			}),
		);
		await writeFile(path.join(bundle, "video.webm"), "valid video");
		const handlers = new Map<string, (...args: unknown[]) => Promise<unknown>>();
		registerShowhowSettingsHandlers({
			handle: (channel, handler) => handlers.set(channel, handler),
			recordingsRoot: () => currentRoot,
			homeDir: home,
			settingsFile,
			chooseFolder: async () => targetRoot,
		});
		const chosen = await handlers.get("showhow:choose-recordings-folder")?.();
		if (typeof chosen !== "object" || chosen === null || !("token" in chosen)) {
			throw new Error("expected a selected recordings folder token");
		}
		const rename = nodeFs.rename.bind(nodeFs);
		const renameSpy = vi.spyOn(nodeFs, "rename").mockImplementation(async (source, destination) => {
			if (String(destination) === settingsFile) {
				throw Object.assign(new Error("settings disk failure"), { code: "EIO" });
			}
			await rename(source, destination);
		});
		try {
			const result = await handlers.get("showhow:change-recordings-folder")?.(
				undefined,
				chosen.token,
				"move",
			);
			expect(result).toMatchObject({ success: false, error: "settings disk failure" });
			expect(renameSpy).toHaveBeenCalledTimes(1);
			expect(await readFile(path.join(bundle, "video.webm"), "utf8")).toBe("valid video");
			expect(await listRecordings(targetRoot)).toEqual([]);
		} finally {
			renameSpy.mockRestore();
			await rm(home, { recursive: true, force: true });
		}
	});

	it("names the transcription model that actually ships in the bundle", () => {
		expect(BUNDLED_TRANSCRIPTION.file).toBe(BUNDLED_STT_FILES.whisper.name);
		expect(BUNDLED_TRANSCRIPTION.sizeMb).toBe(
			Math.round(BUNDLED_STT_FILES.whisper.approximateBytes / 1_000_000),
		);
	});
});
