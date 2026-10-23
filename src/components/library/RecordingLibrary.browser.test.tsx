import "@/index.css";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { I18nProvider } from "@/contexts/I18nContext";
import { RecordingLibrary } from "./RecordingLibrary";

describe("RecordingLibrary Sidebar titlebar inset in Chromium", () => {
	it("moves only the logo for macOS inset, zero inset, and missing inset", async () => {
		await page.viewport(1280, 800);

		const root = document.documentElement;
		const previousInset = root.style.getPropertyValue("--titlebar-inset-left");
		const previousElectronApi = Object.getOwnPropertyDescriptor(window, "electronAPI");
		root.style.setProperty("--titlebar-inset-left", "68px");
		Object.defineProperty(window, "electronAPI", {
			configurable: true,
			value: {
				showhowListRecordings: vi.fn(async () => []),
				switchToHud: vi.fn(async () => undefined),
			},
		});

		const { unmount } = render(
			<I18nProvider>
				<RecordingLibrary />
			</I18nProvider>,
		);

		try {
			await screen.findByText("No recordings yet. Start one to see it here.");

			const sidebar = screen.getByRole("complementary");
			const logo = screen.getByRole("img", { name: "Showhow" });
			const primaryAction = screen.getByRole("button", { name: "New recording" });
			const settingsAction = screen.getByRole("button", { name: "Settings" });
			const leftInSidebar = (element: HTMLElement) =>
				Math.round(element.getBoundingClientRect().left - sidebar.getBoundingClientRect().left);
			const actionGeometry = () => ({
				primaryLeft: leftInSidebar(primaryAction),
				primaryWidth: Math.round(primaryAction.getBoundingClientRect().width),
				settingsLeft: leftInSidebar(settingsAction),
				settingsWidth: Math.round(settingsAction.getBoundingClientRect().width),
			});

			let baselineActionGeometry: ReturnType<typeof actionGeometry> | undefined;
			for (const inset of [
				{ cssValue: "68px", expectedLogoLeft: 86 },
				{ cssValue: "0px", expectedLogoLeft: 18 },
				{ cssValue: undefined, expectedLogoLeft: 18 },
			]) {
				if (inset.cssValue === undefined) {
					root.style.removeProperty("--titlebar-inset-left");
				} else {
					root.style.setProperty("--titlebar-inset-left", inset.cssValue);
				}

				await waitFor(() => {
					expect(leftInSidebar(logo)).toBe(inset.expectedLogoLeft);
					expect(leftInSidebar(primaryAction)).toBe(18);
					expect(leftInSidebar(settingsAction)).toBe(18);
				});

				expect(settingsAction.getBoundingClientRect().width).toBeGreaterThan(0);
				const currentActionGeometry = actionGeometry();
				if (baselineActionGeometry) {
					expect(currentActionGeometry).toEqual(baselineActionGeometry);
				} else {
					baselineActionGeometry = currentActionGeometry;
				}
			}
		} finally {
			unmount();
			if (previousInset) root.style.setProperty("--titlebar-inset-left", previousInset);
			else root.style.removeProperty("--titlebar-inset-left");
			if (previousElectronApi) {
				Object.defineProperty(window, "electronAPI", previousElectronApi);
			} else {
				Reflect.deleteProperty(window, "electronAPI");
			}
		}
	});
});
