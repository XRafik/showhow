# Project handoff

Updated: 2026-10-18

## In flight

- **#122 AI guide shipped** (PR #126, merged 2026-10-17 as `500cea16`). Make guide runs an AI pass over the deterministic steps through OpenRouter, with `anthropic/claude-haiku-5.5` as the default model (owner decision 2026-10-17, no bake-off). Plan: "Showhow AI guide Plan" in `PLAN.md`. Evidence: `~/dev/loop-evidence/showhow-122/` (READY.md, PROVE.md, PROVE-CI.md, `live-smoke/run-OKsXUE/`). Lane removed; card Done.
- **#128 Connect ChatGPT** is published and deferred (`needs-human`, Creating plan/spec). Retain parked lane w6Q; no implementation or auth changes. The installed Codex version lacks the required proven tool/config isolation. Original approved scope remains in: "Showhow Connect ChatGPT Plan" in `PLAN.md`, mock in `design/mocks/2026-10-17-chatgpt-connect/`. It uses the owner's own Codex login (`codex app-server`) for Make guide only. Issue #128 is published. Resume only after owner direction and supported isolation controls.
- **Move onto upstream v2:** #115 and #116 are done (#116 merged on stable upstream `v2.0.0` via PR #121). #117 is closed: owner merged PR #130 as `371d940d14d7392ae090b9bfc57b2cf311c6de78`; both boards show Done and its clean lane is removed. Evidence: `~/dev/loop-evidence/showhow-117/READY.md`, `PROVE.md` and `SHOWHOW-COORDINATOR-HANDOFF.md`. #118 is closed: owner merged PR #132 as `573d9f2c8fea9855b6f0ab9cdd47aabdb49c8db0`. All four milestone tickets are complete. #118 passed fresh review and all 11 CI checks; its clean lane is removed and evidence remains at `~/dev/loop-evidence/showhow-118/READY.md`. No release tag was created. The authorised handoff index is `/Users/mohamedb/dev/loop-evidence/HANDOFF-INDEX.md`.
- **#125 Done:** owner merged PR #150 as `27494aa34f2467cc107adfb586db308157ccc372`; issue closed and card Done. Reviewed head `a2873cf`: fresh Standards PASS / Requirements PASS and all 10 CI checks passed. Evidence: `~/dev/loop-evidence/showhow-125/READY.md`. No active #125 source work.
- **Final designs active:** milestone 13, approved plan and T1–T10 published as #139–#148. #139 shared components/tokens is In progress in `ticket/139-final-design-foundations`, worktree `~/dev/projects/showhow-ticket-139-final-design-foundations`, lane w72 (lead w72:p1). Base `27494aa34f`; source remains current-main based. Evidence: `~/dev/loop-evidence/showhow-139/`. Normal feature/ui review, no Greptile; one PR, agents never merge. Routine bounded scope/review repairs are owner-authorised. #140 follows only after the owner merge of #139 is verified.
- **Bugs in Todo:** #124 (pressing Stop on the recorder bar becomes a guide step). #127 is closed as superseded by #140; its UI fixes await that ticket.

### Earlier context (2026-10-16)
The move onto upstream v2 is shaped and published: milestone "Move onto upstream v2" with #115 → #116 → #117 → #118, all in Ready to implement, none priority. The plan is the "Showhow move onto upstream v2 Plan" section of `PLAN.md`; decisions are in `.agents/decisions.md` (2026-10-16). The design phase is merged (#109). The app size ticket (#110, PR #113) and the Copilot controller retirement (#108, PR #112) shipped on 2026-10-16.

- App size: installed 867 MB → 321 MB, DMG 337 MB → 167 MB (macOS arm64). `npm run check:package` audits a packaged app (only `ws` in `node_modules`, 14 Chromium locales, each wallpaper once, ≤ 330 MB). The owner installed the new build and confirmed that recording, transcription and export work. Windows and Linux are untested. #118 re-applies the trim to the v2 build with a ≤ 400 MB target.

