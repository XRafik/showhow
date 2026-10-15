> **Closed — 2026-10-12:** The owner rejected the Design Max alternatives and requested their deletion. Do not resume or recreate this brief. Follow [NEXT-SESSION.md](../NEXT-SESSION.md) instead. The earlier dither designs remain the visual reference.

# Design Max brief — Showhow library

## Your task

Act as a senior product designer and design engineer. Audit Showhow's current **dither library designs**, find the strongest opportunities to improve their usability and visual craft, then create **two distinct, polished layout directions** in the Pen file.

The owner wants you to do the design work, not stop at recommendations. Use the available design, shader, image, browser and inspection tools where they improve the result. You may briefly interview Mohamed: ask up to three focused questions if the answers would materially change your approach. Reuse the settled decisions below. If no interview is needed, begin.

This is the **desktop app's library**, not a marketing website. Keep the primary scope on browsing recordings, reviewing a selected video, and creating or refining its guide or agent brief. Include adjacent import and generation states to make the layouts credible. A complete recorder/editor redesign is outside this brief.

## Understand the product first

**Show it once. Turn it into a guide for people or a brief for your agent.**

Showhow is a free, local-first desktop screen recorder and workflow-documentation app, built with Electron, React, TypeScript and Pixi.js. It builds on an inherited OpenScreen recorder/editor but has its own product direction. It is pre-v1; designs describe intended behaviour, not shipped capabilities.

A user records a software walkthrough or imports an existing MP4. Showhow keeps a self-contained local copy. The user can then explicitly generate one of two outputs:

- **Guide for people:** editable steps, screenshots, highlights and timestamps, with PDF export. Think of a useful client handover or a procedure a teammate can follow.
- **Brief for an agent:** the requested change, observed and expected behaviour, and supporting evidence. Copy the brief and local bundle path to an external coding agent. Showhow does not launch that agent or change the user's code.

Both outputs use the **original recording**. Editing a video for sharing must not invalidate their evidence or timestamps. Ordinary imported MP4s may have no click/cursor telemetry; the design must accommodate that case.

AI connections are **ChatGPT plan sign-in** and **OpenRouter**. Local preparation produces transcript/frame evidence; selected evidence is sent to the chosen provider on request. Recording, importing and manual video editing remain usable without connecting AI. Showhow is local-first, not a promise that nothing ever leaves the device.

Core flow already approved: **library → select recording → choose guide or agent brief → generate → review/edit → export or copy**. Preserve that capability and clarity while exploring better information architecture. Keep the original recording safe through failures. No paywalls, premium tiers, mandatory cloud account, social feed or analytics dashboard.

The audience includes developers showing an agent a bug, designers explaining a change, and people handing a workflow to clients or colleagues. The feeling should be: **“I can show this once, make the result clear, and hand it over with confidence.”**

## Read and inspect

Workspace: `/Users/mohamedb/dev/projects/showhow`.

1. Read `AGENTS.md` and `docs/research/2026-10-12-ui-direction.md`. The latter records the latest owner decisions and separates proposals from approved behaviour. Older roadmap statements about local-only AI or narrower scope predate this conversation.
2. Open **`design/showhow.pen` through the available Pencil/Pen tools**. Discover the current tool instructions and document structure first. `.pen` files must be accessed through those tools, not read or searched as text. Render actual frames at a readable size; a screenshot gallery alone is not the source of truth.
3. Start with frames named **`Dither · 23` through `Dither · 35`**. Key references from the last inspection: launch `KxBa3`, saved/no guide `rlCaQ`, generating `IRKof`, guide ready `Q8OJqc`, empty `R3vOp3`, loading `nTPKb`, load failure `PDLYK`, title edit `LpjlH`, step edit `g1zVUy`, guide failure `lp6tK`, no clicks `FNLdp`, narration-only `h5N7j`. Re-find by name if IDs have changed.
4. Inspect the newer **Direction screens 47–55**, described in the UI-direction document. These add the approved two-output flow and AI/import concepts. They are a first pass, not a final visual standard. The earlier mock's flow is approved; its layout is open to improvement.
5. Read existing variables and reusable components. Supporting references: `design/showhow-design-system.html`, `design/brand/README.md`, `design/dither-demo/index.html`, and the existing `dither.glsl`, `mosaic.glsl`, `pixelate.glsl` shaders. Inspect shader source before extending it.
6. Read `docs/research/2026-10-12-openscreen-v2-assessment.md` only to understand integration constraints. AI video editing is distinct from guide/brief generation; upstream features are candidates, not a completed integration.

Optional scratch references, if still present: `/tmp/showhow-design-review-20261012/index.html` is a static screen gallery; `/tmp/showhow-flow-20261011/index.html` is the approved behavioural mock with simulated operations.

## Art direction to preserve and develop

Aim for a **calm, tactile creative tool with precise technical detail**. Editorial clarity, useful density, generous but purposeful space, and a recognisable dither signature. The app should feel crafted and capable, with the recording and its useful output as the focus.

Use the Pen variables as authoritative; these are orientation points:

