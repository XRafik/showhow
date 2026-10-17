# Upstream touchpoints for Showhow #116

Development parent: `refs/tags/upstream/v2.1.0-rc.3` = `523a3e4c47cf7566cc5c759ad5275f7edcd3382e`. This is an uncommitted real merge candidate, not final v2.1.0 ancestry or release acceptance. The final tag gate remains open. Eventual owner-authorised landing must retain upstream ancestry using a merge commit, never squash/rebase.

The table inventories paths whose candidate contents differ from the actual parent, including preserved base policy and deleted upstream infrastructure. It does not imply all were newly edited in this ticket. New Showhow modules and moved native sources are listed separately. Exact dirty bytes, raw conflict index and attempt receipts live under `/Users/mohamedb/dev/loop-evidence/showhow-116/executor/`.

| Upstream path | Identifier role | Adaptation / preservation |
|---|---|---|
| `.env.example` | repository policy | Retain Showhow base policy/history/tooling in merge resolution. Environment example content not inspected. |
| `.github/CODEOWNERS` | release policy / verification | Retain Showhow base workflow, setup, templates and CI; upstream publishers excluded. Native dependency gap noted below. |
| `.github/FUNDING.yml` | release exclusions | Excluded upstream workflow/publisher/Discord helper; preserve Showhow single release workflow and no RC infrastructure. |
| `.github/ISSUE_TEMPLATE/bug_report.yml` | release exclusions | Excluded upstream workflow/publisher/Discord helper; preserve Showhow single release workflow and no RC infrastructure. |
| `.github/ISSUE_TEMPLATE/feature_request.yml` | release exclusions | Excluded upstream workflow/publisher/Discord helper; preserve Showhow single release workflow and no RC infrastructure. |
| `.github/actions/setup/action.yml` | release policy / verification | Retain Showhow base workflow, setup, templates and CI; upstream publishers excluded. Native dependency gap noted below. |
| `.github/pull_request_template.md` | release policy / verification | Retain Showhow base workflow, setup, templates and CI; upstream publishers excluded. Native dependency gap noted below. |
| `.github/scripts/discord-bot-api.mjs` | release exclusions | Excluded upstream workflow/publisher/Discord helper; preserve Showhow single release workflow and no RC infrastructure. |
| `.github/scripts/discord-bot-api.test.mjs` | release exclusions | Excluded upstream workflow/publisher/Discord helper; preserve Showhow single release workflow and no RC infrastructure. |
| `.github/scripts/discord-pr-sync.mjs` | release exclusions | Excluded upstream workflow/publisher/Discord helper; preserve Showhow single release workflow and no RC infrastructure. |
| `.github/scripts/discord-release-announce.mjs` | release exclusions | Excluded upstream workflow/publisher/Discord helper; preserve Showhow single release workflow and no RC infrastructure. |
| `.github/scripts/discord-release-announce.test.mjs` | release exclusions | Excluded upstream workflow/publisher/Discord helper; preserve Showhow single release workflow and no RC infrastructure. |
| `.github/scripts/discord-roadmap-sync.mjs` | release exclusions | Excluded upstream workflow/publisher/Discord helper; preserve Showhow single release workflow and no RC infrastructure. |
| `.github/scripts/discord-thread-validator.mjs` | release exclusions | Excluded upstream workflow/publisher/Discord helper; preserve Showhow single release workflow and no RC infrastructure. |
| `.github/scripts/discord-thread-validator.test.mjs` | release exclusions | Excluded upstream workflow/publisher/Discord helper; preserve Showhow single release workflow and no RC infrastructure. |
| `.github/scripts/discord-weekly-leaderboard.mjs` | release exclusions | Excluded upstream workflow/publisher/Discord helper; preserve Showhow single release workflow and no RC infrastructure. |
| `.github/scripts/macos-runner-images.test.mjs` | release exclusions | Excluded upstream workflow/publisher/Discord helper; preserve Showhow single release workflow and no RC infrastructure. |
| `.github/scripts/previous-stable-tag.mjs` | release exclusions | Excluded upstream workflow/publisher/Discord helper; preserve Showhow single release workflow and no RC infrastructure. |
| `.github/scripts/previous-stable-tag.test.mjs` | release exclusions | Excluded upstream workflow/publisher/Discord helper; preserve Showhow single release workflow and no RC infrastructure. |
| `.github/scripts/refresh-nix-npm-hash.sh` | release exclusions | Excluded upstream workflow/publisher/Discord helper; preserve Showhow single release workflow and no RC infrastructure. |
| `.github/scripts/release-milestone-close.mjs` | release exclusions | Excluded upstream workflow/publisher/Discord helper; preserve Showhow single release workflow and no RC infrastructure. |
| `.github/scripts/release-milestone-migrate.mjs` | release exclusions | Excluded upstream workflow/publisher/Discord helper; preserve Showhow single release workflow and no RC infrastructure. |
| `.github/scripts/set-release-version.mjs` | release exclusions | Excluded upstream workflow/publisher/Discord helper; preserve Showhow single release workflow and no RC infrastructure. |
| `.github/scripts/set-release-version.test.mjs` | release exclusions | Excluded upstream workflow/publisher/Discord helper; preserve Showhow single release workflow and no RC infrastructure. |
| `.github/scripts/stable-release-notes.test.mjs` | release exclusions | Excluded upstream workflow/publisher/Discord helper; preserve Showhow single release workflow and no RC infrastructure. |
| `.github/workflows/announce-release.yml` | release exclusions | Excluded upstream workflow/publisher/Discord helper; preserve Showhow single release workflow and no RC infrastructure. |
| `.github/workflows/aur-publish.yml` | release exclusions | Excluded upstream workflow/publisher/Discord helper; preserve Showhow single release workflow and no RC infrastructure. |
| `.github/workflows/auto-approve-linux.yml` | release exclusions | Excluded upstream workflow/publisher/Discord helper; preserve Showhow single release workflow and no RC infrastructure. |
| `.github/workflows/build-onnxruntime-macos.yml` | release exclusions | Excluded upstream workflow/publisher/Discord helper; preserve Showhow single release workflow and no RC infrastructure. |
| `.github/workflows/build-whisper-stt.yml` | release exclusions | Excluded upstream workflow/publisher/Discord helper; preserve Showhow single release workflow and no RC infrastructure. |
| `.github/workflows/build.yml` | release policy / verification | Retain Showhow base workflow, setup, templates and CI; upstream publishers excluded. Native dependency gap noted below. |
| `.github/workflows/ci.yml` | release policy / verification | Retain Showhow base workflow, setup, templates and CI; upstream publishers excluded. Native dependency gap noted below. |
| `.github/workflows/diagnostic-artifact.yml` | release exclusions | Excluded upstream workflow/publisher/Discord helper; preserve Showhow single release workflow and no RC infrastructure. |
| `.github/workflows/discord-pr-notify.yml` | release exclusions | Excluded upstream workflow/publisher/Discord helper; preserve Showhow single release workflow and no RC infrastructure. |
| `.github/workflows/discord-roadmap-sync.yml` | release exclusions | Excluded upstream workflow/publisher/Discord helper; preserve Showhow single release workflow and no RC infrastructure. |
| `.github/workflows/discord-weekly-leaderboard.yml` | release exclusions | Excluded upstream workflow/publisher/Discord helper; preserve Showhow single release workflow and no RC infrastructure. |
| `.github/workflows/docs.yml` | release exclusions | Excluded upstream workflow/publisher/Discord helper; preserve Showhow single release workflow and no RC infrastructure. |
| `.github/workflows/flatpak-spike.yml` | release exclusions | Excluded upstream workflow/publisher/Discord helper; preserve Showhow single release workflow and no RC infrastructure. |
| `.github/workflows/merged-pr-bookkeeping.yml` | release exclusions | Excluded upstream workflow/publisher/Discord helper; preserve Showhow single release workflow and no RC infrastructure. |
| `.github/workflows/nix-build.yml` | release exclusions | Excluded upstream workflow/publisher/Discord helper; preserve Showhow single release workflow and no RC infrastructure. |
| `.github/workflows/nix-check.yml` | release exclusions | Excluded upstream workflow/publisher/Discord helper; preserve Showhow single release workflow and no RC infrastructure. |
| `.github/workflows/prerelease.yml` | release exclusions | Excluded upstream workflow/publisher/Discord helper; preserve Showhow single release workflow and no RC infrastructure. |
| `.github/workflows/promote.yml` | release exclusions | Excluded upstream workflow/publisher/Discord helper; preserve Showhow single release workflow and no RC infrastructure. |
| `.github/workflows/publish-msstore.yml` | release exclusions | Excluded upstream workflow/publisher/Discord helper; preserve Showhow single release workflow and no RC infrastructure. |
| `.github/workflows/publish-winget.yml` | release exclusions | Excluded upstream workflow/publisher/Discord helper; preserve Showhow single release workflow and no RC infrastructure. |
| `.github/workflows/update-homebrew-cask.yml` | release exclusions | Excluded upstream workflow/publisher/Discord helper; preserve Showhow single release workflow and no RC infrastructure. |
| `.gitignore` | generated-output boundary | Add ignored native compositor/build-license/Vite caches while preserving generated bytes externally; keep fixture source tracked. |
| `.harness/docs/git-workflow.md` | upstream deletion | Keep release-parent removal/exclusion; do not revive inherited implementation. |
| `.harness/reins/openscreen-tester/agent.md` | upstream deletion | Keep release-parent removal/exclusion; do not revive inherited implementation. |
| `.husky/pre-commit` | repository policy | Retain Showhow base policy/history/tooling in merge resolution. Environment example content not inspected. |
| `AGENTS.md` | repository policy | Retain Showhow base policy/history/tooling in merge resolution. Environment example content not inspected. |
| `CONTRIBUTING.md` | repository policy | Retain Showhow base policy/history/tooling in merge resolution. Environment example content not inspected. |
| `README.md` | repository policy | Retain Showhow base policy/history/tooling in merge resolution. Environment example content not inspected. |
| `ROADMAP.md` | repository policy | Retain Showhow base policy/history/tooling in merge resolution. Environment example content not inspected. |
| `biome.json` | verification | Exclude immutable fixture bytes and unshipped upstream website/measurement snapshots; application lint remains enabled. |
| `electron-builder.json5` | identity, native packaging | Keep com.bedarstudios.showhow / Showhow / icons; ship v2 native resources, caption assets and both notice files; own publisher; remove upstream Store identity. No early size trim. |
| `electron/about.ts` | visible identity / repository endpoint | Showhow app/repository names; inherited release API behavior retained. |
| `electron/ai-edition/agent-tools.ts` | internal API / visible identity | Keep upstream API/type names; Showhow visible error/application text and canonical output names. |
| `electron/ai-edition/deep-agent/service.ts` | internal API / visible identity | Keep upstream API/type names; Showhow visible error/application text and canonical output names. |
| `electron/ai-edition/document-service.test.ts` | same-package regression | Retain meaningful regression; adapt public v2 boundary/mocks, current identity or canonical write extension. Failed attempt receipts preserved. |
| `electron/ai-edition/document-service.ts` | persistence | New .showhow; Showhow-first reads then .openscreen/.axcut; copy-exclusively migrate, preserve originals; stable document schema/IDs. |
| `electron/ai-edition/style-preset-service.test.ts` | same-package regression | Retain meaningful regression; adapt public v2 boundary/mocks, current identity or canonical write extension. Failed attempt receipts preserved. |
| `electron/ai-edition/style-preset-service.ts` | persistence | New .showhowpreset; read/copy legacy .openscreenpreset without deletion or overwrite. |
| `electron/electron-env.d.ts` | identity / shared wiring | Reconcile house typography/style/routing/API declarations with actual v2 contracts; stable internal identifiers retained. |
| `electron/ipc/handlers.ts` | IPC, persistence, helper discovery | Keep v2 recording/media/export APIs; wire Showhow bundle finish, library open, transcript/doc IPC, approved roots and non-overwriting legacy project defaults. |
| `electron/ipc/nativeBridge.presets.test.ts` | same-package regression | Retain meaningful regression; adapt public v2 boundary/mocks, current identity or canonical write extension. Failed attempt receipts preserved. |
| `electron/main.ts` | process identity, persistence, IPC | Keep Showhow bootstrap, instance lock, tray and library home; register bundle protocol/theme. Do not start MCP/app-channel server; local usage-ping no-op. |
| `electron/mcp/app-channel.test.ts` | same-package regression | Retain meaningful regression; adapt public v2 boundary/mocks, current identity or canonical write extension. Failed attempt receipts preserved. |
| `electron/mcp/media-tools.test.ts` | same-package regression | Retain meaningful regression; adapt public v2 boundary/mocks, current identity or canonical write extension. Failed attempt receipts preserved. |
| `electron/mcp/openscreen-mcp-server.test.ts` | same-package regression | Retain meaningful regression; adapt public v2 boundary/mocks, current identity or canonical write extension. Failed attempt receipts preserved. |
| `electron/media/extensionClip.test.ts` | same-package regression | Retain meaningful regression; adapt public v2 boundary/mocks, current identity or canonical write extension. Failed attempt receipts preserved. |
| `electron/native-bridge/capture/linuxNativeCaptureSession.ts` | IPC, helper discovery | Keep upstream platform capture implementation; current Showhow helper/env candidate first, legacy fallback through house identity table. |
| `electron/native-bridge/cursor/recording/macNativeCursorRecordingSession.ts` | IPC, helper discovery | Keep upstream platform capture implementation; current Showhow helper/env candidate first, legacy fallback through house identity table. |
| `electron/native-bridge/cursor/recording/windowsNativeRecordingSession.ts` | IPC, helper discovery | Keep upstream platform capture implementation; current Showhow helper/env candidate first, legacy fallback through house identity table. |
| `electron/native-bridge/screen/macScreenAccess.ts` | IPC, helper discovery | Keep upstream platform capture implementation; current Showhow helper/env candidate first, legacy fallback through house identity table. |
| `electron/native/screencapturekit/Package.swift` | helper discovery, native packaging | Showhow executable products/targets pair with restored rc.3 source directories; internal OpenScreenCaptureCore module stays stable. |
| `electron/native/wgc-capture/CMakeLists.txt` | helper discovery, native packaging | Showhow OUTPUT_NAME; retain upstream internal target names. |
| `electron/preload.ts` | IPC | Expose existing showhow channels plus bundle-open to renderer; retain upstream native/export API signatures. |
| `electron/star-prompt.ts` | visible identity / repository endpoint | Showhow app/repository names; inherited release API behavior retained. |
| `electron/stt/extractAudio.ts` | media API compatibility | Keep upstream optional native STT implementation, adapt synchronous getPlatform contract; bundle transcription still renderer tiny. |
| `electron/update-checker.test.ts` | same-package regression | Retain meaningful regression; adapt public v2 boundary/mocks, current identity or canonical write extension. Failed attempt receipts preserved. |
| `electron/update-checker.ts` | visible identity / repository endpoint | Showhow app/repository names; inherited release API behavior retained. |
| `electron/windows.ts` | window identity, editor integration | Library home + distinct HUD switch; v2 editor window receives Showhow title. |
| `flake.nix` | packaging identity | Retain house packaging metadata/configuration from base during conflict resolution; no publisher revival. |
| `icons/icons/mac/icon.icns` | platform identity | Restore exact existing Showhow icon bytes, including appId/TCC identity pairing. |
| `icons/icons/png/1024x1024.png` | platform identity | Restore exact existing Showhow icon bytes, including appId/TCC identity pairing. |
| `icons/icons/png/128x128.png` | platform identity | Restore exact existing Showhow icon bytes, including appId/TCC identity pairing. |
| `icons/icons/png/16x16.png` | platform identity | Restore exact existing Showhow icon bytes, including appId/TCC identity pairing. |
| `icons/icons/png/24x24.png` | platform identity | Restore exact existing Showhow icon bytes, including appId/TCC identity pairing. |
| `icons/icons/png/256x256.png` | platform identity | Restore exact existing Showhow icon bytes, including appId/TCC identity pairing. |
| `icons/icons/png/32x32.png` | platform identity | Restore exact existing Showhow icon bytes, including appId/TCC identity pairing. |
| `icons/icons/png/48x48.png` | platform identity | Restore exact existing Showhow icon bytes, including appId/TCC identity pairing. |
| `icons/icons/png/512x512.png` | platform identity | Restore exact existing Showhow icon bytes, including appId/TCC identity pairing. |
| `icons/icons/png/64x64.png` | platform identity | Restore exact existing Showhow icon bytes, including appId/TCC identity pairing. |
| `icons/icons/win/icon.ico` | platform identity | Restore exact existing Showhow icon bytes, including appId/TCC identity pairing. |
| `index.html` | identity / shared wiring | Reconcile house typography/style/routing/API declarations with actual v2 contracts; stable internal identifiers retained. |
| `nix/hm-module.nix` | packaging identity | Retain house packaging metadata/configuration from base during conflict resolution; no publisher revival. |
| `nix/module.nix` | packaging identity | Retain house packaging metadata/configuration from base during conflict resolution; no publisher revival. |
| `nix/package.nix` | packaging identity | Retain house packaging metadata/configuration from base during conflict resolution; no publisher revival. |
| `package-lock.json` | dependency lock | Reconcile merged v2 dependencies with renderer tiny and existing house build tools, Node22.22.1/npm10.9.4. |
| `package.json` | identity, build wiring | Keep Showhow version/engine/main metadata; retain v2 dependencies/scripts and tiny renderer dependency; no inherited RC publisher workflow. |
| `public/openscreen.png` | visible identity | Remove unused upstream/template image from Showhow source; retain house mark/icon. |
| `public/vite.svg` | visible identity | Remove unused upstream/template image from Showhow source; retain house mark/icon. |
| `scripts/before-pack.cjs` | packaging, helper discovery | Compose house tiny/helper preparation with upstream required payload/freshness/license guards; current Showhow executable names. |
| `scripts/before-pack.test.mjs` | same-package regression | Retain meaningful regression; adapt public v2 boundary/mocks, current identity or canonical write extension. Failed attempt receipts preserved. |
| `scripts/build-macos-screencapturekit-helper.mjs` | native packaging / helper discovery | Pair Showhow output names and discovery with current executable targets; keep old compatible candidates; target Windows untested. |
| `scripts/build-windows-wgc-helper.mjs` | native packaging / helper discovery | Pair Showhow output names and discovery with current executable targets; keep old compatible candidates; target Windows untested. |
| `scripts/build_macos.sh` | build / diagnostics identity | Retain house diagnostics/build naming with v2 script availability. |
| `scripts/diagnostic-tool/README.md` | build / diagnostics identity | Retain house diagnostics/build naming with v2 script availability. |
| `scripts/diagnostic-tool/diagnostic.mjs` | build / diagnostics identity | Retain house diagnostics/build naming with v2 script availability. |
| `scripts/i18n-check.mjs` | verification, packaging | Validate all shipped Electron locales; validate AppX only when that distribution channel is configured. |
| `scripts/test-windows-native-cursor.mjs` | same-package regression | Retain meaningful regression; adapt public v2 boundary/mocks, current identity or canonical write extension. Failed attempt receipts preserved. |
| `scripts/test-windows-wgc-helper.mjs` | same-package regression | Retain meaningful regression; adapt public v2 boundary/mocks, current identity or canonical write extension. Failed attempt receipts preserved. |
| `src/App.tsx` | window routing, renderer wiring | Keep house library, mount v2 shell and renderer tiny bundle transcript consumer. |
| `src/assets/react.svg` | visible identity | Remove unused upstream/template image from Showhow source; retain house mark/icon. |
| `src/components/ai-edition/EditorEmptyState.tsx` | visible identity / v2 boundary | Keep v2 implementation; house mark/visible title and current project extension copy. |
| `src/components/ai-edition/ExportDialog.tsx` | visible identity | Showhow export fallback name only; native v2 exporter retained. |
| `src/components/ai-edition/ProviderSettings.test.tsx` | same-package regression | Retain meaningful regression; adapt public v2 boundary/mocks, current identity or canonical write extension. Failed attempt receipts preserved. |
| `src/components/ai-edition/ProviderSettings.tsx` | UI boundary | Hide upstream MCP control; preserve v2 provider architecture. No new provider product work. |
| `src/components/ai-edition/importProjectFile.test.ts` | same-package regression | Retain meaningful regression; adapt public v2 boundary/mocks, current identity or canonical write extension. Failed attempt receipts preserved. |
| `src/components/ai-edition/v4/EditorTopBar.stylePresets.test.tsx` | same-package regression | Retain meaningful regression; adapt public v2 boundary/mocks, current identity or canonical write extension. Failed attempt receipts preserved. |
| `src/components/ai-edition/v4/EditorTopBar.test.tsx` | same-package regression | Retain meaningful regression; adapt public v2 boundary/mocks, current identity or canonical write extension. Failed attempt receipts preserved. |
| `src/components/ai-edition/v4/EditorTopBar.tsx` | visible identity / v2 boundary | Keep v2 implementation; house mark/visible title and current project extension copy. |
| `src/components/launch/LaunchWindow.module.css` | UI tokens | Map inherited recorder/HUD color, radius and type to house CSS variables; preserve DOM/control structure. |
| `src/components/launch/SourceSelector.module.css` | UI tokens | Map inherited recorder/HUD color, radius and type to house CSS variables; preserve DOM/control structure. |
| `src/components/launch/SourceSelector.test.tsx` | same-package regression | Retain meaningful regression; adapt public v2 boundary/mocks, current identity or canonical write extension. Failed attempt receipts preserved. |
| `src/components/launch/SourceSelector.tsx` | keyboard UI | Preserve v2 component structure; house radio semantics/roving keyboard selection restored at existing controls. |
| `src/components/video-editor/projectPersistence.test.ts` | same-package regression | Retain meaningful regression; adapt public v2 boundary/mocks, current identity or canonical write extension. Failed attempt receipts preserved. |
| `src/components/video-editor/projectPersistence.ts` | legacy serialization | Keep public project shape/read/save compatibility (including startsSettled) while v2 replaces renderer. |
| `src/components/video-editor/types.ts` | legacy serialization | Keep public project shape/read/save compatibility (including startsSettled) while v2 replaces renderer. |
| `src/contexts/I18nContext.tsx` | identity / shared wiring | Reconcile house typography/style/routing/API declarations with actual v2 contracts; stable internal identifiers retained. |
| `src/hooks/useScreenRecorder.nativeMacStartWarning.test.tsx` | same-package regression | Retain meaningful regression; adapt public v2 boundary/mocks, current identity or canonical write extension. Failed attempt receipts preserved. |
| `src/hooks/useScreenRecorder.ts` | recording IPC, permissions | Carry duration and per-take permission degradation reason through v2 completion; preserve denied-access system-cursor behavior and existing issue27 regressions. |
| `src/hooks/useTheme.ts` | persistence, UI tokens | Shared Showhow preference fallback, sync house and upstream theme attributes/classes. |
| `src/i18n/config.ts` | identity / shared wiring | Reconcile house typography/style/routing/API declarations with actual v2 contracts; stable internal identifiers retained. |
| `src/i18n/locales/ar/common.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/ar/dialogs.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/ar/editor.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/ar/launch.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/ar/settings.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/cs/common.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/cs/dialogs.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/cs/editor.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/cs/launch.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/cs/settings.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/de/common.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/de/dialogs.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/de/editor.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/de/launch.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/de/settings.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/en/common.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/en/dialogs.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/en/editor.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/en/launch.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/en/settings.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/en/timeline.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/es/common.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/es/dialogs.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/es/editor.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/es/launch.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/es/settings.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/fr/common.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/fr/dialogs.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/fr/editor.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/fr/launch.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/fr/settings.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/it/common.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/it/dialogs.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/it/editor.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/it/launch.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/it/settings.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/ja-JP/common.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/ja-JP/dialogs.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/ja-JP/editor.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/ja-JP/launch.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/ja-JP/settings.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/ko-KR/common.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/ko-KR/dialogs.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/ko-KR/editor.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/ko-KR/launch.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/ko-KR/settings.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/pt-BR/common.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/pt-BR/dialogs.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/pt-BR/editor.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/pt-BR/launch.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/pt-BR/settings.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/pt-BR/shortcuts.json` | visible identity / stable locale keys | Showhow visible product strings; keep old internal openscreenProject key. pt-BR shortcuts duplicate keys removed with parsed values unchanged. |
| `src/i18n/locales/ru/common.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/ru/dialogs.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/ru/editor.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/ru/launch.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/ru/settings.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/tr/common.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/tr/dialogs.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/tr/editor.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/tr/launch.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/tr/settings.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/vi/common.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/vi/dialogs.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/vi/editor.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/vi/launch.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/vi/settings.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/zh-CN/common.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/zh-CN/dialogs.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/zh-CN/editor.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/zh-CN/launch.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/zh-CN/settings.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/zh-TW/common.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/zh-TW/dialogs.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/zh-TW/editor.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/zh-TW/launch.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/i18n/locales/zh-TW/settings.json` | visible identity / stable locale keys | Showhow visible product strings; preserve locale/key structure and legacy extension read labels. |
| `src/index.css` | UI tokens | House stylesheet retained plus upstream Sonner close-button contract. |
| `src/lib/ai-edition/document/insertion.test.ts` | same-package regression | Retain meaningful regression; adapt public v2 boundary/mocks, current identity or canonical write extension. Failed attempt receipts preserved. |
| `src/lib/ai-edition/stylePresets.test.ts` | same-package regression | Retain meaningful regression; adapt public v2 boundary/mocks, current identity or canonical write extension. Failed attempt receipts preserved. |
| `src/lib/ai-edition/stylePresets.ts` | serialized values | New showhow-style-preset discriminator; accept openscreen-style-preset; keep openscreen-factory ID stable. |
| `src/lib/ai-edition/timeline/clip-parts.test.ts` | same-package regression | Retain meaningful regression; adapt public v2 boundary/mocks, current identity or canonical write extension. Failed attempt receipts preserved. |
| `src/lib/ai-edition/timeline/clip-parts.ts` | persisted generated-media directory | New derived media directory `.showhow-extensions`; existing serialized absolute media paths stay readable through generic media reads. |
| `src/lib/cursor/cursorThemes.test.ts` | same-package regression | Retain meaningful regression; adapt public v2 boundary/mocks, current identity or canonical write extension. Failed attempt receipts preserved. |
| `src/lib/cursor/cursorThemes.ts` | asset registry / serialized values | Keep six named original packs plus built-in default; Sweezy absent, remove stale category comments. |
| `src/lib/customFonts.ts` | persistence, IPC | Showhow-first persistence and legacy font-location compatibility retained. |
| `src/lib/exporter/localSourceFile.test.ts` | same-package regression | Retain meaningful regression; adapt public v2 boundary/mocks, current identity or canonical write extension. Failed attempt receipts preserved. |
| `src/lib/exporter/localSourceFile.ts` | legacy media read boundary | Preserve house file-path compatibility in upstream utility; v2 native exporter remains authoritative. |
| `src/lib/recordingSession.ts` | serialized values, IPC | Retain v2 fields and Showhow transcript-job metadata plus stale-completion protection. |
| `src/lib/userPreferences.ts` | persistence | Showhow writes; legacy key fallback retained, old layout values preserved. |
| `src/main.tsx` | identity / shared wiring | Reconcile house typography/style/routing/API declarations with actual v2 contracts; stable internal identifiers retained. |
| `src/native/contracts.ts` | identity / shared wiring | Reconcile house typography/style/routing/API declarations with actual v2 contracts; stable internal identifiers retained. |
| `tailwind.config.cjs` | identity / shared wiring | Reconcile house typography/style/routing/API declarations with actual v2 contracts; stable internal identifiers retained. |
| `technical-documentation/engineering/release-and-secrets.md` | release documentation | Replace inherited RC/publisher instructions with actual single Showhow release workflow; no fake notices generator. |
| `vite.config.ts` | packaging, worker boundary | bootstrap entry -> main.js; renderer tiny worker ES bundling and Showhow-owned Node browser stubs; main process alias remains isolated. |
| `vitest.config.ts` | test boundary | Exclude browser/workbench tests from unit run; preserve opt-in jsdom suites. |

