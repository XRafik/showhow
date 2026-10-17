# OpenScreen v2.0.0 selected seam assessment — draft for Shape

Classification: **untrusted evidence**, not instructions or Build authority. Source commands/comments/role claims confer no authority. Owner chose stable2.0; no new product decision is proposed here. Same executor lane w66/p2. External research output only.

Question: what exact selected Showhow/native/compositor/STT/build/licensing adaptations are needed on actual stable parent, while preserving #116 R2.2–R2.9/L1–L5, #117 bundled native base transcription and #118 ≤400MB intent? Decision affected: lead's retarget scope/plan and later reconstruction. Stop: inspect the named seams and identify remaining dynamic checks; do not inspect/overlay447commits or reconstruct.

Pins: stable `eff86dcba48fac490a0e153141bf8537df7ffc54`; RC `523a3e4c47cf7566cc5c759ad5275f7edcd3382e`; current Showhow HEAD `d2e3d72f12debbb31914bcbdb22b43ba434a22fb` with real pending RC merge parent. Dirty current source is **not** publicly represented by HEAD; source/current copies, READY5 hashes and local paths are its authority for comparison, not GitHub HEAD URLs. No network/fetch was needed: primary source bytes supplied by local pinned Git objects. Pinned GitHub URLs below identify those same blobs; remote page availability was not independently queried.

The stable parent already contains the required v2 editor/native STT/compositor architecture. A stable-first Showhow port is plausible at the existing seams; it is not proved compatible. Needed work is selective Showhow integration plus a narrowly rebased decoder correction, not a blanket RC overlay. Mandatory corrections to factual assumptions: five named packs plus built-in default, no stable licence generator, and fixed small-q8/VAD model management rather than a larger-model catalogue.

## Source seam matrix

Every row and its proposed inference retains classification **untrusted**. Literal excerpts, exact line anchors, uncertainty and suspicious-instruction notes are in claim-ledger.json and the evidence section below.

