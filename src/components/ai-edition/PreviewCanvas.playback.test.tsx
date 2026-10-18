// @vitest-environment jsdom
import "@testing-library/jest-dom";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EditorDialogsProvider } from "@/contexts/EditorDialogsContext";
import { createEmptyDocument } from "@/lib/ai-edition/schema";
import { useProjectStore } from "@/lib/ai-edition/store/projectStore";
import type { NativeBridgeRequest } from "@/native/contracts";
import { NewEditorShell } from "./NewEditorShell";

vi.mock("@/contexts/ShortcutsContext", async () => {
	const { DEFAULT_SHORTCUTS } = await import("@/lib/shortcuts");
	return {
		useShortcuts: () => ({
			shortcuts: DEFAULT_SHORTCUTS,
			isMac: false,
			isConfigOpen: false,
			openConfig: vi.fn(),
			closeConfig: vi.fn(),
			setShortcuts: vi.fn(),
			persistShortcuts: () => Promise.resolve(true),
		}),
	};
});
vi.mock("@/contexts/I18nContext", () => ({
	useI18n: () => ({ locale: "en", setLocale: vi.fn() }),
	useScopedT: () => (key: string) => key,
}));

const requests: NativeBridgeRequest[] = [];
let frames = new Map<number, FrameRequestCallback>();
let nextFrame = 0;
let nextNativeView = 0;
let media = new WeakMap<HTMLMediaElement, { paused: boolean }>();

function documentFor(assetId: string) {
	const doc = createEmptyDocument({ projectId: "recording", title: "Synthetic recording" });
	doc.project.primaryAssetId = assetId;
	doc.assets = [
		{
			id: assetId,
			kind: "video",
			label: assetId,
			originalPath: `/${assetId}.mp4`,
			durationSec: 10,
			cameraTrack: null,
		},
	];
	doc.timeline.clips = [
		{
			id: `clip-${assetId}`,
			assetId,
			sourceStartSec: 0,
			sourceEndSec: 10,
			timelineStartSec: 0,
			timelineEndSec: 10,
			wordRefs: [],
			origin: "system",
			reason: "",
		},
	];
	return doc;
}

beforeEach(() => {
	requests.length = 0;
	frames = new Map();
	media = new WeakMap();
	vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
		const id = ++nextFrame;
		frames.set(id, cb);
		return id;
	});
	vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
	vi.stubGlobal(
		"ResizeObserver",
		class {
			observe = vi.fn();
			unobserve = vi.fn();
			disconnect = vi.fn();
		},
	);
	Element.prototype.scrollTo = vi.fn();
	vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
	vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 640, 400));
	vi.spyOn(HTMLMediaElement.prototype, "paused", "get").mockImplementation(function (
		this: HTMLMediaElement,
	) {
		return media.get(this)?.paused ?? true;
	});
	vi.spyOn(HTMLMediaElement.prototype, "readyState", "get").mockReturnValue(4);
	vi.spyOn(HTMLMediaElement.prototype, "duration", "get").mockReturnValue(10);
	// jsdom has no media clock: emulate only platform play/pause and their real DOM events.
	vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(function (
		this: HTMLMediaElement,
	) {
		media.set(this, { paused: false });
		this.dispatchEvent(new Event("play"));
		return Promise.resolve();
	});
	vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(function (
		this: HTMLMediaElement,
	) {
		media.set(this, { paused: true });
		this.dispatchEvent(new Event("pause"));
	});
	vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => undefined);
	(window as unknown as { electronAPI: unknown }).electronAPI = {
		onAiEditionChatEvent: () => () => undefined,
		setTitleBarOverlay: () => undefined,
		setHasUnsavedChanges: () => undefined,
		onRequestCloseConfirm: () => () => undefined,
		onRequestSaveBeforeClose: () => () => undefined,
		sendCloseConfirmResponse: () => undefined,
		findRecordingCamera: async () => null,
		preparePreviewAudioTrack: async () => ({ success: true, path: null }),
		isAppPackaged: () => false,
		invokeNativeBridge: async (request: NativeBridgeRequest) => {
			requests.push(request);
			let data: unknown = { document: useProjectStore.getState().document };
			if (request.domain === "compositor") {
				data =
					request.action === "createView"
						? { id: ++nextNativeView }
						: request.action === "probeBackend"
							? { backend: "hardware" }
							: request.action === "readFrame"
								? null
								: { ok: true };
			}
			return { ok: true, data, meta: { version: 1, requestId: "test", timestampMs: 0 } };
		},
	};
	useProjectStore.setState({
		document: documentFor("first"),
		projectId: "recording",
		status: "ready",
		playing: false,
		currentTimeSec: 0,
	});
});

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	useProjectStore.setState({ document: null, projectId: null, playing: false, currentTimeSec: 0 });
});

