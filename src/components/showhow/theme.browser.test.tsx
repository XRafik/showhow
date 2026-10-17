// @vitest-environment jsdom
import "@/index.css";
import "@/lib/showhow/upstreamTheme.css";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import editorStyles from "@/components/ai-edition/v4/EditorShellV4.module.css";
import {
	HudCursorButton,
	HudLanguageButton,
	HudMicButton,
	HudRecordButton,
	HudSourceButton,
} from "@/components/launch/HudControls";
import hudStyles from "@/components/launch/LaunchWindow.module.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "./Button";
import { Card } from "./Card";
import { EmptyState } from "./EmptyState";

describe("Showhow design tokens in a browser", () => {
	it("renders Button, Card, and EmptyState with light and dark computed token values", () => {
		const { rerender } = render(
			<div data-sh-theme="light" data-testid="browser-theme-root">
				<Button variant="primary">Button token</Button>
				<Card title="Card token">Card content</Card>
				<EmptyState title="Empty token" body="Token check" />
			</div>,
		);
		expect(screen.getByTestId("browser-theme-root").getAttribute("data-sh-theme")).toBe("light");
		const button = screen.getByRole("button", { name: "Button token" });
		const card = screen.getByRole("heading", { name: "Card token" }).parentElement;
		const emptyState = screen.getByRole("heading", { name: "Empty token" }).parentElement;
		expect(card).not.toBeNull();
		expect(emptyState).not.toBeNull();
		expect((card as HTMLElement).classList.contains("bg-ds-surface")).toBe(true);
		expect((emptyState as HTMLElement).classList.contains("bg-ds-surface-raised")).toBe(true);
		const lightCardColor = window.getComputedStyle(card as HTMLElement).backgroundColor;
		const lightEmptyStateColor = window.getComputedStyle(emptyState as HTMLElement).backgroundColor;
		expect(button.classList.contains("bg-ds-accent")).toBe(true);
		expect(lightCardColor).toBe("rgb(255, 252, 247)");
		expect(lightEmptyStateColor).toBe("rgb(249, 245, 236)");

		rerender(
			<div data-sh-theme="dark" data-testid="browser-theme-root">
				<Button variant="primary">Button token</Button>
				<Card title="Card token">Card content</Card>
				<EmptyState title="Empty token" body="Token check" />
			</div>,
		);
		expect(screen.getByTestId("browser-theme-root").getAttribute("data-sh-theme")).toBe("dark");
		const darkButton = screen.getByRole("button", { name: "Button token" });
		const darkCard = screen.getByRole("heading", { name: "Card token" }).parentElement;
		const darkEmptyState = screen.getByRole("heading", { name: "Empty token" }).parentElement;
		expect(darkCard).not.toBeNull();
		expect(darkEmptyState).not.toBeNull();
		expect((darkCard as HTMLElement).classList.contains("bg-ds-surface")).toBe(true);
		expect((darkEmptyState as HTMLElement).classList.contains("bg-ds-surface-raised")).toBe(true);
		const darkCardColor = window.getComputedStyle(darkCard as HTMLElement).backgroundColor;
		const darkEmptyStateColor = window.getComputedStyle(
			darkEmptyState as HTMLElement,
		).backgroundColor;
		expect(darkButton.classList.contains("bg-ds-accent")).toBe(true);
		expect(darkCardColor).toBe("rgb(47, 47, 47)");
		expect(darkEmptyStateColor).toBe("rgb(54, 54, 54)");
		expect(darkCardColor).not.toBe(lightCardColor);
		expect(darkEmptyStateColor).not.toBe(lightEmptyStateColor);
	});
});

it("keeps the real stable selected Edit tab readable in both house themes", () => {
	const prior = document.documentElement.getAttribute("data-sh-theme");
	const { getByRole, unmount } = render(
		<div className={editorStyles.modeSwitch}>
			<button type="button" role="tab" aria-selected="true">
				Selected Edit contrast
			</button>
		</div>,
	);
	const selected = getByRole("tab", { name: "Selected Edit contrast" });
	const luminance = (color: string) => {
		const channels = (color.match(/[\d.]+/g) ?? [])
			.slice(0, 3)
			.map(Number)
			.map((value) => {
				const channel = value / 255;
				return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
			});
		return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
	};
	try {
		for (const theme of ["light", "dark"]) {
			document.documentElement.setAttribute("data-sh-theme", theme);
			const computed = getComputedStyle(selected);
			const values = [luminance(computed.color), luminance(computed.backgroundColor)].sort(
				(a, b) => a - b,
			);
			expect(
				(values[1] + 0.05) / (values[0] + 0.05),
				`${theme}: ${computed.color} on ${computed.backgroundColor}`,
			).toBeGreaterThanOrEqual(4.5);
		}
	} finally {
		unmount();
		if (prior === null) document.documentElement.removeAttribute("data-sh-theme");
		else document.documentElement.setAttribute("data-sh-theme", prior);
	}
});

