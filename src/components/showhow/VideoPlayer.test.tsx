// @vitest-environment jsdom
import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { VideoPlayer } from "./VideoPlayer";

describe("VideoPlayer media behavior", () => {
	it("uses decoded duration when a legacy bundle has no duration metadata", () => {
		const { container } = render(<VideoPlayer src="video.mp4" durationMs={0} />);
		const video = container.querySelector("video")!;
		Object.defineProperty(video, "duration", { value: 18, configurable: true });
		fireEvent.loadedMetadata(video);
		expect(screen.queryByText("0:00 / 0:18")).not.toBeNull();
		expect(screen.getByRole("slider", { name: "Seek" })).toHaveAttribute("max", "18000");
	});
	it("exposes the actual media element for workflow timestamp seeks and updates the transport", () => {
		let media: HTMLVideoElement | null = null;
		const { unmount } = render(
			<VideoPlayer
				src="video.mp4"
				durationMs={65_000}
				onVideoReady={(video) => {
					media = video;
				}}
			/>,
		);
		expect(media).not.toBeNull();
		if (!media) return;
		(media as HTMLVideoElement).currentTime = 12;
		fireEvent(media, new Event("seeked"));
		expect(screen.getByText("0:12 / 1:05")).toBeVisible();
		unmount();
		expect(media).toBeNull();
	});
	it("syncs the Play affordance with native play and pause events", () => {
		const { container } = render(<VideoPlayer src="video.mp4" durationMs={65_000} />);
		const video = container.querySelector("video");
		if (!video) throw new Error("Expected the video element to render");

		fireEvent(video, new Event("play"));
		expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();

		fireEvent(video, new Event("pause"));
		expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
	});

	it("resets its displayed position and playback affordance when src changes", () => {
		const { container, rerender } = render(<VideoPlayer src="video-a.mp4" durationMs={65_000} />);
		const video = container.querySelector("video");
		if (!video) throw new Error("Expected the video element to render");

		video.currentTime = 23;
		fireEvent(video, new Event("timeupdate"));
		expect(screen.getByText("0:23 / 1:05")).toBeInTheDocument();

		const play = vi.spyOn(video, "play").mockImplementation(() => new Promise(() => undefined));
		fireEvent.click(screen.getByRole("button", { name: "Play" }));
		expect(play).toHaveBeenCalledOnce();
		fireEvent(video, new Event("play"));
		expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();

		rerender(<VideoPlayer src="video-b.mp4" durationMs={65_000} />);
		expect(screen.getByText("0:00 / 1:05")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
	});

	it("ignores a stale play promise after src changes", async () => {
		const { container, rerender } = render(<VideoPlayer src="video-a.mp4" durationMs={65_000} />);
		const video = container.querySelector("video");
		if (!video) throw new Error("Expected the video element to render");
		let resolvePlay: (() => void) | undefined;
		const playPromise = new Promise<void>((resolve) => (resolvePlay = resolve));
		vi.spyOn(video, "play").mockReturnValue(playPromise);

		fireEvent.click(screen.getByRole("button", { name: "Play" }));
		fireEvent(video, new Event("play"));
		expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
		rerender(<VideoPlayer src="video-b.mp4" durationMs={65_000} />);

		await act(async () => resolvePlay?.());
		expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
	});

	it("plays and pauses the video element when its controls are clicked", async () => {
		const { container } = render(<VideoPlayer src="video.mp4" durationMs={65_000} />);
		const video = container.querySelector("video");
		if (!video) throw new Error("Expected the video element to render");
		const play = vi.spyOn(video, "play").mockResolvedValue(undefined);
		const pause = vi.spyOn(video, "pause").mockImplementation(() => undefined);

		fireEvent.click(screen.getByRole("button", { name: "Play" }));
		expect(play).toHaveBeenCalledOnce();
		await waitFor(() => expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument());

		fireEvent.click(screen.getByRole("button", { name: "Pause" }));
		expect(pause).toHaveBeenCalledOnce();
		expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
	});

	it("keeps the Play affordance when playback is rejected", async () => {
		const { container } = render(<VideoPlayer src="video.mp4" durationMs={65_000} />);
		const video = container.querySelector("video");
		if (!video) throw new Error("Expected the video element to render");
		let rejectPlay: ((reason: DOMException) => void) | undefined;
		const playPromise = new Promise<void>((_resolve, reject) => (rejectPlay = reject));
		vi.spyOn(video, "play").mockReturnValue(playPromise);

		fireEvent.click(screen.getByRole("button", { name: "Play" }));
		await act(async () => {
			rejectPlay?.(new DOMException("NotAllowedError", "NotAllowedError"));
			await playPromise.catch(() => undefined);
		});
		expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
	});

	it("shows Pause only after the play promise resolves", async () => {
		const { container } = render(<VideoPlayer src="video.mp4" durationMs={65_000} />);
		const video = container.querySelector("video");
		if (!video) throw new Error("Expected the video element to render");
		let resolvePlay: (() => void) | undefined;
		vi.spyOn(video, "play").mockImplementation(
			() => new Promise<void>((resolve) => (resolvePlay = resolve)),
		);

		fireEvent.click(screen.getByRole("button", { name: "Play" }));
		expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();

		await act(async () => resolvePlay?.());
		await waitFor(() => expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument());
	});

	it("seeks the video and reflects position changes from timeupdate events", () => {
		const { container } = render(<VideoPlayer src="video.mp4" durationMs={65_000} />);
		const video = container.querySelector("video");
		if (!video) throw new Error("Expected the video element to render");
		const seek = screen.getByRole("slider", { name: "Seek" });

		fireEvent.change(seek, { target: { value: "12000" } });
		expect(video.currentTime).toBe(12);

		video.currentTime = 23;
		fireEvent(video, new Event("timeupdate"));
		expect(screen.getByText("0:23 / 1:05")).toBeInTheDocument();
		expect(seek).toHaveValue("23000");
	});
});
