# Implementation Notes -- Showhow Phase 1

Deviations from `docs/superpowers/plans/2026-07-11-phase-1-fork-folder-bundle.md`,
logged as they're discovered mid-build. Nothing is deleted from this file.

## Deviations

### 2026-07-31: Issue 35 gain-only correction was disproven by orchestrator-owned runtime evidence

**What changed:** The ticket orchestrator reran the exact Electron generator at 21:14:30 after gain
normalization landed. Timestamp bounds were corrected, but near-equal words remained shuffled and
the final two step labels were still incoherent.

**What was done instead:** Retained the gain fix and added explicit integer-millisecond plus source-index
ordering in `transcribeCore`, including a RED regression proving raw fractional timestamp sorting produces
the observed reordering. A final Electron rerun against
`~/Showhow/Recordings/2026-07-25_175438-recording` produced ordered phrases, a maximum timestamp of
24,000 ms against the 26,552 ms duration, and six complete phrase-level step labels.

### 2026-07-28: Acceptance audit output retains JSON in a `.txt` artifact

**What changed:** Issue 21 writes its stable JSON audit observation to
`artifacts/21/bundle-audit.txt` instead of a `.json` file.

**Why:** Biome reformats JSON array layout differently from `JSON.stringify`; rerunning the audit
would otherwise recreate a tracked artifact that fails the repository-wide lint check.

**What was done instead (conservative option):** The CLI still emits structured JSON and the artifact
contains that exact output, but its `.txt` extension keeps the repeatable evidence outside Biome's JSON
formatter. The acceptance report records the generation command and artifact path.

### 2026-07-22: Frame extraction uses an optional system ffmpeg

**What changed:** Desktop click frames are extracted with `ffmpeg`, which is available
on the development machine but is not a declared application dependency.

**Why:** Adding and shipping a video-processing binary is outside this ticket's narrow
scope, while the existing recording must never fail because documentation artifacts
cannot be generated.

**What was done instead (conservative option):** Bundle creation attempts extraction
after the video and cursor telemetry have been moved. If ffmpeg is unavailable or a
frame command fails, the video stays intact and `meta.json` marks the bundle as a
transcript-only document with an explanation.

### 2026-07-12: Native macOS capture path bypasses bundling entirely

**What changed:** Task 3 wired `createRecordingBundle` into
`storeRecordedSessionFiles` (electron/ipc/handlers.ts), on the assumption that
every finished recording flows through it. Manual acceptance testing (a real
20s recording via the app UI) proved this wrong: on macOS, OpenScreen tries
**native ScreenCaptureKit capture first** (`startNativeMacRecordingIfAvailable`,
src/hooks/useScreenRecorder.ts:1167), and that path's completion handler is a
**separate IPC handler**, `stop-native-mac-recording`
(electron/ipc/handlers.ts:2090-2172), which writes its own session manifest
directly and never calls `storeRecordedSessionFiles`. `store-recorded-session`
(the path Task 3 modified) is only reached via the browser-MediaRecorder
fallback, used when native capture is unavailable.

Result: the manual verification recording landed as flat files in
`~/Library/Application Support/openscreen/recordings/` -- no bundle folder,
no `meta.json`, no `screenshots/` -- exactly the "silent fallback" the
try/catch was designed to produce, except triggered by the wrong root cause
(bundling code never ran at all, not that it ran and failed).

**Why:** the plan and its brief did not account for OpenScreen having two
independent save-completion code paths on macOS (native ScreenCaptureKit vs.
browser MediaRecorder). Static code reading during planning found
`storeRecordedSessionFiles` as *a* completion path; it was not cross-checked
against which path the recorder actually prefers at runtime.

**What was done instead (conservative option):** extend the same bundling
try/catch pattern -- already reviewed and approved in `storeRecordedSessionFiles`
-- to `stop-native-mac-recording` (the primary/default macOS path) and
`attach-native-mac-webcam-recording` (the native webcam-attach path, for
consistency, since OpenScreen's webcam PiP feature must keep working per the
spec's "keep all OpenScreen features" requirement). Same ordering rule applies:
bundle after `writePendingCursorTelemetry`, before the session manifest write;
same fail-open behavior: bundling failure logs and falls back to the
flat/unbundled session, never rejects the IPC call.

Native Windows capture (`stop-native-windows-recording`, handlers.ts ~2000-2070)
has the identical shape but is explicitly out of scope -- spec is macOS-only
for V1 (personal tool, "macOS 13+, unsigned" per the signed-off assumptions).
Left unbundled; noted here so it isn't mistaken for an oversight later.

**Task retroactively affected:** Task 3 (already reviewed/approved based on
code-reading verification only; the manual runtime check that would have
caught this was still pending when the review ran). Re-opened as
Task 3b/fix rather than reverting the approval, since the original diff is
correct as far as it goes -- it's incomplete, not wrong.

### 2026-07-12: Task 4 transcript hook-in follows the same three-path discovery

**What changed:** Task 4's brief (written before the deviation above was
discovered and fixed) assumed `storeRecordedSessionFiles` /
`store-recorded-session` was the only save-completion path and told the
implementer to hook `generateTranscriptForBundle` into `useScreenRecorder.ts`
at its two `storeRecordedSession` call sites only. Per the corrected task
instructions (informed by the deviation above, and by the same-commit fix
that added `bundleDir`/`videoFileUrl` to all three IPC results), the
fire-and-forget transcript call was wired into all three places a macOS
recording save can succeed:

1. The primary `storeRecordedSession` call site (browser-MediaRecorder path,
   `useScreenRecorder.ts` ~line 391), guarded on `result.bundleDir &&
   result.videoFileUrl`.
2. The nested `storeRecordedSession` call inside `finalizeNativeWindowsRecording`
   (used only when a webcam was recorded alongside native Windows capture),
   guarded on `stored.bundleDir && stored.videoFileUrl`. The Windows-native
   `stopNativeWindowsRecording` result itself is untouched and unhooked --
   that result type has no `bundleDir`/`videoFileUrl` fields since native
   Windows bundling is explicitly out of scope for V1 (macOS-only spec).
3. `finalizeNativeMacRecording`'s final save state: tracked
   `finalBundleDir`/`finalVideoFileUrl` starting from `stopNativeMacRecording`'s
   result, overwritten by `attachNativeMacWebcamRecording`'s result when a
   webcam was attached (since that call's result reflects the final bundle,
   not the screen-only one), then fired once right before
   `clearNativeRecordingState()`.

**Why:** the native macOS path (default on macOS) never goes through
`storeRecordedSession`, so hooking only those two call sites would mean the
primary recording path -- and thus the vast majority of real usage -- never
gets a transcript.

**Task retroactively affected:** none -- Task 4 was corrected before
implementation started, so no rework needed.

### 2026-07-15: Live acceptance exposed renderer-lifetime and container mismatches

**What changed:** A real native macOS recording showed that ScreenCaptureKit writes MP4,
while the bundle module renamed every video to `video.webm`. It also showed that starting
Whisper fire-and-forget in the recorder renderer does not survive `switchToEditor()`, which
destroys that renderer before transcription completes.

**What was done instead:** Preserve the source container as `video.mp4` or `video.webm`,
including the matching cursor telemetry name. Persist the pending Showhow transcript job on
`RecordingSession`; the editor renderer claims it after the window transition and clears the
pending fields only after the transcript write completes.

### 2026-07-15: Startup activation raced IPC registration

**What changed:** Live automation reproduced a HUD window whose renderer called IPC before
the handlers existed. Startup awaited proactive microphone permission, while a second-instance
activation could create the HUD during that wait.

**What was done instead:** Gate window activation until startup registration is complete and
request microphone access only when the user enables microphone capture. Regression coverage
verifies that an early activation is deferred until readiness.

## Phase 1 acceptance -- 2026-07-15

- Recorded 45 seconds of the full display through native ScreenCaptureKit with system audio.
- Played a deterministic macOS text-to-speech phrase containing "green lighthouse",
  "seven forty two", "local speech transcription", and "agent ready folder".
- Verified the recording opened in the editor with a 45-second duration.
- Verified `~/Showhow/Recordings/2026-07-15_100533-recording/` contains `video.mp4`,
  `video.mp4.cursor.json`, `transcript.txt`, `meta.json`, and `screenshots/`.
- Verified `transcript.txt` contains timestamped recognition of the deterministic phrase.
- Verified `meta.json` identifies `video.mp4` and `video.mp4.cursor.json` accurately.
- Verification: 45 test files / 328 tests passed; `tsc --noEmit` passed; Biome checked
  346 files with no errors.

## Workspace retirement -- 2026-07-16

### Generated design exports are documentation, not application source

**What changed:** Moving the approved mock and design-system exports into `docs/design/`
caused the pre-commit hook to lint their generated JavaScript and JSON. The exports contain
bundled runtime patterns that intentionally violate the application Biome rules.

**What was done instead:** Added the narrow `!docs/design/**` exclusion to
`biome.json`'s file set. The exact failing `lint-staged` path then passed, and the full test
suite remained green. The generated exports were preserved byte-for-byte rather than rewritten.

### The parent feature backlog was OS-tracked

**What changed:** The plan treated `Projects/web/showhow/feature-backlog.md` as parent-owned
material but did not initially list its tracked deletion in the OS commit.

**What was done instead:** Staged the deletion explicitly alongside the nine planned OS
alignment files. Unrelated pre-existing OS changes remained unstaged.

## Issue 32 loop deviations

- Phase 0: Herdr 0.7.3 rejected the documented `pane move --json` option.
  Retrying without `--json` succeeded and still returned the new pane ID as JSON.
  Logged as BL-013 in the OS loop-issues reference.
- Attempt 1 executor: OpenCode remained on `Delegating` for more than six minutes
  without a source or test delta. The resumable session was interrupted and reopened
  without incrementing the product-fix attempt. Logged as BL-014.
- Attempt 1 executor recovery: fresh/resumed TUI sessions kept reporting a phantom
  active fixer without a completion channel or file delta. The same brief was sent
  directly to OpenCode's configured `fixer` agent in the executor pane.
- OpenCode rejected `--agent fixer` because it is subagent-only and fell back to the
  broken orchestrator. Recovery continued with OpenCode's primary `build` agent,
  explicitly instructed to implement directly under the same TDD guardrails.
