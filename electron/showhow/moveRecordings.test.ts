import { promises as nodeFs } from "node:fs";
import { mkdir, mkdtemp, readdir, readFile, realpath, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { moveRecordings } from "./moveRecordings";

interface Fixture {
	work: string;
	sourceRoot: string;
	targetRoot: string;
	bundle: string;
	targetBundle: string;
}

async function makeFixture(): Promise<Fixture> {
	const work = await mkdtemp(path.join(os.tmpdir(), "showhow-move-recordings-"));
	const sourceRoot = path.join(work, "source");
	const targetRoot = path.join(work, "target");
	const bundle = path.join(sourceRoot, "one-recording");
	await mkdir(path.join(bundle, "screenshots"), { recursive: true });
	await mkdir(targetRoot);
	await writeFile(path.join(bundle, "meta.json"), "{}\n");
	await writeFile(path.join(bundle, "video.webm"), "recorded video");
	await writeFile(path.join(bundle, "screenshots", "step-01.png"), "frame");
	const [realSourceRoot, realTargetRoot, realBundle] = await Promise.all([
		realpath(sourceRoot),
		realpath(targetRoot),
		realpath(bundle),
	]);
	return {
		work,
		sourceRoot: realSourceRoot,
		targetRoot: realTargetRoot,
		bundle: realBundle,
		targetBundle: path.join(realTargetRoot, "one-recording"),
	};
}

afterEach(() => vi.restoreAllMocks());

describe("moveRecordings", () => {
	it("verifies a cross-device copy before removing its source", async () => {
		const fixture = await makeFixture();
		const rename = nodeFs.rename.bind(nodeFs);
		const renameSpy = vi.spyOn(nodeFs, "rename").mockImplementation(async (source, destination) => {
			if (String(source) === fixture.bundle && String(destination) === fixture.targetBundle) {
				throw Object.assign(new Error("cross-device move"), { code: "EXDEV" });
			}
			await rename(source, destination);
		});
		try {
			expect(
				await moveRecordings(fixture.sourceRoot, fixture.targetRoot, ["one-recording"]),
			).toEqual({
				success: true,
				movedBundles: ["one-recording"],
				remainingBundles: [],
			});
			expect(await readFile(path.join(fixture.targetBundle, "video.webm"), "utf8")).toBe(
				"recorded video",
			);
			expect(await readFile(path.join(fixture.targetBundle, "meta.json"), "utf8")).toBe("{}\n");
			expect(
				await readFile(path.join(fixture.targetBundle, "screenshots", "step-01.png"), "utf8"),
			).toBe("frame");
			await expect(readFile(fixture.bundle)).rejects.toMatchObject({ code: "ENOENT" });
			expect(renameSpy).toHaveBeenCalledTimes(2);
		} finally {
			await rm(fixture.work, { recursive: true, force: true });
		}
	});

	it("keeps the source and removes its staging copy when same-size bytes fail verification", async () => {
		const fixture = await makeFixture();
		expect(Buffer.byteLength("recorded video")).toBe(Buffer.byteLength("tampered video"));
		const rename = nodeFs.rename.bind(nodeFs);
		vi.spyOn(nodeFs, "rename").mockImplementation(async (source, destination) => {
			if (String(source) === fixture.bundle && String(destination) === fixture.targetBundle) {
				throw Object.assign(new Error("cross-device move"), { code: "EXDEV" });
			}
			await rename(source, destination);
		});
		const copyFile = nodeFs.copyFile.bind(nodeFs);
		vi.spyOn(nodeFs, "copyFile").mockImplementation(async (source, destination, flags) => {
			await copyFile(source, destination, flags);
			if (path.basename(String(source)) === "video.webm") {
				await writeFile(destination, "tampered video");
			}
		});
		try {
			const result = await moveRecordings(fixture.sourceRoot, fixture.targetRoot, [
				"one-recording",
			]);
			expect(result).toMatchObject({ success: false, failedBundle: "one-recording" });
			expect(result.error).toMatch(/verification/u);
			expect(await readFile(path.join(fixture.bundle, "video.webm"), "utf8")).toBe(
				"recorded video",
			);
			expect(await readdir(fixture.targetRoot)).toEqual([]);
		} finally {
			await rm(fixture.work, { recursive: true, force: true });
		}
	});

	it("keeps the source and removes its staging copy when source files change during copy", async () => {
		const fixture = await makeFixture();
		const rename = nodeFs.rename.bind(nodeFs);
		vi.spyOn(nodeFs, "rename").mockImplementation(async (source, destination) => {
			if (String(source) === fixture.bundle && String(destination) === fixture.targetBundle) {
				throw Object.assign(new Error("cross-device move"), { code: "EXDEV" });
			}
			await rename(source, destination);
		});
		const copyFile = nodeFs.copyFile.bind(nodeFs);
		vi.spyOn(nodeFs, "copyFile").mockImplementation(async (source, destination, flags) => {
			await copyFile(source, destination, flags);
			if (path.basename(String(source)) === "video.webm") {
				await writeFile(source, "changed during copy");
			}
		});
		try {
			const result = await moveRecordings(fixture.sourceRoot, fixture.targetRoot, [
				"one-recording",
			]);
			expect(result).toMatchObject({ success: false, failedBundle: "one-recording" });
			expect(result.error).toMatch(/changed while it was being copied/u);
			expect(await readFile(path.join(fixture.bundle, "video.webm"), "utf8")).toBe(
				"changed during copy",
			);
			expect(await readdir(fixture.targetRoot)).toEqual([]);
		} finally {
			await rm(fixture.work, { recursive: true, force: true });
		}
	});

	it("keeps the verified destination if recursive source removal fails partway", async () => {
		const fixture = await makeFixture();
		const rename = nodeFs.rename.bind(nodeFs);
		vi.spyOn(nodeFs, "rename").mockImplementation(async (source, destination) => {
			if (String(source) === fixture.bundle && String(destination) === fixture.targetBundle) {
				throw Object.assign(new Error("cross-device move"), { code: "EXDEV" });
			}
			await rename(source, destination);
		});
		const remove = nodeFs.rm.bind(nodeFs);
		vi.spyOn(nodeFs, "rm").mockImplementation(async (target, options) => {
			if (String(target) === fixture.bundle) {
				await remove(path.join(fixture.bundle, "video.webm"));
				throw Object.assign(new Error("source removal denied"), { code: "EACCES" });
			}
			await remove(target, options);
		});
		try {
			const result = await moveRecordings(fixture.sourceRoot, fixture.targetRoot, [
				"one-recording",
			]);
			expect(result).toMatchObject({
				success: false,
				failedBundle: "one-recording",
				recoveryBundle: fixture.targetBundle,
			});
			expect(result.error).toMatch(/source removal denied/u);
			await expect(readFile(path.join(fixture.bundle, "video.webm"))).rejects.toMatchObject({
				code: "ENOENT",
			});
			expect(await readFile(path.join(fixture.targetBundle, "video.webm"), "utf8")).toBe(
				"recorded video",
			);
		} finally {
			await rm(fixture.work, { recursive: true, force: true });
		}
	});

	it("does not overwrite a recording already at the destination", async () => {
		const fixture = await makeFixture();
		await mkdir(fixture.targetBundle);
		await writeFile(path.join(fixture.targetBundle, "video.webm"), "existing destination");
		try {
			const result = await moveRecordings(fixture.sourceRoot, fixture.targetRoot, [
				"one-recording",
			]);
			expect(result).toMatchObject({ success: false, failedBundle: "one-recording" });
			expect(await readFile(path.join(fixture.bundle, "video.webm"), "utf8")).toBe(
				"recorded video",
			);
			expect(await readFile(path.join(fixture.targetBundle, "video.webm"), "utf8")).toBe(
				"existing destination",
			);
		} finally {
			await rm(fixture.work, { recursive: true, force: true });
		}
	});
});
