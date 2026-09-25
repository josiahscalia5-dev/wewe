"""Fits the rendered hero_robot layer onto reference 2371 using its logged keypoints
(head centre, muzzle) and writes a side-by-side + 50% overlay for inspection.

usage: python3 tools/preview/hero_fit.py '<HERO_KEYS json>' out.png
"""
import json
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# Reference screen (inside the bezel), 803 x 1770.
REF_HEAD = (0.467 * 803, 0.457 * 1770)
REF_MUZZLE = (0.788 * 803, 0.576 * 1770)
# Other measured points (reference-screen fractions) used to report fit errors.
TARGETS = {
    "eyeL": (0.489, 0.471), "eyeR": (0.610, 0.489), "ear": (0.300, 0.438), "top": (0.465, 0.372),
    "fist": (0.283, 0.539), "chest": (0.450, 0.5605), "glove": (0.599, 0.595), "boot": (0.230, 0.636),
    "knee": (0.453, 0.618), "elbow": (0.171, 0.490),
}


def fit(keys):
    """Least-squares scale + translation mapping render keypoints onto the reference."""
    pts = [("head", REF_HEAD, 2.0), ("muzzle", REF_MUZZLE, 2.0)]
    pts += [(k, (x * 803, y * 1770), 1.0) for k, (x, y) in TARGETS.items() if k != "top"]
    pts = [(keys[k], r, w) for k, r, w in pts if k in keys]
    sw = sum(w for _, _, w in pts)
    kx = sum(w * k[0] for k, _, w in pts) / sw
    ky = sum(w * k[1] for k, _, w in pts) / sw
    rx = sum(w * r[0] for _, r, w in pts) / sw
    ry = sum(w * r[1] for _, r, w in pts) / sw
    num = sum(w * ((k[0] - kx) * (r[0] - rx) + (k[1] - ky) * (r[1] - ry)) for k, r, w in pts)
    den = sum(w * ((k[0] - kx) ** 2 + (k[1] - ky) ** 2) for k, _, w in pts)
    s = num / den
    return s, rx - s * kx, ry - s * ky


def main(keys, out):
    s, tx, ty = fit(keys)
    ref = Image.open(os.path.join(ROOT, "reference/2371.png")).convert("RGBA").crop((27, 34, 830, 1804))
    hero = Image.open(os.path.join(ROOT, "art/hero_robot.png")).convert("RGBA")
    meta = json.load(open(os.path.join(ROOT, "art/_layers.json"))).get("hero_robot")
    ox = oy = 0
    if meta and meta["w"] == hero.width and meta["h"] == hero.height:
        ox, oy = meta["x"], meta["y"]
    hs = hero.resize((round(hero.width * s), round(hero.height * s)), Image.LANCZOS)
    pos = (round(tx + ox * s), round(ty + oy * s))
    mine = Image.new("RGBA", ref.size, (22, 34, 96, 255))
    mine.alpha_composite(hs, pos)
    over = Image.blend(ref, mine, 0.5)
    y0, y1 = int(0.33 * 1770), int(0.68 * 1770)
    parts = [im.crop((0, y0, 803, y1)) for im in (ref, mine, over)]
    c = Image.new("RGB", (803 * 3 + 20, y1 - y0), (0, 0, 0))
    for i, p in enumerate(parts):
        c.paste(p.convert("RGB"), (i * 813, 0))
    c.save(out)
    # Canvas placement in reference-screen fractions (for LayoutSpec).
    trimmed = meta and meta["w"] == hero.width and meta["h"] == hero.height
    W, H = (meta["canvasW"], meta["canvasH"]) if trimmed else hero.size
    x0, yT = tx / 803, ty / 1770
    allt = dict(TARGETS, head=(REF_HEAD[0] / 803, REF_HEAD[1] / 1770), muzzle=(REF_MUZZLE[0] / 803, REF_MUZZLE[1] / 1770))
    for k, (tx_, ty_) in allt.items():
        if k in keys:
            px = (s * keys[k][0] + tx) / 803
            py = (s * keys[k][1] + ty) / 1770
            print(f"{k:6s} got ({px:.3f},{py:.3f}) want ({tx_:.3f},{ty_:.3f})  d=({px - tx_:+.3f},{py - ty_:+.3f})")
    wf, hf = W * s / 803, H * s / 1770
    print(json.dumps({"scale": s, "canvas_left": x0, "canvas_top": yT, "canvas_w_frac": wf, "canvas_h_frac": hf}))
    # LayoutSpec.Home.heroRobot (safe-area convention: cy = (refY - 0.028) / 0.952).
    print("Spot(cx = %.4ff, cy = %.4ff, w = %.4ff, h = %.4ff)" % (x0 + wf / 2, (yT + hf / 2 - 0.028) / 0.952, wf, wf * H / W))


if __name__ == "__main__":
    main(json.loads(sys.argv[1]), sys.argv[2])
