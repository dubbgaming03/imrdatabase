(() => {
const $ = (s, r = document) => r.querySelector(s);
const h = (tag, attrs = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "text") el.textContent = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(String(c)));
  return el;
};
const LS = { get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
const RNAME = { 1: "Round 1", 2: "Round 2", 3: "Group final" };

const S = {
  isAdmin: false, ready: false, offline: false, adminKey: LS.get("bcc-admin") || "", tokens: LS.get("bcc-tokens") || {},
  config: null, results: {}, entries: [],
  tab: ["picks", "bracket", "standings", "admin"].includes(location.hash.slice(1)) ? location.hash.slice(1) : "picks",
  div: { bracket: "Apex", standings: "Apex", admin: "Apex" },
  form: Object.assign({ pid: "", name: "", discord: "", div: "Apex" }, LS.get("bcc-form") || {}),
  draft: LS.get("bcc-draft") || null,
  adminRes: null, adminDirty: false, selEntry: null, confirmDel: null, busy: false,
};
if (!S.draft || !S.draft[1]) S.draft = BC.blankDraft();
if (!S.draft.q) S.draft = { ...S.draft, q: [null, null, null, null], s: [null, null], c: null };

async function api(path, body, method) {
  const headers = { "content-type": "application/json" };
  if (S.adminKey) headers["x-admin-key"] = S.adminKey;
  const res = await fetch("/api/bracket/" + path, { method: method || (body ? "POST" : "GET"), headers, body: body ? JSON.stringify(body) : undefined });
  let data = {};
  try { data = await res.json(); } catch {}
  if (!res.ok) { const err = new Error(data.error || "Something went wrong. Try again."); err.status = res.status; throw err; }
  return data;
}
async function refresh() {
  try {
    const d = await api("state");
    S.config = d.config; S.results = d.results || {}; S.entries = d.entries || []; S.isAdmin = !!d.admin; S.serverLocked = d.locked;
    if (S.adminRes && !S.adminDirty) S.adminRes = null;
    S.ready = true; S.offline = false;
  } catch (e) { if (!S.ready) S.offline = true; }
  if (!S.typing) render();
}
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => (t.hidden = true), 3200); }
const players = (div) => (S.config && S.config.players && S.config.players[div]) || [];
const pname = (div, s) => (s == null ? null : players(div)[s] || `Slot ${BC.slotLabel(s)}`);
const resultsFor = (div) => { const r = S.results[div]; return r ? normalizeRes(r) : BC.blankResults(); };
function normalizeRes(r) { const b = BC.blankResults(); return { 1: r[1] || b[1], 2: r[2] || b[2], 3: r[3] || b[3], top4: r.top4 || [], top2: r.top2 || [], champ: r.champ ?? null }; }
const deadline = () => (S.config && S.config.deadline ? new Date(S.config.deadline) : null);
const locked = () => { const d = deadline(); return !!d && Date.now() >= d.getTime(); };
const entriesIn = (div) => S.entries.filter((e) => e.div === div);
const fmtGMT = (d) => d.toLocaleString("en-GB", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) + " GMT";
const fmtLocal = (d) => d.toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
function roundsDone(res) {
  if (res.champ != null) return "Champion crowned";
  if (res.top2.length === 2) return "Final 2 set";
  if (res.top4.length === 4) return "Final 4 set";
  for (let r = 3; r >= 1; r--) { const n = res[r].filter((x) => x != null).length; if (n) return `${RNAME[r]}: ${n} of ${BC.ROUND_SIZE[r]} results`; }
  return "No results yet";
}

/* ---------- header ---------- */
function renderHeader() {
  const ev = S.config && S.config.event;
  $("#eventLine").textContent = S.offline ? "Couldn't load the event. Check your connection and refresh." : ev ? ev : S.ready ? "No event set up yet." : "Loading event…";
  const d = deadline(), box = $("#lockBox");
  box.className = "lock " + (d ? (locked() ? "closed" : "open") : "");
  if (!d) { $("#lockBig").textContent = "Not scheduled"; $("#lockSmall").textContent = ""; return; }
  if (locked()) { $("#lockBig").textContent = "Locked"; $("#lockSmall").textContent = "Closed " + fmtGMT(d); return; }
  const ms = d - Date.now(), dd = Math.floor(ms / 864e5), hh = Math.floor(ms / 36e5) % 24, mm = Math.floor(ms / 6e4) % 60;
  $("#lockBig").textContent = `Locks in ${dd ? dd + "d " : ""}${hh}h ${mm}m`;
  $("#lockSmall").textContent = `${fmtLocal(d)} your time`;
}
setInterval(() => { const was = renderHeader.lockedState; renderHeader(); if (was !== locked()) { renderHeader.lockedState = locked(); if (was !== undefined) render(); } }, 20000);

