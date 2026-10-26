# imrdatabase.com

Fan-made Infinite Magicraid database.

- `src/`: site source (app, data and images).
- `tools/build.js`: prerenders every page into `dist/` (needs Node and Playwright).
- `dist/`: the built site that Cloudflare Pages serves. Build command: none. Output directory: `dist`.

## Google indexing (SEO)

- Domain: imrdatabase.com and www.imrdatabase.com are both attached to the Worker; the canonical host is imrdatabase.com (no www). Google Search Console Domain property is verified and `/sitemap.xml` is submitted.
- `tools/build.js` writes `sitemap.xml` and `robots.txt`. Heroes, Spirit Beasts, Arcane Gems, factions and damage tags are added to the sitemap automatically from the data.
- Checklist when adding a NEW standalone tab/page (like `/bracket/`):
  1. Give it a unique `<title>`, `<meta name="description">` and `<link rel="canonical" href="https://imrdatabase.com/<path>/">`.
  2. Add its URL to the hard-coded list in `tools/build.js` (`urls.push(SITE+"/bracket/")` line) so it lands in the sitemap.
  3. If it's an in-app route, add its title/description to `meta()` in `src/assets/router.js`.
  4. Link to it from the tab bar so crawlers can find it.

## Championship Bracket Challenge

- Page: `src/bracket/` (served at `/bracket/`). Shared scoring/validation logic: `src/bracket/logic.js`.
- API: `worker/index.js` handles `/api/bracket/*`; everything else is served from `dist/`.
- Storage: D1 database `imrdatabase-bracket` bound as `DB` (tables are created automatically on first request; the first event and player lists come from `worker/seed-config.json`).
- Admin: set the `BRACKET_ADMIN_KEY` secret on the Worker, then sign in from the Admin link at the bottom of `/bracket/`.
