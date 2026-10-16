# Project handoff

Updated: 2026-10-16

## In flight

Nothing is in flight. The design phase is merged (#109). The app size ticket (#110, PR #113) and the Copilot controller retirement (#108, PR #112) shipped on 2026-10-16.

- App size: installed 867 MB → 321 MB, DMG 337 MB → 167 MB (macOS arm64). `npm run check:package` audits a packaged app (only `ws` in `node_modules`, 14 Chromium locales, each wallpaper once, ≤ 330 MB). The owner installed the new build and confirmed that recording, transcription and export work. Windows and Linux are untested.

- V1 brief and ship list: `~/Brain/projects/showhow/brief.md` and `ship list.md` (owner's vault). It ships six features: recording, the one-button AI guide, the editor with the v2 AI assistant, the library with MP4 import, Copy for agent, and PDF export.
- Locked mock: `design/mocks/2026-10-15-house-style/` (`index.html`, `SPEC.md`).
- Final designs: 50 `Final · <Area> — <state>` frames in `design/showhow.pen`, built from 25 new components. PNGs, `REPORT.md` and verification files are in `design/mocks/2026-10-15-house-style/pen-final/`.
- Design audit: `design/mocks/2026-10-15-house-style/DESIGN-AUDIT.md`. Its findings are drawn, and the owner's resolutions are in `.agents/decisions.md` (2026-10-15).
- Superseded mocks and the closed Design Max handoff are in `Archive/design/`.

## Next action

Shape the move onto upstream OpenScreen v2 (step 4 of the brief's order of work) with the `shape` skill. Plan scope:

- An `UPSTREAM.md` policy change (it currently forbids full source-branch merges).
- A migration plan that keeps bundles, `.showhow`/`.openscreen` files and `<video path>.cursor.json` working.
- What is dropped: the browser companion, and the three held macOS recorder fixes that v2 already has.
- A refresh of `docs/research/2026-10-12-openscreen-v2-assessment.md` against current upstream.
- First decision: stay on Electron (floor about 320 MB installed) or move to a WebKit-based shell such as Tauri (about 20–80 MB). Spike WebCodecs support in WebKit (the editor and exporter use VideoEncoder/VideoDecoder, mediabunny and web-demuxer) and the cost of porting the 7,000-line main process.

## Open decisions

- Cursor packs: remove the 17 bundled third-party packs or clear their terms. This blocks release, and the v2 move may settle it because v2 removed them.
- Per-feature goals and milestone metrics (audit questions B1 and J2). Weekly use is the only metric for now.

## Loop operations notes

- In role panes, answer Codex hooks prompts with "Continue without trusting". "Trust all" writes hook trust into the role profile and breaks later launches (profile backup from 2026-10-16: `~/.local/share/bedar-loop/profile-fix-20261016/`).
- A ticket lead cannot prompt the coordinator across Herdr workspaces. It writes `STOP.md` in `~/dev/loop-evidence/<repo>-<n>/`, so the coordinator or a supervisor must poll it.

## Rejected paths

- Design Max layout directions (Document Desk, Evidence Bench), the serif display face, and the editorial polish-pass layout, all rejected by the owner. The base is the owner's Pen frames 23–46.
- A permanent sidebar dither floor. Mosaic dither appears only where content is not real yet.

## Test state

main at `fc50566a`: CI (lint, type check, unit and browser tests, build) passed on #112 and #113. The #110 packaged macOS smoke test passed (native recording, transcription, editor, export). Evidence: `~/dev/loop-evidence/showhow-110/` and `showhow-108/`.

## Cloud blockers

None. Native macOS acceptance stays manual.
