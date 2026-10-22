# Showhow verification recipe Implementation Plan

> **For agentic workers:** this plan is published to GitHub by `/new-project`
> or `/phase`; `/ticket` delivers a review-ready PR in maintenance mode or a
> verified MVP phase push. Do not execute inline. Track steps with checkboxes (`- [ ]`).

## Feedback addressed

PLAN-FEEDBACK.md: none open (file absent at planning base).

**Goal:** Give agents one repeatable, isolated native Electron journey from a synthetic recording to a real, decodable GIF export, with diagnostic, evidence and cleanup results.

**Architecture:** Add a project-owned recipe and one foreground Node/Playwright driver. Reuse the committed recording fixture, production built main/preload/renderer, existing editor locators and actual export-write IPC. A generated test bootstrap isolates Electron paths before importing the production entry; only the operating-system save dialog selection is replaced.

**Tech Stack:** Node 22.22.1, npm 10.9.4, Electron and Playwright versions resolved from the existing lockfile, FFmpeg/ffprobe, existing Vitest/browser and CI commands.

## Global Constraints

- Task mode (`maintenance`): one standalone task PR; no priority label; agents never merge.
- No production renderer, IPC, native helper, runtime, global skill, dependency-version or OS permission changes.
- Preserve phases 6 and 10 without adding mode; this task does not unpark product work.
- Preserve canonical checkout's dirty `design/showhow.pen` and untracked `design/showhow-export.html`; implementation uses a fresh isolated ticket worktree.
- Use lane-owned dependencies installed with the exact engine pins; every install, build, suite and native run uses `ruby ~/.local/bin/bedar-runtime.rb run --resource heavy --`.
- Record actual role-shell `command -v` and version outputs for Node 22.22.1, npm 10.9.4 and Codex 0.160.0 (planning observation); a stale or mismatched required CLI blocks the attempt. No tool repair or version substitution is part of this task.
- Use only committed synthetic `tests/fixtures/sample.webm` (VP9, 640x480, 2.000 seconds, 23,869 bytes at planning base); no personal recording discovery or cursor sidecar search.
- If an OS permission prompt, personal recording content or non-isolated profile appears, stop that attempt, preserve sanitized failure evidence and clean up only owned processes; do not change permissions or bypass isolation.
- This journey proves editor load, renderer GIF export and actual filesystem save. It does not prove native recording permissions, recording bundles, native save-dialog interaction, MP4 export or Windows/Linux behavior.

## File structure

- Create `docs/testing/verification-recipe.md`: ordered doctor, launch, drive, evidence and cleanup procedure, command, failure/resume and proof limits.
- Create `scripts/verify-showhow-export.mjs`: single foreground entrypoint, pure preflight/result helpers, isolated Electron bootstrap and actual journey.
- Create `scripts/verify-showhow-export.node-test.mjs`: same-package tests of safety boundaries, prerequisite failures and independent result validation.
- Modify `AGENTS.md`: one conditional pointer to the project recipe when verifying editor/export work; no copied OS rules.
- Modify `package.json`: add `verify:export` and its focused test command without dependency changes.
- Create `artifacts/verification-recipe/Verification.md` and safe reviewed result/screenshots: actual execution assertions, commands, exits, source identity and scope limits.
- Create `implementation-notes.md`: source/evidence deviations and their conservative resolution.
- Planning only: `PLAN.md`, `.bedar/project-plan.yml`, `references/verification-recipe-planning-2026-10-02.md`, append `.agents/decisions.md` for approved mode/priority/scope.

### Task 1: Isolated Electron export verification recipe

**What:** Ship and exercise one command that diagnoses prerequisites, launches actual Showhow, opens the synthetic clip, exports a GIF through the renderer and production write handler, saves bounded evidence, then proves owned-process and temporary-data cleanup.

**Files:** All implementation paths in the file structure above. Existing `tests/e2e/gif-export.spec.ts`, `electron/bootstrap.ts`, `electron/main.ts`, `electron/ipc/handlers.ts` and `tests/fixtures/sample.webm` are read-only references.

**Interfaces:**
- Consumes: built `dist-electron/main.js` and `dist/index.html`, committed synthetic fixture, Playwright `_electron`, production `window.electronAPI.setCurrentVideoPath` and `switchToEditor`, `testId-export-panel-button`, `testId-gif-format-button`, `testId-export-button`, FFmpeg/ffprobe commands.
- Produces: `npm run verify:export -- --evidence-dir <new-lane-owned-directory>`; a fresh directory containing reviewable sanitized `result.json`, editor and completion screenshots, and the synthetic exported GIF when successful. Reject an existing evidence directory rather than overwrite earlier proof. Exit 0 requires all journey and cleanup assertions. Nonzero preserves failure evidence and identifies the failed stage.

**MUST:** Declare the save-dialog override in the result. Keep the production `write-export-to-path` handler intact. Assert actual Electron path isolation before opening the fixture. Wait on observed window/video/export/file state with explicit timeouts, not fixed sleeps as success criteria. Capture actual process, source SHA/dirty status, tool versions, fixture hash, file/decoded-media assertions, and cleanup observations.

**MUST NOT:** Reuse the current GIF e2e's default userData, fixed `test-sample.webm` or mock writer, use preview capture's newest cursor recording search, change HOME or credentials, kill unrelated apps, delete outside the created temporary run root, retry failed native attempts automatically, or count screenshots/signatures alone as media/export proof. **REASON:** Those defaults can mutate owner data or produce a false acceptance result.

**Sequence:**
1. Doctor resolves repository identity and exact Node/npm pins, dependency modules and Electron binary, built main/renderer, readable fixture/hash, FFmpeg/ffprobe availability and a new evidence path. It fails before launch if any prerequisite is missing. Record actual tools/role/harness and source identity, including resolved Codex binary path/version and actual role-launch context when Codex drives the recipe (mark other harnesses explicitly, never assume an API agent role from a shell environment). Do not change model/profile settings or install/build inside the driver.
2. Allocate private temporary run root with `mkdtemp`. Create appData, userData, sessionData, downloads, logs, crash and tmp directories. Launch only the owned Electron child with private TMPDIR/TMP/TEMP so `os.tmpdir()` stable-instance locks remain inside that root. Generated bootstrap calls Electron `app.setPath` synchronously for appData, userData, sessionData, downloads, temp, logs and crashDumps before importing production `dist-electron/main.js`. Production bootstrap will select `<isolated-appData>/Showhow`; verify the final runtime paths and lock paths remain within the run root. Keep HOME and user credentials unchanged.
3. Copy the synthetic clip into isolated runtime recordings. Confirm IPC readiness and fixture readability. Switch to the actual editor with production IPC; subscribe to the new-window event before switching and tolerate only a proven closed-HUD transition. Wait for loaded video with finite duration and canvas. Save editor screenshot.
4. Replace only `pick-export-save-path` to return one unique absolute GIF path inside the temporary root. Click the existing export-panel, GIF-format and export buttons. Wait for actual file existence and completed export UI. Preserve the production writer and renderer encoder. Assert GIF magic, size >1 KiB, positive decoded width/height, at least two decoded frames and decoded duration between 1 and 4 seconds for the 2-second fixture. Independently decode the entire output with FFmpeg; exit 0 required. Copy the synthetic GIF and completion screenshot to the evidence directory before cleanup.
5. Finally close the owned Electron app, wait boundedly for its owned process tree, escalate only owned PIDs if required, and confirm those processes are gone before removing only the created run root. On every failure retain already captured evidence with failure stage and cleanup result. Incomplete cleanup keeps overall exit nonzero. Rehash the source fixture and prove it unchanged. Evidence and logs are sanitized before publication; retained screenshots contain only the synthetic app journey.

- [ ] Capture the baseline observable absence of this recipe and the existing e2e writer-mock gap. Observe meaningful assertion RED for missing-prerequisite/no-launch behavior, existing evidence path rejection, cleanup failure preventing success, and corrupted or undecodable output failing validation before implementing helpers; a missing module or setup failure is not behavioral RED.
- [ ] Implement the smallest complete recipe and driver; critical isolation and writer invariants stay beside the launch/export code.
- [ ] Run focused helper tests, then a real macOS Electron journey and inspect actual screenshots, decoded output and cleanup proof.
- [ ] Run the full project CI checks below, inspect owned changes, obtain independent Standards and Requirements review, then commit only owned changes and open one PR.

**Verification:**
- Focused `node --test scripts/verify-showhow-export.node-test.mjs`: missing tools/build/fixture prevent app launch; output directory collision preserves original bytes; successful media assertions alone cannot mask cleanup failure; invalid GIF and decoder failure reject proof; bootstrap ordering is a supporting static check and fixture hash mismatch fails acceptance. The actual native boundary must independently assert runtime appData/userData/sessionData/recordings and stable-lock containment and production writer output; bootstrap-string checks do not substitute for these observations.
- Real macOS `npm run verify:export -- --evidence-dir artifacts/verification-recipe/native-<unique-run>` through heavy runtime: actual editor screenshot, completed GIF UI, real file and independent full decode, immutable fixture and bounded owned cleanup. Preserve failed attempts beside later passing runs. A second invocation uses a different new directory and proves repeatability and cleanup rather than overwriting the first.
- CI parity, sequential through heavy runtime with exact Node/npm: `npm run lint`; `npm run branding:check`; `npx tsc --noEmit`; `npm run test`; `npm run test:browser:install`; `npm run test:browser`; `npx vite build`. Also run `npm run i18n:check` only if translations change (outside expected scope). Use semantic PR title; all applicable current-head GitHub CI checks must pass.
- First install `npm ci` in the lane only; browser install is the repository's required prerequisite, not a version upgrade. Build `npm run build-vite` before the native journey. No packaging or native helper build required for fixture import/export.

**DONE WHEN:** Two fresh native macOS runs show isolated real editor load and real GIF filesystem export with successful independent full decode, identical before/after fixture hashes, no surviving owned Electron processes and no temporary run root; focused negative tests and complete applicable project CI pass; reviewed sanitized evidence states the dialog override and platform/proof limits; fresh independent review has zero blocking findings; one review-ready standalone task PR is open and unmerged.

## Decision checkpoint

- 2026-10-02: Owner approved the five-stage verification recipe and real journey with “Go for it”; selected Task mode and no priority label. One bounded task, one PR; phases remain parked.
- Cheap choices: GIF reuses the existing supported format/locators and avoids an unrelated MP4 optimization task. One committed 2-second synthetic fixture; no new product UI or design mock is needed for a verification tool.
- Factual risks addressed in this plan: default Node is 24.14.0/npm 11.9.0; exact required 22.22.1/10.9.4 are installed. Existing GIF E2E overrides real writes and touches default userData. Production bootstrap resets userData from appData, and stable instance locks use os.tmpdir; early path and temp isolation is mandatory.
- Expensive uncertainty retained as acceptance, not assumed success: actual GIF encoding/decoding and native process cleanup have not run in this fresh worktree. If current application behavior blocks the recipe, record evidence and stop; production fixes require a separate authorized task.
- Publication: preview pending; no fingerprint approved and no GitHub mutation authorized yet. Next action: generate and show the exact selected-phase preview for owner approval.

## Implementation notes

Keep an `implementation-notes.md` in the repo root during the build. If an edge
case or discovery forces a deviation from this plan, pick the conservative
path and record the deviation there with its reason. Surface it to Mohamed at
the end; do not silently change scope or acceptance.

# Showhow app size reduction Plan

## Goal
Cut the packaged macOS app from 865 MB installed to 330 MB or less (arm64), so it downloads and installs quickly for the owner and later users. Recording, transcription, editing and export must behave and perform as before.

## Context and decisions
- Measured 2026-10-16 on `/Applications/Showhow.app`, 865 MB in total:
  - `app.asar` holds 503 MB of `node_modules`, and `app.asar.unpacked` another 98 MB (onnxruntime-node and sharp). The largest are react-icons (81 MB), pixi.js (72 MB), onnxruntime-node (74 MB), onnxruntime-web (65 MB), @xenova (44 MB), lucide-react (33 MB), emoji-picker-react (33 MB) and sharp (24 MB). Vite already bundles everything the renderer uses into `dist/`.
  - The built main process (`dist-electron/*.js`) loads only one package at runtime: `ws` (`vite.config.ts` externals).
  - Electron Framework ships 220 Chromium `.lproj` packs (47 MB in total). The app has 13 locales (`src/i18n/locales`).
  - Wallpapers ship twice: `dist/wallpapers` (24 MB, copied from `public/` by Vite) and `Resources/wallpapers` (24 MB, from `extraResources`, which `electron/preload.ts` reads when packaged).
  - `caption-assets` (61 MB: Whisper-tiny plus ONNX runtime WebAssembly) stays.
- Owner decisions (2026-10-16):
  - Do the Electron diet now. Whether to leave Electron is decided while shaping the v2 move.
  - Keep Whisper-tiny bundled.
  - Not priority.
  - Measure and test on macOS only; report Windows and Linux as untested.
  - One ticket, branched from `main` after #109 merges.
- Estimated result: about 300 MB installed. The Electron binary (170 MB) is the floor.

## Bounded requirements
- Supported target: the macOS arm64 build from `electron-builder.json5`. Windows and Linux get the same config but are not measured.
- R1. The packaged `app.asar` and `app.asar.unpacked` contain no `node_modules` packages except `ws`.
- R2. Electron's bundled Chromium language packs are limited to the app's 13 locales plus `en` and `en-GB`, using electron-builder's `electronLanguages`. Locale mapping: ar, en, es, fr, it, ja, ko, pt_BR, ru, tr, vi, zh_CN, zh_TW.
- R3. Each wallpaper image ships exactly once in the packaged app, at the location `electron/preload.ts` reads when packaged.
- R4. Images in `public/` that no source file references (candidates: `sample.png`, `demo.png`, `preview3.png`, `preview4.png`) are left out of the package. A file is excluded only after `grep` over `src/`, `electron/`, `index.html` and `public/` finds no reference.
- R5. The installed arm64 app measures 330 MB or less (`du -sh` of the `.app`). Record the arm64 DMG size before and after.
- R6. There is no behaviour regression on these named paths, checked on the packaged arm64 app: the app launches to the library; a native recording saves its bundle; transcription completes from the packaged app (transcript.txt present with timestamps); the editor opens and shows a wallpaper background; export completes through the existing verification recipe (`npm run verify:export`); the browser bridge's `ws` server still loads (no main-process load error in the log).
- Excluded: cursor packs, `ws` removal, JavaScript bundle tuning inside `dist/`, Electron version changes, the Whisper model.

## Architecture
- Packaging config only: `electron-builder.json5` (`files` exclusions with a `ws` inclusion, `electronLanguages`, and wallpaper or unused-image exclusions). Use `vite.config.ts` only if keeping wallpapers out of `dist/` needs it.
- A new package audit script, `scripts/check-package-contents.mjs`, takes a built `.app` path. It reads the `app.asar` listing (`@electron/asar`, already a transitive dependency of electron-builder) and the `Resources` and `Frameworks` folders, then reports:
  - `node_modules` packages present
  - Chromium `.lproj` count
  - wallpaper copies
  - installed size
  It exits non-zero when R1–R3 or R5 fail.
- A same-package test, `scripts/check-package-contents.node-test.mjs`, uses a small fixture directory tree (not a real build). Its cases:
  - extra `node_modules` fails
  - `ws` alone passes
  - a duplicate wallpaper fails
  - an over-budget size fails
- `package.json` gets one script, `check:package`, that runs the audit against `release/<version>/mac-arm64/Showhow.app`.

## Milestones
None.

### Task 1: Shrink the packaged macOS app to 330 MB or less

**Priority:** no
**Labels:** feature
**Milestone:** none
**Depends on:** #109 (merged). Published as #110.
**Files:** `electron-builder.json5`, `vite.config.ts` (only if needed for R3), `package.json` (script only), `scripts/check-package-contents.mjs`, `scripts/check-package-contents.node-test.mjs`, `scripts/fixtures/package-contents/**`, `implementation-notes.md`
**Requirements:** R1–R6 above.
**Interfaces:** `node scripts/check-package-contents.mjs <app-path> [--budget-mb 330]` prints a JSON report and exits 0 or 1. CI doesn't run it (CI doesn't package macOS); it's a local and release check.
**Constraints and reasons:**
- `asarUnpack` for `**/*.node` stays, so any future native module can still be loaded from outside the archive.
- Don't move dependencies between `dependencies` and `devDependencies`. The config exclusion is smaller and easier to reverse, and the v2 move will replace `package.json` anyway.
- Keep the before and after `.app` builds side by side until R6 passes, so a regression can be bisected.
- Native capture is platform-fragile, so smoke-test on real macOS (AGENTS.md).

- [ ] RED: `node --test scripts/check-package-contents.node-test.mjs` fails because the script doesn't exist yet. Then `node scripts/check-package-contents.mjs <current packaged app>` exits 1, reporting about 600 MB of `node_modules`, 220 `.lproj` packs and 2 wallpaper copies.
- [ ] Implement the audit script and the packaging config changes.
- [ ] GREEN: the node test passes. Rebuild (`npx electron-builder --mac --arm64 --dir` after `npm run build-vite`), then the audit on the new app exits 0. Then run the R6 paths on the packaged app.
- [ ] Prove and obtain independent review, then open the PR to main.

**Verification:**
- `node --test scripts/check-package-contents.node-test.mjs`: pass.
- `npm run check:package` on the before build: exit 1 with the measured report. On the after build: exit 0, installed size ≤ 330 MB, `node_modules: ["ws"]`, `.lproj` count = 14, wallpaper copies = 1.
- arm64 DMG size before and after, recorded in the PR.
- `npm run verify:export -- --evidence-dir artifacts/verification-recipe/<new-dir>` on the after build: pass.
- Manual native smoke test on macOS covering the other R6 paths (launch, record, transcript, editor wallpaper, `ws` load), with screenshots or log lines as evidence.
- `npm run lint`, `npx tsc --noEmit`, `npm run test`: pass.

**DONE WHEN:**
- The after arm64 `.app` measures ≤ 330 MB and the audit exits 0 with the R1–R3 values above.
- The DMG sizes before and after are in the PR.
- The six R6 paths are evidenced on the packaged after build.
- The node test covers the four fixture cases.
- Windows and Linux are stated as untested in the PR.

**Outside cases / follow-ups:**
- Runtime choice (Electron or a WebKit-based shell such as Tauri): decided while shaping the v2 move, with a spike on WebCodecs in WebKit and the main-process porting cost.
- Cursor pack removal (licensing blocker).
- Removing `ws` with the browser companion.
- Bundle splitting inside `dist/`.
- Measuring Windows and Linux installer sizes.

## Superseded issues
None.

## Self-review
Unbounded-word scan: "every" doesn't appear in requirements or DONE WHEN. "Each wallpaper" (R3) is bounded to the `public/wallpapers` set and checked by the audit's duplicate count. "Any future native module" is a constraint reason, not a requirement. No "all", "any" or "valid" in acceptance.

