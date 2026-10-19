// @vitest-environment jsdom
import "@testing-library/jest-dom";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CountdownOverlay } from "./CountdownOverlay";

vi.mock("@/contexts/I18nContext", () => ({
	useScopedT: () => (key: string) =>
		key === "countdown.caption" ? "Recording starts · press Record to cancel" : key,
}));

let push: ((value: number | null) => void) | null = null;

beforeEach(() => {
	window.electronAPI = {
		...window.electronAPI,
		onCountdownOverlayValue: vi.fn((callback: (value: number | null) => void) => {
			push = callback;
			return () => {
				push = null;
			};
		}),
	} as typeof window.electronAPI;
});

afterEach(() => {
	cleanup();
	push = null;
});

describe("CountdownOverlay", () => {
	it("draws nothing until a value arrives", () => {
		const { container } = render(<CountdownOverlay />);
		expect(container).toBeEmptyDOMElement();
	});

	it("shows the number in the Final tile with its caption, and swaps numbers in place", () => {
		render(<CountdownOverlay />);
		act(() => push?.(3));
		const tile = screen.getByTestId("countdown-tile");
		expect(tile).toHaveTextContent("3");
		expect(screen.getByText("Recording starts · press Record to cancel")).toBeInTheDocument();

		act(() => push?.(2));
		expect(screen.getByTestId("countdown-tile")).toHaveTextContent("2");
		expect(screen.getByTestId("countdown-number")).toHaveAttribute("data-value", "2");
	});

	it("clears when the countdown ends", () => {
		const { container } = render(<CountdownOverlay />);
		act(() => push?.(1));
		act(() => push?.(null));
		expect(container).toBeEmptyDOMElement();
	});
});
