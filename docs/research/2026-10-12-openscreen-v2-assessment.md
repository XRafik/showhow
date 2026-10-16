# OpenScreen v2 intake assessment for Showhow

Date: 2026-10-12. Status: source assessment and recommendations, not an implementation plan or completed integration. Refreshed the same day against upstream `main`; see [Refresh: upstream main after v2.0.0](#refresh-upstream-main-after-v200).

## Decision context

Keep Showhow's recorder/editor while building a local library for recordings and imported MP4 walkthroughs. Produce two editable outputs: an illustrated guide with PDF export, and an evidence-backed brief to hand to an agent. The owner approved ChatGPT plan sign-in and OpenRouter, and selected the newer dither Pen design for the full-app redesign. Those product choices do not approve any particular upstream architecture.

**Recommendation:** assess dependencies now, design the complete experience next, then build against replaceable service interfaces with dummy data. Port narrow fixes independently. Treat adoption of the v2 editor engine as a separate migration decision, not a prerequisite hidden inside “add AI chat.”

## Evidence scope

Compared read-only source snapshots:

- Showhow main: [`4c3ece03c1bca5a309cf11d7e18bb1ab244870e4`](https://github.com/bedarstudios/showhow/tree/4c3ece03c1bca5a309cf11d7e18bb1ab244870e4). The working checkout used for design is older, at `5027d67e`; findings below must not be read as claims about that checkout.
- OpenScreen v2.0.0: [`eff86dcba48fac490a0e153141bf8537df7ffc54`](https://github.com/getopenscreen/openscreen/tree/eff86dcba48fac490a0e153141bf8537df7ffc54), plus its [official release notes](https://github.com/getopenscreen/openscreen/releases/tag/v2.0.0).

No app builds, native smoke tests, provider calls, performance measurements, or source imports were performed for this assessment. Release claims are upstream claims; they are not Showhow acceptance evidence. Intake remains subject to local [`UPSTREAM.md`](../../UPSTREAM.md): focused review and attribution, no full source-branch merge, no permanent upstream remote, affected suites and branding check.

## Architecture findings

Showhow main still routes to the inherited `VideoEditor`. It already has bundle creation, deterministic workflow steps, recording-library readers, a browser-companion bridge, and renderer-side transcription using `@xenova/transformers`. These foundations should be reused where they fit; their presence does not establish that the newly agreed import, AI generation, or PDF workflows are complete. Sources: [App](https://github.com/bedarstudios/showhow/blob/4c3ece03c1bca5a309cf11d7e18bb1ab244870e4/src/App.tsx), [bundle](https://github.com/bedarstudios/showhow/blob/4c3ece03c1bca5a309cf11d7e18bb1ab244870e4/electron/showhow/bundle.ts), [library](https://github.com/bedarstudios/showhow/blob/4c3ece03c1bca5a309cf11d7e18bb1ab244870e4/electron/showhow/recordingLibrary.ts), [transcription worker](https://github.com/bedarstudios/showhow/blob/4c3ece03c1bca5a309cf11d7e18bb1ab244870e4/src/lib/captioning/transcribe.worker.ts).

V2 introduces `NewEditorShell`, Axcut document migration, document-backed project state, native playback integration, and document-editing agent tools. Its chat is coupled to those tools and state. A cosmetic chat-panel port would not deliver equivalent editing. Sources: [shell](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/src/components/ai-edition/NewEditorShell.tsx), [project store](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/src/lib/ai-edition/store/projectStore.ts), [agent tools](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/electron/ai-edition/agent-tools.ts).

## Recommended intake matrix

“Adopt” means a candidate for focused verification and porting, not approval to import immediately.

| Area | Recommendation | Dependency and UI consequence |
|---|---|---|
| Save-dialog ownership | **Adopt candidate.** [PR #750](https://github.com/getopenscreen/openscreen/pull/750); [dialog helpers](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/electron/messageBox.ts). | Check each Showhow window owner. Save/export must stay reachable above its owning window. Narrower than an editor migration. |
| HUD capture exclusion | **Adopt candidate.** [PR #971](https://github.com/getopenscreen/openscreen/pull/971). | Verify the same lifecycle exists in Showhow. Native macOS proof must include recording after returning from the editor; source review cannot prove exclusion. |
| GIF cleanup and timing | **Adopt candidates.** [PR #651](https://github.com/getopenscreen/openscreen/pull/651), [PR #748](https://github.com/getopenscreen/openscreen/pull/748). | First check for matching exporter code and whether the fixes are absent. UI needs cancellation completion; output playback must match its duration. |
| AI editing/chat | **Adapt after engine decision.** [Chat service](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/electron/ai-edition/chat-service.ts). | Requires document operations, validation, undo and preview coherence. Design an editing-assistant entry point, but keep it distinct from guide/brief generation. Do not promise implementation parity from a dummy panel. |
| AI providers | **Adapt selected pieces.** [Provider registry](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/electron/ai-edition/provider-registry.ts). | Upstream ships API-key providers, including OpenRouter; it does not supply the agreed ChatGPT plan authentication. Showhow needs its own provider boundary and connection, expiry, failure and usage states. Do not revive removed first-party-client impersonation routes. |
| Transcription/alignment | **Evaluate and adapt.** [Native model manager](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/electron/stt/modelManager.ts), [clock/error contract](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/electron/stt/transcriptionContract.ts), [readable-error fix #973](https://github.com/getopenscreen/openscreen/pull/973). | Native Whisper, VAD, CTC alignment and model downloads are a different deployment path from current renderer transcription. Model setup/progress/storage and retry need UI. Measure accuracy and timestamp alignment before replacing current behaviour. |
| Click-based automatic zoom | **Adapt for eligible recordings.** [Shot planner](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/src/lib/ai-edition/timeline/zoom-suggestions.ts). | Needs timestamped recorded clicks. An ordinary MP4 has no such telemetry; do not offer identical click-driven behaviour or pretend clicks can be recovered from every import. |
| New timeline, framing, audio and export defaults | **Evaluate as grouped editor capabilities.** [V2 release](https://github.com/getopenscreen/openscreen/releases/tag/v2.0.0), [shell](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/src/components/ai-edition/NewEditorShell.tsx). | Include needed controls in the Pen inventory, styled as Showhow. Separate legacy-setting preservation from new-project defaults. Native preview/export changes need end-to-end parity checks, not only UI tests. |
| macOS system picker/audio; Windows/Linux capture | **Evaluate per platform.** [V2 release and linked fixes](https://github.com/getopenscreen/openscreen/releases/tag/v2.0.0). | Permission, source selection and recovery affect onboarding and recording screens. Import only with a target-platform proof plan; keep fallback paths. |
| CLI and MCP | **Defer.** [MCP settings](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/electron/mcp/mcp-settings-store.ts), [document host](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/electron/mcp/editor-document-host.ts), [CLI](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/docs/cli.md). | MCP defaults off and depends on document hosting. Neither is needed to copy a brief or bundle path; defer agent execution and automation setup screens. |
| Release infrastructure and product identity | **Exclude.** [Showhow intake policy](../../UPSTREAM.md) and [agent guide](../../AGENTS.md). | No upstream release pipeline, publishers, package identity or product-brand restoration. |

### Existing cursor assets deserve a focused audit

V2's release notes explicitly say 17 third-party cursor packs were removed because their terms do not permit redistribution. Showhow main's [cursor registry](https://github.com/bedarstudios/showhow/blob/4c3ece03c1bca5a309cf11d7e18bb1ab244870e4/src/lib/cursor/cursorThemes.ts) still references Sweezy packs, with images in `public/cursors/`. This is a grounded reason to audit the included assets and provenance before release. It is not a completed license determination or authorization to delete assets. Keep new mockups on built-in/original cursors while the inventory is reviewed.

## Proposed boundaries for the dummy-data build

These are design/architecture proposals, not implemented contracts:

- **Library:** list, import, rename, locate and remove managed bundles; expose operation state.
- **Media:** probe duration/codecs, read frames and local transcript, retain source timestamps.
- **Recording:** start/stop/cancel and return a saved recording regardless of documentation failure.
- **Editor:** open project, modify composition and export video through the selected engine.
- **Generation:** explicit guide/brief jobs using selected evidence; cancellable progress, editable drafts and retry that preserves edits.
- **Provider:** connection/capability state, credential handling outside renderer UI, and requests for supported evidence types.
- **Export/handoff:** PDF, brief text and bundle-path output with clear destination/result states.

Use deterministic in-memory adapters behind those boundaries first. This lets the newer dither design cover real states without coupling every screen to Electron IPC or the upstream document store. Validate interfaces against existing bundle and editor contracts before promoting them into production APIs.

## Decisions and future proof

**Owner decision, 2026-10-12:** generate guides and agent briefs from the original bundled recording and retain source-time references. Trimming, speed changes and reordered clips in an edited export must not change those references. Generating from the edited timeline is outside the first version; it would require an explicit timeline mapping and source label.

Preserve `.openscreen` reads without overwriting the legacy file, `.showhow` defaults for new saves, lossless legacy-location fallbacks, and `<video path>.cursor.json`. The [current bundle contract](https://github.com/bedarstudios/showhow/blob/4c3ece03c1bca5a309cf11d7e18bb1ab244870e4/docs/architecture/showhow-bundles.md) requires save behaviour to remain fail-open: documentation/transcription failure must not discard valid recordings.

Future acceptance must cover imported-original preservation and interrupted copies; old/new project round-trips; recording recovery after document failure; transcript/frame/timestamp agreement; generation cancellation and manual-edit retention; provider expiry and explicit retry without automatic duplicate requests; and preview/export correspondence. Use affected unit/browser suites plus native target-platform smoke tests. Test ChatGPT and OpenRouter with real authorized accounts separately from dummy-state evidence. The next design deliverable should explicitly include empty, loading, cancelled, failed, offline and completed states rather than only successful generation.

## Refresh: upstream main after v2.0.0

Refreshed 2026-10-12 against upstream `main` at [`9c55596e`](https://github.com/getopenscreen/openscreen/tree/9c55596e14b65d08a1a2c81a00cedd70dddd9be1). The v2.0.0 tag (`eff86dc`) sits on a release branch; `main` carries about 250 further commits since it branched at `69b791b5`. Showhow forked at `c2ba7504` (2026-07-12) and is 2,278 upstream commits behind, so most new commits assume v2 code Showhow does not have.

Method: read-only clone outside the repository, no remote added. Each non-docs, non-website, non-release commit was matched against Showhow's tree. 87 of 147 code commits touch no file Showhow has. For the candidates below, the matching Showhow code was read to confirm the defect is present. No fix was imported, built or run.

### Confirmed in Showhow source: small macOS recorder fixes

These three are present in Showhow's own code and can be ported as one focused ticket. Each needs a native macOS smoke test.

| Upstream | Defect | Showhow evidence |
|---|---|---|
| [`29736d4d`](https://github.com/getopenscreen/openscreen/commit/29736d4d9b71ce1dcc8b7a7b1f3c9a69e46a1c54) | With no audio input connected, the helper still asks ScreenCaptureKit for the microphone. The next take in the same session stalls, so the take after a Restart is lost. | `electron/native/screencapturekit/Sources/ShowhowScreenCaptureKitHelper/main.swift` sets `captureMicrophone` at the `request.audio.microphone.enabled` branch without checking `AVCaptureDevice.devices(for: .audio)`. |
| [`f261fa45`](https://github.com/getopenscreen/openscreen/commit/f261fa45db81a91d7024686f4ab50a2fe55996ec) | The HUD timer and cursor offset start when the IPC reply arrives, not at the file's first frame. | The helper already emits `timestampMs` with `recording-started`; `electron/ipc/handlers.ts` discards it (`waitForNativeMacCaptureStart` resolves `void`, then `captureStartedAtMs = Date.now()`). |
| [`52eda0e6`](https://github.com/getopenscreen/openscreen/commit/52eda0e6820d66633dcc5bd02abf551b3331a4e9) | A failed start leaves a 0-byte recording file, and Restart discards the previous take before the new one is confirmed. | The native-mac start `catch` in `electron/ipc/handlers.ts` does no file cleanup. `restartRecording` in `src/hooks/useScreenRecorder.ts` marks the take for discard before `startRecording()` resolves; confirm the loss path natively. |

Related, check before porting: [`798d590c`](https://github.com/getopenscreen/openscreen/commit/798d590c) (never record a microphone the OS does not list) and [`4e0b40cb`](https://github.com/getopenscreen/openscreen/commit/4e0b40cb) (refuse to start on a nearly full disk). Showhow has no disk-space check, and a full disk can cost a valid recording, which breaks the fail-open save rule.

### Changed from the v2.0.0 matrix

- **GIF and MP4 export fixes are not patch-portable.** Upstream export now runs in a Rust compositor (`crates/compositor`), which Showhow does not have. GIF #651, #748 and #952, and MP4 cancellation `c4e43e2c`/`f2012f99`, are behaviour references only. Keep their outcomes as acceptance criteria for Showhow's exporter: cancel works, and only a finished file is published.
- **MCP grew.** Upstream MCP now records, exports, reads exported frames at timestamps, sets pointer tracks and restores checkpoints (`cfea91ef`, `14147c88`, `18e407f8`, `b7e107d6`). This matters to the future agent-driven-demo direction, but it still depends on the v2 document host. **Defer** remains correct.
- **Licensing hygiene.** Upstream added a full `THIRD-PARTY-NOTICES.md`, ships licence texts in installers (`146fe920`) and credits Recordly helper code and Kenney click sounds. Showhow has only a 14-line `NOTICE.md`, which credits the upstream ancestor alone. See [Licensing inventory](#licensing-inventory).

### Design inputs for step 2

These are capabilities, not imports. Include them in the Pen inventory only where they serve the library → guide/brief flow.

- **Recordings folder choice** (`5d0ba750`, `c6db5bc2`, `d029d695`): library settings need a location control, and earlier recordings must stay reachable after the folder changes.
- **Per-project names and terms for transcription** (`13db77e5`): a glossary improves transcript accuracy, and so guide and brief quality. It belongs near generation settings, not the recorder.
- **Transcript word removal** (`1c5d1ec3`, `ad511255`): an editing-assistant capability. Keep it separate from guide/brief generation, as the matrix already says.
- **Export cancel and finished-file states**: the export sheet needs cancelling, cancelled and failed states.
- **Click sound and Glass Lens cursor** (`31a105ed`, `0cd0c9df`): optional editor polish. Click sound needs recorded clicks, so imported MP4s cannot offer it.

### Deferred or excluded

- **Defer until Windows can be tested natively:** WGC clock fixes (`e8b85444`, `4ebe3ce7`, `ebfec67e`), Windows on ARM builds, and skipping HUD content protection before Windows 11 22H2 (`5922656b`).
- **Defer (Showhow's documentation layer targets macOS):** Linux PipeWire, Wayland, X11 and AppImage work.
- **Exclude:** website, Product Hunt, Homebrew, Nix, release bumps, the evaluation workbench, and webcam mode selection (Showhow's webcam path differs; revisit only if a webcam defect is reported).

### Licensing inventory

A read-only source and packaging inventory was run on 2026-10-12. No installer was inspected, and none of this is a legal determination.

- **Cursor packs: release blocker.** `electron-builder.json5` copies all 17 packs under `public/cursors/` into installers. Each pack names `sweezy-cursors.com` as its source in `src/lib/cursor/cursorThemes.ts`, and none has a licence or terms file. They depict third-party characters and brands, among them Hello Kitty, Pokémon, Mickey Mouse, Naruto, Among Us and Roblox. Upstream removed 17 such packs in v2.0.0 because their terms forbid redistribution. Owner decision: remove them from shipped builds, or find redistribution terms for each pack first.
- **Unattributed shipped components:** web-demuxer and its FFmpeg-derived WASM (LGPL-2.1-or-later), ONNX Runtime Web, `@xenova/transformers` (Apache-2.0) and the Xenova/whisper-tiny model files. Showhow needs a `THIRD-PARTY-NOTICES.md` covering at least these.
- **Model download is unpinned.** `scripts/fetch-caption-model.mjs` downloads from `resolve/main`, so builds can bundle different model files with an unstated model licence. Pin a revision and record its licence.
- **Unknown provenance:** 18 wallpapers in `public/wallpapers/`, six PNGs in `public/` and the built-in SVG cursors in `src/assets/cursors/` have no provenance record. Fonts are covered by `src/assets/fonts/LICENSE.md` (OFL-1.1, plus Apache-2.0 for Permanent Marker).
- **Unclear packaging:** whether `onnxruntime-node` and `sharp`/libvips reach the installer. Check a built app.


## Refresh: 2026-10-16 — rc.3 and the separate shaping snapshot

This dated refresh supersedes earlier intake recommendations and policy descriptions above; their
bytes are retained as historical evidence. The approved move stays on Electron and uses upstream
as a release parent under [UPSTREAM.md](../../UPSTREAM.md). This is source research, not an import,
completed migration or native acceptance.

### Source identities and method

- Development tag `v2.1.0-rc.3` resolves to [`523a3e4c47cf7566cc5c759ad5275f7edcd3382e`](https://github.com/getopenscreen/openscreen/commit/523a3e4c47cf7566cc5c759ad5275f7edcd3382e).
- The separate shaping snapshot is [`bb4660b11d2e1f87f5f5fc57dd6acb14e248109f`](https://github.com/getopenscreen/openscreen/commit/bb4660b11d2e1f87f5f5fc57dd6acb14e248109f),
  subject `docs(testing): log the macOS pass of v2.1.0-rc.3`. It is not the rc.3 tag.
- The coordinator's 2026-10-16 factual clarification resolves the shorthand that paired rc.3 with
  `bb4660b1`. The [full upstream comparison](https://github.com/getopenscreen/openscreen/compare/523a3e4c47cf7566cc5c759ad5275f7edcd3382e...bb4660b11d2e1f87f5f5fc57dd6acb14e248109f)
  reports **diverged, 20 ahead / 9 behind** (shaping relative to rc.3). Neither pin is treated as
  identical to, or simply after, the other. A shallow-clone range log cannot establish that relationship.

Method: read both immutable trees in an external scratch clone; compare the files supporting the
five topics below. No current-main claims, remote added to Showhow, code import, model download,
app build or native smoke test. Raw source/command receipts and file hashes are retained in
`/Users/mohamedb/dev/loop-evidence/showhow-115/executor/` (`resume-topic-source-files.json`,
`resume-topic-source-hashes.json`, `resume-extra-source-files.json`, `resume-relevant-pin-diff.json`).

### Runtime and compositor binding

Both pins specify **Electron 41.2.1** (package line 163; only the package version differs in that
file: rc.3 versus 2.0.0). Sources: [rc.3](https://github.com/getopenscreen/openscreen/blob/523a3e4c47cf7566cc5c759ad5275f7edcd3382e/package.json#L163), [shaping](https://github.com/getopenscreen/openscreen/blob/bb4660b11d2e1f87f5f5fc57dd6acb14e248109f/package.json#L163).
The Rust compositor uses Metal and VideoToolbox on macOS; the `compositor-view-napi` crate
exports the napi-rs addon `compositor_view.node`, loaded by the Electron main-process
`CompositorViewService` and used for the live view. Sources: [rc.3](https://github.com/getopenscreen/openscreen/blob/523a3e4c47cf7566cc5c759ad5275f7edcd3382e/crates/compositor/Cargo.toml#L5), [shaping](https://github.com/getopenscreen/openscreen/blob/bb4660b11d2e1f87f5f5fc57dd6acb14e248109f/crates/compositor/Cargo.toml#L5); [rc.3](https://github.com/getopenscreen/openscreen/blob/523a3e4c47cf7566cc5c759ad5275f7edcd3382e/crates/compositor-view-napi/Cargo.toml#L5), [shaping](https://github.com/getopenscreen/openscreen/blob/bb4660b11d2e1f87f5f5fc57dd6acb14e248109f/crates/compositor-view-napi/Cargo.toml#L5); [rc.3](https://github.com/getopenscreen/openscreen/blob/523a3e4c47cf7566cc5c759ad5275f7edcd3382e/electron/native-bridge/services/compositorViewService.ts#L42), [shaping](https://github.com/getopenscreen/openscreen/blob/bb4660b11d2e1f87f5f5fc57dd6acb14e248109f/electron/native-bridge/services/compositorViewService.ts#L42).
These manifests and the bridge service are byte-identical at both pins. The compositor macOS
source differs by a diagnostic test reporting the Metal device; this does not change the runtime
choice or prove equivalent native behaviour. Source: [rc.3](https://github.com/getopenscreen/openscreen/blob/523a3e4c47cf7566cc5c759ad5275f7edcd3382e/crates/compositor/src/compositor_macos.rs#L3469), [shaping](https://github.com/getopenscreen/openscreen/blob/bb4660b11d2e1f87f5f5fc57dd6acb14e248109f/crates/compositor/src/compositor_macos.rs#L3469).
The runtime decision is settled Electron; a WebKit shell is not part of this move.

### Transcription engine and model download

Both pins use native whisper.cpp through `whisper-stt-server`, orchestrated by `electron/stt/`.
The default is multilingual **small**, `ggml-small-q8_0.bin`, fetched on demand from Hugging Face
`ggerganov/whisper.cpp` at revision `5359861c739e955e79d9a303bcbc70fb988958b1`.
The manager verifies SHA-256 and atomically renames partial downloads; cached valid files are
reused. It also manages Silero VAD and language-specific CTC aligners. Sources: [rc.3](https://github.com/getopenscreen/openscreen/blob/523a3e4c47cf7566cc5c759ad5275f7edcd3382e/electron/stt/modelManager.ts#L60), [shaping](https://github.com/getopenscreen/openscreen/blob/bb4660b11d2e1f87f5f5fc57dd6acb14e248109f/electron/stt/modelManager.ts#L60); [rc.3](https://github.com/getopenscreen/openscreen/blob/523a3e4c47cf7566cc5c759ad5275f7edcd3382e/electron/stt/index.ts#L242), [shaping](https://github.com/getopenscreen/openscreen/blob/bb4660b11d2e1f87f5f5fc57dd6acb14e248109f/electron/stt/index.ts#L242); [rc.3](https://github.com/getopenscreen/openscreen/blob/523a3e4c47cf7566cc5c759ad5275f7edcd3382e/electron/native/whisper-stt/CMakeLists.txt#L100), [shaping](https://github.com/getopenscreen/openscreen/blob/bb4660b11d2e1f87f5f5fc57dd6acb14e248109f/electron/native/whisper-stt/CMakeLists.txt#L100).
These files are identical at both pins; neither package manifest depends on `@xenova/transformers`.

Today's Showhow bundle transcript still uses its renderer Whisper-tiny pipeline. Task 2 preserves
that working pipeline. **Task 3 is planned** to adapt v2's native engine to bundle transcription
with a bundled quantised multilingual **base** model, preserving timestamped `transcript.txt`
and the `(transcription failed)` fail-open marker. Upstream's fixed small-model manager needs
adaptation for that approved bundled-base requirement; the native port is not already done.
Larger downloadable models remain a product requirement, not a claim that this snapshot already
has Showhow's planned model-selection flow.

### Project migration

Both pins provide bidirectional `EditorProjectData` ↔ `AxcutDocument` conversion; the forward
path creates document assets/clips and retains legacy editor settings before schema migration.
Sources: [rc.3](https://github.com/getopenscreen/openscreen/blob/523a3e4c47cf7566cc5c759ad5275f7edcd3382e/src/lib/ai-edition/document/migrate.ts#L100), [shaping](https://github.com/getopenscreen/openscreen/blob/bb4660b11d2e1f87f5f5fc57dd6acb14e248109f/src/lib/ai-edition/document/migrate.ts#L100); [rc.3](https://github.com/getopenscreen/openscreen/blob/523a3e4c47cf7566cc5c759ad5275f7edcd3382e/src/components/video-editor/projectPersistence.ts#L132), [shaping](https://github.com/getopenscreen/openscreen/blob/bb4660b11d2e1f87f5f5fc57dd6acb14e248109f/src/components/video-editor/projectPersistence.ts#L132). These files are identical at both pins.
They do not prove that Showhow's `fc50566a` fixtures survive opening and saving. Task 2 must prove
L1–L5 from the plan, including unchanged bytes on opening, non-overwriting `.openscreen` reads,
new `.showhow` save defaults, library/profile preservation and `<video path>.cursor.json`.
Upstream retains that sidecar convention: [rc.3](https://github.com/getopenscreen/openscreen/blob/523a3e4c47cf7566cc5c759ad5275f7edcd3382e/electron/cli/projectCommands.ts#L90), [shaping](https://github.com/getopenscreen/openscreen/blob/bb4660b11d2e1f87f5f5fc57dd6acb14e248109f/electron/cli/projectCommands.ts#L90).

### Cursor packs and notices

Both pins have **six named original packs plus the built-in default**: Studio Ink, Prism Glow,
Pop Coral, Pixel Candy, Star Sprout and Glass Lens. This is seven selectable themes, rather than
seven entries in `CURSOR_THEMES`. The registry explicitly attributes the former Sweezy-pack
removal to redistribution restrictions; it has no Sweezy pack entries. Source: [rc.3](https://github.com/getopenscreen/openscreen/blob/523a3e4c47cf7566cc5c759ad5275f7edcd3382e/src/lib/cursor/cursorThemes.ts#L136), [shaping](https://github.com/getopenscreen/openscreen/blob/bb4660b11d2e1f87f5f5fc57dd6acb14e248109f/src/lib/cursor/cursorThemes.ts#L136).

`THIRD-PARTY-NOTICES.md` is checked in; it is **not** the generated file. It covers native and
other bundled components, including whisper.cpp/ggml and Rust crates. npm licence texts are
compiled into **`THIRD-PARTY-LICENSES.txt`** by `licenses:generate`; packaging copies both.
Sources: [rc.3](https://github.com/getopenscreen/openscreen/blob/523a3e4c47cf7566cc5c759ad5275f7edcd3382e/THIRD-PARTY-NOTICES.md#L1), [shaping](https://github.com/getopenscreen/openscreen/blob/bb4660b11d2e1f87f5f5fc57dd6acb14e248109f/THIRD-PARTY-NOTICES.md#L1); [rc.3](https://github.com/getopenscreen/openscreen/blob/523a3e4c47cf7566cc5c759ad5275f7edcd3382e/scripts/generate-third-party-licenses.mjs), [shaping](https://github.com/getopenscreen/openscreen/blob/bb4660b11d2e1f87f5f5fc57dd6acb14e248109f/scripts/generate-third-party-licenses.mjs); [rc.3](https://github.com/getopenscreen/openscreen/blob/523a3e4c47cf7566cc5c759ad5275f7edcd3382e/electron-builder.json5#L130), [shaping](https://github.com/getopenscreen/openscreen/blob/bb4660b11d2e1f87f5f5fc57dd6acb14e248109f/electron-builder.json5#L130). Registry, notices, generator and packaging rules were
compared at both pins. Task 2 still must remove Showhow's 17 Sweezy packs and retain required
notices. This docs ticket removes no assets and establishes no installer licensing acceptance.

### Showhow-layer features and v2 counterparts

The counterpart findings apply to **both pins**, not to an integrated Showhow build. The upstream
App uses `AiEditionShell`, and neither tree contains the Showhow-owned bundle/library directories.
The targeted source search found no `steps.json`, `steps.md` or `transcript.txt` contract in either
upstream tree. Sources: [rc.3](https://github.com/getopenscreen/openscreen/blob/523a3e4c47cf7566cc5c759ad5275f7edcd3382e/src/App.tsx#L21), [shaping](https://github.com/getopenscreen/openscreen/blob/bb4660b11d2e1f87f5f5fc57dd6acb14e248109f/src/App.tsx#L21); [rc.3](https://github.com/getopenscreen/openscreen/blob/523a3e4c47cf7566cc5c759ad5275f7edcd3382e/src/lib/ai-edition/document/migrate.ts#L100), [shaping](https://github.com/getopenscreen/openscreen/blob/bb4660b11d2e1f87f5f5fc57dd6acb14e248109f/src/lib/ai-edition/document/migrate.ts#L100); [rc.3](https://github.com/getopenscreen/openscreen/blob/523a3e4c47cf7566cc5c759ad5275f7edcd3382e/electron/stt/index.ts#L242), [shaping](https://github.com/getopenscreen/openscreen/blob/bb4660b11d2e1f87f5f5fc57dd6acb14e248109f/electron/stt/index.ts#L242); [rc.3](https://github.com/getopenscreen/openscreen/blob/523a3e4c47cf7566cc5c759ad5275f7edcd3382e/electron/ai-edition/provider-registry.ts#L32), [shaping](https://github.com/getopenscreen/openscreen/blob/bb4660b11d2e1f87f5f5fc57dd6acb14e248109f/electron/ai-edition/provider-registry.ts#L32); the two tree/search receipts above.
Current Showhow sources are pinned at [the ticket base](https://github.com/bedarstudios/showhow/tree/a06da359287213c1d328dbe444658f1f1908ee4c).

| Current Showhow layer / planned surface | Counterpart at both upstream pins | Migration consequence |
|---|---|---|
| Recoverable folder bundle, video/cursor sidecars and `meta.json` | Recording/project media and cursor sidecars; no Showhow bundle contract | Port `electron/showhow/bundle.ts` in Task 2; a documentation failure must still save valid video. |
| Timestamped `transcript.txt`, renderer Whisper-tiny and fail-open marker | Native STT, document transcripts and captions; no bundle text contract | Preserve current behaviour in Task 2; adapt native STT to the bundle format in Task 3. |
| Deterministic click screenshots, `steps.json`/`steps.md`, regenerate/edit | Document editing and transcript/caption tools; no deterministic workflow-document counterpart | Port the existing doc engine; AI editor operations do not replace it. |
| Recording library, doc view, seekable timestamps, Copy path, bundle media serving | Editor/project opening; no Showhow bundle library or copy-path handoff | Port library/readers/media protocol and workflow editing in Task 2. |
| Browser companion bridge and page-aware step capture | No Showhow companion protocol counterpart | Task 2 deletes companion code and tests as approved; not deleted here. |
| Showhow components, design tokens, branding and legacy persistence | Upstream editor/HUD/recorder and their styles/settings | Task 2 retains identity and compatibility; upstream screens get themes and slots, not component restructuring. |
| Planned one-button AI guide, Copy for agent brief, PDF export and library MP4 import | No Showhow guide/brief/PDF/import workflow; AI editor and API-key provider registry supply only partial building blocks | These redesigned V1 features remain later work. Upstream OpenRouter support is not ChatGPT plan sign-in. |
| Planned editor with AI assistant | Document-bound AI editing and provider configuration | Task 2 takes the upstream assistant, optional and off until configured; no new provider boundary is built here. |

The shaping snapshot has chat rewind identity handling absent from rc.3 (`userMessageId` and
`adoptStoredUserMessage`); do not infer exact assistant behaviour parity from shared architecture.
Sources: [rc.3](https://github.com/getopenscreen/openscreen/blob/523a3e4c47cf7566cc5c759ad5275f7edcd3382e/electron/ai-edition/chat-service.ts#L484), [shaping](https://github.com/getopenscreen/openscreen/blob/bb4660b11d2e1f87f5f5fc57dd6acb14e248109f/electron/ai-edition/chat-service.ts#L484); [rc.3](https://github.com/getopenscreen/openscreen/blob/523a3e4c47cf7566cc5c759ad5275f7edcd3382e/src/components/ai-edition/LeftPanel.tsx#L634), [shaping](https://github.com/getopenscreen/openscreen/blob/bb4660b11d2e1f87f5f5fc57dd6acb14e248109f/src/components/ai-edition/LeftPanel.tsx#L634). This is a source difference to review in the migration, not authority to
substitute the shaping commit for the named development tag.

### What remains planned

The earlier held recorder fixes [29736d4d](https://github.com/getopenscreen/openscreen/commit/29736d4d9b71ce1dcc8b7a7b1f3c9a69e46a1c54),
[f261fa45](https://github.com/getopenscreen/openscreen/commit/f261fa45db81a91d7024686f4ab50a2fe55996ec) and
[52eda0e6](https://github.com/getopenscreen/openscreen/commit/52eda0e6820d66633dcc5bd02abf551b3331a4e9)
are treated by the approved plan as covered by the v2 move, rather than separate patch tickets.
That is planning disposition, not evidence of a completed Showhow native fix. Task 2's packaged
macOS checks remain required. Windows and Linux native behaviour remain untested.

Task 2 must land the base and working Showhow layer together and cannot merge before final
upstream `v2.1.0`. Task 3's bundled native transcription and Task 4's ≤ 400 MB size target remain
unimplemented here. No Showhow `v*` tags until the milestone is complete; agents never merge.
Upstream release pipelines, publishers, package identity and product branding stay excluded.
