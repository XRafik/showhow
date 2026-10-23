import {
	lstat,
	mkdir,
	mkdtemp,
	readFile,
	rename,
	rm,
	rmdir,
	symlink,
	writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRecordingTrashService, moveWithReservation } from "./trashRecording";

const fixtures: string[] = [];

afterEach(async () => {
	await Promise.all(
		fixtures.splice(0).map((fixture) => rm(fixture, { recursive: true, force: true })),
	);
});

async function makeFixture() {
	const root = await mkdtemp(path.join(os.tmpdir(), "showhow-trash-"));
	fixtures.push(root);
	const recordingsRoot = path.join(root, "recordings");
	const home = path.join(root, "user-home");
	const trashRoot = path.join(home, ".Trash");
	const bundleDir = path.join(recordingsRoot, "recording-one");
	let trashedName: string | null = null;
	await mkdir(recordingsRoot);
	await mkdir(trashRoot, { recursive: true });
	await mkdir(path.join(bundleDir, "screenshots"), { recursive: true });
	await writeFile(
		path.join(bundleDir, "meta.json"),
		JSON.stringify({ title: "A take", source: "imported", createdAt: 1, video: "video.mp4" }),
	);
	await writeFile(path.join(bundleDir, "video.mp4"), "video bytes");
	await writeFile(path.join(bundleDir, "transcript.txt"), "transcript bytes");
	await writeFile(path.join(bundleDir, "guide.md"), "guide bytes");
	await writeFile(path.join(bundleDir, "screenshots", "step.png"), "image bytes");
	const trashItem = async (stagedBundleDir: string) => {
		trashedName = path.basename(stagedBundleDir);
		await rename(stagedBundleDir, path.join(trashRoot, trashedName));
	};
	const service = createRecordingTrashService({ recordingsRoot, userHomeDir: home, trashItem });
	return {
		root,
		recordingsRoot,
		home,
		trashRoot,
		bundleDir,
		service,
		get trashedName() {
			return trashedName;
		},
	};
}

describe("moveWithReservation", () => {
	it("moves a directory into an atomically reserved destination", async () => {
		const root = await mkdtemp(path.join(os.tmpdir(), "showhow-move-"));
		fixtures.push(root);
		const source = path.join(root, "source");
		const destination = path.join(root, "destination");
		await mkdir(source);
		await writeFile(path.join(source, "meta.json"), "bundle");

		await moveWithReservation(source, destination);

		expect(await readFile(path.join(destination, "meta.json"), "utf8")).toBe("bundle");
		await expect(lstat(source)).rejects.toMatchObject({ code: "ENOENT" });
	});

	it("does not replace a destination created before reservation", async () => {
		const root = await mkdtemp(path.join(os.tmpdir(), "showhow-move-conflict-"));
		fixtures.push(root);
		const source = path.join(root, "source");
		const destination = path.join(root, "destination");
		await mkdir(source);
		await writeFile(path.join(source, "meta.json"), "source");
		await mkdir(destination);
		const reservationIdentity = await lstat(destination);

		await expect(moveWithReservation(source, destination)).rejects.toMatchObject({
			code: "EEXIST",
		});

		expect(await readFile(path.join(source, "meta.json"), "utf8")).toBe("source");
		const currentDestination = await lstat(destination);
		expect(currentDestination.ino).toBe(reservationIdentity.ino);
		expect(currentDestination.dev).toBe(reservationIdentity.dev);
	});

	it("leaves a reservation intact when another actor adds contents before rename", async () => {
		const root = await mkdtemp(path.join(os.tmpdir(), "showhow-move-reservation-"));
		fixtures.push(root);
		const source = path.join(root, "source");
		const destination = path.join(root, "destination");
		await mkdir(source);
		await writeFile(path.join(source, "meta.json"), "source");

		await expect(
			moveWithReservation(source, destination, async (reservedPath) => {
				await writeFile(path.join(reservedPath, "keep.txt"), "other actor");
			}),
		).rejects.toMatchObject({ code: "ENOTEMPTY" });

		expect(await readFile(path.join(source, "meta.json"), "utf8")).toBe("source");
		expect(await readFile(path.join(destination, "keep.txt"), "utf8")).toBe("other actor");
	});

	it("refuses a reservation replaced by a symlink", async () => {
		const root = await mkdtemp(path.join(os.tmpdir(), "showhow-move-symlink-"));
		fixtures.push(root);
		const source = path.join(root, "source");
		const destination = path.join(root, "destination");
		const target = path.join(root, "other");
		await mkdir(source);
		await mkdir(target);
		await writeFile(path.join(source, "meta.json"), "source");

		await expect(
			moveWithReservation(source, destination, async (reservedPath) => {
				await rmdir(reservedPath);
				await symlink(target, reservedPath);
			}),
		).rejects.toThrow();

		expect(await readFile(path.join(source, "meta.json"), "utf8")).toBe("source");
		expect((await lstat(destination)).isSymbolicLink()).toBe(true);
	});
});

