import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
	DEFAULT_GUIDE_MODEL,
	type GuideOptions,
	type GuidePreview,
} from "../../src/lib/showhow/aiGuide";
import {
	type GuideMessage,
	type PreparedGuide,
	prepareGuide,
	readGuideSources,
	runAiGuide,
} from "./aiGuide";
export interface GuideIpcEvent {
	sender: { id: number; send: (channel: string, payload: unknown) => void };
}
export type GuideIpcHandler = (event: GuideIpcEvent, ...args: unknown[]) => Promise<unknown>;
export interface GuideConfigStore {
	getApiKey: (provider: string) => string | null;
	getConfig: () => { provider: string; model: string } | null;
	setConfig: (config: { provider: string; model: string }) => Promise<void>;
	setCredential: (provider: string, entry: { kind: "api-key"; apiKey: string }) => Promise<void>;
	removeCredential: (provider: string) => Promise<void>;
}
interface Consent {
	openrouter?: { reviewedAt: number; alwaysSend: boolean; options: GuideOptions };
}
export function registerAiGuideHandlers(deps: {
	handle: (channel: string, handler: GuideIpcHandler) => void;
	recordingsRoot: string;
	preferencesDir: string;
	getStore: () => GuideConfigStore;
	createModel: (
		key: string,
		model: string,
	) => Promise<(messages: GuideMessage[]) => Promise<string>>;
}) {
	const previews = new Map<
		string,
		{
			bundle: string;
			sender: number;
			prepared: PreparedGuide;
			model: string;
			options: GuideOptions;
		}
	>();
	const running = new Set<string>();
	const consentFile = path.join(deps.preferencesDir, "showhow-ai-guide-consent.json");
	const readConsent = async (): Promise<Consent> => {
		try {
			return JSON.parse(await fs.readFile(consentFile, "utf8")) as Consent;
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
			throw error;
		}
	};
	const getModel = () => {
		const config = deps.getStore().getConfig();
		return config?.provider === "openrouter" && config.model.trim()
			? config.model
			: DEFAULT_GUIDE_MODEL;
	};
	async function bundlePath(value: unknown): Promise<string> {
		if (typeof value !== "string") throw new Error("Invalid bundle");
		const root = await fs.realpath(deps.recordingsRoot);
		const resolved = path.resolve(value);
		if (!resolved.startsWith(path.resolve(deps.recordingsRoot) + path.sep))
			throw new Error("Outside recordings root");
		const real = await fs.realpath(resolved);
		if (!real.startsWith(root + path.sep)) throw new Error("Outside recordings root");
		for (const name of [
			"meta.json",
			"steps.json",
			"steps.md",
			"steps.deterministic.json",
			"transcript.txt",
			"video.mp4",
			"video.webm",
			"screenshots",
		]) {
			try {
				if ((await fs.lstat(path.join(real, name))).isSymbolicLink())
					throw new Error("Bundle symlink rejected");
			} catch (error) {
				if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
			}
		}
		return real;
	}
	const handle = (name: string, fn: GuideIpcHandler) =>
		deps.handle(`showhow:ai-guide-${name}`, async (event, ...args) => {
			try {
				return await fn(event, ...args);
			} catch {
				return {
					success: false,
					error: "Couldn’t prepare or save the guide. Check the recording folder and try again.",
				};
			}
		});
	handle("status", async (_event, bundle) => {
		const store = deps.getStore();
		const consent = await readConsent();
		const source =
			bundle === undefined ? undefined : await readGuideSources(await bundlePath(bundle));
		const guide = source?.meta.guide;
		return {
			connected: Boolean(store.getApiKey("openrouter")),
			model: getModel(),
			reviewed: Boolean(consent.openrouter?.reviewedAt),
			alwaysSend: consent.openrouter?.alwaysSend,
			options: consent.openrouter?.options ?? { transcript: true, frames: true },
			guide,
			narrationOnly: source?.inputSteps[0]?.kind === "narration",
			noSpeech: source ? source.segments.length === 0 : undefined,
		};
	});
	handle("preview", async (event, bundle, rawOptions) => {
		const resolved = await bundlePath(bundle);
		if (!isOptions(rawOptions)) throw new Error("Invalid options");
		const prepared = await prepareGuide(resolved, rawOptions);
		// One pending local payload per renderer; a changed toggle invalidates the old token.
		for (const [token, preview] of previews)
			if (preview.sender === event.sender.id) previews.delete(token);
		const token = randomUUID();
		const model = getModel();
		previews.set(token, {
			bundle: resolved,
			sender: event.sender.id,
			prepared,
			model,
			options: rawOptions,
		});
		const { messages: _messages, ...review } = prepared.request;
		return {
			...review,
			token,
			provider: "openrouter",
			model,
			options: rawOptions,
		} satisfies GuidePreview;
	});
	handle("consent", async (event, bundle, token, alwaysSend) => {
		const resolved = await bundlePath(bundle);
		const preview = typeof token === "string" ? previews.get(token) : undefined;
		if (
			!preview ||
			preview.bundle !== resolved ||
			preview.sender !== event.sender.id ||
			typeof alwaysSend !== "boolean" ||
			!deps.getStore().getApiKey("openrouter")
		)
			return { success: false };
		const consent = await readConsent();
		const next = {
			...consent,
			openrouter: { reviewedAt: Date.now(), alwaysSend, options: preview.options },
		};
		await fs.writeFile(`${consentFile}.tmp`, JSON.stringify(next, null, 2) + "\n");
		await fs.rename(`${consentFile}.tmp`, consentFile);
		return { success: true };
	});
	handle("run", async (event, bundle, token) => {
		const resolved = await bundlePath(bundle);
		const store = deps.getStore();
		const key = store.getApiKey("openrouter");
		const preview = typeof token === "string" ? previews.get(token) : undefined;
		if (
			!key ||
			!(await readConsent()).openrouter?.reviewedAt ||
			!preview ||
			preview.bundle !== resolved ||
			preview.sender !== event.sender.id ||
			preview.model !== getModel() ||
			running.has(resolved)
		)
			return { success: false };
		// Compare before creating a model as well as inside the serialized writer.
		if ((await readGuideSources(resolved)).signature !== preview.prepared.signature)
			return { success: false, error: "Recording changed. Check what gets sent again." };
		previews.delete(token as string);
		running.add(resolved);
		try {
			const model = async (messages: GuideMessage[]) => {
				const chat = await deps.createModel(key, preview.model);
				return chat(messages);
			};
			return await runAiGuide(resolved, {
				model,
				modelSlug: preview.model,
				prepared: preview.prepared,
				onPhase: (phase) =>
					event.sender.send("showhow:ai-guide-progress", { bundleDir: resolved, phase }),
			});
		} finally {
			running.delete(resolved);
		}
	});
}
function isOptions(value: unknown): value is GuideOptions {
	return (
		typeof value === "object" &&
		value !== null &&
		"transcript" in value &&
		typeof value.transcript === "boolean" &&
		"frames" in value &&
		typeof value.frames === "boolean"
	);
}
