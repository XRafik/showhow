import type { AxcutDocument } from "../schema";

// Not every entry carries an id (the range lists do not).
type Item = object;

// The document's lists of editable things. Each added, removed or altered entry is one change.
const LISTS: Array<(doc: AxcutDocument) => readonly Item[]> = [
	(d) => d.timeline.clips,
	(d) => d.timeline.gaps,
	(d) => d.timeline.trimRanges,
	(d) => d.timeline.muteRanges,
	(d) => d.timeline.speedRanges,
	(d) => d.timeline.captionRanges,
	(d) => d.annotations,
	(d) => d.zoomRanges,
	(d) => d.audioTracks,
];

const idOf = (item: Item) => ("id" in item && typeof item.id === "string" ? item.id : null);

function countListChanges(before: readonly Item[], after: readonly Item[]): number {
	// Entries with an id are matched by it: added, removed or altered is one change each.
	const was = new Map<string, string>();
	// Entries without one are matched by content, so a range inserted at the front does not read
	// as every later one altered. An altered range is one gone and one new, which is one change.
	const unmatched = new Map<string, number>();
	for (const item of before) {
		const id = idOf(item);
		const json = JSON.stringify(item);
		if (id === null) unmatched.set(json, (unmatched.get(json) ?? 0) + 1);
		else was.set(id, json);
	}
	let changes = 0;
	let added = 0;
	for (const item of after) {
		const id = idOf(item);
		const json = JSON.stringify(item);
		if (id === null) {
			const left = unmatched.get(json) ?? 0;
			if (left > 0) unmatched.set(json, left - 1);
			else added += 1;
			continue;
		}
		if (was.get(id) !== json) changes += 1;
		was.delete(id);
	}
	let removed = 0;
	for (const left of unmatched.values()) removed += left;
	return changes + was.size + Math.max(added, removed);
}

function withoutLists(doc: AxcutDocument): string {
	return JSON.stringify({
		...doc,
		project: { ...doc.project, updatedAt: undefined },
		timeline: {
			...doc.timeline,
			clips: undefined,
			gaps: undefined,
			trimRanges: undefined,
			muteRanges: undefined,
			speedRanges: undefined,
			captionRanges: undefined,
		},
		annotations: undefined,
		zoomRanges: undefined,
		audioTracks: undefined,
	});
}

/**
 * How many edits separate two documents, as the user would count them: one per region, clip,
 * annotation or track added, removed or altered, plus one if anything else (settings, the
 * transcript) differs. The save timestamp alone is not an edit.
 */
export function countDocumentChanges(before: AxcutDocument, after: AxcutDocument): number {
	let changes = 0;
	for (const list of LISTS) changes += countListChanges(list(before), list(after));
	if (withoutLists(before) !== withoutLists(after)) changes += 1;
	return changes;
}
