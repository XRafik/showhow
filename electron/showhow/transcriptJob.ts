import fs from "node:fs/promises";
import path from "node:path";
import { app } from "electron";
import { formatTranscript } from "../../src/lib/showhow/transcriptFormat";
import { SttManager } from "../stt";
import { regenerateDocArtifacts } from "./bundle";

const jobs = new Map<string, Promise<void>>();
let queue = Promise.resolve();

/** Main-process job: survives renderer transitions and never holds up saving valid media. */
export function requestBundleTranscript(
	bundleDir: string,
	sourcePath: string,
	onTranscriptReady?: (bundleDir: string) => void | Promise<void>,
): Promise<void> {
	const active = jobs.get(bundleDir);
	if (active) return active;
	const job = queue
		.then(async () => {
			const manager = new SttManager();
			let content = "(transcription failed)\n";
			let transcriptReady = false;
			try {
				await manager.init({
					bundledModelsDir: path.join(
						app.isPackaged ? process.resourcesPath : app.getAppPath(),
						"caption-assets",
					),
				});
				const result = await manager.transcribe({ sourcePath });
				content = formatTranscript(result.segments);
				transcriptReady = true;
			} catch (error) {
				console.error("Showhow native transcript generation failed:", error);
			} finally {
				await manager
					.shutdown()
					.catch((error: unknown) =>
						console.error("Showhow transcript helper shutdown failed:", error),
					);
			}
			await fs.writeFile(path.join(bundleDir, "transcript.txt"), content, "utf8");
			try {
				await regenerateDocArtifacts(bundleDir);
			} catch (error) {
				console.error("Showhow transcript doc regeneration failed:", error);
			}
			if (transcriptReady) await onTranscriptReady?.(bundleDir);
		})
		.catch((error: unknown) => {
			console.error("Showhow transcript job failed; keeping valid recording:", error);
		})
		.finally(() => jobs.delete(bundleDir));
	jobs.set(bundleDir, job);
	queue = job;
	return job;
}
