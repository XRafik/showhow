# Implementation notes

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
