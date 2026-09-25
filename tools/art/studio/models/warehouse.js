// The robot warehouse environment (reference 2376): glossy tiled floor with warm and
// neon reflections, steel shelving racks full of crates on both sides, magenta neon on
// the left, blue windows on the right, ceiling trusses with warm hanging lamps.
// Everything is placed in game coordinates (x, y, z) → three (x, y, -z).
import { THREE, plastic, metal, matte, emissive, mesh, group, G, rng } from '../core.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { floorTexture, hazardTexture, paintedMetal, signTexture, windowTexture } from '../textures.js';
import { shelfRack, crate, metalCrate, sceneryCratesFar } from './props.js';

function place(obj, x, y, z, ry = 0) {
  obj.position.copy(G(x, y, z));
  obj.rotation.y = ry;
  return obj;
}

export function buildWarehouse({ W, H, variant = 'level' } = {}) {
  const scene = new THREE.Scene();
  const r = rng(variant === 'home' ? 91 : 17);
  scene.background = new THREE.Color(0x0b0a20);
  scene.fog = new THREE.FogExp2(variant === 'home' ? 0x101a4c : 0x1a1040, variant === 'home' ? 0.045 : 0.05);

  // ---------------------------------------------------------------- floor
  const floorW = 14;
  const floorD = 30;
  const reflector = new Reflector(new THREE.PlaneGeometry(floorW, floorD), {
    textureWidth: Math.round(W / 2),
    textureHeight: Math.round(H / 2),
    color: 0x4a4466,
    clipBias: 0.002,
  });
  reflector.rotation.x = -Math.PI / 2;
  reflector.position.copy(G(0, -0.004, floorD / 2 - 1));
  scene.add(reflector);
  const ft = floorTexture({ seed: variant === 'home' ? 3 : 7 });
  ft.repeat.set(floorW / 8, floorD / 8);
  const floorMat = new THREE.MeshStandardMaterial({
    map: ft, roughness: 0.24, metalness: 0.25, transparent: true, opacity: variant === 'home' ? 0.62 : 0.64,
  });
  const floor = mesh(new THREE.PlaneGeometry(floorW, floorD), floorMat, { rx: -Math.PI / 2, cast: false });
  floor.position.copy(G(0, 0, floorD / 2 - 1));
  scene.add(floor);
  // Hazard lanes.
  const hz = new THREE.MeshStandardMaterial({ map: hazardTexture(), roughness: 0.4, transparent: true, opacity: 0.85 });
  const laneGeo = new THREE.PlaneGeometry(0.16, 10);
  for (const x of [-2.25, 2.25]) {
    const l = mesh(laneGeo, hz, { rx: -Math.PI / 2, cast: false });
    l.material = hz.clone();
    l.material.map = hazardTexture();
    l.material.map.repeat.set(1, 10);
    l.material.map.rotation = Math.PI / 2;
    l.position.copy(G(x, 0.004, 9.5));
    scene.add(l);
  }
  const yellowLine = new THREE.MeshStandardMaterial({ color: 0xe0b020, roughness: 0.5, transparent: true, opacity: 0.8 });
  scene.add(place(mesh(new THREE.PlaneGeometry(4.5, 0.12), yellowLine, { rx: -Math.PI / 2, cast: false }), 0, 0.004, 8.5));
  scene.add(place(mesh(new THREE.PlaneGeometry(4.5, 0.12), yellowLine, { rx: -Math.PI / 2, cast: false }), 0, 0.004, 12.5));

  // ---------------------------------------------------------------- walls
  const wallMat = new THREE.MeshStandardMaterial({ map: paintedMetal({ seed: 8, base: [30, 34, 66], scuffs: 120 }), roughness: 0.7, metalness: 0.3 });
  wallMat.map.repeat.set(6, 3);
  const back = mesh(new THREE.PlaneGeometry(floorW, 9), wallMat, { cast: false });
  back.position.copy(G(0, 4.5, 18));
  scene.add(back);
  for (const sx of [-1, 1]) {
    const side = mesh(new THREE.PlaneGeometry(20, 9), wallMat, { ry: sx < 0 ? Math.PI / 2 : -Math.PI / 2, cast: false });
    side.position.copy(G(sx * 5.8, 4.5, 8));
    scene.add(side);
  }
  // Back wall: big roller door + windows.
  const door = new THREE.MeshStandardMaterial({ map: paintedMetal({ seed: 9, base: [44, 50, 88], scuffs: 30 }), roughness: 0.5, metalness: 0.4 });
  door.map.repeat.set(1, 6);
  scene.add(place(mesh(new THREE.PlaneGeometry(3.2, 3.4), door, { cast: false }), 0, 1.7, 17.95));
  scene.add(place(mesh(new THREE.BoxGeometry(3.5, 0.25, 0.3), plastic(0xd9a21e, { rough: 0.5 })), 0, 3.5, 17.9));
  const winBlue = new THREE.MeshStandardMaterial({ map: windowTexture({ seed: 4 }), emissiveMap: windowTexture({ seed: 4 }), emissive: 0xffffff, emissiveIntensity: 1.3, roughness: 0.3 });
  winBlue.userData.glow = 0x2060c0;
  for (const x of [-3.8, 3.8]) scene.add(place(mesh(new THREE.PlaneGeometry(2.4, 1.6), winBlue, { cast: false }), x, 5.2, 17.9));
  scene.add(place(mesh(new THREE.PlaneGeometry(4.2, 1.2), winBlue, { cast: false }), 0, 5.6, 17.9));

  // Right wall: blue windows.
  for (const z of [5, 9, 13]) {
    const w = mesh(new THREE.PlaneGeometry(2.6, 1.7), winBlue, { ry: -Math.PI / 2, cast: false });
    w.position.copy(G(5.75, 5.0, z));
    scene.add(w);
  }
  // Left wall: magenta neon tubes and ROBOT signs.
  const magenta = emissive(0xff2fd0, 2.2, 0xff20c0);
  for (const z of [3.5, 8.5, 13.5]) {
    scene.add(place(mesh(new THREE.BoxGeometry(0.06, 0.06, 3.2), magenta, { cast: false }), -5.7, 5.9, z));
  }
  scene.add(place(mesh(new THREE.BoxGeometry(0.05, 2.6, 0.05), magenta, { cast: false }), -5.7, 3.2, 2.2));
  const signs = variant === 'home' ? [] : [['ROBOT', 3.4, 6.0, 2.2], ['ROBOT', 2.4, 9.8, 1.5]];
  for (const [txt, y, z, w] of signs) {
    const t = signTexture(txt, { color: '#ff6a2a', board: '#3a1422' });
    const m = new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: 0.9, roughness: 0.4 });
    m.userData.glow = 0x8a2a10;
    const s = mesh(new THREE.PlaneGeometry(w, w * 0.31), m, { ry: Math.PI / 2, cast: false });
    s.position.copy(G(-5.6, y, z));
    scene.add(s);
  }
  // Right side warning sign.
  if (variant !== 'home') {
    const t = signTexture('⚠', { color: '#ffb02a', board: '#2a2412', w: 320, h: 320, font: '900 220px sans-serif' });
    const m = new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: 0.7 });
    const s = mesh(new THREE.PlaneGeometry(0.8, 0.8), m, { ry: -Math.PI / 2, cast: false });
    s.position.copy(G(5.6, 2.8, 7.5));
    scene.add(s);
  }

  // ---------------------------------------------------------------- racks & crates
  const rackX = variant === 'home' ? 2.9 : 2.75;
  const rackZs = variant === 'home' ? [2.0, 4.6, 7.2, 9.8, 12.4, 15.0] : [4.2, 6.8, 9.4, 12.0, 14.6];
  rackZs.forEach((z, i) => {
    const L = shelfRack({ seed: 100 + i * 7, levels: 3, h: 4.4, post: 0x2c4f8f, beam: 0xd66a1c });
    scene.add(place(L, -rackX, 0, z, -Math.PI / 2));
    const R = shelfRack({ seed: 200 + i * 5, levels: 3, h: 4.4, post: 0x2c4f8f, beam: 0xd66a1c });
    scene.add(place(R, rackX, 0, z, Math.PI / 2));
  });
  // Neon on the rack fronts: magenta left, cyan right.
  const mag2 = emissive(0xff2fd0, 1.1, 0xa01080);
  const cyan2 = emissive(0x2fc8ff, 0.9, 0x1070c0);
  for (const z of rackZs) {
    scene.add(place(mesh(new THREE.BoxGeometry(0.05, 0.05, 2.4), mag2, { cast: false }), -rackX + 0.52, 4.45, z));
    scene.add(place(mesh(new THREE.BoxGeometry(0.05, 0.05, 2.4), cyan2, { cast: false }), rackX - 0.52, 4.45, z));
  }
  const rackSigns = variant === 'home' ? [] : [['ROBOT', 3.05, 7.2, 1.9], ['ROBOT', 1.55, 9.0, 1.3], ['ROBOT', 2.2, 12.3, 1.4]];
  for (const [txt, y, z, w] of rackSigns) {
    const t = signTexture(txt, { color: '#ff6a2a', board: '#3a1422' });
    const m = new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: 0.85, roughness: 0.4 });
    m.userData.glow = 0x8a2a10;
    const sgn = mesh(new THREE.PlaneGeometry(w, w * 0.31), m, { ry: Math.PI / 2 - 0.25, cast: false });
    sgn.position.copy(G(-rackX + 0.56, y, z));
    scene.add(sgn);
  }
  if (variant !== 'home') {
    const wt = windowTexture({ seed: 12, color: [60, 190, 255], cols: 3, rows: 2 });
    const wm = new THREE.MeshStandardMaterial({ map: wt, emissiveMap: wt, emissive: 0xffffff, emissiveIntensity: 1.1 });
    wm.userData.glow = 0x1a60c0;
    for (const [y, z] of [[3.2, 7.0], [3.5, 11.5]]) {
      const w = mesh(new THREE.PlaneGeometry(1.4, 0.9), wm, { ry: -Math.PI / 2 + 0.25, cast: false });
      w.position.copy(G(rackX - 0.56, y, z));
      scene.add(w);
    }
  }
  // Crate stacks near the racks and the back (clear of the robot's patrol lane).
  const stacks = variant === 'home'
    ? [[-2.0, 3.0], [2.1, 3.4], [-1.9, 8.5], [2.0, 9.5], [-1.2, 15], [1.4, 14.5]]
    : [[-1.95, 10.8], [2.0, 11.5], [-1.4, 15.8], [1.2, 16.2], [-2.0, 6.0]];
  stacks.forEach(([x, z], i) => {
    const s = sceneryCratesFar();
    s.rotation.y = (r() - 0.5) * 0.6;
    scene.add(place(s, x, 0, z, (r() - 0.5) * 0.5));
    if (i % 2 === 0) {
      const top = crate(0.6, 0.5, 0.6, { seed: 300 + i });
      scene.add(place(top, x + 0.1, 1.32, z));
    }
  });
  for (let i = 0; i < 10; i++) {
    const x = (r() < 0.5 ? -1 : 1) * (1.85 + r() * 0.3);
    const z = 7 + r() * 9;
    const c = r() < 0.5 ? metalCrate(0.5, 0.4, 0.5, { seed: 400 + i }) : crate(0.5, 0.42, 0.5, { seed: 400 + i });
    scene.add(place(c, x, 0, z, r() * 1.2));
  }

  // ---------------------------------------------------------------- ceiling
  const ceilY = 7.4;
  const steel = metal(0x161a26, { rough: 0.55, env: 0.3 });
  scene.add(place(mesh(new THREE.PlaneGeometry(floorW, 22), matte(0x0d0f1c), { rx: Math.PI / 2, cast: false }), 0, ceilY, 8));
  for (let z = 1; z <= 18; z += 2.4) {
    scene.add(place(mesh(new THREE.BoxGeometry(floorW, 0.28, 0.22), steel), 0, ceilY - 0.3, z));
    // Diagonal truss web.
    for (let x = -5; x < 5; x += 1.2) {
      const b = mesh(new THREE.BoxGeometry(1.4, 0.06, 0.06), steel, { rz: ((x * 7) % 2 ? 1 : -1) * 0.45 });
      scene.add(place(b, x + 0.6, ceilY - 0.62, z));
    }
    scene.add(place(mesh(new THREE.BoxGeometry(floorW, 0.1, 0.1), steel), 0, ceilY - 0.95, z));
  }
  for (const x of [-2.5, 0, 2.5]) scene.add(place(mesh(new THREE.BoxGeometry(0.2, 0.22, 22), steel), x, ceilY - 1.0, 8));
  // Skylights.
  const sky = emissive(0x2a4cc0, 0.7, 0x102880);
  for (const z of [4, 9, 14]) scene.add(place(mesh(new THREE.PlaneGeometry(2.2, 1.4), sky, { rx: Math.PI / 2, cast: false }), -1.2, ceilY - 0.01, z));
  // Hanging lamps (warm).
  const lampShade = metal(0x1c1e26, { rough: 0.4 });
  const lampGlow = emissive(0xffb060, 1.6, 0xff9030);
  const lampSpots = variant === 'home' ? [[0, 5], [-2.2, 9], [2.2, 12]] : [[0.4, 5.5], [-2.3, 9.5], [2.4, 11.0], [0, 15]];
  for (const [x, z] of lampSpots) {
    scene.add(place(mesh(new THREE.CylinderGeometry(0.01, 0.01, 1.4, 6), steel, { cast: false }), x, ceilY - 1.1, z));
    scene.add(place(mesh(new THREE.ConeGeometry(0.35, 0.28, 24, 1, true), lampShade, { cast: false }), x, ceilY - 1.9, z));
    scene.add(place(mesh(new THREE.CircleGeometry(0.28, 24), lampGlow, { rx: Math.PI / 2, cast: false }), x, ceilY - 2.03, z));
    const sp = new THREE.SpotLight(0xffa048, 70, 14, 0.62, 0.8, 1.6);
    sp.position.copy(G(x, ceilY - 2.1, z));
    sp.target.position.copy(G(x, 0, z - 0.5));
    sp.castShadow = true;
    sp.shadow.mapSize.set(1024, 1024);
    scene.add(sp, sp.target);
  }

  // ---------------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(variant === 'home' ? 0x3c5cff : 0x4a38b8, 0x120a20, variant === 'home' ? 0.6 : 0.45));
  const pl = (color, x, y, z, i, d = 14) => {
    const p = new THREE.PointLight(color, i, d, 1.5);
    p.position.copy(G(x, y, z));
    scene.add(p);
  };
  const leftNeon = variant === 'home' ? 0xd040ff : 0xff38d0;
  pl(leftNeon, -2.1, 2.6, 6.5, 32);
  pl(leftNeon, -2.1, 3.0, 11.0, 26);
  pl(leftNeon, -1.6, 0.6, 4.5, 16, 5);
  pl(0x3aa8ff, 2.1, 3.2, 7.5, 30);
  pl(0x3a90ff, 2.0, 3.8, 12.5, 24);
  pl(0xff7a20, 2.2, 0.6, 3.6, variant === 'home' ? 22 : 38, 7);
  pl(0xff8a30, -0.6, 0.5, 5.2, variant === 'home' ? 14 : 26, 6);
  pl(0xff9a40, -1.5, 1.2, 7.0, 20, 7);
  pl(0x7a5cff, 0, 5.5, 14, 40, 16);
  const key = new THREE.DirectionalLight(0x9aa0ff, 0.5);
  key.position.copy(G(-3, 8, 2));
  scene.add(key);
  return scene;
}