it("keeps first Play, replay and a replacement recording connected to the live media and native transport", async () => {
	const view = render(
		<StrictMode>
			<TooltipProvider>
				<EditorDialogsProvider>
					<NewEditorShell />
				</EditorDialogsProvider>
			</TooltipProvider>
		</StrictMode>,
	);
	const preview = () => view.container.querySelector('[data-testid="preview"]');
	const nativePlaying = () =>
		requests.filter((r) => r.domain === "compositor" && r.action === "setPlaying").at(-1);
	const loaded = new WeakSet<HTMLVideoElement>();
	async function playAndAdvance() {
		const video = view.container.querySelector("video");
		if (!video) throw new Error("Actual preview video was not mounted");
		if (!loaded.has(video)) {
			act(() => fireEvent.loadedMetadata(video));
			loaded.add(video);
		}
		await waitFor(() =>
			expect(requests.some((r) => r.domain === "compositor" && r.action === "createView")).toBe(
				true,
			),
		);
		const playsBefore = vi
			.mocked(HTMLMediaElement.prototype.play)
			.mock.contexts.filter((el) => el === video).length;
		act(() => fireEvent.click(screen.getByRole("button", { name: "transport.play" })));
		expect(
			vi.mocked(HTMLMediaElement.prototype.play).mock.contexts.filter((el) => el === video),
		).toHaveLength(playsBefore + 1);
		expect(video.paused).toBe(false);
		expect(preview()).toHaveAttribute("data-is-playing", "true");
		expect(screen.getByRole("button", { name: "transport.pause" })).toHaveAttribute(
			"data-playing",
			"true",
		);
		await waitFor(() => expect(nativePlaying()).toMatchObject({ payload: { playing: true } }));
		for (const time of [1, 4]) {
			await act(async () => {
				video.currentTime = time;
				const pending = frames;
				frames = new Map();
				for (const callback of pending.values()) callback(performance.now());
			});
			expect(preview()).toHaveAttribute("data-current-time-sec", time.toFixed(3));
			expect(preview()).toHaveAttribute("data-is-playing", "true");
			expect(nativePlaying()).toMatchObject({ payload: { playing: true } });
		}
		await act(async () => {
			video.currentTime = 10;
			media.set(video, { paused: true });
			fireEvent.ended(video);
		});
		expect(video.paused).toBe(true);
		expect(preview()).toHaveAttribute("data-is-playing", "false");
		return video;
	}
	const first = await playAndAdvance();
	await playAndAdvance();
	act(() =>
		useProjectStore.setState({
			document: documentFor("second"),
			currentTimeSec: 0,
			playing: false,
		}),
	);
	const second = await playAndAdvance();
	expect(second).not.toBe(first);
	expect(first.isConnected).toBe(false);
});

it("restarts after the final clip guard pauses just before the browser reports ended", async () => {
	const duration = 13.243333;
	vi.spyOn(HTMLMediaElement.prototype, "duration", "get").mockReturnValue(duration);
	const doc = documentFor("early-stop");
	doc.assets[0].durationSec = duration;
	doc.timeline.clips[0].sourceEndSec = duration;
	doc.timeline.clips[0].timelineEndSec = duration;
	useProjectStore.setState({ document: doc });
	const view = render(
		<StrictMode>
			<TooltipProvider>
				<EditorDialogsProvider>
					<NewEditorShell />
				</EditorDialogsProvider>
			</TooltipProvider>
		</StrictMode>,
	);
	const video = view.container.querySelector("video");
	if (!video) throw new Error("Actual preview video was not mounted");
	await act(async () => {
		fireEvent.loadedMetadata(video);
	});
	await waitFor(() =>
		expect(requests.some((r) => r.domain === "compositor" && r.action === "createView")).toBe(true),
	);
	const frame = async () => {
		await act(async () => {
			const pending = frames;
			frames = new Map();
			for (const callback of pending.values()) callback(performance.now());
		});
	};
	act(() => fireEvent.click(screen.getByRole("button", { name: "transport.play" })));
	video.currentTime = 1;
	await frame();
	// Real j media stopped 30 ms before physical end; no browser ended event fired.
	video.currentTime = 13.212847;
	await frame();
	expect(video.currentTime).toBe(13.212847);
	expect(video.paused).toBe(true);
	expect(video.ended).toBe(false);
	expect(useProjectStore.getState().currentTimeSec).toBeCloseTo(duration, 5);
	act(() => fireEvent.click(screen.getByRole("button", { name: "transport.play" })));
	await frame();
	expect({ paused: video.paused, playing: useProjectStore.getState().playing }).toEqual({
		paused: false,
		playing: true,
	});
	expect(video.currentTime).toBeCloseTo(0, 5);
	expect(
		requests.filter((r) => r.domain === "compositor" && r.action === "setPlaying").at(-1),
	).toMatchObject({ payload: { playing: true } });
});