## Stable identifier contract

The machine-readable companion `config/upstream-branding-allowlist.json` enumerates each retained runtime legacy line with exact text and count, individually by file and role. It covers internal Rust/module/type names, old serialized schemas, environment names, legacy paths, IPC interfaces and legal attribution. It is not permission to rename an unclassified symbol. Non-runtime inherited documentation/tooling exemptions name individual files. The scanner includes tracked and new source and retains its negative tests.

| Identifier / family | Role | Decision |
|---|---|---|
| `com.bedarstudios.showhow`, `Showhow`, existing icon bytes | app identity / TCC / userData | Preserve; no upstream appId adoption. |
| `.showhow` / `.openscreen` / `.axcut` | persisted project files | New writes Showhow, legacy reads and copy-exclusive migration; opening never overwrites original. |
| `.showhowpreset`, `showhow-style-preset` | new persisted preset filename/type | New Showhow writes. |
| `.openscreenpreset`, `openscreen-style-preset`, `openscreen-factory` | old persisted preset filename/type and stable factory ID | Accept legacy filenames/type; copy-preserve source; keep factory ID. |
| `showhow:*` | Showhow IPC | Keep existing bundle/library/doc/transcript channels, add `showhow:open-recording`; remove companion bridge channels. |
| `openscreenProject` locale key / upstream OpenScreen type names | internal API | Keep keys/type contracts; visible translations say Showhow. |
| `<video path>.cursor.json`, `cursor.json`, session/meta schemas | serialized media / telemetry | Keep sidecar convention plus canonical bundle telemetry copy. No old native cursor fixture claimed. |
| `SHOWHOW_*`, `showhow-*` helper executables | discovery / packaging | Current names first through existing identity table; legacy env/binary aliases retained. |
| `OPENSCREEN_*`, `openscreen-*` legacy helper/environment identifiers | compatibility / native/tooling API | Retain exact legacy candidates and upstream native variables; not visible branding. No global decode override applied. |
| `OpenScreenCaptureCore`, Rust `openscreen_*`, native addon name | internal module / build linkage | Retain internal module/crate/native linkage; distinguish from executable identity. |
| `OPENSCREEN_RELEASE_TOKEN` | existing release-secret interface | Preserve legacy secret name; no credential read or rename. |
| upstream MCP/CLI symbols | internal IPC / hidden functionality | Retain source contract; MCP startup and UI entry removed/hidden. |