/* ---------- bracket group card ---------- */
// src: draft/results object; opts: {editable, onPick, compare (results), elim (Set), div}
function groupCard(g, src, opts) {
  const div = opts.div;
  const slotBtn = (slot, round, i) => {
    if (slot == null) return h("div", { class: "slot tbd" }, h("span", { class: "lb" }, ""), h("span", { class: "nm" }, "TBD"));
    const picked = src[round][i] === slot;
    let cls = "slot";
    if (picked) {
      if (opts.compare) { const act = opts.compare[round][i]; cls += act == null ? " win" : act === slot ? " hit" : " miss"; }
      else cls += " win";
    } else if (opts.elim && opts.elim.has(slot)) cls += " out";
    const label = round === 1 ? BC.slotLabel(slot) : "";
    const attrs = { class: cls, title: pname(div, slot) };
    if (opts.editable) { attrs.onclick = () => opts.onPick(round, i, slot); attrs["aria-pressed"] = picked ? "true" : "false"; }
    return h(opts.editable ? "button" : "div", attrs, h("span", { class: "lb" }, label), h("span", { class: "nm" }, pname(div, slot)));
  };
  const match = (round, i) => { const [a, b] = BC.competitors(src, round, i); return h("div", { class: "match" }, slotBtn(a, round, i), slotBtn(b, round, i)); };
  const col = (round, from, n, extra) => h("div", { class: "gcol" + (round === 3 ? " c3" : "") }, h("div", { class: "eyebrow" }, RNAME[round]), Array.from({ length: n }, (_, k) => match(round, from + k)), extra);
  const w = src[3][g];
  return h("div", { class: "group" },
    h("div", { class: "ghead" }, h("h3", {}, `Group ${g + 1}`), h("span", { class: "muted", style: "font-size:13px" }, `${BC.slotLabel(g * 8)}–${BC.slotLabel(g * 8 + 7)}`)),
    h("div", { class: "gcols" }, col(1, g * 4, 4), col(2, g * 2, 2), col(3, g, 1, h("div", { class: "gwin" }, w != null ? "→ " + pname(div, w) : ""))));
}
const groupGrid = (src, opts) => h("div", { class: "groups" }, Array.from({ length: 8 }, (_, g) => groupCard(g, src, opts)));

function seedList(rank, div, opts = {}) {
  if (!rank.length) return h("div", { class: "note" }, "Your 8 group winners appear here as you pick them.");
  return h("div", { class: "rank" }, rank.map((s, i) => h("div", { class: "ritem" + (i === 0 ? " t1" : "") },
    h("span", { class: "pos" }, i + 1),
    h("div", { style: "min-width:0" }, h("div", { class: "nm" }, pname(div, s)), h("div", { class: "tier" }, `Seed ${i + 1} · plays seed ${8 - i}`)),
    opts.editable ? h("button", { class: "arrow", "aria-label": "Move up", disabled: i === 0, onclick: () => opts.move(i, -1) }, "▲") : h("span"),
    opts.editable ? h("button", { class: "arrow", "aria-label": "Move down", disabled: i === rank.length - 1, onclick: () => opts.move(i, 1) }, "▼") : h("span"))));
}
// Seeded Final 8 bracket: q = Final 8 matches, s = Final 4 matches, c = final
function finalBracket(d, div, opts = {}) {
  const res = opts.compare;
  const seedOf = (slot) => (d.rank || []).indexOf(slot) + 1;
  const stageActual = { q: res && res.top4.length === 4 ? res.top4 : null, s: res && res.top2.length === 2 ? res.top2 : null, c: res && res.champ != null ? [res.champ] : null };
  const picked = (st, i) => (st === "c" ? d.c : d[st][i]);
  const slotEl = (slot, st, i) => {
    if (slot == null) return h("div", { class: "slot tbd" }, h("span", { class: "lb" }, ""), h("span", { class: "nm" }, "TBD"));
    let cls = "slot";
    if (picked(st, i) === slot) { const act = stageActual[st]; cls += !act ? " win" : act.includes(slot) ? " hit" : " miss"; }
    const attrs = { class: cls, title: pname(div, slot) };
    if (opts.editable) { attrs.onclick = () => opts.onPick(st, i, slot); attrs["aria-pressed"] = picked(st, i) === slot ? "true" : "false"; }
    return h(opts.editable ? "button" : "div", attrs, h("span", { class: "lb" }, seedOf(slot) || ""), h("span", { class: "nm" }, pname(div, slot)));
  };
  const match = (st, i) => { const [a, b] = BC.finalComp(d, st, i); return h("div", { class: "match" }, slotEl(a, st, i), slotEl(b, st, i)); };
  const col = (label, st, n) => h("div", { class: "gcol" }, h("div", { class: "eyebrow" }, label), Array.from({ length: n }, (_, i) => match(st, i)));
  return h("div", { class: "fgrid" },
    col("Final 8", "q", 4), col("Final 4", "s", 2),
    h("div", { class: "gcol" }, h("div", { class: "eyebrow" }, "Final"), match("c", 0),
      h("div", { class: "eyebrow", style: "margin-top:8px" }, "Champion"),
      h("div", { class: "champ" + (stageActual.c && d.c != null ? (stageActual.c[0] === d.c ? " ok" : " no") : "") }, d.c != null ? pname(div, d.c) : "—")));
}
function finalPanel(d, div, opts) {
  return h("section", { class: "panel" }, h("h2", {}, opts.title || "Final 8 bracket"),
    opts.editable && h("p", { class: "muted", style: "margin:0 0 12px" }, "Seed your 8 group winners with the arrows. Seeds are paired 1 vs 8, 4 vs 5, 2 vs 7 and 3 vs 6. Then pick the winners."),
    h("div", { class: "fstage" }, h("div", {}, h("div", { class: "eyebrow", style: "margin-bottom:8px" }, "Your Top 8"), seedList(d.rank || [], div, opts)), finalBracket(d, div, opts)));
}

