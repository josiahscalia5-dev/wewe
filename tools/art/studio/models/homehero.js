// Home hero (reference 2371): chunky chibi robot-astronaut in a running crouch.
// Oversized oblate white helmet with a TV-shaped black glass visor (two glowing cyan
// eyes and a small dash mouth), a big cyan ear ring on its right side, small white
// torso with a cyan chest light, black armour joints, a huge black fist thrown forward
// on the left of the picture and a chunky blue/violet cannon pointing right.
//
// Model space: +x = screen right, +y = up, +z = toward the camera. Units: the helmet is
// 1.0 wide. The feet stand on y = 0.
import { THREE, mesh, group, getRenderer } from '../core.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const rb = (w, h, d, r = 0.04, s = 5) => new RoundedBoxGeometry(w, h, d, s, r);

// ------------------------------------------------------------------ neon environment
// Reflections are what make the reference's glossy plastic read as "lit by the
// warehouse": a navy room with a big cool softbox above, magenta strip on the left,
// cyan strip on the right and a warm glow low on the right (the muzzle flash).
let neonTex;
export function neonEnv() {
  if (neonTex) return neonTex;
  const scene = new THREE.Scene();
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(20, 48, 24),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: `varying vec3 vP;
        void main(){
          float y = vP.y;
          vec3 top = vec3(0.10, 0.16, 0.55);
          vec3 mid = vec3(0.05, 0.07, 0.30);
          vec3 bot = vec3(0.02, 0.03, 0.12);
          vec3 c = y > 0.0 ? mix(mid, top, y) : mix(mid, bot, -y);
          gl_FragColor = vec4(c, 1.0);
        }`,
    }),
  );
  scene.add(sky);
  const panel = (w, h, color, k, pos, look) => {
    const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide });
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
    p.position.set(...pos);
    p.lookAt(new THREE.Vector3(...look));
    scene.add(p);
  };
  panel(9, 5, 0xdfe8ff, 3.2, [-3, 9, 6], [0, 0, 0]); // big key softbox, top front left
  panel(3, 8, 0xff3cdc, 2.6, [-10, 3, -2], [0, 0, 0]); // magenta strip left
  panel(3, 8, 0x30c8ff, 2.8, [10, 3, -1], [0, 0, 0]); // cyan strip right
  panel(6, 2, 0x4a7cff, 2.0, [0, 2, -10], [0, 0, 0]); // blue back glow
  panel(4, 3, 0xffa030, 2.2, [8, -3, 5], [0, 0, 0]); // warm low right
  panel(6, 2, 0x5a8cff, 1.4, [0, -6, 8], [0, 0, 0]); // floor bounce
  const pm = new THREE.PMREMGenerator(getRenderer());
  neonTex = pm.fromScene(scene, 0.02).texture;
  return neonTex;
}

function gloss(color, { rough = 0.22, cc = 1, ccRough = 0.08, metal = 0, env = 1.0, sheen = 0 } = {}) {
  return new THREE.MeshPhysicalMaterial({
    color, roughness: rough, metalness: metal, clearcoat: cc, clearcoatRoughness: ccRough,
    envMap: neonEnv(), envMapIntensity: env, sheen, sheenColor: new THREE.Color(0x9ab8ff),
  });
}

function glowMat(color, intensity, glow = color) {
  const m = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: 0.3 });
  m.userData.glow = glow;
  return m;
}

/** Unlit colour that keeps its exact hue (no tone-mapping wash-out to white). */
function flatGlow(color, glow = color) {
  const m = new THREE.MeshBasicMaterial({ color });
  m.toneMapped = false;
  m.userData.glow = glow;
  return m;
}

/** Named keypoint (empty object) used to fit the render to the reference layout. */
function mark(parent, name, pos) {
  const o = new THREE.Object3D();
  o.name = 'key:' + name;
  o.position.copy(pos);
  parent.add(o);
  return o;
}

