# Implementation notes

## 19 October 2026 — Showhow #144 Settings screens

Built in a single Claude Code session (Codex weekly limit exhausted); reviewers were separate fresh
agents. Settings replaces the Library detail pane; no recording row is selected while it is open.

Frame inventory (working control / truthful exception):
- Settings-01/02 AI connections: OpenRouter Connected / Not connected comes from the main-process key
  check; Add API key / Manage key opens the existing key form. OpenRouter keys do not expire, so
  Settings-02's "Session expired" has no OpenRouter equivalent and is not shown; a status-check
  failure shows an error instead. ChatGPT is "Coming later" with a disabled sign-in and no account
  details (#128 parked).
- Settings-03 Recording: Hide desktop icons saves through the existing recording-preference store
  and follows changes from other windows. The recordings folder (fixed ~/Showhow/Recordings) and the
  countdown (fixed 3 s) are shown read-only with an explanation: neither has a preference today.
- Settings-04 Transcription: names the bundled Whisper model (base q5_1, ~60 MB; a test ties it to
  the bundle manifest). No "Ready" badge: development builds lack the helper, so it could be false.
  Names and terms is a disabled field marked "Coming later".
- Settings-05 Agents: the copy format is the single real format, shown as text rather than a menu;
  MCP server is a disabled switch marked "Coming later".
- Settings-06 Appearance: Light / Dark / System use the existing theme store; every window listens
  to it, so open windows follow.
The old Settings sheet (AiGuideSettings) is removed, and the key form loses its one-item fake tab bar.

## 19 October 2026 — Showhow #143 workflow PDF export

Built in a single Claude Code session (Codex weekly limit exhausted), not through the Herdr lane.
Reviewers were separate fresh agents.

Deviations and adaptations:
- Library-12's preview is a schematic (real title, step count and duration; placeholder rows per
  included part), not a rendered page.
- The modal eyebrow is "Guide" in both states; Library-25 shows "Showhow" on the saved state.
- Steps have no narration field, so Narration quotes the persisted transcript lines leading into
  each step. Hidden sensitive steps drop their narration as well as their text and image.
- The PDF uses the system font stack; the app's bundled web fonts are not embedded.

## 19 October 2026 — Showhow #142 agent brief and Copy for agent

Built in a single Claude Code session at the owner's direction (Codex weekly limit exhausted), not
through the Herdr ticket lane. Writer and fresh reviewer were separate sessions.

Deviations and adaptations:
- The Library-07 "Bug report" kind tag is not implemented. Classifying a recording would be an
  inferred claim; the brief records only cited claims and explicit unknowns.
- Library-21's "~6s left" estimate is not shown; only the real phase ("Step n of 3") is reported.
- Library-24's toast is a fixed status element in the Library window, not a new toaster mount.
- A "Remake brief" control sits under a ready brief. The frames have no remake control, and a brief
  must be replaceable after its recording changes.
- Brief "send without asking" is a real gate, unlike the guide's retained checkbox (see
  `docs/architecture/showhow-bundles.md`).
- `aiGuide.ts` exports its step validator, current-steps source and frame reader for reuse;
  guide behaviour is unchanged.

## 16 October 2026 — Showhow #108 overnight retirement

Removed the dedicated overnight controller/test family, policy, skill and
workflow. Removed its two CI jobs and integration-test call; product CI commands
and setup remain intact. Removed the setup-success marker after confirming its
only consumer was the retired skill. Retained manual Copilot setup and guidance.
The pilot document now says Retired and links the merged central Loop decision;
its original historical record is unchanged. PLAN.md changes remove only the
obsolete overnight verification calls and cloud-job reference.

No scope deviations. This is bounded source removal and consumer repair: no new
product behaviour or artificial prose-token RED tests. Executor source evidence
and snapshots are under `/Users/mohamedb/dev/loop-evidence/showhow-108/executor/`.
The lead owns dependency setup, retained-suite proof and fresh independent
review. Live workflow disablement and ledger history are lead-owned receipts;
no cloud dispatch, settings change or ledger closure occurred in Build. Merge
and post-merge ledger closure retain their owner/coordinator gates.

### Operational deviations reported by the lead

Dependency setup used `HUSKY=0 npm ci` under the heavy lock and passed; the
lane's dependencies are a real local directory. Initial runtime preflight failed
because configured Git hooks were missing; the failed receipt is retained in
`lead/runtime-preflight.json`. The lead ran
`env GIT_CONFIG=/Users/mohamedb/dev/loop-evidence/showhow-108/lead/scratch-husky-config npm run prepare`,
generating only ticket-local `.husky/_` files and directing the Git configuration
write to an external scratch file. Shared Git configuration was not changed.
Fresh preflight is retained in `lead/runtime-preflight-after-hooks.json`.

The browser-install attempt returned resource-busy heavy exit 75 before its
command started (`lead/browser-setup.json`); proof remains pending. The lead also
reported a cross-workspace coordinator prompt wrapper refusal: exit 1,
`herdr: refused: target agent is outside the lead workspace`
(`lead/coordinator-progress.json`). This is retained as an operational refusal,
without changing shared resource or provider settings.
All receipt paths in this section are relative to
`/Users/mohamedb/dev/loop-evidence/showhow-108/`. These setup observations belong
to the lead; the executor did not install dependencies or run heavy proof.

---

# Issue 110 implementation notes

## Deviations

- The owner approved a bounded expansion on 2026-10-16 after the executor stopped:
  update `scripts/verify-showhow-export.mjs`, its node tests and the verification
  recipe to accept the installed Codex CLI 0.162.1 and explicitly launch a packaged
  `.app`. The former driver launched dependency Electron and could not prove R6
  against the package. Both known Codex versions (0.160.0 and 0.162.1) are accepted;
  other versions still fail prerequisites. No version output is substituted.
- macOS Electron 41.2.1 ships British English as `en_GB.lproj`, not `en-GB.lproj`.
  The first after-build audit caught 13 locales. The configuration and audit use
  the actual macOS name `en_GB` to retain the required fourteenth pack. The failed
  build and receipt remain in the external evidence root.
- The current packaged wallpaper resolver is in `electron/windows.ts` and passes
  a resources-based asset URL to the preload, rather than the older preload-only
  description in the plan. Excluding `dist/wallpapers` in electron-builder keeps
  the resources copy without a Vite change.
- No pre-existing baseline DMG was available. A fresh unchanged-config arm64
  app and DMG were built before packaging edits, separately from the owner's
  preserved 865M installed BEFORE app. Compare the freshly built baseline DMG
  with the after DMG; do not present it as a historical installer measurement.
- Meaningful behavioral RED was captured against a callable audit stub, in
  addition to the lead's earlier missing-script receipt. The fixture tests build
  tiny real ASAR archives and unpacked directory trees; they do not mock listings.
- Installed size uses `du -sk` allocated KiB converted to MiB, matching `du -sh`
  acceptance on this macOS machine. Windows and Linux remain untested.

## Ownership and proof limits

All command receipts and preserved builds live outside the worktree at
`/Users/mohamedb/dev/loop-evidence/showhow-110`. Failed attempts remain intact.
The lead owns packaged R6 GUI/transcription proof, independent native review and
Ship. No production main, renderer, assets, dependencies, `asarUnpack`, Whisper
model or cursor packs were changed. Executor checks alone do not establish R6.

## Accepted R6 plan clarification — 2026-10-16

The owner explicitly accepts the existing HUD startup followed by Open Studio
navigation to the library as the R6 launch/library check. A change to launch
directly into the library is not required. The lead reports that the packaged
baseline and AFTER main entrypoints have the same SHA256:
`fc8d6b87ff757a2490124cb31e09c54910784164020b7840ed62790417af3acd`.
No runtime or verifier source changed for this clarification.

At this notes-only update, the lead reports two passing packaged
`verify:export` runs. The actual native helper recorded a 17.369-second synthetic
TextEdit window and saved a bundle with valid MP4 media that passed full FFmpeg
decode. No TCC prompt appeared and no native-recording fallback was needed.
Transcription and library proof remain ongoing; this note does not claim that
R6 is complete.

Source proof may be reused for unchanged bytes. The lead will snapshot this
notes-only change again before commit and independent review.

## Rebase after Showhow #108 merge - 2026-10-16

The owner directed a rebase onto main after PR #112. The only conflict was an
add/add on this notes file. Both the #108 history and the complete #110 notes
were retained, in that order. No implementation, tests, package configuration
or packaged inputs changed. The lead owns focused checks and the explicit
candidate/proof comparison before updating the existing PR.


## Showhow #115 — upstream policy and evidence refresh — 2026-10-16

Replaced selective intake with the approved release-parent policy: a permanent tags-only
remote (documented, not configured here), one reviewed merge PR per upstream release tag,
identity/touchpoints/branding/legacy/native checks, and the existing pipeline/publisher exclusions.
Updated AGENTS and context pointers and the roadmap's optional AI connections wording.
Appended the five-topic assessment against both immutable pins. No app, build, config, package
identity or cursor assets changed. Tasks 2/3 functionality remains planned; final v2.1.0 and
milestone release-tag gates are unchanged.

### Correction and deviation

Build initially stopped because the approved shorthand paired rc.3 with bb4660b1. The actual
`v2.1.0-rc.3` tag is `523a3e4c47cf7566cc5c759ad5275f7edcd3382e`; the separate shaping
snapshot is `bb4660b11d2e1f87f5f5fc57dd6acb14e248109f`. The coordinator's factual
clarification (`coordinator-20261016T184047Z/pin-clarification.md` in the ticket evidence root)
cleared this stop within the original documentation scope. This is a **coordinator clarification**,
not a new owner answer or owner decision; the resume message's “coordinator/owner” wording
was imprecise. The original messages and stopped receipts remain preserved.

The full compare reports diverged, 20 ahead / 9 behind; no simple ancestry is inferred from the
shallow clone. The refresh compares both pins and records differences in package version,
compositor diagnostic tests and chat rewind handling. It also clarifies six named cursor packs
plus the default and checked-in notices versus generated npm licence texts. These are factual
corrections, not changes to the approved product choices. No concrete requirement conflict
was found: adapting the fixed small-model manager to bundled base is already Task 3's work.

Evidence remains external at `/Users/mohamedb/dev/loop-evidence/showhow-115/`. Reused BEFORE
and RED are `lead/before/`, `lead/before-manifest.json` and `lead/before.json`, captured by the
lead before edits; they are not fresh executor observations. Original `STOP.md`, `BUILD-RETURN.md`
and failed raw receipts are untouched. Resumed source/check receipts, diff and hashes are in
`executor/resume-*`; `BUILD-RETURN-RESUMED.md` records the return. Lead owns Prove, fresh
native Review and Ship. Failed-review count remains 0; executor gives no review verdict.


### Verification requirement conflict and external proposal

The earlier “no concrete requirement conflict” statement concerned source-research feasibility
and settled product choices only. Verification has a separate inherited blocker: required
`npm run branding:check` exits 1 on eight unchanged `PLAN.md` lines (191, 202, 213, 224,
243, 251, 269, 294). The complete pristine `a06da359` archive reproduces the exact same
findings with the same scanner and policy. This conflicts with #115's required branding pass
and its six-file scope/no plan rewrite. Neither PLAN nor the ticket allowlist was changed.
The required branding result remains RED. No independent review or PR is authorised by this return.

Lint initially exited 127 because this lane has no node_modules. Read-only reuse of the canonical
checkout's Biome 2.4.12 (matching package-lock) lets exact `npm run lint` exit 0, with the existing
`deferredClick.test.ts:28` empty-block warning. No dependencies or tracked configuration changed.
The paired GREEN greps pass; prefix and scope receipts accompany the candidate.

At the coordinator's preparation instruction, an external, **proposed and unapproved** patch
adds counted allowances for only those eight exact PLAN lines to `config/branding-allowlist.json`.
It is not applied to this ticket. Scratch proof uses the complete baseline tracked file list,
the same scanner and policy schema: baseline RED, proposed policy GREEN, unrelated injected
legacy-name finding still RED. Patch, proposed JSON and raw receipts are external under
`executor/resume-PROPOSED-UNAPPROVED-*` and `executor/resume-proposal-*`.
Recommendation to the owner: add only `config/branding-allowlist.json` to #115's owned scope
for this exact allowance proposal. This is a coordinator-prepared recommendation, not owner
approval. Lead must transfer this verification conflict for coordinator/owner clearance before
fresh Review or Ship. Failed-review count remains 0; no review verdict.


## Showhow #115 — owner-approved scope addition — 2026-10-16

The owner explicitly approved adding only `config/branding-allowlist.json` to #115's scope
for the exact external patch SHA-256
`72483c27af4253dfbe052078aaa7d02f647fe858a46ffdcee3e067a90b632cda`.
Approval and clearance: `coordinator-20261016T184047Z/owner-scope-approved.md` and
`owner-scope-clearance-readback.json` under the ticket evidence root. This owner answer
is distinct from the earlier coordinator factual pin clarification. It authorises the scope
addition and resumption only; it grants no merge consent, proof/review waiver or product change.

After verifying that hash and all six frozen candidate hashes, the executor applied exactly
the approved patch: one PLAN allowance entry with eight exact line literals, each count 1.
No PLAN text, scanner, existing allowance, app source, workflow or dependency file changed.
The earlier unapproved scratch proof and required branding RED are retained as history;
new required branding/lint and seven-path preservation receipts cover this resumed candidate.
The previous six-path-only stop is cleared by this specific scope approval. Old STOP files,
returns and raw failed receipts are preserved; `BUILD-RETURN-OWNER-APPROVED.md` records
this return. The earlier six documentation files remain owned, with notes append-only.

Same lane/base, failed-review count 0, reviewer identity not observed and no review verdict.
Lead owns Prove and fresh independent Review before Ship. No commit, push or publication by
executor. Final upstream v2.1.0 and milestone release-tag gates remain unchanged.


## 2026-10-16 — #116 upstream v2 Build (in progress)

- Executor w66:p2, clean base `d2e3d72f12debbb31914bcbdb22b43ba434a22fb`, lead w66:p1. User explicitly authorised Build after authentic fixture capture. Evidence: `/Users/mohamedb/dev/loop-evidence/showhow-116/executor/`. No commit, push, publication, PR merge or release authority.
- Configured the permanent tags-only upstream remote and verified actual rc.3 commit `523a3e4c47cf7566cc5c759ad5275f7edcd3382e`. Real `git merge --no-commit --no-ff refs/tags/upstream/v2.1.0-rc.3` stopped with conflicts. Raw stdout/stderr/exit, index stages, staged and unstaged diffs are preserved before resolution/port. `MERGE_HEAD` must remain the actual pinned parent. Final-tag ancestry is not proved; the owner-authorised eventual PR landing must use a merge commit, not squash/rebase, to retain ancestry. Coordinator then verifies the final tag on origin/main. No merge consent is implied.
- The read-first handoff's #115 next action is stale; left it and PLAN.md unchanged. The current dispatch and closed #115/#120 dependency are authoritative.
- Raw upstream executable conflict choices were recorded separately from the Showhow-layer port. First compatibility attempt was a setup failure (`process.getSystemVersion` in non-Electron tests); not RED. The next test reached five intended assertion failures; adding the new-recording cursor case produced six intended failures in `raw-compat-RED.json`. L5 already read the flat sidecar correctly upstream but failed the bundled video location contract; no claim that the raw sidecar convention was broken. `compat-port-attempt-1.json` passed all six after port. This is source/OS-adapter proof, not native capture or packaged acceptance.
- Fixtures were copied unchanged from the lead's `legacy-fixtures-v3-preserved`. Production `fc50566a` UI Save Project created .showhow, public save handler created .openscreen, production store-recorded-session created a bundle from the committed synthetic sample.webm. Hashes/provenance and synthetic profile plus separately isolated sessionData/Local Storage are retained under tests/fixtures/legacy. Original absolute serialized paths remain unchanged; relocation requires a separately recorded derived copy. Old fixtures do not claim native cursor capture. L4 native proof needs both profile AND sessionData.
- The first complete unit attempt observed 5,192 tests, 5,091 passing, 100 failed and one skipped. Preserve `unit-first.json` and `unit-first-results.json`; subsequent repairs do not erase it. Groups: browser suites incorrectly included in unit mode; old tests lacking the new opt-in jsdom boundary or synchronous getPlatform API; Showhow identity/helper-discovery/persistence/theme assertions; and tests importing modules deleted by the pinned tag. Meaningful save, workflow, identity/permissions and cursor regressions are retained. Obsolete inherited-editor tests are listed individually with exact upstream deletion/replacement provenance in retired-inherited-editor-tests.json. Renderer Whisper-tiny tests moved with their implementation into Showhow ownership rather than being deleted.
- Retained legacy Showhow userData selection, preferences, custom fonts, OPFS cache fallback and non-overwriting project reads/default save policy. New v2 document files use .showhow; prior .openscreen/.axcut are copied without deleting or overwriting their originals. `startsSettled` is kept as a legacy serialized value even though v2 computes live anticipation separately.
- Native helper conflict repair: rc.3 Swift sources were moved byte-identically into the Showhow executable targets. The first lead build failed on an empty target; preserved. Repaired SwiftPM describe reported nonempty targets, lead build attempt2 and 65 Swift tests passed. A subsequent one-line cursor change preserves the pre-migration cghidEventTap regression; NATIVE-HELPER-READY-3.json freezes the updated source for lead rebuild. No native operation claim.
- Preserve the v2 editor/export architecture. The old native GIF recipe assumes renderer WebCodecs/canvas/write-export-to-path; v2 ExportDialog uses native exportGifNative. No old editor/exporter restored to manufacture acceptance. Lead owns the exact harness/native gate assessment.
- Factual corrections: upstream has six named original cursor packs plus built-in default. THIRD-PARTY-NOTICES.md is checked in; licenses:generate produces THIRD-PARTY-LICENSES.txt. Do not invent a notices generator. Final ancestry command will use the namespaced refs/tags/upstream/v2.1.0, after final exists and is integrated. Current source develops on explicitly approved rc.3 only.
- No Task3 bundle-native transcription, Task4 size trim, provider boundary or V1 redesign. Companion implementation is removed; existing saved browser steps and degradation values remain readable compatibility data. Windows/Linux native behavior is untested. Failed-review count remains 0; reviewer identity not observed; Standards/Requirements no verdict; no PR.

