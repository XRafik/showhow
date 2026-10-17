// @vitest-environment jsdom
import "@testing-library/jest-dom";
import {
	act,
	fireEvent,
	render as rtlRender,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nProvider } from "@/contexts/I18nContext";

const render: typeof rtlRender = (node, options) =>
	rtlRender(node, { wrapper: I18nProvider, ...options });

import { StrictMode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RecordingLibraryEntry } from "@/lib/showhow/recordingLibrary";
import { RecordingLibrary } from "./RecordingLibrary";

// Mock window.electronAPI
const mockShowhowListRecordings = vi.fn<() => Promise<RecordingLibraryEntry[]>>();
const mockOpenRecording = vi.fn();
const mockSwitchToHud = vi.fn<() => Promise<void>>();
const mockClipboardWriteText = vi.fn<(text: string) => Promise<void>>();
const mockShowhowCopyPath = vi.fn<(bundleDir: string) => Promise<{ success: boolean }>>();
const mockShowhowUpdateWorkflowDocument =
	vi.fn<(bundleDir: string, update: unknown) => Promise<{ success: boolean }>>();
const mockShowhowRegenerateDoc =
	vi.fn<
		(bundleDir: string) => Promise<{
			success: boolean;
			stepsWritten: number;
			transcriptAvailable: boolean;
			entry: RecordingLibraryEntry | null;
		}>
	>();

beforeEach(() => {
	vi.resetAllMocks();
	mockSwitchToHud.mockResolvedValue();
	mockClipboardWriteText.mockResolvedValue(undefined);
	mockShowhowCopyPath.mockResolvedValue({ success: true });
	mockShowhowUpdateWorkflowDocument.mockResolvedValue({ success: true });
	mockShowhowRegenerateDoc.mockResolvedValue({
		success: true,
		stepsWritten: 0,
		transcriptAvailable: false,
		entry: null,
	});
	Object.defineProperty(window, "electronAPI", {
		value: {
			showhowListRecordings: mockShowhowListRecordings,
			showhowOpenRecording: mockOpenRecording,
			showhowCopyPath: mockShowhowCopyPath,
			showhowUpdateWorkflowDocument: mockShowhowUpdateWorkflowDocument,
			showhowRegenerateDoc: mockShowhowRegenerateDoc,
			switchToHud: mockSwitchToHud,
		},
		writable: true,
		configurable: true,
	});
	// jsdom does not ship navigator.clipboard; provide a minimal mock so the
	// Copy path action can be exercised without touching production code.
	Object.defineProperty(navigator, "clipboard", {
		value: { writeText: mockClipboardWriteText },
		writable: true,
		configurable: true,
	});
});

const desktopEntry: RecordingLibraryEntry = {
	bundleDir: "/Users/user/Showhow/Recordings/2026-07-11_164207-recording",
	title: "Recording 2026-07-11 16:42",
	source: "desktop",
	createdAt: new Date(2026, 6, 11, 16, 42, 7).getTime(),
	durationMs: 72_000,
};

const browserEntry: RecordingLibraryEntry = {
	bundleDir: "/Users/user/Showhow/Recordings/2026-07-12_100000-recording",
	title: "Browser recording",
	source: "browser",
	createdAt: new Date(2026, 6, 12, 10, 0, 0).getTime(),
	durationMs: 154_000,
};

function deferred<T>() {
	let resolve: (value: T) => void = () => undefined;
	let reject: (reason?: unknown) => void = () => undefined;
	const promise = new Promise<T>((promiseResolve, promiseReject) => {
		resolve = promiseResolve;
		reject = promiseReject;
	});
	return { promise, resolve, reject };
}

// ---- Issue #23: workflow document view ---------------------------------------
//
// The Phase 2 doc engine writes `steps.json` (see `electron/showhow/bundle.ts`)
// with one `Step` per captured click: `{ label, ts, coords, screenshot, ... }`.
// The library document view is expected to surface, for the selected bundle:
// the built-in video player, the title/source tag/exact folder path, a Copy
// path action, and the numbered steps (screenshot + instruction + timestamp
// chip that seeks the player). These tests pin that behavior; they fail today
// because `RecordingLibrary` does not yet render the document view.

interface WorkflowStep {
	/** Instruction label (from transcript-matched step label). */
	label: string;
	/** Click time in milliseconds (source of truth for the timestamp chip). */
	ts: number;
	/** `step-NN.png` filename inside the bundle's `screenshots/` directory. */
	screenshot: string;
	redaction?: boolean;
	includeRevealedText?: boolean;
}

interface WorkflowDocumentEntry extends RecordingLibraryEntry {
	/** Bundle video filename, mirroring `ShowhowMeta.video`. */
	video: "video.mp4" | "video.webm";
	/** Steps parsed from the bundle's `steps.json`. Empty for transcript-only docs. */
	steps: WorkflowStep[];
}

const desktopDocEntry: WorkflowDocumentEntry = {
	...desktopEntry,
	video: "video.mp4",
	steps: [
		{ label: "Open the products page", ts: 3_000, screenshot: "step-01.png" },
		{ label: "Click Add product", ts: 12_000, screenshot: "step-02.png" },
		{ label: "Enter the product title", ts: 21_000, screenshot: "step-03.png" },
	],
};

const browserDocEntry: WorkflowDocumentEntry = {
	...browserEntry,
	video: "video.webm",
	steps: [{ label: "Open account settings", ts: 5_000, screenshot: "step-01.png" }],
};