- Issue 32 GREEN (review correction 2026-07-26): `normalizeTelemetrySample`
  clamps `timeMs` to `Math.max(0, Math.min(sample.timeMs, totalMs))` -- the
  baseline contract that no sample escapes the recording's span. The sample is
  spread (`...sample`) before clamping, so `interactionType` survives into the
  normalized output and downstream click detection keeps its original anchors;
  `cx`/`cy` remain clamped to [0, 1]. The earlier note (claiming `timeMs` was
  intentionally NOT clamped to preserve a trailing sample's identity) is
  retracted: that broke the baseline normalization invariant. The normalization
  test is narrowed to prove all six in-range click samples preserve
  `interactionType` and coordinates, plus an assertion that the fixture's
  trailing `mouseup` at t=26571 (16ms past `durationMs`=26552) is clamped to
  t=26552. It no longer requires the out-of-range mouseup timestamp to remain
  unchanged. Click-candidate behavior artifacts (`artifacts/32/after.txt`) are
  unaffected: every click anchor is within `[0, durationMs]`, so clamping does
  not move any click center, and click selection remains the sole candidate
  source whenever any click exists; dwell ranking/centering is fallback-only for
  zero-click telemetry.
- Functional app verification was blocked by a pre-existing main-checkout
  Showhow editor session containing unsaved changes. The open 26-second project
  visibly retained 10 baseline dwell spans. Loading the ticket build required
  closing that session via Save or Discard, so the orchestrator preserved the
  unrelated project and recorded app verification as untested.

### 2026-07-26: IPC boundary stripped interactionType, defeating click-mode auto-zoom

**Root cause (functional discovery):** The ticket app loaded
`~/Showhow/Recordings/2026-07-25_175438-recording/video.mp4`. The raw adjacent
`video.mp4.cursor.json` carries 650 samples with 6 `interactionType=click`.
Vite serves the new click-mode `zoomSuggestionUtils`, and toggling auto-zoom
OFF then ON still produced the same 10 dwell spans. Tracing the telemetry
flow proved the renderer never received click metadata:

- `electron/ipc/handlers.ts` `readCursorTelemetryFile` mapped
  `recordingData.samples` to only `{ timeMs, cx, cy }`, stripping
  `interactionType` before it crossed the IPC channel.
- `src/native/contracts.ts` `CursorTelemetryPoint` lacked `interactionType`,
  so even if a hand-rolled mapper tried to forward it, the contract type
  erased it.
- The renderer's click detection (`zoomSuggestionUtils.buildAutoZoomSuggestions`)
  filters on `sample.interactionType === "click"`. With the field absent the
  click branch never engaged and `detectZoomDwellCandidates` (dwell fallback)
  ran unconditionally, producing the 10 dwell spans observed in the live app.
- The fixture test bypassed the IPC boundary by loading
  `__fixtures__/issue32-cursor.json` directly into the renderer's
  `CursorTelemetryPoint[]` (which already declared the broader
  `interactionType` union in `src/components/video-editor/types.ts`). It
  proved the algorithm but not the data path that feeds it.

**What was done instead (TDD, IPC-boundary fix only):**

1. Added a same-package failing test `electron/ipc/cursorTelemetry.test.ts`
   for a pure mapper `mapCursorSampleToTelemetryPoint` projecting
   `CursorRecordingSample` -> `CursorTelemetryPoint`. Verified RED: the test
   failed because `./cursorTelemetry` did not exist.
2. Created `electron/ipc/cursorTelemetry.ts` exporting the tested mapper.
   It preserves `interactionType` for `move | click | mouseup` (the active
   recording contract) and falls back to `"move"` when the sample omits or
   carries an unrecognized value. Verified GREEN: 6/6 tests pass.
3. Extended `src/native/contracts.ts` `CursorTelemetryPoint` with optional
   `interactionType?: "move" | "click" | "mouseup"` so the IPC contract
   can carry the field. Mirrored the same field on the ambient
   `CursorTelemetryPoint` interface in `electron/electron-env.d.ts` (the
   legacy `get-cursor-telemetry` IPC channel's declared return shape).
4. Replaced the stripping inline object in `readCursorTelemetryFile` with
   `samples.map(mapCursorSampleToTelemetryPoint)`. No other call site
   changed; `loadCursorRecordingData` still returns the full
   `CursorRecordingData` (with `assetId`, `cursorType`, `visible`, etc.) for
   the editor cursor renderer.

**Scope guardrails:** No refactor of the already-green click suggestion
algorithm or fixture. The renderer-side `CursorTelemetryPoint` in
`src/components/video-editor/types.ts` keeps its broader union
(`move | click | double-click | right-click | middle-click | mouseup`) --
that type describes what the renderer tolerates, while the IPC contract
in `src/native/contracts.ts` describes what the main process emits. The
mapper's fallback to `"move"` means a future recording that emits a
broader value (e.g. `double-click`) is normalized at the boundary rather
than silently dropped, and the renderer's downstream click filter
continues to treat only `interactionType === "click"` as a click anchor.

**Verification:** new test 6/6 pass; `zoomSuggestionUtils.test.ts` 6/6
pass; `npm run test` 511/511 across 65 files; `npx tsc --noEmit` clean;
`npm run lint` clean. Not committed, pushed, or PR'd.
## Label-driven pull loop -- 2026-07-28

### Deviations

**Test runner and file extensions.** The plan specified
`.github/scripts/derive-status.js` verified with `node --test .github/scripts/`.
The repo is `"type": "module"`, runs vitest, and already carries four
`.github/scripts/*.test.mjs` files that `vitest.config.ts` picks up via its
`{src,electron,.github}/**` include. Used `.mjs` and vitest instead so the new
test runs under `npm test` with everything else. `node --test` would have left
it orphaned from CI.

**Formatting.** Biome reformatted the test file's long `expect(...)` lines onto
multiple lines. Accepted its output rather than fighting the shared config.

### Not a deviation, worth recording

`deriveStatus` accepts both bare label strings and the `{name}` objects the REST
API returns. The workflow in Task 3 passes API objects straight through; tests
use strings. One coercion in the function beats remembering which shape a caller
holds.

### 2026-07-28: Issue 23 stalled delegated lanes were replaced with synchronous implementation

**What changed:** The bounded data/API and UI implementation lanes produced no shared-tree
implementation delta and were cancelled at the user's direction. The parent executor completed
the approved red-to-green implementation directly.

**Why:** Waiting further would have delayed the scoped issue without producing reviewable code.

**What was done instead (conservative option):** Preserved the existing 138-line renderer red-test
delta unchanged, used it to drive the minimal scanner and document-view additions, and ran the
affected tests, TypeScript, Biome, i18n, and branding checks before reporting.

### 2026-07-28: Issue 23 live Electron media and clipboard boundary correction

**What changed:** The initial document view used the renderer's `navigator.clipboard` and direct
`file://` artifact URLs. Live Electron verification proved neither integration worked: the system
clipboard stayed unchanged and the player remained at 0:00 because the library renderer could not
load the local file URLs.

**What was done instead:** Added a typed `showhow:copy-path` IPC boundary backed by Electron's
clipboard service. Local recording artifacts now use the privileged, root-scoped
`showhow-media://recordings/<bundle>/<artifact>` protocol rather than raw filesystem URLs. The
protocol rejects traversal outside `~/Showhow/Recordings`; step seeking records a pending seek and
reapplies it when media metadata becomes available.

**TDD evidence:** New tests failed first because the clipboard helper and media protocol modules
did not exist, while the renderer test failed because Copy path still used `navigator.clipboard`.
After implementation the focused suite passed.

### 2026-07-28: Issue 23 media protocol preserves Chromium Range requests

**Root cause:** The first `showhow-media` handler converted the approved artifact path to a local
file URL, but invoked `net.fetch()` without forwarding the renderer request headers. Chromium's
initial media load could expose a frame and duration, while native play/seek requests requiring a
`Range` response were served as unrelated full-file fetches and left the player at 0:00.

**What changed:** `fetchShowhowMedia` now forwards all inbound protocol request headers, including
`Range`, to Electron's `net.fetch(fileUrl, { headers })`. The resulting response retains the native
media status and range headers (`206`, `Content-Range`, `Accept-Ranges`) from Electron's file
fetch rather than synthesizing a cosmetic renderer seek state.

**TDD evidence:** The new same-package protocol test failed RED with
`TypeError: fetchShowhowMedia is not a function`; after the narrow forwarding helper and handler
wiring, it passed GREEN and asserts that `range: bytes=1024-` reaches the local fetch.

## Issue 24 deviations

- The first Electron dev launch exposed Vite bundling `ws` optional dependency
  stubs as a runtime throw. The narrow fix externalizes `ws` from the Electron
  main bundle in `vite.config.ts`; `scripts/check-bridge-bundle.mjs` guards the
  generated bundle against the original throw.
- The real recorder UI reached the existing native-helper/accessibility alert
  before a recording-start epoch could be exercised manually. The bridge pair,
  disconnect, and Electron startup paths were driven; epoch conversion is
  covered by the focused integration tests and is marked untested in the
  verification record for the physical recording path.
- The installed Herdr CLI lacks the documented `herdr wait` command. The
  supplied executor pane was preserved and monitored via `herdr pane get`.

### 2026-08-01: Issue 25 companion source required a focused local build target

**What changed:** The desktop repository retained the localhost bridge from Issue 24 but contained no
browser-extension source or build entry point. The browser companion is added as a Manifest V3 source
folder and bundled with the repository's existing esbuild dependency via `npm run build:browser-companion`.

**Why:** Shipping unbundled TypeScript or recreating accessibility-name logic in plain JavaScript would
either be unusable by Chromium or bypass the approved `dom-accessibility-api` labeling path.

**What was done instead (conservative option):** The generated `browser-companion/dist/` stays ignored;
only the small extension source, its manifest/popup, and the build script are versioned. The popup exposes
pairing status/configuration only and contains no recording controls. A narrow local declaration resolves
the installed package's broken TypeScript export typing without adding a dependency.

### 2026-08-01: Issue 25 bridge restart required persistent companion reconnect policy

**What changed:** A real desktop restart left Chrome storage at `paired: true` after its service-worker
socket failed before opening. The original worker only attempted one connection; its close handler cleared
storage but never retried, and an error-before-close had no cleanup path.

**What was done instead:** Extracted the socket lifecycle into a tested policy that clears paired state on
every attempted/rejected connection, treats `error` and `close` as one disconnect, and retries with a
bounded 500ms-to-10s exponential backoff. A manual pairing-token update cancels any pending retry and
starts a fresh connection. The policy owns no recording controls.

### 2026-08-01: Issue 25 MV3 wake-up required a connection-ready step queue

**What changed:** A real paired recording produced only the desktop tier because the MV3 worker woke on
the first content message, created a `CONNECTING` socket, and immediately discarded that step when its
ready state was not OPEN.

**What was done instead:** Pending browser steps now wait in the connection policy until the same socket's
open event sends the hello handshake, then flush in order. The queue survives the existing reconnect path;
there are still no extension recording controls.

### 2026-08-01: Issue 25 MV3 startup and first-step connection race

**What changed:** A second paired recording still omitted browser steps. The worker's startup
`connection.connect()` and the first content-message `send()` both crossed the empty-socket check while
their shared storage read was pending, creating two sockets. The queued step could attach to the stale one.

**What was done instead:** `connect()` is now single-flight while configuration is loading. Concurrent
startup and first-step callers share one socket, and the existing open-event queue flushes the step through
that socket.

### 2026-08-01: Issue 25 MV3 message-response channel closure

**What changed:** Chrome DevTools proved the content script was injected but reported closed message ports
and back/forward-cache channel closure. The worker's `async` runtime listener awaited capture/step work
without synchronously returning `true`, so Chrome could close the response channel first.

**What was done instead:** The listener is now synchronous and delegates to a tested message handler. Each
asynchronous capture, queued step, and reconnect response calls `sendResponse`; the handler returns `true`
before work begins. Capture failures return a null screenshot and step/reconnect failures return `{ ok: false }`.

### 2026-08-01: Issue 25 Chrome screenshot data URLs require payload decoding

**What changed:** A genuine paired recording still wrote no usable browser artifacts, and the acceptance
bundle exposed that `captureVisibleTab` returns `data:image/png;base64,...`, not raw base64. Persisting the
whole URL decoded its text prefix into non-PNG screenshot bytes.

**What was done instead:** Browser screenshot persistence accepts the existing raw-base64 bridge contract
and strips Chrome's PNG data-URL prefix when present. A RED bundle integration test proves the written file
starts with PNG magic bytes for the real Chrome form.

### 2026-08-01: Issue 25 late transcript regeneration must retain browser source steps

**What changed:** A genuine paired recording delivered semantic browser steps, but the later transcript
write reran the desktop telemetry doc generator and replaced `steps.json` with desktop-derived output.

**What was done instead:** Regeneration detects existing browser-tier source steps and leaves that artifact
pair intact. A RED bundle seam proves the late transcript write preserves the semantic label, redaction flag,
and screenshot reference.

### 2026-08-01: Issue 26 reveal state cannot recover capture-time typed values

**What changed:** The workflow-document view provides per-step reveal state for redacted steps, but it does
not expose an original typed value.

**Why:** The companion contract deliberately never reads or persists typed values; a redacted step retains
only its safe instruction label and `redaction` flag. Recovering a value at edit time would violate the
privacy contract.

**What was done instead:** Reveal displays the stored instruction label only in the local UI. An explicit,
persisted `includeRevealedText` opt-in is still required before that label is rendered into `steps.md`; without
it Markdown uses `[redacted]`. Users may edit the instruction themselves before opting in.

### 2026-08-01: Issue 27 — missing focused IPC test for `showhow:regenerate-doc`

**Root cause:** `electron/showhow/bundle.ts#regenerateDocArtifacts` is fail-open (never throws, never removes
source video/meta/transcript), but no IPC/preload route exposed it to the renderer. The scanner mapped an absent
`steps.json` to no steps, and `src/components/library/RecordingLibrary.tsx` gated the entire workflow area on
`entry.steps && entry.steps.length > 0`, hiding any doc status, Create action, generating/retry state, or
fallback explanation. The initial implementation pass added the IPC handler, preload bridge, scanner
orchestration (`regenerateRecordingDoc`), and renderer resilience states, but missed the explicitly required
focused main-process/IPC test that *invokes* the registered `showhow:regenerate-doc` handler and proves a
derivation failure returns a typed safe result while source video/meta/transcript remain intact.

**Initial missed IPC-test requirement:** The first pass added main-level tests for `regenerateRecordingDoc`
(in `electron/showhow/recordingLibrary.test.ts`) and renderer tests (in
`src/components/library/RecordingLibrary.test.tsx`), but no test exercised the actual `ipcMain.handle`
registration. The repository's existing handler-test pattern (`electron/ipc/handlers.test.ts`) mocks
`ipcMain.handle` as a no-op, so the handler was never invoked through the IPC boundary.

**Correction:** Added `electron/ipc/showhowRegenerateDoc.test.ts` following the existing handler-test patterns
(hoisted temp roots, `vi.mock("electron", ...)`, `vi.mock("../main", ...)`), extended so `ipcMain.handle`
captures each registration into a `Map` keyed by channel. The real `regenerateDocArtifacts` and
`createRecordingBundle` run end-to-end against a real bundle on disk (the `../showhow/bundle` mock uses
`importOriginal` to preserve all exports and only override `SHOWHOW_RECORDINGS_ROOT` to a temp dir). The bridge
server is stubbed so registration never binds a real WebSocket. The test builds a real bundle, corrupts the
cursor telemetry to force a derivation failure, invokes the captured handler as the renderer would, and asserts
the typed safe failure result (`{ success: false, stepsWritten: 0, transcriptAvailable: false, ... }`) plus
intact source video/meta/transcript and preserved prior `steps.json`/`steps.md`. Path validation (outside-root
and non-string bundle paths) is also asserted. No test-only production APIs were added and path validation was
not weakened.

### 2026-08-01: Issue 27 — live native macOS accessibility-denied reason lost across stop→bundle

**Root cause:** The recorder-first fail-open policy degrades editable-overlay to system-cursor mode when macOS
accessibility is denied, and the renderer tracks the structured `accessibility-denied` step-capture reason in
`pendingStepCaptureReasonRef`. However, the native macOS stop path (`finalizeNativeMacRecording` →
`stopNativeMacRecording(discard, duration)`) never passed that reason to the main process, and the
`stop-native-mac-recording` IPC handler called `createRecordingBundle` without `stepCaptureReason`. The result:
a system-mode recording with no cursor JSON was classified as generic `no-clicks` in `meta.stepCapture.reason`
instead of the root-cause `accessibility-denied`, making the degradation indistinguishable from a genuine
zero-click recording. The same gap existed in the `attach-native-mac-webcam-recording` re-bundle path.

**Live failure:** A real macOS recording made with accessibility denied produced a bundle whose
`meta.stepCapture.reason` was `no-clicks`, not `accessibility-denied`. The renderer's `getEffectiveCursorCaptureMode`
ref-based approach already correctly produced `cursor.mode: system` and `hideSystemCursor: false` in the
`startNativeMacRecording` request (no stale closure), so the start path was not the defect; the defect was
solely the lost reason across the stop→bundle boundary.

**Correction:** The renderer now passes `pendingStepCaptureReasonRef.current` as the third argument to
`stopNativeMacRecording` and includes it in the `attachNativeMacWebcamRecording` payload. The preload bridge
and `Window.electronAPI` type declaration forward the optional `stepCaptureReason` parameter. The
`stop-native-mac-recording` and `attach-native-mac-webcam-recording` IPC handlers accept the typed
`StepCaptureReason` and forward it to `createRecordingBundle` only when present, so normal
editable-overlay/no-click recordings are unaffected. The fail-open contract (video/transcript preserved on any
derivation failure) is unchanged. No test-only production APIs were added; path validation was not weakened.

**Tests added:** `src/hooks/useScreenRecorder.test.ts` gained a block proving the actual
`startNativeMacRecording` request uses `cursor.mode: system` + `hideSystemCursor: false` on accessibility denial
(and `editable-overlay` + `true` on grant), plus a block proving `stopNativeMacRecording` receives
`stepCaptureReason: accessibility-denied` on denial and `undefined` on grant.
`electron/ipc/showhowMacStepCaptureReason.test.ts` proves `createRecordingBundle` with
`stepCaptureReason: accessibility-denied` persists `meta.stepCapture.reason = accessibility-denied` (not
`no-clicks`) while preserving the video, and that a normal system-mode recording without the reason still
classifies as `no-clicks`. The start-request test was initially expected to be RED but passed immediately
because `getEffectiveCursorCaptureMode` already reads the ref at call time; the stop-reason test was the
genuine RED (3rd arg `undefined`) before the fix.

## Issue 66 — 2026-09-07
- Filter only click samples with an explicit `visible: false`; retain visible and legacy samples that omit visibility.
- Apply the rule in both initial bundle generation and deterministic regeneration.
- During regeneration, associate retained clicks with their prior screenshot by timestamp and coordinates so filtering an earlier hidden click cannot point a later step at the wrong image.
- Preserve source video and cursor telemetry byte-for-byte.
- Unit coverage includes mixed visibility, hidden-only captures, legacy samples, screenshot association, and repeat regeneration stability.
- Earlier native automation proved outside-click filtering but could not produce trustworthy inside-click telemetry because the system pointer did not move with the accessibility action. Native inside-click retention remains the final acceptance gate.

# Issue 67 implementation notes

Attempt 1. Supplied topology honored: w1P:p1 executor, w1P:p2 orchestrator,
w1C:p7 coordinator callback. No additional worktree or orchestrator.

Coordinator owns installed-app GUI. Baseline evidence supplied by coordinator
is preserved before any production edit; local GUI reproduction waits for a
granted slot. Headless CLI inspection only so far.

Dependency deviation: npm ci failed with ENOSPC before tests. Installer exited;
removed only this lane's 43 MB partial node_modules with coordinator approval.
Coordinator approved symlink to /Users/mohamedb/dev/projects/showhow/node_modules
because manifests match. Never install into or mutate shared dependencies.
Tests, builds and GUI wait for a coordinator slot while issue 66 verifies.

Baseline GUI slot granted and released after Load Project ->1080p export.
New export matches original byte count but differs in SHA-256; no byte-identical
claim. Original file hashes still match. Editor timer advances while preview
appears stuck, consistent with coordinator-owned mediaProtocol issue; excluded
from MP4 changes and not represented as a passing playback check.

Shared ENOSPC loop snare logged centrally by issue66 as BL-042 in
/Users/mohamedb/dev/OS/references/bedar-loop-issues.md; coordinator confirmed
no duplicate entry needed. First test slot released after actual encoder
capability preflight while executor authors bounded benchmark.

Verifier authored mp4BitrateScaling.test.ts after executor evidence authoring
stalled. Five genuine assertion failures observed before any production edit.
System FFmpeg lacks drawtext; fixture generator uses existing sharp-rendered SVG
text. Generated three complete 3-second fixtures total15MB; conservative10MB
generator guard fired after final write. Benchmark blobs stay in memory; no
frame dumps or browser downloads. Investigative generator guard to be tightened.

First browser benchmark stopped after about3min with no export logs and high
SwiftShader CPU. No benchmark result or bitrate selection inferred. Retry config
uses macOS Metal and lane-local cache instead of shared-node_modules Vite cache.
Browser config only; production rendering unchanged. All owned processes exited.

Browser setup root cause: installed @vitest/browser-playwright4.1.5 expects
launchOptions; inherited launch key was ignored. Isolated benchmark config
corrected; one real export passed in8.08s (10.05s full run). No production change.

Production bitrate change applied after genuine RED evidence (browser
regression artifacts/67/red-browser.log: 1,414,031.25 B/s exceeds the
779,446 B/s measured ceiling; five unit failures committed in 7b88854).
calculateBitrate in src/lib/exporter/mp4ExportSettings.ts now returns the
100 kbps-rounded, 1_000_000-24_000_000-clamped pixel-proportional budget
(width * height * 4_000_000 / 2_073_600, times 1.5 for source quality),
anchored on the benchmark-selected 4 Mbps at 1920x1080/60. Dimension,
upscale, crop, encoder VBR quality/fallback, capture, and persistence
behavior are untouched. Nine stale bitrate expectations in
mp4ExportSettings.test.ts updated to the computed values (4.2M, 5.7M,
1.9M, 4M, 6M, 24M, 4M, 1.2M, 4M in existing case order); every dimension
assertion preserved. Tests, builds, and GUI not run per coordinator
instruction; verification pending the granted re-run of the RED suites.

Trial adjustment: actual app audit export at the 4 Mbps anchor produced
4,387,478 bytes, exceeding the 3,771,472-byte acceptance ceiling. Only
BITRATE_REFERENCE_BPS changed, 4_000_000 to 3_000_000, as a trial pending
actual app output/readability; formula, source 1.5 multiplier, 1-24 Mbps
clamp, and 100 kbps rounding are unchanged. The nine expectations were
recomputed independently from the formula: 3.1M, 4.3M, 1.4M, 3M, 4.5M,
18M, 3M, 1M (floor-clamped from 900k), 3M. The 854x480 source case now
sits on the 1 Mbps floor and remains under half of the 4.5 Mbps
full-frame source budget, so the committed crop regression still passes
by construction. No tests, builds, GUI, commits, or package commands run.

Second trial adjustment: the real app 3 Mbps trial export produced
3,941,008 bytes, still above the 3,771,472-byte acceptance ceiling, though
frames remained readable. Only BITRATE_REFERENCE_BPS changed, 3_000_000 to
2_400_000; formula, source 1.5 multiplier, 1-24 Mbps clamp, and 100 kbps
rounding unchanged. The nine expectations were recomputed independently
from the formula: 2.5M, 3.4M, 1.1M, 2.4M, 3.6M, 14.4M, 2.4M, 1M (floor
clamped, value unchanged from prior trial), 2.4M. All four cliff cases
round to identical values on both sides (1.1M, 2.4M, 3.6M, 6.4M) and the
854x480 crop stays below half of the 3.6 Mbps full-frame source budget.
Trial awaits actual app acceptance; no tests, builds, GUI, commits, or
package commands run.

Final 2.4Mbps audit acceptance produced3,594,630bytes (52.344% reduction),
readable exact1s/13s frames and native QuickTime play/seek. Copied project
padding49 persisted after save/reopen; original hashes still match. Final
headless static/scroll/motion/sync exports each under1MB. The generated
flash/beep input offset is0ms; output audio lags65ms, within the predeclared
100ms tolerance. This is a timing measurement, not a listening claim.
Affected browser run encountered Vite optimizing gif.js midrun, reloading
and invalidating dynamic WebGLRenderer URL:3GIF failures,4pass,1optin skip.
Lane-only benchmark config now prebundles gif.js; no production GIF changes.
All processes exited; rerun awaits coordinator slot. Shared cache untouched.

The short browser rerun progressed past initial dependency discovery but
GIF worker resolution hit Vite fs.allow because node_modules is an approved
shared symlink. Intentionally stopped Vitest with SIGTERM (exit143), preserved
logs; lane-only config permits resolved gif.js/dist and scans only exporter
test entries. No product GIF or shared dependency change. Rerun pending.

### 2026-09-07: Issue 68 — serialized verification and nested writer recovery

The coordinator supplied installed-app BEFORE evidence and required preserving the
source Calculator recording. This lane copied all nine source files and verified
SHA-256 hashes before changes. Real Electron acceptance will read the original
bundle without edits, after cleanly quitting the installed app; CLI tests use
isolated temporary fixtures. No simultaneous installed/dev instances are allowed.

After ENOSPC in another lane, dependency installation is prohibited. This lane
uses the matching main checkout node_modules symlink read-only, disables Vitest
caching, and uses local Vite/Vitest config wrappers with local cache directories
and the runner config loader. TypeScript uses a local config extending this lane
and the coordinator-supplied read-only `/tmp/showhow-ticket66-types/ws` mapping;
`artifacts/68/typecheck-config.json` records it. No dependency manifests change.

The nested RED writer reported activity without delivering a file, so the lane
released its unused test slot. A replacement wrote two tests just before its
cancellation; the verifier retained that diff, added missing full-response header
assertions and took ownership of test execution, as the coordinator authorized.
The executor retains ownership of the subsequent production fix. The delivery
snare is logged once as BL-044 in the canonical OS loop-issues log.

The Vite runner config loader does not inject `__dirname`, so the first RED
attempt failed before tests. The ignored local configs now copy the repository
configs with an explicit lane directory and local cache; no production config
changed. The retry reached real assertions: full Content-Length was null and
range status was 200 instead of 206 (2 failed, 3 passed), before production edits.


Issue 68 acceptance passed on real Electron dev code `e62d394` after 33 protocol
and 202 affected tests, TypeScript with the isolated ws mapping, and Biome.
The first production pass exposed arbitrary MP4 paths; two real regressions
caught this, and the executor restricted the whitelist to the bundle video and
direct raster screenshots. Both failed and corrected results remain in evidence.

The native GUI audit temporarily unloaded/restored only the page's video URL to
exercise a timestamp clicked before metadata. It did not change any source file
or project. Actual timestamp/scrubber positions, full playback, range headers,
screenshot decoding, runtime PID/cwd, hashes and clean shutdown are recorded in
`artifacts/68`. User-required inline uploads accompany the committed evidence.

### 2026-09-08: Issue 68 — Greptile cancellation and evidence review

Read both unresolved review threads with pagination and `isResolved`, and the
latest 4/5 summary. The early-cancellation finding was independently reproduced:
three deterministic tests for pre-abort, abort during realpath, and abort while
opening a real file all returned 200 instead of AbortError before the correction.
The executor owns the production lifetime fix; verifier owns tests and evidence.

The original absolute typecheck artifact was not reproducible elsewhere. Its
contents are retained as historical text, while the actual config now extends
the repository relatively and prefers its declared @types/ws dependency. An
optional ignored local fallback links only the coordinator-supplied real types
read-only; no stubs or weaker compiler options were introduced. A committed
portable Vitest config preserves the repository test contract and avoids writes
to shared node_modules. Review logs name these committed configs directly.

The issue uses in-progress plus needs-fixes while fixing; the PR card remains
Reviewing. The semantic PR title was corrected as metadata, not a product fix.

PR72 follow-up: Greptile latest summary moved to5/5 on unchanged32ef356
(updated2026-09-07T23:00:50Z) while explicitly retaining2unresolved validation
threads. Not accepted as completion. Existing Ubuntu CI has704unit pass/1skip,
2browser timeouts amid dependency reload,14JSON evidence formatting errors,
and a nonsemantic title. Title metadata corrected; checks remain historical red.
Executor fix-1 delivered no test diff, was cancelled to terminal/error and
reconciled; user authorized verifier test-only takeover (existingBL-044 pattern,
no duplicate central entry). Production remains unchanged and executor-owned.
Verifier authored paired encoder comparison, native4K glyph/motion fixture,
blurred negative control and six bounded crop sink images. RED uses an isolated
Vite load plugin with the genuine7b88854 source, never mutating production.
First granted batch stopped at preflight:132440KiB free (~129MiB) versus100MiB
floor and<=35MB estimated growth. No test/fixture run or cleanup performed;
slot released. Await coordinated headroom, preserving original acceptance.

### Same-encoder control diagnostic: incomplete at resource cap

- [passed] Targeted Biome and isolated tsc exited 0 (suffixed logs).
- [passed] Unencoded reference: 42/42, contrast ratio 1 at frames 15 and 45.
- [failed] 80 Mbps control exceeded 5 MB cap: 5,238,219 bytes.
- [untested] Control decoded scores/config identity: cap stopped before checks.
- Candidate 14.4 Mbps output: 1,954,941 bytes; frame 15 (0.25 s) and
  frame 45 (0.75 s) each scored 40/42 with unchanged first-row templates.
  Frame 15 row 30 mismatches: B→8 at (443,1263), E→8 at (538,1263).
  Frame 45 row 30 mismatches: D→0 at (536,1263), E→8 at (568,1263).
  All rectangles are 24×30. Contrast ratios: 0.752525 and 0.839024.
  Diagnostic matched-row templates scored 42/42 at both times; this alone
  does not distinguish bitrate loss from classifier sensitivity.
- Fixture SHA256: 1c254d14ac3faa813829e2544309d110d980c0be823ec8d7250bd8a62d92b135.
- Vitest PID 84190 exited 1 in 14.1 s. Runner accepted expected exit 1, but
  manual classification is incomplete diagnostic/resource-cap failure, NOT
  expected quality RED. Only two of four decoded measurements exist.
- Six small crops and explicit JSON preserved, including earlier failures.
  No output MP4 was persisted. Production SHA256 remains
  669c2c342a54d5a9c389ab2b2daf7c97608a922f4733e131b484c1c8eeb80c4c.
  Process inspection found no remaining Vitest/Vite/runner; slot released.
- Next diagnostic needs a separately approved resource-bound adjustment;
  no scorer, threshold, production budget, or branch update is justified yet.

### Complete 64 Mbps diagnostic (review-control-1)

- [passed] Targeted format and isolated tsc exited 0.
- [passed] Four NEW scores: identical source SHA/config except bitrate/times.
- [passed] Candidate 1,954,941 bytes; control 4,980,880 bytes, both below 5 MB.
- [failed] Unchanged first-row scorer: 40/42 in all four decoded samples.
- [passed] Blurred negative: 2/42 in all four samples.
- [passed] Diagnostic matched-row scorer: 42/42 in all four samples.

Both budgets produce exactly the same mismatches at the same coordinates:
frame15 B→8 / E→8; frame45 D→0 / E→8, all on row30 (coordinates in JSON).
Candidate contrast ratios .752525/.839024; control .747475/.829268.
Shared source SHA256 within this batch:
9aacc7a6a1a27e41164779889eec27df6aee69f6a69a5b2e0b52cf904afae7be.
The fixture was generated once for this batch; its container hash differs from
prior batch, so only within-batch SHA identity is claimed. Both comparisons
used sample timestamps .25/.75 and identical final hardware-preferred H264
encoder config except bitrate. These results support row-phase classifier
sensitivity, not an inference that the 14.4 Mbps budget caused these errors.
They are not a general lossless-quality claim. The 64 Mbps control was only
19,120 bytes below the cap; no future cap-compliance guarantee is inferred.

Vitest PID87167 exited1 after14.1s at the actual40-vs42 assertion; the runner
verified all4 new measurements and exited0. This is a completed diagnostic
with an unchanged failing quality scorer, distinct from the prior incomplete
80 Mbps cap failure. No production/scorer/threshold changes. No test/Vite
processes remained; slot released to coordinator for73. Suffixed logs, JSON
and eight bounded crops preserve history.

### Authorized row-reference correction authored (not run)

Default templates now come from the corresponding reference row. All42 glyphs
and the .5 minimum contrast criterion are unchanged. Historical first-row mode
remains explicit and is recorded alongside corrected scores; old40/42 and80M
incomplete evidence are untouched. Exact-reference calibration at frames15/45
now additionally requires contrast ratio1, no mismatches, and rejection of an
8px-blurred reference. Encoded regression already requires all42 at both times
and independently rejects blurred decoded frames. Thus reverting the row choice
reintroduces the observed40/42 failure without lowering any acceptance metric.
Rationale is the complete14.4M/64M comparison: identical glyph errors using the
first-row templates,42/42 using corresponding rows, and known differing raster
phases. This is reference calibration, not proof of losslessness or a production
budget correction. Control runner now expects exit0 for corrected quality.

Prepared slot request: format, types, oracle, red-paired, red-quality, green,
unit, browser via review-check.py, sequential180s each and100MiB floor. RED
paired uses isolated audited7b88854 injection; production file stays untouched.
Normal GREEN has no injection or diagnostic high-budget flag. Browser directory
has all benchmark/acceptance/evidence flags unset. Bounded PNG/JSON evidence only;
no retained output MP4 or frame dumps; same5MB blob guard and cache reuse.

### Row-corrected RED/GREEN segment verified

- [passed] Format and isolated types: exit0 (review-format-3/types-3).
- [passed] Oracle: 1passed, 1filtered skip; both frame phases calibrated.
- [passed] Paired legacy RED fails actual4374070 < 4374070 byte assertion.
- [passed] Quality negative RED fails blurred3 vs42 assertion.
- [passed] GREEN: 2files,3tests passed; no skipped tests.
- [passed] Corrected4K:42/42 at both times, contrast .752525/.839024.
- [passed] Corrected blur:3/42 and2/42 rejected; historical scores40/42 both.
- [passed] Production SHA unchanged after isolated legacy module injection.
- [untested] Affected full directory suites await separate coordinated slot.

All child processes exited (GREEN PID89151 exit0,13.1s). Process inspection
found no remaining Vitest/Vite/review runner. Free253636KiB on release to73.
No production edits, savedMP4, cap changes, or extra directory runs.

### Affected suites and final scoped checks

- [passed] Exporter unit directory:99passed,0failed,0skipped;13files.
- [passed] Exporter browser directory:9passed,0failed;4files passed.
- [untested] Opt-in benchmark:1test/1file skipped with flags unset as intended.
- [passed] Final scoped Biome:58files,no fixes; JSON values unchanged.
- [passed] No source change since successful isolated tsc; repeat unnecessary.
- [passed] Production hash669c2c34... unchanged; all owned children exited.

Unit child90468 exit0; browser child90554 exit0 (17.1s); formatter child90919
exit0. Fresh process inspection found no Vitest/Vite/runner/tsc. Slot released
to73. Free171208KiB; no cleanup. Commit hooks await explicit coordinated slot.
Fresh-head remote CI remains pending; local Mac results do not prove Ubuntu.

 ## Issue69 BEFORE resource deviation (September8)

Fresh installed1.6.0 recording startup was asynchronous. Immediate post-Return AX
remained idle; Tab/Space intended for Pause opened Notes. Native close returned to
active HUD; paused at observed00:18, resumed and stopped promptly. Thus active
capture lasted19.009s (saved metadata), exceeding granted15s. No extra capture was attempted. App quit, children
exited; all586 original recording hashes unchanged, free disk128400KiB and total
observed incremental disk8260KiB. Root notified. BEFORE provenance is installed1.6.0,
source-correlated to unchanged493965e; never represented as currentmainruntime.

## Issue69 reversible disk recovery (September8, coordinator-owned)

Root applied worktree-only sparse checkout patterns `/*` and `!/docs/evidence/`
to exclude40,788KiB of unchanged historical evidence copies from this newly created
lane. Before exclusion root verified no modifications, untracked/ignored files,
symlinks or open handles in the exact target; main and lane Git evidence trees
matcheda8eeaf6e. Git reports no deletions; issue69 source/tests/locales/artifacts
remain intact. Main retains40,788KiB of original evidence and no sparse config.
Reported disk124840->165868KiB. No old52 dependencies were touched. Restore with
`git sparse-checkout disable` in THIS ticket worktree when headroom permits.

## Issue69 AFTER narrower resource-budget deviation

Patched native Start/Pause/Resume/Stop and Studio keyboard behavior was observed,
including transient saving. Initial free207108KiB; after owned capture entered
editor, a sample reached163284KiB (43824KiB,42.80MiB observed growth), exceeding
the subsequently accepted narrower35MiB budget while remaining above130MiB
operational and100MiB hard floors. Stopped further interaction immediately and
quit owned Electron. Vite exited automatically with app, exit0; attempted TERM
found its PID already gone. Restart/Cancel names were observed but their native
activation was not attempted. Optimizer remained10516KiB, main/preload348KiB;
growth was not all attributable to those lane outputs, and no unsupported cause
claim is made. Root notified; no repeated capture without a new grant.

 ## Issue 73 RED wrapper deviation (2026-09-08)

The first regression run reached the expected late-title assertion, but its
zsh wrapper assigned read-only `status`, so it did not record the test exit.
The full first output was preserved. An identical authorized retry used
`test_exit_code` and recorded exit 1 with the same assertion failure. This is
an execution-log wrapper snare, not a configuration, fixture, or extra product
failure. OS loop log BL-047 records it. No production changes were applied.

## Pre-fix GUI timing and app targeting

First attempt missed the 20-second window; `timing-miss.png` is retained and
is not failure evidence. The second attempt batched native Computer Use
interactions with fresh accessibility state between actions and reproduced
the bug within the original delay. No extension or mocked result was used.
Initial app-name lookup opened an incidental default Electron window through
the old52 dependency symlink. Full-path targeting selected the verified issue73
runtime; both owned runtime and incidental window were closed afterward.
Source bytes were restored exactly. An immediate HTTP check before HMR caught
cached instrumented source, so served-shim removal is not claimed for this
 pre-fix run; the runtime then shut down. The after-fix ordinary save will
 require verified uninstrumented served source.

## Issue 66 draft PR 78 re-evaluation — 2026-09-09

Ticket cfa51f8 verified byte-for-byte. Independent Codex local review cycle 1 at 49811dce (base 3fcdad09) found blocking screenshot fallback defect at bundle.ts:853 when prior mapping is absent/deleted; no nonblocking findings. Exact-head CI green. Phase mode unresolved (milestone null), native inside-click acceptance still unverified, visual evidence uncommitted. Historical Copilot score ignored; review-passed removed, priority/needs-human added; PR kept draft, card Blocked, no watcher. Full local report artifacts/66/checkpoint-78-review.md. No production changes or new GUI actions.
- Coordinator explicitly routed unmilestoned issue 66 to maintenance mode for this rerun. This user authorization resolves the phase-mode blocker without inventing a manifest default. Resume the concrete local-review correction; native acceptance and committed-evidence gates remain open.
- Independent Codex local review cycle 2 confirmed correction (bundle.ts SHA256 0d5be071be75684525cd6595e3737557b40331308ea86db775b4e59193f8546d; bundle.test.ts SHA256 3a25c9341f9192e1812d42b2072c8c0ba9cd74202da30d2ce8a25a08e00210fb): no remaining blocking code findings. Nonblocking: public regenerateDocArtifacts comment at bundle.ts:592 should clarify fallback succeeds only without existing-image conflict. Recorded without further edits.
- Genuine RED observed by orchestrator before production edits (review-fix-red-orchestrator.log); final 67 bundle tests and 178 affected tests pass, final targeted Biome passes, temporary-declaration TypeScript passes. Initial Biome formatting failed despite wrapper incorrectly annotating exit 0; only the later successful check is accepted. No new native/GUI claim. Required committed visuals and real inside-click evidence remain blockers; PR stays draft.

## Issue 75 keyboard source cards (2026-09-09)

Implemented the approved `artifacts/75/PLAN.md` radio-group pattern in
`src/components/launch/SourceSelector.tsx`: each category list is a
`role="radiogroup"`; cards are named radios (`role="radio"`,
`aria-label`, `aria-checked`) with a roving tabIndex (selected card, else
first card of the category, is the single Tab stop); Space/Enter select the
focused card; ArrowRight/ArrowDown move focus+selection forward and
ArrowLeft/ArrowUp backward, wrapping at the group ends; Tab/Shift+Tab are
never preventDefault'd so focus leaves the group unaided. Click still selects
and now also focuses the card. A `:focus-visible` outline was added in
SourceSelector.module.css. Share/Cancel, refresh, selected-source
`selectSource` IPC, thumbnails, category tabs, and capture behavior are
unchanged. RED evidence in `artifacts/75/red.txt` was not altered.

Verification: `npx vitest run src/components/launch/SourceSelector.test.tsx`
6/6 GREEN (empty/retry, Space+ArrowDown+Share IPC single-tab-stop, ArrowRight,
Enter activation + IPC, ArrowLeft/ArrowUp wrap + roving tab stop,
empty-state reload); `npx tsc --noEmit` emits only 3 pre-existing `ws`
errors in `electron/showhow/bridgeServer.ts`; Biome check clean on the
three touched files.

### Nonblocking limitations

- The plan's "refresh retains the selected source and its roving Tab stop"
  and "selected source disappears -> selection clears, first remaining card
  becomes Tab stop without being selected" transitions are implemented by
  the existing `fetchSources` selection-retention plus the tab-stop
  derivation, but are not directly test-covered: the populated picker
  exposes no refetch trigger (fetchSources runs only on mount and from the
  empty-state Reload button), so the transition is not reachable through
  the public UI seam. Only the empty->reload transition is asserted.
- `npx tsc --noEmit` exits 2 with 3 errors in `electron/showhow/bridgeServer.ts`
  (`ws` module typing). Pre-existing and environment-caused: this lane uses
  the read-only main-checkout node_modules symlink, which lacks the declared
 `@types/ws`, and dependency installation is prohibited (ENOSPC history).

## Review cycle 1 — VideoPlayer

**Root cause:** the component implements a purely presentational player; the `<video>` element is never driven.

**RED evidence:** `ruby ~/.local/bin/bedar-runtime.rb run --resource heavy -- npx vitest run src/components/showhow/VideoPlayer.test.tsx` exited 1 before production edits (2 tests failed). The play/pause assertion reported `expected "play" to be called once, but got 0 times`; seek reported `expected +0 to be 12` for `video.currentTime`.

**Correction and verification:** Play/Pause now invoke the referenced media element, range changes assign its `currentTime`, and a `timeupdate` listener drives the displayed time and slider. The targeted file passed 2/2; `npx vitest run src/components/showhow` passed 14/14 across 3 files; targeted Biome passed. `npx tsc --noEmit` remains blocked by the pre-existing missing `ws` declaration and implicit-any errors at `electron/showhow/bridgeServer.ts:2,58,177`. The pre-existing `Components.test.tsx` still passes and emits jsdom's expected unimplemented `HTMLMediaElement.play()` warning because that legacy test does not spy/mock the method.

**Sidebar sidebar fallback:** Deferred. `primary.onClick` is required in the TypeScript interface, but runtime JavaScript/untyped callers could still omit it, so the nullish fallback is not proven unreachable across consumers; sidebar changes are outside this VideoPlayer fix scope.
  Verified pre-existing by stashing this diff and rerunning: identical 3
  errors with zero contribution from the touched files.
- Tab/Shift+Tab exiting the group without trapping is guaranteed by
  construction (no Tab handling, no preventDefault) rather than by an
  assertion; jsdom does not move focus on Tab keydown, so a traversal test
  would only assert jsdom behavior. Real focus-ring visibility
  (`.sourceCard:focus-visible`) is CSS-only and needs native smoke evidence
  per AGENTS.md; not claimed as tested here.

### Verification correction

The orchestrator replaced only its lane-created shared `node_modules` symlink with a locked local
`npm ci` install after confirming 9.6 GiB remained. With the declared `@types/ws` present,
`npx tsc --noEmit` passed with no errors. Native Electron verification then confirmed keyboard
focus left the radio group for the dialog actions and that the focus ring was visible.

### 2026-09-09 local review cycle 1 -- public seam clarification

The populated picker exposes exactly one public refetch seam: the existing `Reload` button,
which is rendered only by the empty/load-failed state. `fetchSources` also runs once on mount;
there is no refresh control while sources are listed, so the plan's "refresh retains the
selected source" and "selected source disappears" transitions run behind that seam but are not
separately reachable picker actions. `artifacts/75/PLAN.md` now names this seam explicitly.
Test coverage follows the seam: `SourceSelector.test.tsx`'s reload test drives the public
`Reload` button from the empty state and asserts the reloaded list renders as an unchecked
radio group -- the first named radio is the group's Tab stop (`tabindex="0"`), nothing is
`checked`, and Share remains disabled until a source is activated. No production code,
`red.txt`, commits, or GitHub state were touched in this cycle.

### 2026-09-09 local review cycle 1 amendment

Amendment applied to `artifacts/75/PLAN.md`: deleted the two populated-refresh bullets
("refresh retains the selected source and its roving Tab stop" / "if a selected source
disappears, selection clears and the first remaining source becomes the Tab stop") and removed
the sentence claiming those transitions run behind the empty-state `Reload` seam. Those
behaviors exist in `fetchSources`/tab-stop derivation but have no reachable public picker
action, so the plan no longer states them. What remains is the real contract: the only public
refetch seam is the empty/load-failed `Reload` button; reloading loads each category as an
unchecked radio group whose first named radio is the Tab stop with Share disabled, which is
exactly what the strengthened reload test asserts.

### 2026-09-09 correction retraction

Retract the prior statement that the populated refresh transitions (selection retention /
disappearance fallback) "run behind the empty-state Reload seam": they do not. The empty-state
`Reload` cannot have an existing selection to retain (the list is empty or failed at that
point), and no populated refetch action exists in the picker. Those transitions are internal
`fetchSources`/derivation behavior with no public seam, which is why the corresponding PLAN.md
bullets were deleted.

### 2026-09-09 Greptile round 1 fix (PR #79) -- focus ring drawn inside the card

Validated finding: `.sourceCard:focus-visible` used `outline-offset: 2px`, drawing the 2px
focus ring 2px outside the card edge. The source grids are
`overflow-y-auto` scroll containers, so an outside ring on cards at the grid's edge can be
clipped by the scroll container instead of rendering fully around the focused radio.

Correction: `outline-offset` changed from `2px` to `-2px` in
`src/components/launch/SourceSelector.module.css`, so the 2px outline is rendered inside the
card and can never be clipped by the grid's overflow. CSS-only; layout, keyboard behavior,
roving tabIndex, and all tests are untouched. No RED test was made per instruction.

## Lane A

- Initial test setup evidence: `ruby ~/.local/bin/bedar-runtime.rb run --resource heavy -- npx vitest run src/lib/showhow/designTokens.test.ts` initially failed import analysis because `./designTokens` did not exist (zero tests); this was a setup failure, not behavioral RED.
- Genuine RED before CSS/Tailwind production edits (after adding the manifest): `ruby ~/.local/bin/bedar-runtime.rb run --resource heavy -- npx vitest run src/lib/showhow/designTokens.test.ts` produced intended missing-token failures: `--ds-surface` absent in CSS and `surface: var(--ds-surface)` absent in Tailwind. This RED was observed by the lead and logged in the concurrently appended correction above.
- GREEN: `ruby ~/.local/bin/bedar-runtime.rb run --resource heavy -- npx vitest run src/lib/showhow/designTokens.test.ts src/assets/fonts/fonts.test.ts` passed (2 files, 3 tests), covering all 52 light/dark declarations, Tailwind mappings, and nine WOFF2 files.
- Nearby suite: the first run during concurrent theme edits had 32 passing tests and a theme import-analysis failure. The subsequent `ruby ~/.local/bin/bedar-runtime.rb run --resource heavy -- npx vitest run src/lib/showhow` passed all 41 tests across 8 suites.
- CSS quotes `JetBrains Mono`, `Inter Tight`, and `Instrument Serif` in custom-property values because multi-word font-family values must be quoted; the manifest preserves the exact unquoted design-variable strings. Inter remains unquoted.
- The new local-font import is placed before the unchanged legacy Google Fonts import, which remains for the editor's custom-font feature; removal is deferred to Phase 5.
- Instrument Serif italic file is `instrument-serif-latin-400-italic.woff2`; the initially guessed `...-italic-400.woff2` and jsDelivr listing endpoint both returned 404. The alternate filename downloaded successfully.
- `npx tsc --noEmit` reported errors outside Lane A: missing `ws` declarations/implicit-any in `electron/showhow/bridgeServer.ts`, and temporary theme IPC typing gaps in the concurrently edited `theme.ts`/preload files. Lane A did not touch these files.

## Orchestrator correction re Lane B, 2026-09-26

The Lane B "RED evidence" entry above is reclassified: it ran ZERO tests (`Failed to resolve import "./theme"` / `"./themeIpc"`) — a Vite setup failure, not a behavioral RED, and it must not be relied on as pre-edit evidence. Theme production files (src/lib/showhow/theme.ts, electron/themeIpc.ts) were then implemented without an executable behavioral-assertion RED having been captured first, so NO pre-edit behavioral RED exists for the theme lane. This contradicts the agreed RED bar. Recovery (not a claim of backdated evidence): post-hoc verification is required — the theme tests must be run wrapped, and a genuine behavioral check (preference resolution, Showhow-first/legacy persistence fallback, nativeTheme update broadcast) must be demonstrated against the completed implementation, with the residual gap stated honestly rather than relabeled. The token lane's lead-captured RED (--ds-surface CSS + Tailwind mapping) remains valid and unaffected.

## Lane A RED provenance correction, 2026-09-26

The original Lane A test run performed by this lane before production edits was a missing-module setup failure (`./designTokens` unresolved; zero tests), not an intended assertion RED. Although a later note attributes a missing CSS/Tailwind assertion RED to the lead before those files changed, this lane did not run or independently capture that run, so it must not cite it as its own observed RED. `src/index.css` and `tailwind.config.cjs` have since been edited; the required pre-edit assertion run cannot be performed now without backdating evidence. The current focused tests are GREEN, but there is no pre-edit behavioral RED captured by this lane. This records the provenance gap without erasing earlier history.

## Lane A lead RED confirmation, 2026-09-26

Lead clarification: the genuine pre-edit token RED is authoritative, captured with CSS and Tailwind at baseline: `--ds-surface` declaration and `surface` mapping assertions failed. This evidence is recorded in `implementation-notes.md` and `artifacts/92/verification.md`; retain it as the valid pre-edit RED. Post-implementation GREEN recapture: `ruby ~/.local/bin/bedar-runtime.rb run --resource heavy -- npx vitest run src/lib/showhow/designTokens.test.ts src/assets/fonts/fonts.test.ts` passed, 2 test files and 3 tests. Earlier provenance notes above remain historical context and are not deleted.

## Lane B behavioral RED follow-up, 2026-09-26

After the implementation was already complete, temporarily disabled `normalizePreference` in `src/lib/showhow/theme.ts` and ran `ruby ~/.local/bin/bedar-runtime.rb run --resource heavy -- npx vitest run src/lib/showhow/theme.test.ts`. The test runner reached behavioral assertions and failed: `prefers the Showhow key over the legacy key` expected `"dark"`, received `"system"` (`theme.test.ts:38`; 4 failed, 5 passed). The correct normalization function was immediately restored. This is post-hoc fault-injection evidence that the behavior test detects a regression; it is NOT a pre-edit RED and does not correct the original sequencing gap. The completed implementation's wrapped GREEN run is recorded in the lane report.

## Lane B post-hoc verification, 2026-09-26

Recovering the absent pre-edit behavioral RED stated above: the completed theme implementation was verified under the wrapped heavy runner — `npx vitest run src/lib/showhow/theme.test.ts electron/themeIpc.test.ts` passed (2 files, 11 tests) covering preference resolution, Showhow-first persistence with legacy `openscreen:theme` fallback, and nativeTheme update broadcasts skipping destroyed windows. Wiring confirmed: `initTheme()` invoked at the top of src/main.tsx so every renderer window applies `data-sh-theme`; preload exposes showhowGetSystemTheme/showhowOnSystemThemeChanged; d.ts extended; themeIpc registered from electron/main.ts. Honest standing: this is post-implementation verification; no pre-edit behavioral RED ever existed for the theme lane.

## Lane C — Issue #92 Phase 1.4 reusable components

- Added ten standalone Showhow primitives under `src/components/showhow/` without integrating them into App or existing screens: Button, Tag, Logo, LibraryRow, Sidebar, VideoPlayer, GuideStep, Card, ShowhowToaster/showhowToast, and EmptyState. Added focused behavioral and token-class tests plus a barrel export.
- RED evidence (verbatim classification): first wrapped `npx vitest run src/components/showhow` exited 1 before executing tests because the initial Button source had a TypeScript syntax error (`Expected identifier but found ")"`); this was a setup/transform failure, not behavioral RED. After fixing syntax and authoring the remaining component tests, the wrapped suite exited 1 with 10 passing tests and one failed EmptyState action assertion. This was a test-authoring mismatch: the fixture placed its button in children although the specified API is `action`; the implementation correctly exposes `action`. It was not a production behavior failure and is not claimed as genuine behavioral RED. Therefore this lane did not capture a valid production-behavior RED before implementation of the remaining components.
- Quote deviation per approved plan: GuideStep narration uses `font-ds-serif` and italic styling, following the plan and committed design-system page rather than the .pen frame’s muted 13px body quote.
- GREEN: wrapped `npx vitest run src/components/showhow` — 2 files / 11 tests passed. Wrapped `npx vitest run src/components` — 18 files / 167 tests passed. Wrapped `npx biome check src/components/showhow` — 13 files clean. Wrapped `npx tsc --noEmit` — only existing unrelated `electron/showhow/bridgeServer.ts` errors remain (missing `ws` declaration and implicit `ws`/`data` parameters); no Showhow component type errors remain. Resource wrapper returned exit 75 for some concurrent requests; retried after 20 seconds.
- Scope: no App/screens, editor/library screens, theme lane, token lane, or artifacts files were intentionally edited.

### Theme rendering coverage extension

Added a jsdom theme-pass test that renders the reusable component set under `data-sh-theme="light"`, rerenders it with `data-sh-theme="dark"`, and checks the attribute on each render while confirming representative rendered components remain present. Added a real Chromium browser test for EmptyState backed by the `--ds-surface-raised` design token. Browser-observed computed `backgroundColor`: light = `rgb(249, 245, 236)` (`#F9F5EC`); dark = `rgb(54, 54, 54)` (`#363636`); values differ as expected. The Vitest browser harness loads the custom-property declarations but does not emit Tailwind utility CSS, so the browser probe applies `background-color: var(--ds-surface-raised)` to the rendered component surface to test actual browser custom-property resolution and theme switching.

Verification for this extension: wrapped jsdom `npx vitest run src/components/showhow` passed (2 files / 12 tests); wrapped Chromium `npx vitest run --config vitest.browser.config.ts src/components/showhow/theme.browser.test.tsx` passed (1 test); wrapped `npx biome check src/components/showhow` passed (14 files). Wrapped `npx tsc --noEmit` still reports only the pre-existing `electron/showhow/bridgeServer.ts` missing `ws` declaration / implicit parameter errors.

## Review cycle 2 — theme stale system promise

- RED captured before the production guard: wrapped `npm test -- src/lib/showhow/theme.test.ts` ran 11 tests with 10 passed and 1 failed. Exact behavioral assertion excerpt:
  ```
  FAIL src/lib/showhow/theme.test.ts > theme preferences > ignores a stale system theme after a newer manual selection
  AssertionError: expected 'dark' to be 'light' // Object.is equality
  Expected: "light"
  Received: "dark"
  at src/lib/showhow/theme.test.ts:99:52
  Test Files  1 failed (1)
  Tests       1 failed | 10 passed (11)
  ```
- Root cause: `setThemePreference("system")` applies the current fallback immediately but its asynchronous Electron theme completion unconditionally reapplies its captured system result, even after a newer manual choice.
- Guard design: each preference selection increments a module-level monotonic request token, and asynchronous completions apply only when their captured token is still current, so manual choices and later system selections invalidate older promises.
- GREEN: wrapped `npx vitest run src/lib/showhow/theme.test.ts electron/themeIpc.test.ts` passed (2 files, 14 tests), including stale-manual-selection and second-system-selection re-arming coverage. Wrapped `npx biome check src/lib/showhow/theme.ts src/lib/showhow/theme.test.ts` passed (2 files).
- Wrapped `npx tsc --noEmit` remains blocked only by existing `electron/showhow/bridgeServer.ts` errors: missing `ws` declarations and implicit `ws`/`data` parameter types; no errors were reported in this change's files.

### Completion gate follow-up — real browser rendering of Button, Card, EmptyState

Expanded `theme.browser.test.tsx` to mount Button, Card, and EmptyState inside a `data-sh-theme="light"` root, assert that root attribute, rerender the same component set under `data-sh-theme="dark"`, and assert the flipped attribute. Browser-computed colors now assert light/dark flips for all three rendered components. Observed values: Button nested token probe / EmptyState `--ds-surface-raised` = light `rgb(249, 245, 236)` (`#F9F5EC`), dark `rgb(54, 54, 54)` (`#363636`); Card `--ds-surface` = light `rgb(255, 252, 247)` (`#FFFCF7`), dark `rgb(47, 47, 47)` (`#2F2F2F`). The browser harness loads token declarations but does not emit Tailwind utilities, so each rendered component surface is probed through an inline `var(--ds-*)` style; the test exercises browser custom-property resolution under each theme.

Exact verification command: `ruby ~/.local/bin/bedar-runtime.rb run --resource heavy -- npx vitest run --config vitest.browser.config.ts src/components/showhow/theme.browser.test.tsx` — exit 0; output: `✓ chromium src/components/showhow/theme.browser.test.tsx (1 test)` and `Test Files 1 passed (1), Tests 1 passed (1)`. Wrapped `npx biome check src/components/showhow/theme.browser.test.tsx` also passed after formatting. No commit or push.

### Browser computed-style correction — component utilities, no inline probes

Removed all test-assigned `style.backgroundColor` probes. The Chromium test now reads `getComputedStyle` directly from the rendered Button, Card root, and EmptyState root, and asserts the light/dark `data-sh-theme` flip. The browser config explicitly applies Tailwind and Autoprefixer to imported CSS so the test uses generated utility rules. Enabling real Tailwind processing exposed that `bg-ds-surface-raised` had no generated rule: configured camelCase `surfaceRaised` only emitted `bg-ds-surfaceRaised`. With scope authorization, added the narrow kebab-case `surface-raised` alias in `tailwind.config.cjs`; EmptyState's existing `bg-ds-surface-raised` class now resolves to its actual token. Button theme-color checking waits 200ms after rerender to account for its specified 150ms transition.

Exact final command: `ruby ~/.local/bin/bedar-runtime.rb run --resource heavy -- npx vitest run --config vitest.browser.config.ts src/components/showhow/theme.browser.test.tsx` — output: `✓ chromium src/components/showhow/theme.browser.test.tsx (1 test)`, `Test Files 1 passed (1)`, `Tests 1 passed (1)`. Observed computed values: Button text light `rgb(47, 47, 47)`, dark `rgb(255, 252, 247)`; Card surface light `rgb(255, 252, 247)`, dark `rgb(47, 47, 47)`; EmptyState `bg-ds-surface-raised` light `rgb(249, 245, 236)` (`#F9F5EC`), dark `rgb(54, 54, 54)` (`#363636`). Focused component suite also passed: 2 files / 12 tests. Biome passed on the browser config, Tailwind config, and browser test. No commit or push.

## Review round 2 — Finding 1 addendum Fira Code symbols2

- Genuine RED captured before font asset/CSS/manifest/license production edits with the wrapped targeted test. Exact failure excerpt:
  ```
  FAIL src/assets/fonts/fonts.test.ts > local font assets > bundles both Fira Code symbols2 faces from the original Google CSS locally
  AssertionError: expected [] to have a length of 2 but got +0
  Tests 1 failed | 5 passed (6)
  Exited with code 1
  ```
- Bundled the original Google css2 Fira Code symbols2 variable font served from `fonts.gstatic.com` at `uU9NCBsR6Z2vfE9aq3bhZ_Wmh3mUfBsu_Q.woff2`. The downloaded file's first four bytes were verified as `wOF2`. Added provenance in the Fira Code section of `src/assets/fonts/LICENSE.md`; Fira Code's existing SIL OFL 1.1 license permits redistribution.
- Added both normal-style Fira Code symbols2 face mappings (weights 400 and 700) using the same local `fira-code-symbols2-400-normal.woff2` asset, plus both manifest entries. The manifest coverage assertion now resolves each CSS URL from its manifest `file` basename, allowing both declared weights to intentionally share one asset.
- GREEN: wrapped `npx vitest run src/assets/fonts/fonts.test.ts` passed 1 file / 6 tests, including the manifest-coverage test. Wrapped Chromium `npx vitest run --config vitest.browser.config.ts src/assets/fonts/fonts.browser.test.ts` passed 1 file / 5 tests, including loading the box-drawing symbol locally. Wrapped Biome check passed for both touched TypeScript tests. Wrapped `npm run branding:check` passed.
- Verified mapping counts: `annotation-fonts.css` has 189 `@font-face` mappings and `annotation-fonts.manifest.json` has 189 mappings, including the two added Fira Code symbols2 weight declarations. Coverage parity with the original Google CSS is now 189/189 mappings.
- No commit, push, or PR action.

### Follow-up RED observation — component node association

The reported browser RED was `expected rgb(47, 47, 47), received rgb(249, 245, 236)`: the raised EmptyState surface was being compared against the Card's dark-surface value. Corrected/confirmed the assertions target actual roots by checking Card's `bg-ds-surface` class and computed surface (`rgb(255, 252, 247)` light, `rgb(47, 47, 47)` dark), and EmptyState's `bg-ds-surface-raised` class and computed surface (`rgb(249, 245, 236)` light, `rgb(54, 54, 54)` dark). No inline style injection remains. Final wrapped Chromium command passed: `ruby ~/.local/bin/bedar-runtime.rb run --resource heavy -- npx vitest run --config vitest.browser.config.ts src/components/showhow/theme.browser.test.tsx` — `Test Files 1 passed (1)`, `Tests 1 passed (1)`. Biome check passed for `vitest.browser.config.ts`, `tailwind.config.cjs`, and the browser test.

### Final browser-test assertion scope correction

Per the completion gate, removed all Button computed-color expectations and kept only its `bg-ds-accent` class assertion in both theme wrappers (the accent token is constant across themes). The test now reads computed background colors directly from Card's `<section>` root (`bg-ds-surface`: light `rgb(255, 252, 247)`, dark `rgb(47, 47, 47)`) and EmptyState's root (`bg-ds-surface-raised`: light `rgb(249, 245, 236)`, dark `rgb(54, 54, 54)`). No injected span or inline background styling remains. Fresh wrapped browser run passed: command `ruby ~/.local/bin/bedar-runtime.rb run --resource heavy -- npx vitest run --config vitest.browser.config.ts src/components/showhow/theme.browser.test.tsx`; output `Test Files 1 passed (1)`, `Tests 1 passed (1)`. Targeted Biome check passed.

## Orchestrator: Tailwind mapping + browser harness fix, 2026-09-26

Observed product failure: components referenced kebab-case utilities (bg-ds-surface-raised, bg-ds-on-panel-wash) but tailwind.config.cjs keys were camelCase (surfaceRaised, onPanel), so Tailwind generated no such classes; the browser test computed rgba(0,0,0,0) for EmptyState while single-word keys (ds-surface on Card, ds-panel on Button/Dark) resolved. Fixes within ticket scope: (1) all 45 colors.ds keys remapped to kebab-case strings so generated utility names reproduce the .pen token names verbatim; (2) vitest.browser.config.ts now processes src/index.css + fonts.css (test.css include) so Tailwind utilities and @font-face exist in browser tests; (3) designTokens.test.ts mapping assertion tightened to require kebab-case keys, catching this class of mismatch going forward; (4) designTokens.test.ts regex allows bare single-word keys. Verification (all wrapped heavy): browser test 1/1 passing with real computed values (Card rgb(255,252,247)→rgb(47,47,47); EmptyState rgb(249,245,236)→rgb(54,54,54); Button class-only per constant accent); component units 12/12; src/lib/showhow 41/41; designTokens+fonts 2/2+fonts; full unit suite 95 files / 805 tests passing; biome clean on all lane files; tsc reports only the pre-existing ws/bridgeServer.ts errors (file untouched by this ticket).

## Orchestrator: lint-gate fixes, 2026-09-26

Biome-fixed exactly three ticket files flagged by the lead lint gate: electron/main.ts (import order — registerThemeIpc now after singleInstanceLock, cosmetic reorder only), electron/preload.ts (formatter), src/lib/showhow/theme.test.ts (formatter). Wrapped `npm run lint` passes with only the pre-existing unrelated deferredClick.test.ts empty-block warning (non-blocking). tsc unchanged (only pre-existing ws/bridgeServer.ts errors). Focused theme suite unchanged: 11/11 passing.

## Review cycle 1 — theme same-window apply

**Root cause:** `writeThemePreference` persists only; theme application existed only on startup/storage-event paths, so same-window System/Light/Dark selection left `data-sh-theme` unchanged until an event or reload.

**Exact RED observation (before production edits):** `ruby ~/.local/bin/bedar-runtime.rb run --resource heavy -- npx vitest run src/lib/showhow/theme.test.ts` exited 1 with 10 tests collected, 1 failed and 9 passed. The failing assertion was `applies a selected preference immediately after writing it`: `AssertionError: expected undefined to be 'light'` at `src/lib/showhow/theme.test.ts:72:52` immediately after `writeThemePreference(storage, "light")`; `data-sh-theme` was absent. This was a behavioral assertion against the existing export and storage fake, not a link/setup failure.

**Test refinement:** After the RED was observed, refined that same immediate-apply test to call the public `setThemePreference(pref, { storage, systemIsDark })` selection API for light, dark, and system, asserting synchronous same-window attribute updates and persisted preference. System uses the injected native-appearance value in the test.

**GREEN:** Wrapped focused suite `npx vitest run src/lib/showhow/theme.test.ts` passed: 1 file, 10 tests. Existing nine tests stayed green alongside the added/refined selection test. System source order is injected `systemIsDark` when supplied; otherwise request Electron's native system theme, synchronously apply the `matchMedia` value (safe light fallback if unavailable), and apply Electron's authoritative result when its asynchronous API resolves. `initTheme` now uses the same selection application path.

## Review cycle 2 — global Google Fonts removal (orchestrator, 2026-09-26)

RED (captured pre-edit, wrapped): new test "makes no runtime Google Fonts request from the global stylesheet" failed with `AssertionError: expected '@import "./assets/fonts/fonts.css";\n…' not to match /fonts\.googleapis\.com/` — the automatic Google request existed. Fix: removed the line-2 `@import url("https://fonts.googleapis.com/…")` from src/index.css (narrow solution: no lazy-load variant because issue text bans runtime Google fetches outright; the ds fonts are already local). GREEN: fonts+tokens tests 4/4; browser theme test 1/1 (stylesheet still processed, utilities and @font-face intact).
Limitation: the editor annotation font picker (AnnotationSettingsPanel.tsx) hardcodes stacks for Bebas Neue, Caveat, DM Sans, Fira Code, IBM Plex Mono/Sans, Lora, Manrope, Merriweather, Oswald, Permanent Marker, Playfair Display, Plus Jakarta Sans, Space Grotesk, Sora. Selection behavior is preserved (picker unchanged, stacks unchanged), but those families now render only if installed on the OS or added by the user via the existing custom-font import dialog — they no longer auto-download from Google. Editors' custom font support itself is untouched.

## Review cycle 2 — VideoPlayer playback state

**Root cause:** `togglePlayback` set `playing` to `true` immediately after calling `video.play()` without awaiting the media promise. If playback was rejected, the component continued to show Pause while the video was paused; the rejection was also left unhandled.

**Exact RED output (before production edits):** Wrapped `npx vitest run src/components/showhow/VideoPlayer.test.tsx` exited 1. Excerpt:

```text
❯ src/components/showhow/VideoPlayer.test.tsx (4 tests | 2 failed)
  ✓ plays and pauses the video element when its controls are clicked
  × keeps the Play affordance when playback is rejected
  × shows Pause only after the play promise resolves
  ✓ seeks the video and reflects position changes from timeupdate events

FAIL VideoPlayer media behavior > keeps the Play affordance when playback is rejected
TestingLibraryElementError: Unable to find role="button" and name "Play"
... <button aria-label="Pause" ...>

FAIL VideoPlayer media behavior > shows Pause only after the play promise resolves
TestingLibraryElementError: Unable to find an accessible element with the role "button" and name "Play"
... Name "Pause": <button aria-label="Pause" ...>

Test Files 1 failed (1)
Tests 2 failed | 2 passed (4)
Exited with code 1
```

**Chosen fix:** The UI changes to Pause only after `video.play()` resolves; the rejection handler explicitly restores/retains Play and consumes the rejection, preventing an unhandled promise rejection. The pre-existing play/pause test was adjusted to await the actual asynchronous state update; its expected behavior is unchanged. Added rejection-settling and deferred-resolution assertions to establish both rejection recovery and media-promise synchronization.

**RED failure excerpt, verbatim (ANSI formatting removed):**

```text
FAIL src/components/showhow/VideoPlayer.test.tsx > VideoPlayer media behavior > keeps the Play affordance when playback is rejected
TestingLibraryElementError: Unable to find role="button" and name "Play"
<button aria-label="Pause" class="text-ds-on-panel" type="button">

FAIL src/components/showhow/VideoPlayer.test.tsx > VideoPlayer media behavior > shows Pause only after the play promise resolves
TestingLibraryElementError: Unable to find an accessible element with the role "button" and name "Play"
Here are the accessible roles:
  button:
  Name "Pause": <button aria-label="Pause" class="text-ds-on-panel" type="button" />
Test Files 1 failed (1)
Tests 2 failed | 2 passed (4)
Exited with code 1
```

Compatibility note: the legacy `Components.test.tsx` invokes jsdom's unimplemented `play()` (which returns `undefined`); production `HTMLMediaElement.play()` returns a Promise, but the component retains the prior immediate label fallback for that non-Promise test stub. The scoped VideoPlayer test and all Showhow component tests pass without changing other test files.

## Review cycle 2 — built-in annotation families bundled offline (orchestrator, 2026-09-26)

RED (pre-edit, wrapped): fonts.test.ts "bundles every built-in annotation family locally with regular and bold faces" failed `Plus Jakarta Sans has a local @font-face: expected [ 'Inter Tight', …(2) ] to include 'Plus Jakarta Sans'`. Fix: 28 @font-face entries in src/assets/fonts/annotation-fonts.css covering all 15 built-in named families (400+700; Bebas Neue/Permanent Marker 400-only, synthesized bold), wired via index.css import; browser proof fonts.browser.test.ts loads Manrope 700 and Bebas Neue 400 via document.fonts offline — 2/2 passing. Unit fonts/tokens suite 3/3. No runtime Google request anywhere in bundled CSS.

## Review cycle 2 — logo theme + consolidated font licenses + packaging (orchestrator, 2026-09-26)

1) Logo tile theme RED (wrapped browser test, pre-edit): `AssertionError: expected 'rgb(255, 252, 247)' to be 'rgb(47, 47, 47)'` — hardcoded tile fill ignored [data-sh-theme="dark"]. Fix: Logo.tsx tile uses var(--ds-surface) per .pen XXi60 ($ds-surface). Other logo internals (sage shadow/stroke, ink slab, cream cursor, rec dot) verified against .pen XXi60 as intentionally fixed-hex (brand exception per design-system note). GREEN: logo+theme browser tests 2/2.
2) Consolidated font licenses RED (pre-edit): `expected '# Font licenses…' to contain 'SIL OPEN FONT LICENSE Version 1.1'`. Extraction (no guesses): all 19 Fontsource package LICENSE files fetched; 18 ship OFL-1.1 with per-package copyright headers reproduced verbatim (incl. Reserved Font Name clauses for Lora, Merriweather, Playfair Display); Permanent Marker ships Apache-2.0 with attribution from its package metadata.json: "Copyright (c) 2010 by Font Diner, Inc. All rights reserved." All 18 OFL bodies verified identical (single verbatim inclusion). LICENSE.md now carries per-family sections + full OFL 1.1 text + full Apache 2.0 text. Test coverage: every CSS-declared family must have an attribution section with correct license type; 19 families asserted; RED→GREEN observed.
3) Packaging RED (pre-edit): `expected electron-builder.json5 to match /"from":\s*"src\/assets\/fonts"/`. Fix: extraResources copies src/assets/fonts → resourcesPath/font-licenses so woff2, fonts.css, annotation-fonts.css and the consolidated licenses ship in packaged builds. GREEN: fonts tests 4/4.
Final gates (wrapped heavy): full unit suite 815/815 (96 files); npm run lint 0 errors / 1 pre-existing unrelated warning; tsc 3 pre-existing ws/bridgeServer errors only. One transient self-inflicted test-file regression (dangling-file assertions accidentally removed mid-edit) was caught and restored before any run reported green.