it("renders real HUD labels and editor text in Inter Tight with house HUD surfaces", async () => {
	const prior = document.documentElement.getAttribute("data-sh-theme");
	const idle = () => undefined;
	let cursorClicks = 0;
	const cursorClick = () => {
		cursorClicks += 1;
	};
	const { getByRole, getByText, getByTestId, unmount } = render(
		<TooltipProvider>
			<div data-tray-layout="horizontal" className={hudStyles.hudBar} data-testid="house-hud">
				<HudSourceButton
					vertical={false}
					label="Synthetic HUD source"
					tooltip="Select source"
					disabled={false}
					onClick={idle}
				/>
				<HudLanguageButton
					vertical={false}
					code="EN"
					label="Transcript language"
					disabled={false}
					expanded={false}
					onClick={idle}
					buttonRef={{ current: null }}
				/>
				<HudCursorButton
					editableOverlay={true}
					locked={false}
					name="Editable HUD cursor"
					tooltip="Editable cursor"
					onClick={cursorClick}
				/>
				<HudCursorButton
					editableOverlay={false}
					locked={false}
					name="Native HUD cursor"
					tooltip="Native cursor"
					onClick={cursorClick}
				/>
				<HudCursorButton
					editableOverlay={true}
					locked={true}
					name="Locked HUD cursor"
					tooltip="Locked cursor"
					onClick={cursorClick}
				/>
				<HudMicButton
					enabled={true}
					locked={false}
					name="HUD microphone enabled"
					tooltip="Microphone enabled"
					onClick={idle}
				/>
				<HudRecordButton
					recording={false}
					paused={false}
					saving={false}
					elapsedSeconds={0}
					label="Start recording"
					savingLabel="Saving"
					onClick={idle}
				/>
			</div>
			<div className={editorStyles.app}>
				<div className={editorStyles.modeSwitch}>
					<button type="button" role="tab" aria-selected="true">
						Editor typography
					</button>
				</div>
			</div>
			<div data-sh-theme="light">
				<Button>Unchanged library control</Button>
			</div>
		</TooltipProvider>,
	);
	try {
		expect((await document.fonts.load('500 13px "Inter Tight"')).length).toBeGreaterThan(0);
		const libraryControl = getByRole("button", { name: "Unchanged library control" });
		expect(getComputedStyle(libraryControl).fontFamily).toContain("JetBrains Mono");
		expect(getComputedStyle(libraryControl).borderRadius).toBe("4px");
		for (const theme of ["light", "dark"]) {
			document.documentElement.setAttribute("data-sh-theme", theme);
			for (const node of [
				getByText("Synthetic HUD source"),
				getByText("EN"),
				getByRole("tab", { name: "Editor typography" }),
			]) {
				expect
					.soft(getComputedStyle(node).fontFamily, `${theme}: ${node.textContent}`)
					.toMatch(/^"?Inter Tight"?[,]/);
			}
			const activeMic = getByRole("button", { name: "HUD microphone enabled" }).querySelector(
				"svg",
			);
			expect(activeMic).not.toBeNull();
			expect
				.soft(getComputedStyle(activeMic as SVGElement).color, `${theme}: active HUD toggle`)
				.toBe("rgb(130, 176, 154)");
			const cursor = getByRole("button", { name: "Editable HUD cursor" });
			const cursorGlyph = cursor.querySelector("svg");
			expect(cursorGlyph).not.toBeNull();
			const cursorColor = getComputedStyle(cursorGlyph as SVGElement).color;
			const cursorBackground = getComputedStyle(cursor).backgroundColor;
			expect.soft(cursorBackground, `${theme}: solid cursor background`).toBe("rgb(130, 176, 154)");
			expect.soft(cursorColor, `${theme}: solid cursor glyph`).toBe("rgb(47, 47, 47)");
			const luminance = (color: string) => {
				const c = (color.match(/[\d.]+/g) ?? [])
					.slice(0, 3)
					.map(Number)
					.map((v) => {
						const x = v / 255;
						return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
					});
				return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
			};
			const l = [luminance(cursorColor), luminance(cursorBackground)].sort((a, b) => a - b);
			expect
				.soft((l[1] + 0.05) / (l[0] + 0.05), `${theme}: active cursor icon contrast`)
				.toBeGreaterThanOrEqual(3);
			expect(getByRole("button", { name: "Native HUD cursor" }).getAttribute("aria-pressed")).toBe(
				"false",
			);
			expect(
				getComputedStyle(getByRole("button", { name: "Native HUD cursor" })).backgroundColor,
			).toBe("rgba(0, 0, 0, 0)");
			const bar = getByTestId("house-hud");
			expect
				.soft(getComputedStyle(bar).backgroundColor, `${theme}: HUD panel`)
				.toBe(theme === "light" ? "rgb(47, 47, 47)" : "rgb(36, 36, 36)");
			expect
				.soft(getComputedStyle(getByText("Synthetic HUD source")).color, `${theme}: HUD label`)
				.toBe("rgb(255, 252, 247)");
			expect.soft(getComputedStyle(bar).borderRadius, `${theme}: HUD panel radius`).toBe("17px");
			expect
				.soft(getComputedStyle(getByRole("button", { name: "Synthetic HUD source" })).borderRadius)
				.toBe("10px");
			expect
				.soft(getComputedStyle(getByRole("button", { name: "Start recording" })).borderRadius)
				.toBe("17px");
		}
		const cursor = getByRole("button", { name: "Editable HUD cursor" });
		expect(cursor.getAttribute("aria-pressed")).toBe("true");
		fireEvent.click(cursor);
		fireEvent.click(getByRole("button", { name: "Native HUD cursor" }));
		expect(cursorClicks).toBe(2);
		expect(getByRole("button", { name: "Locked HUD cursor" }).getAttribute("aria-disabled")).toBe(
			"true",
		);
		fireEvent.click(getByRole("button", { name: "Locked HUD cursor" }));
		expect(cursorClicks).toBe(2);
		document.documentElement.style.setProperty("--ds-radius", "10");
		expect(getComputedStyle(getByTestId("house-hud")).borderRadius).toBe("19px");
		await expect
			.poll(
				() => getComputedStyle(getByRole("button", { name: "Synthetic HUD source" })).borderRadius,
			)
			.toBe("12px");
	} finally {
		document.documentElement.style.removeProperty("--ds-radius");
		unmount();
		if (prior === null) document.documentElement.removeAttribute("data-sh-theme");
		else document.documentElement.setAttribute("data-sh-theme", prior);
	}
});
