// @vitest-environment jsdom
import "@/index.css";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Logo } from "./Logo";

// .pen XXi60: the cream tile is $ds-surface (light #FFFCF7 / dark #2F2F2F), so
// the tile must follow the active theme. The remaining logo geometry (sage
// shadow, ink slab, cursor, rec dot) is fixed-hex by design intent.
describe("Logo tile follows the theme", () => {
	it("computes the tile fill from ds-surface in both themes", () => {
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
		expect(window.getComputedStyle(darkTile as SVGRectElement).fill).toBe("rgb(47, 47, 47)");
	});
});
