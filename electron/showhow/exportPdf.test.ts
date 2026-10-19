import { mkdir, mkdtemp, readdir, readFile, rm, stat, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { renderStepsMarkdown, type Step, serializeStepsJson } from "./bundle";
import { collectPdfDocument, exportPdf, registerPdfExportHandlers } from "./exportPdf";

const PNG = Buffer.from(
	"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
	"base64",
);
const step = (patch: Partial<Step>): Step => ({
	label: "Open invoices",
	ts: 4_000,
	coords: { cx: 0.1, cy: 0.2 },
	tier: "desktop",
	redaction: false,
	screenshot: "step-01.png",
	...patch,
});
const all = { screenshots: true, narration: true, timestamps: true };

async function bundle(steps: Step[]) {
	const root = await mkdtemp(path.join(os.tmpdir(), "showhow-pdf-"));
	const dir = path.join(root, "Recordings", "take");
	await mkdir(path.join(dir, "screenshots"), { recursive: true });
	await writeFile(
		path.join(dir, "meta.json"),
		JSON.stringify({
			title: "Invoice total rounds wrong",
			video: "video.mp4",
			source: "desktop",
			durationMs: 134_000,
		}),
	);
	await writeFile(path.join(dir, "steps.json"), serializeStepsJson(steps));
	await writeFile(path.join(dir, "steps.md"), renderStepsMarkdown(steps));
	await writeFile(
		path.join(dir, "transcript.txt"),
		"[0:03] So first I'll go to invoices.\n[0:16] This is the Acme one.\n[0:18] It says 104.99.\n",
	);
	await writeFile(path.join(dir, "screenshots", "step-01.png"), PNG);
	await writeFile(path.join(dir, "screenshots", "step-02.png"), PNG);
	return { root, dir };
}
const snapshot = async (dir: string) =>
	Object.fromEntries(
		await Promise.all(
			["meta.json", "steps.json", "steps.md", "transcript.txt", "screenshots/step-01.png"].map(
				async (name) => [name, await readFile(path.join(dir, name), "utf8")],
			),
		),
	);

describe("collectPdfDocument", () => {
	it("uses the persisted title, ordered steps, bundle screenshots and narration between steps", async () => {
		const { dir } = await bundle([
			step({}),
			step({ label: "Click the Acme invoice", ts: 17_000, screenshot: "step-02.png" }),
		]);
		const doc = await collectPdfDocument(dir, all);
		expect(doc.title).toBe("Invoice total rounds wrong");
		expect(doc.meta).toBe("Desktop · 2 steps · 2:14");
		expect(doc.steps.map((s) => s.label)).toEqual(["Open invoices", "Click the Acme invoice"]);
		expect(doc.steps[0]!.image?.mime).toBe("image/png");
		expect(doc.steps[0]!.image?.base64.length).toBeGreaterThan(10);
		// Narration leads into the next step; lines after the last step stay with it.
		expect(doc.steps[0]!.narration).toEqual(["So first I'll go to invoices."]);
		expect(doc.steps[1]!.narration).toEqual(["This is the Acme one.", "It says 104.99."]);
	});

	it("reads no images when screenshots are off and no transcript when narration is off", async () => {
		const { dir } = await bundle([step({})]);
		const doc = await collectPdfDocument(dir, {
			screenshots: false,
			narration: false,
			timestamps: true,
		});
		expect(doc.steps[0]!.image).toBeUndefined();
		expect(doc.steps[0]!.narration).toEqual([]);
	});

	it("follows the persisted redaction choice for text and images", async () => {
		const { dir } = await bundle([
			step({ redaction: true }),
			step({ redaction: true, includeRevealedText: true, ts: 9_000, screenshot: "step-02.png" }),
		]);
		const doc = await collectPdfDocument(dir, all);
		expect(doc.steps[0]).toMatchObject({ hidden: true, image: undefined });
		expect(doc.steps[1]).toMatchObject({ hidden: false, label: "Open invoices" });
		expect(doc.steps[1]!.image).toBeDefined();
	});

	it.each([
		["a parent path", "../outside.png"],
		["an absolute path", "/etc/hosts"],
	])("refuses a screenshot named with %s", async (_name, screenshot) => {
		const { dir } = await bundle([step({ screenshot })]);
		await expect(collectPdfDocument(dir, all)).rejects.toThrow();
	});

	it("refuses a screenshot symlinked outside the bundle", async () => {
		const { root, dir } = await bundle([step({ screenshot: "link.png" })]);
		await writeFile(path.join(root, "outside.png"), PNG);
		await symlink(path.join(root, "outside.png"), path.join(dir, "screenshots", "link.png"));
		await expect(collectPdfDocument(dir, all)).rejects.toThrow();
	});

	it("refuses a screenshots folder symlinked outside the bundle", async () => {
		const { root, dir } = await bundle([step({})]);
		await mkdir(path.join(root, "elsewhere"));
		await writeFile(path.join(root, "elsewhere", "step-01.png"), PNG);
		await rm(path.join(dir, "screenshots"), { recursive: true });
		await symlink(path.join(root, "elsewhere"), path.join(dir, "screenshots"));
		await expect(collectPdfDocument(dir, all)).rejects.toThrow();
	});

	it("prints a step whose screenshot was deleted without an image", async () => {
		const { dir } = await bundle([step({}), step({ ts: 9_000, screenshot: "gone.png" })]);
		const doc = await collectPdfDocument(dir, all);
		expect(doc.steps[0]!.image).toBeDefined();
		expect(doc.steps[1]!.image).toBeUndefined();
	});

	it("does not repeat narration under steps that are themselves narration", async () => {
		const { dir } = await bundle([
			step({ kind: "narration", label: "So first I'll go to invoices." }),
		]);
		expect((await collectPdfDocument(dir, all)).steps[0]!.narration).toEqual([]);
	});
});

describe("exportPdf", () => {
	it("writes the rendered bytes to the chosen file only after rendering", async () => {
		const { root, dir } = await bundle([step({})]);
		const before = await snapshot(dir);
		const destination = path.join(root, "out", "Guide.pdf");
		await mkdir(path.dirname(destination));
		const order: string[] = [];
		const result = await exportPdf(dir, all, {
			destination: async () => {
				order.push("destination");
				return destination;
			},
			render: async (html) => {
				order.push("render");
				expect(html).toContain("Open invoices");
				return Buffer.from("%PDF-1.4 fake");
			},
		});
		expect(result).toEqual({ status: "saved", path: destination });
		expect(order).toEqual(["destination", "render"]);
		expect(await readFile(destination, "utf8")).toBe("%PDF-1.4 fake");
		expect(await snapshot(dir)).toEqual(before);
	});

	it("writes nothing and renders nothing when the picker is cancelled", async () => {
		const { dir } = await bundle([step({})]);
		const render = vi.fn();
		expect(await exportPdf(dir, all, { destination: async () => null, render })).toEqual({
			status: "cancelled",
		});
		expect(render).not.toHaveBeenCalled();
	});

	it.each([
		["render", async () => Promise.reject(new Error("print failed"))],
		["empty output", async () => Buffer.alloc(0)],
	])("keeps an existing destination file when %s fails", async (_name, render) => {
		const { root, dir } = await bundle([step({})]);
		const destination = path.join(root, "Guide.pdf");
		await writeFile(destination, "previous");
		expect(await exportPdf(dir, all, { destination: async () => destination, render })).toEqual({
			status: "failed",
		});
		expect(await readFile(destination, "utf8")).toBe("previous");
		expect((await readdir(root)).filter((name) => name.includes(".tmp"))).toEqual([]);
	});

	it("uses a short temp name next to a long chosen file name", async () => {
		const { root, dir } = await bundle([step({})]);
		const destination = path.join(root, `${"x".repeat(240)}.pdf`);
		expect(
			await exportPdf(dir, all, {
				destination: async () => destination,
				render: async () => Buffer.from("%PDF-1.4"),
			}),
		).toEqual({ status: "saved", path: destination });
	});

	it("reports a write failure and leaves no partial file", async () => {
		const { root, dir } = await bundle([step({})]);
		const destination = path.join(root, "missing-folder", "Guide.pdf");
		expect(
			await exportPdf(dir, all, {
				destination: async () => destination,
				render: async () => Buffer.from("%PDF-1.4"),
			}),
		).toEqual({ status: "failed" });
		await expect(stat(destination)).rejects.toThrow();
	});
});

describe("registered PDF export IPC", () => {
	async function setup() {
		const { root, dir } = await bundle([step({})]);
		const downloads = path.join(root, "Downloads");
		await mkdir(downloads);
		const handlers = new Map<
			string,
			(event: { sender: { id: number } }, ...args: unknown[]) => Promise<unknown>
		>();
		const choose = vi.fn<(defaultPath: string) => Promise<string | null>>();
		const reveal = vi.fn();
		registerPdfExportHandlers({
			handle: (channel, handler) => handlers.set(channel, handler),
			recordingsRoot: path.join(root, "Recordings"),
			downloadsDir: downloads,
			homeDir: root,
			chooseSaveFile: choose,
			render: async () => Buffer.from("%PDF-1.4 fake"),
			reveal,
		});
		const event = { sender: { id: 7 } };
		const call = (name: string, ...args: unknown[]) =>
			handlers.get(`showhow:pdf-${name}`)!(event, ...args) as Promise<Record<string, unknown>>;
		return { root, dir, downloads, choose, reveal, call };
	}

	it("defaults to Downloads with a unique name and never overwrites there", async () => {
		const s = await setup();
		expect(await s.call("destination", s.dir)).toEqual({ display: "~/Downloads" });
		const first = await s.call("export", s.dir, all);
		const second = await s.call("export", s.dir, all);
		expect(first).toMatchObject({ status: "saved", display: "~/Downloads" });
		expect(second).toMatchObject({ status: "saved" });
		expect((await readdir(s.downloads)).sort()).toEqual([
			"Invoice total rounds wrong 2.pdf",
			"Invoice total rounds wrong.pdf",
		]);
		expect(s.choose).not.toHaveBeenCalled();
	});

	it("keeps the previous destination when the picker is cancelled", async () => {
		const s = await setup();
		s.choose.mockResolvedValueOnce(null);
		expect(await s.call("choose-destination", s.dir)).toEqual({ status: "cancelled" });
		expect(s.choose).toHaveBeenCalledWith(path.join(s.downloads, "Invoice total rounds wrong.pdf"));
		expect(await s.call("destination", s.dir)).toEqual({ display: "~/Downloads" });
		expect(await readdir(s.downloads)).toEqual([]);
	});

	it("writes to the chosen file and reveals only files it saved", async () => {
		const s = await setup();
		const chosen = path.join(s.root, "Desk", "Mine.pdf");
		await mkdir(path.dirname(chosen));
		s.choose.mockResolvedValueOnce(chosen);
		expect(await s.call("choose-destination", s.dir)).toEqual({ display: "~/Desk" });
		const saved = await s.call("export", s.dir, all);
		expect(saved).toMatchObject({ status: "saved", display: "~/Desk" });
		expect(await readFile(chosen, "utf8")).toBe("%PDF-1.4 fake");
		expect(await s.call("reveal", saved.revealId)).toEqual({ success: true });
		expect(s.reveal).toHaveBeenCalledWith(chosen);
		expect(await s.call("reveal", "/etc/hosts")).toEqual({ success: false });
		expect(s.reveal).toHaveBeenCalledTimes(1);
	});

	it("still offers Downloads when the bundle metadata cannot be read", async () => {
		const s = await setup();
		await writeFile(path.join(s.dir, "meta.json"), "{broken");
		expect(await s.call("destination", s.dir)).toEqual({ display: "~/Downloads" });
	});

	it("rejects bundles outside the recordings root and malformed options", async () => {
		const s = await setup();
		expect(await s.call("export", s.root, all)).toEqual({ status: "failed" });
		expect(await s.call("export", s.dir, { screenshots: "yes" })).toEqual({ status: "failed" });
		expect(await readdir(s.downloads)).toEqual([]);
	});
});
