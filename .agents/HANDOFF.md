# Project handoff

Updated: 2026-10-20

## In flight

- **#122 AI guide shipped** (PR #126, merged 2026-10-17 as `500cea16`). Make guide runs an AI pass over the deterministic steps through OpenRouter, with `anthropic/claude-haiku-5.5` as the default model (owner decision 2026-10-17, no bake-off). Plan: "Showhow AI guide Plan" in `PLAN.md`. Evidence: `~/dev/loop-evidence/showhow-122/` (READY.md, PROVE.md, PROVE-CI.md, `live-smoke/run-OKsXUE/`). Lane removed; card Done.
- **#128 Connect ChatGPT** is published and deferred (`needs-human`, Creating plan/spec). Retain parked lane w6Q; no implementation or auth changes. The installed Codex version lacks the required proven tool/config isolation. Original approved scope remains in: "Showhow Connect ChatGPT Plan" in `PLAN.md`, mock in `design/mocks/2026-10-17-chatgpt-connect/`. It uses the owner's own Codex login (`codex app-server`) for Make guide only. Issue #128 is published. Resume only after owner direction and supported isolation controls.
- **Move onto upstream v2:** #115 and #116 are done (#116 merged on stable upstream `v2.0.0` via PR #121). #117 is closed: owner merged PR #130 as `371d940d14d7392ae090b9bfc57b2cf311c6de78`; both boards show Done and its clean lane is removed. Evidence: `~/dev/loop-evidence/showhow-117/READY.md`, `PROVE.md` and `SHOWHOW-COORDINATOR-HANDOFF.md`. #118 is closed: owner merged PR #132 as `573d9f2c8fea9855b6f0ab9cdd47aabdb49c8db0`. All four milestone tickets are complete. #118 passed fresh review and all 11 CI checks; its clean lane is removed and evidence remains at `~/dev/loop-evidence/showhow-118/READY.md`. No release tag was created. The authorised handoff index is `/Users/mohamedb/dev/loop-evidence/HANDOFF-INDEX.md`.
- **#125 Done:** owner merged PR #150 as `27494aa34f2467cc107adfb586db308157ccc372`; issue closed and card Done. Reviewed head `a2873cf`: fresh Standards PASS / Requirements PASS and all 10 CI checks passed. Evidence: `~/dev/loop-evidence/showhow-125/READY.md`. No active #125 source work.
- **Final designs: 9/10 Done.** Milestone 13 implements the approved Library, HUD, Editor and Settings frames through #139-#148. Merged on 2026-10-19: #139 (PR #151), #140 (PR #152), #141 (PR #153), #142 (PR #155, `d6a076de`, hardening PR #156, `24ae675b`), #143 (PR #158, `a4fc6008`) and #144 (PR #159, `7d0c21e7`). Merged on 2026-10-19/20, each by owner instruction at the reviewed head after all 10 checks passed:
  - **#145 HUD and recording sheets:** PR #164, head `5b871349`, merge `6d4b9876`.
  - **#146 Editor shell, inspector and timeline:** PR #165, head `f2d3443e`, merge `44fcd1a4`.
  - **#147 Editor assistant, export and dialogs:** PR #166, head `4402d254`, merge `cba41f83`. Owner decisions are in `.agents/decisions.md` (2026-10-19): agent edits auto-apply, with an "Applied · N changes" card and a guarded Undo (Editor-02 is not built); export is the inspector's share panel with a rendering sheet; the Guide format is left out; MP4 Cancel is disabled with its reason. Two fresh reviews: round 1 failed on keyboard focus in the export sheet, which was fixed; round 2 passed with no blocking findings.
  - **Remaining: #148 integrated acceptance** ("T10: Verify the implemented Final design journey"), open and undispatched.
  - Issues are closed. Evidence: `~/dev/loop-evidence/showhow-{142,143,144,145,146,147}/`.