function mountShell() {
	const view = render(
		<StrictMode>
			<TooltipProvider>
				<EditorDialogsProvider>
					<NewEditorShell />
				</EditorDialogsProvider>
			</TooltipProvider>
		</StrictMode>,
	);
	const video = () => {
		const element = view.container.querySelector("video");
		if (!element) throw new Error("Actual preview video was not mounted");
		return element;
	};
	const metadata = async () => {
		await act(async () => {
			fireEvent.loadedMetadata(video());
		});
	};
	const frame = async (time: number) => {
		await act(async () => {
			video().currentTime = time;
			const pending = frames;
			frames = new Map();
			for (const callback of pending.values()) callback(performance.now());
		});
	};
	const play = () =>
		act(() => fireEvent.click(screen.getByRole("button", { name: "transport.play" })));
	return { video, metadata, frame, play };
}

it("resumes paused midclip media without rewinding it", async () => {
	const shell = mountShell();
	await shell.metadata();
	shell.play();
	await shell.frame(4);
	act(() => fireEvent.click(screen.getByRole("button", { name: "transport.pause" })));
	shell.play();
	await shell.frame(4.5);
	expect(shell.video().currentTime).toBe(4.5);
	expect(shell.video().paused).toBe(false);
	expect(useProjectStore.getState().currentTimeSec).toBe(4.5);
});

it("restarts a multi-asset timeline on the first kept source in-point", async () => {
	const doc = documentFor("first");
	doc.assets.push({ ...doc.assets[0], id: "last", originalPath: "/last.mp4" });
	doc.timeline.clips.push({
		...doc.timeline.clips[0],
		id: "clip-last",
		assetId: "last",
		timelineStartSec: 10,
		timelineEndSec: 20,
	});
	doc.timeline.trimRanges = [
		{
			id: "leading-trim",
			assetId: "first",
			clipId: "clip-first",
			startSec: 0,
			endSec: 2,
			origin: "user",
			reason: "",
		},
	];
	useProjectStore.setState({ document: doc });
	const shell = mountShell();
	await shell.metadata();
	shell.play();
	await shell.frame(3);
	const first = shell.video();
	await shell.frame(9.97);
	expect(shell.video()).not.toBe(first);
	await shell.metadata();
	expect(shell.video().paused).toBe(false);
	await shell.frame(1);
	await shell.frame(9.97);
	expect(shell.video().paused).toBe(true);
	expect(useProjectStore.getState().currentTimeSec).toBe(20);
	const last = shell.video();
	shell.play();
	expect(shell.video()).not.toBe(last);
	expect(shell.video().paused).toBe(true);
	await shell.metadata();
	expect(shell.video().currentTime).toBe(2);
	expect(shell.video().paused).toBe(false);
	expect(useProjectStore.getState().currentTimeSec).toBe(2);
	await shell.frame(2.5);
	expect(useProjectStore.getState().playing).toBe(true);
	expect(useProjectStore.getState().currentTimeSec).toBe(2.5);
});

it("keeps a rejected terminal restart paused", async () => {
	const shell = mountShell();
	await shell.metadata();
	shell.play();
	await shell.frame(1);
	await shell.frame(9.97);
	vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValueOnce(
		new DOMException("Blocked", "NotAllowedError"),
	);
	shell.play();
	await shell.frame(0);
	expect(shell.video().paused).toBe(true);
	expect(useProjectStore.getState().playing).toBe(false);
	expect(shell.video().currentTime).toBe(0);
});

it("does not restart when all source segments are trimmed away", async () => {
	const doc = documentFor("first");
	doc.timeline.trimRanges = [
		{
			id: "all",
			assetId: "first",
			clipId: "clip-first",
			startSec: 0,
			endSec: 10,
			origin: "user",
			reason: "",
		},
	];
	useProjectStore.setState({ document: doc });
	const shell = mountShell();
	await shell.metadata();
	act(() => useProjectStore.getState().setCurrentTime(10));
	const calls = vi.mocked(HTMLMediaElement.prototype.play).mock.calls.length;
	shell.play();
	expect(vi.mocked(HTMLMediaElement.prototype.play)).toHaveBeenCalledTimes(calls);
	expect(shell.video().paused).toBe(true);
	expect(useProjectStore.getState().playing).toBe(false);
});
