# Development

## Running locally

There's no build step and no ES modules, so you can open `index.html` straight from disk. To test the service worker and install prompt, serve it instead:

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080.

## Checks

There's no test suite in the repo. At minimum, check that every script parses:

```bash
for f in js/*.js; do node --check "$f"; done
```

## Releasing

Any change to a file the browser loads (`index.html`, `js/*`, the manifest or icons) needs a new `CACHE` value in `sw.js` (`'ccr-v15'` → `'ccr-v16'`). Otherwise installed copies keep serving the old version. New files also have to be added to `PRECACHE_URLS` in `sw.js`.

`GAME_VERSION` in `js/config.js` is the version shown in the game. It isn't tied to the cache name.

## Saved data

Progress is stored in localStorage under keys starting with `ccr_`. Don't rename them, or existing players lose their progress.