## Review cycle 2 — logo test provenance + extraResources narrowed (orchestrator, 2026-09-26)

Logo browser test provenance (reviewer asked; nothing fabricated): src/components/showhow/logo.browser.test.tsx existed since the earlier fix (created 16:26, before the fix report) — it renders <Logo /> in light and dark wrappers and asserts the FIRST svg rect's computed fill: rgb(255, 252, 247) light → rgb(47, 47, 47) dark. Its genuine pre-fix RED is the entry above ("Logo tile theme RED", line ~1128): `AssertionError: expected 'rgb(255, 252, 247)' to be 'rgb(47, 47, 47)'` captured before Logo.tsx changed. Re-ran wrapped this session: 1/1 passing.
extraResources narrowing RED (pre-edit, wrapped): `AssertionError: expected '// @see - https://www.electron.build/…' to match /"filter":\s*\[\s*"LICENSE\.md"\s*\]/`. Fix: font-licenses extraResources now copies ONLY LICENSE.md (woff2 binaries already ship once via the Vite bundle in dist; the duplicate copy shipped every font twice). GREEN: fonts tests 4/4; lint 559 files, 0 errors / 1 pre-existing unrelated warning.

## CI branding:check cause/fix (orchestrator, 2026-09-26)

Cause: PR #99 CI Lint job failed at `npm run branding:check` (lint itself passed). The checker (scripts/branding-check.mjs) scans every git-tracked file for the inherited brand regex and requires exact-path classification in config/branding-allowlist.json. Two ticket files introduced unclassified references: (1) design/showhow.pen — design source of truth carrying two inherited project-format file strings; (2) src/lib/showhow/theme.ts — the legacy renderer theme-storage key fallback (Showhow-first/legacy-fallback persistence rule per AGENTS.md). Lead reproduced the wrapped RED.
Fix (narrow): added exactly these two files to config/branding-allowlist.json with accurate reasons; no legacy compatibility code or design source changed. Self-inflicted trap found on first GREEN attempt: the reason text itself contained the literal brand token, and the allowlist file is also scanned — reworded to "contains two inherited project-format file references from the source ancestor" (matching the established convention of existing entries, which never spell the token). The theme.ts entry reasons it as a legacy storage-key fallback without the literal.
Verification (wrapped heavy): `npm run branding:check` → "Branding check passed: all legacy-brand references are classified."; `npm run lint` → 559 files, 0 errors / 1 pre-existing unrelated warning. No commit/push/PR.

