import { DEFAULT_GUIDE_MODEL } from "../../src/lib/showhow/aiGuide";
import type { GuideMessage } from "./aiGuide";

export type StructuredPayload = "guide" | "brief";
export type StructuredModel = (messages: GuideMessage[], signal?: AbortSignal) => Promise<string>;

export const GUIDE_SCHEMA = {
	title: "ShowhowGuide",
	type: "object",
	properties: {
		title: { type: "string" },
		steps: {
			type: "array",
			items: {
				type: "object",
				properties: {
					label: { type: "string" },
					sourceIds: { type: "array", items: { type: "string" } },
				},
				required: ["label", "sourceIds"],
				additionalProperties: false,
			},
		},
	},
	required: ["title", "steps"],
	additionalProperties: false,
};

const claim = {
	type: "object",
	properties: {
		text: { type: "string" },
		sourceIds: { type: "array", items: { type: "string" } },
	},
	required: ["text", "sourceIds"],
	additionalProperties: false,
};
const optionalClaim = { anyOf: [claim, { type: "null" }] };
export const AGENT_BRIEF_SCHEMA = {
	title: "ShowhowAgentBrief",
	type: "object",
	properties: {
		title: { type: "string" },
		requestedChange: optionalClaim,
		observed: claim,
		expected: optionalClaim,
		actual: optionalClaim,
		evidence: {
			type: "array",
			items: {
				type: "object",
				properties: { sourceId: { type: "string" }, text: { type: "string" } },
				required: ["sourceId", "text"],
				additionalProperties: false,
			},
		},
		unknowns: { type: "array", items: { type: "string" } },
	},
	required: ["title", "requestedChange", "observed", "expected", "actual", "evidence", "unknowns"],
	additionalProperties: false,
};

interface StructuredChat<Message> {
	withStructuredOutput(
		schema: Record<string, unknown>,
		options: { method: "jsonSchema" },
	): { invoke(messages: Message[], options: { signal?: AbortSignal }): Promise<unknown> };
}

/** One OpenRouter connection for every Showhow payload; only the output schema differs. */
export function createStructuredModelFactory<Message>(deps: {
	loadChat: (apiKey: string, model: string) => Promise<StructuredChat<Message>>;
	toMessages: (messages: GuideMessage[]) => Message[] | Promise<Message[]>;
}) {
	return async (
		apiKey: string,
		model: string,
		payload: StructuredPayload,
	): Promise<StructuredModel> => {
		const chat = await deps.loadChat(apiKey, model);
		const structured = chat.withStructuredOutput(
			payload === "brief" ? AGENT_BRIEF_SCHEMA : GUIDE_SCHEMA,
			{ method: "jsonSchema" },
		);
		return async (messages, signal) =>
			JSON.stringify(await structured.invoke(await deps.toMessages(messages), { signal }));
	};
}

export function resolveGuideModel(config: { provider: string; model: string } | null): string {
	return config?.provider === "openrouter" && config.model.trim()
		? config.model
		: DEFAULT_GUIDE_MODEL;
}
