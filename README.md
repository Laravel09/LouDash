# LouDash

LouDash is a landscape endless-runner game (React 19, TypeScript, Vite 8). The logical game stage is **844 × 390** and is scaled to fit the window.

This folder is the source exported from the Figma Make prototype, unmodified except for this README. It runs on your computer without Figma Make.

## Requirements

- **Node.js 22** (the project pins 22 in `.mise.toml`). Check with `node -v`. Download: https://nodejs.org
- **pnpm 10** (the lockfile is `pnpm-lock.yaml`). If you don't have it, run `corepack enable` and then `corepack prepare pnpm@10 --activate`, or `npm install -g pnpm@10`.
- **Visual Studio Code**: https://code.visualstudio.com

## Open and run in Visual Studio Code

1. Extract the ZIP. You should get a `LouDash` folder.
2. In VS Code choose **File → Open Folder…** and select the extracted `LouDash` folder (the one that contains `package.json`).
3. Open the terminal with **Terminal → New Terminal**.
4. Install dependencies (needs internet, once):

   ```
   pnpm install
   ```

5. Start the dev server:

   ```
   pnpm dev
   ```

6. Open **http://localhost:8443** in your browser. Edits to files in `src/` reload automatically.

The dev server uses port 8443 and stops with an error if it is taken. To use another port:

- macOS / Linux: `PORT=3000 pnpm dev`
- Windows PowerShell: `$env:PORT=3000; pnpm dev`

The server also listens on your network, so you can test on a phone using the "Network" address Vite prints (computer and phone on the same Wi-Fi).

## Other commands

| Command | What it does |
|---|---|
| `pnpm build` | Production build into `dist/` |
| `pnpm preview` | Serve the production build locally (port 8443) |
| `pnpm exec tsc --noEmit` | Type check |
| `node --experimental-strip-types scripts/hazard-check.ts` | Hazard fairness check (takes about 1–2 minutes; should end with `ALL CHECKS PASSED`) |
| `pnpm format` | Format with oxfmt |

Useful URL parameters while developing: `?seed=7` gives a repeatable hazard sequence; `?debug=1` shows the debug overlay.

## Project layout

```
index.html              HTML entry
package.json            scripts and dependencies
pnpm-lock.yaml          locked dependency versions
vite.config.ts          Vite config (reads .figma/make/site.json, so keep that folder)
tsconfig.json
scripts/hazard-check.ts hazard fairness check
src/
  main.tsx, App.tsx     entry and screen switching (no router)
  GamePlay.tsx          game loop, physics, input, HUD
  hazards.ts, gameplayBalance.ts, gameplayConfig.ts, types.ts
  MainMenu / CharacterSelect / PlaceSelect / HowToPlay / HighScore / Settings / GameOver / SplashScreen .tsx
  audio.ts              Web Audio engine
  profileStorage.ts     saved settings and scores (localStorage)
  index.css             all styling
  assets/               characters/rig (27 WebP), environments (9 WebP), audio (17 MP3 + CREDITS.md)
  imports/              original design specification documents
.figma/make/            Figma Make platform files; vite.config.ts still reads site.json from here
```

## Notes

- **Assets are real files.** The 53 assets in `src/assets` are the actual images and audio, not Git LFS pointer files.
- **Git asset storage.** This package stores the current 36 WebP images and 17 MP3 audio files as ordinary Git files (not Git LFS). Their combined size is small enough for normal GitHub storage. The `.gitattributes` file intentionally contains no LFS filters for these assets. This avoids deployment failures caused by missing Git LFS objects.
- **Fonts** (Orbitron, JetBrains Mono, Outfit) load from Google Fonts, so you need an internet connection to see the intended typography. Offline, fallback fonts are used.
- **Persistence.** Settings and high scores are stored in the browser's `localStorage`.
