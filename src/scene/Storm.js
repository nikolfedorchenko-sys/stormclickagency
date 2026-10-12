import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { bgVertex, bgFragment, boltVertex, boltFragment } from './shaders.js';
import { createBoltGeometry } from './bolt.js';
import { createBoltMonolith, createWordmark } from './logo3d.js';

const QUALITY = {
  high: { bloom: true, dpr: 2, msaa: 4, transmissionScale: 1 },
  mid: { bloom: true, dpr: 1.5, msaa: 2, transmissionScale: 0.5 },
  low: { bloom: false, dpr: 1, msaa: 0, transmissionScale: 0.5 },
};

const CAMERA_Z = 9;
const smooth = (a, b, x) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};
const rand = (a, b) => a + Math.random() * (b - a);

export class Storm {
  constructor(canvas, { tier = 'high', reducedMotion = false } = {}) {
    this.canvas = canvas;
    this.tier = tier;
    this.quality = { ...QUALITY[tier] };
    this.reduced = reducedMotion;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.transmissionResolutionScale = this.quality.transmissionScale;
    this.dpr = Math.min(window.devicePixelRatio || 1, this.quality.dpr);
    this.renderer.setPixelRatio(this.dpr);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(32, 1, 0.5, 60);
    this.camera.position.set(0, 0, CAMERA_Z);

    this.pointer = new THREE.Vector2();
    this.pointerSmooth = new THREE.Vector2();

    this.target = { form: 0, burst: 0 };
    this.cur = { ...this.target };

    this.pulse = 0;
    this.pulseTarget = 0;
    this.nextPulse = 0.8;
    this.hit = 0;
    this.bolts = [];
    this.bigStrikeDone = false;
    this.visible = true;
    this.frames = 0;
    this.fpsTime = 0;
    this.lastTime = performance.now();
  }

