// @vitest-environment jsdom
import "@testing-library/jest-dom";
import {
	act,
	cleanup,
	fireEvent,
	render as rtlRender,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { I18nProvider } from "@/contexts/I18nContext";
import type { GuidePreview, GuideStatus } from "@/lib/showhow/aiGuide";

const render = (node: ReactNode) => rtlRender(<I18nProvider>{node}</I18nProvider>);

import { AiGuidePanel } from "./AiGuidePanel";

const entry = {
	bundleDir: "/scratch/one",
	title: "Example",
	source: "desktop" as const,
	createdAt: 1,
	steps: [{ label: "Open", ts: 1000, screenshot: "" }],
};
const status = vi.fn();
const preview = vi.fn();
const run = vi.fn();
const consent = vi.fn();
const onChange = vi.fn();
const connected: GuideStatus = {
	connected: true,
	reviewed: false,
	model: "fake",
	options: { transcript: true, frames: true },
};
const payload: GuidePreview = {
	token: "reviewed-token",
	provider: "openrouter",
	model: "fake",
	wordCount: 2,
	transcript: [{ startMs: 1000, text: "Two words" }],
	frames: [],
	steps: [{ sourceId: "1", ts: 1000, label: "Open" }],
	options: { transcript: true, frames: true },
};
beforeEach(() => {
	vi.clearAllMocks();
	status.mockResolvedValue(connected);
	preview.mockResolvedValue(payload);
	run.mockResolvedValue({ success: true });
	consent.mockResolvedValue({ success: true });
	Object.defineProperty(window, "electronAPI", {
		configurable: true,
		value: {
			showhowAiGuideStatus: status,
			showhowAiGuidePreview: preview,
			showhowAiGuideRun: run,
			showhowAiGuideConsent: consent,
			showhowOnAiGuideProgress: () => () => undefined,
			showhowListRecordings: async () => [{ ...entry, title: "AI title" }],
		},
	});
});
afterEach(cleanup);
it("offers connection settings after guide failure without sending another request", async () => {
	status.mockResolvedValue({
		...connected,
		guide: { status: "failed", provider: "openrouter", model: "fake", editedSinceAi: false },
	});
	render(<AiGuidePanel entry={entry} onEntryChange={onChange} />);
	await screen.findByRole("heading", { name: "Couldn’t make the guide" });
	const change = screen.queryByRole("button", { name: "Change provider" });
	expect(change).not.toBeNull();
	if (!change) return;
	expect(screen.getByRole("progressbar")).not.toHaveAttribute("aria-valuenow");
	fireEvent.click(change);
	await screen.findByRole("heading", { name: "Settings" });
	expect(run).not.toHaveBeenCalled();
	expect(consent).not.toHaveBeenCalled();
});
it("#127 keeps evidence review out of ready output and reachable from edited Remake", async () => {
	status.mockResolvedValue({
		...connected,
		reviewed: true,
		guide: {
			status: "ready",
			provider: "openrouter",
			model: "fake",
			editedSinceAi: true,
		},
	});
	render(<AiGuidePanel entry={entry} onEntryChange={onChange} />);
	await screen.findByRole("button", { name: "Remake" });
	expect(screen.queryByRole("button", { name: "Check what gets sent" })).toBeNull();
	fireEvent.click(screen.getByRole("button", { name: "Remake" }));
	const dialog = await screen.findByRole("dialog");
	fireEvent.click(within(dialog).getByRole("button", { name: "Check what gets sent" }));
	await screen.findByRole("heading", { name: "Check what gets sent" });
	expect(run).not.toHaveBeenCalled();
	fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
	expect(screen.getByRole("button", { name: "Remake" })).toBeEnabled();
});

it("missing key shows only active OpenRouter plus disabled ChatGPT; cancel sends nothing", async () => {
	status.mockResolvedValue({ ...connected, connected: false });
	render(<AiGuidePanel entry={entry} onEntryChange={onChange} />);
	fireEvent.click(screen.getByRole("button", { name: "Make guide" }));
	expect(await screen.findByRole("heading", { name: "Connect AI to make guides" })).toBeVisible();
	expect(screen.getByRole("button", { name: "ChatGPT · Coming later" })).toBeDisabled();
	fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
	expect(run).not.toHaveBeenCalled();
	expect(preview).not.toHaveBeenCalled();
});

it("review toggles rebuild the payload, cancel sends nothing, acceptance persists consent then runs", async () => {
	render(<AiGuidePanel entry={entry} onEntryChange={onChange} />);
	fireEvent.click(screen.getByRole("button", { name: "Make guide" }));
	expect(await screen.findByRole("heading", { name: "Check what gets sent" })).toBeVisible();
	expect(screen.getByText("Transcript · 2 words")).toBeVisible();
	fireEvent.click(screen.getByRole("checkbox", { name: "Send transcript" }));
	await waitFor(() =>
		expect(preview).toHaveBeenLastCalledWith(entry.bundleDir, { transcript: false, frames: true }),
	);
	fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
	expect(run).not.toHaveBeenCalled();
	fireEvent.click(screen.getByRole("button", { name: "Make guide" }));
	await screen.findByRole("heading", { name: "Check what gets sent" });
	fireEvent.click(screen.getAllByRole("button", { name: "Make guide" }).at(-1)!);
	await waitFor(() =>
		expect(consent).toHaveBeenCalledWith(entry.bundleDir, "reviewed-token", true),
	);
	await waitFor(() => expect(run).toHaveBeenCalledWith(entry.bundleDir, "reviewed-token"));
	await waitFor(() =>
		expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ title: "AI title" })),
	);
});
it("edited Remake confirms, cancel preserves, unedited Remake and Retry skip review", async () => {
	status.mockResolvedValue({
		...connected,
		reviewed: true,
		guide: { status: "ready", provider: "openrouter", model: "fake", editedSinceAi: true },
	});
	render(<AiGuidePanel entry={entry} onEntryChange={onChange} />);
	fireEvent.click(await screen.findByRole("button", { name: "Remake" }));
	expect(await screen.findByRole("heading", { name: "Remake the guide?" })).toBeVisible();
	fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
	expect(run).not.toHaveBeenCalled();
	status.mockResolvedValue({
		...connected,
		reviewed: true,
		guide: { status: "ready", provider: "openrouter", model: "fake", editedSinceAi: false },
	});
	run.mockResolvedValueOnce({ success: false });
	fireEvent.click(screen.getByRole("button", { name: "Remake" }));
	expect(await screen.findByRole("heading", { name: "Couldn’t make the guide" })).toBeVisible();
	expect(screen.queryByRole("heading", { name: "Check what gets sent" })).not.toBeInTheDocument();
	fireEvent.click(screen.getByRole("button", { name: "Retry" }));
	await waitFor(() => expect(run).toHaveBeenCalledTimes(2));
});

