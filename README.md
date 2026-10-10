# Sudoku Scratchpad

A Svelte 5 / SvelteKit companion for **paper** Sudoku puzzles. All 27 units (9 rows, 9 columns, 9 boxes), each with digits 1–9. Tap to cycle **available → excluded → confirmed → available**. A unit is complete when all nine digits have been marked and exactly one is confirmed. This completion rule is a checklist convention, not Sudoku-solving logic; you can use 'confirmed' for the last remaining digit in each unit.

## Features

- Portrait-first, all 27 units on one scrolling page
- Hide/show completed units, progress summary, undo
- Multiple named puzzles; create, rename, delete and reset with confirmation
- Auto-save using `localStorage` (separate for each browser/device)
- Offline PWA, add to iPhone Home Screen, optional dark mode
- No server, account, tracking, or puzzle-solving logic

## Run locally

Install Node.js 22 or later:

```bash
npm install --no-audit --no-fund
npm run dev
```

Open the URL printed by Vite. Check types with `npm run check`; build with `npm run build`.

## Deploy with GitHub Pages

1. Create a **public** GitHub repository (e.g. `sudoku-scratchpad`).
2. Upload all project files, including the `.github/workflows/deploy.yml` workflow, and commit them to the `main` branch. For command-line upload from this folder:

   ```bash
   git init
   git add .
   git commit -m "Initial Sudoku scratchpad"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/sudoku-scratchpad.git
   git push -u origin main
   ```

3. On GitHub, open **Settings → Pages → Build and deployment → Source**, select **GitHub Actions**.
4. Open **Actions**, watch the **Deploy to GitHub Pages** workflow complete.
5. Visit `https://YOUR_USERNAME.github.io/sudoku-scratchpad/`. If your repository is named `YOUR_USERNAME.github.io`, use the root domain instead.

The build automatically sets the SvelteKit base path from the repository name in GitHub Actions.

## Install on iPhone

Open the deployed URL in **Safari**, choose **Share → Add to Home Screen → Add**. Open the new icon once while online; subsequent visits can work offline after the service worker caches the app.

## Important notes

- Saved puzzles stay in that iPhone/browser's local storage. They **do not sync** to other devices, and clearing website data may delete them.
- Updating the app uses the service worker's network-first strategy; saved puzzles are independent of the cache.
- This is a static application; GitHub Pages hosts it for free on eligible repositories.
