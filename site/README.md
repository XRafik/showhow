# Showhow landing page

Separate from the app: nothing here is part of the Electron build.

```bash
cd site
npm ci
npm run dev       # http://127.0.0.1:4321
npm run build     # static output in site/dist
npm run preview
```

From the repo root, `npx playwright test --project=landing` builds the page, serves it and runs `tests/e2e/landing.spec.ts`.

## Where things are

| Path | What |
| --- | --- |
| `src/pages/index.astro` | The page: seven sections, copy from the approved prototype in `design/landing-prototype/` |
| `src/styles/tokens.css` | Colour and font variables, named like the variables in `design/landing.pen` |
| `src/styles/components.css`, `loops.css` | One BEM block per pen component |
| `src/lib/motion.ts` | Lenis smooth scroll, GSAP intro and scroll scenes |
| `src/components/*.tsx` | React islands: nav, buttons, FAQ, hero shader |
| `src/components/vendor/` | Copied sources: React Bits (Grainient), itshover icons, interior hooks |
| `public/assets/` | Placeholder loops and stills |

## Tweak the hero shader

`--landing-shader-opacity` in `src/styles/tokens.css` (0.3 matches the design). Colours and motion are props in `src/components/HeroShader.tsx`.

## Replace a placeholder loop

Hero: swap the three `hero-make-guide.*` files in `public/assets/`, then remove the `Placeholder` tag in `index.astro`. Step and handoff slots are `LoopSlot` instances; replace the CSS still and fake with a `<video>` of the same aspect ratio (16:10).

## Tweak pane (DialKit)

Open it with `?tweak` on the URL (Shift+T works after that, in the same browser). Hide it with Shift+T, the pane's close button, or `?tweak=0`. It loads only on request, so visitors never download it. Values apply live (shader, hero size, palette, scroll smoothness), persist in your browser only, and the pane's copy button exports them. To make a value permanent, copy it into `src/lib/tweaks-store.ts` (shader), `src/styles/tokens.css` or `src/components/Tweaks.tsx` (defaults).
