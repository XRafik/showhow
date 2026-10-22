// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAudioLevelMeter } from "./useAudioLevelMeter";

const mediaDevicesDescriptor = Object.getOwnPropertyDescriptor(navigator, "mediaDevices");

function deferred<T>() {
	let resolve!: (value: T | PromiseLike<T>) => void;
	const promise = new Promise<T>((settle) => {
		resolve = settle;
	});
	return { promise, resolve };
}

afterEach(() => {
	if (mediaDevicesDescriptor) {
		Object.defineProperty(navigator, "mediaDevices", mediaDevicesDescriptor);
	} else {
		Reflect.deleteProperty(navigator, "mediaDevices");
	}
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe("useAudioLevelMeter cleanup", () => {
	it("does not request a microphone while disabled", () => {
		const getUserMedia = vi.fn();
		Object.defineProperty(navigator, "mediaDevices", {
			configurable: true,
			value: { getUserMedia },
		});

		renderHook(() => useAudioLevelMeter({ enabled: false }));

		expect(getUserMedia).not.toHaveBeenCalled();
	});

	it.each([
		["selected", "mic-a", { audio: { deviceId: { exact: "mic-a" } }, video: false }],
		["default", undefined, { audio: true, video: false }],
	] as const)("requests the %s microphone without video", async (_name, deviceId, constraints) => {
		const getUserMedia = vi.fn(() => new Promise<MediaStream>(() => undefined));
		Object.defineProperty(navigator, "mediaDevices", {
			configurable: true,
			value: { getUserMedia },
		});

		const view = renderHook(() => useAudioLevelMeter({ enabled: true, deviceId }));
		await waitFor(() => expect(getUserMedia).toHaveBeenCalledTimes(1));

		expect(getUserMedia).toHaveBeenCalledWith(constraints);
		view.unmount();
	});

	it("reports a failed microphone acquisition", async () => {
		Object.defineProperty(navigator, "mediaDevices", {
			configurable: true,
			value: { getUserMedia: vi.fn(async () => Promise.reject(new Error("denied"))) },
		});
		vi.spyOn(console, "error").mockImplementation(() => undefined);

		const { result } = renderHook(() => useAudioLevelMeter({ enabled: true }));

		await waitFor(() => expect(result.current.error).toBe(true));
		expect(result.current.level).toBe(0);
	});

	it.each([
		"disabled",
		"unmounted",
	] as const)("stops a microphone stream that resolves after it is %s", async (cleanupAction) => {
		const pending = deferred<MediaStream>();
		const track = { stop: vi.fn() };
		const stream = { getTracks: () => [track] } as unknown as MediaStream;
		const getUserMedia = vi.fn(() => pending.promise);
		let audioContextCreated = false;
		class MockAudioContext {
			constructor() {
				audioContextCreated = true;
			}
		}
		Object.defineProperty(navigator, "mediaDevices", {
			configurable: true,
			value: { getUserMedia },
		});
		vi.stubGlobal("AudioContext", MockAudioContext);

		const view = renderHook(({ enabled }) => useAudioLevelMeter({ enabled }), {
			initialProps: { enabled: true },
		});
		await waitFor(() => expect(getUserMedia).toHaveBeenCalledTimes(1));

		if (cleanupAction === "disabled") {
			view.rerender({ enabled: false });
		} else {
			view.unmount();
		}

		await act(async () => {
			pending.resolve(stream);
			await pending.promise;
		});

		expect(track.stop).toHaveBeenCalledTimes(1);
		expect(audioContextCreated).toBe(false);
	});

	it.each([
		"disabled",
		"unmounted",
	] as const)("closes a pending audio context and skips setup when %s during resume", async (cleanupAction) => {
		const resume = deferred<void>();
		const track = { stop: vi.fn() };
		const stream = { getTracks: () => [track] } as unknown as MediaStream;
		const analyser = { getByteFrequencyData: vi.fn() } as unknown as AnalyserNode;
		const source = { connect: vi.fn() } as unknown as MediaStreamAudioSourceNode;
		const createdAudioContext: { current: MockAudioContext | null } = { current: null };
		class MockAudioContext {
			constructor() {
				createdAudioContext.current = this;
			}

			state: AudioContextState = "suspended";
			resume = vi.fn(() => resume.promise);
			close = vi.fn(async () => undefined);
			createAnalyser = vi.fn(() => analyser);
			createMediaStreamSource = vi.fn(() => source);
		}
		const getUserMedia = vi.fn(async () => stream);
		Object.defineProperty(navigator, "mediaDevices", {
			configurable: true,
			value: { getUserMedia },
		});
		vi.stubGlobal("AudioContext", MockAudioContext);

		const view = renderHook(({ enabled }) => useAudioLevelMeter({ enabled }), {
			initialProps: { enabled: true },
		});
		await waitFor(() => expect(getUserMedia).toHaveBeenCalledTimes(1));
		await waitFor(() => expect(createdAudioContext.current?.resume).toHaveBeenCalledTimes(1));
		const audioContext = createdAudioContext.current;
		if (!audioContext) throw new Error("The hook did not create an audio context");

		if (cleanupAction === "disabled") {
			view.rerender({ enabled: false });
		} else {
			view.unmount();
		}

		await act(async () => {
			resume.resolve();
			await resume.promise;
		});

		expect(track.stop).toHaveBeenCalledTimes(1);
		expect(audioContext.close).toHaveBeenCalledTimes(1);
		expect(audioContext.createAnalyser).not.toHaveBeenCalled();
	});
});
