// @vitest-environment jsdom
import "@testing-library/jest-dom";
import { act, cleanup, render as rtlRender, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@/contexts/I18nContext";
import type { PdfExportResult } from "@/lib/showhow/pdfExport";
import { ExportPdfSheet } from "./ExportPdfSheet";

const render = (node: ReactNode) => rtlRender(<I18nProvider>{node}</I18nProvider>);
const entry = {
	bundleDir: "/scratch/one",
	title: "Bug: invoice total rounds wrong",
	source: "desktop" as const,
	createdAt: 1,
	durationMs: 134_000,
	steps: [
		{ label: "Open invoices", ts: 4000, screenshot: "step-01.png" },
		{ label: "Click Acme", ts: 17000, screenshot: "step-02.png" },
	],
};
const destination = vi.fn();
const choose = vi.fn();
const exportPdf = vi.fn<(bundleDir: string, options: unknown) => Promise<PdfExportResult>>();
const reveal = vi.fn();
const onOpenChange = vi.fn();

beforeEach(() => {
	vi.clearAllMocks();
	destination.mockResolvedValue({ display: "~/Downloads" });
	exportPdf.mockResolvedValue({ status: "saved", display: "~/Downloads", revealId: "r1" });
	reveal.mockResolvedValue({ success: true });
	Object.defineProperty(window, "electronAPI", {
		configurable: true,
		value: {
			showhowPdfDestination: destination,
			showhowPdfChooseDestination: choose,
			showhowPdfExport: exportPdf,
			showhowPdfReveal: reveal,
		},
	});
});
afterEach(cleanup);

const open = async () => {
	render(<ExportPdfSheet entry={entry} open onOpenChange={onOpenChange} />);
	await screen.findByText("~/Downloads");
};

describe("ExportPdfSheet", () => {
	it("starts with every part included and the default destination", async () => {
		await open();
		expect(screen.getByRole("dialog", { name: "Export PDF" })).toBeVisible();
		for (const name of ["Screenshots", "Narration", "Timestamps"])
			expect(screen.getByRole("switch", { name })).toHaveAttribute("aria-checked", "true");
		expect(screen.getByText("Screenshots, narration and timestamps")).toBeVisible();
		expect(screen.getByText("2 steps · 2:14")).toBeVisible();
		expect(destination).toHaveBeenCalledWith("/scratch/one");
	});

	it("names each switch from its visible label", async () => {
		await open();
		for (const name of ["Screenshots", "Narration", "Timestamps"]) {
			const toggle = screen.getByRole("switch", { name });
			expect(toggle.getAttribute("aria-labelledby")).not.toMatch(/\s/);
		}
	});

	it("exports with the chosen parts and shows the saved state with Show in Finder", async () => {
		await open();
		await userEvent.click(screen.getByRole("switch", { name: "Narration" }));
		expect(screen.getByRole("switch", { name: "Narration" })).toHaveAttribute(
			"aria-checked",
			"false",
		);
		expect(screen.getByText("Screenshots and timestamps")).toBeVisible();
		await userEvent.click(screen.getByRole("button", { name: "Export PDF" }));
		expect(exportPdf).toHaveBeenCalledWith("/scratch/one", {
			screenshots: true,
			narration: false,
			timestamps: true,
		});
		expect(await screen.findByText("PDF saved")).toBeVisible();
		expect(screen.getByText("Saved to ~/Downloads")).toBeVisible();
		await userEvent.click(screen.getByRole("button", { name: "Show in Finder" }));
		expect(reveal).toHaveBeenCalledWith("r1");
		await userEvent.click(screen.getByRole("button", { name: "Done" }));
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	it("keeps the destination when the save panel is cancelled", async () => {
		choose.mockResolvedValueOnce({ status: "cancelled" });
		await open();
		await userEvent.click(screen.getByRole("button", { name: "Change" }));
		expect(choose).toHaveBeenCalledWith("/scratch/one");
		expect(screen.getByText("~/Downloads")).toBeVisible();
		expect(screen.queryByText("PDF saved")).not.toBeInTheDocument();
		expect(exportPdf).not.toHaveBeenCalled();
	});

	it("shows the chosen destination", async () => {
		choose.mockResolvedValueOnce({ display: "~/Desk" });
		await open();
		await userEvent.click(screen.getByRole("button", { name: "Change" }));
		expect(await screen.findByText("~/Desk")).toBeVisible();
	});

	it("reports a failed export without saved feedback and lets you retry", async () => {
		exportPdf.mockResolvedValueOnce({ status: "failed" });
		await open();
		await userEvent.click(screen.getByRole("button", { name: "Export PDF" }));
		expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't export the PDF");
		expect(screen.queryByText("PDF saved")).not.toBeInTheDocument();
		await userEvent.click(screen.getByRole("button", { name: "Export PDF" }));
		expect(await screen.findByText("PDF saved")).toBeVisible();
	});

	it("disables the form while exporting", async () => {
		let finish!: (value: PdfExportResult) => void;
		exportPdf.mockImplementationOnce(() => new Promise((resolve) => (finish = resolve)));
		await open();
		await userEvent.click(screen.getByRole("button", { name: "Export PDF" }));
		expect(screen.getByRole("button", { name: "Exporting…" })).toBeDisabled();
		expect(screen.getByRole("switch", { name: "Screenshots" })).toBeDisabled();
		await act(async () => finish({ status: "failed" }));
		await waitFor(() => expect(screen.getByRole("button", { name: "Export PDF" })).toBeEnabled());
	});
});
