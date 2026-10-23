import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, expect, it, vi } from "vitest";

const engine = vi.hoisted(() => ({ init: vi.fn(), transcribe: vi.fn(), shutdown: vi.fn() }));
vi.mock("electron", () => ({ app: { isPackaged: false, getAppPath: () => "/scratch/app" } }));
vi.mock("../stt", () => ({
	SttManager: class {
		init = engine.init;
		transcribe = engine.transcribe;
		shutdown = engine.shutdown;
	},
}));

import { requestBundleTranscript } from "./transcriptJob";

afterEach(() => {
	vi.restoreAllMocks();
	vi.resetAllMocks();
});

it("the native bundled job writes timestamped phrases and preserves the saved media", async () => {
	const root = await fs.mkdtemp(path.join(os.tmpdir(), "showhow-job-success-"));
	try {
		const video = path.join(root, "video.webm");
		const original = await fs.readFile("tests/fixtures/sample.webm");
		await fs.writeFile(video, original);
		engine.init.mockResolvedValue(undefined);
		engine.shutdown.mockResolvedValue(undefined);
		engine.transcribe.mockResolvedValue({
			segments: [
				{ text: " Open settings ", startSec: 2.8, endSec: 4 },
				{ text: "Save the workflow", startSec: 65, endSec: 68 },
			],
		});
		let callbackTranscript: string | undefined;
		await requestBundleTranscript(root, video, async (bundleDir) => {
			expect(bundleDir).toBe(root);
			callbackTranscript = await fs.readFile(path.join(bundleDir, "transcript.txt"), "utf8");
		});
		expect(engine.init).toHaveBeenCalledWith({ bundledModelsDir: "/scratch/app/caption-assets" });
		expect(engine.transcribe).toHaveBeenCalledWith({ sourcePath: video });
		expect(await fs.readFile(path.join(root, "transcript.txt"), "utf8")).toBe(
			"[0:02] Open settings\n[1:05] Save the workflow\n",
		);
		expect(callbackTranscript).toBe("[0:02] Open settings\n[1:05] Save the workflow\n");
		expect(await fs.readFile(video)).toEqual(original);
	} finally {
		await fs.rm(root, { recursive: true, force: true });
	}
});

for (const failure of ["model file missing", "engine error", "zero-length audio"]) {
	it(`${failure} writes the failure marker and preserves source/bundle input hashes`, async () => {
		const root = await fs.mkdtemp(path.join(os.tmpdir(), "showhow-job-"));
		const files = {
			"video.webm": await fs.readFile("tests/fixtures/sample.webm"),
			"video.webm.cursor.json": Buffer.from("[]"),
			"meta.json": Buffer.from('{"createdAt":1}'),
			"owner-note.txt": Buffer.from("preserve bundle extras"),
		};
		const digest = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
		try {
			for (const [name, content] of Object.entries(files))
				await fs.writeFile(path.join(root, name), content);
			engine.init.mockResolvedValue(undefined);
			engine.shutdown.mockResolvedValue(undefined);
			if (failure === "model file missing") engine.init.mockRejectedValue(new Error(failure));
			else engine.transcribe.mockRejectedValue(new Error(failure));
			vi.spyOn(console, "error").mockImplementation(() => undefined);
			const onTranscriptReady = vi.fn();
			await requestBundleTranscript(root, path.join(root, "video.webm"), onTranscriptReady);
			expect(onTranscriptReady).not.toHaveBeenCalled();
			expect(await fs.readFile(path.join(root, "transcript.txt"), "utf8")).toBe(
				"(transcription failed)\n",
			);
			for (const [name, bytes] of Object.entries(files)) {
				expect(digest(await fs.readFile(path.join(root, name))), name).toBe(digest(bytes));
			}
			expect(engine.shutdown).toHaveBeenCalledOnce();
		} finally {
			await fs.rm(root, { recursive: true, force: true });
		}
	});
}
