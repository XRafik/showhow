// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the i18n hook so the recorder hook's `useScopedT` returns a no-op.
vi.mock("@/contexts/I18nContext", () => ({
	useScopedT: () => (key: string) => key,
}));

// Mock the recorder handle so we avoid a real MediaRecorder streaming pipeline.
const fakeRecorderHandle = {
	recorder: {
		state: "inactive",
		start: vi.fn(),
		stop: vi.fn(),
		pause: vi.fn(),
		resume: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		requestData: vi.fn(),
	},
	recordedBlobPromise: Promise.resolve(new Blob([], { type: "video/webm" })),
	isStreaming: vi.fn(() => false),
	discard: vi.fn().mockResolvedValue(undefined),
};
vi.mock("./recorderHandle", () => ({
	createRecorderHandle: () => fakeRecorderHandle,
}));

// eslint-disable-next-line import/first
import { useScreenRecorder } from "./useScreenRecorder";

type ElectronApi = Partial<Window["electronAPI"]>;

function installElectronApi(overrides: Partial<ElectronApi> = {}): ElectronApi {
	const api: ElectronApi = {
		getPlatform: () => "darwin",
		getSelectedSource: async () => ({
			id: "source-1",
			name: "Screen",
			display_id: "display-1",
			thumbnail: null,
			appIcon: null,
		}),
		requestNativeMacCursorAccess: async () => ({
			success: false,
			granted: false,
			status: "not-determined",
			accessibilityTrusted: false,
		}),
		isNativeMacCaptureAvailable: async () => ({
			success: true,
			available: false,
			reason: "unsupported-platform",
		}),
		isNativeWindowsCaptureAvailable: async () => ({
			success: true,
			available: false,
			reason: "unsupported-os",
		}),
		showCountdownOverlay: async () => undefined,
		setCountdownOverlayValue: async () => undefined,
		hideCountdownOverlay: async () => undefined,
		setRecordingState: vi.fn(),
		discardCursorTelemetry: vi.fn(),
		...overrides,
	};
	// Install on the global window so the hook reads it.
	(window as unknown as { electronAPI: ElectronApi }).electronAPI = api;
	return api;
}

function installMediaDevices() {
	const videoTrack = {
		kind: "video",
		getSettings: () => ({ width: 1920, height: 1080, frameRate: 60 }),
		stop: vi.fn(),
		applyConstraints: vi.fn(),
	};
	const fakeStream = {
		getVideoTracks: () => [videoTrack],
		getAudioTracks: () => [],
		getTracks: () => [videoTrack],
	};
	const mediaDevices = {
		getUserMedia: vi.fn().mockResolvedValue(fakeStream),
		getDisplayMedia: vi.fn().mockResolvedValue(fakeStream),
		enumerateDevices: vi.fn().mockResolvedValue([]),
	};
	Object.defineProperty(global.navigator, "mediaDevices", {
		value: mediaDevices,
		configurable: true,
	});
	// Minimal MediaRecorder stub so createRecorderHandle (mocked) isn't even
	// needed, but keep a global for any direct construction.
	(global as unknown as { MediaRecorder: unknown }).MediaRecorder = class {
		state = "inactive";
		start() {
			// stub
		}
		stop() {
			// stub
		}
		pause() {
			// stub
		}
		resume() {
			// stub
		}
		addEventListener() {
			// stub
		}
		removeEventListener() {
			// stub
		}
		static isTypeSupported() {
			return true;
		}
	};
	// Minimal MediaStream stub: jsdom does not provide one, but the recorder
	// pipeline constructs `new MediaStream()` and calls addTrack/getTracks on it
	// during startup. Provide a realistic, stoppable-track container so cleanup
	// (getTracks().forEach(stop)) does not throw unhandled rejections.
	class FakeMediaStream {
		private tracks: unknown[];
		constructor(tracks: unknown[] = []) {
			this.tracks = tracks;
		}
		addTrack(track: unknown) {
			this.tracks.push(track);
		}
		getTracks() {
			return this.tracks;
		}
		getVideoTracks() {
			return this.tracks.filter((t) => (t as { kind?: string }).kind === "video");
		}
		getAudioTracks() {
			return this.tracks.filter((t) => (t as { kind?: string }).kind === "audio");
		}
	}
	(global as unknown as { MediaStream: typeof FakeMediaStream }).MediaStream = FakeMediaStream;
}

