"""Full-screen local preview of Level 3 at the reference moment (mirrors WorldRenderer.kt,
Level3.applyReferencePose and LayoutSpec.Level3) on a 1080x2400 phone with a 63 px
status bar and a 48 px gesture bar. The HUD is a close approximation of the Compose HUD
(same layout numbers, fonts and icons).

usage: python3 tools/preview/compose_level3.py out.png [--ref]
"""
import json
import math
import os
import re
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ART = os.path.join(ROOT, "art")
FONTS = os.path.join(ROOT, "app/src/main/res/font")
SW, SH, TOP, BOT = 1080, 2400, 63, 48
W, H = 1080, 2340  # stage
F, HZ, CAMH, CX = 1400.0, 1170.0, 1.7, 540.0
meta = json.load(open(os.path.join(ART, "_layers.json")))
metrics = open(os.path.join(ROOT, "core/src/main/kotlin/com/blastcollect/core/ArtMetrics.kt")).read()
tuning = open(os.path.join(ROOT, "core/src/main/kotlin/com/blastcollect/core/Level3Tuning.kt")).read()
spec = open(os.path.join(ROOT, "app/src/main/java/com/blastcollect/game/ui/LayoutSpec.kt")).read()
spec3 = spec[spec.index("object Level3"):spec.index("object Home")]


def const(src, name):
    return float(re.search(r"\b" + name + r"(?::\s*\w+)? = (-?[\d.]+)f?", src).group(1))


def farr(name):
    return [float(v) for v in re.search(name + r" = floatArrayOf\(([^)]*)\)", metrics).group(1).replace("f", "").split(",")]


def spot(name):
    m = re.search(name + r" = Spot\(cx = ([\d.]+)f, cy = ([\d.]+)f, w = ([\d.]+)f, h = ([\d.]+)f\)", spec3)
    return tuple(float(v) for v in m.groups())


def layer(name):
    im = Image.open(os.path.join(ART, name + ".png")).convert("RGBA")
    m = meta.get(name)
    if m and m["w"] == im.width and m["h"] == im.height:
        full = Image.new("RGBA", (int(m["canvasW"]), int(m["canvasH"])), (0, 0, 0, 0))
        full.paste(im, (int(m["x"]), int(m["y"])))
        return full
    return im


def draw(stage, im, left, top, w, h, alpha=1.0):
    sp = im.resize((max(1, round(w)), max(1, round(h))), Image.LANCZOS)
    if alpha < 1:
        sp.putalpha(sp.split()[3].point(lambda v: int(v * alpha)))
    stage.alpha_composite(sp, (round(left), round(top))) if left >= 0 and top >= 0 and left + sp.width <= stage.width and top + sp.height <= stage.height else paste_clip(stage, sp, round(left), round(top))


def paste_clip(stage, sp, x, y):
    big = Image.new("RGBA", (stage.width + 2 * sp.width, stage.height + 2 * sp.height), (0, 0, 0, 0))
    big.alpha_composite(stage, (sp.width, sp.height))
    big.alpha_composite(sp, (x + sp.width, y + sp.height))
    stage.paste(big.crop((sp.width, sp.height, sp.width + stage.width, sp.height + stage.height)))


def rotated(stage, im, w, h, px, py, pivot_frac, deg):
    """Draws im (w x h) with its pivot point (fractions) at (px, py), rotated deg."""
    sp = im.resize((max(1, round(w)), max(1, round(h))), Image.LANCZOS)
    pad = int(max(w, h)) * 2
    big = Image.new("RGBA", (pad * 2, pad * 2), (0, 0, 0, 0))
    big.alpha_composite(sp, (round(pad - pivot_frac[0] * w), round(pad - pivot_frac[1] * h)))
    big = big.rotate(-deg, resample=Image.BICUBIC, center=(pad, pad))
    paste_clip(stage, big, round(px - pad), round(py - pad))


