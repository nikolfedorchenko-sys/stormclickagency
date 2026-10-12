import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import fontData from './unbounded-bold.json';

// Тимчасовий логотип: блискавка + напис. Коли буде фінальний,
// замінюємо BOLT_PATH та/або напис.
const BOLT_PATH = 'M58 0 L12 78 L44 78 L30 140 L90 52 L57 52 L76 0 Z';
const TEXT = 'STORMCLICK';

function boltPoints() {
  const nums = BOLT_PATH.match(/-?\d+(\.\d+)?/g).map(Number);
  const pts = [];
  // Висота 140 → 1, вісь Y вгору
  for (let i = 0; i < nums.length; i += 2) pts.push(new THREE.Vector2(nums[i] / 140, 1 - nums[i + 1] / 140));
  return pts;
}

/**
 * Створює суцільний 3D-логотип: блискавка і напис із широкими округлими фасками,
 * на яких добре читаються студійні відблиски.
 * layout: 'row' – блискавка ліворуч від напису, 'column' – над ним.
 * Повертає групу шириною 1 (масштабується сценою), вершину блискавки
 * та точки на контурі блискавки для дрібних розрядів.
 */
export function createLogo(materials, layout) {
  const font = new FontLoader().parse(fontData);
  const group = new THREE.Group();

  const textGeo = new TextGeometry(TEXT, {
    font,
    size: 1,
    depth: 0.26,
    curveSegments: 16,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.045,
    bevelSegments: 7,
  });
  textGeo.computeBoundingBox();
  const tb = textGeo.boundingBox;
  const textW = tb.max.x - tb.min.x;
  const textH = tb.max.y - tb.min.y;
  textGeo.translate(-tb.min.x, -tb.min.y, -(tb.min.z + tb.max.z) / 2);
  const text = new THREE.Mesh(textGeo, materials.text);

  const boltH = layout === 'row' ? textH * 1.6 : textH * 2.4;
  const outline = boltPoints();
  const boltShape = new THREE.Shape(outline);
  const boltGeo = new THREE.ExtrudeGeometry(boltShape, {
    depth: 0.3 / boltH,
    bevelEnabled: true,
    bevelThickness: 0.07 / boltH,
    bevelSize: 0.05 / boltH,
    bevelSegments: 7,
  });
  boltGeo.scale(boltH, boltH, boltH);
  boltGeo.computeBoundingBox();
  const bb = boltGeo.boundingBox;
  boltGeo.translate(-bb.min.x, -bb.min.y, -(bb.min.z + bb.max.z) / 2);
  const bolt = new THREE.Mesh(boltGeo, materials.bolt);
  const boltW = bb.max.x - bb.min.x;

  let totalW;
  let totalH;
  if (layout === 'row') {
    const gap = textH * 0.42;
    totalW = boltW + gap + textW;
    totalH = boltH;
    bolt.position.set(-totalW / 2, -boltH / 2, 0);
    text.position.set(-totalW / 2 + boltW + gap, -textH / 2, 0);
  } else {
    const gap = textH * 0.9;
    totalW = textW;
    totalH = boltH + gap + textH;
    bolt.position.set(-boltW / 2, totalH / 2 - boltH, 0);
    text.position.set(-textW / 2, -totalH / 2, 0);
  }

  // Внутрішня група нормалізована до ширини 1, зовнішню масштабує сцена
  const inner = new THREE.Group();
  inner.add(bolt, text);
  const s = 1 / totalW;
  inner.scale.setScalar(s);
  group.add(inner);

  const local = (x, y) => new THREE.Vector3(bolt.position.x + x * boltH - bb.min.x, bolt.position.y + y * boltH - bb.min.y, 0).multiplyScalar(s);
  const tip = local(76 / 140, 1);
  const anchors = outline.map((p) => local(p.x, p.y));

  return { group, tip, anchors, aspect: totalH / totalW, meshes: [bolt, text] };
}