describe("useScreenRecorder accessibility-denial regression (recorder-first fail-open)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		fakeRecorderHandle.recordedBlobPromise = Promise.resolve(new Blob([], { type: "video/webm" }));
		fakeRecorderHandle.isStreaming.mockReturnValue(false);
		installMediaDevices();
	});

	it("continues through the countdown and reaches recording startup when macOS accessibility is denied", async () => {
		const api = installElectronApi({
			requestNativeMacCursorAccess: async () => ({
				success: false,
				granted: false,
				status: "not-determined",
				accessibilityTrusted: false,
			}),
		});
		vi.useFakeTimers();

		const { result } = renderHook(() => useScreenRecorder());

		// Start the countdown (toggleRecording -> startRecordCountdown).
		act(() => {
			result.current.toggleRecording();
		});

		// Advance through the preflight + 3-second countdown so startRecording runs.
		// The preflight must NOT abort on denial: the countdown proceeds to recording.
		await act(async () => {
			await vi.advanceTimersByTimeAsync(3500);
		});

		// Recording startup is reached: setRecordingState(true, ..., mode) is
		// invoked. The effective cursor mode is the degraded "system" mode
		// (not "editable-overlay"), proving the denial continued in degraded mode.
		expect(api.setRecordingState).toHaveBeenCalled();
		const startupCall = (api.setRecordingState as ReturnType<typeof vi.fn>).mock.calls.find(
			(c: unknown[]) => c[0] === true,
		);
		expect(startupCall).toBeDefined();
		expect(startupCall![2]).toBe("system");
		expect(result.current.recording).toBe(true);

		vi.useRealTimers();
	});

	it("does not degrade and reaches recording startup when macOS accessibility is granted", async () => {
		const api = installElectronApi({
			requestNativeMacCursorAccess: async () => ({
				success: true,
				granted: true,
				status: "granted",
				accessibilityTrusted: true,
			}),
		});
		vi.useFakeTimers();

		const { result } = renderHook(() => useScreenRecorder());

		act(() => {
			result.current.toggleRecording();
		});

		await act(async () => {
			await vi.advanceTimersByTimeAsync(3500);
		});

		expect(api.setRecordingState).toHaveBeenCalled();
		const startupCall = (api.setRecordingState as ReturnType<typeof vi.fn>).mock.calls.find(
			(c: unknown[]) => c[0] === true,
		);
		expect(startupCall).toBeDefined();
		// Stable macOS browser fallback bakes the system cursor; native granted coverage below still requires editable-overlay.
		expect(startupCall![2]).toBe("system");
		expect(result.current.recording).toBe(true);

		vi.useRealTimers();
	});

	it("keeps the first recording's degraded cursor metadata while a granted retry starts", async () => {
		let resolveFirstBlob: ((blob: Blob) => void) | undefined;
		fakeRecorderHandle.recordedBlobPromise = new Promise<Blob>((resolve) => {
			resolveFirstBlob = resolve;
		});
		fakeRecorderHandle.isStreaming.mockReturnValue(true);
		const requestNativeMacCursorAccess = vi
			.fn()
			.mockResolvedValueOnce({
				success: false,
				granted: false,
				status: "not-determined",
				accessibilityTrusted: false,
			})
			.mockResolvedValueOnce({
				success: true,
				granted: true,
				status: "granted",
				accessibilityTrusted: true,
			});
		const storeRecordedSession = vi.fn(async () => ({
			success: true,
			path: "/tmp/first.showhow",
		}));
		installElectronApi({
			requestNativeMacCursorAccess,
			storeRecordedSession,
			setCurrentVideoPath: vi.fn(async () => ({ success: true })),
			switchToEditor: vi.fn(async () => undefined),
		});
		vi.useFakeTimers();

		const { result } = renderHook(() => useScreenRecorder());

		act(() => {
			result.current.toggleRecording();
		});
		await act(async () => {
			await vi.advanceTimersByTimeAsync(3500);
		});
		expect(result.current.recording).toBe(true);

		act(() => {
			result.current.toggleRecording();
		});
		expect(result.current.recording).toBe(false);

		// A retry can begin while the first recording is still awaiting its blob.
		// Its granted preflight resets the hook-level degradation refs.
		act(() => {
			result.current.toggleRecording();
		});
		await act(async () => {
			await vi.advanceTimersByTimeAsync(0);
		});
		expect(requestNativeMacCursorAccess).toHaveBeenCalledTimes(2);

		await act(async () => {
			resolveFirstBlob?.(new Blob([], { type: "video/webm" }));
			await Promise.resolve();
		});

		expect(storeRecordedSession).toHaveBeenCalledTimes(1);
		expect(storeRecordedSession).toHaveBeenCalledWith(
			expect.objectContaining({
				cursorCaptureMode: "system" as const,
				stepCaptureReason: "accessibility-denied",
			}),
		);

		vi.useRealTimers();
	});
});

