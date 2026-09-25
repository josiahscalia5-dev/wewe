// Warehouse props: wooden and blue metal crates, crate stacks, forklift, shelving racks.
// All built with their base centred on the origin (y = 0 is the floor).
import { THREE, plastic, metal, matte, emissive, mesh, group } from '../core.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { woodTexture, paintedMetal, hazardTexture } from '../textures.js';

const rb = (w, h, d, r = 0.02, s = 3) => new RoundedBoxGeometry(w, h, d, s, r);
const woodCache = new Map();
function woodMat(seed, tint) {
  const key = seed + ':' + tint;
  if (!woodCache.has(key)) {
    const base = tint === 'dark' ? [150, 92, 44] : tint === 'light' ? [214, 150, 78] : [196, 128, 62];
    const m = new THREE.MeshStandardMaterial({ map: woodTexture({ seed, base }), roughness: 0.62, metalness: 0.0 });
    woodCache.set(key, m);
  }
  return woodCache.get(key);
}
const frameWood = () => plastic(0x6a3a16, { rough: 0.6, clearcoat: 0.1, env: 0.3 });
const bracket = () => metal(0x5c6270, { rough: 0.4, env: 0.7 });

/** Wooden crate with X braces and metal corners (reference crates). */
export function crate(w, h, d, { seed = 1, tint = 'mid', xBrace = true } = {}) {
  const g = group();
  g.add(mesh(rb(w, h, d, 0.015), woodMat(seed, tint), { y: h / 2 }));
  const fw = frameWood();
  const t = Math.min(w, h, d) * 0.1;
  const br = bracket();
  // Frame edges on front/back faces.
  for (const z of [d / 2, -d / 2]) {
    g.add(mesh(rb(w, t, t * 0.6, 0.008), fw, { y: t / 2, z }));
    g.add(mesh(rb(w, t, t * 0.6, 0.008), fw, { y: h - t / 2, z }));
    g.add(mesh(rb(t, h, t * 0.6, 0.008), fw, { x: -w / 2 + t / 2, y: h / 2, z }));
    g.add(mesh(rb(t, h, t * 0.6, 0.008), fw, { x: w / 2 - t / 2, y: h / 2, z }));
    if (xBrace) {
      const len = Math.hypot(w - 2 * t, h - 2 * t);
      const ang = Math.atan2(h - 2 * t, w - 2 * t);
      g.add(mesh(rb(len, t * 0.9, t * 0.5, 0.006), fw, { y: h / 2, z: z + Math.sign(z) * 0.004, rz: ang }));
      g.add(mesh(rb(len, t * 0.9, t * 0.5, 0.006), fw, { y: h / 2, z: z + Math.sign(z) * 0.004, rz: -ang }));
    }
  }
  // Side frames.
  for (const x of [w / 2, -w / 2]) {
    g.add(mesh(rb(t * 0.6, t, d, 0.008), fw, { x, y: t / 2 }));
    g.add(mesh(rb(t * 0.6, t, d, 0.008), fw, { x, y: h - t / 2 }));
  }
  // Metal corner caps.
  for (const x of [-1, 1]) for (const y of [0, 1]) for (const z of [-1, 1]) {
    g.add(mesh(rb(t * 1.3, t * 1.3, t * 1.3, 0.006), br, { x: x * (w / 2 - t * 0.3), y: y ? h - t * 0.5 : t * 0.5, z: z * (d / 2 - t * 0.3) }));
  }
  return g;
}

/** Blue painted metal crate with yellow frame (reference mid-ground crates). */
export function metalCrate(w, h, d, { seed = 2 } = {}) {
  const g = group();
  const body = new THREE.MeshStandardMaterial({ map: paintedMetal({ seed, base: [48, 78, 132] }), roughness: 0.45, metalness: 0.35 });
  g.add(mesh(rb(w, h, d, 0.02), body, { y: h / 2 }));
  const y = plastic(0xd9a21e, { rough: 0.4, clearcoat: 0.4, env: 0.5 });
  const t = Math.min(w, h, d) * 0.08;
  for (const z of [d / 2, -d / 2]) {
    g.add(mesh(rb(w + 0.01, t, t, 0.008), y, { y: t / 2, z }));
    g.add(mesh(rb(w + 0.01, t, t, 0.008), y, { y: h - t / 2, z }));
    g.add(mesh(rb(t, h, t, 0.008), y, { x: -w / 2, y: h / 2, z }));
    g.add(mesh(rb(t, h, t, 0.008), y, { x: w / 2, y: h / 2, z }));
  }
  for (const x of [w / 2, -w / 2]) {
    g.add(mesh(rb(t, t, d, 0.008), y, { x, y: t / 2 }));
    g.add(mesh(rb(t, t, d, 0.008), y, { x, y: h - t / 2 }));
  }
  // Hazard label.
  const lab = new THREE.MeshStandardMaterial({ map: hazardTexture(), roughness: 0.5 });
  g.add(mesh(new THREE.PlaneGeometry(w * 0.5, h * 0.14), lab, { y: h * 0.62, z: d / 2 + 0.012 }));
  return g;
}

