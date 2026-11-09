#!/usr/bin/env python3
"""Championship Bracket Challenge infographic.

Builds the daily standings graphic from reference.png (Dubb's approved design) and the
JSON that fetch_standings.js returns from imrdatabase.com/bracket/.

    python3 make_graphic.py standings.json [--out FILE] [--date YYYY-MM-DD] [--round N]
                            [--boxes 3] [--groups "Apex|Ultimate|Legendary,Master,Elite,Trial"]

Divisions are grouped into --boxes panels (default 3). A division is never split, the
division order is kept, and the split is chosen so the panels are as even as possible by
number of brackets entered: smallest largest-panel first, then smallest spread.
--groups overrides the automatic grouping. Each panel shows its top 5, merged across its
divisions with the site's tiebreak (points, then finals points, then earliest submission).

Needs python3 with Pillow, numpy and opencv (cv2); fonts Liberation Sans Bold and
Noto Sans CJK Bold (for CJK names).
"""
import argparse, datetime, glob, itertools, json, os, sys
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
REF = os.path.join(HERE, "reference.png")

# ---- geometry of reference.png (1038 x 1516) ----
X0, X1 = 508, 1014              # right-hand column crop (inside the outer gold border)
COL_TOP, COL_BOT = 418, 1440     # vertical span of the panels
BARS = {"Apex": (418, 488), "Ultimate": (726, 792), "Legendary": (1028, 1090), "Master": (1090, 1145)}
PAIR = {("Elite", "Trial"): (1145, 1200)}
PAIR_SPLIT = 779                 # x where the two half chips meet
PANELS = [(488, 726), (792, 1028), (1200, 1440)]
NAME_X, SCORE_X = 588, 928
BANNER = dict(box=(245, 352, 795, 392), cx=519, base=385, size=37)
ROWS = 5
COLORS = {  # header fill colour per division; unknown divisions take PALETTE in turn
    "Apex": (250, 236, 10), "Ultimate": (214, 18, 30), "Legendary": (232, 30, 132),
    "Master": (240, 168, 12), "Elite": (118, 12, 205), "Trial": (0, 132, 250),
}
PALETTE = [(30, 170, 80), (0, 170, 170), (240, 110, 20), (90, 90, 220), (180, 40, 60), (120, 160, 20)]
GREEN = (150, 242, 128, 255)

LAT = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
CJK = next(iter(sorted(glob.glob("/usr/share/fonts/**/NotoSansCJK-Bold.ttc", recursive=True))), None)


# ---------------------------------------------------------------- grouping
def group_divisions(divs, counts, k):
    """Contiguous split of divs into k groups, as even as possible by entry count."""
    n = len(divs)
    k = max(1, min(k, n))
    best = None
    for cuts in itertools.combinations(range(1, n), k - 1):
        bounds = (0,) + cuts + (n,)
        groups = [list(range(bounds[i], bounds[i + 1])) for i in range(k)]
        sums = [sum(counts[j] for j in g) for g in groups]
        sizes = [len(g) for g in groups]
        key = (max(sums), sum(s * s for s in sums), max(sizes), sum(s * s for s in sizes))
        if best is None or key < best[0]:
            best = (key, groups)
    return [[divs[j] for j in g] for g in best[1]]


def top_rows(data, group, n=ROWS):
    order = {d["name"]: i for i, d in enumerate(data["divisions"])}
    rows = [r for d in data["divisions"] if d["name"] in group for r in d["rows"]]
    rows.sort(key=lambda r: (-r["total"], -r.get("finals", 0), str(r.get("at", "")), order.get(r.get("div"), 0)))
    return rows


# ---------------------------------------------------------------- image helpers
def font(size, cjk=False):
    if cjk and CJK:
        return ImageFont.truetype(CJK, size, index=0)
    return ImageFont.truetype(LAT, size)


def runs(text, size):
    lat, cj = font(size), font(size, True)
    out = []
    for ch in text:
        f = cj if ord(ch) >= 0x2E80 else lat
        if out and out[-1][1] is f:
            out[-1][0] += ch
        else:
            out.append([ch, f])
    return out


def text_width(text, size):
    return sum(f.getlength(t) for t, f in runs(text, size))


