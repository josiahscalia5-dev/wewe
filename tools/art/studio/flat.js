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

/** Muzzle flash: core at 35% from the left, flame spikes pointing along +x. */
export function muzzleFlash({ size = 256, hero = false } = {}) {
  const S = size, c = canvas2d(S, S), x = c.getContext('2d');
  const cx = S * 0.35, cy = S / 2;
  x.fillStyle = radial(x, cx, cy, S * 0.5, [[0, 'rgba(255,255,230,1)'], [0.25, 'rgba(255,220,90,0.9)'], [0.55, 'rgba(255,140,40,0.4)'], [1, 'rgba(255,90,20,0)']]);
  x.fillRect(0, 0, S, S);
  x.save();
  x.translate(cx, cy);
  const spikes = hero ? [[0, 0.62, 0.1], [0.35, 0.42, 0.07], [-0.35, 0.42, 0.07], [0.8, 0.3, 0.05], [-0.8, 0.3, 0.05], [Math.PI, 0.22, 0.05], [1.4, 0.24, 0.04], [-1.4, 0.24, 0.04]]
    : [[0, 0.6, 0.12], [0.45, 0.36, 0.08], [-0.45, 0.36, 0.08], [1.1, 0.24, 0.06], [-1.1, 0.24, 0.06], [Math.PI, 0.18, 0.06]];
  for (const [a, len, w] of spikes) {
    x.save();
    x.rotate(a);
    const g = x.createLinearGradient(0, 0, S * len, 0);
    g.addColorStop(0, 'rgba(255,255,240,1)');
    g.addColorStop(0.5, 'rgba(255,220,100,0.9)');
    g.addColorStop(1, 'rgba(255,150,40,0)');
    x.fillStyle = g;
    x.beginPath();
    x.moveTo(0, -S * w);
    x.lineTo(S * len, 0);
    x.lineTo(0, S * w);
    x.closePath();
    x.fill();
    x.restore();
  }
  x.fillStyle = radial(x, 0, 0, S * 0.12, [[0, 'rgba(255,255,255,1)'], [1, 'rgba(255,255,220,0)']]);
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

export function sparkle() {
  const S = 256, c = canvas2d(S, S), x = c.getContext('2d');
  x.fillStyle = radial(x, S / 2, S / 2, S / 2, [[0, 'rgba(255,250,220,0.9)'], [0.25, 'rgba(255,230,140,0.35)'], [1, 'rgba(255,200,80,0)']]);
  x.fillRect(0, 0, S, S);
  x.save();
  x.translate(S / 2, S / 2);
  const g = x.createRadialGradient(0, 0, 0, 0, 0, S * 0.45);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.35, '#fff3b0');
  g.addColorStop(1, 'rgba(255,200,60,0.2)');
  x.fillStyle = g;
  x.shadowColor = 'rgba(255,220,120,1)';
  x.shadowBlur = 20;
  star(x, 0, 0, 4, S * 0.45, S * 0.09, -Math.PI / 2);
  x.fill();
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
export function logo() {
  const W = 1700, H = 900;
  const c = canvas2d(W, H), x = c.getContext('2d');
  x.textBaseline = 'alphabetic';
  x.lineJoin = 'round';
  const word = (text, cx, base, size, grad, skew = 0) => {
    x.save();
    x.translate(cx, base);
    x.transform(1, 0, skew, 1, 0, 0);
    x.font = `${size}px "Lilita One"`;
    x.textAlign = 'center';
    // Outer red glow + outline.
    x.shadowColor = 'rgba(255,40,80,0.9)';
    x.shadowBlur = 30;
    x.strokeStyle = '#b01228';
    x.lineWidth = size * 0.3;
    x.strokeText(text, 0, 0);
    x.shadowBlur = 0;
    x.strokeStyle = '#140a2e';
    x.lineWidth = size * 0.2;
    x.strokeText(text, 0, 0);
    // Extrusion.
    for (let d = 12; d > 0; d -= 2) {
      x.fillStyle = grad.deep;
      x.fillText(text, 0, d * size / 180);
    }
    // Fill + gloss rendered off-screen so the gloss only touches the letter faces.
    const off = canvas2d(W * 2, size * 1.6);
    const o = off.getContext('2d');
    o.translate(W, size * 1.1);
    o.font = `${size}px "Lilita One"`;
    o.textAlign = 'center';
    o.textBaseline = 'alphabetic';
    const g = o.createLinearGradient(0, -size * 0.75, 0, 0);
    g.addColorStop(0, grad.top);
    g.addColorStop(0.55, grad.mid);
    g.addColorStop(1, grad.bot);
    o.fillStyle = g;
    o.fillText(text, 0, 0);
    o.globalCompositeOperation = 'source-atop';
    o.fillStyle = 'rgba(255,255,255,0.32)';
    o.fillRect(-W, -size * 0.74, W * 2, size * 0.2);
    x.drawImage(off, -W, -size * 1.1);
    x.restore();
  };
  const blue = { top: '#9ff3ff', mid: '#2fc4ff', bot: '#1570e0', deep: '#0b3c92' };
  const gold = { top: '#fff08a', mid: '#ffc21a', bot: '#ff7a10', deep: '#a8400a' };
  word('BLAST', 790, 360, 330, blue);
  word('&', 1360, 470, 170, { top: '#ffe070', mid: '#ffa820', bot: '#ff6a10', deep: '#9a3c08' });
  // COLLECT with a gap for the crosshair "O".
  x.save();
  x.font = '330px "Lilita One"';
  const cW = x.measureText('C').width;
  const rest = x.measureText('LLECT').width;
  x.restore();
  const oW = 300;
  const total = cW + oW + rest;
  const left = (W - total) / 2 + 20;
  word('C', left + cW / 2, 780, 330, gold);
  word('LLECT', left + cW + oW + rest / 2, 780, 330, gold);
  // Crosshair O.
  const ox = left + cW + oW / 2, oy = 668;
  x.save();
  x.translate(ox, oy);
  x.shadowColor = 'rgba(255,40,80,0.8)';
  x.shadowBlur = 24;
  x.strokeStyle = '#140a2e';
  x.lineWidth = 64;
  x.beginPath();
  x.arc(0, 0, 118, 0, Math.PI * 2);
  x.stroke();
  x.shadowBlur = 0;
  const ring = x.createLinearGradient(0, -130, 0, 130);
  ring.addColorStop(0, '#8ff0ff');
  ring.addColorStop(1, '#1a86e8');
  x.strokeStyle = ring;
  x.lineWidth = 38;
  x.beginPath();
  x.arc(0, 0, 118, 0, Math.PI * 2);
  x.stroke();
  for (const [a, b] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
    x.strokeStyle = '#140a2e';
    x.lineWidth = 50;
    x.lineCap = 'round';
    x.beginPath();
    x.moveTo(a * 70, b * 70);
    x.lineTo(a * 175, b * 175);
    x.stroke();
    x.strokeStyle = ring;
    x.lineWidth = 28;
    x.beginPath();
    x.moveTo(a * 70, b * 70);
    x.lineTo(a * 175, b * 175);
    x.stroke();
  }
  x.strokeStyle = '#140a2e';
  x.lineWidth = 34;
  x.beginPath();
  x.arc(0, 0, 52, 0, Math.PI * 2);
  x.stroke();
  x.strokeStyle = '#ff7a1a';
  x.lineWidth = 20;
  x.beginPath();
  x.arc(0, 0, 52, 0, Math.PI * 2);
  x.stroke();
  x.fillStyle = '#ff5a1a';
  x.beginPath();
  x.arc(0, 0, 20, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = 'rgba(255,255,255,0.6)';
  x.beginPath();
  x.arc(-6, -6, 7, 0, Math.PI * 2);
  x.fill();
  x.restore();
  return c;
}
