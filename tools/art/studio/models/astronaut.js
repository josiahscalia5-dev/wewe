// Player astronaut seen from behind (reference 2376 / 2374 / 2372): huge dark glass
// helmet framed by a white shell rim with a cyan ear light, navy suit, charcoal backpack
// with orange pouches and straps, white sleeve and black glove on the blaster arm.
import { THREE, plastic, metal, emissive, matte, glass, mesh, group } from '../core.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const rb = (w, h, d, r = 0.04, s = 4) => new RoundedBoxGeometry(w, h, d, s, r);

export function astroMats() {
  return {
    shell: plastic(0xe9ecf4, { rough: 0.3, clearcoat: 0.9, env: 0.8 }),
    glass: glass(0x080b1e, { rough: 0.12, env: 0.55 }),
    suit: plastic(0x1c2236, { rough: 0.55, clearcoat: 0.2, env: 0.5 }),
    suitDark: matte(0x10131f, { rough: 0.7 }),
    // Reference 2376: charcoal-navy pack with brown leather pouches and straps.
    pack: plastic(0x252a3c, { rough: 0.5, clearcoat: 0.3, env: 0.5 }),
    packDark: matte(0x15171f, { rough: 0.7 }),
    orange: plastic(0x9c5a22, { rough: 0.5, clearcoat: 0.3, env: 0.45 }),
    orangeDark: plastic(0x5e3212, { rough: 0.55, env: 0.4 }),
    silver: metal(0xc9ced8, { rough: 0.25, env: 1.0 }),
    white: plastic(0xe6e9f1, { rough: 0.35, clearcoat: 0.6, env: 0.7 }),
    black: plastic(0x121318, { rough: 0.5, clearcoat: 0.3, env: 0.4 }),
    ear: emissive(0x38e6ff, 1.8, 0x1fc8ff),
    earRing: plastic(0xdfe6f2, { rough: 0.3, env: 0.8 }),
  };
}

/** Chunky sci-fi blaster pointing along +x, muzzle at x = len. */
export function buildBlaster({ len = 0.52, body = 0xc2233a, accent = 0x32e0ff, dark = 0x15161c, scale = 1 } = {}) {
  const m = {
    body: plastic(body, { rough: 0.3, clearcoat: 1, env: 0.8 }),
    dark: plastic(dark, { rough: 0.45, clearcoat: 0.4, env: 0.5 }),
    silver: metal(0xd5dae4, { rough: 0.22, env: 1.1 }),
    glow: emissive(accent, 0.9, accent),
    display: emissive(0xff5a1a, 0.9, 0xff3a08),
  };
  const g = group();
  // Grip and trigger guard below the rear of the body.
  g.add(mesh(rb(0.07, 0.16, 0.07, 0.025), m.dark, { x: 0.05, y: -0.1, rz: -0.25 }));
  // Main body.
  g.add(mesh(rb(0.3, 0.11, 0.11, 0.035), m.body, { x: 0.16 }));
  g.add(mesh(rb(0.22, 0.05, 0.12, 0.02), m.dark, { x: 0.15, y: -0.06 }));
  // Glowing side cells.
  for (const z of [-0.058, 0.058]) {
    g.add(mesh(rb(0.16, 0.04, 0.012, 0.006), m.glow, { x: 0.17, y: 0.0, z }));
  }
  // Top display.
  g.add(mesh(rb(0.12, 0.025, 0.07, 0.01), m.display, { x: 0.14, y: 0.065 }));
  // Barrel.
  g.add(mesh(new THREE.CylinderGeometry(0.038, 0.042, len - 0.3, 24), m.silver, { x: 0.3 + (len - 0.3) / 2, rz: Math.PI / 2 }));
  g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 24), m.dark, { x: 0.33, rz: Math.PI / 2 }));
  g.add(mesh(new THREE.TorusGeometry(0.036, 0.012, 12, 24), m.glow, { x: len - 0.01, ry: Math.PI / 2 }));
  g.scale.setScalar(scale);
  return g;
}

