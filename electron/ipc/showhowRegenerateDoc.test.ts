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
	const recordingsDir = nodeFs.mkdtempSync(
		nodePath.join(nodeOs.tmpdir(), "showhow-regen-ipc-rec-"),
	);
	const showhowRoot = nodeFs.mkdtempSync(nodePath.join(nodeOs.tmpdir(), "showhow-regen-ipc-root-"));
	const userData = nodeFs.mkdtempSync(nodePath.join(nodeOs.tmpdir(), "showhow-regen-ipc-ud-"));
	return { recordingsDir, showhowRoot, userData };
});

// Capture ipcMain.handle registrations so the test can invoke a handler by channel,
// exactly as the renderer would through the preload bridge. This does NOT weaken
// path validation: the real handler still runs `path.resolve` + root containment.
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

// Stub the bridge server so registration never binds a real WebSocket. The
// `showhow:regenerate-doc` handler does not touch the bridge; other handlers
// are only registered (not invoked) so a stub is sufficient.
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

// Preserve the real bundle exports (regenerateDocArtifacts, createRecordingBundle,
// etc.) so the IPC handler end-to-end runs the real doc engine against a real
// bundle on disk; only override SHOWHOW_RECORDINGS_ROOT to point at a temp dir.
vi.mock("../showhow/bundle", async (importOriginal) => {
	const actual = await importOriginal<typeof import("../showhow/bundle")>();
	return { ...actual, SHOWHOW_RECORDINGS_ROOT: fixture.showhowRoot };
});

// eslint-disable-next-line import/first
import { createRecordingBundle } from "../showhow/bundle";
// Imported after the mocks above so its module-level reads see the temp roots.
// eslint-disable-next-line import/first
import { registerIpcHandlers } from "./handlers";

afterAll(async () => {
	await Promise.all(
		[fixture.recordingsDir, fixture.showhowRoot, fixture.userData].map((dir) =>
			rm(dir, { recursive: true, force: true }),
		),
	);
});

describe("showhow:regenerate-doc IPC handler", () => {
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

	it("returns a typed safe failure result and leaves video/meta/transcript intact on a derivation failure", async () => {
		const handler = handlerRegistry.get("showhow:regenerate-doc");
		expect(handler).toBeDefined();

		// Build a real bundle inside the temp recordings root with clicks + transcript.
		const work = await mkdtemp(path.join(tmpdir(), "showhow-regen-ipc-work-"));
		const screenVideoPath = path.join(work, "rec.mp4");
		await writeFile(screenVideoPath, "fake-mp4");
		await writeFile(
			`${screenVideoPath}.cursor.json`,
			JSON.stringify({
				samples: [
					{ timeMs: 1_250, cx: 0.25, cy: 0.5, interactionType: "click" },
					{ timeMs: 3_500, cx: 0.75, cy: 0.2, interactionType: "click" },
				],
			}),
		);
		const bundle = await createRecordingBundle({
			screenVideoPath,
			createdAt: new Date(2026, 6, 11, 16, 42, 7).getTime(),
			recordingsRoot: fixture.showhowRoot,
			transcriptContent: "[0:01] first\n[0:03] second\n",
			extractFrames: async () => {
				// no-op: this test asserts on regeneration failure + preservation
			},
		});

		// Capture the prior artifact pair and sources before corrupting telemetry.
		const priorJson = await readFile(path.join(bundle.bundleDir, "steps.json"), "utf-8");
		const priorMd = await readFile(path.join(bundle.bundleDir, "steps.md"), "utf-8");
		const priorMeta = await readFile(path.join(bundle.bundleDir, "meta.json"), "utf-8");
		const priorTranscript = await readFile(path.join(bundle.bundleDir, "transcript.txt"), "utf-8");

		// Corrupt the cursor telemetry to provoke a required-source-read failure.
		await writeFile(
			path.join(bundle.bundleDir, "video.mp4.cursor.json"),
			"{ not valid json",
			"utf-8",
		);

		// Invoke the handler exactly as the renderer would (event, bundleDir).
		const result = (await handler?.(null, bundle.bundleDir)) as {
			success: boolean;
			stepsWritten: number;
			transcriptAvailable: boolean;
			bundleDir: string;
			entry: { steps?: { label: string }[] } | null;
		};

		// Typed safe failure result -- never threw.
		expect(result).toEqual(
			expect.objectContaining({
				success: false,
				stepsWritten: 0,
				transcriptAvailable: false,
				bundleDir: bundle.bundleDir,
			}),
		);
		// The refreshed entry still reflects the preserved prior steps (meta is valid).
		expect(result.entry?.steps?.map((s) => s.label)).toEqual(["first", "second"]);

		// Source video, meta, and transcript are intact.
		expect(await readFile(bundle.screenVideoPath, "utf-8")).toBe("fake-mp4");
		expect(await readFile(path.join(bundle.bundleDir, "meta.json"), "utf-8")).toBe(priorMeta);
		expect(await readFile(path.join(bundle.bundleDir, "transcript.txt"), "utf-8")).toBe(
			priorTranscript,
		);
		// The prior artifact pair is preserved unchanged.
		expect(await readFile(path.join(bundle.bundleDir, "steps.json"), "utf-8")).toBe(priorJson);
		expect(await readFile(path.join(bundle.bundleDir, "steps.md"), "utf-8")).toBe(priorMd);

		await rm(work, { recursive: true, force: true });
	});

	it("rejects a bundle path outside the recordings root without touching disk", async () => {
		const handler = handlerRegistry.get("showhow:regenerate-doc");
		expect(handler).toBeDefined();

		const outside = await mkdtemp(path.join(tmpdir(), "showhow-regen-ipc-outside-"));
		const result = (await handler?.(null, outside)) as {
			success: boolean;
			entry: unknown;
		};

		expect(result).toEqual({
			success: false,
			stepsWritten: 0,
			transcriptAvailable: false,
			entry: null,
		});

		await rm(outside, { recursive: true, force: true });
	});

	it("rejects a non-string bundle path", async () => {
		const handler = handlerRegistry.get("showhow:regenerate-doc");
		expect(handler).toBeDefined();

		const result = (await handler?.(null, 12345)) as { success: boolean; entry: unknown };

		expect(result).toEqual({
			success: false,
			stepsWritten: 0,
			transcriptAvailable: false,
			entry: null,
		});
	});
});
