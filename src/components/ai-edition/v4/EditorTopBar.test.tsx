// @vitest-environment jsdom
import "@testing-library/jest-dom";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";

// ProjectNameField is a private helper inside EditorTopBar, so reach it through
// the public topbar instead. The translator echoes keys; assertions read better
// against keys than against prose that drifts with copy edits.
vi.mock("@/contexts/I18nContext", () => ({
	useI18n: () => ({ locale: "en", setLocale: () => {} }),
	useScopedT: () => (key: string) => key,
}));

// The platform decides whether the chips read Ctrl or ⌘.
const platform = vi.hoisted(() => ({ isMac: false }));
vi.mock("@/contexts/ShortcutsContext", () => ({
	useShortcuts: () => ({ isMac: platform.isMac }),
}));

class StubResizeObserver {
	observe = vi.fn();
	unobserve = vi.fn();
	disconnect = vi.fn();
}
beforeEach(() => {
	platform.isMac = false;
	vi.stubGlobal("ResizeObserver", StubResizeObserver);
});

const { toggleTheme } = vi.hoisted(() => ({ toggleTheme: vi.fn() }));
vi.mock("@/hooks/useTheme", () => ({
	useTheme: () => ({ theme: "dark", toggle: toggleTheme }),
}));

import { EditorTopBar } from "./EditorTopBar";

const noop = () => {};

function renderTopBar(
	projectTitle: string | null,
	options: { mode?: "media" | "edit" | "rec"; dirty?: boolean } = {},
) {
	const onRename = vi.fn();
	const onShowAbout = vi.fn();
	const onCheckForUpdates = vi.fn();
	const onOpenSettings = vi.fn();
	const onOpenProviderSettings = vi.fn();
	const onNewProject = vi.fn();
	const onOpenProject = vi.fn();
	const onSave = vi.fn();
	const onOpenLibrary = vi.fn();
	const onNewRecording = vi.fn();
	const onModeChange = vi.fn();
	render(
		<TooltipProvider>
			<EditorTopBar
				mode={options.mode ?? "edit"}
				onModeChange={onModeChange}
				projectTitle={projectTitle}
				dirty={options.dirty ?? false}
				canExport={false}
				actions={{
					openProject: onOpenProject,
					newProject: onNewProject,
					save: onSave,
					export: noop,
					openSettings: onOpenSettings,
					renameProject: onRename,
					openProviderSettings: onOpenProviderSettings,
					showAbout: onShowAbout,
					checkForUpdates: onCheckForUpdates,
					openLibrary: onOpenLibrary,
					newRecording: onNewRecording,
				}}
			/>
		</TooltipProvider>,
	);
	return {
		onRename,
		onShowAbout,
		onCheckForUpdates,
		onOpenSettings,
		onOpenProviderSettings,
		onNewProject,
		onOpenProject,
		onSave,
		onOpenLibrary,
		onNewRecording,
		onModeChange,
	};
}

/** The menu reads two separate channels, and they answer different questions: `getAppInfo` for
 *  the version, `canCheckForUpdatesNow` for the full update veto (see EditorTopBar). Neither
 *  exists in jsdom. Returns the cleanup so a stub cannot leak into the next test. */
function stubElectronAPI(info: { version: string; canCheckForUpdates: boolean }) {
	(window as unknown as { electronAPI?: unknown }).electronAPI = {
		getAppInfo: () => Promise.resolve(info),
		canCheckForUpdatesNow: () => Promise.resolve(info.canCheckForUpdates),
	};
	return () => {
		(window as unknown as { electronAPI?: unknown }).electronAPI = undefined;
	};
}

