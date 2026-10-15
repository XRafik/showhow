# Design audit: Showhow final frames

Date: 2026-10-15. Method: ux-review checklist, walking the 37 `Final ·` frames in
`design/showhow.pen` (PNGs in `pen-final/`) as the owner would use them.

## Brief
Brief: `~/Brain/projects/showhow/brief.md` (with `ship list.md`). Scope: the 37 `Final ·` frames:
Library 18 (HHDUh … D7oXP), HUD 6 (v1ofn … LxC9k), Editor 8 (nqIPi … n24vs), Settings 5
(nTHnL … F1m40C).

## Findings
1. **[high] S1 Every state: no "AI not connected yet" path** -- `Final · Library — just saved` (xoeDO), `Final · Library — review before AI` (WRKFc)
   Problem: the brief says "AI runs only when Mohamed connects ChatGPT … or OpenRouter". Every
   frame assumes a provider is already signed in. On first use, CREATE GUIDE has nowhere to go, so the
   core action dead-ends. Fix: add a "Connect AI to make guides" state inside the review sheet (two
   provider buttons; on success it returns to the sheet), and show it as a frame.
2. **[medium] B4/D2 Priorities: MP4 import is designed but out of V1** -- `Final · Library — import video` (MfWf9), `Final · Library — importing` (D7oXP), the IMPORT VIDEO sidebar button and IMPORTED rows in every Library frame
   Problem: the brief lists "MP4 import" under "Out of v1", but the sidebar promotes it on every
   screen. Fix: owner decision. Either drop the button, the two frames and the IMPORTED rows, or move
   import into V1 in the brief.
3. **[medium] D1 No outliers: "BROWSER" recordings imply the dropped companion** -- sidebar rows and meta lines ("BROWSER · 6:02") in Library frames, e.g. `Final · Library — making the guide` (CPka0)
   Problem: the brief drops the browser companion, but recordings are still labelled BROWSER, which
   implies a capture mode V1 doesn't have. Fix: label recordings DESKTOP or by window ("WINDOW ·
   CHROME").
4. **[medium] S1 Every state: the agent brief has only its ready state** -- `Final · Library — agent brief` (vNVmi)
   Problem: the guide has not-made, making, failed and remake frames; the brief has none, yet
   "Copy for agent" is one of the brief's two handoffs. Fix: add brief not-made (MAKE BRIEF), making,
   and failed frames using the guide's components.
5. **[medium] J5 Real use: COPY FOR AGENT is ambiguous before a brief exists** -- `Final · Library — guide ready` (uNXEY)
   Problem: walking the guide-ready screen, the brief tab is not made, but COPY FOR AGENT is the main
   button. What gets copied (guide + path? an automatic brief?) is a guess. Fix: label it by result
   ("COPY GUIDE + PATH" when only a guide exists) or make COPY FOR AGENT create the brief first.
   It's the owner's call.
6. **[medium] J4 Friction: the review sheet runs before every guide** -- `Final · Library — review before AI` (WRKFc)
   Problem: the brief's main action is "press one button", but each guide takes two clicks plus a
   review. Fix: show the sheet the first time per provider, with "Always send transcript and frames"
   checked, then go straight to making; keep review reachable from a "Check what's sent" link.
7. **[medium] S3 Components (hard rule): repeated UI isn't componentised** -- all Final frames
   Problem: the Sidebar component (vqpOW) is unused; 23 frames carry their own raw sidebar copy.
   Guide step (ZWRlj) and Video player (z2lUL) are unused. Tabs header, sheets, switches, task rows,
   provider rows, the HUD bar and timeline lanes have no components. One change to the sidebar would
   need 23 hand edits. Fix: the component-library update (in progress).
8. **[medium] S1/U2 States: no library search or filter** -- sidebar in all Library frames
   Problem: the metric is 5+ recordings a week, so the list passes 20 within a month with no way to
   find one. The 12 Oct mock had search; the final frames dropped it. Fix: restore a search field
   under LIBRARY · n, plus its no-results state.