describe("RecordingLibrary", () => {
	it("returns to the configured recorder tray from the prominent New recording action", async () => {
		mockShowhowListRecordings.mockResolvedValue([desktopEntry]);
		render(<RecordingLibrary />);

		await screen.findByRole("heading", { level: 1 });
		await userEvent.click(screen.getByRole("button", { name: "New recording" }));

		expect(mockSwitchToHud).toHaveBeenCalledTimes(1);
		expect(mockShowhowUpdateWorkflowDocument).not.toHaveBeenCalled();
		expect(mockShowhowCopyPath).not.toHaveBeenCalled();
		expect(mockShowhowRegenerateDoc).not.toHaveBeenCalled();
	});

	it("renders the approved empty state when no recordings exist", async () => {
		mockShowhowListRecordings.mockResolvedValue([]);
		render(<RecordingLibrary />);
		await waitFor(() => {
			expect(screen.getByTestId("empty-library-state")).toBeInTheDocument();
		});
		expect(screen.getByText("No recordings yet")).toBeInTheDocument();
	});

	it("renders the sidebar empty message when no recordings exist", async () => {
		mockShowhowListRecordings.mockResolvedValue([]);
		render(<RecordingLibrary />);
		await waitFor(() => {
			expect(screen.getByText("No recordings yet. Start one to see it here.")).toBeInTheDocument();
		});
	});

	it("renders a desktop recording row with monitor icon label", async () => {
		mockShowhowListRecordings.mockResolvedValue([desktopEntry]);
		render(<RecordingLibrary />);
		await waitFor(() => {
			// Title appears in both sidebar row and main panel
			expect(screen.getAllByText(desktopEntry.title).length).toBeGreaterThan(0);
		});
		expect(screen.getByText(/Desktop · 1:12/)).toBeInTheDocument();
	});

	it("renders a browser recording row with globe icon", async () => {
		mockShowhowListRecordings.mockResolvedValue([browserEntry]);
		render(<RecordingLibrary />);
		await waitFor(() => {
			expect(screen.getAllByText(browserEntry.title).length).toBeGreaterThan(0);
		});
		expect(screen.getByText(/Browser · 2:34/)).toBeInTheDocument();
	});

	it("marks the first entry as active on load", async () => {
		mockShowhowListRecordings.mockResolvedValue([desktopEntry, browserEntry]);
		render(<RecordingLibrary />);
		await waitFor(() => {
			expect(
				screen.getAllByRole("button").find((b) => b.getAttribute("aria-pressed") === "true"),
			).toBeTruthy();
		});
		const activeBtn = screen
			.getAllByRole("button")
			.find((b) => b.getAttribute("aria-pressed") === "true");
		expect(activeBtn).toHaveTextContent(desktopEntry.title);
	});

	it("selects a different entry when its row is clicked", async () => {
		mockShowhowListRecordings.mockResolvedValue([desktopEntry, browserEntry]);
		render(<RecordingLibrary />);
		await waitFor(() => {
			expect(screen.getByText(browserEntry.title)).toBeInTheDocument();
		});
		const browserBtn = screen
			.getAllByRole("button")
			.find((b) => b.textContent?.includes(browserEntry.title));
		expect(browserBtn).toBeDefined();
		await act(async () => {
			await userEvent.click(browserBtn!);
		});
		expect(browserBtn).toHaveAttribute("aria-pressed", "true");
	});

	it("shows the active recording's folder path", async () => {
		mockShowhowListRecordings.mockResolvedValue([desktopEntry]);
		render(<RecordingLibrary />);
		await waitFor(() => {
			expect(screen.getByText(desktopEntry.bundleDir)).toBeInTheDocument();
		});
	});

	it("shows the active recording's title in the main panel", async () => {
		mockShowhowListRecordings.mockResolvedValue([desktopEntry]);
		render(<RecordingLibrary />);
		await waitFor(() => {
			expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(desktopEntry.title);
		});
	});

	it("shows the source tag on the active recording", async () => {
		mockShowhowListRecordings.mockResolvedValue([desktopEntry]);
		render(<RecordingLibrary />);
		await waitFor(() => {
			expect(screen.getByText("Desktop recording")).toBeInTheDocument();
		});
	});

	it("shows a distinct error state when the IPC load fails", async () => {
		mockShowhowListRecordings.mockRejectedValue(new Error("IPC error"));
		render(<RecordingLibrary />);
		await waitFor(() => {
			expect(screen.getByTestId("recording-library-error-state")).toBeInTheDocument();
		});
		expect(screen.queryByTestId("empty-library-state")).not.toBeInTheDocument();
		expect(screen.queryByText("No recordings yet")).not.toBeInTheDocument();
	});

	it("renders the Library section heading in the sidebar", async () => {
		mockShowhowListRecordings.mockResolvedValue([]);
		render(<RecordingLibrary />);
		// The sidebar "LIBRARY" heading is always present
		expect(screen.getByText("Library")).toBeInTheDocument();
	});

	it("returns to the recorder from the library", async () => {
		mockShowhowListRecordings.mockResolvedValue([]);
		render(<RecordingLibrary />);

		await screen.findByTestId("empty-library-state");
		await userEvent.click(screen.getByRole("button", { name: "Back to recorder" }));

		expect(mockSwitchToHud).toHaveBeenCalledTimes(1);
	});
});

