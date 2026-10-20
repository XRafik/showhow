// @vitest-environment jsdom
// Editor-08 (#147): the shortcuts sheet in the Final look. It stays the editor's place to rebind
// keys, so capture, conflicts and Save keep working inside the new presentation.
import "@testing-library/jest-dom";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SHORTCUTS } from "@/lib/shortcuts";

const shortcuts = vi.hoisted(() => ({
	persist: vi.fn(async (_config: unknown) => true),
	set: vi.fn(),
	close: vi.fn(),
}));

vi.mock("@/contexts/ShortcutsContext", () => ({
	useShortcuts: () => ({
		shortcuts: DEFAULT_SHORTCUTS,
		isMac: false,
		isConfigOpen: true,
		openConfig: vi.fn(),
		closeConfig: shortcuts.close,
		setShortcuts: shortcuts.set,
		persistShortcuts: shortcuts.persist,
	}),
}));

vi.mock("@/contexts/I18nContext", () => ({
	useScopedT: (scope: string) => (key: string, vars?: Record<string, string>) =>
		vars?.defaultValue ? `${scope}.${key}` : `${scope}.${key}`,
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

import { ShortcutsConfigDialog } from "./ShortcutsConfigDialog";

beforeEach(() => {
	shortcuts.persist.mockClear();
	shortcuts.close.mockClear();
});
afterEach(() => cleanup());

describe("ShortcutsConfigDialog (Editor-08)", () => {
	it("is the Final Help sheet: eyebrow, title and the open hint", () => {
		render(<ShortcutsConfigDialog />);
		const dialog = screen.getByRole("dialog", { name: "shortcuts.title" });
		expect(within(dialog).getByText("dialogs.shortcuts.eyebrow")).toBeInTheDocument();
		expect(within(dialog).getByText("dialogs.shortcuts.openHint")).toBeInTheDocument();
	});

	it("shows every binding as a key chip", () => {
		render(<ShortcutsConfigDialog />);
		const zoom = screen.getByRole("button", { name: /shortcuts\.actions\.addZoom/ });
		expect(zoom).toHaveTextContent("Z");
		expect(zoom.querySelector("kbd")).not.toBeNull();
	});

	it("still rebinds: press a row's chip, press a key, then Save persists it", async () => {
		render(<ShortcutsConfigDialog />);
		fireEvent.click(screen.getByRole("button", { name: /shortcuts\.actions\.addZoom/ }));
		fireEvent.keyDown(window, { key: "x" });
		fireEvent.click(screen.getByRole("button", { name: "common.actions.save" }));
		await waitFor(() => expect(shortcuts.persist).toHaveBeenCalledTimes(1));
		expect(shortcuts.persist.mock.calls[0][0]).toMatchObject({ addZoom: { key: "x" } });
	});

	it("lets Escape cancel a capture without closing the sheet", () => {
		render(<ShortcutsConfigDialog />);
		fireEvent.click(screen.getByRole("button", { name: /shortcuts\.actions\.addZoom/ }));
		fireEvent.keyDown(window, { key: "Escape" });
		expect(shortcuts.close).not.toHaveBeenCalled();
		expect(screen.getByRole("button", { name: /shortcuts\.actions\.addZoom/ })).toHaveTextContent(
			"Z",
		);
	});
});