/* ---------- Make picks ---------- */
function myToken() { return S.tokens[S.form.pid.trim()] || null; }
function myEntry() { return myToken() ? { pid: S.form.pid.trim() } : null; }
function savePicksLocal() { LS.set("bcc-draft", S.draft); LS.set("bcc-form", S.form); }

const bullets = (items) => h("ul", {}, items.map((t) => h("li", {}, t)));
function renderPicks(main) {
  const lockedNow = locked() && !S.isAdmin;
  main.append(h("section", { class: "panel" }, h("div", { class: "rules" },
    h("div", {}, h("h3", {}, "How it works"), bullets(["Pick one division.", "Choose the winner of every match in all 8 groups.", "Seed your 8 group winners and pick the Final 8 bracket.", "One bracket per player. You can change it until picks lock."])),
    h("div", {}, h("h3", {}, "Points per correct pick"), h("div", { class: "ptsrow" },
      [["1", "Round 1"], ["2", "Round 2"], ["4", "Group final"], ["8", "Final 4"], ["16", "Final 2"], ["32", "Champion"]].map(([p, l]) => h("div", { class: "pts" }, h("b", {}, p), h("span", {}, l)))),
      h("p", { style: "margin-top:6px" }, "Max 192 points.")),
    h("div", {}, h("h3", {}, "Rank your Top 8"), bullets(["The in-game Final 8 draw is random, so you seed your own.", "Matchups: 1 vs 8, 4 vs 5, 2 vs 7, 3 vs 6.", "Pick each winner through to your champion.", "You score when your picks really reach the Final 4, the final and the title, whoever they actually played."])),
    h("div", {}, h("h3", {}, "Prizes"), bullets(["$10 voucher to the top score in each division.", "+$100 voucher for a perfect bracket.", "Free to play.", "Ties go to Final 8 points, then the earliest bracket."])))));

  if (locked()) main.append(h("div", { class: "note " + (S.isAdmin ? "warn" : "err") }, S.isAdmin ? "Picks are locked for players. As admin you can still submit test brackets." : "Picks are locked. Check the Leaderboard to follow the results."));

  const f = S.form;
  const existing = myEntry();
  const inp = (id, key, label, attrs = {}) => h("label", { class: "f", for: id }, label, h("input", Object.assign({ id, value: f[key], disabled: lockedNow, oninput: (e) => { f[key] = e.target.value; savePicksLocal(); updateBar(); if (key === "pid") renderExisting(); } }, attrs)));
  const exBox = h("div", { id: "existingBox" });
  main.append(h("section", { class: "panel" }, h("h2", {}, "Your details"),
    h("div", { class: "fields" },
      inp("f-pid", "pid", "Player ID", { inputmode: "numeric", placeholder: "e.g. 54099337", autocomplete: "off" }),
      inp("f-name", "name", "Player name", { placeholder: "In-game name", autocomplete: "off" }),
      inp("f-discord", "discord", "Discord name", { placeholder: "So we can pay out", autocomplete: "off" })),
    h("div", { style: "margin-top:14px" }, h("div", { class: "eyebrow", style: "margin-bottom:8px" }, "Division"),
      h("div", { class: "chips" }, BC.DIVS.map((d) => divChip(d, f.div === d, () => switchDiv(d), players(d).length ? null : "not posted", lockedNow)))),
    exBox));
  function renderExisting() {
    exBox.replaceChildren();
    if (!myEntry()) return;
    exBox.append(h("div", { class: "note warn", style: "margin-top:12px" },
      `You already submitted a bracket for Player ID ${f.pid.trim()} from this browser. Submitting again replaces it. `,
      h("button", { class: "btn sm", onclick: loadMine }, "Load my saved picks")));
  }
  renderExisting();

  const div = f.div;
  if (!players(div).length) { main.append(h("div", { class: "panel empty" }, `The ${div} players aren't posted yet. They go up once the championship bracket is announced in game.`)); $("#submitBar").hidden = true; return; }

  const onPick = (round, i, slot) => { S.draft = BC.setWinner(S.draft, round, i, slot); savePicksLocal(); rerenderBracket(); };
  const bracketHost = h("div", { id: "bracketHost", style: "display:grid;gap:20px" });
  main.append(bracketHost);
  function rerenderBracket() {
    bracketHost.replaceChildren(
      h("section", {}, h("div", { class: "row", style: "justify-content:space-between;margin-bottom:10px" }, h("h2", { style: "font-size:22px" }, `${div} · group stage`),
        h("button", { class: "btn sm", disabled: lockedNow, onclick: () => { S.draft = BC.blankDraft(); savePicksLocal(); rerenderBracket(); } }, "Clear picks")),
        groupGrid(S.draft, { div, editable: !lockedNow, onPick })),
      finalPanel(S.draft, div, { title: "Rank your Top 8", editable: !lockedNow,
        move: (i, d) => { S.draft = BC.moveSeed(S.draft, i, d); savePicksLocal(); rerenderBracket(); },
        onPick: (st, i, slot) => { S.draft = BC.setFinal(S.draft, st, i, slot); savePicksLocal(); rerenderBracket(); } }));
    updateBar();
  }
  rerenderBracket();
}
async function loadMine() {
  try {
    const { entry } = await api("mine", { pid: S.form.pid.trim(), token: myToken() });
    S.draft = BC.toDraft(entry); S.form.div = entry.div; S.form.name = entry.name; S.form.discord = entry.discord;
    savePicksLocal(); render(); toast("Loaded your saved bracket");
  } catch (e) { toast(e.message); }
}
function switchDiv(d) {
  if (S.form.div === d) return;
  S.form.div = d; S.draft = BC.blankDraft(); savePicksLocal(); render();
}
function updateBar() {
  const bar = $("#submitBar");
  if (S.tab !== "picks" || !players(S.form.div).length) { bar.hidden = true; return; }
  const n = BC.pickCount(S.draft);
  const done = BC.isComplete(S.draft);
  const lockedNow = locked() && !S.isAdmin;
  bar.hidden = false;
  bar.replaceChildren(h("div", { class: "wrap" },
    h("div", { class: "prog" }, h("div", { class: "bar" }, h("i", { style: `width:${(n / 63) * 100}%` })), h("span", { class: "num" }, `${n}/63`), h("span", { class: "muted" }, done ? "Ready to submit" : "picks made")),
    h("button", { class: "btn primary", disabled: lockedNow || S.busy || !S.ready, onclick: submit }, myEntry() ? "Update bracket" : "Submit bracket")));
}
async function submit() {
  const f = S.form, errs = BC.validEntryFields(f);
  if (!BC.isComplete(S.draft)) errs.push(`Finish all 63 picks first (${BC.pickCount(S.draft)} done).`);
  if (locked() && !S.isAdmin) errs.push("Picks are locked.");
  const ex = myEntry();
  if (errs.length) { toast(errs[0]); return; }
  S.busy = true; updateBar();
  const doc = { pid: f.pid.trim(), name: f.name.trim(), discord: f.discord.trim(), div: f.div, ...BC.toEntry(S.draft), token: myToken() };
  try {
    const res = await api("entry", doc);
    if (res.token) { S.tokens[doc.pid] = res.token; LS.set("bcc-tokens", S.tokens); }
    toast(res.updated ? "Bracket updated" : "Bracket submitted. Good luck!");
    await refresh();
  } catch (e) { toast(e.message); }
  S.busy = false; updateBar();
}

