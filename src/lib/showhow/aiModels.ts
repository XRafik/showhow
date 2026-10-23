import { DEFAULT_GUIDE_MODEL } from "./aiGuide";

export const SHOWHOW_AI_MODELS = [
	{ id: DEFAULT_GUIDE_MODEL, label: "Claude Haiku 5.5" },
	{ id: "anthropic/claude-sonnet-5.5", label: "Claude Sonnet 5.5" },
	{ id: "anthropic/claude-opus-5.5", label: "Claude Opus 5.5" },
	{ id: "openai/gpt-6.1-sol", label: "GPT-6.1 Sol" },
	{ id: "google/gemini-4-argon", label: "Gemini 4 Argon" },
] as const;
