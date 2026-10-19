// @vitest-environment jsdom
import "@testing-library/jest-dom";
import { act, cleanup, render as rtlRender, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@/contexts/I18nContext";
import type {
	AgentBrief,
	AgentBriefPreview,
	AgentBriefRunResult,
	AgentBriefStatus,
} from "@/lib/showhow/agentBrief";
import {
	AgentBriefPanel,
	AgentBriefSheets,
	CopyForAgentButton,
	useAgentBrief,
} from "./AgentBriefPanel";

const render = (node: ReactNode) => rtlRender(<I18nProvider>{node}</I18nProvider>);

function Harness({ bundleDir }: { bundleDir: string }) {
	const brief = useAgentBrief(bundleDir);
	return (
		<>
			<CopyForAgentButton brief={brief} />
			<AgentBriefPanel brief={brief} />
			<AgentBriefSheets brief={brief} />
		</>
	);
}

const saved: AgentBrief = {
	version: 1,
	title: "Publish button does nothing",
	requestedChange: { text: "Make Publish complete the post", sourceIds: ["2"] },
	observed: { text: "Clicking Publish leaves status at Draft", sourceIds: ["2"] },
	evidence: [
		{ sourceId: "1", ts: 12_000, text: "Draft selected" },
		{ sourceId: "2", ts: 31_000, text: "Publish clicked; status unchanged" },
	],
	unknowns: ["Whether a network request was sent"],
	provider: "openrouter",
	model: "fake/model",
	sourceRevision: "abc",
	madeAt: 1,
};
const base: AgentBriefStatus = {
	connected: true,
	model: "fake/model",
	reviewed: true,
	alwaysSend: true,
	options: { transcript: true, frames: true },
	state: "none",
};
const payload: AgentBriefPreview = {
	token: "brief-token",
	provider: "openrouter",
	model: "fake/model",
	wordCount: 4,
	transcript: [{ startMs: 31_000, text: "Publish does nothing here" }],
	frames: [],
	steps: [{ sourceId: "1", ts: 12_000, label: "Select the draft" }],
	options: { transcript: true, frames: true },
};

const calls: string[] = [];
const status = vi.fn<(bundleDir: string) => Promise<AgentBriefStatus>>();
const preview = vi.fn();
const consent = vi.fn();
const run = vi.fn<(bundleDir: string, token: string) => Promise<AgentBriefRunResult>>();
const cancel = vi.fn();
const copy = vi.fn();
let current: AgentBriefStatus = base;

beforeEach(() => {
	vi.clearAllMocks();
	calls.length = 0;
	current = base;
	status.mockImplementation(async () => {
		calls.push("status");
		return current;
	});
	preview.mockImplementation(async () => {
		calls.push("preview");
		return payload;
	});
	consent.mockImplementation(async () => {
		calls.push("consent");
		return { success: true };
	});
	run.mockImplementation(async () => {
		calls.push("run");
		current = { ...base, state: "ready", brief: saved };
		return { success: true };
	});
	cancel.mockResolvedValue({ success: true });
	copy.mockImplementation(async () => {
		calls.push("copy");
		return { success: true };
	});
	Object.defineProperty(window, "electronAPI", {
		configurable: true,
		value: {
			showhowAgentBriefStatus: status,
			showhowAgentBriefPreview: preview,
			showhowAgentBriefConsent: consent,
			showhowAgentBriefRun: run,
			showhowAgentBriefCancel: cancel,
			showhowAgentBriefCopy: copy,
			showhowOnAgentBriefProgress: () => () => undefined,
		},
	});
});
afterEach(() => {
	cleanup();
	vi.useRealTimers();
});

const copyButton = () =>
	screen.getByRole("button", { name: /copy for agent|making brief|copied/i });

describe("Copy for agent", () => {
	it("makes an absent brief first, then copies it, then shows copied feedback", async () => {
		render(<Harness bundleDir="/scratch/one" />);
		await screen.findByRole("heading", { name: "Make a brief for your agent" });
		Object.defineProperty(copyButton(), "offsetWidth", { configurable: true, value: 148 });
		await userEvent.click(copyButton());
		await screen.findByRole("button", { name: "Copied ✓" });
		expect(calls.filter((c) => c !== "status")).toEqual(["preview", "run", "copy"]);
		expect(copy).toHaveBeenCalledWith("/scratch/one");
		expect(copyButton()).toHaveStyle({ minWidth: "148px" });
		expect(screen.getByText("Brief + path on your clipboard")).toBeInTheDocument();
		expect(screen.getByText("Clicking Publish leaves status at Draft")).toBeInTheDocument();
	});

	it("resets the copied label after two seconds", async () => {
		current = { ...base, state: "ready", brief: saved };
		render(<Harness bundleDir="/scratch/one" />);
		await screen.findByText("Clicking Publish leaves status at Draft");
		vi.useFakeTimers({ shouldAdvanceTime: true });
		await userEvent.click(copyButton());
		await screen.findByRole("button", { name: "Copied ✓" });
		expect(run).not.toHaveBeenCalled();
		await act(async () => {
			vi.advanceTimersByTime(2000);
		});
		expect(copyButton()).toHaveAccessibleName("Copy for agent");
	});

	it("asks for a review of the brief payload before the first send", async () => {
		current = { ...base, reviewed: false, alwaysSend: false };
		render(<Harness bundleDir="/scratch/one" />);
		await userEvent.click(await screen.findByRole("button", { name: "Copy for agent" }));
		const dialog = await screen.findByRole("dialog", { name: "Check what's sent" });
		expect(dialog).toHaveTextContent("OpenRouter · fake/model");
		expect(run).not.toHaveBeenCalled();
		await userEvent.click(screen.getByRole("button", { name: "Make brief and copy" }));
		await screen.findByRole("button", { name: "Copied ✓" });
		expect(calls.filter((c) => c !== "status")).toEqual(["preview", "consent", "run", "copy"]);
		expect(consent).toHaveBeenCalledWith("/scratch/one", "brief-token", false);
	});

	it("sends the latest reviewed preview when option changes resolve out of order", async () => {
		current = { ...base, reviewed: false, alwaysSend: false };
		render(<Harness bundleDir="/scratch/one" />);
		await userEvent.click(await screen.findByRole("button", { name: "Make brief" }));
		await screen.findByRole("dialog", { name: "Check what's sent" });
		let slow!: (value: AgentBriefPreview) => void;
		preview
			.mockImplementationOnce(() => new Promise((resolve) => (slow = resolve)))
			.mockImplementationOnce(async () => ({ ...payload, token: "latest" }));
		await userEvent.click(screen.getByRole("checkbox", { name: "Send transcript" }));
		await userEvent.click(screen.getByRole("checkbox", { name: "Send transcript" }));
		await waitFor(() => expect(screen.getByRole("button", { name: "Make brief" })).toBeEnabled());
		await act(async () => slow({ ...payload, token: "stale" }));
		await userEvent.click(screen.getByRole("button", { name: "Make brief" }));
		await waitFor(() => expect(run).toHaveBeenCalledWith("/scratch/one", "latest"));
	});

	it("opens the connect sheet when no provider is connected", async () => {
		current = { ...base, connected: false };
		render(<Harness bundleDir="/scratch/one" />);
		await userEvent.click(await screen.findByRole("button", { name: "Copy for agent" }));
		expect(await screen.findByRole("button", { name: "Connect OpenRouter" })).toBeVisible();
		expect(preview).not.toHaveBeenCalled();
	});

	it.each([
		["provider", "Provider connection lost"],
		["invalid", "Response couldn't be validated"],
	])("does not copy or show copied after a %s failure", async (error, message) => {
		run.mockResolvedValueOnce({ success: false, error });
		render(<Harness bundleDir="/scratch/one" />);
		await userEvent.click(await screen.findByRole("button", { name: "Copy for agent" }));
		expect(await screen.findByRole("heading", { name: "Couldn't make the brief" })).toBeVisible();
		expect(screen.getByText(message)).toBeVisible();
		expect(copy).not.toHaveBeenCalled();
		expect(screen.queryByText("Copied ✓")).not.toBeInTheDocument();
	});

	it("reports a clipboard rejection without copied feedback", async () => {
		current = { ...base, state: "ready", brief: saved };
		copy.mockResolvedValueOnce({ success: false, reason: "error" });
		render(<Harness bundleDir="/scratch/one" />);
		await screen.findByText("Clicking Publish leaves status at Draft");
		await userEvent.click(copyButton());
		expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't copy");
		expect(screen.queryByText("Copied ✓")).not.toBeInTheDocument();
	});

	it("cancels a running brief and returns to not made without copying", async () => {
		let finish!: (result: AgentBriefRunResult) => void;
		run.mockImplementationOnce(() => new Promise((resolve) => (finish = resolve)));
		render(<Harness bundleDir="/scratch/one" />);
		await userEvent.click(await screen.findByRole("button", { name: "Copy for agent" }));
		expect(await screen.findByRole("heading", { name: "Making your brief" })).toBeVisible();
		expect(copyButton()).toHaveAccessibleName("Making brief…");
		expect(copyButton()).toHaveAttribute("aria-disabled", "true");
		await userEvent.click(copyButton());
		expect(preview).toHaveBeenCalledTimes(1);
		await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
		expect(cancel).toHaveBeenCalledWith("/scratch/one");
		await act(async () => finish({ success: false, cancelled: true }));
		expect(
			await screen.findByRole("heading", { name: "Make a brief for your agent" }),
		).toBeVisible();
		expect(copy).not.toHaveBeenCalled();
	});

	it("ignores a result that lands after another recording is selected", async () => {
		let finish!: (result: AgentBriefRunResult) => void;
		run.mockImplementationOnce(() => new Promise((resolve) => (finish = resolve)));
		const view = render(<Harness key="one" bundleDir="/scratch/one" />);
		await userEvent.click(await screen.findByRole("button", { name: "Copy for agent" }));
		await screen.findByRole("heading", { name: "Making your brief" });
		view.rerender(
			<I18nProvider>
				<Harness key="two" bundleDir="/scratch/two" />
			</I18nProvider>,
		);
		await act(async () => finish({ success: true }));
		await waitFor(() => expect(status).toHaveBeenCalledWith("/scratch/two"));
		expect(copy).not.toHaveBeenCalled();
		expect(screen.queryByText("Copied ✓")).not.toBeInTheDocument();
	});

	it("keeps showing the previous brief after a failed remake", async () => {
		current = { ...base, state: "ready", brief: saved };
		run.mockImplementationOnce(async () => {
			current = { ...base, state: "failed", error: "provider", brief: saved };
			return { success: false, error: "provider" };
		});
		render(<Harness bundleDir="/scratch/one" />);
		await userEvent.click(await screen.findByRole("button", { name: "Remake brief" }));
		expect(await screen.findByRole("heading", { name: "Couldn't make the brief" })).toBeVisible();
		expect(screen.getByText("Your previous brief is unchanged.")).toBeVisible();
		expect(screen.getByText("Clicking Publish leaves status at Draft")).toBeVisible();
	});
});

describe("Agent brief states", () => {
	it("renders a ready brief with evidence times and explicit unknowns", async () => {
		current = { ...base, state: "ready", brief: saved };
		render(<Harness bundleDir="/scratch/one" />);
		expect(await screen.findByText("Requested change")).toBeVisible();
		expect(screen.queryByText("Expected result")).not.toBeInTheDocument();
		expect(screen.getByText("0:31")).toBeVisible();
		expect(screen.getByText("Whether a network request was sent")).toBeVisible();
		expect(
			screen.getByText(
				"Copy includes the brief and the local bundle path. Give your agent access to that folder.",
			),
		).toBeVisible();
	});

	it("shows a run already making in main as making", async () => {
		current = { ...base, state: "making", phase: "writing" };
		render(<Harness bundleDir="/scratch/one" />);
		expect(await screen.findByText("Step 2 of 3")).toBeVisible();
	});
});
