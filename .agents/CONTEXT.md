# Showhow

## What it is

Showhow is a free, local-first Electron desktop screen recorder that saves recordings as self-contained folders for coding agents. It adds a workflow-documentation and agent-handoff layer while preserving the inherited recorder and editor. It is pre-v1, not production-grade, and the Showhow layer targets macOS 13+ today.

## Why it exists

Give an agent a recording folder path instead of narrating the same bug again in a written report. Local video, cursor telemetry and timestamped transcription supply the context; the roadmap adds deterministic workflow documents and a copy-path handoff.

## Studio goal it serves

None directly; portfolio and build-in-public content

## Stack

TypeScript in strict mode, Electron, React 18, Vite and Pixi.js v8. Node 22.22.1 and npm 10.9.4. Vitest with jsdom for unit tests, Vitest browser tests with Playwright, Playwright E2E tests, and Biome 2.4 for lint and formatting. The main process is in `electron/main.ts`, the renderer in `src/`, and shipped Swift ScreenCaptureKit and C++/Win32 WGC helpers in `electron/native/`. Showhow-specific logic belongs in `electron/showhow/` and `src/lib/showhow/`.

## Constraints the owner cares about

- V1 is record, folder bundle, workflow doc, then copy path. Preserve the recorder and editor; documentation failures must never discard a valid recording.
- Keep processing local, free forever, with no required cloud, account, API key, paywall or paid tier.
- Before upstream intake, follow `UPSTREAM.md`: OpenScreen is a release parent with a permanent tags-only remote and one reviewed merge PR per release tag. The v2 migration waits for final `v2.1.0`; no Showhow `v*` release tag until the milestone is complete.
- New projects use `.showhow`; preserve readable `.openscreen` projects and legacy data. Keep the `<video path>.cursor.json` convention.
- Native capture requires smoke tests on the target OS; Linux checks cannot prove macOS or Windows behavior.
- Planned doc-engine, library, bridge and polish features require current code and acceptance evidence before being called complete.
- Phases 6 and 10 are parked in `.bedar/project-plan.yml`; keep their modes unchanged.

## Head office

- Repository: https://github.com/bedarstudios/OS (private)
- Local path: ~/dev/OS
- Before planning or build work, read both `~/dev/loop/AGENTS.md` and
  `~/dev/loop/README.md` for current workflow guidance and the skill catalogue.
