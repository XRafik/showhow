import { describe, expect, it, vi } from "vitest";
import { DEFAULT_GUIDE_MODEL } from "../../src/lib/showhow/aiGuide";
import {
	AGENT_BRIEF_SCHEMA,
	createStructuredModelFactory,
	GUIDE_SCHEMA,
	resolveGuideModel,
} from "./guideModel";

describe("shared guide and brief model adapter", () => {
	it("uses one OpenRouter chat loader with the schema for each payload kind", async () => {
		const invoke = vi.fn(async () => ({ title: "T" }));
		const withStructuredOutput = vi.fn(() => ({ invoke }));
		const loadChat = vi.fn(async () => ({ withStructuredOutput }));
		const toMessages = vi.fn((messages: unknown[]) => messages.map(() => "converted"));
		const create = createStructuredModelFactory({ loadChat, toMessages });
		const controller = new AbortController();

		const brief = await create("key", "fake/model", "brief");
		expect(await brief([{ role: "user", content: "x" }], controller.signal)).toBe('{"title":"T"}');
		expect(loadChat).toHaveBeenCalledWith("key", "fake/model");
		expect(withStructuredOutput).toHaveBeenCalledWith(AGENT_BRIEF_SCHEMA, { method: "jsonSchema" });
		expect(invoke).toHaveBeenCalledWith(["converted"], { signal: controller.signal });

		await create("key", "fake/model", "guide");
		expect(withStructuredOutput).toHaveBeenLastCalledWith(GUIDE_SCHEMA, { method: "jsonSchema" });
	});

	it("keeps the brief schema strict: every field required, optional claims nullable", () => {
		expect(AGENT_BRIEF_SCHEMA.required).toEqual(Object.keys(AGENT_BRIEF_SCHEMA.properties));
		expect(AGENT_BRIEF_SCHEMA.properties.expected.anyOf).toContainEqual({ type: "null" });
		expect(AGENT_BRIEF_SCHEMA.additionalProperties).toBe(false);
	});

	it("resolves the configured OpenRouter model, else the owner default", () => {
		expect(resolveGuideModel({ provider: "openrouter", model: " x/y " })).toBe(" x/y ");
		expect(resolveGuideModel({ provider: "openrouter", model: "  " })).toBe(DEFAULT_GUIDE_MODEL);
		expect(resolveGuideModel({ provider: "openai", model: "gpt" })).toBe(DEFAULT_GUIDE_MODEL);
		expect(resolveGuideModel(null)).toBe(DEFAULT_GUIDE_MODEL);
	});
});
