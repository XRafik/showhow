// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCameraPreviewStream } from "./useCameraPreviewStream";

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
});

describe("useCameraPreviewStream cleanup", () => {
	it("uses only the selected camera and never asks for microphone audio", async () => {
		const track = { stop: vi.fn() };
		const stream = { getTracks: () => [track] } as unknown as MediaStream;
		const getUserMedia = vi.fn(async () => stream);
		Object.defineProperty(navigator, "mediaDevices", {
			configurable: true,
			value: { getUserMedia },
		});

		const { result } = renderHook(() =>
			useCameraPreviewStream({ enabled: true, deviceId: "camera-a" }),
		);
		await waitFor(() => expect(result.current.stream).toBe(stream));

		expect(getUserMedia).toHaveBeenCalledWith({
			audio: false,
			video: expect.objectContaining({ deviceId: { exact: "camera-a" } }),
		});
	});

	it.each([
		"disabled",
		"unmounted",
	] as const)("stops the preview track when %s", async (cleanupAction) => {
		const track = { stop: vi.fn() };
		const stream = { getTracks: () => [track] } as unknown as MediaStream;
		Object.defineProperty(navigator, "mediaDevices", {
			configurable: true,
			value: { getUserMedia: vi.fn(async () => stream) },
		});

		const view = renderHook(
			({ enabled }) => useCameraPreviewStream({ enabled, deviceId: "camera-a" }),
			{ initialProps: { enabled: true } },
		);
		await waitFor(() => expect(view.result.current.stream).toBe(stream));

		if (cleanupAction === "disabled") {
			view.rerender({ enabled: false });
		} else {
			view.unmount();
		}

		expect(track.stop).toHaveBeenCalledTimes(1);
	});

	it.each([
		"disabled",
		"unmounted",
	] as const)("stops a stream that resolves after the preview is %s", async (cleanupAction) => {
		const pending = deferred<MediaStream>();
		const track = { stop: vi.fn() };
		const stream = { getTracks: () => [track] } as unknown as MediaStream;
		const getUserMedia = vi.fn(() => pending.promise);
		Object.defineProperty(navigator, "mediaDevices", {
			configurable: true,
			value: { getUserMedia },
		});

		const view = renderHook(
			({ enabled }) => useCameraPreviewStream({ enabled, deviceId: "camera-a" }),
			{ initialProps: { enabled: true } },
		);
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
		if (cleanupAction === "disabled") {
			expect(view.result.current.stream).toBeNull();
		}
	});
});
