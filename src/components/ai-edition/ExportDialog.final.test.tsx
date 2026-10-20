// @vitest-environment jsdom
// Editor-04/05 (#147): export as the inspector's panel, rendering as a sheet over the editor.
// The same native export calls; what changes is where each state is shown and what it promises.
import "@testing-library/jest-dom";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/native", () => ({
	exportMultiNative: vi.fn(),
	exportGifNative: vi.fn(),
	cancelGifExportNative: vi.fn(async () => ({ accepted: true })),
	useIsCpuCompositor: () => false,
}));
vi.mock("@/native/sceneDescription", () => ({
	buildSceneDescription: () => ({ speedRegions: [] }),
	resolveVisibleClips: (doc: AxcutDocument) => doc.timeline.clips,
}));

import { I18nProvider } from "@/contexts/I18nContext";
import { type AxcutDocument, axcutSchemaVersion } from "@/lib/ai-edition/schema";
import { exportMultiNative } from "@/native";
import type { CompositorExportGifResult } from "@/native/contracts";
import { ExportDialog } from "./ExportDialog";

const DOC: AxcutDocument = {
	schemaVersion: axcutSchemaVersion,
	project: {
		id: "proj_1",
		title: "Final export",
		createdAt: "2026-06-26T10:00:00Z",
		updatedAt: "2026-06-26T10:00:00Z",
		primaryAssetId: "a1",
	},
	assets: [
		{
			id: "a1",
			kind: "video",
			label: "asset",
			originalPath: "/tmp/a.mp4",
			cameraTrack: null,
			video: { codec: "h264", width: 1920, height: 1080, fps: 30 },
		},
	],
	transcript: null,
	transcripts: [],
	timeline: {
		clips: [
			{
				id: "c1",
				assetId: "a1",
				sourceStartSec: 0,
				sourceEndSec: 10,
				timelineStartSec: 0,
				timelineEndSec: 10,
				wordRefs: [],
				origin: "user",
				reason: "",
			},
		],
		gaps: [],
		trimRanges: [],
		muteRanges: [],
		speedRanges: [],
		captionRanges: [],
	},
	annotations: [],
	zoomRanges: [],
	audioTracks: [],
	legacyEditor: null,
};
const STATS: CompositorExportGifResult = {
	frames: 600,
	wallS: 2,
	fps: 60,
	videoDurationS: 10,
	fileBytes: 4000,
};

let progress: (frames: number, exportId?: string) => void;

function pendingMp4() {
	let resolve!: (stats: CompositorExportGifResult) => void;
	let reject!: (error: Error) => void;
	vi.mocked(exportMultiNative).mockReturnValueOnce(
		new Promise((yes, no) => {
			resolve = yes;
			reject = no;
		}),
	);
	return { resolve, reject };
}

function renderPanel() {
	return render(
		<I18nProvider>
			<ExportDialog open onClose={vi.fn()} document={DOC} />
		</I18nProvider>,
	);
}

beforeEach(() => {
	vi.clearAllMocks();
	window.electronAPI = {
		pickExportSavePath: vi.fn(async () => ({ path: "/tmp/final.mp4" })),
		onNativeExportProgress: vi.fn((cb) => {
			progress = cb;
			return vi.fn();
		}),
	} as unknown as Window["electronAPI"];
});
afterEach(cleanup);

