import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createRecordingBundle } from "./bundle";
import { listRecordings, readRecordingEntry, regenerateRecordingDoc } from "./recordingLibrary";

async function makeTempRoot(): Promise<string> {
	return mkdtemp(path.join(os.tmpdir(), "showhow-lib-"));
}

describe("listRecordings", () => {
	it("reads an imported MP4 bundle without inventing capture telemetry", async () => {
		const root = await makeTempRoot();
		const dir = path.join(root, "imported");
		await mkdir(dir);
		await writeFile(path.join(dir, "video.mp4"), "copied media");
		await writeFile(
			path.join(dir, "meta.json"),
			JSON.stringify({
				title: "Imported demo",
				source: "imported",
				createdAt: 123,
				video: "video.mp4",
				durationMs: 1000,
				stepCapture: {
					status: "unavailable",
					reason: "no-clicks",
					message: "Imported video has no click capture.",
				},
			}),
		);
		const entries = await listRecordings(root);
		expect(entries).toHaveLength(1);
		expect(entries[0]).toMatchObject({
			source: "imported",
			title: "Imported demo",
			video: "video.mp4",
			durationMs: 1000,
		});
		expect(entries[0].stepCapture?.status).toBe("unavailable");
	});

	it("projects only known optional guide statuses and narration kind without changing source files", async () => {
		const root = await makeTempRoot();
		for (const [index, status] of [
			"none",
			"making",
			"ready",
			"failed",
			"unknown",
			undefined,
		].entries()) {
			const dir = path.join(root, `status-${index}`);
			await mkdir(dir);
			const meta = JSON.stringify({
				title: `Take ${index}`,
				source: "desktop",
				createdAt: index,
				...(status ? { guide: { status } } : {}),
			});
			await writeFile(path.join(dir, "meta.json"), meta);
			await writeFile(
				path.join(dir, "steps.json"),
				JSON.stringify([
					{ label: "Explain the screen", ts: 1200, screenshot: "", kind: "narration" },
				]),
			);
			const entry = await readRecordingEntry(dir);
			expect(entry?.guideStatus).toBe(index < 4 ? status : undefined);
			expect(entry?.steps?.[0].kind).toBe("narration");
			expect(await readFile(path.join(dir, "meta.json"), "utf8")).toBe(meta);
		}
	});

	it("returns [] when the recordings root does not exist", async () => {
		const root = path.join(os.tmpdir(), `showhow-nonexistent-${Date.now()}`);
		const entries = await listRecordings(root);
		expect(entries).toEqual([]);
	});

	it("returns [] when the recordings root is empty", async () => {
		const root = await makeTempRoot();
		const entries = await listRecordings(root);
		expect(entries).toEqual([]);
	});

	it("throws when the recordings root fails to read with a non-ENOENT error", async () => {
		const root = await makeTempRoot();
		const notADirectoryPath = path.join(root, "not-a-directory");
		await writeFile(notADirectoryPath, "plain file");
		await expect(listRecordings(notADirectoryPath)).rejects.toMatchObject({ code: "ENOTDIR" });
	});

	it("skips directories whose meta.json is missing", async () => {
		const root = await makeTempRoot();
		await mkdir(path.join(root, "no-meta-dir"));
		const entries = await listRecordings(root);
		expect(entries).toEqual([]);
	});

	it("skips directories whose meta.json is not valid JSON", async () => {
		const root = await makeTempRoot();
		const dir = path.join(root, "bad-json");
		await mkdir(dir);
		await writeFile(path.join(dir, "meta.json"), "{ broken JSON");
		const entries = await listRecordings(root);
		expect(entries).toEqual([]);
	});

	it("skips directories whose meta.json is missing required fields", async () => {
		const root = await makeTempRoot();
		const dir = path.join(root, "incomplete-meta");
		await mkdir(dir);
		await writeFile(
			path.join(dir, "meta.json"),
			JSON.stringify({ schemaVersion: 1, title: "No source or createdAt" }),
		);
		const entries = await listRecordings(root);
		expect(entries).toEqual([]);
	});

	it("returns a single valid desktop bundle", async () => {
		const root = await makeTempRoot();
		const dir = path.join(root, "2026-07-11_164207-recording");
		await mkdir(dir);
		const createdAt = new Date(2026, 6, 11, 16, 42, 7).getTime();
		await writeFile(
			path.join(dir, "meta.json"),
			JSON.stringify({
				schemaVersion: 1,
				title: "Recording 2026-07-11 16:42",
				source: "desktop",
				createdAt,
				durationMs: 72_000,
				video: "video.webm",
				transcript: "transcript.txt",
				steps: null,
			}),
		);
		const entries = await listRecordings(root);
		expect(entries).toHaveLength(1);
		expect(entries[0]).toEqual({
			bundleDir: dir,
			title: "Recording 2026-07-11 16:42",
			source: "desktop",
			createdAt,
			durationMs: 72_000,
		});
	});

	it("omits durationMs when not present in meta.json", async () => {
		const root = await makeTempRoot();
		const dir = path.join(root, "2026-07-11_164207-recording");
		await mkdir(dir);
		const createdAt = new Date(2026, 6, 11, 16, 42, 7).getTime();
		await writeFile(
			path.join(dir, "meta.json"),
			JSON.stringify({
				schemaVersion: 1,
				title: "Recording 2026-07-11 16:42",
				source: "desktop",
				createdAt,
				video: "video.webm",
				transcript: "transcript.txt",
				steps: null,
			}),
		);
		const entries = await listRecordings(root);
		expect(entries).toHaveLength(1);
		expect(entries[0].durationMs).toBeUndefined();
	});

	it("returns a browser-source bundle", async () => {
		const root = await makeTempRoot();
		const dir = path.join(root, "2026-07-12_100000-recording");
		await mkdir(dir);
		const createdAt = new Date(2026, 6, 12, 10, 0, 0).getTime();
		await writeFile(
			path.join(dir, "meta.json"),
			JSON.stringify({
				schemaVersion: 1,
				title: "Browser recording",
				source: "browser",
				createdAt,
				video: "video.webm",
				transcript: "transcript.txt",
				steps: null,
			}),
		);
		const entries = await listRecordings(root);
		expect(entries).toHaveLength(1);
		expect(entries[0].source).toBe("browser");
	});

	it("sorts entries newest-first by createdAt", async () => {
		const root = await makeTempRoot();
		const timestamps = [
			new Date(2026, 6, 11, 10, 0, 0).getTime(),
			new Date(2026, 6, 13, 10, 0, 0).getTime(),
			new Date(2026, 6, 12, 10, 0, 0).getTime(),
		];
		for (const [i, createdAt] of timestamps.entries()) {
			const dir = path.join(root, `rec-${i}`);
			await mkdir(dir);
			await writeFile(
				path.join(dir, "meta.json"),
				JSON.stringify({
					schemaVersion: 1,
					title: `Recording ${i}`,
					source: "desktop",
					createdAt,
					video: "video.webm",
					transcript: "transcript.txt",
					steps: null,
				}),
			);
		}
		const entries = await listRecordings(root);
		expect(entries).toHaveLength(3);
		expect(entries[0].createdAt).toBe(timestamps[1]); // newest
		expect(entries[1].createdAt).toBe(timestamps[2]);
		expect(entries[2].createdAt).toBe(timestamps[0]); // oldest
	});

	it("skips plain files in the recordings root (only scans subdirectories)", async () => {
		const root = await makeTempRoot();
		await writeFile(path.join(root, "stray-file.json"), JSON.stringify({ schemaVersion: 1 }));
		const entries = await listRecordings(root);
		expect(entries).toEqual([]);
	});

	it("skips screenshot names containing either path separator", async () => {
		const root = await makeTempRoot();
		const dir = path.join(root, "recording-with-malformed-step");
		const screenshotsDir = path.join(dir, "screenshots");
		await mkdir(screenshotsDir, { recursive: true });
		await writeFile(
			path.join(dir, "meta.json"),
			JSON.stringify({
				schemaVersion: 1,
				title: "Recording with malformed step",
				source: "desktop",
				createdAt: 1_753_000_000_000,
			}),
		);
		await writeFile(
			path.join(dir, "steps.json"),
			JSON.stringify([
				{ label: "Malformed", ts: 1_000, screenshot: "..\\x.png" },
				{ label: "Valid", ts: 2_000, screenshot: "step-02.png" },
			]),
		);
		await writeFile(path.join(screenshotsDir, "..\\x.png"), "malformed");
		await writeFile(path.join(screenshotsDir, "step-02.png"), "valid");

		const entries = await listRecordings(root);

		expect(entries).toHaveLength(1);
		expect(entries[0].steps).toEqual([
			{
				label: "Valid",
				ts: 2_000,
				screenshot: "step-02.png",
				screenshotUrl:
					"showhow-media://recordings/recording-with-malformed-step/screenshots/step-02.png",
			},
		]);
	});

	it("returns a screenshotless redacted step with its reveal opt-in state", async () => {
		const root = await makeTempRoot();
		const dir = path.join(root, "recording-with-redacted-step");
		await mkdir(dir);
		await writeFile(
			path.join(dir, "meta.json"),
			JSON.stringify({
				schemaVersion: 1,
				title: "Sensitive recording",
				source: "browser",
				createdAt: 1_753_000_000_000,
			}),
		);
		await writeFile(
			path.join(dir, "steps.json"),
			JSON.stringify([
				{
					label: "Type account number",
					ts: 1_000,
					screenshot: "",
					redaction: true,
					includeRevealedText: false,
				},
			]),
		);

		const entries = await listRecordings(root);

		expect(entries[0]?.steps).toEqual([
			{
				label: "Type account number",
				ts: 1_000,
				screenshot: "",
				redaction: true,
				includeRevealedText: false,
			},
		]);
	});
});

