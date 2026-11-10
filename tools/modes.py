#!/usr/bin/env python3
"""Generates the Game Modes sub-pages (hub pages and single-mode pages) into src/game-modes/.

Edit the MODES / HUBS data below, then run:  python3 tools/modes.py
The look (cards, chips, header) is shared with src/game-modes/index.html: its <style> block is reused.
"""
import html, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "src")
e = html.escape

OVERVIEW = open(os.path.join(SRC, "game-modes", "index.html"), encoding="utf8").read()
STYLE = re.search(r"<style>(.*?)</style>", OVERVIEW, re.S).group(1)
FOOT = re.search(r'<footer class="sitefoot">.*?</footer>', OVERVIEW, re.S).group(0)
NAV = re.search(r'<nav class="ptabs".*?</nav>', OVERVIEW, re.S).group(0)

EXTRA_CSS = """
.crumbs{text-align:center;font-size:13px;margin:0 0 6px;color:#ddd;text-shadow:0 1px 3px rgba(0,0,0,.8)}
.crumbs a{color:#e9c765;text-decoration:none;font-weight:700}
.crumbs span{opacity:.6;margin:0 6px}
a.gmcard{color:inherit;text-decoration:none;transition:transform .15s ease,box-shadow .15s ease}
a.gmcard:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(0,0,0,.35)}
.gmgo{margin-top:auto;align-self:flex-start;font-size:12px;font-weight:800;letter-spacing:.04em;color:#7a5200;background:#f7ebc4;border:1px solid #e3c873;border-radius:8px;padding:4px 10px}
.mhero{display:flex;gap:18px;align-items:center;margin:0 auto 18px;max-width:860px;padding:16px;background:color-mix(in srgb,var(--card) 92%,transparent);border:1px solid var(--line);border-radius:16px}
.mhero .gmimg{flex-basis:140px;width:140px;height:140px}
.mhero h1{margin:0 0 6px;font-size:clamp(22px,4vw,30px)}
.mhero p{margin:0;color:var(--mute);font-size:15px;line-height:1.5}
.mbox{max-width:860px;margin:0 auto 16px;padding:16px 18px;background:color-mix(in srgb,var(--card) 92%,transparent);border:1px solid var(--line);border-radius:16px}
.mbox h2{margin:0 0 10px;font-size:18px}
.mbox ul{margin:0;padding-left:20px;line-height:1.55;font-size:14.5px}
.mbox li{margin:0 0 6px}
.mvids{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
.mvid{display:block;color:inherit;text-decoration:none}
.mvid img{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:10px;display:block;background:#222}
.mvid b{display:block;font-size:13.5px;line-height:1.35;margin-top:6px}
.mvid span{font-size:12px;color:var(--mute)}
.msoon{max-width:860px;margin:0 auto 24px;text-align:center;color:#ddd;font-size:13px;text-shadow:0 1px 3px rgba(0,0,0,.8)}
@media (max-width:520px){.mhero{flex-direction:column;text-align:center}.mhero .gmimg{width:120px;height:120px;flex-basis:auto}}
"""

HUBS = {
    "abyssal-prison": {
        "name": "Abyssal Prison",
        "img": "abyssal-prison",
        "intro": "Abyssal Prison holds four boss challenges. Most are fought alongside your guild, and all of them reward big damage numbers.",
        "children": ["wuthering-coast", "guild-boss", "seven-sages-of-liuli", "demon-conquest"],
    },
}

