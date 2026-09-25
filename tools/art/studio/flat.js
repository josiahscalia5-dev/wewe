// 2D-painted layers (effects, icons, logo) drawn on canvas with gradients and glows.
import { canvas2d, rng } from './core.js';

function star(ctx, cx, cy, points, outer, inner, rot = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = rot + (i * Math.PI) / points;
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  ctx.closePath();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function radial(ctx, x, y, r, stops) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

// ---------------------------------------------------------------- effects

/** Laser bolt drawn along +x: faint tail on the left, white-hot head on the right. */
export function laserBolt() {
  const W = 640, H = 96;
  const c = canvas2d(W, H);
  const x = c.getContext('2d');
  const body = x.createLinearGradient(0, 0, W, 0);
  body.addColorStop(0, 'rgba(255,60,160,0)');
  body.addColorStop(0.55, 'rgba(255,110,120,0.55)');
  body.addColorStop(1, 'rgba(255,190,90,0.95)');
  x.fillStyle = body;
  x.filter = 'blur(10px)';
  roundRect(x, 10, H / 2 - 22, W - 20, 44, 22);
  x.fill();
  x.filter = 'blur(3px)';
  const core = x.createLinearGradient(0, 0, W, 0);
  core.addColorStop(0, 'rgba(255,230,200,0)');
  core.addColorStop(0.5, 'rgba(255,240,210,0.8)');
  core.addColorStop(1, 'rgba(255,255,245,1)');
  x.fillStyle = core;
  roundRect(x, 30, H / 2 - 7, W - 50, 14, 7);
  x.fill();
  x.filter = 'none';
  x.fillStyle = radial(x, W - 36, H / 2, 40, [[0, 'rgba(255,255,255,1)'], [0.4, 'rgba(255,220,150,0.8)'], [1, 'rgba(255,120,60,0)']]);
  x.fillRect(W - 80, 0, 80, H);
  return c;
}

export function impactSpark() {
  const S = 256, c = canvas2d(S, S), x = c.getContext('2d');
  const r = rng(5);
  x.translate(S / 2, S / 2);
  x.fillStyle = radial(x, 0, 0, S * 0.45, [[0, 'rgba(255,255,240,1)'], [0.2, 'rgba(255,210,120,0.9)'], [0.5, 'rgba(255,90,60,0.35)'], [1, 'rgba(255,40,80,0)']]);
  x.fillRect(-S / 2, -S / 2, S, S);
  x.strokeStyle = 'rgba(255,240,200,0.95)';
  x.lineCap = 'round';
  for (let i = 0; i < 14; i++) {
    const a = r() * Math.PI * 2;
    const l = 40 + r() * 70;
    x.lineWidth = 2 + r() * 4;
    x.beginPath();
    x.moveTo(Math.cos(a) * 12, Math.sin(a) * 12);
    x.lineTo(Math.cos(a) * l, Math.sin(a) * l);
    x.stroke();
  }
  return c;
}

/** Muzzle flash: core at 35% from the left, flame spikes pointing along +x. The hero
 *  version (reference 2371) is a big yellow starburst fanning out to the right. */
export function muzzleFlash({ size = 256, hero = false } = {}) {
  const S = size, c = canvas2d(S, S), x = c.getContext('2d');
  const cx = S * 0.35, cy = S / 2;
  x.fillStyle = radial(x, cx, cy, S * 0.5, hero
    ? [[0, 'rgba(255,255,235,1)'], [0.16, 'rgba(255,236,120,0.95)'], [0.4, 'rgba(255,170,40,0.45)'], [1, 'rgba(255,110,20,0)']]
    : [[0, 'rgba(255,255,230,1)'], [0.25, 'rgba(255,220,90,0.9)'], [0.55, 'rgba(255,140,40,0.4)'], [1, 'rgba(255,90,20,0)']]);
  x.fillRect(0, 0, S, S);
  x.save();
  x.translate(cx, cy);
  const r = rng(hero ? 2371 : 3);
  const spikes = hero
    ? [[0, 0.64, 0.05], [0.16, 0.56, 0.035], [-0.16, 0.54, 0.035], [0.34, 0.5, 0.03], [-0.34, 0.5, 0.03], [0.55, 0.42, 0.028],
      [-0.55, 0.4, 0.028], [0.8, 0.34, 0.024], [-0.8, 0.32, 0.024], [1.2, 0.26, 0.02], [-1.2, 0.26, 0.02], [1.57, 0.3, 0.022],
      [-1.57, 0.3, 0.022], [2.3, 0.14, 0.02], [-2.3, 0.14, 0.02], [Math.PI, 0.12, 0.03]]
    : [[0, 0.6, 0.12], [0.45, 0.36, 0.08], [-0.45, 0.36, 0.08], [1.1, 0.24, 0.06], [-1.1, 0.24, 0.06], [Math.PI, 0.18, 0.06]];
  x.globalCompositeOperation = 'lighter';
  for (const [a, len, w] of spikes) {
    x.save();
    x.rotate(a + (hero ? (r() - 0.5) * 0.06 : 0));
    const g = x.createLinearGradient(0, 0, S * len, 0);
    g.addColorStop(0, 'rgba(255,255,240,1)');
    g.addColorStop(0.35, 'rgba(255,230,110,0.95)');
    g.addColorStop(0.75, 'rgba(255,170,40,0.55)');
    g.addColorStop(1, 'rgba(255,130,30,0)');
    x.fillStyle = g;
    x.beginPath();
    x.moveTo(0, -S * w);
    x.quadraticCurveTo(S * len * 0.3, -S * w * 0.35, S * len, 0);
    x.quadraticCurveTo(S * len * 0.3, S * w * 0.35, 0, S * w);
    x.closePath();
    x.fill();
    x.restore();
  }
  x.globalCompositeOperation = 'source-over';
  x.fillStyle = radial(x, 0, 0, S * (hero ? 0.1 : 0.12), [[0, 'rgba(255,255,255,1)'], [0.6, 'rgba(255,255,230,0.9)'], [1, 'rgba(255,255,220,0)']]);
  x.fillRect(-S * 0.2, -S * 0.2, S * 0.4, S * 0.4);
  x.restore();
  return c;
}

export function glow(color) {
  const S = 128, c = canvas2d(S, S), x = c.getContext('2d');
  x.fillStyle = radial(x, S / 2, S / 2, S / 2, [[0, `rgba(${color},1)`], [0.35, `rgba(${color},0.55)`], [1, `rgba(${color},0)`]]);
  x.fillRect(0, 0, S, S);
  return c;
}

/** Drone explosion frame i of n on the drone canvas (800x800, centre = drone). */
export function explosion(i, n = 8) {
  const S = 800, c = canvas2d(S, S), x = c.getContext('2d');
  const t = (i + 0.5) / n;
  const r = rng(77);
  x.translate(S / 2, S / 2);
  // Smoke (later frames).
  for (let k = 0; k < 9; k++) {
    const a = r() * Math.PI * 2, d = 60 + r() * 120 * t;
    const rad = (70 + r() * 60) * (0.4 + t);
    const alpha = Math.max(0, 0.55 * Math.sin(Math.PI * Math.min(1, t * 1.3)) * (t > 0.25 ? 1 : t * 4));
    x.fillStyle = radial(x, Math.cos(a) * d, Math.sin(a) * d - t * 40, rad, [[0, `rgba(60,40,70,${alpha})`], [1, 'rgba(40,30,60,0)']]);
    x.fillRect(-S / 2, -S / 2, S, S);
  }
  // Fireball.
  const fr = 60 + 260 * Math.sqrt(t);
  const fa = Math.max(0, 1 - t * 1.15);
  x.fillStyle = radial(x, 0, 0, fr, [[0, `rgba(255,255,230,${fa})`], [0.3, `rgba(255,210,90,${fa})`], [0.6, `rgba(255,90,30,${fa * 0.85})`], [1, 'rgba(200,20,40,0)']]);
  x.fillRect(-S / 2, -S / 2, S, S);
  // Shock ring.
  if (t < 0.7) {
    x.strokeStyle = `rgba(255,200,160,${0.8 * (1 - t / 0.7)})`;
    x.lineWidth = 14 * (1 - t);
    x.beginPath();
    x.arc(0, 0, 80 + 300 * t, 0, Math.PI * 2);
    x.stroke();
  }
  // Debris: red shell pieces and dark bits flying out.
  for (let k = 0; k < 16; k++) {
    const a = r() * Math.PI * 2, sp = 120 + r() * 240;
    const d = sp * t;
    const px = Math.cos(a) * d, py = Math.sin(a) * d + 90 * t * t;
    const sz = 10 + r() * 22;
    x.save();
    x.translate(px, py);
    x.rotate(r() * 6 + t * 8);
    x.globalAlpha = Math.max(0, 1 - t * 0.9);
    x.fillStyle = k % 3 === 0 ? '#23252c' : k % 3 === 1 ? '#b3141c' : '#ff5a24';
    x.beginPath();
    x.moveTo(-sz, -sz * 0.4);
    x.lineTo(sz * 0.8, -sz * 0.6);
    x.lineTo(sz * 0.5, sz * 0.6);
    x.lineTo(-sz * 0.6, sz * 0.5);
    x.closePath();
    x.fill();
    x.restore();
  }
  // Sparks.
  x.strokeStyle = `rgba(255,230,160,${Math.max(0, 1 - t)})`;
  x.lineCap = 'round';
  for (let k = 0; k < 20; k++) {
    const a = r() * Math.PI * 2, d0 = 40 + 320 * t, d1 = d0 + 30 + r() * 40;
    x.lineWidth = 3 + r() * 3;
    x.beginPath();
    x.moveTo(Math.cos(a) * d0, Math.sin(a) * d0);
    x.lineTo(Math.cos(a) * d1, Math.sin(a) * d1);
    x.stroke();
  }
  return c;
}

/** Reference 2371 sparkle: 4-point star with concave arms, white-hot core, coloured glow. */
export const SPARKLE_COLORS = {
  yellow: ['255,214,60', '#fff6b8', '#ffc41a'],
  orange: ['255,120,40', '#ffd0a0', '#ff7a1c'],
  cyan: ['40,210,255', '#d8faff', '#26c8ff'],
  green: ['60,255,120', '#dcffe0', '#34e070'],
  pink: ['255,80,200', '#ffd6f4', '#ff4ac8'],
};
export function sparkle(color = 'yellow') {
  const [glow, light, deep] = SPARKLE_COLORS[color];
  const S = 256, c = canvas2d(S, S), x = c.getContext('2d');
  x.fillStyle = radial(x, S / 2, S / 2, S * 0.42, [[0, `rgba(${glow},0.75)`], [0.3, `rgba(${glow},0.25)`], [1, `rgba(${glow},0)`]]);
  x.fillRect(0, 0, S, S);
  x.save();
  x.translate(S / 2, S / 2);
  // Concave 4-point star: long vertical arms, slightly shorter horizontal arms.
  const arm = (len, wid) => {
    x.beginPath();
    x.moveTo(0, -len);
    x.quadraticCurveTo(wid * 0.18, -wid * 0.18, len * 0.82, 0);
    x.quadraticCurveTo(wid * 0.18, wid * 0.18, 0, len);
    x.quadraticCurveTo(-wid * 0.18, wid * 0.18, -len * 0.82, 0);
    x.quadraticCurveTo(-wid * 0.18, -wid * 0.18, 0, -len);
    x.closePath();
  };
  x.shadowColor = `rgba(${glow},1)`;
  x.shadowBlur = 18;
  const g = x.createRadialGradient(0, 0, 0, 0, 0, S * 0.46);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.18, light);
  g.addColorStop(0.6, deep);
  g.addColorStop(1, deep);
  x.fillStyle = g;
  arm(S * 0.46, S * 0.46);
  x.fill();
  x.shadowBlur = 0;
  x.fillStyle = radial(x, 0, 0, S * 0.1, [[0, 'rgba(255,255,255,1)'], [1, 'rgba(255,255,255,0)']]);
  x.fillRect(-S * 0.1, -S * 0.1, S * 0.2, S * 0.2);
  x.restore();
  return c;
}

