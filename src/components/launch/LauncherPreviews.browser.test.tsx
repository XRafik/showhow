import { afterEach, describe, expect, it } from "vitest";
import "@/index.css";
import styles from "./LaunchWindow.module.css";

afterEach(() => {
	document.body.replaceChildren();
});

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string) {
	const node = document.createElement(tag);
	node.className = className;
	return node;
}

describe("launcher preview production layout", () => {
	it("keeps the camera card inside the HUD stack and its pointer hit test", () => {
		const anchor = element("div", styles.hudAnchor);
		anchor.style.setProperty("--hud-bar-bottom", "20px");
		anchor.style.setProperty("--hud-popover-gap", "8px");
		anchor.style.setProperty("--hud-stack-gap", "10px");
		const bar = element("div", styles.hudBar);
		bar.style.width = "360px";
		bar.style.height = "48px";
		const above = element("div", styles.hudAbove);
		const preview = element("div", styles.launchCameraPreview);
		preview.dataset.hudInteractive = "true";
		preview.append(element("video", styles.cameraPreview));
		above.append(preview);
		anchor.append(bar, above);
		document.body.append(anchor);

		const rect = preview.getBoundingClientRect();
		const anchorRect = anchor.getBoundingClientRect();
		const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);

		expect(preview.closest(`.${styles.hudAnchor}`)).toBe(anchor);
		expect(getComputedStyle(preview).pointerEvents).toBe("auto");
		expect(hit?.closest('[data-hud-interactive="true"]')).toBe(preview);
		expect(rect.left).toBeGreaterThanOrEqual(0);
		expect(rect.right).toBeLessThanOrEqual(window.innerWidth);
		expect(rect.top).toBeGreaterThanOrEqual(0);
		expect(rect.bottom).toBeLessThanOrEqual(window.innerHeight);
		expect(anchorRect.bottom).toBeLessThanOrEqual(window.innerHeight);
		expect(getComputedStyle(preview).width).toBe("168px");
	});

	it("keeps a vertical HUD bar capped and internally scrollable", () => {
		const anchor = element("div", styles.hudAnchor);
		anchor.style.setProperty("--hud-bar-bottom", "20px");
		anchor.style.setProperty("--hud-bar-max-h", "160px");
		const bar = element("div", `${styles.hudBar} ${styles.hudBarVertical}`);
		for (let index = 0; index < 12; index += 1) {
			bar.append(element("div", styles.hudIconButton));
		}
		const above = element("div", styles.hudAbove);
		const preview = element("div", styles.launchCameraPreview);
		preview.dataset.hudInteractive = "true";
		preview.append(element("video", styles.cameraPreview));
		above.append(preview);
		anchor.append(bar, above);
		document.body.append(anchor);

		expect(bar.getBoundingClientRect().height).toBeLessThanOrEqual(160);
		expect(bar.scrollHeight).toBeGreaterThan(bar.clientHeight);
		expect(getComputedStyle(bar).overflowY).toBe("auto");
		expect(preview.getBoundingClientRect().top).toBeGreaterThanOrEqual(0);
		expect(preview.getBoundingClientRect().bottom).toBeLessThanOrEqual(
			bar.getBoundingClientRect().top,
		);
		expect(anchor.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight);
	});
});
