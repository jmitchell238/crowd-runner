# Architecture

Plain HTML, CSS and canvas with no build step. The scripts are classic `<script>` tags that share one global scope, so load order matters. They load in this order from `index.html`.

## Files

| File | Contents |
|------|----------|
| `js/utils.js` | Small math and random helpers |
| `js/audio.js` | Sound effects |
| `js/config.js` | `GAME_VERSION`, road size, skins, weapons, Shop upgrades, boss types, and loading saved progress |
| `js/sprites.js` | Sprite sheets embedded as data URLs, and sprite drawing |
| `js/renderer.js` | Canvas sizing, the camera, and `project()` |
| `js/state.js` | Shared game state: the player crowd, enemies, items, crates, particles |
| `js/character.js` | Crowds: creating them, laying out members, drawing fighters and bosses |
| `js/gates.js` | Gate math (add, multiply, subtract, divide) and drawing gates and bonus walls |
| `js/crates.js` | Weapon crates |
| `js/hazards.js` | Saws, spikes and pits |
| `js/level.js` | `buildLevel()`: generates gates, enemy squads, hazards, crates, the boss or fortress, and bonus walls for a level |
| `js/shop.js` | Shop upgrades, skins and rebirth |
| `js/lobby.js` | Menu tabs (Home, Shop, Daily, Settings), daily check-in, missions, settings |
| `js/main.js` | Input (thumbstick, keyboard, mouse drag), the game loop, fights, finishing a level |
| `sw.js`, `manifest.webmanifest` | Offline cache and PWA install |

## Rendering

The game is pseudo-3D. `project(wx, wy, wz)` in `js/renderer.js` turns a world position into `[screenX, screenY, scale]`, or `null` when it's behind the camera. Each frame, `draw()` in `js/main.js` queues everything visible and draws it far to near (painter's algorithm).

The stage is letterboxed to 16:9, or 9:16 in portrait, and all the HUD and menus are positioned inside it.

## Levels

`buildLevel(L)` builds the whole level up front. It keeps a running estimate of how big the crowd should be at each point and uses it to size gates, enemy squads, the boss and the bonus walls, so each level stays beatable as long as the player keeps upgrading.

## Saved data

Everything is in localStorage under `ccr_*` keys: level, coins, stars, upgrades (`ccr_up_*`), skins, settings, the daily streak and mission progress.
