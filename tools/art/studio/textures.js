// Procedural canvas textures (wood planks, painted metal, floor tiles, neon signs).
import { THREE, canvas2d, rng } from './core.js';

function tex(c, repeatX = 1, repeatY = 1) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.anisotropy = 8;
  return t;
}

/** Warm crate planks with grain, darker gaps and a stencil mark. */
export function woodTexture({ seed = 1, base = [196, 128, 62], planks = 5, stencil = true } = {}) {
  const r = rng(seed);
  const c = canvas2d(512, 512);
  const x = c.getContext('2d');
  const ph = 512 / planks;
  for (let i = 0; i < planks; i++) {
    const k = 0.82 + r() * 0.3;
    x.fillStyle = `rgb(${base[0] * k | 0},${base[1] * k | 0},${base[2] * k | 0})`;
    x.fillRect(0, i * ph, 512, ph);
    for (let g = 0; g < 26; g++) {
      const y = i * ph + r() * ph;
      x.strokeStyle = `rgba(${60 + r() * 40 | 0},${30 + r() * 20 | 0},10,${0.12 + r() * 0.18})`;
      x.lineWidth = 0.6 + r() * 1.6;
      x.beginPath();
      x.moveTo(0, y);
      for (let s = 0; s <= 8; s++) x.lineTo((s * 512) / 8, y + (r() - 0.5) * 6);
      x.stroke();
    }
    x.fillStyle = 'rgba(30,14,4,0.75)';
    x.fillRect(0, i * ph, 512, 4);
    x.fillStyle = 'rgba(255,220,170,0.12)';
    x.fillRect(0, i * ph + 4, 512, 3);
  }
  if (stencil) {
    x.save();
    x.translate(256, 256);
    x.globalAlpha = 0.35;
    x.strokeStyle = '#2a1406';
    x.lineWidth = 16;
    x.beginPath();
    x.arc(0, 0, 70, 0, Math.PI * 2);
    x.stroke();
    x.beginPath();
    x.moveTo(-40, -30);
    x.lineTo(40, 40);
    x.moveTo(40, -30);
    x.lineTo(-40, 40);
    x.stroke();
    x.restore();
  }
  return tex(c);
}

/** Painted, scuffed metal panel. */
export function paintedMetal({ seed = 3, base = [52, 86, 140], scuffs = 60 } = {}) {
  const r = rng(seed);
  const c = canvas2d(256, 256);
  const x = c.getContext('2d');
  x.fillStyle = `rgb(${base.join(',')})`;
  x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < scuffs; i++) {
    x.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '0,0,0'},${0.03 + r() * 0.06})`;
    x.fillRect(r() * 256, r() * 256, 4 + r() * 40, 1 + r() * 4);
  }
  // Ribs.
  for (let i = 1; i < 4; i++) {
    x.fillStyle = 'rgba(0,0,0,0.22)';
    x.fillRect(0, i * 64 - 3, 256, 5);
    x.fillStyle = 'rgba(255,255,255,0.08)';
    x.fillRect(0, i * 64 + 2, 256, 3);
  }
  return tex(c);
}

/** Glossy slate floor tiles with hazard lanes; one texel row = 0.25 m. */
export function floorTexture({ seed = 7, tiles = 8 } = {}) {
  const r = rng(seed);
  const N = 1024;
  const c = canvas2d(N, N);
  const x = c.getContext('2d');
  const s = N / tiles;
  for (let i = 0; i < tiles; i++) {
    for (let j = 0; j < tiles; j++) {
      const k = 0.78 + r() * 0.35;
      const tint = r();
      x.fillStyle = `rgb(${(58 + tint * 20) * k | 0},${(60 + tint * 10) * k | 0},${(104 + tint * 30) * k | 0})`;
      x.fillRect(i * s, j * s, s, s);
      // Subtle mottling.
      for (let m = 0; m < 30; m++) {
        x.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '0,0,0'},${0.02 + r() * 0.04})`;
        const w = 8 + r() * 50;
        x.beginPath();
        x.ellipse(i * s + r() * s, j * s + r() * s, w, w * (0.3 + r() * 0.7), r() * 3, 0, Math.PI * 2);
        x.fill();
      }
      // Bevel.
      x.fillStyle = 'rgba(255,255,255,0.07)';
      x.fillRect(i * s, j * s, s, 3);
      x.fillStyle = 'rgba(0,0,0,0.25)';
      x.fillRect(i * s, j * s + s - 3, s, 3);
    }
  }
  x.strokeStyle = 'rgba(6,6,16,0.95)';
  x.lineWidth = 7;
  for (let i = 0; i <= tiles; i++) {
    x.beginPath();
    x.moveTo(i * s, 0);
    x.lineTo(i * s, N);
    x.stroke();
    x.beginPath();
    x.moveTo(0, i * s);
    x.lineTo(N, i * s);
    x.stroke();
  }
  return tex(c);
}

/** Yellow/black hazard stripe strip. */
export function hazardTexture() {
  const c = canvas2d(256, 64);
  const x = c.getContext('2d');
  x.fillStyle = '#e8b420';
  x.fillRect(0, 0, 256, 64);
  x.fillStyle = '#1a1712';
  for (let i = -2; i < 10; i++) {
    x.beginPath();
    x.moveTo(i * 40, 64);
    x.lineTo(i * 40 + 20, 64);
    x.lineTo(i * 40 + 44, 0);
    x.lineTo(i * 40 + 24, 0);
    x.fill();
  }
  return tex(c);
}

/** Neon sign face: glowing text on a dark board. Returns {map, emissiveMap}. */
export function signTexture(text, { color = '#ff5a2a', board = '#2a1020', w = 1024, h = 320, font = '900 210px "Lilita One"' } = {}) {
  const c = canvas2d(w, h);
  const x = c.getContext('2d');
  x.fillStyle = board;
  x.fillRect(0, 0, w, h);
  x.strokeStyle = color;
  x.lineWidth = 10;
  x.strokeRect(14, 14, w - 28, h - 28);
  x.font = font;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.shadowColor = color;
  x.shadowBlur = 30;
  x.fillStyle = color;
  x.fillText(text, w / 2, h / 2 + 10);
  x.shadowBlur = 0;
  x.fillStyle = 'rgba(255,240,220,0.85)';
  x.font = font.replace(/\d+px/, (m) => `${parseInt(m) * 0.96 | 0}px`);
  x.fillText(text, w / 2, h / 2 + 10);
  const t = tex(c);
  return t;
}

/** Window grid glowing blue (for walls). */
export function windowTexture({ color = [70, 150, 255], cols = 4, rows = 3, seed = 5 } = {}) {
  const r = rng(seed);
  const c = canvas2d(512, 384);
  const x = c.getContext('2d');
  x.fillStyle = '#0a0d1c';
  x.fillRect(0, 0, 512, 384);
  const cw = 512 / cols;
  const rh = 384 / rows;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const k = 0.55 + r() * 0.5;
      const g = x.createLinearGradient(0, j * rh, 0, (j + 1) * rh);
      g.addColorStop(0, `rgb(${color[0] * k | 0},${color[1] * k | 0},${color[2] * k | 0})`);
      g.addColorStop(1, `rgb(${color[0] * k * 0.5 | 0},${color[1] * k * 0.5 | 0},${color[2] * k * 0.6 | 0})`);
      x.fillStyle = g;
      x.fillRect(i * cw + 8, j * rh + 8, cw - 16, rh - 16);
    }
  }
  return tex(c);
}