describe("useScreenRecorder native macOS start request cursor mode (issue #27 live)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		installMediaDevices();
	});

	it("sends cursor.mode: system and hideSystemCursor: false to startNativeMacRecording when accessibility is denied", async () => {
		const startNativeMacRecording = vi.fn(
			async (
				..._args: Parameters<NonNullable<Window["electronAPI"]["startNativeMacRecording"]>>
			) => ({
				success: true,
				recordingId: 1234,
				path: "/tmp/rec.mp4",
				helperPath: "/tmp/helper",
			}),
		);
		installElectronApi({
			requestNativeMacCursorAccess: async () => ({
				success: false,
				granted: false,
				status: "not-determined",
				accessibilityTrusted: false,
			}),
			isNativeMacCaptureAvailable: async () => ({
				success: true,
				available: true,
				helperPath: "/tmp/helper",
			}),
			startNativeMacRecording,
		});
		vi.useFakeTimers();

		const { result } = renderHook(() => useScreenRecorder());

		act(() => {
			result.current.toggleRecording();
		});

		await act(async () => {
			await vi.advanceTimersByTimeAsync(3500);
		});

		// The actual native mac start request must use the degraded system mode,
		// not a stale editable-overlay closure.
		expect(startNativeMacRecording).toHaveBeenCalledTimes(1);
		const request = startNativeMacRecording.mock.calls[0]![0] as {
			cursor: { mode: string };
			video: { hideSystemCursor: boolean };
		};
		expect(request.cursor.mode).toBe("system");
		expect(request.video.hideSystemCursor).toBe(false);

		vi.useRealTimers();
	});

	it("sends cursor.mode: editable-overlay and hideSystemCursor: true when accessibility is granted", async () => {
		const startNativeMacRecording = vi.fn(
			async (
				..._args: Parameters<NonNullable<Window["electronAPI"]["startNativeMacRecording"]>>
			) => ({
				success: true,
				recordingId: 1235,
				path: "/tmp/rec.mp4",
				helperPath: "/tmp/helper",
			}),
		);
		installElectronApi({
			requestNativeMacCursorAccess: async () => ({
				success: true,
				granted: true,
				status: "granted",
				accessibilityTrusted: true,
			}),
			isNativeMacCaptureAvailable: async () => ({
				success: true,
				available: true,
				helperPath: "/tmp/helper",
			}),
			startNativeMacRecording,
		});
		vi.useFakeTimers();

		const { result } = renderHook(() => useScreenRecorder());

		act(() => {
			result.current.toggleRecording();
		});

		await act(async () => {
			await vi.advanceTimersByTimeAsync(3500);
		});

		expect(startNativeMacRecording).toHaveBeenCalledTimes(1);
		const request = startNativeMacRecording.mock.calls[0]![0] as {
			cursor: { mode: string };
			video: { hideSystemCursor: boolean };
		};
		expect(request.cursor.mode).toBe("editable-overlay");
		expect(request.video.hideSystemCursor).toBe(true);

		vi.useRealTimers();
	});
});

