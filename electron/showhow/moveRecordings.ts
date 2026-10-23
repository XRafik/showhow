import { createHash, randomUUID } from "node:crypto";
import { createReadStream, promises as fs } from "node:fs";
import path from "node:path";
import type { RecordingsFolderMoveProgress } from "../../src/lib/showhow/settings";
import { moveWithReservation } from "./trashRecording";

export type RecordingMoveProgress = RecordingsFolderMoveProgress;

export interface RecordingMoveResult {
	success: boolean;
	movedBundles: string[];
	remainingBundles: string[];
	failedBundle?: string;
	recoveryBundle?: string;
	error?: string;
}

interface FileIdentity {
	dev: number;
	ino: number;
}

interface RootSnapshot {
	path: string;
	realPath: string;
	identity: FileIdentity;
}

interface ManifestEntry {
	path: string;
	type: "directory" | "file";
	size?: number;
	sha256?: string;
}

function identity(stat: { dev: number; ino: number }): FileIdentity {
	return { dev: stat.dev, ino: stat.ino };
}

function sameIdentity(left: FileIdentity, right: FileIdentity): boolean {
	return left.dev === right.dev && left.ino === right.ino;
}

function isWithin(parent: string, child: string): boolean {
	const relative = path.relative(parent, child);
	return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== "..");
}