## Review round 2 — Finding 2 synchronous dark initial render

- Root cause: `initTheme` initialized the system appearance to light and only read `matchMedia` when Electron's theme API was absent. With Electron's system preference and a pending theme IPC response, the initial synchronous render therefore applied light on a dark OS.
- RED verification (before the production fix): the new test stored `system`, made `matchMedia` report `matches: true`, kept `showhowGetSystemTheme()` pending, and asserted the document theme immediately. Exact failure excerpt:
  ```text
  FAIL src/lib/showhow/theme.test.ts > theme preferences > renders the synchronous system appearance while the Electron theme request is pending
  AssertionError: expected 'light' to be 'dark' // Object.is equality
  Expected: "dark"
  Received: "light"
  Tests 1 failed | 12 passed (13)
  ```
- Fix: seed `systemIsDark` synchronously from `matchMedia` regardless of whether Electron's theme API/subscription exists. Electron's async IPC result and change subscription remain authoritative when they resolve; absent `matchMedia` keeps the light fallback.
- GREEN focused verification: `theme.test.ts` 13 passed; `electron/themeIpc.test.ts` 2 passed; total 2 files, 15 tests passed.

## Review round 2 — Findings 3+4 VideoPlayer media sync

Findings 3 and 4 confirmed VALID against the original component and reproduced with targeted red tests.

