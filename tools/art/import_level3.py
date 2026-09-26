"""Imports the supplied Level 3 artwork (level3_art_assets.zip) into /art as game layers.

Each supplied PNG is cleaned (keeps the main object; drops stray labels, separator lines
and slivers of neighbouring sprites), upscaled 4x with Real-ESRGAN (esrgan.py), scaled to
the game's metric scale and placed on the canvas/anchor that core/ArtMetrics.kt expects.
Measured values the rules need (astronaut blaster tips per aim pose, robot eye height)
are printed as Kotlin constants for ArtMetrics.

usage: python3 tools/art/import_level3.py <folder with the unzipped assets>
"""
import json
import math
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import esrgan  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ART = os.path.join(ROOT, "art")

# ------------------------------------------------------------------ game geometry (ArtMetrics)
ASTRO = dict(W=1500, H=1400, AX=750, AY=1370, PPM=780, HEIGHT_M=1.31)
ROBOT = dict(W=1300, H=1100, AX=650, AY=1075, PPM=450, HEIGHT_M=1.8)
DRONE = dict(W=1000, H=1000, PPM=560, BODY_R_M=0.33)
PROP = dict(PPM=700, PAD=140)
BG = dict(STAGE_W=1080, STAGE_H=2340, HORIZON_STAGE=1170, HORIZON_FRAC=0.55)


# ------------------------------------------------------------------ helpers
def strip_bottom_debris(im):
    """Clears sheet debris glued under an object: dark separator lines and label pills
    (rows near the bottom that are wide, mostly dark or dark-with-white-text)."""
    arr = np.asarray(im).copy()
    H = arr.shape[0]
    op = arr[..., 3] > 24
    lum = arr[..., :3].mean(-1)
    widest = op.sum(1).max()
    for y in range(H - 1, int(H * 0.72), -1):
        row = op[y]
        n = row.sum()
        if n == 0:
            continue
        dark = (lum[y][row] < 80).mean()
        white = (lum[y][row] > 200).mean()
        if n > 0.3 * widest and (dark > 0.6 or (dark > 0.35 and white > 0.05)):
            arr[y, :, 3] = 0
        elif dark < 0.3:
            break
    return Image.fromarray(arr, "RGBA")


def clean(im, keep_small=False):
    """Keeps the main object: drops label boxes, thin lines and edge slivers."""
    im = strip_bottom_debris(im)
    a = np.asarray(im)[..., 3]
    mask = a > 24
    lab, n = ndimage.label(mask, structure=np.ones((3, 3)))
    if n == 0:
        return im
    sizes = ndimage.sum(mask, lab, range(1, n + 1))
    main = int(np.argmax(sizes)) + 1
    H, W = mask.shape
    keep = np.zeros(n + 1, bool)
    keep[main] = True
    rgb = np.asarray(im)[..., :3].astype(int)
    for i, sl in enumerate(ndimage.find_objects(lab), start=1):
        if i == main:
            continue
        ys, xs = sl
        h, w = ys.stop - ys.start, xs.stop - xs.start
        area = sizes[i - 1]
        if h <= 5 or w <= 5:
            continue  # separator lines / specks
        comp = lab[sl] == i
        fill = area / (h * w)
        lum = rgb[sl][comp].mean()
        if fill > 0.75 and w / max(1, h) > 2.2:
            continue  # label pill
        if lum < 70 and area < sizes[main - 1] * 0.2:
            continue  # dark label / sheet debris
        touches = ys.start == 0 or xs.start == 0 or ys.stop == H or xs.stop == W
        if touches and area < sizes[main - 1] * 0.25:
            continue  # sliver of a neighbouring sprite
        if keep_small or area > sizes[main - 1] * 0.01:
            keep[i] = True
    out = np.asarray(im).copy()
    out[..., 3] = np.where(keep[lab], out[..., 3], 0)
    return Image.fromarray(out, "RGBA")


def bbox(im, thr=24):
    a = np.asarray(im)[..., 3]
    ys, xs = np.where(a > thr)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def feet_x(im, frac=0.1):
    a = np.asarray(im)[..., 3] > 24
    x0, y0, x1, y1 = bbox(im)
    band = a[int(y1 - (y1 - y0) * frac):y1]
    xs = np.where(band.any(0))[0]
    return (xs.min() + xs.max() + 1) / 2


def scaled(im, k):
    return im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)


def place(im, W, H, ax, ay, fx, fy):
    """Pastes im so its point (fx, fy) lands on the canvas anchor (ax, ay)."""
    big = Image.new("RGBA", (W + 2 * im.width, H + 2 * im.height), (0, 0, 0, 0))
    big.alpha_composite(im, (round(ax - fx) + im.width, round(ay - fy) + im.height))
    return big.crop((im.width, im.height, im.width + W, im.height + H))


