# Spec: Showhow polish-pass mock (throwaway, one HTML file)

MOCK = /Users/mohamedb/dev/projects/showhow/design/mocks/2026-10-15-polish-pass

## Purpose
Revision of the 12 Oct flow mock. Same screens, flows and fake data; new visual structure, type,
icons, micro-interactions and the "develop the guide" generation moment. The owner reacts to this.
The rationale is in MOCK/IMPROVEMENTS.md (read it first; this spec wins where they differ).

## Baseline
1. Copy `../2026-10-12-full-experience-flow/index.html` to `MOCK/index.html` and read
   `../2026-10-12-full-experience-flow/SPEC.md`. Everything in that spec still applies (screens A–J,
   Screen select, fake data, flows, accessibility minimums, acceptance click-paths), except what this
   spec changes. Keep the WebGL dither function.
2. Output: `MOCK/index.html`, all CSS/JS inline. At runtime the only external resource allowed is
   Google Fonts (Inter 400/500/600, Inter Tight 600, JetBrains Mono 400/500, Instrument Serif 400 +
   400 italic). Icon SVGs are fetched at build time and inlined (see Icons).

## Mock toolbar additions (outside the window)
- "Display: Serif | Sans" toggle. Serif (default) uses Instrument Serif for the `--display` role;
  Sans switches `--display` to Inter Tight 600 with letter-spacing -0.01em. Nothing else changes.
- "Motion: 1× | 0.1×" toggle that multiplies every duration by 10 (for slow-motion review). Implement
  with one CSS custom property `--t` (1 or 10) used in every duration: `calc(160ms * var(--t))`, and
  the same factor in JS timings.
- Keep the Light/Dark toggle and the Screen select.

## Tokens: keep all existing colour tokens. Add:
--display: 'Instrument Serif', serif (400; titles never bold)
--ease-out: cubic-bezier(0.23,1,0.32,1) · --ease-drawer: cubic-bezier(0.32,0.72,0,1)
--shadow-1: 0 1px 2px #2F2F2F0F, 0 8px 24px #2F2F2F14 (dark: 0 1px 2px #0000004D, 0 8px 24px #00000066)
--outline-img: 0 0 0 1px #0000001A (dark: #FFFFFF1A) applied as outline on every screenshot/video
--radius: 8px outer; nested inner radius = outer − padding (concentric). Buttons 6px. Chips 4px.

## Structural changes (light + dark)

### Remove boxes
- Output cards, step rows, evidence block, connection rows, settings cards: no border, no fill.
  Separate with full-width 1px `--line` hairline rules and spacing (24/32px).
- Keep borders only on: text inputs, the drop zone, focus rings, and the selected-state underline.

### Main panel grid (library, guide, brief)
- Main padding 40px 48px. Content uses a 2-col margin + 10-col body grid: margin column 112px,
  gap 24px, body flexible (max 760px). Video spans the body column at full width (16:9).
- Masthead: title in --display 40px/1.1 ink (Sans mode: 32px). Under it a mono deck line 11px
  uppercase muted: "RECORDED · 2:14 · TODAY 14:02 · 14 CLICKS". Then a hairline rule; on the rule
  row, right-aligned: "Edit video" (secondary) and "⋯" icon button.
- Video is a figure: shadow --shadow-1, outline-img, radius 8. Caption row below in the margin
  column: "FIG. 00" and in the body "ORIGINAL RECORDING · 2:14" (mono 11px muted).
- Scrub bar: 2px track (--line), filled part accent. Step ticks: 2px × 10px ink-soft marks at each
  step timestamp. Hover a tick → tooltip with the step title (tooltip-group behaviour below); click
  seeks (just moves the playhead dot in the mock).

### Output switcher
- Replace the two cards with text tabs: "Guide" and "Agent brief", Inter 500 14px. Beside each a mono
  10px status: "READY · 6" (accent-strong), "NOT MADE" (muted), "FAILED" (rec-ink).
- One shared 2px ink underline slides between tabs: transform translateX + width, 220ms --ease-out.

### Guide view (manual style)
- Toolbar row: left mono "6 STEPS · FROM ORIGINAL RECORDING"; right "Remake" (secondary),
  "Export PDF" (primary).
