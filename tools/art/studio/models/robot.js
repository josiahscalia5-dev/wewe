// Large patrol robot (reference 2376 / 2372 / 2374): stocky white-and-maroon armour,
// dark steel joints, boxy head with a dark visor and two big glowing red eyes, heavy
// claw hands. Rigged with simple joint groups so walk cycles and poses are rendered
// from one model.
import { THREE, plastic, metal, emissive, matte, mesh, group } from '../core.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const rb = (w, h, d, r = 0.05, s = 4) => new RoundedBoxGeometry(w, h, d, s, r);

function mats(eyeBoost = 1) {
  return {
    // Reference 2376: mauve-grey armour plates over maroon, gunmetal joints.
    white: plastic(0x8e7482, { rough: 0.34, clearcoat: 0.7, env: 0.4 }),
    grey: plastic(0x4c3040, { rough: 0.42, clearcoat: 0.5, env: 0.4 }),
    maroon: plastic(0x5e1a2c, { rough: 0.38, clearcoat: 0.6, env: 0.45 }),
    red: plastic(0xc0283a, { rough: 0.32, clearcoat: 0.8, env: 0.5 }),
    steel: metal(0x32282f, { rough: 0.45, env: 0.5 }),
    black: matte(0x121318, { rough: 0.6 }),
    visor: plastic(0x0b0c12, { rough: 0.2, clearcoat: 1, env: 0.8 }),
    eye: emissive(0xff4418, 2.4 * eyeBoost, eyeBoost > 1 ? 0xff3a0a : 0xff2a06),
    eyeCore: emissive(0xffc4a8, 1.7 * eyeBoost, 0xff3a14),
    chestLight: emissive(0xff3b22, 1.6 * eyeBoost, 0xff2008),
  };
}

function limb(len, rTop, rBot, mat) {
  return mesh(new THREE.CylinderGeometry(rTop, rBot, len, 24), mat, { y: -len / 2 });
}

