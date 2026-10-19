/**
 * Renders a workflow guide to a self-contained HTML page for Electron's printToPDF. Input is
 * structured data the main process read from one bundle; every string is escaped and the only
 * images are inline data URIs, so the page cannot load scripts, remote resources or local files.
 */
import type { PdfExportOptions } from "../../src/lib/showhow/pdfExport";

export type { PdfExportOptions };

export interface PdfStep {
	label: string;
	ts: number;
	/** Present only when screenshots are included and the step is not hidden. */
	image?: { mime: "image/png" | "image/jpeg"; base64: string };
	/** Persisted redaction without explicit opt-in: no label text and no image. */
	hidden: boolean;
	narration: string[];
}
export interface PdfDocument {
	title: string;
	meta: string;
	steps: PdfStep[];
}

export function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}
const lines = (value: string) => escapeHtml(value).replace(/\r?\n/g, "<br>");

export function formatPdfTime(ms: number): string {
	const total = Math.max(0, Math.floor(ms / 1000));
	return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export function pdfFileName(title: string): string {
	// Characters macOS, Windows and Finder treat specially, plus control characters.
	const safe = Array.from(title, (char) =>
		char.charCodeAt(0) < 32 || '/\\:*?"<>|'.includes(char) ? " " : char,
	).join("");
	const base = safe.replace(/\s+/g, " ").trim().slice(0, 76).trim();
	return base && !/^\.+$/.test(base) ? `${base}.pdf` : "Showhow guide.pdf";
}

const STYLE = `
@page { size: A4; margin: 18mm 16mm; }
* { box-sizing: border-box; }
body { margin: 0; color: #2f2f2f; font: 11pt/1.45 -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif; }
h1 { margin: 0 0 4pt; font-size: 22pt; line-height: 1.15; letter-spacing: -0.3pt; overflow-wrap: anywhere; }
.meta { margin: 0 0 16pt; color: #6b6760; font: 8pt/1.4 Menlo, monospace; letter-spacing: 0.8pt; text-transform: uppercase; }
.step { display: grid; grid-template-columns: 22pt 1fr; gap: 0 10pt; padding: 12pt 0; border-top: 0.6pt solid #dcd6cb; break-inside: avoid; page-break-inside: avoid; }
.num { font: 9pt Menlo, monospace; color: #6b6760; padding-top: 2pt; }
.shot { display: block; max-width: 100%; max-height: 120mm; margin: 0 0 8pt; border: 0.6pt solid #dcd6cb; border-radius: 4pt; }
.label { margin: 0; font-size: 12pt; font-weight: 600; overflow-wrap: anywhere; }
.hidden { color: #6b6760; font-style: italic; font-weight: 500; }
.quote { margin: 3pt 0 0; color: #6b6760; overflow-wrap: anywhere; }
.time { margin: 4pt 0 0; font: 8.5pt Menlo, monospace; color: #b5482a; }
`;

export function renderPdfHtml(doc: PdfDocument, options: PdfExportOptions): string {
	const steps = doc.steps
		.map((step, index) => {
			const parts: string[] = [];
			if (options.screenshots && step.image && !step.hidden)
				parts.push(
					`<img class="shot" alt="" src="data:${step.image.mime};base64,${step.image.base64.replace(/[^A-Za-z0-9+/=]/g, "")}">`,
				);
			parts.push(
				step.hidden
					? `<p class="label hidden">Sensitive text hidden</p>`
					: `<p class="label">${lines(step.label)}</p>`,
			);
			if (options.narration && !step.hidden)
				for (const quote of step.narration) parts.push(`<p class="quote">“${lines(quote)}”</p>`);
			if (options.timestamps) parts.push(`<p class="time">${formatPdfTime(step.ts)}</p>`);
			return `<section class="step"><div class="num">${String(index + 1).padStart(2, "0")}</div><div>${parts.join("")}</div></section>`;
		})
		.join("\n");
	return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'">
<title>${escapeHtml(doc.title)}</title><style>${STYLE}</style></head>
<body><h1>${lines(doc.title)}</h1><p class="meta">${escapeHtml(doc.meta)}</p>
${steps}
</body></html>
`;
}