// ---------------------------------------------------------------- coins & icons

export function coin({ symbol = 'star', S = 512 } = {}) {
  const c = canvas2d(S, S), x = c.getContext('2d');
  const cx = S / 2, cy = S / 2, R = S * 0.46;
  // Rim.
  x.fillStyle = x.createLinearGradient(0, cy - R, 0, cy + R);
  const rim = x.createLinearGradient(0, cy - R, 0, cy + R);
  rim.addColorStop(0, '#ffe066');
  rim.addColorStop(0.5, '#f5a414');
  rim.addColorStop(1, '#b8620a');
  x.fillStyle = rim;
  x.beginPath();
  x.arc(cx, cy, R, 0, Math.PI * 2);
  x.fill();
  // Face.
  const face = x.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R * 0.85);
  face.addColorStop(0, '#fff3a0');
  face.addColorStop(0.45, '#ffc524');
  face.addColorStop(1, '#e88a0c');
  x.fillStyle = face;
  x.beginPath();
  x.arc(cx, cy, R * 0.8, 0, Math.PI * 2);
  x.fill();
  x.strokeStyle = 'rgba(160,80,0,0.55)';
  x.lineWidth = S * 0.018;
  x.stroke();
  // Emblem.
  x.save();
  x.shadowColor = 'rgba(140,60,0,0.6)';
  x.shadowOffsetY = S * 0.012;
  x.shadowBlur = S * 0.01;
  if (symbol === 'star') {
    const sg = x.createLinearGradient(0, cy - R * 0.5, 0, cy + R * 0.5);
    sg.addColorStop(0, '#fff6b8');
    sg.addColorStop(1, '#ffb41c');
    x.fillStyle = sg;
    star(x, cx, cy + R * 0.03, 5, R * 0.5, R * 0.22);
    x.fill();
    x.strokeStyle = '#d27a08';
    x.lineWidth = S * 0.014;
    x.lineJoin = 'round';
    x.stroke();
  } else {
    x.font = `900 ${S * 0.56}px "Fredoka"`;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillStyle = '#fff4c0';
    x.strokeStyle = '#c96c06';
    x.lineWidth = S * 0.03;
    x.strokeText('$', cx, cy + S * 0.03);
    x.fillText('$', cx, cy + S * 0.03);
  }
  x.restore();
  // Gloss.
  x.fillStyle = 'rgba(255,255,255,0.35)';
  x.beginPath();
  x.ellipse(cx - R * 0.35, cy - R * 0.45, R * 0.3, R * 0.14, -0.6, 0, Math.PI * 2);
  x.fill();
  return c;
}

