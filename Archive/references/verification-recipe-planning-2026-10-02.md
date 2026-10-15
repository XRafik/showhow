# Verification recipe planning evidence

Source: fresh `origin/main` 74e0a70c8584d4b7eb279f856bd29e2275efef6c, planning branch `plan/verification-recipe-20261002`, repository `bedarstudios/showhow`.

Canonical checkout `fix/branding-allowlist-pen` dirty design/showhow.pen and untracked design/showhow-export.html retained. Only planning worktree files changed. No root PLAN existed to archive; root learnings.md and PLAN-FEEDBACK.md absent.

Observed required Node v22.22.1 and npm 10.9.4 under installed nvm tree. Default shell uses Node v24.14.0/npm 11.9.0 and is unsuitable. ffmpeg/ffprobe installed. ffprobe fixture result: VP9, 640x480, 2.000000 seconds, 23,869 bytes. No dependency install, build, native app launch or product proof performed during planning.

Runtime preflight `--before-setup` returned ready true, free_bytes 9994629120, no errors, dependency_setup_deferred true. Ordering limitation: this was run after creating the planning worktree, not before. It does not prove prepared ticket dependencies/hooks.

Existing `tests/e2e/gif-export.spec.ts` removes/replaces both export picker and writer, stores base64 export in main global, writes with the test process, and uses default userData/test-sample.webm. Reuse its fixture and editor locators, not its isolation or writer mock.

Existing `scripts/capture-showhow-preview.mjs` invokes cmd.exe for builds and searches newest native cursor recording when no explicit sidecar supplied. It captures rendered preview frames, not export persistence. Not selected.

Production `electron/bootstrap.ts` sets Showhow name, migrates/selects profile from appData and then imports main. Production main computes recordings directory at module load. Isolating only a CLI userData switch is insufficient. `electron/singleInstanceLock.ts` uses os.tmpdir and user-keyed stable locks, requiring private temporary environment for owned app child as well.

Official Electron API docs queried through Context7 `/electron/electron`: app.setPath target directories must exist; sessionData must be set before ready. The generated bootstrap must synchronously set paths before production import; record and assert final runtime values.

Sources: https://www.electronjs.org/docs/latest/api/app ; https://playwright.dev/docs/api/class-electron ; current project AGENTS.md, .agents/CONTEXT.md, .agents/HANDOFF.md, package.json, .github/workflows/ci.yml and .github/actions/setup/action.yml.

Existing HANDOFF next action proposes Phase 6, but phases 6 and 10 remain parked and this task does not authorize that proposal.
