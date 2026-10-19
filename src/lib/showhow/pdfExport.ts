export interface PdfExportOptions {
	screenshots: boolean;
	narration: boolean;
	timestamps: boolean;
}
export const DEFAULT_PDF_OPTIONS: PdfExportOptions = {
	screenshots: true,
	narration: true,
	timestamps: true,
};
/** Paths stay in main: the renderer sees display strings and an opaque id for Show in Finder. */
export type PdfDestination = { display: string };
export type PdfExportResult =
	| { status: "saved"; display: string; revealId: string }
	| { status: "cancelled" }
	| { status: "failed" };
