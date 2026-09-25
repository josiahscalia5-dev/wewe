// Shared rendering helpers for the art studio.
//
// Coordinate convention: game world metres with x right, y up, depth z away from the
// camera. three.js cameras look down -Z, so a game point (x, y, z) lives at three
// (x, y, -z). Cameras are off-axis pinholes built from pixel intrinsics so that every
// sprite is rendered with exactly the projection the game uses (see StageCamera.kt).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export { THREE };
export const SS = 2; // supersampling factor

let renderer;
export function getRenderer() {
  if (!renderer) {
    const canvas = document.createElement('canvas');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: false });
    renderer.setPixelRatio(1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }
  return renderer;
}

let env;
export function envMap() {
  if (!env) {
    const pm = new THREE.PMREMGenerator(getRenderer());
    env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  }
  return env;
}

/** Game-space point → three.js vector. */
export const G = (x, y, z) => new THREE.Vector3(x, y, -z);

/**
 * Off-axis camera at game position (camX, camY, camZ) looking along +z (game), with focal
 * length f and principal point (cx, cy) in output-canvas pixels.
 */
export function stageCamera({ f, cx, cy, W, H, camX = 0, camY = 1.7, camZ = 0, near = 0.05, far = 400 }) {
  const cam = new THREE.PerspectiveCamera(40, W / H, near, far);
  cam.position.copy(G(camX, camY, camZ));
  cam.updateMatrixWorld(true);
  const l = (-cx * near) / f;
  const r = ((W - cx) * near) / f;
  const t = (cy * near) / f;
  const b = (-(H - cy) * near) / f;
  cam.projectionMatrix.makePerspective(l, r, t, b, near, far);
  cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
  cam.userData.fixed = true;
  return cam;
}

export function canvas2d(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.round(w);
  c.height = Math.round(h);
  return c;
}

/** Renders scene/camera at W×H (supersampled) into a 2D canvas. */
export function renderToCanvas(scene, camera, W, H, { clear = 0x000000, clearAlpha = 0, ss = SS, composer } = {}) {
  const r = getRenderer();
  r.setClearColor(clear, clearAlpha);
  r.setSize(W * ss, H * ss, false);
  if (composer) {
    composer.setSize(W * ss, H * ss);
    composer.render();
  } else {
    r.render(scene, camera);
  }
  const out = canvas2d(W, H);
  const ctx = out.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  if (ss === 2) {
    ctx.drawImage(r.domElement, 0, 0, W, H);
  } else {
    // Step down in halves for clean filtering.
    let src = r.domElement;
    let w = W * ss;
    let h = H * ss;
    while (w / 2 >= W) {
      const t = canvas2d(w / 2, h / 2);
      const tc = t.getContext('2d');
      tc.imageSmoothingQuality = 'high';
      tc.drawImage(src, 0, 0, w / 2, h / 2);
      src = t;
      w /= 2;
      h /= 2;
    }
    ctx.drawImage(src, 0, 0, W, H);
  }
  return out;
}

const blackMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

/**
 * Renders only the glowing parts (materials with userData.glow), blurs them and returns
 * an RGBA canvas whose alpha is the glow strength (for additive-looking halos).
 */
export function glowLayer(scene, camera, W, H, { radius = 18, strength = 1.0, ss = 1 } = {}) {
  const saved = new Map();
  const hidden = [];
  scene.traverse((o) => {
    if (o.isLight) return;
    if (o.isMesh || o.isPoints || o.isSprite) {
      const m = o.material;
      const glow = m && m.userData && m.userData.glow;
      saved.set(o, m);
      if (glow !== undefined && glow !== null) {
        o.material = new THREE.MeshBasicMaterial({ color: glow, transparent: m.transparent, opacity: m.opacity ?? 1, side: m.side });
        o.material.toneMapped = false;
      } else if (o.userData.noOcclude) {
        hidden.push(o);
        o.visible = false;
      } else {
        o.material = blackMat;
      }
    }
  });
  const bg = scene.background;
  const fog = scene.fog;
  scene.background = null;
  scene.fog = null;
  const em = renderToCanvas(scene, camera, W, H, { clear: 0x000000, clearAlpha: 1, ss });
  scene.background = bg;
  scene.fog = fog;
  for (const [o, m] of saved) {
    if (o.material !== m && o.material !== blackMat) o.material.dispose();
    o.material = m;
  }
  for (const o of hidden) o.visible = true;
  return blurToAlpha(em, radius, strength);
}

