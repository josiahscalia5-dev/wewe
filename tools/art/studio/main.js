// Registry of every art layer the game loads (see app/.../art/Layers.kt and
// core/.../ArtMetrics.kt for the geometry contract).
import { THREE, stageCamera, renderToCanvas, glowLayer, composite, toDataURL, characterLights } from './core.js';
import { buildDrone } from './models/drone.js';
import { buildRobot, poseRobot } from './models/robot.js';
import { buildAstronaut, buildArm, astroMats } from './models/astronaut.js';
import { buildWarehouse } from './models/warehouse.js';
import { coverCratesLeft, coverCrateMid, forklift, sceneryCratesFar, sceneryCratesNear } from './models/props.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { getRenderer, SS } from './core.js';
import { buildHero, buildCreature } from './models/hero.js';
import { buildBlaster } from './models/astronaut.js';
import * as flat from './flat.js';

const layers = new Map();
const add = (name, fn) => layers.set(name, fn);

// ------------------------------------------------------------------ drone (800x800, 560 px/m)
// Rendered as seen from the game camera: drone 5 m away, 1.3 m above eye level.
function droneCamera() {
  const W = 800, H = 800, Z = 5, Y = 3.0, f = 560 * Z;
  return { cam: stageCamera({ f, cx: 400, cy: 400 - (f * (1.7 - Y)) / Z, W, H }), W, H, Z, Y };
}

function droneScene(opts) {
  const scene = new THREE.Scene();
  characterLights(scene, { key: 1.9, rimL: 3.6, rimR: 3.0, fill: 0.25, keyDir: [-1.2, 3.5, -4] });
  const { cam, W, H, Z, Y } = droneCamera();
  const d = buildDrone(opts);
  d.position.set(0, Y, -Z);
  d.rotation.x = 0.26;
  scene.add(d);
  return { scene, cam, W, H };
}

function renderDrone(opts, glow) {
  const { scene, cam, W, H } = droneScene(opts);
  const base = renderToCanvas(scene, cam, W, H);
  const g1 = glowLayer(scene, cam, W, H, { radius: glow.r1, strength: glow.s1 });
  const g2 = glowLayer(scene, cam, W, H, { radius: glow.r2, strength: glow.s2 });
  return composite(base, g1, g2);
}

add('drone_body', () => renderDrone({ parts: 'body' }, { r1: 34, s1: 1.5, r2: 9, s2: 0.9 }));
for (let i = 0; i < 4; i++) {
  add(`drone_rotor_${i + 1}`, () => renderDrone({ parts: 'rotor', rotor: (i * Math.PI) / 8 }, { r1: 16, s1: 1.0, r2: 5, s2: 0.7 }));
}
add('drone_hit_flash', () => renderDrone({ parts: 'all', flash: true }, { r1: 40, s1: 1.4, r2: 12, s2: 1.0 }));

// ------------------------------------------------------------------ robot (900x1100, 450 px/m)
// Rendered 6 m from the camera (mid-ground patrol depth), feet at (450, 1075).
const ROBOT_H = 2.2;
function renderRobot(pose, phase, facing, eyeBoost = 1) {
  const W = 900, H = 1100, Z = 6, f = 450 * Z;
  const cam = stageCamera({ f, cx: 450, cy: 1075 - (f * 1.7) / Z, W, H });
  const scene = new THREE.Scene();
  characterLights(scene, { key: 0.9, rimL: 4.4, rimR: 3.2, fill: 0.35, keyDir: [-2.5, 4, -2] });
  const r = buildRobot({ eyeBoost });
  poseRobot(r, 'scan');
  const box = new THREE.Box3().setFromObject(r.root);
  const k = ROBOT_H / (box.max.y - box.min.y);
  r.root.scale.setScalar(k);
  poseRobot(r, pose, phase);
  r.root.rotation.y = facing === 'left' ? -1.05 : facing === 'right' ? 1.05 : 0;
  const holder = new THREE.Group();
  holder.add(r.root);
  holder.position.set(0, -box.min.y * k, -Z);
  scene.add(holder);
  scene.updateMatrixWorld(true);
  const base = renderToCanvas(scene, cam, W, H);
  const g1 = glowLayer(scene, cam, W, H, { radius: 22 * eyeBoost, strength: 1.3 * eyeBoost });
  const g2 = glowLayer(scene, cam, W, H, { radius: 6, strength: 0.8 });
  return composite(base, g1, g2);
}
for (const dir of ['left', 'right', 'front']) {
  for (let i = 0; i < 6; i++) add(`robot_walk_${dir}_${i + 1}`, () => renderRobot('walk', i / 6, dir));
}
add('robot_scan_idle', () => renderRobot('scan', 0, 'front'));
add('robot_alert', () => renderRobot('alert', 0, 'front', 1.8));
add('robot_grab_lunge', () => renderRobot('lunge', 0, 'front', 1.8));