export function gear(S = 512) {
  const c = canvas2d(S, S), x = c.getContext('2d');
  x.translate(S / 2, S / 2);
  const teeth = 8, R = S * 0.42, r = S * 0.32;
  x.beginPath();
  for (let i = 0; i < teeth; i++) {
    const a0 = (i / teeth) * Math.PI * 2;
    const w = Math.PI / teeth;
    x.lineTo(Math.cos(a0 - w * 0.55) * r, Math.sin(a0 - w * 0.55) * r);
    x.lineTo(Math.cos(a0 - w * 0.35) * R, Math.sin(a0 - w * 0.35) * R);
    x.lineTo(Math.cos(a0 + w * 0.35) * R, Math.sin(a0 + w * 0.35) * R);
    x.lineTo(Math.cos(a0 + w * 0.55) * r, Math.sin(a0 + w * 0.55) * r);
  }
  x.closePath();
  x.arc(0, 0, S * 0.13, 0, Math.PI * 2, true);
  const g = x.createLinearGradient(0, -R, 0, R);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, '#c9d3e6');
  x.fillStyle = g;
  x.shadowColor = 'rgba(0,0,0,0.5)';
  x.shadowOffsetY = S * 0.02;
  x.shadowBlur = S * 0.02;
  x.fill('evenodd');
  return c;
}

export function plusButton(S = 512) {
  const c = canvas2d(S, S), x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, S);
  g.addColorStop(0, '#7cf25a');
  g.addColorStop(0.5, '#2fd12e');
  g.addColorStop(1, '#129a1c');
  x.fillStyle = '#0a4a10';
  roundRect(x, S * 0.02, S * 0.02, S * 0.96, S * 0.96, S * 0.2);
  x.fill();
  x.fillStyle = g;
  roundRect(x, S * 0.06, S * 0.05, S * 0.88, S * 0.86, S * 0.17);
  x.fill();
  x.fillStyle = 'rgba(255,255,255,0.35)';
  roundRect(x, S * 0.14, S * 0.08, S * 0.72, S * 0.24, S * 0.1);
  x.fill();
  x.fillStyle = '#ffffff';
  x.shadowColor = 'rgba(0,60,0,0.6)';
  x.shadowOffsetY = S * 0.02;
  roundRect(x, S * 0.42, S * 0.2, S * 0.16, S * 0.58, S * 0.05);
  x.fill();
  roundRect(x, S * 0.2, S * 0.41, S * 0.6, S * 0.16, S * 0.05);
  x.fill();
  return c;
}

export function navHome(S = 256) {
  const c = canvas2d(S, S), x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, S);
  g.addColorStop(0, '#8ff6ff');
  g.addColorStop(1, '#1fb8e8');
  x.fillStyle = g;
  x.shadowColor = 'rgba(40,220,255,0.8)';
  x.shadowBlur = S * 0.08;
  x.beginPath();
  x.moveTo(S * 0.5, S * 0.1);
  x.lineTo(S * 0.93, S * 0.48);
  x.lineTo(S * 0.82, S * 0.48);
  x.lineTo(S * 0.82, S * 0.9);
  x.lineTo(S * 0.18, S * 0.9);
  x.lineTo(S * 0.18, S * 0.48);
  x.lineTo(S * 0.07, S * 0.48);
  x.closePath();
  x.fill();
  x.shadowBlur = 0;
  x.fillStyle = '#0d5a86';
  roundRect(x, S * 0.41, S * 0.6, S * 0.18, S * 0.3, S * 0.03);
  x.fill();
  return c;
}

export function navMissions(S = 256) {
  const c = canvas2d(S, S), x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, S);
  g.addColorStop(0, '#eef2fa');
  g.addColorStop(1, '#a9b4c8');
  x.fillStyle = g;
  roundRect(x, S * 0.16, S * 0.14, S * 0.68, S * 0.78, S * 0.08);
  x.fill();
  x.fillStyle = '#4a5670';
  roundRect(x, S * 0.34, S * 0.07, S * 0.32, S * 0.14, S * 0.04);
  x.fill();
  x.fillStyle = '#2c3548';
  roundRect(x, S * 0.23, S * 0.27, S * 0.54, S * 0.56, S * 0.05);
  x.fill();
  x.strokeStyle = '#e9eef8';
  x.lineWidth = S * 0.08;
  x.lineCap = 'round';
  x.lineJoin = 'round';
  x.beginPath();
  x.moveTo(S * 0.33, S * 0.56);
  x.lineTo(S * 0.46, S * 0.69);
  x.lineTo(S * 0.68, S * 0.43);
  x.stroke();
  return c;
}

