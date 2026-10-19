# Showhow Recording Bundles

This document is the active architecture and operations reference for the Phase 1 recording-bundle
and transcription layer.

## Purpose and current scope

Every completed recording is persisted as a self-contained folder under
`~/Showhow/Recordings/`. The folder is the recording: it contains the source artifacts needed by
the editor, a person, or an AI agent. Phase 1 establishes the folder, manifest, and transcript.
Generating workflow steps and screenshots is desktop doc-engine work and is not yet complete.

## Bundle contract

The current capture format determines the video filename. Native macOS capture normally writes
MP4; a browser MediaRecorder fallback may write WebM. A representative bundle is:

```text
~/Showhow/Recordings/2026-07-12_143022-recording/
├── video.mp4
├── video.mp4.cursor.json
├── webcam.webm
├── transcript.txt
├── meta.json
├── agent-brief.json   (optional, #142)
├── agent-brief.md     (optional, #142)
└── screenshots/
```

- Cursor telemetry and webcam video are present only when captured.
- `meta.json` is the manifest defined by `ShowhowMeta` in `electron/showhow/bundle.ts`.
- `meta.json.steps` is `null` in Phase 1. It is a reserved slot, not an error.
- `steps.json`, `steps.md`, and screenshot contents belong to the desktop doc engine.
- Never break the `<video path>.cursor.json` invariant. The editor loads telemetry from
  `${videoPath}.cursor.json`; shortening it to `cursor.json` silently breaks the cursor overlay.

## Bundle creation

`electron/showhow/bundle.ts` owns `createRecordingBundle()`. It moves finished recording artifacts
into the bundle directory and writes the manifest. Showhow-specific main-process code stays in
`electron/showhow/`; renderer behavior stays in `src/lib/showhow/`.

Bundle creation is best-effort and fail-open on every save-completion path. A caught bundling error
is logged and the caller returns the original flat session and manifest. The documentation layer
must never reject a valid save or lose a recording.

## The three macOS save-completion paths

There is no single macOS save path. `electron/ipc/handlers.ts` calls `createRecordingBundle()` from
three independent completion paths:

1. `storeRecordedSessionFiles`, reached through the `store-recorded-session` IPC handler, covers
   the browser MediaRecorder fallback used when native capture is unavailable.
2. `stop-native-mac-recording` covers the default macOS ScreenCaptureKit path. Omitting this path
   produces flat artifacts without a bundle, manifest, or screenshots directory.
3. `attach-native-mac-webcam-recording` covers the native webcam-attach path so a ScreenCaptureKit
   recording with webcam picture-in-picture produces the same bundle contract.

Native Windows capture, `stop-native-windows-recording`, has a similar shape but is intentionally
not hooked because the current Showhow V1 scope is macOS-only.

When adding work that depends on recording completion, search every `ipcMain.handle` registration
that writes a `RecordingSession` and `.session.json`. Preserve the bundle and transcript blocks at
the tail of all three hooked macOS paths. Confirm any claim about “the save path” with a real native
recording; static inspection of the browser fallback alone is insufficient.

## Transcript generation

The main-process save path calls `electron/showhow/transcriptJob.ts` after the bundle is
saved. It serializes jobs and retains a pending marker until completion, independently
of renderer mounts. Opening a validated pending library bundle resumes the same job.
The retired `BundleTranscript` slot no longer claims renderer work.

Each job creates v2’s `SttManager` in bundled offline mode: verify SHA-256 of the
multilingual `ggml-base-q5_1.bin` and local `ggml-silero-v6.2.0.bin` before resolving
paths or starting the helper. Extraction uses native FFmpeg at mono 16 kHz. The helper
uses BASE DTW heads for bundle jobs; existing editor small-q8 consumers keep SMALL.
Optional CTC acquisition is disabled for these jobs; existing editor behavior remains.
`src/lib/showhow/transcriptFormat.ts` still formats the timestamped lines unchanged.

The job writes `transcript.txt` directly inside its already-owned bundle and regenerates
document artifacts through the existing main-process equivalent of `showhow:write-transcript`.
Model absence/digest mismatch, engine errors and zero-length audio produce
`(transcription failed)`. These failures preserve the recording and bundle inputs.
A transcript write error is logged and leaves the pending marker for a later resume.
The existing renderer IPC retains its root validation for other callers.