/** Builds the robot; returns the root group and its joints (angles in radians). */
export function buildRobot({ eyeBoost = 1 } = {}) {
  const m = mats(eyeBoost);
  const root = group();
  const hips = group();
  hips.position.y = 1.02;
  root.add(hips);

  // Pelvis.
  hips.add(mesh(rb(0.62, 0.26, 0.42, 0.08), m.steel, { y: 0 }));
  hips.add(mesh(rb(0.7, 0.12, 0.46, 0.05), m.maroon, { y: 0.1 }));

  // Torso.
  const torso = group();
  torso.position.y = 0.16;
  hips.add(torso);
  torso.add(mesh(rb(0.5, 0.3, 0.36, 0.08), m.steel, { y: 0.12 }));
  torso.add(mesh(rb(1.12, 0.66, 0.72, 0.18), m.white, { y: 0.52 }));
  torso.add(mesh(rb(0.9, 0.3, 0.74, 0.1), m.grey, { y: 0.28 }));
  torso.add(mesh(rb(1.14, 0.12, 0.7, 0.05), m.maroon, { y: 0.2 }));
  // Chest plate details.
  torso.add(mesh(rb(0.56, 0.32, 0.1, 0.05), m.grey, { y: 0.6, z: 0.35 }));
  torso.add(mesh(rb(0.24, 0.12, 0.06, 0.03), m.visor, { y: 0.62, z: 0.41 }));
  torso.add(mesh(new THREE.SphereGeometry(0.035, 16, 12), m.chestLight, { x: -0.06, y: 0.62, z: 0.44 }));
  torso.add(mesh(new THREE.SphereGeometry(0.035, 16, 12), m.chestLight, { x: 0.06, y: 0.62, z: 0.44 }));
  for (const sx of [-1, 1]) {
    torso.add(mesh(rb(0.14, 0.5, 0.6, 0.05), m.maroon, { x: sx * 0.53, y: 0.52 }));
  }
  // Back pack / exhaust.
  torso.add(mesh(rb(0.6, 0.46, 0.22, 0.08), m.grey, { y: 0.56, z: -0.36 }));
  for (const sx of [-1, 1]) torso.add(mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.3, 16), m.steel, { x: sx * 0.18, y: 0.86, z: -0.42 }));

  // Head.
  const neck = group();
  neck.position.set(0, 0.8, 0.12);
  torso.add(neck);
  neck.add(mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.14, 20), m.steel, { y: 0.04 }));
  const head = group();
  head.position.y = 0.12;
  neck.add(head);
  head.add(mesh(rb(0.66, 0.46, 0.56, 0.14), m.maroon, { y: 0.2 }));
  head.add(mesh(rb(0.62, 0.16, 0.5, 0.07), m.white, { y: 0.43, z: -0.02 }));
  head.add(mesh(rb(0.7, 0.1, 0.58, 0.04), m.steel, { y: 0.0 }));
  head.add(mesh(rb(0.56, 0.24, 0.08, 0.07), m.visor, { y: 0.2, z: 0.28 }));
  for (const sx of [-1, 1]) {
    head.add(mesh(rb(0.22, 0.17, 0.05, 0.07), m.eye, { x: sx * 0.13, y: 0.2, z: 0.325, cast: false }));
    head.add(mesh(rb(0.12, 0.08, 0.04, 0.03), m.eyeCore, { x: sx * 0.13, y: 0.205, z: 0.345, cast: false }));
    head.add(mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.08, 20), m.steel, { x: sx * 0.36, y: 0.2, rz: Math.PI / 2 }));
    head.add(mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.1, 16), m.red, { x: sx * 0.4, y: 0.2, rz: Math.PI / 2 }));
  }
  head.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.18, 8), m.steel, { x: 0.18, y: 0.5 }));
  head.add(mesh(new THREE.SphereGeometry(0.03, 12, 8), m.chestLight, { x: 0.18, y: 0.6 }));

  // Arms.
  const arms = {};
  for (const side of ['L', 'R']) {
    const sx = side === 'L' ? -1 : 1;
    const shoulder = group();
    shoulder.position.set(sx * 0.7, 0.7, 0);
    torso.add(shoulder);
    shoulder.add(mesh(new THREE.SphereGeometry(0.2, 24, 18), m.steel));
    // Shoulder armour.
    shoulder.add(mesh(rb(0.46, 0.34, 0.52, 0.14), m.white, { x: sx * 0.1, y: 0.1 }));
    shoulder.add(mesh(rb(0.48, 0.08, 0.54, 0.03), m.red, { x: sx * 0.1, y: -0.04 }));
    shoulder.add(mesh(new THREE.SphereGeometry(0.055, 14, 10), m.chestLight, { x: sx * 0.34, y: 0.12, z: 0.12, cast: false }));
    const upper = group();
    shoulder.add(upper);
    upper.add(limb(0.34, 0.13, 0.12, m.steel));
    const elbow = group();
    elbow.position.y = -0.38;
    upper.add(elbow);
    elbow.add(mesh(new THREE.SphereGeometry(0.13, 20, 14), m.black));
    elbow.add(mesh(rb(0.34, 0.44, 0.36, 0.11), m.white, { y: -0.24 }));
    elbow.add(mesh(rb(0.36, 0.09, 0.38, 0.03), m.maroon, { y: -0.06 }));
    const hand = group();
    hand.position.y = -0.5;
    elbow.add(hand);
    hand.add(mesh(rb(0.26, 0.18, 0.26, 0.06), m.steel, { y: -0.05 }));
    const fingers = [];
    for (const [fx, fz] of [[-0.08, 0.09], [0.08, 0.09], [0, -0.1]]) {
      const f = group();
      f.position.set(fx, -0.13, fz);
      f.add(mesh(rb(0.07, 0.18, 0.07, 0.025), m.black, { y: -0.08 }));
      f.add(mesh(new THREE.ConeGeometry(0.04, 0.08, 10), m.steel, { y: -0.2, rx: Math.PI }));
      hand.add(f);
      fingers.push(f);
    }
    arms[side] = { shoulder, upper, elbow, hand, fingers };
  }

  // Legs.
  const legs = {};
  for (const side of ['L', 'R']) {
    const sx = side === 'L' ? -1 : 1;
    const hip = group();
    hip.position.set(sx * 0.24, -0.08, 0);
    hips.add(hip);
    hip.add(mesh(new THREE.SphereGeometry(0.14, 20, 14), m.steel));
    hip.add(mesh(rb(0.32, 0.42, 0.36, 0.11), m.white, { y: -0.24 }));
    const knee = group();
    knee.position.y = -0.46;
    hip.add(knee);
    knee.add(mesh(new THREE.SphereGeometry(0.1, 20, 14), m.black));
    knee.add(mesh(rb(0.18, 0.12, 0.08, 0.04), m.red, { y: 0.02, z: 0.1 }));
    knee.add(limb(0.34, 0.11, 0.12, m.steel));
    knee.add(mesh(rb(0.28, 0.32, 0.3, 0.08), m.grey, { y: -0.2 }));
    const ankle = group();
    ankle.position.y = -0.42;
    knee.add(ankle);
    ankle.add(mesh(rb(0.36, 0.16, 0.5, 0.07), m.white, { y: -0.05, z: 0.06 }));
    ankle.add(mesh(rb(0.38, 0.06, 0.52, 0.02), m.maroon, { y: -0.13, z: 0.06 }));
    legs[side] = { hip, knee, ankle };
  }

  return { root, hips, torso, neck, head, arms, legs, mats: m };
}

