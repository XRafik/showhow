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