## Implementation notes
Append each deviation from this plan to `implementation-notes.md` under "Deviations": what changed, why and what was done instead. Commit it with the ticket. Path-scope checks treat it as an owned path.

# Showhow move onto upstream v2 Plan

## Goal
Rebuild Showhow on the upstream OpenScreen v2 codebase, so the owner gets v2's editor, Rust compositor, native transcription and AI editing assistant, and can take later upstream releases through reviewed merges. Today's Showhow behaviour (recording bundles, library, workflow documents, Showhow identity, legacy data) keeps working on the new base. The six V1 features are shaped afterwards on this base.

## Context and decisions
- Owner retarget, 2026-10-16 UTC / 2026-10-17 Europe/London: after asking about stable v2.0.0, the owner replied **“Yeah lets do it”**. Stable v2.0.0 is settled; this draft revises scope, preservation and publication, not that product choice.
- Actual release parent: `refs/tags/upstream/v2.0.0` = `eff86dcba48fac490a0e153141bf8537df7ffc54`, official release published 2026-10-03, prerelease false, remote ref type commit. The permanent upstream remote remains tags-only with namespaced refs; no upstream branches are tracked.
- Source research: `docs/research/2026-10-16-openscreen-v2.0.0-seam-assessment.md`, with pinned primary-source links and untrusted claim ledger. Source facts are not runtime acceptance. Official compare and local objects agree rc.3 is447ahead/16behind stable, with divergent histories. `bb4660b11d2e1f87f5f5fc57dd6acb14e248109f` was a separate shaping snapshot, not rc.3; the actual rc.3 pin is `523a3e4c47cf7566cc5c759ad5275f7edcd3382e`. Do not use the stale458count for these tags.
- Stable already has Electron41.2.1, the Rust compositor/napi addon, v2 editor/Axcut migration, native GIF and whisper.cpp APIs. Its five named original cursor packs plus built-in default replace the stale seven-pack description. Stable checked-in THIRD-PARTY-NOTICES.md is not generated; the selected npm/Rust licence-text generator is an explicit narrow adaptation from the pinned RC source, not a stable feature.
- Task1/#115 remains closed/Done through PR#120. Its RC policy/assessment refresh is historical completed work. This ticket/#116 owns the dated stable correction, policy and revised-plan updates; do not reopen115 or create another plan issue/PR automatically.
- Settled choices retained: Electron; free/local-first; attributed release-parent merges; one ticket/worktree/PR; no gap on main; upstream editor/HUD/recorder themed through tokens/CSS/wrappers without component restructuring; existing Showhow screens keep their look; optional upstream AI remains off until configured; CLI/MCP hidden and MCP off; redesigned V1/provider connections later.
- Reuse the approved house-style mock and final frames at `design/mocks/2026-10-15-house-style/` and `design/showhow.pen`. No new UI/prototype decision.
- Older-base trade-off: three held macOS recorder patches are not demonstrated covered by stable2.0. The former RC-era covered disposition is historical; keep them held for re-triage unless a named #116 acceptance failure requires a minimal scoped fix. Source ancestry/symbol absence is not a native-failure verdict and grants no patch/native-overlay authority.
- #116 retains today's renderer Whisper-tiny bundle pipeline. #117 moves bundles to native whisper.cpp with bundled quantised multilingual base and necessary local VAD; #118 measures/trims the resulting app to≤400MB installed on macOS arm64, model included. No early native-model port or size trim in116.
- Stable model management has fixed small-q8/VAD support and optional CTC, not a larger-model selection catalogue/UI. Preserve that existing optional support while adding the bundled-base default in117. Exact transcript equality between native editor and renderer tiny, visual cursor-overlay alignment and Copy path interaction are not extra116approval gates.
- No task is priority (existing owner answer);116 retains feature,ui;117/118 retain feature and unsatisfied dependency order. Windows/Linux native behaviour remains explicitly untested, with existing CI compilation obligations.
- Prior READY5/RC package/owner media are preserved historical BEFORE evidence. They do not accept stable runtime code. Authentic fc50566a originals/hashes can be reused as inputs after verification; source/native/build/packaged/owner acceptance is refreshed after retarget.

## Bounded requirements
- Supported platform for acceptance: macOS 13+ on arm64. Windows and Linux builds must compile in CI where they do today; their native behaviour is untested and stated so.
- Upstream base: stable tag `v2.0.0` at `eff86dcba48fac490a0e153141bf8537df7ffc54`. Later upstream tags are follow-ups.
- Identity kept unchanged: `appId` `com.bedarstudios.showhow` and `productName` `Showhow` (changing them moves userData and resets macOS TCC grants, `electron-builder.json5:10`).
- Legacy cases that must pass (Task 2): (L1) a `.showhow` project saved by Showhow `main` at `fc50566a` opens in the v2 editor and the file's bytes are unchanged after opening; (L2) a `.openscreen` project from the same build opens without being overwritten, and the next save defaults to a new `.showhow` file; (L3) bundles recorded by `fc50566a` appear in the library and open; (L4) the recordings folder and the preferences set in a `fc50566a` profile survive the first launch of the new build; (L5) a new recording writes `<video path>.cursor.json` and the editor reads it.
- Excluded from this milestone: the six V1 features in their new design, ChatGPT sign-in, upstream CLI and MCP exposure, Windows and Linux native fixes, upstream releases after `v2.0.0`.

## Architecture
- After Task 2, the tree is based on the actual stable `v2.0.0` release parent plus focused Showhow adaptations. Showhow-owned code stays in `electron/showhow/`, `src/lib/showhow/`, `src/components/showhow/` and `src/components/library/`. Upstream screen edits stay at identity, theming, wiring and slot points; exact Task2 persistence/build/decoder exceptions are separately bounded. The edited upstream paths are listed in `docs/architecture/upstream-touchpoints.md` (new) so release merges know where conflicts will come from.
- Theming on upstream screens goes through Showhow design tokens (`src/lib/showhow/designTokens.ts`, `theme.ts`) mapped onto upstream's CSS variables and Tailwind config, not by forking upstream components.
- Transcription after Task 3: bundle transcripts call v2's `electron/stt/` engine from the main process. `transcript.txt` keeps its current timestamped format (`src/lib/showhow/transcriptFormat.ts`) and its fail-open rule (`docs/architecture/showhow-bundles.md`: a failure still writes `transcript.txt` with `(transcription failed)`).

## Same-lane preservation and reconstruction protocol — Task2 entry gate

Current base/HEAD remains `d2e3d72f12debbb31914bcbdb22b43ba434a22fb`, pending RC MERGE_HEAD `523a3e4c47cf7566cc5c759ad5275f7edcd3382e`; READY5 SHA08838f95da931e61f7053c61a65e80f55e309073f4e89609e18019bc7530f746 and2,074path manifest SHA16cab7be3b3cf80bb394255e237c83b1a7e32566a17421b2d1dddeeebbda1026 identify the historical candidate. Before changing it:

1. In a new exclusive evidence archive, preserve source modes/symlinks/deletions and staged/unstaged/untracked bytes, binary diffs, raw index plus HEAD/ORIG_HEAD/MERGE_HEAD/MERGE_MSG/MERGE_MODE/AUTO_MERGE and other present merge state. Preserve committed graph/refs with a verified bundle plus immutable pins. A Git bundle alone is not the dirty archive.
2. Preserve ignored generated/native payloads, dependency/lock state and immutable package separately; verify owner-physical-1/2 recordings/bundles and15authentic fc50566a fixture hashes. No real recordings/private/.env contents copied. Extract source/index archive into an external plain scratch directory and require exact byte/mode/deletion equality before replacement. No new Git worktree/lane.
3. After the archive gate, `git merge --quit` forgets only the old pending merge, leaving source/index intact; preserve before/after evidence. Move named untracked collisions and stale ignored native outputs to exclusive external quarantine. Restore the fixed baseline using a reviewed NUL list of current-index/baseline tracked paths with explicit preimage/postimage checks: `git restore --source=<fixed-base> --staged --worktree --pathspec-from-file=<verified-list> --pathspec-file-nul`. No blind hard reset, merge abort, clean, stash/pop or force checkout. HEAD/branch/workspace stay fixed. Stop on mismatch; retained RC archive supplies a verified rollback, not patch-only recovery.
4. Perform actual `git merge --no-ff --no-commit refs/tags/upstream/v2.0.0` in the same checkout; preserve conflicts/raw RED receipts. Resolve stable source plus Showhow base, then replay focused owned modules/adapters and selected decoder/licence work. Do not overlay the current RC tree or forward-port447commits. Classify each edited upstream hunk in touchpoints and add same-package coverage.
5. Rebuild stable source/helpers/compositor/STT/package serially with isolated tools/roots, run fresh native/source/browser/branding/i18n/real-export proof and target-macOS owner smoke. Preserve historical RC receipt/media rather than relabelling PASS. Tools/SDK and unchanged authentic fixture bytes may be reused as inputs after hash/source compatibility checks; RC binaries/tests/owner success are not stable runtime acceptance.
6. The lead creates the real local stable-parent merge commit as candidate-bound ancestry proof before fresh review; the executor never commits. Only then prove stable ancestry on HEAD. Obtain fresh canonical independent review with its one-shot identity gate, one review-ready PR and current-head hosted CI. Exact-head owner merge approval is separate and uses GitHub MERGE COMMIT; coordinator checks stable ancestor on main. No tag until milestone completion.

The external approved packet contains the detailed reconstruction/rollback protocol and command preconditions. Do not start reconstruction until the owner approves this revised plan and exact publication preview. Failed-review0 and identity unattempted/no verdict carry forward; old review/identity receipts cannot replace fresh review.

## Milestones
**Move onto upstream v2** (GitHub milestone 12). Published 2026-10-16: Task 1 = #115, Task 2 = #116, Task 3 = #117, Task 4 = #118.

Task 1 → Task 2 → Task 3 → Task 4, in order. Outcome: Showhow `main` contains the actual upstream `v2.0.0` release parent plus the Showhow layer, transcribes with v2's engine and ships at ≤ 400 MB. No `v*` release tag is pushed until the milestone is done.

### Task 1: Rewrite the upstream policy and refresh the v2 evidence — completed #115

**Priority:** no
**Labels:** feature
**Milestone:** Move onto upstream v2
**Depends on:** none
**Status:** Historical completed Task1; #115 closed via #120. The original RC requirements below record that completed work. Stable retarget corrections belong to Task2/#116.
**Files:** `UPSTREAM.md`, `docs/research/2026-10-12-openscreen-v2-assessment.md` (append a dated refresh section), `AGENTS.md`, `.agents/CONTEXT.md`, `ROADMAP.md`, `implementation-notes.md`
**Requirements:**
- `UPSTREAM.md` describes the release-parent model: a permanent `upstream` remote that fetches tags only; one reviewed merge PR per upstream release tag (`v*` without `-`, or a named rc used as a development base); the per-merge checklist (identity diff review, `docs/architecture/upstream-touchpoints.md` update, branding check, the Task 2 legacy cases L1–L5, macOS smoke test); and what is still excluded (upstream release pipeline, publishers, package identity, product branding).
- The assessment gains a refresh section against `v2.1.0-rc.3` (actual tag523a3e4; bb4660b1 was the separate original shaping snapshot) covering: runtime and compositor binding, transcription engine and model download, project migration, cursor packs and notices, and the list of Showhow-layer features with their v2 counterpart (or none).
- `AGENTS.md` and `.agents/CONTEXT.md` replace "never merge the full source branch" with the release-parent rule. `ROADMAP.md` drops "no API key" in favour of "optional AI connections".
**Interfaces:** Read by Task 2's executor and every later upstream merge.
**Constraints and reasons:** Docs only; no code. The policy must keep the ban on reintroducing upstream's RC pipeline and publishers (AGENTS.md, "Pull requests and releases").

- [ ] RED: `grep -n "Never use a full branch merge" UPSTREAM.md` matches, and `grep -n "v2.1.0-rc.3" docs/research/2026-10-12-openscreen-v2-assessment.md` finds nothing.
- [ ] Write the policy, the refresh section and the wording changes.
- [ ] GREEN: the first grep finds nothing; the refresh section exists with the five topics; `npm run branding:check` and `npm run lint` pass.
- [ ] Prove and obtain independent review, then open the PR to main.

**Verification:** the two greps above; `npm run branding:check`; `npm run lint`.
**DONE WHEN:** the PR changes only the listed files; `UPSTREAM.md` contains the remote rule, the merge checklist and the exclusions; the refresh section covers the five named topics with upstream commit links; branding and lint pass.
**Outside cases / follow-ups:** none.

### Task 2: Showhow on upstream v2.0.0

