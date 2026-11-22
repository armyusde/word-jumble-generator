# Word Jumble Generator

A drag-and-drop word jumble game. Unscramble 5 words; the circled letters from
each one form a final jumble to solve.

## Play on iPhone
1. Open the game's link in Safari.
2. Tap **Share** → **Add to Home Screen**.

## Files
- `index.html` — page layout
- `src/game.js` — game logic
- `src/words.js` — word list (5–7 letters)
- `src/style.css` — styles
- `assets/levels.dat` — bonus level pack
- `manifest.json`, `sw.js` — home-screen app + offline support

When you change game files, bump `CACHE` in `sw.js` so installed copies update.
