# Spec: Showhow house-style mock (v2 of the polish pass; throwaway, one HTML file)

MOCK = /Users/mohamedb/dev/projects/showhow/design/mocks/2026-10-15-house-style
PREV = ../2026-10-15-polish-pass (your previous build; copy its index.html as the starting point)

## Owner direction (2026-10-15)
- Visual base = the owner's Pen screens 23–46 (library, settings, HUD, editor). Their style and vibe
  win over the polish pass wherever they differ. Reference exports (look at every one before building):
  /private/tmp/claude-501/-Users-mohamedb-dev-projects-showhow/85e93665-27f0-4e5c-bc75-0c80564cb414/scratchpad/pen/
  eNNeM (23 library launch), RsepI (24 just saved), rTUN6 (25 making guide), y4ipZ (26 guide ready),
  kiLdT (27 settings), D4LKh (28 empty), lfTGI (36 HUD idle), SkQcb (37 HUD recording), F78q2Q (38 source
  selector), k7v7J (39 countdown), Ot7mn (40 notes), hAXNg (41 editor background), WSh7g (42 export
  panel), KlVqM (43 no project), cOEkf (44 rendering). Dither versions: KxBa3, IRKof, Q8OJqc, R3vOp3.
  Dither rules: g6DjDU (library audit).
- Display font: Inter Tight (no serif anywhere; remove the Serif/Sans toggle and Instrument Serif).
- Guide view: the 23–46 compact list layout (thumbnail left, text right), NOT the manual layout.
- Sidebar dither: no permanent floor. Mosaic appears in the sidebar only on a row that is processing.
- More orange (#E3582D) used for meaning, as in the 41 editor reference: playhead, CUT, click rings,
  "WHERE IT GOES WRONG", STOP, failure, and the record dot.
- Keep all polish-pass micro-interactions, Its Hover/Tabler icons, the develop moment (re-done as
  mosaic), scrub-bar step ticks, fake screenshots, Motion 1×/0.1× toggle, reduced-motion handling.

## Tokens (exact; from the Pen file)
Light / Dark: surface #FFFCF7/#2F2F2F · surface-raised #F9F5EC/#363636 · surface-sunken #F7F2E8/#292929 ·
ink #2F2F2F/#FFFCF7 · ink-soft #2F2F2FB3/#FFFCF7B3 · muted #2F2F2F8C/#FFFCF78C · ink-faint
#2F2F2F66/#FFFCF766 · line #2F2F2F24/#FFFCF724 · ink-wash #2F2F2F14/#FFFCF714 · chip #E8E4DC/#3A3A3A ·
panel #2F2F2F/#242424 · panel-deep #242424/#1C1C1C · on-panel #FFFCF7 · on-panel-soft #FFFCF7AA ·
on-panel-muted #FFFCF78C · on-panel-faint #FFFCF766 · on-panel-line #FFFCF71F.
accent #82B09A · on-accent #2F2F2F · accent-tint #82B09A33 · accent-wash #82B09A26 · accent-100 #E7F1EC ·
accent-200 #CFE4DA · accent-strong #33564A · rec #E3582D · rec-wash #E3582D1F · rec-ink #B3431F ·
rec-soft #F28B6B · hud-bg #07080AE6 · hud-border #FFFFFF1A.
Fonts: Inter (body 14px), Inter Tight 600 (display: screen titles 32px/-0.02em, section 18px),
JetBrains Mono (labels, buttons, meta).
Offset shadow (signature): `box-shadow: 4px 4px 0 #82B09A` (no blur). Used on: logo mark, HUD bar,
selected source card, countdown tile, the active output/guide card, sheets (dialogs), toasts, and the
pressed-and-held primary on Copy for agent. Not on list rows, buttons or inputs.
Radii: buttons 4px; library rows 6px; cards/video 8px; sheets 10px.

## Components
- Buttons (match Pen components exactly): 11px JetBrains Mono 500, letter-spacing 0.6px, UPPERCASE,
  padding 10px 14px, radius 4, 14px icon + 8px gap.
  Primary: bg accent, text #2F2F2F. Dark: bg #2F2F2F, text #FFFCF7 (Copy for agent, Export video,
  New recording on light surfaces). Secondary: bg transparent, 1px line border, ink text. Ghost: no
  border. Sidebar button: bg #FFFCF714, on-panel text (Settings). Rec/Stop: bg rec, white text.
  Hover: primary → #8FBBA6, dark → #3A3A3A, secondary → bg ink-wash. Press: scale(0.96) 160ms
  cubic-bezier(0.23,1,0.32,1). Never transition: all.