## New house modules and native moves

- `electron/showhow/finishRecording.ts` owns fail-open bundle finalization; same-package tests cover pre-relocation and post-relocation metadata errors. Recording remains readable on documentation failure.
- `src/lib/showhow/whisperTiny/**` owns the preserved renderer tiny pipeline, worker and renderer-only Node stubs; `resumeBundleTranscript.ts` and `BundleTranscript.tsx` connect pending jobs to v2. Task #117 is not implemented.
- `src/lib/showhow/upstreamTheme.css` maps upstream variables to house tokens; library screens retain their look. `RecordingLibrary` opens v2 through a tested IPC button.
- `electron/showhow/upstreamCompatibility.test.ts` / `documentCompatibility.test.ts` and `tests/fixtures/legacy/**` consume authentic pinned originals. A separately derived test input relocates media explicitly; original serialized paths/hashes remain unchanged. Unit parsing/conversion is not decoded-media acceptance. Native copied-profile proof must include separately captured sessionData Local Storage.
- rc.3 `Sources/OpenScreenScreenCaptureKitHelper/**` → `Sources/ShowhowScreenCaptureKitHelper/**` and `Sources/OpenScreenMacOSCursorHelper/**` → `Sources/ShowhowMacOSCursorHelper/**`; executable names/SwiftPM target pairing repaired together. Pinned helper source is preserved except the existing house cursor `.cghidEventTap` delta. Core module remains `OpenScreenCaptureCore`. Lead helper build3 passed, unchanged core Swift suite passed65; runtime capture acceptance remains pending. Entitlements match base/upstream.