describe("Export panel (Editor-04)", () => {
	it("is a labelled panel, not a dialog, with the Share eyebrow and the format pressed", () => {
		renderPanel();
		const panel = screen.getByRole("region", { name: "Export" });
		expect(screen.queryByRole("dialog")).toBeNull();
		expect(within(panel).getByText("Share")).toBeInTheDocument();
		expect(within(panel).getByRole("button", { name: "MP4" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		expect(within(panel).getByRole("button", { name: "GIF" })).toHaveAttribute(
			"aria-pressed",
			"false",
		);
	});

	it("summarises what will be made, without promising a size it cannot know", () => {
		renderPanel();
		const summary = screen.getByRole("list", { name: "Export summary" });
		expect(within(summary).getByText("0:10")).toBeInTheDocument();
		expect(within(summary).getByText("You choose where")).toBeInTheDocument();
		expect(within(summary).queryByText(/MB/)).toBeNull();
	});

	it("offers only the formats that exist", () => {
		renderPanel();
		expect(screen.queryByRole("button", { name: /guide/i })).toBeNull();
	});
});

describe("Rendering sheet (Editor-05)", () => {
	it("opens over the editor while an MP4 renders, with its settings and live progress", async () => {
		pendingMp4();
		renderPanel();
		fireEvent.click(screen.getByRole("button", { name: "Export MP4" }));
		const sheet = await screen.findByRole("dialog", { name: "Rendering your video" });
		expect(within(sheet).getByText("Export · MP4 · 1080p · 60 fps")).toBeInTheDocument();
		act(() => progress(300));
		expect(within(sheet).getByRole("progressbar")).toHaveAttribute("aria-valuenow", "50");
		expect(within(sheet).getByText("50%")).toBeInTheDocument();
	});

	it("says an MP4 cannot be stopped mid-render instead of offering a Cancel that does nothing", async () => {
		pendingMp4();
		renderPanel();
		fireEvent.click(screen.getByRole("button", { name: "Export MP4" }));
		const sheet = await screen.findByRole("dialog", { name: "Rendering your video" });
		const cancel = within(sheet).getByRole("button", { name: "Cancel export" });
		expect(cancel).toBeDisabled();
		expect(cancel).toHaveAccessibleDescription("An MP4 export can't be stopped once it starts.");
	});

	it("does not say it is done until the file is written", async () => {
		const job = pendingMp4();
		renderPanel();
		fireEvent.click(screen.getByRole("button", { name: "Export MP4" }));
		await screen.findByRole("dialog", { name: "Rendering your video" });
		act(() => progress(600));
		expect(screen.queryByRole("dialog", { name: "Video exported" })).toBeNull();
		expect(screen.queryByText("/tmp/final.mp4")).toBeNull();
		await act(async () => job.resolve(STATS));
		const done = screen.getByRole("dialog", { name: "Video exported" });
		expect(within(done).getByText("/tmp/final.mp4")).toBeVisible();
		fireEvent.click(within(done).getByRole("button", { name: "Done" }));
		await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
		expect(screen.getByRole("region", { name: "Export" })).toBeInTheDocument();
	});

	it("keeps keyboard focus inside the sheet while an MP4 renders, and moves it to Done", async () => {
		const job = pendingMp4();
		renderPanel();
		fireEvent.click(screen.getByRole("button", { name: "Export MP4" }));
		const sheet = await screen.findByRole("dialog", { name: "Rendering your video" });
		// The only action is disabled, so focus belongs to the sheet itself.
		expect(sheet.contains(document.activeElement)).toBe(true);
		await act(async () => job.resolve(STATS));
		const done = screen.getByRole("dialog", { name: "Video exported" });
		expect(within(done).getByRole("button", { name: "Done" })).toHaveFocus();
	});

	it("says it is busy while a render runs, so the inspector can refuse to close it", async () => {
		const job = pendingMp4();
		const onBusyChange = vi.fn();
		render(
			<I18nProvider>
				<ExportDialog open onClose={vi.fn()} document={DOC} onBusyChange={onBusyChange} />
			</I18nProvider>,
		);
		fireEvent.click(screen.getByRole("button", { name: "Export MP4" }));
		await screen.findByRole("dialog", { name: "Rendering your video" });
		expect(onBusyChange).toHaveBeenLastCalledWith(true);
		await act(async () => job.resolve(STATS));
		expect(onBusyChange).toHaveBeenLastCalledWith(false);
	});

	it("reports a failure in the sheet, and Close returns to the panel", async () => {
		const job = pendingMp4();
		renderPanel();
		fireEvent.click(screen.getByRole("button", { name: "Export MP4" }));
		await screen.findByRole("dialog", { name: "Rendering your video" });
		await act(async () => job.reject(new Error("disk full")));
		const failed = screen.getByRole("dialog", { name: "Export failed" });
		expect(within(failed).getByRole("alert")).toHaveTextContent("disk full");
		fireEvent.click(within(failed).getByRole("button", { name: "Close" }));
		await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
	});
});