/* ---------- Live bracket ---------- */
const DIV_STYLE = {"Trial": {"c": "#3C92E1", "i": "/bracket/div-trial.png"}, "Elite": {"c": "#CE38D6", "i": "/bracket/div-elite.png"}, "Master": {"c": "#DBA148", "i": "/bracket/div-master.png"}, "Legendary": {"c": "#E92C7E", "i": "/bracket/div-legendary.png"}, "Ultimate": {"c": "#E34C3F", "i": "/bracket/div-ultimate.png"}, "Apex": {"c": "#E8CF4A", "i": "/bracket/div-apex.png"}};
function divChip(d, on, click, note, disabled) {
  const st = DIV_STYLE[d];
  return h("button", { class: "chip dv", style: `--dc:${st.c}`, "aria-pressed": on ? "true" : "false", disabled, onclick: click },
    h("img", { src: st.i, alt: "", width: 28, height: 28 }), d, note != null ? h("span", { class: "n" }, note) : null);
}
function divChips(key) {
  return h("div", { class: "chips" }, BC.DIVS.map((d) => divChip(d, S.div[key] === d, () => { S.div[key] = d; S.selEntry = null; render(); }, key === "standings" ? entriesIn(d).length : null)));
}
function finalsView(res, div) {
  const gw = res[3].filter((x) => x != null);
  const names = (arr) => arr.length ? h("div", { class: "names" }, arr.map((s) => h("span", { class: "name" }, pname(div, s)))) : h("span", { class: "muted" }, "To be decided");
  return h("div", { class: "tiers" },
    h("div", { class: "tier" }, h("h3", {}, "Final 8 · random draw"), names(gw)),
    h("div", { class: "tier" }, h("h3", {}, "Final 4"), names(res.top4)),
    h("div", { class: "tier" }, h("h3", {}, "Final 2"), names(res.top2)),
    h("div", { class: "tier" }, h("h3", {}, "Champion"), res.champ != null ? h("div", { class: "champ" }, pname(div, res.champ)) : h("span", { class: "muted" }, "To be decided")));
}
function renderBracket(main) {
  const div = S.div.bracket, res = resultsFor(div);
  main.append(h("div", { class: "row", style: "justify-content:space-between" }, divChips("bracket"), h("span", { class: "muted" }, roundsDone(res))));
  if (!players(div).length) { main.append(h("div", { class: "panel empty" }, `The ${div} bracket isn't posted yet.`)); return; }
  main.append(h("section", { class: "panel" }, h("h2", {}, "Final stage"), finalsView(res, div)));
  main.append(groupGrid(res, { div, editable: false, elim: BC.eliminated(res) }));
}

