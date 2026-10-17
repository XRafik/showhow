import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterAll, afterEach, expect, it, vi } from "vitest";
import { restorePendingBundleTranscript } from "./resumeTranscript";

const root = await fs.mkdtemp(path.join(os.tmpdir(), "showhow-transcript-resume-"));
afterEach(() => vi.restoreAllMocks());
afterAll(() => fs.rm(root, { recursive: true, force: true }));

it("completed transcript content wins over stale pending fields in a manifest", async () => {
	const transcript = path.join(root, "transcript.txt");
	await fs.writeFile(transcript, "[00:00] Already completed.\n");
	const result = await restorePendingBundleTranscript(
		{
			createdAt: 1,
			screenVideoPath: path.join(root, "video.webm"),
			showhowBundleDir: "/stale/bundle",
			showhowVideoFileUrl: "file:///stale/video.webm",
		},
		root,
	);
	expect(result).not.toHaveProperty("showhowBundleDir");
	expect(result).not.toHaveProperty("showhowVideoFileUrl");
	expect(await fs.readFile(transcript, "utf8")).toBe("[00:00] Already completed.\n");
});
it("unreadable transcript metadata preserves the readable media session without a job", async () => {
	const video = path.join(root, "video.webm");
	const original = await fs.readFile(path.resolve("tests/fixtures/sample.webm"));
	await fs.writeFile(video, original);
	const read = fs.readFile.bind(fs);
	vi.spyOn(fs, "readFile").mockImplementation((target, ...args) => {
		if (String(target).endsWith("transcript.txt"))
			return Promise.reject(
				Object.assign(new Error("synthetic permission failure"), { code: "EACCES" }),
			);
		return read(target, ...args);
	});
	vi.spyOn(console, "warn").mockImplementation(() => undefined);
	const session = { screenVideoPath: video, webcamOffsetMs: 125, createdAt: 1792181200000 };
	expect(await restorePendingBundleTranscript(session, root)).toEqual(session);
	expect(await fs.readFile(video)).toEqual(original);
});