- Each step, separated by hairlines, 32px vertical padding:
  - Margin column: step number in JetBrains Mono 500 28px ink-faint ("01"), and under it the timestamp
    as a mono 11px link "0:41 ↗" (plays from there).
  - Body: title in --display 24px ink (Sans mode: Inter Tight 600 18px). Under it the screenshot as a
    figure, full body width, 16:10, radius 6, outline-img, shadow-1; caption "FIG. 03 · 0:41 · CLICK"
    mono 10px muted under it. Then the narration as a pull quote: 15px italic ink-soft, 12px left
    padding, 1px accent hairline on the left.
  - Hover the step: "Edit" text button fades in at the right of the title row (opacity only, 150ms).
- Click ring on screenshots: 24px circle, 2px accent stroke plus 1px ink outer outline.

### Agent brief
- Section labels mono 11px uppercase muted; bodies 15px ink. Evidence: mono 12px lines with a 56px
  tabular time column ("0:31  Publish clicked · status unchanged"), on surface-sunken, no border,
  radius 6, padding 16.
- Actions: "Copy brief + path" primary using the Copy Button behaviour below; "Copy path only" text button.

### Sidebar
- Logo row unchanged. "New recording" becomes the primary button (ink-on-panel: bg #FFFCF7, ink
  #2F2F2F) with a rec-coloured 7px dot; "Import video" is a text button with an upload icon.
- Rows: title 13px on-panel (ellipsis) + right-aligned tabular mono 11px time ("14:02", "YDAY",
  "8 OCT"). Second line mono 11px on-panel-muted: "2:14" + optional one word ("IMPORTED"). On the
  right of line 2: two 6px dots = guide, brief (filled accent = made, 1px ring on-panel-faint = not
  made, rec = failed). Remove all chips. Selected row: bg on-panel-hover + 2px accent inset bar.
- The dither floor stays.

### Empty state (D)
- Centre: "Show it once." in --display 56px; deck mono 11px "RECORD YOUR SCREEN OR IMPORT AN MP4";
  two buttons. Behind it, a full-panel dither field at 6% opacity that drifts (seed offset changes
  slowly, 8s per cycle, linear). Respect reduced motion (static).

### Loading (E)
- Skeleton blocks without shimmer; when content arrives (after 1.2s in the mock), cross-fade skeleton
  → content in 200ms with zero layout shift (same box sizes).

## Icons
- Use Its Hover icons inlined as SVG for: copy-icon, download-icon, upload-icon, trash-icon,
  refresh-icon, gear-icon, magnifier-icon, sparkles-icon, dots-horizontal-icon, right-chevron,
  down-chevron, checked-icon, external-link-icon, terminal-icon, eye-icon, file-description-icon,
  player-icon. Fetch each from `https://www.itshover.com/r/<name>.json` (field files[0].content holds
  a React component; extract the SVG paths and replicate its hover motion with CSS/WAAPI using the
  same values found in the component). The icon animates when its BUTTON is hovered.
- For icons Its Hover lacks (microphone, player-record, player-stop, player-pause, device-desktop,
  folder, scissors, file-type-pdf, arrow-back-up, arrow-forward-up, x), fetch static Tabler outline
  SVGs from `https://unpkg.com/@tabler/icons@3.24.0/icons/outline/<name>.svg` and inline them.
- All icons: stroke-width 1.5, `currentColor`, 16px in buttons, 14px in mono contexts.
- Remove every unicode glyph icon (●, ⤓, ⚙, ▶, ⏸, ■, ⋯, ✓, ↗) except the 7px rec dot (a span).

## Buttons
- Primary: bg ink (#2F2F2F; dark: #FFFCF7), text surface colour, height 32px, padding 0 14px,
  radius 6, Inter 500 13px, optional 16px leading icon with 8px gap. Hover: bg ink at 88%.
- Secondary: transparent, ink text, 1px --line border. Hover: bg --ink-wash.
- Text button: no border/bg; hover: underline offset 3px.
- Rec button: bg --rec, white text (Start recording only).
- EVERY pressable: `:active { transform: scale(0.96) }`, `transition: transform calc(160ms*var(--t))
  var(--ease-out), background-color calc(150ms*var(--t)) ease`. Never `transition: all`.
- Hover styles inside `@media (hover:hover) and (pointer:fine)`.

## Micro-interactions (recreate the behaviour in vanilla JS/CSS; do not copy code from transitions.dev)
1. Copy Button (interior.dev "copy-button"): on click the label+icon cross-fade to "Copied" + check
   (icon swap: scale .25→1, opacity 0→1, blur 4px→0, 300ms --ease-out); button width locked to its
   original width; reverts after 2000ms. No toast for copy.
2. Loading Button ("loading-button"): label swaps to a state ("Saving…", "Connecting…") with a 2px
   blur cross-fade 200ms, no width change; a 12px spinner (stroke, 700ms linear rotation) leads.
3. Hold to Confirm ("hold-to-confirm") for "Delete…" in the ⋯ menu: hold 2000ms; a rec-wash overlay
   wipes left→right via clip-path inset (linear); release early snaps back in 200ms --ease-out;
   complete → row removed and toast "Moved to Trash".
4. Tooltip Group ("tooltip-group") on icon-only buttons and scrub ticks: first tooltip after 400ms,
   125ms fade+scale .97→1 from the trigger side; while one is open, neighbours open instantly with no
   animation; closes 150ms after leave.
5. Tabs underline (above).
6. Toast (transitions.dev "Toast open/close", recreated): enters from bottom-centre: opacity 0,
   translateY(12px), blur 2px, scale .98 → settled in 400ms ease; exits the same way in 200ms.
7. Sheets (modals): enter from opacity 0, translateY(8px), scale .98 → 1 in 220ms --ease-drawer;
   exit 150ms ease-out to opacity 0, translateY(4px). Backdrop fades 200ms. CSS transitions, not
   keyframes (must be interruptible: Escape mid-enter reverses smoothly).
8. Value flash ("value-flash"): a new or changed library row gets an accent-wash background that
   fades out over 1200ms ease-out, once.
9. Skeleton swap (above).
10. Success check (recreated): 16px check drawn with stroke-dashoffset 240ms --ease-out, plus a
    blur 2px→0 and rotate -10°→0.
11. Number pop-in (recreated): when a counter changes, each changed digit enters from translateY(40%)
    + blur 2px + opacity 0 to settled, 200ms --ease-out, 30ms stagger between digits.
12. Pause/Play on the HUD: icon swap per item 1's values.
Reduced motion (`prefers-reduced-motion: reduce`): keep opacity/colour transitions, remove
translate/scale/blur/clip-path wipes (hold-to-confirm then shows a static progress number).

## The "develop the guide" moment (F2, and Remake)
Runs from "Make guide" (F1 → F2), total mock duration 9s at 1×, then lands on F3 automatically.
Never blocks: Cancel works at any point and returns to the empty output state with the toast
"Stopped. Nothing was changed."

Layout in the output area during F2:
- Status line (16px, Inter 500): a shimmering text (a 30% wide lighter gradient band sweeps across the
  text through background-clip:text, 1.6s linear infinite). Stages swap with a 200ms blur
  cross-fade (Loading Button text swap):
  0.0s "Reading transcript · 0 words" (counter counts to 612 by 1.5s using number pop-in in steps
  of ~100) → 1.8s "Finding the clicks · 0" (counts to 14 by 3.0s) → 3.2s "Writing steps · 0 of 4"
  (increments as each step lands) → 9.0s done.
- Under it, a task list (interior "task-steps"): three rows "Transcript", "Clicks", "Steps"; each shows
  a 12px spinner while active, then the success check; done rows go ink-soft.
- Step cards (same layout as the final guide) appear one by one starting at 3.2s, every 1.3s:
  a. The card enters: opacity 0 → 1, translateY(8px) → 0, 260ms --ease-out.
  b. Its screenshot DEVELOPS over 600ms: draw a fake screenshot (see Fake screenshots) on a canvas;
     overlay a Bayer 4×4 ordered-dither mask in the brand dither colours (#1F2421/#2E4A40/#82B09A)
     at 4px cells; animate threshold t 0→1 (ease-out) so cells reveal the screenshot where
     bayer(x,y) < t. End state is the plain sharp screenshot (no dither left).
  c. The title streams in word by word (each word: opacity 0, blur 4px → 0, 40ms stagger, 180ms).
  d. At the same moment a tick drops onto the video scrub bar at that step's timestamp:
     translateY(-4px) + opacity 0 → settled, 160ms --ease-out, then a single value flash on the tick.
- Done: status line becomes success check + "4 STEPS · MADE IN 0:09" (mono), the Guide tab status
  changes to "READY · 4" with number pop-in, then 600ms later the view settles into F3.
- F4 failure variant (Screen select "F4"): run the same sequence but fail at 5.5s: the status line
  turns rec-ink, text "ChatGPT stopped responding. Your recording and the 2 developed steps are safe.",
  one horizontal shake (translateX 0, -4, 4, -2, 0 over 300ms), buttons "Try again" (primary),
  "Change provider" (secondary). Steps already developed stay visible.
- Remake (from A, guide ready): confirm in a small sheet "Remake the guide? Your current guide stays
  until the new one is ready." → run the sequence with old steps visible at 40% opacity underneath;
  at done, old steps fade out 200ms and new ones are at full opacity.

## Fake screenshots
Draw procedurally on canvas, 16:10, light app UI for the fake "Invoices" product: a 18% wide left
sidebar (#F4F2EE) with 5 nav lines, a top bar, and a table/form in the body with grey text bars and
one highlighted element where the click happened (the click ring sits on it). Seed per step so each
looks different (different highlighted row/field, a modal on step 4). These replace dither on
screenshot thumbnails everywhere EXCEPT during develop and inside the review strip in F1 (where
they're small real thumbnails too). Videos stay dither-cloud placeholders with a caption.

## Other screens (apply the same system; keep their content and flows from the 12 Oct spec)
- F1 review sheet: rows separated by hairlines, frame strip shows 6 fake-screenshot thumbnails
  (62×39, radius 4, outline-img) + "+8". Transcript toggle is a proper switch (32×18, thumb slides
  160ms --ease-out, accent when on).
- G1 setup sheet: Source row shows two 120×75 fake display thumbnails (selectable, 2px accent ring
  when selected) instead of a select; mic/camera rows are selects; system audio a switch.
- G2 HUD: icons swapped to Tabler (record dot stays a span), tabular timer (font-variant-numeric:
  tabular-nums). Stop → HUD label becomes Loading Button "Saving…" 1.2s → window returns (app
  opacity/blur back in 260ms) → new row slides into the top of the sidebar list (height 0 → auto via
  grid-template-rows 0fr → 1fr, 240ms --ease-out) with a value flash.
- H import: drop zone keeps a dashed border; progress bar uses the dither progress; complete → new row
  with value flash.
- I editor: keep the layout; apply icons, buttons, press scale and the sheet transition. No new motion
  on the timeline. Assistant "Apply" uses the Loading Button ("Applying…" 600ms), then the card becomes
  "Applied · Undo" with the success check.
- J settings: sub-nav active item shows a 2px accent left bar (no fill). Connection rows are rows with
  hairlines: provider name, mono status ("CONNECTED · EXPIRES 3 NOV"), one action. "Sign in again" /
  "Save" use Loading Button then success check.
- Export PDF (new, from the guide toolbar): sheet 520px with a left 180×254 first-page preview (white
  page, --display title, 2 fake step rows) and right column: "Include: Screenshots ✓ Narration ✓
  Timestamps ✓" switches, destination row; "Export PDF" → progress bar (indeterminate stripes 1s then
  determinate 0→100% over 1.5s) → success check + "Saved to Downloads · Show in Finder".

## Copy rules
UK English. Sentence case for buttons. Mono uppercase only for labels/captions/decks. No em dashes in
UI copy (use · or a full stop).

## Acceptance checks (run them; report pass/fail for each)
Use Playwright from /Users/mohamedb/dev/projects/showhow (`node` script importing
`./node_modules/playwright/index.mjs`, `chromium.launch({ channel: "chrome" })`), viewport 1440x900.
1. No console errors on load and on every Screen-select entry.
2. All click-paths from the 12 Oct spec still pass.
3. C → Make guide → F1 → Make guide: F2 runs, 4 steps develop, lands on F3 within 11s.
4. During F2 at ~4.0s, a screenshot canvas is mid-develop (capture `F2-mid.png`).
5. Copy brief + path: label becomes "Copied" and reverts after ~2s; button width unchanged (measure).
6. Hold-to-confirm: a 600ms hold does not delete; a 2.1s hold deletes the row.
7. Display toggle swaps the title font (check computed font-family of the masthead title).
8. Motion 0.1× makes the sheet transition take ≥2s (measure).
9. With `reducedMotion: 'reduce'` emulated, F2 still completes and no transform animations run on sheets.
10. No horizontal scroll inside the 1280×800 window on any screen.
Screenshots (full page, 1440x900) to MOCK/shots/: A.png A-sans.png A-dark.png B.png C.png D.png E.png
F1.png F2-mid.png F3.png F4.png G1.png G2.png G3.png H3.png I.png J-ai.png pdf.png remake-mid.png.

## Out of scope
Real video, real recording, persistence, frameworks, repo tests. Do not create or edit any file
outside MOCK/. Do not commit. Do not modify the 12 Oct mock.

## Report
Acceptance results, any deviation from this spec and why, icon fetch results (which names worked),
and the screenshot list.
