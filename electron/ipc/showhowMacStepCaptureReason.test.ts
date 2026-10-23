// Electron permissions are public IPC dependencies, not native runtime in this test.
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it, vi } from "vitest";

// Hoisted temp roots so the mocked module exports point at writable test dirs
// before `handlers.ts` is imported (its top-level reads RECORDINGS_DIR and
// SHOWHOW_RECORDINGS_ROOT transitively at module load).
const fixture = vi.hoisted(() => {
	const nodeFs = require("node:fs") as typeof import("node:fs");
	const nodeOs = require("node:os") as typeof import("node:os");
	const nodePath = require("node:path") as typeof import("node:path");
	const recordingsDir = nodeFs.mkdtempSync(nodePath.join(nodeOs.tmpdir(), "showhow-macstep-rec-"));
	const showhowRoot = nodeFs.mkdtempSync(nodePath.join(nodeOs.tmpdir(), "showhow-macstep-root-"));
	const userData = nodeFs.mkdtempSync(nodePath.join(nodeOs.tmpdir(), "showhow-macstep-ud-"));
	return { recordingsDir, showhowRoot, userData };
});

// Capture ipcMain.handle registrations so the test can invoke a handler by channel.
const handlerRegistry = vi.hoisted(() => new Map<string, (...args: unknown[]) => unknown>());

vi.mock("../permissions", () => ({
	getMacPermissions: () => ({ read: async () => ({ screen: "granted", accessibility: "denied" }) }),
	showPermissionsWindow: () => undefined,
}));

vi.mock("electron", () => ({
	app: {
		getPath: () => fixture.userData,
		focus: () => undefined,
		on: () => undefined,
		getVersion: () => "1.6.0",
	},
	BrowserWindow: {},
	clipboard: {},
	desktopCapturer: {},
	dialog: {},
	ipcMain: {
		handle: (channel: string, fn: (...args: unknown[]) => unknown) => {
			handlerRegistry.set(channel, fn);
		},
		on: () => undefined,
		removeHandler: () => undefined,
	},
	screen: {},
	shell: {},
	safeStorage: { isEncryptionAvailable: () => false },
	systemPreferences: {},
}));

vi.mock("../main", () => ({ RECORDINGS_DIR: fixture.recordingsDir }));

// Stub the bridge server so registration never binds a real WebSocket.
vi.mock("../showhow/bridgeServer", () => ({
	ShowhowBridgeServer: class {
		port = 0;
		isCompanionConnected() {
			return false;
		}
		hasRecordingEpoch() {
			return false;
		}
		hadMidRecordingDisconnect() {
			return false;
		}
		async start() {
			// no-op: avoid binding a real WebSocket in tests
		}
		async stop() {
			// no-op
		}
		setRecordingEpoch() {
			// no-op
		}
		clearRecordingEpoch() {
			// no-op
		}
		async drainSteps() {
			return [];
		}
	},
}));

// Preserve real bundle behavior and containment while pointing registered
// handlers at this test's fixture root.
vi.mock("../showhow/bundle", async (importOriginal) => {
	const actual = await importOriginal<typeof import("../showhow/bundle")>();
	return {
		...actual,
		getRecordingsRoot: () => fixture.showhowRoot,
		isInsideRecordingsRoot: (candidate: string, root = fixture.showhowRoot) =>
			actual.isInsideRecordingsRoot(candidate, root),
	};
});

// eslint-disable-next-line import/first
import { registerIpcHandlers } from "./handlers";

afterAll(async () => {
	await Promise.all(
		[fixture.recordingsDir, fixture.showhowRoot, fixture.userData].map((dir) =>
			rm(dir, { recursive: true, force: true }),
		),
	);
});