- Tag/chip: 10px JetBrains Mono, padding 2px 6px, radius 3: GUIDE (accent fill, ink), NO GUIDE
  (#FFFCF71A, on-panel-soft), MAKING GUIDE… (accent-tint, accent), FAILED (rec, white), BUG REPORT
  (rec-wash, rec), WHERE IT GOES WRONG (rec-wash, rec), IMPORTED (#FFFCF71A).
- Library row (sidebar): padding 10, radius 6, gap 5. Title Inter 500 13px on-panel; meta JetBrains
  Mono 10px on-panel-muted ("DESKTOP · 0:58"); one tag. SELECTED: bg #FFFCF71A fill, no border, no
  left bar. Hover (pointer devices): bg #FFFCF70D, 120ms. A selected row that is processing keeps its
  fill and shows the mosaic edge (below).
- Logo: 40px cream square with 1px ink border containing the cursor mark, 4px 4px 0 accent offset
  shadow, "Showhow" Inter Tight 600 17px on-panel.
- Sidebar: 272px, panel bg, padding 18. Order: logo, NEW RECORDING (primary, full width), "Import
  video" (ghost, on-panel-soft, upload icon), label "LIBRARY · 5" (mono 10px on-panel-faint), rows,
  spacer, SETTINGS (sidebar button). No dither floor.

## Screens (same set, fake data and flows as PREV; restyle each to 23–46)
Fake data: reuse PREV's five recordings, but titles follow the Pen style ("Bug: invoice total rounds
wrong" etc.) and meta "DESKTOP · 2:14" / "BROWSER · 4:31" / "IMPORTED · 4:31".
- A/B/C library detail = 26 layout: title (Inter Tight 32px) + mono meta line, RENAME secondary
  top-right. Video card (radius 8, panel-deep) with mosaic poster (see Dither) until "decoded" (after
  600ms on first view the poster resolves to a dark fake video frame via the develop effect). Transport
  row inside the video bottom: play, "0:00 / 0:58" mono, scrub bar with step ticks (2px × 8px
  on-panel-soft; the step flagged WHERE IT GOES WRONG has an orange tick).
- Output section: header row "01 / WALKTHROUGH GUIDE" mono label + BUG REPORT tag, right: REMAKE
  (secondary), EXPORT PDF (secondary with bg chip), COPY PATH (secondary with bg chip), COPY FOR AGENT
  (dark). Below: "FROM YOUR NARRATION" quote card (surface-sunken, radius 6). Then steps in the 26
  layout: number mono 11px, 160×90 thumbnail (fake screenshot, radius 6, outline 1px #0000001A,
  orange 22px click ring 2px), title Inter 500 15px, quote 13px muted in quotes, row of mono 11px
  "0:04 · EDIT · DELETE"; step 3 gets the WHERE IT GOES WRONG tag. Hairline between steps.
- Agent brief: second tab "02 / AGENT BRIEF" in the same header style (tabs = the two mono labels
  with the sliding 2px underline from PREV). Brief body as in PREV but in a single card (radius 8,
  surface-raised, 1px line border), evidence in mono with orange timestamps for the failure moment.
- Making the guide (25 layout): "Making your guide" card (radius 8, 1px line border) with "STEP 2 OF
  3 · ~20S LEFT" mono right, a progress bar whose leading edge is a mosaic frontier (dither audit:
  "the edge carries meaning"), and three task rows (check / spinner / empty circle) with mono detail
  ("WHISPER · 0:58 OF AUDIO", "SORTING 9 CLICKS AGAINST YOUR NARRATION", "SCREENSHOTS + STEP TEXT"),
  footer "YOU CAN KEEP USING SHOWHOW WHILE THIS RUNS" + CANCEL. Then the develop sequence from PREV
  below it (step rows appear; each thumbnail develops from MOSAIC, not Bayer noise; titles stream in;
  scrub ticks drop). Keep PREV's timings, cancel and F4 failure (failure: progress frontier turns to
  the rec mosaic palette and stops where the run stopped; card gets a rec-wash header).
- Empty (28) and launch (23): centre card with mosaic hero tile (as in KxBa3/R3vOp3), "Pick a
  recording" / "Show it once." title, NEW RECORDING (dark) + OPEN FOLDER / IMPORT VIDEO (secondary).
- Loading/couldn't load: as 29/30 with the mosaic frontier moving (loading) or broken in rec palette.
- Recording: setup = the 38 source selector sheet (tabs SCREENS · 2 / WINDOWS · 6, cards with offset
  shadow + 1px ink border when selected, "✓ SELECTED" tag, footer note + CANCEL / USE THIS SCREEN).
  Then 39 countdown (cream tile, 96px Inter Tight 3-2-1, offset shadow, "● RECORDING STARTS · ESC TO
  CANCEL" chip; each number swaps with number pop-in, 1s apart at 1×). Then HUD = 37 (dark bar, offset
  sage shadow, STOP in rec, orange dot + tabular timer, pause/restart/delete icons). Stop → HUD STOP
  becomes "SAVING…" loading button → window returns, new row at top of the sidebar with value flash
  and NO GUIDE tag.
