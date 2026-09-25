"""Trims transparent margins from the sprite layers in /art and records the original
canvas geometry in art/_layers.json (ArtLibrary restores it, so anchors stay valid).

usage: python3 tools/art/trim.py
"""
import json
import os

import numpy as np
from PIL import Image

ART = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "art")
meta_path = os.path.join(ART, "_layers.json")
meta = json.load(open(meta_path)) if os.path.exists(meta_path) else {}
for f in sorted(os.listdir(ART)):
    if not f.endswith(".png") or f.startswith("bg_"):
        continue
    name = f[:-4]
    p = os.path.join(ART, f)
    im = Image.open(p).convert("RGBA")
    old = meta.get(name)
    if old and old["w"] == im.width and old["h"] == im.height:
        continue  # already trimmed
    a = np.asarray(im)[..., 3]
    ys, xs = np.where(a > 2)
    if len(xs) == 0:
        continue
    x0, x1 = max(0, xs.min() - 2), min(im.width, xs.max() + 3)
    y0, y1 = max(0, ys.min() - 2), min(im.height, ys.max() + 3)
    im.crop((x0, y0, x1, y1)).save(p, optimize=True)
    meta[name] = {"canvasW": im.width, "canvasH": im.height, "x": int(x0), "y": int(y0), "w": int(x1 - x0), "h": int(y1 - y0)}
json.dump(meta, open(meta_path, "w"), indent=1, sort_keys=True)
print("trimmed; metadata for", len(meta), "layers")