/** Full astronaut body (no right arm unless withArm). pose: idle|strafe|duck|stunned. */
export function buildAstronaut({ pose = 'idle', phase = 0, dir = 1, withArm = false } = {}) {
  const m = astroMats();
  const root = group();
  const a = phase * Math.PI * 2;
  let crouch = 0;
  let lean = 0;
  let bob = 0;
  let tiltBack = 0;
  if (pose === 'strafe') {
    bob = Math.abs(Math.sin(a)) * 0.035;
    lean = dir * 0.07;
  } else if (pose === 'duck') {
    crouch = 0.3;
  } else if (pose === 'stunned') {
    tiltBack = -0.22;
    lean = -0.14;
  }

  const hips = group();
  hips.position.y = 0.42 - crouch + bob;
  hips.rotation.z = -lean;
  hips.rotation.x = tiltBack;
  root.add(hips);

  // Legs.
  for (const sx of [-1, 1]) {
    const leg = group();
    leg.position.set(sx * 0.11, 0.02, 0);
    let spread = 0;
    let lift = 0;
    if (pose === 'strafe') {
      spread = Math.sin(a + (sx > 0 ? 0 : Math.PI)) * 0.28;
      lift = Math.max(0, Math.sin(a + (sx > 0 ? 0 : Math.PI))) * 0.06;
    }
    if (pose === 'duck') spread = sx * 0.35;
    leg.rotation.z = spread * 0.9 + (pose === 'duck' ? 0 : 0);
    leg.rotation.x = pose === 'duck' ? -0.9 : 0;
    const thigh = mesh(rb(0.14, 0.22, 0.15, 0.06), m.suit, { y: -0.1 });
    leg.add(thigh);
    const knee = group();
    knee.position.y = -0.2;
    knee.rotation.x = pose === 'duck' ? 1.7 : lift * 3;
    knee.add(mesh(rb(0.13, 0.2, 0.14, 0.05), m.suit, { y: -0.09 }));
    knee.add(mesh(rb(0.1, 0.08, 0.04, 0.03), m.white, { y: 0.0, z: -0.075 }));
    knee.add(mesh(rb(0.15, 0.09, 0.2, 0.04), m.black, { y: -0.2, z: 0.02 }));
    leg.add(knee);
    hips.add(leg);
  }

  // Torso.
  const torso = group();
  torso.position.y = 0.06;
  hips.add(torso);
  torso.add(mesh(rb(0.42, 0.38, 0.3, 0.1), m.suit, { y: 0.17 }));
  torso.add(mesh(rb(0.44, 0.07, 0.31, 0.03), m.orangeDark, { y: 0.0 }));
  // Belt buckle / strap pieces at the back.
  torso.add(mesh(rb(0.3, 0.05, 0.05, 0.02), m.orange, { y: 0.01, z: 0.16 }));

  // Backpack (faces the camera: +z in three).
  const pack = group();
  pack.position.set(0, 0.22, 0.2);
  torso.add(pack);
  pack.add(mesh(rb(0.4, 0.36, 0.16, 0.06), m.pack));
  pack.add(mesh(rb(0.3, 0.14, 0.04, 0.03), m.packDark, { y: -0.05, z: 0.08 }));
  pack.add(mesh(rb(0.26, 0.1, 0.05, 0.03), m.pack, { y: 0.1, z: 0.075 }));
  pack.add(mesh(rb(0.08, 0.02, 0.02, 0.008), m.silver, { y: 0.1, z: 0.105 }));
  // Big leather pouch on the right with a buckle, and a small one lower left.
  pack.add(mesh(rb(0.15, 0.2, 0.08, 0.035), m.orange, { x: 0.13, y: -0.09, z: 0.1 }));
  pack.add(mesh(rb(0.05, 0.03, 0.02, 0.008), m.silver, { x: 0.13, y: -0.04, z: 0.145 }));
  pack.add(mesh(rb(0.12, 0.1, 0.06, 0.03), m.orangeDark, { x: -0.12, y: -0.13, z: 0.1 }));
  for (const sx of [-1, 1]) {
    pack.add(mesh(rb(0.08, 0.26, 0.12, 0.03), m.orange, { x: sx * 0.22, y: -0.02, z: 0.0 }));
    pack.add(mesh(rb(0.085, 0.04, 0.125, 0.01), m.orangeDark, { x: sx * 0.22, y: -0.06, z: 0.0 }));
    pack.add(mesh(rb(0.03, 0.3, 0.03, 0.01), m.orangeDark, { x: sx * 0.12, y: 0.0, z: 0.085 }));
  }

  // Shoulders.
  for (const sx of [-1, 1]) {
    torso.add(mesh(new THREE.SphereGeometry(0.085, 20, 14), m.suit, { x: sx * 0.22, y: 0.3 }));
  }
  // Left arm (tucked, mostly behind the body).
  const la = group();
  la.position.set(-0.24, 0.3, 0);
  la.rotation.z = pose === 'stunned' ? -1.1 : -0.25;
  la.rotation.x = pose === 'duck' ? -0.6 : 0.2;
  la.add(mesh(rb(0.1, 0.2, 0.1, 0.045), m.white, { y: -0.1 }));
  la.add(mesh(new THREE.SphereGeometry(0.05, 14, 10), m.black, { y: -0.21 }));
  la.add(mesh(rb(0.09, 0.14, 0.09, 0.04), m.suit, { y: -0.3 }));
  la.add(mesh(rb(0.1, 0.09, 0.1, 0.04), m.black, { y: -0.4 }));
  torso.add(la);

  // Helmet: white shell with a big dark glass bubble on the back.
  const helmet = group();
  helmet.position.set(0, 0.62, -0.02);
  torso.add(helmet);
  const HR = 0.31;
  helmet.add(mesh(new THREE.SphereGeometry(HR, 72, 54), m.shell));
  const cap = mesh(new THREE.SphereGeometry(HR * 1.012, 72, 54, 0, Math.PI * 2, 0, 1.12), m.glass, { rx: Math.PI / 2 - 0.12 });
  helmet.add(cap);
  helmet.add(mesh(new THREE.TorusGeometry(HR * 0.905, 0.028, 20, 96), m.shell, { rx: -0.12, z: HR * 0.42 * 1.0 }));
  // Neck ring.
  helmet.add(mesh(new THREE.TorusGeometry(0.2, 0.04, 16, 48), m.white, { rx: Math.PI / 2, y: -0.26 }));
  // Ear lights.
  for (const sx of [-1, 1]) {
    helmet.add(mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.06, 32), m.earRing, { x: sx * HR * 0.98, rz: Math.PI / 2 }));
    helmet.add(mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.066, 32), m.ear, { x: sx * HR * 1.0, rz: Math.PI / 2, cast: false }));
  }

  // Right arm stub (shoulder pad) is part of the body; the arm itself is a separate layer.
  if (withArm) {
    const arm = buildArm(m);
    arm.position.set(0.22, 0.3, 0);
    torso.add(arm);
  }

  // Duck / stunned frames hold the blaster close.
  if (pose === 'duck' || pose === 'stunned') {
    const ra = group();
    ra.position.set(0.24, 0.3, 0);
    ra.rotation.z = pose === 'stunned' ? 1.2 : 0.35;
    ra.rotation.x = pose === 'duck' ? -0.7 : 0;
    ra.add(mesh(rb(0.1, 0.2, 0.1, 0.045), m.white, { y: -0.1 }));
    ra.add(mesh(new THREE.SphereGeometry(0.05, 14, 10), m.black, { y: -0.21 }));
    ra.add(mesh(rb(0.1, 0.1, 0.1, 0.04), m.black, { y: -0.3 }));
    const gun = buildChunkyBlaster(m);
    gun.position.set(0.0, -0.33, 0.05);
    gun.rotation.z = pose === 'duck' ? 1.45 : -0.6;
    ra.add(gun);
    torso.add(ra);
  }
  return root;
}

