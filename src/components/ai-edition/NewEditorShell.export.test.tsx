// @vitest-environment jsdom
// Editor-04 (#147): the top bar's Export opens export in the inspector, as the rail's share
// entry, instead of a modal over the editor.
import "@testing-library/jest-dom";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EditorDialogsProvider } from "@/contexts/EditorDialogsContext";
import { createEmptyDocument } from "@/lib/ai-edition/schema";
import { useProjectStore } from "@/lib/ai-edition/store/projectStore";

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
	useScopedT: (scope: string) => (key: string) => `${scope}.${key}`,
}));

vi.mock("./LeftPanel", () => ({
	ChatStripPanel: () => <div data-testid="chat-strip-panel" />,
}));

// A render in flight is reported through onBusyChange; the stub reports one from a button.
vi.mock("./ExportDialog", () => ({
	ExportDialog: ({ onBusyChange }: { onBusyChange?: (busy: boolean) => void }) => (
		<div data-testid="export-panel">
			<button type="button" onClick={() => onBusyChange?.(true)}>
				start render
			</button>
		</div>
	),
}));

import { NewEditorShell } from "./NewEditorShell";

function renderShell() {
	const document = createEmptyDocument({ projectId: "p", title: "t" });
	document.assets = [
		{
			id: "a1",
			kind: "video",
			label: "asset",
			originalPath: "/tmp/a.mp4",
			cameraTrack: null,
			video: { codec: "h264", width: 1920, height: 1080, fps: 30 },
		},
	];
	useProjectStore.setState({ projectId: "p", document });
	return render(
		<TooltipProvider>
			<EditorDialogsProvider>
				<NewEditorShell />
			</EditorDialogsProvider>
		</TooltipProvider>,
	);
}

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
});

afterEach(() => {
	cleanup();
	useProjectStore.setState({ projectId: null, document: null });
	(window as unknown as { electronAPI?: unknown }).electronAPI = undefined;
});

describe("NewEditorShell export entry (Editor-04)", () => {
	it("opens export in the inspector from the top bar, not as a dialog", () => {
		renderShell();
		expect(screen.queryByTestId("export-panel")).toBeNull();
		fireEvent.click(screen.getByRole("button", { name: "editor.topbar.export" }));
		expect(screen.getByTestId("export-panel")).toBeVisible();
		expect(screen.getByRole("button", { name: "editor.inspector.export" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		expect(screen.queryByRole("dialog")).toBeNull();
	});

	it("shows one of chat and export at a time, keeping the chat (and a run in flight) mounted", () => {
		renderShell();
		fireEvent.click(screen.getByRole("button", { name: "editor.inspector.aiChat" }));
		const chat = screen.getByTestId("chat-strip-panel");
		expect(chat).toBeVisible();
		fireEvent.click(screen.getByRole("button", { name: "editor.inspector.export" }));
		expect(screen.getByTestId("export-panel")).toBeVisible();
		expect(chat).toBeInTheDocument();
		expect(chat).not.toBeVisible();
		fireEvent.click(screen.getByRole("button", { name: "editor.inspector.aiChat" }));
		expect(screen.getByTestId("chat-strip-panel")).toBe(chat);
		expect(chat).toBeVisible();
		expect(screen.queryByTestId("export-panel")).toBeNull();
	});

	it("does not close export from the rail, a facet or the chat while a render runs", () => {
		renderShell();
		fireEvent.click(screen.getByRole("button", { name: "editor.topbar.export" }));
		fireEvent.click(screen.getByRole("button", { name: "start render" }));
		fireEvent.click(screen.getByRole("button", { name: "editor.inspector.export" }));
		expect(screen.getByTestId("export-panel")).toBeVisible();
		fireEvent.click(screen.getByRole("button", { name: "settings.layout.title" }));
		expect(screen.getByTestId("export-panel")).toBeVisible();
		fireEvent.click(screen.getByRole("button", { name: "editor.inspector.aiChat" }));
		expect(screen.getByTestId("export-panel")).toBeVisible();
	});
});
