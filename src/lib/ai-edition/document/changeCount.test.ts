import { describe, expect, it } from "vitest";
import { createEmptyDocument } from "../schema";
import { countDocumentChanges } from "./changeCount";

const zoom = (id: string, depth: 1 | 2 = 2) => ({
	id,
	startMs: 0,
	endMs: 1000,
	depth,
	focus: { cx: 0.5, cy: 0.5 },
});

describe("countDocumentChanges", () => {
	const base = createEmptyDocument({ projectId: "p", title: "t" });

	it("is zero for the same document, even with a new save time", () => {
		const resaved = { ...base, project: { ...base.project, updatedAt: "2099-01-01T00:00:00Z" } };
		expect(countDocumentChanges(base, resaved)).toBe(0);
	});

	it("counts each region added, removed or altered once", () => {
		const two = { ...base, zoomRanges: [zoom("a"), zoom("b")] };
		expect(countDocumentChanges(base, two)).toBe(2);
		expect(countDocumentChanges(two, base)).toBe(2);
		expect(countDocumentChanges(two, { ...two, zoomRanges: [zoom("a", 1), zoom("b")] })).toBe(1);
	});

	it("matches ranges without ids by content, so an insert is one change", () => {
		const range = (startSec: number) => ({ startSec, endSec: startSec + 1, reason: "" });
		const was = { ...base, timeline: { ...base.timeline, muteRanges: [range(5), range(9)] } };
		const inserted = {
			...was,
			timeline: { ...was.timeline, muteRanges: [range(1), range(5), range(9)] },
		};
		const moved = { ...was, timeline: { ...was.timeline, muteRanges: [range(5), range(10)] } };
		expect(countDocumentChanges(was, inserted)).toBe(1);
		expect(countDocumentChanges(was, moved)).toBe(1);
	});

	it("counts any other difference as one change", () => {
		const retitled = { ...base, project: { ...base.project, title: "renamed" } };
		expect(countDocumentChanges(base, retitled)).toBe(1);
	});
});