- Root cause (3): only `timeupdate` was observed, so native `play` and `pause` events (including native controls and autoplay) did not synchronize the custom button state.
- Root cause (4): changing `src` retained the same component state, and a prior `play()` promise could resolve after the source change and mark the new source as playing.
- RED focused run: 7 tests, 3 failed / 4 passed. Exact failure excerpts:
  - F3 native media events: `Unable to find an accessible element with the role "button" and name "Pause"` after firing `play`.
  - F4 source reset: `Unable to find an element with the text: 0:00 / 1:05`; the displayed position remained `0:23 / 1:05` after switching sources.
  - F4 stale promise: `Unable to find an accessible element with the role "button" and name "Play"`; after the old promise resolved, the button was `Pause`.
- Fixes: listen to `play`/`pause` and remove those listeners during cleanup. Key the player internals by `src` to synchronously reset playback/time state on source changes and detach stale source event listeners; gate play-promise completions with a per-instance request token and video identity. Toggle handlers remain, while media events synchronize externally initiated playback.
- GREEN focused run: 1 file, 7 tests passed.
- GREEN Showhow component run: 3 files, 19 tests passed.
- Biome check on `VideoPlayer.tsx` and `VideoPlayer.test.tsx`: passed.
- TypeScript check: reports only the known unrelated `electron/showhow/bridgeServer.ts` errors for missing `ws` declarations and implicit `any` parameters (`ws`, `data`).

