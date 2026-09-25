"""Builds side-by-side comparisons (reference | device | 50% blend) and a contact sheet
per screen size from the screenshots pulled off the emulator.

usage: python3 ci/compare.py verification
"""
import glob
import os
import sys

from PIL import Image, ImageDraw, ImageFont

ROOT = sys.argv[1] if len(sys.argv) > 1 else "verification"
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Screen rectangle inside the phone bezel of each canonical reference (px).
REF_RECT = {"2371": (27, 34, 830, 1804), "2376": (32, 26, 825, 1803)}
PAIRS = [
    ("01_home", "2371", "Home"),
    ("14_home_after", "2371", "Home (after completing the level)"),
    ("13_level3_reference_pose", "2376", "Level 3 — frozen at the reference moment (6/20, 00:28)"),
    ("05_level3_playing", "2376", "Level 3 — live, right after the opening banner"),
]


def font(size):
    for p in ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
              "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"):
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def cover(img, w, h):
    k = max(w / img.width, h / img.height)
    r = img.resize((round(img.width * k), round(img.height * k)), Image.LANCZOS)
    x = (r.width - w) // 2
    y = (r.height - h) // 2
    return r.crop((x, y, x + w, y + h))


def fit_h(img, h):
    return img.resize((round(img.width * h / img.height), h), Image.LANCZOS)


def side_by_side(shot_path, ref, title, out_path):
    s = Image.open(shot_path).convert("RGB")
    r = Image.open(os.path.join(REPO, "reference", ref + ".png")).convert("RGB").crop(REF_RECT[ref])
    r_on_screen = cover(r, s.width, s.height)
    blend = Image.blend(r_on_screen, s, 0.5)
    H = 1400
    cols = [fit_h(r_on_screen, H), fit_h(s, H), fit_h(blend, H)]
    labels = [f"REFERENCE {ref}.png", "ANDROID EMULATOR", "50% OVERLAY"]
    gap, head = 24, 110
    W = sum(c.width for c in cols) + gap * (len(cols) + 1)
    canvas = Image.new("RGB", (W, H + head + gap), (12, 14, 28))
    d = ImageDraw.Draw(canvas)
    d.text((gap, 18), title, fill=(255, 255, 255), font=font(34))
    x = gap
    for c, lab in zip(cols, labels):
        d.text((x, 66), lab, fill=(120, 210, 255), font=font(26))
        canvas.paste(c, (x, head))
        x += c.width + gap
    canvas.save(out_path, quality=90)


def contact_sheet(size_dir, out_path):
    shots = sorted(glob.glob(os.path.join(size_dir, "*.png")))
    if not shots:
        return
    th = 800
    thumbs = [fit_h(Image.open(p).convert("RGB"), th) for p in shots]
    per_row = 5
    gap, lab = 16, 40
    tw = max(t.width for t in thumbs)
    rows = (len(thumbs) + per_row - 1) // per_row
    canvas = Image.new("RGB", (per_row * (tw + gap) + gap, rows * (th + lab + gap) + gap), (12, 14, 28))
    d = ImageDraw.Draw(canvas)
    for i, (t, p) in enumerate(zip(thumbs, shots)):
        x = gap + (i % per_row) * (tw + gap)
        y = gap + (i // per_row) * (th + lab + gap)
        d.text((x, y), os.path.basename(p)[:-4], fill=(255, 255, 255), font=font(24))
        canvas.paste(t, (x, y + lab))
    canvas.save(out_path, quality=88)


def main():
    out = os.path.join(ROOT, "comparisons")
    os.makedirs(out, exist_ok=True)
    for size_dir in sorted(glob.glob(os.path.join(ROOT, "device", "*"))):
        if not os.path.isdir(size_dir):
            continue
        size = os.path.basename(size_dir)
        for shot, ref, title in PAIRS:
            p = os.path.join(size_dir, shot + ".png")
            if os.path.exists(p):
                side_by_side(p, ref, f"{title} — {size}", os.path.join(out, f"{size}_{shot}_vs_{ref}.jpg"))
        contact_sheet(size_dir, os.path.join(out, f"{size}_all_steps.jpg"))
    print("comparisons written to", out)


if __name__ == "__main__":
    main()