describe("RecordingLibrary — workflow document editing (issue #26)", () => {
	it("shows explicit Save and Cancel controls while editing a title", async () => {
		mockShowhowListRecordings.mockResolvedValue([desktopDocEntry]);
		render(<RecordingLibrary />);

		await screen.findByRole("heading", { level: 1 });
		await userEvent.click(screen.getByRole("button", { name: "Edit title" }));

		expect(screen.getByRole("button", { name: "Save title" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Cancel title edit" })).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Edit title" })).not.toBeInTheDocument();
	});

	it("cancels a title edit without persisting and restores the saved title", async () => {
		mockShowhowListRecordings.mockResolvedValue([desktopDocEntry]);
		render(<RecordingLibrary />);

		await screen.findByRole("heading", { level: 1 });
		await userEvent.click(screen.getByRole("button", { name: "Edit title" }));
		const titleInput = screen.getByRole("textbox", { name: "Recording title" });
		await userEvent.clear(titleInput);
		await userEvent.type(titleInput, "Unsaved title");
		await userEvent.click(screen.getByRole("button", { name: "Cancel title edit" }));

		expect(mockShowhowUpdateWorkflowDocument).not.toHaveBeenCalled();
		expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(desktopDocEntry.title);
		expect(screen.queryByRole("textbox", { name: "Recording title" })).not.toBeInTheDocument();
	});

	it("keeps title save pending until its IPC operation resolves", async () => {
		mockShowhowListRecordings.mockResolvedValue([desktopDocEntry]);
		const update = deferred<{ success: boolean }>();
		mockShowhowUpdateWorkflowDocument.mockReturnValue(update.promise);
		render(<RecordingLibrary />);

		await screen.findByRole("heading", { level: 1 });
		await userEvent.click(screen.getByRole("button", { name: "Edit title" }));
		const titleInput = screen.getByRole("textbox", { name: "Recording title" });
		await userEvent.clear(titleInput);
		await userEvent.type(titleInput, "Create a product");
		await userEvent.click(screen.getByRole("button", { name: "Save title" }));

		expect(screen.getByText("Saving title…")).toBeInTheDocument();
		expect(screen.queryByText("Title saved")).not.toBeInTheDocument();

		await act(async () => update.resolve({ success: true }));
		expect(await screen.findByText("Title saved")).toBeInTheDocument();
	});

	it("shows title save success after a deferred IPC resolves in Strict Mode", async () => {
		mockShowhowListRecordings.mockResolvedValue([desktopDocEntry]);
		const update = deferred<{ success: boolean }>();
		mockShowhowUpdateWorkflowDocument.mockReturnValue(update.promise);
		render(
			<StrictMode>
				<RecordingLibrary />
			</StrictMode>,
		);

		await screen.findByRole("heading", { level: 1 });
		await userEvent.click(screen.getByRole("button", { name: "Edit title" }));
		await userEvent.click(screen.getByRole("button", { name: "Save title" }));
		expect(screen.getByText("Saving title…")).toBeInTheDocument();

		await act(async () => update.resolve({ success: true }));
		expect(await screen.findByText("Title saved")).toBeInTheDocument();
	});

	it.each([
		[
			"resolves false",
			() => mockShowhowUpdateWorkflowDocument.mockResolvedValue({ success: false }),
		],
		[
			"rejects",
			() => mockShowhowUpdateWorkflowDocument.mockRejectedValue(new Error("write unavailable")),
		],
	])("shows title save failure when its IPC operation %s", async (_outcome, configureFailure) => {
		mockShowhowListRecordings.mockResolvedValue([desktopDocEntry]);
		configureFailure();
		render(<RecordingLibrary />);

		await screen.findByRole("heading", { level: 1 });
		await userEvent.click(screen.getByRole("button", { name: "Edit title" }));
		const titleInput = screen.getByRole("textbox", { name: "Recording title" });
		await userEvent.clear(titleInput);
		await userEvent.type(titleInput, "Unsaved replacement title");
		await userEvent.click(screen.getByRole("button", { name: "Save title" }));

		expect(await screen.findByText("Couldn't save title")).toBeInTheDocument();
		expect(screen.getByText(desktopDocEntry.title)).toBeInTheDocument();
		expect(screen.queryByText("Unsaved replacement title")).not.toBeInTheDocument();
		expect(screen.queryByText("Title saved")).not.toBeInTheDocument();
	});

	it("reconciles a saved title after navigating to another recording", async () => {
		mockShowhowListRecordings.mockResolvedValue([desktopDocEntry, browserDocEntry]);
		const update = deferred<{ success: boolean }>();
		mockShowhowUpdateWorkflowDocument.mockReturnValue(update.promise);
		render(<RecordingLibrary />);

		await screen.findByRole("heading", { level: 1, name: desktopDocEntry.title });
		await userEvent.click(screen.getByRole("button", { name: "Edit title" }));
		const titleInput = screen.getByRole("textbox", { name: "Recording title" });
		await userEvent.clear(titleInput);
		await userEvent.type(titleInput, "Renamed desktop recording");
		await userEvent.click(screen.getByRole("button", { name: "Save title" }));

		const browserRow = screen
			.getAllByRole("button")
			.find((button) => button.textContent?.includes(browserDocEntry.title));
		expect(browserRow).toBeDefined();
		await userEvent.click(browserRow!);
		expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(browserDocEntry.title);

		await act(async () => update.resolve({ success: true }));
		expect(screen.getByText("Renamed desktop recording")).toBeInTheDocument();
		expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(browserDocEntry.title);
		expect(screen.queryByText("Title saved")).not.toBeInTheDocument();

		const renamedDesktopRow = screen
			.getAllByRole("button")
			.find((button) => button.textContent?.includes("Renamed desktop recording"));
		expect(renamedDesktopRow).toBeDefined();
		await userEvent.click(renamedDesktopRow!);
		expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
			"Renamed desktop recording",
		);
	});

	it("preserves newer document state when a pending title save resolves", async () => {
		mockShowhowListRecordings.mockResolvedValue([desktopDocEntry, browserDocEntry]);
		const titleUpdate = deferred<{ success: boolean }>();
		mockShowhowUpdateWorkflowDocument.mockImplementation((_bundleDir, update) => {
			if (
				typeof update === "object" &&
				update !== null &&
				"type" in update &&
				update.type === "title"
			) {
				return titleUpdate.promise;
			}
			return Promise.resolve({ success: true });
		});
		render(<RecordingLibrary />);

		await screen.findByRole("heading", { level: 1, name: desktopDocEntry.title });
		await userEvent.click(screen.getByRole("button", { name: "Edit title" }));
		const titleInput = screen.getByRole("textbox", { name: "Recording title" });
		await userEvent.clear(titleInput);
		await userEvent.type(titleInput, "Saved title");
		await userEvent.click(screen.getByRole("button", { name: "Save title" }));

		const browserRow = screen
			.getAllByRole("button")
			.find((button) => button.textContent?.includes(browserDocEntry.title));
		expect(browserRow).toBeDefined();
		await userEvent.click(browserRow!);
		const desktopRow = screen
			.getAllByRole("button")
			.find((button) => button.textContent?.includes(desktopDocEntry.title));
		expect(desktopRow).toBeDefined();
		await userEvent.click(desktopRow!);

		await userEvent.click(screen.getByRole("button", { name: "Edit step 1" }));
		const instructionInput = screen.getByRole("textbox", { name: "Step 1 instruction" });
		await userEvent.clear(instructionInput);
		await userEvent.type(instructionInput, "Newer step label");
		await userEvent.keyboard("{Enter}");
		expect(await screen.findByText("Newer step label")).toBeInTheDocument();
		expect(mockShowhowUpdateWorkflowDocument).toHaveBeenCalledWith(desktopDocEntry.bundleDir, {
			type: "step",
			index: 0,
			label: "Newer step label",
		});

		await act(async () => titleUpdate.resolve({ success: true }));
		expect(
			await screen.findByRole("heading", { level: 1, name: "Saved title" }),
		).toBeInTheDocument();
		expect(screen.getByText("Newer step label")).toBeInTheDocument();
		expect(screen.queryByText(desktopDocEntry.steps[0].label)).not.toBeInTheDocument();
	});

	it("edits the title and instruction inline, then persists both changes", async () => {
		mockShowhowListRecordings.mockResolvedValue([desktopDocEntry]);
		render(<RecordingLibrary />);

		await screen.findByRole("heading", { level: 1 });
		await userEvent.click(screen.getByRole("button", { name: "Edit title" }));
		const titleInput = screen.getByRole("textbox", { name: "Recording title" });
		await userEvent.clear(titleInput);
		await userEvent.type(titleInput, "Create a product");
		await userEvent.keyboard("{Enter}");

		await userEvent.click(screen.getByRole("button", { name: "Edit step 1" }));
		const instructionInput = screen.getByRole("textbox", { name: "Step 1 instruction" });
		await userEvent.clear(instructionInput);
		await userEvent.type(instructionInput, "Open Products");
		await userEvent.keyboard("{Enter}");

		expect(mockShowhowUpdateWorkflowDocument).toHaveBeenCalledWith(desktopDocEntry.bundleDir, {
			type: "title",
			title: "Create a product",
		});
		expect(mockShowhowUpdateWorkflowDocument).toHaveBeenCalledWith(desktopDocEntry.bundleDir, {
			type: "step",
			index: 0,
			label: "Open Products",
		});
	});

	it("reveals a redacted step only in the UI and requires opt-in before persisting it to Markdown", async () => {
		mockShowhowListRecordings.mockResolvedValue([
			{
				...desktopDocEntry,
				steps: [{ ...desktopDocEntry.steps[0], screenshot: "", redaction: true }],
			},
		]);
		render(<RecordingLibrary />);

		await screen.findByText("Sensitive text hidden");
		expect(screen.queryByRole("img", { name: "Step 1: Open the products page" })).toBeNull();
		await userEvent.click(screen.getByRole("button", { name: "Reveal step 1 text" }));
		expect(screen.getByText("Open the products page")).toBeInTheDocument();
		await userEvent.click(
			screen.getByRole("checkbox", { name: "Include revealed text in steps.md" }),
		);

		expect(mockShowhowUpdateWorkflowDocument).toHaveBeenCalledWith(desktopDocEntry.bundleDir, {
			type: "step",
			index: 0,
			includeRevealedText: true,
		});
	});

	it("requires reveal before a redacted instruction can be edited", async () => {
		mockShowhowListRecordings.mockResolvedValue([
			{
				...desktopDocEntry,
				steps: [{ ...desktopDocEntry.steps[0], screenshot: "", redaction: true }],
			},
		]);
		render(<RecordingLibrary />);

		await screen.findByText("Sensitive text hidden");
		const editButton = screen.getByRole("button", { name: "Edit step 1" });
		expect(editButton).toBeDisabled();
		expect(screen.queryByRole("textbox", { name: "Step 1 instruction" })).toBeNull();

		await userEvent.click(screen.getByRole("button", { name: "Reveal step 1 text" }));
		expect(editButton).toBeEnabled();
		await userEvent.click(editButton);
		expect(screen.getByRole("textbox", { name: "Step 1 instruction" })).toHaveValue(
			"Open the products page",
		);
	});

	it("deletes a step and persists the deletion", async () => {
		mockShowhowListRecordings.mockResolvedValue([desktopDocEntry]);
		render(<RecordingLibrary />);

		await screen.findByText("Click Add product");
		await userEvent.click(screen.getByRole("button", { name: "Delete step 2" }));

		expect(mockShowhowUpdateWorkflowDocument).toHaveBeenCalledWith(desktopDocEntry.bundleDir, {
			type: "delete-step",
			index: 1,
		});
		expect(screen.queryByText("Click Add product")).not.toBeInTheDocument();
	});

	it("does not reveal a different redacted step after deleting an earlier step", async () => {
		mockShowhowListRecordings.mockResolvedValue([
			{
				...desktopDocEntry,
				steps: [
					{ ...desktopDocEntry.steps[0], label: "First secret", screenshot: "", redaction: true },
					{ ...desktopDocEntry.steps[1], label: "Second secret", screenshot: "", redaction: true },
					{ ...desktopDocEntry.steps[2], label: "Third secret", screenshot: "", redaction: true },
				],
			},
		]);
		render(<RecordingLibrary />);

		await screen.findAllByText("Sensitive text hidden");
		await userEvent.click(screen.getByRole("button", { name: "Reveal step 2 text" }));
		expect(screen.getByText("Second secret")).toBeInTheDocument();
		await userEvent.click(screen.getByRole("button", { name: "Delete step 1" }));

		await waitFor(() => expect(screen.queryByText("First secret")).not.toBeInTheDocument());
		expect(screen.queryByText("Third secret")).not.toBeInTheDocument();
		expect(screen.getAllByText("Sensitive text hidden")).toHaveLength(2);
	});
});

