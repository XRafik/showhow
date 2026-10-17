// @vitest-environment jsdom
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { EditorProjectData } from "../../src/components/video-editor/projectPersistence";
import { migrateProjectDataToAxcutDocument } from "../../src/lib/ai-edition/document/migrate";
import { loadUserPreferences } from "../../src/lib/userPreferences";

const sandbox = vi.hoisted(() => {
	const platformDescriptor = Object.getOwnPropertyDescriptor(process, "platform");
	const systemVersionDescriptor = Object.getOwnPropertyDescriptor(process, "getSystemVersion");
	// These compatibility cases exercise Showhow's macOS-only bundle completion seam.
	Object.defineProperty(process, "platform", { value: "darwin", configurable: true });
	Object.defineProperty(process, "getSystemVersion", { value: () => "15.0.0", configurable: true });
	const fs = require("node:fs") as typeof import("node:fs");
	const os = require("node:os") as typeof import("node:os");
	const path = require("node:path") as typeof import("node:path");
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "showhow-v2-compat-"));
	for (const name of ["profile", "recordings", "Showhow/Recordings"])
		fs.mkdirSync(path.join(root, name), { recursive: true });
	return {
		root,
		platformDescriptor,
		systemVersionDescriptor,
		handlers: new Map<string, (...args: unknown[]) => unknown>(),
		save: vi.fn(async (_options: unknown) => ({ canceled: true })),
	};
});
vi.mock("node:os", async (original) => {
	const actual = await original<typeof import("node:os")>();
	return {
		...actual,
		default: { ...actual, homedir: () => sandbox.root },
		homedir: () => sandbox.root,
	};
});
vi.mock("electron", () => ({
	app: {
		getPath: () => path.join(sandbox.root, "profile"),
		getAppPath: () => process.cwd(),
		getVersion: () => "0.1.0",
		isPackaged: false,
		on: () => undefined,
	},
	BrowserWindow: { getAllWindows: () => [], fromWebContents: () => null },
	clipboard: {},
	desktopCapturer: {},
	dialog: { showSaveDialog: sandbox.save },
	ipcMain: {
		handle: (channel: string, fn: (...args: unknown[]) => unknown) =>
			sandbox.handlers.set(channel, fn),
		on: () => undefined,
		removeHandler: () => undefined,
	},
	screen: {},
	shell: {},
	systemPreferences: {},
	safeStorage: { isEncryptionAvailable: () => false },
}));
vi.mock("../main", () => ({
	RECORDINGS_DIR: path.join(sandbox.root, "recordings"),
	DEFAULT_RECORDINGS_DIR: path.join(sandbox.root, "recordings"),
	getRecordingsDirInfo: () => ({}),
	setRecordingsDir: () => undefined,
}));
// Native cursor capture is an OS boundary; deterministic samples replace the helper only.
vi.mock("../native-bridge/cursor/recording/factory", () => ({
	createCursorRecordingSession: () => ({
		start: async () => undefined,
		stop: async () => ({
			version: 2,
			provider: "macos-native",
			samples: [{ timeMs: 100, cx: 0.25, cy: 0.75, interactionType: "move", visible: true }],
			assets: [],
		}),
	}),
}));

import { registerIpcHandlers } from "../ipc/handlers";

