import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import fontData from './unbounded-bold.json';

// Тимчасовий логотип: блискавка + напис. Коли буде фінальний,
// замінюємо BOLT_PATH та/або напис.
const BOLT_PATH = 'M58 0 L12 78 L44 78 L30 140 L90 52 L57 52 L76 0 Z';
const TEXT = 'STORMCLICK';

function boltShape() {
  const shape = new THREE.Shape();
  const nums = BOLT_PATH.match(/-?\d+(\.\d+)?/g).map(Number);
  // Висота 140 → 1, вісь Y вгору
  for (let i = 0; i < nums.length; i += 2) {
    const x = nums[i] / 140;
    const y = 1 - nums[i + 1] / 140;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

/**
 * Створює суцільний 3D-логотип: блискавка і напис з фасками.
 * layout: 'row' – блискавка ліворуч від напису, 'column' – над ним.
 * Повертає групу шириною 1 (масштабується під екран) і точку вершини блискавки.
 */
export function createLogo(materials, layout) {
  const font = new FontLoader().parse(fontData);
  const group = new THREE.Group();

  const textGeo = new TextGeometry(TEXT, {
    font,
    size: 1,
    depth: 0.32,
    curveSegments: 10,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.035,
    bevelSegments: 4,
  });
  textGeo.computeBoundingBox();
  const tb = textGeo.boundingBox;
  const textW = tb.max.x - tb.min.x;
  const textH = tb.max.y - tb.min.y;
  textGeo.translate(-tb.min.x, -tb.min.y, -tb.min.z - 0.16);
  const text = new THREE.Mesh(textGeo, materials.text);

  const boltH = layout === 'row' ? textH * 1.55 : textH * 2.4;
  const boltGeo = new THREE.ExtrudeGeometry(boltShape(), {
    depth: 0.36 / boltH,
    bevelEnabled: true,
    bevelThickness: 0.06 / boltH,
    bevelSize: 0.04 / boltH,
    bevelSegments: 4,
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

  // Вершина блискавки (точка удару) у локальних координатах групи
  const tip = new THREE.Vector3(bolt.position.x + (76 / 140) * boltH, bolt.position.y + boltH, 0).multiplyScalar(s);

  return { group, tip, aspect: totalH / totalW, meshes: [bolt, text] };
}