/** Gaussian-blurs an opaque-on-black canvas and turns brightness into alpha. */
export function blurToAlpha(src, radius, strength = 1) {
  const W = src.width;
  const H = src.height;
  const b = canvas2d(W, H);
  const bc = b.getContext('2d');
  bc.fillStyle = '#000';
  bc.fillRect(0, 0, W, H);
  bc.filter = `blur(${radius}px)`;
  bc.drawImage(src, 0, 0);
  bc.filter = `blur(${radius * 0.35}px)`;
  bc.globalCompositeOperation = 'lighter';
  bc.drawImage(src, 0, 0);
  bc.filter = 'none';
  const img = bc.getImageData(0, 0, W, H);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i] * strength;
    const g = d[i + 1] * strength;
    const bl = d[i + 2] * strength;
    const a = Math.min(255, Math.max(r, g, bl));
    if (a < 1) {
      d[i + 3] = 0;
      continue;
    }
    d[i] = Math.min(255, (r * 255) / a);
    d[i + 1] = Math.min(255, (g * 255) / a);
    d[i + 2] = Math.min(255, (bl * 255) / a);
    d[i + 3] = a;
  }
  bc.putImageData(img, 0, 0);
  return b;
}

/** base + glow added on top (glow also forms a halo outside the silhouette). */
export function composite(base, ...glows) {
  const out = canvas2d(base.width, base.height);
  const c = out.getContext('2d');
  c.drawImage(base, 0, 0);
  c.globalCompositeOperation = 'lighter';
  for (const g of glows) if (g) c.drawImage(g, 0, 0, base.width, base.height);
  return out;
}

export function toDataURL(c) {
  return c.toDataURL('image/png');
}

// ---------------------------------------------------------------- materials

export function plastic(color, { rough = 0.32, clearcoat = 0.8, metal = 0.0, env = 0.9 } = {}) {
  return new THREE.MeshPhysicalMaterial({
    color, roughness: rough, metalness: metal, clearcoat, clearcoatRoughness: 0.18,
    envMap: envMap(), envMapIntensity: env,
  });
}

export function metal(color, { rough = 0.38, env = 1.0 } = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.85, envMap: envMap(), envMapIntensity: env });
}

export function matte(color, { rough = 0.8, env = 0.4 } = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.0, envMap: envMap(), envMapIntensity: env });
}

export function glass(color, { rough = 0.06, env = 1.4 } = {}) {
  return new THREE.MeshPhysicalMaterial({
    color, roughness: rough, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.03,
    envMap: envMap(), envMapIntensity: env,
  });
}

export function emissive(color, intensity = 2.5, glow = color) {
  const m = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: 0.4 });
  m.userData.glow = glow;
  return m;
}

// ---------------------------------------------------------------- lighting

/** Warehouse-style character lighting: warm key, magenta left rim, cyan right rim. */
export function characterLights(scene, { key = 2.4, rimL = 3.2, rimR = 3.0, fill = 0.7, keyDir = [-2, 4, -3] } = {}) {
  scene.add(new THREE.HemisphereLight(0x7b7cff, 0x2a1030, fill));
  const k = new THREE.DirectionalLight(0xfff0e0, key);
  k.position.set(keyDir[0], keyDir[1], -keyDir[2]);
  scene.add(k);
  const l = new THREE.DirectionalLight(0xff4fd8, rimL);
  l.position.set(-5, 2.5, -6);
  scene.add(l);
  const r = new THREE.DirectionalLight(0x40c8ff, rimR);
  r.position.set(5, 3, -5.5);
  scene.add(r);
  const w = new THREE.DirectionalLight(0xff9a45, 0.8);
  w.position.set(0.5, -2, 3);
  scene.add(w);
  return { k, l, r, w };
}

// ---------------------------------------------------------------- geometry helpers

export function mesh(geo, mat, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1, cast = true } = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.scale.set(sx, sy, sz);
  m.castShadow = cast;
  m.receiveShadow = true;
  return m;
}

export function group(...children) {
  const g = new THREE.Group();
  for (const c of children) if (c) g.add(c);
  return g;
}

/** Deterministic PRNG. */
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
