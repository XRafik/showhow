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
- Evidence, gathered 2026-10-16 from a read-only upstream clone (no remote added):
  - Upstream `main` is at `bb4660b1` (`v2.1.0-rc.3`), 458 commits after `v2.0.0` and 192 after the assessment's `9c55596e`.
  - v2 runs on Electron 41.2.1. The Rust compositor (`crates/compositor`, Metal + VideoToolbox on macOS) reaches the app as the napi-rs addon `compositor_view.node` (`crates/compositor-view-napi`), which also embeds the live preview view.
  - v2's main process is about 38,600 lines of TypeScript in 227 files under `electron/`; Showhow's is about 10,500, of which about 3,700 are the Showhow layer.
  - v2 keeps `<video path>.cursor.json` (`electron/recording/nativeMacCaptureStop.ts`, `electron/cli/projectCommands.ts`, `electron/mcp/media-tools.ts`).
  - v2 migrates old `EditorProjectData` projects into its `AxcutDocument` model (`src/lib/ai-edition/document/migrate.ts`).
  - v2 ships seven original cursor packs and a generated `THIRD-PARTY-NOTICES.md`; the 17 Sweezy packs are gone.
  - v2 transcribes with native whisper.cpp (`electron/stt/`) and downloads its default `small` model from Hugging Face on first use. It has no `@xenova/transformers` dependency.
  - Prior assessment: `docs/research/2026-10-12-openscreen-v2-assessment.md`.
- Owner decisions, shaping session 2026-10-16:
  1. Runtime: stay on Electron. A WebKit shell would mean rewriting v2's main process and compositor binding and re-porting every upstream release.
  2. Upstream is a release parent: Showhow merges each upstream release tag through a reviewed PR.
  3. Design split by ownership: Showhow-owned screens (library, settings, guide and brief views, Copy for agent, PDF) follow the Final frames; upstream screens (editor, HUD, recorder) take the Showhow look through theme tokens, CSS and small wrapper slots without restructuring upstream components.
  4. This plan covers the move only. V1 features are shaped later.
  5. Transcription: v2's native engine, with a small model bundled in the app.
  6. No gap on `main`: the v2 base and the Showhow-layer port land in one PR.
- Confirmed assumptions:
  - Real `git merge` of the upstream tag into Showhow history, so later release merges have a merge base. `UPSTREAM.md` allows a permanent tags-only `upstream` remote.
  - Work starts on `v2.1.0-rc.3`; Task 2 merges to `main` only on the final `v2.1.0` tag.
  - User-visible "OpenScreen" text becomes Showhow. Internal names (helper binaries, the `openscreen` CLI, the MCP server id, the `.openscreen` extension) stay as upstream has them unless they are persisted or user-visible. CLI and MCP stay in the code, hidden and off.
  - Bundled model: whisper.cpp `base` multilingual, quantised (about 60–80 MB). Larger models stay downloadable through v2's model manager.
  - Size: Task 4 records v2's untrimmed baseline, then targets ≤ 400 MB installed on macOS arm64, model included.
  - Browser companion code and tests are deleted, not archived. The three held macOS recorder fixes are closed as covered by v2. Issues #54–#63 stay parked for re-triage after the milestone. Upstream's AI editing assistant stays as upstream ships it, optional and off until configured.
  - Windows and Linux are reported as untested; native acceptance is a manual macOS smoke test.
- Priority: no, for all four tasks (owner answer).

## Bounded requirements
- Supported platform for acceptance: macOS 13+ on arm64. Windows and Linux builds must compile in CI where they do today; their native behaviour is untested and stated so.
- Upstream base: tag `v2.1.0` (development on `v2.1.0-rc.3`). Later upstream tags are follow-ups.
- Identity kept unchanged: `appId` `com.bedarstudios.showhow` and `productName` `Showhow` (changing them moves userData and resets macOS TCC grants, `electron-builder.json5:10`).
- Legacy cases that must pass (Task 2): (L1) a `.showhow` project saved by Showhow `main` at `fc50566a` opens in the v2 editor and the file's bytes are unchanged after opening; (L2) a `.openscreen` project from the same build opens without being overwritten, and the next save defaults to a new `.showhow` file; (L3) bundles recorded by `fc50566a` appear in the library and open; (L4) the recordings folder and the preferences set in a `fc50566a` profile survive the first launch of the new build; (L5) a new recording writes `<video path>.cursor.json` and the editor reads it.
- Excluded from this milestone: the six V1 features in their new design, ChatGPT sign-in, upstream CLI and MCP exposure, Windows and Linux native fixes, upstream releases after `v2.1.0`.

