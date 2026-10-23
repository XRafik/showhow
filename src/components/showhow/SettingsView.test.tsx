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
const setNameRecordingsWithAi = vi.fn();
const chooseRecordingsFolder = vi.fn();
const changeRecordingsFolder = vi.fn();
let folderProgressListener:
	| ((progress: { current: number; total: number; bundleName: string }) => void)
	| undefined;
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
	info.mockResolvedValue({
		recordingsFolder: "~/Showhow/Recordings",
		nameRecordingsWithAi: true,
	});
	setNameRecordingsWithAi.mockImplementation(async (enabled: boolean) => ({
		success: true,
		nameRecordingsWithAi: enabled,
	}));
	chooseRecordingsFolder.mockResolvedValue({
		status: "selected",
		token: "folder-selection",
		recordingsFolder: "~/Client work",
		currentRecordingsFolder: "~/Showhow/Recordings",
		recordingCount: 2,
	});
	changeRecordingsFolder.mockResolvedValue({ success: true, recordingsFolder: "~/Client work" });
	folderProgressListener = undefined;
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
			showhowSetNameRecordingsWithAi: setNameRecordingsWithAi,
			showhowChooseRecordingsFolder: chooseRecordingsFolder,
			showhowChangeRecordingsFolder: changeRecordingsFolder,
			showhowOnRecordingsFolderMoveProgress: (callback: typeof folderProgressListener) => {
				folderProgressListener = callback;
				return () => {
					folderProgressListener = undefined;
				};
			},
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

	it("loads and saves the automatic recording title preference", async () => {
		info.mockResolvedValueOnce({
			recordingsFolder: "~/Showhow/Recordings",
			nameRecordingsWithAi: false,
		});
		render(<SettingsView />);
		const toggle = await screen.findByRole("switch", { name: "Name recordings with AI" });
		await waitFor(() => expect(toggle).toBeEnabled());
		expect(toggle).toHaveAttribute("aria-checked", "false");
		await userEvent.click(toggle);
		expect(setNameRecordingsWithAi).toHaveBeenCalledWith(true);
		await waitFor(() => expect(toggle).toHaveAttribute("aria-checked", "true"));
	});

	it("restores the automatic title preference when persistence fails", async () => {
		setNameRecordingsWithAi.mockResolvedValueOnce({ success: false });
		render(<SettingsView />);
		const toggle = await screen.findByRole("switch", { name: "Name recordings with AI" });
		await waitFor(() => expect(toggle).toBeEnabled());
		await userEvent.click(toggle);
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Could not save this preference. The previous setting is kept.",
		);
		expect(toggle).toHaveAttribute("aria-checked", "true");
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

	it("offers the recordings folder picker in Recording settings", async () => {
		render(<SettingsView />);
		await tab("Recording");

		expect(await screen.findByRole("button", { name: "Change…" })).toBeEnabled();
	});

	it("shows the folder confirmation and keeps existing recordings in place", async () => {
		render(<SettingsView />);
		await tab("Recording");
		await userEvent.click(await screen.findByRole("button", { name: "Change…" }));

		expect(await screen.findByRole("heading", { name: "Move your 2 recordings?" })).toBeVisible();
		expect(
			screen.getByText(/If you keep them where they are, they won’t show in your Library/u),
		).toBeVisible();
		await userEvent.click(screen.getByRole("button", { name: "Keep them there" }));

		expect(changeRecordingsFolder).toHaveBeenCalledWith("folder-selection", "keep");
		await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
		expect(screen.getByText("~/Client work")).toBeVisible();
	});

	it("shows dither progress and names partial failures and the retained verified copy", async () => {
		let resolveChange!: (result: {
			success: false;
			recordingsFolder: string;
			movedBundles: string[];
			remainingBundles: string[];
			failedBundle: string;
			recoveryBundle: string;
			error: string;
		}) => void;
		changeRecordingsFolder.mockReturnValueOnce(
			new Promise((resolve) => {
				resolveChange = resolve;
			}),
		);
		render(<SettingsView />);
		await tab("Recording");
		await userEvent.click(await screen.findByRole("button", { name: "Change…" }));
		await waitFor(() => expect(folderProgressListener).toBeTypeOf("function"));
		await userEvent.click(screen.getByRole("button", { name: "Move 2 recordings" }));
		folderProgressListener?.({ current: 2, total: 2, bundleName: "two-recording" });
		expect(await screen.findByRole("status")).toHaveTextContent("Moving 2 of 2…");
		expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
		resolveChange({
			success: false,
			recordingsFolder: "~/Client work",
			movedBundles: ["one-recording"],
			remainingBundles: ["two-recording", "three-recording"],
			failedBundle: "two-recording",
			recoveryBundle: "/scratch/Client work/two-recording",
			error: "source removal denied",
		});
		expect(await screen.findByRole("alert")).toHaveTextContent("two-recording");
		expect(screen.getByRole("alert")).toHaveTextContent("three-recording");
		expect(screen.getByRole("alert")).toHaveTextContent("/scratch/Client work/two-recording");
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

	it("moves through the theme options with arrow keys, one tab stop for the group", async () => {
		localStorage.setItem("showhow:theme", "light");
		render(<SettingsView />);
		await tab("Appearance");
		const light = screen.getByRole("radio", { name: "Light" });
		expect(light).toHaveAttribute("tabindex", "0");
		expect(screen.getByRole("radio", { name: "Dark" })).toHaveAttribute("tabindex", "-1");
		light.focus();
		await userEvent.keyboard("{ArrowRight}");
		expect(screen.getByRole("radio", { name: "Dark" })).toBeChecked();
		expect(screen.getByRole("radio", { name: "Dark" })).toHaveFocus();
		await userEvent.keyboard("{End}");
		expect(screen.getByRole("radio", { name: "System" })).toBeChecked();
		await userEvent.keyboard("{ArrowRight}");
		expect(screen.getByRole("radio", { name: "Light" })).toHaveFocus();
		expect(localStorage.getItem("showhow:theme")).toBe("light");
	});

	it("follows a theme chosen in another window", async () => {
		render(<SettingsView />);
		await tab("Appearance");
		localStorage.setItem("showhow:theme", "dark");
		window.dispatchEvent(new StorageEvent("storage", { key: "showhow:theme" }));
		await waitFor(() => expect(screen.getByRole("radio", { name: "Dark" })).toBeChecked());
	});

	it("does not claim a missing key when the status check fails", async () => {
		guideStatus.mockRejectedValueOnce(new Error("bridge down"));
		render(<SettingsView />);
		await screen.findByRole("alert");
		expect(screen.queryByRole("button", { name: "Add API key" })).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Manage key" })).toBeEnabled();
	});

	it("reads each switch's note with it", async () => {
		render(<SettingsView />);
		await tab("Agents");
		expect(screen.getByRole("switch", { name: "MCP server" })).toHaveAccessibleDescription(
			"Let agents read your library directly. Coming later.",
		);
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