def world(stage):
    pan = const(tuning, "playerStartX") * const(tuning, "cameraFollow") + const(tuning, "cameraShoulder")
    pz = const(tuning, "playerZ")
    sx = lambda x, z: CX + F * (x - pan) / z
    sy = lambda y, z: HZ + F * (CAMH - y) / z
    ppm = lambda z: F / z
    draw(stage, layer("bg_warehouse"), const(metrics, "BG_STAGE_LEFT") - F * pan / 8, const(metrics, "BG_STAGE_TOP"), const(metrics, "BG_STAGE_W"), const(metrics, "BG_STAGE_H"))
    props = re.findall(r'Prop\("(\w+)", (-?[\d.]+)f, ([\d.]+)f', open(os.path.join(ROOT, "core/src/main/kotlin/com/blastcollect/core/Props.kt")).read())
    items = [(float(z), "prop", (n, float(x), float(z))) for n, x, z in props]
    rz = F * CAMH / (0.66 * H - HZ)
    rx = (0.76 * W - CX) * rz / F + pan
    items.append((rz, "robot", (rx, rz)))
    for fx, fy, z in [(0.33, 0.365, 4.3), (0.645, 0.29, 5.0), (0.665, 0.44, 6.4)]:
        items.append((z, "drone", (fx * W, fy * H, z)))
    items.sort(key=lambda t: -t[0])
    RW, RH, RAX, RAY, RPPM = (const(metrics, k) for k in ("ROBOT_W", "ROBOT_H", "ROBOT_ANCHOR_X", "ROBOT_ANCHOR_Y", "ROBOT_PX_PER_M"))
    DW, DPPM = const(metrics, "DRONE_W"), const(metrics, "DRONE_PX_PER_M")
    PPPM, PAD = const(metrics, "PROP_PX_PER_M"), const(metrics, "PROP_ANCHOR_BOTTOM_PAD")
    for _, kind, d in items:
        if kind == "prop":
            n, x, z = d
            im = layer(n)
            s = ppm(z) / PPPM
            ax, ay = sx(x, z), sy(0, z)
            shadow(stage, ax, ay - 4 * s, im.width * s * 1.05, im.width * s * 0.22, 150)
            draw(stage, im, ax - im.width * s / 2, ay - (im.height - PAD) * s, im.width * s, im.height * s)
        elif kind == "robot":
            x, z = d
            im = layer("robot_walk_left_2")
            s = ppm(z) / RPPM
            ax, ay = sx(x, z), sy(0, z)
            shadow(stage, ax, ay, 1.25 * ppm(z), 0.34 * ppm(z), 200)
            refl = im.transpose(Image.FLIP_TOP_BOTTOM)
            draw(stage, refl, ax - RAX * s, ay - (RH - RAY) * s, RW * s, RH * s, alpha=0.18)
            draw(stage, im, ax - RAX * s, ay - RAY * s, RW * s, RH * s)
        else:
            px, py, z = d
            s = ppm(z) / DPPM
            draw(stage, layer("drone_body"), px - DW * s / 2, py - DW * s / 2, DW * s, DW * s)
    # Astronaut in the aim pose closest to the reference aim point, laser, flash, crosshair.
    s = ppm(pz) / const(metrics, "ASTRO_PX_PER_M")
    AX, AY = const(metrics, "ASTRO_ANCHOR_X"), const(metrics, "ASTRO_ANCHOR_Y")
    ax, ay = sx(const(tuning, "playerStartX"), pz), sy(0, pz)
    shx = ax + (const(metrics, "ASTRO_SHOULDER_X") - AX) * s
    shy = ay + (const(metrics, "ASTRO_SHOULDER_Y") - AY) * s
    aimx, aimy = 0.52 * W, 0.485 * H
    ang = math.degrees(math.atan2(aimy - shy, aimx - shx))
    degs = farr("AIM_DEG")
    i = min(range(len(degs)), key=lambda k: abs(degs[k] - ang))
    poses = re.search(r"AIM_POSES = arrayOf\(([^)]*)\)", metrics).group(1).replace('"', "").replace(" ", "").split(",")
    draw(stage, layer(poses[i]), ax - AX * s, ay - AY * s, const(metrics, "ASTRO_W") * s, const(metrics, "ASTRO_H") * s)
    mx = ax + (farr("AIM_MUZZLE_X")[i] - AX) * s
    my = ay + (farr("AIM_MUZZLE_Y")[i] - AY) * s
    t = 0.55
    hx, hy = mx + (aimx - mx) * t, my + (aimy - my) * t
    length = math.hypot(hx - mx, hy - my)
    rotated(stage, layer("laser_bolt"), length, 70 * (1 - 0.45 * t), mx, my, (0, 0.5), math.degrees(math.atan2(hy - my, hx - mx)))
    size = 330 * s * 1.25
    rotated(stage, layer("muzzle_flash"), size, size, mx, my, (0.35, 0.5), math.degrees(math.atan2(aimy - my, aimx - mx)))
    crosshair(stage, aimx, aimy)


