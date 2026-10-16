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