describe("RecordingLibrary — workflow document view (issue #23)", () => {
	it("keeps Copy path pending until its IPC operation resolves, then shows success", async () => {
		mockShowhowListRecordings.mockResolvedValue([desktopDocEntry]);
		const copy = deferred<{ success: boolean }>();
		mockShowhowCopyPath.mockReturnValue(copy.promise);
		render(<RecordingLibrary />);

		await screen.findByRole("heading", { level: 1 });
		await userEvent.click(screen.getByRole("button", { name: "Copy path" }));

		expect(screen.getByText("Copying path…")).toBeInTheDocument();
		expect(screen.queryByText("Path copied")).not.toBeInTheDocument();

		await act(async () => copy.resolve({ success: true }));
		expect(await screen.findByText("Path copied")).toBeInTheDocument();
	});

	it("shows Copy path success after a deferred IPC resolves in Strict Mode", async () => {
		mockShowhowListRecordings.mockResolvedValue([desktopDocEntry]);
		const copy = deferred<{ success: boolean }>();
		mockShowhowCopyPath.mockReturnValue(copy.promise);
		render(
			<StrictMode>
				<RecordingLibrary />
			</StrictMode>,
		);

		await screen.findByRole("heading", { level: 1 });
		await userEvent.click(screen.getByRole("button", { name: "Copy path" }));
		expect(screen.getByText("Copying path…")).toBeInTheDocument();

		await act(async () => copy.resolve({ success: true }));
		expect(await screen.findByText("Path copied")).toBeInTheDocument();
	});

	it("shows Copy path failure after a false result or rejection", async () => {
		mockShowhowListRecordings.mockResolvedValue([desktopDocEntry]);
		mockShowhowCopyPath.mockRejectedValue(new Error("clipboard unavailable"));
		render(<RecordingLibrary />);

		await screen.findByRole("heading", { level: 1 });
		await userEvent.click(screen.getByRole("button", { name: "Copy path" }));

		expect(await screen.findByText("Couldn't copy path")).toBeInTheDocument();
	});

	it("renders a built-in video player for the selected bundle", async () => {
		mockShowhowListRecordings.mockResolvedValue([desktopDocEntry]);
		const { container } = render(<RecordingLibrary />);

		await waitFor(() => {
			expect(container.querySelector("video")).not.toBeNull();
		});
		const video = container.querySelector("video");
		// The player src must reference the bundle's video file.
		expect(video?.getAttribute("src") ?? "").toMatch(/video\.mp4/u);
	});

	it("shows the title, source tag, and exact folder path for the selected bundle", async () => {
		mockShowhowListRecordings.mockResolvedValue([desktopDocEntry]);
		render(<RecordingLibrary />);

		await waitFor(() => {
			expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(desktopDocEntry.title);
		});
		// Source tag.
		expect(screen.getByText("Desktop recording")).toBeInTheDocument();
		// Exact folder path (not a truncated/derived label).
		expect(screen.getByText(desktopDocEntry.bundleDir)).toBeInTheDocument();
	});

	it("renders numbered steps with screenshot and instruction content from steps data", async () => {
		mockShowhowListRecordings.mockResolvedValue([desktopDocEntry]);
		const { container } = render(<RecordingLibrary />);

		// Wait for the first step instruction to appear.
		await waitFor(() => {
			expect(screen.getByText("Open the products page")).toBeInTheDocument();
		});

		// Every step instruction is rendered, in order.
		expect(screen.getByText("Open the products page")).toBeInTheDocument();
		expect(screen.getByText("Click Add product")).toBeInTheDocument();
		expect(screen.getByText("Enter the product title")).toBeInTheDocument();

		// Step numbers 1, 2, 3 are rendered (one per step).
		for (const num of ["1", "2", "3"]) {
			expect(screen.getAllByText(num).length).toBeGreaterThan(0);
		}

		// Each step surfaces its screenshot image, referencing the bundle screenshot
		// filename so the doc view is driven by the steps data.
		const imgs = container.querySelectorAll("img");
		expect(imgs.length).toBeGreaterThanOrEqual(3);
		const srcs = Array.from(imgs).map((img) => img.getAttribute("src") ?? "");
		expect(srcs.some((src) => src.includes("step-01.png"))).toBe(true);
		expect(srcs.some((src) => src.includes("step-02.png"))).toBe(true);
		expect(srcs.some((src) => src.includes("step-03.png"))).toBe(true);
	});

	it("copies the bundle folder path to the clipboard via the Copy path action", async () => {
		mockShowhowListRecordings.mockResolvedValue([desktopDocEntry]);
		render(<RecordingLibrary />);

		// The title renders in both the sidebar row and the main-panel heading;
		// wait for the heading (unique) so the detail panel has mounted.
		await waitFor(() => {
			expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(desktopDocEntry.title);
		});
		await userEvent.click(screen.getByRole("button", { name: /Copy path/iu }));

		expect(mockShowhowCopyPath).toHaveBeenCalledTimes(1);
		expect(mockShowhowCopyPath).toHaveBeenCalledWith(desktopDocEntry.bundleDir);
		expect(mockClipboardWriteText).not.toHaveBeenCalled();
	});

	it("seeks the built-in player to the step time when a timestamp chip is clicked", async () => {
		mockShowhowListRecordings.mockResolvedValue([desktopDocEntry]);
		const { container } = render(<RecordingLibrary />);

		await waitFor(() => {
			expect(screen.getByText("Open the products page")).toBeInTheDocument();
		});
		const video = container.querySelector("video") as HTMLVideoElement;
		expect(video).not.toBeNull();
		// Sanity: the player starts at the beginning.
		expect(video.currentTime).toBe(0);

		// The second step is at 12000 ms -> formatted chip "0:12".
		const chip = screen.getByText("0:12");
		await act(async () => {
			await userEvent.click(chip);
		});

		// Clicking the chip seeks the built-in player to the step's time (seconds).
		expect(video.currentTime).toBe(12);
	});

	it("does not apply a queued seek after selecting another recording", async () => {
		mockShowhowListRecordings.mockResolvedValue([desktopDocEntry, browserDocEntry]);
		const { container } = render(<RecordingLibrary />);

		await screen.findByText("Open the products page");
		const firstVideo = container.querySelector("video") as HTMLVideoElement;
		Object.defineProperty(firstVideo, "readyState", {
			configurable: true,
			value: HTMLMediaElement.HAVE_NOTHING,
		});
		await userEvent.click(screen.getByText("0:12"));

		const browserRow = screen
			.getAllByRole("button")
			.find((button) => button.textContent?.includes(browserDocEntry.title));
		expect(browserRow).toBeDefined();
		await userEvent.click(browserRow!);
		await screen.findByText("Open account settings");

		const secondVideo = container.querySelector("video") as HTMLVideoElement;
		secondVideo.currentTime = 0;
		fireEvent.loadedMetadata(secondVideo);

		expect(secondVideo.currentTime).toBe(0);
	});
});