`fetch-caption-model.mjs` fetches both pinned, digest-checked models at build time.
Builder copies only these two model files from `caption-assets`; obsolete renderer
Whisper-tiny/ORT assets and Xenova dependencies are removed. Model revisions, hashes
and MIT attribution are recorded in `THIRD-PARTY-NOTICES.md`.

## Verification

Automated tests cover bundle construction and transcript formatting/lifecycle behavior. Operational
acceptance requires a real macOS native recording because Linux CI cannot exercise ScreenCaptureKit:

1. record and stop a native macOS session;
2. confirm it lands in a bundle rather than as flat files;
3. confirm `meta.json`, `screenshots/`, and `transcript.txt` exist;
4. confirm any telemetry is named `<video path>.cursor.json` and the cursor overlay still works;
5. repeat with webcam capture when changing the webcam-attach path; and
6. induce or simulate a documentation-layer failure when changing fail-open behavior and confirm
   the recording remains available.

Upstream intake follows `UPSTREAM.md`: keep the permanent tags-only `upstream` remote and merge
the selected release tag as a real release parent. Follow that policy's compatibility checklist
and exclusions; this bundle contract does not replace the upstream intake policy.


### Stable-v2 integration clarification (2026-10-17)

For #116 the retained renderer bundle-transcript pipeline lives in
`src/lib/showhow/whisperTiny/`, called through `generateTranscript.ts` and the
`BundleTranscript` wrapper. Stable native STT helper/model-manager packaging does
not replace that renderer job in this ticket. A flat legacy `.session.json` is
opened through the library, then Showhow's main-process resume seam reconstructs
only a genuinely pending bundle job from bundle metadata; completed transcript
content wins over stale pending fields. Renderer job completion clears only the
matching bundle/video session and preserves other session fields. Existing valid
media survives document/transcript failures. Source regressions bind this seam;
fresh packaged import/resume/transcript acceptance remains lead-owned.

Original `fc50566a` fixtures and serialized absolute paths remain byte-preserved
in `tests/fixtures/legacy/fc50566a/`. Derived relocated fixtures are separate and
record their path adaptation. The copied synthetic profile requires its separately
isolated sessionData/Local Storage files as well as appData; profile-only copying
is insufficient. Neither synthetic fixture set claims native capture or cursor
telemetry acceptance. A new stable candidate recording and `<video path>.cursor.json`
read are separately required at native Prove.

## Optional AI guide (#122)

Make guide is an optional OpenRouter pass over deterministic steps and locally extracted frames.
Recording, editing, transcripts and deterministic documents stay usable without a key. The default
model is `anthropic/claude-haiku-5.5` on OpenRouter (owner decision dated 2026-10-17); AI CONNECTIONS
can change the model slug. Credentials use upstream's encrypted `LlmConfigStore`, with no second
key store or environment-key fallback in the guide path.

`electron/showhow/aiGuide.ts` owns source preparation, the injected model seam, validation and
bundle writes. `aiGuideConsent.ts` registers the actual main-process handlers. Both the review and
send use `buildGuideRequest`; the main process retains a sender-bound token for the exact reviewed
payload. Run checks a saved OpenRouter key, provider consent, canonical recording-root containment,
source-file symlinks and a source signature before constructing the model. Changing review toggles
replaces the token. A token cannot authorize another bundle, renderer or repeated run. Preview
performs local processing only; no model is called before key and consent checks.

The payload consists of source labels and millisecond timestamps, optional timestamped transcript,
and optional JPEG frames capped at 20, spread evenly. JPEGs are downscaled locally to a maximum
1024px long edge. The review shows the exact labels/transcript and selected image bytes. Redacted
labels stay hidden unless already explicitly revealed. Narration-only sources use real transcript
segment starts and local frames at those timestamps, with `kind: "narration"` and zero coordinates;
they have no click marker. When transcript sending is off, narration source labels are generic.
The existing bundled FFmpeg resolver is used, with the existing CLI fallback for development.

On first run, `steps.deterministic.json` preserves the original `steps.json` bytes. Remake always
reads that backup, retaining the previous guide until a complete response validates. The validator
rejects unknown/repeated source IDs and empty output, sorts by earliest source timestamp, inherits
earliest-source coordinates/frame and ORs redaction/revealed-text flags. Titles are trimmed to 80
characters and instructions to 120. A successful pass stages and promotes `steps.json`, `steps.md`
and `meta.json`; file-promotion failure rolls back promoted artifacts. Provider/validation failure
restores the deterministic pair and records `guide.status: "failed"`. If the filesystem cannot
write even the fallback, IPC returns failure; source video and transcript are never written here.
These staged writes protect against ordinary I/O errors, not power loss across a multi-file commit.

