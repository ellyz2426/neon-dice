# Neon Picross VR

A nonogram (picture logic) puzzle game built with [IWSDK](https://iwsdk.dev) — playable in VR and in the browser.

## Play

**[Play Now](https://ellyz2426.github.io/neon-picross/)**

## Features

- **20 handcrafted puzzles** — 10 easy (5x5) and 10 standard (10x10)
- **7 game modes** — Classic, Timed, Zen, Speed, Challenge, Daily, Endless
- **Full PanelUI** — 17 spatial panels for menus, HUD, clues, achievements, stats, settings
- **40 achievements** — progression tracking with XP and leveling
- **8 skins & 5 themes** — unlock and customize your grid and environment
- **Combo system** — chain correct fills for score multipliers
- **Seeded daily challenge** — same puzzle for everyone each day
- **Procedural audio** — synthesized fill, mark, error, combo, and solve sounds
- **Holodeck environment** — neon grid floor, ambient particles, fog

## Controls

### VR
- **Trigger** — Fill cell
- **Grip** — Mark cell (X)
- **B Button** — Pause / Resume

### Browser
- **Left Click** — Fill cell
- **Right Click** — Mark cell (X)
- **ESC / P** — Pause / Resume
- **H** — Use hint
- **R** — Rematch (game over screen)
- **M** — Return to menu (game over screen)

## Tech

- **IWSDK** v0.4.1 — Immersive Web SDK
- **1,554 lines** TypeScript
- **17 PanelUI panels** (uikitml)
- Zero HTML DOM game UI

## Development

```bash
npm install
npx iwsdk dev up    # or: npx vite
```

## License

MIT

## Gameplay

- Navigate Pac-Man through the classic maze to eat all pellets
- Avoid four ghosts with unique AI personalities:
  - **Blinky** (red): Direct chase — always targets your position
  - **Pinky** (pink): Ambush — targets 4 tiles ahead of you
  - **Inky** (cyan): Flanking — uses Blinky's position to flank
  - **Clyde** (orange): Shy — chases from afar, scatters when close
- Grab power pellets to make ghosts vulnerable — eat them for bonus points (200→400→800→1600)
- Collect fruit bonuses for extra points (Cherry through Key)
- Clear all pellets to advance — ghosts get faster each level!

## Features

### Game Modes (6)
- **Classic** — The original Pac-Man experience
- **Speed Run** — Everything moves 50% faster
- **Dark Mode** — Limited visibility around Pac-Man
- **Survival** — One life. How far can you go?
- **Marathon** — Ghosts get faster every level
- **Zen** — No ghosts, just dots

### Difficulty Settings
- **Easy** — Slower ghosts, longer fright, 5 lives
- **Normal** — Balanced experience, 3 lives
- **Hard** — Faster ghosts, shorter fright, 2 lives

### Achievements (65+)
Score milestones, ghost hunting combos, level progression, skill challenges (perfect clears, speed clears, no-power clears), fruit collection, mode-specific achievements, and secret/rare unlocks.

### Visual
- Neon aesthetic with glowing walls and edge highlighting
- 5 maze themes (Neon Blue, Cyber Red, Matrix Green, Vapor Purple, Sunset Orange)
- Particle effects for ghost eating, death, level complete, and fruit collection
- InstancedMesh walls for performance

### Audio
- Procedural audio: waka-waka, power pellet, ghost eat, death, level complete
- Frightened mode siren, achievement unlock, and menu sounds
- Sound toggle in settings

### UI (9 PanelUI Panels)
HUD with score/lives/level/combo, main menu, mode selection, settings (sound, difficulty, theme), achievements browser with pagination, statistics dashboard, enhanced game over with detailed stats, pause menu, and achievement toast notifications. Zero HTML DOM UI.

## Controls

### VR (Quest / WebXR)
| Input | Action |
|-------|--------|
| Thumbstick | Move Pac-Man |
| A | Start / Select |
| B | Pause |

### Browser
| Input | Action |
|-------|--------|
| Arrow Keys / WASD | Move Pac-Man |
| Space / Enter | Start / Select |
| ESC / P | Pause |
| M | Mode Select |

## Tech

- Built with [IWSDK](https://iwsdk.dev) 0.4.x (Immersive Web SDK)
- 9 PanelUI spatial panels — zero HTML DOM UI
- ECS architecture with GameSystem, UISystem, and ParticleSystem
- Dual runtime: full VR + browser-first
- Procedural audio via Web Audio API
- InstancedMesh walls for performance
- TypeScript

## Development

```bash
npm install
npx iwsdk dev
```

## License

MIT