/* ---------- Leaderboard ---------- */
const ekey = (e) => (e.pid || e.id) + "|" + e.name + "|" + e.at;
function renderStandings(main) {
  const div = S.div.standings, res = resultsFor(div), rows = BC.standings(entriesIn(div), res);
  const reveal = (locked() || S.isAdmin) && S.entries.every((e) => e.p);
  main.append(h("div", { class: "row", style: "justify-content:space-between" }, divChips("standings"), h("span", { class: "muted" }, `${rows.length} bracket${rows.length === 1 ? "" : "s"} · ${roundsDone(res)}`)));
  if (!rows.length) { main.append(h("div", { class: "panel empty" }, `No ${div} brackets yet. Head to Make picks to enter the first one.`)); return; }
  const perfectAlive = rows.filter((r) => r.s.max === BC.MAX).length;
  const t = h("table", {}, h("thead", {}, h("tr", {}, ["#", "Player", "R1", "R2", "Group final", "Final 8", "Points", "Max"].map((x, i) => h("th", { class: i >= 2 ? "r" : "" }, x)))),
    h("tbody", {}, rows.map((r) => h("tr", { class: (reveal ? "click" : "") + (S.selEntry === ekey(r.e) ? " sel" : ""), onclick: reveal ? () => { S.selEntry = S.selEntry === ekey(r.e) ? null : ekey(r.e); render(); } : null },
      h("td", { class: "place" }, r.place),
      h("td", {}, h("div", { style: "font-weight:600" }, r.e.name), h("div", { class: "muted num", style: "font-size:12px" }, (r.e.pid || r.e.id) + (r.e.test ? " · test" : ""))),
      [r.s.r1, r.s.r2, r.s.r3, r.s.finals].map((v) => h("td", { class: "r num" }, v)),
      h("td", { class: "r num total" }, r.s.total), h("td", { class: "r num muted" }, r.s.max)))));
  main.append(h("section", { class: "panel" },
    h("div", { class: "row", style: "justify-content:space-between;margin-bottom:8px" }, h("h2", { style: "margin:0" }, `${div} standings`),
      h("span", { class: "muted" }, perfectAlive ? `${perfectAlive} perfect bracket${perfectAlive === 1 ? "" : "s"} still alive` : "No perfect brackets left")),
    !reveal && h("div", { class: "note", style: "margin-bottom:10px" }, "Everyone's picks are hidden until picks lock."),
    h("div", { class: "tablewrap" }, t)));
  const sel = reveal && rows.find((r) => ekey(r.e) === S.selEntry);
  if (sel) {
    const e = sel.e, d = BC.toDraft(e);
    main.append(h("section", { style: "display:grid;gap:14px" },
      h("div", { class: "row", style: "justify-content:space-between" }, h("h2", { style: "font-size:22px" }, `${e.name}'s bracket`), h("span", { class: "muted" }, `Submitted ${new Date(e.at).toLocaleString()} · green = correct, red = wrong`)),
      finalPanel(d, div, { title: "Top 8 and Final 8 bracket", compare: res }),
      groupGrid(d, { div, editable: false, compare: res })));
  }
}

