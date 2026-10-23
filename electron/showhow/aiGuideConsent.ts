import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import type {
	AgentBriefPreview,
	AgentBriefRunResult,
	AgentBriefStatus,
	BriefPhase,
} from "../../src/lib/showhow/agentBrief";
import type { GuideOptions, GuidePreview } from "../../src/lib/showhow/aiGuide";
import {
	AGENT_BRIEF_JSON,
	AGENT_BRIEF_MD,
	agentClipboardText,
	type PreparedBrief,
	prepareBrief,
	readAgentBrief,
	readBriefSources,
	runAgentBrief,
} from "./agentBrief";
import {
	type GuideMessage,
	type PreparedGuide,
	prepareGuide,
	readGuideSources,
	runAiGuide,
} from "./aiGuide";
import { resolveGuideModel, type StructuredModel, type StructuredPayload } from "./guideModel";
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
interface ConsentEntry {
	reviewedAt: number;
	alwaysSend: boolean;
	options: GuideOptions;
}
// Each payload kind keeps its own review: guide consent never authorises a brief.
interface Consent {
	openrouter?: ConsentEntry;
	openrouterBrief?: ConsentEntry;
}
export function registerAiGuideHandlers(deps: {
	handle: (channel: string, handler: GuideIpcHandler) => void;
	recordingsRoot: string | (() => string);
	preferencesDir: string;
	getStore: () => GuideConfigStore;
	createModel: (key: string, model: string, payload: StructuredPayload) => Promise<StructuredModel>;
	writeClipboard?: (text: string) => void;
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
	const writeConsent = async (next: Consent) => {
		await fs.writeFile(`${consentFile}.tmp`, JSON.stringify(next, null, 2) + "\n");
		await fs.rename(`${consentFile}.tmp`, consentFile);
	};
	const getModel = () => resolveGuideModel(deps.getStore().getConfig());
	async function bundlePath(value: unknown): Promise<string> {
		if (typeof value !== "string") throw new Error("Invalid bundle");
		const recordingsRoot =
			typeof deps.recordingsRoot === "function" ? deps.recordingsRoot() : deps.recordingsRoot;
		const root = await fs.realpath(recordingsRoot);
		const resolved = path.resolve(value);
		if (!resolved.startsWith(path.resolve(recordingsRoot) + path.sep))
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
			AGENT_BRIEF_JSON,
			AGENT_BRIEF_MD,
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
			// No steps and no narration: nothing to build a guide from (a pre-model failure the
			// UI should surface as an empty state, not a retryable validation error).
			noInput: source ? source.inputSteps.length === 0 && source.segments.length === 0 : undefined,
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
		await writeConsent(next);
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
				const chat = await deps.createModel(key, preview.model, "guide");
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

	const briefPreviews = new Map<
		string,
		{
			bundle: string;
			sender: number;
			prepared: PreparedBrief;
			model: string;
			options: GuideOptions;
			// Set once this exact payload was reviewed and accepted in the consent handler.
			consented?: boolean;
		}
	>();
	const briefRuns = new Map<
		string,
		{ controller: AbortController; phase: BriefPhase; sender: number }
	>();
	const briefFailures = new Map<string, string>();
	const briefHandle = (name: string, fn: GuideIpcHandler) =>
		deps.handle(`showhow:agent-brief-${name}`, async (event, ...args) => {
			try {
				return await fn(event, ...args);
			} catch {
				return { success: false, reason: "error", error: "prepare" };
			}
		});
	briefHandle("status", async (_event, bundle) => {
		const resolved = await bundlePath(bundle);
		const consent = (await readConsent()).openrouterBrief;
		const brief = await readAgentBrief(resolved);
		const run = briefRuns.get(resolved);
		const failure = briefFailures.get(resolved);
		// Same evidence the run would build from: no steps and no narration means there is
		// nothing to turn into a brief (an empty state, not a retryable failure).
		const source = await readBriefSources(resolved);
		const noInput = source.steps.length === 0 && source.segments.length === 0;
		return {
			connected: Boolean(deps.getStore().getApiKey("openrouter")),
			model: getModel(),
			reviewed: Boolean(consent?.reviewedAt),
			alwaysSend: consent?.alwaysSend ?? false,
			options: consent?.options ?? { transcript: true, frames: true },
			state: run ? "making" : failure ? "failed" : brief ? "ready" : "none",
			phase: run?.phase,
			noInput,
			brief,
			error: run ? undefined : failure,
		} satisfies AgentBriefStatus;
	});
	briefHandle("preview", async (event, bundle, rawOptions) => {
		const resolved = await bundlePath(bundle);
		if (!isOptions(rawOptions)) throw new Error("Invalid options");
		const prepared = await prepareBrief(resolved, rawOptions);
		for (const [token, preview] of briefPreviews)
			if (preview.sender === event.sender.id) briefPreviews.delete(token);
		const token = randomUUID();
		const model = getModel();
		briefPreviews.set(token, {
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
		} satisfies AgentBriefPreview;
	});
	const briefPreviewFor = async (event: GuideIpcEvent, bundle: unknown, token: unknown) => {
		const resolved = await bundlePath(bundle);
		const preview = typeof token === "string" ? briefPreviews.get(token) : undefined;
		return preview && preview.bundle === resolved && preview.sender === event.sender.id
			? { resolved, preview, token: token as string }
			: undefined;
	};
	briefHandle("consent", async (event, bundle, token, alwaysSend) => {
		const found = await briefPreviewFor(event, bundle, token);
		if (!found || typeof alwaysSend !== "boolean" || !deps.getStore().getApiKey("openrouter"))
			return { success: false };
		const consent = await readConsent();
		await writeConsent({
			...consent,
			openrouterBrief: { reviewedAt: Date.now(), alwaysSend, options: found.preview.options },
		});
		found.preview.consented = true;
		return { success: true };
	});
	briefHandle("run", async (event, bundle, token) => {
		const found = await briefPreviewFor(event, bundle, token);
		if (!found || briefRuns.has(found.resolved)) return { success: false };
		const { resolved, preview } = found;
		// Claim the run slot before any await: a repeated run cannot start twice.
		const run = {
			controller: new AbortController(),
			phase: "reading" as BriefPhase,
			sender: event.sender.id,
		};
		briefRuns.set(resolved, run);
		let result: AgentBriefRunResult = { success: false };
		try {
			const key = deps.getStore().getApiKey("openrouter");
			const consent = (await readConsent()).openrouterBrief;
			// A payload not reviewed in this run is only sent under a stored "send without asking"
			// for exactly these options.
			if (
				!key ||
				!consent?.reviewedAt ||
				(!preview.consented &&
					!(consent.alwaysSend && sameOptions(consent.options, preview.options)))
			)
				return result;
			if (
				preview.model !== getModel() ||
				(await readBriefSources(resolved)).signature !== preview.prepared.signature
			) {
				result = { success: false, error: "changed" };
				return result;
			}
			briefPreviews.delete(found.token);
			briefFailures.delete(resolved);
			try {
				result = await runAgentBrief(resolved, {
					model: async (messages, signal) =>
						(await deps.createModel(key, preview.model, "brief"))(messages, signal),
					modelSlug: preview.model,
					prepared: preview.prepared,
					signal: run.controller.signal,
					onPhase: (phase) => {
						run.phase = phase;
						event.sender.send("showhow:agent-brief-progress", { bundleDir: resolved, phase });
					},
				});
			} catch {
				// Only the staged write can throw here; the previous pair was restored.
				result = { success: false, error: "save" };
			}
			if (!result.success && !result.cancelled && !result.error) result.error = "provider";
			return result;
		} finally {
			// A remounted view did not see this result; it reads the failure from status.
			if (!result.success && result.error) briefFailures.set(resolved, result.error);
			briefRuns.delete(resolved);
			// A Library view remounted mid-run did not start it and needs this to leave Making.
			event.sender.send("showhow:agent-brief-settled", { bundleDir: resolved });
		}
	});
	briefHandle("cancel", async (event, bundle) => {
		const run = briefRuns.get(await bundlePath(bundle));
		if (!run || run.sender !== event.sender.id) return { success: false };
		run.controller.abort();
		return { success: true };
	});
	briefHandle("copy", async (_event, bundle) => {
		const resolved = await bundlePath(bundle);
		if (!(await readAgentBrief(resolved))) return { success: false, reason: "absent" };
		if (!deps.writeClipboard) return { success: false, reason: "error" };
		const markdown = await fs.readFile(path.join(resolved, AGENT_BRIEF_MD), "utf8");
		try {
			deps.writeClipboard(agentClipboardText(markdown, resolved));
		} catch {
			return { success: false, reason: "error" };
		}
		return { success: true };
	});
}
function sameOptions(a: GuideOptions | undefined, b: GuideOptions) {
	return a?.transcript === b.transcript && a.frames === b.frames;
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