describe("readRecordingEntry", () => {
	it("scans a single bundle directory by absolute path", async () => {
		const root = await makeTempRoot();
		const dir = path.join(root, "2026-07-11_164207-recording");
		await mkdir(dir);
		const createdAt = new Date(2026, 6, 11, 16, 42, 7).getTime();
		await writeFile(
			path.join(dir, "meta.json"),
			JSON.stringify({
				schemaVersion: 1,
				title: "Recording 2026-07-11 16:42",
				source: "desktop",
				createdAt,
				video: "video.webm",
				transcript: "transcript.txt",
				steps: null,
			}),
		);

		const entry = await readRecordingEntry(dir);

		expect(entry).toEqual({
			bundleDir: dir,
			title: "Recording 2026-07-11 16:42",
			source: "desktop",
			createdAt,
		});
	});

	it("surfaces a structured stepCapture reason from meta.json (persistence)", async () => {
		const root = await makeTempRoot();
		const dir = path.join(root, "2026-07-11_164207-recording");
		await mkdir(dir);
		const createdAt = new Date(2026, 6, 11, 16, 42, 7).getTime();
		await writeFile(
			path.join(dir, "meta.json"),
			JSON.stringify({
				schemaVersion: 1,
				title: "Recording 2026-07-11 16:42",
				source: "desktop",
				createdAt,
				video: "video.webm",
				transcript: "transcript.txt",
				steps: null,
				stepCapture: {
					status: "unavailable",
					reason: "accessibility-denied",
					message: "macOS accessibility was denied; recorded in system-cursor mode.",
				},
			}),
		);

		const entry = await readRecordingEntry(dir);

		expect(entry?.stepCapture).toEqual({
			status: "unavailable",
			reason: "accessibility-denied",
			message: "macOS accessibility was denied; recorded in system-cursor mode.",
		});
	});

	it("preserves legacy reads of a stepCapture without a reason field", async () => {
		const root = await makeTempRoot();
		const dir = path.join(root, "2026-07-11_164207-recording");
		await mkdir(dir);
		const createdAt = new Date(2026, 6, 11, 16, 42, 7).getTime();
		await writeFile(
			path.join(dir, "meta.json"),
			JSON.stringify({
				schemaVersion: 1,
				title: "Recording 2026-07-11 16:42",
				source: "desktop",
				createdAt,
				video: "video.webm",
				transcript: "transcript.txt",
				steps: null,
				stepCapture: { status: "unavailable", message: "legacy no reason" },
			}),
		);

		const entry = await readRecordingEntry(dir);

		expect(entry?.stepCapture).toEqual({ status: "unavailable", message: "legacy no reason" });
	});

	it("returns null when the bundle's meta.json is missing", async () => {
		const root = await makeTempRoot();
		const dir = path.join(root, "no-meta");
		await mkdir(dir);

		const entry = await readRecordingEntry(dir);

		expect(entry).toBeNull();
	});
});

