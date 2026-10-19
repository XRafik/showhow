# Learnings

Append-only. One dated line per learning: what happened, then what to do next time.

- 2026-10-16: electron-builder packs every `dependencies` entry into `app.asar`, even when Vite already bundles the renderer. Showhow carried about 600 MB of dead `node_modules`. Next time, audit packaged contents (`npm run check:package`) before release, not only the bundle.
- 2026-10-16: Answering "Trust all" to a Codex hooks prompt inside a Loop role pane writes hook trust into that role's profile and breaks later launches. Answer "Continue without trusting" in role panes.
- 2026-10-16: A Loop ticket lead cannot prompt the coordinator across Herdr workspaces, and an idle Codex coordinator does not poll. Unattended runs need a supervisor that watches the lead pane and `~/dev/loop-evidence/<repo>-<n>/STOP.md`.
- 2026-10-16: The CI semantic-title check rejects `design:` and does not re-run on title edits. Use an allowed type (`docs(design):`) and re-run the failed job after renaming.
- 2026-10-16: The disk filled to 0 bytes mid-session (iOS simulators held about 39 GB). Check `df -h /` before packaging builds; a two-build ticket needs about 10 GB free.

- 2026-10-18: The post-#117 baseline was already below 400 MiB; its audit failed on content rules. Record physical installed copies and DMG sizes separately, and never describe policy RED as an oversize failure.
- 2026-10-18: rec-button.png looked removable but electron/main.ts loads it for the recording tray. Search main-process references before excluding public assets, and require referenced images to exist and decode in package tests.
- 2026-10-18: du can report zero for a symlink app root. Resolve or reject symlink roots before measuring package size; retain failed receipts and use matching physical-copy methods for comparisons.
- 2026-10-18: A stale computer-use app read can reopen a closed packaged app without its scratch profile. Avoid reading closed app handles; if reopened, exclude that launch from proof, close the exact owned process and rehash protected originals.

- 2026-10-18: Per-chunk model download notifications flooded the renderer and reproduced a fresh-playback freeze. Bound notification frequency while emitting the first and exact final counts; prove the old/new behaviour with matched input chunks and a subsequent native run. A later passing recording alone does not prove the original cause.
- 2026-10-18: End-of-timeline Play can meet a virtual end guard before the media element reports ended. Route replay through the first kept segment and existing seek/resume path; cover trimmed and multi-asset inputs rather than relying on media.play() to rewind.
- 2026-10-18: A background native harness reading terminal stdin can stop with SIGTTIN. Use the retained FIFO command pattern, bind owned PID/birth/executable and confirm cleanup instead of repeatedly resuming a stopped process.
- 2026-10-18: Reused check receipt names overwrote an initial TypeScript failure. Use unique exclusive-create output paths, retain each failed stream, and disclose gaps instead of reconstructing raw output.
- 2026-10-18: Shared progress colours passed dark appearance but failed graphical contrast in light appearance. Measure active and failed fill/track pairs in both themes using actual rendered pixels before independent review.
- 2026-10-18: A full stale entry returned from a step save overwrote a newer Library title. Merge only fields owned by that save into the originating bundle and test both delayed title-to-step and step-to-title completion orders.
