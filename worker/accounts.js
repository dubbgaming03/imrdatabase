// Bracket history archive + "Sign in with Discord" accounts.
// Archive: every event's config, results and entries are copied into bracket_events / bracket_history
// whenever results are saved, before the event changes, and before entries are deleted.
// Accounts: Discord OAuth (identify scope only), session cookie, /api/auth/* and /api/me/*.
// Sign-in stays switched off until DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET are set on the Worker.
const BC = () => globalThis.BC;

export const ACCOUNT_SCHEMA = [
  "CREATE TABLE IF NOT EXISTS bracket_events (key TEXT PRIMARY KEY, event TEXT NOT NULL, deadline TEXT, config TEXT NOT NULL, results TEXT NOT NULL, updated_at TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS bracket_history (event_key TEXT NOT NULL, pid TEXT NOT NULL, name TEXT NOT NULL, discord TEXT NOT NULL, div TEXT NOT NULL, picks TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY (event_key, pid))",
  "CREATE INDEX IF NOT EXISTS bracket_history_discord ON bracket_history (discord COLLATE NOCASE)",
  "CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, discord_id TEXT UNIQUE NOT NULL, username TEXT NOT NULL, display TEXT, avatar TEXT, created_at TEXT NOT NULL, last_login TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS sessions (id_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at TEXT NOT NULL)",
];

const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extra } });
const fail = (msg, status = 400) => json({ error: msg }, status);
async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function kv(db, k, fb) {
  const r = await db.prepare("SELECT v FROM bracket_kv WHERE k = ?").bind(k).first();
  return r ? JSON.parse(r.v) : fb;
}

/* ---------------- archive ---------------- */
export const eventKey = (c) => (c && c.event ? c.event : null);

export async function snapshot(db) {
  const config = await kv(db, "config", null);
  const key = eventKey(config);
  if (!key) return 0;
  const results = await kv(db, "results", {});
  const rows = (await db.prepare("SELECT pid, name, discord, div, picks, created_at FROM bracket_entries WHERE test = 0").all()).results;
  if (!rows.length) return 0;
  const now = new Date().toISOString();
  const stmts = [
    db.prepare("INSERT INTO bracket_events (key, event, deadline, config, results, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(key) DO UPDATE SET config = excluded.config, results = excluded.results, updated_at = excluded.updated_at")
      .bind(key, config.event, config.deadline || null, JSON.stringify(config), JSON.stringify(results), now),
  ];
  for (const r of rows) {
    stmts.push(db.prepare("INSERT INTO bracket_history (event_key, pid, name, discord, div, picks, created_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(event_key, pid) DO UPDATE SET name = excluded.name, discord = excluded.discord, div = excluded.div, picks = excluded.picks")
      .bind(key, r.pid, r.name, r.discord, r.div, r.picks, r.created_at));
  }
  await db.batch(stmts);
  return rows.length;
}

export async function listArchive(db) {
  const ev = (await db.prepare("SELECT e.key, e.event, e.deadline, e.updated_at, COUNT(h.pid) AS entries FROM bracket_events e LEFT JOIN bracket_history h ON h.event_key = e.key GROUP BY e.key ORDER BY e.deadline DESC").all()).results;
  return ev;
}

/* ---------------- accounts ---------------- */
const COOKIE = "imr_session";
const DAYS = 60;
const enabled = (env) => !!(env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET);
const cookies = (req) => Object.fromEntries((req.headers.get("cookie") || "").split(/;\s*/).filter(Boolean).map((c) => { const i = c.indexOf("="); return [c.slice(0, i), decodeURIComponent(c.slice(i + 1))]; }));
const setCookie = (name, val, maxAge) => `${name}=${encodeURIComponent(val)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
const redirect = (to, headers = []) => { const h = new Headers({ location: to, "cache-control": "no-store" }); headers.forEach((c) => h.append("set-cookie", c)); return new Response(null, { status: 302, headers: h }); };
const safeNext = (n) => (typeof n === "string" && /^\/[^/\\]/.test(n) ? n : "/account/");

async function currentUser(req, db) {
  const sid = cookies(req)[COOKIE];
  if (!sid) return null;
  const row = await db.prepare("SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id_hash = ? AND s.expires_at > ?").bind(await sha256(sid), new Date().toISOString()).first();
  return row || null;
}
const publicUser = (u) => ({ username: u.username, display: u.display || u.username, avatar: u.avatar ? `https://cdn.discordapp.com/avatars/${u.discord_id}/${u.avatar}.png?size=128` : null, since: u.created_at });

