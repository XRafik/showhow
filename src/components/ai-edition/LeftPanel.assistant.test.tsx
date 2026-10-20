// @vitest-environment jsdom
// Editor-03 (#147): the agent's edits still land at once (owner decision), and the turn that
// landed them is followed by an "Applied · N changes" card whose Undo restores the document as
// it was before the turn, through the same apply path the turn used — and only while nothing
// else has changed the document since.

import "@testing-library/jest-dom";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type AxcutDocument, createEmptyDocument } from "@/lib/ai-edition/schema";
import { useProjectStore } from "@/lib/ai-edition/store/projectStore";

const bridge = vi.hoisted(() => ({
	snapshot: {
		config: { provider: "openrouter", model: "fake/model" } as {
			provider: string;
			model: string;
		} | null,
		connectedProviders: ["openrouter"] as string[],
		availableProviders: [],
		credentialSummary: [],
	},
	chatRun: vi.fn(),
	save: vi.fn(),
}));

vi.mock("@/native/client", () => ({
	nativeBridgeClient: {
		aiEdition: {
			llmGetSnapshot: () => Promise.resolve(bridge.snapshot),
			// One empty session already open, so the turn's own session bookkeeping does not
			// reload the message list underneath the test.
			chatListSessions: () =>
				Promise.resolve([{ id: "s1", title: "Chat", messageCount: 0, createdAt: "now" }]),
			chatCreateSession: () =>
				Promise.resolve({ id: "s1", title: "Chat", messageCount: 0, createdAt: "now" }),
			chatSelectSession: () => Promise.resolve({ id: "s1", messages: [] }),
			chatBudget: () => Promise.resolve(null),
			llmListProviderModels: () => Promise.resolve({ models: [] }),
			chatRun: (...args: unknown[]) => bridge.chatRun(...args),
			save: (...args: unknown[]) => bridge.save(...args),
		},
	},
}));

vi.mock("@/contexts/I18nContext", () => ({
	useI18n: () => ({ locale: "en", setLocale: () => undefined }),
	useScopedT: () => (key: string, vars?: Record<string, string | number>) =>
		vars ? `${key}:${JSON.stringify(vars)}` : key,
}));

import { TooltipProvider } from "@/components/ui/tooltip";
import { EditorDialogsProvider } from "@/contexts/EditorDialogsContext";
import { ChatStripPanel } from "./LeftPanel";

function zoom(id: string) {
	return { id, startMs: 1000, endMs: 2000, depth: 2 as const, focus: { cx: 0.5, cy: 0.5 } };
}

let before: AxcutDocument;

beforeEach(() => {
	before = createEmptyDocument({ projectId: "p1", title: "Demo" });
	useProjectStore.setState({ projectId: "p1", document: before, revision: 1, dirty: false });
	bridge.snapshot.config = { provider: "openrouter", model: "fake/model" };
	bridge.snapshot.connectedProviders = ["openrouter"];
	bridge.save.mockImplementation((doc: unknown) =>
		Promise.resolve({ success: true, document: doc }),
	);
	bridge.chatRun.mockImplementation(() =>
		Promise.resolve({
			success: true,
			document: { ...before, zoomRanges: [zoom("z1"), zoom("z2")] },
			assistantMessage: {
				id: "a1",
				role: "assistant",
				content: "Added two zooms.",
				createdAt: "now",
			},
		}),
	);
	(window as unknown as { electronAPI?: unknown }).electronAPI = {
		onAiEditionChatEvent: () => () => undefined,
	};
	Element.prototype.scrollTo = () => undefined;
});

afterEach(() => {
	cleanup();
	useProjectStore.setState({ projectId: null, document: null, revision: 0 });
	(window as unknown as { electronAPI?: unknown }).electronAPI = undefined;
});

function renderPanel() {
	return render(
		<TooltipProvider>
			<EditorDialogsProvider>
				<ChatStripPanel />
			</EditorDialogsProvider>
		</TooltipProvider>,
	);
}