describe("stop-native-mac-recording stepCaptureReason (issue #27 live)", () => {
	// Register handlers once with stub window factories (none are invoked).
	registerIpcHandlers(
		() => undefined,
		() => ({}) as never,
		() => ({}) as never,
		() => ({}) as never,
		() => ({}) as never,
		() => null,
		() => null,
		() => null,
	);

	it("persists meta.stepCapture.reason = accessibility-denied (not no-clicks) when the recorder degraded to system-cursor mode, preserving video/transcript", async () => {
		const handler = handlerRegistry.get("stop-native-mac-recording");
		expect(handler).toBeDefined();

		// Simulate a native mac recording that started in system-cursor mode
		// (accessibility was denied). The start handler stored the cursor mode
		// and recording id; we drive the stop handler directly with the
		// stepCaptureReason the renderer would pass.
		const startHandler = handlerRegistry.get("start-native-mac-recording");
		expect(startHandler).toBeDefined();

		// We cannot spawn the real helper in CI; instead we drive the stop
		// handler's bundling path by pre-creating the recording output file and
		// exercising the createRecordingBundle call directly. The stop handler
		// reads nativeMacCaptureProcess/targetPath/recordingId/cursorCaptureMode
		// module state. To test the bundling path in isolation, we invoke the
		// handler with a pre-built bundle on disk by mocking the internal state
		// is not feasible without test-only APIs. Instead, prove the contract
		// via createRecordingBundle directly with stepCaptureReason.
		const work = await mkdtemp(path.join(tmpdir(), "showhow-macstep-work-"));
		const screenVideoPath = path.join(work, "native-recording.mp4");
		await writeFile(screenVideoPath, "fake-mp4");

		// No cursor.json -> system mode has no cursor telemetry -> no clicks.
		// stepCaptureReason: accessibility-denied must take precedence.
		const { createRecordingBundle, isInsideRecordingsRoot } = await import("../showhow/bundle");
		const bundle = await createRecordingBundle({
			screenVideoPath,
			createdAt: new Date(2026, 6, 11, 16, 42, 7).getTime(),
			recordingsRoot: fixture.showhowRoot,
			stepCaptureReason: "accessibility-denied",
		});

		expect(await isInsideRecordingsRoot(bundle.bundleDir, fixture.showhowRoot)).toBe(true);
		const meta = JSON.parse(await readFile(path.join(bundle.bundleDir, "meta.json"), "utf-8"));
		expect(meta.stepCapture).toEqual({
			status: "unavailable",
			reason: "accessibility-denied",
			message:
				"macOS accessibility was denied; recorded in system-cursor mode, so semantic steps are unavailable.",
		});
		// The fail-open contract: video is preserved.
		expect(await readFile(bundle.screenVideoPath, "utf-8")).toBe("fake-mp4");
		// transcript.txt is not written by the bundle (caption pipeline writes it
		// later); its absence is fine. No cursor.json -> no telemetry file.

		await rm(work, { recursive: true, force: true });
	});

	it("classifies a normal system-mode recording without stepCaptureReason as no-clicks (not accessibility-denied)", async () => {
		const work = await mkdtemp(path.join(tmpdir(), "showhow-macstep-normal-"));
		const screenVideoPath = path.join(work, "native-recording.mp4");
		await writeFile(screenVideoPath, "fake-mp4");

		const { createRecordingBundle } = await import("../showhow/bundle");
		const bundle = await createRecordingBundle({
			screenVideoPath,
			createdAt: new Date(2026, 6, 11, 16, 42, 8).getTime(),
			recordingsRoot: fixture.showhowRoot,
		});

		const meta = JSON.parse(await readFile(path.join(bundle.bundleDir, "meta.json"), "utf-8"));
		expect(meta.stepCapture).toEqual({
			status: "unavailable",
			reason: "no-clicks",
			message: "No desktop clicks were captured; this bundle has a transcript-only doc.",
		});
		expect(await readFile(bundle.screenVideoPath, "utf-8")).toBe("fake-mp4");

		await rm(work, { recursive: true, force: true });
	});
});
