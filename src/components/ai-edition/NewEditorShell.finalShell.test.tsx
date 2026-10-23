// @vitest-environment jsdom
import "@testing-library/jest-dom";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EditorDialogsProvider } from "@/contexts/EditorDialogsContext";
import { createEmptyDocument } from "@/lib/ai-edition/schema";
import { useProjectStore } from "@/lib/ai-edition/store/projectStore";
import { nativeBridgeClient } from "@/native";

vi.mock("@/contexts/ShortcutsContext", async () => {
	const { DEFAULT_SHORTCUTS } = await import("@/lib/shortcuts");
	return {
		useShortcuts: () => ({
			shortcuts: DEFAULT_SHORTCUTS,
			isMac: false,
			isConfigOpen: false,
			openConfig: vi.fn(),
			closeConfig: vi.fn(),
			setShortcuts: vi.fn(),
			persistShortcuts: () => Promise.resolve(true),
		}),
	};
});

vi.mock("@/contexts/I18nContext", () => ({
	useI18n: () => ({ locale: "en", setLocale: () => undefined }),
	useScopedT: (scope: string) => (key: string, vars?: Record<string, string | number>) =>
		vars ? `${scope}.${key}:${JSON.stringify(vars)}` : `${scope}.${key}`,
}));

vi.mock("./LeftPanel", () => ({
	ChatStripPanel: () => <div data-testid="chat-strip-panel" />,
}));

import { NewEditorShell } from "./NewEditorShell";

function renderShell() {
	return render(
		<TooltipProvider>
			<EditorDialogsProvider>
				<NewEditorShell />
			</EditorDialogsProvider>
		</TooltipProvider>,
	);
}

const openLibrary = vi.fn(async () => ({ opened: true }));

beforeEach(() => {
	(window as unknown as { electronAPI?: unknown }).electronAPI = {
		onAiEditionChatEvent: () => () => undefined,
		setTitleBarOverlay: () => undefined,
		setHasUnsavedChanges: () => undefined,
		onRequestCloseConfirm: () => () => undefined,
		onRequestSaveBeforeClose: () => () => undefined,
		sendCloseConfirmResponse: () => undefined,
		findRecordingCamera: () => Promise.resolve(null),
		preparePreviewAudioTrack: () => Promise.resolve({ success: false }),
		showhowOpenLibrary: openLibrary,
	};
	Element.prototype.scrollTo = () => undefined;
	(globalThis as unknown as { ResizeObserver?: unknown }).ResizeObserver = class {
		observe() {
			// noop
		}
		unobserve() {
			// noop
		}
		disconnect() {
			// noop
		}
	};
	vi.spyOn(nativeBridgeClient.aiEdition, "listProjects").mockResolvedValue([
		{
			id: "p1",
			title: "Bug: invoice total rounds wrong",
			updatedAt: "2026-10-19T09:00:00.000Z",
			assetCount: 1,
		},
		{
			id: "p2",
			title: "Set up a new client",
			updatedAt: "2026-10-18T09:00:00.000Z",
			assetCount: 1,
		},
	]);
});

afterEach(() => {
	cleanup();
	useProjectStore.setState({ projectId: null, document: null, dirty: false });
	vi.restoreAllMocks();
	openLibrary.mockClear();
});

describe("Editor-06: no project open", () => {
	it("replaces the stage, inspector and timeline with the no-project page", async () => {
		renderShell();
		expect(
			await screen.findByRole("heading", { name: "editor.noProjectOpen.title" }),
		).toBeInTheDocument();
		expect(screen.queryByRole("toolbar", { name: "timeline.toolbar.timelineTools" })).toBeNull();
		expect(screen.queryByRole("complementary", { name: "editor.inspector.label" })).toBeNull();
	});

	it("opens the Library through the Showhow IPC", async () => {
		renderShell();
		const page = await screen.findByRole("region", { name: "editor.noProjectOpen.title" });
		fireEvent.click(within(page).getByRole("button", { name: "editor.noProjectOpen.openLibrary" }));
		await waitFor(() => expect(openLibrary).toHaveBeenCalledTimes(1));
	});

	it("lists recent projects and opens the one picked", async () => {
		const loadProject = vi.fn(async () => undefined);
		useProjectStore.setState({ loadProject } as unknown as Partial<
			ReturnType<typeof useProjectStore.getState>
		>);
		renderShell();
		const recent = await screen.findByRole("list", { name: "editor.noProjectOpen.recent" });
		const rows = await within(recent).findAllByRole("button");
		expect(rows.map((row) => row.querySelector("[data-recent-title]")?.textContent)).toEqual([
			"Bug: invoice total rounds wrong",
			"Set up a new client",
		]);
		fireEvent.click(rows[0]);
		await waitFor(() => expect(loadProject).toHaveBeenCalledWith("p1"));
	});

	it("still offers the existing ways in: open a file, import a video and record", async () => {
		renderShell();
		const page = await screen.findByRole("region", { name: "editor.noProjectOpen.title" });
		for (const name of [
			"editor.noProjectOpen.openFile",
			"editor.noProjectOpen.importVideo",
			"editor.noProjectOpen.record",
		]) {
			expect(within(page).getByRole("button", { name })).toBeInTheDocument();
		}
	});

	it("keeps the Final top bar's Library button in the left group and uses the same IPC", async () => {
		renderShell();
		const nav = await screen.findByRole("navigation", { name: "editor.topbar.navigation" });
		const topbar = nav.closest("header");
		if (!topbar) throw new Error("Final top bar header was not rendered");
		const library = within(topbar).getByRole("button", { name: "editor.topbar.library" });
		const brand = within(topbar).getByRole("button", { name: "Showhow" });
		expect(brand.parentElement?.nextElementSibling).toBe(library);
		expect(
			within(nav).queryByRole("button", { name: "editor.topbar.library" }),
		).not.toBeInTheDocument();
		fireEvent.click(library);
		await waitFor(() => expect(openLibrary).toHaveBeenCalledTimes(1));
	});
});

