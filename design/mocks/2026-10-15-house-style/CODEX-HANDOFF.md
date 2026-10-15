# Handoff: finish the Showhow Pen design pass

From: Claude (coordinator, out of usage). To: Codex. Owner: Mohamed. Date: 2026-10-15.
Repo: /Users/mohamedb/dev/projects/showhow, branch `design/full-experience` (local only; never push).

## Context (read first)
- `AGENTS.md`, `.agents/decisions.md` (last four 2026-10-15 entries).
- `design/mocks/2026-10-15-house-style/`: `SPEC.md` (the locked mock's spec), `index.html` (the
  locked mock), `DESIGN-AUDIT.md` (findings plus owner decisions), `pen-final/REPORT.md` (the 37
  Final frames, with node ids).
- Pen file: `design/showhow.pen`, open in pen.dev. Use only the `pencil` MCP tools. Call its
  `read_skill`, then read `execute.md` and `pen-schema.md` before any edit.

## State now
- 37 `Final · <Area> — <state>` frames exist (Library, HUD, Editor, Settings rows from y≈20371).
- A component pass was cut off mid-run. 25 new components exist (Sidebar/Final R2twy, Library
  row/Selected d1RyD, Library row/Processing cpWn9, Guide step/Final ASlK3, Video player/Final XVW47,
  Output tabs header ALQHx, Narration card nMgns, Sheet xPAFR, Switch/On HjtZ1, Switch/Off ZWQId, Task
  row/Done v5rhH, /Active Iy6tU, /Pending iBcfb, Progress card Oeszh, Provider row h3iYqI, Settings tabs
  gdSUV, Segmented control Ehxv9, Toast MDiBj, HUD bar/Idle W88hJ, /Recording J6qi2L, Timeline
  pill/Zoom jWWhb, /Cut Ybzcm, /Text T2udu, Ledgerly/Dash qYPZn, Ledgerly/List zzH81), and the Final
  frames already use many of them.

## Tasks, in order
1. **Finish the component pass.**
   - Screenshot all 37 Final frames and fix anything broken by the swaps.
   - Rebind leftover hard-coded `#2F2F2F` and `#FFFCF7` fills (outside fake Ledgerly screenshots) to
     `$ds-ink`, `$ds-surface` or `$ds-panel`.
   - In the "Design system — usage" frame (cgdpI), add one line per new component.
   - Leave owner frames (23–55, OLD, Dither) untouched.
2. **Draw the audit's missing states** as new Final frames, built from the components, placed in their
   area rows:
   - Library — AI not connected: the review sheet with a "Connect AI to make guides" step offering
     ChatGPT and OpenRouter.
   - Library — review before AI: update the existing frame. Add an "Always send transcript and
     frames" checkbox (ticked) and a "Check what's sent" link.
   - Library — agent brief not made / making brief / brief failed.
   - Library — copy for agent making brief: COPY FOR AGENT reads MAKING BRIEF…, then the copied state.
   - Library — copied: the COPIED ✓ state.
   - Library — PDF saved: the sheet's success state, "PDF saved · Show in Finder".
   - Library — search, and Library — no results: a search field under LIBRARY · n.
   - HUD — screen recording permission, HUD — no microphone, Library — no speech found.
   - Settings — appearance: a LIGHT / DARK / SYSTEM segmented control.
3. **Low fixes across the Final frames:**
   - Use "MAKE GUIDE" / "MAKE BRIEF" everywhere, never CREATE GUIDE.
   - Replace "BROWSER · …" meta with "DESKTOP · …" or "WINDOW · CHROME · …".
   - No selected library row while Settings is active.
4. **Export and report.**
   - Export the new and changed frames as PNG (scale 1) to `pen-final/`, using the existing naming.
   - Append them to `pen-final/REPORT.md`, listing which audit finding each one closes.
   - Ask the owner to press Cmd+S in pen.dev, and wait for their "saved".
5. **Commit.** After the owner confirms the save, commit only `design/showhow.pen`,
   `design/assets/`, `design/mocks/2026-10-15-house-style/` and `.agents/decisions.md`, with the
   message `design: componentise final frames and draw audit states`. Don't commit `.pi/`. Don't push.

## Rules
- Visual rules live in `SPEC.md` (sections Tokens, Components and Dither). Orange `#E3582D` is for
  meaning only, and the offset shadow `4px 4px 0 #82B09A` goes only on the logo, HUD, sheets, selected
  source card, countdown and toasts.
- Don't make product decisions. If something isn't covered here, `SPEC.md` or `DESIGN-AUDIT.md`, ask
  the owner in one line.
- Verify each frame with a screenshot before moving on.