describe("ProjectNameField (issue #180)", () => {
	it("renders the project title on the button", () => {
		renderTopBar("Demo Project");
		expect(screen.getByRole("button", { name: "topbar.renameProject" })).toHaveTextContent(
			"Demo Project",
		);
	});

	it("shows a placeholder and is disabled when no project is loaded", () => {
		renderTopBar(null);
		const button = screen.getByRole("button", { name: "topbar.renameProject" });
		expect(button).toBeDisabled();
		expect(button).toHaveTextContent("topbar.editorTitle");
	});

	it("swaps to an input pre-filled with the title on click and selects it", () => {
		renderTopBar("Demo Project");
		fireEvent.click(screen.getByRole("button", { name: "topbar.renameProject" }));
		const input = screen.getByRole("textbox") as HTMLInputElement;
		expect(input.value).toBe("Demo Project");
		// The text is selected on focus, so a keystroke replaces the whole title.
		fireEvent.change(input, { target: { value: "Renamed" } });
		fireEvent.keyDown(input, { key: "Enter" });
		expect(input).not.toBeInTheDocument();
	});

	it("commits a typed title on Enter via onRename", () => {
		const { onRename } = renderTopBar("Demo Project");
		fireEvent.click(screen.getByRole("button", { name: "topbar.renameProject" }));
		const input = screen.getByRole("textbox");
		fireEvent.change(input, { target: { value: "Renamed" } });
		fireEvent.keyDown(input, { key: "Enter" });
		expect(onRename).toHaveBeenCalledWith("Renamed");
	});

	it("commits on blur when the title was edited", () => {
		const { onRename } = renderTopBar("Demo Project");
		fireEvent.click(screen.getByRole("button", { name: "topbar.renameProject" }));
		const input = screen.getByRole("textbox");
		fireEvent.change(input, { target: { value: "Blurred rename" } });
		fireEvent.blur(input);
		expect(onRename).toHaveBeenCalledWith("Blurred rename");
	});

	it("rejects an empty / whitespace-only rename", () => {
		const { onRename } = renderTopBar("Demo Project");
		fireEvent.click(screen.getByRole("button", { name: "topbar.renameProject" }));
		const input = screen.getByRole("textbox");
		fireEvent.change(input, { target: { value: "   " } });
		fireEvent.keyDown(input, { key: "Enter" });
		expect(onRename).not.toHaveBeenCalled();
	});

	it("cancels on Escape without calling onRename", () => {
		const { onRename } = renderTopBar("Demo Project");
		fireEvent.click(screen.getByRole("button", { name: "topbar.renameProject" }));
		const input = screen.getByRole("textbox");
		fireEvent.change(input, { target: { value: "Half-typed" } });
		fireEvent.keyDown(input, { key: "Escape" });
		expect(onRename).not.toHaveBeenCalled();
		expect(screen.getByRole("button", { name: "topbar.renameProject" })).toHaveTextContent(
			"Demo Project",
		);
	});

	it("keeps the rename button in the no-drag region (regression for #180)", () => {
		// The pre-fix button used `style={{ all: "unset" }}` which clobbered the
		// topbar's `-webkit-app-region: no-drag` rule. In the Electron build the
		// button then becomes a window-drag handle and the click never fires the
		// onClick handler. The CSS module class must keep the no-drag property.
		renderTopBar("Demo Project");
		const button = screen.getByRole("button", { name: "topbar.renameProject" });
		// jsdom doesn't honour `-webkit-app-region`, so assert the marker
		// indirectly via the inline-style rule we removed: the pre-fix button
		// had `all: unset`; if any element still has it, the regression is back.
		expect(button.getAttribute("style") ?? "").not.toMatch(/all\s*:\s*unset/);
	});
});