describe("regenerateRecordingDoc", () => {
	async function buildBundleWithClicks(opts: {
		transcriptContent?: string;
		clicks?: { timeMs: number; cx: number; cy: number }[];
	}) {
		const work = await mkdtemp(path.join(os.tmpdir(), "showhow-regen-lib-"));
		const root = path.join(work, "Recordings");
		const screenVideoPath = path.join(work, "rec.mp4");
		await writeFile(screenVideoPath, "fake-mp4");
		await writeFile(
			`${screenVideoPath}.cursor.json`,
			JSON.stringify({
				samples: (
					opts.clicks ?? [
						{ timeMs: 1_250, cx: 0.25, cy: 0.5, interactionType: "click" },
						{ timeMs: 3_500, cx: 0.75, cy: 0.2, interactionType: "click" },
					]
				).map((c) => ({ ...c, interactionType: "click" })),
			}),
		);
		const result = await createRecordingBundle({
			screenVideoPath,
			createdAt: new Date(2026, 6, 11, 16, 42, 7).getTime(),
			recordingsRoot: root,
			...(opts.transcriptContent !== undefined
				? { transcriptContent: opts.transcriptContent }
				: {}),
			extractFrames: async () => {
				// no-op: this test asserts on steps.json/steps.md, not extracted frames
			},
		});
		return { result, root };
	}

	it("returns a safe failure result and leaves video/meta/transcript intact when derivation fails", async () => {
		const { result } = await buildBundleWithClicks({
			transcriptContent: "[0:01] first\n[0:03] second\n",
		});
		// Corrupt the cursor telemetry so regeneration is a required-source failure.
		await writeFile(
			path.join(result.bundleDir, "video.mp4.cursor.json"),
			"{ not valid json",
			"utf-8",
		);
		const priorJson = await readFile(path.join(result.bundleDir, "steps.json"), "utf-8");
		const priorMd = await readFile(path.join(result.bundleDir, "steps.md"), "utf-8");

		const regen = await regenerateRecordingDoc(result.bundleDir);

		// Derivation failure is returned safely -- never throws, never removes sources.
		expect(regen.success).toBe(false);
		expect(regen.bundleDir).toBe(result.bundleDir);
		// The pre-existing artifact pair is preserved unchanged.
		expect(await readFile(path.join(result.bundleDir, "steps.json"), "utf-8")).toBe(priorJson);
		expect(await readFile(path.join(result.bundleDir, "steps.md"), "utf-8")).toBe(priorMd);
		// Source video, meta, and transcript are intact.
		expect(await readFile(result.screenVideoPath, "utf-8")).toBe("fake-mp4");
		expect(
			JSON.parse(await readFile(path.join(result.bundleDir, "meta.json"), "utf-8")).title,
		).toBe("Recording 2026-07-11 16:42");
		expect(await readFile(path.join(result.bundleDir, "transcript.txt"), "utf-8")).toBe(
			"[0:01] first\n[0:03] second\n",
		);
		// The refreshed entry still reflects the preserved prior steps.
		expect(regen.entry?.steps?.map((s) => s.label)).toEqual(["first", "second"]);
	});

	it("refreshes into the resulting doc on success", async () => {
		// Bundle created with NO transcript -> labels are "Step N".
		const { result } = await buildBundleWithClicks({});
		const before = await readRecordingEntry(result.bundleDir);
		expect(before?.steps?.map((s) => s.label)).toEqual(["Step 1", "Step 2"]);

		// Transcript arrives later; regeneration rebuilds labels from it.
		await writeFile(
			path.join(result.bundleDir, "transcript.txt"),
			"[0:01] Open the product catalog\n[0:03] Click the upload button\n",
			"utf-8",
		);

		const regen = await regenerateRecordingDoc(result.bundleDir);

		expect(regen.success).toBe(true);
		expect(regen.transcriptAvailable).toBe(true);
		expect(regen.stepsWritten).toBe(2);
		// The refreshed entry carries the regenerated steps.
		expect(regen.entry?.steps?.map((s) => s.label)).toEqual([
			"Open the product catalog",
			"Click the upload button",
		]);
	});

	it("returns a null entry when the bundle can no longer be scanned", async () => {
		const { result } = await buildBundleWithClicks({
			transcriptContent: "[0:01] first\n",
		});
		// Remove meta.json so the bundle is no longer scannable.
		const { rm } = await import("node:fs/promises");
		await rm(path.join(result.bundleDir, "meta.json"), { force: true });

		const regen = await regenerateRecordingDoc(result.bundleDir);

		expect(regen.success).toBe(false);
		expect(regen.entry).toBeNull();
		// Video is still intact.
		expect(await readFile(result.screenVideoPath, "utf-8")).toBe("fake-mp4");
	});
});
