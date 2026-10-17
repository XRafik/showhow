import { describe, expect, it } from "vitest";
import { normalizeForCaptions } from "./extractMono16k";

describe("normalizeForCaptions", () => {
	it("amplifies quiet speech without clipping", () => {
		const samples = new Float32Array([0.005, -0.005, 0.01, -0.01]);

		const normalized = normalizeForCaptions(samples);

		expect(Math.max(...normalized.map(Math.abs))).toBeGreaterThan(
			Math.max(...samples.map(Math.abs)),
		);
		expect(Math.max(...normalized.map(Math.abs))).toBeLessThanOrEqual(0.95);
	});

	it("leaves digital silence and healthy audio unchanged", () => {
		const silence = new Float32Array([0, 0, 0]);
		const healthy = new Float32Array([0.1, -0.1, 0.1, -0.1]);

		expect(normalizeForCaptions(silence)).toBe(silence);
		expect(normalizeForCaptions(healthy)).toBe(healthy);
	});
});