## Review round 2 — Finding 5 dark primary hover contrast

The primary Button's `hover:bg-ds-accent-200` selected dark `--ds-accent-200` (#3F6A5A) while retaining `--ds-on-accent` (#2F2F2F), yielding only 2.18:1 contrast. Added manifest-independent CSS alias `--ds-accent-hover`: light resolves through `--ds-accent-200` (#CFE4DA) and dark overrides it through `--ds-accent-strong` (#A9CDBB). Button now uses `hover:bg-[var(--ds-accent-hover)]`. These are composed CSS aliases, not new design tokens, so `designTokens.ts` was intentionally left unchanged.

RED-first browser test output before the production edits:

```text
AssertionError: expected '' to be 'rgb(207, 228, 218)' // Object.is equality
- rgb(207, 228, 218)
+ Received: ''
Test Files  1 failed (1)
Tests       1 failed (1)
Exited with code 1
```

Contrast calculated against #2F2F2F using WCAG relative luminance: light #CFE4DA is 10.05:1; dark #A9CDBB is 7.74:1. The old dark hover #3F6A5A was 2.18:1.

GREEN verification: focused browser test 1/1 passed; Showhow component suite 3 files / 19 tests passed (including Components.test.tsx); Biome check passed on the three touched source files. `npx tsc --noEmit` remains blocked by existing `electron/showhow/bridgeServer.ts` missing `ws` declarations and implicit-any errors at lines 58 and 177.