describe("createRecordingTrashService", () => {
	it("uses a custom root for Trash and restores to the root captured by Undo", async () => {
		const fixture = await makeFixture();
		const customRoot = path.join(fixture.root, "custom-recordings");
		const customBundle = path.join(customRoot, "custom-recording");
		await mkdir(customBundle, { recursive: true });
		await writeFile(
			path.join(customBundle, "meta.json"),
			JSON.stringify({
				title: "Custom take",
				source: "imported",
				createdAt: 2,
				video: "video.mp4",
			}),
		);
		await writeFile(path.join(customBundle, "video.mp4"), "custom video bytes");
		let activeRoot = fixture.recordingsRoot;
		const service = createRecordingTrashService({
			recordingsRoot: () => activeRoot,
			userHomeDir: fixture.home,
			trashItem: (stagedBundleDir) =>
				rename(stagedBundleDir, path.join(fixture.trashRoot, path.basename(stagedBundleDir))),
		});

		activeRoot = customRoot;
		expect(await service.trashBundle(fixture.bundleDir)).toMatchObject({ success: false });
		const moved = await service.trashBundle(customBundle);
		expect(moved.success).toBe(true);
		if (!moved.success) throw new Error("expected the custom recording to move to Trash");
		activeRoot = fixture.recordingsRoot;

		const restored = await service.restore(moved.undoToken);

		expect(restored).toMatchObject({ success: true, bundleDir: customBundle });
		expect(await readFile(path.join(customBundle, "video.mp4"), "utf8")).toBe("custom video bytes");
	});

	it("moves the whole bundle to the injected user's exact Trash path and restores it", async () => {
		const fixture = await makeFixture();
		const { bundleDir, trashRoot, service } = fixture;

		const moved = await service.trashBundle(bundleDir);

		expect(moved.success).toBe(true);
		if (!moved.success) throw new Error("expected the recording to move to Trash");
		const trashFixture = path.join(trashRoot, fixture.trashedName ?? "missing-stage-name");
		expect(await readFile(path.join(trashFixture, "meta.json"), "utf8")).toContain("A take");
		expect(await readFile(path.join(trashFixture, "video.mp4"), "utf8")).toBe("video bytes");
		expect(await readFile(path.join(trashFixture, "transcript.txt"), "utf8")).toBe(
			"transcript bytes",
		);
		expect(await readFile(path.join(trashFixture, "guide.md"), "utf8")).toBe("guide bytes");
		expect(await readFile(path.join(trashFixture, "screenshots", "step.png"), "utf8")).toBe(
			"image bytes",
		);

		const restored = await service.restore(moved.undoToken);

		expect(restored.success).toBe(true);
		expect(await readFile(path.join(bundleDir, "video.mp4"), "utf8")).toBe("video bytes");
		expect(await readFile(path.join(bundleDir, "meta.json"), "utf8")).toContain("A take");
		await expect(lstat(trashFixture)).rejects.toMatchObject({ code: "ENOENT" });
		expect(await service.restore(moved.undoToken)).toMatchObject({ success: false });
	});

	it("keeps a restore conflict in Trash without replacing the existing bundle", async () => {
		const fixture = await makeFixture();
		const { bundleDir, trashRoot, service } = fixture;
		const moved = await service.trashBundle(bundleDir);
		if (!moved.success) throw new Error("expected the recording to move to Trash");
		const trashFixture = path.join(trashRoot, fixture.trashedName ?? "missing-stage-name");
		await mkdir(bundleDir);
		await writeFile(path.join(bundleDir, "keep.txt"), "conflicting bundle");

		const restored = await service.restore(moved.undoToken);

		expect(restored).toMatchObject({ success: false });
		expect(await readFile(path.join(bundleDir, "keep.txt"), "utf8")).toBe("conflicting bundle");
		expect(await readFile(path.join(trashFixture, "video.mp4"), "utf8")).toBe("video bytes");
	});

	it("keeps the exact Trash fixture when the recordings root is replaced by a symlink", async () => {
		const fixture = await makeFixture();
		const { root, recordingsRoot, trashRoot, bundleDir, service } = fixture;
		const moved = await service.trashBundle(bundleDir);
		if (!moved.success) throw new Error("expected the recording to move to Trash");
		const trashFixture = path.join(trashRoot, fixture.trashedName ?? "missing-stage-name");
		const movedRoot = path.join(root, "recordings-before-symlink");
		const otherRoot = path.join(root, "other-recordings");
		await rename(recordingsRoot, movedRoot);
		await mkdir(otherRoot);
		await writeFile(path.join(otherRoot, "keep.txt"), "replacement root");
		await symlink(otherRoot, recordingsRoot);

		const restored = await service.restore(moved.undoToken);

		expect(restored).toMatchObject({ success: false });
		expect((await lstat(recordingsRoot)).isSymbolicLink()).toBe(true);
		expect(await readFile(path.join(otherRoot, "keep.txt"), "utf8")).toBe("replacement root");
		expect(await readFile(path.join(trashFixture, "video.mp4"), "utf8")).toBe("video bytes");
		await expect(lstat(path.join(movedRoot, "recording-one"))).rejects.toMatchObject({
			code: "ENOENT",
		});
	});

	it("keeps the Trash fixture when the Trash parent is replaced by a symlink", async () => {
		const fixture = await makeFixture();
		const { root, trashRoot, bundleDir, service } = fixture;
		const moved = await service.trashBundle(bundleDir);
		if (!moved.success) throw new Error("expected the recording to move to Trash");
		const fixtureTrashName = fixture.trashedName ?? "missing-stage-name";
		const movedTrash = path.join(root, "trash-before-symlink");
		const otherTrash = path.join(root, "other-trash");
		await rename(trashRoot, movedTrash);
		await mkdir(otherTrash);
		await symlink(otherTrash, trashRoot);

		const restored = await service.restore(moved.undoToken);

		expect(restored).toMatchObject({ success: false });
		expect((await lstat(trashRoot)).isSymbolicLink()).toBe(true);
		expect(await readFile(path.join(movedTrash, fixtureTrashName, "video.mp4"), "utf8")).toBe(
			"video bytes",
		);
	});

	it("rolls shell failure back without overwriting a bundle created during the move", async () => {
		const fixture = await makeFixture();
		const competingTrashItem = async (_stagedBundleDir: string) => {
			await mkdir(fixture.bundleDir);
			await writeFile(path.join(fixture.bundleDir, "keep.txt"), "concurrent bundle");
			throw new Error("shell failure");
		};
		const service = createRecordingTrashService({
			recordingsRoot: fixture.recordingsRoot,
			userHomeDir: fixture.home,
			trashItem: competingTrashItem,
		});

		const result = await service.trashBundle(fixture.bundleDir);

		expect(result).toMatchObject({ success: false });
		if (result.success) throw new Error("expected shell failure");
		expect(result.recoveryBundleDir).toBeTruthy();
		if (typeof result.recoveryBundleDir !== "string") {
			throw new Error("expected a recovery bundle path");
		}
		expect(result.error).toContain("shell failure; rollback failed: EEXIST");
		expect(await readFile(path.join(fixture.bundleDir, "keep.txt"), "utf8")).toBe(
			"concurrent bundle",
		);
		expect(await readFile(path.join(result.recoveryBundleDir, "video.mp4"), "utf8")).toBe(
			"video bytes",
		);
	});

	it("rejects traversal, malformed metadata, and bundle symlink escapes", async () => {
		const { recordingsRoot, bundleDir, service } = await makeFixture();
		const outsideDir = path.join(path.dirname(recordingsRoot), "outside");
		await mkdir(outsideDir);
		await writeFile(path.join(outsideDir, "meta.json"), "{}");
		await writeFile(path.join(outsideDir, "video.mp4"), "outside");
		const incompleteDir = path.join(recordingsRoot, "incomplete");
		await mkdir(incompleteDir);
		await writeFile(path.join(incompleteDir, "meta.json"), "{}");
		const malformedMetaDir = path.join(recordingsRoot, "malformed-meta");
		await mkdir(malformedMetaDir);
		await writeFile(path.join(malformedMetaDir, "meta.json"), "{");
		const nullMetaDir = path.join(recordingsRoot, "null-meta");
		await mkdir(nullMetaDir);
		await writeFile(path.join(nullMetaDir, "meta.json"), "null");
		await writeFile(path.join(nullMetaDir, "video.mp4"), "null meta video");
		const externalMeta = path.join(path.dirname(recordingsRoot), "external-meta.json");
		await writeFile(
			externalMeta,
			JSON.stringify({ title: "External", source: "imported", createdAt: 2, video: "video.mp4" }),
		);
		const symlinkMetaDir = path.join(recordingsRoot, "symlink-meta");
		await mkdir(symlinkMetaDir);
		await symlink(externalMeta, path.join(symlinkMetaDir, "meta.json"));
		await writeFile(path.join(symlinkMetaDir, "video.mp4"), "video");
		const externalVideo = path.join(path.dirname(recordingsRoot), "external-video.mp4");
		await writeFile(externalVideo, "outside video");
		const symlinkVideoDir = path.join(recordingsRoot, "symlink-video");
		await mkdir(symlinkVideoDir);
		await writeFile(
			path.join(symlinkVideoDir, "meta.json"),
			JSON.stringify({
				title: "Linked video",
				source: "imported",
				createdAt: 3,
				video: "video.mp4",
			}),
		);
		await symlink(externalVideo, path.join(symlinkVideoDir, "video.mp4"));
		const symlinkDir = path.join(recordingsRoot, "linked");
		await symlink(outsideDir, symlinkDir);

		await expect(
			service.trashBundle(path.join(recordingsRoot, "..", "outside")),
		).resolves.toMatchObject({
			success: false,
		});
		await expect(service.trashBundle(symlinkDir)).resolves.toMatchObject({ success: false });
		await expect(service.trashBundle(incompleteDir)).resolves.toMatchObject({ success: false });
		await expect(service.trashBundle(malformedMetaDir)).resolves.toMatchObject({ success: false });
		await expect(service.trashBundle(nullMetaDir)).resolves.toMatchObject({ success: false });
		await expect(service.trashBundle(symlinkMetaDir)).resolves.toMatchObject({ success: false });
		await expect(service.trashBundle(symlinkVideoDir)).resolves.toMatchObject({ success: false });
		expect(await readFile(path.join(bundleDir, "video.mp4"), "utf8")).toBe("video bytes");
		expect(await readFile(path.join(outsideDir, "video.mp4"), "utf8")).toBe("outside");
		expect(await readFile(path.join(incompleteDir, "meta.json"), "utf8")).toBe("{}");
		expect(await readFile(externalVideo, "utf8")).toBe("outside video");
	});

	it("rejects a missing known video file without moving its bundle metadata", async () => {
		const { recordingsRoot, service } = await makeFixture();
		const missingVideoDir = path.join(recordingsRoot, "missing-video");
		await mkdir(missingVideoDir);
		const metadata = JSON.stringify({
			title: "Missing video",
			source: "imported",
			createdAt: 4,
			video: "video.webm",
		});
		await writeFile(path.join(missingVideoDir, "meta.json"), metadata);

		await expect(service.trashBundle(missingVideoDir)).resolves.toMatchObject({ success: false });
		expect(await readFile(path.join(missingVideoDir, "meta.json"), "utf8")).toBe(metadata);
		expect((await lstat(missingVideoDir)).isDirectory()).toBe(true);
		await expect(lstat(path.join(missingVideoDir, "video.webm"))).rejects.toMatchObject({
			code: "ENOENT",
		});
	});

	it("rejects a missing meta.json without moving the video", async () => {
		const { recordingsRoot, service } = await makeFixture();
		const missingMetaDir = path.join(recordingsRoot, "missing-meta");
		await mkdir(missingMetaDir);
		await writeFile(path.join(missingMetaDir, "video.mp4"), "still here");

		await expect(service.trashBundle(missingMetaDir)).resolves.toMatchObject({ success: false });
		expect(await readFile(path.join(missingMetaDir, "video.mp4"), "utf8")).toBe("still here");
	});

	it("rolls an ordinary shell failure back to the original bundle", async () => {
		const fixture = await makeFixture();
		const service = createRecordingTrashService({
			recordingsRoot: fixture.recordingsRoot,
			userHomeDir: fixture.home,
			trashItem: async (_stagedBundleDir) => {
				throw new Error("shell failure before move");
			},
		});

		const result = await service.trashBundle(fixture.bundleDir);

		expect(result).toMatchObject({ success: false });
		if (result.success) throw new Error("expected shell failure");
		expect(result.error).toBe("shell failure before move");
		expect(result.recoveryBundleDir).toBeUndefined();
		expect(await readFile(path.join(fixture.bundleDir, "video.mp4"), "utf8")).toBe("video bytes");
		expect(await readFile(path.join(fixture.bundleDir, "screenshots", "step.png"), "utf8")).toBe(
			"image bytes",
		);
	});

	it("rejects an unknown token and an invalid token type", async () => {
		const { service } = await makeFixture();

		expect(await service.restore("unknown-token")).toMatchObject({ success: false });
		expect(await service.restore(7 as unknown as string)).toMatchObject({ success: false });
	});

	it("expires Undo after six seconds", async () => {
		const fixture = await makeFixture();
		const moved = await fixture.service.trashBundle(fixture.bundleDir);
		if (!moved.success) throw new Error("expected the recording to move to Trash");
		vi.useFakeTimers();
		try {
			vi.advanceTimersByTime(6_001);
			expect(await fixture.service.restore(moved.undoToken)).toMatchObject({ success: false });
			expect(
				await readFile(
					path.join(fixture.trashRoot, fixture.trashedName ?? "missing", "video.mp4"),
					"utf8",
				),
			).toBe("video bytes");
		} finally {
			vi.useRealTimers();
		}
	});
});