describe("AppMenu", () => {
	it("hangs the menu on the brand rather than adding a control to the bar", () => {
		renderTopBar("Demo Project");
		const trigger = screen.getByRole("button", { name: /Showhow/ });
		expect(trigger).toHaveAttribute("aria-haspopup", "menu");
		expect(trigger).toHaveAttribute("aria-expanded", "false");
		// The whole point of the wordmark-as-trigger: no menu until asked for.
		expect(screen.queryByRole("menu")).not.toBeInTheDocument();
	});

	it("keeps the trigger a real button, which is the only thing that makes it clickable", () => {
		// `.topbar button, .topbar input, .topbar select` is the ENTIRE no-drag opt-out in
		// EditorShellV4.module.css. A brand rendered as a <span> or a <div role="button"> sits
		// on the window-drag region and the OS eats the click — the #180 failure, one control
		// over. Same reason `all: unset` is banned here.
		renderTopBar("Demo Project");
		const trigger = screen.getByRole("button", { name: /Showhow/ });
		expect(trigger.tagName).toBe("BUTTON");
		expect(trigger.getAttribute("style") ?? "").not.toMatch(/all\s*:\s*unset/);
	});

	it("opens on click and offers shortcuts, AI settings and about", () => {
		renderTopBar("Demo Project");
		fireEvent.click(screen.getByRole("button", { name: /Showhow/ }));
		expect(screen.getByRole("menu")).toBeInTheDocument();
		// Exact names: the translator echoes keys, and both settings rows are labelled with a
		// `…title` key, so a /title/ match would hit two items and pin neither.
		expect(screen.getByRole("menuitem", { name: "title" })).toBeInTheDocument();
		expect(screen.getByRole("menuitem", { name: "providerSettings.title" })).toBeInTheDocument();
		expect(screen.getByRole("menuitem", { name: /actions\.about/ })).toBeInTheDocument();
	});

	// Issue #420: the AI dialog used to be openable only from the chat panel, which mounts in
	// Edit mode with the panel expanded. The row is unconditional here — its dialog is mounted
	// in App.tsx, above every mode — so the menu does not lie in Media and Rec.
	it("opens the AI settings dialog and closes behind itself", () => {
		const { onOpenProviderSettings, onOpenSettings } = renderTopBar("Demo Project");
		fireEvent.click(screen.getByRole("button", { name: /Showhow/ }));
		fireEvent.click(screen.getByRole("menuitem", { name: "providerSettings.title" }));
		expect(onOpenProviderSettings).toHaveBeenCalledTimes(1);
		// Distinct from the shortcuts row above it, which is the dialog it would be confused with.
		expect(onOpenSettings).not.toHaveBeenCalled();
		expect(screen.queryByRole("menu")).not.toBeInTheDocument();
	});

	it("routes About to the main process and closes behind itself", () => {
		const { onShowAbout } = renderTopBar("Demo Project");
		fireEvent.click(screen.getByRole("button", { name: /Showhow/ }));
		fireEvent.click(screen.getByRole("menuitem", { name: /actions\.about/ }));
		expect(onShowAbout).toHaveBeenCalledTimes(1);
		expect(screen.queryByRole("menu")).not.toBeInTheDocument();
	});

	it("offers the repo permanently and routes it through main, on every channel", async () => {
		// The counterpart to the one-time ask after an export: this row is always there. It is
		// deliberately NOT behind the update veto — a link to the repo root is the one thing a
		// Store/Flathub/Snap copy may show, since it can walk nobody into a parallel install.
		const openRepoPage = vi.fn(() => Promise.resolve());
		(window as unknown as { electronAPI?: unknown }).electronAPI = { openRepoPage };
		try {
			renderTopBar("Demo Project");
			fireEvent.click(screen.getByRole("button", { name: /Showhow/ }));
			// Present next to About even though Check for Updates is absent here (no channel
			// answer in jsdom), which is the pairing that would break if the two ever shared a veto.
			expect(
				screen.queryByRole("menuitem", { name: /actions\.checkForUpdates/ }),
			).not.toBeInTheDocument();
			fireEvent.click(screen.getByRole("menuitem", { name: /actions\.starOnGithub/ }));
			// No URL argument: the renderer holds no link, main owns the one it opens.
			expect(openRepoPage).toHaveBeenCalledWith();
			expect(screen.queryByRole("menu")).not.toBeInTheDocument();
		} finally {
			(window as unknown as { electronAPI?: unknown }).electronAPI = undefined;
		}
	});

	it("carries the file actions the bar used to show as three icons", () => {
		const { onNewProject, onOpenProject, onSave } = renderTopBar("Demo Project");
		// Not in the bar any more: only the menu reaches them (and Ctrl+N / Ctrl+O / Ctrl+S).
		expect(screen.queryByRole("button", { name: "topbar.openProject" })).not.toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: /Showhow/ }));
		fireEvent.click(screen.getByRole("menuitem", { name: "topbar.newProject" }));
		expect(onNewProject).toHaveBeenCalledTimes(1);
		fireEvent.click(screen.getByRole("button", { name: /Showhow/ }));
		fireEvent.click(screen.getByRole("menuitem", { name: "topbar.openProject" }));
		expect(onOpenProject).toHaveBeenCalledTimes(1);
		fireEvent.click(screen.getByRole("button", { name: /Showhow/ }));
		fireEvent.click(screen.getByRole("menuitem", { name: "topbar.saveProject" }));
		expect(onSave).toHaveBeenCalledTimes(1);
		expect(screen.queryByRole("menu")).not.toBeInTheDocument();
	});

	it("switches the theme from the menu", () => {
		toggleTheme.mockClear();
		renderTopBar("Demo Project");
		fireEvent.click(screen.getByRole("button", { name: /Showhow/ }));
		// Dark now, so the row offers the way out of it.
		fireEvent.click(screen.getByRole("menuitem", { name: "topbar.switchToLightTheme" }));
		expect(toggleTheme).toHaveBeenCalledTimes(1);
	});

	it("unfolds the languages inside the menu and marks the current one", () => {
		renderTopBar("Demo Project");
		fireEvent.click(screen.getByRole("button", { name: /Showhow/ }));
		const row = screen.getByRole("menuitem", { name: /topbar\.changeLanguage/ });
		expect(row).toHaveAttribute("aria-expanded", "false");
		fireEvent.click(row);
		expect(row).toHaveAttribute("aria-expanded", "true");
		expect(screen.getByRole("menuitemradio", { name: "English" })).toHaveAttribute(
			"aria-checked",
			"true",
		);
	});

	it("closes on Escape", () => {
		renderTopBar("Demo Project");
		fireEvent.click(screen.getByRole("button", { name: /Showhow/ }));
		fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
		expect(screen.queryByRole("menu")).not.toBeInTheDocument();
	});

	it("hides Check for Updates when the install channel owns updates", async () => {
		// No electronAPI at all in jsdom, which lands on the same branch as a Store/Flathub/Snap
		// build answering false, and as a check refused mid-take: no item, rather than a button
		// that silently does nothing.
		renderTopBar("Demo Project");
		fireEvent.click(screen.getByRole("button", { name: /Showhow/ }));
		expect(
			screen.queryByRole("menuitem", { name: /actions\.checkForUpdates/ }),
		).not.toBeInTheDocument();
	});

	it("offers Check for Updates where the app owns its own updates", async () => {
		const restore = stubElectronAPI({ version: "9.9.9", canCheckForUpdates: true });
		try {
			const { onCheckForUpdates } = renderTopBar("Demo Project");
			fireEvent.click(screen.getByRole("button", { name: /Showhow/ }));
			const item = await screen.findByRole("menuitem", { name: /actions\.checkForUpdates/ });
			fireEvent.click(item);
			expect(onCheckForUpdates).toHaveBeenCalledTimes(1);
		} finally {
			restore();
		}
	});

	it("shows the running version on the About row, for pasting into a bug report", async () => {
		const restore = stubElectronAPI({ version: "9.9.9", canCheckForUpdates: false });
		try {
			renderTopBar("Demo Project");
			fireEvent.click(screen.getByRole("button", { name: /Showhow/ }));
			expect(await screen.findByText("9.9.9")).toBeInTheDocument();
		} finally {
			restore();
		}
	});
});

