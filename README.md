# 🎲 Neon Dice VR

A holographic Yahtzee dice game built with [IWSDK](https://iwsdk.dev) — playable in VR headsets and desktop browsers.

## Play

**[▶ Launch Neon Dice VR](https://ellyz2426.github.io/neon-dice/)**

## Game Modes

- **Solo** — Classic Yahtzee, fill all 13 categories
- **VS AI** — Head-to-head against 3 AI difficulty levels (Easy / Medium / Hard)
- **Speed** — 20-second turn timer, race the clock
- **Farkle** — Push-your-luck dice variant with 6 dice
- **Daily Challenge** — Seeded daily puzzle, same rolls for everyone
- **Marathon** — Best of 3 rounds
- **Zen** — Relaxed, no scoring pressure
- **Practice** — Learn categories and strategies

## Scoring

- Full Yahtzee upper section (Ones–Sixes) with 63+ bonus
- Lower section: 3/4 of a Kind, Full House, Sm/Lg Straight, Yahtzee, Chance
- Yahtzee bonus scoring (100 pts per extra Yahtzee)
- Farkle mode: sets, straights, three pairs, hot dice

## Progression

- 41 achievements across gameplay milestones
- 8 unlockable dice skins
- 5 visual themes (Midnight, Ember, Arctic, Violet, Jade)
- Persistent leaderboards and stats
- All progress saved to localStorage

## Controls

| Action | Keyboard | VR Controller |
|--------|----------|---------------|
| Roll Dice | Space | Trigger |
| Keep Dice 1–5 | 1–5 | — |
| Pause | Esc / P | B Button |

## Tech

- Built with IWSDK 0.4.x + Three.js + EliCS
- 17 PanelUI spatial panels (uikitml) — zero HTML DOM UI
- Procedural audio (dice rolls, scoring, achievements)
- Holodeck neon environment with fog and particles
- XR-native with browser-first fallback

## Development

```bash
npm install
npx iwsdk dev up
npm run build
```

## License

MIT
