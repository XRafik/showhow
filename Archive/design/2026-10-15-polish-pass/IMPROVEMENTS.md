# Showhow polish pass: what to change and why

Date: 2026-10-15. Status: proposal for the next mock revision. Nothing here is built.

Input: owner feedback on the 12 Oct flow mock: "the design and colour scheme is solid, but the library
feels generic. Add subtle things to make it feel premium and editorial, plus small micro-interactions.
It's a work app, so it must feel robust and nothing should take long, but allow small bits of fun,
for example while the AI generates guides and snapshots."

Evidence used:

- 12 Oct mock: `../2026-10-12-full-experience-flow/` (index.html, SPEC.md, four screenshots).
- Current app (old style): `artifacts/23/after.png` (Jul) and `artifacts/92/after.png` (Sep). No
  fresh native run was made for this pass.
- References: minimal.gallery sites in the same register (Factory, Making Software, Antimetal, Pull
  Systems, Letta, Parallel, Normal), captured in `refs/`. Cosmos searches ("editorial app
  interface", "minimal desktop app ui monospace") were mostly mobile and consumer UI, and too small
  to judge at thumbnail size. They are not used as evidence.
- Libraries: Its Hover (`itshover.com`), interior.dev, transitions.dev (details in section 4).

## 1. Why the library reads as generic: adversarial comparison

The colour scheme holds up against the references. The structure and type are what make it generic.

| # | Where the mock loses | What the references do | Change |
|---|---|---|---|
| 1 | **All-sans type.** Inter body plus Inter Tight titles is the default SaaS pairing. Instrument Serif is loaded in the mock but used nowhere. | Antimetal, Pull Systems and Making Software pair one *character* face (a serif or pixel display) with mono labels. The mono labels in the mock are already right. | Use a serif display (Instrument Serif) for the recording title, the empty-state line and guide step titles only. Keep Inter for UI and JetBrains Mono for labels. Three faces, each with one job. |
| 2 | **Everything is a box.** Cards, buttons, search, video, output switcher and steps all have a 1px border and 8px radius. 12 rules use `border-radius:8px`. | Hairline rules, whitespace and the column grid carry the structure; boxes are rare. Making Software labels figures `FIG.001` and uses `[ bracket ]` captions. | Remove the borders on the output cards and steps. Separate with full-width hairline rules and generous space. Keep borders only for input fields and focus or selected states. |
| 3 | **Dead right half.** The video sits at 560px in a 950px column, leaving a large empty block beside it. | Deliberate grids with a margin column for notes (Making Software's figure annotations, Normal's stat row). | Use a 12-column grid with a 2-column margin on the left of the content. Step numbers, timestamps and "FIG" captions sit in the margin; the video spans the full content width. |
| 4 | **The dither is wallpaper.** It fills placeholders and the sidebar floor but means nothing. | Making Software's illustration style *explains* things. | Make dither mean "not developed yet". Frames that are still processing show as dither and sharpen into the real screenshot when ready. Finished evidence is always sharp. |
| 5 | **Generic buttons.** Bordered rectangles in sentence case, with text glyphs (●, ⤓, ⚙) as icons. | Factory and Parallel: small solid-ink primary buttons with mono uppercase labels and an arrow, and a quiet secondary. | Primary: ink fill, 32px, Inter 500 13px, Its Hover icon. Secondary: text only, with an underline on hover. Mono uppercase is kept for labels, not buttons, so buttons stay readable. |
| 6 | **Busy sidebar rows.** Up to three chips per row (GUIDE ✓, IMPORTED, NO CLICKS). | Factory's session list: one status dot, the title and a right-aligned time ("Now"). | Row = title + right-aligned tabular time. Second line in mono: duration plus at most one state word. Guide and brief state shows as two small dots (filled = made). Failures get the rec colour dot only. |
| 7 | **No depth.** Surfaces are flat; only the modals have shadows (24px/80px, heavy). | Antimetal and Letta: very soft elevation, image outlines. | Layered shadows: `0 1px 2px #2F2F2F0F, 0 8px 24px #2F2F2F14` on the video and sheets. A 1px `#0000001A` outline on screenshots (`#FFFFFF1A` in dark mode). |
| 8 | **No interaction states.** No `:active`, almost no hover; keyframes on the toast and sheet. | n/a (live sites) | See section 3. |
| 9 | **Weak masthead.** The title, mono meta line and two buttons look like any dashboard. | Pull Systems and Antimetal: a large display line with a quiet deck underneath. | Serif title at 40px, then one mono deck line, then a hairline rule. Actions move into the rule row on the right. |

## 2. Screen-by-screen changes

**Library (home)**
- Masthead as in item 9. The video is a figure with a caption row: `FIG. 00 · ORIGINAL RECORDING · 2:14`.
- Step markers on the scrub bar: one tick per guide step at its timestamp. Hovering a tick previews the step title; clicking it seeks there.
- Output switcher becomes two text tabs, "Guide" and "Agent brief", with one sliding underline (interior `tabs`). This replaces the two boxed cards. Status sits beside each tab label in mono: `READY · 6`, `NOT MADE`.
- The sidebar is described in item 6. The library count uses tabular numbers, and new rows flash once (interior `value-flash`).

**Guide view (reads like a manual)**
- Each step: a large mono number in the margin, a serif title, the screenshot as a figure with caption `FIG. 03 · 0:41 · CLICK`, and the narration as an indented pull quote with a hairline on its left.
- The click marker on the screenshot is a 24px accent ring with a 1px ink outline, so it shows up on any background.
- Hovering a step shows "Edit" and "Play from 0:41" in the margin, with no layout shift (opacity only).

**Agent brief**
- Make it look like a document: monospace evidence block (`0:31  Publish clicked · status unchanged`), with sections separated by rules rather than boxes.
- "Copy brief + path" is the single primary action and uses interior `copy-button` (morphs to a tick, width locked, reverts after 2s). "Copy path only" is a text button.
- The MCP "coming later" row stays muted at the bottom.

**Generation (the fun budget; see section 5)**
- Review sheet: a frame strip with real thumbnails, a transcript word count, and the provider row. Keep the content; restyle it to section 1.
- Generating, failed and done are described in section 5.

**Empty state**
- A serif line: *Show it once.* Underneath, one mono deck line and the two primary actions. A slow (8s) dither field drifts behind it. The empty state is seen rarely, so delight is allowed.

**Loading**
- Skeleton rows that cross-fade into content with zero layout shift (interior `skeleton-swap`). Remove the 1.2s shimmer.

**Recording setup sheet and HUD**
- Sheet: grouped rows with hairlines, source thumbnails (live window previews) instead of select text. "Start recording" is in the rec colour.
- HUD: keep the 1.4s pulse. Add a tabular timer and Its Hover-style icon swaps for pause/play (scale 0.25→1, blur 4px→0, 300ms spring, bounce 0).
- Stop: the HUD's label morphs to "Saving…" (interior `loading-button`), and the window returns with the new row sliding into the top of the list.

**Editor (inherited, rebranded)**
- The editor keeps its dark tokens. Replace lucide and react-icons with one set (section 4). Apply the press scale and hover rules. Leave the timeline untouched: no decorative motion on functional data.

**AI connections and settings**
- Connection rows: a provider mark, mono status (`CONNECTED · EXPIRES 3 NOV`), and one action. Connecting uses `loading-button`; success uses the transitions.dev success check.

**PDF export**
- A sheet with a live first-page preview using the serif masthead, so the PDF matches the app's look. Progress bar runs indeterminate then determinate (interior `progress-bar`), then a success check and "Show in Finder".

## 3. Micro-interaction rules (apply everywhere)

| Before | After | Why |
|---|---|---|
| No `:active` on any button | `transform: scale(0.96)`, `transition: transform 160ms cubic-bezier(0.23,1,0.32,1)` | Feedback that the press landed (better-ui #9) |
| Sheet `@keyframes sheet-in 180ms` | Transition from `opacity:0; translateY(8px); scale(.98)` → settled, 220ms `cubic-bezier(0.32,0.72,0,1)`; exit 150ms ease-out | Keyframes can't be interrupted; exits should be softer |
| Toast `@keyframes toast-in` | transitions.dev "Toast open/close" (rise, fade, 2px blur), 400ms ease; exit the same edge | Spatial consistency |
| Text glyph icons | One icon set at 1.5px stroke beside 400 text, `currentColor` | better-ui #13–14 |
| Copy shows a separate toast | Button morphs to a tick in place (interior `copy-button`), no toast | Feedback where the eye already is |
| Delete is a menu item | interior `hold-to-confirm` (2s linear fill, 200ms snap back) | Prevents slips without a dialog |
| Tooltips (none) | interior `tooltip-group`: 400ms delay once, then instant | Fast toolbars |
| Hover rules ungated | Wrap in `@media (hover:hover) and (pointer:fine)` | No sticky hovers |
| — | `prefers-reduced-motion`: keep opacity and colour, drop translate, scale and blur | Gentler, not zero |

Durations: UI ≤ 250ms. Nothing animates on keyboard actions, list navigation, search keystrokes or scrubbing.

## 4. Which library does what

The three libraries overlap, so each gets one job.

| Library | Use for | Notes |
|---|---|---|
| **Its Hover** (Apache-2.0, 263 icons, `motion/react`, shadcn registry) | Icons inside buttons; they animate on button hover, not icon hover | Has copy, download, upload, trash, refresh, gear, magnifier, sparkles, eye, terminal, chevrons, check, dots. **Missing:** mic, record, stop, pause, display or monitor, folder, scissors, PDF. Its paths are Tabler-style, so fill the gaps with static `@tabler/icons-react` (MIT) at the same 1.5px stroke. Remove lucide and the five react-icons sets. |
| **interior.dev** (MIT, 54 components, Motion + Tailwind, shadcn CLI) | All component micro-interactions: copy-button, loading-button, hold-to-confirm, tabs, segmented-control, tooltip-group, popover, dropdown, modal, skeleton-swap, progress-bar, task-steps, streaming-text, value-flash, filter-grid, reorder-list, lightbox | Matches the stack (`motion` ^12 and Tailwind 3 are already in `package.json`). Its `press-depth` replaces the bare scale rule where used. |
| **transitions.dev** (CSS/React; licence not stated on the site; several items are Pro) | Only what interior.dev doesn't cover: toast, number pop-in, success check, thinking states (shimmer status), matrix dot loader, text states swap | **Check the licence before copying any code.** Use only free items; no Pro items (confetti, organic shimmer, image-generation placeholder) unless you choose to pay. |

## 5. The AI generation moment ("develop the guide")

Purpose: make a 10–40s wait legible and a little fun without adding a single millisecond. Frequency:
a few times a day, so it qualifies for the delight budget. Motion runs only while real work is
running and stops the moment the result exists.

1. **Status line:** a single line uses transitions.dev "thinking states" shimmer, and each stage swaps with "text states swap": `Reading transcript · 612 words` → `Finding the clicks · 14` → `Writing 6 steps`. Counters use "number pop-in". Under it sits interior `task-steps`, showing done stages with ticks.
2. **Darkroom frames:** each step card appears as its frame is chosen. The frame starts as the brand's Bayer dither and sharpens to the real screenshot over 600ms (the dither threshold animates; WebGL is already in the mock). It's the single brand-specific moment and it means something: dither = developing.
3. **Ticks drop onto the scrub bar:** each step's tick lands on the video timeline as its step is written (160ms, ease-out, 4px drop), linking steps to the video.
4. **Titles stream in:** step titles arrive with interior `streaming-text` (soft blur-in per word, no caret).
5. **Done:** the status line becomes a success check plus `6 STEPS · 0:38`. No confetti; it's a work app.
6. **Failure:** status line turns to the rec colour with "error state shake" (one 300ms shake) and keeps the frames already developed.

Same language, smaller: PDF export progress, and "Remake" (old steps stay sharp; new ones develop over them).

## 6. Rejected (deliberately no motion)

- Sidebar selection and list navigation: tens to hundreds of times a day. Instant.
- Scrubbing, video playback, the editor timeline: functional data you are reading.
- Search typing and filtering: instant results, no filter-grid shuffle in the sidebar.
- Theme toggle, keyboard shortcuts, the command palette: keyboard-initiated. Never animate.
- Mouse-tracking 3D tilt on thumbnails: decoration on work content.

## 7. Owner decisions (2026-10-15)

1. Serif display: yes. Instrument Serif is the default in the mock, with a toggle to compare against Inter Tight.
2. Generation concept: "develop the guide" (section 5).
3. transitions.dev: use the free items as reference only and recreate the effects in our own code. No Pro purchase, no copied code.
