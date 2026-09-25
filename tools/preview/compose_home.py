"""Local preview of the Home screen (mirrors HomeScreen.kt + LayoutSpec.Home) on a
1080x2400 screen with a 63 px status bar and a 48 px gesture bar, drawn with the app's
bundled fonts, then placed next to reference 2371 with a 50% overlay.

The HUD shapes (coin capsule, settings, PLAY NOW, nav bar) are simplified; the point is
where the art layers and texts land relative to the reference.

usage: python3 tools/preview/compose_home.py out.png [--no-ref]
"""
import json
import os
import re
import sys

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ART = os.path.join(ROOT, "art")
FONTS = os.path.join(ROOT, "app/src/main/res/font")
SW, SH, TOP, BOT = 1080, 2400, 63, 48
W, H = SW, SH - TOP - BOT
meta = json.load(open(os.path.join(ART, "_layers.json")))
spec = open(os.path.join(ROOT, "app/src/main/java/com/blastcollect/game/ui/LayoutSpec.kt")).read()
home = spec[spec.index("object Home"):]


def num(name):
    return float(re.search(r"\b" + name + r" = ([\d.]+)f", home).group(1))


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


def font(file, size, weight=None):
    f = ImageFont.truetype(os.path.join(FONTS, file), round(size))
    if weight is not None:
        try:
            f.set_variation_by_axes([weight])
        except Exception:
            pass
    return f


def outlined(d, text, cx, cy, f, fill, outline, ow):
    bb = d.textbbox((0, 0), text, font=f, anchor="mm")
    d.text((cx, cy), text, font=f, fill=fill, anchor="mm", stroke_width=round(ow), stroke_fill=outline)
    return bb


def render():
    img = Image.new("RGBA", (SW, SH), (7, 11, 28, 255))
    bg = layer("bg_home")
    k = max(SW / bg.width, SH / bg.height)
    bgr = bg.resize((round(bg.width * k), round(bg.height * k)), Image.LANCZOS)
    img.alpha_composite(bgr, ((SW - bgr.width) // 2, round((SH - bgr.height) * 0.45)))
    for cx, cy, s, name in re.findall(r'Sparkle\(([\d.]+)f, ([\d.]+)f, ([\d.]+)f, "(\w+)"\)', home):
        s = float(s) * 0.92
        put(img, name, (float(cx), float(cy), s, s))
    for n, c in (("creatureBlue", "creature_blue"), ("creatureYellow", "creature_yellow"), ("creatureGreen", "creature_green"),
                 ("creatureRed", "creature_red"), ("creaturePurple", "creature_purple"), ("creatureBlueSmall", "creature_blue")):
        put(img, c, spot(n))
    hs = spot("heroRobot")
    put(img, "hero_robot", hs)
    hx, hy, hw, hh = box(hs)
    fs = W * num("heroMuzzleSize")
    fx, fy = hx + hw * num("heroMuzzleU") - fs * 0.35, hy + hh * num("heroMuzzleV") - fs / 2
    fl = layer("hero_muzzle_flash").resize((round(fs), round(fs)), Image.LANCZOS)
    img.alpha_composite(fl, (round(fx), round(fy)))
    put(img, "logo_title", spot("logo"))

    d = ImageDraw.Draw(img)
    # Tagline.
    tf = font("barlow_condensed_extrabold.ttf", W * num("taglineSize"))
    cys = [float(v) for v in re.search(r"taglineCy = floatArrayOf\(([^)]*)\)", home).group(1).replace("f", "").split(",")]
    for line, cy in zip(("A FAST-PACED", "SHOOT, COLLECT, EARN", "ADVENTURE!"), cys):
        outlined(d, line, W / 2, TOP + H * cy, tf, (255, 255, 255), (10, 11, 36), W * 0.012)
    # PLAY NOW.
    x, y, w, h = box(spot("playButton"))
    d.rounded_rectangle((x, y, x + w, y + h), radius=h / 2, fill=(10, 62, 16))
    d.rounded_rectangle((x + h * 0.055, y + h * 0.055, x + w - h * 0.055, y + h - h * 0.14), radius=h / 2, fill=(47, 209, 46))
    pf = ImageFont.truetype(os.path.join(FONTS, "lilita_one.ttf"), round(W * num("playTextSize")))
    outlined(d, "PLAY NOW", x + w / 2, y + h * 0.47 + W * num("playTextSize") * 0.07, pf, (6, 48, 11), (6, 48, 11), W * num("playTextSize") * 0.15)
    outlined(d, "PLAY NOW", x + w / 2, y + h * 0.47, pf, (255, 255, 255), (10, 66, 18), W * num("playTextSize") * 0.15)
    # Coin capsule, settings, nav.
    x, y, w, h = box(spot("coinCapsule"))
    d.rounded_rectangle((x, y, x + w, y + h), radius=h / 2, fill=(20, 32, 70), outline=(58, 111, 184), width=3)
    put(img, "coin", spot("coinIcon"))
    put(img, "plus", spot("plusButton"))
    d.text((W * 0.583, TOP + H * spot("coinCapsule")[1]), "2,350", font=font("fredoka_variable.ttf", W * 0.058, 600), fill=(255, 255, 255), anchor="lm")
    x, y, w, h = box(spot("settingsButton"))
    d.rounded_rectangle((x, y, x + w, y + h), radius=h * 0.22, fill=(18, 32, 78), outline=(56, 168, 255), width=5)
    gs = spot("settingsButton")
    put(img, "gear", (gs[0], gs[1], gs[2] * 0.6, gs[3] * 0.6))
    x, y, w, h = box(spot("navBar"))
    d.rounded_rectangle((x, y, x + w, y + h), radius=h * 0.2, fill=(10, 18, 48), outline=(43, 111, 196), width=4)
    iw = w / 4
    lf = font("fredoka_variable.ttf", W * num("navLabelSize"), 600)
    for i, (lab, icon) in enumerate((("Home", "nav_home"), ("Missions", "nav_missions"), ("Shop", "nav_shop"), ("Profile", "nav_profile"))):
        icx = x + iw * (i + 0.5)
        isz = W * num("navIconSize")
        ic = layer(icon).resize((round(isz), round(isz)), Image.LANCZOS)
        img.alpha_composite(ic, (round(icx - isz / 2), round(y + h * num("navIconCy") - isz / 2)))
        d.text((icx, y + h * num("navLabelCy")), lab, font=lf, fill=(189, 246, 255) if i == 0 else (215, 224, 240), anchor="mm")
    return img


def main(out, with_ref=True):
    img = render()
    if not with_ref:
        img.convert("RGB").save(out)
        return
    ref = Image.open(os.path.join(ROOT, "reference/2371.png")).convert("RGBA").crop((27, 34, 830, 1804))
    refs = Image.new("RGBA", (SW, SH), (0, 0, 0, 255))
    refs.alpha_composite(ref.resize((SW, 2404), Image.LANCZOS), (0, -4))
    over = Image.blend(refs, img, 0.5)
    c = Image.new("RGB", (SW * 3 + 40, SH), (0, 0, 0))
    for i, p in enumerate((refs, img, over)):
        c.paste(p.convert("RGB"), (i * (SW + 20), 0))
    c.save(out)
    print("home preview", out)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "home_preview.png", "--no-ref" not in sys.argv)