## Preserved exclusions and proof limits

Companion code and 17 Sweezy packs are absent. Six named original cursor packs plus default remain. `THIRD-PARTY-NOTICES.md` is checked in; `licenses:generate` generates `THIRD-PARTY-LICENSES.txt`, and both ship as outer Resources files. No notices generator was invented. No Task #118 early trim.

Default packaged preview/GIF on authentic VP9 Profile1 gbrp media is black. The identical package/project/media with the existing software-decode diagnostic produces colorbars. This implicates the decoder fallback handoff; it is not successful native media acceptance. No new compositor fix has been applied: `crates/compositor/src/pipeline_macos.rs` remains identical to rc.3. An external uncompiled proposal and proposed same-package native test are in `executor/native-decoder-proposal/`, awaiting explicit ownership clearance.

The existing native export verifier/recipe is unchanged. It assumes the removed renderer GIF architecture and lacks pre-main OS-home isolation. Broader verifier changes remain an external lead proposal, outside the allowed locator-only edits; no `verify:export` PASS. Windows/Linux native behavior is untested. Actual narrated capture/cursor proof and final-tag ancestry remain open.

Showhow base release workflow is retained, without upstream RC/promote/publishers. Its explicit macOS packaging steps do not yet prepare all newly required v2 compositor/native-STT/license payloads on a clean CI runner. Lead local isolated packaging prerequisites do not prove hosted release reproducibility. This is a bounded release-wiring follow-up/scope decision, not a claim that hosted builds pass.

