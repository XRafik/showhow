# Spec: Connect ChatGPT states (throwaway mock, one HTML file)

Output: `design/mocks/2026-10-17-chatgpt-connect/index.html`
One self-contained file. No backend, no real app code. Fake data only. Google Fonts allowed for Inter,
Inter Tight, JetBrains Mono. No other external assets. Light theme only.

## Reference to read first (visual match)
- `/Users/mohamedb/dev/projects/showhow/design/mocks/2026-10-15-house-style/pen-final/Library-19-ai-not-connected.png`
- `.../pen-final/Library-08-review-before-ai.png`
- `.../pen-final/Library-10-guide-failed.png`
- Any `Settings-*.png` in the same folder (for the settings layout).
- Tokens and components: `/Users/mohamedb/dev/projects/showhow/design/mocks/2026-10-15-house-style/SPEC.md`
  ("Tokens", "Components" sections). Use the LIGHT values.

Key tokens: surface #FFFCF7, surface-raised #F9F5EC, ink #2F2F2F, ink-soft #2F2F2FB3, muted #2F2F2F8C,
line #2F2F2F24, chip #E8E4DC, panel #2F2F2F, on-panel #FFFCF7, accent #82B09A, accent-tint #82B09A33,
accent-strong #33564A, rec #E3582D, rec-wash #E3582D1F, rec-ink #B3431F.
Fonts: Inter 14px body; Inter Tight 600 for titles (sheet title 20px); JetBrains Mono 11px uppercase
500 letter-spacing 0.6px for buttons and labels, 10px for tags/meta.
Sheets: radius 10, bg surface, 1px line border, `box-shadow: 4px 4px 0 #82B09A`, width 560px,
centred over a dimmed (rgba(47,47,47,0.45)) library backdrop.
Buttons: radius 4, padding 10px 14px. Primary bg accent / ink text. Dark bg #2F2F2F / #FFFCF7.
Secondary transparent + 1px line border. Disabled: opacity 0.45, cursor not-allowed.
Status pill (as in Library-19): mono 10px uppercase, chip bg, muted text, 6px dot; CONNECTED variant
uses accent-tint bg and accent-strong text.

## Page frame
Top: a fixed 44px state switcher bar (outside the design, plain): buttons "A · Connect (Codex ready)",
"B · Codex signed out", "C · Codex not installed", "D · AI connections", "E · Guide failed".
Default state A. Below it, a 1200×760 app frame: left sidebar 272px (panel bg, logo "Showhow",
NEW RECORDING primary button, LIBRARY · 3 label, 3 rows: "Onboard a teammate to Linear" WINDOW · CHROME
· 6:02 tag NO GUIDE (selected), "Bug: invoice total rounds wrong" DESKTOP · 2:14 tag GUIDE,
"Export monthly report" DESKTOP · 1:37 tag FAILED; SETTINGS at bottom). Main area: title
"Onboard a teammate to Linear" Inter Tight 32px, meta mono "WINDOW · CHROME · 6:02 · 17 OCT 2026",
a grey 16:9 placeholder video block, and the "Turn this recording into a guide" card with MAKE GUIDE.
States A–C and E show a sheet over this; D replaces the main area with settings.

## State A: Connect sheet, Codex installed and signed in (Library-19 updated)
Sheet eyebrow mono "SHOWHOW", title "Connect AI to make guides".
Body text: "Recording and editing stay on this Mac. Connect an AI provider when you want a guide."
Row 1 ChatGPT: name "ChatGPT" (Inter Tight 20px), sub mono "USES YOUR CHATGPT PLAN THROUGH CODEX",
pill top-right "● CODEX SIGNED IN" (accent-tint). Text: "Signed in as mohamed@… · Pro Lite plan. Guides use GPT-6 Luna at no extra cost."
Button primary "CONNECT CHATGPT".
Divider. Row 2 OpenRouter: name, sub "USE YOUR OPENROUTER API KEY", pill "● NOT CONNECTED",
text "Pay per guide with your own key. About $0.004 a guide with Claude Haiku 5.5.",
secondary button "CONNECT OPENROUTER".
Footer left muted "After connecting, check what gets sent." right secondary "CANCEL".
Interaction: clicking CONNECT CHATGPT swaps the button to a disabled "CONNECTING…" for 700ms, then the
pill becomes "● CONNECTED" and the button becomes dark "CONTINUE TO MAKE GUIDE".

