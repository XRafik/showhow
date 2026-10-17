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
beforeEach(() => {
	vi.clearAllMocks();
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
afterEach(cleanup);
it("saves/replaces and removes only OpenRouter credentials through upstream store IPC", async () => {
	render(
		<I18nProvider>
			<AiConnections />
		</I18nProvider>,
	);
	await screen.findByDisplayValue("anthropic/claude-haiku-5.5");
	expect(screen.getByText("Default model: anthropic/claude-haiku-5.5")).toBeVisible();
	expect(screen.queryByText("ChatGPT")).not.toBeInTheDocument();
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