## Architecture
- After Task 2, the tree is upstream `v2.1.0` plus a Showhow layer. Showhow-owned code stays in `electron/showhow/`, `src/lib/showhow/`, `src/components/showhow/` and `src/components/library/`. Edits to upstream files are kept to identity, theming, wiring and slot points, and each one is listed in `docs/architecture/upstream-touchpoints.md` (new) so release merges know where conflicts will come from.
- Theming on upstream screens goes through Showhow design tokens (`src/lib/showhow/designTokens.ts`, `theme.ts`) mapped onto upstream's CSS variables and Tailwind config, not by forking upstream components.
- Transcription after Task 3: bundle transcripts call v2's `electron/stt/` engine from the main process. `transcript.txt` keeps its current timestamped format (`src/lib/showhow/transcriptFormat.ts`) and its fail-open rule (`docs/architecture/showhow-bundles.md`: a failure still writes `transcript.txt` with `(transcription failed)`).

## Milestones
**Move onto upstream v2** (GitHub milestone 12). Published 2026-10-16: Task 1 = #115, Task 2 = #116, Task 3 = #117, Task 4 = #118.

Task 1 → Task 2 → Task 3 → Task 4, in order. Outcome: Showhow `main` is upstream `v2.1.0` plus the Showhow layer, transcribes with v2's engine and ships at ≤ 400 MB. No `v*` release tag is pushed until the milestone is done.

### Task 1: Rewrite the upstream policy and refresh the v2 evidence

**Priority:** no
**Labels:** feature
**Milestone:** Move onto upstream v2
**Depends on:** none
**Files:** `UPSTREAM.md`, `docs/research/2026-10-12-openscreen-v2-assessment.md` (append a dated refresh section), `AGENTS.md`, `.agents/CONTEXT.md`, `ROADMAP.md`, `implementation-notes.md`
**Requirements:**
- `UPSTREAM.md` describes the release-parent model: a permanent `upstream` remote that fetches tags only; one reviewed merge PR per upstream release tag (`v*` without `-`, or a named rc used as a development base); the per-merge checklist (identity diff review, `docs/architecture/upstream-touchpoints.md` update, branding check, the Task 2 legacy cases L1–L5, macOS smoke test); and what is still excluded (upstream release pipeline, publishers, package identity, product branding).
- The assessment gains a refresh section against `v2.1.0-rc.3` (`bb4660b1`) covering: runtime and compositor binding, transcription engine and model download, project migration, cursor packs and notices, and the list of Showhow-layer features with their v2 counterpart (or none).
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

### Task 2: Showhow on upstream v2.1.0