/* ---------- Admin ---------- */
function renderAdmin(main) {
  if (!S.isAdmin) {
    const pw = h("input", { id: "a-key", type: "password", autocomplete: "current-password", placeholder: "Admin password" });
    const go = async () => {
      S.adminKey = pw.value.trim();
      try { await api("admin/check"); LS.set("bcc-admin", S.adminKey); toast("Signed in"); await refresh(); }
      catch (e) { S.adminKey = ""; toast(e.status === 401 ? "That password isn't right." : e.message); }
    };
    pw.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
    main.append(h("section", { class: "panel", style: "max-width:420px" }, h("h2", {}, "Admin sign in"),
      h("div", { class: "row" }, h("label", { class: "f", for: "a-key", style: "flex:1" }, "Password", pw), h("button", { class: "btn primary", style: "align-self:flex-end", onclick: go }, "Sign in"))));
    return;
  }
  const cfg = S.config || {};
  // Event + deadline
  const dl = deadline() || BC.nextReset();
  const iso = dl.toISOString().slice(0, 16);
  main.append(h("div", { class: "row", style: "justify-content:flex-end" }, h("button", { class: "btn sm", onclick: () => { S.adminKey = ""; LS.set("bcc-admin", ""); refresh(); } }, "Sign out of admin")));
  main.append(h("section", { class: "panel" }, h("h2", {}, "Event"),
    h("div", { class: "fields" },
      h("label", { class: "f", for: "a-event" }, "Event name", h("input", { id: "a-event", value: cfg.event || "", placeholder: "e.g. Championship · Round 1 – 26 Oct 2026" })),
      h("label", { class: "f", for: "a-dl" }, "Picks lock (GMT)", h("input", { id: "a-dl", type: "datetime-local", value: iso }))),
    h("div", { class: "row", style: "margin-top:12px" },
      h("button", { class: "btn", onclick: () => { $("#a-dl").value = BC.nextReset().toISOString().slice(0, 16); } }, "Next Monday 02:00 GMT"),
      h("button", { class: "btn primary", onclick: async () => {
        const v = $("#a-dl").value; const d = v ? new Date(v + ":00Z") : null;
        await writeConfig({ event: $("#a-event").value.trim(), deadline: d ? d.toISOString() : null }); toast("Event saved");
      } }, "Save event"))));

  // Players
  const adiv = S.div.admin;
  const list = players(adiv);
  const ta = h("textarea", { id: "a-players", rows: 12, style: "font-family:var(--mono);font-size:13px;margin-top:10px", placeholder: "One player per line, in bracket order:\n1a top\n1a bottom\n1b top\n…\n8d bottom" });
  ta.value = list.join("\n");
  const cnt = h("span", { class: "num muted" });
  const updCnt = () => { const n = BC.parsePlayers(ta.value).length; cnt.textContent = `${n}/64 players`; cnt.style.color = n === 64 ? "var(--hit)" : "var(--miss)"; };
  ta.addEventListener("input", updCnt); updCnt();
  main.append(h("section", { class: "panel" }, h("h2", {}, "Players"),
    h("p", { class: "muted", style: "margin:0 0 10px" }, "Paste the 64 names for a division in bracket order, top to bottom: 1a, 1a, 1b, 1b … 8d, 8d. Leading labels like \"1a\" are stripped. Picks are stored by slot, so fixing a name later keeps everyone's picks."),
    h("div", { class: "row", style: "justify-content:space-between" }, divChips("admin"), cnt), ta,
    h("div", { class: "row", style: "margin-top:10px" },
      h("button", { class: "btn primary", onclick: async () => {
        const arr = BC.parsePlayers(ta.value);
        if (arr.length !== 64) { toast(`Need exactly 64 names; you have ${arr.length}.`); return; }
        await writeConfig({ players: { ...(cfg.players || {}), [adiv]: arr } }); toast(`${adiv} players saved`);
      } }, `Save ${adiv} players`),
      h("button", { class: "btn", onclick: () => { ta.value = Array.from({ length: 64 }, (_, i) => `${adiv} ${BC.slotLabel(i)}${i % 2 ? "-B" : "-A"}`).join("\n"); updCnt(); } }, "Fill sample names"))));

  // Results
  if (!S.adminRes || S.adminRes.div !== adiv) { S.adminRes = { div: adiv, res: resultsFor(adiv) }; S.adminDirty = false; }
  const R = S.adminRes.res;
  const onPick = (round, i, slot) => { S.adminRes.res = BC.setWinner(R, round, i, slot); S.adminDirty = true; render(); };
  const toggle = (key, s, max) => {
    const arr = [...R[key]]; const at = arr.indexOf(s);
    if (at >= 0) arr.splice(at, 1); else if (arr.length < max) arr.push(s); else { toast(`Only ${max} can be picked here.`); return; }
    const next = { ...R, [key]: arr }; BC.syncFinals(next); S.adminRes.res = next; S.adminDirty = true; render();
  };
  const pickNames = (pool, key, max) => pool.length ? h("div", { class: "names" }, pool.map((s) => h("button", { class: "name", "aria-pressed": R[key].includes(s) ? "true" : "false", onclick: () => toggle(key, s, max) }, pname(adiv, s)))) : h("span", { class: "muted" }, "Set the round before first");
  main.append(h("section", { style: "display:grid;gap:14px" },
    h("div", { class: "row", style: "justify-content:space-between" }, h("h2", { style: "font-size:22px" }, `${adiv} results`),
      h("div", { class: "row" }, S.adminDirty && h("span", { style: "color:var(--gold);font-weight:600" }, "Unsaved changes"),
        h("button", { class: "btn", disabled: !S.adminDirty, onclick: () => { S.adminRes = null; render(); } }, "Discard"),
        h("button", { class: "btn primary", disabled: !S.adminDirty, onclick: saveResults }, "Save results"))),
    !list.length ? h("div", { class: "panel empty" }, "Save this division's players first.") : [
      h("p", { class: "muted", style: "margin:0" }, "Click the winner of each match as rounds finish in game. Click again to undo. Leaderboards update when you save."),
      groupGrid(R, { div: adiv, editable: true, onPick }),
      h("div", { class: "panel" }, h("h2", {}, "Final stage"), h("div", { class: "tiers" },
        h("div", { class: "tier" }, h("h3", {}, "Final 4 (pick 4)"), pickNames(R[3].filter((x) => x != null).length === 8 ? R[3] : [], "top4", 4)),
        h("div", { class: "tier" }, h("h3", {}, "Final 2 (pick 2)"), pickNames(R.top4.length === 4 ? R.top4 : [], "top2", 2)),
        h("div", { class: "tier" }, h("h3", {}, "Champion"), R.top2.length === 2 ? h("div", { class: "names" }, R.top2.map((s) => h("button", { class: "name", "aria-pressed": R.champ === s ? "true" : "false", onclick: () => { S.adminRes.res = { ...R, champ: R.champ === s ? null : s }; S.adminDirty = true; render(); } }, pname(adiv, s)))) : h("span", { class: "muted" }, "Set the Final 2 first"))))]));

  // Submissions
  const all = [...S.entries].sort((a, b) => String(b.at).localeCompare(String(a.at)));
  main.append(h("section", { class: "panel" },
    h("div", { class: "row", style: "justify-content:space-between;margin-bottom:8px" }, h("h2", { style: "margin:0" }, `All brackets (${all.length})`),
      h("button", { class: "btn sm", onclick: () => copyCSV() }, "Copy standings as CSV")),
    all.length ? h("div", { class: "tablewrap" }, h("table", {}, h("thead", {}, h("tr", {}, ["Player", "ID", "Discord", "Division", "Submitted", ""].map((x) => h("th", {}, x)))),
      h("tbody", {}, all.map((e) => h("tr", {}, h("td", {}, e.name, e.test ? h("span", { class: "muted" }, " · test") : null), h("td", { class: "num" }, e.pid), h("td", {}, e.discord), h("td", {}, e.div), h("td", { class: "muted" }, new Date(e.at).toLocaleString()),
        h("td", { class: "r" }, S.confirmDel === e.pid
          ? h("span", { class: "confirm" }, h("button", { class: "btn sm danger", onclick: async () => { try { await api("admin/delete", { pids: [e.pid] }); S.confirmDel = null; toast("Bracket deleted"); await refresh(); } catch (err) { toast(err.message); } } }, "Delete"), h("button", { class: "btn sm", onclick: () => { S.confirmDel = null; render(); } }, "Keep"))
          : h("button", { class: "btn sm", onclick: () => { S.confirmDel = e.pid; render(); } }, "Remove")))))))
      : h("div", { class: "empty" }, "No brackets submitted yet.")));

  // Test tools
  const upto = h("select", { id: "a-upto", style: "border:1px solid var(--line);background:#141a33;border-radius:8px;padding:8px" },
    [["1", "Round 1"], ["2", "Round 2"], ["3", "Group final"], ["4", "Final 4"], ["5", "Final 2"], ["6", "Champion"]].map(([v, l]) => h("option", { value: v, selected: v === "6" }, l)));
  main.append(h("section", { class: "panel" }, h("h2", {}, "Test tools"),
    h("p", { class: "muted", style: "margin:0 0 12px" }, `These act on ${adiv}. Test brackets are marked “test” and use IDs starting with 9000.`),
    h("div", { class: "row" },
      h("button", { class: "btn", disabled: !list.length || S.busy, onclick: () => addTestEntries(adiv, 10) }, "Add 10 random brackets"),
      h("span", { class: "muted" }, "Random results through"), upto,
      h("button", { class: "btn", disabled: !list.length, onclick: () => { S.adminRes = { div: adiv, res: BC.randomResults(+$("#a-upto").value) }; S.adminDirty = true; render(); toast("Random results filled. Save to apply."); } }, "Fill"),
      h("button", { class: "btn", onclick: () => { S.adminRes = { div: adiv, res: BC.blankResults() }; S.adminDirty = true; render(); } }, "Clear results"),
      h("button", { class: "btn danger", disabled: S.busy, onclick: () => deleteTestEntries() }, "Delete all test brackets"))));
}
async function writeConfig(patch) {
  const next = { event: "", deadline: null, players: {}, ...(S.config || {}), ...patch };
  try { await api("admin/config", patch); await refresh(); } catch (e) { toast(e.message); throw e; }
}
async function saveResults() {
  const all = {}; BC.DIVS.forEach((d) => { if (S.results[d]) all[d] = S.results[d]; });
  all[S.adminRes.div] = S.adminRes.res;
  try { await api("admin/results", all); S.adminDirty = false; toast("Results saved. Leaderboard updated."); await refresh(); }
  catch (e) { toast(e.message); }
}
async function addTestEntries(div, n) {
  S.busy = true; render();
  const base = 900000000 + Math.floor(Math.random() * 90000) * 10;
  for (let i = 0; i < n; i++) {
    const e = BC.randomPicks();
    const doc = { pid: String(base + i), name: `Tester ${String(base + i).slice(-4)}`, discord: "test", div, ...e, at: new Date(Date.now() - i * 60000).toISOString(), test: true };
    try { await api("entry", doc); } catch (err) { toast("Stopped: " + err.message); break; }
  }
  S.busy = false; await refresh(); toast(`Added ${n} test brackets to ${div}`);
}
async function deleteTestEntries() {
  S.busy = true; render();
  try { const r = await api("admin/delete-tests", {}); toast(`Deleted ${r.deleted} test brackets`); } catch (e) { toast(e.message); }
  S.busy = false; await refresh();
}
function copyCSV() {
  const lines = [["Division", "Place", "Player", "Player ID", "Discord", "R1", "R2", "Group final", "Final 8", "Points", "Max", "Submitted"].join(",")];
  BC.DIVS.forEach((d) => BC.standings(entriesIn(d), resultsFor(d)).forEach((r) => lines.push([d, r.place, r.e.name, r.e.pid, r.e.discord, r.s.r1, r.s.r2, r.s.r3, r.s.finals, r.s.total, r.s.max, r.e.at].map((x) => `"${String(x).replace(/"/g, '""')}"`).join(","))));
  const text = lines.join("\n");
  navigator.clipboard.writeText(text).then(() => toast("Standings copied. Paste into a spreadsheet."), () => {
    const ta = h("textarea", { rows: 6, style: "width:100%;font-family:var(--mono);font-size:12px" }); ta.value = text;
    $("#main").append(h("section", { class: "panel" }, h("h2", {}, "Copy this CSV"), ta)); ta.select();
  });
}

