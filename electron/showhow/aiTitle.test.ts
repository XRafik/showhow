import { promises as fs } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import os from "node:os";
import path from "node:path";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { afterEach, expect, it, vi } from "vitest";
import { createOpenScreenChatModel } from "../ai-edition/deep-agent/chat-model";
import { AI_TITLE_TIMEOUT_MS, createAiTitleService } from "./aiTitle";
import { serializePerBundle, updateWorkflowDocument } from "./bundle";
import { createStructuredModelFactory } from "./guideModel";

const SELECTED_MODEL = "vendor/selected-title-model";
const DEFAULT_TITLE = "Recording 2026-07-11 16:42";
const TRANSCRIPT = "[0:01] Open the settings page\n[0:03] Save the workflow\n";

interface CompletionRequest {
	model: string;
	messages: { role: string; content: string }[];
}

interface CapturedRequest {
	request: CompletionRequest;
	response: ServerResponse;
}

function deferred<T>() {
	let resolve: (value: T) => void = () => undefined;
	let reject: (reason?: unknown) => void = () => undefined;
	const promise = new Promise<T>((ok, fail) => {
		resolve = ok;
		reject = fail;
	});
	return { promise, resolve, reject };
}

async function readBody(request: IncomingMessage): Promise<string> {
	const chunks: Buffer[] = [];
	for await (const chunk of request) chunks.push(Buffer.from(chunk));
	return Buffer.concat(chunks).toString("utf8");
}

function respond(
	response: ServerResponse,
	result: { title: string; summary: string },
	status = 200,
) {
	response.statusCode = status;
	response.setHeader("content-type", "application/json");
	response.end(
		JSON.stringify(
			status === 200
				? {
						id: "chatcmpl-test",
						object: "chat.completion",
						created: 1,
						model: SELECTED_MODEL,
						choices: [
							{
								index: 0,
								finish_reason: "stop",
								message: { role: "assistant", content: JSON.stringify(result) },
							},
						],
						usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
					}
				: { error: { message: "synthetic provider failure" } },
		),
	);
}

async function createFakeOpenRouter(autoResponse?: { title: string; summary: string }) {
	const arrival = deferred<CapturedRequest>();
	let requestCount = 0;
	const server = createServer(async (request, response) => {
		try {
			const body = JSON.parse(await readBody(request)) as CompletionRequest;
			requestCount += 1;
			arrival.resolve({ request: body, response });
			if (autoResponse) respond(response, autoResponse);
		} catch (error) {
			response.statusCode = 400;
			response.end(String(error));
		}
	});
	await new Promise<void>((resolve, reject) => {
		server.once("error", reject);
		server.listen(0, "127.0.0.1", resolve);
	});
	const address = server.address() as AddressInfo;
	return {
		baseUrl: `http://127.0.0.1:${address.port}/v1`,
		requestCount: () => requestCount,
		waitForRequest: () =>
			Promise.race([
				arrival.promise,
				new Promise<never>((_, reject) => {
					const timer = setTimeout(
						() => reject(new Error("OpenRouter request did not reach fake endpoint")),
						3_000,
					);
					timer.unref?.();
				}),
			]),
		close: async () => {
			server.closeAllConnections();
			await new Promise<void>((resolve, reject) =>
				server.close((error) => (error ? reject(error) : resolve())),
			);
		},
	};
}

async function createBundle(
	title = DEFAULT_TITLE,
	titleSource: "default" | "ai" | "user" | undefined = "default",
) {
	const bundleDir = await fs.mkdtemp(path.join(os.tmpdir(), "showhow-ai-title-"));
	const meta: Record<string, unknown> = {
		schemaVersion: 1,
		title,
		source: "desktop",
		createdAt: 1,
		video: "video.webm",
		transcript: "transcript.txt",
		steps: null,
	};
	if (titleSource !== undefined) meta.titleSource = titleSource;
	await fs.writeFile(path.join(bundleDir, "meta.json"), `${JSON.stringify(meta)}\n`);
	await fs.writeFile(path.join(bundleDir, "transcript.txt"), TRANSCRIPT);
	await fs.writeFile(
		path.join(bundleDir, "steps.json"),
		JSON.stringify([
			{ label: "Open the settings page", ts: 1000, redaction: false },
			{ label: "Enter password", ts: 2000, redaction: true },
		]),
	);
	await fs.writeFile(path.join(bundleDir, "video.webm"), "valid local fixture");
	return bundleDir;
}