- Warm cream `#FFFCF7`; raised/sunken paper tones `#F9F5EC` / `#F7F2E8`.
- Charcoal `#2F2F2F`, deeper panels `#242424`, sage `#82B09A`, forest accents around `#33564A`.
- Inter for body/UI, Inter Tight for display headings, JetBrains Mono for compact labels/timestamps. Instrument Serif is available for selective editorial emphasis where it earns its place. Inspect existing use before expanding it.
- Existing buttons use modest 4px corners; cards around 8px. Restrained borders, clear alignment, deliberate light/dark contrast and the existing Showhow pointer mark.
- Light and dark appearance are part of the system. Preserve legibility in both.

Explore subtle background grain/noise, dithering, restrained tonal variation, media framing, depth, hover feedback and transitions. Decide where each helps hierarchy, identity or state. Stronger texture may suit a quiet sidebar area, an empty state or a transition; reading and editing surfaces usually need greater restraint.

**Real videos, screenshots, text and controls must remain clear.** Existing dither patterns over media are placeholder artwork, not an instruction to process actual evidence. Texture must not imply privacy protection or redaction. Validate at native size; fine patterns can create moiré or interfere with small text. Keep motion optional under reduced-motion preferences and describe a static fallback for any shader effect.

Use visual references and generated assets when they serve a specific design purpose. Retain the existing logo. Prefer purposeful effects to decoration applied uniformly across the app. Avoid turning the library into a grid of generic dashboard cards or a large chat interface.

## Work sequence

### 1. Audit the actual designs

Document 6–10 high-value findings, each with a named frame/node, visible evidence, user impact and a concrete improvement. Include what already works and should survive.

Assess information hierarchy, navigation and selection, library scale, video/document balance, the distinction between the two outputs, action placement, screenshot readability, typography, density, texture, light/dark behaviour and recovery states. Distinguish a confirmed usability problem from an aesthetic opportunity.

Use relevant available skills such as UX review, layout, typography, accessibility, colours, UI craft and motion. Select tools deliberately; the goal is a better design, not a tool checklist. Establish the audit before designing the alternatives.

### 2. Create two genuinely different directions

Develop **Direction A** and **Direction B** from the same product and visual identity. Name each and explain its organising idea in one sentence.

They must differ in at least three structural choices, such as library navigation, the relationship between video and document, the reading/editing flow, or the placement of generation and handoff actions. Colour changes, different textures, or moving the same cards a few pixels do not make a second layout.

Choose the two concepts yourself after the audit. A focused document workspace and a side-by-side evidence workspace are possible starting points, not prescribed solutions. Both must be plausible daily-use designs, with equal finish and the same sample content so the owner can compare fairly.

For **each** direction, design these views:

1. Library overview or initial selection, showing how users find recordings and import/create one.
2. Selected recording with a completed illustrated guide.
3. Selected recording with an agent brief.
4. Generating state, including progress and cancellation.
5. Failure/retry state that preserves the recording and previous draft.
6. Empty library with clear record/import entry points.

Add a dark version of the primary guide view. Show how that view adapts from a 1200×800 desktop viewport to 1024×768. Long content may scroll; make scroll ownership and access to important actions explicit. Use a small annotation or companion frame for behaviour that cannot be shown in a static design.

Use realistic, non-sensitive software walkthrough content. Include at least one readable screenshot with a meaningful highlight and a timestamp. Use existing suitable assets or build an explicitly labelled sample interface in scratch. Do not substitute decorative dither art for the evidence in the final comparison.

### 3. Validate and refine

Inspect each finished frame at readable scale. Fix clipping, overflow, awkward alignment and unreadable contrast. Check long recording titles, a larger library, an imported video without telemetry, and a guide with enough steps to scroll. Explain keyboard navigation and focus treatment for the main controls. Validate light/dark contrast and reduced-motion treatment for proposed effects.

For each texture or motion choice, state its purpose, location, intensity and implementation approach. If static Pen rendering cannot demonstrate it, create a small local browser sample and label it as a prototype. Make sure the final two directions remain directly comparable.

## Preserve the current work

Create new top-level frames named `Design Max · A · …` and `Design Max · B · …` in free canvas space. Preserve existing frames, shared components and variables. Use copies or separately named experimental components/tokens where alternatives diverge. Do not move or replace the existing dither set.

This workspace contains uncommitted owner work: the Pen file, shaders, dither demo and HTML exports. The observed branch is `fix/branding-allowlist-pen` at `5027d67e`; it is older than current main. Verify status before writing, preserve existing edits, and use this checkout for design only. No upstream imports, production-code implementation, issue changes, commits, pushes or merges are part of this task.

## Deliverables and completion

- An audit and decision notes at `design/design-max/AUDIT.md`.
- Two complete alternatives in `design/showhow.pen`, with the six views per direction, the dark primary view and compact-window treatment described above.
- Exported comparison images and a browsable local review page under `design/design-max/`, clearly labelled by direction and state. Open the review in **Dia** when available.
- A short comparison covering strengths, trade-offs, what each layout improves, implementation implications, and your recommendation with reasons.

Finish by showing both directions and asking Mohamed which to develop further, or which specific elements to combine. Do not silently choose a winner, replace the canonical designs, or claim either direction is implemented in the app.
