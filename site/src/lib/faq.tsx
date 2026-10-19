import type { ReactNode } from "react";
import { OPENSCREEN_URL } from "./site";

export type FaqEntry = { id: string; question: string; answer: ReactNode };

export const FAQ: FaqEntry[] = [
	{
		id: "free",
		question: "Is it really free?",
		answer: "Yes. Free and open source, no paywall or account.",
	},
	{
		id: "fork",
		question: "Is Showhow a new app or a fork?",
		answer: (
			<>
				It is a fork of <a href={OPENSCREEN_URL}>OpenScreen</a>, the open-source screen recorder
				created by Siddharth Vaddem and now continued by the OpenScreen contributors. Showhow keeps
				OpenScreen’s recorder and editor and adds a library of your recordings and the step-by-step
				guides. If you only want a recorder, OpenScreen is excellent on its own. Both are MIT
				licensed.
			</>
		),
	},
	{
		id: "upload",
		question: "Does it upload my recordings?",
		answer:
			"No. Recording happens on your Mac. AI only runs when you connect your own OpenRouter key, and only for the guide step.",
	},
	{
		id: "fails",
		question: "What if the AI step fails?",
		answer: "The recording always saves. A failed guide never loses a take.",
	},
	{
		id: "os",
		question: "Windows or Linux?",
		answer: "Not yet. macOS only for now.",
	},
	{
		id: "agents",
		question: "Which agents does it work with?",
		answer: "Anything that reads text and a folder path, including Claude Code and Codex.",
	},
];
