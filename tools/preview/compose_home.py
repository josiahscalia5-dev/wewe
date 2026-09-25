"""Local preview of the Home art placement (mirrors HomeScreen.kt + LayoutSpec.Home) on a
1080x2400 screen with a 63 px status bar and 48 px gesture bar. Text/HUD shapes are only
roughly drawn; the point is where the art layers land.

usage: python3 tools/preview/compose_home.py out.png
"""
import json
import os
import re
import sys

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ART = os.path.join(ROOT, "art")
SW, SH, TOP, BOT = 1080, 2400, 63, 48
W, H = SW, SH - TOP - BOT
meta = json.load(open(os.path.join(ART, "_layers.json")))
spec = open(os.path.join(ROOT, "app/src/main/java/com/blastcollect/game/ui/LayoutSpec.kt")).read()
home = spec[spec.index("object Home"):]


def spot(name):
    m = re.search(name + r" = Spot\(cx = ([\d.]+)f, cy = ([\d.]+)f, w = ([\d.]+)f, h = ([\d.]+)f\)", home)
    return tuple(float(v) for v in m.groups())


def layer(name):
    im = Image.open(os.path.join(ART, name + ".png")).convert("RGBA")
    m = meta.get(name)
    if m and m["w"] == im.width and m["h"] == im.height:
        full = Image.new("RGBA", (int(m["canvasW"]), int(m["canvasH"])), (0, 0, 0, 0))
        full.paste(im, (int(m["x"]), int(m["y"])))
        return full
    return im


def box(s):
    cx, cy, w, h = s
    return W * (cx - w / 2), TOP + H * cy - W * h / 2, W * w, W * h


def put(img, name, s):
    x, y, w, h = box(s)
    im = layer(name)
    k = min(w / im.width, h / im.height)
    iw, ih = round(im.width * k), round(im.height * k)
    img.alpha_composite(im.resize((iw, ih), Image.LANCZOS), (round(x + (w - iw) / 2), round(y + (h - ih) / 2)))


def main(out):
    img = Image.new("RGBA", (SW, SH), (7, 11, 28, 255))
    bg = layer("bg_home")
    k = max(SW / bg.width, SH / bg.height)
    bgr = bg.resize((round(bg.width * k), round(bg.height * k)), Image.LANCZOS)
    img.alpha_composite(bgr, ((SW - bgr.width) // 2, round((SH - bgr.height) * 0.45)))
    sp = re.findall(r"floatArrayOf\(([\d.]+)f, ([\d.]+)f, ([\d.]+)f\)", home[home.index("sparkles"):home.index("taglineCy")])
    for cx, cy, s in sp:
        put(img, "sparkle", (float(cx), float(cy), float(s), float(s)))
    for n, c in (("creatureBlue", "creature_blue"), ("creatureYellow", "creature_yellow"), ("creatureGreen", "creature_green"),
                 ("creatureRed", "creature_red"), ("creaturePurple", "creature_purple"), ("creatureBlueSmall", "creature_blue")):
        put(img, c, spot(n))
    put(img, "hero_robot", spot("heroRobot"))
    hx, hy, hw, hh = box(spot("heroRobot"))
    fs = W * 0.36
    fx, fy = hx + hw * 0.8707 - fs * 0.35, hy + hh * 0.5174 - fs / 2
    fl = layer("hero_muzzle_flash").resize((round(fs), round(fs)), Image.LANCZOS)
    img.alpha_composite(fl, (round(fx), round(fy)))
    put(img, "logo_title", spot("logo"))
    d = ImageDraw.Draw(img)
    for n in ("coinCapsule", "settingsButton", "playButton", "navBar"):
        x, y, w, h = box(spot(n))
        d.rounded_rectangle((x, y, x + w, y + h), radius=h / 2 if n != "navBar" else 30, outline=(60, 200, 255), width=4)
    put(img, "coin", spot("coinIcon"))
    put(img, "plus", spot("plusButton"))
    img.convert("RGB").save(out)
    print("home preview", out)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "home_preview.png")
