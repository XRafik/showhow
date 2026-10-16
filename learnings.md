# Learnings

Append-only. One dated line per learning: what happened, then what to do next time.

- 2026-10-16: electron-builder packs every `dependencies` entry into `app.asar`, even when Vite already bundles the renderer. Showhow carried about 600 MB of dead `node_modules`. Next time, audit packaged contents (`npm run check:package`) before release, not only the bundle.
- 2026-10-16: Answering "Trust all" to a Codex hooks prompt inside a Loop role pane writes hook trust into that role's profile and breaks later launches. Answer "Continue without trusting" in role panes.
- 2026-10-16: A Loop ticket lead cannot prompt the coordinator across Herdr workspaces, and an idle Codex coordinator does not poll. Unattended runs need a supervisor that watches the lead pane and `~/dev/loop-evidence/<repo>-<n>/STOP.md`.
- 2026-10-16: The CI semantic-title check rejects `design:` and does not re-run on title edits. Use an allowed type (`docs(design):`) and re-run the failed job after renaming.
- 2026-10-16: The disk filled to 0 bytes mid-session (iOS simulators held about 39 GB). Check `df -h /` before packaging builds; a two-build ticket needs about 10 GB free.
