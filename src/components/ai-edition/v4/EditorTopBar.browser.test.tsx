import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@/index.css";

const noop = () => undefined;

vi.mock("@/contexts/I18nContext", () => ({
	useI18n: () => ({ locale: "en", setLocale: noop }),
	useScopedT: () => (key: string) => key,
}));
vi.mock("@/hooks/useTheme", () => ({
	useTheme: () => ({ theme: "dark", toggle: noop }),
}));
vi.mock("../StylePresetsMenu", () => ({ StylePresetsMenu: () => null }));

import { EditorTopBar } from "./EditorTopBar";

let unmount: (() => void) | undefined;
afterEach(() => {
	unmount?.();
	unmount = undefined;
	document.body.replaceChildren();
});

describe("editor Library back button production styling", () => {
	it("keeps the secondary border visible over the navLink reset", () => {
		const container = document.createElement("div");
		document.body.append(container);
		const root = createRoot(container);
		unmount = () => act(() => root.unmount());
		act(() =>
			root.render(
				<EditorTopBar
					mode="edit"
					onModeChange={noop}
					projectTitle="Project"
					dirty={false}
					canExport={false}
					actions={{
						openProject: noop,
						newProject: noop,
						save: noop,
						export: noop,
						openSettings: noop,
						renameProject: noop,
						openProviderSettings: noop,
						showAbout: noop,
						checkForUpdates: noop,
						openLibrary: noop,
						newRecording: noop,
					}}
				/>,
			),
		);

		const button = container.querySelector<HTMLButtonElement>(
			'button[aria-label="topbar.library"]',
		);
		if (!button) throw new Error("EditorTopBar did not render its Library button");

		const border = getComputedStyle(button);
		expect(border.borderTopWidth).toBe("1px");
		expect(border.borderTopStyle).toBe("solid");
		expect(border.borderTopColor).not.toBe("rgba(0, 0, 0, 0)");
	});
});