export function heroMats() {
  return {
    white: gloss(0xe8ecf8, { rough: 0.22, env: 0.8 }),
    whiteMatte: gloss(0xe4e8f2, { rough: 0.4, cc: 0.4, env: 0.7 }),
    black: gloss(0x0c1128, { rough: 0.28, env: 1.25 }),
    blackSoft: gloss(0x141a36, { rough: 0.4, cc: 0.6, env: 1.0 }),
    earCore: gloss(0x0a1236, { rough: 0.45, cc: 0.5, env: 0.35 }),
    visor: Object.assign(gloss(0x010207, { rough: 0.12, cc: 0.35, ccRough: 0.2, env: 1.1 }), { specularColor: new THREE.Color(0x5a8cff), specularIntensity: 1 }),
    rim: gloss(0xcfd6e6, { rough: 0.25, metal: 0.3, env: 1.0 }),
    eye: flatGlow(0x18c8ff, 0x0a90f0),
    eyeCore: flatGlow(0x8ef4ff, 0x30c8ff),
    cyan: flatGlow(0x22d0ff, 0x0a98f0),
    gunBody: gloss(0x2c48e8, { rough: 0.14, metal: 0.35, env: 1.9 }),
    gunDark: gloss(0x16207a, { rough: 0.18, metal: 0.3, env: 1.7 }),
    gunViolet: gloss(0x7240ff, { rough: 0.16, metal: 0.3, env: 1.7 }),
    gunStrip: flatGlow(0x3ad8ff, 0x1488f0),
    muzzle: flatGlow(0xfff2a0, 0xffb020),
  };
}

// ------------------------------------------------------------------ helmet
const HA = 0.5, HB = 0.43, HC = 0.47; // helmet ellipsoid radii (x, y, z)

/** Point on the helmet ellipsoid at yaw theta / pitch phi, pushed out by k. */
function helmetPoint(theta, phi, k = 1) {
  return new THREE.Vector3(HA * k * Math.sin(theta) * Math.cos(phi), HB * k * Math.sin(phi), HC * k * Math.cos(theta) * Math.cos(phi));
}
function helmetNormal(p) {
  return new THREE.Vector3(p.x / (HA * HA), p.y / (HB * HB), p.z / (HC * HC)).normalize();
}

// Visor opening: a superellipse in (yaw, pitch) space.
const VIS = { th: 1.02, phC: -0.26, ph: 0.74, n: 3.0 };
function visorBoundary(a) {
  const c = Math.cos(a), s = Math.sin(a);
  const r = Math.pow(Math.pow(Math.abs(c), VIS.n) + Math.pow(Math.abs(s), VIS.n), -1 / VIS.n);
  return [c * r, s * r];
}
function visorAngles(u, v) {
  return [u * VIS.th, VIS.phC + v * VIS.ph];
}

