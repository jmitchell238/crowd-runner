# Crowd Clash Runner — project instructions

## Workflow: plan → delegate → verify (REQUIRED)

The lead session (Fable) must NOT write game code itself. Its context is for
planning and verification only.

1. **Plan** — the lead breaks the request into small, concrete coding tasks.
2. **Beads** — create one bead per task (prefix issues with context): the files
   to touch, the exact functions/constants involved, acceptance criteria, and
   the test the implementer must run. Start the dolt server first:
   `cd /home/jmitchell238/.beads-dolt && dolt sql-server --port=3307 --loglevel=fatal &`
   (beads CLI is `bd`).
3. **Delegate** — spawn coding subagents with the Agent tool using
   `model: "haiku"` for mechanical/small edits or `model: "sonnet"` for
   multi-file or design-sensitive work. Paste the bead's full context into the
   agent prompt; the agent implements, runs the prescribed test, and reports
   the raw test output back.
4. **Verify** — the lead only checks the reported test results (and re-runs
   the smoke test / screenshots itself when the change is risky), then closes
   the bead. The lead never re-implements; if a result is wrong, update the
   bead and re-delegate.

## Architecture (context to paste into coding beads)

- Game lives at `/mnt/c/Users/jmitc/workspace/crowd-runner/`, launched by
  double-clicking `index.html` over **file://** — so NO ES modules, NO external
  assets; classic `<script>` tags share one global scope.
- Script load order matters (see index.html): utils, audio, config, renderer,
  state, character, gates, crates, hazards, level, shop, lobby, main.
- Pseudo-3D: `project(wx,wy,wz)` → `[screenX, screenY, scale]`; painter's
  algorithm queue `q` in main.js draw(), sorted far→near.
- 16:9 / 9:16 letterboxed `#stage`; all UI is absolute inside the stage.
- Save data in localStorage under `ccr_*` keys.
- Bosses: `BOSS_TYPES` in config.js, drawn by `drawBossFigure` in
  character.js (`single` crowds have no members); MEGA boss every 5th level.

## Testing (what every coding bead must run)

1. Syntax: `cd /mnt/c/Users/jmitc/workspace/crowd-runner && for f in js/*.js; do node --check "$f"; done`
2. Smoke sim: concatenate the 13 js files in load order into `game.js` next to
   the scratchpad `smoke.js` harness (stubbed DOM + optimal bot) and run
   `node smoke.js` — must end with `SMOKE OK`.
3. Visuals (when rendering changed): headless Windows Chrome from WSL:
   `"/mnt/c/Program Files/Google/Chrome/Application/chrome.exe" --headless
   --disable-gpu --window-size=1600,900 --virtual-time-budget=4000
   --screenshot=C:\...\shot.png "file:///C:/Users/jmitc/workspace/crowd-runner/_shot.html"`
   — note `--virtual-time-budget` does NOT fast-forward requestAnimationFrame;
   inject state-forcing setTimeout hooks into a `js/_main_shot.js` copy instead.
   Delete `_shot*.html` / `_*.png` / `js/_main_shot.js` artifacts afterward.

## Rules

- Preserve existing UI layouts and saved-game compatibility (don't rename
  `ccr_*` keys).
- The game is a PWA hosted at https://jmitchell238.github.io/crowd-runner/
  (repo jmitchell238/crowd-runner, Pages from main). Any bead that changes
  files the browser loads (index.html, js/*, manifest, icons) MUST also bump
  `const CACHE = 'ccr-vN'` in sw.js, or installed PWAs keep serving the old
  cached version. New browser-loaded files must be added to sw.js precache.
- After completing the requested task, STOP — no unsolicited refactors.
