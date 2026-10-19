// @vitest-environment jsdom
import "@testing-library/jest-dom";
import { cleanup, render as rtlRender, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@/contexts/I18nContext";
import { SettingsView } from "./SettingsView";

const render = (node: ReactNode) => rtlRender(<I18nProvider>{node}</I18nProvider>);
const guideStatus = vi.fn();
const getPrefs = vi.fn();
const setPrefs = vi.fn();
const info = vi.fn();
let prefsListener: ((prefs: { hideDesktopIcons: boolean }) => void) | undefined;

beforeEach(() => {
	vi.clearAllMocks();
	localStorage.clear();
	guideStatus.mockResolvedValue({ connected: false, model: "anthropic/claude-haiku-5.5" });
	getPrefs.mockResolvedValue({ hideDesktopIcons: false, micEnabled: true });
	setPrefs.mockImplementation(async (patch: object) => ({
		hideDesktopIcons: false,
		micEnabled: true,
		...patch,
	}));
	info.mockResolvedValue({ recordingsFolder: "~/Showhow/Recordings" });
	Object.defineProperty(window, "electronAPI", {
		configurable: true,
		value: {
			showhowAiGuideStatus: guideStatus,
			getRecordingPrefs: getPrefs,
			setRecordingPrefs: setPrefs,
			onRecordingPrefsChanged: (callback: typeof prefsListener) => {
				prefsListener = callback;
				return () => undefined;
			},
			showhowSettingsInfo: info,
			showhowGetSystemTheme: async () => true,
		},
	});
});
afterEach(cleanup);

const tab = (name: string) => userEvent.click(screen.getByRole("tab", { name }));

describe("SettingsView", () => {
	it("opens on AI connections with the five sections as tabs", async () => {
		render(<SettingsView />);
		expect(screen.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
		expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual([
			"AI connections",
			"Recording",
			"Transcription",
			"Agents",
			"Appearance",
		]);
		expect(screen.getByRole("tab", { name: "AI connections" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
		expect(await screen.findByText("Not connected")).toBeVisible();
	});

	it("shows OpenRouter as connected only when main reports a key", async () => {
		guideStatus.mockResolvedValueOnce({ connected: true, model: "x/y" });
		render(<SettingsView />);
		expect(await screen.findByText("Connected")).toBeVisible();
		expect(screen.queryByText("Not connected")).not.toBeInTheDocument();
	});

	it("reports a provider status error instead of guessing", async () => {
		guideStatus.mockRejectedValueOnce(new Error("bridge down"));
		render(<SettingsView />);
		expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't check AI connections");
		expect(screen.queryByText("Connected")).not.toBeInTheDocument();
	});

	it("keeps ChatGPT visibly unavailable with no account details", async () => {
		render(<SettingsView />);
		await screen.findByText("Not connected");
		expect(screen.getByText("Coming later")).toBeVisible();
		expect(screen.getByRole("button", { name: "Sign in with ChatGPT" })).toBeDisabled();
		expect(screen.queryByText(/@|expires/i)).not.toBeInTheDocument();
	});

	it("saves Hide desktop icons, keeps other recording preferences and follows outside changes", async () => {
		render(<SettingsView />);
		await tab("Recording");
		const toggle = await screen.findByRole("switch", { name: "Hide desktop icons" });
		await waitFor(() => expect(toggle).toBeEnabled());
		await userEvent.click(toggle);
		expect(setPrefs).toHaveBeenCalledWith({ hideDesktopIcons: true });
		await waitFor(() => expect(toggle).toHaveAttribute("aria-checked", "true"));
		prefsListener?.({ hideDesktopIcons: false });
		await waitFor(() => expect(toggle).toHaveAttribute("aria-checked", "false"));
		expect(screen.getByText("~/Showhow/Recordings")).toBeVisible();
		expect(screen.getByText("3 s")).toBeVisible();
	});

	it("reverts Hide desktop icons and shows an error when the save is rejected", async () => {
		setPrefs.mockRejectedValueOnce(new Error("disk full"));
		render(<SettingsView />);
		await tab("Recording");
		const toggle = await screen.findByRole("switch", { name: "Hide desktop icons" });
		await waitFor(() => expect(toggle).toBeEnabled());
		await userEvent.click(toggle);
		expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't save");
		expect(toggle).toHaveAttribute("aria-checked", "false");
	});

	it("names the bundled transcription model and marks names and terms unavailable", async () => {
		render(<SettingsView />);
		await tab("Transcription");
		expect(screen.getByText("Whisper")).toBeVisible();
		expect(screen.getByText(/base · q5_1 · 60 MB/)).toBeVisible();
		expect(screen.getByRole("textbox", { name: "Names and terms" })).toBeDisabled();
	});

	it("shows the real agent handoff format and a disabled MCP server", async () => {
		render(<SettingsView />);
		await tab("Agents");
		expect(screen.getByText("Brief + bundle path")).toBeVisible();
		expect(screen.getByRole("switch", { name: "MCP server" })).toBeDisabled();
	});

	it("applies and stores the chosen theme, and resolves System from the Mac", async () => {
		render(<SettingsView />);
		await tab("Appearance");
		expect(screen.getByRole("radio", { name: "System" })).toBeChecked();
		await userEvent.click(screen.getByRole("radio", { name: "Light" }));
		expect(localStorage.getItem("showhow:theme")).toBe("light");
		expect(document.documentElement.dataset.theme).toBe("light");
		await userEvent.click(screen.getByRole("radio", { name: "System" }));
		expect(localStorage.getItem("showhow:theme")).toBe("system");
		await waitFor(() => expect(document.documentElement.dataset.theme).toBe("dark"));
	});
});
