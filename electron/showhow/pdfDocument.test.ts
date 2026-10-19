import { describe, expect, it } from "vitest";
import { escapeHtml, type PdfDocument, pdfFileName, renderPdfHtml } from "./pdfDocument";

const doc: PdfDocument = {
	title: "Invoice <script>alert(1)</script> & rounding",
	meta: "Desktop · 2:14",
	steps: [
		{
			label: "Open invoices",
			ts: 4_000,
			image: { mime: "image/png", base64: "QUFB" },
			hidden: false,
			narration: ["So first I'll go to invoices."],
		},
		{
			label: "Type the token\nthen press Enter",
			ts: 17_000,
			hidden: true,
			narration: ["It says <b>£104.99</b>"],
		},
	],
};
const all = { screenshots: true, narration: true, timestamps: true };

describe("renderPdfHtml", () => {
	it("escapes every text field and allows no scripts, remote resources or local files", () => {
		const html = renderPdfHtml(doc, all);
		expect(html).not.toContain("<script>alert");
		expect(html).toContain("Invoice &lt;script&gt;alert(1)&lt;/script&gt; &amp; rounding");
		expect(renderPdfHtml({ ...doc, steps: [{ ...doc.steps[1]!, hidden: false }] }, all)).toContain(
			"It says &lt;b&gt;£104.99&lt;/b&gt;",
		);
		expect(html).toContain(
			`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'">`,
		);
		expect(html).not.toMatch(/src="(?!data:)/);
		expect(html).not.toMatch(/https?:|file:/);
	});

	it("keeps step order, numbers and timestamps, and keeps each step on one page", () => {
		const html = renderPdfHtml(doc, all);
		expect(html.indexOf("Open invoices")).toBeLessThan(html.indexOf("Sensitive text hidden"));
		expect(html).toContain(">01<");
		expect(html).toContain(">0:17<");
		expect(html).toMatch(/break-inside:\s*avoid/);
		expect(html).toContain('src="data:image/png;base64,QUFB"');
	});

	it("hides sensitive steps: no label text and no image", () => {
		const html = renderPdfHtml(
			{ ...doc, steps: [{ ...doc.steps[1]!, image: { mime: "image/png", base64: "SECRET" } }] },
			all,
		);
		expect(html).toContain("Sensitive text hidden");
		expect(html).not.toContain("Type the token");
		// Narration around a hidden step can repeat what it hides.
		expect(html).not.toContain("104.99");
		expect(html).not.toContain("SECRET");
	});

	it("omits screenshots, narration and timestamps when they are switched off", () => {
		const html = renderPdfHtml(doc, { screenshots: false, narration: false, timestamps: false });
		expect(html).not.toContain("data:image");
		expect(html).not.toContain("So first");
		expect(html).not.toContain("0:04");
		expect(html).toContain("Open invoices");
	});

	it("keeps multiline labels as separate lines", () => {
		expect(renderPdfHtml({ ...doc, steps: [{ ...doc.steps[1]!, hidden: false }] }, all)).toContain(
			"Type the token<br>then press Enter",
		);
	});
});

describe("helpers", () => {
	it("escapes quotes too", () => {
		expect(escapeHtml(`"a" & 'b'`)).toBe("&quot;a&quot; &amp; &#39;b&#39;");
	});
	it("makes a safe, bounded file name", () => {
		expect(pdfFileName("Bug: a/b\\c? <x> ".repeat(10))).toMatch(/^[^/\\:?<>]{1,80}\.pdf$/);
		expect(pdfFileName("   ")).toBe("Showhow guide.pdf");
		expect(pdfFileName("..")).toBe("Showhow guide.pdf");
	});
});
