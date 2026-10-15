# Spec: Showhow full-experience flow mock (throwaway, one HTML file)

## Purpose
A clickable throwaway mock so the owner can react to the whole app's information architecture
before it goes into the Pen design. Fake data only. No backend, no persistence, no framework build.
It tests FLOW and LAYOUT, not final visual polish.

## Output
- Single file: `index.html` in this directory. All CSS/JS inline.
- Allowed external: Google Fonts (Inter, Inter Tight, JetBrains Mono, Instrument Serif). Nothing else.
- Reuse the WebGL Bayer dither function from `MOCK/dither-reference.html` (copy the shader +
  `dither()` helper) for video placeholders, thumbnails, the sidebar floor and progress bars.
  If WebGL fails, fall back to a CSS checker pattern in the same colours.
- Desktop app frame: render the app inside a 1280x800 "window" centred on a #1C1C1C page, with a
  28px fake macOS title bar (three 12px dots #FF5F57 #FEBC2E #28C840, title "Showhow" centred,
  11px JetBrains Mono #FFFCF78C). Window radius 10px, overflow hidden.
- A fixed mock toolbar ABOVE the window (outside it), 40px: left "Showhow flow mock · fake data",
  right a "Screen:" select listing every screen/state below for direct jumping, plus a Light/Dark
  appearance toggle. 12px JetBrains Mono, #FFFCF7AA on #1C1C1C.

## Tokens (use as CSS custom properties; Dark theme values after the slash)
surface #FFFCF7 / #2F2F2F · surface-raised #F9F5EC / #363636 · surface-sunken #F7F2E8 / #292929
ink #2F2F2F / #FFFCF7 · ink-soft #2F2F2FB3 / #FFFCF7B3 · muted #2F2F2F8C / #FFFCF78C
ink-faint #2F2F2F66 / #FFFCF766 · line #2F2F2F24 / #FFFCF724 · ink-wash #2F2F2F14 / #FFFCF714
chip #E8E4DC / #3A3A3A
accent #82B09A · accent-strong #33564A / #A9CDBB · accent-100 #E7F1EC / #33564A · accent-wash #82B09A26
on-accent #2F2F2F
panel #2F2F2F / #242424 · panel-deep #242424 / #1C1C1C · on-panel #FFFCF7 · on-panel-muted #FFFCF78C
on-panel-faint #FFFCF766 · on-panel-line #FFFCF71F · on-panel-hover #FFFCF70F
rec #E3582D · rec-wash #E3582D1F · rec-ink #B3431F / #F28B6B
hud-bg #07080AE6 · hud-border #FFFFFF1A · hud-green #4ADE80
editor-bg #09090B · editor-panel #141416 · editor-line #FFFFFF14 · editor-accent #34B27B
radius 8px · base spacing 16px · body Inter 14px/1.5 · labels JetBrains Mono 11px uppercase,
letter-spacing 0.06em · display Inter Tight 600 (screen titles 28px, section 18px).

Dither colours: video/thumbnail A=#242424 B=#3F6A5A C=#82B09A; sidebar floor A=#2F2F2F B=#3A3A3A
C=#82B09A at 35% alpha; progress A=#E7F1EC B=#82B09A C=#33564A.

Motion: all panel/sheet transitions 180ms cubic-bezier(0.2,0,0,1); sheets slide up 12px + fade;
toasts fade+rise 8px, auto-dismiss 2400ms. Respect prefers-reduced-motion (no movement, fade only).

## Fake data (library, newest first)
1. "Invoice total rounds wrong" · Recorded · 2:14 · today 14:02 · clicks captured · Guide: ready (6 steps) · Brief: not made
2. "Publish button does nothing" · Recorded · 0:48 · today 11:20 · clicks captured · Guide: not made · Brief: ready
3. "Set up a new client in Studio" · Imported MP4 · 4:31 · yesterday · NO clicks (imported) · Guide: ready (9 steps) · Brief: not made
4. "Export monthly report" · Recorded · 1:37 · 8 Oct · clicks captured · Guide: failed (last attempt) · Brief: not made
5. "Onboard a new teammate to Linear" · Recorded · 6:02 · 3 Oct · clicks captured · neither made
Guide steps for #1 (title / quote / timestamp): Click "Invoices" in the sidebar / "first I go to invoices" / 0:04 ·
Open invoice INV-2041 / "this one is for Acme" / 0:19 · Add a line item of £33.335 / "now watch the total" / 0:41 ·
Check the total field / "it shows £33.34 but should be £33.33" / 1:02 · Save the invoice / — / 1:30 ·
Reopen and compare / "and it's still wrong" / 1:58.
Brief for #2: Requested change: "Make Publish complete and show the new post status." Observed: "Clicking
Publish does nothing; status stays Draft; no network request after 0:31." Expected: "Post is published
and status shows Published." Evidence: 0:12 Draft selected · 0:31 Publish clicked, status unchanged ·
0:40 no error shown. Bundle path: ~/Movies/Showhow/2026-10-12 Publish button does nothing.showhow/

## Layout: Library (home) — the window's default screen
- Left sidebar 248px, bg panel. Top: logo row (24px mark = 20px rounded square accent with a
  white triangle play glyph, then "Showhow" Inter Tight 600 15px on-panel). Then two buttons stacked,
  full width, 34px: "● New recording" (bg accent, ink on-accent; dot rec colour) and "⤓ Import video"
  (transparent, 1px on-panel-line border, on-panel). Then label "LIBRARY · 5" on-panel-faint.
  Then rows: title 13px on-panel (1 line, ellipsis), meta line 11px JetBrains Mono on-panel-muted
  ("2:14 · TODAY 14:02"), then up to two tiny chips (10px mono, 2px 6px padding, radius 4):
  "GUIDE ✓" accent-wash/accent, "BRIEF ✓", "IMPORTED", "NO CLICKS", "FAILED" (rec-wash/rec-ink).
  Selected row: bg on-panel-hover + 2px left bar accent. Search field above the list: 30px,
  placeholder "Search recordings", on-panel-line border.
  Bottom: dither floor 160px tall (fades from transparent at top), and a "⚙ Settings" row at the very bottom.
- Main panel: bg surface, padding 32px 40px, scrolls vertically.
  Header: title (28px display, ink), meta line mono muted ("RECORDED · 2:14 · TODAY 14:02 · CLICKS CAPTURED"),
  right-aligned actions: "Edit video" (secondary button: 1px line border, ink) and "⋯" menu
  (Rename, Show in Finder, Delete…).
  Video: 16:9 dither placeholder, radius 8, with a transport strip below it (play ▶, 0:00 / 2:14, scrub bar).
  Below the video: OUTPUT SWITCHER — two side-by-side cards (each 50%, gap 12, padding 16, radius 8,
  1px line border, bg surface-raised): "Guide for people" and "Brief for an agent". Each card shows
  label (mono), one-line description, and a status: "Ready · 6 steps" (accent-strong) / "Not made" (muted) /
  "Last attempt failed" (rec-ink). Clicking a card selects it (2px accent border) and shows that output
  below. If not made: big empty state inside the output area with button "Make guide" / "Make brief"
  (primary: bg accent, ink on-accent, 36px) and a one-line note "Uses the original recording. Your
  transcript and selected frames are sent to ChatGPT when you continue."
- Guide output: toolbar row (left "6 STEPS · FROM ORIGINAL RECORDING" mono muted; right buttons
  "Remake", "Export PDF"). Steps list: each step = number (mono 13px muted), 200x112 dither screenshot
  thumbnail with a 24px accent ring marking the click point (omit ring when NO CLICKS), title 15px ink,
  quote 13px italic ink-soft in quotes, timestamp chip mono. Hover a step shows "Edit" and "Jump to 0:41".
- Brief output: sections "Requested change", "Observed behaviour", "Expected result" (section label
  18px display; body 14px), "Supporting evidence" in a surface-sunken box with mono timestamps, then
  action row: "Copy brief + path" (primary) and "Copy path only" (secondary). Then a muted row:
  "Agents can read this directly via MCP — coming later" with a "Learn more" link (does nothing).
  Copy shows toast "Brief and bundle path copied" bottom-centre.

## Screens / states (all reachable by clicking AND via the Screen select)
A. Library — recording #1 selected, Guide card selected, guide ready.
B. Library — recording #2, Brief selected, brief ready (copy works → toast).
C. Library — recording #5, nothing made (empty output state).
D. Library — empty library (no recordings): sidebar list replaced by muted "No recordings yet"; main
   panel centred: 48px dither square, title "Show it once.", body "Record your screen or import an MP4.
   Turn it into a guide for people or a brief for your agent.", two buttons New recording / Import video.
E. Library — loading (skeleton rows in sidebar, skeleton title/video in main; shimmer 1.2s linear infinite).
F. Generation flow (from "Make guide" on C):
   F1 Review evidence sheet (centred modal 560px): title "Check what gets sent", list "Transcript ·
      612 words" (toggle on), "Frames · 14 selected" (thumbnail strip of 6 tiny dither tiles + "+8"),
      "Provider: ChatGPT (signed in)" with "Change". Buttons "Cancel" / "Make guide".
   F2 Generating: output area shows dither progress bar (full width, 6px) + steps
      "Preparing transcript ✓", "Choosing frames ✓", "Writing steps…" (spinner) + "Cancel" link.
      Auto-advance after 2.5s to F3.
   F3 Ready (same as A layout, for recording #5 with 4 steps of fake content).
   F4 Failed: banner in output area, rec-wash bg: "Couldn't make the guide. ChatGPT didn't respond.
      Your recording is safe." Buttons "Try again" / "Change provider". (Reached via Screen select, and
      via recording #4 which shows this state.)
G. Recording flow (from "New recording"):
   G1 Setup sheet over the library (modal 440px, slides up): title "New recording"; rows with select-
      style controls: "Source  ▣ Display 1 — 3024×1964 ▾", "Microphone  ● MacBook Pro Microphone ▾",
      "Camera  ○ Off ▾", "System audio  toggle off". Footer: "Cancel" / "Start recording" (bg rec, white).
   G2 Recording: the whole app window dims to 15% opacity and blurs 6px (it is "hidden"); a floating
      HUD bar appears near the bottom-centre of the window: 280x44, bg hud-bg, 1px hud-border, radius 22:
      pulsing rec dot (rec, 1.4s ease-in-out opacity 1→0.35), timer counting up from 00:00 (real seconds),
      Pause (⏸ toggles to ▶ and timer pauses), Stop (■), and a "⋯" with "Restart" / "Cancel recording".
   G3 Stop → saving state on the HUD for 1.2s ("Saving…") → window returns; library has a NEW top row
      "Untitled recording · 0:xx" selected, chip "NEW", main panel shows title in edit mode with
      caret, and output cards both "Not made".
H. Import flow (from "Import video"): H1 sheet with drop zone (dashed 1px ink-faint, radius 8, 160px,
   "Drop an MP4 here or Choose file", note "Showhow keeps a copy. Your original file isn't changed.");
   clicking Choose file → H2 progress in the sheet ("Copying 'client-setup.mp4' · 38% · 412 MB") with
   dither progress bar and Cancel, auto-complete after 2s → H3 new library row with chips IMPORTED + NO CLICKS,
   and a dismissible info line in main: "No click data in imported videos — guides use narration and frames."
I. Editor (from "Edit video") — FULL REDESIGN in Showhow style, dark only (editor-bg):
   - Top bar 44px: "← Library" (ghost), project title centred (Inter 13px #FFFCF7), right: undo/redo
     icons, "Saved" mono 11px muted, "Export" button (bg accent, ink #2F2F2F).
   - Body three columns: LEFT Assistant panel 300px (editor-panel bg, 1px editor-line right border);
     CENTRE preview (16:9 dither, centred, max 640px wide) with transport row; RIGHT inspector 280px.
   - Assistant panel: header "ASSISTANT" mono + model chip "ChatGPT · GPT-5". Chat: user bubble
     "Cut the ums and add a zoom when I click Invoices"; assistant reply: "I found 7 filler words and
     1 click to zoom on." followed by a PROPOSED CHANGE card (1px editor-accent border, radius 8):
     "− 7 filler words (4.2s)", "+ Zoom 1.8× at 0:04–0:09", buttons "Preview" / "Apply" (bg editor-accent,
     ink #09090B) / "Discard". Apply → card becomes "Applied · Undo" and timeline updates (zoom pill
     appears, transcript words struck through). Input at bottom: "Ask for an edit…" + send.
   - Inspector: tabs "Clip", "Zoom", "Cursor", "Background", "Captions" (mono 11px). Show Zoom tab:
     depth segmented 1.25× 1.5× 1.8× 2.5×, "Follow cursor" toggle, ease select "Smooth".
   - Timeline bottom 200px full width: ruler (mono 10px), lanes labelled left 72px: "VIDEO" (one long
     clip bar #3F6A5A with a split at 1:30), "ZOOM" (pills editor-accent 40% fill), "CAMERA" (empty
     dashed lane "+ Camera"), "AUDIO", "TRANSCRIPT" (word chips, filler words in muted italic). Playhead
     2px #FFFCF7 with a 10px triangle head. Toolbar above lanes: Split, Delete, Speed, "Trim silences",
     zoom-out/in slider.
   - Export sheet (from Export): modal 480px: format segmented "MP4" "GIF", quality "1080p" select,
     destination "~/Movies/Showhow/Exports" "Change"; Export → progress state with dither bar and
     "Cancel"; Cancel → "Export cancelled. Nothing was saved." ; otherwise completes after 2.5s →
     "Exported · Show in Finder". Note in the sheet: "Guides and briefs always use the original
     recording, not this edit."
   - Editor no-clicks variant (via Screen select, imported recording #3): Zoom tab shows "Auto-zoom on
     clicks needs click data. Imported videos don't have it. Add zooms by hand." and the assistant
     reply omits the zoom.
J. Settings (from "⚙ Settings") — replaces main panel, sidebar stays. Left sub-nav 180px inside main:
   "AI connections", "Recording", "Transcription", "Agents", "Appearance".
   - AI connections: two rows (cards): "ChatGPT plan — Signed in as mo•••@•••.com · Sign out" (status
     dot accent) and "OpenRouter — Not connected · Add API key" (opens inline input with "Save").
     Note: "Recording, importing and editing work without AI. Selected evidence is sent only when you
     make a guide, brief or AI edit."
     States via Screen select: ChatGPT "Session expired — Sign in again" (rec-ink), OpenRouter "Key
     rejected — check the key".
   - Recording: "Recordings folder ~/Movies/Showhow  Change…" + note "Existing recordings stay where they
     are and remain in your library."; "Countdown 3s" select; "Hide desktop icons" toggle.
   - Transcription: "Model: Whisper base (on this Mac) · 142 MB · Downloaded"; "Names and terms" textarea
     with fake terms "Acme, INV-2041, Linear, Showhow" and help "Helps transcripts spell your product
     and client names."
   - Agents: "Copy format: Brief + bundle path ▾"; disabled row "MCP server — let agents read your
     library directly. Coming later." with a disabled toggle.
   - Appearance: Light / Dark / System segmented (drives the same theme as the toolbar toggle).

## Accessibility and behaviour minimums
- All interactive elements are real <button>/<input>/<select>; visible focus ring 2px accent offset 2px.
- Escape closes sheets/menus and returns focus to the trigger.
- No horizontal scroll inside the window at 1280x800; main panels scroll vertically.

## Acceptance checks (run them; report pass/fail for each)
1. Open the file in a browser (use the project's Playwright: `npx playwright` from
   /Users/mohamedb/dev/projects/showhow, or playwright-cli) at viewport 1440x900 with no console errors.
2. Every Screen-select entry renders without layout breakage.
3. Click-path: C → Make guide → F1 → Make guide → F2 → F3 completes on its own.
4. Click-path: New recording → Start → wait 3s → timer shows 00:03 → Stop → new row "Untitled recording" selected.
5. Click-path: Import → Choose file → completes → row with IMPORTED + NO CLICKS.
6. Click-path: Edit video → Apply proposed change → zoom pill appears on ZOOM lane → Export → completes.
7. Dark appearance toggle changes library + settings colours.
8. Save screenshots (1440x900, full window) to MOCK/shots/: A.png B.png C.png D.png F1.png F2.png F4.png
   G1.png G2.png G3.png H2.png H3.png I.png I-export.png I-noclicks.png J-ai.png J-recording.png
   J-transcription.png A-dark.png.

## Out of scope
Real video, real recording, persistence, routing libraries, frameworks, tests in the repo.
Do not create or edit any file outside MOCK/. Do not commit. Do not touch the showhow repo.

## Report
When done, print a short report: acceptance check results, any deviation from this spec and why,
and the list of screenshot paths.
