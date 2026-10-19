import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { BrowserWindow } from "electron";
import type { PdfExportOptions, PdfExportResult } from "../../src/lib/showhow/pdfExport";
import { isSourceStep } from "./aiGuide";
import { parseTranscript, type ShowhowMeta, type Step } from "./bundle";
import { formatPdfTime, type PdfDocument, pdfFileName, renderPdfHtml } from "./pdfDocument";

const SOURCE_LABEL = { desktop: "Desktop", browser: "Browser", imported: "Imported" } as const;
const IMAGE_MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg" } as const;

/** Each transcript line leads into the next step; lines after the last step stay with it. */
function narrationFor(steps: Step[], transcript: string): string[][] {
	const groups = steps.map((): string[] => []);
	for (const segment of parseTranscript(transcript)) {
		const index = steps.findIndex((step) => step.ts >= segment.startMs);
		groups[index === -1 ? steps.length - 1 : index]?.push(segment.text);
	}
	return groups;
}

/** A bundle-local image, or undefined when the file was deleted. Anything else is refused. */
async function readScreenshot(bundleDir: string, name: string) {
	const ext = path.extname(name).toLowerCase() as keyof typeof IMAGE_MIME;
	if (path.basename(name) !== name || !IMAGE_MIME[ext]) throw new Error("Invalid screenshot");
	const bundle = await fs.realpath(bundleDir);
	const screenshots = await fs.realpath(path.join(bundleDir, "screenshots"));
	let real: string;
	try {
		real = await fs.realpath(path.join(screenshots, name));
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
		throw error;
	}
	// Both the folder and the file must resolve inside this bundle: no symlink escapes.
	if (!screenshots.startsWith(bundle + path.sep) || !real.startsWith(screenshots + path.sep))
		throw new Error("Screenshot outside bundle");
	return { mime: IMAGE_MIME[ext], base64: (await fs.readFile(real)).toString("base64") };
}

/** Reads the persisted guide from one bundle: title, ordered steps, bundle-local images. */
export async function collectPdfDocument(
	bundleDir: string,
	options: PdfExportOptions,
): Promise<PdfDocument> {
	const meta = JSON.parse(
		await fs.readFile(path.join(bundleDir, "meta.json"), "utf8"),
	) as Partial<ShowhowMeta>;
	const steps: unknown = JSON.parse(await fs.readFile(path.join(bundleDir, "steps.json"), "utf8"));
	if (!Array.isArray(steps) || !steps.every(isSourceStep)) throw new Error("Invalid steps");
	const transcript = options.narration
		? await fs.readFile(path.join(bundleDir, "transcript.txt"), "utf8").catch((error) => {
				if ((error as NodeJS.ErrnoException).code === "ENOENT") return "";
				throw error;
			})
		: "";
	const narration = narrationFor(steps, transcript);
	const parts = [
		SOURCE_LABEL[meta.source ?? "desktop"] ?? "Desktop",
		`${steps.length} ${steps.length === 1 ? "step" : "steps"}`,
		...(typeof meta.durationMs === "number" ? [formatPdfTime(meta.durationMs)] : []),
	];
	return {
		title: typeof meta.title === "string" && meta.title.trim() ? meta.title : "Showhow guide",
		meta: parts.join(" · "),
		steps: await Promise.all(
			steps.map(async (step, index) => {
				const hidden = step.redaction && step.includeRevealedText !== true;
				return {
					label: step.label,
					ts: step.ts,
					hidden,
					// A narration step's label is already the spoken text.
					narration: step.kind === "narration" ? [] : (narration[index] ?? []),
					image:
						options.screenshots && !hidden && step.screenshot !== ""
							? await readScreenshot(bundleDir, step.screenshot)
							: undefined,
				};
			}),
		),
	};
}

/**
 * Derived output only: the bundle is read, never written. Bytes reach the destination only after
 * rendering succeeds, through a temp file and rename, so a failure keeps any existing file.
 */
export async function exportPdf(
	bundleDir: string,
	options: PdfExportOptions,
	deps: { destination: () => Promise<string | null>; render: (html: string) => Promise<Buffer> },
): Promise<{ status: "saved"; path: string } | { status: "cancelled" } | { status: "failed" }> {
	const destination = await deps.destination();
	if (!destination) return { status: "cancelled" };
	// Short temp name: a long chosen file name must not push it past the filename limit.
	const tmp = path.join(path.dirname(destination), `.showhow-pdf-${randomUUID()}.tmp`);
	try {
		const html = renderPdfHtml(await collectPdfDocument(bundleDir, options), options);
		const bytes = await deps.render(html);
		if (!bytes.length) throw new Error("Empty PDF");
		await fs.writeFile(tmp, bytes, { flag: "wx" });
		await fs.rename(tmp, destination);
		return { status: "saved", path: destination };
	} catch {
		await fs.rm(tmp, { force: true }).catch(() => undefined);
		return { status: "failed" };
	}
}

