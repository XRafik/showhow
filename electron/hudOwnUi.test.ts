import { expect, it } from "vitest";
import { hudOwnUiBounds, setHudOwnUiProvider } from "./hudOwnUi";

it("reports nothing until the HUD registers, then the registered rects", () => {
	expect(hudOwnUiBounds()).toEqual([]);
	setHudOwnUiProvider(() => [{ x: 1, y: 2, width: 3, height: 4 }]);
	expect(hudOwnUiBounds()).toEqual([{ x: 1, y: 2, width: 3, height: 4 }]);
});
