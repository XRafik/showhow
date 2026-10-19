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
	HudSheet,
	HudSourceButton,
} from "@/components/launch/HudControls";
import hudStyles from "@/components/launch/LaunchWindow.module.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "./Button";
import { Card } from "./Card";
import { EmptyState } from "./EmptyState";
import { Field } from "./Field";
import { LibraryRow } from "./LibraryRow";
import { Logo } from "./Logo";
import { Progress } from "./Progress";
import { Sheet } from "./Sheet";
import { Sidebar } from "./Sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./Tabs";
import { Tag } from "./Tag";
import { ShowhowToaster, showhowToast } from "./Toast";

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
					label="Start recording"
					text="Record"
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
			expect
				.soft(
					getComputedStyle(getByRole("tab", { name: "Editor typography" })).fontFamily,
					`${theme}: editor tab`,
				)
				.toMatch(/^"?Inter Tight"?[,]/);
			// The Final HUD sets its labels in JetBrains Mono capitals (HUD-03/04).
			for (const node of [
				getByText("Synthetic HUD source"),
				getByText("EN"),
				getByText("Record"),
			]) {
				const style = getComputedStyle(node);
				expect.soft(style.fontFamily, `${theme}: ${node.textContent}`).toContain("JetBrains Mono");
				expect.soft(style.textTransform, `${theme}: ${node.textContent}`).toBe("uppercase");
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
			// Final frames: a pressed toggle is a sage tint behind a sage glyph, like the mic.
			expect
				.soft(cursorBackground, `${theme}: pressed cursor background`)
				.toBe("rgba(130, 176, 154, 0.2)");
			expect.soft(cursorColor, `${theme}: pressed cursor glyph`).toBe("rgb(130, 176, 154)");
			const channels = (color: string) => (color.match(/[\d.]+/g) ?? []).map(Number);
			const panel = channels(getComputedStyle(getByTestId("house-hud")).backgroundColor);
			const [tr, tg, tb, ta = 1] = channels(cursorBackground);
			// What the eye sees: the tint laid over the bar's panel.
			const seenBackground = `rgb(${[tr, tg, tb].map((v, i) => v * ta + panel[i] * (1 - ta)).join(",")})`;
			const luminance = (color: string) => {
				const c = channels(color)
					.slice(0, 3)
					.map((v) => {
						const x = v / 255;
						return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
					});
				return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
			};
			const l = [luminance(cursorColor), luminance(seenBackground)].sort((a, b) => a - b);
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
			expect.soft(getComputedStyle(bar).borderRadius, `${theme}: HUD panel radius`).toBe("6px");
			expect
				.soft(getComputedStyle(bar).boxShadow, `${theme}: signature offset shadow`)
				.toBe("rgb(130, 176, 154) 4px 4px 0px 0px");
			expect
				.soft(getComputedStyle(getByRole("button", { name: "Synthetic HUD source" })).borderRadius)
				.toBe("4px");
			const record = getByRole("button", { name: "Start recording" });
			expect.soft(getComputedStyle(record).borderRadius).toBe("4px");
			expect
				.soft(getComputedStyle(record).backgroundColor, `${theme}: sage Record`)
				.toBe("rgb(130, 176, 154)");
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
		expect(getComputedStyle(getByTestId("house-hud")).borderRadius).toBe("8px");
		await expect
			.poll(
				() => getComputedStyle(getByRole("button", { name: "Synthetic HUD source" })).borderRadius,
			)
			.toBe("5px");
	} finally {
		document.documentElement.style.removeProperty("--ds-radius");
		unmount();
		if (prior === null) document.documentElement.removeAttribute("data-sh-theme");
		else document.documentElement.setAttribute("data-sh-theme", prior);
	}
});

it("uses the Final selected-row fill without a left bar in either theme", () => {
	const { rerender, getByRole, unmount } = render(
		<div data-sh-theme="light">
			<LibraryRow title="Final selected" meta="Desktop" selected onSelect={() => undefined} />
		</div>,
	);
	try {
		for (const theme of ["light", "dark"]) {
			rerender(
				<div data-sh-theme={theme}>
					<LibraryRow title="Final selected" meta="Desktop" selected onSelect={() => undefined} />
				</div>,
			);
			const row = getByRole("button", { name: /Final selected/ });
			const style = getComputedStyle(row);
			expect(style.backgroundColor).toBe("rgba(255, 252, 247, 0.1)");
			expect(style.borderLeftWidth).toBe("0px");
			expect(style.boxShadow).toBe("none");
		}
	} finally {
		unmount();
	}
});

