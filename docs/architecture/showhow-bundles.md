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

The renderer-side implementation lives in `src/lib/showhow/`:

- `transcriptFormat.ts` formats Whisper segments into timestamped text.
- `generateTranscript.ts` exposes `generateTranscriptForBundle(bundleDir, videoFileUrl)`.

The save path persists a pending transcript job on the recording session. The editor claims it
after the recorder window closes, allowing local Whisper work to survive that transition. The job
extracts mono 16 kHz audio from the saved video, uses the existing on-device captioning pipeline,
formats the result, and writes it through the `showhow:write-transcript` IPC handler.

The main-process handler accepts a renderer-provided bundle directory only when its resolved path
is inside `SHOWHOW_RECORDINGS_ROOT`. It then writes `transcript.txt`. Extraction, transcription,
or IPC-write failure must still leave a `transcript.txt` containing a `(transcription failed)`
marker so the Phase 1 folder shape remains dependable.

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
