// @vitest-environment jsdom
import "@testing-library/jest-dom";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { I18nProvider } from "@/contexts/I18nContext";
import { nativeBridgeClient } from "@/native/client";
import { AiConnections } from "./AiConnections";

vi.mock("@/native/client", () => ({
	nativeBridgeClient: {
		aiEdition: { llmSetConfig: vi.fn(), llmSetApiKey: vi.fn(), llmRemoveApiKey: vi.fn() },
	},
}));
const scrollIntoViewDescriptor = Object.getOwnPropertyDescriptor(
	Element.prototype,
	"scrollIntoView",
);

beforeEach(() => {
	vi.clearAllMocks();
	Object.defineProperty(Element.prototype, "scrollIntoView", {
		configurable: true,
		value: vi.fn(),
	});
	Object.defineProperty(window, "electronAPI", {
		configurable: true,
		value: {
			showhowAiGuideStatus: async () => ({
				connected: true,
				model: "anthropic/claude-haiku-5.5",
				reviewed: false,
				options: { transcript: true, frames: true },
			}),
		},
	});
	vi.mocked(nativeBridgeClient.aiEdition.llmSetConfig).mockResolvedValue({ success: true });
	vi.mocked(nativeBridgeClient.aiEdition.llmSetApiKey).mockResolvedValue({ success: true });
	vi.mocked(nativeBridgeClient.aiEdition.llmRemoveApiKey).mockResolvedValue({ success: true });
});
afterEach(() => {
	cleanup();
	if (scrollIntoViewDescriptor) {
		Object.defineProperty(Element.prototype, "scrollIntoView", scrollIntoViewDescriptor);
	} else {
		Reflect.deleteProperty(Element.prototype, "scrollIntoView");
	}
});
const openModelPicker = async () => {
	const picker = await screen.findByRole("combobox", { name: "Model" });
	fireEvent.keyDown(picker, { key: "ArrowDown" });
	return picker;
};

it("shows the default model in a labelled picker and marks it in the options", async () => {
	render(
		<I18nProvider>
			<AiConnections />
		</I18nProvider>,
	);
	const picker = await screen.findByRole("combobox", { name: "Model" });
	expect(picker).toHaveTextContent("Claude Haiku 5.5");
	await openModelPicker();
	expect(await screen.findByRole("option", { name: /Claude Haiku 5\.5/ })).toHaveTextContent(
		"Default",
	);
	expect(screen.getAllByRole("option")).toHaveLength(6);
	expect(screen.getByText("anthropic/claude-opus-5.5")).toBeVisible();
	const gptOption = screen.getByRole("option", { name: "GPT-6.1 Sol" });
	expect(gptOption).toHaveTextContent("openai/gpt-6.1-sol");
	expect(gptOption).toHaveAttribute("aria-label", "GPT-6.1 Sol, openai/gpt-6.1-sol");
	const geminiOption = screen.getByRole("option", { name: "Gemini 4 Argon" });
	expect(geminiOption).toHaveTextContent("google/gemini-4-argon");
	expect(geminiOption).toHaveAttribute("aria-label", "Gemini 4 Argon, google/gemini-4-argon");
});

it("saves a listed model using its exact OpenRouter slug", async () => {
	render(
		<I18nProvider>
			<AiConnections />
		</I18nProvider>,
	);
	await openModelPicker();
	fireEvent.keyDown(await screen.findByRole("option", { name: "GPT-6.1 Sol" }), {
		key: "Enter",
	});
	fireEvent.click(screen.getByRole("button", { name: "Save connection" }));
	await waitFor(() =>
		expect(nativeBridgeClient.aiEdition.llmSetConfig).toHaveBeenCalledWith({
			provider: "openrouter",
			model: "openai/gpt-6.1-sol",
		}),
	);
});

it("shows the Other helper and saves a custom model slug exactly", async () => {
	render(
		<I18nProvider>
			<AiConnections />
		</I18nProvider>,
	);
	await openModelPicker();
	fireEvent.keyDown(await screen.findByRole("option", { name: "Other…" }), { key: "Enter" });
	expect(screen.getByText("Any model ID from openrouter.ai/models")).toBeVisible();
	fireEvent.change(screen.getByLabelText("Model slug"), {
		target: { value: "google/custom-flash" },
	});
	fireEvent.click(screen.getByRole("button", { name: "Save connection" }));
	await waitFor(() =>
		expect(nativeBridgeClient.aiEdition.llmSetConfig).toHaveBeenCalledWith({
			provider: "openrouter",
			model: "google/custom-flash",
		}),
	);
});

it("shows an unknown saved slug as Other and preserves its exact value", async () => {
	Object.defineProperty(window, "electronAPI", {
		configurable: true,
		value: {
			showhowAiGuideStatus: async () => ({
				connected: true,
				model: "vendor/unknown-model",
				reviewed: false,
				options: { transcript: true, frames: true },
			}),
		},
	});
	render(
		<I18nProvider>
			<AiConnections />
		</I18nProvider>,
	);
	expect(await screen.findByRole("combobox", { name: "Model" })).toHaveTextContent("Other…");
	expect(await screen.findByLabelText("Model slug")).toHaveValue("vendor/unknown-model");
});

it("saves/replaces and removes only OpenRouter credentials through upstream store IPC", async () => {
	render(
		<I18nProvider>
			<AiConnections />
		</I18nProvider>,
	);
	const picker = await screen.findByRole("combobox", { name: "Model" });
	expect(picker).toHaveTextContent("Claude Haiku 5.5");
	expect(screen.queryByText("Use your own OpenRouter API key.")).not.toBeInTheDocument();
	await openModelPicker();
	fireEvent.keyDown(await screen.findByRole("option", { name: "Other…" }), { key: "Enter" });
	fireEvent.change(screen.getByLabelText("OpenRouter API key"), {
		target: { value: "offline-test-key" },
	});
	fireEvent.change(screen.getByLabelText("Model slug"), {
		target: { value: "google/custom-flash" },
	});
	fireEvent.click(screen.getByRole("button", { name: "Save connection" }));
	await waitFor(() =>
		expect(nativeBridgeClient.aiEdition.llmSetApiKey).toHaveBeenCalledWith(
			"openrouter",
			"offline-test-key",
		),
	);
	expect(nativeBridgeClient.aiEdition.llmSetConfig).toHaveBeenCalledWith({
		provider: "openrouter",
		model: "google/custom-flash",
	});
	await waitFor(() => expect(screen.getByLabelText("OpenRouter API key")).toHaveValue(""));
	fireEvent.click(screen.getByRole("button", { name: "Remove key" }));
	await waitFor(() =>
		expect(nativeBridgeClient.aiEdition.llmRemoveApiKey).toHaveBeenCalledWith("openrouter"),
	);
});