function createTitleModel(baseUrl: string) {
	return createStructuredModelFactory({
		loadChat: async (apiKey, model) => {
			const chat = await createOpenScreenChatModel({
				provider: "openrouter",
				apiKey,
				model,
				baseUrl,
			});
			return {
				withStructuredOutput: (schema, options) => chat.withStructuredOutput(schema, options),
			};
		},
		toMessages: (messages) =>
			messages.map((message) =>
				message.role === "system"
					? new SystemMessage({ content: message.content })
					: new HumanMessage({ content: message.content }),
			),
	});
}

function createService(
	baseUrl: string,
	options: { enabled?: boolean; apiKey?: string | null; onStatus?: (event: unknown) => void } = {},
) {
	const createModel = createTitleModel(baseUrl);
	const store = {
		getApiKey: vi.fn(() => (options.apiKey === undefined ? "fake-key" : options.apiKey)),
		getConfig: vi.fn(() => ({ provider: "openrouter", model: SELECTED_MODEL, baseUrl })),
	};
	return {
		store,
		service: createAiTitleService({
			isEnabled: () => options.enabled ?? true,
			getStore: () => store,
			createModel,
			onStatus: options.onStatus,
		}),
	};
}

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

it("routes a structured title through the real OpenRouter chat adapter", async () => {
	const endpoint = await createFakeOpenRouter();
	try {
		const createModel = createTitleModel(endpoint.baseUrl);
		const model = await createModel("fake-key", SELECTED_MODEL, "title");
		const result = model([
			{ role: "system", content: "Return a title and summary." },
			{ role: "user", content: "Open settings and save the workflow." },
		]);
		const captured = await endpoint.waitForRequest();
		expect(captured.request.model).toBe(SELECTED_MODEL);
		respond(captured.response, {
			title: "Save the workflow",
			summary: "Review settings and save.",
		});
		expect(JSON.parse(await result)).toEqual({
			title: "Save the workflow",
			summary: "Review settings and save.",
		});
	} finally {
		await endpoint.close();
	}
});

it("does not call OpenRouter when no OpenRouter key is configured", async () => {
	const endpoint = await createFakeOpenRouter();
	const bundleDir = await createBundle();
	const events: unknown[] = [];
	try {
		const { service } = createService(endpoint.baseUrl, {
			apiKey: null,
			onStatus: (event) => events.push(event),
		});
		const naming = service.nameRecording(bundleDir);
		expect.soft(service.isNaming(bundleDir)).toBe(false);
		await naming;
		expect(service.isNaming(bundleDir)).toBe(false);
		expect(endpoint.requestCount()).toBe(0);
		expect(events).toEqual([]);
		expect(JSON.parse(await fs.readFile(path.join(bundleDir, "meta.json"), "utf8")).title).toBe(
			DEFAULT_TITLE,
		);
	} finally {
		await endpoint.close();
		await fs.rm(bundleDir, { recursive: true, force: true });
	}
});

it("does not call OpenRouter when AI naming is disabled", async () => {
	const endpoint = await createFakeOpenRouter();
	const bundleDir = await createBundle();
	try {
		const { service } = createService(endpoint.baseUrl, { enabled: false });
		const naming = service.nameRecording(bundleDir);
		expect.soft(service.isNaming(bundleDir)).toBe(false);
		await naming;
		expect(service.isNaming(bundleDir)).toBe(false);
		expect(endpoint.requestCount()).toBe(0);
		expect(JSON.parse(await fs.readFile(path.join(bundleDir, "meta.json"), "utf8")).title).toBe(
			DEFAULT_TITLE,
		);
	} finally {
		await endpoint.close();
		await fs.rm(bundleDir, { recursive: true, force: true });
	}
});

it("uses the exact selected model and writes a bounded title and summary from transcript and clicks", async () => {
	const endpoint = await createFakeOpenRouter();
	const bundleDir = await createBundle();
	try {
		const { service } = createService(endpoint.baseUrl);
		const naming = service.nameRecording(bundleDir);
		const captured = await endpoint.waitForRequest();
		expect(service.isNaming(bundleDir)).toBe(true);
		expect(captured.request.model).toBe(SELECTED_MODEL);
		const userMessage = captured.request.messages.find((message) => message.role === "user");
		const input = JSON.parse(userMessage?.content ?? "{}") as {
			transcript?: string;
			clicks?: { label: string; timestampMs: number }[];
		};
		expect(input.transcript).toContain("Save the workflow");
		expect(input.clicks).toEqual([
			{ label: "Open the settings page", timestampMs: 1000 },
			{ label: "[redacted]", timestampMs: 2000 },
		]);
		respond(captured.response, {
			title: "Save the client workflow",
			summary: "Open settings, review the workflow, and save the client changes.",
		});
		await naming;
		expect(JSON.parse(await fs.readFile(path.join(bundleDir, "meta.json"), "utf8"))).toMatchObject({
			title: "Save the client workflow",
			summary: "Open settings, review the workflow, and save the client changes.",
			titleSource: "ai",
		});
	} finally {
		await endpoint.close();
		await fs.rm(bundleDir, { recursive: true, force: true });
	}
});