## State B: Codex installed, signed out
Same sheet; ChatGPT pill "● SIGNED OUT" (chip). Text: "Codex is installed but not signed in. Sign in with your ChatGPT account in your browser."
Button primary "SIGN IN WITH CHATGPT". Below it, mono 10px muted "OPENS CHATGPT IN YOUR BROWSER".
Interaction: click → button disabled "WAITING FOR BROWSER…" plus a ghost "CANCEL SIGN-IN"; after 1500ms
it becomes the connected outcome from State A.

## State C: Codex not installed
Same sheet; ChatGPT pill "● CODEX NOT FOUND" (rec-wash bg, rec-ink text).
Text: "ChatGPT connects through the Codex app. Install it once, then come back."
A code block (surface-raised bg, radius 6, mono 12px, padding 10px 12px, 1px line border):
`npm install -g @openai/codex` with a ghost "COPY" button on the right (click → "COPIED" for 1200ms).
Buttons under it: secondary "CHECK AGAIN" (click → 700ms "CHECKING…" then back, unchanged) and
ghost link-style "WHAT IS CODEX?".
OpenRouter row unchanged from A.

## State D: Settings → AI CONNECTIONS tab
Main area: settings layout with left tab list (mono 11px uppercase): GENERAL, RECORDING, AI CONNECTIONS
(active: accent-tint bg, ink text), APPEARANCE. Content:
Section title "AI connections" Inter Tight 18px; text "Used for Make guide. Editing and recording never leave this Mac."
Card 1 ChatGPT: pill "● CONNECTED", line "mohamed@… · Pro Lite · via Codex", model select
labelled mono "MODEL" with value "GPT-6 Luna" (options GPT-6 Luna, GPT-6.1 Sol, GPT-6 Astra),
small muted "Usage: 18% of this week's limit", ghost "DISCONNECT".
Card 2 OpenRouter: pill "● CONNECTED", "Key ending …a91f", MODEL value "anthropic/claude-haiku-5.5",
secondary "REPLACE KEY", ghost "REMOVE".
Below, a block labelled mono "USE FOR GUIDES" with a 2-option segmented control (radius 4, 1px line):
"CHATGPT (NO EXTRA COST)" selected (accent bg) | "OPENROUTER (PAY PER GUIDE)". Clicking switches.
Under it muted 12px: "If the chosen one fails, Showhow offers the other. It never switches by itself."

## State E: Guide failed with ChatGPT (Library-10 updated)
Sheet or inline failure card as in Library-10 (match the PNG's placement). Tag FAILED.
Title "Couldn't make the guide". Text: "ChatGPT usage limit reached. It resets in 2 h 14 min. Your recording and the basic steps are safe."
Buttons: dark "TRY WITH OPENROUTER", secondary "RETRY WITH CHATGPT", ghost "DETAILS".
Under the buttons muted 12px: "OpenRouter bills your key, about $0.004 for this guide."
Interaction: DETAILS toggles a mono 11px block "codex app-server: rate_limit_exceeded (weekly)".

## Motion
Sheet enter: opacity 0→1 and translateY 8px→0, 200ms cubic-bezier(0.23,1,0.32,1). Button press
scale(0.96) 160ms. Respect prefers-reduced-motion (no translate). Never `transition: all`.

## Acceptance checks (run them; report pass/fail)
1. All five states reachable from the switcher; default A.
2. Each interaction listed above works.
3. Buttons render in JetBrains Mono 11px uppercase (computed style check in a headless browser).
4. No console errors.
5. Screenshot each state at 1280×820 to `design/mocks/2026-10-17-chatgpt-connect/shots/state-{a..e}.png`.

## Out of scope
Dark theme, real data, real Codex calls, any other screen.

## Report
List the file path, the screenshot paths, check results, and anything in this spec you could not match.
