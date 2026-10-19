// @vitest-environment jsdom
import "@testing-library/jest-dom";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "../ui/tooltip";
import { HudLogoMark, HudRecordButton, HudRecordingTimer, HudSheet } from "./HudControls";

function renderWithTooltips(ui: ReactElement) {
	return render(<TooltipProvider>{ui}</TooltipProvider>);
}

afterEach(() => {
	cleanup();
});

describe("HudRecordButton", () => {
	const base = {
		recording: false,
		paused: false,
		saving: false,
		label: "Start recording",
		text: "Record",
		onClick: () => undefined,
	};

	it("says Record at rest and keeps the full sentence as its name", () => {
		renderWithTooltips(<HudRecordButton {...base} />);
		const button = screen.getByTestId("launch-record-button");
		expect(button).toHaveAccessibleName("Start recording");
		expect(button).toHaveTextContent("Record");
		expect(button).toHaveAttribute("data-state", "idle");
		expect(button).toBeEnabled();
	});

	it("turns into the orange Stop action while recording", () => {
		renderWithTooltips(
			<HudRecordButton {...base} recording label="Stop and save the recording" text="Stop" />,
		);
		const button = screen.getByTestId("launch-record-button");
		expect(button).toHaveTextContent("Stop");
		expect(button).toHaveAttribute("data-state", "recording");
	});

	it("locks while saving: disabled, busy, and a second press does nothing", () => {
		const onClick = vi.fn();
		renderWithTooltips(
			<HudRecordButton
				{...base}
				recording
				saving
				label="Saving..."
				text="Saving..."
				onClick={onClick}
			/>,
		);
		const button = screen.getByTestId("launch-record-button");
		expect(button).toBeDisabled();
		expect(button).toHaveAttribute("aria-busy", "true");
		expect(button).toHaveAttribute("data-state", "saving");
		fireEvent.click(button);
		fireEvent.click(button);
		expect(onClick).not.toHaveBeenCalled();
	});
});

describe("HudRecordingTimer", () => {
	it("shows the elapsed time beside the Stop button as a timer", () => {
		render(<HudRecordingTimer elapsedSeconds={84} paused={false} />);
		const timer = screen.getByRole("timer");
		expect(timer).toHaveTextContent("01:24");
		expect(timer).toHaveAttribute("data-paused", "false");
	});

	it("marks a paused take", () => {
		render(<HudRecordingTimer elapsedSeconds={5} paused />);
		expect(screen.getByRole("timer")).toHaveAttribute("data-paused", "true");
	});
});

describe("HudLogoMark", () => {
	it("is decoration only", () => {
		const { container } = render(<HudLogoMark />);
		expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
		expect(screen.queryByRole("button")).toBeNull();
	});
});

describe("HudSheet", () => {
	function renderSheet(overrides: Partial<Parameters<typeof HudSheet>[0]> = {}) {
		const props = {
			eyebrow: "Showhow",
			title: "Allow screen recording",
			description: "Showhow needs screen recording permission before it can capture your screen.",
			hint: "Allow Showhow in macOS screen recording settings, then return to choose a source.",
			icon: <span data-testid="sheet-icon" />,
			closeLabel: "Close",
			cancelLabel: "Cancel",
			primaryLabel: "Open Settings",
			onCancel: vi.fn(),
			onPrimary: vi.fn(),
			...overrides,
		};
		render(<HudSheet {...props} />);
		return props;
	}

	it("is a labelled, described modal dialog", () => {
		renderSheet();
		const dialog = screen.getByRole("dialog", { name: "Allow screen recording" });
		expect(dialog).toHaveAttribute("aria-modal", "true");
		expect(dialog).toHaveAccessibleDescription(
			"Showhow needs screen recording permission before it can capture your screen. Allow Showhow in macOS screen recording settings, then return to choose a source.",
		);
	});

	it("moves focus to its main action when it opens", () => {
		renderSheet();
		expect(screen.getByRole("button", { name: "Open Settings" })).toHaveFocus();
	});

	it("runs the main action and the cancel paths", () => {
		const props = renderSheet();
		fireEvent.click(screen.getByRole("button", { name: "Open Settings" }));
		expect(props.onPrimary).toHaveBeenCalledTimes(1);
		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
		fireEvent.click(screen.getByRole("button", { name: "Close" }));
		expect(props.onCancel).toHaveBeenCalledTimes(2);
	});

	it("cancels on Escape", () => {
		const props = renderSheet();
		fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
		expect(props.onCancel).toHaveBeenCalledTimes(1);
	});

	it("keeps Tab inside the sheet, wrapping both ways", () => {
		renderSheet();
		const dialog = screen.getByRole("dialog");
		const close = screen.getByRole("button", { name: "Close" });
		const primary = screen.getByRole("button", { name: "Open Settings" });
		fireEvent.keyDown(dialog, { key: "Tab" });
		expect(close).toHaveFocus();
		fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
		expect(primary).toHaveFocus();
	});

	it("announces a status line when one is given", () => {
		renderSheet({ status: "Still can't find it." });
		expect(screen.getByRole("status")).toHaveTextContent("Still can't find it.");
	});
});
