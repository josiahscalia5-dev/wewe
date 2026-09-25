// Home hero (reference 2371): cute robot-astronaut, white rounded helmet with a black
// glass face showing glowing cyan eyes, white/black body, big blue blaster aimed right.
// Also the Home creatures: glossy gummy blobs with big eyes and open smiles.
import { THREE, plastic, emissive, glass, matte, mesh, group } from '../core.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { buildBlaster } from './astronaut.js';

const rb = (w, h, d, r = 0.04, s = 4) => new RoundedBoxGeometry(w, h, d, s, r);

export function buildHero() {
  const white = plastic(0xf1f3f8, { rough: 0.28, clearcoat: 1, env: 0.9 });
  const black = plastic(0x14151c, { rough: 0.35, clearcoat: 0.8, env: 0.7 });
  const face = glass(0x05060e, { rough: 0.05, env: 1.2 });
  const eye = emissive(0x3ae8ff, 2.2, 0x20c8ff);
  const cyanRing = emissive(0x2ad0ff, 1.4, 0x18a8ff);
  const root = group();

  // Legs (running pose).
  const hips = group();
  hips.position.y = 0.52;
  root.add(hips);
  hips.add(mesh(rb(0.36, 0.16, 0.26, 0.07), black));
  const leg = (sx, rx, knee) => {
    const hp = group();
    hp.position.set(sx * 0.11, -0.04, 0);
    hp.rotation.x = rx;
    hp.add(mesh(rb(0.17, 0.24, 0.18, 0.07), white, { y: -0.12 }));
    const k = group();
    k.position.y = -0.25;
    k.rotation.x = knee;
    k.add(mesh(new THREE.SphereGeometry(0.07, 18, 12), black));
    k.add(mesh(rb(0.15, 0.2, 0.16, 0.06), black, { y: -0.1 }));
    k.add(mesh(rb(0.19, 0.1, 0.26, 0.05), white, { y: -0.22, z: 0.04 }));
    hp.add(k);
    hips.add(hp);
  };
  leg(-1, -0.55, 0.8);
  leg(1, 0.5, 0.35);

  // Torso.
  const torso = group();
  torso.position.y = 0.08;
  torso.rotation.y = -0.35;
  hips.add(torso);
  torso.add(mesh(rb(0.42, 0.36, 0.3, 0.13), white, { y: 0.18 }));
  torso.add(mesh(rb(0.3, 0.08, 0.31, 0.03), black, { y: 0.02 }));
  torso.add(mesh(new THREE.SphereGeometry(0.045, 18, 12), eye, { y: 0.2, z: 0.15 }));
  torso.add(mesh(new THREE.TorusGeometry(0.06, 0.012, 10, 28), black, { y: 0.2, z: 0.15 }));

  // Head / helmet.
  const head = group();
  head.position.set(0, 0.6, 0.02);
  head.rotation.set(0.05, 0.12, 0.06);
  torso.add(head);
  const HR = 0.34;
  head.add(mesh(new THREE.SphereGeometry(HR, 72, 54), white, { sx: 1.08, sy: 0.96 }));
  const visor = mesh(new THREE.SphereGeometry(HR * 1.025, 72, 54, 0, Math.PI * 2, 0, 0.95), face, { rx: Math.PI / 2, sx: 1.08, sz: 0.96 });
  head.add(visor);
  // Eyes + smile on the visor.
  for (const sx of [-1, 1]) {
    head.add(mesh(new THREE.SphereGeometry(0.062, 24, 18), eye, { x: sx * 0.11, y: 0.02, z: HR * 0.96, sx: 0.75, sy: 1.1, sz: 0.3, cast: false }));
  }
  const smile = mesh(new THREE.TorusGeometry(0.06, 0.009, 8, 24, Math.PI * 0.7), eye, { y: -0.08, z: HR * 0.97, rz: Math.PI + Math.PI * 0.15, cast: false });
  head.add(smile);
  // Ear discs.
  for (const sx of [-1, 1]) {
    head.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 32), white, { x: sx * HR * 1.05, rz: Math.PI / 2 }));
    head.add(mesh(new THREE.TorusGeometry(0.07, 0.016, 12, 32), cyanRing, { x: sx * HR * 1.09, ry: Math.PI / 2 }));
  }

  // Left arm: punching forward.
  const la = group();
  la.position.set(-0.27, 0.28, 0);
  la.rotation.set(-1.25, 0, -0.35);
  la.add(mesh(new THREE.SphereGeometry(0.08, 18, 12), black));
  la.add(mesh(rb(0.12, 0.2, 0.12, 0.05), white, { y: -0.12 }));
  la.add(mesh(rb(0.11, 0.14, 0.11, 0.05), black, { y: -0.27 }));
  la.add(mesh(new THREE.SphereGeometry(0.085, 20, 14), black, { y: -0.38 }));
  torso.add(la);

  // Right arm with the big blue blaster pointing right (+x).
  const ra = group();
  ra.position.set(0.27, 0.26, 0);
  ra.rotation.set(0, 0.35, 1.45);
  ra.add(mesh(new THREE.SphereGeometry(0.08, 18, 12), black));
  ra.add(mesh(rb(0.12, 0.22, 0.12, 0.05), white, { y: -0.12 }));
  ra.add(mesh(new THREE.SphereGeometry(0.075, 18, 12), black, { y: -0.26 }));
  torso.add(ra);
  const gun = buildBlaster({ len: 0.62, body: 0x2148d8, accent: 0x40d8ff, dark: 0x101528, scale: 1.25 });
  // Held in the right hand, barrel continuing along the arm.
  gun.position.set(0.125, -0.2, 0.03);
  gun.rotation.set(0, 0, -Math.PI / 2);
  ra.add(gun);
  return root;
}

