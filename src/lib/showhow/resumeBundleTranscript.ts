import { completeShowhowTranscriptSession } from "../recordingSession";
import { generateTranscriptForBundle } from "./generateTranscript";

const activeJobs = new Map<string, Promise<void>>();

/** Claim a persisted job once per renderer; never replace a newer recording's session. */
export async function resumeBundleTranscript(): Promise<void> {
	const result = await window.electronAPI.getCurrentRecordingSession();
	const session = result.session;
	if (!result.success || !session?.showhowBundleDir || !session.showhowVideoFileUrl) return;
	const bundle = session.showhowBundleDir;
	const video = session.showhowVideoFileUrl;
	if (activeJobs.has(bundle)) return activeJobs.get(bundle);
	const job = (async () => {
		await generateTranscriptForBundle(bundle, video);
		const latest = await window.electronAPI.getCurrentRecordingSession();
		if (!latest.success || !latest.session) return;
		const complete = completeShowhowTranscriptSession(latest.session, bundle, video);
		if (complete) await window.electronAPI.setCurrentRecordingSession(complete);
	})();
	activeJobs.set(bundle, job);
	try {
		await job;
	} catch (error) {
		console.error("Showhow transcript lifecycle failed:", error);
	} finally {
		activeJobs.delete(bundle);
	}
}