it("drops a provider result when the user renames during the request", async () => {
	const endpoint = await createFakeOpenRouter();
	const bundleDir = await createBundle();
	try {
		const { service } = createService(endpoint.baseUrl);
		const naming = service.nameRecording(bundleDir);
		const captured = await endpoint.waitForRequest();
		await updateWorkflowDocument(bundleDir, { type: "title", title: "User's title" });
		respond(captured.response, { title: "AI title", summary: "AI summary" });
		await naming;
		expect(JSON.parse(await fs.readFile(path.join(bundleDir, "meta.json"), "utf8"))).toMatchObject({
			title: "User's title",
			titleSource: "user",
		});
		expect(
			JSON.parse(await fs.readFile(path.join(bundleDir, "meta.json"), "utf8")).summary,
		).toBeUndefined();
	} finally {
		await endpoint.close();
		await fs.rm(bundleDir, { recursive: true, force: true });
	}
});

it("leaves the default title intact after an OpenRouter failure and settles status silently", async () => {
	const endpoint = await createFakeOpenRouter();
	const bundleDir = await createBundle();
	const events: unknown[] = [];
	try {
		const { service } = createService(endpoint.baseUrl, {
			onStatus: (event) => events.push(event),
		});
		const naming = service.nameRecording(bundleDir);
		const captured = await endpoint.waitForRequest();
		respond(captured.response, { title: "", summary: "" }, 400);
		await expect(naming).resolves.toBeUndefined();
		expect(JSON.parse(await fs.readFile(path.join(bundleDir, "meta.json"), "utf8"))).toMatchObject({
			title: DEFAULT_TITLE,
			titleSource: "default",
		});
		expect(events).toEqual([
			{ bundleDir, status: "naming" },
			{
				bundleDir,
				status: "settled",
				entry: expect.objectContaining({ title: DEFAULT_TITLE }),
			},
		]);
	} finally {
		await endpoint.close();
		await fs.rm(bundleDir, { recursive: true, force: true });
	}
});

it("preserves a date-shaped legacy title when titleSource is missing", async () => {
	const endpoint = await createFakeOpenRouter({ title: "New title", summary: "New summary" });
	const bundleDir = await createBundle(DEFAULT_TITLE, undefined);
	const metaPath = path.join(bundleDir, "meta.json");
	const legacyMeta = JSON.parse(await fs.readFile(metaPath, "utf8")) as Record<string, unknown>;
	delete legacyMeta.titleSource;
	await fs.writeFile(metaPath, JSON.stringify(legacyMeta));
	try {
		expect(JSON.parse(await fs.readFile(metaPath, "utf8")).titleSource).toBeUndefined();
		const { service } = createService(endpoint.baseUrl);
		await service.nameRecording(bundleDir);
		expect(endpoint.requestCount()).toBe(0);
		expect(JSON.parse(await fs.readFile(metaPath, "utf8"))).toMatchObject({
			title: DEFAULT_TITLE,
		});
		expect(JSON.parse(await fs.readFile(metaPath, "utf8")).titleSource).toBeUndefined();
	} finally {
		await endpoint.close();
		await fs.rm(bundleDir, { recursive: true, force: true });
	}
});

it("preserves a date-shaped title with an unknown titleSource", async () => {
	const endpoint = await createFakeOpenRouter({ title: "New title", summary: "New summary" });
	const bundleDir = await createBundle();
	const metaPath = path.join(bundleDir, "meta.json");
	const meta = JSON.parse(await fs.readFile(metaPath, "utf8")) as Record<string, unknown>;
	meta.titleSource = "future-value";
	await fs.writeFile(metaPath, JSON.stringify(meta));
	try {
		const { service } = createService(endpoint.baseUrl);
		await service.nameRecording(bundleDir);
		expect(endpoint.requestCount()).toBe(0);
		expect(JSON.parse(await fs.readFile(metaPath, "utf8"))).toMatchObject({
			title: DEFAULT_TITLE,
			titleSource: "future-value",
		});
	} finally {
		await endpoint.close();
		await fs.rm(bundleDir, { recursive: true, force: true });
	}
});

