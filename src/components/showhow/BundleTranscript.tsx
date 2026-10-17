import { useEffect } from "react";
import { resumeBundleTranscript } from "@/lib/showhow/resumeBundleTranscript";

/** Showhow job slot; the upstream editor and native captioning stay unchanged. */
export function BundleTranscript() {
	useEffect(() => {
		void resumeBundleTranscript().catch((error) =>
			console.error("Showhow transcript resume failed:", error),
		);
	}, []);
	return null;
}