/** Prints sanitised HTML in an offscreen, script-free window that may load only its own file. */
export function createPdfRenderer(BrowserWindowClass: typeof BrowserWindow) {
	return async (html: string): Promise<Buffer> => {
		const dir = await fs.mkdtemp(path.join(os.tmpdir(), "showhow-pdf-"));
		const file = path.join(dir, "guide.html");
		await fs.writeFile(file, html, "utf8");
		const fileUrl = pathToFileURL(file).href;
		const win = new BrowserWindowClass({
			show: false,
			webPreferences: {
				javascript: false,
				sandbox: true,
				contextIsolation: true,
				nodeIntegration: false,
				// In-memory session per render: concurrent exports keep their own request filter.
				partition: `showhow-pdf-render-${randomUUID()}`,
			},
		});
		win.webContents.session.webRequest.onBeforeRequest((details, callback) =>
			callback({ cancel: !(details.url === fileUrl || details.url.startsWith("data:")) }),
		);
		win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
		win.webContents.on("will-navigate", (event) => event.preventDefault());
		try {
			await win.loadFile(file);
			return await win.webContents.printToPDF({ printBackground: true, preferCSSPageSize: true });
		} finally {
			win.destroy();
			await fs.rm(dir, { recursive: true, force: true });
		}
	};
}

function isPdfOptions(value: unknown): value is PdfExportOptions {
	if (typeof value !== "object" || value === null) return false;
	const options = value as Record<string, unknown>;
	return ["screenshots", "narration", "timestamps"].every(
		(key) => typeof options[key] === "boolean",
	);
}

async function exists(file: string) {
	return fs.stat(file).then(
		() => true,
		() => false,
	);
}

export function registerPdfExportHandlers(deps: {
	handle: (
		channel: string,
		handler: (event: { sender: { id: number } }, ...args: unknown[]) => Promise<unknown>,
	) => void;
	recordingsRoot: string;
	downloadsDir: string;
	homeDir: string;
	chooseSaveFile: (defaultPath: string) => Promise<string | null>;
	render: (html: string) => Promise<Buffer>;
	reveal: (file: string) => void;
}) {
	// Chosen files stay in main per renderer and bundle; the renderer never supplies a path.
	const chosen = new Map<string, string>();
	const saved = new Map<string, string>();
	const display = (file: string) => {
		const folder = path.dirname(file);
		const home = path.resolve(deps.homeDir);
		return folder === home || folder.startsWith(home + path.sep)
			? `~${folder.slice(home.length)}`
			: folder;
	};
	async function bundlePath(value: unknown) {
		if (typeof value !== "string") throw new Error("Invalid bundle");
		const root = await fs.realpath(deps.recordingsRoot);
		const real = await fs.realpath(path.resolve(value));
		if (!real.startsWith(root + path.sep)) throw new Error("Outside recordings root");
		return real;
	}
	const titleOf = async (bundle: string) =>
		(JSON.parse(await fs.readFile(path.join(bundle, "meta.json"), "utf8")) as { title?: string })
			.title ?? "";
	const defaultFile = async (bundle: string) =>
		path.join(deps.downloadsDir, pdfFileName(await titleOf(bundle)));
	// Downloads never overwrites: "Title.pdf", then "Title 2.pdf", …
	async function uniqueDefault(bundle: string) {
		const file = await defaultFile(bundle);
		const stem = file.slice(0, -".pdf".length);
		for (let n = 1; ; n++) {
			const candidate = n === 1 ? file : `${stem} ${n}.pdf`;
			if (!(await exists(candidate))) return candidate;
		}
	}
	deps.handle("showhow:pdf-destination", async (event, bundle) => {
		try {
			const resolved = await bundlePath(bundle);
			return {
				display: display(
					chosen.get(`${event.sender.id}:${resolved}`) ?? (await defaultFile(resolved)),
				),
			};
		} catch {
			return { display: display(path.join(deps.downloadsDir, "Showhow guide.pdf")) };
		}
	});
	deps.handle("showhow:pdf-choose-destination", async (event, bundle) => {
		try {
			const resolved = await bundlePath(bundle);
			const key = `${event.sender.id}:${resolved}`;
			const file = await deps.chooseSaveFile(chosen.get(key) ?? (await defaultFile(resolved)));
			if (!file) return { status: "cancelled" };
			const target = file.toLowerCase().endsWith(".pdf") ? file : `${file}.pdf`;
			chosen.set(key, target);
			return { display: display(target) };
		} catch {
			return { status: "failed" };
		}
	});
	deps.handle("showhow:pdf-export", async (event, bundle, options): Promise<PdfExportResult> => {
		try {
			const resolved = await bundlePath(bundle);
			if (!isPdfOptions(options)) return { status: "failed" };
			const target = chosen.get(`${event.sender.id}:${resolved}`);
			const result = await exportPdf(resolved, options, {
				destination: async () => target ?? (await uniqueDefault(resolved)),
				render: deps.render,
			});
			if (result.status !== "saved") return result;
			const revealId = randomUUID();
			saved.set(revealId, result.path);
			return { status: "saved", display: display(result.path), revealId };
		} catch {
			return { status: "failed" };
		}
	});
	deps.handle("showhow:pdf-reveal", async (_event, revealId) => {
		const file = typeof revealId === "string" ? saved.get(revealId) : undefined;
		if (!file) return { success: false };
		deps.reveal(file);
		return { success: true };
	});
}
