/* Championship Bracket Challenge — pure logic (no DOM). Picks and results store SLOT numbers 0-63. */
const BC = (() => {
  const DIVS = ["Apex", "Ultimate", "Legendary", "Master", "Elite", "Trial"];
  const ROUND_SIZE = { 1: 32, 2: 16, 3: 8 };
  const PTS = { 1: 1, 2: 2, 3: 4, top4: 8, top2: 16, champ: 32 };
  const MAX = 32 * 1 + 16 * 2 + 8 * 4 + 4 * 8 + 2 * 16 + 32; // 192

  const blankPicks = () => ({ 1: Array(32).fill(null), 2: Array(16).fill(null), 3: Array(8).fill(null) });
  const blankResults = () => ({ ...blankPicks(), top4: [], top2: [], champ: null });
  // A player's draft: group picks, Top 8 seeds, and the seeded final bracket (q = Final 8 winners, s = Final 4 winners, c = champion)
  const blankDraft = () => ({ ...blankPicks(), rank: [], q: Array(4).fill(null), s: Array(2).fill(null), c: null });

  // Seeded Final 8: 1v8 and 4v5 meet in one semi, 2v7 and 3v6 in the other.
  const SEED_PAIRS = [[0, 7], [3, 4], [1, 6], [2, 5]];
  function finalComp(d, stage, i) {
    const rank = d.rank || [];
    if (stage === "q") return SEED_PAIRS[i].map((k) => rank[k] ?? null);
    if (stage === "s") return [d.q[2 * i] ?? null, d.q[2 * i + 1] ?? null];
    return [d.s[0] ?? null, d.s[1] ?? null];
  }
  function syncSeeded(d) {
    if (!d.q) return d;
    for (let i = 0; i < 4; i++) if (d.q[i] != null && !finalComp(d, "q", i).includes(d.q[i])) d.q[i] = null;
    for (let i = 0; i < 2; i++) if (d.s[i] != null && !finalComp(d, "s", i).includes(d.s[i])) d.s[i] = null;
    if (d.c != null && !finalComp(d, "c", 0).includes(d.c)) d.c = null;
    return d;
  }
  const copyDraft = (d) => ({ ...d, 1: [...d[1]], 2: [...d[2]], 3: [...d[3]], rank: [...(d.rank || [])], q: [...(d.q || [null, null, null, null])], s: [...(d.s || [null, null])], c: d.c ?? null });
  function setFinal(d, stage, i, slot) {
    const out = copyDraft(d);
    if (stage === "c") out.c = out.c === slot ? null : slot;
    else out[stage][i] = out[stage][i] === slot ? null : slot;
    return syncSeeded(out);
  }
  function moveSeed(d, i, dir) {
    const out = copyDraft(d), r = out.rank, j = i + dir;
    if (j < 0 || j >= r.length) return out;
    [r[i], r[j]] = [r[j], r[i]];
    return syncSeeded(out);
  }

  // Slot label like "1a" (group 1, pair a). Slot 0,1 -> 1a; 2,3 -> 1b ... 62,63 -> 8d
  const slotLabel = (s) => `${Math.floor(s / 8) + 1}${"abcd"[Math.floor((s % 8) / 2)]}`;

  // The two slots competing in a match, given the picks (or results) of the round before.
  function competitors(src, round, i) {
    if (round === 1) return [2 * i, 2 * i + 1];
    const prev = src[round - 1] || [];
    return [prev[2 * i] ?? null, prev[2 * i + 1] ?? null];
  }

  // Set a winner and clear later picks that no longer make sense. Returns a new object.
  function setWinner(src, round, i, slot) {
    const out = { ...src, 1: [...src[1]], 2: [...src[2]], 3: [...src[3]] };
    if (src.rank) { out.rank = [...src.rank]; out.q = [...(src.q || [null, null, null, null])]; out.s = [...(src.s || [null, null])]; out.c = src.c ?? null; }
    if (src.top4) { out.top4 = [...src.top4]; out.top2 = [...src.top2]; }
    out[round][i] = out[round][i] === slot ? null : slot; // clicking again clears
    for (let r = round + 1; r <= 3; r++) {
      for (let m = 0; m < ROUND_SIZE[r]; m++) {
        const c = competitors(out, r, m);
        if (out[r][m] != null && !c.includes(out[r][m])) out[r][m] = null;
      }
    }
    syncFinals(out);
    return out;
  }

  // Keep the Top 8 ranking (picks) or finals (results) consistent with round-3 winners.
  function syncFinals(o) {
    const winners = o[3].filter((s) => s != null);
    if (o.rank) {
      const kept = o.rank.filter((s) => winners.includes(s));
      winners.forEach((s) => { if (!kept.includes(s)) kept.push(s); });
      o.rank = kept;
      syncSeeded(o);
    }
    if (o.top4) {
      o.top4 = o.top4.filter((s) => winners.includes(s));
      o.top2 = o.top2.filter((s) => o.top4.includes(s));
      if (o.champ != null && !o.top2.includes(o.champ)) o.champ = null;
    }
  }

  // Draft shape <-> stored entry shape {p:{1,2,3}, rank, f:{q,s,c}}
  const toEntry = (d) => ({ p: { 1: [...d[1]], 2: [...d[2]], 3: [...d[3]] }, rank: [...(d.rank || [])], f: { q: [...(d.q || [])], s: [...(d.s || [])], c: d.c ?? null } });
  const toDraft = (e) => syncSeeded(copyDraft({ 1: e.p[1], 2: e.p[2], 3: e.p[3], rank: e.rank || [], q: e.f && e.f.q, s: e.f && e.f.s, c: e.f ? e.f.c : null }));
  const pickCount = (d) => [1, 2, 3].reduce((a, r) => a + d[r].filter((x) => x != null).length, 0) + (d.q || []).filter((x) => x != null).length + (d.s || []).filter((x) => x != null).length + (d.c != null ? 1 : 0);
  const TOTAL_PICKS = 63;

  function isComplete(p) {
    return pickCount(p) === TOTAL_PICKS && Array.isArray(p.rank) && p.rank.length === 8;
  }
  // Who the entry sends to the Final 4, Final 2, and champion.
  function finalPicks(e) {
    if (e.f && e.f.q) return { f4: e.f.q, f2: e.f.s || [], champ: e.f.c ?? null };
    const r = e.rank || []; return { f4: r.slice(0, 4), f2: r.slice(0, 2), champ: r[0] ?? null };
  }

  // Players knocked out by real results so far.
  function eliminated(res) {
    const out = new Set();
    for (let r = 1; r <= 3; r++) {
      for (let m = 0; m < ROUND_SIZE[r]; m++) {
        const w = res[r][m];
        if (w == null) continue;
        competitors(res, r, m).forEach((c) => { if (c != null && c !== w) out.add(c); });
      }
    }
    const gw = res[3].filter((s) => s != null);
    if (res.top4.length === 4) gw.forEach((s) => { if (!res.top4.includes(s)) out.add(s); });
    if (res.top2.length === 2) res.top4.forEach((s) => { if (!res.top2.includes(s)) out.add(s); });
    if (res.champ != null) res.top2.forEach((s) => { if (s !== res.champ) out.add(s); });
    return out;
  }

  function score(entry, res) {
    if (!entry.p) return { r1: 0, r2: 0, r3: 0, finals: 0, total: 0, max: MAX };
    const p = entry.p, fp = finalPicks(entry);
    const out = { r1: 0, r2: 0, r3: 0, finals: 0, total: 0, max: 0 };
    const elim = eliminated(res);
    let possible = 0;
    for (let r = 1; r <= 3; r++) {
      for (let m = 0; m < ROUND_SIZE[r]; m++) {
        const pick = p[r][m], act = res[r][m];
        if (act != null) { if (pick === act) out["r" + r] += PTS[r]; }
        else if (pick != null && !elim.has(pick)) possible += PTS[r];
      }
    }
    const stage = (names, actual, need, pts) => {
      names.forEach((s) => {
        if (s == null) return;
        if (actual.length === need) { if (actual.includes(s)) out.finals += pts; }
        else if (!elim.has(s)) possible += pts;
      });
    };
    stage(fp.f4, res.top4, 4, PTS.top4);
    stage(fp.f2, res.top2, 2, PTS.top2);
    stage([fp.champ], res.champ != null ? [res.champ] : [], 1, PTS.champ);
    out.total = out.r1 + out.r2 + out.r3 + out.finals;
    out.max = out.total + possible;
    return out;
  }

  // Standings for one division: points, then finals points, then earliest submission.
  function standings(entries, res) {
    const rows = entries.map((e) => ({ e, s: score(e, res) }));
    rows.sort((a, b) => b.s.total - a.s.total || b.s.finals - a.s.finals || String(a.e.at).localeCompare(String(b.e.at)));
    rows.forEach((row, i) => { row.place = i + 1; });
    return rows;
  }

  // Next Monday 02:00 GMT after `from`.
  function nextReset(from = new Date()) {
    const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), 2, 0, 0));
    let add = (1 - d.getUTCDay() + 7) % 7;
    if (add === 0 && d <= from) add = 7;
    d.setUTCDate(d.getUTCDate() + add);
    return d;
  }

  function parsePlayers(text) {
    return text.split(/\r?\n/).map((s) => s.replace(/^\s*\d+[a-d]?[.):\-\s]+/i, "").trim()).filter(Boolean);
  }

  function validEntryFields(f) {
    const errs = [];
    if (!/^\d{5,12}$/.test(f.pid || "")) errs.push("Player ID should be the number from your in-game profile (5 to 12 digits).");
    if (!(f.name || "").trim()) errs.push("Add your in-game player name.");
    if (!(f.discord || "").trim()) errs.push("Add your Discord name so you can be contacted if you win.");
    if (!DIVS.includes(f.div)) errs.push("Pick a division.");
    return errs;
  }

  // Server-side check that a submitted entry is a complete, consistent bracket. Returns an error string or null.
  function validateEntry(e) {
    const isSlot = (x) => Number.isInteger(x) && x >= 0 && x < 64;
    if (!e || typeof e !== "object" || !e.p || !e.f) return "Bracket is missing.";
    for (let r = 1; r <= 3; r++) {
      if (!Array.isArray(e.p[r]) || e.p[r].length !== ROUND_SIZE[r]) return "Bracket is incomplete.";
      for (let m = 0; m < ROUND_SIZE[r]; m++) {
        const w = e.p[r][m];
        if (!isSlot(w) || !competitors(e.p, r, m).includes(w)) return "Bracket has an invalid pick.";
      }
    }
    const rank = e.rank;
    if (!Array.isArray(rank) || rank.length !== 8 || new Set(rank).size !== 8 || !rank.every((s) => e.p[3].includes(s))) return "Top 8 ranking is invalid.";
    const d = { rank, q: e.f.q, s: e.f.s, c: e.f.c };
    if (!Array.isArray(d.q) || d.q.length !== 4 || !Array.isArray(d.s) || d.s.length !== 2) return "Final 8 bracket is incomplete.";
    for (let i = 0; i < 4; i++) if (!finalComp(d, "q", i).includes(d.q[i]) || d.q[i] == null) return "Final 8 bracket has an invalid pick.";
    for (let i = 0; i < 2; i++) if (!finalComp(d, "s", i).includes(d.s[i]) || d.s[i] == null) return "Final 4 pick is invalid.";
    if (d.c == null || !finalComp(d, "c", 0).includes(d.c)) return "Champion pick is invalid.";
    return null;
  }

  // Random helpers for test mode
  function randomPicks(rng = Math.random) {
    let p = blankDraft();
    for (let r = 1; r <= 3; r++) for (let m = 0; m < ROUND_SIZE[r]; m++) {
      const c = competitors(p, r, m); p = setWinner(p, r, m, c[rng() < 0.5 ? 0 : 1]);
    }
    p.rank = shuffle(p.rank, rng);
    for (const [st, n] of [["q", 4], ["s", 2], ["c", 1]]) for (let i = 0; i < n; i++) { const c = finalComp(p, st, i); p = setFinal(p, st, i, c[rng() < 0.5 ? 0 : 1]); }
    return toEntry(p);
  }
  function randomResults(upTo = 6, rng = Math.random) {
    let res = blankResults();
    for (let r = 1; r <= Math.min(3, upTo); r++) for (let m = 0; m < ROUND_SIZE[r]; m++) {
      const c = competitors(res, r, m); res = setWinner(res, r, m, c[rng() < 0.5 ? 0 : 1]);
    }
    if (upTo >= 4) res.top4 = shuffle(res[3], rng).slice(0, 4);
    if (upTo >= 5) res.top2 = shuffle(res.top4, rng).slice(0, 2);
    if (upTo >= 6) res.champ = res.top2[rng() < 0.5 ? 0 : 1];
    return res;
  }
  function shuffle(a, rng) { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  return { validateEntry, blankDraft, SEED_PAIRS, finalComp, setFinal, moveSeed, pickCount, TOTAL_PICKS, finalPicks, DIVS, ROUND_SIZE, PTS, MAX, blankPicks, blankResults, slotLabel, competitors, toEntry, toDraft, setWinner, syncFinals, isComplete, eliminated, score, standings, nextReset, parsePlayers, validEntryFields, randomPicks, randomResults };
})();
if (typeof module !== "undefined" && module.exports) module.exports = BC;
globalThis.BC = BC;