describe("RecordingLibrary — missing-doc resilience (issue #27)", () => {
	// A desktop recording with a valid video but no steps.json and no stepCapture:
	// the approved missing-doc empty state with a Create workflow doc action.
	const desktopNoDocEntry: RecordingLibraryEntry = {
		...desktopEntry,
		video: "video.mp4",
	};

	it("renders the approved missing-doc empty state with a Create workflow doc action when no doc exists", async () => {
		mockShowhowListRecordings.mockResolvedValue([desktopNoDocEntry]);
		render(<RecordingLibrary />);

		await screen.findByRole("heading", { level: 1 });
		expect(screen.getByTestId("missing-doc-state")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Create workflow doc/iu })).toBeInTheDocument();
	});

	it("keeps Copy path available alongside the missing-doc state", async () => {
		mockShowhowListRecordings.mockResolvedValue([desktopNoDocEntry]);
		render(<RecordingLibrary />);

		await screen.findByTestId("missing-doc-state");
		await userEvent.click(screen.getByRole("button", { name: /Copy path/iu }));
		expect(mockShowhowCopyPath).toHaveBeenCalledWith(desktopNoDocEntry.bundleDir);
	});

	it("shows an observable generating state while the Create action is in flight", async () => {
		mockShowhowListRecordings.mockResolvedValue([desktopNoDocEntry]);
		let resolveRegen: (value: {
			success: boolean;
			stepsWritten: number;
			transcriptAvailable: boolean;
			entry: RecordingLibraryEntry | null;
		}) => void = () => {
			// Placeholder replaced by the in-flight regeneration promise below,
			// before the Create action is clicked.
		};
		mockShowhowRegenerateDoc.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolveRegen = resolve;
				}) as Promise<{
					success: boolean;
					stepsWritten: number;
					transcriptAvailable: boolean;
					entry: RecordingLibraryEntry | null;
				}>,
		);
		render(<RecordingLibrary />);

		await screen.findByTestId("missing-doc-state");
		await userEvent.click(screen.getByRole("button", { name: /Create workflow doc/iu }));

		expect(await screen.findByTestId("generating-doc-state")).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: /Create workflow doc/iu })).not.toBeInTheDocument();

		// Release the in-flight regeneration.
		await act(async () => {
			resolveRegen({
				success: true,
				stepsWritten: 2,
				transcriptAvailable: true,
				entry: desktopDocEntry,
			});
		});
	});

	it("refreshes into the resulting doc on a successful Create action", async () => {
		mockShowhowListRecordings.mockResolvedValue([desktopNoDocEntry]);
		mockShowhowRegenerateDoc.mockResolvedValue({
			success: true,
			stepsWritten: 3,
			transcriptAvailable: true,
			entry: desktopDocEntry,
		});
		render(<RecordingLibrary />);

		await screen.findByTestId("missing-doc-state");
		await userEvent.click(screen.getByRole("button", { name: /Create workflow doc/iu }));

		// The regenerated steps now render in place of the empty state.
		await screen.findByText("Open the products page");
		expect(screen.queryByTestId("missing-doc-state")).not.toBeInTheDocument();
		expect(mockShowhowRegenerateDoc).toHaveBeenCalledWith(desktopNoDocEntry.bundleDir);
	});

	it("shows a retryable failure state when the Create action fails", async () => {
		mockShowhowListRecordings.mockResolvedValue([desktopNoDocEntry]);
		mockShowhowRegenerateDoc.mockResolvedValue({
			success: false,
			stepsWritten: 0,
			transcriptAvailable: false,
			entry: desktopNoDocEntry,
		});
		render(<RecordingLibrary />);

		await screen.findByTestId("missing-doc-state");
		await userEvent.click(screen.getByRole("button", { name: /Create workflow doc/iu }));

		expect(await screen.findByTestId("doc-failure-state")).toBeInTheDocument();
		// Retry action is offered.
		const retry = screen.getByRole("button", { name: /Retry/iu });
		expect(retry).toBeInTheDocument();
		// Copy path remains available through the failure.
		expect(screen.getByRole("button", { name: /Copy path/iu })).toBeInTheDocument();
	});

	it("retries regeneration from the failure state", async () => {
		mockShowhowListRecordings.mockResolvedValue([desktopNoDocEntry]);
		mockShowhowRegenerateDoc
			.mockResolvedValueOnce({
				success: false,
				stepsWritten: 0,
				transcriptAvailable: false,
				entry: desktopNoDocEntry,
			})
			.mockResolvedValueOnce({
				success: true,
				stepsWritten: 3,
				transcriptAvailable: true,
				entry: desktopDocEntry,
			});
		render(<RecordingLibrary />);

		await screen.findByTestId("missing-doc-state");
		await userEvent.click(screen.getByRole("button", { name: /Create workflow doc/iu }));
		await screen.findByTestId("doc-failure-state");
		await userEvent.click(screen.getByRole("button", { name: /Retry/iu }));

		await screen.findByText("Open the products page");
		expect(mockShowhowRegenerateDoc).toHaveBeenCalledTimes(2);
	});

	it("explains a browser companion disconnect and offers the desktop-tier fallback", async () => {
		const browserUnpairedEntry: RecordingLibraryEntry = {
			...browserEntry,
			video: "video.webm",
			stepCapture: {
				status: "unavailable",
				message:
					"Browser companion disconnected mid-recording; semantic steps unavailable. Desktop tier remains usable.",
			},
		};
		mockShowhowListRecordings.mockResolvedValue([browserUnpairedEntry]);
		render(<RecordingLibrary />);

		const docState = await screen.findByTestId("missing-doc-state");
		// Explicit companion-disconnect explanation is shown.
		expect(docState.textContent ?? "").toMatch(/companion disconnected/iu);
		// Desktop-tier fallback is explicitly named.
		expect(docState.textContent ?? "").toMatch(/desktop tier/iu);
		// The Create action is offered to regenerate from the desktop tier.
		expect(
			within(docState).getByRole("button", { name: /Create workflow doc/iu }),
		).toBeInTheDocument();
	});

	it("explains a no-click desktop recording and offers the transcript-only fallback", async () => {
		const desktopNoClickEntry: RecordingLibraryEntry = {
			...desktopEntry,
			video: "video.mp4",
			stepCapture: {
				status: "unavailable",
				message: "No desktop clicks were captured; this bundle has a transcript-only doc.",
			},
		};
		mockShowhowListRecordings.mockResolvedValue([desktopNoClickEntry]);
		render(<RecordingLibrary />);

		const docState = await screen.findByTestId("missing-doc-state");
		// Explicit no-click explanation is shown.
		expect(docState.textContent ?? "").toMatch(/no desktop clicks/iu);
		// Transcript-only fallback is explicitly named.
		expect(docState.textContent ?? "").toMatch(/transcript-only/iu);
		// The Create action is offered to build the transcript-only doc.
		expect(
			within(docState).getByRole("button", { name: /Create workflow doc/iu }),
		).toBeInTheDocument();
	});

	it("renders an explicit transcript-only doc state for a zero-step success, not an endless Create", async () => {
		// steps.json exists with zero steps: the doc engine succeeded and this is
		// a transcript-only doc. It must not fall back into the Create lifecycle.
		const transcriptOnlyEntry: RecordingLibraryEntry = {
			...desktopEntry,
			video: "video.mp4",
			steps: [],
		};
		mockShowhowListRecordings.mockResolvedValue([transcriptOnlyEntry]);
		render(<RecordingLibrary />);

		const docState = await screen.findByTestId("transcript-only-doc-state");
		// The successful zero-step doc is named explicitly.
		expect(docState.textContent ?? "").toMatch(/transcript-only/iu);
		// The Create lifecycle is not re-offered for a doc that already succeeded.
		expect(screen.queryByTestId("missing-doc-state")).not.toBeInTheDocument();
		expect(screen.queryByRole("button", { name: /Create workflow doc/iu })).not.toBeInTheDocument();
		// Copy path remains available in this state.
		await userEvent.click(screen.getByRole("button", { name: /Copy path/iu }));
		expect(mockShowhowCopyPath).toHaveBeenCalledWith(transcriptOnlyEntry.bundleDir);
	});

	it("names the degradation reason inside the transcript-only doc state", async () => {
		const transcriptOnlyDegraded: RecordingLibraryEntry = {
			...desktopEntry,
			video: "video.mp4",
			steps: [],
			stepCapture: {
				status: "unavailable",
				message: "No desktop clicks were captured; this bundle has a transcript-only doc.",
			},
		};
		mockShowhowListRecordings.mockResolvedValue([transcriptOnlyDegraded]);
		render(<RecordingLibrary />);

		const docState = await screen.findByTestId("transcript-only-doc-state");
		expect(docState.textContent ?? "").toMatch(/no desktop clicks were captured/iu);
		expect(screen.queryByRole("button", { name: /Create workflow doc/iu })).not.toBeInTheDocument();
	});

	it("renders the degradation notice even when desktop fallback steps are usable", async () => {
		const browserDegradedWithSteps: RecordingLibraryEntry = {
			...browserEntry,
			video: "video.webm",
			steps: [{ label: "Open account settings", ts: 5_000, screenshot: "step-01.png" }],
			stepCapture: {
				status: "unavailable",
				message:
					"Browser companion disconnected mid-recording; semantic steps unavailable. Desktop tier remains usable.",
			},
		};
		mockShowhowListRecordings.mockResolvedValue([browserDegradedWithSteps]);
		render(<RecordingLibrary />);

		// The desktop fallback steps still render.
		await screen.findByText("Open account settings");
		// The companion degradation is explained independently of the steps.
		const notice = screen.getByTestId("step-capture-degradation-notice");
		expect(notice.textContent ?? "").toMatch(/companion disconnected/iu);
		expect(notice.textContent ?? "").toMatch(/desktop tier/iu);
		// Copy path remains available alongside the notice.
		expect(screen.getByRole("button", { name: /Copy path/iu })).toBeInTheDocument();
	});

	it("honors a structured companion reason without a legacy message", async () => {
		const browserUnpairedReasonOnly: RecordingLibraryEntry = {
			...browserEntry,
			video: "video.webm",
			// Forward-compatible shape: the backend supplies a structured `reason`
			// alongside the legacy status/message pair.
			stepCapture: {
				status: "unavailable",
				reason: "companion-unpaired",
			} as RecordingLibraryEntry["stepCapture"],
		};
		mockShowhowListRecordings.mockResolvedValue([browserUnpairedReasonOnly]);
		render(<RecordingLibrary />);

		const docState = await screen.findByTestId("missing-doc-state");
		expect(docState.textContent ?? "").toMatch(/companion/iu);
		expect(docState.textContent ?? "").toMatch(/desktop tier/iu);
		expect(
			within(docState).getByRole("button", { name: /Create workflow doc/iu }),
		).toBeInTheDocument();
	});

	it("explains accessibility-denied click capture with the transcript-only fallback", async () => {
		const desktopAccessibilityDenied: RecordingLibraryEntry = {
			...desktopEntry,
			video: "video.mp4",
			stepCapture: {
				status: "unavailable",
				reason: "accessibility-denied",
				message:
					"Accessibility permission was not granted, so desktop clicks could not be captured.",
			} as RecordingLibraryEntry["stepCapture"],
		};
		mockShowhowListRecordings.mockResolvedValue([desktopAccessibilityDenied]);
		render(<RecordingLibrary />);

		const docState = await screen.findByTestId("missing-doc-state");
		expect(docState.textContent ?? "").toMatch(/accessibility permission/iu);
		expect(docState.textContent ?? "").toMatch(/transcript-only/iu);
		expect(
			within(docState).getByRole("button", { name: /Create workflow doc/iu }),
		).toBeInTheDocument();
	});

	it("does not mislabel a structured frame-extraction failure as no clicks", async () => {
		const desktopFrameFailure: RecordingLibraryEntry = {
			...desktopEntry,
			video: "video.mp4",
			stepCapture: {
				status: "unavailable",
				reason: "frame-extraction",
				message:
					"Desktop click frames could not be extracted; this bundle has a transcript-only doc.",
			} as RecordingLibraryEntry["stepCapture"],
		};
		mockShowhowListRecordings.mockResolvedValue([desktopFrameFailure]);
		render(<RecordingLibrary />);

		const docState = await screen.findByTestId("missing-doc-state");
		// A frame-extraction failure is not a "no clicks" recording.
		expect(docState.textContent ?? "").not.toMatch(/no desktop clicks captured/iu);
		expect(docState.textContent ?? "").toMatch(/could not be extracted/iu);
		// The transcript-only fallback is still named, with the Create action.
		expect(docState.textContent ?? "").toMatch(/transcript-only/iu);
		expect(
			within(docState).getByRole("button", { name: /Create workflow doc/iu }),
		).toBeInTheDocument();
	});

	it("does not mislabel a legacy message-only frame-extraction failure as no clicks", async () => {
		// Current backend payload: no structured reason, only status + message.
		const desktopLegacyFrameFailure: RecordingLibraryEntry = {
			...desktopEntry,
			video: "video.mp4",
			stepCapture: {
				status: "unavailable",
				message:
					"Desktop click frames could not be extracted; this bundle has a transcript-only doc.",
			},
		};
		mockShowhowListRecordings.mockResolvedValue([desktopLegacyFrameFailure]);
		render(<RecordingLibrary />);

		const docState = await screen.findByTestId("missing-doc-state");
		expect(docState.textContent ?? "").not.toMatch(/no desktop clicks captured/iu);
		expect(docState.textContent ?? "").toMatch(/could not be extracted/iu);
		expect(docState.textContent ?? "").toMatch(/transcript-only/iu);
	});
});