it("never requests a title for an imported recording", async () => {
	const endpoint = await createFakeOpenRouter();
	const bundleDir = await createBundle();
	const metaPath = path.join(bundleDir, "meta.json");
	const meta = JSON.parse(await fs.readFile(metaPath, "utf8")) as Record<string, unknown>;
	meta.source = "imported";
	meta.titleSource = "user";
	meta.title = "client-walkthrough.mp4";
	await fs.writeFile(metaPath, JSON.stringify(meta));
	try {
		const { service } = createService(endpoint.baseUrl);
		await service.nameRecording(bundleDir);
		expect(endpoint.requestCount()).toBe(0);
		expect(JSON.parse(await fs.readFile(metaPath, "utf8")).title).toBe("client-walkthrough.mp4");
	} finally {
		await endpoint.close();
		await fs.rm(bundleDir, { recursive: true, force: true });
	}
});

it("rejects an oversized structured title instead of saving it", async () => {
	const endpoint = await createFakeOpenRouter();
	const bundleDir = await createBundle();
	try {
		const { service } = createService(endpoint.baseUrl);
		const naming = service.nameRecording(bundleDir);
		const captured = await endpoint.waitForRequest();
		respond(captured.response, { title: "x".repeat(61), summary: "Summary" });
		await naming;
		expect(JSON.parse(await fs.readFile(path.join(bundleDir, "meta.json"), "utf8"))).toMatchObject({
			title: DEFAULT_TITLE,
			titleSource: "default",
		});
	} finally {
		await endpoint.close();
		await fs.rm(bundleDir, { recursive: true, force: true });
	}
});

it(
	"times out a stalled provider request without changing bundle metadata",
	async () => {
		const endpoint = await createFakeOpenRouter();
		const bundleDir = await createBundle();
		try {
			const { service } = createService(endpoint.baseUrl);
			const naming = service.nameRecording(bundleDir);
			await endpoint.waitForRequest();
			await expect(naming).resolves.toBeUndefined();
			expect(AI_TITLE_TIMEOUT_MS).toBeGreaterThan(0);
			expect(
				JSON.parse(await fs.readFile(path.join(bundleDir, "meta.json"), "utf8")),
			).toMatchObject({
				title: DEFAULT_TITLE,
				titleSource: "default",
			});
		} finally {
			await endpoint.close();
			await fs.rm(bundleDir, { recursive: true, force: true });
		}
	},
	AI_TITLE_TIMEOUT_MS + 10_000,
);

it("leaves metadata and media intact when the final atomic rename fails", async () => {
	const endpoint = await createFakeOpenRouter();
	const bundleDir = await createBundle();
	const metaPath = path.join(bundleDir, "meta.json");
	const priorMeta = await fs.readFile(metaPath, "utf8");
	const priorVideo = await fs.readFile(path.join(bundleDir, "video.webm"));
	const realRename = fs.rename;
	try {
		vi.spyOn(fs, "rename").mockImplementation(async (source, destination) => {
			if (destination === metaPath) throw new Error("synthetic disk failure");
			return realRename(source, destination);
		});
		const { service } = createService(endpoint.baseUrl);
		const naming = service.nameRecording(bundleDir);
		const captured = await endpoint.waitForRequest();
		respond(captured.response, { title: "A valid title", summary: "A valid summary." });
		await naming;
		expect(await fs.readFile(metaPath, "utf8")).toBe(priorMeta);
		expect(await fs.readFile(path.join(bundleDir, "video.webm"))).toEqual(priorVideo);
		expect((await fs.readdir(bundleDir)).filter((name) => name.endsWith(".tmp"))).toEqual([]);
	} finally {
		vi.restoreAllMocks();
		await endpoint.close();
		await fs.rm(bundleDir, { recursive: true, force: true });
	}
});

it("keeps a rename queued before the AI final write", async () => {
	const endpoint = await createFakeOpenRouter();
	const bundleDir = await createBundle();
	const hold = deferred<void>();
	try {
		const heldWrite = serializePerBundle(bundleDir, () => hold.promise);
		const { service } = createService(endpoint.baseUrl);
		const naming = service.nameRecording(bundleDir);
		const captured = await endpoint.waitForRequest();
		const rename = updateWorkflowDocument(bundleDir, { type: "title", title: "Queued user title" });
		respond(captured.response, { title: "AI title", summary: "AI summary" });
		hold.resolve();
		await Promise.all([heldWrite, rename, naming]);
		expect(JSON.parse(await fs.readFile(path.join(bundleDir, "meta.json"), "utf8"))).toMatchObject({
			title: "Queued user title",
			titleSource: "user",
		});
		expect(
			JSON.parse(await fs.readFile(path.join(bundleDir, "meta.json"), "utf8")).summary,
		).toBeUndefined();
	} finally {
		hold.resolve();
		await endpoint.close();
		await fs.rm(bundleDir, { recursive: true, force: true });
	}
});