  async init() {
    this.buildBackground();
    await this.buildEnvironment();
    this.buildLogo();
    this.resize();
    this.buildComposer();

    window.addEventListener('resize', () => this.resize());
    window.addEventListener('pointermove', (e) => {
      this.pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) this.lastTime = performance.now();
    });
  }

  buildBackground() {
    this.bgUniforms = {
      uTime: { value: 0 },
      uGlow: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uSpot: { value: new THREE.Vector2(0.3, 0) },
    };
    const bg = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({ vertexShader: bgVertex, fragmentShader: bgFragment, uniforms: this.bgUniforms, depthTest: false, depthWrite: false }),
    );
    bg.frustumCulled = false;
    bg.renderOrder = -10;
    this.scene.add(bg);
  }

  // Справжня студійна карта оточення: саме вона робить скло скляним
  async buildEnvironment() {
    const { default: url } = await import('@pmndrs/assets/hdri/studio.exr');
    const exr = await new EXRLoader().loadAsync(url);
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromEquirectangular(exr).texture;
    this.scene.environmentIntensity = 0.9;
    exr.dispose();
    pmrem.dispose();

    // Великий софтбокс зліва-зверху: м'який градієнт на лицьових гранях
    RectAreaLightUniformsLib.init();
    this.soft = new THREE.RectAreaLight(0xeef1ff, 6, 10, 6);
    this.soft.position.set(-5, 5, 7);
    this.soft.lookAt(0, 0, 0);
    // Контровий промінь для гострих відблисків на фасках
    this.key = new THREE.SpotLight(0xf4f6ff, 60, 40, 0.5, 0.6, 1.2);
    this.key.position.set(-6, 7, 5);
    this.rim = new THREE.DirectionalLight(0xc9d2ff, 1.2);
    this.rim.position.set(6, -2, -4);
    this.inner = new THREE.PointLight(0x8f9dff, 0, 6, 2);
    this.scene.add(this.soft, this.key, this.rim, this.inner);
  }

  buildLogo() {
    // Димчасте скло: світло проходить крізь товщу, але гаситься і синіє в глибині
    this.glass = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0,
      roughness: 0.22,
      transmission: 1,
      thickness: 1.4,
      ior: 1.5,
      attenuationColor: new THREE.Color(0x3c4290),
      attenuationDistance: 1.1,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      specularIntensity: 1,
      envMapIntensity: 1,
    });

    this.logoRoot = new THREE.Group();
    const { mesh, spine, tip } = createBoltMonolith(this.glass);
    this.monolith = mesh;
    this.spine = spine;
    this.tip = tip;
    this.logoRoot.add(mesh);

    // Розряд усередині скла: два переплетені канали вздовж хребта форми
    this.innerBolts = [];
    for (let i = 0; i < 3; i++) {
      const material = new THREE.ShaderMaterial({
        vertexShader: boltVertex,
        fragmentShader: boltFragment,
        uniforms: { uAlpha: { value: 0 }, uReveal: { value: 1 }, uColor: { value: new THREE.Color(0x5f74ff) } },
        // Не «прозорий» для three.js, щоб потрапити в буфер, який бачить скло крізь товщу
        transparent: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      // Третій канал – широкий і тьмяний, дає розсіяне світіння в товщі скла
      const wide = i === 2;
      const m = new THREE.Mesh(this.innerGeometry(wide ? 0.09 : 0.018), material);
      m.frustumCulled = false;
      this.logoRoot.add(m);
      this.innerBolts.push({ mesh: m, seed: Math.random() * 10, wide });
    }

    this.wordmark = createWordmark(this.glass);
    this.wordmark.visible = false;
    this.logoRoot.add(this.wordmark);
    this.scene.add(this.logoRoot);
  }

  // Ламаний канал через опорні точки хребта, трохи всередині товщі скла
  innerGeometry(width = 0.018) {
    const pts = [];
    for (let i = 0; i < this.spine.length - 1; i++) {
      const a = this.spine[i].clone();
      const b = this.spine[i + 1].clone();
      a.z = rand(-0.08, 0.08);
      b.z = rand(-0.08, 0.08);
      pts.push([a, b]);
    }
    const parts = pts.map(([a, b]) => createBoltGeometry(a, b, { width, branches: width > 0.05 ? 0 : 1 }));
    const merged = mergeGeometries(parts);
    parts.forEach((g) => g.dispose());
    return merged;
  }

  layout() {
    const aspect = this.camera.aspect;
    const viewH = 2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * CAMERA_Z;
    const viewW = viewH * aspect;
    this.viewW = viewW;
    this.viewH = viewH;
    this.row = aspect > 1.05;
    // На десктопі моноліт праворуч на 62% висоти кадру, на телефоні – зверху по центру
    // Три стани скрол-сценарію: спокій, центр кадру перед ударом, емблема вгорі
    this.monolithH = this.row ? viewH * 0.56 : viewH * 0.27;
    this.states = this.row
      ? {
        rest: { pos: new THREE.Vector3(viewW * 0.19, -this.monolithH * 0.56, 0), scale: this.monolithH, rotY: -0.35 },
        center: { pos: new THREE.Vector3(0, -viewH * 0.27, 0), scale: viewH * 0.54, rotY: 0.3 },
        crown: { pos: new THREE.Vector3(0, viewH * 0.12, -1), scale: viewH * 0.3, rotY: 0 },
      }
      : {
        rest: { pos: new THREE.Vector3(0, viewH * 0.03, 0), scale: this.monolithH, rotY: -0.35 },
        center: { pos: new THREE.Vector3(0, -viewH * 0.17, 0), scale: viewH * 0.34, rotY: 0.3 },
        crown: { pos: new THREE.Vector3(0, viewH * 0.2, -1), scale: viewH * 0.2, rotY: 0 },
      };
    this.wordW = this.row ? Math.min(viewW * 0.6, 9) : viewW * 0.86;
    this.wordmark.scale.setScalar(this.wordW);
    this.wordmark.position.set(0, -(this.wordW * this.wordmark.userData.aspect) / 2 - viewH * 0.05, 0.2);
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.renderer.setSize(this.width, this.height, false);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.bgUniforms.uRes.value.set(this.width, this.height);
    this.layout();
    this.composer?.setSize(this.width, this.height);
  }

  buildComposer() {
    const size = this.renderer.getDrawingBufferSize(new THREE.Vector2());
    const target = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: this.quality.msaa });
    this.composer = new EffectComposer(this.renderer, target);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    if (this.quality.bloom) this.addBloom();
    this.composer.addPass(new OutputPass());
  }

  async addBloom() {
    const { UnrealBloomPass } = await import('three/examples/jsm/postprocessing/UnrealBloomPass.js');
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.35, 0.7, 0.9);
    this.composer.insertPass(this.bloom, this.composer.passes.length - 1);
  }

  setProgress(p) {
    if (this.reduced) return;
    this.target.form = smooth(0.08, 0.5, p);
    this.target.burst = smooth(0.68, 0.98, p);
  }

  // Зовнішній удар у вершину моноліта
  bigStrike() {
    const to = this.tip.clone().multiplyScalar(this.monolithH).applyEuler(this.logoRoot.rotation).add(this.logoRoot.position);
    const from = new THREE.Vector3(to.x + rand(-1, 1), to.y + 6, to.z + 0.4);
    const material = new THREE.ShaderMaterial({
      vertexShader: boltVertex,
      fragmentShader: boltFragment,
      uniforms: { uAlpha: { value: 1 }, uReveal: { value: 0 }, uColor: { value: new THREE.Color(0xb9c4ff) } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const mesh = new THREE.Mesh(createBoltGeometry(from, to, { width: 0.06, branches: 4 }), material);
    mesh.frustumCulled = false;
    this.scene.add(mesh);
    this.bolts.push({ mesh, age: 0, life: 0.7 });
    this.hit = 1;
  }

  arc() {
    this.pulseTarget = 1;
  }

  updateBolts(dt) {
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const b = this.bolts[i];
      b.age += dt;
      const t = b.age / b.life;
      if (t >= 1) {
        this.scene.remove(b.mesh);
        b.mesh.geometry.dispose();
        b.mesh.material.dispose();
        this.bolts.splice(i, 1);
        continue;
      }
      const u = b.mesh.material.uniforms;
      u.uReveal.value = Math.min(1, b.age / 0.06);
      u.uAlpha.value = Math.pow(1 - t, 1.6) * (0.85 + 0.15 * Math.sin(b.age * 40));
    }
  }

  update() {
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    const time = now / 1000;

    for (const k of ['form', 'burst']) this.cur[k] += (this.target[k] - this.cur[k]) * Math.min(1, dt * 4.5);
    const { form, burst } = this.cur;

    this.pointerSmooth.lerp(this.pointer, Math.min(1, dt * 2.5));
    this.camera.position.x = this.pointerSmooth.x * 0.25;
    this.camera.position.y = this.pointerSmooth.y * 0.15;
    this.camera.lookAt(0, 0, 0);

    // Моноліт: зі скролом виходить у центр і обертається до глядача,
    // після удару відходить угору як емблема, під ним з'являється напис
    const { rest, center, crown } = this.states;
    const pos = new THREE.Vector3().lerpVectors(rest.pos, center.pos, form).lerp(crown.pos, burst);
    const scale = THREE.MathUtils.lerp(THREE.MathUtils.lerp(rest.scale, center.scale, form), crown.scale, burst);
    const rotY = THREE.MathUtils.lerp(THREE.MathUtils.lerp(rest.rotY, center.rotY, form), crown.rotY, burst);
    this.monolith.scale.setScalar(scale);
    this.innerBolts.forEach((b) => b.mesh.scale.setScalar(scale));
    this.monolithH = scale;
    this.logoRoot.position.set(pos.x, pos.y + Math.sin(time * 0.5) * 0.05 * (1 - burst), pos.z);
    this.logoRoot.rotation.set(
      this.pointerSmooth.y * -0.08 * (1 - burst) + Math.sin(time * 0.37) * 0.02,
      rotY + this.pointerSmooth.x * 0.14 * (1 - burst) + Math.sin(time * 0.29) * 0.05,
      0.02 * (1 - burst),
    );
    const wordIn = smooth(0.1, 0.6, burst);
    this.wordmark.visible = wordIn > 0.001;
    this.wordmark.scale.setScalar(this.wordW * (0.9 + 0.1 * wordIn));
    this.wordmark.rotation.x = (1 - wordIn) * 0.5;
    // Спалах прозорості в момент удару: скло на мить показує розряд цілком
    this.glass.attenuationDistance = 1.1 + this.hit * 0.9;
    this.glass.roughness = 0.22 - this.hit * 0.06;
    this.bgUniforms.uSpot.value.set(
      THREE.MathUtils.lerp(this.row ? 0.3 : 0, 0, form),
      THREE.MathUtils.lerp(this.row ? 0 : 0.17, 0.1, burst),
    );

    // Розряд усередині скла: повільне тління, час від часу спалах
    if (!this.reduced) {
      this.nextPulse -= dt;
      if (this.nextPulse <= 0) {
        this.pulseTarget = rand(0.6, 1);
        this.nextPulse = rand(1.5, 4.5);
        this.innerBolts.forEach((b) => {
          b.mesh.geometry.dispose();
          b.mesh.geometry = this.innerGeometry(b.wide ? 0.09 : 0.018);
        });
      }
    }
    this.pulseTarget = Math.max(0, this.pulseTarget - dt * 1.4);
    this.pulse += (this.pulseTarget - this.pulse) * Math.min(1, dt * 9);
    const ember = 0.45 + 0.1 * Math.sin(time * 1.3) + form * 0.25;
    const glow = Math.min(1.3, ember + this.pulse + this.hit * 0.6);
    this.innerBolts.forEach((b, i) => {
      const flicker = 0.8 + 0.2 * Math.sin(time * 23 + b.seed);
      b.mesh.material.uniforms.uAlpha.value = glow * flicker * (b.wide ? 0.22 : i === 0 ? 0.9 : 0.5);
    });
    this.inner.intensity = glow * 30;
    const c = this.spine[2].clone().multiplyScalar(this.monolithH).applyEuler(this.logoRoot.rotation).add(this.logoRoot.position);
    this.inner.position.copy(c);

    if (!this.reduced && form > 0.94 && !this.bigStrikeDone) {
      this.bigStrikeDone = true;
      this.bigStrike();
    } else if (form < 0.5) {
      this.bigStrikeDone = false;
    }
    this.hit = Math.max(0, this.hit - dt * 0.6);
    this.updateBolts(dt);

    this.bgUniforms.uTime.value = time;
    this.bgUniforms.uGlow.value = this.pulse * 0.3 + this.hit * 0.5;

    this.trackFps(dt);
  }

  trackFps(dt) {
    if (this.fpsChecked) return;
    this.frames++;
    this.fpsTime += dt;
    if (this.fpsTime < 2.5) return;
    const fps = this.frames / this.fpsTime;
    this.frames = 0;
    this.fpsTime = 0;
    if (fps >= 45) {
      this.fpsChecked = true;
    } else if (this.dpr > 1) {
      this.dpr = Math.max(1, this.dpr - 0.5);
      this.renderer.setPixelRatio(this.dpr);
      this.resize();
    } else if (this.renderer.transmissionResolutionScale > 0.5) {
      this.renderer.transmissionResolutionScale = 0.5;
    } else if (this.bloom) {
      this.composer.removePass(this.bloom);
      this.bloom = null;
    } else {
      this.fpsChecked = true;
    }
  }

  render() {
    this.composer.render();
  }

  start() {
    const loop = () => {
      requestAnimationFrame(loop);
      if (document.hidden || !this.visible) return;
      this.update();
      this.render();
    };
    this.update();
    loop();
  }
}

// Склеює кілька геометрій із однаковими атрибутами в одну
function mergeGeometries(list) {
  const pos = [];
  const side = [];
  const along = [];
  const index = [];
  let base = 0;
  for (const g of list) {
    pos.push(...g.attributes.position.array);
    side.push(...g.attributes.aSide.array);
    along.push(...g.attributes.aAlong.array);
    for (const i of g.index.array) index.push(i + base);
    base += g.attributes.position.count;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aSide', new THREE.Float32BufferAttribute(side, 1));
  geo.setAttribute('aAlong', new THREE.Float32BufferAttribute(along, 1));
  geo.setIndex(index);
  return geo;
}