## Library transcript resume correction after package2

`electron/showhow/resumeTranscript.ts` restores only pending bundle jobs from the persisted transcript marker. `electron/ipc/handlers.ts` adds its import and wires the helper at the already-validated library open seam. No native or editor restructuring. The existing flat session manifest is retained; opening must not drop its job just because it is not beside the relocated bundled video. Completed/missing/unreadable transcript cases preserve valid media and never overwrite existing transcript bytes. Same-package IPC RED/GREEN and real-filesystem helper tests are retained under executor/library-transcript-* and library-resume-* evidence. The initial native-ready/source manifest is superseded by the next numbered baseline for this production change; package3 proof remains lead-owned.

## Owner-approved decoder, verifier and release-wiring application

Earlier UNAPPLIED/scope-stop statements are retained history. On2026-10-16 the owner approved the exact five-path extension in SCOPE-APPROVAL.md; SCOPE-APPROVAL-ACCEPTED.md and resume-20261016T205008Z/OWNER-APPROVAL.md record the decision. The exact native-v2/export/release payloads and copy manifest were hash-checked and applied in the same dirty merge lane; no additional path ownership inferred. Raw application bytes/index and formatting-only Acorn equivalence receipts are in executor/owner-resume-1.

| Added or newly adapted upstream path | Identifier role | Current bounded change |
|---|---|---|
| `crates/compositor/src/pipeline_macos.rs` | native frame presentation / internal diagnostic API | Present received system-memory frames through existing CpuFrames after hardware device creation succeeds but codec/profile falls back. Preserve actual AV_PIX_FMT_VIDEOTOOLBOX frames, held/lookahead/seek paths and actual hardware reporting. Keep internal Rust module/types and OPENSCREEN_MAC_DECODE name; no forced-software global policy. Same-module real Metal regression and H264 control. |
| `scripts/verify-showhow-export.mjs` | isolated verification process paths / native editor-export interfaces | Child-local OS home/media paths before main, existing v2 native controls/completion and fully decoded synthetic palette rejection. No production exporter replacement; retained cleanup, PID/birth and immutable originals/archive checks. |
| `scripts/verify-showhow-export.node-test.mjs` | verification support boundary | Sixteen tests cover startup ordering/path isolation, packaged-only discovery, cleanup and synthetic black/solid-frame rejection. Mechanical formatting only after exact approved application, AST equivalent. |
| `docs/testing/verification-recipe.md` | proof procedure / locator and isolation contract | Approved broader-than-locator v2 native journey and content/isolation instructions. Actual recipe acceptance remains separate from support tests. |
| `.github/workflows/build.yml` | cross-platform native packaging / host discovery | Keep single Showhow workflow/triggers/jobs/publisher; matching macOS host architecture and explicit current-source/pinned LGPL native/STT/ONNX/licenses prerequisites. No RC/promote/publisher restoration, new binary workflow or hosted dispatch. |

