# imrdatabase.com

Fan-made Infinite Magicraid database.

- `src/`: site source (app, data and images).
- `tools/build.js`: prerenders every page into `dist/` (needs Node and Playwright).
- `dist/`: the built site that Cloudflare Pages serves. Build command: none. Output directory: `dist`.

## Championship Bracket Challenge

- Page: `src/bracket/` (served at `/bracket/`). Shared scoring/validation logic: `src/bracket/logic.js`.
- API: `worker/index.js` handles `/api/bracket/*`; everything else is served from `dist/`.
- Storage: D1 database `imrdatabase-bracket` bound as `DB` (tables are created automatically on first request; the first event and player lists come from `worker/seed-config.json`).
- Admin: set the `BRACKET_ADMIN_KEY` secret on the Worker, then sign in from the Admin link at the bottom of `/bracket/`.
