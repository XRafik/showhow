/** Retained for old session callers; main-process bundle jobs now own transcription. */
export async function generateTranscriptForBundle(
	_bundleDir: string,
	_videoFileUrl: string,
): Promise<void> {
	// Pending jobs are now started and resumed by the main process.
}