export function navShop(S = 256) {
  const c = canvas2d(S, S), x = c.getContext('2d');
  // Building.
  const b = x.createLinearGradient(0, S * 0.4, 0, S);
  b.addColorStop(0, '#ffe2c4');
  b.addColorStop(1, '#e7a878');
  x.fillStyle = b;
  roundRect(x, S * 0.16, S * 0.42, S * 0.68, S * 0.48, S * 0.04);
  x.fill();
  x.fillStyle = '#3a82d8';
  roundRect(x, S * 0.24, S * 0.52, S * 0.3, S * 0.22, S * 0.03);
  x.fill();
  x.fillStyle = '#8a3a2a';
  roundRect(x, S * 0.6, S * 0.52, S * 0.16, S * 0.38, S * 0.03);
  x.fill();
  // Striped awning.
  const n = 5;
  for (let i = 0; i < n; i++) {
    x.fillStyle = i % 2 === 0 ? '#e8303a' : '#ffffff';
    const x0 = S * 0.1 + (i * S * 0.8) / n;
    x.beginPath();
    x.moveTo(x0 + S * 0.03, S * 0.18);
    x.lineTo(x0 + (S * 0.8) / n + S * 0.03, S * 0.18);
    x.lineTo(x0 + (S * 0.8) / n, S * 0.4);
    x.arc(x0 + (S * 0.8) / n / 2, S * 0.4, (S * 0.8) / n / 2, 0, Math.PI);
    x.closePath();
    x.fill();
  }
  x.fillStyle = '#b81e28';
  roundRect(x, S * 0.1, S * 0.12, S * 0.8, S * 0.08, S * 0.03);
  x.fill();
  return c;
}

export function navProfile(S = 256) {
  const c = canvas2d(S, S), x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, S);
  g.addColorStop(0, '#f2f5fb');
  g.addColorStop(1, '#a3b0c6');
  x.fillStyle = g;
  x.beginPath();
  x.arc(S * 0.5, S * 0.32, S * 0.2, 0, Math.PI * 2);
  x.fill();
  x.beginPath();
  x.moveTo(S * 0.12, S * 0.92);
  x.bezierCurveTo(S * 0.12, S * 0.55, S * 0.88, S * 0.55, S * 0.88, S * 0.92);
  x.closePath();
  x.fill();
  return c;
}

export function stopwatch(S = 256) {
  const c = canvas2d(S, S), x = c.getContext('2d');
  x.translate(S / 2, S * 0.54);
  x.shadowColor = 'rgba(255,40,40,0.9)';
  x.shadowBlur = S * 0.08;
  x.strokeStyle = '#ff3b30';
  x.fillStyle = '#ff3b30';
  x.lineWidth = S * 0.075;
  x.beginPath();
  x.arc(0, 0, S * 0.32, 0, Math.PI * 2);
  x.stroke();
  roundRect(x, -S * 0.08, -S * 0.5, S * 0.16, S * 0.1, S * 0.03);
  x.fill();
  x.lineCap = 'round';
  x.beginPath();
  x.moveTo(S * 0.22, -S * 0.3);
  x.lineTo(S * 0.3, -S * 0.38);
  x.stroke();
  x.lineWidth = S * 0.06;
  x.beginPath();
  x.moveTo(0, 0);
  x.lineTo(0, -S * 0.2);
  x.moveTo(0, 0);
  x.lineTo(S * 0.13, S * 0.06);
  x.stroke();
  x.beginPath();
  x.arc(0, 0, S * 0.04, 0, Math.PI * 2);
  x.fill();
  return c;
}

// ---------------------------------------------------------------- logo

/** "BLAST & COLLECT" title with the crosshair as the O (reference 2371). */
// Logo (reference 2371). The canvas maps straight onto the reference screen:
// x = (sx - LOGO.x0) * K, y = (sy - LOGO.y0) * ASPECT * K, where sx/sy are fractions of
// the screen width/height and ASPECT = 1770 / 803 (reference screen). Letter face boxes
// were measured on the reference by colour segmentation.
export const LOGO = { x0: 0.05, y0: 0.1, w: 0.93, h: 0.23, K: 2150, ASPECT: 1770 / 803 };
const LOGO_LETTERS = [
  // ch, face box x0, x1, y0, y1 (screen fractions), rotation (deg, + = counter-clockwise), set
  ['B', 0.177, 0.324, 0.1384, 0.2181, 7, 'blue'],
  ['L', 0.328, 0.426, 0.1328, 0.2073, 2, 'blue'],
  ['A', 0.431, 0.575, 0.1316, 0.2023, 0, 'blue'],
  ['S', 0.573, 0.694, 0.1311, 0.2028, -1, 'blue'],
  ['T', 0.697, 0.809, 0.1328, 0.2051, -2, 'blue'],
  ['&', 0.786, 0.858, 0.170, 0.213, -10, 'amp'],
  ['C', 0.095, 0.224, 0.2299, 0.3011, 5, 'gold'],
  ['L', 0.433, 0.518, 0.2215, 0.2853, 0, 'gold'],
  ['L', 0.527, 0.606, 0.2198, 0.2819, 0, 'gold'],
  ['E', 0.614, 0.696, 0.2186, 0.2802, 0, 'gold'],
  ['C', 0.700, 0.798, 0.2192, 0.2819, 0, 'gold'],
  ['T', 0.809, 0.899, 0.2226, 0.2853, -1, 'gold'],
];
const LOGO_SETS = {
  blue: { stops: [[0, '#9afcfd'], [0.25, '#45fbfd'], [0.55, '#12dcfe'], [0.8, '#00b2fe'], [1, '#008cff']], ext: ['#0a5ad2', '#0024b8'] },
  gold: { stops: [[0, '#fdf84a'], [0.25, '#fff10a'], [0.5, '#fdd000'], [0.75, '#fda600'], [1, '#fe8601']], ext: ['#e8461e', '#8a200a'] },
  amp: { stops: [[0, '#ffe860'], [0.5, '#ffb814'], [1, '#ff7e08']], ext: ['#d8481a', '#7a1c08'] },
};

