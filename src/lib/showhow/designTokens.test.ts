import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { DS_TOKENS } from "./designTokens";

const css = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");
const tailwind = readFileSync(resolve(process.cwd(), "tailwind.config.cjs"), "utf8");

function blockFor(selector: string): string {
	const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const matches = [...css.matchAll(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, "g"))];
	expect(matches.length, `Missing CSS block for ${selector}`).toBeGreaterThan(0);
	return matches.map((match) => match[1]).join("\n");
}

describe("Showhow design tokens", () => {
	it("uses the approved orange and sans compatibility aliases", () => {
		expect(DS_TOKENS["ds-rec"].light).toBe("#E3582D");
		expect(DS_TOKENS["ds-rec-wash"].light).toBe("#E3582D1F");
		expect(DS_TOKENS["ds-font-serif"].light).toBe("Inter Tight");
		expect(css).not.toContain("Instrument Serif");
	});
	it("declares every light and dark manifest value in CSS", () => {
		const light = blockFor(":root");
		const dark = blockFor('[data-sh-theme="dark"]');

		for (const [name, token] of Object.entries(DS_TOKENS)) {
			const lightValue =
				token.type === "string" && name !== "ds-font-body" ? `"${token.light}"` : token.light;
			const darkValue =
				token.type === "string" && name !== "ds-font-body" ? `"${token.dark}"` : token.dark;
			expect(light).toContain(`--${name}: ${lightValue};`);
			expect(dark).toContain(`--${name}: ${darkValue};`);
		}

		const declarations = `${light}\n${dark}`.match(/--ds-[\w-]+\s*:/g) ?? [];
		expect(new Set(declarations.map((declaration) => declaration.replace(/\s*:$/, ""))).size).toBe(
			52,
		);
		expect(declarations).toHaveLength(104);
	});

	it("maps color and font tokens into Tailwind with kebab-case utility names", () => {
		const colors = Object.entries(DS_TOKENS).filter(([, token]) => token.type === "color");
		for (const [name] of colors) {
			// Utility class names must reproduce the token name verbatim minus the
			// `ds-` prefix, in kebab-case (bg-ds-on-panel-wash etc.). camelCase keys
			// would silently generate class names components never reference.
			const key = name.replace(/^ds-/, "");
			expect(tailwind).toMatch(new RegExp(`["']?${key}["']?:\\s*["']var\\(--${name}\\)["']`));
		}

		for (const [name, family] of Object.entries({
			body: "body",
			label: "label",
			display: "display",
			serif: "serif",
		})) {
			expect(tailwind).toMatch(new RegExp(`"ds-${family}":\\s*["']var\\(--ds-font-${name}\\)["']`));
		}
	});
});
