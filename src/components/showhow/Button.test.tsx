// @vitest-environment jsdom
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { Plus } from "lucide-react";
import { describe, expect, it } from "vitest";
import { Button } from "./Button";

describe("Showhow Button", () => {
	it("renders its primary variant, icon, and accessible button name", () => {
		render(<Button icon={Plus}>Create recording</Button>);
		const button = screen.getByRole("button", { name: "Create recording" });
		expect(button).toHaveClass("bg-ds-accent", "text-ds-on-accent");
		expect(button.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
	});

	it("exposes token-backed utility classes for theme switching", () => {
		render(<Button>Primary</Button>);
		// These utilities read --ds-* custom properties, which change with the active theme.
		expect(screen.getByRole("button")).toHaveClass("bg-ds-accent");
	});
});
