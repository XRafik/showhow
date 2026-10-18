import type { RecordingLibraryEntry } from "@/lib/showhow/recordingLibrary";

export function filterRecordings(
	entries: RecordingLibraryEntry[],
	query: string,
): RecordingLibraryEntry[] {
	const titleQuery = query.trim().toLocaleLowerCase();
	return titleQuery
		? entries.filter((entry) => entry.title.toLocaleLowerCase().includes(titleQuery))
		: entries;
}