**Priority:** no
**Labels:** feature, ui
**Milestone:** Move onto upstream v2
**Depends on:** Task 1
**Files:** the merge commit of upstream `v2.1.0` into the ticket branch, plus: `electron/showhow/**`, `src/lib/showhow/**`, `src/components/showhow/**`, `src/components/library/**`, `src/components/launch/**`, `electron/bootstrap.ts`, `electron/main.ts`, `electron/preload.ts`, `electron/ipc/handlers.ts` (identity and wiring only), `electron-builder.json5`, `package.json`, `vite.config.ts`, `src/App.tsx`, `src/i18n/locales/**`, `src/assets/fonts/**`, `public/cursors/**`, `scripts/branding-check.mjs`, `scripts/audit-showhow-bundle.mjs`, `docs/architecture/showhow-bundles.md`, `docs/architecture/upstream-touchpoints.md` (new), `tests/fixtures/legacy/**` (new), `NOTICE.md`, `implementation-notes.md`. Deleted: `electron/showhow/bridge*`, `electron/showhow/companionStepCapture*`, `src/lib/showhow/browserCompanion*`, `src/lib/showhow/companion/**`, `scripts/build-browser-companion.mjs`, `scripts/check-bridge-bundle.mjs`, and the browser-companion source folder.
**Requirements:**
- R2.1 The branch history contains upstream `v2.1.0` as a merge parent (`git merge-base --is-ancestor v2.1.0 HEAD` exits 0).
- R2.2 Identity: `appId`, `productName`, app icon, user-visible app name and window titles are Showhow's. User-visible "OpenScreen" strings in the 13 locales are replaced; `npm run branding:check` passes. Internal identifiers follow the confirmed rule; each one kept or renamed is listed in `upstream-touchpoints.md` with its role (persisted, IPC, helper discovery, user-visible).
- R2.3 The Showhow layer works on v2: recordings save a bundle per `docs/architecture/showhow-bundles.md` (video, `cursor.json`, `meta.json`, `transcript.txt`, `screenshots/`); the library is the home window and lists bundles; workflow documents generate as on `fc50566a`; the media protocol serves bundle files.
- R2.4 Transcription keeps working with today's Whisper-tiny renderer pipeline (replaced in Task 3).
- R2.5 The v2 editor replaces the inherited editor. Opening a bundle from the library opens it in the v2 editor.
- R2.6 Upstream screens (editor, HUD, recorder) use Showhow tokens for colour, type (Inter Tight) and radius through upstream's CSS variables; no upstream component is restructured. Showhow-owned screens keep their current look.
- R2.7 Legacy cases L1–L5 pass, using fixtures in `tests/fixtures/legacy/` made with the `fc50566a` build.
- R2.8 The browser companion and the 17 Sweezy cursor packs are absent from the source tree and the packaged app. Upstream's `THIRD-PARTY-NOTICES.md` generation runs in the build.
- R2.9 Upstream CLI and MCP are not reachable from Showhow's UI and MCP is off by default.
**Interfaces:** Consumes upstream's recording, editor and document APIs. Produces the same bundle layout and `showhow:*` IPC channels the library and workflow code use today (minus companion channels).
**Constraints and reasons:**
- Do not change `appId` or `productName`: macOS TCC grants and userData depend on them.
- A bundle or transcript failure must never discard a valid recording (AGENTS.md).
- Legacy files are never overwritten on open (AGENTS.md compatibility constraints).
- Keep edits to upstream files minimal and listed, because every later release merge pays for them.
- Do not merge to `main` before the final `v2.1.0` tag exists; if the tag is late, keep the PR open and rebase the merge onto it.

- [ ] RED: with fixtures made from `fc50566a`, new tests for L1–L5 and a bundle-save test at the v2 recording seam fail on the branch after the raw upstream merge (before the Showhow layer is ported).
- [ ] Merge, re-apply identity, port the layer, delete the companion and Sweezy packs, apply theming, write `upstream-touchpoints.md`.
- [ ] GREEN: L1–L5 and the bundle tests pass; the existing Showhow-layer unit and browser tests pass (minus deleted companion tests).
- [ ] Prove and obtain independent review, then open the PR to main.