def clean_reference():
    a = np.array(Image.open(REF).convert("RGB"))
    r, g, b = [a[..., i].astype(int) for i in range(3)]
    mask = np.zeros(a.shape[:2], np.uint8)
    # green standings text in every panel
    box = np.zeros_like(mask, bool)
    for y0, y1 in PANELS:
        box[y0 + 6:y1 - 6, 560:960] = True
    mask |= (((g - r > 12) & (g - b > 12) & (g > 70)) & box).astype(np.uint8)
    # banner text
    bx0, by0, bx1, by1 = BANNER["box"]
    bb = np.zeros_like(mask, bool); bb[by0:by1, bx0:bx1] = True
    mask |= (((r > 150) & (g > 150) & (b > 150) & (np.abs(r - b) < 40)) & bb).astype(np.uint8)
    mask = cv2.dilate(mask * 255, np.ones((7, 7), np.uint8))
    out = cv2.inpaint(cv2.cvtColor(a, cv2.COLOR_RGB2BGR), mask, 6, cv2.INPAINT_TELEA)
    out = cv2.cvtColor(out, cv2.COLOR_BGR2RGB)
    # remove any green tint left inside the panels
    for y0, y1 in PANELS:
        reg = out[y0 + 6:y1 - 6, 560:960].astype(int)
        cap = np.maximum(reg[..., 0], reg[..., 2]) + 4
        reg[..., 1] = np.minimum(reg[..., 1], cap)
        out[y0 + 6:y1 - 6, 560:960] = reg.astype(np.uint8)
    return Image.fromarray(out)


