# Project handoff

Updated: 2026-10-16

## In flight

The design phase (step 2) is finished. Branch `design/full-experience` carries the locked design and goes to `main` as one design PR.

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

## Open decisions

- Cursor packs: remove the 17 bundled third-party packs or clear their terms. This blocks release, and the v2 move may settle it because v2 removed them.
- Per-feature goals and milestone metrics (audit questions B1 and J2). Weekly use is the only metric for now.

## Rejected paths

- Design Max layout directions (Document Desk, Evidence Bench), the serif display face, and the editorial polish-pass layout, all rejected by the owner. The base is the owner's Pen frames 23–46.
- A permanent sidebar dither floor. Mosaic dither appears only where content is not real yet.

## Test state

No app code changed during the design phase. The last app checks are from the branch-office task (2026-10-12): `npm run lint` and `npx tsc --noEmit` passed. On 2026-10-16, `npm run branding:check` passed after the archive moves.

## Cloud blockers

None. Native macOS acceptance stays manual.