`meta.json.guide` holds status (`none`, `making`, `ready`, `failed`), provider (`openrouter`), model,
optional `madeAt`/sanitized error and `editedSinceAi`. Absence means no AI guide. Existing title,
instruction and delete-step edits mark a ready guide edited; only edited Remake asks for confirmation.
Consent lives in `showhow-ai-guide-consent.json` under Showhow preferences, keyed by provider with
`reviewedAt`, `alwaysSend` and the last accepted transcript/frame options. No credential is in it.
Retry prepares a new local payload using those accepted options and does not show the review again.
Progress events report actual transcript-read, sorting/model and validated-writing phases; no
partial model output is persisted or presented as completed steps.

Offline tests cover the registered IPC callbacks and real local image processing. Native/live
provider acceptance requires the separate macOS arm64 smoke test with an owner-supplied key.

OpenRouter review is once per provider, including when the stored `alwaysSend` checkbox is false.
The checkbox is retained as the approved send-preference record, not a second consent gate.
The transcript/frame toggles determine the actual payload and their last accepted choices are
reused on later runs and Retry. “Check what gets sent” remains available to inspect/change them.

## Optional agent brief (#142)

The Agent brief tab and Copy for agent turn a recording into a brief a coding agent can act on.
`electron/showhow/agentBrief.ts` owns the brief payload, validation and files; the IPC handlers
(`showhow:agent-brief-status|preview|consent|run|cancel|copy`) sit beside the guide handlers in
`aiGuideConsent.ts` and share their recording-root containment and symlink checks.
`electron/showhow/guideModel.ts` is the shared model adapter: one OpenRouter chat loader and model
resolution for guide and brief, differing only in the structured-output schema.

The brief reads the current `steps.json` (the guide, when one exists), else the deterministic or
narration steps, plus the optional transcript and up to 20 selected frames. It reuses
`buildGuideRequest`, so redacted labels stay `[redacted]`; frames of hidden redacted steps are never
sent. The model must cite input `sourceIds` for every claim. Requested change, expected result and
actual result are optional and kept only when cited. Evidence times come from the cited source
step, never from model output. Output that fails validation is rejected, not repaired.

`agent-brief.json` is versioned (`version: 1`) and holds title, observed behaviour, the optional
claims, evidence, explicit unknowns, provider, model, `sourceRevision` (the guide source signature)
and `madeAt`. `agent-brief.md` is rendered from it. Both are staged and promoted together, Markdown
first; a promotion failure restores the previous pair. Provider errors, invalid output and cancel
write nothing, so a previous brief, the guide, transcript and media survive. A bundle without a
complete, valid pair reads as not made; the Markdown footer carries the model, `madeAt` and
`sourceRevision` stamp, so a new `agent-brief.md` left beside an older `agent-brief.json` by a crash
between the two renames is rejected. Running and failed state live in the main process only, and
every failed run outcome (including "changed") is kept there so a view remounted mid-run can show it.

Brief consent is separate from guide consent (`openrouterBrief` in
`showhow-ai-guide-consent.json`): an accepted guide review never authorises a brief payload. Unlike
the guide, the brief's "send without asking" checkbox is a gate: until it is ticked, each brief
shows the review first. Main enforces this: a payload not accepted through the consent handler
is sent only when the stored brief consent has "send without asking" and exactly the same options.
A Cancel pressed before main holds the run is kept by the renderer and either stops the run from
being sent or is resent on the run's first progress event. Copy for agent with no brief makes one first and writes the clipboard only
after the brief validates and saves. Main writes the saved Markdown plus the exact resolved bundle
path; renderer copy feedback appears only after that write succeeds. Copy path stays independent.

### #117 verification boundary

The #116 renderer-tiny statements above describe historical proof only. #117 source
tests cover native job dispatch, unchanged timestamp formatting, offline model validation,
base/small helper mode arguments and the three fail-open cases with input hashes.
Fresh native helper base/small tests, packaged offline transcripts and physical Wi-Fi-off
recording acceptance are separate gates; source checks alone do not establish them.
