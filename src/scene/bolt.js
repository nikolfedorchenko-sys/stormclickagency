import * as THREE from 'three';

const Z = new THREE.Vector3(0, 0, 1);

// Ламана лінія методом зміщення середини: кожне покоління ділить відрізки навпіл
function jagged(a, b, generations, roughness) {
  let pts = [a.clone(), b.clone()];
  let d = roughness * a.distanceTo(b);
  for (let g = 0; g < generations; g++) {
    const next = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const p = pts[i];
      const q = pts[i + 1];
      const m = p.clone().add(q).multiplyScalar(0.5);
      const perp = new THREE.Vector3(p.y - q.y, q.x - p.x, 0).normalize();
      m.addScaledVector(perp, (Math.random() - 0.5) * d);
      m.z += (Math.random() - 0.5) * d * 0.4;
      next.push(m, q);
    }
    pts = next;
    d *= 0.55;
  }
  return pts;
}

// Стрічка, повернута до камери; aSide від -1 до 1 поперек, aAlong від 0 до 1 вздовж
function ribbon(strands) {
  const pos = [];
  const side = [];
  const along = [];
  const index = [];
  let base = 0;
  for (const { pts, width, offset } of strands) {
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const p = pts[i];
      const prev = pts[Math.max(i - 1, 0)];
      const next = pts[Math.min(i + 1, n - 1)];
      const tx = next.x - prev.x;
      const ty = next.y - prev.y;
      const l = Math.hypot(tx, ty) || 1;
      const nx = -ty / l;
      const ny = tx / l;
      const t = i / (n - 1);
      const w = width * (1 - 0.65 * t);
      pos.push(p.x + nx * w, p.y + ny * w, p.z, p.x - nx * w, p.y - ny * w, p.z);
      side.push(1, -1);
      const a = offset + t * (1 - offset);
      along.push(a, a);
      if (i < n - 1) {
        const k = base + i * 2;
        index.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
      }
    }
    base += n * 2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aSide', new THREE.Float32BufferAttribute(side, 1));
  geo.setAttribute('aAlong', new THREE.Float32BufferAttribute(along, 1));
  geo.setIndex(index);
  return geo;
}

export function createBoltGeometry(start, end, { branches = 4, width = 0.14 } = {}) {
  const main = jagged(start, end, 7, 0.2);
  const strands = [{ pts: main, width, offset: 0 }];
  for (let k = 0; k < branches; k++) {
    const t = 0.12 + Math.random() * 0.6;
    const from = main[Math.floor(main.length * t)];
    const dir = end.clone().sub(from)
      .applyAxisAngle(Z, (Math.random() - 0.5) * 1.8)
      .multiplyScalar(0.2 + Math.random() * 0.35);
    // Гілка з'являється тоді, коли основний розряд доходить до точки відгалуження
    strands.push({ pts: jagged(from, from.clone().add(dir), 5, 0.3), width: width * 0.45, offset: t });
  }
  return ribbon(strands);
}