- **#147 follow-ups, not yet fixed** (non-blocking, listed under Follow-ups in PR #166). A proposed session card, "Harden #147 export and Undo edge cases", covers 1-3; it starts only when the owner starts it.
  1. The native File menu (Cmd/Ctrl+N, Cmd/Ctrl+O) or switching to a screen-recording project can unmount the export panel mid-render and orphan the job.
  2. Focus drops to the page while a GIF cancel is pending.
  3. A retried Undo after a failed save can overwrite a manual edit made during that save.
  4. Clicking AI chat during a render opens it hidden behind the export panel.
- **Bug #124 fixed** (PR #160, `b72c6324`): on macOS, clicks on the HUD's drawn bar (not its transparent reserve) are tagged `ownUi` in cursor telemetry and skipped by step generation. Owed: a real recording smoke test, since Stop on the HUD should give no step and that needs the owner's permissions. Windows/Linux are follow-ups. Evidence: `~/dev/loop-evidence/showhow-124/`.
- **Phase 6 closed** (PR #162, `986cf494`): milestone 6 is closed, #55 (recoverable recording deletion) moved to the backlog without a milestone, and #54 closed as not planned.
- **No open PRs** (2026-10-20). #157 (landing page) has since merged.
- **How 2026-10-19 work ran:** the Codex weekly limit ran out (resets 24 Oct 22:45), so #142, #143, #144 and #124 were built in a single Claude Code session per the owner's instruction, not in Herdr ticket lanes. Each had its own worktree, test-first work, fresh independent subagent reviews, a native Electron proof on synthetic data and one PR. The owner authorised each merge in chat. #158 merged before CI finished because repo auto-merge is disabled, so `gh pr merge --auto` merges at once; all 10 checks then passed on that head. Since then, merges wait for green and then run `gh pr merge --match-head-commit`. #145-#147 (2026-10-19/20) used the same single-session route with BEFORE/AFTER native evidence and fresh subagent reviews.
- **`main` is protected** (owner request 2026-10-19): the 10 CI checks are required, with no required reviews, no strict up-to-date rule and admins not enforced. The repo setting "Allow auto-merge" is off; only the owner should change it.

### Earlier context (2026-10-16)
The move onto upstream v2 is shaped and published: milestone "Move onto upstream v2" with #115 → #116 → #117 → #118, all in Ready to implement, none priority. The plan is the "Showhow move onto upstream v2 Plan" section of `PLAN.md`; decisions are in `.agents/decisions.md` (2026-10-16). The design phase is merged (#109). The app size ticket (#110, PR #113) and the Copilot controller retirement (#108, PR #112) shipped on 2026-10-16.

- App size: installed 867 MB → 321 MB, DMG 337 MB → 167 MB (macOS arm64). `npm run check:package` audits a packaged app (only `ws` in `node_modules`, 14 Chromium locales, each wallpaper once, ≤ 330 MB). The owner installed the new build and confirmed that recording, transcription and export work. Windows and Linux are untested. #118 re-applies the trim to the v2 build with a ≤ 400 MB target.

- V1 brief and ship list: `~/Brain/projects/showhow/brief.md` and `ship list.md` (owner's vault). It ships six features: recording, the one-button AI guide, the editor with the v2 AI assistant, the library with MP4 import, Copy for agent, and PDF export.
- Locked mock: `design/mocks/2026-10-15-house-style/` (`index.html`, `SPEC.md`).
- Final designs: 50 `Final · <Area> — <state>` frames in `design/showhow.pen`, built from 25 new components. PNGs, `REPORT.md` and verification files are in `design/mocks/2026-10-15-house-style/pen-final/`.
- Design audit: `design/mocks/2026-10-15-house-style/DESIGN-AUDIT.md`. Its findings are drawn, and the owner's resolutions are in `.agents/decisions.md` (2026-10-15).
- Superseded mocks and the closed Design Max handoff are in `Archive/design/`.

## Next action

Dispatch #148 (integrated acceptance of the Final design journey) as one ticket and one PR. Use the Herdr Codex lane after the Codex limit resets on 24 Oct, or the single-session route if the owner asks. Before or alongside it, the owner may start the proposed "Harden #147 export and Undo edge cases" session.

Owed native checks:
- The isolated GIF verification recipe (`docs/testing/verification-recipe.md`) for #146 and #147. Its doctor pins Codex 0.160.0/0.162.1 and this machine has 0.163.0. Do not "fix" it by changing tools.
- #145's STOP-contrast decision and a real recording.
- Stop on the HUD during a real macOS recording (#124).
- A live OpenRouter key run for guide and brief.

Keep #128 parked and the #134 worktree intact for pen.dev cache safety.

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

2026-10-20, #147 at `4402d254`, each command run locally:
- `npx tsc --noEmit` and `npx tsc -p tsconfig.test.json --noEmit`: exit 0.
- `npx biome check .`: 0 errors, 27 warnings (the baseline).
- `npm run i18n:check` and `npm run branding:check`: pass.
- `npm run test`: 380 files, 4906 pass / 2 skip. `npm run test:browser`: 22 pass.
- All 10 CI checks green on GitHub.
- Native run (built app, isolated profile, macOS arm64). The harness faked chat.run, the provider status, save failure, an export hold and the save picker. The chat card's Undo and stale Undo, the export panel, sheet focus, the unsaved sheet keyboard and the shortcuts sheet were all shown.
- Real GIF and MP4 exports through the compositor addon, loaded via `OPENSCREEN_COMPOSITOR_VIEW_NODE`, decoded with ffprobe (GIF 608x480, 30 frames at 15 fps; MP4 H.264 1368x1080, 120 frames at 60 fps; both 2.0 s).
- Not tested natively: GIF cancel, a real export failure, Windows/Linux, packaged builds.
- Evidence: `~/dev/loop-evidence/showhow-147/`.

#145 and #146 evidence: `~/dev/loop-evidence/showhow-{145,146}/`.

2026-10-19 merged heads, each with all 10 required CI checks green on GitHub:
- **#142:** `c7a3e9fe`, unit 4734 pass / 2 skip.
- **#156:** `f7129d91`.
- **#143:** `3251bb41`, unit 4780 / 2.
- **#144:** `6dd3e8a1`, unit 4796 / 2.
- **#124:** reviewed code `a8bc0e28`, merged as `1c72f58f` after a notes-only conflict merge; unit 4787 / 2.
- **#162:** `6d0f6936`, docs only.

Browser tests passed 19/19 on each code head. Native proofs ran the built app with isolated synthetic roots on macOS 26 arm64, with harness fakes for safeStorage, the OpenRouter HTTP endpoint, clipboard writes, the save panel and Finder reveal.

Not tested:
- The real clipboard, save panel and Finder.
- A live OpenRouter key.
- Packaged or installed builds.
- Windows and Linux.
- A real recording for #124.
- HUD System-theme following (the harness window had no preload).

No tests were rerun for this handoff. Historical: the #122 real-key macOS smoke passed C1–C7 at `500cea16`, and the #110 packaged smoke passed at `fc50566a`.

## Cloud blockers

None. Native macOS acceptance stays manual.


### Session close-out: design delivery and bug #124 - 2026-10-19

- Main is `986cf494`. Merged today: #155, #156, #158, #159, #160, #161 and #162. No release tag.
- Ticket worktrees for #142, #143, #144 and #124 are removed; their evidence is under `~/dev/loop-evidence/showhow-{142,143,144,124}/`. Retained: #128 (parked), #134 (pen.dev cache), the historical #141 lane, the 2026-10-18 close-out docs worktree, and the `confident-noyce-988ce8` worktree of the merged #156 session (safe to remove when the owner archives that session).
- The main checkout is clean on `main` at `c258f118`, behind origin.

## History: owner stable retarget correction — 2026-10-17 Europe/London

Superseded: #116 merged on stable `v2.0.0` (PR #121). Kept for context only.


The previous Next action/final2.1wait is historical and superseded. #115 is closed/Done via #120. Owner chose stable2.0 (Yeah lets do it). #116 is at Creating plan/spec for the exact revised plan/publication gate; no implementation or publication yet. Use refs/tags/upstream/v2.0.0 at eff86dcba48fac490a0e153141bf8537df7ffc54 as proposed actual parent, preserving READY5/current2074dirty source/index/merge metadata/owner media before same-lane reconstruction. #117 native bundled base/offline/fail-open and #118≤400MB remain sequential and not dispatched. No priority;116ui. Refresh source/native/package/owner proof after retarget, then fresh review, one PR and separate ancestry-preserving exact-head owner merge gate. No Showhow release tag until milestone complete. This note describes the proposal, not a delivered stable migration.

### #117 close-out verified 2026-10-17

Main is `371d940d14d7392ae090b9bfc57b2cf311c6de78`. Reviewed head `cc318e87676078838e5df95ac1c5af2bbcc7c67e`: Standards PASS, Requirements PASS, all 11 CI checks pass. Local unit 4,626 pass/1 skip; hosted unit 4,625 pass/2 skip; browser 10 pass. No tests rerun for close-out. Unsigned macOS arm64 directory package only; Windows/Linux runtime, signing/installers and macOS13 hardware untested. Broad package audit remains RED on #118 policies (365.36 MiB). Physical Wi-Fi conditions are owner attestations. Second missing-model take preserves valid media and failure marker but effectively silent audio. Failed identity/CI receipts remain retained. Preserve untracked `design/landing-assets/` and `design/landing.pen`; no release tags.

### #118 final proof and close-out — 2026-10-18

Reviewed head `b0e872f3ca8bf9f1d59c13b1e3e817e536770d44`: fresh Standards PASS / Requirements PASS after one failed review and the tray-icon repair. All 11 CI checks pass. Installed arm64 365.37 → 365.77 MiB; DMG 195.44 → 195.61 MiB. Baseline already below budget; final contents audit passes. Unsigned macOS arm64 only; Windows/Linux runtime, signing and owner adoption untested. Protected originals/design unchanged. Evidence and failed receipts retained; clean w6T lane removed. No tests rerun for this documentation-only close-out.

### Session close-out: playback and Final design delivery - 2026-10-18

- Latest merged main: 01ba9eb2. #125, #139, #140 and #141 are completed; their source is committed, owner-merged and remotely verified. No agent merge or release tag.
- #141 hosted proof: 4,679 unit passes / 2 skips, 19 browser passes, all ten checks successful at reviewed 69aa68eb. Native synthetic macOS arm64 import/cancel/failure/duplicate/editor playback and unchanged source-media hashes; not packaged/installed, other-platform, macOS13 hardware, successful STT/provider or owner clipboard acceptance. Evidence and earlier failures retained under ~/dev/loop-evidence/showhow-141/.
- #140 accessible-name follow-up remains nonblocking: visible Edit video/Rename versus Open in editor/Edit title. Record and verify it when those controls are next changed. Its initial compiler raw-receipt overwrite remains disclosed; no reconstructed failure logs.
- No active implementation worker. Clean historical #141 lane w74/worktree is retained. Parked #128 w6Q and #134 worktree remain untouched; #134 must stay while pen.dev caches its document. Earlier session worktrees that are absent were removed before this wrap-up; their committed source and external evidence remain.
- Showhow main checkout remains at 9eb781dc, behind merged remote main; no switch or forced update. Initial audit was clean; the final audit found a concurrent unrelated design/landing.pen edit, which was preserved unstaged and untouched. Loop checkout is clean. External HANDOFF-INDEX.md is not in a Git repository. No tests rerun solely for wrap-up documentation.
- Session journal uses only ~/Brain/logs/codex/ and logs/projects/showhow/. Never access private/ or run Git in the live vault.

### Session close-out: Final HUD and editor delivery - 2026-10-20

- Main is `cba41f83`. Merged in this session: #164 (#145), #165 (#146) and #166 (#147). No release tag.
- Ticket worktrees `ticket-145`, `ticket-146` and `ticket-147` remain under `.claude/worktrees/`. Their branches are merged, so they are safe to remove when the owner archives the session. This note was committed from `ticket-147` on branch `claude/handoff-2026-10-20`.
- No tests were rerun for this handoff.
