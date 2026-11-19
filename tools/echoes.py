#!/usr/bin/env python3
"""Generate src/echoes/index.html (static Echoes page) from src/assets/eqdata.js + heroeq.js.
Run: python3 tools/echoes.py   (then copy src/echoes to dist, or run the full build)."""
import json, re, os, html

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "src")


def load_obj(path, marker):
    s = open(path, encoding="utf-8").read()
    i = s.index(marker) + len(marker)
    return json.JSONDecoder().raw_decode(s[i:])[0]


EQ = load_obj(os.path.join(SRC, "assets", "eqdata.js"), "window.EQDATA=")["echo"]
HEQ = load_obj(os.path.join(SRC, "assets", "heroeq.js"), "window.HERO_EQ=")

# site faction names (as on the hero pages) and how they appear in echo text
FACTIONS = ["Dragon Tribe", "Sunset Sages", "Doom Legion", "The Forgotten", "Nameless Brotherhood", "Hidden Wave",
            "Sword Harbor Guards", "Foresters", "Holy Light Parliament", "Eternal Sect", "Wizard’s Eye",
            "Sagacity Alliance", "Unruly Outlaws"]
ALIAS = {"Wizard’s Eye": ["Wizard's Eye", "Wizard’s Eye"], "The Forgotten": ["The Forgotten", "Forgotten"]}
RAR = {5: "Legend", 4: "Epic", 3: "Elite"}
slug = lambda s: re.sub(r"^-|-$", "", re.sub(r"[^a-z0-9]+", "-", re.sub(r"[’']", "", s.lower())))
hslug = lambda s: re.sub(r"^-|-$", "", re.sub(r"[^a-z0-9]+", "-", s.lower()))
esc = lambda s: html.escape(str(s), quote=True)


def faction_of(d):
    hits = [f for f in FACTIONS if any(a in d for a in ALIAS.get(f, [f]))]
    return hits


def rich(d):
    out = []
    for line in d.split("\n"):
        t = esc(line)
        t = re.sub(r"\[([^\[\]]{1,40})\]", r'<b class="ek">\1</b>', t)
        for f in FACTIONS:
            for a in ALIAS.get(f, [f]):
                if a == "Forgotten":
                    continue
                t = t.replace(esc(a), f'<b class="ef">{esc(a)}</b>')
        out.append(f"<p>{t}</p>")
    return "".join(out)


# echo -> heroes whose recommended build uses it
users = {}
for h, b in HEQ.items():
    for e in b.get("echo", []) or []:
        users.setdefault(e, []).append(h)


def himg(h):
    s = hslug(h)
    for ext in ("webp", "jpg", "png"):
        if os.path.exists(os.path.join(SRC, "img", f"{s}.{ext}")):
            return f"/img/{s}.{ext}"
    return None


rows = []
for name, v in EQ.items():
    facs = faction_of(v["d"])
    rows.append((name, v, facs))
rows.sort(key=lambda r: (-r[1]["q"], bool(not r[2]), r[0]))

stats = sorted({v["ms"] for _, v, _ in rows})
nfac = sum(1 for r in rows if r[2])

cards = []
for name, v, facs in rows:
    q = v["q"]
    fb = ""
    if facs:
        fb = "".join(
            f'<span class="efac"><img src="/img/f-{slug(f)}.png" alt="" width="18" height="18" loading="lazy">{esc(f)}</span>'
            for f in facs)
    else:
        fb = '<span class="enofac">No faction requirement</span>'
    us = ""
    hs = sorted(users.get(name, []))
    if hs:
        chips = []
        for h in hs:
            im = himg(h)
            chips.append(f'<a class="ehero" href="/heroes/{hslug(h)}/">' + (f'<img src="{im}" alt="" loading="lazy" width="22" height="22">' if im else "") + f"{esc(h)}</a>")
        us = f'<div class="euse"><span>In Dubb’s builds:</span>{"".join(chips)}</div>'
    cards.append(
        f'<article class="ecard q{q}" data-n="{esc(name.lower())}" data-q="{q}" data-ms="{esc(v["ms"])}" data-f="{esc("|".join(facs))}" data-h="{esc("|".join(hs).lower())}">'
        f'<div class="etop"><img class="eic" src="/img/eq/{esc(v["i"])}.webp" alt="{esc(name)}" width="56" height="56" loading="lazy">'
        f'<div class="ehd"><h2>{esc(name)}</h2><div class="emeta"><span class="erar r{q}">{RAR[q]}</span><span class="ems">Main stat: <b>{esc(v["ms"])}</b></span></div>'
        f'<div class="efrow">{fb}</div></div></div>'
        f'<div class="ed">{rich(v["d"])}</div>{us}</article>')

opt = lambda val, lab: f'<option value="{esc(val)}">{esc(lab)}</option>'
ms_opts = opt("", "All main stats") + "".join(opt(m, m) for m in stats)
fac_opts = opt("", "All factions") + "".join(opt(f, f) for f in FACTIONS if any(f in r[2] for r in rows))
rar_opts = opt("", "All rarities") + "".join(opt(k, RAR[k]) for k in (5, 4, 3))

N = len(rows)
TPL = open(os.path.join(ROOT, "tools", "echoes.tpl.html"), encoding="utf-8").read()
out = (TPL.replace("<!--N-->", str(N)).replace("<!--NFAC-->", str(nfac)).replace("<!--MS-->", ms_opts)
       .replace("<!--FAC-->", fac_opts).replace("<!--RAR-->", rar_opts).replace("<!--CARDS-->", "\n".join(cards)))
os.makedirs(os.path.join(SRC, "echoes"), exist_ok=True)
open(os.path.join(SRC, "echoes", "index.html"), "w", encoding="utf-8").write(out)
print(f"wrote src/echoes/index.html: {N} echoes, {nfac} with a faction requirement, {len(users)} used in builds")
