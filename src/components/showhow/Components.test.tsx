// @vitest-environment jsdom
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";
import { Card } from "./Card";
import { EmptyState } from "./EmptyState";
import { GuideStep } from "./GuideStep";
import { LibraryRow } from "./LibraryRow";
import { Logo } from "./Logo";
import { Sidebar } from "./Sidebar";
import { Tag } from "./Tag";
import { ShowhowToaster, showhowToast } from "./Toast";
import { VideoPlayer } from "./VideoPlayer";

describe("Showhow reusable components", () => {
	it("renders the component set with light and dark theme attributes", () => {
		const components = (
			<>
				<Button>Primary</Button>
				<Tag>Neutral</Tag>
				<Logo />
				<LibraryRow title="Recording" meta="Today" onSelect={() => undefined} />
				<Sidebar libraryLabel="Recent" />
				<VideoPlayer src="video.mp4" durationMs={1000} />
				<GuideStep number={1} title="First step" />
				<Card title="Card">Content</Card>
				<ShowhowToaster />
				<EmptyState title="Empty" body="No items" />
			</>
		);
		const { rerender, getByTestId } = render(
			<div data-sh-theme="light" data-testid="theme-root">
				{components}
			</div>,
		);
		expect(getByTestId("theme-root")).toHaveAttribute("data-sh-theme", "light");
		expect(screen.getByRole("button", { name: "Primary" })).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "Empty" })).toBeInTheDocument();
		rerender(
			<div data-sh-theme="dark" data-testid="theme-root">
				{components}
			</div>,
		);
		expect(getByTestId("theme-root")).toHaveAttribute("data-sh-theme", "dark");
		expect(screen.getByRole("button", { name: "Primary" })).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "Empty" })).toBeInTheDocument();
	});

	it("renders every Tag status variant", () => {
		const variants = ["neutral", "chip", "accent", "progress", "alert"] as const;
		const { rerender } = render(<Tag variant={variants[0]}>Status</Tag>);
		for (const [index, variant] of variants.entries()) {
			rerender(<Tag variant={variant}>Status</Tag>);
			expect(screen.getByText("Status")).toHaveClass(
				["bg-ds-on-panel-wash", "bg-ds-chip", "bg-ds-accent", "bg-ds-accent-100", "bg-ds-rec-wash"][
					index
				],
			);
		}
	});

	it("renders accessible logo and optional wordmark", () => {
		render(<Logo withWordmark />);
		expect(screen.getByRole("img", { name: "Showhow" })).toBeInTheDocument();
		expect(screen.getByText("Showhow")).toBeInTheDocument();
	});

	it("marks and activates selected library rows and shows new badge", () => {
		const onSelect = vi.fn();
		render(<LibraryRow title="Recording" meta="Today" selected isNew onSelect={onSelect} />);
		const row = screen.getByRole("button", { name: /Recording/ });
		expect(row).toHaveClass("bg-ds-accent-tint");
		expect(row).toHaveAttribute("aria-current", "true");
		expect(screen.getByText("· NEW")).toBeInTheDocument();
		fireEvent.click(row);
		expect(onSelect).toHaveBeenCalledOnce();
	});

	it("renders Sidebar labels, handles primary action, and reserves bottom settings area", () => {
		const onPrimary = vi.fn();
		const onSettings = vi.fn();
		const { container } = render(
			<Sidebar
				primary={{ label: "New recording", onClick: onPrimary }}
				libraryLabel="Recent"
				settings={{ label: "Settings", onClick: onSettings }}
			>
				<LibraryRow title="First" meta="Today" onSelect={() => undefined} />
			</Sidebar>,
		);
		expect(screen.getByText("Recent")).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "New recording" }));
		expect(onPrimary).toHaveBeenCalledOnce();
		expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument();
		expect(container.querySelector("aside > .flex-1")).toBeInTheDocument();
	});

	it("toggles playback label and seeks its displayed time", () => {
		render(<VideoPlayer src="video.mp4" durationMs={65_000} />);
		fireEvent.click(screen.getByRole("button", { name: "Play" }));
		expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
		fireEvent.change(screen.getByRole("slider", { name: "Seek" }), { target: { value: "12000" } });
		expect(screen.getByText("0:12 / 1:05")).toBeInTheDocument();
	});

	it("renders numbered guide content, serif quote, and actions", () => {
		render(
			<GuideStep
				number={3}
				title="Choose a plan"
				quote="A narrated step"
				timestamp="0:12"
				actions={<span>Edit · Delete</span>}
			/>,
		);
		expect(screen.getByText("03")).toBeInTheDocument();
		expect(screen.getByText("Choose a plan")).toBeInTheDocument();
		expect(screen.getByText("A narrated step")).toHaveClass("font-ds-serif");
		expect(screen.getByText("Edit · Delete")).toBeInTheDocument();
		expect(screen.getByRole("article")).toBeInTheDocument();
	});

	it("renders card heading, body, and actions", () => {
		render(
			<Card eyebrow="Details" title="A card">
				Description
				<Action />
			</Card>,
		);
		expect(screen.getByText("Details")).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "A card" })).toBeInTheDocument();
		expect(screen.getByText("Description")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
	});

	it("shows styled sonner notifications", async () => {
		render(<ShowhowToaster />);
		showhowToast("Saved locally");
		await waitFor(() => expect(screen.getByText("Saved locally")).toBeInTheDocument());
	});

	it("renders empty-state title, body, and action", () => {
		render(
			<EmptyState
				title="Nothing here"
				body="Start by recording"
				action={<button type="button">Record</button>}
			/>,
		);
		expect(screen.getByRole("heading", { name: "Nothing here" })).toBeInTheDocument();
		expect(screen.getByText("Start by recording")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Record" })).toBeInTheDocument();
	});
});

function Action() {
	return <button type="button">Action</button>;
}