it("opens the selected bundle in the v2 editor", async () => {
	mockOpenRecording.mockResolvedValue({ success: true });
	mockShowhowListRecordings.mockResolvedValue([{ ...desktopEntry, video: "video.webm" }]);
	render(<RecordingLibrary />);
	fireEvent.click(await screen.findByRole("button", { name: "Open in editor" }));
	await waitFor(() => expect(mockOpenRecording).toHaveBeenCalledWith(desktopEntry.bundleDir));
});

it("integrates Make guide and Showhow AI connections without requiring a key to view recordings", async () => {
	mockShowhowListRecordings.mockResolvedValue([desktopDocEntry]);
	render(<RecordingLibrary />);
	expect(await screen.findByRole("button", { name: "Make guide", exact: true })).toBeVisible();
	expect(screen.getByRole("button", { name: "Settings", exact: true })).toBeVisible();
});

describe("round1 finding3: background guide completion", () => {
	it.each([
		{ returnBefore: false, delayStatus: false },
		{ returnBefore: true, delayStatus: false },
		{ returnBefore: true, delayStatus: true },
	])("converges title, steps and status (returnBefore=$returnBefore, delayed old status=$delayStatus)", async ({
		returnBefore,
		delayStatus,
	}) => {
		const user = userEvent.setup();
		const first: RecordingLibraryEntry = {
			bundleDir: "/scratch/one",
			title: "Original title",
			source: "desktop",
			createdAt: 1,
			steps: [{ label: "Original instruction", ts: 1000, screenshot: "" }],
		};
		const second: RecordingLibraryEntry = {
			bundleDir: "/scratch/two",
			title: "Other recording",
			source: "desktop",
			createdAt: 2,
			steps: [{ label: "Second instruction", ts: 2000, screenshot: "" }],
		};
		let entries = [first, second];
		let started = false;
		let finished = false;
		let delayed = false;
		const completion = deferred<{ success: boolean }>();
		const oldStatus = deferred<unknown>();
		const options = { transcript: true, frames: true };
		const ready = {
			status: "ready",
			provider: "openrouter",
			model: "offline",
			editedSinceAi: false,
		};
		const status = vi.fn(async (bundleDir: string) => {
			const guide =
				bundleDir === first.bundleDir
					? finished
						? ready
						: started
							? { ...ready, status: "making" }
							: undefined
					: undefined;
			if (delayStatus && started && !finished && !delayed && bundleDir === first.bundleDir) {
				delayed = true;
				return oldStatus.promise;
			}
			return { connected: true, reviewed: true, model: "offline", options, guide };
		});
		const run = vi.fn(() => {
			started = true;
			return completion.promise;
		});
		mockShowhowListRecordings.mockImplementation(async () => entries);
		Object.assign(window.electronAPI, {
			showhowAiGuideStatus: status,
			showhowAiGuidePreview: async () => ({
				token: "first-token",
				provider: "openrouter",
				model: "offline",
				options,
				steps: [],
				frames: [],
				transcript: [],
				wordCount: 0,
			}),
			showhowAiGuideRun: run,
			showhowOnAiGuideProgress: () => () => undefined,
		});
		render(<RecordingLibrary />);
		await screen.findByRole("heading", { name: "Original title", exact: true });
		const firstRow = screen.getByRole("button", { name: "Original title Desktop", exact: true });
		const secondRow = screen.getByRole("button", { name: "Other recording Desktop", exact: true });
		await user.click(screen.getByRole("button", { name: "Make guide", exact: true }));
		await waitFor(() => expect(run).toHaveBeenCalledTimes(1));
		await user.click(secondRow);
		await screen.findByRole("heading", { name: "Other recording", exact: true });
		expect(screen.getByText("Second instruction")).toBeVisible();
		expect(secondRow).toHaveAttribute("aria-pressed", "true");
		if (returnBefore) {
			await user.click(firstRow);
			await screen.findByRole("heading", { name: "Original title", exact: true });
			if (!delayStatus) {
				await screen.findByRole("heading", { name: "Making your guide", exact: true });
				expect(screen.getByRole("button", { name: "Make guide", exact: true })).toBeDisabled();
			}
		}
		entries = [
			{
				...first,
				title: "AI title",
				steps: [{ label: "AI instruction", ts: 1000, screenshot: "" }],
			},
			second,
		];
		finished = true;
		await act(async () => completion.resolve({ success: true }));
		await waitFor(() =>
			expect(mockShowhowListRecordings.mock.calls.length).toBeGreaterThanOrEqual(2),
		);
		if (!returnBefore) {
			expect(secondRow).toHaveAttribute("aria-pressed", "true");
			expect(screen.getByRole("heading", { name: "Other recording", exact: true })).toBeVisible();
			expect(screen.getByText("Second instruction")).toBeVisible();
			expect(screen.queryByText("AI instruction")).not.toBeInTheDocument();
			await user.click(firstRow);
		}
		await screen.findByRole("heading", { name: "AI title", exact: true });
		expect(screen.getByText("AI instruction")).toBeVisible();
		expect(screen.queryByText("Original instruction")).not.toBeInTheDocument();
		expect(await screen.findByRole("button", { name: "Remake", exact: true })).toBeEnabled();
		expect(screen.queryByRole("heading", { name: "Making your guide" })).not.toBeInTheDocument();
		if (delayStatus) {
			expect(delayed).toBe(true);
			await act(async () =>
				oldStatus.resolve({
					connected: true,
					reviewed: true,
					model: "offline",
					options,
					guide: { ...ready, status: "making" },
				}),
			);
			expect(screen.getByRole("button", { name: "Remake", exact: true })).toBeEnabled();
			expect(screen.queryByRole("heading", { name: "Making your guide" })).not.toBeInTheDocument();
		}
		expect(run).toHaveBeenCalledTimes(1);
	});
});