// Names a player might have typed in the bracket form's Discord box.
const nameKeys = (u) => [...new Set([u.username, u.display].filter(Boolean).map((s) => s.toLowerCase()))];
const normDiscord = (s) => String(s || "").trim().replace(/^@/, "").replace(/#0$/, "").toLowerCase();

async function myBrackets(db, u) {
  const keys = nameKeys(u);
  const rows = (await db.prepare(`SELECT * FROM bracket_history WHERE lower(replace(replace(trim(discord), '@', ''), '#0', '')) IN (${keys.map(() => "?").join(",")})`).bind(...keys).all()).results
    .filter((r) => keys.includes(normDiscord(r.discord)));
  const out = [];
  const evCache = {};
  for (const r of rows) {
    if (!evCache[r.event_key]) {
      const ev = await db.prepare("SELECT * FROM bracket_events WHERE key = ?").bind(r.event_key).first();
      if (!ev) continue;
      const all = (await db.prepare("SELECT pid, div, picks, created_at FROM bracket_history WHERE event_key = ?").bind(r.event_key).all()).results;
      evCache[r.event_key] = { ev, results: JSON.parse(ev.results), all };
    }
    const { ev, results, all } = evCache[r.event_key];
    const res = results[r.div] || BC().blankResults();
    const field = all.filter((x) => x.div === r.div).map((x) => ({ ...JSON.parse(x.picks), pid: x.pid, at: x.created_at }));
    const st = BC().standings(field, res);
    const mine = st.find((x) => x.e.pid === r.pid);
    out.push({ event: ev.event, deadline: ev.deadline, div: r.div, name: r.name, place: mine ? mine.place : null, of: field.length, score: mine ? mine.s : null, picks: JSON.parse(r.picks), results: res, players: (JSON.parse(ev.config).players || {})[r.div] || [] });
  }
  out.sort((a, b) => String(b.deadline).localeCompare(String(a.deadline)));
  return out;
}

export async function handleAccounts(req, env, url) {
  const db = env.DB;
  const path = url.pathname.replace(/^\/api\//, "").replace(/\/$/, "");
  const origin = url.origin;

  if (path === "auth/status") return json({ enabled: enabled(env) });

  if (path === "auth/discord") {
    if (!enabled(env)) return fail("Sign-in isn't switched on yet.", 503);
    const state = crypto.randomUUID();
    const next = safeNext(url.searchParams.get("next"));
    const q = new URLSearchParams({ client_id: env.DISCORD_CLIENT_ID, response_type: "code", scope: "identify", redirect_uri: origin + "/api/auth/discord/callback", state, prompt: "none" });
    return redirect("https://discord.com/oauth2/authorize?" + q, [setCookie("imr_oauth", state + "|" + next, 600)]);
  }

  if (path === "auth/discord/callback") {
    if (!enabled(env)) return fail("Sign-in isn't switched on yet.", 503);
    const [state, next] = (cookies(req).imr_oauth || "").split("|");
    const clear = setCookie("imr_oauth", "", 0);
    if (url.searchParams.get("error")) return redirect("/account/?signin=cancelled", [clear]);
    if (!state || state !== url.searchParams.get("state")) return redirect("/account/?signin=failed", [clear]);
    const tok = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: env.DISCORD_CLIENT_ID, client_secret: env.DISCORD_CLIENT_SECRET, grant_type: "authorization_code", code: url.searchParams.get("code") || "", redirect_uri: origin + "/api/auth/discord/callback" }),
    }).then((r) => r.json()).catch(() => null);
    if (!tok || !tok.access_token) return redirect("/account/?signin=failed", [clear]);
    const me = await fetch("https://discord.com/api/users/@me", { headers: { authorization: "Bearer " + tok.access_token } }).then((r) => r.json()).catch(() => null);
    if (!me || !me.id) return redirect("/account/?signin=failed", [clear]);
    const now = new Date().toISOString();
    let user = await db.prepare("SELECT * FROM users WHERE discord_id = ?").bind(me.id).first();
    if (user) {
      await db.prepare("UPDATE users SET username = ?, display = ?, avatar = ?, last_login = ? WHERE id = ?").bind(me.username, me.global_name || null, me.avatar || null, now, user.id).run();
    } else {
      const id = crypto.randomUUID();
      await db.prepare("INSERT INTO users (id, discord_id, username, display, avatar, created_at, last_login) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(id, me.id, me.username, me.global_name || null, me.avatar || null, now, now).run();
      user = { id };
    }
    const sid = crypto.randomUUID() + crypto.randomUUID();
    const exp = new Date(Date.now() + DAYS * 864e5).toISOString();
    await db.batch([
      db.prepare("DELETE FROM sessions WHERE expires_at < ?").bind(now),
      db.prepare("INSERT INTO sessions (id_hash, user_id, expires_at) VALUES (?, ?, ?)").bind(await sha256(sid), user.id, exp),
    ]);
    return redirect(next || "/account/", [clear, setCookie(COOKIE, sid, DAYS * 86400)]);
  }

  if (path === "auth/logout" && req.method === "POST") {
    const sid = cookies(req)[COOKIE];
    if (sid) await db.prepare("DELETE FROM sessions WHERE id_hash = ?").bind(await sha256(sid)).run();
    return json({ ok: true }, 200, { "set-cookie": setCookie(COOKIE, "", 0) });
  }

  const u = await currentUser(req, db);
  if (path === "me") return json({ enabled: enabled(env), user: u ? publicUser(u) : null });
  if (!u) return fail("Sign in first.", 401);
  if (path === "me/brackets") return json({ brackets: await myBrackets(db, u) });
  if (path === "me/delete" && req.method === "POST") {
    await db.batch([db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(u.id), db.prepare("DELETE FROM users WHERE id = ?").bind(u.id)]);
    return json({ ok: true }, 200, { "set-cookie": setCookie(COOKIE, "", 0) });
  }
  return fail("Not found.", 404);
}