describe("useScreenRecorder native macOS stop passes stepCaptureReason (issue #27 live)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		installMediaDevices();
	});

	it("passes stepCaptureReason: accessibility-denied to stopNativeMacRecording when the recorder degraded", async () => {
		const startNativeMacRecording = vi.fn(
			async (
				..._args: Parameters<NonNullable<Window["electronAPI"]["startNativeMacRecording"]>>
			) => ({
				success: true,
				recordingId: 4242,
				path: "/tmp/rec.mp4",
				helperPath: "/tmp/helper",
			}),
		);
		const stopNativeMacRecording = vi.fn(
			async (
				..._args: Parameters<NonNullable<Window["electronAPI"]["stopNativeMacRecording"]>>
			) => ({
				success: true,
				path: "/tmp/rec.mp4",
				session: {
					screenVideoPath: "/tmp/rec.mp4",
					createdAt: 4242,
					cursorCaptureMode: "system" as const,
				},
			}),
		);
		installElectronApi({
			requestNativeMacCursorAccess: async () => ({
				success: false,
				granted: false,
				status: "not-determined",
				accessibilityTrusted: false,
			}),
			isNativeMacCaptureAvailable: async () => ({
				success: true,
				available: true,
				helperPath: "/tmp/helper",
			}),
			startNativeMacRecording,
			stopNativeMacRecording,
			setCurrentRecordingSession: vi.fn(async () => ({ success: true })),
			switchToEditor: vi.fn(async () => undefined),
		});
		vi.useFakeTimers();

		const { result } = renderHook(() => useScreenRecorder());

		// Start the countdown (degrades to system mode due to accessibility denial).
		act(() => {
			result.current.toggleRecording();
		});
		await act(async () => {
			await vi.advanceTimersByTimeAsync(3500);
		});

		expect(result.current.recording).toBe(true);

		// Stop the recording -> finalizeNativeMacRecording -> stopNativeMacRecording.
		await act(async () => {
			result.current.toggleRecording();
		});

		// The stop call must carry the accessibility-denied reason so the main
		// process can persist it into the bundle's meta.json.
		expect(stopNativeMacRecording).toHaveBeenCalledTimes(1);
		const stopArgs = stopNativeMacRecording.mock.calls[0];
		// Signature: (discard, durationMs, stepCaptureReason)
		expect(stopArgs![0]).toBe(false);
		expect(stopArgs![2]).toBe("accessibility-denied");

		vi.useRealTimers();
	});

	it("omits stepCaptureReason to stopNativeMacRecording when accessibility was granted", async () => {
		const startNativeMacRecording = vi.fn(
			async (
				..._args: Parameters<NonNullable<Window["electronAPI"]["startNativeMacRecording"]>>
			) => ({
				success: true,
				recordingId: 4243,
				path: "/tmp/rec.mp4",
				helperPath: "/tmp/helper",
			}),
		);
		const stopNativeMacRecording = vi.fn(
			async (
				..._args: Parameters<NonNullable<Window["electronAPI"]["stopNativeMacRecording"]>>
			) => ({
				success: true,
				path: "/tmp/rec.mp4",
				session: {
					screenVideoPath: "/tmp/rec.mp4",
					createdAt: 4243,
					cursorCaptureMode: "editable-overlay" as const,
				},
			}),
		);
		installElectronApi({
			requestNativeMacCursorAccess: async () => ({
				success: true,
				granted: true,
				status: "granted",
				accessibilityTrusted: true,
			}),
			isNativeMacCaptureAvailable: async () => ({
				success: true,
				available: true,
				helperPath: "/tmp/helper",
			}),
			startNativeMacRecording,
			stopNativeMacRecording,
			setCurrentRecordingSession: vi.fn(async () => ({ success: true })),
			switchToEditor: vi.fn(async () => undefined),
		});
		vi.useFakeTimers();

		const { result } = renderHook(() => useScreenRecorder());

		act(() => {
			result.current.toggleRecording();
		});
		await act(async () => {
			await vi.advanceTimersByTimeAsync(3500);
		});

		expect(result.current.recording).toBe(true);

		await act(async () => {
			result.current.toggleRecording();
		});

		expect(stopNativeMacRecording).toHaveBeenCalledTimes(1);
		const stopArgs = stopNativeMacRecording.mock.calls[0];
		// No degradation -> no stepCaptureReason (undefined).
		expect(stopArgs![0]).toBe(false);
		expect(stopArgs![2]).toBeUndefined();

		vi.useRealTimers();
	});
});