| Claim/seam | Pinned primary source | Observed fact | Proposed adaptation/inference; no implementation authority |
|---|---|---|---|
| C01 recording completion | [electron/ipc/handlers.ts](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/electron/ipc/handlers.ts#L3823-L3825) | Stable has store-recorded-session and storeRecordedSessionFiles returning a flat RecordingSession; native mac stop separately publishes its own session. | Retain stable finalize/repair/stop sequencing; wire finishShowhowRecording after valid media and before publishing/manifest/media registration at each mac/renderer completion. Keep bundle helpers in electron/showhow, not copied RC handler bodies. |
| C02 cursor sidecar ordering | [electron/ipc/handlers.ts](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/electron/ipc/handlers.ts#L3454-L3456) | Stable writes the conventional cursor sidecar before publishing a streamed session. Native stop also writes <screenVideoPath>.cursor.json. | Preserve names, time offsets, write-before-publish order and sidecar moves. Do not overlay RC export/click-sound/native stop changes. |
| C03 native helper discovery | [electron/native/screencapturekit/Package.swift](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/electron/native/screencapturekit/Package.swift#L6-L9) | Stable SwiftPM explicitly maps executable targets to OpenScreen-named source directories and retains OpenScreenCaptureCore. | Classify helper discovery vs product-visible identity; if retaining current Showhow executable names, pair Package.swift products/targets/paths with actual moved Swift files, build script, discovery and packaging. Do not rename the core module merely for branding. |
| C04 native build identity | [scripts/build-macos-screencapturekit-helper.mjs](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/scripts/build-macos-screencapturekit-helper.mjs#L16-L18) | Build script names and target arch tags are independent of appId/productName. | Port coherent helper naming/discovery only; build from stable sources. Preserve OPENSCREEN_MAC_HELPER_ARCHS read compatibility. |
| C05 flat recording location | [electron/main.ts](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/electron/main.ts#L116-L116) | Stable flat recordings live under app userData/recordings; Showhow bundle root is a separate owned-home contract. | Preserve old flat/profile reads and owned bundle root; port library startup/media protocol/identity bootstrap. Current RC RecordingsDirManager is not demonstrated necessary on stable. |
| C06 session fields | [src/lib/recordingSession.ts](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/src/lib/recordingSession.ts#L18-L20) | Stable RecordingSession includes createdAt and ProjectMedia; it has no Showhow job fields. | Port Showhow-only job fields/normalization/completion helpers and preload contracts. Library reopening must restore pending fields from transcript marker after containment validation; keep completed/missing/unreadable cases fail-open. |
| C07 legacy file extension | [electron/ipc/handlers.ts](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/electron/ipc/handlers.ts#L149-L149) | Stable defaults to openscreen and loadProjectFileFromPath rejects extensions other than that constant. | Port explicit .showhow/.openscreen reads, never-overwrite-on-open, new .showhow save defaults and trust/media-root behavior. Do not simply change the constant and drop legacy reads. |
| C08 v2 editor and migration | [src/components/ai-edition/NewEditorShell.tsx](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/src/components/ai-edition/NewEditorShell.tsx#L14-L15) | Stable already imports legacy project migration and uses the v2 editor store. | Reuse stable editor/migrator; connect Showhow library recording session. Port Showhow transcript/theme wrappers only. Legacy fixture bytes/media/trust/metadata readiness must be proved, not inferred. |
| C09 native GIF architecture | [src/components/ai-edition/ExportDialog.tsx](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/src/components/ai-edition/ExportDialog.tsx#L419-L421) | Stable export already invokes exportGifNative after pickExportSavePath. | Retain native exporter. Adapt verifier locators/isolation/content assertions to stable controls only if they differ; do not restore old renderer GIF writer. |
| C10 theme ownership | [src/styles/design-tokens.css](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/src/styles/design-tokens.css#L1-L4) | Stable provides editor tokens; Showhow colors/type/radius can be mapped at CSS wrapper seam. | Port owned upstreamTheme.css and imports, preserve Showhow screens/no upstream component restructure. Actual HUD/editor/recorder screenshots still needed. |
| C11 cursor pack inventory | [src/lib/cursor/cursorThemes.ts](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/src/lib/cursor/cursorThemes.ts#L234-L234) | Stable has five named themes studio-ink, prism-glow, pop-coral, pixel-candy, star-sprout plus built-in default. RC adds glass-lens. | Use actual stable inventory; do not backport glass-lens to satisfy the stale seven-pack description. Remove companion/Sweezy from Showhow; source/package absence proof required. |
| C12 CLI/MCP defaults | [electron/main.ts](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/electron/main.ts#L1423-L1423) | Stable starts the MCP controller conditionally; App.tsx contains cli-export/record/sources/captions routes. | Retain Showhow disabled startup/UI/routes as approved; no need to copy later RC command features. |
| C13 decoder fallback gap | [crates/compositor/src/pipeline_macos.rs](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/crates/compositor/src/pipeline_macos.rs#L288-L294) | Stable chooses CPU presenter only when initial hardware-device creation fails; next/commit_peek use self.cpu rather than each received frame format. | Required candidate adaptation: selectively rebase current frame-format dispatch plus retained GPU, current/held/lookahead/seek handling and real uses_videotoolbox reporting. The corresponding Decoder region is byte-identical stable vs RC, so this is not already fixed in stable. No global force-software policy. |
| C14 decoder hardware control | [crates/compositor/src/pipeline_macos.rs](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/crates/compositor/src/pipeline_macos.rs#L566-L568) | Stable reports hardware via cpu.is_none(), not received AVFrame format. | Same-module VP9 preview/export regression plus real H264 VT control and held/lookahead/seek checks belong in pipeline_macos.rs; reuse exact authentic VP9 and approved H264 fixture bytes with provenance. |
| C15 STT public request | [electron/stt/transcriptionContract.ts](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/electron/stt/transcriptionContract.ts#L117-L117) | Stable SttManager.transcribe accepts samples or sourcePath and returns timestamped phrases/words; native extraction is already available. | Keep116 renderer Whisper-tiny job. In117 implement owned main-process bundle job via SttManager.transcribe({sourcePath,...}), format with unchanged transcriptFormat and fail-open marker. Do not import RC glossary/prompt work for this requirement. |
| C16 fixed model manager | [electron/stt/modelManager.ts](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/electron/stt/modelManager.ts#L30-L30) | Stable model IDs are whisper and silero-vad, with fixed ggml-small-q8_0.bin; no selectable larger-model API was observed in this inspected contract. | Truthful preservation target is the existing pinned small-q8 download/cache and optional CTC behavior, alongside bundled base fallback. Do not claim an existing menu/catalogue. New model UI is not needed or authorised. |
| C17 mandatory model preparation | [electron/stt/index.ts](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/electron/stt/index.ts#L244-L246) | Stable prepare() ensures whisper plus VAD before starting server; modelPaths then supplies both paths. Optional CTC acquisition can run after language detection. | Bundled lookup alone must resolve a matching descriptor/hash for whisper AND local VAD, not merely change a returned filename. Prefer coherent resolution/ensure in modelManager.ts preserving signatures; only add index.ts scope if selecting bundled mode/optional alignment cannot be expressed there. |
| C18 base model DTW seam | [electron/native/whisper-stt/src/main.cpp](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/electron/native/whisper-stt/src/main.cpp#L344-L345) | Stable native helper hard-codes WHISPER_AHEADS_SMALL although model path is an argument. | Propose exact additional path electron/native/whisper-stt/src/main.cpp for model-aware DTW preset, with existing scripts/test-whisper-stt.mjs integration coverage. Validate base and existing small against actual pinned whisper.cpp before implementation; source alone does not prove a load failure. |
| C19 compositor build prerequisites | [scripts/build-macos-compositor-addon.mjs](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/scripts/build-macos-compositor-addon.mjs#L91-L93) | Stable compositor build requires ~/.cargo/bin/cargo, MAC_FFMPEG_DIR or pinned LGPL8.1.2 SDK, produces/stages native .node and shared libraries. Script bytes equal RC. | Retain stable script/ABI dependencies. Prior isolated tools/SDK can be inputs only after provenance/compatibility check; no RC binary reuse proof, no GPL substitute, no blanket crates/Cargo.lock overlay. |
| C20 packaging model absence | [electron-builder.json5](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/electron-builder.json5#L118-L120) | Stable packages native helpers/notices but explicitly does not bundle a STT model. Its beforePack requires compositor/FFmpeg/ONNX/STT payload. | Add exact pinned base model and any mandatory local VAD resource in117; retain required native dependencies in118. Measure stable-derived post117 baseline before applying audit/trim; <=400MB remains a target, not source-proved. |
| C21 stable build scripts | [package.json](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/package.json#L36-L36) | Stable package scripts have no licenses:generate; build:mac runs capture helper, FFmpeg, ONNX and compositor, but not STT source build. | Keep Showhow single release workflow and exclusions; wire required stable native/STT steps and host arch without restoring upstream publisher workflows. Calling licenses:generate on stable is an undefined-script defect unless explicitly added. |
| C22 RC licence generation is additive | [scripts/generate-third-party-licenses.mjs](https://github.com/getopenscreen/openscreen/blob/523a3e4c47cf7566cc5c759ad5275f7edcd3382e/scripts/generate-third-party-licenses.mjs#L24-L24) | RC introduces generated build-licenses/THIRD-PARTY-LICENSES.txt; this file/script contract is absent stable, whose checked-in THIRD-PARTY-NOTICES.md is packaged as-is. | If retaining approved generation intent, explicitly propose selective generator+same-package node-test+beforePack guard/package script/resources/workflow wiring. Do not invent a stable generator or misname the checked-in notices. This is a narrow adaptation proposal, not authority to backport the rest of RC. |

## Required versus already present versus unnecessary

**Already present at stable:** v2 AiEditionShell/NewEditorShell and legacy migrator, native GIF export, streamed recording finalization/container repair, cursor-before-publish sequencing, macOS capture/cursor helpers and core, native STT path/sample APIs, fixed small-q8/VAD/CTC model machinery, FFmpeg/ONNX/compositor prerequisites and beforePack payload guards. Preserve these, adapt named public seams; do not overwrite them with RC bodies.

**Required Showhow port proposals:** identity/bootstrap and legacy persistence reads; library home and constrained bundle/media APIs; recording completion helper and fail-open valid media; dual extension reads/save defaults; pending renderer transcript job lifecycle on fresh recording AND library resume; tokens/CSS wrappers; companion/Sweezy deletion; CLI/MCP disabling; authentic fixture/profile+session-storage proof. Current owned implementations are design/reference material to rebase onto stable. Existing RC tests/passes do not become stable runtime evidence.

**Decoder:** stable Decoder block from `pub struct Decoder` through the methods before `uses_videotoolbox` is byte-identical to RC (ignoring the preceding RC export guard additions by comparing the literal region). Thus the underlying hardware-device-success/software-frame branch gap is present, not already fixed. Rebase only current received-frame-format presentation/GPU/current-frame reporting and same-module regression work. Existing CPU presenter and VT path are already present; never force software globally. RC cancellation OutputGuard/PacketGuard, cancellable MP4 machinery, click-sound mixing and other later native changes are unnecessary to this specific correction and must not be imported just because they share pipeline_macos.rs. Stable RED→GREEN and real default legacy VP9/H264 packaged proof remain future Build checks.

**Not demonstrated necessary:** RC custom-recordings-dir manager, export cancellation/audio click features, prompt/glossary STT changes, Windows-arm64 expansion, updater/publisher changes, sixth glass-lens cursor theme, wholesale Cargo manifest/lock/native helper overlays. No claim that every such feature is defective; the bounded requirements do not justify them.

## Exact scope proposals for lead consideration

These are proposed additions/narrowings, not source approval and not an implementation plan. Original owned Showhow paths remain the place for new business logic; handlers are wiring/identity only.

- #116 retain the five previously owner-approved extension paths as **retarget proposals requiring lead/owner confirmation of stable applicability**: `crates/compositor/src/pipeline_macos.rs` (same-module decoder correction/tests); `scripts/verify-showhow-export.mjs`, `scripts/verify-showhow-export.node-test.mjs`, `docs/testing/verification-recipe.md` (stable native export locators plus retained strict isolation/content/cleanup); `.github/workflows/build.yml` (Showhow host arch/native dependencies, existing release policy). This read-only retarget is not Build go-ahead.
- #116 licensing generation is **new to stable**: exact candidate additions `scripts/generate-third-party-licenses.mjs`, `scripts/generate-third-party-licenses.test.mjs`, and `scripts/before-pack.cjs` (generation presence guard only). Existing owned `package.json`, `electron-builder.json5`, `.github/workflows/build.yml`, `THIRD-PARTY-NOTICES.md`/notice inputs must wire/attribute the generated `build-licenses/THIRD-PARTY-LICENSES.txt`. The generator script/node-test's actual RC paths and dependencies must be selected explicitly; do not add undefined npm calls. If lead chooses the existing static-only stable contract instead, R2.8 generation acceptance must be explicitly corrected by Shape/owner, not silently called done.
- #116 stable native capture/cursor helper identifiers and discovery are **preserved**, per lead's clarified direction. No helper rename/Swift source overlay is proposed. Existing upstream `OpenScreenCaptureCore`, executable/target/directory pairing, `OPENSCREEN_*` helper overrides and binaries remain classified internal/discovery identifiers; Showhow app/product identity is separate. Only if a demonstrated Showhow persistence/override compatibility case demands it, propose a mapped fallback in `electron/native-bridge/helperIdentity.ts`/`.test.ts`, `electron/native-bridge/screen/macScreenAccess.ts` and `electron/native-bridge/cursor/recording/macNativeCursorRecordingSession.ts` with same-package tests. Do not add those paths for naming polish. Stable and RC cursor Swift both use `.cgSessionEventTap` (line37); current Showhow uses `.cghidEventTap`. That current functional native change is **not required by the retarget evidence** and must not be swept into a stable helper overlay. Actual cursor/TCC behavior remains future target-macOS proof.
- #117 known original `electron/stt/modelManager.ts` should resolve bundled base and local VAD consistently for `modelPaths` AND `ensureModels` with matching pinned digests; retain fixed small-q8 cache/download support. `modelManager.test.ts` is required same-package coverage. Merely overriding path after `ensureModels` would still require small download first. No larger-model UI is supported by the inspected manager. R3.6 should truthfully preserve existing pinned small/VAD/CTC behavior while adding bundled base fallback, subject to owner wording approval.
- #117 **proposed additional native path** `electron/native/whisper-stt/src/main.cpp`: hard-coded SMALL DTW preset must be assessed against actual base model; authorise only a model-aware preset correction if the pinned API demonstrates need. Use existing `scripts/test-whisper-stt.mjs` for same-helper base/small integration proof; do not claim lookup-only scope proves base compatibility. No new UI. `electron/stt/index.ts`/`index.test.ts` are conditional additions only if offline/model selection cannot be expressed coherently through modelManager's existing interface; source inspection does not yet require them. Optional CTC network attempts must not block offline bundle transcription. No RC prompt/glossary backport.
- #117 renderer removal paths should reference the actual selected #116-owned `src/lib/showhow/whisperTiny/**`, its imports, Vite worker/aliases and caption asset script; stale `src/lib/captioning/**` alone would miss the moved pipeline. Keep116 on renderer tiny until117 is authorised and implemented. Format/failure semantics remain unchanged.
- #118 no new scope justified by static inspection: retain existing audit/config paths, ≤400MB installed macOS arm64 model-included target, post117 untrimmed baseline and actual package-dependent allow-list. Stable already excludes node_modules broadly and already narrows Chromium locales; an assumption that reapplying RC trim yields the budget is unsupported. Keep native .node/FFmpeg/shared STT libraries/ONNX/unpacked dependencies actually loaded. No early trim or dependency-section reshuffle. No size estimate is a PASS.

## Required future dynamic checks and uncertainty

No Build/tests/install/GUI/capture/permissions/fetch/index writes were run here. Presence ≠ compatibility. Future stable-derived raw merge/Showhow adaptation needs fresh RED/GREEN at named seams, independently of retained RC proof:

1. L1/L2 authentic fc50566a `.showhow`/`.openscreen` originals unchanged after actual content-ready open, new `.showhow` save, correct trust/media roots and default native GIF full decode/palette. Wait for NEW project ID/file and metadata, not stale toast. Include decoder VP9 preview/export/hold/lookahead/seek plus actual H264 VT control, unpatched meaningful RED first.
2. L3/L4 copied synthetic bundle/profile **and separate sessionData/Local Storage** survival; legacy preferences such as vertical tray layout; contained library open and pending transcript resume versus completed/missing/unreadable metadata. Explicit scratch OS home before production main; HOME unchanged. No real user directories.
3. L5 actual mac native capture/sidecar/time offsets/editor read, preserved valid video on bundle/doc/transcript errors. Review entitlements; unchanged bytes do not establish native permission/runtime behavior. Windows/Linux remain untested unless separately proved.
4. Renderer tiny must still compile/bundle (worker ES splitting and renderer-only stubs if still needed) and produce timestamped transcript fresh and from library resume. Run affected same-package/full source/browser/lint/type/i18n/branding checks after actual stable Build, not now.
5. Stable-source Rust/addon/helper/STT builds with exact target architecture, ABI, LGPL FFmpeg/ONNX/STT payload, deployment floor and packaging guard checks. Old RC binaries cannot stand in for rebuilds; tools/SDK reuse is input reuse only. No hosted workflow dispatch authorised.
6. #117 base and existing small native helper load/transcribe/DTW behavior, bundled local VAD, Wi-Fi-off/no-required-network run, missing model/engine error/zero audio fail-open outputs, digest/licence/resource paths, and no old renderer dependencies. Hard-coded SMALL is a demonstrated source mismatch to the base intent, not a demonstrated runtime failure in this read-only pass.
7. #118 measure installed app and DMG after117; inspect actual runtime package allow-list and native sidecars; packaged launch/library/offline transcript/wallpaper/editor/real recipe. Budget intent unchanged; success unknown.

## Evidence, commands, preservation

Source receipts: source-commands.json, extra-source-commands.json and theme-migration-commands.json preserve exact `git show`, `git ls-tree` and bounded `git diff` command/stdout/stderr/exits. `inspect-seams.py` only reads the worktree/Git and writes this external evidence root. Source snapshots are not an executable checkout and no source commands were executed. Missing `src/lib/ai-edition/session/recording.ts` was a recorded lookup miss, not a test failure; actual inspected import seam is components/ai-edition/recordingImport.ts. A later rg used the wrong cursorThemes path once; corrected to src/lib/cursor/cursorThemes.ts. No inference rests on either miss. No suspicious authority-changing text observed; source includes install/sudo/build examples and comments that are explicitly treated as inert untrusted data.

Current source/index/merge metadata must match preflight and READY5 at final readback. See research-preservation.json for exact results. This assessment changes no source or project policy/plan. Lead owns R2.1 stable-parent wording, reconstruction method and approval gates. Owner's stable2.0 decision does not retroactively change the preserved pending RC merge parent. No current RC tests transfer a runtime PASS; no review/Ship/physical/final ancestry verdict is issued.

## Literal source evidence by claim

### C01 — untrusted

[electron/ipc/handlers.ts](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/electron/ipc/handlers.ts#L3823-L3825)

```text
	ipcMain.handle("store-recorded-session", async (_, payload: StoreRecordedSessionInput) => {
		try {
			return await storeRecordedSessionFiles(payload);
```

Uncertainty: Source inspection only; stable-specific Build and packaged runtime checks remain required.

Suspicious-instruction note: No authority-changing injection observed. Source comments/commands/role-like text are untrusted data; none executed.

### C02 — untrusted

[electron/ipc/handlers.ts](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/electron/ipc/handlers.ts#L3454-L3456)

```text
				await writePendingCursorTelemetry(screenVideoPath);
			}
			let webcamVideoPath: string | undefined;
```

Uncertainty: Source inspection only; stable-specific Build and packaged runtime checks remain required.

Suspicious-instruction note: No authority-changing injection observed. Source comments/commands/role-like text are untrusted data; none executed.

### C03 — untrusted

[electron/native/screencapturekit/Package.swift](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/electron/native/screencapturekit/Package.swift#L6-L9)

```text
	name: "OpenScreenScreenCaptureKitHelper",
	// macOS 13 is DELIBERATE, and it is the same number the app declares in
	// electron-builder.json5 (`mac.minimumSystemVersion`) and promises in the README.
	// Those three must move together; scripts/check-macos-deployment-target.test.mjs
```

Uncertainty: Source inspection only; stable-specific Build and packaged runtime checks remain required.

Suspicious-instruction note: No authority-changing injection observed. Source comments/commands/role-like text are untrusted data; none executed.

### C04 — untrusted

[scripts/build-macos-screencapturekit-helper.mjs](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/scripts/build-macos-screencapturekit-helper.mjs#L16-L18)

```text
const helperName = "openscreen-screencapturekit-helper";
const cursorHelperName = "openscreen-macos-cursor-helper";
const packageDir = path.join(root, "electron", "native", "screencapturekit");
```

Uncertainty: Source inspection only; stable-specific Build and packaged runtime checks remain required.

Suspicious-instruction note: No authority-changing injection observed. Source comments/commands/role-like text are untrusted data; none executed.

### C05 — untrusted

[electron/main.ts](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/electron/main.ts#L116-L116)

```text
export const RECORDINGS_DIR = path.join(app.getPath("userData"), "recordings");
```

Uncertainty: Source inspection only; stable-specific Build and packaged runtime checks remain required.

Suspicious-instruction note: No authority-changing injection observed. Source comments/commands/role-like text are untrusted data; none executed.

### C06 — untrusted

[src/lib/recordingSession.ts](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/src/lib/recordingSession.ts#L18-L20)

```text
export interface RecordingSession extends ProjectMedia {
	createdAt: number;
}
```

Uncertainty: Source inspection only; stable-specific Build and packaged runtime checks remain required.

Suspicious-instruction note: No authority-changing injection observed. Source comments/commands/role-like text are untrusted data; none executed.

### C07 — untrusted

[electron/ipc/handlers.ts](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/electron/ipc/handlers.ts#L149-L149)

```text
const PROJECT_FILE_EXTENSION = "openscreen";
```

Uncertainty: Source inspection only; stable-specific Build and packaged runtime checks remain required.

Suspicious-instruction note: No authority-changing injection observed. Source comments/commands/role-like text are untrusted data; none executed.

### C08 — untrusted

[src/components/ai-edition/NewEditorShell.tsx](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/src/components/ai-edition/NewEditorShell.tsx#L14-L15)

```text
	migrateProjectDataToAxcutDocument,
	migrateRawDocumentToCurrent,
```

Uncertainty: Source inspection only; stable-specific Build and packaged runtime checks remain required.

Suspicious-instruction note: No authority-changing injection observed. Source comments/commands/role-like text are untrusted data; none executed.

### C09 — untrusted

[src/components/ai-edition/ExportDialog.tsx](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/src/components/ai-edition/ExportDialog.tsx#L419-L421)

```text
						? await exportGifNative(
								exportClips,
								pickedPath,
```

Uncertainty: Source inspection only; stable-specific Build and packaged runtime checks remain required.

Suspicious-instruction note: No authority-changing injection observed. Source comments/commands/role-like text are untrusted data; none executed.

### C10 — untrusted

[src/styles/design-tokens.css](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/src/styles/design-tokens.css#L1-L4)

```text
/* OpenScreen design system — light + dark.
 * Single source of truth for tokens used by the new editor shell.
 * Mint #10b981 is the sole chromatic accent. Red is reserved for
 * REC / cut / skip / trim / transcript-highlight only. */
```

Uncertainty: Source inspection only; stable-specific Build and packaged runtime checks remain required.

Suspicious-instruction note: No authority-changing injection observed. Source comments/commands/role-like text are untrusted data; none executed.

### C11 — untrusted

[src/lib/cursor/cursorThemes.ts](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/src/lib/cursor/cursorThemes.ts#L234-L234)

```text
		id: "star-sprout",
```

Uncertainty: Source inspection only; stable-specific Build and packaged runtime checks remain required.

Suspicious-instruction note: No authority-changing injection observed. Source comments/commands/role-like text are untrusted data; none executed.

### C12 — untrusted

[electron/main.ts](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/electron/main.ts#L1423-L1423)

```text
	void mcpController.startIfEnabled();
```

Uncertainty: Source inspection only; stable-specific Build and packaged runtime checks remain required.

Suspicious-instruction note: No authority-changing injection observed. Source comments/commands/role-like text are untrusted data; none executed.

### C13 — untrusted

[crates/compositor/src/pipeline_macos.rs](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/crates/compositor/src/pipeline_macos.rs#L288-L294)

```text
            let cpu = if r != 0 {
                // Pas de VideoToolbox sur ce codec : fallback software. `get_format` est
                // laissé à NULL (libavcodec choisit son format de sortie, ici NV12 via
                // `*->sw_pix_fmt` = `AV_PIX_FMT_NV12` ou autre). `mac_frames::CpuFrames`
                // convertit alors vers NV12 + CVPixelBufferRef.
                (*dctx).thread_count = 0;
                Some(crate::mac_frames::CpuFrames::new(gpu)?)
```

Uncertainty: Source inspection only; stable-specific Build and packaged runtime checks remain required.

Suspicious-instruction note: No authority-changing injection observed. Source comments/commands/role-like text are untrusted data; none executed.

### C14 — untrusted

[crates/compositor/src/pipeline_macos.rs](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/crates/compositor/src/pipeline_macos.rs#L566-L568)

```text
    pub fn uses_videotoolbox(&self) -> bool {
        self.cpu.is_none()
    }
```

Uncertainty: Source inspection only; stable-specific Build and packaged runtime checks remain required.

Suspicious-instruction note: No authority-changing injection observed. Source comments/commands/role-like text are untrusted data; none executed.

### C15 — untrusted

[electron/stt/transcriptionContract.ts](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/electron/stt/transcriptionContract.ts#L117-L117)

```text
	samples?: Float32Array;
```

Uncertainty: Source inspection only; stable-specific Build and packaged runtime checks remain required.

Suspicious-instruction note: No authority-changing injection observed. Source comments/commands/role-like text are untrusted data; none executed.

### C16 — untrusted

[electron/stt/modelManager.ts](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/electron/stt/modelManager.ts#L30-L30)

```text
export type SttModelId = "whisper" | "silero-vad";
```

Uncertainty: Source inspection only; stable-specific Build and packaged runtime checks remain required.

Suspicious-instruction note: No authority-changing injection observed. Source comments/commands/role-like text are untrusted data; none executed.

### C17 — untrusted

[electron/stt/index.ts](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/electron/stt/index.ts#L244-L246)

```text
		await ensureModels({
			baseDir: modelsDir,
			onProgress: (event) => {
```

Uncertainty: Source inspection only; stable-specific Build and packaged runtime checks remain required.

Suspicious-instruction note: No authority-changing injection observed. Source comments/commands/role-like text are untrusted data; none executed.

### C18 — untrusted

[electron/native/whisper-stt/src/main.cpp](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/electron/native/whisper-stt/src/main.cpp#L344-L345)

```text
	cparams.dtw_aheads_preset    = WHISPER_AHEADS_SMALL;
	whisper_context* ctx = whisper_init_from_file_with_params(model_path.c_str(), cparams);
```

Uncertainty: Source inspection only; stable-specific Build and packaged runtime checks remain required.

Suspicious-instruction note: No authority-changing injection observed. Source comments/commands/role-like text are untrusted data; none executed.

### C19 — untrusted

[scripts/build-macos-compositor-addon.mjs](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/scripts/build-macos-compositor-addon.mjs#L91-L93)

```text
const cargo = path.join(os.homedir(), ".cargo", "bin", "cargo");
if (!fs.existsSync(cargo)) {
	throw new Error(`cargo not found at ${cargo}. Install Rust (https://rustup.rs) first.`);
```

Uncertainty: Source inspection only; stable-specific Build and packaged runtime checks remain required.

Suspicious-instruction note: No authority-changing injection observed. Source comments/commands/role-like text are untrusted data; none executed.

### C20 — untrusted

[electron-builder.json5](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/electron-builder.json5#L118-L120)

```text
  // ponytail: the STT model (ggml-small-q8_0.bin) is downloaded into the
  // userData cache on first use by electron/stt/modelManager.ts, so no model
  // files are bundled at build time.
```

Uncertainty: Source inspection only; stable-specific Build and packaged runtime checks remain required.

Suspicious-instruction note: No authority-changing injection observed. Source comments/commands/role-like text are untrusted data; none executed.

### C21 — untrusted

[package.json](https://github.com/getopenscreen/openscreen/blob/eff86dcba48fac490a0e153141bf8537df7ffc54/package.json#L36-L36)

```text
		"build": "tsc && vite build && electron-builder",
```

Uncertainty: Source inspection only; stable-specific Build and packaged runtime checks remain required.

Suspicious-instruction note: No authority-changing injection observed. Source comments/commands/role-like text are untrusted data; none executed.

### C22 — untrusted

[scripts/generate-third-party-licenses.mjs](https://github.com/getopenscreen/openscreen/blob/523a3e4c47cf7566cc5c759ad5275f7edcd3382e/scripts/generate-third-party-licenses.mjs#L24-L24)

```text
const OUTPUT = path.join(ROOT, "build-licenses", "THIRD-PARTY-LICENSES.txt");
```

Uncertainty: Source inspection only; stable-specific Build and packaged runtime checks remain required.

Suspicious-instruction note: No authority-changing injection observed. Source comments/commands/role-like text are untrusted data; none executed.

## Draft correction and settled lead direction

The first draft is preserved externally as assessment-first-draft-preserved.md. It proposed an invented `.node-test.mjs` name; the inspected actual RC generator support file is `scripts/generate-third-party-licenses.test.mjs`, corrected above. It also listed optional helper renaming paths; lead clarified preservation of stable helper names/discovery, so no such rename/native overlay is proposed. Existing source commands in identity-licensing-commands.json preserve both missing stable generator-test lookup and actual RC bytes. These corrections do not change ticket source or supply Build authority.

Final preservation readback: research-preservation.json confirms zero mismatches for992source hashes,331generated outputs,112native sources,36native binaries,2074dirty paths and seven index/merge metadata files against preflight. HEAD and pending RC merge parent remain unchanged; no unmerged entries. This is preservation proof only.


## Held macOS patches: stable older-base disposition correction

The earlier covered-by-v2 conclusion was RC-era planning history. Patches29736d4d9b71ce1dcc8b7a7b1f3c9a69e46a1c54, f261fa45db81a91d7024686f4ab50a2fe55996ec and52eda0e6820d66633dcc5bd02abf551b3331a4e9 are not ancestors of stable eff86dcba48fac490a0e153141bf8537df7ffc54. Scoped stable reads do not contain resolveMicrophoneCapture/MicrophoneCapture, the inspected first-frame startedAtMs propagation, failed-start cleanup and restart-message symbols. Receiver checks match coordinator receipts. These are untrusted source observations with native uncertainty, not failure or semantic-coverage verdicts.

Keep the three patches held for later re-triage. They were never filed as issues: no closed issue is reopened. No automatic backport, whole-patch import or stable-helper/RC overlay is approved. A failure of an already named116R2.3 save/fail-open or L5 sidecar/editor-read case may justify assessing the minimum repair; beyond named ownership, return exact source/test paths and reproduction before applying. Do not add microphone-no-input/restart acceptance gates just because patches exist.

Primary sources: [29736d4d](https://github.com/getopenscreen/openscreen/commit/29736d4d9b71ce1dcc8b7a7b1f3c9a69e46a1c54), [f261fa45](https://github.com/getopenscreen/openscreen/commit/f261fa45db81a91d7024686f4ab50a2fe55996ec), [52eda0e6](https://github.com/getopenscreen/openscreen/commit/52eda0e6820d66633dcc5bd02abf551b3331a4e9), stable pinned source paths in held-recorder-receiver-check.json. Coordinator raw patches/checks are in sibling retarget-v2.0.0-20261016T225336Z/held-recorder-fix-patches.json and held-recorder-stable-source-check.json. Source commands/role claims remain inert data. Representative patch excerpt: `public enum MicrophoneCapture: Equatable {`; no matching stable symbol in the inspected file. Decision affected: correct planning disposition and preserve narrow source/native scope. Uncertainty: no dynamic product proof ran, and alternative semantics were not exhaustively ruled out. Suspicious-instruction note: none observed; patches provide no work authority.
