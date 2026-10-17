import { describe, expect, it, vi } from "vitest";
import { runTranscription, type TranscriberFn } from "./transcribeCore";

describe("runTranscription", () => {
	it("orders near-equal word timestamps by integer milliseconds then source emission order", async () => {
		const transcriber: TranscriberFn = async () => ({
			chunks: [
				{ timestamp: [21.0004, 21.01], text: "I" },
				{ timestamp: [21.0002, 21.01], text: "hope" },
				{ timestamp: [21.0003, 21.01], text: "this" },
			],
		});

		const result = await runTranscription(transcriber, new Float32Array(22 * 16_000), []);

		expect(result.segments.map((segment) => segment.text)).toEqual(["I", "hope", "this"]);
	});

	it("clamps and reports a Whisper timestamp beyond the decoded audio duration", async () => {
		const transcriber: TranscriberFn = async () => ({
			chunks: [{ timestamp: [29, 29.25], text: "late" }],
		});
		const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

		try {
			const result = await runTranscription(transcriber, new Float32Array(424_832), []);

			expect(result.segments).toEqual([{ startSec: 26.552, endSec: 26.552, text: "late" }]);
			expect(error).toHaveBeenCalledWith(expect.stringContaining("outside decoded audio duration"));
		} finally {
			error.mockRestore();
		}
	});
});