it("renders Final secondary and ghost borders and recording meaning", () => {
	const { getByRole, unmount } = render(
		<div data-sh-theme="light">
			<Button variant="secondary">Final secondary</Button>
			<Button variant="ghost">Final ghost</Button>
		</div>,
	);
	try {
		const secondary = getComputedStyle(getByRole("button", { name: "Final secondary" }));
		const ghost = getComputedStyle(getByRole("button", { name: "Final ghost" }));
		expect.soft(secondary.backgroundColor).toBe("rgba(0, 0, 0, 0)");
		expect.soft(secondary.borderTopWidth).toBe("1px");
		expect.soft(ghost.borderTopWidth).toBe("0px");
	} finally {
		unmount();
	}
});

it("renders the Final logo signature shadow and sans compatibility typography", () => {
	const { getByRole, getByText, unmount } = render(
		<div data-sh-theme="light">
			<Logo withWordmark />
			<span style={{ fontFamily: "var(--ds-font-serif)" }}>Legacy display</span>
		</div>,
	);
	try {
		expect
			.soft(getComputedStyle(getByRole("img", { name: "Showhow" })).boxShadow)
			.toContain("rgb(130, 176, 154) 4px 4px 0px 0px");
		expect.soft(getComputedStyle(getByText("Showhow")).fontSize).toBe("17px");
		expect.soft(getComputedStyle(getByText("Legacy display")).fontFamily).toContain("Inter Tight");
	} finally {
		unmount();
	}
});

it("renders Final sheet, fields, tabs and failed progress in both themes with keyboard semantics", async () => {
	const prior = document.documentElement.getAttribute("data-sh-theme");
	try {
		for (const theme of ["light", "dark"]) {
			document.documentElement.setAttribute("data-sh-theme", theme);
			const { getByRole, unmount } = render(
				<Sheet title="Foundation sheet" open description="Synthetic shared controls">
					<Field label="Title" error="A title is needed" />
					<Tabs defaultValue="guide">
						<TabsList aria-label="Foundation outputs">
							<TabsTrigger value="guide">Guide output</TabsTrigger>
							<TabsTrigger value="brief">Brief output</TabsTrigger>
						</TabsList>
						<TabsContent value="guide">
							<Progress label="Failed generation" value={38} failed />
						</TabsContent>
						<TabsContent value="brief">Brief panel</TabsContent>
					</Tabs>
				</Sheet>,
			);
			try {
				const sheet = getByRole("dialog", { name: "Foundation sheet" });
				const style = getComputedStyle(sheet);
				if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
					expect(style.animationName).toBe("none");
					expect(style.transitionProperty).toBe("none");
					const overlay = sheet.previousElementSibling as HTMLElement;
					expect(getComputedStyle(overlay).animationName).toBe("none");
					expect(getComputedStyle(overlay).transitionProperty).toBe("none");
				}
				expect(style.backgroundColor).toBe(
					theme === "light" ? "rgb(255, 252, 247)" : "rgb(47, 47, 47)",
				);
				expect(style.borderRadius).toBe("10px");
				expect(style.boxShadow).toContain("rgb(130, 176, 154) 4px 4px 0px 0px");
				const input = getByRole("textbox", { name: "Title" });
				expect(getComputedStyle(input).fontFamily).toContain("Inter");
				expect(input.getAttribute("aria-invalid")).toBe("true");
				const progress = getByRole("progressbar", { name: "Failed generation" });
				expect(progress.getAttribute("aria-valuenow")).toBe("38");
				expect(getComputedStyle(progress.firstElementChild as HTMLElement).backgroundColor).toBe(
					theme === "light" ? "rgb(179, 67, 31)" : "rgb(242, 139, 107)",
				);
				const guide = getByRole("tab", { name: "Guide output" });
				expect(getComputedStyle(guide).borderBottomWidth).toBe("2px");
				expect(getComputedStyle(guide).borderBottomColor).toBe(
					theme === "light" ? "rgb(47, 47, 47)" : "rgb(255, 252, 247)",
				);
				guide.focus();
				fireEvent.keyDown(guide, { key: "ArrowRight" });
				await expect
					.poll(() => getByRole("tab", { name: "Brief output" }).getAttribute("aria-selected"))
					.toBe("true");
				expect(getByRole("tabpanel").textContent).toBe("Brief panel");
			} finally {
				unmount();
			}
		}
	} finally {
		if (prior === null) document.documentElement.removeAttribute("data-sh-theme");
		else document.documentElement.setAttribute("data-sh-theme", prior);
	}
});

