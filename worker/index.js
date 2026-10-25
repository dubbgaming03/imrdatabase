// imrdatabase.com Worker: serves the static site from ./dist and the Bracket Challenge API under /api/bracket/.
// Storage: D1 database bound as DB. Admin actions need the BRACKET_ADMIN_KEY secret in the x-admin-key header.
import "../src/bracket/logic.js";
import SEED_CONFIG from "./seed-config.json";
const BC = globalThis.BC;

const SCHEMA = [
  "CREATE TABLE IF NOT EXISTS bracket_entries (pid TEXT PRIMARY KEY, name TEXT NOT NULL, discord TEXT NOT NULL, div TEXT NOT NULL, picks TEXT NOT NULL, token_hash TEXT NOT NULL, test INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS bracket_kv (k TEXT PRIMARY KEY, v TEXT NOT NULL)",
];
let schemaReady = false;
async function ensureSchema(db) {
  if (schemaReady) return;
  await db.batch(SCHEMA.map((q) => db.prepare(q)));
  // First run: load this week's event and the players copied from the test page.
  await db.prepare("INSERT OR IGNORE INTO bracket_kv (k, v) VALUES ('config', ?)").bind(JSON.stringify(SEED_CONFIG)).run();
  schemaReady = true;
}

const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extra } });
const fail = (msg, status = 400) => json({ error: msg }, status);

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function sameText(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let x = 0;
  for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return x === 0;
}
const isAdmin = (req, env) => !!env.BRACKET_ADMIN_KEY && sameText(req.headers.get("x-admin-key") || "", env.BRACKET_ADMIN_KEY);

async function getKV(db, k, fallback) {
  const row = await db.prepare("SELECT v FROM bracket_kv WHERE k = ?").bind(k).first();
  return row ? JSON.parse(row.v) : fallback;
}
const putKV = (db, k, v) => db.prepare("INSERT INTO bracket_kv (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v").bind(k, JSON.stringify(v)).run();

const isLocked = (config) => !!(config && config.deadline) && Date.now() >= Date.parse(config.deadline);
const clean = (s, max) => String(s || "").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max);
const maskPid = (pid) => "•••" + String(pid).slice(-4);

function rowToEntry(row, { full, revealPicks }) {
  const e = { id: maskPid(row.pid), name: row.name, div: row.div, at: row.created_at, test: !!row.test };
  if (revealPicks || full) Object.assign(e, JSON.parse(row.picks));
  if (full) Object.assign(e, { pid: row.pid, discord: row.discord, updated: row.updated_at });
  return e;
}

async function readBody(req) {
  try { return await req.json(); } catch { return null; }
}

