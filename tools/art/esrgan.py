"""4x upscaler for supplied low-resolution art (Real-ESRGAN, RRDBNet x4 anime 6B weights).

The network is defined inline so only torch is needed. Weights:
https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.2.4/RealESRGAN_x4plus_anime_6B.pth
(pass the path with ESRGAN_WEIGHTS or put the file next to this script).

Transparent sprites: colour is bled into the transparent area before upscaling (no dark
fringes) and the alpha channel is upscaled through the same network as a grey image.
"""
import os

import numpy as np
import torch
from PIL import Image
from scipy.ndimage import gaussian_filter
from torch import nn
from torch.nn import functional as F


class RDB(nn.Module):
    def __init__(self, nf=64, gc=32):
        super().__init__()
        self.conv1 = nn.Conv2d(nf, gc, 3, 1, 1)
        self.conv2 = nn.Conv2d(nf + gc, gc, 3, 1, 1)
        self.conv3 = nn.Conv2d(nf + 2 * gc, gc, 3, 1, 1)
        self.conv4 = nn.Conv2d(nf + 3 * gc, gc, 3, 1, 1)
        self.conv5 = nn.Conv2d(nf + 4 * gc, nf, 3, 1, 1)
        self.lrelu = nn.LeakyReLU(0.2, True)

    def forward(self, x):
        x1 = self.lrelu(self.conv1(x))
        x2 = self.lrelu(self.conv2(torch.cat((x, x1), 1)))
        x3 = self.lrelu(self.conv3(torch.cat((x, x1, x2), 1)))
        x4 = self.lrelu(self.conv4(torch.cat((x, x1, x2, x3), 1)))
        x5 = self.conv5(torch.cat((x, x1, x2, x3, x4), 1))
        return x5 * 0.2 + x


class RRDB(nn.Module):
    def __init__(self, nf=64, gc=32):
        super().__init__()
        self.rdb1, self.rdb2, self.rdb3 = RDB(nf, gc), RDB(nf, gc), RDB(nf, gc)

    def forward(self, x):
        return self.rdb3(self.rdb2(self.rdb1(x))) * 0.2 + x


class RRDBNet(nn.Module):
    def __init__(self, nb=6, nf=64, gc=32):
        super().__init__()
        self.conv_first = nn.Conv2d(3, nf, 3, 1, 1)
        self.body = nn.Sequential(*[RRDB(nf, gc) for _ in range(nb)])
        self.conv_body = nn.Conv2d(nf, nf, 3, 1, 1)
        self.conv_up1 = nn.Conv2d(nf, nf, 3, 1, 1)
        self.conv_up2 = nn.Conv2d(nf, nf, 3, 1, 1)
        self.conv_hr = nn.Conv2d(nf, nf, 3, 1, 1)
        self.conv_last = nn.Conv2d(nf, 3, 3, 1, 1)
        self.lrelu = nn.LeakyReLU(0.2, True)

    def forward(self, x):
        feat = self.conv_first(x)
        feat = feat + self.conv_body(self.body(feat))
        feat = self.lrelu(self.conv_up1(F.interpolate(feat, scale_factor=2, mode="nearest")))
        feat = self.lrelu(self.conv_up2(F.interpolate(feat, scale_factor=2, mode="nearest")))
        return self.conv_last(self.lrelu(self.conv_hr(feat)))


_model = None


def model():
    global _model
    if _model is None:
        path = os.environ.get("ESRGAN_WEIGHTS", os.path.join(os.path.dirname(__file__), "RealESRGAN_x4plus_anime_6B.pth"))
        state = torch.load(path, map_location="cpu", weights_only=True)
        state = state.get("params_ema", state.get("params", state))
        m = RRDBNet()
        m.load_state_dict(state, strict=True)
        m.eval()
        _model = m
    return _model


@torch.no_grad()
def upscale_rgb(rgb):
    """rgb: HxWx3 uint8 → (4H)x(4W)x3 uint8."""
    x = torch.from_numpy(rgb.astype(np.float32) / 255.0).permute(2, 0, 1)[None]
    y = model()(x).clamp(0, 1)[0].permute(1, 2, 0).numpy()
    return (y * 255.0 + 0.5).astype(np.uint8)


def bleed(im):
    """Spread edge colours into transparent pixels so upscaling adds no dark fringe."""
    a = np.asarray(im.split()[3]).astype(np.float32) / 255.0
    rgb = np.asarray(im.convert("RGB")).astype(np.float32)
    out = rgb.copy()
    acc_c = rgb * a[..., None]
    acc_a = a.copy()
    for radius in (2, 4, 8, 16, 32):
        c = np.stack([gaussian_filter(acc_c[..., i], radius) for i in range(3)], -1)
        w = gaussian_filter(acc_a, radius)
        fill = (a < 0.99) & (w > 1e-4)
        out[fill] = (c[fill] / w[fill, None]) * (1 - a[fill, None]) + rgb[fill] * a[fill, None]
    return np.clip(out, 0, 255).astype(np.uint8)


def upscale(im):
    """PIL image (RGB or RGBA) → 4x PIL image of the same mode."""
    if im.mode != "RGBA":
        return Image.fromarray(upscale_rgb(np.asarray(im.convert("RGB"))))
    rgb = upscale_rgb(bleed(im))
    a = np.asarray(im.split()[3])
    a4 = upscale_rgb(np.stack([a, a, a], -1)).mean(-1).astype(np.uint8)
    return Image.fromarray(np.dstack([rgb, a4]), "RGBA")