export function logo() {
  const { x0, y0, w, h, K, ASPECT } = LOGO;
  const W = Math.round(w * K), H = Math.round(h * ASPECT * K);
  const c = canvas2d(W, H), x = c.getContext('2d');
  const X = (sx) => (sx - x0) * K, Y = (sy) => (sy - y0) * ASPECT * K;
  const DARK = 0.012 * K, RED = 0.008 * K, EXT = 0.0085 * K;
  const fatOf = (ch) => (ch === '&' ? 0.0012 : 0.0055) * K;
  x.lineJoin = 'round';
  x.lineCap = 'round';

  // Each element knows how to trace itself (path + transform); passes paint them in order.
  const letters = LOGO_LETTERS.map(([ch, a, b, t, u, deg, set]) => {
    const fontPx = 400;
    x.font = `${fontPx}px "Lilita One"`;
    const m = x.measureText(ch);
    const gw = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
    const gh = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
    const FAT = fatOf(ch);
    const tw = X(b) - X(a) - FAT * 2, th = Y(u) - Y(t) - FAT * 2;
    const r = (deg * Math.PI) / 180, co = Math.cos(r), si = Math.abs(Math.sin(r));
    const den = co * co - si * si;
    const uw = (tw * co - th * si) / den, uh = (th * co - tw * si) / den;
    return {
      ch, set, fontPx, rot: -r, sx: uw / gw, sy: uh / gh, fat: FAT,
      cx: (X(a) + X(b)) / 2, cy: (Y(t) + Y(u)) / 2,
      ox: -m.actualBoundingBoxLeft - gw / 2 + m.actualBoundingBoxLeft * 2 - m.actualBoundingBoxLeft,
      gx: (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2, gy: (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2,
      gh,
    };
  });
  const withLetter = (L, dx, dy, fn) => {
    x.save();
    x.translate(L.cx + dx, L.cy + dy);
    x.rotate(L.rot);
    x.scale(L.sx, L.sy);
    x.font = `${L.fontPx}px "Lilita One"`;
    x.textAlign = 'left';
    x.textBaseline = 'alphabetic';
    fn(-L.gx, L.gy); // draw position so the glyph's ink box is centred on the origin
    x.restore();
  };
  // Stroke widths must stay constant in canvas pixels although the letter is scaled.
  const strokeIn = (L, px) => px / Math.sqrt(L.sx * L.sy);

  // Crosshair "O".
  const cc = { x: X(0.323), y: Y(0.2625) };
  const ring = { r: 0.084 * K, w: 0.02 * K, t0: 0.058 * K, t1: 0.113 * K, tw: 0.021 * K };
  const inner = { r: 0.031 * K, w: 0.014 * K, t0: 0.018 * K, t1: 0.05 * K, tw: 0.014 * K };
  const crossPath = (grow) => {
    x.save();
    x.translate(cc.x, cc.y);
    x.lineWidth = ring.w + grow * 2;
    x.beginPath();
    x.arc(0, 0, ring.r, 0, Math.PI * 2);
    x.stroke();
    x.lineWidth = ring.tw + grow * 2;
    for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      x.beginPath();
      x.moveTo(ax * ring.t0, ay * ring.t0);
      x.lineTo(ax * ring.t1, ay * ring.t1);
      x.stroke();
    }
    x.restore();
  };
  const reticlePath = (grow) => {
    x.save();
    x.translate(cc.x + 0.0015 * K, cc.y);
    x.lineWidth = inner.w + grow * 2;
    x.beginPath();
    x.arc(0, 0, inner.r, 0, Math.PI * 2);
    x.stroke();
    x.lineWidth = inner.tw + grow * 2;
    for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      x.beginPath();
      x.moveTo(ax * inner.t0, ay * inner.t0);
      x.lineTo(ax * inner.t1, ay * inner.t1);
      x.stroke();
    }
    x.restore();
  };

  // Pass 1+2: red outer outline (with glow) then the near-black outline, around the
  // extruded letters and the crosshair, so both merge into one sticker shape.
  for (const [color, grow, glow] of [['#e8062e', DARK + RED, true], ['#1c0012', DARK, false]]) {
    x.save();
    if (glow) {
      x.shadowColor = 'rgba(255,20,70,0.6)';
      x.shadowBlur = 0.009 * K;
    }
    x.strokeStyle = color;
    x.fillStyle = color;
    for (const L of letters) {
      for (let e = 0; e <= EXT; e += EXT / 4) {
        withLetter(L, 0, e, (px, py) => {
          x.lineWidth = strokeIn(L, (grow + L.fat) * 2);
          x.strokeText(L.ch, px, py);
          x.fillText(L.ch, px, py);
        });
      }
    }
    crossPath(grow + EXT * 0.3);
    x.beginPath();
    x.arc(cc.x, cc.y, ring.r, 0, Math.PI * 2);
    x.fill();
    x.restore();
    if (glow) {
      // Fill the gaps between letters so the backing reads as one plate.
      x.save();
      x.fillStyle = color;
      x.restore();
    }
  }

  // Pass 3: extrusion (darker, below the face).
  for (const L of letters) {
    const set = LOGO_SETS[L.set];
    for (let e = EXT; e > 0; e -= 1.5) {
      withLetter(L, 0, e, (px, py) => {
        const g = x.createLinearGradient(0, py - L.gh, 0, py);
        g.addColorStop(0, set.ext[0]);
        g.addColorStop(1, set.ext[1]);
        x.fillStyle = g;
        x.strokeStyle = g;
        x.lineWidth = strokeIn(L, L.fat * 2);
        x.strokeText(L.ch, px, py);
        x.fillText(L.ch, px, py);
      });
    }
  }
  // Crosshair extrusion + outline for the orange reticle.
  x.save();
  x.strokeStyle = '#0a3ea8';
  x.translate(0, EXT * 0.6);
  crossPath(0);
  x.restore();

  // Pass 4: faces — white top edge, then the gradient face nudged down.
  for (const L of letters) {
    const set = LOGO_SETS[L.set];
    withLetter(L, 0, 0, (px, py) => {
      x.fillStyle = '#fdfef6';
      x.strokeStyle = '#fdfef6';
      x.lineWidth = strokeIn(L, L.fat * 2);
      x.strokeText(L.ch, px, py);
      x.fillText(L.ch, px, py);
    });
    withLetter(L, 0.0012 * K, 0.003 * K, (px, py) => {
      const g = x.createLinearGradient(0, py - L.gh, 0, py);
      for (const [o, col] of set.stops) g.addColorStop(o, col);
      x.fillStyle = g;
      x.strokeStyle = g;
      x.lineWidth = strokeIn(L, L.fat * 1.2);
      x.strokeText(L.ch, px, py);
      x.fillText(L.ch, px, py);
    });
  }
  // Crosshair faces.
  x.save();
  x.strokeStyle = '#d8faff';
  x.translate(-0.001 * K, -0.0015 * K);
  crossPath(-0.001 * K);
  x.restore();
  x.save();
  const rg = x.createLinearGradient(0, cc.y - ring.t1, 0, cc.y + ring.t1);
  rg.addColorStop(0, '#48ecff');
  rg.addColorStop(0.45, '#12c4ff');
  rg.addColorStop(1, '#0a7ee8');
  x.strokeStyle = rg;
  x.translate(0.0006 * K, 0.001 * K);
  crossPath(-0.0022 * K);
  x.restore();
  x.save();
  x.strokeStyle = '#1c0012';
  reticlePath(0.007 * K);
  const og = x.createLinearGradient(0, cc.y - inner.t1, 0, cc.y + inner.t1);
  og.addColorStop(0, '#ff9a2a');
  og.addColorStop(0.5, '#ff5a12');
  og.addColorStop(1, '#e0300a');
  x.strokeStyle = og;
  reticlePath(0);
  x.fillStyle = '#ff5a18';
  x.beginPath();
  x.arc(cc.x + 0.0015 * K, cc.y, 0.006 * K, 0, Math.PI * 2);
  x.fill();
  x.restore();

  // Soft gloss across the upper part of every face.
  x.save();
  x.globalCompositeOperation = 'source-atop';
  x.restore();
  return c;
}