export function coverCratesLeft() {
  const g = group();
  const a = crate(0.74, 0.54, 0.62, { seed: 11 });
  g.add(a);
  const b = crate(0.56, 0.44, 0.52, { seed: 12, tint: 'light' });
  b.position.set(0.06, 0.54, -0.02);
  b.rotation.y = 0.12;
  g.add(b);
  return g;
}

export function coverCrateMid() {
  const g = group();
  g.add(crate(0.7, 0.62, 0.62, { seed: 21 }));
  const b = metalCrate(0.38, 0.26, 0.34, { seed: 22 });
  b.position.set(-0.12, 0.62, 0.02);
  b.rotation.y = -0.2;
  g.add(b);
  return g;
}

export function sceneryCratesFar() {
  const g = group();
  const spots = [[-0.45, 0, 0, 0.8, 0.7, 0.7, 31, 'm'], [0.42, 0, 0.05, 0.8, 0.7, 0.7, 32, 'b'], [0, 0.7, 0, 0.8, 0.62, 0.7, 33, 'm'], [0.9, 0, -0.1, 0.6, 0.5, 0.6, 34, 'm']];
  for (const [x, y, z, w, h, d, s, kind] of spots) {
    const c = kind === 'b' ? metalCrate(w, h, d, { seed: s }) : crate(w, h, d, { seed: s, tint: s % 2 ? 'dark' : 'mid' });
    c.position.set(x, y, z);
    g.add(c);
  }
  return g;
}

export function sceneryCratesNear() {
  const g = group();
  const a = metalCrate(0.62, 0.52, 0.56, { seed: 41 });
  g.add(a);
  const b = crate(0.5, 0.42, 0.5, { seed: 42, tint: 'light' });
  b.position.set(-0.05, 0.52, 0);
  b.rotation.y = 0.25;
  g.add(b);
  const c = crate(0.44, 0.36, 0.44, { seed: 43 });
  c.position.set(0.55, 0, 0.1);
  g.add(c);
  return g;
}

