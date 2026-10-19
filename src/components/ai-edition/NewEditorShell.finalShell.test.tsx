// @vitest-environment jsdom
import "@testing-library/jest-dom";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EditorDialogsProvider } from "@/contexts/EditorDialogsContext";
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
		preparePreviewAudioTrack: () => Promise.resolve(null),
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

	it("keeps the Final top bar's Library link on the same IPC", async () => {
		renderShell();
		const nav = await screen.findByRole("navigation", { name: "editor.topbar.navigation" });
		fireEvent.click(within(nav).getByRole("button", { name: "editor.topbar.library" }));
		await waitFor(() => expect(openLibrary).toHaveBeenCalledTimes(1));
	});
});
