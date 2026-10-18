// @vitest-environment jsdom
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";
import { Card } from "./Card";
import { EmptyState } from "./EmptyState";
import { Field } from "./Field";
import { GuideStep } from "./GuideStep";
import { LibraryRow } from "./LibraryRow";
import { Logo } from "./Logo";
import { Progress } from "./Progress";
import { Sheet } from "./Sheet";
import { Shell } from "./Shell";
import { Sidebar } from "./Sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./Tabs";
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
		const variants = ["neutral", "chip", "accent", "progress", "alert", "failed"] as const;
		const { rerender } = render(<Tag variant={variants[0]}>Status</Tag>);
		for (const [index, variant] of variants.entries()) {
			rerender(<Tag variant={variant}>Status</Tag>);
			expect(screen.getByText("Status")).toHaveClass(
				[
					"bg-ds-on-panel-wash",
					"bg-ds-chip",
					"bg-ds-accent",
					"bg-ds-accent-tint",
					"bg-ds-rec-wash",
					"bg-ds-rec-ink",
				][index],
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
		expect(row).toHaveClass("bg-ds-on-panel-wash");
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

	it("renders numbered guide content, body-font quote, and actions", () => {
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
		expect(screen.getByText("A narrated step")).toHaveClass("font-ds-body");
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

describe("Final shared foundations", () => {
	it("keeps shell navigation and content in separate reachable landmarks", () => {
		render(
			<Shell sidebar={<aside aria-label="Recordings">Recordings</aside>}>
				<h1>Active recording</h1>
			</Shell>,
		);
		expect(screen.getByRole("complementary", { name: "Recordings" })).toBeInTheDocument();
		expect(screen.getByRole("main")).toContainElement(
			screen.getByRole("heading", { name: "Active recording" }),
		);
	});
	it("labels fields, forwards native input props, and links error text", () => {
		const onChange = vi.fn();
		render(
			<Field
				label="Recording title"
				defaultValue="Take one"
				onChange={onChange}
				error="Enter a title"
				required
			/>,
		);
		const input = screen.getByRole("textbox", { name: "Recording title" });
		expect(input).toBeRequired();
		expect(input).toHaveAttribute("aria-invalid", "true");
		expect(document.getElementById(input.getAttribute("aria-describedby") ?? "")).toHaveTextContent(
			"Enter a title",
		);
		fireEvent.change(input, { target: { value: "Take two" } });
		expect(onChange).toHaveBeenCalledOnce();
	});
	it("exposes progress values and preserves the last completed percentage on failure", () => {
		const { rerender } = render(<Progress label="Making guide" value={38} />);
		expect(screen.getByRole("progressbar", { name: "Making guide" })).toHaveAttribute(
			"aria-valuenow",
			"38",
		);
		rerender(<Progress label="Guide failed" value={38} failed />);
		expect(screen.getByRole("progressbar", { name: "Guide failed" })).toHaveAttribute(
			"aria-valuenow",
			"38",
		);
		expect(screen.getByRole("progressbar")).toHaveAttribute("data-state", "failed");
		rerender(<Progress label="Loading" />);
		expect(screen.getByRole("progressbar")).not.toHaveAttribute("aria-valuenow");
		rerender(<Progress label="Complete" value={120} />);
		expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
	});
	it("selects tabs and exposes only their matching panel", () => {
		render(
			<Tabs defaultValue="guide">
				<TabsList aria-label="Output">
					<TabsTrigger value="guide">Guide</TabsTrigger>
					<TabsTrigger value="brief">Agent brief</TabsTrigger>
				</TabsList>
				<TabsContent value="guide">Guide content</TabsContent>
				<TabsContent value="brief">Brief content</TabsContent>
			</Tabs>,
		);
		expect(screen.getByRole("tab", { name: "Guide" })).toHaveAttribute("aria-selected", "true");
		fireEvent.mouseDown(screen.getByRole("tab", { name: "Agent brief" }), {
			button: 0,
			ctrlKey: false,
		});
		expect(screen.getByRole("tabpanel")).toHaveTextContent("Brief content");
	});
	it("opens a named modal sheet, closes it with Escape and restores trigger focus", async () => {
		render(
			<Sheet
				title="Rename recording"
				trigger={<Button>Rename</Button>}
				footer={<Button>Save</Button>}
			>
				<Field label="New title" />
			</Sheet>,
		);
		const trigger = screen.getByRole("button", { name: "Rename" });
		trigger.focus();
		fireEvent.click(trigger);
		const dialog = screen.getByRole("dialog", { name: "Rename recording" });
		expect(dialog).toHaveAttribute("aria-modal", "true");
		expect(dialog).toContainElement(screen.getByRole("textbox", { name: "New title" }));
		await waitFor(() => expect(dialog).toContainElement(document.activeElement as HTMLElement));
		fireEvent.keyDown(document.activeElement ?? dialog, { key: "Escape" });
		await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
		await waitFor(() => expect(trigger).toHaveFocus());
	});
});