function textContrast(foreground: string, background: string) {
	const fg = (foreground.match(/[\d.]+/g) ?? []).map(Number);
	const bg = (background.match(/[\d.]+/g) ?? []).map(Number);
	const alpha = fg[3] ?? 1;
	const luminance = (channels: number[]) => {
		const linear = channels.slice(0, 3).map((value) => {
			const x = value / 255;
			return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
		});
		return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
	};
	const ink = luminance(
		fg.slice(0, 3).map((value, index) => value * alpha + bg[index] * (1 - alpha)),
	);
	const surface = luminance(bg);
	return (Math.max(ink, surface) + 0.05) / (Math.min(ink, surface) + 0.05);
}

it("keeps enabled small foundation text readable in both themes", () => {
	const prior = document.documentElement.getAttribute("data-sh-theme");
	try {
		for (const theme of ["light", "dark"]) {
			document.documentElement.setAttribute("data-sh-theme", theme);
			const { getByRole, getByText, unmount } = render(
				<>
					<Sidebar libraryLabel="Readable library" />
					<Card eyebrow="Readable card" />
					<EmptyState title="Readable empty" body="Readable empty body" />
					<Sheet
						title="Readable sheet"
						eyebrow="Readable eyebrow"
						description="Readable description"
						open
					>
						<Field label="Readable field" />
						<Tabs defaultValue="one">
							<TabsList aria-label="Readable tabs">
								<TabsTrigger value="one">Active readable tab</TabsTrigger>
								<TabsTrigger value="two">Inactive readable tab</TabsTrigger>
							</TabsList>
						</Tabs>
					</Sheet>
				</>,
			);
			try {
				const surface = getComputedStyle(getByRole("dialog")).backgroundColor;
				for (const name of [
					"Readable field",
					"Inactive readable tab",
					"Readable eyebrow",
					"Readable description",
				]) {
					expect
						.soft(
							textContrast(getComputedStyle(getByText(name)).color, surface),
							`${theme}: ${name}`,
						)
						.toBeGreaterThanOrEqual(4.5);
				}
				// Radix hides the background from accessibility queries while the sheet is open.
				for (const [name, bg] of [
					["Readable card", theme === "light" ? "rgb(255,252,247)" : "rgb(47,47,47)"],
					["Readable empty body", theme === "light" ? "rgb(249,245,236)" : "rgb(54,54,54)"],
					["Readable library", theme === "light" ? "rgb(47,47,47)" : "rgb(36,36,36)"],
				]) {
					expect
						.soft(textContrast(getComputedStyle(getByText(name)).color, bg), `${theme}: ${name}`)
						.toBeGreaterThanOrEqual(4.5);
				}
			} finally {
				unmount();
			}
		}
	} finally {
		if (prior === null) document.documentElement.removeAttribute("data-sh-theme");
		else document.documentElement.setAttribute("data-sh-theme", prior);
	}
});

it("keeps the HUD recovery sheet's text readable in both themes", () => {
	const prior = document.documentElement.getAttribute("data-sh-theme");
	const idle = () => undefined;
	try {
		for (const theme of ["light", "dark"]) {
			document.documentElement.setAttribute("data-sh-theme", theme);
			const { getByRole, getByText, unmount } = render(
				<HudSheet
					eyebrow="Sheet eyebrow"
					title="Sheet title"
					description="Sheet description"
					hint="Sheet recovery hint"
					status="Sheet status"
					icon={null}
					closeLabel="Close"
					cancelLabel="Sheet cancel"
					primaryLabel="Sheet primary"
					onCancel={idle}
					onPrimary={idle}
				/>,
			);
			try {
				const surface = getComputedStyle(getByRole("dialog")).backgroundColor;
				for (const name of [
					"Sheet eyebrow",
					"Sheet title",
					"Sheet description",
					"Sheet recovery hint",
					"Sheet status",
					"Sheet cancel",
				]) {
					expect
						.soft(
							textContrast(getComputedStyle(getByText(name)).color, surface),
							`${theme}: ${name}`,
						)
						.toBeGreaterThanOrEqual(4.5);
				}
				const primary = getByRole("button", { name: "Sheet primary" });
				const primaryStyle = getComputedStyle(primary);
				expect
					.soft(textContrast(primaryStyle.color, primaryStyle.backgroundColor), `${theme}: primary`)
					.toBeGreaterThanOrEqual(4.5);
			} finally {
				unmount();
			}
		}
	} finally {
		if (prior === null) document.documentElement.removeAttribute("data-sh-theme");
		else document.documentElement.setAttribute("data-sh-theme", prior);
	}
});