## Review round 2 — PR#98 occurrence-aware branding exceptions

The valid P2 review finding was that `scanBrandingReferences` treated every allowlist
entry as a whole-file skip. Adding `design/showhow.pen` therefore also hid unrelated
legacy-brand text added anywhere else in that design file. Added occurrence-aware
exceptions: entries can now carry `lines: [{ "text": "<exact trimmed line>",
"count": 2 }]`. Such files are scanned normally; only a matching trimmed line is
classified when the exact-text occurrence count is no greater than its declared
count. Any other brand match, or an over-count duplicate, remains a finding.
Entries without `lines` retain their existing whole-file skip behavior. The scanner
also accepts optional `listFiles` injection while defaulting to `git ls-files`.

**RED evidence:** after adding the injected-file-list seam but before implementing
line allowances, the required test run reported `Tests 2 failed | 2 passed (4)`.
The third-occurrence assertion failed with `expected [] to have a length of 3 but got
+0`; the headline unrelated-line assertion failed with `expected [] to deeply equal
[{ file: 'design.pen', line: 3, text: 'unrelated openscreen reference' }]`, receiving
`[]`. The two passing checks verified that the exact two-line fixture and the legacy
whole-file skip behaved as expected.

**GREEN evidence:** focused test `4 passed, 0 failed`; `npm run branding:check`
reported `Branding check passed: all legacy-brand references are classified.` The
`.pen` policy now allows only this exact trimmed line, count 2:
`"content": "or drag & drop a .showhow or legacy .openscreen project file here",`
(the line occurs at design/showhow.pen lines 10969 and 11387 at implementation time).
The policy JSON itself retains a whole-file exception because the policy must contain
the literal legacy token in order to define this entry.

## Review round 2 — Finding 1 annotation font coverage

**Finding validity:** VALID. The removed Google CSS had italic faces and script-specific unicode ranges that the original locally bundled CSS did not provide. Added offline Fontsource WOFF2 coverage and kept all runtime Google Fonts requests absent.

**RED evidence (before CSS and downloads):** `ruby ~/.local/bin/bedar-runtime.rb run --resource heavy -- npx vitest run src/assets/fonts/fonts.test.ts` failed in the new manifest-coverage assertion (not a collection/import failure):