it("shows real making phases without partial steps, and the narration/no-speech ready notices", async () => {
	let finish: (value: { success: boolean }) => void = () => undefined;
	run.mockImplementation(
		() =>
			new Promise((resolve) => {
				finish = resolve;
			}),
	);
	status.mockResolvedValue({
		...connected,
		reviewed: true,
		guide: { status: "ready", provider: "openrouter", model: "fake", editedSinceAi: true },
	});
	render(<AiGuidePanel entry={entry} onEntryChange={onChange} />);
	fireEvent.click(await screen.findByRole("button", { name: "Remake" }));
	await screen.findByRole("heading", { name: "Remake the guide?" });
	fireEvent.click(screen.getAllByRole("button", { name: "Remake" }).at(-1)!);
	expect(await screen.findByRole("heading", { name: "Making your guide" })).toBeVisible();
	status.mockResolvedValue({
		...connected,
		reviewed: true,
		narrationOnly: true,
		noSpeech: false,
		guide: { status: "ready", provider: "openrouter", model: "fake", editedSinceAi: false },
	});
	finish({ success: true });
	expect(await screen.findByText(/No clicks were captured/)).toBeVisible();
});
it("shows clicks-only no-speech notice without blocking the guide", async () => {
	status.mockResolvedValue({
		...connected,
		noSpeech: true,
		guide: { status: "ready", provider: "openrouter", model: "fake", editedSinceAi: false },
	});
	render(<AiGuidePanel entry={entry} onEntryChange={onChange} />);
	expect(await screen.findByRole("heading", { name: "No speech found" })).toBeVisible();
	expect(screen.getByRole("button", { name: "Remake" })).toBeEnabled();
});

