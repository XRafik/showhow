# Showhow application icons

## Chosen concept

The canonical icon is the Showhow logo mark, owner-picked as **option B (dark, full size)** on
23 October 2026. It replaces the earlier folded three-step path icon. The same mark is the in-app
`Logo` component (`src/components/showhow/Logo.tsx`): a cream cursor clicking inside an ink
square, with sage click marks, an orange recording dot and a sage offset shadow.

Sources of truth:

- [`showhow-app-icon.svg`](./showhow-app-icon.svg): the application icon (macOS, Windows, Linux).
- [`showhow-tray-template.svg`](./showhow-tray-template.svg): the macOS menu bar icon, a template
  image.
- [`showhow-tray-recording.svg`](./showhow-tray-recording.svg): the menu bar icon while recording.

They are flat vector geometry with no text, external fonts, embedded raster data, gradients or
filters.

## Palette roles

- Ink `#2F2F2F` is the icon tile.
- Sage `#82B09A` is the offset shadow and the click marks.
- Cream `#FFFCF7` is the cursor.
- Orange `#E4572E` is the recording dot, and the whole menu bar icon while recording, because orange
  means recording everywhere in Showhow.

## Geometry

The application icon uses a `1024 × 1024` view box. The ink tile is 824 units square at (100, 100)
with a 185-unit corner radius, following the macOS icon grid. The sage shadow is the same tile
offset 28 units right and down. The mark inside is the 50-unit logo artwork scaled by 22.4 from its
inner ink square, so the cursor, click marks and dot keep the logo's proportions. Do not enlarge,
rotate or rearrange the mark within the tile.

The menu bar icon uses an `18 × 18` view box: a 14-unit rounded square (radius 2) with the logo's
cursor cut out. It renders at 16 pt with an @2x pair. The template is pure black with alpha, so macOS
recolours it for light and dark menu bars; the recording state is orange and is not a template.

## Generated files

Run `npm run icons:generate` on macOS. It writes `icons/icons/png/*`, `icons/icons/win/icon.ico`,
`icons/icons/mac/icon.icns`, `public/showhow.png` (also the renderer favicon and the non-macOS tray
icon) and `public/trayTemplate*.png` / `public/tray-recording*.png`. These are generated artifacts:
regenerate them from the SVGs rather than editing them by hand.

The landing page favicon is `site/public/favicon.svg`, the logo artwork itself, with
`site/public/assets/logo.png` as the PNG fallback and navigation logo.