### #116 continued source proof and native diagnosis

- Numbered complete unit runs retained: second 5,235 total / 5,219 pass / 15 fail / 1 pending; third 5,241 total / 5,226 pass / 14 fail / 1 pending; fourth 5,243 total / 5,240 pass / 2 fail / 1 pending. Failures were not deleted for green: public boundary mocks, canonical Showhow output strings, existing cursor denial behavior and docs checker setup were repaired. Fourth residual failures were a stale MCP error string and macOS /var versus /private/var realpath spelling in the strengthened library-open assertion. Subsequent focused proof retained separately.
- Fail-open real-filesystem tests now exercise metadata ENOSPC after video/webcam relocation and bundle-root failure before relocation; valid recording paths survive. Authentic original fixture bytes remain unchanged. An added explicitly derived media relocation fixture tests the approved v2 session boundary separately from untouched originals. Original out-of-root paths are not broadly approved to make a test pass.
- Browser attempt1 was a setup failure on old gif.js config. The real tag deleted src/lib/exporter/videoExporter.ts and replaced renderer exports with native v2 export. Three browser tests importing that removed implementation are retired with exact tag deletion provenance and original test bytes externally retained; existing mp4 settings/bitrate helper unit regressions remain. Browser config now prebundles the actual house browser test dependencies. This is not native export acceptance.
- Lint first failures were chiefly merge formatting/imports plus duplicate upstream pt-BR shortcuts keys. Safe Biome fixes applied; the duplicate removal preserves effective parsed JSON values. Immutable fixture bytes, unshipped upstream website and historical measurement snapshots are excluded from app formatting; app lint stays enabled. First i18n check required the removed AppX distribution block; validation now checks the actual Electron locales and continues validating AppX when explicitly configured, with positive and negative same-package tests. The inherited v2 tree contains15 locales, covering all prior13.
- Lead immutable arm64 package passed build with isolated LGPL SDK/native helpers. Its package archive is 72bae0309bec67fa9f979d38985e5b3ce68616bf0c544830ba8219eda9e930dc. Product formatting after that package is disclosed with before/after hashes in PRODUCTION-CHANGES-AFTER-NATIVE-READY-1.json. Native Swift source unchanged since successful helperbuild3; no new compositor source changes.
- Lead native smoke initially rejected relocated original absolute fixture paths; that is an allowed-root setup failure, not proof original files cannot open. Correct derived paths and the original synthetic OS-home both open .showhow/.openscreen without warnings and preserve project hashes. Default preview and all30 actual GIF frames remain black. Executor software source decode confirms VP9 Profile1 gbrp with colored pixels. Lead identical immutable package + original paths with only OPENSCREEN_MAC_DECODE=software yields colored native GIF; the override is diagnostic only, not product acceptance. Hardware-device creation versus actual FFmpeg output frame format is the implicated fallback seam. No new crates fix or regression was applied. External UNAPPLIED/UNCOMPILED proposed patch/test under executor/native-decoder-proposal requires scope clearance for pipeline_macos.rs before implementation; native repair is not covered by merely importing the pinned tree.
- Protected verifier script, its node-test, verification recipe, PLAN and project handoff remain byte-identical to base. Broader recipe/driver adaptation is a separate external lead proposal, no recipe PASS or waiver. Release-workflow exclusions remain; clean hosted native dependency staging has a disclosed gap. No review-ready/final ancestry claim; failed-review count0 and separate Standards/Requirements no verdict.

### #116 R2.3/R2.4 library pending transcript repair

The initial source Build transfer is superseded for this bounded regression. Lead package2 `final-transcript-import-2` selected the correct synthetic speech bundle through the library but transcript stayed pending. `final-transcript-import-3` used fresh-save switchToEditor and transcribed the same speech. This is a product resume-seam failure, not a harness or model failure. The pinned fc50566a editor explicitly consumed showhowBundleDir/showhowVideoFileUrl before starting generateTranscriptForBundle; the retained tiny renderer consumer has the same contract.

A new public-IPC test saved through store-recorded-session, verified the flat .session.json and bundle pending marker, cleared current session, reopened through showhow:open-recording, and asserted the pending job. `library-transcript-RED.json` reaches the intended failure: media path survives but both Showhow job fields are absent. Flat session discovery looks beside the bundled video, so the minimal library fallback lost the job. No test or acceptance requirement was weakened.

New owned `electron/showhow/resumeTranscript.ts` derives pending work from the existing bundle transcript marker after root/video validation; handlers changes only wire that helper. It uses the actual canonical bundled path, clears stale job fields for completed work, and never writes/replaces the transcript on open. Missing or unreadable transcript metadata keeps valid media open without a job. Same-package IPC regression plus completed/missing cases and helper EACCES/stale-manifest tests accompany the fix; existing real filesystem save-fail-open and renderer job race tests remain. No native crates/verifier/recipe changes or Task117 transcription replacement.

External decoder proposalv2 is separately validated and self-contained: source patch plus exact derived H264 control under the owned tests/fixtures/legacy path and provenance copy. Three external native tests passed; validation1 and production native/source/fixtures stayed byte-identical during that external work. Nothing from that proposal was applied to ticket source. Lead owns packaged tiny re-Prove on the new production baseline and package3; source green alone does not establish that product acceptance. Failed-review count0, no verdict/PR/commit/push.

### #116 owner-approved five-path resume — 2026-10-16

The owner replied “Yes I apprive” to the concrete proposal in coordinator-20261016T192834Z/SCOPE-APPROVAL.md. SCOPE-APPROVAL-ACCEPTED.md and resume-20261016T205008Z/OWNER-APPROVAL.md clear that specific scope stop. Earlier awaiting-approval/UNAPPLIED statuses above remain historical; this section corrects current status without erasing prior proof. Exactly five extra paths: crates/compositor/src/pipeline_macos.rs, scripts/verify-showhow-export.mjs, scripts/verify-showhow-export.node-test.mjs, docs/testing/verification-recipe.md, .github/workflows/build.yml. Original issue ownership remains; no Task117/118, capture/audio/permissions/settings/dispatch/commit/push/review/PR/merge/tag authority added.

Executor owner-resume-1/preconditions.json independently rechecked the2,068-path dirty snapshot, READY3 source/output/native hashes, unchanged index/merge parent and exact approved payload hashes. Applied native-v2 full patch cb164707540953221b8e400e7f25b772f4b47ec56c1ee57c50892e07b19c3ed6, manifest8421076c4710699cce7ef3886e423920b23481f2b967494fb74364861ca100b2, export patch fcd3d835235ee05d661a475d7a97591e7eb278afc78a5139e2b7cf84930440b3 and workflow patch3341b4c3a4648a26c5ad87138ad153034b1e0c77c54ca74b2aa383bd80079d76. Fixture/provenance destinations were absent and copied with exclusive creation, no overwrite. New H264 control is newly derived synthetic material with exact validated bytes, not an fc50566a/native capture. All15authentic source hashes remain separately authoritative. exact-payload-application.json verifies approved after-bytes and unchanged dirty index before any formatting.

Required lint first found formatting-only errors in the two new approved verifier scripts. Exact applied bytes were preserved before mechanical Biome format, same approved paths; verifier-format-equivalence.json proves parsed Acorn syntax trees identical before/after, with position/raw trivia excluded. Sixteen support tests pass both before and after. This changes current script hashes mechanically, not their approved behavior; it is disclosed rather than claiming final bytes equal the raw patch. No unsafe formatting/source rewrite or extra path scope.

Ticket-source native regression3/3passes with real Metal and actual H264 VideoToolbox retention; full compositor library reports459passed,0failed/ignored. Optional ONNX/model/visual/benchmark cases contain environment-gated early returns documented in raw stderr; this is not full product/native acceptance. Commands use existing isolated Rust1.99.1/LGPL8.1.2SDK and an evidence-root CARGO_TARGET_DIR. No executor production native binary write/rebuild. NATIVE-SOURCE-FROZEN.json binds112native source hashes for lead rebuild; only pipeline_macos.rs changed from READY3. Lead owns production compositor/addon/package rebuild and actual default original legacy-media/export proof.

Applied workflow parsing/contract/bash syntax checks pass with trigger/jobset/publisher unchanged and no hosted execution. The approved verifier now isolates os.homedir plus Electron media paths before main, targets native v2 controls and rejects synthetic black frames after independent decode. Support tests do not replace real npm run verify:export. Lead owns that actual isolated recipe and package proof. Final upstream v2.1.0 ancestry, fresh review and physical owner-controlled narrated journey remain independent gates. Failed-review count0, reviewer identity not observed, Standards/Requirements no verdict.

### Bounded verifier scratch preparation after actual recipe2

Actual npm recipe2 used genuine externally pinned Codex0.162.1 and passed doctor, then failed strict isolation realpath on fresh scratch home/Showhow. This is a verifier setup defect independently clearable in the approved verifier/test paths; no tool pin relaxation or product/native fix. Raw recipe2 and earlier failures remain preserved. New same-module real-filesystem regression reproduces the exact ENOENT during packaged pre-main initialization (16pass/1fail); the fix creates the private home/Showhow/Recordings directory idempotently during paused initialization, before production import and strict containment checks. Existing files and HOME remain unchanged. It does not weaken inside()/realpath, content, cleanup or prerequisite assertions. All17support tests and full lint pass. No recipe/GUI run by executor or product/native/generated output/package change; lead runs the actual recipe on frozen script bytes.

The separate legacy metadata suspicion is resolved by lead original-project-bound-3: both authentic project sequences pass when readiness is bound to the NEW project ID/file rather than a stale earlier toast. Metadata, new .showhow Save, full default GIF decode/palette and original hashes pass. Earlier empty-list readiness timeout is harness sequencing, not a demonstrated product metadata bug. No editor/store fix applied or further ownership requested.

### Verifier scratch repair final proof/readback correction

The first full-lint receipt after GREEN17 failed because generated actual-recipe1/2 JSON under the contract-required repository artifacts path was scanned. The earlier sentence saying full lint passed anticipated the final result; this paragraph records the exact sequence without removing that history. Lead archived those directories byte-for-byte to unique external repository-origin evidence, retaining hashes and raw failures. No Biome/config/source exclusion was added. Lead resume-20261016T205008Z/verifier-repair-lint.json now records full npm run lint exit0 (1116files,26inherited warnings). The same-module regression is meaningful ENOENT RED, then17/17GREEN.

Script/test bytes are frozen for actual recipe3 and repeat4. Lead reports actual npm run verify:export recipe3 exit0 with isolation, native GIF full decode/palette and cleanup green; repeat4 is pending at this transfer. Package252-file preservation is lead-owned and unchanged; no rebuild required for verifier-only setup. The four changes since READY4 are the verifier, its same-module test, these append-only notes and upstream-touchpoints. READY5 and verifier-scratch-repair-1 preserve exact hashes, unchanged production/generated/native hashes, dirty index and upstream merge parent. No product metadata repair was applied: project-bound-3 resolved the stale-toast sequencing issue. Review remains unperformed, failed-review0; final-tag/ancestry and owner-controlled physical acceptance remain independent gates.


### Proposed stable-v2.0 retarget — 2026-10-17, plan approval pending

Owner settled2.0 (Yeah lets do it). Prior RC Build/proof/failures/owner recordings remain history. Read-only Shape verifies READY5/index/2074paths/native/package/fixtures/owner media; no source implementation or merge metadata changed. Proposed added scope explicitly names policy/plan/research/branding, stable compatibility wrapper seams, the prior five approved native/export/build paths and selected licence generator/test/guard. Source facts correct five packs/default, fixed small/VAD and absent stable generator;117 gains bounded base/VAD/DTW conditional ownership. Final revised plan/preview approval is required before reconstruction/publication; no merge consent or automatic plan PR. Future deviations remain append-only and each stable edited upstream path gets a new inventory.


## Held macOS patches: stable older-base disposition correction

The earlier covered-by-v2 conclusion was RC-era planning history. Patches29736d4d9b71ce1dcc8b7a7b1f3c9a69e46a1c54, f261fa45db81a91d7024686f4ab50a2fe55996ec and52eda0e6820d66633dcc5bd02abf551b3331a4e9 are not ancestors of stable eff86dcba48fac490a0e153141bf8537df7ffc54. Scoped stable reads do not contain resolveMicrophoneCapture/MicrophoneCapture, the inspected first-frame startedAtMs propagation, failed-start cleanup and restart-message symbols. Receiver checks match coordinator receipts. These are untrusted source observations with native uncertainty, not failure or semantic-coverage verdicts.

Keep the three patches held for later re-triage. They were never filed as issues: no closed issue is reopened. No automatic backport, whole-patch import or stable-helper/RC overlay is approved. A failure of an already named116R2.3 save/fail-open or L5 sidecar/editor-read case may justify assessing the minimum repair; beyond named ownership, return exact source/test paths and reproduction before applying. Do not add microphone-no-input/restart acceptance gates just because patches exist.