async function sendPrompt(text: string) {
	const box = await screen.findByRole("textbox", { name: "chat.composerLabel" });
	await waitFor(() => expect(box).toBeEnabled());
	fireEvent.change(box, { target: { value: text } });
	fireEvent.click(screen.getByRole("button", { name: "chat.send" }));
}

describe("Edit with AI, Final (Editor-03)", () => {
	it("is headed Edit with AI and names the connected provider truthfully", async () => {
		renderPanel();
		expect(screen.getByRole("heading", { name: "chat.editWithAi" })).toBeInTheDocument();
		expect(
			await screen.findByText('chat.providerConnected:{"provider":"OpenRouter API"}'),
		).toBeInTheDocument();
	});

	it("says Not connected when no provider is", async () => {
		bridge.snapshot.config = null;
		bridge.snapshot.connectedProviders = [];
		renderPanel();
		expect(await screen.findByText("chat.providerNotConnected")).toBeInTheDocument();
	});

	it("applies the turn, then shows Applied with the number of changes", async () => {
		renderPanel();
		await sendPrompt("Add zooms");
		const card = await screen.findByRole("status", { name: 'chat.appliedTitleMany:{"count":2}' });
		expect(within(card).getByText("Added two zooms.")).toBeInTheDocument();
		expect(useProjectStore.getState().document?.zoomRanges).toHaveLength(2);
	});

	it("undoes the turn through the apply path, restoring the document from before it", async () => {
		renderPanel();
		await sendPrompt("Add zooms");
		const card = await screen.findByRole("status", { name: 'chat.appliedTitleMany:{"count":2}' });
		fireEvent.click(within(card).getByRole("button", { name: "chat.undoTurn" }));
		await waitFor(() => expect(useProjectStore.getState().document?.zoomRanges).toHaveLength(0));
		expect(await within(card).findByText("chat.turnUndone")).toBeInTheDocument();
		expect(within(card).queryByRole("button", { name: "chat.undoTurn" })).toBeNull();
	});

	it("refuses a stale Undo and leaves the document alone once something else changed it", async () => {
		renderPanel();
		await sendPrompt("Add zooms");
		const card = await screen.findByRole("status", { name: 'chat.appliedTitleMany:{"count":2}' });
		// A manual edit after the turn.
		const edited = { ...useProjectStore.getState().document!, zoomRanges: [zoom("z1")] };
		act(() => useProjectStore.getState().setDocument(edited, { history: true }));
		fireEvent.click(within(card).getByRole("button", { name: "chat.undoTurn" }));
		expect(await within(card).findByText("chat.turnUndoStale")).toBeInTheDocument();
		expect(useProjectStore.getState().document?.zoomRanges).toEqual([zoom("z1")]);
	});

	it("lets Undo be tried again after its save failed, instead of calling it stale", async () => {
		renderPanel();
		await sendPrompt("Add zooms");
		const card = await screen.findByRole("status", { name: 'chat.appliedTitleMany:{"count":2}' });
		bridge.save.mockResolvedValueOnce({ success: false, error: "disk full" });
		fireEvent.click(within(card).getByRole("button", { name: "chat.undoTurn" }));
		const retry = await within(card).findByRole("button", { name: "chat.undoTurn" });
		await waitFor(() => expect(retry).toBeEnabled());
		expect(useProjectStore.getState().document?.zoomRanges).toHaveLength(2);
		fireEvent.click(retry);
		expect(await within(card).findByText("chat.turnUndone")).toBeInTheDocument();
		expect(within(card).queryByText("chat.turnUndoStale")).toBeNull();
		expect(useProjectStore.getState().document?.zoomRanges).toHaveLength(0);
	});

	it("shows no Applied card for a turn that changed nothing", async () => {
		bridge.chatRun.mockImplementation(() =>
			Promise.resolve({
				success: true,
				document: before,
				assistantMessage: {
					id: "a1",
					role: "assistant",
					content: "Nothing to do.",
					createdAt: "now",
				},
			}),
		);
		renderPanel();
		await sendPrompt("Hello");
		expect(await screen.findByText("Nothing to do.")).toBeInTheDocument();
		expect(screen.queryByRole("status", { name: /chat\.appliedTitle/ })).toBeNull();
	});
});
