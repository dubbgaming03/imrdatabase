# Championship Bracket Challenge graphic

Makes the daily standings infographic for the Championship Bracket Challenge. Not part of the website build: `dist/` is what deploys, and this folder is never copied there.

- `reference.png` — Dubb's approved design (Round 5, 30 Oct 2026). Every graphic is built from it. Old text is cleaned out automatically.
- `fetch_standings.js` — run in a browser on https://imrdatabase.com/bracket/. It returns standings JSON: the week, the completed round, and each division's standings, computed with the site's own scoring and tiebreak (test brackets left out).
- `make_graphic.py` — builds the PNG from that JSON.

## Daily steps
1. Open https://imrdatabase.com/bracket/ in a browser, run the contents of `fetch_standings.js`, and save the returned string as `standings.json`.
2. Run `python3 make_graphic.py standings.json`. The output is `bracket_round<N>_<date>.png`.
   - Options: `--date YYYY-MM-DD` (default today, US Eastern), `--round N` (default: rounds completed in every division), `--boxes 3`, `--groups "Apex|Ultimate|Legendary,Master,Elite,Trial"` (manual override).
   - It prints the grouping, each panel's top 5, and anyone tied with 5th but left out.

## What the graphic shows
- Banner: `ROUND <N> - <D> <MONTH> <YYYY>`. N counts completed stages: R1, R2, Group final, Final 4, Final 2, Champion.
- Right column: 3 panels by default. Each panel shows the top 5 across its divisions, ranked by points, then finals points, then earliest submission.

## Grouping rules
- Divisions come from the site in tier order. A division is never split, and the order is kept.
- The split is chosen by the number of brackets entered: the smallest largest-panel first, then the smallest spread, then the fewest divisions per panel.
- Division names and count come from the site config, so new seasons with different divisions work without code changes.
- Headers:
  - Apex, Ultimate, Legendary and Master as single bars, and Elite | Trial as a pair, reuse the reference artwork.
  - Any other combination, or a new division name, gets a header in the same style, recoloured from the reference bar.
  - Colours: Apex yellow, Ultimate red, Legendary pink, Master gold, Elite purple, Trial blue. Unknown divisions take the next palette colour.

Requires python3 with Pillow, numpy and opencv-python, plus the Liberation Sans Bold and Noto Sans CJK Bold fonts.
