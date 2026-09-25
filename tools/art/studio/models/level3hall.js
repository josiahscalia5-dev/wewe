// Level 3 environment (reference/2376): a wide robot-warehouse hall, not a corridor.
// Left: a wall of lit shop-like bays with neon "ROBOT" signs and a magenta tube; right:
// steel shelving with blue windows high up, a pink-lit bay and a yellow warning sign;
// far end: blue-lit back wall; open glossy tile floor with yellow hazard markings;
// crate clusters in the mid-ground; dark girder ceiling with warm lamps.
//
// Positions of the landmarks were back-projected from their reference screen positions
// through the game camera (StageCamera: focal 1400, horizon 1170, eye 1.7 m).
// Game coordinates (x right, y up, z depth) → three (x, y, -z).
import { THREE, plastic, metal, matte, emissive, mesh, group, G, rng } from '../core.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { floorTexture, paintedMetal, signTexture, windowTexture, woodTexture } from '../textures.js';
import { shelfRack, crate, metalCrate } from './props.js';

function place(obj, x, y, z, ry = 0) {
  obj.position.copy(G(x, y, z));
  obj.rotation.y = ry;
  return obj;
}

function neonSign(text, w, { color = '#ff6a2a', board = '#3a0f1c', glow = 0x9a2a10, intensity = 1.0 } = {}) {
  const t = signTexture(text, { color, board });
  const m = new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: intensity, roughness: 0.4 });
  m.userData.glow = glow;
  return mesh(new THREE.PlaneGeometry(w, w * 0.31), m, { cast: false });
}

/** Shop-like bay in a wall: dark frame, warm-lit interior with shelves of boxes. */
function bay({ w = 2.6, h = 2.6, d = 1.4, seed = 1, light = 0xffa850, lightK = 1 } = {}) {
  const r = rng(seed);
  const g = group();
  const frame = metal(0x2a2436, { rough: 0.5, env: 0.4 });
  const back = new THREE.MeshStandardMaterial({ color: 0x5a3020, emissive: new THREE.Color(light), emissiveIntensity: 0.28 * lightK, roughness: 0.8 });
  g.add(mesh(new THREE.PlaneGeometry(w, h), back, { y: h / 2, z: -d, cast: false }));
  for (const sx of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(0.16, h + 0.2, 0.2), frame, { x: sx * (w / 2 + 0.08), y: h / 2 }));
  g.add(mesh(new THREE.BoxGeometry(w + 0.5, 0.3, 0.3), frame, { y: h + 0.15 }));
  // Side walls of the bay.
  for (const sx of [-1, 1]) g.add(mesh(new THREE.PlaneGeometry(d, h), back, { x: sx * w / 2, y: h / 2, z: -d / 2, ry: -sx * Math.PI / 2, cast: false }));
  // Shelves with small boxes.
  const shelf = metal(0x3a3242, { rough: 0.5 });
  for (const y of [0.7, 1.45, 2.15]) {
    g.add(mesh(new THREE.BoxGeometry(w - 0.1, 0.05, d * 0.6), shelf, { y, z: -d * 0.62 }));
    let x = -w / 2 + 0.15;
    while (x < w / 2 - 0.3) {
      const bw = 0.2 + r() * 0.3, bh = 0.18 + r() * 0.3;
      const c = r() < 0.7
        ? mesh(new THREE.BoxGeometry(bw, bh, 0.35), new THREE.MeshStandardMaterial({ map: woodTexture({ seed: seed * 50 + (x * 10 | 0), stencil: false }), roughness: 0.7 }), { x: x + bw / 2, y: y + 0.025 + bh / 2, z: -d * 0.62 })
        : mesh(new THREE.BoxGeometry(bw, bh, 0.35), plastic([0x3a70c0, 0xd8a020, 0xc04040][(r() * 3) | 0], { rough: 0.5 }), { x: x + bw / 2, y: y + 0.025 + bh / 2, z: -d * 0.62 });
      g.add(c);
      x += bw + 0.05;
    }
  }
  // Lit interior.
  const p = new THREE.PointLight(light, 4.5 * lightK, 4.5, 1.6);
  p.position.set(0, h * 0.8, -d * 0.35);
  g.add(p);
  return g;
}

