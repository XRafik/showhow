import { randomUUID } from "node:crypto";
import type { Stats } from "node:fs";
import { promises as nodeFs } from "node:fs";
import { lstat, mkdir, readFile, realpath, rmdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { shell } from "electron";
import { getRecordingsRoot } from "./bundle";

const UNDO_WINDOW_MS = 6_000;

interface DirectorySnapshot {
	path: string;
	realPath: string;
	dev: number;
	ino: number;
}

interface UndoRecord {
	root: DirectorySnapshot;
	home: DirectorySnapshot;
	trashRoot: DirectorySnapshot;
	originalBundlePath: string;
	trashBundlePath: string;
	identity: { dev: number; ino: number };
	expiresAt: number;
}

export interface RecordingTrashResult {
	success: true;
	undoToken: string;
	expiresAt: number;
}

export interface RecordingTrashFailure {
	success: false;
	error: string;
	recoveryBundleDir?: string;
}

export interface RecordingRestoreResult {
	success: boolean;
	error?: string;
	bundleDir?: string;
}

interface RecordingTrashServiceOptions {
	recordingsRoot?: string | (() => string);
	userHomeDir?: string;
	trashItem?: (bundleDir: string) => Promise<void>;
}

function identity(stat: Stats): { dev: number; ino: number } {
	return { dev: stat.dev, ino: stat.ino };
}

function sameIdentity(left: { dev: number; ino: number }, right: { dev: number; ino: number }) {
	return left.dev === right.dev && left.ino === right.ino;
}

function errorText(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

function failed(error: unknown, recoveryBundleDir?: string): RecordingTrashFailure {
	return {
		success: false,
		error: errorText(error),
		...(recoveryBundleDir ? { recoveryBundleDir } : {}),
	};
}

async function snapshotDirectory(directoryPath: string): Promise<DirectorySnapshot> {
	const stat = await lstat(directoryPath);
	if (stat.isSymbolicLink() || !stat.isDirectory()) {
		throw new Error("Expected a real directory");
	}
	const canonicalPath = await realpath(directoryPath);
	return { path: directoryPath, realPath: canonicalPath, ...identity(stat) };
}

async function assertDirectorySnapshot(snapshot: DirectorySnapshot): Promise<void> {
	const canonicalPath = await realpath(snapshot.path);
	const stat = await lstat(snapshot.path);
	if (
		canonicalPath !== snapshot.realPath ||
		stat.isSymbolicLink() ||
		!stat.isDirectory() ||
		!sameIdentity(identity(stat), snapshot)
	) {
		throw new Error("Directory changed during recording trash operation");
	}
}

async function removeOwnedEmptyReservation(
	destination: string,
	reservation: { dev: number; ino: number },
): Promise<void> {
	try {
		const current = await lstat(destination);
		if (
			current.isDirectory() &&
			!current.isSymbolicLink() &&
			sameIdentity(identity(current), reservation)
		) {
			await rmdir(destination);
		}
	} catch {
		// A failed move leaves the source intact; cleanup never follows or recurses into a path.
	}
}

/**
 * Claim an absent directory destination with mkdir before rename. The callback is the narrow
 * post-reservation seam used by the filesystem tests to model another actor arriving in the gap.
 */
export async function moveWithReservation(
	source: string,
	destination: string,
	afterReserve?: (destination: string) => Promise<void>,
): Promise<void> {
	await mkdir(destination);
	const reservationStat = await lstat(destination);
	const reservationIdentity = identity(reservationStat);
	if (reservationStat.isSymbolicLink() || !reservationStat.isDirectory()) {
		await removeOwnedEmptyReservation(destination, reservationIdentity);
		throw new Error("Destination reservation is not a directory");
	}
	try {
		await afterReserve?.(destination);
		const current = await lstat(destination);
		if (
			current.isSymbolicLink() ||
			!current.isDirectory() ||
			!sameIdentity(identity(current), reservationIdentity)
		) {
			throw new Error("Destination reservation changed before move");
		}
		await nodeFs.rename(source, destination);
	} catch (error) {
		await removeOwnedEmptyReservation(destination, reservationIdentity);
		throw error;
	}
}

async function validateBundle(bundlePath: string, root: DirectorySnapshot): Promise<Stats> {
	if (
		!path.isAbsolute(bundlePath) ||
		bundlePath !== path.resolve(bundlePath) ||
		bundlePath.split(/[\\/]/u).includes("..") ||
		path.dirname(bundlePath) !== root.path
	) {
		throw new Error("Recording path is outside the recordings root");
	}
	const stat = await lstat(bundlePath);
	if (stat.isSymbolicLink() || !stat.isDirectory()) {
		throw new Error("Recording bundle must be a real directory");
	}
	const canonicalBundlePath = await realpath(bundlePath);
	if (path.dirname(canonicalBundlePath) !== root.realPath) {
		throw new Error("Recording path resolves outside the recordings root");
	}
	const metaStat = await lstat(path.join(bundlePath, "meta.json"));
	if (metaStat.isSymbolicLink() || !metaStat.isFile()) {
		throw new Error("Recording metadata must be a regular file");
	}
	const rawMeta: unknown = JSON.parse(await readFile(path.join(bundlePath, "meta.json"), "utf8"));
	if (typeof rawMeta !== "object" || rawMeta === null || Array.isArray(rawMeta)) {
		throw new Error("Recording metadata is invalid");
	}
	const meta = rawMeta as {
		title?: unknown;
		source?: unknown;
		createdAt?: unknown;
		video?: unknown;
	};
	if (
		typeof meta.title !== "string" ||
		meta.title === "" ||
		(meta.source !== "desktop" && meta.source !== "browser" && meta.source !== "imported") ||
		typeof meta.createdAt !== "number" ||
		!Number.isFinite(meta.createdAt)
	) {
		throw new Error("Recording metadata is incomplete");
	}
	if (meta.video !== "video.mp4" && meta.video !== "video.webm") {
		throw new Error("Recording bundle has no known video file");
	}
	const videoStat = await lstat(path.join(bundlePath, meta.video));
	if (videoStat.isSymbolicLink() || !videoStat.isFile()) {
		throw new Error("Recording video must be a regular file");
	}
	return stat;
}

function stagedName(bundlePath: string): string {
	const readableName = path
		.basename(bundlePath)
		.replace(/[^A-Za-z0-9._-]/gu, "_")
		.slice(0, 120);
	return `${readableName || "recording"}-trash-${randomUUID()}`;
}

export function createRecordingTrashService({
	recordingsRoot = getRecordingsRoot,
	userHomeDir = os.userInfo().homedir,
	trashItem = (bundleDir) => shell.trashItem(bundleDir),
}: RecordingTrashServiceOptions = {}) {
	const undoRecords = new Map<string, UndoRecord>();
	const resolveRoot = () =>
		path.resolve(typeof recordingsRoot === "function" ? recordingsRoot() : recordingsRoot);
	const homePath = path.resolve(userHomeDir);

	return {
		async trashBundle(bundleDir: string): Promise<RecordingTrashResult | RecordingTrashFailure> {
			for (const [token, record] of undoRecords) {
				if (record.expiresAt <= Date.now()) undoRecords.delete(token);
			}
			let root: DirectorySnapshot;
			let home: DirectorySnapshot;
			let trashRoot: DirectorySnapshot;
			let sourceStat: Stats;
			try {
				root = await snapshotDirectory(resolveRoot());
				home = await snapshotDirectory(homePath);
				trashRoot = await snapshotDirectory(path.join(home.path, ".Trash"));
				sourceStat = await validateBundle(bundleDir, root);
			} catch (error) {
				return failed(error);
			}

			const stagedBundlePath = path.join(root.path, stagedName(bundleDir));
			const sourceIdentity = identity(sourceStat);
			try {
				await moveWithReservation(bundleDir, stagedBundlePath, async () => {
					await assertDirectorySnapshot(root);
					const currentSource = await lstat(bundleDir);
					if (
						currentSource.isSymbolicLink() ||
						!currentSource.isDirectory() ||
						!sameIdentity(identity(currentSource), sourceIdentity)
					) {
						throw new Error("Recording changed before staging");
					}
				});
			} catch (error) {
				return failed(error);
			}

			let stagedIdentity: { dev: number; ino: number };
			try {
				const stagedStat = await lstat(stagedBundlePath);
				if (
					stagedStat.isSymbolicLink() ||
					!stagedStat.isDirectory() ||
					!sameIdentity(identity(stagedStat), sourceIdentity)
				) {
					throw new Error("Staged recording identity changed");
				}
				stagedIdentity = identity(stagedStat);
			} catch (error) {
				return failed(error, stagedBundlePath);
			}
			try {
				await assertDirectorySnapshot(root);
				await assertDirectorySnapshot(home);
				await assertDirectorySnapshot(trashRoot);
				await trashItem(stagedBundlePath);
			} catch (shellError) {
				try {
					await moveWithReservation(stagedBundlePath, bundleDir, async () => {
						await assertDirectorySnapshot(root);
						const currentStage = await lstat(stagedBundlePath);
						if (
							currentStage.isSymbolicLink() ||
							!currentStage.isDirectory() ||
							!sameIdentity(identity(currentStage), stagedIdentity)
						) {
							throw new Error("Staged recording changed before rollback");
						}
					});
					return failed(shellError);
				} catch (rollbackError) {
					return failed(
						`${errorText(shellError)}; rollback failed: ${errorText(rollbackError)}`,
						stagedBundlePath,
					);
				}
			}

			try {
				await assertDirectorySnapshot(root);
				await assertDirectorySnapshot(home);
				await assertDirectorySnapshot(trashRoot);
				const trashBundlePath = path.join(trashRoot.path, path.basename(stagedBundlePath));
				const movedStat = await lstat(trashBundlePath);
				if (
					movedStat.isSymbolicLink() ||
					!movedStat.isDirectory() ||
					!sameIdentity(identity(movedStat), stagedIdentity)
				) {
					throw new Error("The exact Trash item could not be verified");
				}
				const undoToken = randomUUID();
				const expiresAt = Date.now() + UNDO_WINDOW_MS;
				undoRecords.set(undoToken, {
					root,
					home,
					trashRoot,
					originalBundlePath: bundleDir,
					trashBundlePath,
					identity: stagedIdentity,
					expiresAt,
				});
				return { success: true, undoToken, expiresAt };
			} catch (error) {
				return failed(error);
			}
		},

		async restore(undoToken: string): Promise<RecordingRestoreResult> {
			if (typeof undoToken !== "string") {
				return { success: false, error: "Unknown Undo token" };
			}
			const record = undoRecords.get(undoToken);
			if (!record) {
				return { success: false, error: "Unknown Undo token" };
			}
			if (record.expiresAt <= Date.now()) {
				undoRecords.delete(undoToken);
				return { success: false, error: "Undo window expired" };
			}
			try {
				await assertDirectorySnapshot(record.root);
				await assertDirectorySnapshot(record.home);
				await assertDirectorySnapshot(record.trashRoot);
				const trashStat = await lstat(record.trashBundlePath);
				if (
					trashStat.isSymbolicLink() ||
					!trashStat.isDirectory() ||
					!sameIdentity(identity(trashStat), record.identity)
				) {
					return { success: false, error: "Trash item identity changed" };
				}
				await moveWithReservation(record.trashBundlePath, record.originalBundlePath, async () => {
					await assertDirectorySnapshot(record.root);
					await assertDirectorySnapshot(record.home);
					await assertDirectorySnapshot(record.trashRoot);
					const currentTrash = await lstat(record.trashBundlePath);
					if (
						currentTrash.isSymbolicLink() ||
						!currentTrash.isDirectory() ||
						!sameIdentity(identity(currentTrash), record.identity)
					) {
						throw new Error("Trash item changed before restore");
					}
				});
				undoRecords.delete(undoToken);
				return { success: true, bundleDir: record.originalBundlePath };
			} catch (error) {
				return { success: false, error: errorText(error) };
			}
		},
	};
}
