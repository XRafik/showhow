# Verify a native Showhow GIF export

Use this recipe for editor/export verification on macOS. It opens only the committed two-second synthetic `tests/fixtures/sample.webm`, drives the built production editor and GIF encoder, and saves through the production `write-export-to-path` IPC handler. The operating-system save-path picker is the only replaced handler.

Run in a dedicated Showhow ticket worktree. Keep personal recordings and the default profile out of the journey. Do not search for newer recordings or cursor sidecars. Do not change permissions, dependencies, product code, HOME, credentials, or Codex profiles to get a passing result.

## Prepare once in the lane

Use Node 22.22.1, npm 10.9.4, Codex 0.160.0 or 0.162.1, and the repository's locked Electron and Playwright dependencies. FFmpeg and ffprobe must already be available. The driver checks these prerequisites and the built main/preload/renderer before launching; it never installs or builds itself.

```sh
export PATH="$HOME/.nvm/versions/node/v22.22.1/bin:$HOME/.npm-global/bin:$PATH"
command -v node; node --version
command -v npm; npm --version
command -v codex; codex --version
ruby ~/.local/bin/bedar-runtime.rb run --resource heavy -- npm ci
ruby ~/.local/bin/bedar-runtime.rb run --resource heavy -- npm run build-vite
ruby ~/.local/bin/bedar-runtime.rb run --resource heavy -- npm run test:verify:export
```

For a Codex role-shell launch, follow the head-office role launch procedure and record the exact launch and resolved tools. An API subagent is not thereby a native `codex -p bedar-executor` profile. Each result records observed shell role variables and explicitly avoids claiming a native Codex profile was launched.

Exit 75 from the heavy runtime means the resource was busy and nothing ran. Queue the same command once the resource is free. Any other nonzero exit is a failed attempt; retain its evidence.

## Verify an explicit packaged app

For packaging acceptance, supply the preserved arm64 bundle explicitly:

```sh
ruby ~/.local/bin/bedar-runtime.rb run --resource heavy -- npm run verify:export -- --evidence-dir artifacts/verification-recipe/packaged-unique --app /absolute/path/to/Showhow.app
```

This mode resolves `Contents/MacOS/Showhow` and `Contents/Resources/app.asar`.
It checks the archive identity and entrypoints before launch and never falls back
to dependency Electron or worktree output. It pauses that executable with the
Node inspector before the packaged main's first statement, sets private appData,
userData, sessionData, downloads, temp, logs, crashDumps and app-level home paths,
then resumes the original packaged entrypoint. HOME remains unchanged. Production
bootstrap selects `appData/Showhow`, so appData must be private before it runs.
The result must report `launchMode: "packaged"`, the actual packaged executable,
`app.isPackaged`, the archive path, startup pause location and unchanged archive
hashes. The package is never edited. Inspect the native evidence before claiming
that this startup boundary worked on macOS.

The lead may reuse the exported
`launchPackagedApp({ appPath, paths, env, cwd, marker })` for private native proof.
Create every `paths` directory in a new private run root first; use
`userData: path.join(paths.appData, "Showhow")` and set TMPDIR/TMP/TEMP to
`paths.temp` while retaining HOME. The promise returns `{ app, startup, packaged }`;
`app` is the Playwright Electron application, and its main evaluation can read
`globalThis.__showhowVerificationRuntime()`. The caller owns process tracking,
normal app closure, private-root cleanup and assertions on actual runtime paths.
A failed pre-main initialization terminates the owned child through its inspector
before disconnecting. Playwright also cleans up failed launches. A returned app
is closed on helper failure.

`app.getPath("home")` isolation does not change `os.homedir()`. Showhow's native
recording bundle root remains `~/Showhow/Recordings`. A separate owner-approved
synthetic transcription proof must touch only its exact newly created bundle;
this export recipe does not authorize scanning or deleting personal recordings.

## Run the five stages

Choose a new directory under `artifacts/verification-recipe`; its parent must already exist. Never reuse or overwrite a prior run directory.