function visorGeometry(rings = 40, segs = 128) {
  const pos = [], idx = [];
  for (let i = 0; i <= rings; i++) {
    const r = i / rings;
    for (let j = 0; j < segs; j++) {
      const [bu, bv] = visorBoundary((j / segs) * Math.PI * 2);
      const [th, ph] = visorAngles(bu * r, bv * r);
      const bulge = 1.012 + 0.035 * (1 - r * r);
      const p = helmetPoint(th, ph, bulge);
      pos.push(p.x, p.y, p.z);
    }
  }
  for (let i = 0; i < rings; i++) {
    for (let j = 0; j < segs; j++) {
      const a = i * segs + j, b = i * segs + ((j + 1) % segs);
      const c = (i + 1) * segs + j, d = (i + 1) * segs + ((j + 1) % segs);
      idx.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function visorRim(m) {
  const pts = [];
  for (let j = 0; j < 160; j++) {
    const [bu, bv] = visorBoundary((j / 160) * Math.PI * 2);
    const [th, ph] = visorAngles(bu * 1.0, bv * 1.0);
    pts.push(helmetPoint(th, ph, 1.012));
  }
  const curve = new THREE.CatmullRomCurve3(pts, true);
  return mesh(new THREE.TubeGeometry(curve, 320, 0.024, 16, true), m.rim);
}

/** A flattened disc lying on the visor surface at (u, v). */
function onVisor(geo, mat, u, v, { sx = 1, sy = 1, lift = 0.012, roll = 0 } = {}) {
  const [th, ph] = visorAngles(u, v);
  const r = Math.hypot(u, v);
  const p = helmetPoint(th, ph, 1.012 + 0.035 * (1 - Math.min(1, r * r)));
  const n = helmetNormal(p);
  const o = new THREE.Mesh(geo, mat);
  o.position.copy(p).addScaledVector(n, lift);
  o.lookAt(o.position.clone().add(n));
  o.rotateZ(roll);
  o.scale.set(sx, sy, 1);
  return o;
}

function buildHelmet(m) {
  const head = group();
  head.add(mesh(new THREE.SphereGeometry(1, 128, 96), m.white, { sx: HA, sy: HB, sz: HC }));
  head.add(mesh(visorGeometry(), m.visor));
  head.add(visorRim(m));
  // Eyes: glowing cyan ovals with lighter cores, low in the visor.
  const disc = new THREE.SphereGeometry(1, 40, 24);
  for (const [u, v, s] of [[-0.38, 0.12, 1], [0.16, 0.12, 1]]) {
    const e = onVisor(disc, m.eye, u, v, { sx: 0.08 * s, sy: 0.095 * s });
    e.scale.z = 0.018;
    head.add(e);
    mark(head, u < 0 ? 'eyeL' : 'eyeR', e.position);
    const c = onVisor(disc, m.eyeCore, u - 0.01, v + 0.02, { sx: 0.045 * s, sy: 0.055 * s, lift: 0.02 });
    c.scale.z = 0.01;
    head.add(c);
  }
  // Dash mouth.
  const mouth = onVisor(new THREE.CapsuleGeometry(0.012, 0.07, 6, 12), m.eye, -0.06, -0.4, { roll: Math.PI / 2 - 0.1 });
  head.add(mouth);
  // Ear: silver cap, cyan glowing ring, dark centre — on the helmet's right (screen left).
  const earTh = -1.2, earPh = 0.0;
  const ep = helmetPoint(earTh, earPh, 0.985);
  const en = helmetNormal(ep);
  const ear = group();
  ear.add(mesh(new THREE.CylinderGeometry(0.15, 0.16, 0.08, 64), m.rim, { rx: Math.PI / 2 }));
  ear.add(mesh(new THREE.TorusGeometry(0.108, 0.026, 20, 72), m.cyan, { z: 0.045 }));
  ear.add(mesh(new THREE.CylinderGeometry(0.084, 0.084, 0.03, 48), m.earCore, { rx: Math.PI / 2, z: 0.04 }));
  ear.position.copy(ep).addScaledVector(en, 0.035);
  ear.lookAt(ear.position.clone().add(en));
  head.add(ear);
  mark(head, 'ear', ear.position);
  mark(head, 'top', new THREE.Vector3(0, HB, 0));
  // Panel seam over the top of the shell.
  const seam = mesh(new THREE.TorusGeometry(1, 0.006, 8, 160, Math.PI * 0.9), m.whiteMatte, { sx: HA * 1.003, sy: HB * 1.003, sz: HC * 1.003 });
  seam.rotation.set(0, Math.PI / 2 - 0.5, 0);
  seam.rotateZ(0.12 * Math.PI);
  head.add(seam);
  return head;
}

// ------------------------------------------------------------------ limbs
function limb(from, to, radius, mat, capMat = null) {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
  const len = a.distanceTo(b);
  const g = group();
  const c = mesh(new THREE.CapsuleGeometry(radius, Math.max(0.001, len), 10, 24), mat);
  c.position.copy(a).add(b).multiplyScalar(0.5);
  c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  g.add(c);
  if (capMat) {
    g.add(mesh(new THREE.SphereGeometry(radius * 1.18, 24, 16), capMat, { x: b.x, y: b.y, z: b.z }));
  }
  return g;
}

function fist(m, { s = 1 } = {}) {
  const g = group();
  g.add(mesh(rb(0.2, 0.19, 0.2, 0.07), m.black));
  // Knuckle row (facing +z) and finger grooves.
  for (let i = 0; i < 4; i++) {
    g.add(mesh(rb(0.052, 0.064, 0.07, 0.024), m.black, { x: -0.078 + i * 0.052, y: 0.035, z: 0.085 }));
  }
  g.add(mesh(rb(0.07, 0.05, 0.09, 0.022), m.blackSoft, { x: -0.1, y: -0.045, z: 0.05, rz: 0.4 }));
  g.scale.setScalar(s);
  return g;
}

function glove(m) {
  const g = group();
  g.add(mesh(rb(0.15, 0.14, 0.15, 0.055), m.black));
  for (let i = 0; i < 4; i++) g.add(mesh(rb(0.035, 0.05, 0.05, 0.016), m.black, { x: 0.08, y: 0.045 - i * 0.03, z: 0.02 }));
  return g;
}

function boot(m) {
  const g = group();
  g.add(mesh(new THREE.SphereGeometry(1, 40, 28), m.black, { y: 0.08, z: 0.04, sx: 0.11, sy: 0.085, sz: 0.16 }));
  g.add(mesh(rb(0.2, 0.05, 0.3, 0.024), m.blackSoft, { y: 0.02, z: 0.04 }));
  g.add(mesh(new THREE.CylinderGeometry(0.085, 0.1, 0.09, 32), m.black, { y: 0.15 }));
  return g;
}

// ------------------------------------------------------------------ blaster
/** Chunky cannon along +x; muzzle centre at (len, 0, 0) in its own space. */
export function buildCannon(m, len = 0.62) {
  const g = group();
  const R = 0.15;
  // Rear cap.
  g.add(mesh(new THREE.SphereGeometry(R * 0.98, 48, 32, 0, Math.PI * 2, 0, Math.PI / 2), m.gunDark, { rz: Math.PI / 2, x: 0.05, sy: 0.55 }));
  // Main body.
  g.add(mesh(new THREE.CylinderGeometry(R, R, len * 0.62, 64), m.gunBody, { rz: -Math.PI / 2, x: 0.05 + len * 0.31 }));
  // Dark bands.
  for (const x of [0.12, 0.3]) g.add(mesh(new THREE.CylinderGeometry(R * 1.04, R * 1.04, 0.035, 64), m.gunDark, { rz: -Math.PI / 2, x }));
  // Cyan glass window along the upper side, dark housing on top.
  g.add(mesh(new THREE.CylinderGeometry(R * 1.005, R * 1.005, len * 0.34, 48, 1, true, -0.2, 1.3), m.gunStrip, { rz: -Math.PI / 2, x: 0.05 + len * 0.36 }));
  g.add(mesh(rb(len * 0.5, 0.06, 0.12, 0.025), m.gunDark, { x: 0.05 + len * 0.34, y: R * 0.95 }));
  // Bright glossy highlight running along the barrel (reads as the reference's sheen).
  const sheen = new THREE.MeshBasicMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.85 });
  sheen.toneMapped = false;
  g.add(mesh(new THREE.CylinderGeometry(R * 1.012, R * 1.012, len * 0.5, 48, 1, true, 0.35, 0.28), sheen, { rz: -Math.PI / 2, x: 0.05 + len * 0.33, cast: false }));
  // Front shroud and violet ring.
  const fx = 0.05 + len * 0.62;
  g.add(mesh(new THREE.CylinderGeometry(R * 1.2, R * 1.08, 0.1, 64), m.gunDark, { rz: -Math.PI / 2, x: fx + 0.02 }));
  g.add(mesh(new THREE.CylinderGeometry(R * 1.34, R * 1.3, 0.1, 64), m.gunViolet, { rz: -Math.PI / 2, x: fx + 0.1 }));
  g.add(mesh(new THREE.TorusGeometry(R * 1.22, 0.03, 20, 64), m.gunViolet, { ry: Math.PI / 2, x: fx + 0.15 }));
  // Glowing muzzle.
  g.add(mesh(new THREE.CircleGeometry(R * 1.02, 48), m.muzzle, { ry: Math.PI / 2, x: fx + 0.152 }));
  // Grip under the rear half.
  g.add(mesh(rb(0.08, 0.16, 0.09, 0.03), m.gunDark, { x: 0.24, y: -R - 0.04, rz: -0.25 }));
  g.userData.muzzle = new THREE.Vector3(fx + 0.16, 0, 0);
  g.userData.grip = new THREE.Vector3(0.25, -R - 0.02, 0);
  return g;
}

// ------------------------------------------------------------------ whole figure
// Positions were measured on reference 2371 and converted to model units
// (helmet 1.0 wide = 0.436 of the screen width, helmet centre at y = 1.0).
export const HERO_POSE = {
  headScale: 1.12, headPos: [0.0, 0.97, 0.0], headRot: [0.02, 0.52, -0.26],
  shoulder: [-0.33, 0.56, -0.04], elbow: [-0.66, 0.8, -0.05], fist: [-0.39, 0.64, 0.32], fistScale: 1.45,
  gunPos: [0.1, 0.45, 0.07], gunRot: [0.0, -0.22, -0.07], gunLen: 0.68,
  bootPos: [-0.53, 0.015, 0.0], kneeF: [-0.03, 0.27, 0.3], torsoX: -0.21,
};

export function buildHomeHero(pose = {}) {
  const P = { ...HERO_POSE, ...pose };
  const m = heroMats();
  const root = group();

  // Pelvis and legs (running crouch). Picture-left leg is thrown back, big black boot.
  root.add(mesh(rb(0.36, 0.14, 0.28, 0.06), m.black, { x: -0.12, y: 0.27, rz: 0.1 }));
  root.add(limb([-0.24, 0.26, 0.0], [-0.44, 0.19, 0.02], 0.105, m.white, m.black));
  const b1 = boot(m);
  b1.scale.setScalar(1.3);
  b1.position.set(...P.bootPos);
  b1.rotation.set(0.15, -0.7, 0.3);
  root.add(b1);
  mark(root, 'boot', new THREE.Vector3(P.bootPos[0], P.bootPos[1] + 0.1, P.bootPos[2]));
  root.add(limb([-0.44, 0.19, 0.02], [P.bootPos[0] + 0.03, P.bootPos[1] + 0.12, P.bootPos[2]], 0.08, m.black));
  // Picture-right leg bent forward: white thigh, big white knee.
  const K = P.kneeF;
  root.add(limb([0.0, 0.26, 0.04], K, 0.1, m.white));
  root.add(mesh(new THREE.SphereGeometry(0.115, 40, 28), m.white, { x: K[0], y: K[1], z: K[2] }));
  mark(root, 'knee', new THREE.Vector3(...K));
  root.add(limb(K, [K[0] + 0.05, 0.02, K[2] - 0.02], 0.08, m.black));
  const b2 = boot(m);
  b2.position.set(0.02, -0.08, 0.3);
  b2.rotation.y = -0.4;
  root.add(b2);

  // Torso: white egg, dark yoke under the helmet, cyan chest light right of centre.
  const torso = group();
  torso.position.set(P.torsoX, 0.45, 0.0);
  torso.rotation.set(0.08, 0.45, -0.06);
  root.add(torso);
  torso.add(mesh(new THREE.SphereGeometry(1, 64, 48), m.white, { sx: 0.24, sy: 0.2, sz: 0.2 }));
  torso.add(mesh(new THREE.SphereGeometry(1, 48, 32), m.black, { y: 0.16, sx: 0.25, sy: 0.08, sz: 0.19 }));
  torso.add(mesh(new THREE.TorusGeometry(0.2, 0.006, 8, 64, Math.PI * 0.55), m.whiteMatte, { x: 0.0, y: -0.02, z: 0.02, rx: -0.2, rz: Math.PI * 0.62 }));
  const chest = group();
  const cp = new THREE.Vector3(0.1, 0.03, 0.0);
  cp.z = 0.2 * Math.sqrt(Math.max(0, 1 - (cp.x / 0.24) ** 2 - (cp.y / 0.2) ** 2));
  chest.position.copy(cp);
  chest.lookAt(new THREE.Vector3(cp.x / 0.0576, cp.y / 0.04, cp.z / 0.04).normalize().add(cp));
  chest.add(mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.02, 40), m.rim, { rx: Math.PI / 2 }));
  chest.add(mesh(new THREE.SphereGeometry(0.05, 32, 20), m.cyan, { z: 0.01, sz: 0.4 }));
  torso.add(chest);
  mark(chest, 'chest', new THREE.Vector3());

  // Picture-left arm: white upper arm raised out to the side, black forearm, huge fist
  // in front of the chest just under the helmet.
  const S = P.shoulder, E = P.elbow, F = P.fist;
  root.add(mesh(new THREE.SphereGeometry(0.1, 32, 24), m.black, { x: S[0], y: S[1], z: S[2] }));
  root.add(limb(S, E, 0.105, m.white, m.black));
  root.add(limb(E, [F[0] - 0.08, F[1] + 0.04, F[2] - 0.12], 0.085, m.black));
  const f = fist(m, { s: P.fistScale });
  f.position.set(...F);
  f.rotation.set(-0.2, 0.75, 0.1);
  root.add(f);
  mark(root, 'fist', new THREE.Vector3(...F));
  mark(root, 'elbow', new THREE.Vector3(...E));

  // Picture-right arm: dark shoulder, black arm down to the glove on the cannon grip.
  const gun = buildCannon(m, P.gunLen);
  gun.position.set(...P.gunPos);
  gun.rotation.set(...P.gunRot);
  mark(gun, 'muzzle', gun.userData.muzzle);
  root.add(gun);
  gun.updateMatrix();
  const gp = gun.userData.grip.clone().applyMatrix4(gun.matrix);
  root.add(mesh(new THREE.SphereGeometry(0.1, 32, 24), m.black, { x: 0.1, y: 0.56, z: -0.06 }));
  root.add(limb([0.1, 0.56, -0.06], [0.2, 0.36, 0.0], 0.075, m.black, m.black));
  root.add(limb([0.2, 0.36, 0.0], [gp.x - 0.02, gp.y, gp.z], 0.072, m.black));
  const gl = glove(m);
  gl.scale.setScalar(1.3);
  gl.position.copy(gp).add(new THREE.Vector3(0.0, 0.0, 0.06));
  gl.rotation.set(0.1, -0.3, -0.2);
  root.add(gl);
  mark(root, 'glove', gl.position);

  // Helmet: huge, turned toward picture right and rolled clockwise.
  const head = buildHelmet(m);
  head.position.set(...P.headPos);
  head.rotation.set(...P.headRot);
  head.scale.setScalar(P.headScale);
  root.add(head);
  mark(head, 'head', new THREE.Vector3());

  root.userData.gun = gun;
  root.userData.head = head;
  return root;
}
