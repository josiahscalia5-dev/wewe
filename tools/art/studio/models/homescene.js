// Home background (reference 2371): dark blue robot warehouse seen down a tall aisle.
// Strong blue light at the far end (it back-lights the hero), steel racks full of crates
// climbing out of frame on both sides, a magenta neon bar high on the left, warm amber
// strips on the right racks, wooden crate stacks in the bottom corners and a glossy dark
// floor with blue and orange reflections. Nothing is placed where the hero, logo or
// creatures stand; the environment only has to read around them.
//
// Positions of the foreground crates were back-projected from their reference screen
// positions through the Home camera (eye 1.3 m, focal 1750 px, horizon at 47%).
import { THREE, plastic, metal, matte, emissive, mesh, group, G, rng } from '../core.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { floorTexture, paintedMetal, windowTexture } from '../textures.js';
import { shelfRack, crate, metalCrate } from './props.js';

export const HOME_CAM = { eye: 1.3, f: 1750, horizon: 0.47 };

function place(obj, x, y, z, ry = 0) {
  obj.position.copy(G(x, y, z));
  obj.rotation.y = ry;
  return obj;
}

export function buildHomeScene({ W, H }) {
  const scene = new THREE.Scene();
  const r = rng(2371);
  scene.background = new THREE.Color(0x03061a);
  scene.fog = new THREE.FogExp2(0x0a1450, 0.035);

  // ---------------------------------------------------------------- floor
  const floorW = 12, floorD = 40;
  const reflector = new Reflector(new THREE.PlaneGeometry(floorW, floorD), {
    textureWidth: Math.round(W / 2), textureHeight: Math.round(H / 2), color: 0x2c3252, clipBias: 0.002,
  });
  reflector.rotation.x = -Math.PI / 2;
  reflector.position.copy(G(0, -0.004, floorD / 2 - 1));
  scene.add(reflector);
  const ft = floorTexture({ seed: 5, tiles: 6 });
  ft.repeat.set(floorW / 7, floorD / 7);
  const floor = mesh(new THREE.PlaneGeometry(floorW, floorD), new THREE.MeshStandardMaterial({
    map: ft, color: 0x9aa8ff, roughness: 0.3, metalness: 0.3, transparent: true, opacity: 0.7,
  }), { rx: -Math.PI / 2, cast: false });
  floor.position.copy(G(0, 0, floorD / 2 - 1));
  scene.add(floor);

  // ---------------------------------------------------------------- far end: bright blue opening
  const backZ = 26;
  const wall = new THREE.MeshStandardMaterial({ map: paintedMetal({ seed: 4, base: [22, 28, 70], scuffs: 60 }), roughness: 0.7, metalness: 0.3 });
  wall.map.repeat.set(5, 3);
  scene.add(place(mesh(new THREE.PlaneGeometry(floorW, 14), wall, { cast: false }), 0, 7, backZ));
  const glowBlue = emissive(0x2a6cff, 1.1, 0x1a50e0);
  scene.add(place(mesh(new THREE.PlaneGeometry(3.6, 4.2), glowBlue, { cast: false }), 0, 2.1, backZ - 0.05));
  const win = new THREE.MeshStandardMaterial({ map: windowTexture({ seed: 9, color: [60, 150, 255], cols: 5, rows: 2 }), emissive: 0xffffff, roughness: 0.3 });
  win.emissiveMap = win.map;
  win.emissiveIntensity = 0.8;
  win.userData.glow = 0x1a50c0;
  scene.add(place(mesh(new THREE.PlaneGeometry(6, 1.6), win, { cast: false }), 0, 6.2, backZ - 0.05));

  // ---------------------------------------------------------------- racks (both sides, out of frame)
  const rackX = 2.35;
  for (let i = 0; i < 9; i++) {
    const z = 3.2 + i * 2.55;
    for (const sx of [-1, 1]) {
      const rack = shelfRack({ seed: 500 + i * 11 + (sx > 0 ? 3 : 0), levels: 4, h: 7.2, d: 1.1, post: 0x1a2e62, beam: 0xa04e16 });
      scene.add(place(rack, sx * rackX, 0, z, sx < 0 ? -Math.PI / 2 : Math.PI / 2));
    }
  }
  // Warm amber strips on the right racks, cooler on the left; a few blue window panels.
  const amber = emissive(0xffa040, 1.6, 0xff8020);
  const amberSoft = emissive(0xff9a40, 1.2, 0xa04a10);
  for (const [y, z, len] of [[3.35, 4.4, 1.8], [1.55, 6.4, 1.6], [3.35, 9.5, 1.8]]) {
    scene.add(place(mesh(new THREE.BoxGeometry(0.05, 0.06, len), amber, { cast: false }), rackX - 0.6, y, z));
  }
  for (const [y, z, len] of [[1.55, 5.0, 1.4], [5.15, 7.8, 1.8]]) {
    scene.add(place(mesh(new THREE.BoxGeometry(0.05, 0.05, len), amberSoft, { cast: false }), -rackX + 0.6, y, z));
  }
  const wt = windowTexture({ seed: 21, color: [70, 170, 255], cols: 3, rows: 2 });
  const wm = new THREE.MeshStandardMaterial({ map: wt, emissiveMap: wt, emissive: 0xffffff, emissiveIntensity: 0.8 });
  wm.userData.glow = 0x1a60d0;
  for (const [sx, y, z] of [[1, 4.3, 5.6], [1, 5.9, 11], [-1, 4.8, 12.5], [1, 2.4, 14]]) {
    const p = mesh(new THREE.PlaneGeometry(1.3, 0.8), wm, { ry: sx > 0 ? -Math.PI / 2 : Math.PI / 2, cast: false });
    p.position.copy(G(sx * (rackX - 0.58), y, z));
    scene.add(p);
  }
  // Magenta neon bar high on the left (reference: left edge, 20–26% down).
  const magenta = emissive(0xff38e0, 2.0, 0xff20c0);
  const bar = mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 16), magenta, { cast: false });
  bar.position.copy(G(-1.12, 2.62, 3.0));
  bar.rotation.set(0.0, 0.0, 0.95);
  scene.add(bar);
  const bar2 = mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 12), emissive(0xd040ff, 1.6, 0x8020c0), { cast: false });
  bar2.position.copy(G(-rackX + 0.62, 6.0, 9));
  bar2.rotation.x = Math.PI / 2;
  scene.add(bar2);

  // ---------------------------------------------------------------- ceiling (mostly out of frame)
  const steel = metal(0x121626, { rough: 0.55, env: 0.3 });
  const ceilY = 9.5;
  scene.add(place(mesh(new THREE.PlaneGeometry(floorW, 40), matte(0x05070f), { rx: Math.PI / 2, cast: false }), 0, ceilY, 16));
  for (let z = 4; z <= 26; z += 3) scene.add(place(mesh(new THREE.BoxGeometry(floorW, 0.3, 0.25), steel), 0, ceilY - 0.4, z));
  const lamp = emissive(0x5a90ff, 0.9, 0x3a70ff);
  for (const z of [8, 14, 20]) scene.add(place(mesh(new THREE.BoxGeometry(0.2, 0.06, 2.2), lamp, { cast: false }), 0, ceilY - 0.6, z));

  // ---------------------------------------------------------------- foreground crates (bottom corners)
  const L1 = crate(0.95, 0.52, 0.8, { seed: 71, tint: 'dark' });
  scene.add(place(L1, -1.28, 0, 2.25, 0.25));
  const L2 = metalCrate(0.62, 0.38, 0.6, { seed: 72 });
  scene.add(place(L2, -1.5, 0, 3.6, -0.3));
  const L3 = group(crate(0.55, 0.32, 0.5, { seed: 73 }), crate(0.46, 0.3, 0.45, { seed: 74, tint: 'light' }));
  L3.children[1].position.set(0.05, 0.32, 0.0);
  scene.add(place(L3, -1.82, 0, 5.1, 0.35));
  scene.add(place(crate(0.5, 0.3, 0.5, { seed: 75, tint: 'light' }), -1.5, 0, 5.4, -0.2));
  const R1 = group(crate(0.7, 0.4, 0.6, { seed: 81 }), crate(0.66, 0.38, 0.6, { seed: 82, tint: 'light' }), crate(0.6, 0.36, 0.55, { seed: 83 }));
  R1.children[1].position.set(0.02, 0.4, 0);
  R1.children[2].position.set(-0.02, 0.78, 0);
  scene.add(place(R1, 1.3, 0, 2.75, -0.2));
  scene.add(place(crate(0.62, 0.42, 0.6, { seed: 84, tint: 'dark' }), 1.05, 0, 2.15, 0.15));
  // Mid-distance scatter along both racks.
  for (let i = 0; i < 14; i++) {
    const sx = i % 2 ? 1 : -1;
    const x = sx * (1.45 + r() * 0.35);
    const z = 7 + r() * 14;
    const c = r() < 0.4 ? metalCrate(0.5, 0.36, 0.5, { seed: 600 + i }) : crate(0.52, 0.4, 0.5, { seed: 600 + i, tint: r() < 0.5 ? 'dark' : 'mid' });
    scene.add(place(c, x, 0, z, r() * 1.2));
  }

  // ---------------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0x3050ff, 0x0a0620, 0.55));
  const pl = (color, x, y, z, i, d = 12, decay = 1.5) => {
    const p = new THREE.PointLight(color, i, d, decay);
    p.position.copy(G(x, y, z));
    scene.add(p);
    return p;
  };
  // Far blue source and the bounce it throws down the aisle.
  pl(0x2a6cff, 0, 2.5, backZ - 1.5, 32, 30, 1.2);
  pl(0x2a5cff, 0, 1.2, 12, 18, 14);
  pl(0x3a6aff, 0, 4.5, 7, 12, 10);
  // Side colour: magenta upper left, amber lower right, warm on the left crates.
  pl(0xff38d8, -1.6, 3.0, 4.0, 10, 4);
  pl(0xff9a40, 1.9, 1.6, 4.5, 10, 4);
  pl(0xff8a30, 1.7, 3.4, 8.5, 12, 5);
  pl(0xffa050, -1.9, 1.3, 5.6, 7, 3);
  // Warm key on the corner crates (from the muzzle flash side).
  pl(0xffa050, 0.2, 1.4, 1.2, 5, 3.2);
  pl(0xff9040, 0.6, 1.0, 2.0, 4, 2.5);
  pl(0xffa050, -0.55, 1.1, 1.5, 7, 2.4);
  pl(0xff9a40, -0.9, 0.9, 3.2, 5, 2.0);
  pl(0xffa850, 0.55, 1.5, 2.2, 6, 2.2);
  pl(0x6a5cff, -1.2, 5.5, 8, 16, 9);
  const key = new THREE.DirectionalLight(0x8090ff, 0.35);
  key.position.copy(G(-2, 8, 0));
  scene.add(key);
  return scene;
}
