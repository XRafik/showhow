# Showhow #134 — Task 1 design report

Status: saved with Cmd+S by the lead. Pen remains open on the ticket copy.
The Edited marker disappeared; git status lists design/landing.pen as modified.
The three final frames were shown in the owner session before any Task 2 work.

## Exports

Pencil exported these PNGs at scale 1:

| File | Node | Frame | Pixels |
| --- | --- | --- | --- |
| [TRpgX.png](TRpgX.png) | TRpgX | Landing · Final · desktop | 1440 × 4089 |
| [ma1pm.png](ma1pm.png) | ma1pm | Landing · Final · mobile | 390 × 5400 |
| [J82Ol2.png](J82Ol2.png) | J82Ol2 | Landing · Final · states | 1440 × 2324 |
| [Ro86s.png](Ro86s.png) | Ro86s | Landing · Components | 1440 × 1831 |

## Design checks

The file has eleven reusable components:

| Component | Node |
| --- | --- |
| Nav | W2SgD |
| Button/Primary | ToC7y |
| Button/Outline | Oy1n2 |
| Eyebrow pill | VGhAf |
| Section label | cb4Bj |
| Step card | o6UZqE |
| Loop slot | HyEvB |
| Handoff panel | BEoKz |
| FAQ item | Q9CyA |
| Footer call to action | XiuwO |
| Soon pill | AM4Q1 |

The FAQ component has closed and open instances. The states frame shows six open answers.
Both page frames use this section order: Nav, Hero, How it works, Coming next,
How to open, FAQ, Footer call to action.

The eight colour variables are landing-bg (#161616), landing-surface (#1E1E1E),
landing-hairline (#FFFCF72E), landing-text (#FFFCF7), landing-text-dim (#FFFCF7B3),
landing-text-faint (#FFFCF78C), landing-accent (#82B09A), and landing-record (#E3582D).
The three font variables are landing-font-heading (Inter Tight), landing-font-body
(Inter), and landing-font-mono (JetBrains Mono). Existing variables remain intact.

A walk through the three frames and the component sheet, with instances expanded,
found no hex fill or stroke and no font family outside the landing font variables.
The layout walk excludes disabled nodes and their children. It found no visible
layout problem in mobile, states, or the component sheet. Desktop has one intended
image crop: SqqCq/Ki5dz, at y=-31 inside the clipped hero slot.

The desktop hero slot starts at page y=508. At t=3.0 s, the source tabs and Make guide
control are visible. The progress card spans about y=623.7 to y=898.3.
The states frame shows default, hover, focus, and disabled buttons. The outline
hover label now renders once. Its background fill prevents the shadow from
repeating the text.

Darkroom shader copies remain visible behind the two page headers. Nodes Xse4s
and kztGq use grain-darkroom-fade.glsl. This file copies the inherited shader and
adds an alpha fade at the bottom. The copies use opacity 0.3 to protect text
contrast. The original shader, frames, and background nodes are unchanged.
The shader room, sage, and ember inputs use the landing colour variables.

The final raster contrast check covered text bounding boxes over the exported
shader layers. Its minimum ratio for information text was 5.176:1. Solid-surface
text tokens measured at least 5.78:1. The orange full stop is decorative; the
raster text assertion excludes it. Disabled controls are not active controls.
These checks do not prove physical display or browser accessibility.

## Plan notes

The media line says six slots but names seven placements. The design keeps the
seven named placements: hero; steps 1, 2, and 3; the two Coming next panels; and
How to open. The lead used the explicit placement list to resolve the count mismatch; no section was added.

Copy comes from the two approved scratch HTML prototypes in the PLAN.md scratch
path. Text case follows the visual style. Copy for agent and Export PDF remain
marked Soon and disabled. The supplied 167 MB prototype text is retained as
approved copy; this ticket does not verify a release size or download.

Desktop spacing above the hero image is tighter than the prototype. This puts
the full progress card inside the first 900 px. Mobile uses a scaled full hero
still so its content does not get a narrow centre crop.

## Evidence and exact checks

External evidence root:
`/Users/mohamedb/dev/loop-evidence/showhow-134/executor/`.

- `pencil-check.js` contains the exact repeatable MCP check and export input,
  with node IDs substituted for session variables.
- `mcp-check-result.json` holds the final MCP response. The call was
  `pencil.execute({filePath:"/Users/mohamedb/dev/projects/showhow-ticket-134-landing-design/design/landing.pen",input:<check script>})`.
- The check uses Get with resolveInstances:true, GetVariables, and Export with
  scale:1. The result lists eleven components, eleven landing variables, the
  frame bounds, section order, colour/font walks, layout results, and FAQ copy.
- `shader-text-bounds.json`, `contrast/Xse4s.png`, and `contrast/kztGq.png`
  support the raster contrast check. These probes are external evidence.
- `python3 /Users/mohamedb/dev/loop-evidence/showhow-134/executor/verify-exports.py`
  exits 0. It prints:
  `PASS: 11 components, 8 colour and 3 font variables, section order, token-only styles, dimensions, 5 exact PNG comparisons.`
  It then prints `Minimum sampled shader text contrast: 5.176`.
- `verification.json` holds dimensions, export SHA256 values, contrast results,
  and preservation hashes.
- `preservation/{QFjRE,BghX5,JK4pE,vOiI3,l67kN}.png` are final scale-1 exports.
  Python byte comparison against the lead's before/ PNGs passes for all five.
- `FAILURES.md` retains observed failures and their repairs. No failure was
  counted as an independent review.

## Save and proof boundary

The executor used Pencil MCP for all pen reads and edits. The active path was
the ticket file, never main. The executor used no native UI.
The lead saved with native Cmd+S. The Edited marker disappeared.
git status lists landing.pen as modified; git diff --stat design/landing.pen
reports one changed file with 3521 insertions. Pen remains open on the ticket copy.

The lead repeated the MCP structure and export check after saving. Reviewer
identity and independent Standards and Requirements verdicts are pending. Failed-review count remains 0.
No site, Task 2–4 work, app source, commit, push, PR, merge, or Greptile run is part
of this result.