**Priority:** no
**Labels:** feature, ui
**Milestone:** Move onto upstream v2
**Depends on:** Task 1 (#115, closed/Done)
**Files:** the real merge commit of upstream `v2.0.0` (`eff86dcba48fac490a0e153141bf8537df7ffc54`) into this same ticket branch, plus: `electron/showhow/**`, `src/lib/showhow/**`, `src/components/showhow/**`, `src/components/library/**`, `src/components/launch/**`, `electron/bootstrap.ts`, `electron/main.ts`, `electron/preload.ts`, `electron/ipc/handlers.ts` (identity and wiring only), `electron-builder.json5`, `package.json`, `vite.config.ts`, `src/App.tsx`, `src/i18n/locales/**`, `src/assets/fonts/**`, `public/cursors/**`, `scripts/branding-check.mjs`, `scripts/audit-showhow-bundle.mjs`, `docs/architecture/showhow-bundles.md`, `docs/architecture/upstream-touchpoints.md` (new), `tests/fixtures/legacy/**` (new), `NOTICE.md`, `implementation-notes.md`. Deleted: `electron/showhow/bridge*`, `electron/showhow/companionStepCapture*`, `src/lib/showhow/browserCompanion*`, `src/lib/showhow/companion/**`, `scripts/build-browser-companion.mjs`, `scripts/check-bridge-bundle.mjs`, and the browser-companion source folder.

**Explicit stable-retarget ownership:** the preceding original patterns/deletions remain; the following narrow paths are also owned for the stated stable port, including the five previously approved additions.

- Prior approved native/export/build additions: `crates/compositor/src/pipeline_macos.rs`, `scripts/verify-showhow-export.mjs`, `scripts/verify-showhow-export.node-test.mjs`, `docs/testing/verification-recipe.md`, `.github/workflows/build.yml`.
- Policy/research/plan corrections: `PLAN.md`, `UPSTREAM.md`, `AGENTS.md`, `.agents/CONTEXT.md`, `.agents/HANDOFF.md`, `.agents/decisions.md`, `docs/research/2026-10-16-openscreen-v2.0.0-seam-assessment.md`, `docs/research/2026-10-12-openscreen-v2-assessment.md`, `config/branding-allowlist.json`, `config/upstream-branding-allowlist.json`. Preserve prior decisions/notes as history; append corrections.
- Explicit stable identity, persistence, wrapper/API wiring and same-package verification paths: `electron/windows.ts`, `electron/electron-env.d.ts`, `src/native/contracts.ts`, `src/lib/recordingSession.ts`, `src/lib/recordingSession.test.ts`, `src/lib/projectFilePolicy.ts`, `src/lib/projectFilePolicy.test.ts`, `src/components/video-editor/types.ts`, `src/components/video-editor/projectPersistence.ts`, `src/components/video-editor/projectPersistence.test.ts`, `electron/ai-edition/document-service.ts`, `electron/ai-edition/document-service.test.ts`, `src/components/ai-edition/recordingImport.ts`, `src/components/ai-edition/recordingImport.test.ts`, `src/components/ai-edition/importProjectFile.test.ts`, `src/components/ai-edition/EditorEmptyState.tsx`, `src/components/ai-edition/ExportDialog.tsx`, `src/components/ai-edition/ProviderSettings.tsx`, `src/components/ai-edition/ProviderSettings.test.tsx`, `src/components/ai-edition/v4/EditorTopBar.tsx`, `src/components/ai-edition/v4/EditorTopBar.test.tsx`, `src/components/ai-edition/v4/EditorTopBar.stylePresets.test.tsx`, `src/index.css`, `src/main.tsx`, `src/hooks/useTheme.ts`, `src/lib/userPreferences.ts`, `src/lib/customFonts.ts`, `src/lib/customFonts.test.ts`, `src/contexts/I18nContext.tsx`, `src/contexts/I18nContext.test.tsx`, `src/i18n/config.ts`, `src/i18n/__tests__/visibleBrandTranslations.test.ts`, `src/lib/cursor/cursorThemes.ts`, `src/lib/cursor/cursorThemes.test.ts`, `src/hooks/useScreenRecorder.ts`, `src/hooks/useScreenRecorder.test.ts`, `src/hooks/useScreenRecorder.nativeMacStartWarning.test.tsx`, `electron/ipc/handlers.test.ts`, `electron/ipc/showhowMacStepCaptureReason.test.ts`, `electron/ipc/showhowRegenerateDoc.test.ts`, `electron/about.ts`, `electron/star-prompt.ts`, `electron/update-checker.ts`, `electron/update-checker.test.ts`, `package-lock.json`, `biome.json`, `.gitignore`, `vitest.config.ts`, `vitest.browser.config.ts`, `scripts/i18n-check.mjs`, `scripts/i18n-check.test.mjs`, `scripts/before-pack.cjs`, `scripts/before-pack.test.mjs`, `scripts/generate-third-party-licenses.mjs`, `scripts/generate-third-party-licenses.test.mjs`, `THIRD-PARTY-NOTICES.md`. Identity-only UI edits, public seam adapters and tests; no upstream component restructure or unrelated feature port.
- `biome.json`, `vitest.config.ts` and `vitest.browser.config.ts` are limited to required stable integration, formatting and generated/immutable-artifact handling. Preserve enabled lint rules and required source/unit/browser/native checks. Do not disable rules, ignore required checks, widen application exclusions or reduce assertion/suite coverage to obtain GREEN.
- Conditional helper compatibility only: `electron/native-bridge/helperIdentity.ts`, `electron/native-bridge/helperIdentity.test.ts`, `electron/native-bridge/screen/macScreenAccess.ts`, `electron/native-bridge/screen/macScreenAccess.test.ts`, `electron/native-bridge/cursor/recording/macNativeCursorRecordingSession.ts`, `electron/native-bridge/cursor/recording/macNativeCursorRecordingSession.test.ts`. Edit only if preserved Showhow helper-name/override regression fixtures show stable discovery drops a supported read; use mapped fallback reads. Otherwise leave these paths unchanged. Keep stable Swift targets/core/helper sources and internal names; no cghidEventTap change or broad RC native overlay. Any further path needs a concrete scope return.

**Requirements:**
- R2.1 After the approved preservation/reconstruction, a real merge commit contains upstream stable `eff86dcba48fac490a0e153141bf8537df7ffc54` as its release parent. `git merge-base --is-ancestor refs/tags/upstream/v2.0.0 HEAD` exits0 after that commit exists; MERGE_HEAD alone is not proof. No final2.1wait remains because the selected stable tag already exists.
- R2.2 Identity: `appId`, `productName`, app icon, user-visible app name and window titles are Showhow's. User-visible "OpenScreen" strings in the locale set actually shipped by the stable-derived app are replaced; record the locale inventory; `npm run branding:check` passes. Internal identifiers follow the confirmed rule; each one kept or renamed is listed in `upstream-touchpoints.md` with its role (persisted, IPC, helper discovery, user-visible).
- R2.3 The Showhow layer works on v2: recordings save a bundle per `docs/architecture/showhow-bundles.md` (video, `<video path>.cursor.json`, `meta.json`, `transcript.txt`, `steps.json`, `steps.md`, `screenshots/`; empty-step/no-audio/failure cases follow the bundle contract); the library is the home window and lists bundles; workflow documents generate as on `fc50566a`; the media protocol serves bundle files.
- R2.4 Transcription keeps working with today's Whisper-tiny renderer pipeline (replaced in Task 3).
- R2.5 The v2 editor replaces the inherited editor. Opening a bundle from the library opens it in the v2 editor.
- R2.6 Upstream screens (editor, HUD, recorder) use Showhow tokens for colour, type (Inter Tight) and radius through upstream's CSS variables; no upstream component is restructured. Showhow-owned screens keep their current look.
- R2.7 Legacy cases L1–L5 pass, using fixtures in `tests/fixtures/legacy/` made with the `fc50566a` build.
- R2.8 Browser companion and17Sweezy packs are absent from source/package. Preserve stable five named original packs plus built-in default and safe unknown-theme fallback. Ship the accurately updated checked-in `THIRD-PARTY-NOTICES.md` and `NOTICE.md`. Selectively adapt the pinned RC npm/Rust licence-text generator and its actual same-package `.test.mjs` into stable, wire `licenses:generate`, beforePack presence/freshness guard and packaged `build-licenses/THIRD-PARTY-LICENSES.txt`; verify resolved stable dependency texts and native source/licence obligations. This is an explicit narrow backport: stable has no such generator, and notices must not be called generated.
- R2.9 Upstream CLI and MCP are not reachable from Showhow's UI and MCP is off by default.
**Interfaces:** Consumes upstream's recording, editor and document APIs. Produces the same bundle layout and `showhow:*` IPC channels the library and workflow code use today (minus companion channels).
**Constraints and reasons:**
- Do not change `appId` or `productName`: macOS TCC grants and userData depend on them.
- A bundle or transcript failure must never discard a valid recording (AGENTS.md).
- Legacy files are never overwritten on open (AGENTS.md compatibility constraints).
- Keep edits to upstream files minimal and listed, because every later release merge pays for them.
- Before replacing the pending RC merge, archive/extract/hash-verify the current staged/unstaged/untracked source, raw index/merge metadata, ignored native/generated payloads, package and both owner sessions. Follow the same-lane reconstruction protocol below; no blind reset/abort/clean, no RC tree overlay. Stable already exists; remove the superseded final2.1wait only through this approved plan/policy update.
- Carry only the selected received-frame CPU-presenter correction/tests in `pipeline_macos.rs`; stable has the same decoder gap. Do not import RC cancellation, click-sound, updater, glossary or capture-helper changes unrelated to R2.2–R2.9/L1–L5.
- Future GitHub landing requires an ancestry-preserving MERGE COMMIT, never squash/rebase, and a separate exact-PR/head owner yes; coordinator verifies stable tag ancestry on main. No release tag until milestone completion.

- [ ] RED: with fixtures made from `fc50566a`, new tests for L1–L5 and a bundle-save test at the v2 recording seam fail on the branch after the raw upstream merge (before the Showhow layer is ported).
- [ ] Merge, re-apply identity, port the layer, delete the companion and Sweezy packs, apply theming, write `upstream-touchpoints.md`.
- [ ] GREEN: L1–L5 and the bundle tests pass; the existing Showhow-layer unit and browser tests pass (minus deleted companion tests).
- [ ] Prove and obtain independent review, then open the PR to main.

**Verification:**
- `git merge-base --is-ancestor refs/tags/upstream/v2.0.0 HEAD`: exit 0.
- `npm run lint`, `npx tsc --noEmit`, `npm run test`, `npm run test:browser`, `npm run i18n:check`, `npm run branding:check`: pass.
- `npm run verify:export -- --evidence-dir artifacts/verification-recipe/<new-dir>` against the exact rebuilt stable-derived package in fresh isolated scratch roots; retain the approved pre-main OS/Electron path isolation, native export controls, full decode/palette and owned cleanup assertions. Record stable locator or bounded setup adaptations in `implementation-notes.md`; real repository command PASS is required, not support tests alone.
- Manual macOS arm64 smoke test on a packaged build, with screenshots: first launch on a copied `fc50566a` profile (L4); library lists old bundles (L3); a new narrated recording saves a full bundle (L5, R2.3); the bundle opens in the v2 editor (R2.5); old `.showhow` and `.openscreen` projects open (L1, L2); HUD and editor show Showhow theming (R2.6).
- `grep -rli sweezy public src electron` finds nothing; the packaged `Resources` has no companion or Sweezy files.
**DONE WHEN:** the six verification items above pass and their evidence (command output, screenshots, file hashes for L1/L2) is in the PR; `upstream-touchpoints.md` lists each edited upstream file; the PR states Windows and Linux as untested; actual stable2.0ancestry, refreshed candidate-bound source/native/build/packaged evidence and fresh separate Standards/Requirements PASS are present before Ship; the eventual merge has a separate owner gate and preserves ancestry.
**Outside cases / follow-ups:** redesigned V1 screens; ChatGPT/OpenRouter connections in Showhow's provider boundary; native Windows/Linux runtime acceptance; new model port/size trim; arbitrary recipe weakening or paths beyond the explicitly approved adaptation.

### Task 3: Bundle transcripts from v2's native engine with a bundled model

**Priority:** no
**Labels:** feature
**Milestone:** Move onto upstream v2
**Depends on:** Task 2 (#116)
**Files:** `electron/showhow/**` (transcript job), `src/lib/showhow/generateTranscript.ts`, `src/lib/showhow/transcriptFormat.ts`, `src/lib/captioning/**` (remove only obsolete renderer-tiny files if present; preserve stable native-captioning utilities and UI), actual selected `src/lib/showhow/whisperTiny/**` (remove the Showhow renderer-tiny implementation), `src/components/showhow/BundleTranscript.tsx` and its same-package test (retire/wire the renderer consumer), `vite.config.ts` (remove only the obsolete tiny worker/alias wiring), `electron/stt/modelManager.ts`, `electron/stt/modelManager.test.ts` (coherent bundled-base/local-VAD resolution and ensure/digest checks, preserving fixed small/VAD APIs), `scripts/fetch-caption-model.mjs` (replaced by a pinned whisper.cpp model fetch), `electron-builder.json5`, `package.json`, `THIRD-PARTY-NOTICES.md` and the selected licence-generation inputs, `docs/architecture/showhow-bundles.md`, `docs/architecture/upstream-touchpoints.md`, `implementation-notes.md`
**Requirements:**
- R3.1 A new recording's `transcript.txt` is produced by v2's whisper.cpp engine using the bundled `base` multilingual quantised model, with no network access needed, including a local VAD when required by the selected native path.
- R3.2 `transcript.txt` keeps today's timestamped line format; existing `transcriptFormat` tests pass unchanged.
- R3.3 Fail-open: when transcription fails (cases: model file missing, engine error, zero-length audio), `transcript.txt` contains `(transcription failed)` and the recording and bundle stay intact.
- R3.4 The model is fetched at build time from a pinned Hugging Face revision with its SHA-256 checked; its licence is recorded in the third-party notices.
- R3.5 `@xenova/transformers`, `onnxruntime-web` and the `caption-assets` Whisper-tiny files are gone from `package.json` and the packaged app.
- R3.6 Bundled base is the default for Showhow bundle jobs; preserve stable fixed small-q8/VAD download/cache support and optional CTC behaviour for existing consumers. Stable has no general model catalogue/selection UI: do not add one or claim one exists. Resolve local VAD and ensure/digest checks without a required first-use download for the bundled offline path. Optional CTC acquisition must not block offline bundle transcription.
**Interfaces:** The bundle save path requests a transcript job; the job writes `transcript.txt` through the existing `showhow:write-transcript` contract or its main-process equivalent.
**Constraints and reasons:** Keep changes at coherent model-path/ensure and bundle-job seams. Stable prepare() ensures whisper and VAD before modelPaths; overriding a filename after ensure is insufficient. Stable helper hard-codes WHISPER_AHEADS_SMALL. Native compatibility is a Build question, not a source-only failure verdict.
**Conditional exact additional ownership:** `electron/stt/index.ts` and `electron/stt/index.test.ts` only if the offline bundle-job mode/optional aligner preparation cannot be expressed through the existing model-manager interface; `electron/stt/whisperServer.ts` and `electron/stt/whisperServer.test.ts` only for passing that bounded model/DTW mode to the existing helper; `electron/native/whisper-stt/src/main.cpp` only for base/small model-aware DTW initialisation if pinned native API/RED demonstrates the fixed SMALL preset needs correction; `scripts/test-whisper-stt.mjs` for same-helper base/small/offline regression. No native model catalogue, new server protocol, glossary or broad STT rewrite. If these conditions do not arise, leave the paths unchanged; further paths need a new concrete scope preview.

- [ ] RED: a test at the transcript-job seam expects the native engine and the bundled model path and fails; a fail-open test for the three named failure cases fails or is absent.
- [ ] Wire the job to `electron/stt/`, bundle the pinned model, remove the old stack.
- [ ] GREEN: the new tests and existing `transcriptFormat` tests pass.
- [ ] Prove and obtain independent review, then open the PR to main.

**Verification:** `npm run lint`, `npx tsc --noEmit`, `npm run test`, `npm run test:browser`; `node scripts/check-package-contents.mjs <app>` shows no `@xenova`/`onnxruntime-web`; manual macOS smoke test with Wi-Fi off: a narrated 30-second recording produces a timestamped `transcript.txt`; with the model file renamed, a recording still saves and `transcript.txt` says `(transcription failed)`.
**Additional bounded native verification:** exercise bundled base and existing small with the actual helper; when a conditional model/DTW change is required, its same-package test and `scripts/test-whisper-stt.mjs` cover both model modes. Offline preparation must use local VAD without waiting for optional network alignment. Retain missing-model/engine-error/zero-audio fail-open receipts.
**DONE WHEN:** the source/browser/package/offline verification plus the named conditional native cases pass with evidence in the PR (transcript excerpt, failure-case transcript, package report, pinned revision and hashes for the bundled base/local VAD).
**Outside cases / follow-ups:** transcript glossary (upstream `13db77e5`); word-level alignment use in guides.

### Task 4: Re-apply the size trim to the v2 build

**Priority:** no
**Labels:** feature
**Milestone:** Move onto upstream v2
**Depends on:** Task 3 (#117)
**Files:** `electron-builder.json5`, `vite.config.ts` (only if needed), `scripts/check-package-contents.mjs`, `scripts/check-package-contents.node-test.mjs`, `scripts/fixtures/package-contents/**`, `package.json` (scripts only), `implementation-notes.md`
**Requirements:**
- R4.1 Record the untrimmed stable-v2.0-derived, post-#117 installed size and arm64 DMG size at Task 3's merge commit before changing anything.
- R4.2 The packaged app's `app.asar` and `app.asar.unpacked` contain only the `node_modules` packages the built main process loads at runtime; the audit's allow-list names each one with the reason.
- R4.3 Chromium language packs are limited to the app locale set recorded from the stable-derived build plus required `en` and `en-GB`; wallpapers ship once; unreferenced `public/` images are excluded (same rules as Task 1 of the size plan, #110).
- R4.4 Installed macOS arm64 size ≤ 400 MB, model included.
- R4.5 No regression on these named packaged-app paths: launch to library, native recording saves a bundle, offline transcript, v2 editor opens with a wallpaper background, `npm run verify:export` passes.
**Interfaces:** `node scripts/check-package-contents.mjs <app-path> --budget-mb 400`.
**Constraints and reasons:** Packaging config only; do not move dependencies between `dependencies` and `devDependencies`, so upstream merges of `package.json` stay simple. Native addons (`compositor_view.node`, ONNX Runtime) stay unpacked.

- [ ] RED: the audit on the untrimmed v2 app exits 1 against the 400 MB budget and the new allow-list.
- [ ] Apply the packaging changes.
- [ ] GREEN: the audit exits 0; the node test passes with an added case for an allow-listed native addon.
- [ ] Prove and obtain independent review, then open the PR to main.

**Verification:** `node --test scripts/check-package-contents.node-test.mjs`; `npm run check:package` before (exit 1) and after (exit 0); DMG and installed sizes before and after in the PR; the R4.5 paths on the packaged build with screenshots or log lines.
**DONE WHEN:** the after build is ≤ 400 MB installed and the audit exits 0; the R4.5 paths are evidenced; before and after sizes are in the PR; Windows and Linux are stated as untested.
**Outside cases / follow-ups:** dropping the webcam segmentation ONNX Runtime if Showhow doesn't use it; Windows and Linux size checks.

## Superseded issues
None closed or reopened by this plan. The three held macOS recorder patches (`29736d4d`, `f261fa45`, `52eda0e6`) were never filed as issues. The earlier covered-by-v2 disposition was RC-era planning history, not demonstrated stable-v2.0.0 coverage. These commits are not stable ancestors and the inspected microphone-selection/first-frame timing/failed-start cleanup/restart-message symbols are absent in stable. Neither fact alone proves a native failure or semantic noncoverage. Keep the three patches held for later re-triage; do not import them automatically. Only a failure of a named #116 R2.3 recording-save/fail-open or L5 sidecar/editor-read acceptance case can justify assessing a minimal scoped repair. Preserve stable helpers and the no-overlay rule; if the necessary repair exceeds named ownership, return its exact source/test paths and reproduction for approval. This adds no no-input/restart test or other new acceptance gate. Issues #54–#63 stay open and parked for re-triage after the milestone.

## Self-review
Unbounded-word scan of requirements and DONE WHEN: "every later upstream merge" (Task 1 interfaces) and "every later release merge" (Task 2 constraints) are reasons, not acceptance. "Each upstream release tag" in R1 is bounded by the policy's tag rule. "Each one kept or renamed" (R2.2) and "each edited upstream file" (Task 2 DONE WHEN) are bounded by the diff against selected stable `v2.0.0`. "All", "any" and "valid" do not appear in acceptance; "each one" in R4.2 is bounded by the audit allow-list.

## Implementation notes
Append each deviation from this plan to `implementation-notes.md` under "Deviations": what changed, why and what was done instead. Commit it with the ticket. Path-scope checks treat it as an owned path.

## Stable-retarget self-review and approval boundary

Requirements and DONE WHEN were scanned for every/all/any/valid. Valid recordings are bounded to the existing recording/save failure cases and L1–L5; all files means the named archive manifest or shipped locale/payload inventory, not arbitrary files. R4.2 runtime dependencies are the measured built-main allow-list. Existing visual/priority decisions are reused. No new product assumption question: owner settled2.0. This full external draft and exact GitHub update/move/metadata payloads need final plan/publication approval before implementation or external writes. No additional plan PR or issue is created automatically.

# Showhow AI guide Plan

## Goal
The owner records, presses **Make guide** in the library, and gets a titled, step-by-step guide: one step per meaningful click, each with a short imperative instruction, its screenshot and a timestamp that jumps the player. The guide is saved in the bundle (`steps.json`, `steps.md`, `meta.json` title) and is the source for Copy for agent and PDF export later.

## Context and decisions
- Built on `main` after #116 (PR #121, merged 2026-10-17 on stable upstream `v2.0.0`). Checked on `main` on 2026-10-17: `electron/showhow/bundle.ts`, `electron/ipc/handlers.ts`, `src/lib/showhow/workflowDocument.ts`, `src/components/showhow/GuideStep.tsx`, `src/components/library/RecordingLibrary.tsx`, `electron/ai-edition/provider-registry.ts`, `llm-config-store.ts`, `llm-provider-auth.ts` and `deep-agent/chat-model.ts` all exist there.
- Existing pieces to build on, not replace: the deterministic doc engine (`buildSteps`, `renderStepsMarkdown`, `serializeStepsJson`, `regenerateDocArtifacts`, `updateWorkflowDocument` in `bundle.ts`; IPC `showhow:regenerate-doc` and `showhow:update-workflow-document`); `WorkflowDocumentUpdate` (title, step label, delete step); upstream's LangChain chat-model factory in `electron/ai-edition/deep-agent/chat-model.ts` and its API-key store.
- Upstream fact (stable `v2.0.0` on `main`, and `v2.1.0-rc.4`): providers are API-key only. ChatGPT and Copilot OAuth were removed in 1.8.0; upstream's code says ChatGPT returns later through the user's own `codex login` via `codex app-server`.
- Locked frames: `design/mocks/2026-10-15-house-style/pen-final/` Library-06, 08, 09, 10, 11, 16, 19 and 28. They are the approved mock; no new prototype.
- Earlier decisions reused: AI is in V1 behind an optional connection (2026-10-15); "Check what gets sent" shows the first time per provider only (2026-10-15); Remake keeps the previous guide until the new one succeeds (2026-10-12); a documentation failure never loses a recording (AGENTS.md).
- Owner answers, shaping session 2026-10-17:
  1. V1 connects through OpenRouter only. ChatGPT sign-in is a later ticket.
  2. Default model: a Gemini Flash model on OpenRouter. The build pins the current Flash slug after checking OpenRouter's model list, and records it in `implementation-notes.md`.
  3. Priority: no.
- Confirmed assumptions (owner sign-off 2026-10-17):
  - A. Library-19 keeps the ChatGPT row, disabled with a "Coming later" tag; OpenRouter is the only active row. The AI CONNECTIONS settings tab shows only OpenRouter in V1. Upstream's own provider dialog in the editor is left as upstream ships it.
  - B. Narration-only guide (Library-16, no clicks): steps come from transcript lines; each step's `ts` is a real transcript segment start, and its screenshot is the video frame at that time, extracted locally.
  - C. No speech found (Library-28): the guide is still made from clicks and screenshots only, with the designed notice. It is not blocked.
  - D. Remake shows the Library-11 confirm only when the title or a step was edited or deleted since the last AI pass; otherwise it runs straight away.
  - E. The AI guide overwrites `steps.json` and `steps.md`; the deterministic steps are kept as `steps.deterministic.json` so a failed pass or a Remake can start from them.
  - F. Retry on "guide failed" re-runs the AI pass without showing the review again.
  - Defaults: frames downscaled to 1024 px on the long edge as JPEG; one frame per step selected by default, capped at 20 (spread evenly above 20); structured JSON output; progress lines follow real phases; unit tests use a fake model.

## Bounded requirements
- Platform for acceptance: macOS 13+ on arm64. Windows and Linux are untested and reported so.
- Provider: OpenRouter with an API key, through upstream's existing config store. No second key store.
- Data leaves the Mac only when (1) an OpenRouter key is saved and (2) the review for OpenRouter has been accepted once. What is sent is limited to what the review shows: the transcript (if its toggle is on), the selected frames, the deterministic step labels and timestamps.
- AI output rules (enforced by a validator, not by trusting the model): each output step lists one or more `sourceIds` drawn from the input steps; unknown or duplicate ids are rejected; output order follows the earliest source `ts`; a merged step takes the `ts`, `coords` and `screenshot` of its earliest source; `redaction` and `includeRevealedText` carry over from the sources (true if any source is true); the label is trimmed and limited to 120 characters; the title is limited to 80 characters. Zero valid steps counts as a failure.
- Supported cases for acceptance: (C1) narrated recording with clicks; (C2) clicks, no speech; (C3) narration, no clicks; (C4) no OpenRouter key; (C5) provider error (forced with an invalid key or a fake model that throws); (C6) Remake with hand edits; (C7) Remake without hand edits.
- Excluded: ChatGPT sign-in, other providers in Showhow's UI, the agent brief, Copy for agent, PDF export, the editor's AI assistant, cost display, streaming partial steps.

## Architecture
- `electron/showhow/aiGuide.ts` (new): pure functions plus one injected model seam.
  - `buildGuideRequest({ steps, segments, frames, options })` → the prompt messages and the list of what gets sent (used by both the review sheet and the request).
  - `parseGuideResponse(raw, inputSteps)` → `{ title, steps: Step[] }` or a typed error; applies the output rules above.
  - `runAiGuide(bundleDir, { model, onPhase })` → reads the bundle, writes `steps.deterministic.json` if absent, calls the model, validates, writes `steps.json`, `steps.md` and the `meta.json` title atomically (the same tmp-and-rename pattern as `updateWorkflowDocument`), and marks the guide state. On any error it restores the deterministic steps and reports `failed`. The model is passed in, so tests use a fake.
  - Narration-only steps: `Step` gains optional `kind?: "click" | "narration"` (absent means click). Narration steps carry `coords: { cx: 0, cy: 0 }`, which `GuideStep` ignores for `kind: "narration"`. Frames come from the existing frame extractor at the segment start.
- `ShowhowMeta` gains optional `guide?: { status: "none" | "making" | "ready" | "failed"; provider: "openrouter"; model: string; madeAt?: number; editedSinceAi: boolean; error?: string }`. Older bundles without it read as `none`. `updateWorkflowDocument` sets `editedSinceAi: true` when it changes a title or step on a `ready` guide.
- Consent: `electron/showhow/aiGuideConsent.ts` (new) stores `{ openrouter: { reviewedAt, alwaysSend } }` under Showhow's preferences (Showhow key name; there is no legacy key).
- IPC (in `electron/ipc/handlers.ts`, the existing Showhow block): `showhow:ai-guide-status`, `showhow:ai-guide-preview` (what gets sent), `showhow:ai-guide-run` (progress events `transcript` → `sorting` → `writing`), `showhow:ai-guide-consent`. Paths are checked against the recordings root as the existing handlers do.
- Renderer: `src/lib/showhow/aiGuide.ts` (state machine for the library guide panel) and `src/components/showhow/` sheets for Library-08, 09, 10, 11, 19; Library-06, 16 and 28 extend the guide view in `RecordingLibrary.tsx` and `GuideStep.tsx`. AI CONNECTIONS is a Showhow settings tab that reads and writes upstream's config store for `openrouter` only.
- Upstream touchpoints: none expected beyond calling upstream's chat-model factory and the config store's existing IPC. If one is needed, it is listed in `docs/architecture/upstream-touchpoints.md`.

## Milestones
None. One ticket, after #116. Published 2026-10-17: Task 1 = #122.

### Task 1: Make guide with an AI pass over the deterministic steps

**Priority:** no (owner answer, 2026-10-17)
**Labels:** feature, ui
**Milestone:** none
**Depends on:** #116 merged to `main`. Do not start before it lands. Can run alongside #117 and #118 (it only reads `transcript.txt`, whose format #117 keeps).
**Files:** `electron/showhow/aiGuide.ts`, `electron/showhow/aiGuide.test.ts`, `electron/showhow/aiGuideConsent.ts`, `electron/showhow/aiGuideConsent.test.ts`, `electron/showhow/bundle.ts`, `electron/showhow/bundle.test.ts`, `electron/ipc/handlers.ts` (Showhow block only), `electron/preload.ts` (Showhow API only), `src/lib/showhow/aiGuide.ts`, `src/lib/showhow/aiGuide.test.ts`, `src/lib/showhow/workflowDocument.ts`, `src/components/showhow/` (new guide sheets and tests), `src/components/library/RecordingLibrary.tsx` and its tests, the Showhow settings view for the AI CONNECTIONS tab, `src/i18n/locales/*/` (new Showhow keys), `docs/architecture/showhow-bundles.md`, `docs/architecture/upstream-touchpoints.md` (only if a touchpoint is added), `implementation-notes.md`
**Requirements:**
- R1 Make guide on a bundle with an OpenRouter key and accepted review runs the AI pass and shows Library-09 progress, then Library-06 (or Library-16 for C3, or Library-06 with the Library-28 notice for C2).
- R2 Without an OpenRouter key, Make guide shows Library-19 and sends nothing (C4).
- R3 The first Make guide after connecting shows Library-08 with the transcript word count, the selected frames and the provider. Cancel sends nothing. Make guide records consent for OpenRouter; later runs skip the sheet.
- R4 A provider or validation error leaves `steps.json`/`steps.md` equal to the deterministic steps, keeps the video and transcript unchanged, and shows Library-10 with Retry (C5). Retry runs without the review.
- R5 Remake with `editedSinceAi: true` shows Library-11; Cancel changes nothing; confirm re-runs from `steps.deterministic.json` (C6). Without edits, Remake runs straight away (C7). The previous guide stays on disk until the new one validates.
- R6 After an AI guide, the existing title edit, step label edit and delete step work and persist, and timestamps jump the player.
- R7 AI CONNECTIONS tab: save, replace and remove an OpenRouter key; shows the default model and allows changing the model slug. Writes go through upstream's config store.
**Interfaces:** Consumes `steps.json`, `transcript.txt`, `screenshots/`, `meta.json`, upstream's config store and model factory. Produces `steps.json`, `steps.md`, `steps.deterministic.json`, the `meta.json` title and `guide` field. Read later by Copy for agent and PDF export.
**Constraints and reasons:** No network in tests (CI must stay offline and free). Never send before key and consent (V1 local-first rule). Showhow code stays in Showhow directories (upstream release merges). Fail open (a guide error must never cost a recording). Do not restructure upstream editor, HUD or recorder components.

- [ ] RED: `electron/showhow/aiGuide.test.ts` fails for: a merge of steps 2–3 keeps step 2's `ts` and `screenshot`; an unknown `sourceId` is rejected; zero steps is a failure; a redacted source keeps the merged step redacted; narration-only input yields `kind: "narration"` steps at segment starts; a throwing fake model leaves `steps.json` byte-equal to the deterministic file.
- [ ] Implement the bounded behaviour.
- [ ] GREEN: those cases pass; consent tests (no send before key, no send before consent, consent per provider) pass; renderer state-machine tests cover C1–C7; existing `bundle.test.ts` and `workflowDocument` tests still pass.
- [ ] Prove and obtain independent review, then open the PR to main.

**Verification:** `npx vitest run electron/showhow src/lib/showhow src/components/showhow src/components/library`; `npm run test`; `npm run test:browser`; `npx tsc --noEmit`; `npm run lint`; `npm run i18n:check`; `npm run branding:check`. Manual macOS arm64 smoke test on a dev build with a real OpenRouter key: C1 on a real narrated recording, C2, C3, C4 and C5, with screenshots of each library state saved to `~/dev/loop-evidence/showhow-<issue>/`.
**DONE WHEN:**
- C1: a real narrated recording produces a titled guide with instruction-style steps, screenshots and working timestamp jumps, saved in `steps.json`, `steps.md` and `meta.json`.
- C2, C3, C4 and C5 each show their designed state (Library-28 notice, 16, 19, 10), and in each case the video, `transcript.txt` and the deterministic steps are intact on disk.
- C6 and C7 behave as R5; title edit, label edit and delete step work after an AI guide.
- The unit cases in RED pass with no network; CI is green.
- Screenshots of Library-06, 08, 09, 10, 11, 16, 19 and the 28 notice from the smoke test are in the evidence folder.
**Outside cases / follow-ups:** ChatGPT sign-in through `codex app-server`; Claude, OpenAI, Gemini and Mistral rows in Showhow's UI; cost estimates; per-frame picking beyond the review's selection; agent brief and Copy for agent; PDF export; Windows and Linux smoke tests.

**Merge note:** PR #121 also edits `PLAN.md`. This section is appended at the end of the file; expect a small conflict when #116 lands and resolve it then by keeping both sections.

## Superseded issues
None.

## Self-review
Unbounded-word scan of requirements and DONE WHEN: "any source is true" (output rules) is bounded to the merged step's own sources. "Each step" and "each case" refer to the named C1–C7 cases and the steps of one guide. "All", "every" and "valid" do not appear in acceptance; "valid steps" in the output rules means steps that pass the named validator rules.

# Showhow Connect ChatGPT Plan

## Goal
The owner makes guides with their ChatGPT subscription (GPT-6 Luna by default) through their own Codex login, at no extra cost. OpenRouter with Claude Haiku 5.5 stays as the pay-per-guide alternative. Applies to Make guide only.

## Context and decisions
- Builds on #122 (PR #126): the AI pass in `electron/showhow/aiGuide.ts` takes an injected `model(messages) => Promise<string>` seam, a validator (`parseGuideResponse`), per-provider consent (`electron/showhow/aiGuideConsent.ts`), and the guide UI (`src/components/showhow/AiGuidePanel.tsx`, `AiGuideSheets.tsx`, `AiConnections.tsx`, `AiGuideSettings.tsx`). This ticket adds a second provider behind the same seam.
- Evidence checked on 2026-10-17 on the owner's Mac, read-only, no inference:
  - Codex CLI `0.163.0` at `~/.npm-global/bin/codex` (npm package `@openai/codex`).
  - `codex app-server` (stdio JSON-RPC) answers `initialize`, `account/read` (`type: chatgpt`, `planType: prolite`) and `model/list` (`gpt-6.1-sol` default; also `gpt-6-luna`, `gpt-6-astra`, `gpt-6-sol`, `gpt-5.6-*`, each with `inputModalities: text, image`).
  - Protocol methods include `account/login/start`, `account/login/cancel`, `account/rateLimits/read`, `thread/start` (`ephemeral`, `sandbox`, `approvalPolicy`, `developerInstructions`, `config`, `model`) and `turn/start` (`input` with `text`, `image` and `localImage` items, `outputSchema`, `effort`, `sandboxPolicy`). Schema generated with `codex app-server generate-json-schema`.
  - Upstream's own code says ChatGPT returns through the user's own `codex login` via `codex app-server`, so no OpenAI client ID ships.
- Approved mock: `design/mocks/2026-10-17-chatgpt-connect/` (`index.html`, `SPEC.md`, `shots/state-a..e.png`). States: A connect with Codex signed in, B Codex signed out, C Codex not installed, D AI CONNECTIONS with "Use for guides", E guide failed on ChatGPT. Owner approved 2026-10-17.
- Owner answers, shaping session 2026-10-17:
  1. Connect ChatGPT: one click when Codex is signed in; start ChatGPT sign-in through Codex (browser) when signed out; show "Install Codex first" with the install command when Codex is missing.
  2. ChatGPT is used first; AI CONNECTIONS has a "Use for guides" choice (ChatGPT / OpenRouter).
  3. A ChatGPT failure shows the failed state with the reason and a "Try with OpenRouter" button. Showhow never switches provider by itself.
  4. Make guide only. The editor's AI assistant keeps upstream's provider settings.
  5. Priority: no.
  6. OpenRouter default stays `anthropic/claude-haiku-5.5`; no model bake-off.
- Confirmed assumptions (owner sign-off 2026-10-17):
  - A. Guide runs are isolated from the owner's Codex setup: per-run overrides switch off hooks, MCP servers, plugins and skills; the turn has no tools, a read-only sandbox and approval policy `never`.
  - B. Guide threads are ephemeral and do not appear in Codex history.
  - C. Guides count against the same ChatGPT/Codex limits as the owner's coding work. Settings shows usage from `account/rateLimits/read`; a limit error shows state E.
  - D. Showhow never stores ChatGPT tokens. Disconnect stops Showhow using ChatGPT and does not sign Codex out.
  - E. Sign-in from state B signs Codex in globally (same Codex as the terminal).
  - F. Minimum Codex version `0.163.0`; an older one shows state C's layout with "Update Codex" wording.
  - G. The mock is the visual reference; Library-19's ChatGPT row becomes active.
  - Defaults: `codex app-server` starts on demand for a guide run or a settings check and stops after; Codex is found on PATH plus `~/.npm-global/bin`, `/opt/homebrew/bin`, `/usr/local/bin`; default model `gpt-6-luna` with effort `low`; the settings model list is Codex's `model/list` filtered to image-capable models; same prompt, validator and review sheet as #122; unit tests use a fake app-server.

## Bounded requirements
- Platform for acceptance: macOS 13+ arm64. Windows and Linux untested and reported so.
- Supported Codex: CLI `0.163.0` or newer, found at one of the named locations. Other install locations are a follow-up.
- Supported cases: (K1) Codex signed in, connect, make a guide with `gpt-6-luna`; (K2) Codex signed out, sign in from Showhow, then make a guide; (K3) Codex not installed, state C, then install and Check again; (K4) Codex older than `0.163.0`, "Update Codex" variant; (K5) ChatGPT error (usage limit, signed out mid-run, app-server crash or timeout) shows state E with the reason, deterministic steps intact, and "Try with OpenRouter" when OpenRouter is connected (hidden otherwise); (K6) "Use for guides" switches provider, and the first run on a provider shows its own review; (K7) Disconnect ChatGPT leaves Codex signed in (`account/read` still reports the account).
- Data sent through ChatGPT equals what the review sheet lists (transcript if on, selected frames, step labels and times), as in #122.
- Excluded: editor AI assistant, bundling Codex, ChatGPT for the agent brief, automatic fallback, non-macOS checks.

## Architecture
- `electron/showhow/codexProvider.ts` (new): owns the app-server process and protocol.
  - `findCodex()` → `{ path, version } | { missing } | { tooOld, version }`.
  - `codexStatus()` → `account/read` + `account/rateLimits/read` summary (signed in, plan, usage), never tokens.
  - `startCodexSignIn()` / `cancelCodexSignIn()` → `account/login/start` / `account/login/cancel`, resolving on `account/login/completed`.
  - `listCodexModels()` → image-capable models from `model/list`.
  - `codexGuideModel({ model, effort })` → a `model(messages)` function for `runAiGuide`: starts an ephemeral thread (`sandbox` read-only, `approvalPolicy: never`, config overrides disabling hooks, MCP servers, plugins and skills, `developerInstructions` from the system message), sends one `turn/start` with text and `image` items (the #122 data URLs) and an `outputSchema` matching the guide JSON, collects the final agent message, and returns its text. Errors map to typed reasons: `usage-limit`, `signed-out`, `codex-missing`, `codex-too-old`, `timeout` (120 s), `crashed`.
  - The process is spawned with an explicit argument list (no shell) and killed on completion, error or app quit.
- `electron/showhow/aiGuide.ts`: `meta.guide.provider` widens to `"openrouter" | "chatgpt"`; the provider chooses the model function. No change to the validator.
- `electron/showhow/aiGuideConsent.ts`: per-provider consent and the "Use for guides" preference (Showhow preference key; ChatGPT default when connected).
- IPC (Showhow block in `electron/ipc/handlers.ts`): `showhow:codex-status`, `showhow:codex-sign-in`, `showhow:codex-sign-in-cancel`, `showhow:codex-models`, `showhow:ai-guide-provider` (get/set). The existing run handler picks the provider.
- Renderer: `AiGuideSheets.tsx` states A–C and E; `AiConnections.tsx` / `AiGuideSettings.tsx` state D; `AiGuidePanel.tsx` passes the failure reason and the "Try with OpenRouter" action.
- Upstream touchpoints: none. Upstream's provider registry and chat model are not changed.

## Milestones
None. One ticket, after #122. Published 2026-10-17: Task 1 = #128.

### Task 1: Connect ChatGPT through the owner's Codex login for Make guide

**Priority:** no (owner answer, 2026-10-17)
**Labels:** feature, ui
**Milestone:** none
**Depends on:** #122 merged to `main` (PR #126). Do not start before it lands.
**Files:** `electron/showhow/codexProvider.ts`, `electron/showhow/codexProvider.test.ts`, `electron/showhow/fixtures/fakeCodexAppServer.mjs` (test fake), `electron/showhow/aiGuide.ts`, `electron/showhow/aiGuide.test.ts`, `electron/showhow/aiGuideConsent.ts`, `electron/showhow/aiGuideConsent.test.ts`, `electron/ipc/handlers.ts` (Showhow block only), `electron/preload.ts` and `electron/electron-env.d.ts` (Showhow API only), `src/lib/showhow/aiGuide.ts`, `src/lib/showhow/aiGuide.test.ts`, `src/components/showhow/AiGuideSheets.tsx`, `src/components/showhow/AiGuidePanel.tsx`, `src/components/showhow/AiConnections.tsx`, `src/components/showhow/AiGuideSettings.tsx` and their tests, `src/i18n/locales/*/` (new Showhow keys), `docs/architecture/showhow-bundles.md`, `implementation-notes.md`
**Requirements:**
- R1 Connect sheet (Library-19) shows states A, B or C from `findCodex()` and `codexStatus()`, matching the mock's copy and controls. Connect in A records ChatGPT as connected without network calls beyond `account/read`.
- R2 State B starts sign-in through Codex, shows "Waiting for browser…" with Cancel, and reaches the connected outcome on `account/login/completed`. Cancel calls `account/login/cancel`.
- R3 State C shows `npm install -g @openai/codex` with Copy, and Check again re-runs `findCodex()`. An older Codex shows the "Update Codex" variant.
- R4 Make guide with ChatGPT runs the #122 AI pass through `codexGuideModel` with `gpt-6-luna` (or the model chosen in settings), and writes the same files and `meta.guide` with `provider: "chatgpt"`.
- R5 The guide run starts no tools, uses an ephemeral thread and disables hooks, MCP servers, plugins and skills through per-run overrides. A test asserts the exact `thread/start` and `turn/start` parameters sent to the fake.
- R6 AI CONNECTIONS (state D): both cards, model selects, ChatGPT usage line, Disconnect (Showhow only), and "Use for guides" persisted. The first guide on each provider shows that provider's review.
- R7 Failure (state E): the typed reason in plain words, deterministic steps and recording unchanged, "Retry with ChatGPT", and "Try with OpenRouter" only when OpenRouter is connected. No automatic switch.
**Interfaces:** Consumes the `codex` CLI (`app-server` over stdio) and #122's guide pipeline. Produces the same bundle files as #122. Read later by Copy for agent and PDF export.
**Constraints and reasons:** No tokens stored by Showhow (Codex owns auth). No shell when spawning Codex (argument injection). Kill the child process on every exit path (no orphaned app-servers). No network in CI (fake app-server). Fail open as in #122. Do not edit upstream AI code (release merges).

- [ ] RED: `codexProvider.test.ts` fails for: `findCodex` returns missing / too old / found for three fake install layouts; `codexGuideModel` sends `thread/start` with `ephemeral: true`, read-only sandbox, `approvalPolicy: "never"` and the disabling overrides, and `turn/start` with text plus image items and the guide `outputSchema`; a fake rate-limit error maps to `usage-limit`; a fake that never answers maps to `timeout` and the child is killed; `aiGuide.test.ts` writes `provider: "chatgpt"` and leaves `steps.json` byte-equal to the deterministic file on a thrown ChatGPT error.
- [ ] Implement the bounded behaviour.
- [ ] GREEN: those cases pass; renderer tests cover states A–E and K6/K7; #122's existing tests still pass.
- [ ] Prove and obtain independent review, then open the PR to main.

**Verification:** `npx vitest run electron/showhow src/lib/showhow src/components/showhow src/components/library`; `npm run test`; `npm run test:browser`; `npx tsc --noEmit`; `npx tsc --noEmit -p tsconfig.test.json` (the CI "Typecheck (tests)" job); `npm run lint`; `npm run i18n:check`; `npm run branding:check`. Manual macOS arm64 smoke on a dev build with the owner's real Codex login: K1 on the owner's narrated recording `2026-10-17_135232-recording` (copy in an isolated profile), K3 and K4 by pointing discovery at an empty and an old fake binary, K5 by a forced error (fake binary or blocked network), K6 and K7. Screenshots of states A–E from the real app saved to `~/dev/loop-evidence/showhow-<issue>/`. The owner's Codex history shows no new thread after K1 (assumption B).
**DONE WHEN:**
- K1: a titled guide with instruction-style steps from GPT-6 Luna, saved in the bundle with `provider: "chatgpt"`.
- K2–K7 each behave as stated, with the recording and deterministic steps intact in K5.
- The RED cases pass without network; CI is green, including Typecheck (tests).
- Screenshots of A–E from the real app are in the evidence folder and match the mock's copy.
**Outside cases / follow-ups:** ChatGPT for the editor assistant; ChatGPT for the agent brief; Codex in other install locations; bundling Codex; Windows and Linux.

## Superseded issues
None.

## Self-review
Unbounded-word scan of requirements and DONE WHEN: "each behave" is bounded to K2–K7. "Every exit path" (constraints) is a reason, bounded in RED by the timeout and error cases. "All", "any" and "valid" do not appear in acceptance.

# Showhow landing page Plan

## Goal
A visitor who is a solo founder or agency owner, with client messages arriving and several coding agents running, understands in one screen that Showhow turns a screen recording into a step-by-step guide. They can reach the repository, learn how to open the unsigned build and read what is real today and what is coming. The owner is the model user: the copy speaks to the moment of a client message and waiting agents.

## Context and decisions
- Prototype, shown and approved 2026-10-18: `landing-proto-motion.html` and `landing-proto.html` (scratch, not committed), built from `design/landing.pen` **Landing 2 · Darkroom**. Scratch path: `/private/tmp/claude-501/-Users-mohamedb-dev-projects-showhow/9ea8cf54-bd75-44b2-9bfe-6025a04af465/scratchpad/`. Screenshots checked at 1440 px and 390 px wide.
- Hero loop (placeholder): Remotion composition `HeroMakeGuide`, 928x580 logical, 30 fps, 180 frames, rendered at 2x (1856x1160). Frame 0 and frame 179 are pixel-identical (0 differing pixels). Sources are the design frames `uNXEY` (finished guide) and `CPka0` (progress card, redrawn in code) from `design/showhow.pen`. MP4 357 KB, WebM 391 KB, GIF 315 KB.
- Today's truth, checked 2026-10-18: Make guide ships through OpenRouter (#122, PR #126). `src/` and `electron/` hold no "Copy for agent" or "Export PDF" code. No GitHub release exists. Connect ChatGPT (#128) is parked.
- Owner answers, shaping session 2026-10-18:
  1. Primary action: **Download early build for Mac**, labelled early. Until a release exists the button is a dummy that links to the repository.
  2. Headline stays "Show how it's done."; the subhead speaks to the client message and waiting agents.
  3. Below the hero: How it works, Coming next, How to open, FAQ, footer. Each section carries a short loop.
  4. Loops come from real recordings of the built app, polished with a Remotion overlay. The page ships with design-frame placeholders until those exist.
  5. Handoffs (Copy for agent, Export PDF) are shown as "Coming next" with a "Soon" tag. The page does not present them as working.
  6. Dark Landing 2 look. No analytics. Placeholders may ship.
  7. The FAQ states that Showhow is a fork of OpenScreen with a library added.
- Confirmed assumptions: Inter Tight, Inter and JetBrains Mono; colours `#161616`, `#FFFCF7`, sage `#82B09A`, orange `#E3582D`; loops ship as MP4 and WebM with a poster; one scroll, no pricing, testimonials or blog; downloads are counted from GitHub release statistics once a release exists.

## Bounded requirements
- **Supported viewports:** 1440x900 and 390x844. At both, the page has no horizontal scroll.
- **Sections, in order:** nav, hero, How it works (3 steps), Coming next (2 handoff panels), How to open (3 steps), FAQ (6 items), footer call to action.
- **Hero at 1440x900:** the tabs row, the Make guide button and the progress card are fully inside the first 900 px when the loop is at 3.0 s.
- **Claims allowed on the page:** recording, Make guide through OpenRouter, free and open source, macOS 13+, unsigned build. Copy for agent, Export PDF and ChatGPT sign-in appear only with a "Soon" or "Coming" tag.
- **Download button:** links to `https://github.com/bedarstudios/showhow` until the owner supplies a release URL. The label is "Download early build for Mac".
- **Motion:** respects `prefers-reduced-motion: reduce`. In that mode the hero shows the poster and no loop plays.
- **Media:** 6 loop slots. Slots for steps 1 and 2, the hero and How to open play a muted loop. The step 3 slot and the two Coming next slots show a still.
- **No third-party scripts, no cookies, no analytics.** Fonts load from Google Fonts only.
- **Excluded here:** real recordings, a signed build, translations, a blog, pricing, testimonials, deployment (Task 3), and Windows or Linux download paths.

## Architecture
A static site in `site/`: `index.html`, `styles.css`, `script.js` and `assets/`. It uses plain HTML and CSS with BEM class names (global CSS, per the Loop naming rule) and about 100 lines of vanilla JavaScript for reveal, the FAQ height animation, the nav state and loop pausing off-screen. It shares no code with the Electron app and adds no dependency to the root `package.json`. The loop source lives in `design/landing-loops/` with its own `package.json`; the root build never installs it.

## Milestones
- **Landing page launch:** Task 1 (design), Task 2 (build), Task 3 (loops), then Task 4 (publish).

### Task 1: Design the full landing page in pen.dev from Landing 2

**Priority:** no (owner answer, 2026-10-18)
**Labels:** feature, ui
**Milestone:** Landing page launch
**Depends on:** none
**Files:** `design/landing.pen`, `design/landing-assets/`, `design/landing-final/` (PNG exports and `REPORT.md`), `implementation-notes.md`
**Requirements:** In `design/landing.pen`, using the pencil MCP tools only, extend **Landing 2 · Darkroom** into the full landing page and put its parts in the file's library.
- **Palette as variables:** colour variables for background `#161616`, surface, hairline `#FFFCF72E`, text `#FFFCF7`, text-dim `#FFFCF7B3`, text-faint `#FFFCF78C`, accent sage `#82B09A` and record orange `#E3582D`, plus string variables for the three font families. Frame fills, strokes and text colours in the new frames reference the variables, not hex values.
- **Eleven components (reusable):** Nav, Button/Primary, Button/Outline, Eyebrow pill, Section label, Step card, Loop slot, Handoff panel (with "Soon" pill and disabled chip), FAQ item (closed and open variants), Footer call to action, Soon pill.
- **Frames:** `Landing · Final · desktop` at 1440 wide and `Landing · Final · mobile` at 390 wide, each holding the seven sections in order from "Bounded requirements"; plus one frame `Landing · Final · states` showing button default, hover, focus and disabled, FAQ open and closed, and the loop slot with the PLACEHOLDER tag.
- Copy, section order and claims follow "Bounded requirements"; placeholder loop slots use the design frames already exported in scratch.
**Interfaces:** Output is the saved `.pen` file and PNG exports. The consumer is Task 2, which reads the file through the pencil MCP tools.
**Constraints and reasons:** `.pen` files are encrypted: use the pencil MCP tools, never `Read` or `Grep` on the file. Edits made through the MCP exist on disk only after the app saves (Cmd+S); confirm with `git status` and `git diff --stat design/landing.pen` before the PR. Keep Landing 1 and Landing 3 and the background candidates unchanged: they are the owner's rejected or parked directions. Do not touch `design/showhow.pen`: it is the approved app design.

- [ ] RED: a read-only check with the pencil MCP lists zero reusable components and zero variables named `landing-*` in `design/landing.pen`.
- [ ] Implement the variables, components and frames.
- [ ] GREEN: the same check lists the eleven components and the variables; the three frames exist.
- [ ] Prove with PNG exports at 1x of the three frames and the component sheet; obtain independent review, then open the PR to main.

**Verification:** a pencil MCP `execute` call that prints the component names, the variable names and the three frame names; `git diff --stat design/landing.pen` shows the file changed; PNGs in `design/landing-final/`.
**DONE WHEN:** (a) the file lists the eleven named components as reusable; (b) it defines the eight colour variables and three font variables named in the requirements; (c) `Landing · Final · desktop` is 1440 wide and `Landing · Final · mobile` is 390 wide, each with the seven sections in order; (d) in the three new frames, a script that walks the nodes finds no hex fill or stroke that is not part of an image or the 12% overlay; (e) `Landing 1`, `Landing 3` and `Background candidates` are byte-for-byte unchanged in their exported PNGs (compare before and after); (f) `design/landing-final/REPORT.md` lists each exported PNG; (g) the owner has seen the three frames before Task 2 starts.
**Outside cases / follow-ups:** light theme; a second language; custom illustration; motion specs beyond those in the approved prototype.

### Task 2: Build the static landing page from the Task 1 design

**Priority:** unanswered. Ask the owner.
**Labels:** feature, ui
**Milestone:** Landing page launch
**Depends on:** Task 1
**Files:** `site/index.html`, `site/styles.css`, `site/script.js`, `site/assets/` (logo, hero poster, step stills, handoff stills), `tests/e2e/landing.spec.ts`, `playwright.config.ts` (add a `landing` project that serves `site/`), `config/branding-allowlist.json` (reviewed line-level entries for the fork answer), `design/landing.pen`, `design/landing-assets/` (commit the two untracked inputs), `design/landing-prototype/` (copy the two approved prototype HTML files from scratch so the source of truth is in the repo), `implementation-notes.md`
**Requirements:** Build the sections, copy and states in "Bounded requirements" from the Task 1 frames in `design/landing.pen`, read through the pencil MCP tools; the approved prototype is the reference for copy and motion. Use the pen colour variables as CSS custom properties with matching names (`--color-landing-bg` and so on) and one BEM block per pen component. Copy is taken from the prototype; FAQ items are: Is it really free; Is Showhow a new app or a fork; Does it upload my recordings (OpenRouter key only); What if the AI step fails; Windows or Linux; Which agents does it work with. Hover, focus-visible, active, disabled (Coming next chips) and reduced-motion states exist.
**Interfaces:** Input is the static files. The only outbound links are the repository, the repository releases page for "How to open", and OpenScreen's repository in the fork answer.
**Constraints and reasons:** `npm run branding:check` flags the legacy brand name in `site/index.html`; classify the fork answer lines as reviewed attribution in `config/branding-allowlist.json`, one entry per line, never a whole-file exemption. Do not touch `electron/` or `src/`: the landing page is separate from the app, so a page bug cannot affect a recording. Do not add a `v*` tag. Do not describe Copy for agent or Export PDF as working: AGENTS.md bars claiming planned features. The PROTOTYPE badge is removed from the shipped page. The PLACEHOLDER tag stays on each placeholder loop until a real recording replaces it (see Task 3).

- [ ] RED: `landing.spec.ts` fails because `site/index.html` does not exist.
- [ ] Implement the page.
- [ ] GREEN: the spec passes; `npm run lint` passes on the new files; `npm run branding:check` passes.
- [ ] Prove with screenshots at 1440x900 and 390x844 and obtain independent review, then open the PR to main.

**Verification:** `npx playwright test --project=landing`; `npm run lint`; `npm run branding:check`; screenshots saved as evidence.
**DONE WHEN:** (a) at 1440x900 and 390x844 `document.documentElement.scrollWidth` equals the viewport width; (b) the seven sections appear in the listed order with the exact headings from the prototype; (c) the primary button text is "DOWNLOAD EARLY BUILD FOR MAC" and its href is the repository URL; (d) the "Coming next" section has two "SOON" pills and two chips with `aria-disabled="true"`; (e) the FAQ holds the six listed items and the fork answer names OpenScreen and Siddharth Vaddem; (f) with `prefers-reduced-motion: reduce` emulated, the hero `video` has no `autoplay` attribute and shows the poster; (g) at 1440x900 with the loop paused at 3.0 s, the progress card top edge is inside the viewport; (h) no `<script src>` points to a host other than the page's own, and the page sets no cookie.
**Outside cases / follow-ups:** real loops; deployment; localisation; light theme.

### Task 3: Commit the placeholder loops and the swap recipe

**Priority:** unanswered. Ask the owner.
**Labels:** feature
**Milestone:** Landing page launch
**Depends on:** Task 2
**Files:** `site/assets/loops/`, `design/landing-loops/` (Remotion source: `src/`, `public/hero/`, `package.json`, `package-lock.json`, `scripts/`, `README.md`), `docs/landing/loops.md`, `implementation-notes.md`
**Requirements:** Commit the hero loop (MP4, WebM, poster) and the four other slot loops or stills as placeholders. `docs/landing/loops.md` states, for one loop, how to replace the placeholder with a real recording: record in Showhow, trim and crop with `ffmpeg` to 928x580 at 2x, optionally add a Remotion overlay for the click ring, export MP4 and WebM with the flags used in the existing render script, and replace the file. It lists the loop file names, durations and the three checks below.
**Interfaces:** Consumer is Task 2's page, through fixed file names.
**Constraints and reasons:** The Remotion project is not part of the app build, so root `npm install` must not install it. Each loop must stay under 600 KB so the page loads quickly on a cold visit.
**Verification:** From `design/landing-loops/`: `npm ci && npm run render`. Outputs match the committed files' dimensions and codec; `ffmpeg` frame comparison of the first and last frame prints 0 differing pixels.

- [ ] RED: a check script `scripts/check-loops.sh` fails because the loop files are absent.
- [ ] Implement the files and the recipe.
- [ ] GREEN: `scripts/check-loops.sh` passes.
- [ ] Prove and obtain independent review, then open the PR to main.

**DONE WHEN:** (a) the hero MP4 and WebM each measure 1856x1160, 30 fps, no audio track; (b) the first and last frames of the hero loop differ in 0 pixels; (c) each committed loop file is under 600 KB; (d) `docs/landing/loops.md` lists the six slots by file name; (e) `npm install` at the repo root does not create `design/landing-loops/node_modules`.
**Outside cases / follow-ups:** real recordings, which need the built v2 app; the Remotion overlay for real clips.

### Task 4: Publish the landing page

**Priority:** unanswered. Ask the owner.
**Labels:** feature, needs-human
**Milestone:** Landing page launch
**Depends on:** Task 2, Task 3
**Files:** `.github/workflows/pages.yml` or none, decided by the owner; `docs/landing/deploy.md`; `implementation-notes.md`
**Requirements:** The owner decides the host (GitHub Pages or Cloudflare Pages) and the domain. The workflow publishes `site/` only on a push to main that changes `site/`.
**Constraints and reasons:** Do not touch `build.yml` or add upstream's deleted release pipeline: AGENTS.md says to keep a single release workflow. Do not add a secret without the owner.
**DONE WHEN:** the owner has named the host and domain, `site/` is reachable at that URL over HTTPS, and `docs/landing/deploy.md` states how to redeploy and how to roll back. This ticket stops at `needs-human` until the owner answers.
**Outside cases / follow-ups:** a custom domain mail setup; release download wiring after the first `v*` pre-release.

### Follow-ups, not tickets yet
- Replace placeholder loops with real recordings once the v2 build is ready.
- Remove the "Soon" tags when Copy for agent (brief and path) and Export PDF ship.
- Point the download button at the first release asset after the first pre-release.
- Restore the ChatGPT line in the FAQ after #128.

## Superseded issues
None.

## Self-review
Scan of requirements and DONE WHEN for `every`, `all`, `any` and `valid`: no occurrence of `every`, `all`, `any` or `valid` remains in the requirements or any DONE WHEN; the words were removed or replaced with named lists (the seven sections, the six FAQ items, the six loop slots, the eleven components). Task 2 DONE WHEN cases (a) to (h) name viewports, selectors and states. The loop-size limit of 600 KB is bound to the six committed loop files by name in `docs/landing/loops.md`.

## Implementation notes
Append each deviation from this plan to `implementation-notes.md` under "Deviations": what changed, why and what was done instead. Commit it with the ticket. Path-scope checks treat it as an owned path.


# Showhow fresh-recording playback Plan

## Goal
Determine whether #125 still occurs on current Showhow, and repair only a reproduced fresh-recording playback failure.

## Context and decisions
Owner approved bounded non-priority diagnosis and conditional repair on 2026-10-18 in this session. #125 reports one dev-only observation, not established causation. #117 removed @xenova/transformers and its renderer transcription worker. Historical #118 packaged editor/export proof is supporting context, not fresh-recording playback acceptance. #128 remains parked.

## Bounded requirements
R1: Observe six short synthetic own-window takes on macOS arm64: two clean-cache dev runs in separate fresh checkout-local Vite caches, two warm-cache dev takes, and two explicit packaged-app takes. Use isolated runtime profiles and recording roots; do not change the shared dependency cache or personal profile.
R2: For each take, record source/build binding, media metadata and independent full decode, renderer reload events, Play action, timeline advancement of at least one second and visibly changing synthetic frames. Distinguish setup errors, non-reproduction and symptom RED. Report attempted/completed counts and reproduction frequency. Capture cache/build/tool conditions and cleanup receipts.
R3: If reproduced, minimise the observed failure and capture meaningful RED before the smallest source fix. Add a same-package regression test at the seam that exercises the actual failing call pattern; if no correct seam exists, report that limitation before proposing a substitute. Re-run the original failing scenario and affected suites after repair.
R4: If the six takes do not reproduce, preserve evidence and report non-reproduction without claiming historical causation or a fix. Do not close the issue automatically. Native identity refusal or unavailable prerequisites stops that path with retained receipts.
R5: Preserve recording saves during transcript failures, personal media, landing design files, parked128, failed evidence and credentials. No native permission changes, auth changes, release, tag or merge.

## Architecture
Keep the recorder/editor architecture. Use existing isolated-launch and verification-recipe helpers for their supported boundaries. An export success alone is not playback proof. External evidence belongs in ~/dev/loop-evidence/showhow-125/. Put scratch-only reproduction drivers and synthetic media under that root; capture their hashes. No new persistent runtime or controller.

### Task 1: Diagnose and conditionally repair fresh-recording playback — #125
**Priority:** no, owner approved 2026-10-18.
**Labels:** bug.
**Milestone:** none.
**Depends on:** none; base is current origin/main containing merged117/118/133.
**Files:** PLAN.md (append this section), implementation-notes.md; conditional source/test ownership limited to vite.config.ts, src/components/ai-edition/Preview.tsx, src/components/ai-edition/Preview.test.tsx, src/components/ai-edition/VirtualPreview.tsx, src/components/ai-edition/VirtualPreview.playback.test.tsx, src/native/useNativePlaybackSync.ts, src/native/useNativePlaybackSync.test.ts, electron/native-bridge/services/compositorViewService.ts, electron/native-bridge/services/compositorViewService.test.ts. A demonstrated cause outside these paths returns a proposed scope amendment before edits. Do not edit unrelated owned paths merely because they are listed.
**Requirements:** R1–R5 above.
**Interfaces:** fresh recording save/open, renderer playback controls and native compositor transport; no persistence or IPC contract change without a scope amendment.
**Constraints and reasons:** preserve the inherited recorder/editor and valid saved media; no obsolete transformers pre-bundling fix. One ticket lane and one review-ready PR, fresh independent native review. No Greptile.

- [ ] Capture actual symptom RED or complete the bounded non-reproduction matrix.
- [ ] If RED exists, write the regression check first and implement the smallest justified repair.
- [ ] Prove current candidate, retain failures, obtain fresh Standards and Requirements review.
- [ ] Open one review-ready PR; report its exact head and proof limits. No merge.

**Verification:** Follow docs/testing/verification-recipe.md for isolation and native export checks when a repair affects editor/export. For relevant changed source, run focused same-package Vitest cases, affected full suites, npm run test, npm run test:browser when rendering changes, npx tsc --noEmit, npx tsc --noEmit -p tsconfig.test.json, npm run lint and npm run branding:check. Run npm run i18n:check only if translation surface changes under an approved amendment. Use existing heavy-resource scheduling. No broad test reruns for evidence-only documentation. Native matrix explicitly requires actual playback advancement; no substitute based on ffprobe or export alone.
**DONE WHEN:** Six playback attempts have individual outcomes and evidence, with actual completed counts stated; a reproduced failure is repaired and rechecked or a precise reproduction/prerequisite limitation is reported. A claimed repair requires meaningful RED/GREEN and original-scenario recheck. Non-reproduction produces a diagnosis report, not automatic closure. Source changes require fresh separate Standards/Requirements PASS and relevant checks before one PR.
**Outside cases / follow-ups:** Windows/Linux/macOS13 hardware acceptance, #124/#127 fixes, #128 auth/provider changes, STT setup improvements unrelated to playback, release readiness and historical cause reconstruction.

## Superseded issues
None. #125 remains the existing ticket.

## Self-review
Acceptance is bounded to six synthetic macOS arm64 takes. No unlimited every/all/any/valid promises in DONE WHEN; media preservation is bounded to this task and existing recordings. Review and CI do not replace native playback evidence.

## Implementation notes
Append deviations to implementation-notes.md with cause, observed evidence and chosen action. Preserve failed receipts. After two failed probes under one premise, reassess and change the probe; no automatic extra review cycle.


## Showhow #125 approved interaction amendment — 2026-10-18

Owner approval: `/Users/mohamedb/dev/loop-evidence/showhow-125/AMENDMENT-APPROVED.json` (Yes i approve all). The following bounded amendment from the retained STOP.md is approved:

Add src/components/ai-edition/PreviewCanvas.tsx and src/components/ai-edition/PreviewCanvas.playback.test.tsx to conditional ownership solely to investigate the real PreviewCanvas→VirtualPreview→shell transport interaction for first Play/replay and source replacement. First build one integration regression that exercises the actual callback/event pattern and demonstrates the observed desync; if it cannot reproduce the native symptom, retain that result and do not treat callback churn alone as causal RED. Repair only after cause/seam proof; then repeat the original isolated failing native scenario and applicable suites before fresh native Review and the same single ticket PR. Any required NewEditorShell or other path change returns for a further exact amendment rather than an opportunistic edit. No additional broad native matrix or unrelated STT/annotation fix is approved by this proposal.


The approved diagnostic limit is at most two new cold synthetic takes, with the exact-editor read-only CDP observer attached before first Play, initial/replay comparison and workload observations. Lead owns native CUA and launches; no repeat of the six-take matrix. All original source ownership and R1–R5 remain in force. No other source paths, permissions/auth, personal media, releases, merge, commit or push are authorised to executor. If this bounded interaction work supplies no discriminating failure, retain the evidence and return a precise stop.


## Showhow #125 autonomous round 1 — recorded authority

The latest owner authority supersedes historical parking/exhaustion wording above. The lead recorded the following decision before scratch instrumentation; no causal repair is yet selected:

# Active autonomous resumption — 2026-10-18

Owner latest instruction supersedes parking and exhausted narrow scope: resolve125 in same lane, meaningful RED/GREEN, original native recheck, fresh one-shot independent review, one PR; agents never merge. Lead may select further bounded diagnostics and expand source/test ownership when observations justify seam, recording before edits. No speculative repair, credentials/env/private recordings, permission/auth/release work. Prior evidence/failures and dirty candidate preserved; failed-review count0. Native identity refusal remains hard stop. Current lane PASS in RESUME-AUTONOMOUS-LANE.stdout, HEAD e54cc63e, no PR, issue OPEN/bug. Coordinator owns board; owner states125 active, latest board not independently observed by lead.

Round1 decision before edits: repair observer first, at most2 isolated cold fresh-recording diagnostic runs (j/k), plus same-take replay within each. No six-matrix repeat. Observe media/store/native clocks, view lifecycle and transport command/frame-delivery metadata before first CUA Play; samples synchronous with no dynamic imports or forced transport. Need actual canvas/frame divergence, source media independent decode, timestamped owned workload. If two probes fail same premise, reassess predictions and change seam. Scratch instrumentation permitted only in external cloned source with tagged DEBUG-125 boundaries, reviewed patch/hash, no production repair. Production ownership expansions remain conditional on observed failing seam. Executor initially read-only proposal; lead native CUA.

Round1 uses scratch-only Vite transforms from autonomous/observer-plugin.mjs and lead frozen j/k driver/sampler bindings; original external source is immutable. No dynamic imports/native awaits in the synchronous sampler. All production ownership remains conditional on an observed failing seam and a recorded lead scope decision before edits. No extra owner chat approval is required for evidence-justified ownership under this authority; native identity/review/no-merge and privacy restrictions remain.


## Showhow #125 scope decision002 — observed early end replay

# Scope decision002 before source edits — real end replay boundary

Owner autonomous authority AUTHORITY.md. Native runj: atclipend media13.212847/13.243333 pausedtrue endedfalse; projectplayhead13.243333. Current CUA Play button click changes storetrue→false within10ms, native true seq2912 thenfalse2913+presentTimeend2914; screenshot02-end-replay.png remains13.2/counter135. Focused Enter confirmation also shows no restart; direct synchronous metadata trace retained. This is actual interaction RED at the early virtual clip-end boundary, not callback churn, fixture failure or a claimed cause of originalf freeze.

Expand conditional source/test ownership to src/components/ai-edition/NewEditorShell.tsx solely for its shared togglePlay restart/seek coordination, plus same-package test PreviewCanvas.playback.test.tsx alreadyowned and VirtualPreview playback surfaces alreadyowned. Read all callers and existing handleSeek path first. First add a regression exercising actual shell+VirtualPreview early clip-stop, currentTime belowphysicalduration, endedfalse, real productionrAF/pause, then actualPlay plusrAF; mockmustnotrewindtime or setstoreplaying onPlay. Observe RED against unchangedproduction before anyrepair. Prefer reuseexistingseekTarget and actualstartclip/source mapping; preserve normalpausedmidclip behavior and multiclips/trims/crossasset boundary. Exact correction chosenonlyafterRED, appenddecision beforeedit.

This reproduced restart defect belongs to fresh-recordingplayback diagnosis, but doesnotclearoriginalf first-playfreeze. Continue original scenario instrumentedfirstPlay k afterward; no closure/readinessclaim until requirement/evidence accounted. No unrelated shell/UIbehavior, auth/permissions/persistence change. No speculative fallback or native transport patch. Failedreviews0.



## Showhow #125 repair decision003 — confirmed end replay

# Repair decision003 before production edits — confirmed end restart

Native jtrace + source end-replay-red-01 exit1 reach intended paused/playing assertion on actual shell/preview/rAF; originalinteractionteststillpasses. Test recreates observed13.212847 media versus13.243333 virtualend with endedfalse, thenPlay doesnotresume. No mockrewind or storeplayingwrite. REDchecked beforeproductionedits. This authorises minimal endrestartrepair only; it isnotcause/fixfororiginalf frozenframe.

Chosen bounded repair: in shared NewEditorShell togglePlay, terminaltimelineposition requests first kept playable segment through existing seekTarget path with explicit internal play intent, then returns instead of playing old endelement. Existing VirtualPreview seek/pending-source path performs mapped seek/resume oncorrectelement (incl leadingtrim/crossasset). Add optionalplayintent to existing typedseekTarget surface through Preview/PreviewCanvas/VirtualPreview; no new persistence/IPC/publicfeature. Reuse existing resolvePlaybackSegments/getRawVirtualStartTime or equivalent currenthelpers rather than inventedmapping. Preserve midclipresume, manualseek/latestintent, emptyplayablesegment handling, naturalmulticlipadvance and playrejection handling. No other productpath.

Owned source additions NewEditorShell.tsx alreadydecision002; Preview.tsx/PreviewCanvas.tsx/VirtualPreview.tsx and correspondingplaybacktests alreadyoriginal/amended ownership. Evidencefullyjustifies this seam. Executor mayimplementnow and addedgechecks but no heavytests while leadnativek runs. Leadwillrecheckthisactualnativeendreplay and originalfreshfirstPlay afterward with candidatebinding; broaderrequiredchecks/freshreview stillneeded. Continue investigateoriginalfreeze separately.


## Showhow #125 scope decision004 — shared model progress emitter

# Scope decision004 before new source/test edits: bound model progress at its shared emitter

Authority: owner autonomous evidence-justified source/test expansion. Passive native p reproduces frozen paint while store/media advance (ROUND7-SYMPTOM.json): gen31/source0.27s held during2.504→5.924s; gen87/source2.562s held during6.030→9.047s. Independent screenshots corroborate counter6 at4.5s andcounter29 at9.0s. No profiler/Debugger or externalhighfrequencyCDP duringPlay. Stableview2/liveelement1.

The same run processed14,876 transcription updates/14,875 changed scalar snapshots by70.596s. Retained loading-model history advances16KiB per event about4ms apart. Source chain: modelManager.ensureFile every stream data→EnsureModels onProgress→LocalSttService.prepare emit→stt status IPC→transcribeAsset onStatus→patchJob→NewEditorShell subscription. Earlier n CPU profile shows23.59/28.55s Reactsync work; o accepted scheduler caller includes patchJob. Together this justifies shared download progress delivery as the next causal seam; callbackchurn alone remains unproven and untouched.

Expand owned product paths ONLY to electron/stt/modelManager.ts and electron/stt/modelManager.test.ts, plus existing PLAN/implementation-notes. Read all ensureFile/ensureModels callers before edits. Tests first against unchanged emitter: real stream many16KiB chunks, controlled monotonic clock, assert bounded intermediate delivery instead of oneeventperchunk, first progress and exact final byte count retained, correct bytes/hash/install outcome, no delayed event after termination. Observe intended RED before repair. Existing download rejection, retry, cancellation/stall/checksum/preservation tests remain applicable. No network in regression.

Proposed smallest repair after correct RED: bound notifications in existing shared ensureFile progress path to100ms intervals, immediate first and exact final bytes (avoid duplicate final); keep per-byte accounting and stall liveness unchanged; no timer queue/new dependency/config. Preserve atomicwrite/hash/failure/cancellation semantics. Choose final implementation only after testRED and record if direction changes. Do not alter transcription behavior/model choice/download URLs/native transport or optimise unrelated Tooltip/callbacks.

Proof plan: focused RED/GREEN andaffected STTsuites; baseline p versus repaired same-original-f cold fixture underpassiveobserver, plus original freshrecording session recheck onexactcandidate andnative end-replay check. Source model-progress regression is separate from actual native frozen-paint RED/after, not a substitute. A later passing native take alone willnotclaimoriginalcausefixed; candidate binding, progress reduction, actualtimeline/media/paint alignment andscreenshots must agree. Then all applicable source checks/fresh independentone-shotreview/onePR. No merge/closure. Failedreviews0. PreserveallpreviousSTOP/amendment/raw/failures; no env/credentials/private media/permissions/auth/releases.


## Showhow #125 scope decision005 — controlled native progress comparison

# Native causal comparison decision before scratch edits

Scope004 source RED observed201 notifications over804ms; GREEN cap pendingaffected checks. Passive p alreadyprovides actual frozen-paint/advancing-time nativeRED plus14,876modelprogressupdates. Original actualfresh f runtimealso retains264,464,607-byte small model and885,098-byteVAD inits initiallyprivateempty modelcache, consistentwithfirst-run download andwarm-pass contrast. Do notclaimhistoricalcausefromcorrelationalone.

For causal native comparison, make identical bounded inputdelivery across one baseline fixture q0 andone repaired fixture q1: original-f clonedmedia, fresh isolated profiles/caches, passive6moduleobserver, actualCUAPlay. A scratch-only main bootstrap fetch fixture interceptsONLYtwo exact immutable publicSTTmodelURLs andstreams hash-verified own p downloadedmodelbytes in16KiB chunks with2msdelay. Samebytes/order/cadence beforeandafter, no externalnetworkforthesefiles, no productstate/UI/transportchanges, no credentials. Delegateallotherfetch tooriginal. Log fixturestart/end/chunkcount/bytesandactualduration; preservemodeloriginalhashes. This controlsavailabilitywithoutanothernetworkdownload/capture. It intentionally substitutes modelinputdelivery, so labelpairedcontrolledfixtureNativeUIevidence, notunmodifiedfresh-recordingacceptance.

Recordmodule/driver/hash/sourcebindingsbeforelaunch; selfcheckstreambytes/cancel/containment/exactURLscope. Ifbaselinefails toshowfrozen/time divergence, preserveanddon'tcallitnativeRED; p remainsactualobservedRED. Candidateaftermustshowboundednotificationsandactualnativeframe/timeadvancementwhilemodeldownloadactive, notmerelylaterplayafterdownload. NoDebugger/gate/GPUreadbacks duringPlay. Reassessaftertwofailedprobesunderthispremise.

Afterpairedfixtureevidence, original fresh recording scenario recheck onexactcandidate withproductionnetwork/modelinput, plusnativeendreplay andapplicableexport/packageproof. Theseareseparateprooftracks. Neverclaimpassingmockorone laternative takefixesoriginal. Currentcandidateincludesindependentlyprovedendreplayrepair; itdoesnotchangefirstPlaybeforeterminalboundary. Preservebaseline source andallfailedreceipts. No newlane/matrix, permission/auth/release/tag/merge/issueclosure.


### #125 final approved execution scope and proof

Owner autonomous authority superseded prior parking and exhausted narrow amendment. Recorded scope decisions002/003/004/005 preceded edits. Final ownership is the existing shell/preview playback surfaces, modelManager and same-package regressions, plus these plan/notes. The original approved plan above remains preserved verbatim. Final outcomes and proof limits are recorded in implementation-notes.md under “#125 final candidate and acceptance”; fresh review and one PR are required, never agent merge or automatic issue closure.


## Scope007 — hosted progress-test timeout repair (2026-10-18)

Authority: external `autonomous/SCOPE-007-CI-TEST-DIAGNOSIS.md`. Ownership is limited to `electron/stt/modelManager.test.ts`, this plan and implementation notes. Preserve runtime/native/package evidence, PR150, previous reviews and hosted failure receipts. No timeout, configuration or production change.

The scratch phase probe measured generic deep equality of the 3,293,184-byte Buffer at 3,678.2 ms, versus about 39.4 ms for download/hash/install and 1.2 ms for timer draining. The decision was recorded before edits in `autonomous/ci-test-diagnosis/FINDINGS-AND-REPAIR-DECISION.md`: use native `Buffer.equals` for exact byte equality. Retain the 201 × 16 KiB real stream, controlled monotonic clock, expected digest, atomic install, first/final bytes, notification rate/spacing and no queued callbacks.

Validation complete: revised case fails with the original emitter (201 notifications versus ≤11), passes with the repaired emitter; focused 21 tests and affected 230 tests pass; test TypeScript and Biome exit0. Full unit rerun passes 356 files / 4,632 tests with two baseline skips and the same single environment-template exclusion. The first full run's missing public scratch fixtures and its failure are retained separately. Production five and other two playback-test hashes are unchanged. Lead owns fresh review and the same-PR update; executor does not stage, commit or push.

# Showhow Final design implementation Plan

## Goal
Make the approved Library, HUD, Editor and Settings designs work as one macOS desktop experience: record, find a take, make and edit a guide, edit/export video, and hand off a brief or PDF. Implement the approved visual language and named interactions, with no dummy controls presented as finished functionality.

## Context and decisions
- Owner requested the whole approved Library, Editor and HUD design, explicitly included Settings, and approved normal review for the design tickets on 2026-10-18. No priority labels or Greptile.
- Reuse the approved mock `design/mocks/2026-10-15-house-style/index.html`, SPEC.md, and Final exports/manifest under `pen-final/`. The 50 exported Final frame hashes were checked on 2026-10-18: zero mismatches. This is design evidence, not app acceptance.
- Working base for shaping: origin/main `e54cc63e3d2cd72430588906d5550f7a968daf1a`. #125 continues in its own lane; refresh its eventual result before editor work.
- Keep existing Electron, ScreenCaptureKit/WGC, native compositor, project store, AI editing engine and native transcript engine. Layout/presentation changes may reorganise the upstream shell, with those touchpoints recorded. No engine rewrite.
- Current gaps observed in source: RecordingLibrary still uses legacy sh-* inline layout rather than the shared Sidebar; it has no search/import/brief/PDF interface. Showhow guide components partly use ds-* tokens. Upstream editor chat is left of the stage, whereas the Final design uses the right inspector. HUD uses inherited geometry/chrome. Theme helpers and some shared components already exist: extend these rather than rebuild them.
- Latest decisions outrank literal mock data. Notes (HUD-06) remains excluded. #128 remains parked: ChatGPT controls must be truthfully unavailable, never shown connected or implemented here. OpenRouter remains the working guide provider with the owner-selected default. Existing upstream editor providers remain supported.
- #127 explicitly requires removing the ready-guide review link and styling Edit/Delete; its later requirement supersedes the older Library-06 export's link. Retain first-provider review and Make/Remake review access. Plan proposes absorbing #127 into T2, with closure only through the separate approved publication preview.
- Library-28 is adapted to current #122 behaviour: no speech with usable clicks still permits a click-only guide. Do not restore an obsolete no-speech dead end.
- Protected landing design, personal recordings, failed receipts and parked #128 are untouched. Existing parked Phase 6/10 modes are not changed by this new milestone.

## Bounded requirements
- Supported acceptance environment: macOS arm64 on the available Mac; report exact OS/build. macOS 13 hardware, Windows and Linux runtime remain untested unless separately authorised and exercised.
- Cover 49 in-scope Final frames: Library01–28, HUD01–05/07–08, Editor01–08, Settings01–06. Record adaptations above and unsupported Settings fields below in a frame-to-evidence table; do not label an adapted/deferred state an exact match.
- At the reference 1200px frame widths, match layout, type, spacing, semantic colours, selected-row fill, compact guide rows, signature offset shadows and state copy. Compare representative light/dark renders and the native HUD. At the app's supported minimum window size, controls must remain reachable without horizontal clipping; establish and record that size before T2/T8 implementation, not an invented mobile layout.
- Use Inter body, Inter Tight display and JetBrains Mono labels, sage accent and orange recording/failure/playhead meaning. No serif display or permanent sidebar dither floor. Mosaic occurs only at processing/redaction/frontier locations defined in SPEC.md.
- Recording, transcript, guide, brief and export failures preserve source media. Preserve .showhow/.openscreen compatibility and the video.cursor.json convention. New metadata/files use Showhow ownership; reads tolerate absence on older bundles.
- Real interactions in T2–T9 require same-package behaviour tests and observed Electron proof on synthetic scratch data. Fixture renders can cover unreachable/error/permission states; permission grants and real provider/account changes remain owner-only.
- Shared keyboard/focus semantics, readable contrast, reduced motion and complete disabled/loading/error states are acceptance criteria. Prefer existing local icons; no runtime CDN, new paid service or dependency introduced solely for polish.

## Architecture
Reuse src/components/showhow/, src/lib/showhow/ and electron/showhow/. Main owns folder validation, file writes, file dialogs, clipboard and PDF output. Renderer owns presentation and typed view state. New IPC belongs in the Showhow block of existing handlers/preload/types. Do not let renderer-supplied paths bypass existing media/bundle containment.
New modules proposed below are the default ownership seams; a demonstrated need outside a task's listed paths returns for a bounded amendment before edits. Keep focused same-package tests; no duplicated implementation-mirroring checks.
Expose existing guide provider calls through a small shared model adapter for T4 rather than making a second auth store. Preserve existing first-provider evidence consent, cancellation and previous successful output until replacement validates. Agent-brief consent must identify its own payload; existing guide consent cannot silently authorise additional data.
State screenshots use deterministic scratch fixtures and the same reference dimensions, with evidence paths outside the repository by default. No permanent demo toggle or fake product route is required.

## Milestones
Proposed new milestone: **Implement approved Showhow designs**. It does not yet exist; creation and issue publication remain behind the exact owner preview gate.
Execution is sequential, one ticket/worktree/PR at a time:
T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9 → T10.
This order makes the Library visible early, finishes its missing flows, then brings Settings, recording and the editor into the same language. T8 also waits for #125's resolved/explicitly accepted outcome. #124 remains a separate recorder bug; T7 must not silently fold in a capture-policy change.
Tasks have behavioural dependencies as listed below; the sequence is the dispatch order, even where independent work would be technically possible.

## Common proof and review
For changed app code: focused same-package tests during iteration; affected full suites before PR. Run production/test TypeScript, Biome, branding, and i18n checks when their surfaces change. Rendering tasks run the affected browser suites. Required commands are `npx tsc --noEmit`, `npx tsc --noEmit -p tsconfig.test.json`, `npm run lint`, `npm run branding:check`, and `npm run i18n:check` for copy/locale changes. Use the repository's heavy-resource scheduling.
Each implementation task captures BEFORE/AFTER, preserves failed receipts, and requires fresh independent Standards PASS and Requirements PASS plus current-head applicable CI before one review-ready PR. UI review includes accessibility. Native reviewer passes the literal one-shot identity gate before inspecting the candidate. No agent merges.
Editor/export tasks follow docs/testing/verification-recipe.md with isolated synthetic fixtures, independent media decode, observed native pixels and complete owned-process cleanup. Successful export does not alone establish live playback.
Documentation-only T10 evidence reconciliation does not trigger broad code-suite reruns unless it changes a harness or exposes a regression.

### Task 1: Align shared components and theme tokens with the Final design
**Priority:** no (owner approved normal review).
**Labels:** feature, ui.
**Milestone:** Implement approved Showhow designs (proposed).
**Depends on:** none.
**Files:** src/index.css; src/styles/fonts.css; src/lib/showhow/designTokens.ts and designTokens.test.ts; src/lib/showhow/theme.ts and theme.test.ts; src/lib/showhow/upstreamTheme.css and upstreamTheme.test.ts; src/components/showhow/Button.tsx, Tag.tsx, Logo.tsx, Card.tsx, EmptyState.tsx, Sidebar.tsx, LibraryRow.tsx, Toast.tsx, Components.test.tsx, Button.test.tsx, theme.browser.test.tsx, button-hover.browser.test.tsx; tailwind.config.cjs (only existing ds-* mapping); implementation-notes.md.
**Requirements:** Reconcile existing ds-* definitions with SPEC.md and the verified component exports. Reuse current Showhow theme preference with legacy-key fallback. Define a shared shell/sheet/tab/field/progress vocabulary; new components, if needed, stay in the same directory and are named explicitly in the task PR. No global selector that changes unrelated upstream controls. Maintain source-compatible component props until their consumers migrate.
**Interfaces:** Shared React components and semantic CSS tokens consumed by T2/T6/T7/T8.
**Constraints and reasons:** Do not remove sh-* aliases while live consumers still use them; do not change persisted theme keys or globally substitute native helper identifiers.
- [ ] RED: component renders show the observed wrong token/type/selected-row/sheet state; theme fallback and cross-window System change checks exercise the existing public helper.
- [ ] Implement only the component/token discrepancies used by this milestone.
- [ ] GREEN: component renders and theme cases pass; light/dark reference comparisons and keyboard/reduced-motion checks recorded.
- [ ] Fresh Review and one PR.
**Verification:** `npx vitest run src/lib/showhow/designTokens.test.ts src/lib/showhow/theme.test.ts src/lib/showhow/upstreamTheme.test.ts src/components/showhow/Components.test.tsx src/components/showhow/Button.test.tsx`; affected browser tests and common checks. Inspect six component-reference exports alongside native rendered components.
**DONE WHEN:** Sidebar, row, button variants, typography, sheet, tab and progress states use the agreed tokens in light/dark; System preference survives reopen and responds to a simulated system change; existing consumers still compile.
**Outside cases / follow-ups:** Screen implementation and unrelated global CSS cleanup.

### Task 2: Implement the Final Library shell and existing guide states
**Priority:** no (owner approved normal review).
**Labels:** feature, ui.
**Milestone:** Implement approved Showhow designs (proposed).
**Depends on:** T1; #122 already merged.
**Files:** src/components/library/RecordingLibrary.tsx and RecordingLibrary.test.tsx; src/components/showhow/Sidebar.tsx, LibraryRow.tsx, VideoPlayer.tsx and VideoPlayer.test.tsx, GuideStep.tsx, AiGuidePanel.tsx and AiGuidePanel.test.tsx, AiGuideSheets.tsx; new src/components/library/library-search.ts and library-search.test.ts; src/lib/showhow/recordingLibrary.ts; src/i18n/locales/*/common.json for new keys; implementation-notes.md.
**Requirements:** Cover Library01–06,08–11,13–16,19,26–28 using current bundle/guide behaviour. Add local title search, empty query, matching title and no-results/Clear search cases without changing bundle order or selection when a matching row remains. Selecting a different recording must not display the previous take's guide/title/save result. Preserve title editing, step edit/delete/reveal and timestamp seek. Make/Remake retains #122 error/cancel/previous-output semantics. Apply #127's two fixes with BEFORE/AFTER evidence. Do not show unfinished Import/PDF/brief actions as working before T3–T5; introduce their real controls in those tasks.
**Interfaces:** Existing Showhow list/update/guide IPC and VideoPlayer; typed selected bundle identity rather than array index for pending async writes.
**Constraints and reasons:** Existing media/path and save contracts stay unchanged. The evidence-review access follows the later #127 decision, not the stale ready-guide mock link.
- [ ] RED: search/no-results/selection race and existing guide state renders expose the missing/wrong layout or behaviour.
- [ ] Implement the shell and named state cases.
- [ ] GREEN: same cases pass; step edits/reveal/timestamp seek and late title-save protection remain covered.
- [ ] Fresh Review and one PR.
**Verification:** `npx vitest run src/components/library src/components/showhow src/lib/showhow`; affected browser tests; common checks. Isolated Electron walkthrough: empty → selected saved take → title edit → Make guide → ready → step edit/delete → Remake cancel/error; use fake provider for failure cases.
**DONE WHEN:** Named Library states and search cases have frame-to-evidence rows; reference-width and supported-minimum layouts are readable in both themes; a real synthetic bundle opens and its timestamp seeks to the chosen step; #127's two behaviours are proved.
**Outside cases / follow-ups:** T3–T5 features, new guide model/provider changes, capture filtering #124.

### Task 3: Add MP4 import to the Library
**Priority:** no (owner approved normal review).
**Labels:** feature, ui.
**Milestone:** Implement approved Showhow designs (proposed).
**Depends on:** T2.
**Files:** new electron/showhow/importRecording.ts and importRecording.test.ts; src/lib/showhow/recordingLibrary.ts; electron/showhow/recordingLibrary.ts and recordingLibrary.test.ts; electron/ipc/handlers.ts (Showhow registration only), electron/preload.ts, electron/electron-env.d.ts; new src/components/showhow/ImportVideoSheet.tsx and ImportVideoSheet.test.tsx; src/components/library/RecordingLibrary.tsx and RecordingLibrary.test.tsx; src/i18n/locales/*/common.json; implementation-notes.md.
**Requirements:** Library17/18: system picker selects one local MP4, imports into a new bundle without modifying source, shows copying progress and selects the resulting row marked IMPORTED. Supported test fixture: H.264/AAC MP4 accepted by the current editor; reject unreadable, truncated, directory and non-MP4 inputs with actionable error. Duplicate filenames create distinct bundles. Cancel before selection writes nothing; cancellation/failure during copying leaves no completed library entry and preserves source. No invented cursor/click telemetry for imports; use narration-only/click-unavailable guide semantics.
**Interfaces:** Typed Showhow import request/progress/cancel/result; main validates and owns source/destination and uses existing bundle/media metadata logic.
**Constraints and reasons:** Finalise metadata only after the copied media is complete; asynchronous cancellation must not delete another import's files. Size is not artificially capped, but tests use bounded small fixtures.
- [ ] RED: same-package real temporary-file cases for successful import, duplicate name, cancellation and truncated input.
- [ ] Implement the import path and sheets.
- [ ] GREEN: cases pass and source hashes remain unchanged.
- [ ] Fresh Review and one PR.
**Verification:** Focused import/library tests, full affected Showhow suites, common checks. Native scratch import → visible row → editor playback; inspect both progress and failure sheets.
**DONE WHEN:** Accepted MP4 becomes a complete separate bundle with truthful metadata; cancel/error cases do not create a finished row; source hashes match before/after; Library17/18 evidence is retained.
**Outside cases / follow-ups:** Batch import, arbitrary codec/transcoding support, external/removable-source recovery.

### Task 4: Generate the agent brief and implement Copy for agent
**Priority:** no (owner approved normal review).
**Labels:** feature, ui.
**Milestone:** Implement approved Showhow designs (proposed).
**Depends on:** T2.
**Files:** new electron/showhow/agentBrief.ts and agentBrief.test.ts, guideModel.ts and guideModel.test.ts; electron/showhow/aiGuide.ts and aiGuide.test.ts, aiGuideConsent.ts and aiGuideConsent.test.ts; new src/lib/showhow/agentBrief.ts and agentBrief.test.ts; new src/components/showhow/AgentBriefPanel.tsx and AgentBriefPanel.test.tsx; src/components/showhow/AiGuideSheets.tsx; src/components/library/RecordingLibrary.tsx and RecordingLibrary.test.tsx; electron/ipc/handlers.ts (Showhow block), electron/preload.ts, electron/electron-env.d.ts; docs/architecture/showhow-bundles.md; src/i18n/locales/*/common.json; implementation-notes.md.
**Requirements:** Library07/20–24: brief not-made/making/failed/ready states; Copy for agent generates a brief first when absent, then copies that brief plus exact local bundle path. Clipboard success appears only after generation and write both succeed; restore the same button width and show two-second copied feedback. Copy path remains independent and local. Propose a versioned optional agent-brief.json and agent-brief.md pair with title, observed steps/times, expected/actual only when supported by inputs, and explicit unknowns; metadata records provider/model/source revision. Validate before atomic replacement; previous brief and guide/media survive failure/cancel. Use existing OpenRouter connection, default model and per-payload evidence review. Include transcript/selected frames only as reviewed. No silent export of revealed sensitive content.
**Interfaces:** Shared guide/brief model adapter, dedicated brief status/run/cancel and clipboard IPC. Existing bundles without brief files read as not-made. Reuse existing guide payload validators where applicable rather than weakening them.
**Constraints and reasons:** No invented diagnosis, provider fallback, credential store or ChatGPT integration. A guide-derived brief must not overwrite deterministic steps or source transcript.
- [ ] RED: absent brief → generate → copy ordering; generation error, clipboard rejection, invalid model output, cancellation, stale result after selecting another bundle and previous-output retention.
- [ ] Implement typed brief pipeline, persistence and UI.
- [ ] GREEN: same cases pass with fake model/clipboard; atomic replacement and older-bundle reads are covered.
- [ ] Fresh Review and one PR.
**Verification:** Focused Showhow main/renderer tests then affected full suites/common checks. Native synthetic bundle, fake provider returns fixture response, actual scratch clipboard handoff verified only with explicit isolated test clipboard handling; do not overwrite/read the owner's current clipboard without separate authority. If no isolated system clipboard is available, report native clipboard untested and use main-process clipboard adapter assertions.
**DONE WHEN:** Named brief states have evidence; generation precedes clipboard write for absent brief; errors preserve prior artefacts and do not show Copied; exact bundle path and evidence-derived content are verified. Native clipboard limitation is declared if applicable.
**Outside cases / follow-ups:** MCP server, remote sharing, other providers and new auth, automatic inferred root-cause claims.

### Task 5: Export a real workflow PDF from the Library
**Priority:** no (owner approved normal review).
**Labels:** feature, ui.
**Milestone:** Implement approved Showhow designs (proposed).
**Depends on:** T2.
**Files:** new electron/showhow/exportPdf.ts and exportPdf.test.ts, pdfDocument.ts and pdfDocument.test.ts; new src/components/showhow/ExportPdfSheet.tsx and ExportPdfSheet.test.tsx; src/components/library/RecordingLibrary.tsx and RecordingLibrary.test.tsx; electron/ipc/handlers.ts (Showhow block), electron/preload.ts, electron/electron-env.d.ts; src/i18n/locales/*/common.json; docs/architecture/showhow-bundles.md; implementation-notes.md.
**Requirements:** Library12/25: preview, include toggles, save destination, saved/Show in Finder states. PDF uses current persisted guide title/ordered steps/screenshots/timestamps with the selected options. Escape text and restrict local image resolution to the selected bundle; no remote resources or scripts. Save picker cancellation writes nothing and shows no success. Write/render failure preserves bundle/previous destination, reports error and permits retry. Sensitive text/image treatment follows the persisted reveal/redaction choice and explicit include settings; no hidden inclusion.
**Interfaces:** Main-owned PDF render from sanitised structured data in an isolated offscreen document using existing Electron PDF facility; write to chosen destination only after bytes are produced.
**Constraints and reasons:** Renderer cannot supply arbitrary HTML or local files. PDF export is a derived output and cannot damage source recordings.
- [ ] RED: two-step guide, no screenshots selected, long title/multiline step, sensitive field excluded, path escape attempt, picker cancel and write failure.
- [ ] Implement document renderer, save flow and UI.
- [ ] GREEN: cases pass, fixture PDF text/order/page bounds and nonempty image content verified.
- [ ] Fresh Review and one PR.
**Verification:** Same-package tests/common checks. Native scratch real PDF render and save, independent PDF text/page inspection and rendered-page visual check; screenshots of modal and success. Main dialog selection may be replaced with the explicit scratch destination and reported as such.
**DONE WHEN:** A real readable PDF matches selected options; synthetic long-content pages have no clipped steps; cancel/failure never shows saved; the source bundle is unchanged.
**Outside cases / follow-ups:** DOCX/HTML/ZIP export, hosted links, custom templates or print-driver support.

### Task 6: Implement the Final Settings screens
**Priority:** no (owner approved normal review).
**Labels:** feature, ui.
**Milestone:** Implement approved Showhow designs (proposed).
**Depends on:** T1, T2; refresh supported features after T4.
**Files:** new src/components/showhow/SettingsView.tsx and SettingsView.test.tsx; src/components/showhow/AiConnections.tsx and AiConnections.test.tsx, AiGuideSettings.tsx; src/components/library/RecordingLibrary.tsx and RecordingLibrary.test.tsx; src/lib/showhow/theme.ts and theme.test.ts; electron/ipc/recordingPrefs.ts and its same-package tests; electron/ipc/handlers.ts (recording settings/Showhow block only), electron/preload.ts, electron/electron-env.d.ts; new electron/showhow/settings.ts and settings.test.ts only for settings not owned by an existing store; src/i18n/locales/*/settings.json and common.json; implementation-notes.md.
**Requirements:** Settings01–06 shell with no selected recording row while active. AI Connections adapts connected/expired states to actual OpenRouter status; ChatGPT remains disabled and clearly deferred under128, no fake expiry/account information. Recording fields bind to existing folder/countdown/hide-icons capabilities. Appearance offers Light/Dark/System via current theme store and updates open app windows. Transcription truthfully identifies bundled local engine/model; Agents exposes actual handoff format and disabled coming-later MCP row. Preserve existing editor provider settings rather than replacing their auth configuration.
**Interfaces:** Existing recording preference APIs and theme helpers; narrow Showhow settings module only where persistence has no current owner.
**Constraints and reasons:** No cosmetic control may pretend to change behaviour. Design fields without current support (notably transcription names/terms and any unsupported recording preference) must be listed in an implementation inventory before Build. The default proposal is a visibly unavailable explanatory field, not a new native transcription feature; active support needs a separately approved bounded task. This is an explicit design exception for plan approval.
- [ ] RED: Settings nav/selected-row state, preference save/error/reopen, System update and disconnected/error provider state.
- [ ] Implement the named working controls and truthful unavailable states.
- [ ] GREEN: same cases pass; legacy preferences survive and rejected writes do not show success.
- [ ] Fresh Review and one PR.
**Verification:** Focused settings/theme/recording preference tests, affected browser suite/common checks. Native light/dark/System propagation across Library/HUD/Editor; use fake provider status, no real account or permission changes.
**DONE WHEN:** Six screen references have working-control/evidence/explicit-exception entries; saved supported preferences persist; active Settings does not imply a selected recording; no unsupported backend feature is claimed.
**Outside cases / follow-ups:** #128, credential migration, custom transcription dictionary/native engine features, active MCP integration.

### Task 7: Implement the Final HUD and recording sheets
**Priority:** no (owner approved normal review).
**Labels:** feature, ui.
**Milestone:** Implement approved Showhow designs (proposed).
**Depends on:** T1, T6; account for #124's current status without absorbing its capture-policy change.
**Files:** src/components/launch/LaunchWindow.tsx and LaunchWindow.test.tsx, LaunchWindow.module.css, HudControls.tsx, HudIcons.tsx, SourceSelector.tsx and SourceSelector.test.tsx, SourceSelector.module.css, CountdownOverlay.tsx, HudDeviceSettings.tsx and existing tests, hudGeometry.ts and hudGeometry.test.ts; new same-package HudControls.test.tsx; src/lib/showhow/upstreamTheme.css; src/i18n/locales/*/launch.json; docs/architecture/upstream-touchpoints.md; implementation-notes.md.
**Requirements:** HUD01–05/07–08: source selector, countdown, idle, recording, saving, screen-permission missing and missing microphone. Match signature shadow, compact groups, orange Stop/timer and saving lock state. Keep inherited shortcuts, drag/no-drag, click-through margins, source/device selection, pause/restart/discard controls and capture exclusion. Preserve unsupported-OS/device behaviour. Permission/microphone sheets provide real recovery links/actions through existing handlers, with fixture coverage for denied/missing states. Notes remains excluded from the V1 design pass; do not delete unrelated inherited Notes code as cleanup.
**Interfaces:** Existing recorder hooks and IPC; only presentation and geometry needed for the approved bar/sheets.
**Constraints and reasons:** No new capture/native permission policy, helper changes or removal of established controls for a pixel match. Recalculate native overlay geometry through current hudGeometry seam; no viewport-size feedback loop.
- [ ] RED: named state renders, saving double-click protection, keyboard navigation and geometry/control-reachability cases.
- [ ] Implement bar and sheets.
- [ ] GREEN: same cases pass; capture/save/stop remains intact.
- [ ] Fresh Review and one PR.
**Verification:** `npx vitest run src/components/launch`; browser rendering and common checks. Native synthetic own-window start/pause/resume/stop/save and capture-exclusion observation; state no personal media/permission changes. Report native controls that require owner input.
**DONE WHEN:** Seven in-scope HUD frames have evidence; recording/save works with no source loss; bar remains excluded and recovery states have accessible keyboard paths.
**Outside cases / follow-ups:** Notes frame, capture backend rewrite, #124 policy fix and new platform support.

### Task 8: Implement the Final Editor shell, inspector and timeline presentation
**Priority:** no (owner approved normal review).
**Labels:** feature, ui.
**Milestone:** Implement approved Showhow designs (proposed).
**Depends on:** T1, T2, T7; #125 resolved or owner explicitly accepts its recorded residual limits.
**Files:** src/components/ai-edition/NewEditorShell.tsx and existing shell tests, NewEditorShell.module.css; src/components/ai-edition/v4/EditorTopBar.tsx and EditorTopBar.test.tsx, EditorShellV4.module.css, FloatingInspector.tsx and FloatingInspector.test.tsx, V4Timeline.tsx, V4Timeline.waveform.test.tsx, V4Timeline.geometry.test.tsx; src/components/ai-edition/TransportBar.tsx and TransportBar.test.tsx; src/lib/showhow/upstreamTheme.css; src/i18n/locales/*/editor.json; docs/architecture/upstream-touchpoints.md; implementation-notes.md.
**Requirements:** Editor01/06 plus shared frame structure: Showhow top bar, Library/New recording/Open navigation, warm right inspector, dark preview stage, transport and timeline lanes with orange playhead/cut semantics. Keep current editing tools, native preview, timeline gestures/zoom/trim/text/audio, save/undo/redo and shortcut guards. Move AI entry/content to the right-inspector design seam, with T9 supplying its detailed states. Preserve available upstream controls not shown in a single reference image using existing menus/facets.
**Interfaces:** Existing document/settings/timeline/native playback stores; view adapters instead of alternate editor state.
**Constraints and reasons:** No new decoder/compositor or duplicated project store. Do not reintroduce #125 callback/transport failures. Respect current .showhow/.openscreen read/save contracts.
- [ ] RED: right-inspector layout, no-project navigation, controls at minimum size and preserved timeline/shortcut cases.
- [ ] Implement shell/inspector/timeline presentation.
- [ ] GREEN: same cases pass; persisted document output and undo/redo behaviour remain unchanged for fixture edits.
- [ ] Fresh Review and one PR.
**Verification:** Focused shell/inspector/timeline tests, affected full unit/browser suites/common checks. Native synthetic playback, scrub/edit/undo/save/reopen and two isolated GIF verification-recipe runs when export/layout changes affect that path.
**DONE WHEN:** Editor01/06 and shared shell match approved reference with documented extra-tool placement; actual native playback and edit/save work; .openscreen is not overwritten on open.
**Outside cases / follow-ups:** Native renderer rewrite, new editing algorithms, source bug125 diagnosis beyond its own approved ticket.

### Task 9: Implement the Final Editor assistant and export/dialog states
**Priority:** no (owner approved normal review).
**Labels:** feature, ui.
**Milestone:** Implement approved Showhow designs (proposed).
**Depends on:** T8, T6.
**Files:** src/components/ai-edition/LeftPanel.tsx, LeftPanel.providerRefresh.test.tsx, LeftPanel.copyMessage.test.tsx, LeftPanel.tooltips.test.tsx, Modals.tsx, new Modals.design.test.tsx; src/components/video-editor/ShortcutsConfigDialog.tsx and new ShortcutsConfigDialog.design.test.tsx, NewEditorShell.tsx and NewEditorShell.chatOpen.test.tsx, ExportDialog.tsx and existing ExportDialog tests, NewEditorShell.module.css; src/components/ai-edition/v4/FloatingInspector.tsx and FloatingInspector.test.tsx; src/i18n/locales/*/editor.json and dialogs.json; docs/architecture/upstream-touchpoints.md; implementation-notes.md. No blanket authority over electron AI/native code.
**Requirements:** Editor02–05/07–08: assistant proposal/applied/Undo in right inspector, export options/rendering, unsaved changes and keyboard shortcuts. Reuse current upstream proposal/apply/undo and export services; fake backend responses are permitted in tests only. Existing editor providers are truthful; disconnected, error, cancellation and undo states are accessible. Export must not advertise completion before file write finishes. Do not promise ChatGPT Codex-login connectivity from the reference provider label.
**Interfaces:** Current chat/document action and export/dialog APIs; no provider/auth redesign.
**Constraints and reasons:** Match visual state using existing product semantics; a missing proposal/undo capability must be evidenced and returned for an explicit implementation seam, not replaced by a hard-coded success card.
- [ ] RED: proposal→apply→undo, rejected/stale proposal, export cancel/failure/success and unsaved-dialog keyboard cases.
- [ ] Implement right-inspector states and sheets/dialogs.
- [ ] GREEN: same cases pass, no document mutation after rejected/cancelled actions.
- [ ] Fresh Review and one PR.
**Verification:** Focused assistant/shell/export tests, affected full unit/browser suites/common checks. Native fake-service proposal→apply→undo on synthetic document; actual isolated GIF export with independent decode plus project-compatible MP4 export when offered by the design/current UI.
**DONE WHEN:** Six named Editor state references have evidence; assistant operations modify and undo the real document through existing actions; actual export output decodes; unsaved/shortcuts dialogs preserve focus and shortcut safety.
**Outside cases / follow-ups:** New AI provider integration, #128, editor agent tool expansion.

### Task 10: Verify the implemented Final design journey
**Priority:** no (owner approved normal review).
**Labels:** feature, ui.
**Milestone:** Implement approved Showhow designs (proposed).
**Depends on:** T2–T9.
**Files:** new docs/testing/final-design-acceptance.md; .agents/HANDOFF.md (retained sections only); implementation-notes.md; tests/e2e/final-design.spec.ts only if a reusable integration gap is demonstrated and approved in this task's Build record.
**Requirements:** Reconcile the 49-state matrix with exact source/artifact references, frame adaptations and unavailable features. Walk launch→record→saved library→guide→edit step→brief/copy→PDF→editor edit/undo→video export→library, plus import→library→editor. Include Settings theme propagation and keyboard/reduced-motion observations. Use synthetic scratch media and fake AI for repeatable runs; owner-only real-provider/clipboard acceptance stays separately labelled.
**Interfaces:** Prior tasks' actual product controls and retained evidence; no new product behaviour.
**Constraints and reasons:** Reuse unchanged candidate-bound evidence with explicit comparison; do not call static fixture screenshots native acceptance or historical CI current-head green. If a behaviour fails, report it to the owning ticket/new bounded bug rather than fixing source in this documentation task.
- [ ] Build a frame-to-implementation/evidence/exception table.
- [ ] Exercise the two named journeys and recovery examples: guide failure, import cancel, PDF write failure and export cancel.
- [ ] Confirm native cleanup and unchanged source-media hashes.
- [ ] Fresh Review and one documentation/evidence PR.
**Verification:** Observe named journeys on the final integrated macOS build; inspect representative real-app reference comparisons, independent exported PDF/video decode, cleanup, evidence bindings and current-head relevant CI. No redundant broad suite run for documentation-only reconciliation.
**DONE WHEN:** 49 reference rows have measured outcomes or explicit approved exceptions; the two journeys and four recovery examples have observed results; unresolved limitations are stated, not marked complete. No release/tag or cross-platform acceptance implied.
**Outside cases / follow-ups:** Shipping/signing/notarisation, Windows/Linux/macOS13 hardware, broader performance goals and deferred feature work.

## Superseded issues
Propose closing #127 only after explicit publication-table approval, because T2 includes its exact two fixes and evidence. Do not close #124, #125 or #128. Closed #92–#96 remain historical and are not reopened or treated as proof of current Final-design implementation. This plan does not alter parked Phase 6/10 modes.

## Self-review
Requirements and DONE WHEN are bounded to 49 named frames, supported fixture cases and two named journeys. Language such as source preservation refers to the current task's source inputs and existing saved bundle contract. Unsupported Settings fields and deferred ChatGPT/Notes are explicit exceptions. No blanket claim about arbitrary media codecs, platforms, AI accounts or screen sizes.

## Implementation notes
For each ticket append deviations to implementation-notes.md under Deviations: observed need, changed scope and approved substitute. Keep failed receipts and native proof separate from source/CI. Resolve a source-ownership mismatch before implementation, not through opportunistic edits.


## Publication mapping — 2026-10-18
Milestone: https://github.com/bedarstudios/showhow/milestone/13
- T1 = https://github.com/bedarstudios/showhow/issues/139
- T2 = https://github.com/bedarstudios/showhow/issues/140
- T3 = https://github.com/bedarstudios/showhow/issues/141
- T4 = https://github.com/bedarstudios/showhow/issues/142
- T5 = https://github.com/bedarstudios/showhow/issues/143
- T6 = https://github.com/bedarstudios/showhow/issues/144
- T7 = https://github.com/bedarstudios/showhow/issues/145
- T8 = https://github.com/bedarstudios/showhow/issues/146
- T9 = https://github.com/bedarstudios/showhow/issues/147
- T10 = https://github.com/bedarstudios/showhow/issues/148
#127 is closed as superseded by #140; fixes are not yet shipped. Owner authorises routine implementation/scope decisions without chat approval, and will approve/merge PRs in GitHub. Agents never merge. #125 is active under broader diagnosis authority and must be resolved; previous parking proposal is superseded. No second implementation lane until current ticket is returned.

## Final-design execution status — 2026-10-18

The approved plan above is retained as published, including its historical shaping and publication statements. Current execution supersedes those statements: milestone 13 and T1 #139 through T10 #148 are published and approved. #125 is closed/Done after owner-merged PR #150 at `27494aa34f2467cc107adfb586db308157ccc372`; no #125 source work remains active. T1 #139 is the only dispatched design ticket. Its base is that current-main merge, rather than the older shaping base. Routine bounded implementation/review repairs are authorised by the owner; record decisions before edits. Only the owner reviews and merges PRs in GitHub; agents never merge or release. Verify the owner merge of #139 before dispatching #140. Authority: `/Users/mohamedb/dev/loop-evidence/showhow-final-design-shape/AUTONOMY.json` and the owner dispatch instruction for #139.

## #140 execution binding — 2026-10-18

Owner merged #139 PR #151 at `dd98eab42f8d9a4de44f9ac8a1328e2946a8315e` (reviewed head `4a3ede60d6f64ef06691ae373225367ee6df9fa6`). #139 is Done; #140/T2 is active in its isolated ticket lane at that base. #122 and #139 dependencies are satisfied. Preserve #125/PR #150 native playback, end replay and model progress repairs. #141 follows only after the owner merges #140. The current source minimum is 800×600 (`electron/windows.ts`); T2 proves reachability there and reference comparison at 1200px. Use existing #139 components and existing guide/persistence contracts; no import/PDF/brief controls until their owning tasks. Record necessary bounded implementation decisions before edits. Owner autonomous routine scope/repair authority is `/Users/mohamedb/dev/loop-evidence/showhow-final-design-shape/AUTONOMY.json`. No agent merge, dependent dispatch or release.


## #141 execution binding — 2026-10-18

Owner merged #140 PR #152 on 2026-10-18T18:38:28Z as `9eb781dcbc1d46528d2cfe387d1285bae7fab40b`; reviewed head `d3c22394d74279d695b01166c1abd55d063117f5` had ten successful CI checks and fresh separate PASS verdicts. T2 #140 is Done. T3 #141 is active from that merge in `ticket/141-library-mp4-import`, lane w74. Next is #142 only after the owner merges #141; no dependent dispatch by this lead. Preserve the published requirements and landing plan above. Authority remains `/Users/mohamedb/dev/loop-evidence/showhow-final-design-shape/AUTONOMY.json`: routine bounded implementation/test/review repairs are authorised, recorded before edits; only owner reviews/merges in GitHub. Evidence is external `~/dev/loop-evidence/showhow-141/`. Keep #128 parked; no release, auth, permissions or personal-data work.


# Showhow #171 preview sizing Plan

## Goal
Make the Library recording fill the available preview area while preserving its aspect ratio and reachable controls.

## Context and decisions
Owner explicitly approved this scope and normal review on 2026-10-22: “Approve — normal review”. Issue #170 remains owner-owned frontend practice. #172 follows #171. #148 remains frozen at Prove; no active implementation worker, no implied waiver of its separate proof/tool gates. #169 is closed after owner playback confirmation and decoded-audio checks.
Reuse the existing Library/VideoPlayer design. No redesign or new feature. The current VideoPlayer uses flex layout/object-contain, and RecordingLibrary provides 240px/340px fixed heights. These are observations, not a proved cause.

## Bounded requirements
For synthetic landscape full-screen, portrait and square clips, scale the Library preview to the largest image contained in its available video viewport. Preserve aspect ratio, with unused space only on the axis required by that ratio. Keep Play/Pause, seek and time controls visible and usable at the supported minimum Library window size and at 1200px reference width. Preserve source switching and seeking.

## Architecture
Use the existing VideoPlayer and its Library caller. No alternate player, new dependency, recorder/native changes, persistence or personal-media access.

### Task 1: Fix the Library recording preview — existing issue #171
**Priority:** no, explicit owner answer.
**Labels:** bug, ui.
**Milestone:** none.
**Depends on:** none; #148 stays paused while this bounded bug is fixed.
**Files:** src/components/showhow/VideoPlayer.tsx; src/components/library/RecordingLibrary.tsx only if diagnosis requires its sizing seam; src/components/showhow/VideoPlayer.test.tsx; new src/components/showhow/VideoPlayer.browser.test.tsx for actual layout; src/components/library/RecordingLibrary.test.tsx only if caller behavior changes; PLAN.md (append this plan); implementation-notes.md.
**Requirements:** the bounded layout and playback behavior above.
**Interfaces:** existing VideoPlayer props and Library media source/seek callbacks.
**Constraints and reasons:** reproduce actual displayed image geometry before editing; source inspection alone is not RED. Use synthetic scratch media, preserve failed receipts, leave #170/#172/#148 source untouched. No credentials, .env files, private vault/screenshots or owner recordings. No OS permission changes.
- [ ] Capture observed layout RED and BEFORE screenshot.
- [ ] Smallest fix at the demonstrated shared seam.
- [ ] Same actual geometry check GREEN and AFTER screenshot, plus playback/seek/source-switch regressions.
- [ ] Packaged macOS proof, fresh independent Standards and Requirements review, one unmerged PR.
**Verification:** targeted real-browser geometry tests with production CSS and synthetic clips; affected unit/browser suites, production/test TypeScript, Biome, branding and i18n when applicable. Build and test under project resource scheduling. Verify full-screen synthetic clip in explicitly bound packaged macOS app with isolated profile. Preserve source hashes; observe cleanup. Distinguish browser/source from packaged/native proof. The existing export recipe has pinned-tool restrictions; do not weaken its doctor or change tools/profiles automatically. A packaging proof blocker returns to coordinator.
**DONE WHEN:** landscape/portrait/square browser geometry and playback checks pass; a full-screen synthetic recording fills its preview area in the packaged macOS app; controls stay reachable; fresh independent Standards/Requirements PASS and applicable current-head hosted CI pass on one review-ready PR. No agent merge.
**Outside cases / follow-ups:** #170 logo, #172 launcher previews, #148 integrated acceptance, Linux packaging and Windows/Linux runtime.

## Self-review
Requirements and DONE WHEN use bounded named clips, sizes and controls; no unlimited promises.

## Implementation notes
Append deviations to implementation-notes.md. Widened source ownership requires coordinator/owner scope resolution before edits.
