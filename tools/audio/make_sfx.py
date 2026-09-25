"""Synthesises the interim sound effects and music loop into app/src/main/res/raw.

These are placeholders (no audio was supplied); replace the WAVs with production audio
of the same names at any time.
"""
import os
import wave

import numpy as np

SR = 22050
OUT = os.path.join(os.path.dirname(__file__), "..", "..", "app", "src", "main", "res", "raw")
rng = np.random.default_rng(7)


def t(d):
    return np.arange(int(SR * d)) / SR


def env(n, a=0.005, r=0.1, curve=3.0):
    e = np.ones(n)
    na = max(1, int(a * SR))
    e[:na] = np.linspace(0, 1, na)
    nr = max(1, int(r * SR))
    e[-nr:] *= np.linspace(1, 0, nr) ** curve
    return e


def lowpass(x, alpha):
    y = np.zeros_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc += alpha * (v - acc)
        y[i] = acc
    return y


def save(name, x, gain=0.9):
    x = np.asarray(x, dtype=np.float64)
    peak = np.max(np.abs(x)) or 1.0
    x = np.clip(x / peak * gain, -1, 1)
    with wave.open(os.path.join(OUT, name + ".wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype("<i2").tobytes())


def chirp(f0, f1, d, shape="saw"):
    tt = t(d)
    f = np.geomspace(f0, f1, len(tt))
    ph = 2 * np.pi * np.cumsum(f) / SR
    if shape == "saw":
        return 2 * ((ph / (2 * np.pi)) % 1) - 1
    if shape == "square":
        return np.sign(np.sin(ph))
    return np.sin(ph)


# Laser: bright descending zap.
d = 0.2
x = 0.6 * chirp(2400, 380, d, "saw") + 0.4 * chirp(1800, 300, d, "sin")
save("sfx_laser", lowpass(x, 0.5) * env(len(x), 0.002, 0.16, 2))

# Explosion: noise burst + low boom.
d = 0.75
n = rng.standard_normal(int(SR * d))
boom = np.sin(2 * np.pi * np.cumsum(np.geomspace(120, 38, len(n))) / SR)
x = lowpass(n, 0.18) * env(len(n), 0.002, 0.7, 2.5) + 0.8 * boom * env(len(n), 0.002, 0.6, 2)
save("sfx_explosion", x)

# Alert: two-tone warning.
seg = []
for f in (880, 660, 880):
    tt = t(0.13)
    seg.append(np.sign(np.sin(2 * np.pi * f * tt)) * 0.5 * env(len(tt), 0.004, 0.03, 1))
save("sfx_alert", lowpass(np.concatenate(seg), 0.35), 0.8)

# Caught: heavy metal impact + falling tone.
d = 0.6
n = rng.standard_normal(int(SR * d))
x = lowpass(n, 0.25) * env(len(n), 0.001, 0.55, 4) + 0.7 * chirp(300, 60, d, "square") * env(len(n), 0.002, 0.5, 2)
save("sfx_caught", lowpass(x, 0.3))

# Tick.
tt = t(0.05)
save("sfx_tick", np.sin(2 * np.pi * 1300 * tt) * env(len(tt), 0.001, 0.045, 3), 0.7)

# Complete: rising arpeggio.
notes = [523.25, 659.25, 783.99, 1046.5]
x = np.concatenate([np.sin(2 * np.pi * f * t(0.16)) * env(int(0.16 * SR), 0.004, 0.1, 2) for f in notes[:-1]]
                   + [np.sin(2 * np.pi * notes[-1] * t(0.5)) * env(int(0.5 * SR), 0.004, 0.45, 2)])
x = x + 0.3 * np.sign(x) * np.abs(x) ** 3
save("sfx_complete", x, 0.8)

# Fail: descending minor.
notes = [392.0, 311.13, 261.63, 196.0]
x = np.concatenate([chirp(f, f * 0.98, 0.2, "square") * env(int(0.2 * SR), 0.004, 0.15, 2) for f in notes])
save("sfx_fail", lowpass(x, 0.25), 0.7)

# Overheat: hiss.
d = 0.5
n = rng.standard_normal(int(SR * d))
hp = n - lowpass(n, 0.3)
save("sfx_overheat", hp * env(len(n), 0.02, 0.4, 2), 0.6)

# UI click.
tt = t(0.06)
save("sfx_click", (np.sin(2 * np.pi * 900 * tt) + 0.5 * np.sin(2 * np.pi * 1800 * tt)) * env(len(tt), 0.001, 0.05, 4), 0.7)

# Cover thud.
tt = t(0.16)
x = np.sin(2 * np.pi * np.cumsum(np.geomspace(160, 60, len(tt))) / SR) * env(len(tt), 0.001, 0.15, 3)
save("sfx_cover", x, 0.7)

# Clank (shot bouncing off the robot).
tt = t(0.35)
x = sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * k) for f, k in ((1210, 9), (2390, 14), (3170, 18), (4580, 25)))
save("sfx_clank", x * env(len(tt), 0.001, 0.05, 1), 0.7)

# Music: 16 s synth loop (A minor, 110 bpm).
bpm = 110
beat = 60 / bpm
bars = 8
dur = bars * 4 * beat
tt = t(dur)
x = np.zeros(len(tt))
prog = [(220.0, "m"), (174.61, "M"), (130.81, "M"), (196.0, "M")]
for bar in range(bars):
    root, q = prog[bar % 4]
    third = root * (2 ** (3 / 12) if q == "m" else 2 ** (4 / 12))
    fifth = root * 2 ** (7 / 12)
    start = int(bar * 4 * beat * SR)
    n = int(4 * beat * SR)
    seg = t(4 * beat)
    pad = sum(np.sin(2 * np.pi * f * seg + 0.3 * np.sin(2 * np.pi * 0.5 * seg)) for f in (root, third, fifth, root * 2))
    x[start:start + n] += 0.12 * pad * env(n, 0.3, 0.3, 1)
    for s in range(8):
        f = [root / 2, root / 2, fifth / 2, root / 2, third / 2, root / 2, fifth / 2, root][s]
        a = int(start + s * beat / 2 * SR)
        m = int(beat / 2 * SR)
        st = t(beat / 2)
        saw = 2 * ((f * st) % 1) - 1
        x[a:a + m] += 0.28 * lowpass(saw, 0.08) * env(m, 0.005, 0.15, 2)
    for s in range(4):
        a = int(start + s * beat * SR)
        m = int(0.12 * SR)
        k = np.sin(2 * np.pi * np.cumsum(np.geomspace(140, 45, m)) / SR) * env(m, 0.001, 0.11, 3)
        x[a:a + m] += 0.5 * k
        if s % 2 == 1:
            hn = rng.standard_normal(int(0.1 * SR))
            x[a:a + len(hn)] += 0.12 * (hn - lowpass(hn, 0.4)) * env(len(hn), 0.001, 0.09, 3)
save("music_loop", x, 0.7)
print("ok")
