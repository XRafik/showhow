import "@/index.css";
import { render, screen, waitFor } from "@testing-library/react";
import { expect, it } from "vitest";
import { NamingProgressStrip } from "./NamingProgressStrip";
import { SwapText } from "./SwapText";

it("overlays the previous and next title, then removes the previous text", async () => {
	const { rerender, unmount } = render(<SwapText value="Recording" className="w-[320px]" />);
	const root = screen.getByText("Recording").closest("[data-swap-text]");
	if (!root) throw new Error("SwapText root is missing");

	try {
		rerender(<SwapText value="Save the client workflow" className="w-[320px]" />);
		await waitFor(() => {
			expect(root.querySelectorAll("[data-swap-text-previous]")).toHaveLength(1);
			expect(root.querySelectorAll("[data-swap-text-current]")).toHaveLength(1);
		});
		const previous = root.querySelector<HTMLElement>("[data-swap-text-previous]");
		const current = root.querySelector<HTMLElement>("[data-swap-text-current]");
		if (!previous || !current) throw new Error("SwapText layers are missing");
		expect(previous.textContent).toBe("Recording");
		expect(current.textContent).toBe("Save the client workflow");
		expect(getComputedStyle(previous).transitionDuration).toBe("0.24s");
		expect(getComputedStyle(current).transitionDuration).toBe("0.24s");
		expect(["ease-out", "cubic-bezier(0, 0, 0.58, 1)"]).toContain(
			getComputedStyle(current).transitionTimingFunction,
		);
		expect(getComputedStyle(current).transform).toBe("none");
		expect(previous.getBoundingClientRect().left).toBe(current.getBoundingClientRect().left);
		expect(previous.getBoundingClientRect().top).toBe(current.getBoundingClientRect().top);
		await waitFor(() => expect(root.querySelector("[data-swap-text-previous]")).toBeNull(), {
			timeout: 1_000,
		});
		expect(root.textContent).toBe("Save the client workflow");
	} finally {
		unmount();
	}
});

it("scrolls repeating naming blocks across a fixed-width strip", () => {
	const { container } = render(
		<div className="h-[3px] w-[320px]">
			<NamingProgressStrip />
		</div>,
	);
	const strip = container.querySelector<HTMLElement>("[data-naming-progress-strip]");
	if (!strip) throw new Error("Naming progress strip is missing");
	const style = getComputedStyle(strip);
	expect(strip.getBoundingClientRect().width).toBe(320);
	expect(style.backgroundSize).toBe("42px 3px");
	expect(style.animationDuration).toBe("0.9s");
	expect(style.animationTimingFunction).toBe("steps(7)");
	expect(style.transform).toBe("none");
});
