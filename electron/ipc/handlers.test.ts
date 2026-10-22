// Electron permissions are public IPC dependencies, not native runtime in this test.
import { mkdir, mkdtemp, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// Hoisted temp roots so the mocked module exports point at writable test dirs
// before `handlers.ts` is imported (its top-level reads RECORDINGS_DIR and
// SHOWHOW_RECORDINGS_ROOT transitively at module load).
const fixture = vi.hoisted(() => {
	const nodeFs = require("node:fs") as typeof import("node:fs");
	const nodeOs = require("node:os") as typeof import("node:os");
	const nodePath = require("node:path") as typeof import("node:path");
	const recordingsDir = nodeFs.mkdtempSync(nodePath.join(nodeOs.tmpdir(), "showhow-legacy-"));
	const showhowRootParent = nodeFs.mkdtempSync(nodePath.join(nodeOs.tmpdir(), "showhow-root-"));
	const realShowhowRoot = nodePath.join(showhowRootParent, "real-recordings");
	const showhowRoot = nodePath.join(showhowRootParent, "Showhow", "Recordings");
	nodeFs.mkdirSync(realShowhowRoot);
	nodeFs.mkdirSync(nodePath.dirname(showhowRoot));
	nodeFs.symlinkSync(realShowhowRoot, showhowRoot, "dir");
	const userData = nodeFs.mkdtempSync(nodePath.join(nodeOs.tmpdir(), "showhow-userdata-"));
	return {
		recordingsDir,
		realShowhowRoot,
		showhowRoot,
		showhowRootParent,
		userData,
		ipcHandlers: new Map<string, (...args: unknown[]) => unknown>(),
		clipboardWrites: [] as string[],
	};
});

vi.mock("../permissions", () => ({
	getMacPermissions: () => ({ read: async () => ({ screen: "granted", accessibility: "denied" }) }),
	showPermissionsWindow: () => undefined,
}));

vi.mock("electron", () => ({
	app: {
		getPath: () => fixture.userData,
		on: () => undefined,
		focus: () => undefined,
		getVersion: () => "1.6.0",
	},
	BrowserWindow: {},
	clipboard: { writeText: (text: string) => fixture.clipboardWrites.push(text) },
	desktopCapturer: {},
	dialog: {},
	ipcMain: {
		handle: (channel: string, listener: (...args: unknown[]) => unknown) =>
			fixture.ipcHandlers.set(channel, listener),
		on: () => undefined,
		removeHandler: () => undefined,
	},
	screen: {},
	shell: {},
	safeStorage: { isEncryptionAvailable: () => false },
	systemPreferences: {},
}));

vi.mock("../main", () => ({ RECORDINGS_DIR: fixture.recordingsDir }));

vi.mock("../showhow/bundle", () => ({
	SHOWHOW_RECORDINGS_ROOT: fixture.showhowRoot,
	createRecordingBundle: () => Promise.resolve(),
	regenerateDocArtifacts: () => Promise.resolve(),
}));

// Imported after the mocks above so its module-level reads see the temp roots.
// eslint-disable-next-line import/first
import { listRecordings } from "../showhow/recordingLibrary";
// eslint-disable-next-line import/first
import { getApprovedProjectSession, registerIpcHandlers } from "./handlers";

const VIDEO_NAME = "video.webm";

describe("getApprovedProjectSession trust roots", () => {
	const ephemeralDirs: string[] = [];

	beforeEach(async () => {
		ephemeralDirs.push(
			await mkdtemp(path.join(tmpdir(), "showhow-project-")),
			await mkdtemp(path.join(tmpdir(), "showhow-outside-")),
		);
	});

	afterEach(async () => {
		await Promise.all(
			ephemeralDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
		);
	});

	it("approves a screen video descended from the canonical SHOWHOW_RECORDINGS_ROOT", async () => {
		const bundleDir = path.join(fixture.showhowRoot, "2026-07-28_120000-recording");
		await mkdir(bundleDir, { recursive: true });
		const screenVideoPath = path.join(bundleDir, VIDEO_NAME);
		await writeFile(screenVideoPath, "webm");
		const project = { media: { screenVideoPath } };

		const session = await getApprovedProjectSession(project);

		expect(session).not.toBeNull();
		expect(session?.screenVideoPath).toBe(screenVideoPath);
	});

	it("approves a screen video within the project directory", async () => {
		const projectDir = ephemeralDirs[0];
		const screenVideoPath = path.join(projectDir, VIDEO_NAME);
		await writeFile(screenVideoPath, "webm");
		const projectFilePath = path.join(projectDir, "workflow.showhow");
		const project = { media: { screenVideoPath } };

		const session = await getApprovedProjectSession(project, projectFilePath);

		expect(session).not.toBeNull();
		expect(session?.screenVideoPath).toBe(screenVideoPath);
	});

	it("approves a screen video within the legacy RECORDINGS_DIR", async () => {
		const screenVideoPath = path.join(fixture.recordingsDir, VIDEO_NAME);
		await writeFile(screenVideoPath, "webm");
		const project = { media: { screenVideoPath } };

		const session = await getApprovedProjectSession(project);

		expect(session).not.toBeNull();
		expect(session?.screenVideoPath).toBe(screenVideoPath);
	});

	it("rejects a screen video outside all trusted roots", async () => {
		const outsideDir = ephemeralDirs[1];
		const screenVideoPath = path.join(outsideDir, VIDEO_NAME);
		await writeFile(screenVideoPath, "webm");
		const project = { media: { screenVideoPath } };

		await expect(getApprovedProjectSession(project)).rejects.toThrow(
			/invalid or unsupported screen video path/,
		);
	});
});

afterAll(async () => {
	await Promise.all(
		[fixture.recordingsDir, fixture.showhowRootParent, fixture.userData].map((dir) =>
			rm(dir, { recursive: true, force: true }),
		),
	);
});

describe("showhow:copy-path handler", () => {
	beforeEach(() => {
		fixture.clipboardWrites.length = 0;
	});

	beforeAll(() => {
		const noWindow = () => ({}) as never;
		registerIpcHandlers(
			() => undefined,
			noWindow,
			noWindow,
			noWindow,
			() => null,
			() => null,
			() => null,
		);
	});

	async function copyPath(bundleDir: unknown): Promise<{ success: boolean }> {
		const handler = fixture.ipcHandlers.get("showhow:copy-path");
		if (!handler) throw new Error("showhow:copy-path handler was not registered");
		return (await handler(undefined, bundleDir)) as { success: boolean };
	}

	async function makeBundle(root: string, name: string, source: "desktop" | "imported") {
		const bundleDir = path.join(root, name);
		await mkdir(bundleDir, { recursive: true });
		await writeFile(
			path.join(bundleDir, "meta.json"),
			JSON.stringify({
				schemaVersion: 1,
				title: name,
				source,
				createdAt: Date.now(),
				video: source === "imported" ? "video.mp4" : "video.webm",
			}),
		);
		await writeFile(
			path.join(bundleDir, source === "imported" ? "video.mp4" : "video.webm"),
			"video",
		);
		return bundleDir;
	}

	it("copies the fresh recording path supplied by the Library list", async () => {
		const bundleDir = await makeBundle(fixture.showhowRoot, "fresh-recording", "desktop");
		const [entry] = await listRecordings(fixture.showhowRoot);

		expect(entry?.bundleDir).toBe(bundleDir);
		expect(await copyPath(entry?.bundleDir)).toEqual({ success: true });
		expect(fixture.clipboardWrites).toEqual([bundleDir]);
	});

	it("copies the canonical imported MP4 bundle path supplied by the Library list", async () => {
		const bundleDir = await makeBundle(fixture.realShowhowRoot, "imported-recording", "imported");
		const [entry] = await listRecordings(fixture.realShowhowRoot);

		expect(entry?.bundleDir).toBe(bundleDir);
		expect(await copyPath(entry?.bundleDir)).toEqual({ success: true });
		expect(fixture.clipboardWrites).toEqual([bundleDir]);
	});

	it("copies a bundle path resolved through the symlinked recordings root", async () => {
		const bundleDir = await makeBundle(fixture.showhowRoot, "symlink-root-recording", "desktop");
		const resolvedBundleDir = await realpath(bundleDir);

		expect(await copyPath(resolvedBundleDir)).toEqual({ success: true });
		expect(fixture.clipboardWrites).toEqual([resolvedBundleDir]);
	});

	it("refuses an outside-root path without writing to the clipboard", async () => {
		const outsideRoot = await mkdtemp(path.join(tmpdir(), "showhow-outside-copy-"));
		try {
			const bundleDir = await makeBundle(outsideRoot, "outside-recording", "desktop");
			expect(await copyPath(bundleDir)).toEqual({ success: false });
			expect(fixture.clipboardWrites).toEqual([]);
		} finally {
			await rm(outsideRoot, { recursive: true, force: true });
		}
	});

	it("refuses an in-root symlink that escapes the recordings root", async () => {
		const outsideRoot = await mkdtemp(path.join(tmpdir(), "showhow-escaped-copy-"));
		try {
			const outsideBundle = await makeBundle(outsideRoot, "escaped-recording", "desktop");
			const bundleAlias = path.join(fixture.showhowRoot, "escaped-recording");
			await symlink(outsideBundle, bundleAlias, "dir");

			expect(await copyPath(bundleAlias)).toEqual({ success: false });
			expect(fixture.clipboardWrites).toEqual([]);
		} finally {
			await rm(outsideRoot, { recursive: true, force: true });
		}
	});
});
