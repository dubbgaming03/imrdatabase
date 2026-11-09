// Run in the browser on https://imrdatabase.com/bracket/ (the page loads BC from /bracket/logic.js).
// Returns JSON for make_graphic.py: event, completed round, and every division's standings
// (same scoring and tiebreak as the site's Standings tab; test brackets left out).
(async () => {
  const d = await fetch("/api/bracket/state").then((r) => r.json());
  const cfgDivs = d.config && d.config.players ? Object.keys(d.config.players) : [];
  const divs = cfgDivs.length ? cfgDivs : BC.DIVS;
  const norm = (r) => {
    const b = BC.blankResults();
    if (!r) return b;
    return { 1: r[1] || b[1], 2: r[2] || b[2], 3: r[3] || b[3], top4: r.top4 || [], top2: r.top2 || [], champ: r.champ ?? null };
  };
  // Stages in order; the round number is how many are complete, in order.
  const stages = (res) => [
    res[1].every((x) => x != null), res[2].every((x) => x != null), res[3].every((x) => x != null),
    res.top4.length === 4, res.top2.length === 2, res.champ != null,
  ];
  const out = { event: (d.config && d.config.event) || "", divisions: [] };
  let round = 99;
  for (const name of divs) {
    const res = norm((d.results || {})[name]);
    let n = 0;
    for (const done of stages(res)) { if (!done) break; n++; }
    round = Math.min(round, n);
    const ents = (d.entries || []).filter((e) => e.div === name && !e.test);
    out.divisions.push({
      name, count: ents.length, stagesDone: n,
      rows: BC.standings(ents, res).map((r) => ({ name: r.e.name, total: r.s.total, finals: r.s.finals, at: r.e.at })),
    });
  }
  out.round = round === 99 ? 0 : round;
  return JSON.stringify(out);
})();