def vstretch(img, h, cap=40):
    """Resize vertically keeping top/bottom `cap` rows intact (frame corners)."""
    w, h0 = img.size
    if h == h0:
        return img
    cap = min(cap, h // 3, h0 // 3)
    top, bot = img.crop((0, 0, w, cap)), img.crop((0, h0 - cap, w, h0))
    mid = img.crop((0, cap, w, h0 - cap)).resize((w, h - 2 * cap), Image.LANCZOS)
    out = Image.new(img.mode, (w, h))
    out.paste(top, (0, 0)); out.paste(mid, (0, cap)); out.paste(bot, (0, h - cap))
    return out


def hstretch(img, w, cap=45):
    w0, h = img.size
    if w == w0:
        return img
    cap = min(cap, w // 3)
    left, right = img.crop((0, 0, cap, h)), img.crop((w0 - cap, 0, w0, h))
    mid = img.crop((cap, 0, w0 - cap, h)).resize((w - 2 * cap, h), Image.LANCZOS)
    out = Image.new(img.mode, (w, h))
    out.paste(left, (0, 0)); out.paste(mid, (cap, 0)); out.paste(right, (w - cap, 0))
    return out


class Assets:
    def __init__(self):
        self.ref = Image.open(REF).convert("RGB")
        self.clean = clean_reference()
        self._blank = None

    def band(self, y0, y1, x0=X0, x1=X1, clean=False):
        return (self.clean if clean else self.ref).crop((x0, y0, x1, y1))

    def blank_bar(self):
        """The Ultimate bar with its text removed: base for procedural headers."""
        if self._blank is None:
            y0, y1 = BARS["Ultimate"]
            a = np.array(self.band(y0, y1))
            r, g, b = [a[..., i].astype(int) for i in range(3)]
            m = ((r > 150) & (g > 150) & (b > 150)).astype(np.uint8)
            m[:, :60] = 0; m[:, -60:] = 0; m[:8] = 0; m[-8:] = 0
            m = cv2.dilate(m * 255, np.ones((7, 7), np.uint8))
            self._blank = cv2.inpaint(a, m, 8, cv2.INPAINT_TELEA)
        return self._blank

    def procedural_bar(self, name, w, h, color):
        a = cv2.cvtColor(self.blank_bar(), cv2.COLOR_RGB2HSV).astype(np.float32)
        hh, ss, vv = a[..., 0], a[..., 1], a[..., 2]
        fill = ((hh < 10) | (hh > 165)) & (ss > 90)
        tgt = cv2.cvtColor(np.uint8([[color]]), cv2.COLOR_RGB2HSV)[0, 0].astype(np.float32)
        ref_v = np.median(vv[fill]) if fill.any() else 200
        hh[fill] = tgt[0]
        ss[fill] = np.clip(ss[fill] * (tgt[1] / 235.0), 0, 255)
        vv[fill] = np.clip(vv[fill] * (tgt[2] / max(ref_v, 1)), 0, 255)
        img = Image.fromarray(cv2.cvtColor(a.astype(np.uint8), cv2.COLOR_HSV2RGB))
        img = hstretch(img, w).resize((w, h), Image.LANCZOS)
        # label
        lum = (0.299 * color[0] + 0.587 * color[1] + 0.114 * color[2]) / 255
        size = int(h * 0.62)
        while size > 12 and text_width(name, size) > w - 70:
            size -= 1
        d = ImageDraw.Draw(img)
        f = font(size)
        if lum > 0.62:
            d.text((w / 2, h / 2 + 1), name, font=f, fill=(10, 10, 10), anchor="mm")
        else:
            d.text((w / 2, h / 2 + 1), name, font=f, fill=(250, 250, 252), anchor="mm",
                   stroke_width=2, stroke_fill=(40, 20, 40))
        return img

    def header_row(self, row, colors, h_default=60):
        W = X1 - X0
        if len(row) == 1 and row[0] in BARS:
            return self.band(*BARS[row[0]])
        if tuple(row) in PAIR:
            return self.band(*PAIR[tuple(row)])
        if len(row) == 1:
            return self.procedural_bar(row[0], W, h_default, colors[row[0]])
        img = Image.new("RGB", (W, h_default))
        half = W // 2
        img.paste(self.procedural_bar(row[0], half, h_default, colors[row[0]]), (0, 0))
        img.paste(self.procedural_bar(row[1], W - half, h_default, colors[row[1]]), (half, 0))
        return img

    def panel(self, i, h):
        y0, y1 = PANELS[i] if i < len(PANELS) else PANELS[1]
        return vstretch(self.band(y0, y1, clean=True), h)


def header_layout(divs):
    n = len(divs)
    if n <= 2:
        return [[d] for d in divs]
    if n <= 4:  # reference style: full rows, last two share a row
        return [[d] for d in divs[:-2]] + [divs[-2:]]
    rows, i = [], 0
    if n % 2:
        rows.append([divs[0]]); i = 1
    while i < n:
        rows.append(divs[i:i + 2]); i += 2
    return rows


# ---------------------------------------------------------------- main
def build(data, out, date, rnd, k, groups=None):
    divs = [d["name"] for d in data["divisions"]]
    counts = {d["name"]: d["count"] for d in data["divisions"]}
    for d in data["divisions"]:
        for r in d["rows"]:
            r["div"] = d["name"]
    if groups is None:
        groups = group_divisions(divs, [counts[d] for d in divs], k)
    colors, extra = {}, iter(PALETTE * 3)
    for d in divs:
        colors[d] = COLORS.get(d) or next(extra)

    A = Assets()
    base = A.clean.copy()

    headers = [[A.header_row(r, colors) for r in header_layout(g)] for g in groups]
    head_h = sum(im.size[1] for hs in headers for im in hs)
    avail = COL_BOT - COL_TOP
    panel_h = (avail - head_h) // len(groups)
    if panel_h < 190:  # too many header rows: shrink them
        scale = (avail - 190 * len(groups)) / head_h
        headers = [[im.resize((im.size[0], max(28, int(im.size[1] * scale))), Image.LANCZOS) for im in hs] for hs in headers]
        head_h = sum(im.size[1] for hs in headers for im in hs)
        panel_h = (avail - head_h) // len(groups)
    extra_px = avail - head_h - panel_h * len(groups)

    col = Image.new("RGB", (X1 - X0, avail))
    y = 0
    text_jobs = []
    for i, (g, hs) in enumerate(zip(groups, headers)):
        for im in hs:
            col.paste(im, (0, y)); y += im.size[1]
        ph = panel_h + (extra_px if i == len(groups) - 1 else 0)
        col.paste(A.panel(i, ph), (0, y))
        text_jobs.append((g, COL_TOP + y, ph))
        y += ph
    base.paste(col, (X0, COL_TOP))

    im = base.convert("RGBA")
    layer = Image.new("RGBA", im.size, (0, 0, 0, 0)); d = ImageDraw.Draw(layer)
    shadow = Image.new("RGBA", im.size, (0, 0, 0, 0)); ds = ImageDraw.Draw(shadow)

    def put(x, baseline, text, size, right=False):
        if right:
            x -= text_width(text, size)
        for t, f in runs(text, size):
            ds.text((x + 2, baseline + 2), t, font=f, fill=(0, 0, 0, 200), anchor="ls")
            d.text((x, baseline), t, font=f, fill=GREEN, anchor="ls")
            x += f.getlength(t)

    report = []
    for g, top, ph in text_jobs:
        rows = top_rows(data, g)
        sp = min(52, 44 * ph / 238)
        size = 33 if sp >= 40 else max(20, int(33 * sp / 44))
        mid = top + ph / 2 + 8 * size / 33
        for j, r in enumerate(rows[:ROWS]):
            bl = mid + (j - (ROWS - 1) / 2) * sp
            s = size
            while s > 18 and text_width(r["name"], s) > SCORE_X - NAME_X - 70:
                s -= 1
            put(NAME_X, bl, r["name"], s)
            put(SCORE_X, bl, str(r["total"]), size, right=True)
        cut_tie = len(rows) > ROWS and rows[ROWS]["total"] == rows[ROWS - 1]["total"]
        report.append({"group": g, "entries": sum(counts[x] for x in g),
                       "top": [(r["name"], r["total"]) for r in rows[:ROWS]],
                       "tied_at_cut": [r["name"] for r in rows[ROWS:] if r["total"] == rows[ROWS - 1]["total"]] if cut_tie else []})
    im = Image.alpha_composite(im, shadow.filter(ImageFilter.GaussianBlur(1.5)))
    im = Image.alpha_composite(im, layer)

    # banner
    txt = f"ROUND {rnd} - {date.day} {date.strftime('%B').upper()} {date.year}"
    size = BANNER["size"]
    F = ImageFont.truetype(LAT, size)
    while F.getlength(txt) > (BANNER["box"][2] - BANNER["box"][0]) and size > 20:
        size -= 1; F = ImageFont.truetype(LAT, size)
    x0 = BANNER["cx"] - F.getlength(txt) / 2
    m = Image.new("L", im.size, 0)
    ImageDraw.Draw(m).text((x0, BANNER["base"]), txt, font=F, fill=255, anchor="ls")
    sh = Image.new("RGBA", im.size, (0, 0, 0, 255)); sh.putalpha(m.filter(ImageFilter.GaussianBlur(2.5)))
    im = Image.alpha_composite(im, Image.fromarray(np.roll(np.array(sh), (2, 2), (0, 1))))
    grad = np.zeros((im.size[1], im.size[0], 4), np.uint8)
    for yy in range(BANNER["base"] - 32, BANNER["base"] + 8):
        t = min(max((yy - (BANNER["base"] - 28)) / 28, 0), 1)
        v = int(255 - 70 * t)
        grad[yy, :, :3] = (v, v, min(255, v + 8))
    grad[..., 3] = np.array(m)
    im = Image.alpha_composite(im, Image.fromarray(grad))
    im.convert("RGB").save(out)
    return {"out": out, "banner": txt, "groups": report}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("standings")
    ap.add_argument("--out")
    ap.add_argument("--date", help="YYYY-MM-DD (default: today, US Eastern)")
    ap.add_argument("--round", type=int)
    ap.add_argument("--boxes", type=int, default=3)
    ap.add_argument("--groups", help='e.g. "Apex|Ultimate|Legendary,Master,Elite,Trial"')
    a = ap.parse_args()
    data = json.load(open(a.standings, encoding="utf-8"))
    if a.date:
        date = datetime.date.fromisoformat(a.date)
    else:
        try:
            from zoneinfo import ZoneInfo
            date = datetime.datetime.now(ZoneInfo("America/New_York")).date()
        except Exception:
            date = datetime.date.today()
    rnd = a.round if a.round is not None else data.get("round", 0)
    groups = [g.split(",") for g in a.groups.split("|")] if a.groups else None
    out = a.out or f"bracket_round{rnd}_{date.isoformat()}.png"
    print(json.dumps(build(data, out, date, rnd, a.boxes, groups), ensure_ascii=False, indent=None))


if __name__ == "__main__":
    main()
