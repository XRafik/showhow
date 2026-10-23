/** The speech-to-text model packaged with Showhow; a main-process test keeps it in step with the bundle. */
export const BUNDLED_TRANSCRIPTION = {
	engine: "Whisper",
	file: "ggml-base-q5_1.bin",
	label: "base · q5_1",
	sizeMb: 60,
} as const;

/** Fixed today: useScreenRecorder counts 3, 2, 1 with no preference to change it. */
export const RECORDING_COUNTDOWN_SECONDS = 3;

export interface ShowhowSettingsInfo {
	recordingsFolder: string;
	nameRecordingsWithAi: boolean;
}

export interface ShowhowNameRecordingsWithAiResult {
	success: boolean;
	nameRecordingsWithAi?: boolean;
}

export interface RecordingsFolderSelection {
	status: "selected";
	token: string;
	recordingsFolder: string;
	currentRecordingsFolder: string;
	recordingCount: number;
}

export type RecordingsFolderSelectionResult =
	| RecordingsFolderSelection
	| { status: "rejected"; reason: "invalid-folder" | "same-folder" | "inside-current-folder" }
	| null;

export type RecordingsFolderAction = "keep" | "move";

export interface RecordingsFolderMoveProgress {
	current: number;
	total: number;
	bundleName: string;
}

export interface RecordingsFolderChangeResult {
	success: boolean;
	recordingsFolder?: string;
	movedBundles?: string[];
	remainingBundles?: string[];
	failedBundle?: string;
	recoveryBundle?: string;
	error?: string;
}