- V1 brief and ship list: `~/Brain/projects/showhow/brief.md` and `ship list.md` (owner's vault). It ships six features: recording, the one-button AI guide, the editor with the v2 AI assistant, the library with MP4 import, Copy for agent, and PDF export.
- Locked mock: `design/mocks/2026-10-15-house-style/` (`index.html`, `SPEC.md`).
- Final designs: 50 `Final · <Area> — <state>` frames in `design/showhow.pen`, built from 25 new components. PNGs, `REPORT.md` and verification files are in `design/mocks/2026-10-15-house-style/pen-final/`.
- Design audit: `design/mocks/2026-10-15-house-style/DESIGN-AUDIT.md`. Its findings are drawn, and the owner's resolutions are in `.agents/decisions.md` (2026-10-15).
- Superseded mocks and the closed Design Max handoff are in `Archive/design/`.

## Next action

Lead completes #139 Build, Prove, fresh independent Standards/Requirements review, and one review-ready PR on its ticket branch. Write exact-head proof, PR and current CI to `~/dev/loop-evidence/showhow-139/READY.md`. Owner reviews and merges in GitHub. Coordinator verifies that merge before dispatching #140. Keep #128 parked; do not create a release tag.

## Open decisions

- Cursor packs: #116 removes the 17 Sweezy packs and takes upstream's seven original packs. #116 has merged; confirm the packs shipped as planned before a release tag.
- Per-feature goals and milestone metrics (audit questions B1 and J2). Weekly use is the only metric for now.

## Loop operations notes

- Keep the main checkout on `main` while a ticket lane is open: lane verification fails ("Git branch differs") if the coordinator switches it. Write plans in a separate worktree.
- Owner's Mac runs Vorssaint with Auto Quit; it sends Quit Apple Events to Showhow/Electron when only the HUD is left. The owner turned Auto Quit off on 2026-10-17. Not a product bug.
- Dev builds (`npm run dev`) lack the whisper STT helper (`scripts/build-whisper-stt.sh`), so dev recordings stay "(transcription pending)".

- In role panes, answer Codex hooks prompts with "Continue without trusting". "Trust all" writes hook trust into the role profile and breaks later launches (profile backup from 2026-10-16: `~/.local/share/bedar-loop/profile-fix-20261016/`).
- A ticket lead cannot prompt the coordinator across Herdr workspaces. It writes `STOP.md` in `~/dev/loop-evidence/<repo>-<n>/`, so the coordinator or a supervisor must poll it.

## Rejected paths

- Design Max layout directions (Document Desk, Evidence Bench), the serif display face, and the editorial polish-pass layout, all rejected by the owner. The base is the owner's Pen frames 23–46.
- A permanent sidebar dither floor. Mosaic dither appears only where content is not real yet.

## Test state

#122 historical evidence at `500cea16` (PR #126): all 10 CI checks passed (lint, type check, test typecheck, unit 4616 pass / 2 skip, browser 10, build, Rust and Swift jobs). The #122 real-key macOS 26.6.2 arm64 smoke passed C1–C7 on the owner's narrated recordings. Windows and Linux untested; new non-English strings fall back to English. Earlier: #110 packaged macOS smoke passed at `fc50566a`.

## Cloud blockers

None. Native macOS acceptance stays manual.


## History: owner stable retarget correction — 2026-10-17 Europe/London

Superseded: #116 merged on stable `v2.0.0` (PR #121). Kept for context only.


The previous Next action/final2.1wait is historical and superseded. #115 is closed/Done via #120. Owner chose stable2.0 (Yeah lets do it). #116 is at Creating plan/spec for the exact revised plan/publication gate; no implementation or publication yet. Use refs/tags/upstream/v2.0.0 at eff86dcba48fac490a0e153141bf8537df7ffc54 as proposed actual parent, preserving READY5/current2074dirty source/index/merge metadata/owner media before same-lane reconstruction. #117 native bundled base/offline/fail-open and #118≤400MB remain sequential and not dispatched. No priority;116ui. Refresh source/native/package/owner proof after retarget, then fresh review, one PR and separate ancestry-preserving exact-head owner merge gate. No Showhow release tag until milestone complete. This note describes the proposal, not a delivered stable migration.

### #117 close-out verified 2026-10-17

Main is `371d940d14d7392ae090b9bfc57b2cf311c6de78`. Reviewed head `cc318e87676078838e5df95ac1c5af2bbcc7c67e`: Standards PASS, Requirements PASS, all 11 CI checks pass. Local unit 4,626 pass/1 skip; hosted unit 4,625 pass/2 skip; browser 10 pass. No tests rerun for close-out. Unsigned macOS arm64 directory package only; Windows/Linux runtime, signing/installers and macOS13 hardware untested. Broad package audit remains RED on #118 policies (365.36 MiB). Physical Wi-Fi conditions are owner attestations. Second missing-model take preserves valid media and failure marker but effectively silent audio. Failed identity/CI receipts remain retained. Preserve untracked `design/landing-assets/` and `design/landing.pen`; no release tags.

### #118 final proof and close-out — 2026-10-18

Reviewed head `b0e872f3ca8bf9f1d59c13b1e3e817e536770d44`: fresh Standards PASS / Requirements PASS after one failed review and the tray-icon repair. All 11 CI checks pass. Installed arm64 365.37 → 365.77 MiB; DMG 195.44 → 195.61 MiB. Baseline already below budget; final contents audit passes. Unsigned macOS arm64 only; Windows/Linux runtime, signing and owner adoption untested. Protected originals/design unchanged. Evidence and failed receipts retained; clean w6T lane removed. No tests rerun for this documentation-only close-out.