// ------------------------------------------------------------------ astronaut (900x1100, 780 px/m)
// Seen from the game camera: 2.1 m ahead, camera 1.7 m high; feet at (450, 1080).
const ASTRO_Z = 2.1, ASTRO_F = 780 * ASTRO_Z, ASTRO_H = 1.31;
let astroScale = null;
function astroK() {
  if (astroScale == null) {
    const a = buildAstronaut({ pose: 'idle' });
    const box = new THREE.Box3().setFromObject(a);
    astroScale = ASTRO_H / (box.max.y - Math.min(0, box.min.y));
  }
  return astroScale;
}
// Right shoulder pivot in astronaut-local metres (before scaling): torso 0.48 + 0.30.
const SHOULDER_LOCAL = new THREE.Vector3(0.22, 0.42 + 0.06 + 0.3, 0);

function astroLights(scene, fire = false) {
  characterLights(scene, { key: 1.6, rimL: 3.8, rimR: 3.4, fill: 0.55, keyDir: [-1.2, 3.5, 1.5] });
  if (fire) {
    const p = new THREE.PointLight(0xffb040, 6, 3, 1.2);
    p.position.set(0.6, 1.6, -2.3);
    scene.add(p);
  }
}

function renderAstro(opts, { fire = false, stars = false } = {}) {
  const W = 900, H = 1100;
  const cam = stageCamera({ f: ASTRO_F, cx: 450, cy: 1080 - (ASTRO_F * 1.7) / ASTRO_Z, W, H });
  const scene = new THREE.Scene();
  astroLights(scene, fire);
  const a = buildAstronaut(opts);
  a.scale.setScalar(astroK());
  a.position.set(0, 0, -ASTRO_Z);
  scene.add(a);
  scene.updateMatrixWorld(true);
  const base = renderToCanvas(scene, cam, W, H);
  const g = glowLayer(scene, cam, W, H, { radius: 14, strength: 1.1 });
  const out = composite(base, g);
  if (stars) drawDizzyStars(out);
  return out;
}

function drawDizzyStars(c) {
  const ctx = c.getContext('2d');
  const pts = [[330, 150, 34], [470, 105, 42], [600, 160, 30], [400, 70, 24]];
  for (const [x, y, r] of pts) {
    ctx.save();
    ctx.translate(x, y);
    ctx.shadowColor = 'rgba(255,220,80,0.9)';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 === 0 ? r : r * 0.45;
      const ang = -Math.PI / 2 + (i * Math.PI) / 5;
      ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
    }
    ctx.closePath();
    const gr = ctx.createLinearGradient(0, -r, 0, r);
    gr.addColorStop(0, '#fff6b0');
    gr.addColorStop(1, '#ffb020');
    ctx.fillStyle = gr;
    ctx.fill();
    ctx.restore();
  }
}

add('astro_aim_idle', () => renderAstro({ pose: 'idle' }));
add('astro_fire', () => renderAstro({ pose: 'idle' }, { fire: true }));
add('astro_duck_cover', () => renderAstro({ pose: 'duck' }));
add('astro_stunned', () => renderAstro({ pose: 'stunned' }, { stars: true }));
for (const [dir, sgn] of [['left', -1], ['right', 1]]) {
  for (let i = 0; i < 6; i++) add(`astro_strafe_${dir}_${i + 1}`, () => renderAstro({ pose: 'strafe', phase: i / 6, dir: sgn }));
}

// Blaster arm (760x320): drawn pointing along +x; pivot (96,170), muzzle (732,150).
add('astro_arm_blaster', () => {
  const W = 760, H = 320;
  const k = astroK();
  const sh = SHOULDER_LOCAL.clone().multiplyScalar(k);
  const cx = 96 - (ASTRO_F * sh.x) / ASTRO_Z;
  const cy = 170 - (ASTRO_F * (1.7 - sh.y)) / ASTRO_Z;
  const cam = stageCamera({ f: ASTRO_F, cx, cy, W, H });
  const scene = new THREE.Scene();
  astroLights(scene);
  const arm = buildArm(astroMats());
  arm.scale.setScalar(k);
  arm.position.set(sh.x, sh.y, -ASTRO_Z);
  scene.add(arm);
  scene.updateMatrixWorld(true);
  console.warn('astro scale', k.toFixed(4), 'shoulder px', (450 + sh.x * 780).toFixed(1), (1080 - sh.y * 780).toFixed(1),
    'muzzle px', (96 + 0.815 * k * 780).toFixed(1), (170 - 0.026 * k * 780).toFixed(1));
  const base = renderToCanvas(scene, cam, W, H);
  const g = glowLayer(scene, cam, W, H, { radius: 10, strength: 1.0 });
  return composite(base, g);
});