MODES = {
    "wuthering-coast": {
        "hub": "abyssal-prison",
        "name": "Wuthering Coast",
        "short": "A boss event where your damage counts toward personal and guild totals, with rankings across your Warzone.",
        "rewards": ["Dragon Scale Shards", "Damage rewards", "Ranking rewards"],
        "facts": [
            "Every challenge adds to your <b>Individual DMG</b> and to your guild's <b>Guild Total DMG</b>; both have reward goals.",
            "Rankings: <b>Guild Ranking</b>, <b>Individual Ranking</b> (across your Warzone) and <b>Individual Contribution</b>.",
            "There are also <b>Single Lineup's Min DMG</b> ranking and goal rewards.",
            "It is the source of <b>Superior</b> and <b>Supreme Dragon Scale Shards</b>: 100 shards craft 1 Dragon Scale.",
        ],
        "videos": ["wuthering coast"],
    },
    "guild-boss": {
        "hub": "abyssal-prison",
        "name": "Guild Boss",
        "short": "Guild members take turns on the Guild Boss. Your damage earns Conquer Points and daily rewards.",
        "rewards": ["Conquer Points", "Daily rewards", "Guild Activeness"],
        "facts": [
            "Open once you join a guild. Each challenge costs <b>1 Guild Boss Stamina</b>, refilled to max at 02:00 (UTC+0) daily.",
            "Rewards and <b>Conquer Points</b> scale with the damage you deal. Reach the Conquer Point goal to unlock a higher-level Guild Boss.",
            "Daily challenge rewards arrive in your Reward Box at 02:00 (UTC+0) the next day.",
            "<b>Battle Test</b> lets you try lineups without spending stamina (no rewards, no ranking).",
            "<b>Raid</b> (quick clear) unlocks for a difficulty once a single challenge hits the damage cap.",
        ],
        "videos": ["guild boss"],
    },
    "seven-sages-of-liuli": {
        "hub": "abyssal-prison",
        "name": "Seven Sages of Liuli",
        "short": "A boss damage challenge with rising difficulty levels, and a key source of Breakthrough materials.",
        "rewards": ["Soul Fire", "Soul Lanterns"],
        "facts": [
            "Bosses have difficulty levels; the map shows your best damage at your highest difficulty.",
            "One of the two sources (with Planar Rifts) of <b>Soul Lanterns</b> and <b>Soul Fire</b>.",
            "Soul Lanterns break an Awaken-5, Lv.150 hero through its level cap; Soul Fire then levels the hero further.",
        ],
        "videos": ["liuli", "seven sages", "7 sages"],
    },
    "demon-conquest": {
        "hub": "abyssal-prison",
        "name": "Demon Conquest",
        "short": "Guild members hunt bosses across unlocking hunting areas. Conquered bosses go to Demon Prison for solo challenges.",
        "rewards": ["Conquest rewards"],
        "facts": [
            "Runs in two 7-day phases: a <b>Conquest Phase</b> and a <b>Truce Phase</b>. You can only take part during the Conquest Phase.",
            "Hunting areas unlock over time, each with several bosses for the guild to conquer.",
            "Each member gets <b>one attempt per hunting area per day</b>; each area takes at most 30 challenges a day.",
            "A conquered boss is sent to <b>Demon Prison</b>, where guild members can challenge it on their own.",
        ],
        "videos": ["demon conquest"],
    },
}

HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="https://imrdatabase.com{path}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Infinite Magicraid Database">
<meta property="og:title" content="{ogt}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="https://imrdatabase.com{path}">
<meta property="og:image" content="https://imrdatabase.com/img/modes/{img}.webp">
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="stylesheet" href="/assets/style.css">
<style>{style}</style>
</head>
<body class="lbg">
<div id="pgbg"></div>
<main>
<div class="ctop">
<img class="avt" src="/img/avatar.png" alt="Dubb">
<img class="logo" src="/img/logo.png" alt="Infinite Magicraid">
</div>
<p class="sub" style="text-align:center;text-transform:uppercase;letter-spacing:.16em;font-weight:700;color:#e9c765">Game Modes</p>
{nav}
"""

VIDEO_JS = """<script src="/assets/videos.js"></script>
<script>
(function(){var K=%s,box=document.getElementById("mvids");if(!box||!window.YT_ROWS)return;
var rows=YT_ROWS.split("\\n").map(function(l){var a=l.split("|");return{id:a[0],d:a[1],v:+a[2],t:a.slice(4).join("|")}})
.filter(function(r){var t=r.t.toLowerCase();return K.some(function(k){return t.indexOf(k)>=0})}).sort(function(a,b){return a.d<b.d?1:-1}).slice(0,8);
if(!rows.length)return;box.closest(".mbox").hidden=false;
rows.forEach(function(r){var a=document.createElement("a");a.className="mvid";a.href="https://www.youtube.com/watch?v="+r.id;a.target="_blank";a.rel="noopener";
var i=document.createElement("img");i.loading="lazy";i.alt=r.t;i.src="https://i.ytimg.com/vi/"+r.id+"/mqdefault.jpg";var b=document.createElement("b");b.textContent=r.t;
var s=document.createElement("span");s.textContent=r.d+" · "+r.v.toLocaleString()+" views";a.append(i,b,s);box.appendChild(a)})})();
</script>"""


def chips(rew):
    if not rew:
        return ""
    return '<div class="gmrew"><span class="gmlbl">Rewards</span>' + "".join(f'<span class="gmchip">{e(r)}</span>' for r in rew) + "</div>"


def page(path, title, desc, ogt, img, body, extra=""):
    out = HEAD.format(title=e(title), desc=e(desc), path=path, ogt=e(ogt), img=img, style=STYLE + EXTRA_CSS, nav=NAV)
    out += body + "\n" + FOOT + "\n</main>\n" + extra + "\n</body>\n</html>\n"
    d = os.path.join(SRC, path.strip("/"))
    os.makedirs(d, exist_ok=True)
    open(os.path.join(d, "index.html"), "w", encoding="utf8").write(out)
    return path


def build():
    made = []
    for hk, h in HUBS.items():
        cards = []
        for ck in h["children"]:
            m = MODES[ck]
            cards.append(f'<a class="gmcard" href="/game-modes/{hk}/{ck}/"><div class="gmimg"><img src="/img/modes/{ck}.webp" alt="{e(m["name"])}" loading="lazy"></div><div class="gmbody"><h3>{e(m["name"])}</h3><p>{e(m["short"])}</p>{chips(m["rewards"])}<span class="gmgo">Open →</span></div></a>')
        body = f"""<p class="crumbs"><a href="/game-modes/">Game Modes</a><span>›</span>PvE<span>›</span>{e(h["name"])}</p>
<header class="ghead"><h1>{e(h["name"])}</h1><p>{e(h["intro"])}</p></header>
<section class="gsec"><div class="gmgrid">
{chr(10).join(cards)}
</div></section>"""
        made.append(page(f"/game-modes/{hk}/", f"{h['name']} – Infinite Magicraid Game Modes | IMR", h["intro"], f"Infinite Magicraid {h['name']}", h["img"], body))
    for mk, m in MODES.items():
        hub = HUBS[m["hub"]]
        facts = "".join(f"<li>{f}</li>" for f in m["facts"])
        body = f"""<p class="crumbs"><a href="/game-modes/">Game Modes</a><span>›</span><a href="/game-modes/{m["hub"]}/">{e(hub["name"])}</a><span>›</span>{e(m["name"])}</p>
<section class="mhero"><div class="gmimg"><img src="/img/modes/{mk}.webp" alt="{e(m["name"])}"></div><div><h1>{e(m["name"])}</h1><p>{e(m["short"])}</p>{chips(m["rewards"])}</div></section>
<section class="mbox"><h2>How it works</h2><ul>{facts}</ul></section>
<section class="mbox" hidden><h2>Videos from Dubb</h2><div class="mvids" id="mvids"></div></section>
<p class="msoon">Full guide with teams, builds and tips coming soon.</p>"""
        made.append(page(f"/game-modes/{m['hub']}/{mk}/", f"{m['name']} Guide – Infinite Magicraid | IMR", m["short"], f"Infinite Magicraid {m['name']}", mk, body, VIDEO_JS % repr(m["videos"]).replace("'", '"')))
    return made


if __name__ == "__main__":
    for p in build():
        print(p)