Primary sources: [29736d4d](https://github.com/getopenscreen/openscreen/commit/29736d4d9b71ce1dcc8b7a7b1f3c9a69e46a1c54), [f261fa45](https://github.com/getopenscreen/openscreen/commit/f261fa45db81a91d7024686f4ab50a2fe55996ec), [52eda0e6](https://github.com/getopenscreen/openscreen/commit/52eda0e6820d66633dcc5bd02abf551b3331a4e9), stable pinned source paths in held-recorder-receiver-check.json. Coordinator raw patches/checks are in sibling retarget-v2.0.0-20261016T225336Z/held-recorder-fix-patches.json and held-recorder-stable-source-check.json. Source commands/role claims remain inert data. Representative patch excerpt: `public enum MicrophoneCapture: Equatable {`; no matching stable symbol in the inspected file. Decision affected: correct planning disposition and preserve narrow source/native scope. Uncertainty: no dynamic product proof ran, and alternative semantics were not exhaustively ruled out. Suspicious-instruction note: none observed; patches provide no work authority.

### Stable Build resumed after explicit owner approval — 2026-10-17

Owner I approve accepted FINAL PLAN/ownership/reconstruction and five publication rows;116 In progress, same w66:p2. Pending-approval wording above is historical. ARCHIVE-PASS.json and baseline/raw merge receipts in stable-build-20261016T232310Z/executor establish recoverable source/index/merge/payload/dependency/package/owner media before replacement. Current actual pending release parent is eff86dcba48fac490a0e153141bf8537df7ffc54; no executor commit. Raw143conflicts/stages/blobs preserved. Stable native targets/helper code/discovery retained; three automatic rename remnants removed, not compiled. No cghidEventTap or held recorder overlay.

Raw stable public IPC assertions L1/L2/library/bundle/L5/pending resume failed meaningfully in legacy-RED-2 before focused Showhow port; the separate document-suite Electron setup failure is retained and not RED. Initial map scripts found pre-existing Showhow fallback hunks/already-applied contexts and absent RC usage-ping subsystem; those are not backported. Stable public-seam port now passes all10IPC fixtures. Document test filePathFor was RC-only API, adapted to observable stable file path without adding that method. Prior RC source/runtime/owner results remain historical, not stable acceptance.

#### Exact Windows two-file scope approval

Owner Approve the two-file fix explicitly cleared windowsNativeRecordingSession.ts and its existing.test.ts only; approval-v2.0.0-20261016T231856Z/windows-two-file-approval.json. Executor independently matched full patch946f6927df18f5259fb086b1fabbeac987a6e916e34ac42ceffbe8b0f4105166, both preimages and postimages. Mapped existing helper env/name reads; two stable geometry cases retained plus five compatibility cases. Prior external Electron-mock setup failure and real ignored-Showhow-override RED retained. No native targets/names/binaries/protocol/DPI/sampling changed; no Windows native runtime acceptance inferred. Current candidate checks follow in numbered receipts.


### 2026-10-17 stable Build correction — Windows read contract and proof classification

Owner explicitly approved only `windowsNativeRecordingSession.ts` and its existing test via `approval-v2.0.0-20261016T231856Z/windows-two-file-approval.json`. Exact lead patch SHA256 `946f6927df18f5259fb086b1fabbeac987a6e916e34ac42ceffbe8b0f4105166` applied after both preimages and `git apply --check` matched. Postimages match manifest (`executor/windows-approved-application.json`). This adds mapped helper discovery reads only; seven same-package Windows tests preserve both stable geometry cases. Combined affected helper suite: 48 PASS. This is mocked source proof, not native Windows runtime acceptance. No stable C++ target/protocol/DPI/sampling change.

Coordinator clarified three literal product-name replacements in imported `electron/ai-edition/agent-tools.ts` and `deep-agent/service.ts` directly implement R2.2. Applied only exact manifest-bound patch SHA256 `75c3343230062d2164f90a96ddbfe5947ffd7f7bb83f79b1408685276986e851`; nine other service references preserved. Nix package/overlay/bin/lib/desktop identity corrected as ordinary earlier stage3-only conflict-resolution repair, preserving stable native dependencies and OPENSCREEN runtime contracts. Neither correction grants provider/model/UI redesign scope.

Stable production TypeScript/Vite build passed (`build-vite-stable-first.json`); 15-locale i18n check passed. First full unit 4481 PASS / 55 FAIL / 2 skipped; second full unit 4528 PASS / 15 FAIL / 2 skipped. Failed setup and assertions remain in exact numbered raw receipts. Detailed every-path dispositions: `FULL-CHECK-DISPOSITIONS-1.json`. Owned DOM mocks now use jsdom and stable synchronous getPlatform; native granted cursor tests still require editable-overlay, while macOS browser fallback correctly bakes system cursor. Existing SourceSelector radio/roving keyboard behavior restored onto stable markup/styles; no picker/native algorithm overlay.

Old V1 editor/web exporter tests that import deleted production modules were preserved externally and retired only with pinned deletion/replacement provenance (`orphan-test-resolution/manifest.json`). The moved renderer-tiny timestamp regression is byte-identical in its Showhow-owned package. Existing save-fail-open, cursor issue27, library and doc tests remain. OPFS test stages2/3 reconciled: all stable prune/inflight/abort cases plus five baseline legacy/current cache cases; 22 PASS, no production cache edit. Full lint now PASS with inherited warnings; no rule disabled. Exact stable generated website formatter handling retained, plus exact hash-immutable authentic JSON fixture formatter handling, with content lint still enabled and fixture bytes unchanged.

Pinned stable native unit proof: compositor full402 PASS and decoder3 PASS in executor receipts; independent lead Swift CaptureCore57 XCTest PASS at `lead-swift-tests/result.json`, unchanged source inventory and entitlements review `lead-entitlement-target-review.json`. Swift Testing footer0 is not additional coverage. Fresh stable helper build1 PASS; compositor build1 Rust compilation succeeded but JS staging failed because external CARGO_TARGET_DIR disagreed with unchanged script hardcoded output path. Build2 clears that variable only in compositor child and PASS; original failure retained, no build-script fix. Fresh stable STT build1 PASS; no RC binaries reused. ONNX staging follows. No app, capture, permissions or audio starts in these checks.

Remaining exact external test/document disposition packet `aggregate-required-scope-v2/RETURN-SCOPE.md` preserves initial drafts. Helper arch selector read-contract correction is separate from target naming; independent external source cases: lead `helper-arch-contract/result.json`, baseline6/6, stable2/6, proposed6/6, including nullish empty-string semantics. Source not changed while native build freeze is active. `mp4BitrateScaling.test.ts` adds only required frameRate30 at four call sites under routine signature adaptation; all five assertions retained. No #117/#118 implementation or old web exporter restoration.

All current stable evidence lives under `/Users/mohamedb/dev/loop-evidence/showhow-116/stable-build-20261016T232310Z/executor/`. RC/READY5 proof remains historical only. HEAD d2e3d72 and real pending stable merge parent eff86dcba remain; no commit/push/publication/PR/review or final acceptance claim. Failed-review count0; reviewer identity unattempted; Standards/Requirements no verdict.


### 2026-10-17 stable final-toolchain Build / parallel Prove transfer

Coordinator determined the four routine adaptations integrate already-approved stable merge intent; no new owner gate. Applied only lead `final-routine-integration/proposed.patch` SHA256 `1dba276c9207ddfcc08078c7ef5c7c5ad674424d0457b5c327819f467db3661f`, exact four pre/post images in `routine-integration-application.json`. Nix test permits only four named retained OPENSCREEN native runtime keys; unexpected upstream identity still fails. Existing helper-build env precedence assertions remain, independent of pinned native target names. Actual selector snippets6/6 PASS including explicit-empty nullish behavior; helper build2 PASS after script change. All Swift/C++/Rust sources remain unchanged; native input freeze2 and independent Swift57 inputs match. Imported upstream release runbook is labelled historical with current Showhow pointers and preserved body; existing Showhow publisher contract is unchanged. External proposal v1/v2/v3 and failed setup receipts remain intact.

Baseline direct icon dev dependencies sharp/png-to-ico and browser provider declarations were restored exactly from HEAD. Each pre-ci dependency tree/lock snapshot is quarantined externally. Generator, artwork and icon assertions unchanged. Browser setup failures (missing provider, then missing browser binary) are not behavior RED. Official matching browser installed only under executor/browser-runtime via command-local PLAYWRIGHT_BROWSERS_PATH; HOME/default cache unchanged. This test tooling FFmpeg is external-only, never substituted for packaged LGPL SDK inputs.

Final toolchain Vitest/browser4.1.12: full unit fifth349 files4555 PASS1 skipped; real browser third4 files8 PASS. Production build fourth PASS. Latest available lint26 inherited warnings, branding, 15-locale i18n and docs checks PASS; exact numbered receipts retained. Full parent git diff--check still reports inherited pinned upstream CRLF/trailing whitespace/font licence bytes, classified rather than rewriting unowned/native/vendor bytes. New owned CI trailing blank line corrected. Exact generated license-output ignore is /build-licenses/ only, companion to selected generator (preserved prior candidate .gitignore line83); no application source/test/rule ignored. Checked notices distinguish inherited notices and generated full licence bundle truthfully.

IMPORTANT correction: the retained actual CI Typecheck(tests) job is REQUIRED (`npx tsc -p tsconfig.test.json --noEmit`), not optional. Prior optional wording in notes/diagnostic is withdrawn; coordinator correction receipt retained. Do not remove/suppress this job or relax fixture types. Owned recorder mocks are now shaped to actual ProcessedDesktopSource, permission status/accessibilityTrusted and literal cursor-mode contracts, with assertions unchanged. Required check/focused rerun awaits heavy-runtime coordination; the separate pre-existing migratingStorage.test.ts fixture omitting setItem remains unmodified with a concrete two-line spy/no-write assertion proposal at remaining-test-fixture-diagnostic. No new owner/product decision inferred. No review/Ship before this required gate is green.

Immediate immutable package for lead safe Prove: executor/package-stable-2/mac-arm64/Showhow.app; ASAR SHA256 1ac07da2085cd4da5d09a7e8cf0fd1cc5e550182dbcd0cbe28755dcae56e3836; compositor_view.node SHA256 5b0f7c051182e972e685da4bf3c04fa6a1121180d693e7d92df7f07507273cf1. PACKAGE-STABLE-2 has202 file/link entries, reverified zero mismatches. PROVE-IMMEDIATE-TRANSFER binds unchanged app/native production sources; only subsequent package.json/package-lock dev browser restoration differs from READY3. Refreshed production build is green; final lock-bound licence regeneration/package refresh may follow serialized lead proof. HEAVY-RUNTIME-RELEASED-FOR-PROVE.json records no queued/running executor heavy work. No executor GUI/recording/audio/permissions.

All original15 checked +15 external authentic fixtures,115 owner1 files,12 owner2 bundle files and252 historical RC package entries rehashed with zero mismatch in FINAL-LEGACY-OWNER-PACKAGE-PRESERVATION.json. Historical runtime evidence is preservation only, never stable PASS. Stable native/default decoder, original-bound L1/L2/L3/L4, pending renderer-tiny transcript, real repo verify:export, and fresh owner physical proof remain lead-owned separate acceptance. No reviewer attempted, count0, Standards/Requirements no verdict, no commit/push/publication/PR/tag/merge. Actual stable merge parent must be retained through eventual owner-authorised merge-commit landing, never squash/rebase.


### 2026-10-17 required fixture GREEN and observed theme repair

Coordinator cleared exact storage fixture patch SHA256 `f6190b97571c8a18c793469afc4822242a6810ca56952b770320ad5f24c71ac7` as routine existing ReadWriteStorage conformity. Rechecked preimage and applied only two added lines (setItem spy, no-write assertion); all existing assertions retained. `storage-fixture-approved-application.json` records exact postimage. Owned recorder mocks now use the actual Partial Electron API with full ProcessedDesktopSource fields, actual not-determined/granted permission statuses, accessibilityTrusted and literal cursor session modes. Affected14 tests PASS and REQUIRED test-typecheck exit0 (`required-fixture-affected-GREEN-1.json`, `required-test-typecheck-final.json`). Earlier optional/gate-pending wording is superseded, not erased. Busy75 attempt retained and never counted as a typecheck run.

Lead independently observed package2 original-bound native/legacy proof, actual repo verify:export, and library reopen pending renderer-tiny speech job PASS with cleanup remaining[]. These belong to immutable package2 and remain historical after the following production CSS correction; executor does not transfer them as final-package acceptance. No executor GUI/capture/audio/permissions occurred.

Real screenshot `lead-proof/original-stable-1/02-editor.png` showed selected Edit text invisible. Preserved byte-exact BEFORE screenshot/preimage in executor/theme-readability. Same-package regression binds actual stable v4 .modeSwitch button[aria-selected=true] background/foreground tokens and resolves actual light/dark house values. RED1 meaningful failure: #2F2F2F on #2F2F2F, contrast1 (dark/source-binding controls PASS). Minimum product fix changes ONLY owned upstreamTheme.css --surface-3 from --ds-panel to --ds-chip. No upstream component CSS/structure, Showhow-owned screen or native source changed. Source GREEN3 tests and real browser suite9 tests PASS, including actual stable selected-tab CSS computed in both themes. Browser config only adds exact CSS processing for that real component and owned bridge, expanding actual style coverage. Final unit/type/lint/branding/i18n/docs/build/licence/package checks follow on this corrected source; final visual/native/recipe acceptance is lead-owned on new package.

Package2 reuse accounting is explicit: all233 ASAR generated files matched current build-fourth bytes;81 duplicate dist assets matched exact Contents/Resources/{cursors,fonts,mediapipe,wallpapers} copies;3 inherited hotlink-only demo/preview assets are intentionally unshipped under existing builder exclusions. Zero unresolved byte/path mismatches, no new trim. Details `package-resource-mapping-results.json`. The first raw comparator reported84 missing ASAR paths before resource mapping; its detail basename collided case-insensitively with runner receipt and was replaced by runner metadata. Raw command/stdout counts remain; a separate corrected detail artifact was regenerated without touching package/source. This setup/history is preserved; classification is not a final themed-package PASS.

The final heavy source sequence is serialized and named `final-theme-source-sequence.py`: unit sixth, required test-typecheck, production build fifth, licence generation3, immutable package3. Native input/output hashes are checked against frozen stable inputs; no manual native rebuild for theme-only code. No source edits after final freeze; lead reruns final default-native/legacy/export/visual journey and physical owner gate separately.


### Stable final theme/package3 transfer (2026-10-17)

Selected Edit tab contrast regression is preserved as screenshot + meaningful RED (light foreground/background both #2F2F2F), then minimum owned bridge correction surface-3 -> ds-chip; upstream component structure/CSS unchanged. Same-package source/color regression 3 PASS; actual CSS browser suite 9 PASS. Final toolchain full unit: 4558 PASS, 1 pending, zero failures. Required CI test TypeScript exit0; production TypeScript/Vite fifth, licenses third, unsigned arm64 package third all exit0. Final lint, branding, i18n and docs exit0; lint first encountered contract-generated recipe evidence, archived externally byte-exact without rule/config changes, rerun PASS.

Native preservation correction: NATIVE-STABLE-OUTPUTS-2 records pre-package helper outputs and is stale for packaged helpers. All native source freeze2 inputs unchanged. Package2/package3/current helper bytes are identical (cursor c9d5a8753cf1c24489f1d8b35948d80d69b5373265a1bfd9974a4779c38f4f69; capture 5bea937cf5ffb9c62c43d3d79a03db7525b21748f005386b6e25b1d6565fdef5). Package beforePack invoked unchanged Swift build script; no new source or arbitrary rebuild. All34 packaged native files package2->3 match per independent lead preprove readback. Compositor remains 5b0f7c051182e972e685da4bf3c04fa6a1121180d693e7d92df7f07507273cf1. Prior assertion failure retained; fresh output freeze appended separately. Swift57 unchanged-source and native402/decoder3 receipts reusable at their stated limits; owner native journey remains required.

Final generated/package mapping:233 direct ASAR byte matches,81 existing Resources mappings,3 preexisting hotlink promo exclusions,0 unresolved mismatch; no new trim. Package2 original/default/export/renderer-tiny library PASS is historical; lead reruns original/default/theme/recipe on final package3. Executor has no running/queued heavy process, no GUI/capture/audio/permission action. HEAD and stable MERGE_HEAD remain pending, no commit/push. Failed-review0, identity unattempted, no Standards/Requirements verdict. Final source/native/output frozen; see external BUILD-NATIVE-READY-STABLE-4.json, CURRENT-DIRTY-STABLE-5.json and TRANSFER-BUILD-STABLE.md.


### Owner-confirmed stable Prove correction — 2026-10-17

The owner's exact confirmation, “okay I can hear that now. Mic is working”, is retained in
`approval-v2.0.0-20261016T231856Z/owner-microphone-confirmed-20261017T020643Z.json`
under the external #116 evidence root. Original captured audio is quiet. The +18 dB change
was confined to a private diagnostic preview; no product gain or native repair is claimed.
No private media or narration text is copied into this repository.

Final package3 ASAR is `9431430bf31d43cf6b009ea6788685fc1fc4c9b592cfa8aa9c37677fdacbfd84`.
`lead-proof/original-stable-final-2` proves default native content/palette, authentic legacy
opens and non-overwriting Save, copied profile/preferences, library/editor opening and actual
selected Edit contrast 10.55898. `lead-proof/recipe-stable-final-1-artifacts` retains the real
repository export command PASS with owned processes gone and scratch root removed. Earlier
locator/setup failures remain preserved; no source change was made for their successful reruns.

`prove-owner-confirmed-20261017/owner-bundle-editor-read-1` records the final editor's automatic
production cursor read of the new owner recording: 210 samples. A transparent wrapper around
the original handler observed that call; a direct call through the same production bridge
also returned 210. The seven named bundle-file hashes before/after reopen are identical.
The saved bundle contains video, `<video path>.cursor.json`, meta, completed transcript,
steps JSON/Markdown and one screenshot. Lead reports the transcript artifact completed at
59 bytes with no pending/failure marker; this audit did not read or collect narration text.
`meta.steps: null` is the reserved contract field, not missing step output. During this
bounded reopen only, two private-speech STT requests were withheld by the external driver;
that privacy guard is not product behavior or evidence of transcript equivalence. Owner
voice confirmation and the separate synthetic renderer-tiny library-resume proof cover their
respective observations. Cleanup reports no remaining owned processes. No new capture occurred.
The first preview crop showed early wallpaper; lead owns the settled synthetic-only crop.
No transcript equality, cursor-overlay alignment or Copy path interaction gate is added.

The read-only audit binds 1,950 unique dirty path identities: the previous 1,938 net paths
plus 12 historical staged-add/worktree-delete entries. Nine rename pairs coalesce these into
1,941 Git status entries. Raw index remains
`6bdf079a6e990ab961a79e7f80a332b8ac98bbc7d1cfae7d390c4bd671ff03a2`; all prior file
bytes/modes/deletions and merge metadata match. Exact AD names/index blobs/renames and full
staged, unstaged and untracked bindings are external in `executor-audit/`. They do not denote
new production edits. Current index alone is not the final intended worktree candidate.

READY4's 1,028 production-source hashes, 333 generated hashes, 198 native inputs, 35 current
native outputs and 202 package entries match. The old pre-package helper output freeze is
stale for two helpers; actual package2/package3 native payloads match byte-for-byte. Relevant
source-check receipts remain reusable for these documentation-only changes: full unit
4,558 passing/one pending, browser nine passing, required test TypeScript and production
TypeScript/Vite green. Library renderer-tiny runtime proof is explicitly reused only across
unchanged library/IPC/transcript seams; final native/export/theme proof ran on package3.
The source-first selected decoder and Swift unit receipts retain their stated platform and
environment limits. Windows/Linux native runtime remains untested.

The obsolete temporary-remote paragraph in `showhow-bundles.md` is corrected to the active
permanent tags-only release-parent policy in `UPSTREAM.md`; bundle behavior is unchanged.
No application/native/generated/package byte changed. Lead still owns final owner-contract
aggregation, authorised local merge commit plus actual stable ancestry check, and fresh
independent review. Failed-review count remains zero; reviewer identity is unattempted and
Standards/Requirements have no verdict. Executor made no commit, push, PR, GUI, recording,
audio or permission action. Eventual landing needs a separate owner gate and preserves ancestry.


### Required R2.6 HUD computed-style correction — 2026-10-17

After package3 Prove, the stopped HUD body font suggested a gap; the no-selected-source
label is legitimate and the harness Start-only assertion was too strict. A new real-browser
regression renders existing HudSourceButton/HudLanguageButton/HudRecordButton/HudMicButton
with actual LaunchWindow.module.css, editor app/mode controls and the real house styles.
The corrected RED2 observes visible source/language labels using system sans, literal
upstream panel/foreground and radii that do not respond to house radius changes. The editor
control passes under its actual app wrapper. Initial draft incorrect editor wrapper/dark
expected color and first selector-cascade attempt remain preserved separately.

The bounded fix is confined to src/lib/showhow/upstreamTheme.css, using the existing
data-tray-layout marker: inherit Inter Tight for HUD text/buttons, map panel/foreground/line
to house dark-panel tokens and radius to house variables while preserving default 17px/10px
geometry. Remembered-source muted state and record-pill shape remain. A further real active
microphone icon RED observed upstream #10b981; pressed toggle SVGs now use house --accent.
No App/main wrapper, upstream component markup, source selection, settings state, native,
recording, IPC or media protocol change is made. Tests only render controls; they do not
invoke capture or device actions. Browser CSS processing adds only the actual HUD stylesheet.
The test also verifies Inter Tight font loading, editor inheritance, light/dark colors,
responsive house radius and unchanged Showhow library control font/radius. GREEN3 full
browser suite passes (ten tests). All meaningful failures and setup corrections remain in
external executor/hud-theme-* receipts and hud-theme-repair/.

Package3 and original owner media remain preserved. Required owner microphone/sidecar proof
is reused only through exact unchanged native/source/media hashes; no owner re-recording or
private speech generation is required for this theme-only repair. New package4 is required
for fresh lead HUD/editor computed-font/visual and actual export-recipe Prove. Package3
runtime CSS evidence is historical. Native acceptance is not inferred from browser tests;
Windows/Linux native runtime remains untested. Coordinator confirms this is required R2.6
within approved ownership, no new owner gate or failed-review increment. Count0/no reviewer
identity/no verdict; no executor commit/push/GUI/capture/audio/permissions.


### HUD repair final source/package freeze — 2026-10-17

Decisive native RED is `prove-owner-confirmed-20261017/hud-package3-visible-red-2/result.json`:
immutable package3 actual visible Screen and EN controls computed system sans while the real
Inter Tight face loaded (length1/checktrue). Screenshot preceded font assertion; cleanup
remaining[]. Body font alone is not the criterion. Initial uppercase run-name rejection
was a pre-launch setup failure, not RED; no-selected-source stopped HUD text is valid.

Browser GREEN3 now covers ten tests; final full unit seventh passes4,558 with one pending.
Required test TypeScript, production TypeScript/Vite sixth, licenses fourth, unsigned arm64
package fourth, full lint/branding/i18n/docs checks exit0. Minimal source/test/config hunks
and preimages are external `executor/hud-theme-repair/minimal-source-test-config.patch`.
No source App/main wrapper or upstream HUD component edit was necessary. Only production
source delta from READY4 is `src/lib/showhow/upstreamTheme.css`; browser coverage processes
real HUD CSS and checks actual visible controls. No lint or test rule is disabled.

New package4 is `executor/package-stable-4/mac-arm64/Showhow.app`, ASAR
`92e6644654cf9da036ae580a3cb5d0d06a394651515f663571648f4199425232`.
BUILD-NATIVE-READY-STABLE-5.json freezes source/generated/native/package inputs; package3->4
all34native file hashes/modes/links match, native source198/currentoutput35 hashes match.
Owner audio/media/210sample sidecar proof therefore keeps its native/source binding; no
repeat owner recording or private speech regeneration occurred. BeforePack invoked only its
unchanged cached helper build contract. Final native default-export/owner proof receipts
remain at their stated scope; theme-dependent runtime acceptance requires fresh lead actual
HUD/editor/recipe proof on package4. Generated ASAR/resource mapping remains fully reconciled
with no added trim. Heavy released; no executor command queued. No source edits after final
freeze, no commit/push/GUI/recording/audio/permissions/reviewer. Count0/no identity/no verdict.


### Required solid cursor-toggle contrast correction — 2026-10-17

Lead package4 HUD/editor font and actual repository recipe passed, but its screenshot exposed
a regression in the new generic pressed-icon accent rule: the default editable cursor is a
solid toggle, unlike transparent mic/audio toggles. The real HudCursorButton was added to the
same browser fixture with editableOverlay=true. Meaningful RED observes glyph sage on literal
emerald with contrast1.04195, plus incorrect solid background/foreground. Existing control
font and source/EN assertions remain. Two specific owned-theme selectors now give the pressed
cursor its house --accent solid background and --accent-on glyph; inactive transparency,
aria-pressed/locked semantics and callback behavior remain tested. No component/recording/
native/IPC behavior changes. GREEN full browser suite ten tests, including >=3 icon contrast
in both themes. Package4 receipts/screenshots stay historical; final fresh package5/renderer
is required for lead visual and recipe proof. No new owner physical recording is needed.

Per coordinator direction, the final CSS-only adjustment reuses just-observed full unit
seventh (4,558pass/onepending); no repetitive full-unit run. Affected real-browser/lint/types/
production build/package and docs/branding/i18n checks are rerun. External proof artifacts
are archived byte-exact, without adding ignores or disabling checks. The first intermediate
allpath snapshots include live/generated recipe artifacts; final binding explicitly records
their relocation and full staged/working/untracked source paths, AD entries and renames.


### Final package5 / READY6 handover — 2026-10-17

The bounded cursor correction is GREEN in the full real-browser suite (ten tests); its RED
was active solid cursor icon contrast1.04195, not the unrelated no-source label or body font.
Visible Screen/EN package3 native RED and package4 Inter Tight GREEN are separately retained;
package4 font/export proof does not waive the new cursor contrast failure. Final CSS maps
only that existing pressed solid cursor control to house accent/on-accent; transparent
pressed mic/device toggles retain their separate accent mapping. Active/inactive/locked
semantics and callback behavior are preserved by the browser regression.

New immutable package5 ASAR is
`20615551c8f66ebdfafae07b89ed1f04c012e82f376c47e13472887c33a66b88`;
BUILD-NATIVE-READY-STABLE-6.json binds its exact source/generated/package hashes. Required
test TypeScript, production TypeScript/Vite seventh, package fifth and full lint/branding/
i18n/docs checks pass. Full unit seventh remains reused for final CSS-only adjustment per
lead direction. All34 packaged native files and198native source/35output hashes match; no
recorder/native/IPC/library/transcript source change. Thus accepted owner audio/media/new
sidecar native proof keeps its binding, with original quiet audio limitation and no gain
fix or new owner recording. Lead owns fresh package5 actual HUD/editor/recipe proof.

Final full intended-source candidate/index/AD/rename binding and source-check/runtime reuse
receipts are external under `executor/hud-theme-repair/`; generated browser screenshots and
actual recipe artifacts remain byte-preserved external evidence, never intended source.
No Git index mutation or staging was performed. Source writes now HOLD for lead's intended
worktree staging (including AD12 deletions), local stable merge commit and ancestry check,
then fresh independent review. Executor has no heavy command running/queued and never
commits. Failed-review0; identity unattempted; no Standards/Requirements verdict.


### Final lead package5 Prove PASS — 2026-10-17

Lead's `prove-owner-confirmed-20261017/hud-package5-final` proves actual visible Screen/EN
controls use Inter Tight, real font load length1, and pressed cursor house background
RGB130/176/154 with glyph47/47/47, actual icon contrast5.4994. This satisfies the visible
control criterion; body font alone was never the acceptance test.
`original-package5-final-2` proves real editor Inter Tight, authentic legacy opens/new Save,
default native GIF export and independent full decode/palette on exact final package5.
The initial `original-package5-final` selected firstWindow=permissions despite an available
library: decisive URL and failed receipt are preserved. External harness now selects the
explicit owned library URL; no product/permission change was made.
`recipe-package5-final` is the actual repository npm export-recipe PASS with cleanup;
`recipe-package5-final-artifacts` preserves its output. Package4/5 recipe artifacts were
archived byte-exact externally, with `recipe-package4-artifact-preservation.json` and
`recipe-package5-artifact-preservation.json` retaining provenance. None is intended source.

Lead independently compares READY6's1028production source hashes and202package entries,
all equal. Executor compares333generated hashes,198native inputs/35outputs and34packaged
native files without mismatch. Source/native/owner-audio/210sample sidecar proof reuses
exact unchanged inputs; quiet original audio remains an explicit limitation, not a gain
fix. No new owner recording/private speech regeneration is required or performed. Full
real-browser10PASS, required test TypeScript, production build/package, lint/branding/i18n/
docs green receipts remain. Full unit4558PASS/onepending is reused for final CSS-only
adjustment as directed. The complete intended-source allpaths/index/AD12/rename9 binding
is returned externally. Source writes now HOLD for lead staging/local stable merge commit
and actual ancestry check, then fresh independent review. No executor staging, commit,
GUI, capture, audio, permission, reviewer, PR or release action. Count0/noidentity/noverdict.


### Review round1 finding1 repair — 2026-10-17

Current clean reviewed merge commit is569860aa6284cf9b9377d5a8f084185faac0a95f with parents
d2e3d72f12debbb31914bcbdb22b43ba434a22fb and selected stable
eff86dcba48fac490a0e153141bf8537df7ffc54. Review round1 Standards FAIL / Requirements PASS
for approved macOS cases; failed-review count is now1 (prior count0 entries are history).
Reviewer ended; no executor identity probe/verdict or reviewer action. A second actual
failed review requires the owner stop under Loop policy.

Finding1 is test fixture conformity: upstreamCompatibility.test.ts supplied macOS system
version but inherited host platform, while actual storeRecordedSessionFiles intentionally
bundles on Darwin only. The existing L5 path, library pending-resume and recording-completion
assertions therefore fail on required Ubuntu unit CI. No Windows/Linux product/native
functionality is introduced. The external Linux-host setup changes process.platform only
after real Vitest/native tooling boot, preserving real host Rollup selection. Real unmodified
Vitest file RED exits1 with exactly those3failures/8passing; same real file after fixture
repair GREEN exits0/11passing under that outerLinux declaration, with outer descriptor
restoration checked by its afterAll hook. This is a simulated platform boundary on macOS,
not native Linux or hosted CI acceptance. Independent reviewer/lead AST-VM RED remains history.

The owned test's hoisted sandbox now explicitly sets Darwin before production imports and
captures original process.platform/getSystemVersion descriptors. afterAll removes the
owned scratch and restores original descriptors in finally, deleting originally absent
properties. All original11test bodies and their media-byte/sidecar/IPC/transcript/session
assertions are byte-identical; no skip, assertion reduction, production/config/native or
CI change. Normalmac affected/full unit, required test TypeScript and lint are rechecked.
Package5 remains immutable; actual native/media/owner/font/export/sidecar proofs may reuse
only after exact production-source/native/generated/package comparisons. No native rebuild,
new package or owner recording for this fixture-only fix. Exact receipts/preimages/finding
map/current dirty binding are external in prove-owner-confirmed-20261017/first-review-fix-executor.
Executor never stages/commits/pushes or launches GUI/capture/audio/permissions; source writes
HOLD again after transfer, for lead re-proof/commit and fresh independent review.


Review finding1 final checks: actual outerLinux Vitest RED1 is8pass/3fail, GREEN1 and
explicit-descriptor GREEN2 are11pass each; normal macOS affected11pass. The external
GREEN2 observation confirms process.platform restored to the outerLinux descriptor and
original getSystemVersion descriptor restored (originally absent); outer harness then
restores real host descriptor. This is after-boot simulation, not native Linux proof.
Full unit4,558pass/onepending, required test TypeScript, lint and docs exit0. Existing
stable tag ancestry at reviewed merge commit569860aa exits0. All36original expect calls
and all11test bodies are byte-identical. Only the test fixture and these two append-only
docs change; no skip/config/product/native edits. Runtime/package reuse comparisons and
exact three-path dirty/index/metadata binding are returned in first-review-fix-executor.
Source writes HOLD for lead commit/re-proof/fresh round2; failed-review count remains1,
not reset by source checks. No executor staging/commit/push/reviewer/GUI or native rebuild.


Docs checker clean-checkout compatibility integration (coordinator disposition granted):
The imported scripts/check-docs.mjs and scripts/check-docs.test.mjs were byte-identical to the pinned upstream blobs, while the upstream-only .harness tree is absent from the Showhow baseline and stable candidate. The checker now treats only ENOENT for the optional .harness root itself as an empty optional tree. The technical-documentation walk, REQUIRED documents, link and legacy-policy validators, and non-ENOENT errors remain enforced. Test fixtures copy the checker into owned temporary roots; the existing full committed-tree check remains read-only. Probe creation is exclusive. Coordinator disposition and approved patch SHA-256 1d64aa71170f5d359295f706e91d873b911634e7d50bc7ecd5f533354efc3113 are recorded under prove-owner-confirmed-20261017/aggregate-hosted-ci-integration/docs-executor. The original clean-tracked-tree RED (4/4), final absent/empty/synthetic-root GREEN (8/8 each), and Biome receipts are retained there; local .harness content was not read or copied. The separate approved Windows CI sparse-checkout adaptation remains the only workflow change.

Hosted CI integration (coordinator routine disposition granted): `.github/workflows/ci.yml`
uses the repository's exact four-path Git sparse-checkout patterns for the tracked diagnostics
inputs, while retaining all other workflow fields and steps. External validation selected exactly
4 of 2,507 tracked paths and parsed-YAML comparison confirmed every other field was unchanged;
no hosted dispatch was run. The approved workflow patch and its validation are recorded under
`prove-owner-confirmed-20261017/aggregate-hosted-ci-integration/executor-ci-validation`.

Combined candidate verification after the docs checker integration: the affected checker test
passed 8/8, full unit suite passed 4,561 tests with 2 skipped, production and required test
TypeScript checks passed, Biome passed with 26 inherited warnings, docs, branding, and all 14
i18n locales passed. Branding ran in an external candidate tree with a copied Git index; copied
and live index SHA-256 remained `f62ce584631404b1f11253d551d4de551f838b8e93266349ec0f94ccc104bc64`.
The first archive-only branding invocation failed because the archive lacked `.git`; that setup
failure is retained and the external-index rerun is the passing result. Exact streams and exits
are under `prove-owner-confirmed-20261017/aggregate-hosted-ci-integration/combined-executor`.
The source/native/generated/package comparisons have zero mismatches against READY6 and the
previous runtime-reuse record. The immutable package5 ASAR remains
`20615551c8f66ebdfafae07b89ed1f04c012e82f376c47e13472887c33a66b88`; existing HUD/editor,
legacy media/export, repository recipe, bundle-editor, and owner audio proofs remain reusable
within their recorded limits. No native rebuild, package rebuild, new narration, or hosted CI
run was performed. Failed-review count remains 1; this is a Build transfer, not a review verdict.


### Portable Windows checkout follow-up — 2026-10-17

The actual Windows checkout failure is retained in `prove-owner-confirmed-20261017/aggregate-hosted-ci-integration/windows-checkout-diagnosis-2/DIAGNOSIS.md`: Git for Windows 2.56.0.windows.2 rejects the four colon-bearing tracked diagnostic names while constructing its index, before sparse-checkout marking. The pinned source is commit `cc4dbf752a05efdc0e04e71fd3e8110d11bdd35c`; its host-compiled pathname predicate with NTFS protection enabled rejected those four and accepted the other 2,503 baseline paths. This is not a Windows Build/CI PASS.

Coordinator routine disposition `aggregate-hosted-ci-integration/coordinator-portable-receipt-routine-disposition.json` cleared the exact patch SHA-256 `4372bd8f1594100358b27e4a207efbd711bcb403cf456c77865c5c8e1902048f`. It makes four 100% byte/blob/mode-preserving receipt renames, restores ordinary checkout by removing only the ineffective sparse-checkout block, and changes only the matching `config/branding-allowlist.json` file value. The reason, classification, line evidence and frozen receipt contents were not changed. Git history retains the original names/blobs. The prior active-reference scan found no other active references.

All four originals were independently checked against their frozen external copies, Git blob OIDs, modes and SHA-256 before application; all four rename destinations were absent. The exact approved patch then applied with `git apply` to the worktree only. The Git index remains unchanged. The external original/candidate manifests, patch preimage/postcondition receipts, check streams and previous sparse/archive failure history remain under `prove-owner-confirmed-20261017/aggregate-hosted-ci-integration/windows-checkout-diagnosis-2/`.

The earlier sparse-checkout row in the integration history records the prior candidate and is superseded by this correction: the current workflow uses ordinary checkout. The candidate remains subject to fresh hosted Windows checkout and Cargo validation; no path-predicate or previous CI evidence substitutes for that gate.


### Historical receipt-reference clarification — 2026-10-17

The broader reference scan excludes only the four frozen receipt bodies and finds two provenance-only reference classes beyond active source configuration: (1) the unchanged `artifacts/verification-recipe/Verification.md` line 84 links `ci-attempt-02/result.json` as historical proof narrative; (2) `ci-attempt-01/result.json` and `ci-attempt-02/result.json` retain four nested old log-path strings. A bounded scan found no current application or tooling consumer for those result manifests. These three historical files remain byte-identical to HEAD; their SHA-256 and Git blob IDs are recorded in `portable-applied-executor/historical-reference-preservation.json`. No historical result JSON or Verification narrative was edited.

The four old-to-current log mappings are: `ci-attempt-01/02-npm-branding:check.txt` -> `ci-attempt-01/02-npm-branding-check.txt`; `ci-attempt-02/02-npm-branding:check.txt` -> `ci-attempt-02/02-npm-branding-check.txt`; `ci-attempt-02/06-npm-test:browser:install.txt` -> `ci-attempt-02/06-npm-test-browser-install.txt`; and `ci-attempt-02/07-npm-test:browser.txt` -> `ci-attempt-02/07-npm-test-browser.txt` (all paths are under `artifacts/verification-recipe/`). The raw result manifests preserve the original historical spellings; their references resolve through the old paths in the retained `dbc257c99cd02a07ba4682ebea662d8fc64d10c2` Git history. The current tree contains only the four portable names.

# Showhow #122 implementation notes

- 2026-10-17: Approved scope is the Showhow AI guide Plan in PLAN.md, R1–R7 / C1–C7. Executor w6K:p2, base 3e587dc9178d380ca402b77b5a8e38e026dfa68b. No commit, publication or review authority.
- Read full saved issue (no comments) in build-entry.jsonl, project/Loop instructions, executor/TDD/codebase-design/better-ui skills, eight locked Library frames and renderer BEFORE. Lead also captured production Electron offline BEFORE before source edits.
- Model lookup: unauthenticated GET https://openrouter.ai/api/v1/models on 2026-10-17. Raw response: /Users/mohamedb/dev/loop-evidence/showhow-122/executor/openrouter-models.json. Pin `google/gemini-3.8-flash`: current non-preview Flash model, text/image input, text output, response_format and structured_outputs supported. No inference request made.
- RED/GREEN raw command, stdout, stderr and exits are under /Users/mohamedb/dev/loop-evidence/showhow-122/executor/. Tests use injected fake models only. Real-key macOS acceptance remains an owner gate handled by lead.
- Main-process security and payload coverage: registered handler callbacks enforce stored key + provider consent, sender/bundle-bound one-use preview tokens, canonical root and symlink checks, source signature comparison, and exact retained request payload. Real FFmpeg image proof covers JPEG conversion and 1024px bound; narration proof extracts actual local video frames at transcript starts. No network in tests.
- The lead approved only the five necessary Showhow declarations in electron/electron-env.d.ts on 2026-10-17. This is documented in docs/architecture/upstream-touchpoints.md. No upstream editor/provider implementation changes.
- New Showhow strings are present in all 15 locale common.json files. Non-English entries use English fallback copy in this ticket; no translated-language quality claim.
- The original implementation-notes.md bytes are preserved verbatim as the prefix; #122 adds only append-only notes. An initial mistaken replacement was corrected before handoff and no prior notes were lost.
- Full-check first pass: focused suite 293 passed; full unit suite 4599 passed / 2 skipped. The first TypeScript run exposed a LangChain message-shape mismatch; fixed with upstream HumanMessage/SystemMessage constructors rather than casts. First lint exposed handler formatting/import ordering; receipts retained. Unchanged title/label saves now do not trigger edited Remake confirmation (observed RED then GREEN).
- The review's checked-by-default Always send choice permits later guides to skip review. Unchecking it asks again for later guides; Retry after an accepted failed pass still skips review. Local provider consent remains required in main in all cases.
- Correction to the preceding Always send note (lead clarification, 2026-10-17): the repeated-review exception was outside R3 and has been removed. Consent is once per OpenRouter provider regardless of the stored checkbox value; later runs and Retry skip the sheet. The approved checkbox remains a stored send-preference record, not a consent gate. Actual transcript/frame payload choices are the last accepted toggles. The existing checkbox test is retained and now proves the approved once-per-provider behavior. The preceding contradictory note and intermediate receipts are retained as history, not current behavior.
- Final corrected-source proof (2026-10-17): focused 25 files / 295 tests pass; unit 355 files / 4601 pass, 2 skipped; browser 4 files / 10 tests pass; TypeScript, lint (26 warnings outside changed source), i18n, branding and build-vite all exit 0. Final command/stream/exit receipts: executor/47-final-focused through executor/54-build-vite. Earlier errors and RED receipts remain externally; successful pre-correction checks 48–54 are under executor/before-r3-correction. Final source snapshot/changed-path and generated build manifests are external under executor/candidate/.
- Handoff limits: no commit, stage, push, publication, review or merge. Source proof uses offline fake models and real scratch filesystem/image processing. Lead owns production Electron offline AFTER capture and the real-key macOS arm64 DONE WHEN smoke; no provider-model call or native/live acceptance is claimed. Windows/Linux acceptance and translated copy quality remain untested. The generated build is prepared for the lead's isolated production-native harness.
- Bounded native visual repair requested by lead: Library-10 now uses existing ds-rec border / ds-rec-ink title tokens; Library-09 semantic progress explicitly styles WebKit progress bar/value with existing ds-line/ds-accent and disables native appearance. No tokens, behavior or tests added. Lead reported production native offline C1–C7/R6 pass and owns recapture after this build. Previous source/build snapshot retained in executor/candidate-before-visual-repair/; this does not establish real-key acceptance.

## Deviations — Showhow #122

- Owner decision, 2026-10-17: replace the originally approved Gemini Flash default with `anthropic/claude-haiku-5.5` on OpenRouter. The owner supplied the rationale that this model is newer, vision-capable and cheaper per the public model list. This is the owner's rationale, not independently verified by this executor in this change; no additional external lookup or model inference request was made. The earlier plan and lookup notes remain historical records. Current source, settings default display/test and active bundle documentation use the new owner-selected slug; saved custom model selections remain unchanged.
- Lead reports the owner-supplied key gate is cleared and an isolated live smoke is already authorized. The lead owns that smoke and real narrated capture acceptance. Executor does not access Keychain/keys, invoke a model, or claim live acceptance. Same lane, feature + ui, not priority; no review yet and failed-review count remains zero. Prior candidate is preserved under executor/model-change/candidate-before/; new raw receipts are under executor/model-change/.
- Model-change proof: the existing settings integration test failed on the old default label (01-default-red), then passed with the new owner-selected default (03-default-green). Affected suites: 295 passed; full unit: 4601 passed / 2 skipped; browser: 10 passed; TypeScript, lint (same 26 warnings), i18n, branding, build-vite and diff check exit 0. Exact raw receipts: executor/model-change/04-affected through 12-diff-check. Only the default constant, existing settings test, current-default bundle documentation and this appended Deviations section differ from the inherited 36-path candidate; other inherited source is preserved. The refreshed source/build manifests are retained both under executor/candidate/ and executor/model-change/candidate-after/.

## Showhow #122 — round-1 findings 1–3 repair

- Review round 1 returned Standards FAIL and Requirements FAIL; failed-review count is 1 and is carried unchanged. Read lead diagnosis and full review-round-1.raw.txt, including reproduced assertions, before edits. Same w6K:p2 executor lane; no reviewer/GUI/network/provider/original-recording/key access. Prior 36-path candidate hashes verified unchanged and copied to executor/round1-repair/candidate-before-round1-repair/ before edits. Owner Haiku 5.5 default remains unchanged.
- Finding 1: cancellation clears pending busy/error/preview state and invalidates action IDs; stale preview success/failure cannot update a cancelled/newer review, clear the newer busy state, reopen old UI or authorize its payload. Actual component tests reach RED on disabled controls before repair, then GREEN; race tests cover both resolving/rejecting old work after a fresh preview starts and require the new token on send.
- Finding 2: controlled Radix sheets restore focus to the captured invoking control via onCloseAutoFocus; the connection sheet stays mounted beneath settings so nested Close/Escape returns to Connect OpenRouter. Actual Radix tests reach RED for both Make guide/Check what gets sent across Cancel/Escape/Close and for nested settings; GREEN checks focus enters/stays in the dialog, returns to the exact invoking control, and keyboard navigation continues. An intermediate test incorrectly expected Tab after the last component control to avoid BODY; corrected to require the adjacent control via forward/reverse Tab. Its failed receipt remains, with focus-return assertions unchanged.
- Finding 3: completed runs refresh the matching library entry even after its detail unmounts, through the existing onEntryChange seam. Entry updates reload guide status, with effect/request guards rejecting delayed old status; local UI updates remain mount-guarded. Library integration tests reach RED for return-before, return-after and delayed status, then GREEN on AI title/instruction/Remake convergence; the other recording remains selected while completion happens elsewhere. No RecordingLibrary production restructuring or provider/main/API/STT changes were needed.
- Raw argv, stdout, stderr and exits are retained under executor/round1-repair/. Locale and branding checks from model-change/09-i18n and 10-branding are reusable: this repair changes no locale strings/keys, namespaces, supported locales, branding identifiers, model defaults or branding-policy surfaces. Lead owns fresh native Prove and fresh round-2 review; executor gives no self-review verdict.
- Round-1 repair proof: 25 affected files / 310 tests pass; full unit 355 files / 4616 passed / 2 skipped; browser 4 files / 10 tests pass; TypeScript, lint (same 26 warnings), build-vite, tracked diff check and all 12 untracked-file whitespace checks pass. Final code checks are round1-repair/11-final-affected through 17-diff-check; separate exact no-index checks are 18-untracked-check-01 through 12. Only AiGuidePanel.tsx, its tests, AiGuideSheets.tsx, RecordingLibrary.test.tsx and these appended notes change from the inherited candidate. Canonical and round1-repair/candidate-after manifests bind the repaired source/build; prior candidate and failed receipts remain separate. Next station is lead Prove, then fresh round-2 reviewer; no executor Standards/Requirements verdict.

## Showhow #122 — bounded CI test-type repair

- PR #126 exists at 64c2a01676a5ca997f5a45ea5c10fb5acd7d2ae8. Lead reports native real C1–C7/UI regressions passed run-OKsXUE, and ended reviewer p4 returned Standards PASS / Requirements PASS. Failed-review count remains 1; the CI Typecheck (tests) failure does not increment it. Existing review verdicts are historical candidate-bound proof, not a verdict on this revised test content; lead owns fresh independent Review before updating the same PR. No new PR, stage, commit, push, publish or merge by executor.
- Read ci-test-types-diagnosis.md and raw CI job log before edits. Exact local RED: npx tsc -p tsconfig.test.json --noEmit exits 2 with the same ES-lib replaceAll, incorrectly generic RTL render helper, implicit parameters and unsupported ByRole exact options. New receipts and before candidate are under executor/ci-test-types/. The evidence-only snapshot helper supports current HEAD 64c while retaining all 36 cumulative ticket paths/full patch against original base 3e587dc9; historical snapshot scripts and receipts are untouched.
- Repair only test compatibility: replace literal quote replaceAll with equivalent split/join; type the concrete library render wrapper with ReactNode and RenderOptions instead of claiming RTL's generic overloads; remove exact:true only from ByRole options (exact string accessible names remain unchanged and exact by default). Production source, compiler/options/policy, assertions, resources and owner Haiku model remain unchanged. No any, suppression or cast was added to hide errors. No GUI, originals, keys, network or provider accessed.
- Additional lead-cleared CI support: Ubuntu's Test job also failed only the two real-frame tests with spawn ffmpeg ENOENT (ffprobe is required by the image assertion too). With an owned empty PATH applied only to the absolute Node/Vitest child, the same two tests reach identical ENOENT failures; global PATH/HOME are untouched. Add only apt-get update/install --no-install-recommends ffmpeg (includes ffprobe) before npm run test in the existing Ubuntu Test job; document the test-only touchpoint. No skipping/mocking/assertion change or runtime dependency. Hosted CI must verify actual Ubuntu package installation after the lead updates PR #126.
- An intermediate local repair script applied only ByRole option removal before stopping; the subsequent compiler receipt remained RED for the two unapplied repairs and is preserved. Those repairs are then applied explicitly; no diagnostic suppression or compiler change.
- Final CI repair proof: exact tests-config TypeScript check GREEN (08), unchanged real-frame tests pass with actual FFmpeg/ffprobe (06), 310 affected tests pass (10), full unit 4616 pass / 2 skip (11), source TypeScript and Biome pass (12–13, same 26 warnings). YAML parse/structural check (09) proves the only workflow change is the media-tools step after setup and before unit tests; triggers/permissions/job set/native jobs stay identical. No hosted install/CI pass is claimed locally. Incremental scope is now six paths (three tests, existing CI workflow, tiny touchpoint entry and appended notes), cumulative 37 ticket paths against original base. Browser/native/build/i18n/branding proof is reused only with recorded before/after production, full artifact and resource hash equality; no rebuild or GUI run is necessary for these verification-only changes.

## Showhow #117 — native bundle transcripts (executor Build, 2026-10-17)

- Approved Task3/R3.1–R3.6 at base/current `27940a3addd0ad4761584e1b3ddb68f7dc57ee08`, branch `ticket/117-native-transcripts`, lane w6R executor p2 / lead p1. Initially clean; no UI/priority, dependency116closed, board In progress per dispatch. No executor commit/stage/push/publish, no review/identity/PR; failed-review count0. Owner recordings and supplied proof-input baseline copies are untouched.
- Native jobs now start after bundle save in the main process, serialize/deduplicate work, resume on validated pending library open, and use v2 SttManager with digest-verified local multilingual base q5_1 and Silero VAD. Existing timestamp formatting and tests remain byte-identical. Missing model, engine errors and zero-length audio write the failure marker while preserving media/bundle inputs; same-package tests compare source, sidecar, metadata and extra-file SHA-256. The job success test checks native output written as timestamped lines and preserves source bytes. Renderer tiny implementation/worker/aliases are removed; BundleTranscript is inert and the old function is retained as a compatibility no-op.
- Conditional ownership was reproduced before edits in external EXECUTOR-STATUS.md and pinned whisper-v1.9.1.cpp. Stable prepare ensured/downloaded small/VAD before paths and optional alignment acquisition belongs to SttManager: bundled mode verifies both local files before helper start, never invokes fixed-model downloading or optional CTC acquisition. Stable small/VAD/cache/CTC APIs and tests remain. Pinned API lines387/389 select BASE (layers3–5) vs SMALL (layers5–10); lines1191–1194 reject heads beyond decoder depth. Existing helper CLI now accepts bounded --dtw-model base|small, default small, no HTTP protocol/catalogue/glossary/native capture changes. Wrapper same-package RED lacked the flag for both modes, then GREEN; script accepts --model and --dtw-model for same-helper proofs.
- Build fetch pins base revision `5359861c739e955e79d9a303bcbc70fb988958b1`, SHA256 `422f1ae452ade6f30a004d7e5c6a43195e4433bc370bf23fac9cc591f01a8898`, 59707625bytes; VAD revision `9ffd54a1e1ee413ddf265af9913beaf518d1639b`, SHA256 `2aa269b785eeb53a82983a20501ddf7c1d9c48e33ab63a41391ac6c9f7fb6987`, 885098bytes. Download and digest-checked cache rerun pass. MIT sources/attribution recorded in THIRD-PARTY-NOTICES. Builder copies only these two assets; no118size trim.
- Coordinator clearance in owner steering authorizes only matching package-lock dependency removal under R3.5. Regeneration removes22 entries, adds0, changes0 retained versions/integrities; remaining changes are npm dev-ownership metadata after Xenova removal. Baseline and regenerated npm ci both pass. No upgrades/audit fixes.
- Exact commands/stdout/stderr/exits, meaningful RED assertions and retained setup failures are in `/Users/mohamedb/dev/loop-evidence/showhow-117/executor-command-receipts.jsonl`. Native save seam RED was pending vs `[0:02] Open settings`; offline manager RED was missing ensureBundledModels call; zero-audio RED resolved empty success instead of rejecting; wrapper RED omitted --dtw-model. Initial manager test setup errors are retained and are not claimed as meaningful RED. Focused95/source checks and full-suite totals are finalized in external EXECUTOR-TRANSFER.md.
- Lint initially scanned generated native `.cache` files and failed. A targeted formatter mistakenly included generated untracked TS/JSON paths; exact selection/failure is retained in EXECUTOR-FORMATTER-SCOPE-ERROR.json. No C++ or CMake definitions were selected, no unproven restoration attempted. Lead preserved/relocated the tree; actual-checkout lint then passes without config/ignore changes. Native-ready runtime source hashes remain unchanged; wrapper test formatting alone differs from the initial test freeze.
- Native prerequisite correction: lead found retained CMake/Ninja and freshly verified hashes; owner did not install/supply new tools. Lead reports native-build-1 exit0 with sourceMismatches[] and staged fresh helper/dylibs. Executor runs no competing native/package build and claims no native runtime/package pass. Lead owns same-helper base/small/offline and package proofs, followed by fresh independent review; physical Wi-Fi-off/new-recording and missing-model acceptance remain owner-only. No Windows/Linux runtime acceptance is claimed.

- Lead lifecycle guidance reproduced two additional RED assertions: shutdownStt skipped the independent bundle manager (shutdown0 vs1), and a queued manager initialized after shutdown. Bounded repair only in index.ts/index.test.ts: register initialized managers; global app shutdown awaits all managers without creating any; refuse init after global shutdown; instance shutdown returns the same in-flight promise. Deferred-helper completion and no-post-shutdown-spawn regressions cover the app boundary. main.ts/native source stayed unchanged. Pre-lifecycle manifests and passing checks are superseded by the final transfer where affected.

- Final post-lifecycle checks: actual-checkout lint exit0 (26 inherited warnings), source tsc exit0, test tsc exit0, full unit355files exit0 with4626pass/1skip, browser10pass exit0 (unchanged renderer/browser surfaces since that receipt), digest-checked model fetch/cache exit0 and regenerated npm ci exit0. git diff --check exit0; all3new files no-index --check return expected difference1 with empty diagnostics. Final exact receipt rows40–46 plus browser23 are indexed in EXECUTOR-TRANSFER.md. Native/package/offline gates remain lead-owned; no independent verdict is claimed.

## Showhow #118 — bounded v2 package trim (executor Build, 2026-10-17)

- Task4/R4.1–R4.5 only; feature, non-priority; failed-review count0. Lead released Build only after fresh exact-#117-merge `371d940d14d7392ae090b9bfc57b2cf311c6de78` arm64 DMG and installed-from-DMG measurements: 204930830 bytes / 195.43726921081543 MiB DMG; 383115264 allocated bytes / 365.3671875 MiB installed. Directory package was 371.77734375 MiB. Baseline was already below400; RED is content policy, never an oversize claim. BEFORE.json/BEFORE.md and all setup failures remain in `/Users/mohamedb/dev/loop-evidence/showhow-118/`.
- Main/preload inventory covers six generated chunks, hashes, literal external loads, computed LangChain provider imports and native require aliases. The product passes constructed, statically bundled chat-model instances to its sole createAgent call; the universal string-model provider loader is not reached. Runtime npm allow-list is empty, with the reason recorded in the audit and external inventory/reachability receipts. Remove obsolete ws packaging only; dependency sections and lockfile stay unchanged. No Vite change.
- Chromium retains the stable-derived15app locales plus required en/en-GB (16 macOS lproj identifiers, including cs/de and en_GB). Wallpaper audit matches the longest known relative suffix so 18originals and18same-named thumbnails remain distinct; both sets still ship exactly once. Retain referenced rec-button.png (recording tray) and showhow.png (default tray/favicon/logo); only existing unreferenced demo/preview images are excluded. The initial rec-button.png classification was wrong and is repaired after first review. Budget/default package command now explicitly uses400MiB.
- Public CLI fixtures cover empty npm tree, forbidden archived/unpacked packages, required locales, duplicate/missing wallpapers and thumbnails, excluded images on disk and in ASAR, explicit/default budgets and native addon placement. Native fixture uses the real compositor_view.node filesystem path with structural placeholder bytes; it proves audit acceptance only, never native execution. Packed .node files fail while filesystem/unpacked addons remain accepted. No native npm dependency is invented.
- RED/GREEN and final check streams/exit codes are retained under external `executor/`; initial overly broad test-name selection included the obsolete ws-success assertion and failed while the new wallpaper assertions passed. That failed receipt is retained; the fixture was updated to the measured empty runtime tree and the complete script suite passed. Existing full-size wallpaper files, thumbnails, staged native/ONNX/FFmpeg/STT payloads, bundled base/VAD, small-mode behavior, fail-open source, original recordings, parked#128 and main design assets are untouched.
- Lead owns AFTER packaging, actual installed-from-DMG/DMG comparison, native/offline/library/editor/export acceptance, independent review and PR. Executor makes no native/runtime, Windows/Linux, installer/signing, physical network or owner-adoption claim, and does not commit/push/merge/tag. Production and test TypeScript plus affected/full source checks are required before return; receipts and candidate manifest bind the final result.

- Bounded config-only freeze repair: first full unit run failed1test (`scripts/i18n-check.test.mjs`) with4625pass/1skip because global en/en-GB/en_GB additions exceeded the canonical translation list. Receipt22-full-unit remains retained. Installed app-builder-lib26.15.3 schema MacConfiguration/WindowsConfiguration/LinuxConfiguration and PlatformSpecificBuildOptions.d.ts:145 support electronLanguages; ElectronFramework.js:67 gives platform-specific lists precedence. Restore original top-level canonical app translation list, and use explicit mac/win/linux runtime pack overrides with the app locale set plus required English fallbacks (underscore names on macOS, hyphen names on Windows/Linux). This keeps real fallback packs while respecting the existing translation guard; no i18n script/source/test change or array-reordering bypass. Source freeze was explicitly released only for this config/notes repair; all other source and payloads remain frozen.

## Showhow #118 — first-review finding 1 repair (2026-10-18)

- Round1 Standards PASS, Requirements FAIL; failed-review count1 carried unchanged. Read REVIEW1-DIAGNOSIS.md, review1-verdict-raw.txt and review1-lead-reproduction.json before repair. The reviewed six-path candidate, full patch, hashes and all prior failures remain in external executor/round1-repair/candidate-before/ and candidate-before.json/.patch. No PR exists; no executor commit/push/merge/tag. A second failed independent review is an owner stop; no third review is authorised.
- Finding1/R4.3: my reference inventory incorrectly classified rec-button.png as unreferenced. The corrected exact source search across src, electron, index.html and public retains `electron/main.ts:178:const recordingTrayIcon = getTrayIcon("rec-button.png", trayIconSize);`, defaultTrayIcon at177, getTrayIcon loading the packaged dist path, updateTrayMenu selecting recordingTrayIcon and tray.setImage consuming it. This was an avoidable classification error; no product/native-source change is required.
- Remove the dist/rec-button.png packaging exclusion and forbidden-image audit/test entry. Retain showhow.png and rec-button.png as nonempty referenced icons at their actual dist paths; audit reports both and fails on missing/empty copies. Fixtures copy actual public PNG bytes; separate missing/empty tests cover both icons. Meaningful RED03 rejected the valid referenced recording icon; RED05/06 showed missing/empty icons incorrectly passing (including a separate rec-button.png assertion). GREEN07 then passes both node suites. Source-reference receipts01/02 and all RED/GREEN streams are retained externally; actual rebuilt ASAR presence and decoded image proof remain lead-owned.
- Same six owned paths only; package.json has no incremental repair diff. No Vite, native, i18n scripts/tests, dependency sections or lockfile changes; no symlink-root hardening (review follow-up stays nonblocking). Existing locale/wallpaper/model/fail-open contracts remain. Fresh production/test TypeScript, lint, i18n, branding, schema, renderer and full-unit checks plus final freeze/manifest/finding-to-fix map are retained in external round1-repair. Lead owns fresh packaging, native acceptance and one fresh independent reviewer.


## Showhow #134 — landing design Build — 2026-10-18

Task 1 only. Base and HEAD: 7c66c1afa1912aa998d4d0a9021a2d46b63d218f.
Branch: ticket/134-landing-design. Executor w71:p2 returns to lead w71:p1.
Design edits have stopped. The lead must save the active ticket Pencil document
with Cmd+S, then prove its disk state. No native UI was used by the executor.

The design has eleven reusable components, eight landing colour variables,
three landing font variables, desktop TRpgX, mobile ma1pm, states J82Ol2, and
component sheet Ro86s. Four scale-1 PNGs and REPORT.md are in design/landing-final/.
The final check and probe files are external:
`/Users/mohamedb/dev/loop-evidence/showhow-134/executor/`.
The verification script exits 0. All five inherited PNG exports are byte-identical
to the before/ files. The current palette/font walks are green. The only visible
layout warning is the intended desktop hero image crop.

### Deviations

- The plan says six media slots but names seven placements. The lead followed the
  explicit list and kept all seven named placements. No section was added.
- Tighten desktop hero spacing to show the full progress card by y=898.3.
  Keep the approved copy, including its unverified 167 MB prototype size.
- Copy the inherited Darkroom shader to grain-darkroom-fade.glsl. Add only a
  bottom alpha fade. Apply the copied layers at opacity 0.3. The raster contrast
  check gives at least 5.176:1 for information text over these backgrounds.
  The original shader and all inherited frames remain unchanged.
- The initial flat background and duplicate outline-hover label were found in
  visual checks and repaired. The copied shader is visible in final exports.
  The outline hover state has a solid landing-bg fill behind its shadow.
- Store probe PNGs, check scripts, check responses, and failure notes in external
  evidence. Keep only four final PNGs and REPORT.md in design/landing-final/.

The design asset uses the Pencil checks as its public behaviour seam. No app
code was built or tested. This work does not prove browser motion, physical
accessibility, download size, or installed app behaviour. Failed reviews remain 0.
No reviewer identity or independent verdict exists. The owner must see all three
final frames before Task 2. No commit, push, PR, merge, tag, or Greptile run occurred.


## Showhow #134 — PR #149 branding policy repair — 2026-10-18

Hosted CI rejected the approved FAQ fork attribution at PR head
`5c3d1ec7f85aa499843781b15e6fe1ff114809ff` (tree prefix `03991db`).
The failed log remains at
`/Users/mohamedb/dev/loop-evidence/showhow-134/ci-job-117690407133-failed.txt`.
Its pen line numbers 5635, 6613, and 7130 are provenance, not policy selectors.

Add one exact-text allowance with maximum count 3 for the required attribution
in desktop, mobile, and states. No whole-file exemption is added. No design,
checker, site, or app change is needed.

The existing checker was imported and run against attribution.txt in an explicit
scratch root only. The prior policy rejected the three CI-derived lines. The
repair accepts those three lines; a fourth copy, an unrelated reference, and
changed attribution text remain rejected. The check exits 0. No pen file was
read, hashed, or changed. The full local branding scan was not run because it
reads pen files. Hosted policy proof and fresh review remain lead-owned.
Round 1 PASS is historical. This CI repair is not a failed review; the failed
review count remains 0. No staging, commit, push, or native UI action occurred.


## Showhow #125 — executor setup, 2026-10-18

- Approved external plan appended verbatim to PLAN.md. Base/head e54cc63e3d2cd72430588906d5550f7a968daf1a; executor w6X:p2, lead w6X:p1, failed-review count 0. Full issue/comments read from external ISSUE.json after role gh returned unauthenticated exit 4; no auth changes.
- No reproduced playback RED and no product source/test changes. Scratch driver, source/dependency copies, native artifacts, package and receipts remain under /Users/mohamedb/dev/loop-evidence/showhow-125/. Lead owns native CUA and six-take Prove; executor performs no Play/Pause or UI automation.
- Physical package copy manifest and archive hash match untouched #118 artifact built at b0e872f3. Full git comparison to current head changes only four documentation files, establishing relevant runtime source equivalence; reuse is explicit, not a fresh package build. Fresh dev renderer/main build under heavy scheduler exits 0 (executor/build2.json). First build wrapper failed after build on zsh readonly status; outputs retained. No shared dependency/cache mutation.
- Lead first dev setup exposed Tailwind plugin resolution from lane process cwd. No recording/playback attempt occurred. Scratch driver now sets cwd to its source before Vite imports, uses empty envDir and checkout-local separate caches, and requires a rendered preload-capable page with no Vite error overlay before readiness. Use fresh c/d caches; retain failed a root.
- Lead also exposed cleanup access to app.process() after app.close(). Scratch driver now freezes Electron PID, tracks owned children with birth times independently of Playwright lifecycle, closes Vite/esbuild and marks closed only after cleanup assertions. Old Electron 70639 is absent (ps exit1). Port5173 listener PID74728 belongs to the lead new dev-clean-c-warm-c driver, not the failed a run; no process was terminated. Exact ps/lsof outputs remain external receipts.
- Driver exposes only production capture/session/editor IPC, own synthetic-window setup and read-only preview timeline samples. Lead owns actual native frame screenshots and Play/Pause. Native validation of amended driver and the six playback outcomes remain pending at this executor return. No broad tests for evidence-only docs, no commit/push/publication/permissions/release/merge. External executor/SETUP.md supplies commands and boundaries.

- Further lead setup receipts: cache-c PTY input stopped the driver via SIGTTIN under heavy wrapper pgroup; five exact PID/birth-bound processes cleaned with remaining[] (LEAD-CLEANUP.json), wrapper exit137 retained. Scratch commandFile FIFO now has a separate O_RDWR guard across short writers; syntax and two-separate-writer self-check pass. No app launch by executor.
- Cache-e first native start returned missing-helper (runs/dev-clean-e-warm-e/take-1-START.json), an unavailable prerequisite rather than playback RED. Bootstrap appPath is its run root, while helpers were copied beneath source. Existing helperIdentity current env overrides and compositor OPENSCREEN_COMPOSITOR_VIEW_NODE are supported boundaries. Dev-only driver now sets explicit copied SCK/cursor/addon paths, verifies package byte equality, records hashes, and checks actual capture availability/path before READY. Electron installed public types expose no setAppPath; no unsupported setter or source edits.
- Cache-e native cleanup passed remaining[]/viteClosed:true; retained idle driver needed lead exact SIGTERM (LEAD-DRIVER-EXIT.json). After successful cleanup, scratch driver now flushes stdout then explicitly exits0 to release FIFO/libuv handles and heavy lock. Failures remain retained; current one capture-start prerequisite failure and zero completed playback takes. Package mode has no dev native env overrides and can proceed independently. Fresh f/g caches remain available; do not reuse failed roots/named takes.

- Lead packaged1 Prove reports actual playback PASS: CUA timeline0.5→4.3s and red counter9→green48, metadata/full decode exit0; authoritative assertions and screenshots under runs/packaged-1 remain unedited. That run used its retained packaged-driver-snapshot.mjs, not latest harness. Its production editor IPC closed the invoking window while expected editor opened; this is a separate harness transition observation, not playback RED.
- Future scratch driver subscribes to window creation/closure before editor IPC, requires expected editor URL plus preview DOM, and accepts only correlated target-closed error with observed invoking closure. Per-take EDITOR.json retains raw error and classification. Self-check covers accepted closure and rejected absent-editor/unobserved-closure/unrelated-error cases. Latest syntax/FIFO/source-binding self-check exits0; no native executor run. Lead next runs fresh dev f/g sessions (clean+warm each) and second explicit package; no product fix or source suite required for evidence-only candidate.

- Lead clean-f first Play candidate RED preserved separately: timeline0.4→7.2 while native red3 frozen; independent media frames changed. Same take unchanged replay PASS and warm-f take2 PASS. Current lead matrix3/6: package1 PASS, clean-f first-play RED/replay PASS, warm-f PASS. Cause unvalidated; no product edits, especially out-of-scope NewEditorShell.tsx.
- Bounded read-only observer attached only to exact owned96376 Chromium port57709 editor target from LEAD-CDP-TARGETS.json. READONLY-STATE-1792322789419.json records three end-state samples: preview9.047/false; HTMLVideo9.033 paused/ended readyState4/no error; native hardware backend and segmentation no-runtime. This late observation cannot explain first-play freeze. WebSocket disconnected only; no UI action or browser close.
- Scratch snapshot op adds bounded per-window URL/preview playing/time, video state, transport flags, supported native backend/segmentation probes and recent renderer/Vite events. Independent observe-editor.mjs uses exact bound PID/listener/editor WS and same fixed read-only expression, default3 samples or optional≤40; never app.windows(), no arbitrary expression input. Latest syntax/self-check exit0; one transient syntax-check failure during scratch edit corrected before handoff. Lead remaining clean-g/warm-g/package2; no more instrumentation or source repair without validated cause.

### Final executor return — #125, 2026-10-18

- Lead final matrix: six takes attempted, saved and independently decoded. Under `/Users/mohamedb/dev/loop-evidence/showhow-125/runs/`: `packaged-1` PASS (0.5→4.3s, red9→green48); `dev-clean-f-warm-f` clean first Play RED (0.4→7.2s, native red3 frozen), unchanged replay PASS (green10→green47), warm PASS (0.5→4.9s, blue1556→red1599); `dev-clean-g-warm-g` clean bounded PASS (0.4→7.3s, red3→blue29, lag unquantified), warm unresolved RED (arrived playing, then ended11s; Play click/Return did not restart, unexpected annotation/inherited playback); `packaged-2` PASS (0.4→4.8s, green10→blue53). Native assertions/screenshots belong to the lead and remain unchanged. Four bounded PASS, two unresolved dev outcomes; one observed frozen first-play event. This is not non-reproduction or a green Prove.
- Both g editor snapshots timed out; other windows replied. Direct g CDP read was rejected because the owned process had already exited. No playing/ref state was captured during either dev failure. f end-state CDP showed healthy ended HTMLVideo/hardware backend, not the state during its freeze. Saved f source frames independently changed. Retained g logs show initial Vite connection and missing base-model transcript failure, without a recorded optimiser reload in that interval. Automatic model work/contention, stale UI/action/focus, initialization/transport/ref state and dev launch-boundary differences remain hypotheses. Historical transformers causation is unknown; no obsolete include or fix was added.
- Read-only source inspection finds `PreviewCanvas.tsx` recreates its video-element relay on render; `VirtualPreview` depends on that callback and notifies null/current element on rebinding. The relay treats null as playing through `!el?.paused`. `NewEditorShell` already binds play/pause listeners and reconciles the bound element's paused state. Callback churn is a concrete integration pattern, but the current observations do not demonstrate it caused native freeze or failed restart. No correct failure-bound regression or smallest repair is established within the approved paths.
- External `EXECUTOR-RETURN.md` proposes only a bounded integration amendment for `src/components/ai-edition/PreviewCanvas.tsx` and new same-package `src/components/ai-edition/PreviewCanvas.playback.test.tsx`; it is a proposal, not approval or a source change. R3 remains unresolved. Lead owns STOP, final candidate binding and owner scope routing; no green Prove, independent review or PR readiness. Failed-review count0; reviewer identity not observed. All app closes were requested by lead; final process/cleanup acceptance belongs to lead receipts. No further tests, source fix, commit, push or publication by executor.


### #125 approved interaction amendment — resumed 2026-10-18

- Read AMENDMENT-APPROVED.json, retained STOP.md, full original PLAN.md and ISSUE-AMENDMENT.json. Owner approved bounded PreviewCanvas source plus same-package integration test ownership; canonical lane PASS remains w6X/p1 lead, p2 executor, head/base e54cc63e. Prior failures/proof/candidate are archived byte-for-byte in before-amendment/. Failed-review count0, no reviewer or PR. Approved amendment appended to repository PLAN.md; no further approval requested.
- Added exploratory PreviewCanvas.playback.test.tsx mounting actual shell/Preview/PreviewCanvas/VirtualPreview. It checks media play/pause events, exposed transport flags and outgoing native playing requests through first Play, replay, playhead-driven rerenders and replacement source; only platform media/native IPC and unrelated contexts are substituted. There is no meaningful regression RED yet and no production source edit. Isolated physical dependency/test source under amendment-executor/test-source avoids mutating native running source or shared caches. First focused heavy invocation returned75 before Vitest ran; receipt interaction-01 retained, queued while lead native run owns heavy resource.
- Scratch observer now persists DOM/video/transport samples synchronously before awaiting any getter imports, and performs no GPU/native IPC probe. It reads only native view ID/native position/project playing+time getters from exact already-loaded performance-resource URLs, preserving existing query identity and marking absent/ambiguous modules unavailable. It reports attachment before CUA first Play. Lead froze amendment-h driver/observer and launched approved diagnostic take1; executor has launched no app, performed no UI action and selected no fix. At most two cold diagnostic takes remain the limit, no six-matrix repeat.

- Actual integration check now observed: interaction-02 had all behavior assertions pass but exit1 from an invalid audio-probe fixture returning null (two unhandled rejections), not product RED. Corrected fixture to the supported {success:true,path:null} no-audio response. interaction-03 exits0: one real shell/Preview/PreviewCanvas/VirtualPreview StrictMode test passes on unchanged production. It checks first Play invokes mounted-element play, actual media play/pause event propagation into preview/transport/native requests, timeline rerenders, end/replay and keyed source replacement. No currentTime restart or project-store playing write is synthesized by play stub; this jsdom platform adapter cannot prove native GPU playback. No cause-bound RED and no production repair. Exact heavy commands/streams/exits retained under amendment-executor/.
- Lead diagnostic h first Play PASS after long observer setup settle; first200 direct samples were paused before click, so there is no simultaneous first-Play state coverage. Same-take CUA click at end appeared ineffective, then focused Return restarted unchanged (screenshots03/04). REPLAY-SUMMARY.json records17 simultaneous playing samples with view2 stable and native position tracking HTMLVideo; this weakens a permanent replay defect but does not explain prior f freeze. Workload snapshot includes owned whisper-stt-server after first Play; a snapshot is not workload/causation timing. Initial Runtime.enable timeout and coverage miss retained. Observer uses direct evaluation now, no enable/IPC/GPU probe. Lead h cleanup exit0/remaining[]; diagnostic i heavy-busy75 consumed no capture and its original streams remain. No extra captures requested beyond approved h/i.

### Amendment bounded stop — final executor return

- Approved two cold diagnostic captures are exhausted. Lead `runs/amendment-cold-h`: first Play native PASS0.3→5.4s/green12→red63; delayed observer covered only paused state before first Play. Same-take click at end had no apparent effect, then focused Return replay PASS0.6s/green16; replay summary17playing samples shows view2 stable and native/media clocks aligned. Lead `runs/amendment-cold-i`: first Play PASS0.7→3.8s/green11→green42 (screenshots01/02); exact-target observer attached before Play but recorded only paused state before an asynchronous cached-store evaluation timeout. No simultaneous first-Play clock claim. Two end-state Return attempts showed no change (screenshots03/04), without discriminating observer/input evidence; no causal regression established. Prior clean-f native freeze and warm-g uncertainty remain retained and unresolved. No non-reproduction, historical transformers cause, source fix or green Prove claim.
- i cleanup reports remaining[]/Vite closed/archive unchanged. Lead malformed plain close input caused retained ERROR.json; catch cleanup succeeded, residual driver57547 required exact TERM/exit143 (DRIVER-EXIT-CORRECTION.json). These and observer timeouts/coverage misses are harness failures, separate from product RED. No additional probes or captures by executor.
- Retained integration test mounts actual NewEditorShell/Preview/PreviewCanvas/VirtualPreview/NativeCompositorOverlay under StrictMode. It checks first Play and end/replay invoke the actual mounted element's play method, DOM media events update real preview/transport/native-playing IPC, timeline-driven rerenders retain playing, and a replacement source receives playback. No native pixel claim or synthesized browser restart: the platform stub does not rewind currentTime or write store playing on Play. Current production passes this adapter case, so callback churn alone supplies no correct failure-bound regression RED or justified repair.
- Final isolated checks: `amendment-executor/interaction-04` exit0/one test passed; `test-types-03` exit0 for tsconfig.test.json; `test-biome-final` exit0/no warnings. Busy interaction-01/test-types-01 exit75 ran nothing. interaction-02 exit1 from invalid audio-probe fixture despite passed assertions; corrected fixture then interaction-03 passed. test-types-02 exit2 found test-only implicit-this declarations; explicit HTMLMediaElement annotations corrected those without production edits. All failed receipts remain. No broad unit/browser/native suites were run for a nonexistent repair.
- Current owned candidate paths: PLAN.md, implementation-notes.md, and new src/components/ai-edition/PreviewCanvas.playback.test.tsx only. All production source remains unchanged at e54cc63e. Final external EXECUTOR-RETURN.md records evidence limits and precise R3 stop. Failed-review count0, no reviewer identity/verdict or PR. Lead owns final candidate freeze/STOP and owner routing; executor stops edits here with no commit/push/publication.


### #125 autonomous round1 — owner resumption

- Read full ISSUE-AUTONOMOUS.json, STOP and AMENDMENT-PROVE. Latest autonomous authority in autonomous/AUTHORITY.md supersedes earlier parking/scope-exhausted stops. Same base/lane and failed-review count0; no reviewer/PR. Owner permits evidence-justified seam expansion with lead decision recorded before edits. This round is bounded to two cold synthetic j/k captures plus same-take replay; no speculative repair.
- Lead recorded round1 before edits. Executor wrote only external scratch plugin/self-check/diagnosis, then appended this recorded authority to PLAN/notes. Five exact-source in-memory Vite transforms expose synchronous module getters, existing DEV project store, shell element identity, bounded store/view transitions and native request/response/pending/frame/paint metadata. No sampler dynamic import, GPU/native probe or transport mutation. Source files in lane and external source remain unchanged; lead froze j plugin/driver/sampler/binding before native launch. Frozen files are not edited.
- autonomous/observer-self-check.json/stdout/stderr exits0: all five exact TS/TSX transforms compile, source-hash/anchor guards reject mismatches, synchronous reads/bounded metadata/rejections and validated-vs-painted distinction checked. No dev/build launch or tests while lead heavy run by executor. Canvas pixel comparison belongs to lead sampler/CUA; metadata alone is not visual proof. autonomous/ROUND1-DIAGNOSIS.md records five falsifiable ranked hypotheses, j premise and adaptive k decision. No cause chosen and no production source edit.

- autonomous/SCOPE-002-END-REPLAY.md recorded by lead before edits authorises conditional shared togglePlay/seek coordination ownership in NewEditorShell plus existing playback surfaces. Native j DOM replay trace is discriminating for a separate restart defect: live connected same video, media13.212847/13.243333 pausedtrue endedfalse, store at timeline end; Play storetrue→false in~10ms, native setPlaying true2912 then false2913 and presentTime2914 delivered. The trace presentTime seconds is13.210333, not a claimed full physical duration. This is not evidence that the original f advancing-timeline/native-frame freeze has the same cause.
- Preserved adapter-test-before-end-replay.tsx before adding the actual early-stop regression. Real shell/preview/VirtualPreview test uses metadata, Play, real production rAF at13.212847 with no ended event, then Play+another rAF. Media stub does not rewind time or set store playing. autonomous/end-replay-red-01 exit1: original adapter case passes, new case fails exact expected {paused:false,playing:true}, received {paused:true,playing:false}, matching native j. Handled waveform fixture fallback warnings retained; no unhandled errors or setup timeout caused this RED. Production source remains unchanged while lead considers repair decision.
- Proposed minimal repair: terminal shared togglePlay uses existing raw timeline/first-playable mapping and a play intent on seekTarget; VirtualPreview consumes through existing force-resume/pending source-switch path. Avoid direct zero seek or playing the old element; preserve ordinary midclip resume. Await lead recorded repair choice before production edits. Add multi-clip/trim/source-switch coverage if mapping changes.

- Lead recorded autonomous/SCOPE-003-REPLAY-REPAIR.md after intended RED and before production edits. Repair is limited to terminal shared Play: request the first kept segment mapped back onto the raw timeline through existing seekTarget, carrying optional internal resume intent through Preview/PreviewCanvas/VirtualPreview. Existing pending-source seek owns the mounted element and metadata resume; midclip Play remains unchanged. No native service, persistence or IPC change. Original f freeze remains unresolved. Heavy checks are held while lead runs k against unchanged external source; lane source/test changes do not alter that native source.
- Repair draft now spans only NewEditorShell shared togglePlay and the typed seekTarget pass-through in Preview/PreviewCanvas/VirtualPreview; explicit resume reuses existing forceResume/pending-source handling. Added actual parent cases for midclip pause/resume, multi-asset natural advance then restart to a leading-trim source in-point, rejected terminal Play, and no kept segments; added VirtualPreview latest-manual-seek superseding pending restart. autonomous/replay-repair-format-01 and replay-repair-syntax-01 exit0; syntax transpilation is not a typecheck or behavior GREEN. No heavy tests run while k is active; actual GREEN/affected-suite checks remain pending.
- k CLEANUP.json verified remaining[]/viteClosed true/packageArchiveUnchanged true before heavy checks. In isolated amendment-executor/test-source, six source/test files match lane byte-for-byte (autonomous/end-replay-green-binding.json). end-replay-green-01 exit0: 2 files/23 tests pass, including previously observed early-stop regression. end-replay-affected-01 exit0: all13 affected shell/preview/playback/trim-mapping suites,171 tests pass. end-replay-types-01 exit0: full tsconfig.test.json typecheck includes production/tests. end-replay-biome-01 exit0:6 files, one missing openVoiceoverFlow effect-dependency warning; baseline unchanged e54cc63e shell reproduces the same warning in end-replay-biome-baseline-01 exit0. No unrelated warning repair. Existing jsdom media-play/Browserslist warnings retained in raw streams; no failing tests. No source changes after these checks.
- This establishes source RED→GREEN only for terminal replay. Lead native candidate recheck remains pending; no actual native repair acceptance, full-repo/browser suite, original f freeze GREEN, historical transformers cause, review or PR-readiness claim. Lead retains all j/k startup/observer and original failed evidence, and owns round3 cold l against unchanged baseline. Heavy checks complete; executor launches no native apps and makes no commit/push/publication.

- Lead recorded autonomous/SCOPE-004-MODEL-PROGRESS.md before model source/test edits. Passive p reproduces stable-view/live-element native paint holds with advancing playback; source per-stream-chunk model progress reaches STT IPC and transcription job subscribers unbounded. New conditional ownership only electron/stt/modelManager.ts and same-package modelManager.test.ts, plus PLAN/notes. All ensureFile callers read: ensureModels for whisper/VAD progress and ensureAligner without progress; LocalSttService prepare and aligner callers inspected. No progress throttle exists in this path; unrelated native export progress throttling is not reused. First add controlled real-stream rate/byte/hash regression against unchanged emitter; no callback/Tooltip/UI/transcription/native edits.
- autonomous/model-progress-red-01 exit1 against byte-identical e54cc63e emitter: public ensureModels real201×16KiB stream, controlled monotonic4ms/chunk clock, valid content/hash/atomic installation and exact first/final bytes pass; intended bound fails expected<=11 notifications, received201. No setup/unhandled failure. Per decision004, repair now caps callback delivery in shared ensureFile using monotonic100ms comparisons and exact end flush with duplicate-byte suppression; perchunk stall arm/accounting, pipeline/hash/atomic/error/cancel paths unchanged, no timers/dependencies/config.
- model-progress-green-01 exit0: same real-stream regression passes with100ms cap, immediate first/exact final bytes, verified contents/hash/install, no duplicate final or queued timers. After format-only test layout, model-progress-affected-01 exit0: all13 affected suites/230tests pass (complete electron/stt plus captioning/document/store/status and actual parent playback integration). Existing retry/cache/hash preservation/stall/cancellation paths remain GREEN. model-progress-types-01 exit0 checks tsconfig.test.json; model-progress-biome-01 exit0/2files/no warnings. Exact argv/cwd/TMPDIR/root-owned scratch/stdout/stderr/exits retained under autonomous/. No shared dependency/cache changes, real download or native app launch by executor.
- Passive p metrics in autonomous/p-progress-analysis/metrics.json: gen31/source0.27 held34playing store samples2.503692→5.924269s; gen87/source2.561667 held30samples6.029712→9.046667s; sameview2/element1. Transcription14876callbacks/14875scalar changes through70.5959s. Retained tail512 snapshots starts68.2192s: median4.4ms progress interval,446of453positive whisper deltas exactly16384bytes. Earlier firstPlay-phase entries have been evicted, so tail cannot timestamp each playing-window status. Final failed job retains885098-byte last-model progress, not a proved download-failure reason. Source chain has no throttle before this patch; source rate RED/GREEN plus p symptoms justify native intervention, not a completed causal/native fix claim.
- Lead froze five production source files and three tests in autonomous/CANDIDATE-RUNTIME.json / external candidate-source after checks; executor makes no further production/test edits. Scope005 authorises lead paired controlled-input native baseline/repaired fixtures with same original-f media, exact pinned model URLs and verified own model bytes, passive6moduleobserver/actual CUA. This intentionally controlled model-input proof is separate from later fresh recording with production network/model input and native terminal replay acceptance. Source/code/runtime hashes must bind rebuilt Electron main output; baseline dist-electron would not exercise model progress repair. Original baseline source/failures unchanged. Heavy checks released; no review/PR/native-after claim and no commit/push/publication.


### #125 final candidate and acceptance — 2026-10-18

- Final repair has two independently reproduced defects: model download notifications starve editor paint, and terminal Play fails to restart when the browser stops just before physical EOF. The shared download emitter now reports at most once per100ms with immediate first/exact final bytes, preserving accounting/hash/atomic/error/cancel paths. Terminal Play uses the existing first-kept-segment seek/resume path. No callback/Tooltip/native-service/dependency optimization was added.
- Source proof: model-progress-red-01 fails201 notifications against<=11; green and affected230tests pass. Native early-stop replay j has matching actual shell/preview integration RED, then23playback/171affected GREEN. Final candidate checks:4632unit PASS,3skip;10browser PASS; production/test TypeScript, Biome and branding PASS. Two skips are baseline; one environment-template test is excluded under the explicit no-env constraint. Prior missing-template and setup failures remain external. Exact commands/results: autonomous/final-checks-1792333206210/REPORT.md.
- Causal fixture/native proof is separate: passive p reproduces paint/media divergence; matched original-f baseline q freezes counter3 while timeline/media advance through8.9s under16,197 paced pinned-model input chunks. Same input candidate r2 shows counter9→45→89 with timeline0.7→4.3→8.7,413updates and terminal replay advancement. PAIRED-BASELINE-RED.json and PAIRED-CANDIDATE-GREEN.json retain raw bindings. This is controlled model input, not production network acceptance.
- Fresh production-input scenario s records a new own synthetic window once, without input substitution: native counter10→56→103/timeline0.7→5.4→9.9; full source decode0/hash unchanged; independently extracted source frames change. FRESH-S-NATIVE-GREEN.json covers296running-media samples, max interior paint/media lag0.113s. This later take alone is not offered as proof of the original cause.
- Fresh standard unsigned macOS arm64 package built with native/licence guards enabled. Missing prerequisites were installed only below the external evidence root; no source/config/native dependency changes or permission/auth changes. Candidate ASAR SHA256 d449d0cb3b4d6f0efac214909d75c817d55a499aafeea8656fd05342fc5f8ec4; contents audit and17export-helper contracts PASS. Earlier build/license/PATH/admission failures remain retained. Binding: autonomous/CANDIDATE-PACKAGE.json.
- Pure packaged playback of original-f media and end replay pass actual CUA screenshots in runs/candidate-packaged-playback. Two separate packaged GIF exports invoked only through CUA pass saved-completion UI plus independent byte bounds/full decode/color checks:30frames,2s,608×480 each. Only save-picker destination is redirected to isolated scratch; production writer is untouched. Export source fixture is committed sample.webm, not a new recording. All three runs close normally with remaining[]/signals[] and candidate/original archive/source hashes unchanged.
- Limits: macOS arm64 synthetic own-window/noaudio/webcam only; no Windows/Linux, signed installer, private recordings, physical device or frame-perfect terminal-boundary claim. One environment-template test remains excluded. Historical transformers causation remains unproven. Original matrix/amendments/STOP/failures are preserved; no six-take rerun, issue closure or merge. Fresh independent review and one review-ready PR remain lead-owned.


## Scope007 — CI test harness diagnosis (2026-10-18)

Hosted Test at head `2e1732dab6d1f84377ed4e8d8d3f8fc406c3f724` timed out only the streamed model-progress regression at 15 seconds (~16.993 seconds); 4,632 other tests passed and two baseline cases skipped. The failure and previous native/package proofs are preserved.

Scratch-only `process.hrtime.bigint` phase instrumentation avoided the mocked monotonic clock and fake timeouts: fixture ready 2.394 ms; ensureModels done 41.800 ms; file read done 42.603 ms; deep equality done 3,720.803 ms; before timer drain 3,721.527 ms; drain done 3,722.727 ms. Generic deep comparison consumed 3,678.200 ms locally. This identifies local test overhead consistent with the hosted timeout; no hosted function profile was captured. Native Buffer equality took 0.483 ms in the changed scratch probe, whose complete case passed in 23 ms.

The sole test change uses `Buffer.equals` to compare every installed byte and length against the unchanged 201 × 16 KiB fixture. Integrity pin/hash/install, first/final progress, 100 ms bounds, spacing and no queued callbacks are retained. No diagnostic instrumentation enters the candidate. Against the original e54 emitter, the revised test fails the intended 201-notifications-versus-≤11 assertion in 24 ms, after file/install and first/final assertions pass. The repaired product was then restored in scratch. The uninstrumented focused file passes all 21 tests (streamed case 12 ms); the affected 13 files pass all 230 tests. Test TypeScript and Biome exit0.

First full unit run: 4,629 passed / three failed / three skipped. All three failures were scratch setup omissions: the canonical public brand SVG and design docs/tokens had been excluded. Exact required committed public fixtures were copied read-only with lane/scratch hash equality in `scratch-prerequisites-binding.json`; no lane design file changed. Their focused suites then passed. Fresh full unit run: 356 files, 4,632 passed, zero failed, three skipped (two baseline plus the unchanged exact environment-template exclusion), 31.12 seconds; streamed case 26.357 ms under suite load. No extra exclusion, timeout or configuration change.

Evidence, pre-edit decision, original/probe snapshots, commands/stdout/stderr/exits, both full-run JSON reports and final candidate binding are under external `autonomous/ci-test-diagnosis/`. All five production files and the other two playback tests match their pre-diagnosis hashes. Runtime/native/package proof remains bound; no native/browser/package rerun for this test-only change. Failed-review count remains zero; lead owns fresh review, commit/push and PR150 update.


## #139 T1 bounded executor scope — 2026-10-18

Before production edits: clean base `27494aa34f2467cc107adfb586db308157ccc372`; lead confirmed BEFORE complete in `showhow-139/visual` (native/browser light/dark, capture exit 0). Scope is the approved T1 paths and these explicitly named same-directory additions: `Shell.tsx` (sidebar/content slots), `Sheet.tsx` (existing Radix dialog semantics, header/body/footer), `Tabs.tsx` (existing Radix tabs semantics), `Field.tsx` (native labelled input/error), `Progress.tsx` (accessible determinate/indeterminate/failed progress). Existing public props, theme storage keys and sh-* aliases remain compatible. New modules use direct imports; no index.ts edit. No screen, guide engine, IPC, native, permission, account, media or #140 work.

Observed discrepancies: selected row uses sage fill rather than on-panel wash; secondary is filled and ghost bordered; logo/toast lack signature external offset shadow; display compatibility aliases resolve to serif; recording tokens differ from SPEC. Intended first RED is actual computed selected-row fill in both themes; subsequent slices exercise button variants, type/shadows, and new shared vocabulary. Existing theme helper receives fallback/reopen/cross-window System behaviour coverage without speculative implementation changes. Lead owns native/browser computer proof and PLAN/HANDOFF. Herdr rejected executor messaging (`executor cannot message panes`); reports remain here and under the authorised evidence directory. Failed-review count 0; no existing PR supplied; no commit/push.

T1 implementation details: `Progress` owns semantic track/fill/value/failure and an optional `frontier` slot; content-specific mosaic rendering belongs with T2 processing states, so no invented shader/dither implementation is added. `Sheet` and `Tabs` reuse existing house Radix wrappers; `Field` preserves native input props/ref and links errors. Existing `ds-font-serif` and `sh-font-heading` names now resolve to Inter Tight. Existing font assets are reused; Inter Tight only ships 400/500 faces, so requested 600 currently uses browser font synthesis (no downloaded font or dependency). No upstream theme selectors or helper implementation changes.

### T1 bounded accessibility amendment (before edits)
Lead measured enabled light-theme muted small text at 3.31:1 (`visual/contrast-before.json`). Authorised repair uses existing `ds-ink-soft` for Field labels, inactive Tabs, Sheet eyebrow/description, Card eyebrow and EmptyState body; Sidebar library label uses existing `ds-on-panel-muted`. No palette values change; no upstream screens. Browser test must composite alpha foreground on its actual surface and assert >=4.5 in both themes. Reduced-motion proof must assert transition-property:none. The first sheet browser run hit a cold-cache prebundle hook error; identical rerun passed all 8 browser assertions, and lead isolated probe passed keyboard/modal checks. Retain both failure and successful receipts; no production fix inferred from a setup failure.

### T1 toast amendment (before repair)
Lead observed the actual Sonner notification retains white/diffuse defaults despite utility classes (`visual/toast-light.png`). Add computed rendered-toast RED for background/signature shadow, then use Sonner existing unstyled option in owned Toast.tsx rather than broad selectors. Reduced-motion assertions inspect actual transitionProperty:none for toast and shared controls. The first broad checks used the incomplete main dependency link: both TS exit2, unit exit1, browser exit0; missing modules and all failures retained under checks/. Lead owns overlay repair and PLAN branding lines; no source dependency/lock edits.


### #139 bounded branding classification — before config edit

Appending the owner-approved Final design plan verbatim introduces exactly three intentional legacy-extension lines in PLAN.md. Branding check reports those three lines (external checks/branding.stderr). Preserve the approved wording and compatibility contract; extend the existing PLAN.md literal-line allowlist in config/branding-allowlist.json by those exact lines/count1, with no blanket exemption or scanner change. This is a necessary bounded documentation-policy amendment under the owner autonomous routine-scope authority. Lead owns this config edit and its branding verification.

### T1 reduced-motion sheet amendment (before repair)
Lead observed inherited DialogContent entry animation still active under reduced motion. Browser regression now checks animationName:none and transitionProperty:none on the actual sheet and overlay. Scope remains Sheet.tsx: compose existing DialogPortal/DialogOverlay and Radix Content with scoped important reduced-motion utilities, avoiding any change to unrelated upstream dialogs. Prior production freeze is lifted only for this reproduced shared-sheet defect and its test; source will freeze again after checks.

### T1 Final logo amendment (before edits)
Lead authorised adding `src/components/showhow/logo.browser.test.tsx` to owned test scope: the old test pins a theme-varying Pen tile, while approved Final SPEC/mock126 require fixed cream in both themes. Change its dark-fill expectation, observe RED, then change only the tile fill in Logo.tsx; preserve inner geometry and existing props. No new design asset.

### T1 status-control contrast amendment (before edits)
Lead measured the exact SPEC progress text and rec/failed white-on-orange combinations below 4.5:1 for small text. Approved accessibility adaptation: progress tag uses existing `ds-accent-strong` text on accent-tint; rec Button/failed Tag use existing `ds-rec-ink` background with `ds-surface` foreground (cream on dark red in light theme; charcoal on soft orange in dark theme). No palette values change. These are measured accessibility deviations from literal SPEC status fills, not pixel-exact claims. Browser assertions cover all enabled Button and Tag variants on their actual surface/panel contexts in both themes.

All-variant browser RED additionally found alert Tag dark text on rec-wash at 4.4324:1. Extend the same authorised scoped substitution to `ds-ink` text for alert tags while retaining the orange wash. Exact pre-repair rendered colours/ratios remain in status-contrast-red.log.


### #139 review round 1, finding 1 — before repair
Standards FAIL / Requirements FAIL; failed-review count is now 1. Lead diagnosis `REVIEW1-DIAGNOSIS.md` and retained original 25-file staged candidate bind the single blocker: active Progress fill/track graphical contrast is 1.9200:1 in light mode (dark 4.6722:1). Authorised scope for this repair is only Progress.tsx, theme.browser.test.tsx and this note. Add actual rendered active and failed fill/track contrast assertions >=3:1 in both themes, observe original RED, then substitute existing stronger semantic fill tokens only where needed (`ds-accent-strong` and, if failure coverage also reproduces a shortfall, `ds-rec-ink`). This is an accessibility adaptation from literal fill colours, not a palette redesign or pixel-exact claim. Preserve props, track, layout, values, failure semantics and motion behaviour. No fonts, screens, aliases, staging, commit or push. Lead owns renewed visual proof, fresh round-2 native reviewer identity and review. Prior 4639/18/11 green results and failures remain retained.

Round-1 actual browser RED reached the intended assertions: active light 1.9200256759870886:1; failed light 2.905631305539747:1, both against rendered chip rgb(232,228,220). Both dark states passed. The requested failed-state coverage therefore also requires `ds-rec-ink`; this is the same bounded progress-graphic finding and does not add another review failure. Retained `round1-repair/progress-red.log` and its screenshot precede the production fix.


## Showhow #140 — bounded implementation decisions before production edits

Executor w73:p2, clean base dd98eab42f8d9a4de44f9ac8a1328e2946a8315e.
Approved T2 ownership and latest owner exceptions apply. Lead confirmed inspected
BEFORE light/dark native/browser captures in external showhow-140/visual/before-*
before production authorisation. Existing supported minimum is 800×600.

- Reuse shared Sidebar, LibraryRow, VideoPlayer, GuideStep, Button, Field,
  Progress and Sheet vocabulary. Keep existing list/update/guide IPC and media
  containment contracts. No imports, PDF, brief, ChatGPT connectivity or native work.
- Search trims and case-folds titles locally, preserving scanner order. Selection
  uses bundleDir identity: keep the selected match; display first match only if
  selection is filtered out; no-results hides detail and Clear restores selection.
- Keep existing meaningful deferred title-save, guide completion, step persistence,
  reveal and seek tests. First new RED exercises actual library search through RTL,
  matching selection, no results/Clear and unchanged list order without refetch.
- #127 removes the ready-output review link; first-provider and Make/Remake review
  remain accessible. Step actions use house buttons. Existing #122 cancellation,
  failure and prior-output contracts take precedence over static mock content.
- Do not fabricate provider phases, streamed steps, transcript quotes or remaining
  time. Narration-only/no-speech notices reflect actual status; clicks remain usable.
- Lead owns PLAN/HANDOFF and native synthetic disk-bundle/frame evidence. Executor
  owns source/tests and raw source-check receipts; no commit/push/PR.

Operational receipt: Herdr refused executor messaging (`executor cannot message
panes`); status is exchanged through external EXECUTOR-STATUS.md as directed.

### Bounded amendments before edits

Lead identified that Final sidebar statuses cannot be represented from the current
scanner entry. Extend electron/showhow/recordingLibrary.ts and its same-package
test only to project validated optional meta.guide.status and step.kind. No write,
IPC, auth or path contract change. Missing/invalid status stays absent. Test real
scratch meta/steps files before implementation. Live selected making/failure state
uses an optional existing-panel callback, keyed by bundleDir; list refresh supplies
persisted final status. Avoid per-row provider/status requests.

Components.test.tsx is added to test ownership solely to replace its now-obsolete
serif quote assertion with the approved body font. Preserve content/action tests.
Final exported thumbnails are 240×136 despite SPEC's 160×90; export wins at reference
width, with smaller thumbnails/wrapping at 800. No fabricated narration quotes.
Mosaic uses a deterministic static SVG rendition of the shader's block hash/frontier
and dot screen; no animation loop, GPU context or new dependency. It is restricted
to empty/loading, redaction and progress frontiers, not finished screenshots.

Shared sheet amendment before edit: extend Sheet.tsx with its underlying Radix
onCloseAutoFocus callback prop, then make GuideSheet a thin consumer. This removes
duplicate sheet geometry/motion and preserves #122's tested explicit focus return.
No dialog-wide CSS or unrelated consumer changes. Existing focus/escape/cancel
regressions remain the acceptance seam. Failed progress is indeterminate; making
progress is three discrete phases, never measured duration/ETA. Cancellation stays
before-send review/Remake confirmation. The engine keeps the previous guide on disk
until validated replacement, and its existing failure recovery remains unchanged;
T2 does not revise deterministic-artifact restoration or AI output rules.

Observed reciprocal race RED: step-title-race-red exit1 loses the newer sidebar
rename after a deferred step save, while the other bundle remains selected. Repair
before edit: send only the saved steps plus originating bundleDir to the parent;
merge those fields into the current entry. Keep guide completion's full scanner
replacement and independent title patch. This fixes the shared persistence seam
for edit/delete/reveal writes without serialising unrelated title work.

Library01 overview choice before edit: retain inherited first-take selection on
load and add an explicit Library heading button to return to the approved Pick a
recording overview. Row selection leaves overview. The new public regression is
RED on absent overview navigation before implementation; no hidden fixture route.

### Receipt correction

The initial source-check runner reused affected-02 / production-types-01 /
test-types-01 output names on its second invocation, overwriting those first-run
streams. First-run affected-02 was green. First production/test TypeScript failed
on the callback-assigned readonly React ref; this was observed in the terminal
session and by the lead, then fixed by the appropriate nullable mutable ref type.
The earlier raw compiler streams are lost; do not reconstruct them or claim they
were retained. Current same-named streams prove the later green checks only.
All meaningful behavior RED files and focused-01 failures remain untouched.
The final broad runner uses a new checks-final-01 directory and exclusive-create
streams. Any further run must allocate a unique new directory/name.

### Final observed layout repair — before edits

Lead's measured matrix-ready-light has correct video x326/y140/820×340, but the
standalone path/Copy row shifts the guide header to y573 instead of Final y529.
Add one optional ReactNode actions slot to AiGuidePanel's existing header. Move
the same real Copy path button into it beside Remake; preserve pending/success/
failure state and IPC. Retain exact path in the button's title and a small
Recording folder disclosure after guide content. No engine or new feature work.
Prior executor-freeze-01 and matrix images remain retained pre-repair evidence.
Rerun affected suites/types/browser/lint/build with new receipt names, then freeze.

## #141 bounded Sidebar amendment — recorded before source edit
Reference Library17/18 places Import immediately below New recording and above Library/search. Add only an optional secondaryAction ReactNode slot to src/components/showhow/Sidebar.tsx, with coverage in its existing Components.test.tsx, then pass the real import Button from RecordingLibrary. Existing consumers omit the slot. This necessary shared presentation repair is authorised by the standing owner autonomy and lead direction. No generic menu or Sheet geometry change. The shared 560px Sheet is an explicit adaptation from reference 460px.

## #141 MP4 Library import — implementation and limits

The main-owned system picker accepts one local MP4. The renderer supplies only a
request id, never source/destination paths. The production registration function
is exported from importRecording.ts for the same native proof entry point. Sender
and request ownership gates cancellation; malformed requests are rejected before
the picker. Cancel while the picker is pending writes nothing.

Import copies bytes into an exclusively created .import-* staging directory,
which the scanner excludes even when staged metadata exists. The source is opened
read-only; no sidecar is imported or fabricated. After a complete copy, FFmpeg is
resolved through the existing packaged-tool resolver and fully decodes the copied
H.264/AAC media, so readable headers alone do not establish a complete video.
Validation and finalisation are indeterminate phases; copying reports actual
bytes, bounded to 100ms updates plus initial/final values. Metadata, empty
workflow artifacts and a pending transcript marker precede the atomic rename.
Unique destination ids keep duplicate names separate. Cleanup removes only the
job's own staging directory. A cancellation after publication returns success
and keeps the complete bundle. Transcript work reuses the existing local job and
narration guide path; failure preserves imported media. Imported metadata extends
only the bundle/buildMeta source union, not the recorder input or click tiers.

The sheet reuses the house Sheet/Progress/Button primitives. Its 560px maximum
width adapts the 460px reference to the established house sheet. Import appears
immediately after New recording through Sidebar's optional secondaryAction slot.
Success clears search/overview and selects the imported row. Existing capture
rows and guide status behavior remain compatible. New locale keys use English
fallback text in all 15 locale files; translation quality is not claimed.

Focused proof includes real temporary synthetic H.264/AAC MP4 files, unchanged
source hashes, duplicate names, mid-copy and decode cancellation, truncated
faststart input, invalid/unreadable/directory/symlink/path inputs, hidden staging,
exact bytes, picker cancellation, forged renderer paths, foreign/stale cancel,
actual Library selection and sheet states. Import-reader, success, production
registration, Library action and Sidebar-order RED receipts are retained.
Duplicate/cancel/truncated checks were added after the initial import success
slice and passed on their first run; they are GREEN boundary coverage, not
separate preimplementation RED claims.

Setup receipts retained: the first synthetic encoder was unavailable; the test
fixture was repaired to use system FFmpeg/libx264. One initial Library test used
an ambiguous text query; it was corrected before the meaningful missing-control
RED. Test TypeScript found an unsupported getByRole option; repaired without
weakening the assertion. A shared external runner pathname changed during use;
one green attempt was unscheduled. The executor switched to an exclusive unique
runner with mandatory heavy scheduling, then reran the affected checks. Initial
real-file tests used the OS temporary directory; subsequent/final checks set
TMPDIR/TMP/TEMP to each unique external evidence directory. Old receipts remain
unchanged. Vite production build and final unit/browser wrappers point envDir to
a fresh empty external directory; the environment-template unit remains excluded
locally per the approved privacy boundary, with normal hosted CI still required.

Native macOS proof, editor playback, source hashes after native probes and frame
comparisons are lead-owned. Executor source checks do not claim native acceptance,
Windows/Linux runtime, macOS13 hardware, installer/signing or hosted CI results.

### #141 executor final source verification — frozen

- Production TypeScript: exit 0; external showhow-141/final-ts-production-7ximihru/ (command.json, stdout, stderr, result.json).
- Test TypeScript: exit 0; external showhow-141/final-ts-tests-nci3kppe/ (command.json, stdout, stderr, result.json).
- Biome: exit 0; 27 inherited warnings; external showhow-141/final-lint-swbpd8j9/ (command.json, stdout, stderr, result.json).
- Branding: exit 0; external showhow-141/final-branding-4gljvxnr/ (command.json, stdout, stderr, result.json).
- i18n: exit 0; all 15 locales aligned; external showhow-141/final-i18n-v_nzgcp2/ (command.json, stdout, stderr, result.json).
- Affected browser: exit 0; 3 files, 14 tests; external showhow-141/final-browser-egcxb_wl/ (command.json, stdout, stderr, result.json).
- Broad unit: exit 0; 359 files, 4678 passed / 3 skipped; external showhow-141/final-broad-units-n9g7dck_/ (command.json, stdout, stderr, result.json).
- Production main/preload/renderer build: exit 0; external showhow-141/final-production-build-jacca_30/ (command.json, stdout, stderr, result.json).
- Affected Showhow: exit 0; 29 files, 359 tests; external showhow-141/affected-showhow-final-djsijb0m/ (command.json, stdout, stderr, result.json).

All final code checks cover the frozen production/test candidate at base HEAD 9eb781dcbc1d46528d2cfe387d1285bae7fab40b plus the dirty ticket diff. Production/test source frozen on lead request. No further source edits or heavy checks pending lead native proof. Independent review has not run; failed-review count remains 0. No executor commit, staging, push, PR, CUA or merge.


### #141 lead native proof and retained limitations

External `~/dev/loop-evidence/showhow-141/PROVE.md` binds source checks and two real production Electron import journeys on macOS26.6.2 arm64/Electron41.2.1. Actual picker cancel and actual mid-copy cancel leave no entry; truncated input fails with retry; valid input selects an IMPORTED row; duplicate names create two distinct bundles. Source and all3 copied MP4 hashes match; independent full decode passes for3 copies and4 native recordings. Native editor pixels/counter and timeline advance in both slow-source and unthrottled runs; Library preview also plays. Minimum800×600, light/dark, focus trap/Escape/return and simulated reduced motion are observed.

Scratch bootstrap isolates Electron/OS paths before main, sets only the real picker initial folder, and uses unchanged hash-bound125 native engine inputs. The slow-source fixture delays only reads of the exact generated MP4; the second run is unthrottled. No fabricated events/clocks or fake importer. The loose bootstrap lacks bundled base/native STT helper: transcript failure markers preserve imported media; successful speech/provider/guide generation is not claimed by these import runs. Fixed small/VAD public input caches are verified synthetic copies, with no auth changes.

Both media journeys closed Electron but scratch driver exit13 occurred when reading app.process() after disposed transport. Original raw stacks/drivers remain. Independent process cleanup receipts confirm no owned descendants. The cached-child correction passes a separate short launch/close check with exit0/rootGone; it is not a repeated media-journey claim. BEFORE initial wrongURL setup failure is also retained; corrected paired native BEFORE/AFTER exit0. Full evidence roots are retained outside the worktree. Only notes changed after frozen code checks/native binding; production/test hashes remain equal.

Windows/Linux runtime, macOS13 hardware, current packaging/install/signing and real speech/provider/clipboard acceptance are untested. Fresh independent review and exact-head hosted CI remain separate Ship gates; only owner merges in GitHub.

## 19 October 2026 — Showhow #135 landing page build
### What shipped

`site/` is an Astro project (React islands) that builds a static page from the Task 1 design in `design/landing.pen`. Copy and states follow the approved prototype in `design/landing-prototype/`.

### Where it differs from the ticket

- **Not hand-written HTML/CSS/JS.** The owner asked for Interlude, Lenis, React Bits, itshover and interior.dev. They are React/Astro/GSAP libraries, so the page is an Astro build. The output is still static files on one origin: fonts are self-hosted, there is no third-party script, and no cookie is set (the spec asserts all three).
- **Interlude is route-to-route.** It transitions between pages, and this page has one route. Its stack is used (Astro, GSAP, Lenis) and the intro shutter and scroll scenes follow its style, but no Interlude engine file is copied. Revisit if the site gains a second page.
- **Spec files.** `playwright.config.ts` now has an `app` project (the existing specs, unchanged) and a `landing` project.
- **RED was not observed.** The spec was written after the page. Tests were run green only.

### Open items

- itshover states no licence on its site; its icon sources are copied into `site/src/components/vendor/itshover/`. Confirm the licence before launch.
- Shader opacity stays at the design's 0.3 (`--landing-shader-opacity`). The owner plans to tune it in code.
- All loops are placeholders (Task 3).
- The download button links to the repository until a release exists.
- A DialKit tweak pane (`?tweak` or Shift+T, hidden by default) adjusts the shader, hero sizing, palette and scroll smoothness live. It is lazy-loaded and persists values in the owner's browser only.
