// @vitest-environment jsdom
import "@/index.css";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Logo } from "./Logo";

// Final SPEC/mock .mark: the cream tile stays fixed in both themes.
describe("Final Logo tile stays cream", () => {
	it("keeps the approved cream tile in both themes", () => {
		const { rerender } = render(
			<div data-sh-theme="light">
				<Logo />
			</div>,
		);
		const tile = document.querySelector("svg rect");
		expect(tile).not.toBeNull();
		expect(window.getComputedStyle(tile as SVGRectElement).fill).toBe("rgb(255, 252, 247)");

		rerender(
			<div data-sh-theme="dark">
				<Logo />
			</div>,
		);
		const darkTile = document.querySelector("svg rect");
		expect(window.getComputedStyle(darkTile as SVGRectElement).fill).toBe("rgb(255, 252, 247)");
	});
});
