import "@/index.css";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { RecordingLibrary } from "@/components/library/RecordingLibrary";
import { I18nProvider } from "@/contexts/I18nContext";
import type { RecordingLibraryEntry } from "@/lib/showhow/recordingLibrary";

const clips = [
	{ name: "landscape", width: 1280, height: 720 },
	{ name: "portrait", width: 720, height: 1280 },
	{ name: "square", width: 720, height: 720 },
] as const;

async function makeSyntheticClip(width: number, height: number) {
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext("2d");
	if (!context || !canvas.captureStream || !MediaRecorder.isTypeSupported("video/webm;codecs=vp8"))
		throw new Error("Chromium WebM canvas recording is unavailable");

	const drawFrame = (color: string) => {
		context.fillStyle = color;
		context.fillRect(0, 0, width, height);
		context.fillStyle = "#ffffff";
		context.fillRect(width * 0.08, height * 0.08, width * 0.18, height * 0.18);
		context.fillStyle = "#ff00ff";
		context.fillRect(width * 0.74, height * 0.74, width * 0.18, height * 0.18);
	};
	drawFrame("#00b875");
	const stream = canvas.captureStream(12);
	const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp8" });
	const chunks: BlobPart[] = [];
	const stopped = new Promise<Blob>((resolve, reject) => {
		recorder.ondataavailable = (event) => chunks.push(event.data);
		recorder.onerror = () => reject(new Error("Synthetic clip recording failed"));
		recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType }));
	});
	recorder.start(100);
	await new Promise((resolve) => setTimeout(resolve, 450));
	drawFrame("#2155d8");
	await new Promise((resolve) => setTimeout(resolve, 850));
	recorder.stop();
	const blob = await stopped;
	stream.getTracks().forEach((track) => track.stop());
	return URL.createObjectURL(blob);
}

describe("RecordingLibrary video preview in Chromium", () => {
	it("fills the Library preview at minimum and reference widths without breaking transport", async () => {
		const urls: string[] = [];
		const container = document.createElement("div");
		container.style.cssText = "width:100vw;height:100vh";
		document.body.appendChild(container);
		const entries: RecordingLibraryEntry[] = [];
		let cleanup: () => void = () => undefined;
		try {
			for (const clip of clips) {
				const videoUrl = await makeSyntheticClip(clip.width, clip.height);
				urls.push(videoUrl);
				entries.push({
					bundleDir: `/tmp/showhow-171-synthetic-${clip.name}`,
					title: `Synthetic ${clip.name}`,
					source: "desktop",
					createdAt: Date.UTC(2026, 9, 22),
					durationMs: 1_200,
					video: "video.webm",
					videoUrl,
				});
			}
			Object.defineProperty(window, "electronAPI", {
				configurable: true,
				value: { showhowListRecordings: vi.fn(async () => entries) },
			});

			const observations: Array<{
				viewport: string;
				clip: string;
				mainWidth: number;
				playerWidth: number;
				playerHeight: number;
				videoBoxWidth: number;
				videoBoxHeight: number;
				videoWidth: number;
				videoHeight: number;
				renderedWidth: number;
				renderedHeight: number;
				controlsBottom: number;
			}> = [];
			const getVideo = () => screen.getByLabelText("Recording video") as HTMLVideoElement;
			const select = async (name: (typeof clips)[number]["name"]) => {
				await userEvent.click(
					screen.getByRole("button", { name: new RegExp(`Synthetic ${name}`) }),
				);
				await waitFor(() =>
					expect(getVideo().videoWidth).toBe(clips.find((clip) => clip.name === name)?.width),
				);
			};
			const capture = async (viewport: string, name: (typeof clips)[number]["name"]) => {
				await select(name);
				const video = getVideo();
				const main = video.closest("main");
				const player = video.parentElement;
				if (!main || !player) throw new Error("Expected the Library recording preview");
				await waitFor(() => expect(video.readyState).toBeGreaterThanOrEqual(2));
				const videoRect = video.getBoundingClientRect();
				const controls = player.lastElementChild;
				if (!controls) throw new Error("Expected the Library preview controls");
				const scale = Math.min(
					videoRect.width / video.videoWidth,
					videoRect.height / video.videoHeight,
				);
				observations.push({
					viewport,
					clip: name,
					mainWidth: main.getBoundingClientRect().width,
					playerWidth: player.getBoundingClientRect().width,
					playerHeight: player.getBoundingClientRect().height,
					videoBoxWidth: videoRect.width,
					videoBoxHeight: videoRect.height,
					videoWidth: video.videoWidth,
					videoHeight: video.videoHeight,
					renderedWidth: video.videoWidth * scale,
					renderedHeight: video.videoHeight * scale,
					controlsBottom: controls.getBoundingClientRect().bottom,
				});
			};

			await page.viewport(800, 600);
			cleanup = render(
				<I18nProvider>
					<RecordingLibrary />
				</I18nProvider>,
				{ container },
			).unmount;
			await screen.findByRole("heading", { level: 1, name: "Synthetic landscape" });
			for (const clip of clips) await capture("800x600", clip.name);

			await page.viewport(1200, 800);
			await waitFor(() => expect(getVideo().getBoundingClientRect().width).toBeGreaterThan(700));
			for (const clip of clips) await capture("1200x800", clip.name);

			await select("landscape");
			let video = getVideo();
			await userEvent.click(screen.getByRole("button", { name: "Play" }));
			await waitFor(() => expect(video.currentTime).toBeGreaterThan(0.2), { timeout: 3000 });
			await userEvent.click(screen.getByRole("button", { name: "Pause" }));
			const seek = screen.getByRole("slider", { name: "Seek" });
			const targetMs = Math.round(Math.min(video.duration * 1000 * 0.65, 650));
			fireEvent.change(seek, { target: { value: String(targetMs) } });
			await waitFor(() => expect(video.currentTime).toBeCloseTo(targetMs / 1000, 1));
			await userEvent.click(screen.getByRole("button", { name: /Synthetic portrait/ }));
			await waitFor(() => expect(getVideo().videoHeight).toBe(1280));
			video = getVideo();
			expect(video.currentTime).toBe(0);

			const message = JSON.stringify(observations, null, 2);
			console.info("SHOWHOW_171_GEOMETRY", message);
			expect(
				observations
					.filter((item) => item.viewport === "800x600")
					.every((item) => item.controlsBottom <= 600),
				message,
			).toBe(true);
			expect(
				observations
					.filter((item) => item.viewport === "800x600")
					.every((item) => item.mainWidth === 528),
				message,
			).toBe(true);
			expect(
				observations
					.filter((item) => item.viewport === "1200x800")
					.every((item) => item.mainWidth === 928),
				message,
			).toBe(true);
			const landscape = observations.filter((item) => item.clip === "landscape");
			expect(
				landscape.every(
					(item) =>
						Math.abs(item.videoBoxWidth / item.videoBoxHeight - 16 / 9) < 0.02 &&
						item.renderedWidth >= item.videoBoxWidth - 1,
				),
				message,
			).toBe(true);
			const contained = observations.filter((item) => item.clip !== "landscape");
			expect(
				contained.every(
					(item) =>
						Math.abs(
							item.renderedWidth / item.renderedHeight - item.videoWidth / item.videoHeight,
						) < 0.01 && item.renderedHeight >= item.videoBoxHeight - 1,
				),
				message,
			).toBe(true);
		} finally {
			cleanup();
			urls.forEach((url) => URL.revokeObjectURL(url));
			container.remove();
		}
	});
});