def shadow(stage, cx, cy, w, h, alpha):
    sh = Image.new("RGBA", (max(1, int(w)), max(1, int(h))), (0, 0, 0, 0))
    ImageDraw.Draw(sh).ellipse((0, 0, sh.width - 1, sh.height - 1), fill=(0, 0, 8, alpha))
    sh = sh.filter(ImageFilter.GaussianBlur(max(1, h / 4)))
    paste_clip(stage, sh, round(cx - w / 2), round(cy - h / 2))


def crosshair(stage, x, y):
    r = W * 0.078
    g = Image.new("RGBA", stage.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(g)
    for wdt, col in ((28, (90, 200, 255, 70)), (16, (90, 200, 255, 120))):
        d.ellipse((x - r, y - r, x + r, y + r), outline=col, width=wdt)
    g = g.filter(ImageFilter.GaussianBlur(6))
    stage.alpha_composite(g)
    d = ImageDraw.Draw(stage)
    d.ellipse((x - r, y - r, x + r, y + r), outline=(235, 248, 255, 255), width=6)
    for a, b in ((0.52, 1.42),):
        for dx, dy in ((0, -1), (0, 1), (-1, 0), (1, 0)):
            d.line((x + dx * r * a, y + dy * r * a, x + dx * r * b, y + dy * r * b), fill=(235, 248, 255, 255), width=7)
    d.ellipse((x - 14, y - 14, x + 14, y + 14), fill=(255, 90, 230, 255))


def hud(img):
    """Approximation of Level3Hud.kt at the reference moment (6/20, 00:28, +3, charge 3/5)."""
    sw, sh = SW, SH - TOP - BOT
    d = ImageDraw.Draw(img)

    def box(name):
        cx, cy, w, h = spot(name)
        return sw * (cx - w / 2), TOP + sh * cy - sw * h / 2, sw * w, sw * h

    def panel(b, radius, rim=(40, 200, 255), fill=(10, 19, 48, 235)):
        x, y, w, h = b
        glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
        ImageDraw.Draw(glow).rounded_rectangle((x, y, x + w, y + h), radius=radius, outline=rim + (160,), width=14)
        img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(8)))
        d.rounded_rectangle((x, y, x + w, y + h), radius=radius, fill=fill, outline=rim + (255,), width=5)

    hudf = lambda px: ImageFont.truetype(os.path.join(FONTS, "barlow_condensed_extrabold.ttf"), round(px))
    x, y, w, h = box("pause")
    d.ellipse((x, y, x + w, y + h), fill=(10, 19, 48, 220), outline=(40, 210, 255, 255), width=7)
    for k in (-1, 1):
        d.rounded_rectangle((x + w / 2 + k * w * 0.1 - w * 0.05, y + h * 0.3, x + w / 2 + k * w * 0.1 + w * 0.05, y + h * 0.7), radius=4, fill=(255, 255, 255, 255))
    x, y, w, h = box("levelPill")
    d.rounded_rectangle((x, y, x + w, y + h), radius=h * 0.25, fill=(20, 32, 63, 170))
    d.text((x + w / 2, y + h / 2), "LEVEL 3", font=hudf(h * 0.62), fill=(255, 255, 255), anchor="mm", stroke_width=3, stroke_fill=(11, 14, 36))
    x, y, w, h = box("timerPill")
    panel((x, y, w, h), h / 2, rim=(255, 70, 70))
    ic = layer("icon_stopwatch")
    draw(img, ic, x + h * 0.18, y + h * 0.16, h * 0.68, h * 0.68)
    d.text((x + w * 0.64, y + h / 2), "00:28", font=hudf(h * 0.58), fill=(255, 255, 255), anchor="mm")
    x, y, w, h = box("objectivePanel")
    panel((x, y, w, h), h * 0.2)
    ic = layer("icon_drone")
    isz = w * const(spec3, "objIconSize")
    draw(img, ic, x + w * const(spec3, "objIconCx") - isz / 2, y + h / 2 - isz / 2, isz, isz)
    d.text((x + w * const(spec3, "objTitleLeft"), y + h * const(spec3, "objTitleTop")), "SHOOT THE RED DRONES", font=hudf(w * const(spec3, "objTitleSize")), fill=(255, 255, 255))
    segw, segh, gap = w * const(spec3, "objSegW"), h * const(spec3, "objSegH"), w * const(spec3, "objSegGap")
    for k in range(5):
        sx0 = x + w * const(spec3, "objSegLeft") + k * (segw + gap)
        sy0 = y + h * const(spec3, "objSegTop")
        lit = k < 1.5
        d.rounded_rectangle((sx0, sy0, sx0 + segw * (0.5 if k == 1 else 1) if lit and k == 1 else sx0 + segw, sy0 + segh), radius=4, fill=(46, 224, 255) if lit else (58, 72, 104))
    d.text((x + w * const(spec3, "objCountRight"), y + h * 0.66), "6/20", font=hudf(w * const(spec3, "objCountSize")), fill=(255, 255, 255), anchor="rm")
    x, y, w, h = box("weaponPanel")
    panel((x, y, w, h), h * 0.2)
    ic = layer("icon_blaster")
    draw(img, ic, x + w * 0.04, y + h * 0.18, w * 0.24, w * 0.24 * ic.height / ic.width)
    for k in range(5):
        sx0 = x + w * const(spec3, "wpnSegLeft") + k * w * (const(spec3, "wpnSegW") + const(spec3, "wpnSegGap"))
        d.rounded_rectangle((sx0, y + h * 0.36, sx0 + w * const(spec3, "wpnSegW"), y + h * (0.36 + const(spec3, "wpnSegH"))), radius=5, fill=(46, 224, 255) if k < 3 else (58, 72, 104))
    d.text((x + w * const(spec3, "wpnInfLeft") + w * 0.05, y + h * 0.52), "∞", font=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", round(h * 0.45)), fill=(255, 255, 255), anchor="mm")
    x, y, w, h = box("coinPanel")
    panel((x, y, w, h), h * 0.2)
    ic = layer("icon_coin_star")
    isz = w * const(spec3, "coinIconSize")
    draw(img, ic, x + w * const(spec3, "coinIconCx") - isz / 2, y + h / 2 - isz / 2, isz, isz)
    d.text((x + w * const(spec3, "coinTextLeft"), y + h / 2), "+3", font=hudf(h * 0.62), fill=(255, 255, 255), anchor="lm")


def main(out):
    stage = Image.new("RGBA", (W, H), (10, 12, 30, 255))
    world(stage)
    # StageMapping: scale to cover the 1080x2400 screen, centred horizontally.
    k = max(SW / W, SH / H)
    st = stage.resize((round(W * k), round(H * k)), Image.LANCZOS)
    img = Image.new("RGBA", (SW, SH), (0, 0, 0, 255))
    img.alpha_composite(st, (round((SW - st.width) / 2), round((SH - st.height) * 0.6)))
    hud(img)
    if "--ref" in sys.argv:
        ref = Image.open(os.path.join(ROOT, "reference/2376.png")).convert("RGBA").crop((32, 26, 825, 1803)).resize((SW, SH), Image.LANCZOS)
        c = Image.new("RGB", (SW * 2 + 20, SH))
        c.paste(ref.convert("RGB"), (0, 0))
        c.paste(img.convert("RGB"), (SW + 20, 0))
        c.save(out)
    else:
        img.convert("RGB").save(out)
    print("preview written", out)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "level3_preview.png")
