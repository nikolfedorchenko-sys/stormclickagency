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
 * Моноліт-блискавка: товстий скляний об'єкт висотою 1 з широкими округлими фасками.
 * Повертає меш, центрований по X/Z, низ на y = 0, та опорні точки для внутрішнього розряду.
 */
export function createBoltMonolith(material) {
  const outline = boltPoints();
  const depth = 0.3;
  const bevel = 0.055;
  const geo = new THREE.ExtrudeGeometry(new THREE.Shape(outline), {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel * 0.9,
    bevelSegments: 10,
    curveSegments: 4,
  });
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  // Запам'ятовуємо зсув до переносу: translate() перераховує boundingBox
  const cx = (bb.min.x + bb.max.x) / 2;
  const minY = bb.min.y;
  const size = new THREE.Vector3();
  bb.getSize(size);
  geo.translate(-cx, -minY, -(bb.min.z + bb.max.z) / 2);
  const mesh = new THREE.Mesh(geo, material);
  mesh.userData.width = size.x;
  mesh.userData.height = size.y;
  mesh.userData.depth = size.z;

  // Канал розряду всередині скла: від вершини вниз через середину форми
  const spine = [
    new THREE.Vector3(74 / 140 - cx, 0.96 - minY, 0),
    new THREE.Vector3(66 / 140 - cx, 0.64 - minY, 0),
    new THREE.Vector3(58 / 140 - cx, 0.5 - minY, 0),
    new THREE.Vector3(40 / 140 - cx, 0.43 - minY, 0),
    new THREE.Vector3(33 / 140 - cx, 0.04 - minY, 0),
  ];
  return { mesh, spine, tip: spine[0].clone() };
}

/** Напис зі скла, нормалізований до ширини 1, центрований. */
export function createWordmark(material) {
  const font = new FontLoader().parse(fontData);
  const geo = new TextGeometry(TEXT, {
    font,
    size: 1,
    depth: 0.22,
    curveSegments: 16,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.04,
    bevelSegments: 8,
  });
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const w = bb.max.x - bb.min.x;
  geo.translate(-(bb.min.x + bb.max.x) / 2, -(bb.min.y + bb.max.y) / 2, -(bb.min.z + bb.max.z) / 2);
  geo.scale(1 / w, 1 / w, 1 / w);
  const mesh = new THREE.Mesh(geo, material);
  mesh.userData.aspect = (bb.max.y - bb.min.y) / w;
  return mesh;
}
