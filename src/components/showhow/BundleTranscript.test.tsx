// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { BundleTranscript } from "./BundleTranscript";

it("mounting the editor leaves main-process transcription ownership intact", () => {
	const getCurrentRecordingSession = vi.fn();
	vi.stubGlobal("electronAPI", { getCurrentRecordingSession });
	try {
		const view = render(<BundleTranscript />);
		expect(view.container.innerHTML).toBe("");
		expect(getCurrentRecordingSession).not.toHaveBeenCalled();
		view.unmount();
	} finally {
		vi.unstubAllGlobals();
	}
});
