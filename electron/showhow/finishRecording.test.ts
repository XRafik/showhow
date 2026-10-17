import fs from "node:fs/promises";
import path from "node:path";
import { afterAll, afterEach, expect, it, vi } from "vitest";

const fixture = vi.hoisted(() => {
	const fs = require("node:fs") as typeof import("node:fs");
	const os = require("node:os") as typeof import("node:os");
	const path = require("node:path") as typeof import("node:path");
	return { root: fs.mkdtempSync(path.join(os.tmpdir(), "showhow-finish-")) };
});
vi.mock("node:os", async (original) => {
	const actual = await original<typeof import("node:os")>();
	return { ...actual, default: { ...actual, homedir: () => fixture.root } };
});

import { finishShowhowRecording } from "./finishRecording";

afterEach(() => vi.restoreAllMocks());
afterAll(async () => fs.rm(fixture.root, { recursive: true, force: true }));
it("a metadata disk error after relocation returns the still-readable video and webcam", async () => {
	const video = path.join(fixture.root, "take.mp4");
	const webcam = path.join(fixture.root, "camera.webm");
	await fs.writeFile(video, "valid captured video");
	await fs.writeFile(webcam, "valid captured camera");
	const write = fs.writeFile.bind(fs);
	vi.spyOn(fs, "writeFile").mockImplementation(async (target, ...args) => {
		if (String(target).endsWith("meta.json"))
			throw Object.assign(new Error("synthetic disk failure"), { code: "ENOSPC" });
		return write(target, ...args);
	});
	const result = await finishShowhowRecording({
		screenVideoPath: video,
		webcamVideoPath: webcam,
		createdAt: 1792180800000,
	});
	expect(await fs.readFile(result.screenVideoPath, "utf8")).toBe("valid captured video");
	expect(await fs.readFile(result.webcamVideoPath as string, "utf8")).toBe("valid captured camera");
	expect(result.showhowBundleDir).toBeUndefined();
});
it("a bundle-root error before relocation keeps the original recording readable", async () => {
	const video = path.join(fixture.root, "second.mp4");
	await fs.writeFile(video, "another valid take");
	const mkdir = fs.mkdir.bind(fs);
	vi.spyOn(fs, "mkdir").mockImplementation(async (target, ...args) => {
		if (String(target).includes("Showhow/Recordings"))
			throw new Error("synthetic unavailable documentation root");
		return mkdir(target, ...args);
	});
	const result = await finishShowhowRecording({ screenVideoPath: video, createdAt: 1792180802000 });
	expect(result.screenVideoPath).toBe(video);
	expect(await fs.readFile(result.screenVideoPath, "utf8")).toBe("another valid take");
});