/** Glossy gummy creature: body with bumps, big eyes, open smile. */
export function buildCreature(color, { mood = 0 } = {}) {
  const body = new THREE.MeshPhysicalMaterial({
    color, roughness: 0.22, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.1,
    sheen: 0.6, sheenColor: new THREE.Color(0xffffff), emissive: color, emissiveIntensity: 0.28,
  });
  body.userData.glow = color;
  const white = plastic(0xffffff, { rough: 0.15, clearcoat: 1, env: 0.8 });
  const black = plastic(0x0a0a10, { rough: 0.2, clearcoat: 1 });
  const mouth = matte(0x5a0a1a, { rough: 0.6 });
  const tongue = plastic(0xff5a7a, { rough: 0.4 });
  const g = group();
  g.add(mesh(new THREE.SphereGeometry(0.5, 64, 48), body, { sy: 0.92 }));
  const bumps = 9;
  for (let i = 0; i < bumps; i++) {
    const a = (i / bumps) * Math.PI * 2;
    for (const lat of [0.25, -0.35]) {
      const r = 0.47;
      const x = Math.cos(a) * Math.cos(lat) * r;
      const y = Math.sin(lat) * r * 0.92;
      const z = Math.sin(a) * Math.cos(lat) * r;
      if (z > 0.3 && Math.abs(y) < 0.3) continue;
      g.add(mesh(new THREE.SphereGeometry(0.1, 24, 16), body, { x, y, z }));
    }
  }
  g.add(mesh(new THREE.SphereGeometry(0.1, 24, 16), body, { y: 0.47 }));
  // Eyes.
  for (const sx of [-1, 1]) {
    g.add(mesh(new THREE.SphereGeometry(0.13, 32, 24), white, { x: sx * 0.16, y: 0.1, z: 0.4, sz: 0.55 }));
    g.add(mesh(new THREE.SphereGeometry(0.075, 24, 16), black, { x: sx * 0.15 + 0.01, y: 0.09 - mood * 0.01, z: 0.47, sz: 0.5 }));
    g.add(mesh(new THREE.SphereGeometry(0.024, 12, 8), white, { x: sx * 0.15 - 0.02, y: 0.13, z: 0.505, sz: 0.5 }));
  }
  // Open smile.
  g.add(mesh(new THREE.SphereGeometry(0.17, 32, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mouth, { y: -0.07, z: 0.45, sx: 1.15, sy: 1.1, sz: 0.35 }));
  g.add(mesh(new THREE.SphereGeometry(0.085, 20, 14), tongue, { y: -0.2, z: 0.46, sx: 1.3, sy: 0.6, sz: 0.35 }));
  return g;
}
