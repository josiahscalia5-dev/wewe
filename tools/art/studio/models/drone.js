// Red spherical patrol drone (reference 2376 / 2374): glossy red shell, dark seams, a
// white-hot core lens, four arms ending in motor pods with glowing red rotor blades.
import { THREE, plastic, metal, emissive, mesh, group } from '../core.js';

const R = 0.33;

function capsuleGeo(r, len) {
  return new THREE.CapsuleGeometry(r, len, 8, 24);
}

/**
 * parts: 'body' (no blades), 'rotor' (blades only; body writes depth but no colour),
 * 'all'. rotor: blade rotation in radians. flash: white-hot hit flash.
 */
export function buildDrone({ parts = 'all', rotor = 0, flash = false } = {}) {
  const red = flash ? emissive(0xffe6e6, 3.0, 0xff7a7a) : plastic(0x8a050d, { rough: 0.3, clearcoat: 1, env: 0.3 });
  const redDark = flash ? red : plastic(0x5a050b, { rough: 0.4, env: 0.5 });
  const dark = flash ? red : metal(0x1e2027, { rough: 0.5, env: 0.5 });
  const black = flash ? red : plastic(0x0d0e12, { rough: 0.55, clearcoat: 0.3, env: 0.35 });
  const lens = emissive(0xfff6f2, 2.4, 0xff2a14);
  const lensRing = emissive(0xff1d0e, 1.6, 0xff1406);
  const blade = plastic(0xd0101a, { rough: 0.25, clearcoat: 1, env: 0.8 });
  blade.emissive = new THREE.Color(0xff1508);
  blade.emissiveIntensity = 0.55;
  blade.userData.glow = 0x9a0a04;

  const body = group();
  body.add(mesh(new THREE.SphereGeometry(R, 72, 54), red));
  // Equator band and seams.
  body.add(mesh(new THREE.TorusGeometry(R * 1.005, 0.02, 16, 120), dark, { rx: Math.PI / 2 }));
  body.add(mesh(new THREE.TorusGeometry(R * 1.004, 0.011, 12, 120), dark, { ry: Math.PI / 2 }));
  body.add(mesh(new THREE.TorusGeometry(R * 0.86, 0.012, 12, 100), redDark, { rx: Math.PI / 2, y: R * 0.5 }));
  body.add(mesh(new THREE.TorusGeometry(R * 0.86, 0.012, 12, 100), redDark, { rx: Math.PI / 2, y: -R * 0.5 }));
  // Top hatch.
  body.add(mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.05, 32), dark, { y: R * 0.97 }));
  // Front core: housing, glowing ring, lens.
  const core = group(
    mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.09, 56), black, { rx: Math.PI / 2, z: R * 0.84 }),
    mesh(new THREE.TorusGeometry(0.135, 0.03, 20, 72), lensRing, { z: R * 0.92 }),
    mesh(new THREE.SphereGeometry(0.108, 48, 32), lens, { z: R * 0.9, sz: 0.55 }),
  );
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    core.add(mesh(new THREE.SphereGeometry(0.013, 12, 8), dark, { x: Math.cos(a) * 0.178, y: Math.sin(a) * 0.178, z: R * 0.9 }));
  }
  body.add(core);

  // Arms with motor pods; blades spin around each arm axis.
  const rotors = group();
  const armDirs = [45, 135, 225, 315].map((d) => (d * Math.PI) / 180);
  for (const a of armDirs) {
    const dir = new THREE.Vector3(Math.cos(a), Math.sin(a) * 0.9, -0.28).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    const arm = group();
    arm.quaternion.copy(q);
    arm.add(mesh(new THREE.CylinderGeometry(0.03, 0.038, 0.2, 20), dark, { y: R + 0.06 }));
    arm.add(mesh(new THREE.SphereGeometry(0.042, 20, 14), black, { y: R + 0.02 }));
    arm.add(mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.11, 28), black, { y: R + 0.19 }));
    arm.add(mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.018, 28), dark, { y: R + 0.14 }));
    arm.add(mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.05, 12), dark, { y: R + 0.26 }));
    body.add(arm);
    const r = group();
    r.quaternion.copy(q);
    const hub = group();
    hub.position.y = R + 0.28;
    hub.rotation.y = rotor;
    hub.add(mesh(capsuleGeo(0.045, 0.1), blade, { rz: Math.PI / 2, x: 0.085, cast: false }));
    hub.add(mesh(capsuleGeo(0.045, 0.1), blade, { rz: Math.PI / 2, x: -0.085, cast: false }));
    r.add(hub);
    rotors.add(r);
  }

  const root = group();
  if (parts === 'rotor') {
    body.traverse((o) => {
      if (o.isMesh) {
        o.material = o.material.clone();
        o.material.colorWrite = false;
        o.userData.noOcclude = false;
      }
    });
  }
  if (parts !== 'rotor') root.add(body);
  else root.add(body);
  if (parts !== 'body') root.add(rotors);
  return root;
}