const fixtures = path.resolve("tests/fixtures/legacy/fc50566a");
async function invoke(channel: string, ...args: unknown[]) {
	const handler = sandbox.handlers.get(channel);
	expect(handler, `public IPC ${channel} is registered`).toBeTypeOf("function");
	return (await handler?.({ sender: {} }, ...args)) as {
		success: boolean;
		path?: string;
		project?: EditorProjectData;
		session?: { screenVideoPath: string };
	};
}
beforeAll(() => {
	registerIpcHandlers(
		() => undefined,
		() => ({}) as never,
		() => ({}) as never,
		() => ({}) as never,
		() => null,
		() => null,
		() => null,
	);
});
afterAll(async () => {
	try {
		await fs.rm(sandbox.root, { recursive: true, force: true });
	} finally {
		for (const [name, descriptor] of [
			["platform", sandbox.platformDescriptor],
			["getSystemVersion", sandbox.systemVersionDescriptor],
		] as const) {
			if (descriptor) Object.defineProperty(process, name, descriptor);
			else Reflect.deleteProperty(process, name);
		}
	}
});
describe("fc50566a compatibility at the v2 public interfaces", () => {
	it("L1 preserves authentic .showhow bytes and its serialized media through v2 conversion", async () => {
		const original = await fs.readFile(path.join(fixtures, "legacy.showhow"));
		const copy = path.join(sandbox.root, "legacy.showhow");
		await fs.writeFile(copy, original);
		const result = await invoke("load-project-file-from-path", copy);
		expect(result.success).toBe(true);
		expect(await fs.readFile(copy)).toEqual(original);
		const document = migrateProjectDataToAxcutDocument(result.project as EditorProjectData);
		expect(document.assets[0].originalPath).toBe(
			JSON.parse(original.toString()).media.screenVideoPath,
		);
	});
	it("L2 does not overwrite .openscreen and proposes a new .showhow save", async () => {
		const original = await fs.readFile(path.join(fixtures, "legacy.openscreen"));
		const copy = path.join(sandbox.root, "legacy.openscreen");
		await fs.writeFile(copy, original);
		const opened = await invoke("load-project-file-from-path", copy);
		expect(opened.success).toBe(true);
		sandbox.save.mockClear();
		await invoke("save-project-file", opened.project, "migrated", copy);
		expect(await fs.readFile(copy)).toEqual(original);
		expect(sandbox.save).toHaveBeenCalled();
		expect(sandbox.save.mock.calls[0]?.[0]).toMatchObject({
			defaultPath: expect.stringMatching(/migrated\.showhow$/),
		});
	});
	it("a separately relocated legacy fixture resolves approved media into the v2 session", async () => {
		for (const extension of ["showhow", "openscreen"]) {
			const originalPath = path.join(fixtures, `legacy.${extension}`);
			const original = await fs.readFile(originalPath);
			const derived = JSON.parse(original.toString()) as EditorProjectData;
			const media = path.join(sandbox.root, `derived-${extension}.webm`);
			await fs.copyFile(path.join(fixtures, "bundle/video.webm"), media);
			derived.media = { ...derived.media, screenVideoPath: media };
			const project = path.join(sandbox.root, `derived.${extension}`);
			await fs.writeFile(project, JSON.stringify(derived));
			const opened = await invoke("load-project-file-from-path", project);
			expect(opened.success).toBe(true);
			expect(await invoke("get-current-recording-session")).toMatchObject({
				success: true,
				session: { screenVideoPath: media },
			});
			expect(await fs.readFile(originalPath)).toEqual(original);
		}
	});
	it("L3 lists the authentic old bundle through the library IPC", async () => {
		const root = path.join(sandbox.root, "Showhow/Recordings");
		await fs.cp(path.join(fixtures, "bundle"), path.join(root, "old-recording"), {
			recursive: true,
		});
		const entries = await invoke("showhow:list-recordings");
		expect(entries).toMatchObject([
			{ bundleDir: path.join(root, "old-recording"), video: "video.webm" },
		]);
		expect(await invoke("showhow:open-recording", path.join(root, "old-recording"))).toMatchObject({
			success: true,
		});
		expect(await invoke("get-current-recording-session")).toMatchObject({
			success: true,
			session: { screenVideoPath: await fs.realpath(path.join(root, "old-recording/video.webm")) },
		});
		expect(await invoke("showhow:open-recording", sandbox.root)).toMatchObject({ success: false });
	});
	it("L4 reads the actual old Showhow UI preference rather than resetting the layout", async () => {
		const storage = JSON.parse(
			await fs.readFile(path.join(fixtures, "renderer-storage.json"), "utf8"),
		) as Record<string, string>;
		localStorage.clear();
		for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value);
		expect(loadUserPreferences().trayLayout).toBe("vertical");
	});
	it("L5 saves new cursor telemetry alongside the bundled video and the editor IPC reads it", async () => {
		await invoke("set-recording-state", true, 1792180801000, "editable-overlay");
		await invoke("set-recording-state", false);
		const bytes = await fs.readFile(path.join(fixtures, "bundle/video.webm"));
		const result = await invoke("store-recorded-session", {
			screen: { fileName: "cursor-take.webm", videoData: Uint8Array.from(bytes).buffer },
			createdAt: 1792180801000,
			cursorCaptureMode: "editable-overlay",
		});
		expect(result.success).toBe(true);
		const sidecar = JSON.parse(await fs.readFile(`${result.path}.cursor.json`, "utf8"));
		expect(sidecar.samples[0]).toMatchObject({ timeMs: 100, cx: 0.25, cy: 0.75 });
		const telemetry = await invoke("get-cursor-telemetry", result.path);
		expect(telemetry).toMatchObject({
			success: true,
			samples: [expect.objectContaining({ timeMs: 100, cx: 0.25, cy: 0.75 })],
		});
		expect(result.path).toMatch(/Showhow\/Recordings\/[^/]+\/video\.webm$/);
	});
	it("library reopening restores the saved pending transcript job after the flat session is cleared", async () => {
		const bytes = await fs.readFile(path.join(fixtures, "bundle/video.webm"));
		const saved = await invoke("store-recorded-session", {
			screen: { fileName: "resume-library-take.webm", videoData: Uint8Array.from(bytes).buffer },
			createdAt: 1792181000000,
			cursorCaptureMode: "system",
		});
		expect(saved.success).toBe(true);
		const bundle = path.dirname(saved.path as string);
		const pending = await fs.readFile(path.join(bundle, "transcript.txt"), "utf8");
		expect(pending).toBe("(transcription pending)\n");
		const flatManifest = path.join(sandbox.root, "recordings/resume-library-take.session.json");
		expect(JSON.parse(await fs.readFile(flatManifest, "utf8"))).toMatchObject({
			showhowBundleDir: bundle,
		});
		await invoke("set-current-recording-session", null);
		expect(await invoke("showhow:open-recording", bundle)).toMatchObject({ success: true });
		const canonicalBundle = await fs.realpath(bundle);
		const video = path.join(canonicalBundle, "video.webm");
		expect(await invoke("get-current-recording-session")).toMatchObject({
			success: true,
			session: {
				screenVideoPath: video,
				showhowBundleDir: canonicalBundle,
				showhowVideoFileUrl: pathToFileURL(video).toString(),
			},
		});
		expect(await fs.readFile(video)).toEqual(bytes);
		expect(await fs.readFile(path.join(bundle, "transcript.txt"), "utf8")).toBe(pending);
	});
	it.each([
		"completed",
		"missing",
	])("library opens valid media without requeuing a %s transcript", async (state) => {
		const bundle = path.join(sandbox.root, "Showhow/Recordings", `transcript-${state}`);
		await fs.cp(path.join(fixtures, "bundle"), bundle, { recursive: true });
		const transcript = path.join(bundle, "transcript.txt");
		if (state === "completed")
			await fs.writeFile(transcript, "[00:00] Keep this completed transcript.\n");
		else await fs.rm(transcript);
		expect(await invoke("showhow:open-recording", bundle)).toMatchObject({ success: true });
		const current = await invoke("get-current-recording-session");
		expect(current.session).not.toHaveProperty("showhowBundleDir");
		expect(current.session).not.toHaveProperty("showhowVideoFileUrl");
		if (state === "completed")
			expect(await fs.readFile(transcript, "utf8")).toContain("Keep this completed transcript");
	});
	it("the v2 recording completion saves the Showhow bundle and pending transcript", async () => {
		const bytes = await fs.readFile(path.join(fixtures, "bundle/video.webm"));
		const result = await invoke("store-recorded-session", {
			screen: { fileName: "new-take.webm", videoData: Uint8Array.from(bytes).buffer },
			createdAt: 1792180800000,
			cursorCaptureMode: "system",
		});
		expect(result.success).toBe(true);
		expect(result.path).toMatch(/Showhow\/Recordings\/[^/]+\/video\.webm$/);
		const bundle = path.dirname(result.path as string);
		expect(await fs.readFile(path.join(bundle, "video.webm"))).toEqual(bytes);
		expect(await fs.readdir(bundle)).toEqual(
			expect.arrayContaining(["meta.json", "transcript.txt", "screenshots"]),
		);
	});
});

it("a classified upstream helper filename still exposes unclassified visible copy", async () => {
	const file = "OpenScreenCore.ts";
	await fs.writeFile(
		path.join(sandbox.root, file),
		'const moduleName = "OpenScreenCaptureCore";\nconst title = "OpenScreen";\n',
	);
	const policy = {
		allowed: [
			{
				file,
				pathRole: "pinned upstream helper module",
				lines: [{ text: 'const moduleName = "OpenScreenCaptureCore";', count: 1 }],
			},
		],
	};
	const code = `import { scanBrandingReferences } from ${JSON.stringify(pathToFileURL(path.resolve("scripts/branding-check.mjs")).href)}; console.log(JSON.stringify(await scanBrandingReferences(${JSON.stringify(sandbox.root)}, ${JSON.stringify(policy)}, async () => [${JSON.stringify(file)}])));`;
	expect(
		JSON.parse(
			execFileSync(process.execPath, ["--input-type=module", "-e", code], { encoding: "utf8" }),
		),
	).toEqual([{ file, line: 2, text: 'const title = "OpenScreen";' }]);
});
