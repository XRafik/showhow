// @vitest-environment jsdom
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SourceSelector } from "./SourceSelector";

vi.mock("@/contexts/I18nContext", () => ({
	useScopedT: (namespace: string) => {
		if (namespace === "common") {
			return (key: string) => {
				if (key === "actions.cancel") return "Cancel";
				if (key === "actions.share") return "Share";
				if (key === "actions.reload") return "Reload";
				return key;
			};
		}

		return (key: string, vars?: Record<string, string>) => {
			if (key === "sourceSelector.loading") return "Loading sources...";
			if (key === "sourceSelector.emptyTitle") return "No screens or windows found";
			if (key === "sourceSelector.emptyDescription") {
				return "If you just granted screen recording permission, reload this picker. On macOS you may need to reopen Showhow.";
			}
			if (key === "sourceSelector.loadFailedDescription") {
				return "Showhow could not load capture sources. Reload this picker and try again.";
			}
			if (key === "sourceSelector.screens") return `Screens (${vars?.count ?? "0"})`;
			if (key === "sourceSelector.windows") return `Windows (${vars?.count ?? "0"})`;
			if (key === "sourceSelector.eyebrow") return "Source";
			if (key === "sourceSelector.title") return "What should Showhow record?";
			if (key === "sourceSelector.close") return "Close";
			if (key === "sourceSelector.selected") return "Selected";
			if (key === "sourceSelector.useScreen") return "Use this screen";
			if (key === "sourceSelector.useWindow") return "Use this window";
			return key;
		};
	},
}));