- Editor = 41/42 (title bar with LIBRARY / NEW RECORDING / OPEN mono links, right rail of icons,
  inspector panel in cream, timeline lanes ZOOM (accent pills), TRIM (orange CUT), TEXT (dark pills),
  AUDIO (waveform bars in accent), orange playhead with a square head). Keep PREV's assistant panel
  behaviour but style it like the 42 export panel (cream inspector). Export panel = 42 with
  segmented controls as in the reference (selected = dark fill).
- Settings = 27 layout (tabs GUIDE ENGINE · RECORDING · STORAGE · ABOUT become AI CONNECTIONS ·
  RECORDING · TRANSCRIPTION · AGENTS · APPEARANCE). Replace the copy "Nothing is uploaded and no
  account or key is needed" with "Recording, editing and step-finding run on this Mac. AI connections
  are optional and only used when you make a guide, brief or AI edit."
- Export PDF and Remake: as PREV, restyled.

## Dither (port design/mosaic.glsl)
Port `/Users/mohamedb/dev/projects/showhow/design/mosaic.glsl` to the mock's WebGL helper (read the
shader; it uses u_dir, u_block, u_dot, u_edge, u_soft, u_rough, u_lit, u_dark, u_dots, u_seed,
u_alpha). Poster uniforms (from the Pen): u_dir 2, u_block 34, u_dot 4, u_edge 0.42, u_soft 0.5,
u_rough 0.45, u_lit #82B09A, u_dark #242424, u_dots 0.45. Failure palette: u_lit #E3582D, u_dark #2A2420.
Rules (from the dither audit, now binding):
1. Only on content that isn't real yet: video posters before decode, thumbnails while developing,
   progress frontiers, loading, empty/launch hero tile, redaction. Never on finished screenshots,
   never behind body text.
2. Only the edge animates, never on idle. Reduced motion: static.
3. Develop effect = the mosaic edge sweeps across the thumbnail (u_edge animates 0 → 1 over 600ms,
   ease-out); behind the edge is the real fake screenshot.
4. Sidebar: a processing row (making guide, importing, saving) gets a 3px mosaic strip along its
   bottom edge whose lit edge moves left→right with progress; it disappears 300ms after completion.
   Nothing else in the sidebar is dithered.

## Keep from PREV (unchanged behaviour, restyled)
Copy button (COPY FOR AGENT → "COPIED ✓", width locked, 2s), loading-button label swaps, hold to
confirm (DELETE in the step row and the ⋯ menu), tooltip group, sheets transition, toast (with offset
shadow), value flash, skeleton swap, success check, number pop-in, icon swaps, scrub ticks, Motion
1×/0.1× toggle, Light/Dark toggle, Screen select, Sample library toolbar button.

## Acceptance checks (run them; report pass/fail)
Same harness as PREV (tools/accept.mjs adapted). 1280×800 window, viewport 1440×900.
1. No console errors on load and on every Screen entry.
2. All PREV click-paths pass (generation incl. F4 failure and cancel, record incl. countdown 3-2-1,
   import, editor apply + export, settings, PDF export, remake, copy, hold-to-delete).
3. Selected sidebar row has a fill and NO left border/inset bar (check computed box-shadow and
   border-left).
4. No dither canvas exists in the sidebar except on a processing row (count canvases in .sidebar at
   rest = 0; during F2 = 1 on the processing row).
5. Every button label font is JetBrains Mono 11px uppercase (computed).
6. No element uses Instrument Serif (computed fonts scan).
7. Offset shadow present on HUD, logo mark, selected source card, countdown tile, sheets.
8. Develop: a thumbnail mid-develop shows mosaic on one side of the edge and the screenshot on the
   other (capture F2-mid.png).
9. Reduced motion: F2 completes; no edge animation (u_edge jumps to 1).
10. No horizontal scroll in the window on any screen.
Screenshots to MOCK/shots/: A, A-dark, B, C, D (empty), E (loading), F2-mid, F3, F4, G1 (source),
G-countdown, G2 (HUD), G3 (new row), I (editor), I-export, J-ai, pdf, sidebar-processing (crop of the
sidebar during F2).

## Out of scope / rules
Write only inside MOCK/. Don't modify PREV or the Pen file. Do not commit. No new design decisions:
where this spec and the references disagree, the references (23–46 exports) win; list every judgement
call in the report.

## Report
Acceptance results, deviations and judgement calls, screenshot list.