// ------------------------------------------------------------------ environment
function bloomComposer(scene, cam, W, H, { strength = 0.85, radius = 0.5, threshold = 0.82 } = {}) {
  const r = getRenderer();
  r.setSize(W * SS, H * SS, false);
  const c = new EffectComposer(r);
  c.addPass(new RenderPass(scene, cam));
  c.addPass(new UnrealBloomPass(new THREE.Vector2(W * SS, H * SS), strength, radius, threshold));
  c.addPass(new OutputPass());
  return c;
}

// bg_warehouse (1568x3200) covers stage rect (-48,-30)-(1128,2370) at 0.75 stage px/px,
// rendered through the exact game camera (focal 1400 stage px, horizon y 1170).
add('bg_warehouse', () => {
  const W = 1568, H = 3200, k = 1 / 0.75;
  const cam = stageCamera({ f: 1400 * k, cx: (540 + 48) * k, cy: (1170 + 30) * k, W, H, far: 300 });
  const scene = buildWarehouse({ W: W * SS, H: H * SS, variant: 'level' });
  getRenderer().toneMappingExposure = 0.9;
  const out = renderToCanvas(scene, cam, W, H, { composer: bloomComposer(scene, cam, W, H, { strength: 0.55, radius: 0.4, threshold: 0.9 }) });
  getRenderer().toneMappingExposure = 1.05;
  return out;
});

// bg_home (1440x3120): lower camera looking down the aisle, bluer light.
add('bg_home', () => {
  const W = 1440, H = 3120;
  const cam = stageCamera({ f: 1750, cx: W / 2, cy: H * 0.5, W, H, camY: 1.45, far: 300 });
  const scene = buildWarehouse({ W: W * SS, H: H * SS, variant: 'home' });
  return renderToCanvas(scene, cam, W, H, { composer: bloomComposer(scene, cam, W, H, { strength: 1.0, threshold: 0.78 }) });
});

// ------------------------------------------------------------------ props (420 px/m, base centre 140 px above the bottom)
const PROP_PPM = 420, PROP_PAD = 140;
function renderProp(build, X, Z) {
  const obj = build();
  const holder = new THREE.Group();
  holder.add(obj);
  holder.position.set(X, 0, -Z);
  holder.updateMatrixWorld(true);
  const f = PROP_PPM * Z;
  const box = new THREE.Box3().setFromObject(holder);
  let minU = Infinity, maxU = -Infinity, minV = Infinity;
  for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
    const depth = -z;
    minU = Math.min(minU, (f * x) / depth);
    maxU = Math.max(maxU, (f * x) / depth);
    minV = Math.min(minV, (f * (1.7 - y)) / depth);
  }
  const u0 = (f * X) / Z, v0 = (f * 1.7) / Z;
  const half = Math.max(u0 - minU, maxU - u0) + 40;
  const W = Math.ceil(half * 2);
  const H = Math.ceil(v0 - minV + PROP_PAD + 40);
  const cam = stageCamera({ f, cx: W / 2 - u0, cy: H - PROP_PAD - v0, W, H });
  const scene = new THREE.Scene();
  characterLights(scene, { key: 0.9, rimL: 2.6, rimR: 2.4, fill: 0.35, keyDir: [-1, 5, 1] });
  const warm = new THREE.PointLight(0xffa050, 5, 6, 1.5);
  warm.position.set(X + 0.5, 2.5, -Z + 1.5);
  scene.add(warm);
  scene.add(holder);
  const base = renderToCanvas(scene, cam, W, H);
  const g = glowLayer(scene, cam, W, H, { radius: 10, strength: 0.9 });
  return composite(base, g);
}
add('cover_crates_left', () => renderProp(coverCratesLeft, -0.62, 2.85));
add('cover_crates_mid_1', () => renderProp(coverCrateMid, 0.02, 3.3));
add('cover_forklift_right', () => renderProp(forklift, 0.80, 3.0));
add('cover_crates_mid_2', () => renderProp(sceneryCratesFar, -1.55, 8.3));
add('cover_crates_mid_3', () => renderProp(sceneryCratesNear, 1.35, 3.95));

