import { afterEach, expect, it, vi } from "vitest";
import type { RecordingSession } from "../recordingSession";

const worker = vi.hoisted(() => ({ generate: vi.fn() }));
vi.mock("./generateTranscript", () => ({ generateTranscriptForBundle: worker.generate }));

import { resumeBundleTranscript } from "./resumeBundleTranscript";

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
	worker.generate.mockReset();
});
function pending(bundle: string): RecordingSession {
	return {
		screenVideoPath: `${bundle}/video.webm`,
		createdAt: 1,
		showhowBundleDir: bundle,
		showhowVideoFileUrl: `file://${bundle}/video.webm`,
	};
}
function api(current: () => RecordingSession) {
	const getCurrentRecordingSession = vi.fn(async () => ({ success: true, session: current() }));
	const setCurrentRecordingSession = vi.fn(async () => ({ success: true }));
	vi.stubGlobal("window", {
		electronAPI: { getCurrentRecordingSession, setCurrentRecordingSession },
	});
	return { getCurrentRecordingSession, setCurrentRecordingSession };
}
it("claims a pending bundle once and clears only the matching completed session", async () => {
	const session = pending("/scratch/once");
	const bridge = api(() => session);
	let complete: () => void = () => undefined;
	worker.generate.mockReturnValue(
		new Promise<void>((resolve) => {
			complete = resolve;
		}),
	);
	const first = resumeBundleTranscript();
	const second = resumeBundleTranscript();
	await vi.waitFor(() => expect(worker.generate).toHaveBeenCalledTimes(1));
	complete();
	await Promise.all([first, second]);
	expect(worker.generate).toHaveBeenCalledWith(
		session.showhowBundleDir,
		session.showhowVideoFileUrl,
	);
	expect(bridge.setCurrentRecordingSession).toHaveBeenCalledTimes(1);
	expect(bridge.setCurrentRecordingSession).toHaveBeenCalledWith({
		screenVideoPath: session.screenVideoPath,
		createdAt: session.createdAt,
	});
});
it("a finished old worker leaves the newer recording job intact", async () => {
	let current = pending("/scratch/old");
	const bridge = api(() => current);
	let complete: () => void = () => undefined;
	worker.generate.mockReturnValue(
		new Promise<void>((resolve) => {
			complete = resolve;
		}),
	);
	const job = resumeBundleTranscript();
	await vi.waitFor(() => expect(worker.generate).toHaveBeenCalledTimes(1));
	current = pending("/scratch/new");
	complete();
	await job;
	expect(bridge.setCurrentRecordingSession).not.toHaveBeenCalled();
});
it("a worker failure retains the persisted pending job for a later resume", async () => {
	const session = pending("/scratch/retry");
	const bridge = api(() => session);
	vi.spyOn(console, "error").mockImplementation(() => undefined);
	worker.generate.mockRejectedValueOnce(new Error("synthetic worker failure"));
	await resumeBundleTranscript();
	expect(bridge.setCurrentRecordingSession).not.toHaveBeenCalled();
	worker.generate.mockResolvedValueOnce(undefined);
	await resumeBundleTranscript();
	expect(worker.generate).toHaveBeenCalledTimes(2);
	expect(bridge.setCurrentRecordingSession).toHaveBeenCalledTimes(1);
});