// ---------------------------------------------------------------- Home creatures (2371)
// Glossy jelly blobs: round body with round nubs on the silhouette, bright inner rim,
// soft outer glow, big eyes with catchlights, small eyebrows, open "D" mouth + tongue.
// face = [dx, dy] of the face centre (fractions of the body radius, face turned that way).
const CREATURES = {
  blue: { base: '#1f6cff', light: '#7cc6ff', dark: '#0b2aa0', rim: '#b6e6ff', glow: '50,110,255',
    nubs: [[2.2, 0.33], [1.15, 0.26], [0.2, 0.2], [-0.55, 0.22], [-1.45, 0.24], [-2.3, 0.22], [3.05, 0.3]], face: [0.36, -0.02], look: 0.25 },
  yellow: { base: '#ffba12', light: '#ffec80', dark: '#e06a04', rim: '#fff4b8', glow: '255,170,20',
    nubs: [[2.4, 0.24], [1.5, 0.22], [0.6, 0.24], [-0.3, 0.22], [-1.2, 0.24], [-2.0, 0.22], [-2.8, 0.24]], face: [0.12, 0.02], look: 0.15 },
  green: { base: '#2fd628', light: '#a8ff70', dark: '#0a7a14', rim: '#d0ffae', glow: '60,255,60',
    nubs: [[2.1, 0.27], [1.1, 0.25], [0.15, 0.24], [-0.7, 0.24], [-1.5, 0.26], [-2.35, 0.24], [3.0, 0.26]], face: [0.1, 0.0], look: -0.1 },
  red: { base: '#ff322e', light: '#ff9282', dark: '#a80c18', rim: '#ffc0b0', glow: '255,44,60',
    nubs: [[2.3, 0.26], [1.3, 0.22], [0.35, 0.24], [-0.5, 0.22], [-1.35, 0.24], [-2.2, 0.26], [3.05, 0.24]], face: [0.02, 0.04], look: -0.1 },
  purple: { base: '#a93cff', light: '#dc9cff', dark: '#5810b8', rim: '#eccaff', glow: '185,60,255',
    nubs: [[2.2, 0.24], [1.2, 0.22], [0.3, 0.22], [-0.6, 0.22], [-1.5, 0.24], [-2.4, 0.22], [3.1, 0.22]], face: [0.02, 0.06], look: 0.0, worried: true },
};

function silhouettePath(ctx, cx, cy, R, nubs, grow = 0) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, R + grow, R * 0.96 + grow, 0, 0, Math.PI * 2);
  for (const n of nubs) {
    ctx.moveTo(n.x + n.r + grow, n.y);
    ctx.arc(n.x, n.y, n.r + grow, 0, Math.PI * 2);
  }
}

/** Glow just inside a silhouette's edge: mask ∧ blur(¬mask), tinted. */
function innerRim(S, drawMask, color, blur, alpha = 1) {
  const m = canvas2d(S, S), mc = m.getContext('2d');
  mc.fillStyle = '#fff';
  drawMask(mc);
  mc.fill('nonzero');
  const inv = canvas2d(S, S), ic = inv.getContext('2d');
  ic.fillStyle = '#fff';
  ic.fillRect(0, 0, S, S);
  ic.globalCompositeOperation = 'destination-out';
  ic.drawImage(m, 0, 0);
  const out = canvas2d(S, S), oc = out.getContext('2d');
  oc.filter = `blur(${blur}px)`;
  oc.drawImage(inv, 0, 0);
  oc.filter = 'none';
  oc.globalCompositeOperation = 'destination-in';
  oc.drawImage(m, 0, 0);
  oc.globalCompositeOperation = 'source-in';
  oc.globalAlpha = alpha;
  oc.fillStyle = color;
  oc.fillRect(0, 0, S, S);
  return out;
}

