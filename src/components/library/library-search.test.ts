import { describe, expect, it } from "vitest";
import type { RecordingLibraryEntry } from "@/lib/showhow/recordingLibrary";
import { filterRecordings } from "./library-search";

describe("local title search", () => {
	const entries: RecordingLibraryEntry[] = [
		{ bundleDir: "/scratch/b", title: "Invoice total", source: "desktop", createdAt: 2 },
		{ bundleDir: "/scratch/a", title: "Other take", source: "browser", createdAt: 1 },
		{ bundleDir: "/scratch/c", title: "Invoice receipt", source: "desktop", createdAt: 3 },
	];
	it("treats blank input as the original order and never sorts or mutates entries", () => {
		expect(filterRecordings(entries, "  ")).toBe(entries);
		expect(filterRecordings(entries, " INVOICE ")).toEqual([entries[0], entries[2]]);
		expect(entries.map((entry) => entry.bundleDir)).toEqual([
			"/scratch/b",
			"/scratch/a",
			"/scratch/c",
		]);
	});
	it("searches only titles, tolerates punctuation and returns no matches", () => {
		expect(filterRecordings(entries, "scratch")).toEqual([]);
		expect(filterRecordings(entries, "[invoice]")).toEqual([]);
		expect(filterRecordings([], "Invoice")).toEqual([]);
	});
});
