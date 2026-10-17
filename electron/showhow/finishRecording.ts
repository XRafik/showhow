import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { RecordingSession } from "../../src/lib/recordingSession";
import type { StepCaptureReason } from "../../src/lib/showhow/recordingLibrary";
import { bundleDirName, createRecordingBundle, SHOWHOW_RECORDINGS_ROOT } from "./bundle";
import { requestBundleTranscript } from "./transcriptJob";

/** The three macOS completion paths share this fail-open documentation boundary. */
export async function finishShowhowRecording(
	session: RecordingSession,
	durationMs?: number,
	stepCaptureReason?: StepCaptureReason,
): Promise<RecordingSession> {
	try {
		const bundle = await createRecordingBundle({ ...session, durationMs, stepCaptureReason });
		// A persisted pending job survives the HUD/editor transition. A failed worker leaves this marker.
		await fs
			.writeFile(path.join(bundle.bundleDir, "transcript.txt"), "(transcription pending)\n", {
				flag: "wx",
			})
			.catch((error: NodeJS.ErrnoException) => {
				if (error.code !== "EEXIST") throw error;
			});
		void requestBundleTranscript(bundle.bundleDir, bundle.screenVideoPath);
		return {
			...session,
			...bundle,
			showhowBundleDir: bundle.bundleDir,
			showhowVideoFileUrl: pathToFileURL(bundle.screenVideoPath).toString(),
		};
	} catch (error) {
		console.error("Showhow bundle creation failed; keeping valid recording:", error);
		// Bundling may have moved the video before a metadata write failed. Never hand the editor a missing flat path.
		const moved = path.join(
			SHOWHOW_RECORDINGS_ROOT,
			bundleDirName(session.createdAt),
			path.extname(session.screenVideoPath).toLowerCase() === ".mp4" ? "video.mp4" : "video.webm",
		);
		const exists = await fs
			.stat(session.screenVideoPath)
			.then((s) => s.isFile())
			.catch(() => false);
		if (exists) return session;
		if (
			await fs
				.stat(moved)
				.then((s) => s.isFile())
				.catch(() => false)
		) {
			const webcam = path.join(path.dirname(moved), "webcam.webm");
			return {
				...session,
				screenVideoPath: moved,
				...(session.webcamVideoPath &&
				(await fs
					.stat(webcam)
					.then((s) => s.isFile())
					.catch(() => false))
					? { webcamVideoPath: webcam }
					: {}),
			};
		}
		return session;
	}
}