async function handleApi(req, env, url) {
  const db = env.DB;
  if (!db) return fail("The bracket database isn't connected yet.", 503);
  await ensureSchema(db);
  const path = url.pathname.replace(/^\/api\/bracket\/?/, "").replace(/\/$/, "");
  const admin = isAdmin(req, env);

  // Public state: event, players, results, and entries (picks hidden until the lock).
  if (req.method === "GET" && path === "state") {
    const [config, results, rows] = await Promise.all([
      getKV(db, "config", null),
      getKV(db, "results", {}),
      db.prepare("SELECT * FROM bracket_entries ORDER BY created_at").all(),
    ]);
    const revealPicks = isLocked(config) || admin;
    return json({ config, results, locked: isLocked(config), admin, now: new Date().toISOString(), entries: rows.results.map((r) => rowToEntry(r, { full: admin, revealPicks })) });
  }

  // A player's own saved bracket, using the edit code from their first submission.
  if (req.method === "POST" && path === "mine") {
    const b = await readBody(req);
    if (!b || !b.pid) return fail("Missing Player ID.");
    const row = await db.prepare("SELECT * FROM bracket_entries WHERE pid = ?").bind(String(b.pid)).first();
    if (!row) return fail("No bracket saved for that Player ID.", 404);
    if (!admin && !sameText(await sha256(String(b.token || "")), row.token_hash)) return fail("That edit code doesn't match this Player ID.", 403);
    return json({ entry: { ...rowToEntry(row, { full: true, revealPicks: true }), token_hash: undefined } });
  }

  // Submit or update a bracket.
  if (req.method === "POST" && path === "entry") {
    const b = await readBody(req);
    if (!b) return fail("Couldn't read your bracket. Try again.");
    const config = await getKV(db, "config", null);
    if (!config) return fail("The event isn't set up yet.", 409);
    if (isLocked(config) && !admin) return fail("Picks are locked.", 409);
    const f = { pid: clean(b.pid, 12), name: clean(b.name, 40), discord: clean(b.discord, 60), div: clean(b.div, 20) };
    const fieldErrs = BC.validEntryFields(f);
    if (fieldErrs.length) return fail(fieldErrs[0]);
    if (!(config.players && config.players[f.div] && config.players[f.div].length === 64)) return fail(`The ${f.div} players aren't posted yet.`);
    const entry = { p: b.p, rank: b.rank, f: b.f };
    const bad = BC.validateEntry(entry);
    if (bad) return fail(bad);
    const picks = JSON.stringify({ p: { 1: entry.p[1], 2: entry.p[2], 3: entry.p[3] }, rank: entry.rank, f: { q: entry.f.q, s: entry.f.s, c: entry.f.c } });
    const now = new Date().toISOString();
    const existing = await db.prepare("SELECT token_hash FROM bracket_entries WHERE pid = ?").bind(f.pid).first();
    if (existing) {
      if (!admin && !sameText(await sha256(String(b.token || "")), existing.token_hash)) {
        return fail("This Player ID already has a bracket. To change it, use the same device and browser you submitted from, or ask Dubb to reset it.", 403);
      }
      await db.prepare("UPDATE bracket_entries SET name = ?, discord = ?, div = ?, picks = ?, updated_at = ? WHERE pid = ?").bind(f.name, f.discord, f.div, picks, now, f.pid).run();
      return json({ ok: true, updated: true });
    }
    const token = crypto.randomUUID();
    const test = admin && b.test ? 1 : 0;
    await db.prepare("INSERT INTO bracket_entries (pid, name, discord, div, picks, token_hash, test, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(f.pid, f.name, f.discord, f.div, picks, await sha256(token), test, b.at && admin ? String(b.at) : now, now).run();
    return json({ ok: true, created: true, token });
  }

  // ----- admin -----
  if (path.startsWith("admin/")) {
    if (!admin) return fail("Admin password is wrong.", 401);
    const what = path.slice(6);
    if (req.method === "GET" && what === "check") return json({ ok: true });
    const b = await readBody(req);
    if (req.method === "POST" && what === "config") {
      if (!b) return fail("Missing settings.");
      const cur = await getKV(db, "config", { event: "", deadline: null, players: {} });
      const next = { ...cur };
      if ("event" in b) next.event = clean(b.event, 120);
      if ("deadline" in b) next.deadline = b.deadline && !isNaN(Date.parse(b.deadline)) ? new Date(b.deadline).toISOString() : null;
      if (b.players && typeof b.players === "object") {
        next.players = { ...(cur.players || {}) };
        for (const [d, list] of Object.entries(b.players)) {
          if (!BC.DIVS.includes(d)) return fail("Unknown division " + d);
          if (!Array.isArray(list) || list.length !== 64) return fail(`${d} needs exactly 64 players.`);
          next.players[d] = list.map((n) => clean(n, 40));
        }
      }
      await putKV(db, "config", next);
      return json({ ok: true, config: next });
    }
    if (req.method === "POST" && what === "results") {
      if (!b || typeof b !== "object") return fail("Missing results.");
      const out = {};
      for (const d of BC.DIVS) if (b[d]) out[d] = b[d];
      await putKV(db, "results", out);
      return json({ ok: true });
    }
    if (req.method === "POST" && what === "delete") {
      const pids = Array.isArray(b && b.pids) ? b.pids.map(String) : [];
      if (!pids.length) return fail("Nothing to delete.");
      await db.batch(pids.map((p) => db.prepare("DELETE FROM bracket_entries WHERE pid = ?").bind(p)));
      return json({ ok: true, deleted: pids.length });
    }
    if (req.method === "POST" && what === "delete-tests") {
      const r = await db.prepare("DELETE FROM bracket_entries WHERE test = 1").run();
      return json({ ok: true, deleted: r.meta.changes });
    }
  }
  return fail("Not found.", 404);
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/api/bracket")) {
      try {
        return await handleApi(req, env, url);
      } catch (err) {
        console.error(err);
        return fail("Something went wrong on the server. Try again in a moment.", 500);
      }
    }
    return env.ASSETS.fetch(req);
  },
};
