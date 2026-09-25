"""Copies the verification tree into a small JPEG-only snapshot for refs/ci-verification.

usage: python3 ci/publish_snapshot.py verification /tmp/pub
"""
import os
import shutil
import sys

from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
for base, _, files in os.walk(src):
    rel = os.path.relpath(base, src)
    os.makedirs(os.path.join(dst, rel), exist_ok=True)
    for f in files:
        p = os.path.join(base, f)
        if f.endswith(".png"):
            im = Image.open(p).convert("RGB")
            if im.width > 1080:
                im = im.resize((1080, round(im.height * 1080 / im.width)), Image.LANCZOS)
            im.save(os.path.join(dst, rel, f[:-4] + ".jpg"), quality=88)
        elif f.endswith((".jpg", ".txt")) and os.path.getsize(p) < 8_000_000:
            shutil.copy(p, os.path.join(dst, rel, f))
print("snapshot ready")
