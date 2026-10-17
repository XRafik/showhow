// Electron permissions are public IPC dependencies, not native runtime in this test.
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Hoisted temp roots so the mocked module exports point at writable test dirs
// before `handlers.ts` is imported (its top-level reads RECORDINGS_DIR and
// SHOWHOW_RECORDINGS_ROOT transitively at module load).
const fixture = vi.hoisted(() => {
	const nodeFs = require("node:fs") as typeof import("node:fs");
	const nodeOs = require("node:os") as typeof import("node:os");
	const nodePath = require("node:path") as typeof import("node:path");
	const recordingsDir = nodeFs.mkdtempSync(nodePath.join(nodeOs.tmpdir(), "showhow-legacy-"));
	const showhowRoot = nodeFs.mkdtempSync(nodePath.join(nodeOs.tmpdir(), "showhow-root-"));
	const userData = nodeFs.mkdtempSync(nodePath.join(nodeOs.tmpdir(), "showhow-userdata-"));
	return { recordingsDir, showhowRoot, userData };
});

vi.mock("../permissions", () => ({
	getMacPermissions: () => ({ read: async () => ({ screen: "granted", accessibility: "denied" }) }),
	showPermissionsWindow: () => undefined,
}));

vi.mock("electron", () => ({
	app: { getPath: () => fixture.userData },
	BrowserWindow: {},
	clipboard: {},
	desktopCapturer: {},
	dialog: {},
	ipcMain: { handle: () => undefined, on: () => undefined },
	screen: {},
	shell: {},
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
import { getApprovedProjectSession } from "./handlers";

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

	afterAll(async () => {
		await Promise.all(
			[fixture.recordingsDir, fixture.showhowRoot, fixture.userData].map((dir) =>
				rm(dir, { recursive: true, force: true }),
			),
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
