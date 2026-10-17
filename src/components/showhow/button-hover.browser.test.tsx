// @vitest-environment jsdom
import "@/index.css";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./Button";

const onAccent = "#2F2F2F";

function normalizeColor(color: string) {
	const hex = color.match(/^#([\da-f]{6})$/i);
	if (!hex) return color.toLowerCase();
	const channels = hex[1].match(/[\da-f]{2}/gi)?.map((channel) => Number.parseInt(channel, 16));
	return `rgb(${channels?.join(", ")})`;
}

function contrastRatio(first: string, second: string) {
	const luminance = (color: string) => {
		const rgb = color.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
		const channels = rgb
			? rgb.slice(1).map((channel) => Number(channel) / 255)
			: color.match(/[\da-f]{2}/gi)?.map((channel) => Number.parseInt(channel, 16) / 255);
		if (!channels || channels.length < 3) return Number.NaN;
		const [red, green, blue] = channels.map((channel) =>
			channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
		);
		return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
	};
	const firstLuminance = luminance(first);
	const secondLuminance = luminance(second);
	return (
		(Math.max(firstLuminance, secondLuminance) + 0.05) /
		(Math.min(firstLuminance, secondLuminance) + 0.05)
	);
}

describe("Showhow primary button hover contrast", () => {
	it("uses a theme-appropriate hover color with accessible label contrast", () => {
		const { rerender } = render(
			<div data-sh-theme="light">
				<Button>Primary</Button>
			</div>,
		);
		document.documentElement.setAttribute("data-sh-theme", "light");
		const lightHover = window
			.getComputedStyle(document.documentElement)
			.getPropertyValue("--showhow-accent-hover")
			.trim();
		expect(normalizeColor(lightHover)).toBe("rgb(207, 228, 218)");
		expect(contrastRatio(lightHover, onAccent)).toBeGreaterThanOrEqual(4.5);

		rerender(
			<div data-sh-theme="dark">
				<Button>Primary</Button>
			</div>,
		);
		document.documentElement.setAttribute("data-sh-theme", "dark");
		const darkHover = window
			.getComputedStyle(document.documentElement)
			.getPropertyValue("--showhow-accent-hover")
			.trim();
		expect(normalizeColor(darkHover)).toBe("rgb(169, 205, 187)");
		expect(contrastRatio(darkHover, onAccent)).toBeGreaterThanOrEqual(4.5);
		expect(screen.getByRole("button", { name: "Primary" }).className).toContain(
			"hover:bg-[var(--showhow-accent-hover)]",
		);
	});
});