describe("SourceSelector", () => {
	beforeEach(() => {
		window.electronAPI = {
			...window.electronAPI,
			getSources: vi.fn().mockResolvedValue([]),
			selectSource: vi.fn(),
		} as typeof window.electronAPI;
	});

	it("is the Final source sheet: titled dialog, close button, selected chip and a named action", async () => {
		window.electronAPI = {
			...window.electronAPI,
			getSources: vi.fn().mockResolvedValue([
				{ id: "screen:1:0", name: "Display 1", thumbnail: null, display_id: "1", appIcon: null },
				{ id: "window:7:0", name: "Notes", thumbnail: null, display_id: "", appIcon: null },
			]),
			selectSource: vi.fn(),
		} as typeof window.electronAPI;
		const close = vi.spyOn(window, "close").mockImplementation(() => undefined);

		render(<SourceSelector />);

		const dialog = await screen.findByRole("dialog", { name: "What should Showhow record?" });
		expect(within(dialog).getByText("Source")).toBeInTheDocument();
		const display = screen.getByRole("radio", { name: "Display 1" });
		expect(within(display).queryByText("Selected")).toBeNull();
		fireEvent.click(display);
		expect(within(display).getByText("Selected")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Use this screen" })).toBeEnabled();

		fireEvent.click(screen.getByRole("button", { name: "Close" }));
		expect(close).toHaveBeenCalledTimes(1);
		close.mockRestore();
	});

	it("names the action after the kind of source chosen", async () => {
		window.electronAPI = {
			...window.electronAPI,
			getSources: vi
				.fn()
				.mockResolvedValue([
					{ id: "window:7:0", name: "Notes", thumbnail: null, display_id: "", appIcon: null },
				]),
			selectSource: vi.fn(),
		} as typeof window.electronAPI;

		render(<SourceSelector />);

		fireEvent.click(await screen.findByRole("radio", { name: "Notes" }));
		fireEvent.click(screen.getByRole("button", { name: "Use this window" }));
		await waitFor(() =>
			expect(window.electronAPI.selectSource).toHaveBeenCalledWith(
				expect.objectContaining({ id: "window:7:0" }),
			),
		);
	});

	it("closes on Escape", async () => {
		window.electronAPI = {
			...window.electronAPI,
			getSources: vi
				.fn()
				.mockResolvedValue([
					{ id: "screen:1:0", name: "Display 1", thumbnail: null, display_id: "1", appIcon: null },
				]),
			selectSource: vi.fn(),
		} as typeof window.electronAPI;
		const close = vi.spyOn(window, "close").mockImplementation(() => undefined);
		render(<SourceSelector />);
		const dialog = await screen.findByRole("dialog");
		fireEvent.keyDown(dialog, { key: "Escape" });
		expect(close).toHaveBeenCalledTimes(1);
		close.mockRestore();
	});

	it("shows a retry state when no capture sources are available", async () => {
		render(<SourceSelector />);

		await screen.findByText("No screens or windows found");
		expect(screen.getByText(/reopen Showhow/)).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Reload" })).toBeInTheDocument();
	});

	it("supports single-tab-stop radio keyboard selection and Share of the focused source", async () => {
		window.electronAPI = {
			...window.electronAPI,
			getSources: vi.fn().mockResolvedValue([
				{
					id: "screen:1:0",
					name: "Display 1",
					thumbnail: null,
					display_id: "1",
					appIcon: null,
				},
				{
					id: "screen:2:0",
					name: "Display 2",
					thumbnail: null,
					display_id: "2",
					appIcon: null,
				},
			]),
			selectSource: vi.fn(),
		} as typeof window.electronAPI;

		render(<SourceSelector />);

		const firstCard = await screen.findByRole("radio", { name: "Display 1" });
		const secondCard = screen.getByRole("radio", { name: "Display 2" });

		// Roving tabIndex: the visible source list adds one Tab stop, not one per card.
		expect(firstCard).toHaveAttribute("tabindex", "0");
		expect(secondCard).toHaveAttribute("tabindex", "-1");

		// Space selects the focused radio and exposes the checked state.
		fireEvent.keyDown(firstCard, { key: " " });
		expect(firstCard).toBeChecked();
		expect(secondCard).not.toBeChecked();

		// ArrowDown moves focus and selection to the next radio in visual order.
		fireEvent.keyDown(firstCard, { key: "ArrowDown" });
		expect(secondCard).toBeChecked();
		expect(secondCard).toHaveFocus();

		// Share sends the keyboard-selected source through the existing IPC.
		fireEvent.click(screen.getByRole("button", { name: "Use this screen" }));
		await waitFor(() => {
			expect(window.electronAPI.selectSource).toHaveBeenCalledTimes(1);
		});
		expect(window.electronAPI.selectSource).toHaveBeenCalledWith(
			expect.objectContaining({ id: "screen:2:0", name: "Display 2" }),
		);
	});

	it("moves radio selection and focus with ArrowRight and exposes the checked state", async () => {
		window.electronAPI = {
			...window.electronAPI,
			getSources: vi.fn().mockResolvedValue([
				{
					id: "screen:1:0",
					name: "Display 1",
					thumbnail: null,
					display_id: "1",
					appIcon: null,
				},
				{
					id: "screen:2:0",
					name: "Display 2",
					thumbnail: null,
					display_id: "2",
					appIcon: null,
				},
			]),
			selectSource: vi.fn(),
		} as typeof window.electronAPI;

		render(<SourceSelector />);

		const [firstCard, secondCard] = await screen.findAllByTestId("source-selector-card");

		// ArrowRight moves selection to the next radio in the group, moves focus
		// with it, and exposes the checked state on the cards.
		fireEvent.keyDown(firstCard, { key: "ArrowRight" });
		expect(secondCard).toHaveFocus();
		expect(secondCard).toBeChecked();
		expect(firstCard).not.toBeChecked();
	});

	it("activates the focused radio with Enter and shares it through the existing IPC", async () => {
		window.electronAPI = {
			...window.electronAPI,
			getSources: vi.fn().mockResolvedValue([
				{
					id: "screen:1:0",
					name: "Display 1",
					thumbnail: null,
					display_id: "1",
					appIcon: null,
				},
				{
					id: "screen:2:0",
					name: "Display 2",
					thumbnail: null,
					display_id: "2",
					appIcon: null,
				},
			]),
			selectSource: vi.fn(),
		} as typeof window.electronAPI;

		render(<SourceSelector />);

		const [firstCard] = await screen.findAllByTestId("source-selector-card");

		// Enter selects the focused radio and exposes the checked state.
		fireEvent.keyDown(firstCard, { key: "Enter" });
		expect(firstCard).toBeChecked();

		// Share sends the Enter-selected source through the existing IPC.
		fireEvent.click(screen.getByRole("button", { name: "Use this screen" }));
		await waitFor(() => {
			expect(window.electronAPI.selectSource).toHaveBeenCalledTimes(1);
		});
		expect(window.electronAPI.selectSource).toHaveBeenCalledWith(
			expect.objectContaining({ id: "screen:1:0", name: "Display 1" }),
		);
	});

	it("moves selection backwards with ArrowLeft/ArrowUp, wraps, and moves the roving tab stop", async () => {
		window.electronAPI = {
			...window.electronAPI,
			getSources: vi.fn().mockResolvedValue([
				{
					id: "screen:1:0",
					name: "Display 1",
					thumbnail: null,
					display_id: "1",
					appIcon: null,
				},
				{
					id: "screen:2:0",
					name: "Display 2",
					thumbnail: null,
					display_id: "2",
					appIcon: null,
				},
			]),
			selectSource: vi.fn(),
		} as typeof window.electronAPI;

		render(<SourceSelector />);

		const [firstCard, secondCard] = await screen.findAllByTestId("source-selector-card");

		// ArrowLeft from the first radio wraps to the last radio in the group.
		fireEvent.keyDown(firstCard, { key: "ArrowLeft" });
		expect(secondCard).toHaveFocus();
		expect(secondCard).toBeChecked();
		expect(firstCard).not.toBeChecked();

		// The roving tab stop follows the selection.
		expect(secondCard).toHaveAttribute("tabindex", "0");
		expect(firstCard).toHaveAttribute("tabindex", "-1");

		// ArrowUp from the second radio moves back to the first.
		fireEvent.keyDown(secondCard, { key: "ArrowUp" });
		expect(firstCard).toHaveFocus();
		expect(firstCard).toBeChecked();
		expect(secondCard).not.toBeChecked();
	});

	it("reloads capture sources from the empty state", async () => {
		const getSources = vi
			.fn()
			.mockResolvedValueOnce([])
			.mockResolvedValueOnce([
				{
					id: "screen:1:0",
					name: "Display 1",
					thumbnail: "data:image/png;base64,abc",
					display_id: "1",
					appIcon: null,
				},
			]);
		window.electronAPI = {
			...window.electronAPI,
			getSources,
			selectSource: vi.fn(),
		} as typeof window.electronAPI;

		render(<SourceSelector />);

		await screen.findByText("No screens or windows found");
		fireEvent.click(screen.getByRole("button", { name: "Reload" }));

		await waitFor(() => {
			expect(screen.getByRole("radio", { name: "Display 1" })).toBeInTheDocument();
		});
		expect(getSources).toHaveBeenCalledTimes(2);

		// The reloaded group starts unselected: the first named radio is the
		// single Tab stop, nothing is checked, and Share stays disabled.
		const firstCard = screen.getByRole("radio", { name: "Display 1" });
		expect(firstCard).not.toBeChecked();
		expect(firstCard).toHaveAttribute("tabindex", "0");
		expect(screen.getByRole("button", { name: "Use this screen" })).toBeDisabled();
	});
});
