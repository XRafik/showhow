# Showhow — next session

Owner-approved order, locked on 2026-10-12. **Status 2026-10-12 wrap-up:** step 1 done; step 2 in progress. See `.agents/HANDOFF.md` for the next action. Do not begin implementation or a new design exploration before that assessment.

1. **Assess OpenScreen v2.** Identify useful features and their effects on Showhow’s screens and workflows.
2. **Design the full Showhow experience.** Update the Pen file to cover the library, recorder, editor, guides, agent briefs, and AI settings.
3. **Build an interactive UI with dummy data.** Use the intended app structure and reusable components. Include loading, empty, error, and review states.
4. **Connect real features in small steps.** Integrate selected OpenScreen improvements and Showhow features into the approved UI.
5. **Check the complete workflows.** Refine the design using real recordings and generated results.

## Starting point

Read AGENTS.md and UPSTREAM.md. Review and refresh docs/research/2026-10-12-openscreen-v2-assessment.md against current source; an existing assessment is reference material, not permission to skip step 1. Identify useful imports, screen/workflow implications, compatibility risks and what to leave out. Follow the focused-import policy; never merge the full source branch.

The original newer dither designs in design/showhow.pen remain the visual reference. The owner rejected Document Desk and Evidence Bench. Their 16 frames, experimental component board/tokens, exports, sample assets and review gallery were deleted. Do not revive their layout recommendation. The older Design Max handoff is closed.

Preserve existing dirty work. The design checkout is older than current main; inspect branch/status before the next session. No upstream integration or application implementation happened during this design session. Do not infer completion from proposed Pen screens.

Retain the settled product decisions in docs/research/2026-10-12-ui-direction.md: local recordings and imported MP4s; guides for people and briefs for agents; original-recording evidence; optional ChatGPT plan sign-in/OpenRouter direction; free, local-first product. The sequence above is the latest owner instruction.