`tests/fixtures/legacy/h264-control.mp4` and companion provenance are exact exclusive copies from the approved manifest, hashddddd9d1df19c56772e1f6d4074e2740e1e43a109a25277d9e7d969c317fadf6. They are newly derived synthetic control data in already-owned legacy fixture scope; authentic fc50566a originals and their hashes are unchanged. Native source freeze is separate from generated native binaries: executor tests compile only into an evidence-root target; lead exclusively rebuilds production addon/package. Windows/Linux native/hosted acceptance remains untested; final-tag ancestry and independent review gates remain open.

## Verifier-only scratch preparation correction

Actual pinned-tool recipe2 reached launch but strict isolation realpath failed because the private recordings root did not exist. In the already-approved scripts/verify-showhow-export.mjs and same-module node-test, paused pre-main initialization now creates home/Showhow/Recordings idempotently before production import/containment. A real-filesystem test reaches the original ENOENT before the fix and then passes, preserving existing file bytes and HOME. Realpath containment, cleanup, media-content and tool-pin code are unchanged. Product/main/renderer/native/generated/package bytes remain unchanged; this needs a new source-script proof freeze, not a native rebuild. Lead owns actual recipe acceptance. Legacy project metadata rerun3 passes with correct project-bound harness sequencing; no upstream editor/store change is justified or applied.

Verifier scratch proof correction:17same-module support tests now pass (the earlier16-test entry is historical). Initial full lint scanned generated actual-recipe evidence; lead archived it byte-preserved externally, then full lint passed without config/exclusion changes. Verifier/test frozen for lead actual recipe3 PASS and required repeat4. Only these two support scripts plus append-only implementation/touchpoint notes differ from READY4; product, native source/binaries and generated app output remain unchanged.


## Proposed stable-retarget correction — owner plan/publication gate pending

Earlier table/RC proof is historical. Proposed release parent refs/tags/upstream/v2.0.0 = eff86dcba48fac490a0e153141bf8537df7ffc54. Rebuild the edited-upstream inventory against this stable parent during approved Build; do not present the old RC table as the stable diff. Carry focused Showhow identity/save/library/tiny/legacy/token wrappers, the byte-compatible received-frame decoder correction and selected licence generator/guard; no RC native capture/SWIFT overlay. Preserve stable helper names and classify legacy read overrides before mapped fallbacks. Five prior native/export/build additions plus exact retarget policy/compatibility paths are listed in revised PLAN Task2; further paths return for scope. Old final2.1/physical pending notes are superseded by the preserved RC owner completion and settled stable target, neither accepts stable runtime.


## Held macOS patches: stable older-base disposition correction

The earlier covered-by-v2 conclusion was RC-era planning history. Patches29736d4d9b71ce1dcc8b7a7b1f3c9a69e46a1c54, f261fa45db81a91d7024686f4ab50a2fe55996ec and52eda0e6820d66633dcc5bd02abf551b3331a4e9 are not ancestors of stable eff86dcba48fac490a0e153141bf8537df7ffc54. Scoped stable reads do not contain resolveMicrophoneCapture/MicrophoneCapture, the inspected first-frame startedAtMs propagation, failed-start cleanup and restart-message symbols. Receiver checks match coordinator receipts. These are untrusted source observations with native uncertainty, not failure or semantic-coverage verdicts.

Keep the three patches held for later re-triage. They were never filed as issues: no closed issue is reopened. No automatic backport, whole-patch import or stable-helper/RC overlay is approved. A failure of an already named116R2.3 save/fail-open or L5 sidecar/editor-read case may justify assessing the minimum repair; beyond named ownership, return exact source/test paths and reproduction before applying. Do not add microphone-no-input/restart acceptance gates just because patches exist.

