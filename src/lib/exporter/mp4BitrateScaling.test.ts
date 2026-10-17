import { describe, expect, it } from "vitest";
import { calculateMp4ExportSettings } from "./mp4ExportSettings";

describe("MP4 bitrate scaling", () => {
	it("reduces the source export budget when a crop removes most pixels", () => {
		const full = calculateMp4ExportSettings({
			frameRate: 30,
			quality: "source",
			sourceWidth: 1920,
			sourceHeight: 1080,
			aspectRatioValue: 16 / 9,
		});
		const cropped = calculateMp4ExportSettings({
			frameRate: 30,
			quality: "source",
			sourceWidth: 854,
			sourceHeight: 480,
			aspectRatioValue: 854 / 480,
		});
		expect(cropped).toMatchObject({ width: 854, height: 480 });
		// This crop has under one fifth of the pixels. A full-frame budget
		// wastes space; leave headroom here rather than locking a tuned constant.
		expect(cropped.bitrate).toBeLessThan(full.bitrate / 2);
	});

	it.each([
		{ quality: "medium" as const, width: 1280, height: 720 },
		{ quality: "good" as const, width: 1920, height: 1080 },
		{ quality: "source" as const, width: 1920, height: 1080 },
		{ quality: "source" as const, width: 2560, height: 1440 },
	])("avoids a bitrate cliff just above $width x $height ($quality)", (sample) => {
		const atBoundary = calculateMp4ExportSettings({
			frameRate: 30,
			quality: sample.quality,
			sourceWidth: sample.width,
			sourceHeight: sample.height,
			aspectRatioValue: sample.width / sample.height,
		});
		const justAbove = calculateMp4ExportSettings({
			frameRate: 30,
			quality: sample.quality,
			sourceWidth: sample.width + 2,
			sourceHeight: sample.height,
			aspectRatioValue: (sample.width + 2) / sample.height,
		});
		expect(justAbove.width).toBe(sample.width + 2);
		expect(justAbove.height).toBe(sample.height);
		expect(justAbove.bitrate).toBeGreaterThanOrEqual(atBoundary.bitrate);
		// Two extra pixel columns must not trigger the former 50-100% jumps.
		expect(justAbove.bitrate).toBeLessThanOrEqual(atBoundary.bitrate * 1.1);
	});
});