describe("Move an open recording to Trash", () => {
	function setOpenRecording({ saveResult = true }: { saveResult?: boolean } = {}) {
		const document = createEmptyDocument({ projectId: "recording-project", title: "A take" });
		document.project.primaryAssetId = "recording-video";
		document.assets = [
			{
				id: "recording-video",
				kind: "video",
				label: "recording",
				originalPath: "/Users/test/Showhow/Recordings/take-one/video.mp4",
				cameraTrack: null,
				video: { codec: "h264", width: 1920, height: 1080, fps: 30 },
			},
		];
		const saveDocument = vi.fn(async () => {
			if (saveResult) useProjectStore.setState({ dirty: false });
			return saveResult;
		});
		const trashRecording = vi.fn(async () => ({
			success: true as const,
			undoToken: "undo-1",
			expiresAt: Date.now() + 6_000,
		}));
		Object.assign(window.electronAPI, {
			getPlatform: () => "darwin",
			showhowListRecordings: async () => [
				{
					bundleDir: "/Users/test/Showhow/Recordings/take-one",
					title: "A take",
					source: "imported" as const,
					createdAt: 1,
					video: "video.mp4" as const,
				},
			],
			showhowTrashRecording: trashRecording,
		});
		useProjectStore.setState({
			projectId: "recording-project",
			document,
			dirty: true,
			saveDocument,
		} as unknown as Partial<ReturnType<typeof useProjectStore.getState>>);
		return { document, saveDocument, trashRecording };
	}

	async function openTrashSheet(user: ReturnType<typeof userEvent.setup>) {
		await user.click(screen.getByRole("button", { name: "common.showhowTrash.moreActions" }));
		await user.click(await screen.findByRole("menuitem", { name: "common.showhowTrash.menuItem" }));
		expect(await screen.findByRole("heading", { name: "common.showhowTrash.title" })).toBeVisible();
	}

	async function confirmTrash(user: ReturnType<typeof userEvent.setup>) {
		await user.click(screen.getByRole("button", { name: "common.showhowTrash.move" }));
		expect(
			await screen.findByRole("heading", { name: "dialogs.unsavedChanges.modal.closeTitle" }),
		).toBeVisible();
		expect(screen.queryByRole("heading", { name: "common.showhowTrash.title" })).toBeNull();
	}

	it("saves dirty work before moving the recording bundle and opening the Library", async () => {
		const { document, saveDocument, trashRecording } = setOpenRecording();
		const user = userEvent.setup();
		renderShell();

		await openTrashSheet(user);
		await confirmTrash(user);
		await user.click(screen.getByRole("button", { name: "dialogs.unsavedChanges.modal.save" }));

		await waitFor(() => expect(openLibrary).toHaveBeenCalledTimes(1));
		expect(saveDocument).toHaveBeenCalledWith(document, { history: true });
		expect(trashRecording).toHaveBeenCalledWith("/Users/test/Showhow/Recordings/take-one", true);
		expect(saveDocument.mock.invocationCallOrder[0]).toBeLessThan(
			trashRecording.mock.invocationCallOrder[0],
		);
		expect(trashRecording.mock.invocationCallOrder[0]).toBeLessThan(
			openLibrary.mock.invocationCallOrder[0],
		);
	});

	it("keeps a dirty editor open and does not move media when saving fails", async () => {
		const { document, saveDocument, trashRecording } = setOpenRecording({ saveResult: false });
		const user = userEvent.setup();
		renderShell();

		await openTrashSheet(user);
		await confirmTrash(user);
		await user.click(screen.getByRole("button", { name: "dialogs.unsavedChanges.modal.save" }));

		await waitFor(() => expect(trashRecording).not.toHaveBeenCalled());
		expect(openLibrary).not.toHaveBeenCalled();
		expect(saveDocument).toHaveBeenCalledTimes(1);
		expect(useProjectStore.getState().document).toBe(document);
		expect(screen.getByTestId("topbar-save-state")).toHaveAttribute("data-dirty", "true");
		expect(screen.queryByRole("heading", { name: "common.showhowTrash.title" })).toBeNull();
		expect(
			screen.queryByRole("heading", { name: "dialogs.unsavedChanges.modal.closeTitle" }),
		).toBeNull();
	});

	it("leaves the dirty document and media untouched when the unsaved prompt is cancelled", async () => {
		const { document, saveDocument, trashRecording } = setOpenRecording();
		const user = userEvent.setup();
		renderShell();

		await openTrashSheet(user);
		await confirmTrash(user);
		await user.click(screen.getByRole("button", { name: "common.actions.cancel" }));

		expect(saveDocument).not.toHaveBeenCalled();
		expect(trashRecording).not.toHaveBeenCalled();
		expect(openLibrary).not.toHaveBeenCalled();
		expect(useProjectStore.getState().document).toBe(document);
		expect(screen.getByTestId("topbar-save-state")).toHaveAttribute("data-dirty", "true");
	});

	it("discards only after the user chooses Discard, then moves the recording", async () => {
		const { document, saveDocument, trashRecording } = setOpenRecording();
		const user = userEvent.setup();
		renderShell();

		await openTrashSheet(user);
		await confirmTrash(user);
		await user.click(screen.getByRole("button", { name: "dialogs.unsavedChanges.modal.discard" }));

		await waitFor(() => expect(openLibrary).toHaveBeenCalledTimes(1));
		expect(saveDocument).not.toHaveBeenCalled();
		expect(trashRecording).toHaveBeenCalledWith("/Users/test/Showhow/Recordings/take-one", true);
		expect(trashRecording.mock.invocationCallOrder[0]).toBeLessThan(
			openLibrary.mock.invocationCallOrder[0],
		);
		expect(useProjectStore.getState().document).toBe(document);
	});

	it("does not trash the captured recording if the open project changes during confirmation", async () => {
		const { trashRecording } = setOpenRecording();
		const user = userEvent.setup();
		renderShell();

		await openTrashSheet(user);
		await confirmTrash(user);
		const replacement = createEmptyDocument({
			projectId: "different-project",
			title: "Other take",
		});
		useProjectStore.setState({
			projectId: "different-project",
			document: replacement,
			dirty: false,
		} as unknown as Partial<ReturnType<typeof useProjectStore.getState>>);
		await user.click(screen.getByRole("button", { name: "dialogs.unsavedChanges.modal.discard" }));

		await waitFor(() =>
			expect(
				screen.queryByRole("heading", { name: "dialogs.unsavedChanges.modal.closeTitle" }),
			).toBeNull(),
		);
		expect(trashRecording).not.toHaveBeenCalled();
		expect(openLibrary).not.toHaveBeenCalled();
		expect(useProjectStore.getState().document).toBe(replacement);
	});

	it("keeps the busy sheet blocking and prompts before handing off newly dirty work", async () => {
		const { document, trashRecording } = setOpenRecording();
		let resolveTrash:
			| ((result: { success: true; undoToken: string; expiresAt: number }) => void)
			| undefined;
		trashRecording.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolveTrash = resolve;
				}),
		);
		const user = userEvent.setup();
		renderShell();

		await openTrashSheet(user);
		await confirmTrash(user);
		await user.click(screen.getByRole("button", { name: "dialogs.unsavedChanges.modal.save" }));
		await waitFor(() => expect(trashRecording).toHaveBeenCalledOnce());

		const busyDialog = screen.getByRole("dialog");
		expect(busyDialog).toHaveAttribute("aria-modal", "true");
		expect(screen.getByRole("button", { name: "common.showhowTrash.move" })).toBeDisabled();
		expect(
			screen.queryByRole("heading", { name: "dialogs.unsavedChanges.modal.closeTitle" }),
		).toBeNull();
		await user.keyboard("{Escape}");
		expect(screen.getByRole("heading", { name: "common.showhowTrash.title" })).toBeVisible();
		expect(openLibrary).not.toHaveBeenCalled();

		const editedDocument = {
			...document,
			project: { ...document.project, title: "New unsaved edit during move" },
		};
		act(() => useProjectStore.setState({ document: editedDocument, dirty: true }));
		if (!resolveTrash) throw new Error("Trash IPC did not expose its deferred response");
		await act(async () => {
			resolveTrash?.({ success: true, undoToken: "undo-1", expiresAt: Date.now() + 6_000 });
		});

		expect(
			await screen.findByRole("heading", { name: "dialogs.unsavedChanges.modal.closeTitle" }),
		).toBeVisible();
		expect(openLibrary).not.toHaveBeenCalled();
		expect(useProjectStore.getState().document).toBe(editedDocument);
		await user.click(screen.getByRole("button", { name: "common.actions.cancel" }));
		expect(openLibrary).not.toHaveBeenCalled();
		expect(useProjectStore.getState().document).toBe(editedDocument);
		expect(useProjectStore.getState().dirty).toBe(true);
	});
});