/** Yellow warehouse forklift with a crate on its forks (reference 2376 right side). */
export function forklift() {
  const g = group();
  // Reference 2376: worn industrial yellow frame over a dark gunmetal body.
  const yellow = plastic(0xc88810, { rough: 0.42, clearcoat: 0.4, env: 0.4 });
  const yellowDark = plastic(0x7a5410, { rough: 0.5, env: 0.45 });
  const bodyDark = plastic(0x2a2c36, { rough: 0.45, clearcoat: 0.4, env: 0.5 });
  const steel = metal(0x33363f, { rough: 0.45, env: 0.6 });
  const tyre = matte(0x111216, { rough: 0.85 });
  const hub = metal(0x9aa0aa, { rough: 0.3 });
  const orange = emissive(0xff8a2a, 1.2, 0xff6a10);
  // Chassis: the forks face the camera-left (toward the play area).
  const body = group();
  body.add(mesh(rb(0.7, 0.42, 1.0, 0.08), bodyDark, { y: 0.36, z: -0.15 }));
  body.add(mesh(rb(0.72, 0.06, 1.02, 0.02), yellow, { y: 0.56, z: -0.15 }));
  body.add(mesh(rb(0.72, 0.18, 0.5, 0.06), bodyDark, { y: 0.62, z: -0.38 }));
  body.add(mesh(rb(0.36, 0.1, 0.32, 0.04), steel, { y: 0.62, z: -0.02 }));
  body.add(mesh(rb(0.32, 0.3, 0.06, 0.03), steel, { y: 0.82, z: -0.2 }));
  // Overhead guard.
  for (const x of [-0.3, 0.3]) for (const z of [0.05, -0.55]) {
    body.add(mesh(rb(0.05, 0.9, 0.05, 0.015), steel, { x, y: 0.95, z }));
  }
  body.add(mesh(rb(0.66, 0.05, 0.66, 0.015), steel, { y: 1.4, z: -0.25 }));
  for (const z of [-0.15, -0.35]) body.add(mesh(rb(0.62, 0.03, 0.04, 0.01), steel, { y: 1.42, z }));
  // Mast at the front (+z).
  const mast = group();
  mast.position.z = 0.4;
  for (const x of [-0.24, 0.24]) {
    mast.add(mesh(rb(0.08, 1.35, 0.08, 0.02), yellow, { x, y: 0.72 }));
    mast.add(mesh(rb(0.03, 1.3, 0.1, 0.01), yellowDark, { x: x * 0.8, y: 0.72 }));
  }
  mast.add(mesh(rb(0.56, 0.08, 0.08, 0.02), yellow, { y: 1.38 }));
  mast.add(mesh(rb(0.56, 0.08, 0.08, 0.02), yellow, { y: 0.5 }));
  // Carriage + forks.
  mast.add(mesh(rb(0.6, 0.22, 0.05, 0.015), steel, { y: 0.34, z: 0.06 }));
  for (const x of [-0.16, 0.16]) mast.add(mesh(rb(0.07, 0.035, 0.6, 0.01), steel, { x, y: 0.26, z: 0.36 }));
  body.add(mast);
  // Wheels.
  for (const [x, z, r] of [[-0.37, 0.18, 0.13], [0.37, 0.18, 0.13], [-0.36, -0.52, 0.12], [0.36, -0.52, 0.12]]) {
    body.add(mesh(new THREE.CylinderGeometry(r, r, 0.14, 28), tyre, { x, y: r, z, rz: Math.PI / 2 }));
    body.add(mesh(new THREE.CylinderGeometry(r * 0.55, r * 0.55, 0.15, 20), hub, { x, y: r, z, rz: Math.PI / 2 }));
  }
  // Beacon.
  body.add(mesh(new THREE.SphereGeometry(0.045, 16, 12), orange, { y: 1.47, z: -0.25 }));
  // Hazard stripes on the counterweight.
  const hz = new THREE.MeshStandardMaterial({ map: hazardTexture(), roughness: 0.5 });
  body.add(mesh(new THREE.PlaneGeometry(0.66, 0.1), hz, { y: 0.3, z: -0.656, ry: Math.PI }));
  // Turn so the forks point toward the play area (screen left, slightly toward camera).
  body.rotation.y = -1.9;
  g.add(body);
  return g;
}

/** Tall steel shelving rack loaded with crates and boxes. */
export function shelfRack({ w = 2.4, h = 4.2, d = 1.0, levels = 3, seed = 60, post = 0x2f5b9a, beam = 0xd9701e } = {}) {
  const g = group();
  const pm = plastic(post, { rough: 0.45, clearcoat: 0.3, env: 0.5 });
  const bm = plastic(beam, { rough: 0.45, clearcoat: 0.3, env: 0.5 });
  const deck = metal(0x3a3d46, { rough: 0.5 });
  for (const x of [-w / 2, w / 2]) for (const z of [-d / 2, d / 2]) {
    g.add(mesh(rb(0.07, h, 0.07, 0.01), pm, { x, y: h / 2, z }));
  }
  let s = seed;
  for (let i = 0; i < levels; i++) {
    const y = 0.25 + (i * (h - 0.4)) / levels;
    for (const z of [-d / 2, d / 2]) g.add(mesh(rb(w, 0.09, 0.06, 0.01), bm, { y, z }));
    g.add(mesh(new THREE.BoxGeometry(w, 0.03, d), deck, { y: y + 0.05 }));
    // Crates on the level.
    let x = -w / 2 + 0.1;
    while (x < w / 2 - 0.4) {
      s++;
      const cw = 0.35 + ((s * 37) % 23) / 60;
      const ch = 0.3 + ((s * 17) % 19) / 50;
      const kind = s % 3;
      const c = kind === 0 ? metalCrate(cw, ch, d * 0.8, { seed: s }) : crate(cw, ch, d * 0.8, { seed: s, tint: kind === 1 ? 'dark' : 'mid', xBrace: s % 2 === 0 });
      c.position.set(x + cw / 2, y + 0.07, 0);
      g.add(c);
      x += cw + 0.05 + ((s * 13) % 7) / 40;
    }
  }
  return g;
}
