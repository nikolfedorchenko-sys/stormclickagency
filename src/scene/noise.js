import * as THREE from 'three';

// Тривимірна текстура шуму для хмар. Генерується один раз при старті.
// R – м'який fbm (форма хмар), G – комірчастий шум (клубки), B – дрібні деталі.
export function createNoiseTexture(size = 64) {
  const data = new Uint8Array(size * size * size * 4);

  const hash = (x, y, z, seed) => {
    let h = (x * 374761393 + y * 668265263 + z * 2147483647 + seed * 97) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };

  // Періодичний value noise: решітка зациклена, тому текстура безшовна
  const value = (x, y, z, freq, seed) => {
    const fx = x * freq;
    const fy = y * freq;
    const fz = z * freq;
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const z0 = Math.floor(fz);
    const tx = fx - x0;
    const ty = fy - y0;
    const tz = fz - z0;
    const sx = tx * tx * (3 - 2 * tx);
    const sy = ty * ty * (3 - 2 * ty);
    const sz = tz * tz * (3 - 2 * tz);
    const g = (i, j, k) => hash((x0 + i) % freq, (y0 + j) % freq, (z0 + k) % freq, seed);
    const lerp = (a, b, t) => a + (b - a) * t;
    return lerp(
      lerp(lerp(g(0, 0, 0), g(1, 0, 0), sx), lerp(g(0, 1, 0), g(1, 1, 0), sx), sy),
      lerp(lerp(g(0, 0, 1), g(1, 0, 1), sx), lerp(g(0, 1, 1), g(1, 1, 1), sx), sy),
      sz,
    );
  };

  const fbm = (x, y, z, octaves, seed) => {
    let v = 0;
    let a = 0.5;
    let f = 4;
    let norm = 0;
    for (let o = 0; o < octaves; o++) {
      v += a * value(x, y, z, f, seed + o);
      norm += a;
      a *= 0.5;
      f *= 2;
    }
    return v / norm;
  };

  // Комірчастий (Worley) шум: відстань до найближчої випадкової точки в комірці
  const cells = 6;
  const pts = [];
  for (let i = 0; i < cells * cells * cells; i++) {
    pts.push(hash(i, 1, 2, 11), hash(i, 3, 4, 12), hash(i, 5, 6, 13));
  }
  const worley = (x, y, z) => {
    const cx = Math.floor(x * cells);
    const cy = Math.floor(y * cells);
    const cz = Math.floor(z * cells);
    let min = 1;
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) {
      const ix = (cx + i + cells) % cells;
      const iy = (cy + j + cells) % cells;
      const iz = (cz + k + cells) % cells;
      const p = (ix * cells * cells + iy * cells + iz) * 3;
      const px = (cx + i + pts[p]) / cells;
      const py = (cy + j + pts[p + 1]) / cells;
      const pz = (cz + k + pts[p + 2]) / cells;
      const d = (x - px) ** 2 + (y - py) ** 2 + (z - pz) ** 2;
      if (d < min) min = d;
    }
    return 1 - Math.min(1, Math.sqrt(min) * cells * 0.9);
  };

  let i = 0;
  for (let z = 0; z < size; z++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = x / size;
        const v = y / size;
        const w = z / size;
        data[i++] = fbm(u, v, w, 4, 1) * 255;
        data[i++] = worley(u, v, w) * 255;
        data[i++] = fbm(u, v, w, 3, 40) * 255;
        data[i++] = 255;
      }
    }
  }

  const tex = new THREE.Data3DTexture(data, size, size, size);
  tex.format = THREE.RGBAFormat;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.wrapR = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}
