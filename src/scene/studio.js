import * as THREE from 'three';

// Студійне оточення для відбиттів: кілька софтбоксів на чорному тлі.
// Довгі вузькі джерела дають витягнуті відблиски на фасках, як у рекламі техніки.
export function createStudioEnvironment(renderer) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  const box = (w, h, color, intensity, position, lookAt) => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }),
    );
    mesh.position.copy(position);
    mesh.lookAt(lookAt);
    scene.add(mesh);
  };

  const center = new THREE.Vector3(0, 0, 0);
  // Верхній великий софтбокс – основне м'яке світло
  box(24, 5, 0xffffff, 9, new THREE.Vector3(0, 14, 2), center);
  // Ліва вертикальна смуга – холодний рим
  box(2, 18, 0xdfe6ff, 7, new THREE.Vector3(-14, 2, 4), center);
  // Права смуга – тепліша і слабша, для об'єму
  box(2.5, 16, 0xf0ecff, 3.5, new THREE.Vector3(13, 1, -2), center);
  // Задня тонка смуга – контровий відблиск
  box(30, 1.2, 0xe8eeff, 5, new THREE.Vector3(0, 5, -16), center);
  // Фронтальний софтбокс над камерою: саме він дає градієнт на лицьових гранях
  box(34, 12, 0xffffff, 2.2, new THREE.Vector3(0, 9, 20), center);
  // Низ – ледь помітне заповнення, щоб нижні фаски не були чорними
  box(24, 8, 0x9aa3c0, 0.7, new THREE.Vector3(0, -12, 4), center);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const texture = pmrem.fromScene(scene, 0.02).texture;
  pmrem.dispose();
  return texture;
}