function errorText(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

async function snapshotRoot(root: string): Promise<RootSnapshot> {
	const resolved = path.resolve(root);
	const stat = await fs.lstat(resolved);
	if (stat.isSymbolicLink() || !stat.isDirectory()) {
		throw new Error("Recordings folder must be a real directory");
	}
	return { path: resolved, realPath: await fs.realpath(resolved), identity: identity(stat) };
}

async function assertRoot(snapshot: RootSnapshot): Promise<void> {
	const stat = await fs.lstat(snapshot.path);
	if (
		stat.isSymbolicLink() ||
		!stat.isDirectory() ||
		!sameIdentity(identity(stat), snapshot.identity) ||
		(await fs.realpath(snapshot.path)) !== snapshot.realPath
	) {
		throw new Error("Recordings folder changed during move");
	}
}

async function hashFile(filePath: string): Promise<string> {
	const hash = createHash("sha256");
	for await (const chunk of createReadStream(filePath)) hash.update(chunk);
	return hash.digest("hex");
}

async function manifest(directory: string): Promise<ManifestEntry[]> {
	const entries: ManifestEntry[] = [];
	async function visit(parent: string): Promise<void> {
		for (const name of (await fs.readdir(parent)).sort()) {
			const filePath = path.join(parent, name);
			const stat = await fs.lstat(filePath);
			const relativePath = path.relative(directory, filePath);
			if (stat.isSymbolicLink()) throw new Error("Recording bundles cannot contain symbolic links");
			if (stat.isDirectory()) {
				entries.push({ path: relativePath, type: "directory" });
				await visit(filePath);
			} else if (stat.isFile()) {
				entries.push({
					path: relativePath,
					type: "file",
					size: stat.size,
					sha256: await hashFile(filePath),
				});
			} else {
				throw new Error("Recording bundles can contain only files and folders");
			}
		}
	}
	await visit(directory);
	return entries;
}

async function copyContents(source: string, destination: string): Promise<void> {
	for (const name of await fs.readdir(source)) {
		const from = path.join(source, name);
		const to = path.join(destination, name);
		const stat = await fs.lstat(from);
		if (stat.isSymbolicLink()) throw new Error("Recording bundles cannot contain symbolic links");
		if (stat.isDirectory()) {
			await fs.mkdir(to);
			await copyContents(from, to);
		} else if (stat.isFile()) {
			await fs.copyFile(from, to, fs.constants.COPYFILE_EXCL);
		} else {
			throw new Error("Recording bundles can contain only files and folders");
		}
	}
}

async function removeOwnedStage(stage: string, stageIdentity: FileIdentity): Promise<void> {
	try {
		const stat = await fs.lstat(stage);
		if (
			stat.isDirectory() &&
			!stat.isSymbolicLink() &&
			sameIdentity(identity(stat), stageIdentity)
		) {
			await fs.rm(stage, { recursive: true, force: true });
		}
	} catch {
		// Cleanup only removes the temporary directory created by this move.
	}
}

export async function moveRecordings(
	currentRoot: string,
	targetRoot: string,
	bundleNames: string[],
	onProgress: (progress: RecordingMoveProgress) => void = () => undefined,
): Promise<RecordingMoveResult> {
	const movedBundles: string[] = [];
	if (bundleNames.length === 0) {
		return { success: true, movedBundles, remainingBundles: [] };
	}
	try {
		await fs.mkdir(targetRoot, { recursive: true });
		const source = await snapshotRoot(currentRoot);
		const target = await snapshotRoot(targetRoot);
		if (source.realPath === target.realPath || isWithin(source.realPath, target.realPath)) {
			throw new Error("New recordings folder must be outside the current folder");
		}
		for (let index = 0; index < bundleNames.length; index += 1) {
			const bundleName = bundleNames[index];
			let recoveryBundle: string | undefined;
			if (
				!bundleName ||
				path.basename(bundleName) !== bundleName ||
				bundleName === "." ||
				bundleName === ".."
			) {
				throw new Error("Invalid recording bundle name");
			}
			try {
				try {
					onProgress({ current: index + 1, total: bundleNames.length, bundleName });
				} catch {
					// A closed Settings window must not stop a disk move.
				}
				await assertRoot(source);
				await assertRoot(target);
				const sourceBundle = path.join(source.realPath, bundleName);
				const destinationBundle = path.join(target.realPath, bundleName);
				const sourceStat = await fs.lstat(sourceBundle);
				if (sourceStat.isSymbolicLink() || !sourceStat.isDirectory()) {
					throw new Error("Recording bundle must be a real directory");
				}
				if (path.dirname(await fs.realpath(sourceBundle)) !== source.realPath) {
					throw new Error("Recording bundle is outside the current recordings folder");
				}
				try {
					await moveWithReservation(sourceBundle, destinationBundle, async () => {
						await assertRoot(source);
						const currentStat = await fs.lstat(sourceBundle);
						if (
							currentStat.isSymbolicLink() ||
							!currentStat.isDirectory() ||
							!sameIdentity(identity(currentStat), identity(sourceStat))
						) {
							throw new Error("Recording bundle changed before move");
						}
					});
					movedBundles.push(bundleName);
					continue;
				} catch (error) {
					if ((error as NodeJS.ErrnoException).code !== "EXDEV") throw error;
				}

				const sourceManifest = await manifest(sourceBundle);
				const stage = path.join(target.realPath, `.showhow-move-${randomUUID()}`);
				await fs.mkdir(stage);
				const stageIdentity = identity(await fs.lstat(stage));
				try {
					await copyContents(sourceBundle, stage);
					const [copiedManifest, sourceAfterCopy] = await Promise.all([
						manifest(stage),
						manifest(sourceBundle),
					]);
					if (JSON.stringify(sourceManifest) !== JSON.stringify(sourceAfterCopy)) {
						throw new Error("Recording changed while it was being copied");
					}
					if (JSON.stringify(sourceManifest) !== JSON.stringify(copiedManifest)) {
						throw new Error("Copied recording failed verification");
					}
					await assertRoot(source);
					await assertRoot(target);
					await moveWithReservation(stage, destinationBundle);
					recoveryBundle = destinationBundle;
					const sourceBeforeRemoval = await manifest(sourceBundle);
					if (JSON.stringify(sourceManifest) !== JSON.stringify(sourceBeforeRemoval)) {
						throw new Error("Recording changed before its source could be removed");
					}
					const currentStat = await fs.lstat(sourceBundle);
					if (
						currentStat.isSymbolicLink() ||
						!currentStat.isDirectory() ||
						!sameIdentity(identity(currentStat), identity(sourceStat))
					) {
						throw new Error("Recording bundle changed before source removal");
					}
					await fs.rm(sourceBundle, { recursive: true, force: false });
					recoveryBundle = undefined;
					movedBundles.push(bundleName);
				} catch (error) {
					await removeOwnedStage(stage, stageIdentity);
					throw error;
				}
			} catch (error) {
				return {
					success: false,
					movedBundles,
					remainingBundles: bundleNames.slice(index),
					failedBundle: bundleName,
					...(recoveryBundle ? { recoveryBundle } : {}),
					error: errorText(error),
				};
			}
		}
		return { success: true, movedBundles, remainingBundles: [] };
	} catch (error) {
		return {
			success: false,
			movedBundles,
			remainingBundles: bundleNames.slice(movedBundles.length),
			error: errorText(error),
		};
	}
}
