# Showhow UI direction — design review

Date: 2026-10-12. Status: first visual design pass, not production implementation or an approved delivery plan.

## Confirmed direction

- The owner approved the library → choose guide or agent brief → generate → review → export/copy flow in the 2026-10-11 interactive mock.
- `design/showhow.pen` is the visual source of truth. The owner selected its **newer dither version** on 2026-10-12.
- Native recordings and imported MP4 software walkthroughs share a local library. Import makes a managed copy and preserves the original file. AI generation starts on explicit request.
- Guide and agent-brief evidence uses the **original recording**, approved on 2026-10-12. Editing a video for sharing must not invalidate its guide timestamps or screenshots.
- The two AI connections are ChatGPT plan sign-in and OpenRouter. Core recording and manual editing remain usable without an AI connection. External AI processes selected evidence when requested.
- Assess OpenScreen v2 first, design the full experience next, build with sample data behind replaceable interfaces, then connect real features in focused steps.
- Do not resume parked maintenance tickets, merge the full upstream branch, or restore upstream release infrastructure as part of this design exercise.

## Added Pen screens

Existing screens, reusable components, tokens and shader files were retained. New screens are independent additions; none of these screens proves working application behaviour.

| Screen | Node | Purpose |
|---|---|---|
| 47 · Imported video and guide | `a6ige` | Local import, video-edit entry, separate output choice, editable guide and PDF action |
| 48 · Agent brief | `ri9fd` | Requested change, observation, expected result, evidence and copy handoff |
| 49 · AI connections | `HUFqA` | ChatGPT/OpenRouter setup and explanation of evidence leaving the device |
| 50 · Editor assistant | `XsTWa` | Existing editor visual language with proposed preview/apply/discard actions |
| 51 · MP4 import | `riTTf` | Choose/drop file and local-copy explanation |
| 52 · Evidence review | `Eluar` | Proposed review of transcript and frames before generation |
| 53 · Generation failure | `hUVN5` | Retry/change provider while retaining recording and previous draft |
| 54 · Import progress | `TS4xH` | Copy progress and cancellation |
| 55 · Dark guide | `ekpyg` | Existing Dark tokens applied to the guide surface |

The dither media areas are design placeholders, not a proposal to obscure actual video or screenshots. Actual evidence must remain readable. Decorative sidebar dither follows the existing design. Reference screens 36 (`lfTGI`), 38 (`F78q2Q`) and 42 (`WSh7g`) remain unchanged and are explicitly labelled Existing in the review gallery.

Scratch review gallery: `/tmp/showhow-design-review-20261012/index.html`. It embeds exported images and supports screen selection and arrow navigation. It is a visual review, not a functional Electron prototype. The approved earlier behavioural mock remains `/tmp/showhow-flow-20261011/index.html`.

## Proposed interactions to review

- Editor AI changes are previewed before application and can be undone. This is a Showhow UX proposal, not a claim that upstream already implements that exact interaction.
- One AI connection area serves generation and assisted editing, with capability checks per action.
- A generation review exposes the transcript and selected frames before sending them to the chosen provider. Exact evidence editing controls remain to be bounded.
- Imported media without cursor telemetry can generate guides; click-driven auto-zoom is unavailable without the required telemetry.
- A failed remake leaves the previous draft intact. Edits must persist across selection, navigation, retry and restart in the real build; the original throwaway mock does not prove this.

## Remaining design coverage

This pass does not claim the full app redesign is finished. Complete the following before treating the Pen file as the full build specification:

| Surface | Existing reference | Remaining work |
|---|---|---|
| Library | Dither screens 23–35 | Update empty/loading states for import, searching long libraries, delete/local-storage copy, missing files, selection and long titles |
| Import | New 51/54 | Unsupported codec, corrupt file, size/duration limits, insufficient disk space, interrupted copy and cancellation result |
| Recorder | 36–40 | Permissions and fallback source picker; idle/recording/paused/finishing/cancelled; return-to-library route |
| Editor | 41 and new 50 | Integrate chosen v2 controls, no-telemetry case, empty project, unsaved changes, undo and busy states |
| Video export | 42/44 | Chosen export presets, progress, cancellation completion, error and destination confirmation |
| Generation | New 52/53 plus prior 25 | Local model setup, transcript/frame progress, provider progress, cancellation, no speech, low evidence confidence and edited-draft protection |
| AI connections | New 49 | Connecting, connected, expired, invalid key, unsupported model, unavailable service, usage limit and disconnect |
| Guide/brief review | New 47/48/55 | Real screenshot legibility/highlights, evidence changes, PDF preview/export, clipboard failure and local-path portability explanation |
| Cross-cutting | Pen Light/Dark tokens | Keyboard/focus behaviour, reduced motion, small desktop windows and localisation growth |

## Architecture direction

See the [pinned v2 assessment](2026-10-12-openscreen-v2-assessment.md) for source evidence and the intake matrix. Proposed boundaries are library, media, recording, editor, generation, provider, and export/handoff. Screens should depend on typed service interfaces, with sample-data adapters first and Electron adapters later. An in-memory demo must visibly identify simulated operations.

Reuse existing Showhow design components and local fonts from current main. Do not replace the editor engine merely to make a UI prototype work. Decide the v2 document/engine migration separately, with legacy-project and original-bundle proof. The working design checkout is older than current main; code implementation must start from a fresh approved base and preserve the existing dirty design work.

## Checks performed

- Read the actual Pen document, its theme variables, reusable components and existing library/editor screens through Pencil tools.
- Rendered each new screen after construction; inspected the full-size guide export.
- Checked new layouts for clipping. Disabled inherited guide flags are not visible content. The copied editor retains its original timeline viewport clipping; the new assistant panel fits within the inspector.
- No application build, provider request, native recording or upstream import was run. Functional, accessibility and platform acceptance remain future work.
