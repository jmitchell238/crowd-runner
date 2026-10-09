# Crowd Clash Runner

A crowd runner. Steer your army through gates that add to or multiply your numbers, fight enemy squads, dodge traps, and beat the boss waiting before the finish line. Whatever's left of your crowd smashes through bonus walls for extra coins.

Play at https://jmitchell238.github.io/crowd-runner/

You can install it as an app from the browser (Add to Home Screen on iPhone and iPad).

## Controls

| Input | Action |
|-------|--------|
| Touch: drag anywhere | Floating thumbstick to steer |
| ← → / A D | Steer |
| Mouse drag | Steer |

Settings switches between touch and keyboard controls.

## How a level works

- Gates come in pairs, one per side of the road. Blue ones add or multiply (+10, x2); red ones subtract or divide. Pick a side.
- Enemy squads block the road. When your crowd runs into one, the two armies fight it out. Upgrades decide how strong each of your fighters is.
- Weapon crates give your crowd a power boost.
- From level 3 on, saws, spikes and pits knock fighters out of your crowd.
- A boss army waits before the finish. Every 5th level it's a MEGA boss, and every 3rd level (that isn't a MEGA level) it's a fortress instead.
- After the finish there are five bonus walls worth x2, x3, x4, x6 and x10 coins. Each needs a certain number of fighters to break, and the label turns green when your crowd is big enough.

## Progression

Coins buy upgrades in the Shop:

| Upgrade | Effect |
|---------|--------|
| Weapon | Fists, Stick, Sword, Spear, Hammer, then Blaster. Each multiplies your fighters' power. |
| Troops | Fighter level, up to 100. Gear changes look every 10 levels. |
| Recruits | Start each level with more fighters |
| Riches | +20% coins per level of the upgrade |
| Armor | Lose fewer fighters in fights |
| Scavenger | More crates, and more power from each one |

Enemy armies level up with you, so you need to keep upgrading.

The Shop also sells skins, from the free Knight up to the Shadow Master. After beating level 15 you can rebirth: your level, coins and upgrades reset, and you get a star that permanently adds 30% to the coins you earn.

The Daily tab has a daily check-in streak and three missions a day, such as smashing bonus walls or reaching a crowd of a certain size.

Settings also switches between Classic and Pixel graphics.

## Credits

Character and skeleton sprites come from Kay Lousberg's KayKit Adventurers and Skeletons packs (CC0), rendered to sprite sheets with three.js.

## License

© 2026 James Mitchell / 238 Apps. All rights reserved. You're welcome to play it at https://jmitchell238.github.io/crowd-runner/, but the code, art and other content may not be copied, reused, republished or sold without permission. Third-party material keeps its own license. See [LICENSE](LICENSE), the [Terms of Use](https://jmitchell238.github.io/arcade-hub/terms.html) and the [Privacy Policy](https://jmitchell238.github.io/arcade-hub/privacy.html).

## Development

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for running it locally, checks and releasing, and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how the code is organized.