**Verification:**
- `git merge-base --is-ancestor v2.1.0 HEAD`: exit 0.
- `npm run lint`, `npx tsc --noEmit`, `npm run test`, `npm run test:browser`, `npm run i18n:check`, `npm run branding:check`: pass.
- `npm run verify:export -- --evidence-dir artifacts/verification-recipe/<new-dir>` against the new editor (update the recipe's locators if v2 renamed them; record that in `implementation-notes.md`).
- Manual macOS arm64 smoke test on a packaged build, with screenshots: first launch on a copied `fc50566a` profile (L4); library lists old bundles (L3); a new narrated recording saves a full bundle (L5, R2.3); the bundle opens in the v2 editor (R2.5); old `.showhow` and `.openscreen` projects open (L1, L2); HUD and editor show Showhow theming (R2.6).
- `grep -rli sweezy public src electron` finds nothing; the packaged `Resources` has no companion or Sweezy files.
**DONE WHEN:** the six verification items above pass and their evidence (command output, screenshots, file hashes for L1/L2) is in the PR; `upstream-touchpoints.md` lists each edited upstream file; the PR states Windows and Linux as untested; the PR merges only after `v2.1.0` final is tagged upstream.
**Outside cases / follow-ups:** redesigned V1 screens; ChatGPT/OpenRouter connections in Showhow's provider boundary; native Windows and Linux checks; recipe changes beyond locator updates.

### Task 3: Bundle transcripts from v2's native engine with a bundled model

**Priority:** no
**Labels:** feature
**Milestone:** Move onto upstream v2
**Depends on:** Task 2
**Files:** `electron/showhow/**` (transcript job), `src/lib/showhow/generateTranscript.ts`, `src/lib/showhow/transcriptFormat.ts`, `src/lib/captioning/**` (removal of the Whisper-tiny worker), `electron/stt/modelManager.ts` (bundled-model lookup only), `scripts/fetch-caption-model.mjs` (replaced by a pinned whisper.cpp model fetch), `electron-builder.json5`, `package.json`, `THIRD-PARTY-NOTICES` inputs, `docs/architecture/showhow-bundles.md`, `docs/architecture/upstream-touchpoints.md`, `implementation-notes.md`
**Requirements:**
- R3.1 A new recording's `transcript.txt` is produced by v2's whisper.cpp engine using the bundled `base` multilingual quantised model, with no network access needed.
- R3.2 `transcript.txt` keeps today's timestamped line format; existing `transcriptFormat` tests pass unchanged.
- R3.3 Fail-open: when transcription fails (cases: model file missing, engine error, zero-length audio), `transcript.txt` contains `(transcription failed)` and the recording and bundle stay intact.
- R3.4 The model is fetched at build time from a pinned Hugging Face revision with its SHA-256 checked; its licence is recorded in the third-party notices.
- R3.5 `@xenova/transformers`, `onnxruntime-web` and the `caption-assets` Whisper-tiny files are gone from `package.json` and the packaged app.
- R3.6 v2's model manager still offers its larger downloadable models; the bundled model is used when no larger one is chosen.
**Interfaces:** The bundle save path requests a transcript job; the job writes `transcript.txt` through the existing `showhow:write-transcript` contract or its main-process equivalent.
**Constraints and reasons:** Keep the edit to `electron/stt/` to a bundled-model lookup, listed in `upstream-touchpoints.md`, so upstream merges stay cheap.

- [ ] RED: a test at the transcript-job seam expects the native engine and the bundled model path and fails; a fail-open test for the three named failure cases fails or is absent.
- [ ] Wire the job to `electron/stt/`, bundle the pinned model, remove the old stack.
- [ ] GREEN: the new tests and existing `transcriptFormat` tests pass.
- [ ] Prove and obtain independent review, then open the PR to main.

**Verification:** `npm run lint`, `npx tsc --noEmit`, `npm run test`, `npm run test:browser`; `node scripts/check-package-contents.mjs <app>` shows no `@xenova`/`onnxruntime-web`; manual macOS smoke test with Wi-Fi off: a narrated 30-second recording produces a timestamped `transcript.txt`; with the model file renamed, a recording still saves and `transcript.txt` says `(transcription failed)`.
**DONE WHEN:** the four verification items pass with evidence in the PR (transcript excerpt, failure-case transcript, package report, pinned revision and hash).
**Outside cases / follow-ups:** transcript glossary (upstream `13db77e5`); word-level alignment use in guides.

### Task 4: Re-apply the size trim to the v2 build

**Priority:** no
**Labels:** feature
**Milestone:** Move onto upstream v2
**Depends on:** Task 3
**Files:** `electron-builder.json5`, `vite.config.ts` (only if needed), `scripts/check-package-contents.mjs`, `scripts/check-package-contents.node-test.mjs`, `scripts/fixtures/package-contents/**`, `package.json` (scripts only), `implementation-notes.md`
**Requirements:**
- R4.1 Record the untrimmed v2 installed size and arm64 DMG size at Task 3's merge commit before changing anything.
- R4.2 The packaged app's `app.asar` and `app.asar.unpacked` contain only the `node_modules` packages the built main process loads at runtime; the audit's allow-list names each one with the reason.
- R4.3 Chromium language packs are limited to the 13 app locales plus `en` and `en-GB`; wallpapers ship once; unreferenced `public/` images are excluded (same rules as Task 1 of the size plan, #110).
- R4.4 Installed macOS arm64 size ≤ 400 MB, model included.
- R4.5 No regression on these packaged-app paths: launch to library, native recording saves a bundle, offline transcript, v2 editor opens with a wallpaper background, `npm run verify:export` passes.
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
None closed by this plan. The three held macOS recorder fixes (upstream `29736d4d`, `f261fa45`, `52eda0e6`) were never filed as issues; they are recorded as covered by v2 in Task 1's refresh section. Issues #54–#63 stay open and parked for re-triage after the milestone.

## Self-review
Unbounded-word scan of requirements and DONE WHEN: "every later upstream merge" (Task 1 interfaces) and "every later release merge" (Task 2 constraints) are reasons, not acceptance. "Each upstream release tag" in R1 is bounded by the policy's tag rule. "Each one kept or renamed" (R2.2) and "each edited upstream file" (Task 2 DONE WHEN) are bounded by the diff against `v2.1.0`. "All", "any" and "valid" do not appear in acceptance; "each one" in R4.2 is bounded by the audit allow-list.

## Implementation notes
Append each deviation from this plan to `implementation-notes.md` under "Deviations": what changed, why and what was done instead. Commit it with the ticket. Path-scope checks treat it as an owned path.
