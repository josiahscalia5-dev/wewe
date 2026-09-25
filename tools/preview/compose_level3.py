"""Local preview of the Level 3 world at the reference pose (mirrors WorldRenderer.kt and
Level3.applyReferencePose with the numbers from ArtMetrics/StageCamera). No HUD.

usage: python3 tools/preview/compose_level3.py out.png
"""
import json
import math
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ART = os.path.join(ROOT, "art")
W, H = 1080, 2340
F, HZ, CAMH, CX = 1400.0, 1170.0, 1.7, 540.0
meta = {}
mp = os.path.join(ART, "_layers.json")
if os.path.exists(mp):
    meta = json.load(open(mp))


def layer(name):
    im = Image.open(os.path.join(ART, name + ".png")).convert("RGBA")
    m = meta.get(name)
    if m and m["w"] == im.width and m["h"] == im.height:
        full = Image.new("RGBA", (int(m["canvasW"]), int(m["canvasH"])), (0, 0, 0, 0))
        full.paste(im, (int(m["x"]), int(m["y"])))
        return full
    return im


def draw(stage, im, left, top, w, h, rot=None, pivot=None, alpha=1.0):
    w, h = max(1, round(w)), max(1, round(h))
    sp = im.resize((w, h), Image.LANCZOS)
    if alpha < 1:
        a = sp.split()[3].point(lambda v: int(v * alpha))
        sp.putalpha(a)
    if rot is not None:
        px, py = pivot
        big = Image.new("RGBA", (w * 3, h * 3 + w * 2), (0, 0, 0, 0))
        ox, oy = w * 1.5 - (px - left), (h * 3 + w * 2) / 2 - (py - top)
        big.alpha_composite(sp, (round(ox), round(oy)))
        big = big.rotate(-rot, resample=Image.BICUBIC, center=(w * 1.5, (h * 3 + w * 2) / 2))
        stage.alpha_composite(big, (round(px - w * 1.5), round(py - (h * 3 + w * 2) / 2)))
        return
    stage.alpha_composite(sp, (round(left), round(top)))


def main(out):
    pan = -0.60 + 0.45  # player start + camera shoulder offset (Level3Tuning)
    sx = lambda x, z: CX + F * (x - pan) / z
    sy = lambda y, z: HZ + F * (CAMH - y) / z
    ppm = lambda z: F / z
    stage = Image.new("RGBA", (W, H), (10, 12, 30, 255))
    bg = layer("bg_warehouse")
    shift = -F * pan / 8
    draw(stage, bg, -168 + shift, -30, 1632, 2400)

    items = []
    props = [("cover_forklift_right", 0.85, 3.3), ("cover_crates_mid_1", 1.47, 2.85), ("cover_crates_left", -1.07, 2.75)]
    for n, x, z in props:
        items.append((z, "prop", (n, x, z)))
    rz = F * CAMH / (0.66 * H - HZ)
    rx = (0.76 * W - CX) * rz / F + pan
    items.append((rz, "robot", (rx, rz)))
    drones = [(0.33, 0.365, 4.3), (0.645, 0.29, 5.0), (0.665, 0.44, 6.4)]
    for fx, fy, z in drones:
        items.append((z, "drone", (fx * W, fy * H, z)))
    items.sort(key=lambda t: -t[0])
    for z, kind, d in items:
        if kind == "prop":
            n, x, z = d
            im = layer(n)
            s = ppm(z) / 420
            ax, ay = sx(x, z), sy(0, z)
            draw(stage, im, ax - im.width * s / 2, ay - (im.height - 140) * s, im.width * s, im.height * s)
        elif kind == "robot":
            x, z = d
            im = layer("robot_walk_left_2")
            s = ppm(z) / 450
            ax, ay = sx(x, z), sy(0, z)
            draw(stage, im, ax - 450 * s, ay - 1075 * s, 900 * s, 1100 * s)
        else:
            px, py, z = d
            s = ppm(z) / 560
            for n in ("drone_body", "drone_rotor_2"):
                draw(stage, layer(n), px - 400 * s, py - 400 * s, 800 * s, 800 * s)
    # Astronaut + arm.
    s = ppm(1.85) / 780
    ax, ay = sx(-0.60, 1.85), sy(0, 1.85)  # astronaut at the player start
    draw(stage, layer("astro_fire"), ax - 450 * s, ay - 1080 * s, 900 * s, 1100 * s)
    shx, shy = ax + (608 - 450) * s, ay + (520 - 1080) * s
    aimx, aimy = 0.52 * W, 0.485 * H
    ang = math.degrees(math.atan2(aimy - shy, aimx - shx))
    draw(stage, layer("astro_arm_blaster"), shx - 96 * s, shy - 170 * s, 760 * s, 320 * s, rot=ang, pivot=(shx, shy))
    if "--ref" in sys.argv:
        ref = Image.open(os.path.join(ROOT, "reference/2376.png")).convert("RGBA").crop((32, 26, 825, 1803)).resize((W, H), Image.LANCZOS)
        c = Image.new("RGB", (W * 3 + 40, H))
        for i, im in enumerate((ref, stage, Image.blend(ref, stage, 0.5))):
            c.paste(im.convert("RGB"), (i * (W + 20), 0))
        c.save(out)
    else:
        stage.convert("RGB").save(out)
    print("preview written", out)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "preview.png")