```sh
ruby ~/.local/bin/bedar-runtime.rb run --resource heavy -- npm run verify:export -- --evidence-dir artifacts/verification-recipe/native-unique
```

1. **Doctor.** Resolve the repository, exact tools, dependencies, Electron executable, built entrypoints, and readable fixture. Reserve a fresh evidence directory atomically. A missing prerequisite prevents Electron launch. Existing directories are rejected without touching their bytes.
2. **Launch.** Allocate a private temporary root. The generated bootstrap synchronously sets appData, userData, sessionData, downloads, temp, logs and crashDumps before importing production main. TMPDIR, TMP and TEMP point at the private temp directory. HOME remains unchanged. Observe the final production appData/Showhow profile, recordings directory, all runtime paths, and both stable-instance lock files; both lock PIDs must equal the launched Electron PID and every path must remain within the private root.
3. **Drive.** Copy the synthetic fixture into isolated recordings and confirm its hash. Use production video-path and switch-to-editor IPC. Subscribe to the new window before switching; tolerate a closed HUD only when its closure is observed. Reload the editor once, as the existing GIF E2E requires for first-load WebCodecs registration, and observe actual decoder/encoder functions. Wait with finite deadlines for the actual video duration and canvas, then capture `editor.png`.
4. **Evidence.** Replace only `pick-export-save-path` with the private GIF destination. Click the existing Export, GIF and Export buttons. Observe the actual `GIF exported successfully` toast and the file concurrently. The production export finally closes its progress dialog, so waiting for an `Export Complete` dialog is not a reliable completion condition. Check GIF bytes, size above 1 KiB, positive dimensions, at least two decoded frames, and duration between one and four seconds. Independently decode the entire file with FFmpeg `-xerror`; a zero exit is required. Save `complete.png` and the synthetic `export.gif`.
5. **Cleanup.** Close the owned Electron app, observe its process tree with PID birth times, and boundedly escalate only still-identical owned PIDs. Remove only this invocation's temporary root after its observed processes are gone. Rehash the committed source fixture. Exit zero requires the journey, decoding, unchanged fixture and complete cleanup all to pass.

## Inspect and resume

Inspect `result.json`, both screenshots, the GIF and `electron.log` before claiming success. The result includes source SHA and dirty paths, actual executable paths and versions, Electron PID, runtime isolation observations, media dimensions/frame count/duration, both fixture hashes, and cleanup observations. Published paths replace the home, lane and temporary root with placeholders; containment was checked against actual real paths before sanitization.

Watch the native application during the attempt. If any OS permission prompt, personal recording, or non-isolated profile appears, stop that attempt, preserve sanitized failure evidence and clean up only its owned processes. Never change permissions or make a production fix as part of this recipe. The driver does not grant permissions or automate system dialogs. A production blocker needs a separately scoped task.

A failure records its stage and retains captured evidence. Do not automatically retry. Inspect the cause, make a narrowly authorized harness correction if applicable, then choose a different new evidence directory. Never relabel a failed run as passing. If cleanup is incomplete, preserve the root and use the recorded owned PID/birth-time observations to investigate; do not kill unrelated applications or delete other temporary roots.

Run a second fresh invocation to prove repeatability. Both successful runs must show complete cleanup and unchanged fixture hashes. Focused negative tests support the safety boundaries; actual native runtime paths, locks, filesystem writes, decoded media and cleanup establish the macOS journey.

## Proof limits

This proves synthetic editor load, renderer GIF export, production filesystem save and bounded isolated cleanup on the tested macOS machine. It does not prove recording permissions, recording bundles, native save-dialog interaction, MP4 export, recording/transcription behavior, Windows or Linux behavior. Development mode does not prove packaging; explicit packaged mode proves only the named export path in that archive. Screenshots and GIF signatures alone are insufficient export proof. The existing GIF e2e replaces the writer and uses the default profile; this recipe supplies the isolated real-write boundary it lacks.