```text
FAIL src/assets/fonts/fonts.test.ts > local font assets > declares every available annotation subset and style from the manifest
AssertionError: Plus Jakarta Sans cyrillic-ext 400 italic: expected undefined to be defined
Tests 1 failed | 4 passed (5)
```

**Coverage summary:** 187 Fontsource faces are represented by the manifest and local CSS. Subsets/styles available upstream were bundled across all 15 families; the fontsource subset coverage is: Plus Jakarta Sans (cyrillic-ext, latin, latin-ext, vietnamese; normal+italic 400/700), Space Grotesk (latin, latin-ext, vietnamese; normal 400/700), DM Sans (latin, latin-ext; normal+italic 400/700), Sora (latin, latin-ext; normal 400/700), Manrope (cyrillic, cyrillic-ext, greek, latin, latin-ext, vietnamese; normal 400/700), IBM Plex Sans (cyrillic, cyrillic-ext, greek, latin, latin-ext, vietnamese; normal+italic 400/700), IBM Plex Mono (cyrillic, cyrillic-ext, latin, latin-ext, vietnamese; normal+italic 400/700), Playfair Display (cyrillic, latin, latin-ext, vietnamese; normal+italic 400/700), Merriweather (cyrillic, cyrillic-ext, latin, latin-ext, vietnamese; normal+italic 400/700), Lora (cyrillic, cyrillic-ext, latin, latin-ext, math, symbols, vietnamese; normal+italic 400/700), Fira Code (cyrillic, cyrillic-ext, greek, greek-ext, latin, latin-ext; normal 400/700), Bebas Neue (latin, latin-ext; normal 400), Oswald (cyrillic, cyrillic-ext, latin, latin-ext, vietnamese; normal 400/700), Caveat (cyrillic, cyrillic-ext, latin, latin-ext; normal 400/700), and Permanent Marker (latin; normal 400). Google CSS2 provided 189 subset/weight/style unicode-range mappings; all 187 Fontsource entries had a matching mapping. Google offered two additional Fira Code `symbols2` ranges (400 and 700 normal) for which Fontsource has no matching WOFF2 file, so no asset/range was fabricated.

**Validation:** focused unit test GREEN, 5/5 tests; browser test GREEN, 4/4 tests (including Playfair Display italic and Oswald Cyrillic loading offline). TypeScript reports only the noted pre-existing `electron/showhow/bridgeServer.ts` missing `ws` declaration/implicit-any errors (lines 2, 58, 177). Biome check was attempted but could not acquire the heavy runtime resource on retries (exit 75).

**Asset size / limitations:** 187 new WOFF2 files; font directory has 202 files total and is 3.3 MB, below the ~8 MB guardrail. All files had valid `wOF2` magic; 71 legitimate small-script WOFF2 files are at or below 10 KB (smallest is 1,016 bytes), so the literal >10 KB check was not applicable to those valid subset binaries; the tests check valid magic and >500 bytes instead. Families without upstream italic faces are Space Grotesk, Sora, Manrope, Fira Code, Bebas Neue, Oswald, Caveat, and Permanent Marker. Single-weight Bebas Neue and Permanent Marker provide only weight 400; missing upstream styles/weights are not synthesized as bundled files.

**File-count clarification:** 187 manifest faces reuse 37 already tracked WOFF2 files and add 159 new WOFF2 paths; the directory contains 196 WOFF2 files total (202 files including CSS, tests, manifest, and license).

## Review round 2 — hover alias rename correction

**Observed union RED:** At the review-round-2 head, the manifest test reported `expected 53 to be 52` because `--ds-accent-hover` added a 53rd `--ds-*` declaration. This was a genuine observed failure, not a newly fabricated RED.

**Correction:** Renamed the composed alias to `--showhow-accent-hover` in both theme token blocks, the primary button hover class, and the browser assertions. The alias still resolves to `var(--ds-accent-200)` in light mode and `var(--ds-accent-strong)` in dark mode; the WCAG contrast assertions remain unchanged.

**Validation:** GREEN — focused browser test 1/1; design token + theme tests 15/15 (including the preserved exact 52-token assertion); `src/components/showhow` 19/19; Biome checked the three touched files without findings. TypeScript reports only the pre-existing `electron/showhow/bridgeServer.ts` `ws` declaration and implicit-`any` errors.

## Lead final-gate correction, 2026-09-26

OpenCode's final lint summary was not accepted as proof: the lead's direct wrapped `npm run lint` returned exit 1 because the new `annotation-fonts.manifest.json` was unformatted. The manifest alone was formatted with wrapped Biome, then direct wrapped full lint passed (0 errors, one existing deferredClick warning). A browser-test quality note was also closed: `fonts.browser.test.ts` now requires `document.fonts.load()` to return at least one loaded face, rather than relying on `document.fonts.check()` alone. The wrapped focused Chromium test passed 5/5; targeted Biome passed. Independent Codex rechecked this test diff and reported zero blocking Standards or Requirements findings. Actual historical editor/export glyph-image parity is still untested and is not claimed.


# Showhow #102 implementation notes

- 2026-10-02: The owner authorized finishing the working review-ready PR with as many reviews as needed; the ordinary review/loop caps are waived for this task. Agents never merge. This executor makes no GitHub mutations.
- API subagent mapping is used for the executor. The shell launch uses OS `roles/role-env.sh executor`, but no native `codex -p bedar-executor` session was launched. Setting shell role variables is not proof that this API worker runs the native Codex role profile. The driver records this limitation explicitly.
- Actual shell provenance command: `PATH="$HOME/.nvm/versions/node/v22.22.1/bin:$HOME/.npm-global/bin:$PATH" bash -c 'role_exports="$(/Users/mohamedb/dev/OS/.agents/loop-config/roles/role-env.sh executor)" && eval "$role_exports" && { command -v node; node --version; command -v npm; npm --version; command -v codex; codex --version; printf "role=%s ZDOTDIR=%s\n" "$BEDAR_TICKET_ROLE" "$ZDOTDIR"; }'`. Observed exit 0; Node22.22.1/npm10.9.4/Codex0.160.0. Native recipe invocations use the exact PATH prefix and inherited API-shell role context, recorded in each result; they do not assert the role-shell probe was their parent process.
- Prerequisite, evidence-collision, cleanup/fixture acceptance, corrupt GIF, and full decoder boundaries were implemented in five vertical assertion RED→GREEN slices. Missing imports were never counted as RED.
- The existing e2e writer replacement is a baseline gap only. Production renderer, writer, native code, dependency versions and permissions remain outside this task's edit scope.
- Native-01 (exit 1) exposed a harness limitation: dynamic imports inside Playwright main evaluation lack an import callback. Inspection moved into the generated isolated bootstrap; production code is unchanged. All four observed child PIDs and the root were cleaned; fixture unchanged.
- Native-02 (exit 1) retained the real editor screenshot and export-completion timeout with successful isolation and cleanup. Native-03 (exit 1) added diagnostics: picker called once, but first-load renderer `VideoDecoder`/`VideoEncoder` were both undefined. Existing `tests/e2e/gif-export.spec.ts` reloads for that registration problem. The recipe now performs that one editor reload and requires actual decoder/encoder functions before export; no codecs, fixtures or production behavior were substituted. All failed attempt evidence remains beside subsequent attempts.
- Native-04 confirmed the codec reload but retained a second completion-dialog timeout. Read-only production inspection found `VideoEditor.tsx` finally immediately closes ExportDialog and clears progress. The recipe observes the existing successful-export toast concurrently with actual file creation; it changes no product behavior. Native-05 passed real GIF write and full decode.
- Native-06/07 passed identical driver bytes and decoded GIF hashes. Native-07's entrance animation moved the temp path partly outside its capture mask. Native-05/07 original completion images are preserved intact in lane git metadata under `verification-private/`; final capture freezes toast transitions and masks/hides only the private path description while taking the screenshot.
- Final native-08/09 both exited 0 with identical driver SHA256 `616061302965e26e512749a735ad8b2888d224367edcd16495795d159ea22169`: 1280×720 GIF, 30 frames, 2.1 seconds, 6,199,282 bytes, independent full FFmpeg decode exit 0, fixture unchanged, zero surviving or unexplained owned-root PIDs, private root removed. Executor inspected final screenshots and a decoded GIF frame; only synthetic content appears. Full CI and independent review remain lead-owned gates.
- Lead full CI observed lint exit 0 then branding-check exit 1: the new recipe observes the inherited compatibility lock name, including eight sanitized native results. Authorized scope extension is only `config/branding-allowlist.json`: exact line/count-1 allowances for the driver lock observation, each native result and every retained failed-check log line. No scanner changes or whole-file exception. First failed CI directory is preserved as `ci-attempt-01`. This policy classification does not change native driver bytes or evidence outcomes.
- The requested branding regression file uses Vitest, so its correct runner is `npx vitest run .github/scripts/branding-check.test.mjs`, rather than `node --test` (which would be a harness/setup failure). All tests remain heavy-wrapped.
- Policy correction validation: heavy-wrapped targeted Biome checked two JSON files exit 0; `npm run branding:check` exit 0 printed `Branding check passed: all legacy-brand references are classified.`; `npx vitest run .github/scripts/branding-check.test.mjs` exit 0, one test file/four tests passed. Driver SHA256 remains `616061302965e26e512749a735ad8b2888d224367edcd16495795d159ea22169`, preserving final native-08/09 proof.
- Lead CI attempt 2 observed lint/branding/typecheck/unit/evidence-integration/browser-install passing, then the first cold browser suite failed: Vite optimized 15 newly discovered dependencies mid-run, reloaded the fonts test, and its import failed reading undefined `config`. The single exact warm diagnostic passed (8 files, 17 tests, 1 existing skipped test), isolating the cache-state trigger; the cold failure is retained in `ci-attempt-02` and not relabelled passing.
- Owner/root authorized a minimal cold-browser configuration correction within #102, with unlimited review permission already recorded. `vitest.browser.config.ts` now explicitly includes only the 15 dependency imports named by the observed Vite warning, alongside existing gif.js. This uses the existing optimizeDeps.include setting and Vite's own diagnostic instruction. No production/dependency/version/assertion/skip changes. Only the lane-generated `.vitest-cache/browser` was renamed to gitignored `.vitest-cache/browser-before102`, preserving it intact before cold proof. Native driver bytes remain unchanged.
- Cold correction proof: heavy-wrapped targeted Biome exit 0; exactly one cold `npm run test:browser` after the cache rename exited 0: 8 test files passed, 17 tests passed, 1 existing file/test skipped, duration 5.96s. No `new dependencies optimized`, `optimized dependencies changed. reloading`, or unexpected-test-reload message appeared. Sanitized output and source/cache observations are preserved in `artifacts/verification-recipe/browser-correction/`. No warm retry was needed for this correction.

[2026-10-02] #102 lead proof: complete sequential CI parity observed after narrow branding classification and cold browser optimizer correction; initial failed logs retained. Unit 822/96 files, cold browser 17/8 files with existing skip, integration 1, cloud 75, lint/branding/typecheck/build exit zero. Driver/test/package content hashes still match native08/09. Lead viewed final screenshots and decoded frame; next gate is fresh independent review then current-head GitHub CI.

[2026-10-02] #102 independent review of 0632d5e6: Standards PASS and Requirements PASS, zero blockers. Nonblocking raw-log whitespace retained as observed evidence. Review artifact commit adds only review records; no source or proof changes. Ship next: explicit ticket ref push, one unmerged PR, current-head GitHub CI and issue verification comment; no Herdr watcher outside Herdr, all worktrees preserved.

# Showhow #106 implementation notes

- 2026-10-12 — The approved task expected Showhow to lack the Loop route. In this branch, AGENTS.md already had both shared Loop pointers, the four routing cases, and the owner-per-PR merge gate. The root cause was the absent CLAUDE.md import. AGENTS.md matches its captured baseline bytes and remains untouched; no route RED was fabricated.
- Baseline: HEAD and origin/main were 4c3ece03c1bca5a309cf11d7e18bb1ab244870e4; the worktree was clean. AGENTS.md was 7,800 bytes, SHA-256 217a5faed8bccc30aa5f553a6f5e82b386a63d2b1e9243d06e39de066e34da5f. CLAUDE.md was absent. implementation-notes.md was 113,349 bytes, SHA-256 3709bc3d89f7b20b84bd858c6f715d95b4ff461250bfbf51c9466f8561e9ff58.
- Change: created root CLAUDE.md as exactly @AGENTS.md plus one newline (11 bytes). This entry is appended after the captured notes bytes.
- Routing proof: unresolved scope routes to shape; an approved issue routes to ticket; an approved dependency-ordered milestone routes to milestone; the owner decides merge approval for each PR. Shared Loop policy says agents never merge and approval of another PR is not consent.
- Source proof receipts are in /Users/mohamedb/dev/loop-evidence/showhow-106/: baseline-manifest.json, baseline-head.json, baseline-status.json, doc-red.json, executor-106-red-confirmation.json, and executor-106-green-import.json. The check is doc-proof.py. RED exited 1 on the intended missing Claude import assertion while all route checks passed. GREEN exited 0 with all 12 checks passing.
- Lane creation deviation: the initial Herdr worktree create from linked main failed with linked_worktree_source (exit 1). Retrying from repo parent /Users/mohamedb/dev/projects/showhow succeeded without source edits between attempts. Receipts: lane-create.json and lane-create-parent.json.
- Limits: source proof only. No fresh Claude or project-session adoption, product behavior/build, or native proof was run. Independent review, PR delivery, and owner-approved merge remain later gates.
