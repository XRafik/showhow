# Brief: final Showhow frames in the Pen file

Task: build the owner-locked mock as final frames in
`/Users/mohamedb/dev/projects/showhow/design/showhow.pen` through the Pen MCP. Read the pen-dev skill,
`execute.md` and `pen-schema.md` first.

## Sources (in priority order)
1. Locked mock: `design/mocks/2026-10-15-house-style/index.html` (Screen select reaches every state),
   `SPEC.md` and `shots/` beside it.
2. Owner frames 23–46 in the Pen file, plus its components and `ds-*` variables. Copy and adjust
   these; don't rebuild from scratch.
3. Dither: the existing shader fills. Use `mosaic.glsl` for posters, developing thumbnails and hero
   tiles (copy its uniforms from node MZ2pl), and `dither.glsl` mode 1 for progress edges. The rules
   in frame g6DjDU apply, except: no sidebar floor (a processing row gets a thin mosaic strip
   instead), and settings copy never says "no key is needed".

## Non-negotiables
- Inter Tight display, Inter body. JetBrains Mono for labels and every button label (uppercase, 11px).
- Selected library row: filled card #FFFCF71A, radius 6, no left bar.
- Orange #E3582D: playhead, CUT, click rings, WHERE IT GOES WRONG, STOP, record dot, failures.
- Offset shadow 4px 4px 0 #82B09A, only on: logo, HUD, selected source card, countdown tile, sheets,
  toasts.
- Guide steps: compact list as in frame 26. Developed thumbnails show the fake "Ledgerly" screenshots.
- No browser companion. MCP appears only as a disabled "coming later" row in Settings → Agents.

## Frames
Name each `Final · <Area> — <state>`, 1200 wide, Light theme only. Place them below all existing
content (FindEmptySpace, direction bottom), one row per area.
- Library: launch · empty · loading · couldn't load · just saved · guide ready · agent brief · review
  before AI · making the guide (step 1 developed, step 2 half mosaic, sidebar strip visible) · guide
  failed · remake confirm · export PDF · editing title · editing a step + sensitive text · no clicks
  captured · narration-only guide · import video · importing
- HUD: source selector · countdown · idle · recording · saving · notes window
- Editor: background · assistant proposal · assistant applied · export panel · export rendering ·
  no project open · unsaved changes · keyboard shortcuts
- Settings: AI connections · AI connection expired · recording · transcription · agents

## Rules
- Add only. Never edit, move or delete existing frames or components.
- Set `placeholder: true` while building a frame; clear it when that frame is done. Finish one area
  row before starting the next.
- Check each frame as you go: nothing collapsed or clipped, text visible, contrast OK.
- Show motion as its frozen meaningful state. Add nothing beyond the mock.

## Done
Export every Final frame as PNG (scale 1) to `design/mocks/2026-10-15-house-style/pen-final/`. Write
`pen-final/REPORT.md` with one line per frame: name → node id → source frame + mock screen →
deviations. Reply in your pane with the report path only, and remind the owner to press Cmd+S in
pen.dev.
