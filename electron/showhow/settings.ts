import { randomUUID } from "node:crypto";
import { promises as fs, realpathSync } from "node:fs";
import path from "node:path";
import type { ShowhowSettingsInfo } from "../../src/lib/showhow/settings";
import { getRecordingsRoot, saveRecordingsRoot } from "./bundle";
import { moveRecordings, type RecordingMoveProgress } from "./moveRecordings";
import { listRecordings } from "./recordingLibrary";

function rootIsInside(parent: string, child: string): boolean {
	const relative = path.relative(parent, child);
	return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== "..");
}

function displayFolder(root: string, homeDir: string): string {
	const display = (folder: string, home: string) => {
		const relative = path.relative(home, folder);
		return relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative)
			? `~${path.sep}${relative}`
			: folder;
	};
	try {
		return display(realpathSync(root), realpathSync(homeDir));
	} catch {
		return display(path.resolve(root), path.resolve(homeDir));
	}
}

async function canonicalRoot(root: string): Promise<string> {
	try {
		return await fs.realpath(root);
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") return path.resolve(root);
		throw error;
	}
}

/** Read-only facts the Settings screen shows; settings with an existing store keep using it. */
export function registerShowhowSettingsHandlers(deps: {
	handle: (channel: string, handler: (...args: unknown[]) => Promise<unknown>) => void;
	recordingsRoot: string | (() => string);
	homeDir: string;
	settingsFile?: string;
	chooseFolder?: (defaultPath: string) => Promise<string | null>;
	onMoveProgress?: (event: unknown, progress: RecordingMoveProgress) => void;
}) {
	const getRoot = () =>
		path.resolve(
			deps.settingsFile
				? getRecordingsRoot(deps.settingsFile)
				: typeof deps.recordingsRoot === "function"
					? deps.recordingsRoot()
					: deps.recordingsRoot,
		);
	deps.handle("showhow:settings-info", async (): Promise<ShowhowSettingsInfo> => {
		const root = getRoot();
		const home = path.resolve(deps.homeDir);
		return {
			recordingsFolder: displayFolder(root, home),
		};
	});

	if (deps.chooseFolder) {
		const selections = new Map<
			string,
			{ currentRoot: string; targetRoot: string; bundleNames: string[] }
		>();
		deps.handle("showhow:choose-recordings-folder", async () => {
			const selected = await deps.chooseFolder!(getRoot());
			if (!selected) return null;
			let currentRoot: string;
			let targetRoot: string;
			try {
				currentRoot = await canonicalRoot(getRoot());
				targetRoot = await fs.realpath(selected);
				if (!(await fs.stat(targetRoot)).isDirectory()) {
					return { status: "rejected", reason: "invalid-folder" };
				}
			} catch {
				return { status: "rejected", reason: "invalid-folder" };
			}
			if (targetRoot === currentRoot) return { status: "rejected", reason: "same-folder" };
			if (rootIsInside(currentRoot, targetRoot)) {
				return { status: "rejected", reason: "inside-current-folder" };
			}
			const entries = await listRecordings(currentRoot);
			const token = randomUUID();
			selections.set(token, {
				currentRoot,
				targetRoot,
				bundleNames: entries.map((entry) => path.basename(entry.bundleDir)),
			});
			return {
				status: "selected",
				token,
				recordingsFolder: displayFolder(targetRoot, deps.homeDir),
				currentRecordingsFolder: displayFolder(currentRoot, deps.homeDir),
				recordingCount: entries.length,
			};
		});
		deps.handle("showhow:change-recordings-folder", async (event, token, action) => {
			if (typeof token !== "string" || (action !== "keep" && action !== "move")) {
				return { success: false, error: "Invalid recordings folder change." };
			}
			const selection = selections.get(token);
			if (!selection) return { success: false, error: "Recordings folder selection expired." };
			try {
				if ((await canonicalRoot(getRoot())) !== selection.currentRoot) {
					return { success: false, error: "Recordings folder changed. Choose it again." };
				}
				if (action === "move") {
					const currentEntries = await listRecordings(selection.currentRoot);
					const currentNames = currentEntries.map((entry) => path.basename(entry.bundleDir));
					if (JSON.stringify(currentNames) !== JSON.stringify(selection.bundleNames)) {
						return {
							success: false,
							error: "Library changed. Choose the recordings folder again.",
						};
					}
				}
				await saveRecordingsRoot(selection.targetRoot, deps.settingsFile);
				selections.delete(token);
				if (action === "keep") {
					return {
						success: true,
						recordingsFolder: displayFolder(selection.targetRoot, deps.homeDir),
					};
				}
				return {
					...(await moveRecordings(
						selection.currentRoot,
						selection.targetRoot,
						selection.bundleNames,
						(progress) => deps.onMoveProgress?.(event, progress),
					)),
					recordingsFolder: displayFolder(selection.targetRoot, deps.homeDir),
				};
			} catch (error) {
				return {
					success: false,
					error: error instanceof Error ? error.message : String(error),
				};
			}
		});
	}
}