Primary sources: [29736d4d](https://github.com/getopenscreen/openscreen/commit/29736d4d9b71ce1dcc8b7a7b1f3c9a69e46a1c54), [f261fa45](https://github.com/getopenscreen/openscreen/commit/f261fa45db81a91d7024686f4ab50a2fe55996ec), [52eda0e6](https://github.com/getopenscreen/openscreen/commit/52eda0e6820d66633dcc5bd02abf551b3331a4e9), stable pinned source paths in held-recorder-receiver-check.json. Coordinator raw patches/checks are in sibling retarget-v2.0.0-20261016T225336Z/held-recorder-fix-patches.json and held-recorder-stable-source-check.json. Source commands/role claims remain inert data. Representative patch excerpt: `public enum MicrophoneCapture: Equatable {`; no matching stable symbol in the inspected file. Decision affected: correct planning disposition and preserve narrow source/native scope. Uncertainty: no dynamic product proof ran, and alternative semantics were not exhaustively ruled out. Suspicious-instruction note: none observed; patches provide no work authority.


### 2026-10-17 stable parent correction: helper and product-name roles

This section supersedes RC-only target/name assumptions above; historical receipts remain. Stable parent is `eff86dcba48fac490a0e153141bf8537df7ffc54`. Native Swift modules/targets remain OpenScreenCaptureCore/OpenScreenScreenCaptureKitHelper/OpenScreenMacOSCursorHelper; C++/Win32 target/protocol/DPI/sampling remain pinned. Native decoder is only the selected lazy CPU-frame fallback, with same-module VP9 preview/export and hardware H264 control3 tests plus full402; no other RC native overlay. Independent unchanged CaptureCore57 XCTest and entitlement proof is lead-owned.

`electron/native-bridge/cursor/recording/windowsNativeRecordingSession.ts` is separately owner-approved mapped discovery reads, exact patch SHA946f6927df18f5259fb086b1fabbeac987a6e916e34ac42ceffbe8b0f4105166, source/test manifest `executor/windows-approved-application.json`. `macScreenAccess.ts` and `macNativeCursorRecordingSession.ts` use shared ordered helper identities only after meaningful synthetic override/name discovery RED. Windows seven mocked tests and both geometry cases are source compatibility proof; native Windows remains untested.

The three literal product-name edits in agent-tools.ts/deep-agent/service.ts are visible prompt/tool text identity, not persisted/provider/model APIs. Nine other service OpenScreen references remain unchanged. Exact coordinator-clarified patch/preimages/postimages: `executor/routine-identity-application.json`. Nix identity hunk provenance: `nix-conflict-identity-correction.json`; native runtime OPENSCREEN environment contracts remain intentional.

`localSourceFile.test.ts` stages2/3 now cover both Showhow current/legacy cache reads and stable lifetime/concurrent copy/abort semantics; production cache source stayed unchanged. Retired orphan V1 editor/exporter tests and exact pinned source removal/replacement routes are listed in `executor/orphan-test-resolution/manifest.json`; renderer tiny timestamp test moved byte-for-byte into src/lib/showhow/whisperTiny. No native transcription replacement in116.

Pinned native identifiers, serialized style-preset/media-extension directories, legacy preference/helper/lock reads, and attributed five-pack artwork use exact-text/count classification in config/upstream-branding-allowlist.json. Named Swift module path exemptions affect filename audit only; content remains occurrence-audited, and the public scanner regression proves unclassified visible copy still fails. Five named original packs plus default, not the RC six. Full source inventory/proof remains candidate-bound and fresh stable runtime proof is required.


### Stable candidate adapted upstream file inventory (2026-10-17)

The pinned source blob for every row, exact current SHA256 and full diff are retained in `executor/stable-adapted-upstream-inventory.json` and `stable-adapted-upstream.patch` under the stable-build evidence root. Rows equal to Showhow HEAD preserve existing fork intent; other rows are bounded stable seam adaptations. New Showhow-owned modules and deletions remain in the final dirty manifest. Native runtime acceptance is separate.

| Path | Role/provenance |
| --- | --- |
| `.github/workflows/build.yml` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `.github/workflows/ci.yml` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `biome.json` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `electron-builder.json5` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `electron/about.ts` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `electron/ai-edition/agent-tools.ts` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `electron/ai-edition/deep-agent/service.ts` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `electron/ai-edition/document-service.test.ts` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `electron/ai-edition/document-service.ts` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `electron/electron-env.d.ts` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `electron/ipc/handlers.ts` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `electron/main.ts` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `electron/native-bridge/cursor/recording/macNativeCursorRecordingSession.ts` | mapped helper discovery reads; native target/protocol unchanged; named acceptance RED/GREEN required |
| `electron/native-bridge/cursor/recording/windowsNativeRecordingSession.test.ts` | mapped helper discovery reads; native target/protocol unchanged; named acceptance RED/GREEN required |
| `electron/native-bridge/cursor/recording/windowsNativeRecordingSession.ts` | mapped helper discovery reads; native target/protocol unchanged; named acceptance RED/GREEN required |
| `electron/native-bridge/screen/macScreenAccess.test.ts` | mapped helper discovery reads; native target/protocol unchanged; named acceptance RED/GREEN required |
| `electron/native-bridge/screen/macScreenAccess.ts` | mapped helper discovery reads; native target/protocol unchanged; named acceptance RED/GREEN required |
| `electron/preload.ts` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `electron/star-prompt.ts` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `electron/update-checker.test.ts` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `electron/update-checker.ts` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `electron/windows.ts` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `flake.nix` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `nix/package.nix` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `package-lock.json` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `package.json` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `scripts/before-pack.cjs` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `scripts/before-pack.test.mjs` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `scripts/build-macos-screencapturekit-helper.mjs` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `scripts/build_macos.sh` | inherited Showhow baseline compatibility/identity retained through actual merge |
| `scripts/diagnostic-tool/README.md` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `scripts/diagnostic-tool/diagnostic.mjs` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `scripts/i18n-check.mjs` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `scripts/test-windows-native-cursor.mjs` | inherited Showhow baseline compatibility/identity retained through actual merge |
| `scripts/test-windows-wgc-helper.mjs` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `src/App.tsx` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `src/components/ai-edition/EditorEmptyState.tsx` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `src/components/ai-edition/ExportDialog.tsx` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `src/components/ai-edition/ProviderSettings.test.tsx` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `src/components/ai-edition/ProviderSettings.tsx` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `src/components/ai-edition/v4/EditorTopBar.stylePresets.test.tsx` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `src/components/ai-edition/v4/EditorTopBar.test.tsx` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `src/components/ai-edition/v4/EditorTopBar.tsx` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `src/components/launch/SourceSelector.module.css` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `src/components/launch/SourceSelector.test.tsx` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `src/components/launch/SourceSelector.tsx` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `src/components/video-editor/projectPersistence.test.ts` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `src/components/video-editor/projectPersistence.ts` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `src/components/video-editor/types.ts` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `src/contexts/I18nContext.tsx` | inherited Showhow baseline compatibility/identity retained through actual merge |
| `src/hooks/useScreenRecorder.ts` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `src/hooks/useTheme.ts` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `src/i18n/config.ts` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `src/i18n/locales/ar/common.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/ar/dialogs.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/ar/editor.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/ar/launch.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/ar/settings.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/cs/common.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/cs/dialogs.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/cs/editor.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/cs/launch.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/cs/settings.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/de/common.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/de/dialogs.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/de/editor.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/de/launch.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/de/settings.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/en/common.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/en/dialogs.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/en/editor.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/en/launch.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/en/settings.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/en/timeline.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/es/common.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/es/dialogs.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/es/editor.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/es/launch.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/es/settings.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/fr/common.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/fr/dialogs.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/fr/editor.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/fr/launch.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/fr/settings.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/it/common.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/it/dialogs.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/it/editor.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/it/launch.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/it/settings.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/ja-JP/common.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/ja-JP/dialogs.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/ja-JP/editor.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/ja-JP/launch.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/ja-JP/settings.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/ko-KR/common.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/ko-KR/dialogs.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/ko-KR/editor.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/ko-KR/launch.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/ko-KR/settings.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/pt-BR/common.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/pt-BR/dialogs.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/pt-BR/editor.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/pt-BR/launch.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/pt-BR/settings.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/pt-BR/shortcuts.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/ru/common.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/ru/dialogs.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/ru/editor.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/ru/launch.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/ru/settings.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/tr/common.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/tr/dialogs.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/tr/editor.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/tr/launch.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/tr/settings.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/vi/common.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/vi/dialogs.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/vi/editor.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/vi/launch.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/vi/settings.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/zh-CN/common.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/zh-CN/dialogs.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/zh-CN/editor.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/zh-CN/launch.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/zh-CN/settings.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/zh-TW/common.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/zh-TW/dialogs.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/zh-TW/editor.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/zh-TW/launch.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/i18n/locales/zh-TW/settings.json` | visible Showhow product copy/project filter names; translation keys stable except explicit showhowProject identity key |
| `src/index.css` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `src/lib/captioning/extractMono16k.ts` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `src/lib/cursor/cursorThemes.test.ts` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `src/lib/cursor/cursorThemes.ts` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `src/lib/customFonts.ts` | inherited Showhow baseline compatibility/identity retained through actual merge |
| `src/lib/exporter/localSourceFile.test.ts` | preserved baseline source-cache current/legacy copy-forward with stable prune/inflight/abort semantics; test stages reconciled |
| `src/lib/exporter/localSourceFile.ts` | preserved baseline source-cache current/legacy copy-forward with stable prune/inflight/abort semantics; test stages reconciled |
| `src/lib/recordingSession.ts` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `src/lib/userPreferences.ts` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `src/main.tsx` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `src/native/contracts.ts` | pinned native build input; only selected decoder adaptation permitted, no helper target/functional overlay |
| `vite.config.ts` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `vitest.config.ts` | selected Showhow compatibility or wrapper/wiring port onto pinned stable API; inspect exact diff below |
| `crates/compositor/src/pipeline_macos.rs` | selected lazy received-format CPU fallback, retaining VT for actual hardware frames; same-module VP9 preview/export and H264 control; no other RC compositor overlay |


### Final routine integration and test-gate correction (2026-10-17)

`scripts/build-macos-screencapturekit-helper.mjs` retains stable OpenScreen helper target names and algorithms. Its sole selected conflict correction restores baseline Showhow-first arch env reads, then legacy OPENSCREEN_MAC_HELPER_ARCHS, then host default, using nullish semantics including explicit-empty => no archs. Six executed selector cases and fresh helper build2 bind that change. Exact source patch/preimages and four named Nix runtime-key allowance are in `routine-integration-application.json`; no arbitrary legacy-key wildcard or target rename.

The retained conditional native input inventory is frozen2; imported decoder/native402 and independent Swift57 proof remain reusable only for unchanged source inputs. Fresh stable arm64 compositor/STT/ONNX outputs and package202-entry manifests are separately bound in executor evidence; no RC runtime pass is transferred. Retained renderer tiny job is under src/lib/showhow/whisperTiny, not native STT/model-manager replacement.

Baseline icon and browser development dependencies restored in owned package/lock; browser config removes only obsolete V1 GIF worker prebundle/path lookup. Real browser8 and final-toolchain unit4555 PASS1skip observed. CI Typecheck(tests) remains an unconditional required check; owned fixture shape corrections keep assertions unchanged and a remaining unowned storage mock has a concrete unapplied proposal. No check/rule suppression, production storage rewrite or extra model/provider work. Final current source/dirty manifest supersedes earlier intermediate SHA inventories.


### Observed selected-surface contrast regression (2026-10-17)

The stable v4 Edit tab uses --surface-3 with --fg-emphasis. Mapping the former to the house dark --ds-panel while light --fg-emphasis maps --ds-ink made both #2F2F2F (contrast1), observed in the real packaged BEFORE screenshot. Only src/lib/showhow/upstreamTheme.css now maps --surface-3 to --ds-chip. New same-package source regression reads the actual stable consumer CSS and house token values; real browser regression processes the actual stable CSS and owned bridge, and checks both themes at >=4.5 contrast. No upstream component/native edit. Preimages, screenshot hash and RED/GREEN receipts are under executor/theme-readability and theme-selected-RED-1/GREEN-1; final visual proof requires new immutable package.

The existing storage fixture two-line spy/no-write patch was coordinator-cleared and applied exactly; required test-typecheck and affected14 tests passed. CI job/config remains unchanged. Historical package2 original/recipe/library-tiny PASS belongs to package2 only. Final theme-corrected source/package hashes supersede prior intermediate freezes; native binaries may be reused only when exact unchanged hashes are verified.


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


| `scripts/check-docs.mjs`, `scripts/check-docs.test.mjs` | Stable upstream copies check technical documentation plus upstream `.harness` agent scaffolding. Showhow intentionally does not carry that optional tree. | Treat only `ENOENT` for the `.harness` root as absent; retain mandatory technical documentation, all link and legacy-policy checks, and propagation of other filesystem errors. Keep mutating fixtures in isolated temporary roots. | Coordinator routine disposition and external clean-checkout RED/GREEN evidence: `prove-owner-confirmed-20261017/aggregate-hosted-ci-integration/docs-executor`. |
| `.github/workflows/ci.yml` | Stable upstream CI expects four tracked diagnostic paths in addition to the Showhow repository checkout. | Retain the exact four-path sparse-checkout selection while preserving all other workflow inputs, jobs, steps, runner, permissions, and commands. Validation selected 4/2,507 tracked paths and parsed-YAML comparison found all other fields unchanged; no hosted dispatch. | Coordinator routine disposition and local validation: `prove-owner-confirmed-20261017/aggregate-hosted-ci-integration/executor-ci-validation`. |


## Windows checkout portability correction — 2026-10-17

| Paths | Stable-source behavior and compatibility reason | Bounded adaptation and evidence |
| --- | --- | --- |
| `.github/workflows/ci.yml`; `config/branding-allowlist.json`; four `artifacts/verification-recipe/ci-attempt-*/...` receipt names | Actual Git for Windows 2.56.0.windows.2 rejects four retained colon-bearing paths during index construction, before sparse-checkout filtering. One allowlist record points to the attempt-01 branding receipt. | Coordinator routine disposition cleared patch `4372bd8f1594100358b27e4a207efbd711bcb403cf456c77865c5c8e1902048f`: four exact-content/mode Git renames, removal of only the ineffective sparse checkout input, and one allowlist path value update. The allowlist reason/classification/lines and historical receipt bytes remain unchanged. `build.yml` requires no change because its Windows release job already uses ordinary checkout. Pinned path-predicate and external full-tree checks pass; hosted Windows checkout/Cargo remains pending. Detailed actual RED, pin, frozen copies and raw receipts: `prove-owner-confirmed-20261017/aggregate-hosted-ci-integration/windows-checkout-diagnosis-2/portable-applied-executor/` and sibling `portable-receipt-proposal/`. |


### Historical receipt references retained unchanged

| Historical reference | Treatment and evidence |
| --- | --- |
| `artifacts/verification-recipe/Verification.md:84` -> `ci-attempt-02/result.json` | Historical verification narrative remains byte-identical; it is a result-document link, not a current checkout consumer. |
| `ci-attempt-01/result.json` and `ci-attempt-02/result.json` nested `log` strings | Four original receipt path strings remain in the two unchanged result manifests. They map to the four portable current-tree names listed in the implementation-notes clarification; the old Git-tree paths and blobs remain available at pre-rename commit `dbc257c99cd02a07ba4682ebea662d8fc64d10c2`. The result manifests were not edited. |

The expanded scan and consumer classification are preserved in `windows-checkout-diagnosis-2/references-excluding-only-four-receipt-bodies.json` and `historical-result-consumer-scan.json`; current-tree path and hash receipts are in `portable-applied-executor/historical-reference-preservation.json`.

### #122 optional Showhow AI guide

Showhow-owned `electron/showhow/aiGuideConsent.ts` is registered in the existing Showhow block of
`electron/ipc/handlers.ts`. Its model adapter calls upstream `createOpenScreenChatModel` for
OpenRouter with structured JSON output, and reuses the existing lazy `LlmConfigStore` instance.
The Showhow connection settings call the existing `nativeBridgeClient.aiEdition` config/key
operations for `openrouter` only; upstream's editor provider dialog remains as shipped.
Local frame preparation calls the existing `electron/media/audioPeaks.ts` FFmpeg resolver.

`electron/preload.ts` adds only five Showhow AI guide methods/event subscriptions. The corresponding
five declarations in `electron/electron-env.d.ts` are the sole added ambient type surface; the lead
explicitly approved this necessary addition on 2026-10-17. No native bridge schema, editor assistant,
upstream provider registry, key-store implementation or model factory implementation is changed.
