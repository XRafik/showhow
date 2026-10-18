// @vitest-environment jsdom
import "@testing-library/jest-dom";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@/contexts/I18nContext";
import type {
	ImportRecordingProgress,
	ImportRecordingResult,
} from "@/lib/showhow/recordingLibrary";
import { ImportVideoSheet } from "./ImportVideoSheet";

let progress: (value: ImportRecordingProgress) => void;
const start = vi.fn();
const cancel = vi.fn();
const closed = vi.fn();
const imported = vi.fn();
beforeEach(() => {
	vi.resetAllMocks();
	cancel.mockResolvedValue({ cancelled: true });
	Object.defineProperty(window, "electronAPI", {
		configurable: true,
		value: {
			showhowImportRecording: start,
			showhowCancelImport: cancel,
			showhowOnImportProgress: (callback: typeof progress) => {
				progress = callback;
				return () => undefined;
			},
		},
	});
});
const mount = () =>
	render(
		<I18nProvider>
			<ImportVideoSheet open onOpenChange={closed} onImported={imported} />
		</I18nProvider>,
	);
const pending = () => {
	let resolve!: (result: ImportRecordingResult) => void;
	start.mockReturnValue(
		new Promise<ImportRecordingResult>((done) => {
			resolve = done;
		}),
	);
	return (result: ImportRecordingResult) => act(async () => resolve(result));
};

describe("ImportVideoSheet", () => {
	it("shows actual byte progress, ignores another request and stays indeterminate while validating", async () => {
		const done = pending();
		mount();
		await userEvent.click(screen.getByRole("button", { name: "Choose MP4" }));
		const requestId = start.mock.calls[0][0].requestId;
		act(() => progress({ requestId: "stale", phase: "copying", bytesCopied: 99, totalBytes: 100 }));
		expect(screen.getByRole("progressbar")).not.toHaveAttribute("aria-valuenow");
		act(() =>
			progress({
				requestId,
				phase: "copying",
				fileName: "Demo.mp4",
				bytesCopied: 25,
				totalBytes: 100,
			}),
		);
		expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "25");
		expect(screen.getByText("25 / 100 bytes copied")).toBeInTheDocument();
		act(() => progress({ requestId, phase: "validating", bytesCopied: 100, totalBytes: 100 }));
		expect(screen.getByRole("progressbar")).not.toHaveAttribute("aria-valuenow");
		expect(screen.getByRole("status")).toHaveTextContent("Checking video…");
		await done({ status: "cancelled" });
	});

	it("Escape cancels the owned request and waits for the main result", async () => {
		const done = pending();
		mount();
		await userEvent.click(screen.getByRole("button", { name: "Choose MP4" }));
		await userEvent.keyboard("{Escape}");
		expect(cancel).toHaveBeenCalledWith(start.mock.calls[0][0]);
		expect(closed).not.toHaveBeenCalled();
		expect(screen.getByRole("status")).toHaveTextContent("Cancelling import…");
		await done({ status: "cancelled" });
		expect(closed).toHaveBeenCalledWith(false);
		expect(imported).not.toHaveBeenCalled();
	});

	it("shows an actionable failure and permits choosing another file", async () => {
		start
			.mockResolvedValueOnce({ status: "failed", error: "Choose a complete H.264/AAC MP4." })
			.mockResolvedValueOnce({ status: "cancelled" });
		mount();
		await userEvent.click(screen.getByRole("button", { name: "Choose MP4" }));
		expect(await screen.findByRole("alert")).toHaveTextContent("Choose a complete H.264/AAC MP4.");
		expect(closed).not.toHaveBeenCalled();
		await userEvent.click(screen.getByRole("button", { name: "Choose another MP4" }));
		await waitFor(() => expect(closed).toHaveBeenCalledWith(false));
		expect(start.mock.calls[1][0].requestId).not.toBe(start.mock.calls[0][0].requestId);
	});

	it("reconciles success if publication wins a cancellation race", async () => {
		const done = pending();
		mount();
		await userEvent.click(screen.getByRole("button", { name: "Choose MP4" }));
		await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
		const entry = {
			bundleDir: "/recordings/new",
			title: "Demo",
			source: "imported" as const,
			createdAt: 1,
		};
		await done({ status: "imported", entry });
		expect(imported).toHaveBeenCalledWith(entry);
		expect(closed).toHaveBeenCalledWith(false);
	});
});