describe("EditorTopBar responsive affordances and tooltips", () => {
	// The visible text is the label, so a tooltip that repeats it says nothing (and a native
	// `title` on top of it is a second, slower tooltip).
	it("names the export button by its text, with no title repeating it", () => {
		renderTopBar("Demo Project");
		const exportBtn = screen.getByRole("button", { name: "topbar.export" });
		expect(exportBtn).toBeInTheDocument();
		expect(exportBtn).not.toHaveAttribute("title");
	});

	it("gives the mode tabs no tooltip, and offers Media and Edit only: Record is New recording", () => {
		renderTopBar("Demo Project");
		const tabs = screen.getAllByRole("tab");
		expect(tabs.map((tab) => tab.textContent)).toEqual(["topbar.modes.media", "topbar.modes.edit"]);
		for (const tab of tabs) expect(tab).not.toHaveAttribute("title");
	});

	it("says the saved state beside the project name, to the eye and to a screen reader", () => {
		renderTopBar("Demo Project");
		const saved = screen.getByTestId("topbar-save-state");
		expect(saved).toHaveTextContent("topbar.saved");
		expect(saved).toBeVisible();
	});

	it("says Unsaved while the project has changes", () => {
		renderTopBar("Demo Project", { dirty: true });
		expect(screen.getByTestId("topbar-save-state")).toHaveTextContent("topbar.unsaved");
	});

	it("places Library before the project name and keeps other destinations in the Final bar", () => {
		const { onOpenLibrary, onNewRecording, onOpenProject } = renderTopBar("Demo Project");
		const library = screen.getByRole("button", { name: "topbar.library" });
		const projectName = screen.getByRole("button", { name: "topbar.renameProject" });
		expect(library.textContent).toContain("topbar.library");
		expect(library).toHaveClass("!border", "!border-solid", "!border-[var(--ds-on-panel-line)]");
		expect(
			library.compareDocumentPosition(projectName) & Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy();
		expect(library.nextElementSibling).toHaveAttribute("aria-hidden", "true");
		expect(library.nextElementSibling).toHaveClass("h-4", "w-px");

		const nav = screen.getByRole("navigation", { name: "topbar.navigation" });
		expect(within(nav).queryByRole("button", { name: "topbar.library" })).not.toBeInTheDocument();
		fireEvent.click(library);
		fireEvent.click(within(nav).getByRole("button", { name: "topbar.newRecording" }));
		fireEvent.click(within(nav).getByRole("button", { name: "topbar.open" }));
		expect(onOpenLibrary).toHaveBeenCalledTimes(1);
		expect(onNewRecording).toHaveBeenCalledTimes(1);
		expect(onOpenProject).toHaveBeenCalledTimes(1);
	});

	it("marks New recording as the current place while recording", () => {
		renderTopBar("Demo Project", { mode: "rec" });
		expect(screen.getByRole("button", { name: "topbar.newRecording" })).toHaveAttribute(
			"aria-current",
			"page",
		);
		for (const tab of screen.getAllByRole("tab")) {
			expect(tab).toHaveAttribute("aria-selected", "false");
		}
	});

	it("leaves history and the chat toggle out of the bar: the timeline and the rail carry them", () => {
		renderTopBar("Demo Project");
		for (const name of ["fixedActions.undo", "fixedActions.redo", "topbar.toggleChatPanel"]) {
			expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
		}
	});

	it("keeps the brand trigger named by its label, with no title repeating it", () => {
		renderTopBar("Demo Project");
		const brandBtn = screen.getByRole("button", { name: "Showhow" });
		expect(brandBtn).not.toHaveAttribute("title");
		expect(brandBtn).toHaveAttribute("aria-label", "Showhow");
	});

	it("leaves a native title only on text that can be cut short", () => {
		renderTopBar("Demo Project");
		// The project name is truncated, so the full name is revealed on hover.
		expect(screen.getByRole("button", { name: "topbar.renameProject" })).toHaveAttribute(
			"title",
			"Demo Project",
		);
		for (const name of ["topbar.newRecording", "topbar.open"]) {
			expect(screen.getByRole("button", { name })).not.toHaveAttribute("title");
		}
	});

	it("leaves the language to the menu, out of the bar", () => {
		renderTopBar("Demo Project");
		expect(screen.queryByRole("button", { name: "topbar.changeLanguage" })).not.toBeInTheDocument();
	});
});

// jsdom does not lay anything out, so it cannot show a row wrapping. What it can pin is the
// sizing contract that stops it: in French the menu used to settle on its min-width, wrapping
// "Changer de langue" and splitting the version as "2.0.0-" / "rc.8" (#969).
describe("AppMenu sizing (issue #969)", () => {
	const css = readFileSync(path.join(__dirname, "EditorShellV4.module.css"), "utf8");
	const rule = (selector: string) => {
		const body = css.match(new RegExp(`\\n\\.${selector}\\s*\\{([^}]*)\\}`))?.[1];
		expect(body, selector).toBeDefined();
		return body ?? "";
	};

	it("sizes the menu to its widest row", () => {
		expect(rule("appMenu")).toMatch(/^\s*width:\s*max-content;/m);
	});

	it("keeps every row on one line", () => {
		expect(rule("appMenuRow")).toMatch(/white-space:\s*nowrap/);
	});

	it("never squeezes or breaks the trailing value", () => {
		const version = rule("appMenuVersion");
		expect(version).toMatch(/white-space:\s*nowrap/);
		expect(version).toMatch(/flex-shrink:\s*0/);
	});
});