export function creature(name, S = 600) {
  const P = CREATURES[name];
  const c = canvas2d(S, S), x = c.getContext('2d');
  const R = S * 0.3, cx = S / 2, cy = S / 2;
  // Nub angles are measured from +x, counter-clockwise on screen (negative = below).
  const nubs = P.nubs.map(([a, k]) => ({ x: cx + Math.cos(a) * R * 0.97, y: cy - Math.sin(a) * R * 0.93, r: R * k }));
  const sil = (ctx, grow = 0) => silhouettePath(ctx, cx, cy, R, nubs, grow);
  // Outer glow.
  x.save();
  x.filter = `blur(${S * 0.04}px)`;
  x.fillStyle = `rgba(${P.glow},1)`;
  sil(x, S * 0.025);
  x.fill('nonzero');
  x.restore();
  // Nubs, each with its own shading, then the body over their roots.
  for (const n of nubs) {
    const g = x.createRadialGradient(n.x - n.r * 0.3, n.y - n.r * 0.35, n.r * 0.1, n.x, n.y, n.r * 1.1);
    g.addColorStop(0, P.light);
    g.addColorStop(0.45, P.base);
    g.addColorStop(1, P.dark);
    x.fillStyle = g;
    x.beginPath();
    x.arc(n.x, n.y, n.r, 0, Math.PI * 2);
    x.fill();
  }
  const body = x.createRadialGradient(cx - R * 0.3, cy - R * 0.4, R * 0.05, cx + R * 0.05, cy + R * 0.05, R * 1.25);
  body.addColorStop(0, P.light);
  body.addColorStop(0.42, P.base);
  body.addColorStop(0.85, P.base);
  body.addColorStop(1, P.dark);
  x.fillStyle = body;
  x.beginPath();
  x.ellipse(cx, cy, R, R * 0.96, 0, 0, Math.PI * 2);
  x.fill();
  // Contact shadow where nubs meet the body.
  x.save();
  x.beginPath();
  x.ellipse(cx, cy, R, R * 0.96, 0, 0, Math.PI * 2);
  x.clip();
  for (const n of nubs) {
    x.fillStyle = radial(x, n.x, n.y, n.r * 1.5, [[0, 'rgba(0,0,30,0.22)'], [1, 'rgba(0,0,30,0)']]);
    x.fillRect(n.x - n.r * 1.6, n.y - n.r * 1.6, n.r * 3.2, n.r * 3.2);
  }
  x.restore();
  // Jelly back-light along the outer silhouette only.
  x.drawImage(innerRim(S, (m) => sil(m), P.rim, S * 0.03, 0.8), 0, 0);
  x.drawImage(innerRim(S, (m) => sil(m), P.rim, S * 0.014, 1), 0, 0);
  x.drawImage(innerRim(S, (m) => sil(m), '#ffffff', S * 0.005, 0.9), 0, 0);
  // Gloss highlights, upper-left.
  x.save();
  x.fillStyle = radial(x, cx - R * 0.4, cy - R * 0.5, R * 0.45, [[0, 'rgba(255,255,255,0.28)'], [1, 'rgba(255,255,255,0)']]);
  x.beginPath();
  x.ellipse(cx, cy, R, R * 0.96, 0, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = 'rgba(255,255,255,0.9)';
  x.beginPath();
  x.ellipse(cx - R * 0.46, cy - R * 0.6, R * 0.12, R * 0.05, -0.65, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = 'rgba(255,255,255,0.6)';
  x.beginPath();
  x.ellipse(cx - R * 0.74, cy - R * 0.28, R * 0.045, R * 0.025, -1.1, 0, Math.PI * 2);
  x.fill();
  for (const n of nubs) {
    if (n.y > cy) continue;
    x.fillStyle = 'rgba(255,255,255,0.75)';
    x.beginPath();
    x.ellipse(n.x - n.r * 0.3, n.y - n.r * 0.38, n.r * 0.26, n.r * 0.12, -0.6, 0, Math.PI * 2);
    x.fill();
  }
  x.restore();

  // Face.
  const fx = cx + P.face[0] * R, fy = cy + P.face[1] * R;
  const eyeDx = R * 0.38, eyeY = fy - R * 0.2;
  for (const sgn of [-1, 1]) {
    x.fillStyle = radial(x, fx + sgn * R * 0.6, fy + R * 0.12, R * 0.17, [[0, 'rgba(255,110,150,0.35)'], [1, 'rgba(255,110,150,0)']]);
    x.fillRect(fx + sgn * R * 0.6 - R * 0.2, fy - R * 0.08, R * 0.4, R * 0.4);
  }
  for (const sgn of [-1, 1]) {
    // Face turned toward +face[0]: the far eye is a little narrower.
    const turn = 1 - Math.max(0, sgn * P.face[0]) * 0.25;
    const ex = fx + sgn * eyeDx * (sgn > 0 ? 1 - P.face[0] * 0.3 : 1);
    const erx = R * 0.21 * turn, ery = R * 0.245;
    x.fillStyle = '#ffffff';
    x.strokeStyle = 'rgba(16,16,36,0.9)';
    x.lineWidth = S * 0.006;
    x.beginPath();
    x.ellipse(ex, eyeY, erx, ery, 0, 0, Math.PI * 2);
    x.fill();
    x.stroke();
    const px = ex + P.look * erx * 0.35, py = eyeY + ery * 0.08;
    const pg = x.createRadialGradient(px - erx * 0.2, py - ery * 0.2, 1, px, py, erx * 0.8);
    pg.addColorStop(0, '#26304e');
    pg.addColorStop(1, '#04050b');
    x.fillStyle = pg;
    x.beginPath();
    x.ellipse(px, py, erx * 0.74, ery * 0.74, 0, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = '#ffffff';
    x.beginPath();
    x.arc(px + erx * 0.22, py - ery * 0.3, erx * 0.24, 0, Math.PI * 2);
    x.fill();
    x.beginPath();
    x.arc(px - erx * 0.28, py + ery * 0.32, erx * 0.09, 0, Math.PI * 2);
    x.fill();
    // Eyebrow.
    x.strokeStyle = 'rgba(16,12,34,0.9)';
    x.lineWidth = S * 0.011;
    x.lineCap = 'round';
    const tilt = P.worried ? -sgn * 0.4 : sgn * 0.12;
    x.beginPath();
    x.ellipse(ex, eyeY - ery - R * 0.1, erx * 0.62, R * 0.05, tilt, Math.PI * 1.15, Math.PI * 1.85);
    x.stroke();
  }
  // Mouth: open "D" with a pink tongue.
  const mw = R * (P.worried ? 0.22 : 0.34), mh = R * (P.worried ? 0.28 : 0.46);
  const mx = fx + R * 0.02, my = fy + R * 0.06;
  x.save();
  x.beginPath();
  x.moveTo(mx - mw, my);
  x.quadraticCurveTo(mx, my - mh * 0.14, mx + mw, my);
  x.bezierCurveTo(mx + mw * 1.05, my + mh * 1.25, mx - mw * 1.05, my + mh * 1.25, mx - mw, my);
  x.closePath();
  x.fillStyle = '#35040f';
  x.fill();
  x.lineWidth = S * 0.007;
  x.strokeStyle = 'rgba(25,4,12,0.95)';
  x.stroke();
  x.clip();
  x.fillStyle = '#ff6d86';
  x.beginPath();
  x.ellipse(mx, my + mh * 0.95, mw * 0.72, mh * 0.45, 0, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = 'rgba(255,255,255,0.22)';
  x.beginPath();
  x.ellipse(mx - mw * 0.2, my + mh * 0.66, mw * 0.25, mh * 0.08, 0, 0, Math.PI * 2);
  x.fill();
  x.restore();
  return c;
}

// ---------------------------------------------------------------- bg_home finishing pass
/** Painterly grade over the rendered Home warehouse: vignettes, blue haze, dust, bokeh. */
export function homeFinish(src) {
  const W = src.width, H = src.height;
  const c = canvas2d(W, H), x = c.getContext('2d');
  x.drawImage(src, 0, 0);
  const r = rng(77);
  // Soften floor reflections (painted, wet-floor look instead of mirror-sharp streaks).
  x.save();
  x.filter = `blur(${W * 0.006}px)`;
  x.globalAlpha = 0.7;
  x.drawImage(src, 0, H * 0.56, W, H * 0.44, 0, H * 0.56, W, H * 0.44);
  x.restore();
  // Blue haze in the middle band (the air the hero stands in).
  x.save();
  x.globalCompositeOperation = 'screen';
  x.fillStyle = radial(x, W * 0.5, H * 0.5, W * 0.75, [[0, 'rgba(40,90,255,0.3)'], [0.5, 'rgba(30,60,200,0.12)'], [1, 'rgba(20,30,120,0)']]);
  x.fillRect(0, 0, W, H);
  x.fillStyle = radial(x, W * 0.5, H * 0.25, W * 0.6, [[0, 'rgba(70,50,200,0.12)'], [1, 'rgba(60,40,160,0)']]);
  x.fillRect(0, 0, W, H);
  x.restore();
  // Top and bottom vignettes (status bar / nav bar areas are dark in the reference).
  let g = x.createLinearGradient(0, 0, 0, H * 0.14);
  g.addColorStop(0, 'rgba(1,3,16,0.92)');
  g.addColorStop(1, 'rgba(1,3,16,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, W, H * 0.14);
  g = x.createLinearGradient(0, H * 0.84, 0, H);
  g.addColorStop(0, 'rgba(1,4,20,0)');
  g.addColorStop(0.6, 'rgba(1,4,20,0.7)');
  g.addColorStop(1, 'rgba(1,3,14,0.92)');
  x.fillStyle = g;
  x.fillRect(0, H * 0.84, W, H * 0.16);
  // Side vignette.
  for (const sx of [0, 1]) {
    g = x.createLinearGradient(sx ? W : 0, 0, sx ? W * 0.82 : W * 0.18, 0);
    g.addColorStop(0, 'rgba(2,4,24,0.45)');
    g.addColorStop(1, 'rgba(2,4,24,0)');
    x.fillStyle = g;
    x.fillRect(sx ? W * 0.82 : 0, 0, W * 0.18, H);
  }
  // Bokeh discs.
  x.save();
  x.globalCompositeOperation = 'lighter';
  const cols = ['80,160,255', '120,110,255', '60,220,255', '255,120,220', '255,170,80'];
  for (let i = 0; i < 70; i++) {
    const px = r() * W, py = H * (0.12 + r() * 0.72);
    const rr = W * (0.006 + r() * 0.022);
    const col = cols[Math.floor(r() * (r() < 0.8 ? 3 : 5))];
    x.fillStyle = radial(x, px, py, rr, [[0, `rgba(${col},${0.14 + r() * 0.16})`], [0.7, `rgba(${col},${0.06 + r() * 0.06})`], [1, `rgba(${col},0)`]]);
    x.fillRect(px - rr, py - rr, rr * 2, rr * 2);
  }
  // Fine glowing dust.
  for (let i = 0; i < 420; i++) {
    const px = r() * W, py = H * (0.08 + r() * 0.82);
    const rr = 1.2 + r() * 3.2;
    const col = cols[Math.floor(r() * 3)];
    x.fillStyle = radial(x, px, py, rr * 2.5, [[0, `rgba(230,245,255,${0.5 + r() * 0.5})`], [0.35, `rgba(${col},0.35)`], [1, `rgba(${col},0)`]]);
    x.fillRect(px - rr * 3, py - rr * 3, rr * 6, rr * 6);
  }
  x.restore();
  return c;
}

// ---------------------------------------------------------------- bg_warehouse finishing pass
/** Level 3 grade: soft top vignette under the HUD, floating dust and warm/cool sparkles. */
export function level3Finish(src) {
  const W = src.width, H = src.height;
  const c = canvas2d(W, H), x = c.getContext('2d');
  x.drawImage(src, 0, 0);
  const r = rng(2376);
  let g = x.createLinearGradient(0, 0, 0, H * 0.2);
  g.addColorStop(0, 'rgba(3,4,18,0.8)');
  g.addColorStop(1, 'rgba(3,4,18,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, W, H * 0.2);
  g = x.createLinearGradient(0, H * 0.86, 0, H);
  g.addColorStop(0, 'rgba(3,4,18,0)');
  g.addColorStop(1, 'rgba(3,4,18,0.6)');
  x.fillStyle = g;
  x.fillRect(0, H * 0.86, W, H * 0.14);
  x.save();
  x.globalCompositeOperation = 'lighter';
  const cols = ['255,190,110', '255,150,90', '120,170,255', '200,120,255'];
  for (let i = 0; i < 260; i++) {
    const px = r() * W, py = H * (0.12 + r() * 0.45);
    const rr = 1.2 + r() * 3;
    const col = cols[Math.floor(r() * cols.length)];
    x.fillStyle = radial(x, px, py, rr * 2.6, [[0, `rgba(255,245,230,${0.4 + r() * 0.5})`], [0.35, `rgba(${col},0.35)`], [1, `rgba(${col},0)`]]);
    x.fillRect(px - rr * 3, py - rr * 3, rr * 6, rr * 6);
  }
  x.restore();
  return c;
}