// ------------------------------------------------------------------ 2D effects, icons, logo
add('laser_bolt', () => flat.laserBolt());
add('impact_spark', () => flat.impactSpark());
add('muzzle_flash', () => flat.muzzleFlash({ size: 256 }));
add('glow_red', () => flat.glow('255,40,20'));
add('glow_cyan', () => flat.glow('40,200,255'));
for (let i = 0; i < 8; i++) add(`drone_explosion_${i + 1}`, () => flat.explosion(i));
add('sparkle', () => flat.sparkle());
add('coin', () => flat.coin({ symbol: 'dollar' }));
add('icon_coin_star', () => flat.coin({ symbol: 'star' }));
add('gear', () => flat.gear());
add('plus', () => flat.plusButton());
add('nav_home', () => flat.navHome());
add('nav_missions', () => flat.navMissions());
add('nav_shop', () => flat.navShop());
add('nav_profile', () => flat.navProfile());
add('icon_stopwatch', () => flat.stopwatch());
add('logo_title', () => flat.logo());
add('hero_muzzle_flash', () => flat.muzzleFlash({ size: 768, hero: true }));

// Drone icon: the drone model, front-on, in a square.
add('icon_drone', () => {
  const W = 512, H = 512;
  const cam = stageCamera({ f: 1300, cx: 256, cy: 256, W, H, camY: 0 });
  const scene = new THREE.Scene();
  characterLights(scene, { key: 1.9, rimL: 3.4, rimR: 3.0, fill: 0.3 });
  const d = buildDrone({ parts: 'all', rotor: 0.4 });
  d.position.set(0, 0, -3.0);
  d.rotation.set(0.1, 0.25, 0.3);
  scene.add(d);
  const base = renderToCanvas(scene, cam, W, H);
  return composite(base, glowLayer(scene, cam, W, H, { radius: 16, strength: 1.3 }), glowLayer(scene, cam, W, H, { radius: 5, strength: 0.8 }));
});

// Blaster icon: cyan blaster, side view.
add('icon_blaster', () => {
  const W = 640, H = 400;
  const cam = stageCamera({ f: 1500, cx: 320, cy: 200, W, H, camY: 0 });
  const scene = new THREE.Scene();
  characterLights(scene, { key: 2.2, rimL: 2.0, rimR: 3.0, fill: 0.8 });
  const g = buildBlaster({ len: 0.56, body: 0x31a8f0, accent: 0xb8f4ff, dark: 0x1a5fa8, scale: 1 });
  g.position.set(-0.28, -0.0, -1.6);
  g.rotation.set(0.15, -0.35, 0.2);
  scene.add(g);
  const base = renderToCanvas(scene, cam, W, H);
  return composite(base, glowLayer(scene, cam, W, H, { radius: 14, strength: 1.0 }));
});

// Home hero (1400x1324) and creatures (600x600).
add('hero_robot', () => {
  const W = 1400, H = 1324;
  const cam = stageCamera({ f: 2250, cx: 520, cy: 690, W, H, camY: 0.75 });
  const scene = new THREE.Scene();
  characterLights(scene, { key: 2.4, rimL: 3.6, rimR: 3.6, fill: 0.8, keyDir: [-2, 3, 3] });
  const h = buildHero();
  h.position.set(0, 0, -4.2);
  h.rotation.y = -0.15;
  scene.add(h);
  const base = renderToCanvas(scene, cam, W, H);
  return composite(base, glowLayer(scene, cam, W, H, { radius: 20, strength: 1.2 }), glowLayer(scene, cam, W, H, { radius: 6, strength: 0.8 }));
});
const creatures = { blue: 0x2f8cff, yellow: 0xffc21a, green: 0x2ed84a, red: 0xff3040, purple: 0xb048ff };
Object.entries(creatures).forEach(([name, color], i) => {
  add(`creature_${name}`, () => {
    const W = 600, H = 600;
    const cam = stageCamera({ f: 1450, cx: 300, cy: 300, W, H, camY: 0 });
    const scene = new THREE.Scene();
    characterLights(scene, { key: 2.0, rimL: 2.4, rimR: 2.4, fill: 0.9, keyDir: [-2, 3, 3] });
    const c = buildCreature(color, { mood: i });
    c.position.set(0, 0, -3.2);
    c.rotation.set(0.1, (i - 2) * 0.2, (i % 2 ? 1 : -1) * 0.12);
    scene.add(c);
    const base = renderToCanvas(scene, cam, W, H);
    return composite(base, glowLayer(scene, cam, W, H, { radius: 26, strength: 0.7 }));
  });
});

// ------------------------------------------------------------------ registry API

window.layerNames = () => [...layers.keys()];
window.renderLayer = async (name) => {
  const fn = layers.get(name);
  if (!fn) throw new Error('unknown layer ' + name);
  const c = await fn();
  return toDataURL(c);
};
await Promise.all(['330px "Lilita One"', '800 100px "Barlow Condensed"', '700 100px "Barlow Condensed"', '700 100px "Fredoka"'].map((f) => document.fonts.load(f)));
await document.fonts.ready;
window.studioReady = true;