/* ---------- render ---------- */
function render() {
  document.querySelectorAll("#tabs button").forEach((b) => b.setAttribute("aria-selected", b.dataset.tab === S.tab ? "true" : "false"));
  $("#adminTab").hidden = !S.isAdmin && S.tab !== "admin";
  document.body.dataset.div = S.tab === "picks" ? S.form.div : S.div[S.tab] || "Apex";
  renderHeader();
  const main = $("#main"); const y = window.scrollY;
  const keep = {}; main.querySelectorAll("[data-dirty][id]").forEach((el) => (keep[el.id] = el.value));
  const ae = document.activeElement, aeId = ae && ae.id, sel = ae && "selectionStart" in ae ? [ae.selectionStart, ae.selectionEnd] : null;
  main.replaceChildren();
  if (S.offline) main.append(h("div", { class: "note warn" }, "Couldn't reach the bracket server. Check your connection and refresh the page."));
  if (!S.ready && !S.offline) main.append(h("div", { class: "panel empty" }, "Loading the championship…"));
  ({ picks: renderPicks, bracket: renderBracket, standings: renderStandings, admin: renderAdmin })[S.tab](main);
  if (S.tab !== "picks") $("#submitBar").hidden = true; else updateBar();
  for (const [id, v] of Object.entries(keep)) { const el = document.getElementById(id); if (el) { el.value = v; el.dataset.dirty = "1"; el.dispatchEvent(new Event("input")); } }
  if (aeId) { const el = document.getElementById(aeId); if (el && el !== document.activeElement) { el.focus({ preventScroll: true }); try { if (sel) el.setSelectionRange(sel[0], sel[1]); } catch {} } }
  window.scrollTo(0, y);
}
document.addEventListener("input", (e) => { if (e.isTrusted && e.target.closest && e.target.closest("#main") && e.target.id && e.target.id.startsWith("a-")) e.target.dataset.dirty = "1"; });
document.getElementById("adminLink").addEventListener("click", (e) => { e.preventDefault(); S.tab = "admin"; try { history.replaceState(null, "", "#admin"); } catch {} window.scrollTo(0, 0); render(); });
document.querySelectorAll("#tabs button").forEach((b) => b.addEventListener("click", () => { S.tab = b.dataset.tab; try { history.replaceState(null, "", "#" + S.tab); } catch {} window.scrollTo(0, 0); render(); }));

/* ---------- boot ---------- */
async function boot() {
  render();
  await refresh();
  setInterval(() => { if (document.visibilityState === "visible" && !S.busy) refresh(); }, 30000);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") refresh(); });
}
boot();
})();