it("keeps consent once per provider even when the stored send preference is unchecked", async () => {
	status.mockResolvedValue({
		...connected,
		reviewed: true,
		alwaysSend: false,
		guide: { status: "ready", provider: "openrouter", model: "fake", editedSinceAi: false },
	});
	render(<AiGuidePanel entry={entry} onEntryChange={onChange} />);
	fireEvent.click(await screen.findByRole("button", { name: "Remake" }));
	await waitFor(() => expect(run).toHaveBeenCalledWith(entry.bundleDir, "reviewed-token"));
	expect(screen.queryByRole("heading", { name: "Check what gets sent" })).not.toBeInTheDocument();
	expect(consent).not.toHaveBeenCalled();
});

function pending<T>() {
	let resolve!: (value: T) => void;
	let reject!: (error: Error) => void;
	const promise = new Promise<T>((yes, no) => {
		resolve = yes;
		reject = no;
	});
	return { promise, resolve, reject };
}
it.each([
	"resolve",
	"reject",
] as const)("round1 finding1: Cancel clears a pending option preview and ignores its stale %s", async (outcome) => {
	const old = pending<GuidePreview>();
	preview
		.mockResolvedValueOnce(payload)
		.mockReturnValueOnce(old.promise)
		.mockResolvedValue(payload);
	render(<AiGuidePanel entry={entry} onEntryChange={onChange} />);
	fireEvent.click(screen.getByRole("button", { name: "Make guide" }));
	await screen.findByText("Transcript · 2 words");
	fireEvent.click(screen.getByRole("checkbox", { name: "Send frames" }));
	fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
	await act(async () => {
		if (outcome === "resolve") old.resolve(payload);
		else old.reject(new Error("stale preview failure"));
	});
	expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	expect(screen.getByRole("button", { name: "Make guide" })).toBeEnabled();
	expect(screen.getByRole("button", { name: "Check what gets sent" })).toBeEnabled();
	expect(run).not.toHaveBeenCalled();
	expect(consent).not.toHaveBeenCalled();
	fireEvent.click(screen.getByRole("button", { name: "Make guide" }));
	await screen.findByText("Transcript · 2 words");
	expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it.each([
	"resolve",
	"reject",
] as const)("round1 finding1: stale cancelled %s cannot unlock or contaminate a newer review", async (outcome) => {
	const old = pending<GuidePreview>();
	const fresh = pending<GuidePreview>();
	preview
		.mockResolvedValueOnce(payload)
		.mockReturnValueOnce(old.promise)
		.mockReturnValueOnce(fresh.promise);
	render(<AiGuidePanel entry={entry} onEntryChange={onChange} />);
	fireEvent.click(screen.getByRole("button", { name: "Make guide" }));
	await screen.findByText("Transcript · 2 words");
	fireEvent.click(screen.getByRole("checkbox", { name: "Send frames" }));
	fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
	fireEvent.click(screen.getByRole("button", { name: "Check what gets sent" }));
	await waitFor(() => expect(preview).toHaveBeenCalledTimes(3));
	await act(async () => {
		if (outcome === "resolve")
			old.resolve({ ...payload, token: "old-cancelled-token", wordCount: 999 });
		else old.reject(new Error("cancelled old request"));
	});
	const dialog = screen.getByRole("dialog");
	expect(within(dialog).getByRole("button", { name: "Make guide" })).toBeDisabled();
	expect(within(dialog).queryByRole("alert")).not.toBeInTheDocument();
	await act(async () => fresh.resolve({ ...payload, token: "new-review-token" }));
	expect(within(dialog).getByRole("button", { name: "Make guide" })).toBeEnabled();
	expect(run).not.toHaveBeenCalled();
	expect(consent).not.toHaveBeenCalled();
	fireEvent.click(within(dialog).getByRole("button", { name: "Make guide" }));
	await waitFor(() => expect(run).toHaveBeenCalledWith(entry.bundleDir, "new-review-token"));
	expect(run).not.toHaveBeenCalledWith(entry.bundleDir, "old-cancelled-token");
});
it.each(
	["Make guide", "Check what gets sent"].flatMap((trigger) =>
		["Cancel", "Escape", "Close"].map((method) => ({ trigger, method })),
	),
)("round1 finding2: $method returns Radix review focus to $trigger", async ({
	trigger,
	method,
}) => {
	const user = userEvent.setup();
	render(<AiGuidePanel entry={entry} onEntryChange={onChange} />);
	const button = screen.getByRole("button", { name: trigger });
	button.focus();
	await user.click(button);
	const dialog = await screen.findByRole("dialog");
	await screen.findByText("Transcript · 2 words");
	expect(dialog.contains(document.activeElement)).toBe(true);
	await user.tab({ shift: true });
	expect(dialog.contains(document.activeElement)).toBe(true);
	if (method === "Escape") await user.keyboard("{Escape}");
	else await user.click(within(dialog).getByRole("button", { name: method }));
	await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
	await waitFor(() => expect(button).toHaveFocus());
	expect(run).not.toHaveBeenCalled();
	expect(consent).not.toHaveBeenCalled();
	await user.tab({ shift: trigger === "Check what gets sent" });
	expect(
		screen.getByRole("button", {
			name: trigger === "Make guide" ? "Check what gets sent" : "Make guide",
		}),
	).toHaveFocus();
});
it.each([
	"Escape",
	"Close",
])("round1 finding2: nested connection settings %s returns focus to Connect OpenRouter", async (method) => {
	status.mockResolvedValue({ ...connected, connected: false });
	const user = userEvent.setup();
	render(<AiGuidePanel entry={entry} onEntryChange={onChange} />);
	const make = screen.getByRole("button", { name: "Make guide" });
	await user.click(make);
	const connect = await screen.findByRole("button", { name: "Connect OpenRouter" });
	await user.click(connect);
	await screen.findByRole("heading", { name: "Settings" });
	const dialog = screen.getByRole("dialog");
	expect(dialog.contains(document.activeElement)).toBe(true);
	if (method === "Escape") await user.keyboard("{Escape}");
	else await user.click(within(dialog).getByRole("button", { name: "Close" }));
	await screen.findByRole("heading", { name: "Connect AI to make guides" });
	await waitFor(() => expect(connect).toHaveFocus());
	await user.click(screen.getByRole("button", { name: "Cancel" }));
	await waitFor(() => expect(make).toHaveFocus());
});

it("#200 a recording with no clicks and no speech shows an empty state, not a make action", async () => {
	status.mockResolvedValue({ ...connected, noInput: true });
	render(<AiGuidePanel entry={entry} onEntryChange={onChange} />);
	expect(
		await screen.findByRole("heading", { name: "No clicks or speech to turn into a guide" }),
	).toBeVisible();
	expect(
		screen.getByText(
			"This recording has no clicks and no speech, so there is nothing to turn into a guide. Record again with the microphone on, or narrate while you click.",
		),
	).toBeVisible();
	// Make guide is offered as disabled, never a run that fails at the pre-model guard.
	expect(screen.getByRole("button", { name: "Make guide" })).toBeDisabled();
	expect(screen.queryByRole("button", { name: "Check what gets sent" })).toBeNull();
	fireEvent.click(screen.getByRole("button", { name: "Make guide" }));
	expect(preview).not.toHaveBeenCalled();
	expect(run).not.toHaveBeenCalled();
	// The normal intro card is not shown alongside the empty state.
	expect(screen.queryByRole("heading", { name: "Turn this recording into a guide" })).toBeNull();
});

it("#200 the guide review sheet does not send a payload with no transcript, no frames and no steps", async () => {
	// status has no input flag, but the built payload is empty: the sheet gate must refuse.
	status.mockResolvedValue({ ...connected, reviewed: false });
	preview.mockResolvedValue({ ...payload, wordCount: 0, transcript: [], frames: [], steps: [] });
	render(<AiGuidePanel entry={entry} onEntryChange={onChange} />);
	fireEvent.click(screen.getByRole("button", { name: "Make guide" }));
	const dialog = await screen.findByRole("dialog", { name: "Check what gets sent" });
	expect(screen.getByText("Transcript \u00b7 0 words")).toBeVisible();
	expect(within(dialog).getByRole("button", { name: "Make guide" })).toBeDisabled();
});
