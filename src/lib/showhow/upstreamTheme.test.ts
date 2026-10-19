import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const house = readFileSync(path.resolve("src/index.css"), "utf8");
const bridge = readFileSync(path.resolve("src/lib/showhow/upstreamTheme.css"), "utf8");
const editor = readFileSync(
	path.resolve("src/components/ai-edition/v4/EditorShellV4.module.css"),
	"utf8",
);
function declarations(css: string, selector: string): Record<string, string> {
	const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const blocks = [...css.matchAll(new RegExp(`(?:^|})\\s*${escaped}\\s*\\{([^}]+)\\}`, "gm"))];
	return Object.fromEntries(
		blocks.flatMap((block) =>
			[...block[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((value) => [
				value[1],
				value[2].trim(),
			]),
		),
	);
}
function luminance(hex: string): number {
	const channels = [1, 3, 5]
		.map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255)
		.map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
	return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
/** A house colour, opaque or with alpha (#RRGGBBAA), laid over an opaque backdrop. */
function over(color: string, backdrop: string): string {
	const alpha = color.length === 9 ? Number.parseInt(color.slice(7, 9), 16) / 255 : 1;
	return `#${[1, 3, 5]
		.map((offset) => {
			const top = Number.parseInt(color.slice(offset, offset + 2), 16);
			const bottom = Number.parseInt(backdrop.slice(offset, offset + 2), 16);
			return Math.round(top * alpha + bottom * (1 - alpha))
				.toString(16)
				.padStart(2, "0");
		})
		.join("")}`;
}
function resolveAny(token: string, values: Record<string, string>): string {
	const seen = new Set<string>();
	while (values[token]?.startsWith("var(")) {
		if (seen.has(token)) throw new Error(`Cyclic theme token ${token}`);
		seen.add(token);
		token = values[token].slice(4, -1).trim();
	}
	const color = values[token];
	if (!/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(color ?? ""))
		throw new Error(`Missing theme color ${token}: ${color}`);
	return color;
}
// The Final editor (#146) moved the Media/Edit switch onto the dark top bar: the selected tab
// is the panel's wash under panel text, in both themes. The pair is read from the shell's own
// stylesheet so the check follows the real rule, and the wash is blended onto the panel.
describe("stable editor selected surface readability", () => {
	it("binds the regression to the actual selected Edit tab token pair", () => {
		const selected = editor.match(/\.modeSwitch button\[aria-selected="true"\]\s*\{([^}]+)}/)?.[1];
		expect(selected).toContain("background: var(--ds-on-panel-wash)");
		expect(selected).toContain("color: var(--ds-on-panel)");
	});
	it.each([
		"light",
		"dark",
	])("keeps the selected Edit foreground readable in the actual %s house palette", (theme) => {
		const values = {
			...declarations(house, ":root"),
			...(theme === "dark" ? declarations(house, '[data-sh-theme="dark"]') : {}),
			...declarations(bridge, ":root:root:root"),
		};
		const foreground = resolveAny("--ds-on-panel", values);
		const background = over(
			resolveAny("--ds-on-panel-wash", values),
			resolveAny("--ds-panel", values),
		);
		const [low, high] = [luminance(foreground), luminance(background)].sort((a, b) => a - b);
		expect((high + 0.05) / (low + 0.05), `${foreground} on ${background}`).toBeGreaterThanOrEqual(
			4.5,
		);
	});
});