/** Applies a named pose. phase ∈ [0, 1) for walk cycles. */
export function poseRobot(r, pose, phase = 0) {
  const a = phase * Math.PI * 2;
  const reset = () => {
    // Crouched, arms-out stalking stance (reference 2376).
    r.hips.position.y = 0.9;
    r.hips.rotation.set(0, 0, 0);
    r.torso.rotation.set(0.3, 0, 0);
    r.head.rotation.set(-0.22, 0, 0);
    for (const s of ['L', 'R']) {
      const sx = s === 'L' ? -1 : 1;
      r.arms[s].shoulder.rotation.set(-0.35, 0, sx * 0.48);
      r.arms[s].elbow.rotation.set(-0.8, 0, -sx * 0.2);
      r.arms[s].hand.rotation.set(0, 0, 0);
      for (const f of r.arms[s].fingers) f.rotation.set(0.35, 0, 0);
      r.legs[s].hip.rotation.set(-0.35, 0, sx * 0.2);
      r.legs[s].knee.rotation.set(0.6, 0, 0);
      r.legs[s].ankle.rotation.set(-0.25, 0, -sx * 0.2);
    }
  };
  reset();
  if (pose === 'walk') {
    const swing = Math.sin(a) * 0.5;
    r.legs.L.hip.rotation.x = -swing - 0.12;
    r.legs.R.hip.rotation.x = swing - 0.12;
    r.legs.L.knee.rotation.x = 0.25 + Math.max(0, Math.sin(a + Math.PI / 2)) * 0.8;
    r.legs.R.knee.rotation.x = 0.25 + Math.max(0, Math.sin(a - Math.PI / 2)) * 0.8;
    r.legs.L.ankle.rotation.x = -r.legs.L.hip.rotation.x * 0.5 - r.legs.L.knee.rotation.x * 0.4;
    r.legs.R.ankle.rotation.x = -r.legs.R.hip.rotation.x * 0.5 - r.legs.R.knee.rotation.x * 0.4;
    r.legs.L.hip.rotation.x -= 0.2;
    r.legs.R.hip.rotation.x -= 0.2;
    r.legs.L.knee.rotation.x += 0.25;
    r.legs.R.knee.rotation.x += 0.25;
    r.arms.L.shoulder.rotation.x = -0.35 + swing * 0.5;
    r.arms.R.shoulder.rotation.x = -0.35 - swing * 0.5;
    r.arms.L.elbow.rotation.x = -0.8 - Math.max(0, swing) * 0.3;
    r.arms.R.elbow.rotation.x = -0.8 - Math.max(0, -swing) * 0.3;
    r.hips.position.y = 0.9 - Math.abs(Math.cos(a)) * 0.05;
    r.torso.rotation.y = Math.sin(a) * 0.1;
    r.torso.rotation.x = 0.32;
    r.hips.rotation.z = Math.sin(a) * 0.03;
  } else if (pose === 'scan') {
    r.head.rotation.y = 0.28;
    r.torso.rotation.y = 0.08;
    r.arms.L.elbow.rotation.x = -0.5;
    r.arms.R.elbow.rotation.x = -0.5;
  } else if (pose === 'alert') {
    r.torso.rotation.x = 0.12;
    r.head.rotation.x = 0.1;
    for (const s of ['L', 'R']) {
      const sx = s === 'L' ? -1 : 1;
      r.arms[s].shoulder.rotation.set(-0.9, 0, sx * 0.55);
      r.arms[s].elbow.rotation.x = -1.2;
      for (const f of r.arms[s].fingers) f.rotation.x = 0.5;
    }
    r.legs.L.hip.rotation.x = -0.2;
    r.legs.L.knee.rotation.x = 0.35;
    r.legs.R.hip.rotation.x = 0.15;
    r.hips.position.y = 0.99;
  } else if (pose === 'lunge') {
    r.hips.rotation.x = 0.25;
    r.torso.rotation.x = 0.3;
    r.head.rotation.x = -0.25;
    for (const s of ['L', 'R']) {
      const sx = s === 'L' ? -1 : 1;
      r.arms[s].shoulder.rotation.set(-1.45, sx * 0.25, sx * 0.2);
      r.arms[s].elbow.rotation.x = -0.35;
      for (const f of r.arms[s].fingers) f.rotation.x = -0.7;
    }
    r.legs.L.hip.rotation.x = -0.75;
    r.legs.L.knee.rotation.x = 0.9;
    r.legs.L.ankle.rotation.x = -0.2;
    r.legs.R.hip.rotation.x = 0.4;
    r.legs.R.knee.rotation.x = 0.4;
    r.hips.position.y = 0.9;
  }
  r.root.updateMatrixWorld(true);
}