export function buildLevel3Hall({ W, H }) {
  const scene = new THREE.Scene();
  const r = rng(2376);
  scene.background = new THREE.Color(0x070818);
  scene.fog = new THREE.FogExp2(0x1a1650, 0.032);

  // ---------------------------------------------------------------- floor
  const floorW = 12, floorD = 34;
  const reflector = new Reflector(new THREE.PlaneGeometry(floorW, floorD), {
    textureWidth: Math.round(W / 2), textureHeight: Math.round(H / 2), color: 0x4a4468, clipBias: 0.002,
  });
  reflector.rotation.x = -Math.PI / 2;
  reflector.position.copy(G(0, -0.004, floorD / 2 - 1));
  scene.add(reflector);
  const ft = floorTexture({ seed: 11, tiles: 8 });
  ft.repeat.set(floorW / 9, floorD / 9);
  const floor = mesh(new THREE.PlaneGeometry(floorW, floorD), new THREE.MeshStandardMaterial({
    map: ft, color: 0xb0a8ff, roughness: 0.28, metalness: 0.25, transparent: true, opacity: 0.66,
  }), { rx: -Math.PI / 2, cast: false });
  floor.position.copy(G(0, 0, floorD / 2 - 1));
  scene.add(floor);
  // Yellow hazard markings: loading-area stripes right of centre and a dashed lane.
  const paint = new THREE.MeshStandardMaterial({ color: 0xe8b020, roughness: 0.45, transparent: true, opacity: 0.85 });
  for (let i = 0; i < 6; i++) {
    const s = mesh(new THREE.PlaneGeometry(0.16, 1.5), paint, { rx: -Math.PI / 2, cast: false });
    s.rotation.z = 0.8;
    s.position.copy(G(0.35 + i * 0.36, 0.004, 4.4));
    scene.add(s);
  }
  for (const [x, z, w, d] of [[1.25, 3.7, 1.9, 0.12], [1.25, 5.1, 1.9, 0.12], [-1.6, 6.4, 0.12, 2.2], [0.4, 8.5, 2.6, 0.12]]) {
    scene.add(place(mesh(new THREE.PlaneGeometry(w, d), paint, { rx: -Math.PI / 2, cast: false }), x, 0.004, z));
  }
  for (let z = 10; z < 24; z += 1.4) {
    scene.add(place(mesh(new THREE.PlaneGeometry(0.12, 0.7), paint, { rx: -Math.PI / 2, cast: false }), 1.5, 0.004, z));
    scene.add(place(mesh(new THREE.PlaneGeometry(0.12, 0.7), paint, { rx: -Math.PI / 2, cast: false }), -1.9, 0.004, z));
  }

  // ---------------------------------------------------------------- walls
  const wallMat = new THREE.MeshStandardMaterial({ map: paintedMetal({ seed: 6, base: [34, 32, 72], scuffs: 90 }), roughness: 0.75, metalness: 0.25 });
  wallMat.map.repeat.set(8, 4);
  const backZ = 27;
  scene.add(place(mesh(new THREE.PlaneGeometry(floorW, 12), wallMat, { cast: false }), 0, 6, backZ));
  for (const sx of [-1, 1]) {
    const side = mesh(new THREE.PlaneGeometry(30, 12), wallMat, { ry: sx < 0 ? Math.PI / 2 : -Math.PI / 2, cast: false });
    side.position.copy(G(sx * 3.55, 6, 13));
    scene.add(side);
  }
  // Far end: blue-lit windows and an opening that throws blue light down the hall.
  const winBlue = new THREE.MeshStandardMaterial({ map: windowTexture({ seed: 31, cols: 6, rows: 2 }), emissive: 0xffffff, roughness: 0.3 });
  winBlue.emissiveMap = winBlue.map;
  winBlue.emissiveIntensity = 1.1;
  winBlue.userData.glow = 0x1a50c0;
  scene.add(place(mesh(new THREE.PlaneGeometry(6.5, 1.6), winBlue, { cast: false }), 0.6, 4.6, backZ - 0.05));
  scene.add(place(mesh(new THREE.PlaneGeometry(2.8, 3.0), emissive(0x1a3ca8, 0.35, 0x102470), { cast: false }), 0.6, 1.5, backZ - 0.05));

  // ---------------------------------------------------------------- left wall: bays + ROBOT signs
  const bays = [[8.6, 2.6, 0xffa040, 1.2], [11.6, 2.6, 0xff9a50, 1.1], [14.6, 2.6, 0xffb060, 1.0], [17.6, 2.4, 0xff9040, 0.9], [20.6, 2.4, 0xffa050, 0.8]];
  bays.forEach(([z, w, light, k], i) => {
    const b = bay({ w, h: 3.0, d: 1.3, seed: 70 + i, light, lightK: k });
    scene.add(place(b, -3.2, 0, z, Math.PI / 2 - 0.55));
  });
  // Big ROBOT sign (reference: left, 41–45% down) and smaller ones further back.
  const s1 = neonSign('ROBOT', 2.0, { intensity: 1.1 });
  s1.position.copy(G(-3.0, 3.45, 11.2));
  s1.rotation.y = Math.PI / 2 - 0.75;
  scene.add(s1);
  const s2 = neonSign('ROBOT', 1.7, { intensity: 0.95 });
  s2.position.copy(G(-3.0, 3.4, 8.2));
  s2.rotation.y = Math.PI / 2 - 0.75;
  scene.add(s2);
  const s3 = neonSign('ROBOT', 1.3, { color: '#ff7a3a', intensity: 0.85 });
  s3.position.copy(G(-3.0, 3.35, 14.2));
  s3.rotation.y = Math.PI / 2 - 0.75;
  scene.add(s3);
  const s4 = neonSign('ROBOT', 1.0, { color: '#6ab8ff', board: '#10183a', glow: 0x1a4aa0, intensity: 0.9 });
  s4.position.copy(G(-2.6, 1.9, 13.0));
  s4.rotation.y = 0.35;
  scene.add(s4);
  // Magenta neon tubes on the left (reference: far left, 30–35% down).
  const magenta = emissive(0xff38e0, 2.4, 0xff20c0);
  for (const [y, z, len] of [[3.9, 6.5, 2.6], [4.6, 10.5, 4.0]]) {
    const tube = mesh(new THREE.CylinderGeometry(0.05, 0.05, len, 12), magenta, { cast: false });
    tube.position.copy(G(-3.4, y, z));
    tube.rotation.x = Math.PI / 2;
    scene.add(tube);
  }

  // ---------------------------------------------------------------- right side: shelving, windows, pink bay
  for (let i = 0; i < 7; i++) {
    const z = 7.5 + i * 2.6;
    const rack = shelfRack({ seed: 800 + i * 3, levels: 4, h: 5.2, d: 1.0, post: 0x1c2c52, beam: 0x8a4a14 });
    scene.add(place(rack, 2.95, 0, z, Math.PI / 2));
  }
  const wt = windowTexture({ seed: 41, color: [70, 170, 255], cols: 4, rows: 2 });
  const wm = new THREE.MeshStandardMaterial({ map: wt, emissiveMap: wt, emissive: 0xffffff, emissiveIntensity: 1.3 });
  wm.userData.glow = 0x1a60d0;
  for (const [y, z] of [[5.6, 9.5], [5.8, 13.5], [5.8, 18], [5.6, 22.5]]) {
    const p = mesh(new THREE.PlaneGeometry(2.2, 1.0), wm, { ry: -Math.PI / 2, cast: false });
    p.position.copy(G(3.5, y, z));
    scene.add(p);
  }
  const pinkBay = bay({ w: 2.2, h: 2.4, d: 1.2, seed: 91, light: 0xff4ab8, lightK: 0.8 });
  scene.add(place(pinkBay, 3.5, 0, 9.4, -Math.PI / 2));
  const warn = signTexture('⚠', { color: '#ffb02a', board: '#2a2412', w: 320, h: 320, font: '900 220px sans-serif' });
  const warnM = new THREE.MeshStandardMaterial({ map: warn, emissiveMap: warn, emissive: 0xffffff, emissiveIntensity: 0.8 });
  const ws = mesh(new THREE.PlaneGeometry(0.8, 0.8), warnM, { ry: -Math.PI / 2, cast: false });
  ws.position.copy(G(2.5, 3.5, 12.5));
  scene.add(ws);

  // ---------------------------------------------------------------- ceiling
  const ceilY = 12;
  const steel = metal(0x151827, { rough: 0.55, env: 0.3 });
  scene.add(place(mesh(new THREE.PlaneGeometry(floorW, 40), matte(0x0a0a16), { rx: Math.PI / 2, cast: false }), 0, ceilY, 14));
  for (let z = 8; z <= 26; z += 2.6) {
    scene.add(place(mesh(new THREE.BoxGeometry(floorW, 0.3, 0.24), steel), 0, ceilY - 0.3, z));
    for (let x = -5; x < 5; x += 1.25) {
      const b = mesh(new THREE.BoxGeometry(1.45, 0.07, 0.07), steel, { rz: ((Math.round(x * 4)) % 2 ? 1 : -1) * 0.5 });
      scene.add(place(b, x + 0.62, ceilY - 0.75, z));
    }
    scene.add(place(mesh(new THREE.BoxGeometry(floorW, 0.1, 0.1), steel), 0, ceilY - 1.15, z));
  }
  for (const x of [-3, 0, 3]) scene.add(place(mesh(new THREE.BoxGeometry(0.22, 0.26, 30), steel), x, ceilY - 1.2, 14));
  const lampGlow = emissive(0xffb870, 1.2, 0xa05010);
  const lamps = [[-1.0, 8], [1.4, 11], [-1.8, 14.5], [0.8, 18], [-0.6, 22]];
  for (const [x, z] of lamps) {
    scene.add(place(mesh(new THREE.CylinderGeometry(0.16, 0.26, 0.18, 20), steel, { cast: false }), x, ceilY - 1.6, z));
    scene.add(place(mesh(new THREE.CircleGeometry(0.2, 20), lampGlow, { rx: Math.PI / 2, cast: false }), x, ceilY - 1.7, z));
    const sp = new THREE.SpotLight(0xffa860, 70, 18, 0.6, 0.8, 1.4);
    sp.position.copy(G(x, ceilY - 1.75, z));
    sp.target.position.copy(G(x, 0, z - 0.4));
    scene.add(sp, sp.target);
  }

  // ---------------------------------------------------------------- mid-ground crates
  const add = (o, x, z, ry = 0) => scene.add(place(o, x, 0, z, ry));
  // Centre-right cluster (reference: 50–63% across, 60–68% down): blue metal crates.
  const c1 = group(metalCrate(0.62, 0.42, 0.55, { seed: 101 }), metalCrate(0.5, 0.34, 0.48, { seed: 102 }));
  c1.children[1].position.set(0.04, 0.42, 0);
  add(c1, 0.3, 5.7, -0.15);
  add(crate(0.5, 0.36, 0.48, { seed: 103, tint: 'light' }), 0.85, 5.1, 0.3);
  add(metalCrate(0.46, 0.34, 0.44, { seed: 104 }), 1.25, 7.3, 0.4);
  // Far centre crates (40–55% across, 55–60% down).
  const c2 = group(crate(0.7, 0.5, 0.6, { seed: 111 }), crate(0.55, 0.4, 0.5, { seed: 112, tint: 'light' }), metalCrate(0.6, 0.45, 0.55, { seed: 113 }));
  c2.children[1].position.set(0.05, 0.5, 0);
  c2.children[2].position.set(0.75, 0, 0.1);
  add(c2, -0.5, 10.2, 0.1);
  // Left cluster (0–30% across, 52–63% down): tall crate stacks by a lit shelf unit.
  const c3 = group(crate(0.8, 0.6, 0.7, { seed: 121, tint: 'dark' }), crate(0.7, 0.55, 0.65, { seed: 122 }), crate(0.6, 0.45, 0.55, { seed: 123, tint: 'light' }));
  c3.children[1].position.set(0.05, 0.6, 0);
  c3.children[2].position.set(0.02, 1.15, 0);
  add(c3, -1.9, 7.9, 0.2);
  add(group(metalCrate(0.7, 0.5, 0.6, { seed: 124 })), -2.7, 8.6, -0.2);
  add(crate(0.6, 0.5, 0.6, { seed: 125 }), -1.25, 8.4, 0.5);
  const rackL = shelfRack({ seed: 130, levels: 3, h: 2.4, w: 1.8, d: 0.7, post: 0x2a4070, beam: 0xc06a1c });
  add(rackL, -2.9, 10.8, 0.25);
  const unitLight = new THREE.PointLight(0xffb060, 6, 3.5, 1.5);
  unitLight.position.copy(G(-2.5, 2.2, 10.2));
  scene.add(unitLight);
  // Right cluster near the robot's mid-ground (62–75% across).
  const c4 = group(crate(0.65, 0.5, 0.6, { seed: 141 }), crate(0.55, 0.45, 0.5, { seed: 142, tint: 'dark' }));
  c4.children[1].position.set(0.02, 0.5, 0);
  add(c4, 2.3, 7.0, -0.3);
  // Scatter further back.
  for (let i = 0; i < 16; i++) {
    const x = (r() - 0.5) * 6.5;
    const z = 12 + r() * 12;
    if (Math.abs(x - 0.4) < 0.9) continue;
    const c = r() < 0.4 ? metalCrate(0.55, 0.42, 0.5, { seed: 900 + i }) : crate(0.6, 0.45, 0.55, { seed: 900 + i, tint: r() < 0.5 ? 'dark' : 'mid' });
    add(c, x, z, r() * 1.5);
  }

  // ---------------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0x5a60e0, 0x1a0c30, 1.0));
  const pl = (color, x, y, z, i, d = 10, decay = 1.5) => {
    const p = new THREE.PointLight(color, i, d, decay);
    p.position.copy(G(x, y, z));
    scene.add(p);
    return p;
  };
  pl(0x2a64ff, 0.5, 2.5, backZ - 2, 30, 26, 1.2); // blue far end
  pl(0x3a6cff, 1.0, 4.5, 14, 22, 14);
  pl(0xff38d0, -2.6, 3.4, 7.5, 22, 7); // magenta left
  pl(0xb040ff, -2.4, 4.5, 13, 18, 8);
  pl(0xd040ff, -2.5, 2.0, 6.5, 8, 5);
  pl(0x30a0ff, 2.2, 4.0, 11, 10, 7); // cyan-blue right
  pl(0x4a70ff, 2.2, 5.5, 17, 10, 9);
  pl(0xff5ac0, 2.6, 1.4, 9.4, 5, 3); // pink bay spill
  pl(0xffa050, 1.4, 1.6, 4.8, 12, 5); // warm on the centre-right crates + floor
  pl(0xff9a40, -0.3, 2.2, 9.5, 10, 6);
  pl(0x6a5cff, 0, 6, 16, 30, 16);
  const key = new THREE.DirectionalLight(0x8a90ff, 0.35);
  key.position.copy(G(-2, 9, 1));
  scene.add(key);
  return scene;
}