/**
 * Right arm + blaster, built along +x from the shoulder (origin) so the game can rotate
 * the sprite toward the crosshair. Muzzle ends at x ≈ 0.815 m, y ≈ +0.026 m.
 */
export function buildArm(m = astroMats()) {
  const arm = group();
  // Upper arm (white sleeve), elbow, forearm (white), glove.
  arm.add(mesh(rb(0.2, 0.11, 0.11, 0.05), m.white, { x: 0.1 }));
  arm.add(mesh(new THREE.SphereGeometry(0.058, 16, 12), m.black, { x: 0.21 }));
  arm.add(mesh(rb(0.16, 0.1, 0.1, 0.045), m.white, { x: 0.3 }));
  arm.add(mesh(rb(0.1, 0.11, 0.11, 0.045), m.black, { x: 0.4, y: 0.005 }));
  const gun = buildChunkyBlaster(m);
  // Grip sits in the glove; barrel continues along the arm (muzzle at x ≈ 0.815 m).
  gun.position.set(0.315, 0.026, 0);
  arm.add(gun);
  return arm;
}

/**
 * Chunky sci-fi blaster of reference 2376, along +x from the grip at the origin, muzzle
 * at x = 0.5: dark gunmetal body, red top panel with a glowing orange window, cyan light
 * strip, blue barrel with glowing rings and a silver muzzle.
 */
export function buildChunkyBlaster(m = astroMats()) {
  const g = group();
  const gun = plastic(0x1e2336, { rough: 0.32, clearcoat: 0.8, env: 0.7 });
  const red = plastic(0xc4262c, { rough: 0.3, clearcoat: 1, env: 0.8 });
  const blue = plastic(0x2a64d8, { rough: 0.25, clearcoat: 1, env: 0.9 });
  const windowGlow = emissive(0xff9a3a, 1.6, 0xff7a1a);
  const cyan = emissive(0x3ae0ff, 1.4, 0x1ab0ff);
  // Grip + trigger guard.
  g.add(mesh(rb(0.07, 0.15, 0.08, 0.025), gun, { x: 0.02, y: -0.09, rz: -0.2 }));
  // Main body.
  g.add(mesh(rb(0.3, 0.14, 0.13, 0.04), gun, { x: 0.15, y: 0.0 }));
  g.add(mesh(rb(0.24, 0.05, 0.12, 0.02), red, { x: 0.16, y: 0.085 }));
  g.add(mesh(rb(0.12, 0.03, 0.08, 0.012), windowGlow, { x: 0.18, y: 0.112, cast: false }));
  for (const z of [-0.067, 0.067]) g.add(mesh(rb(0.18, 0.025, 0.01, 0.006), cyan, { x: 0.15, y: -0.02, z, cast: false }));
  // Barrel.
  g.add(mesh(new THREE.CylinderGeometry(0.052, 0.058, 0.2, 28), blue, { x: 0.39, rz: Math.PI / 2 }));
  for (const x of [0.33, 0.42]) g.add(mesh(new THREE.TorusGeometry(0.058, 0.01, 10, 28), cyan, { x, ry: Math.PI / 2, cast: false }));
  g.add(mesh(new THREE.CylinderGeometry(0.066, 0.06, 0.04, 28), m.silver, { x: 0.49, rz: Math.PI / 2 }));
  return g;
}
