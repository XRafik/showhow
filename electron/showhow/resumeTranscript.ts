import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { RecordingSession } from "../../src/lib/recordingSession";

/** Called only after library wiring validates the bundle and its video against the owned root. */
export async function restorePendingBundleTranscript(
	session: RecordingSession,
	bundleDir: string,
): Promise<RecordingSession> {
	// A flat or older manifest can retain stale job fields. The bundle marker is the
	// persisted work request; a completed transcript must never be replaced on open.
	const restored = { ...session };
	delete restored.showhowBundleDir;
	delete restored.showhowVideoFileUrl;
	try {
		const transcript = await fs.readFile(path.join(bundleDir, "transcript.txt"), "utf8");
		if (transcript.trim() === "(transcription pending)") {
			restored.showhowBundleDir = bundleDir;
			restored.showhowVideoFileUrl = pathToFileURL(restored.screenVideoPath).toString();
		}
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
			console.warn("Showhow transcript job could not be read; keeping valid media:", error);
		}
	}
	return restored;
}