9. **[medium] S1 Every state: missing failure states for recording** -- HUD row
   Problem: no frames for screen-recording permission denied, the microphone missing, or a recording
   with no speech (which breaks guide generation). Fix: add a permission sheet before the source
   selector, and a "no narration found" variant of the guide's not-made state.
10. **[low] S1 Every state: success states frozen out** -- `Final · Library — guide ready` (uNXEY), `Final · Library — export PDF` (gZRt4)
    Problem: COPIED ✓ and PDF saved states exist in the mock but have no frame, so the build has no
    reference. Fix: add "copied" and "PDF saved · Show in Finder" variants.
11. **[low] C1 Conversational: one action, three names** -- `Final · Library — just saved` (xoeDO) "CREATE GUIDE", `Final · Library — review before AI` (WRKFc) "MAKE GUIDE", `Final · Library — agent brief` (vNVmi) "COPY BRIEF + PATH" vs COPY FOR AGENT
    Problem: different verbs for the same action make users wonder whether they're different. Fix:
    use MAKE GUIDE / MAKE BRIEF everywhere and one label for the agent handoff.
12. **[low] D1 No outliers: library row stays selected inside Settings** -- `Final · Settings — AI connections` (nTHnL) and siblings
    Problem: a selected recording while in Settings suggests the settings belong to that recording.
    Fix: no selected row while Settings is active.
13. **[low] S2 Foundations: hard-coded token colours** -- Final frames (≈130 fills of #2F2F2F / #FFFCF7 outside instances)
    Problem: these bypass `ds-ink` / `ds-surface`, so a theme change misses them. Fake-screenshot
    greys are fine as content. Fix: rebind them to variables during the component pass.
14. **[low] S1 Every state: Appearance settings tab is empty** -- `Final · Settings — *` tabs
    Fix: add the Light / Dark / System frame.

## Passed
- B2 Key metric: NEW RECORDING is the top primary button on every Library frame, which is the path that moves weekly use.
- B3 Sign-up friction: no account; recording, editing and steps work with no AI connection (Settings copy says so). The first-AI-use gap is finding 1.
- J1 Steps: every frame maps to a step: record (HUD 1–5), save (just saved, editing title), make (review, making, failed, remake), use (guide ready, agent brief, export PDF), side trips (editor, settings, notes).
- J3 Time to value: stop → just saved → CREATE GUIDE → guide, with no detour beyond finding 6.
- S2 Foundations: built from the existing `ds-*` variables and components (1,900+ variable fills); the leftovers are finding 13.
- U1 First-timers: the empty state "Show it once." gives one clear first step (NEW RECORDING / IMPORT VIDEO).
- U3 Power users: HUD shows the ⌘⇧2 shortcut; the keyboard shortcuts dialog exists (n24vs).
- D2 Defensible: each button maps to a brief handoff (COPY PATH and COPY FOR AGENT for agents, EXPORT PDF for clients, EDIT VIDEO for social clips), except import (finding 2).
- G1 Sharing: handoffs appear only on guide and brief outputs, where they serve the user; there are no invites or social prompts.

## Business questions I couldn't answer
- Should each V1 feature get its own goal (e.g. "guide needs no edits 4 times in 5") besides weekly use? (B1)
- Which milestones do we track for weekly use: first recording, first guide, first handoff? The brief names only the overall metric. (J2)
- Is the Notes window (`Final · HUD — notes window`, LxC9k) in V1? It isn't on the ship list. (D2/B4)
- Is MP4 import in or out of V1? (finding 2)

## Owner decisions on the findings (2026-10-15)
- Finding 2: MP4 import moves into V1 (brief updated). Keep the import frames and button.
- Finding 5: COPY FOR AGENT makes the brief first when none exists (MAKING BRIEF…), then copies brief + path.
- Finding 6: the review sheet appears the first time per provider, with "Always send transcript and frames" ticked; a "Check what's sent" link stays available.
- Notes window: not in V1.
- Open: per-feature goals (B1) and milestone metrics (J2) stay unanswered; weekly use is the only metric for now.