it("renders actual Sonner notifications with Final surface and offset shadow", async () => {
	const prior = document.documentElement.getAttribute("data-sh-theme");
	const { getByText, unmount } = render(<ShowhowToaster />);
	try {
		showhowToast("Final toast evidence");
		await expect.poll(() => document.querySelector("[data-sonner-toast]") !== null).toBe(true);
		const toast = getByText("Final toast evidence").closest("[data-sonner-toast]") as HTMLElement;
		for (const theme of ["light", "dark"]) {
			document.documentElement.setAttribute("data-sh-theme", theme);
			expect
				.soft(getComputedStyle(toast).backgroundColor)
				.toBe(theme === "light" ? "rgb(47, 47, 47)" : "rgb(36, 36, 36)");
			expect
				.soft(getComputedStyle(toast).boxShadow)
				.toContain("rgb(130, 176, 154) 4px 4px 0px 0px");
			if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
				expect(getComputedStyle(toast).transitionProperty).toBe("none");
			}
		}
	} finally {
		unmount();
		if (prior === null) document.documentElement.removeAttribute("data-sh-theme");
		else document.documentElement.setAttribute("data-sh-theme", prior);
	}
});

it("removes control transitions when reduced motion is requested", () => {
	const { getByRole, unmount } = render(<Button>Reduced motion control</Button>);
	try {
		if (matchMedia("(prefers-reduced-motion: reduce)").matches)
			expect(
				getComputedStyle(getByRole("button", { name: "Reduced motion control" }))
					.transitionProperty,
			).toBe("none");
	} finally {
		unmount();
	}
});

it("keeps all enabled button and tag variants readable on their intended surfaces", () => {
	const prior = document.documentElement.getAttribute("data-sh-theme");
	const buttons = ["primary", "secondary", "ghost", "dark", "rec", "sidebar", "toolbar"] as const;
	const tags = ["neutral", "chip", "accent", "progress", "alert", "failed"] as const;
	try {
		for (const theme of ["light", "dark"]) {
			document.documentElement.setAttribute("data-sh-theme", theme);
			const { getByText, unmount } = render(
				<>
					{buttons.map((variant) => (
						<div
							key={variant}
							style={{
								background:
									variant === "sidebar" || variant === "toolbar"
										? "var(--ds-panel)"
										: "var(--ds-surface)",
							}}
						>
							<Button variant={variant}>{`Contrast button ${variant}`}</Button>
						</div>
					))}
					{tags.map((variant) => (
						<div
							key={variant}
							style={{
								background: variant === "neutral" ? "var(--ds-panel)" : "var(--ds-surface)",
							}}
						>
							<Tag variant={variant}>{`Contrast tag ${variant}`}</Tag>
						</div>
					))}
				</>,
			);
			try {
				for (const name of [
					...buttons.map((v) => `Contrast button ${v}`),
					...tags.map((v) => `Contrast tag ${v}`),
				]) {
					const el = getByText(name);
					const style = getComputedStyle(el);
					const parent = (
						getComputedStyle(el.parentElement as HTMLElement).backgroundColor.match(/[\d.]+/g) ?? []
					).map(Number);
					const bg = (style.backgroundColor.match(/[\d.]+/g) ?? []).map(Number);
					const a = bg[3] ?? 1;
					const backdrop = `rgb(${bg
						.slice(0, 3)
						.map((v, i) => v * a + parent[i] * (1 - a))
						.join(",")})`;
					expect
						.soft(
							textContrast(style.color, backdrop),
							`${theme}: ${name}, ${style.color} on ${backdrop}`,
						)
						.toBeGreaterThanOrEqual(4.5);
				}
			} finally {
				unmount();
			}
		}
	} finally {
		if (prior === null) document.documentElement.removeAttribute("data-sh-theme");
		else document.documentElement.setAttribute("data-sh-theme", prior);
	}
});

it("keeps active and failed progress graphics at 3:1 against the track in both themes", () => {
	const prior = document.documentElement.getAttribute("data-sh-theme");
	try {
		for (const theme of ["light", "dark"]) {
			document.documentElement.setAttribute("data-sh-theme", theme);
			const { getByRole, unmount } = render(
				<>
					<Progress label="Active graphical contrast" value={38} />
					<Progress label="Failed graphical contrast" value={38} failed />
				</>,
			);
			try {
				for (const label of ["Active graphical contrast", "Failed graphical contrast"]) {
					const track = getByRole("progressbar", { name: label });
					const fill = track.firstElementChild as HTMLElement;
					const fillColor = getComputedStyle(fill).backgroundColor;
					const trackColor = getComputedStyle(track).backgroundColor;
					expect
						.soft(
							textContrast(fillColor, trackColor),
							`${theme}: ${label}, ${fillColor} on ${trackColor}`,
						)
						.toBeGreaterThanOrEqual(3);
					expect(track.getAttribute("aria-valuenow")).toBe("38");
				}
			} finally {
				unmount();
			}
		}
	} finally {
		if (prior === null) document.documentElement.removeAttribute("data-sh-theme");
		else document.documentElement.setAttribute("data-sh-theme", prior);
	}
});
