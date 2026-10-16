# Showhow Roadmap

**North star: show it once.** Record a bug or a process, press one button, and get a step-by-step guide with screenshots and timestamps. Hand it to a coding agent as a brief plus the folder path, or send it to a client as a PDF.

This is the human-readable plan. The machine-readable plan is [`.bedar/project-plan.yml`](./.bedar/project-plan.yml).

## Principles

- **The recorder wins, always.** Every Showhow addition is fail-open. If bundling breaks, transcription fails or AI is unavailable, the recording still saves. A take is never lost to a feature.
- **Local-first, free, optional AI connections.** Recording, transcription, editing and the click-based steps run on your Mac with no account. AI writing (guides, agent briefs, AI edits) is optional and only runs when you connect ChatGPT or OpenRouter and ask for it. There are no paywalls or paid tiers.
- **macOS first.** V1 targets macOS 13+. Windows and Linux keep the inherited recorder, but the Showhow layer isn't hooked up there.

## Shipped

- **Folder bundles:** every recording is saved as a recoverable folder with the video, cursor telemetry, `meta.json` and an on-device timestamped transcript.
- **Deterministic steps:** one marked screenshot per click, matched to the transcript, as `steps.json` and `steps.md`. Steps can be regenerated and edited.
- **Library and doc view:** recordings newest first, with video, numbered screenshots, seekable timestamps and Copy path.
- **Agent handoff proof:** a coding agent diagnosed a recorded bug from the folder path alone.

## V1 (in progress)

The full design is locked in `design/showhow.pen` (`Final · …` frames). V1 ships six features:

1. **Recording:** a source picker, a countdown and a floating bar, returning to the library on Stop.
2. **One-button AI guide:** steps, screenshots and timestamps written from your narration.
3. **Editor with an AI assistant:** the inherited editor in the Showhow style, with preview, apply and undo for AI edits.
4. **Library as home**, including MP4 import.
5. **Copy for agent:** a detailed brief plus the folder path. If no brief exists yet, Showhow makes it first.
6. **PDF export** for clients and walkthrough posts.

Order of work: move onto upstream OpenScreen v2 under a reviewed migration plan, build the interface with sample data, then connect the real features one at a time, starting with recording.

## Not in V1

MCP access to the library, the browser companion, a notes window while recording, demo-video export, and the Showhow layer on Windows and Linux.

## Inherited from upstream

Showhow is built on [getopenscreen/openscreen](https://github.com/getopenscreen/openscreen). Upstream is a release parent: changes come in through one reviewed merge PR per release tag under [`UPSTREAM.md`](./UPSTREAM.md). Recorder and editor bugs that also affect upstream belong in upstream's tracker.