def extreme(im, dx, dy):
    """Opaque pixel furthest along (dx, dy), pulled back slightly: the blaster muzzle."""
    a = np.asarray(im)[..., 3] > 60
    ys, xs = np.where(a)
    d = xs * dx + ys * dy
    i = np.argsort(d)[-40:]
    x, y = xs[i].mean(), ys[i].mean()
    return x - dx * 18, y - dy * 18


def save(im, name):
    im.save(os.path.join(ART, name + ".png"), optimize=True)
    print("wrote", name, im.size)


def load(src, name):
    return Image.open(os.path.join(src, name)).convert("RGBA")


# ------------------------------------------------------------------ import
def main(src):
    consts = {}

    # Astronaut: one metric scale for every pose, measured on the plain side-aim pose.
    ref = clean(load(src, "astro_aim_right.png"))
    x0, y0, x1, y1 = bbox(ref)
    k_astro = ASTRO["HEIGHT_M"] * ASTRO["PPM"] / ((y1 - y0) * 4)
    poses = [("astro_aim_right", "astro_aim_right.png", (1.0, -0.12)),
             ("astro_aim_upright", "astro_aim_upright.png", (0.62, -0.78)),
             ("astro_aim_up", "astro_aim_up.png", (0.08, -1.0)),
             ("astro_aim_upleft", "astro_aim_upleft.png", (-0.62, -0.78)),
             ("astro_duck_cover", "astro_duck.png", None),
             ("astro_stunned", "astro_stunned.png", None)]
    pose_consts = []
    shoulder = None
    for name, file, aim in poses:
        im = scaled(esrgan.upscale(clean(load(src, file), keep_small=(name == "astro_stunned"))), k_astro)
        bx0, by0, bx1, by1 = bbox(im)
        c = place(im, ASTRO["W"], ASTRO["H"], ASTRO["AX"], ASTRO["AY"], feet_x(im), by1)
        save(c, name)
        if aim:
            mx, my = extreme(c, *aim)
            if shoulder is None:
                # Aim origin: upper torso, a third of the body height below the helmet top.
                cx0, cy0, cx1, cy1 = bbox(c)
                shoulder = (ASTRO["AX"] + 0.12 * ASTRO["PPM"], ASTRO["AY"] - 0.78 * ASTRO["PPM"])
            ang = math.degrees(math.atan2(my - shoulder[1], mx - shoulder[0]))
            pose_consts.append((name, round(mx, 1), round(my, 1), round(ang, 1)))
    consts["shoulder"] = shoulder
    consts["poses"] = pose_consts

    # Robot: one metric scale for every frame, measured on walk 1.
    walk1 = clean(load(src, "robot_walk_1.png"))
    x0, y0, x1, y1 = bbox(walk1)
    k_robot = ROBOT["HEIGHT_M"] * ROBOT["PPM"] / ((y1 - y0) * 4)
    frames = {}
    for key, file in (("w1", "robot_walk_1.png"), ("w2", "robot_walk_2.png"), ("idle", "robot_idle.png"), ("alert", "robot_alert.png")):
        im = scaled(esrgan.upscale(clean(load(src, file))), k_robot)
        bx0, by0, bx1, by1 = bbox(im)
        frames[key] = place(im, ROBOT["W"], ROBOT["H"], ROBOT["AX"], ROBOT["AY"], feet_x(im), by1)
    # robot_grab.png in the pack is a mis-crop (claws of two neighbouring sprites), so the
    # lunge frame is the alert pose, a little bigger and leaning in.
    al = frames["alert"]
    grab = al.resize((round(al.width * 1.1), round(al.height * 1.1)), Image.LANCZOS).rotate(-4, resample=Image.BICUBIC, center=(ROBOT["AX"] * 1.1, ROBOT["AY"] * 1.1))
    frames["grab"] = place(grab, ROBOT["W"], ROBOT["H"], ROBOT["AX"], ROBOT["AY"], ROBOT["AX"] * 1.1, ROBOT["AY"] * 1.1)
    for i in range(6):
        f = frames["w1" if i % 2 == 0 else "w2"]
        save(f, f"robot_walk_left_{i + 1}")
        save(f, f"robot_walk_front_{i + 1}")
        save(f.transpose(Image.FLIP_LEFT_RIGHT), f"robot_walk_right_{i + 1}")
    save(frames["idle"], "robot_scan_idle")
    save(frames["alert"], "robot_alert")
    save(frames["grab"], "robot_grab_lunge")
    # Eye height (the glowing red visor) above the feet, in metres.
    idle = np.asarray(frames["idle"]).astype(int)
    red = (idle[..., 0] > 220) & (idle[..., 1] < 120) & (idle[..., 3] > 200)
    ys, xs = np.where(red)
    top_half = ys < np.percentile(np.where(idle[..., 3] > 30)[0], 40)
    eye_y = ys[top_half].mean() if top_half.any() else ROBOT["AY"] - 1.5 * ROBOT["PPM"]
    consts["robot_eye_m"] = round((ROBOT["AY"] - eye_y) / ROBOT["PPM"], 3)

    # Drone: body sphere ~44% of the sprite width; scaled so its radius is 0.33 m.
    d = esrgan.upscale(clean(load(src, "drone.png")))
    x0, y0, x1, y1 = bbox(d)
    k_drone = DRONE["BODY_R_M"] * DRONE["PPM"] / (0.22 * (x1 - x0))
    d = scaled(d.crop((x0, y0, x1, y1)), k_drone)
    body = place(d, DRONE["W"], DRONE["H"], DRONE["W"] / 2, DRONE["H"] / 2, d.width * 0.5, d.height * 0.55)
    save(body, "drone_body")
    fa = np.asarray(body).astype(float)
    fa[..., :3] = fa[..., :3] * 0.35 + 255 * 0.65
    save(Image.fromarray(fa.astype(np.uint8), "RGBA"), "drone_hit_flash")
    for i in range(4):  # rotors are painted into the drone image
        save(Image.new("RGBA", (8, 8), (0, 0, 0, 0)), f"drone_rotor_{i + 1}")
    ex = esrgan.upscale(clean(load(src, "drone_explosion.png"), keep_small=True))
    x0, y0, x1, y1 = bbox(ex)
    ex = ex.crop((x0, y0, x1, y1))
    for i in range(8):
        t = (i + 1) / 8
        size = DRONE["W"] * (0.35 + 0.55 * t ** 0.6)
        e = scaled(ex, size / ex.width).rotate(i * 7, resample=Image.BICUBIC, expand=True)
        arr = np.asarray(e).astype(float)
        arr[..., 3] *= 1.0 if t < 0.55 else max(0.0, 1 - (t - 0.55) / 0.45)
        e = Image.fromarray(arr.astype(np.uint8), "RGBA")
        save(place(e, DRONE["W"], DRONE["H"], DRONE["W"] / 2, DRONE["H"] / 2, e.width / 2, e.height / 2), f"drone_explosion_{i + 1}")

    # Cover crates: about 1 m wide, base centred PAD px above the canvas bottom.
    for name, file, width_m in (("cover_crates_left", "crates_left.png", 1.0), ("cover_crates_mid_1", "crates_right.png", 1.05)):
        im = esrgan.upscale(clean(load(src, file)))
        x0, y0, x1, y1 = bbox(im)
        im = scaled(im.crop((x0, y0, x1, y1)), width_m * PROP["PPM"] / (x1 - x0))
        W, H = im.width + 80, im.height + PROP["PAD"] + 40
        save(place(im, W, H, W / 2, H - PROP["PAD"], im.width / 2, im.height), name)
        consts[name] = (W, H)

    # Background: full width over the stage, painted horizon on the game horizon; the
    # dark ceiling above and the near floor below are extended from the image's edges.
    bg = esrgan.upscale(load(src, "bg_warehouse.png").convert("RGB"))
    k = bg.width / BG["STAGE_W"]  # image px per stage px
    out_h = round(BG["STAGE_H"] * k)
    top = round((BG["HORIZON_STAGE"] - BG["HORIZON_FRAC"] * bg.height / k) * k)
    canvas = Image.new("RGB", (bg.width, out_h))
    canvas.paste(bg, (0, top))
    if top > 0:
        band = bg.crop((0, 0, bg.width, max(1, round(bg.height * 0.1))))
        canvas.paste(band.resize((bg.width, top), Image.LANCZOS), (0, 0))
    bottom = top + bg.height
    if bottom < out_h:
        cut = round(bg.height * 0.78)
        near = bg.crop((0, cut, bg.width, bg.height))
        canvas.paste(near.resize((bg.width, out_h - (top + cut)), Image.LANCZOS), (0, top + cut))
    canvas.save(os.path.join(ART, "bg_warehouse.png"), optimize=True)
    consts["bg_px"] = canvas.size
    print("wrote bg_warehouse", canvas.size)
    print(json.dumps(consts, indent=1, default=float))


if __name__ == "__main__":
    main(sys.argv[1])
