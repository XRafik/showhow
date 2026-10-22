# Mock spec: on-brand permissions window

Throwaway single file: `design/mocks/2026-10-22-permissions-window/index.html`. Fake data, no app code.
Brand reference: `design/mocks/2026-10-15-house-style/SPEC.md` (tokens section) and
`design/mocks/2026-10-15-house-style/pen-final/HUD-07-screen-recording-permission.png` (the approved sheet).
Current (off-brand) implementation for structure and copy: `src/components/permissions/PermissionsWindow.tsx`,
copy in `src/i18n/locales/en/launch.json` → `permissions`.

## Page
- Page bg: neutral #D9D6CF (light) / #151515 (dark), centred stage.
- Top control bar (mock chrome, Inter 12px): theme toggle LIGHT | DARK | SIDE BY SIDE (default SIDE BY SIDE),
  and a state picker (buttons) for the scenarios below. Side by side renders the same scenario twice.
- Each "window" is 540px wide, auto height (min 560), radius 10, 1px line border, soft shadow
  `0 20px 50px #0000002E`. Fake macOS title bar 28px tall: three 12px traffic-light dots (#FF5F57 #FEBC2E #28C840)
  at left 12px, gap 8px, no title text. Title bar bg = window surface, hairline under it.

## Tokens (use exactly)
Light / Dark: surface #FFFCF7/#2F2F2F · surface-raised #F9F5EC/#363636 · ink #2F2F2F/#FFFCF7 ·
ink-soft #2F2F2FB3/#FFFCF7B3 · muted #2F2F2F8C/#FFFCF78C · ink-faint #2F2F2F66/#FFFCF766 ·
line #2F2F2F24/#FFFCF724 · ink-wash #2F2F2F14/#FFFCF714 · chip #E8E4DC/#3A3A3A.
accent #82B09A · accent-tint #82B09A33 · accent-strong #33564A · rec #E3582D · rec-wash #E3582D1F · rec-ink #B3431F · rec-soft #F28B6B.
Fonts (Google Fonts): Inter 400/500, Inter Tight 600, JetBrains Mono 500.
Icons: Tabler icons inline SVG, stroke 1.75, 18px: device-desktop, volume, accessible, microphone, video,
check (14px), external-link (14px), refresh (14px).

## Window layout (padding 28px sides, 24px top under the title bar, 24px bottom)
1. Eyebrow "SHOWHOW": JetBrains Mono 500 10px, letter-spacing 1px, ink-faint.
2. Title "Showhow needs a few permissions": Inter Tight 600 22px, -0.02em, ink, 6px below eyebrow.
3. Subtitle (copy from launch.json): Inter 13px/20px, muted, 6px below, max-width 440px.
4. List card, 20px below: radius 8, bg surface-raised, 1px line border, overflow hidden. Rows are separated by
   1px line hairlines (no gaps, no per-row cards).
   Row: padding 14px 16px, grid [18px icon | 1fr text | auto action], gap 14px, align center.
   - Icon: ink-soft. Required row icon: rec.
   - Name: Inter 500 14px ink. Tag 8px right of name: JetBrains Mono 500 10px uppercase, letter-spacing 0.6px,
     padding 2px 6px, radius 3: REQUIRED (bg rec-wash, text rec-ink light / rec-soft dark),
     RECOMMENDED (bg accent-tint, text accent-strong light / accent dark), OPTIONAL (bg chip, text muted).
   - Description: Inter 12.5px/18px muted, 2px below name.
   - Action, one of:
     * Granted: "ALLOWED" JetBrains Mono 500 11px uppercase letter-spacing 0.6px with check icon (gap 6px),
       colour accent-strong (light) / accent (dark). No button.
     * Button (secondary): bg transparent, 1px line border, ink text, JetBrains Mono 500 11px uppercase,
       letter-spacing 0.6px, padding 8px 12px, radius 4. Hover bg ink-wash 120ms. Press scale(0.96) 160ms
       cubic-bezier(0.2,0,0,1). Labels: CONTINUE (screen, not requested), ALLOW (others, not requested),
       OPEN SETTINGS with external-link icon (denied or requested). Busy: opacity .5, label unchanged.
     * Restricted: "Managed by your organization", Inter 12px muted, right aligned, max-width 120px.
   - Help block (when present): full-width under the row, indented to the text column (left 48px),
     margin-top 12px, padding-top 10px, 1px line hairline top, Inter 12.5px/18px ink-soft, 4px between lines.
     Denied screen help: first line ink-soft, second line muted.
5. Footer, margin-top 24px: hairline line on top, padding-top 16px, flex space-between.
   - Left: 6px dot + Inter 13px muted text. Dot accent when ready ("You're all set."), rec when screen required
     ("Screen recording is needed to record.").
   - Right primary button, JetBrains Mono 500 11px uppercase, padding 10px 16px, radius 4:
     light theme = dark button (bg #2F2F2F, text #FFFCF7, hover #3A3A3A);
     dark theme = accent button (bg #82B09A, text #2F2F2F, hover #8FBBA6).
     Label GET STARTED, or RESTART SHOWHOW with refresh icon when relaunch needed. Disabled: opacity .4,
     cursor not-allowed.
   - The window has NO offset shadow (it is a native window); nothing else uses offset shadow either.

## Scenarios (state picker)
A "First run · own picker": screen REQUIRED not-requested (help: screenPrompt), accessibility not-requested,
  mic not-requested, camera not-requested. Footer: rec dot + screenRequired, GET STARTED disabled.
B "Screen denied": screen denied (help: screenSettings + screenNotListed, button OPEN SETTINGS), accessibility granted,
  mic granted, camera not-requested. Footer disabled.
C "Needs restart": screen granted + relaunch (help: screenRestart; action ALLOWED), others granted.
  Footer: accent dot "You're all set." is wrong here — use rec dot + "Restart Showhow to finish." and RESTART SHOWHOW enabled.
D "All set · own picker, macOS 15": screen granted (help: screenRecurring), accessibility granted, mic granted,
  camera restricted. Footer ready, GET STARTED enabled.
E "Apple picker (matches owner screenshot)": first row is System audio OPTIONAL not-requested (help: systemAudioPrompt,
  button ALLOW), accessibility RECOMMENDED granted, mic granted, camera granted. Footer ready.
F "System audio asked": as E but system audio requested (help: systemAudioRequested, OPEN SETTINGS).
Clicking an ALLOW/CONTINUE button in any scenario: busy for 700ms, then that row becomes granted (fake).
Default scenario: E.

## Acceptance
- No colour outside the token list (except page bg and traffic lights). No emerald/#10b981 anywhere.
- Every button label is JetBrains Mono uppercase.
- Both themes render every scenario without overflow at 540px.
- Screenshots: `shots/E-side-by-side.png`, `shots/B-side-by-side.png`, `shots/C-side-by-side.png`
  (1400×900 viewport, via Playwright or headless Chrome).
