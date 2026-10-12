import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { bgVertex, bgFragment, floorVertex, floorFragment, boltVertex, boltFragment } from './shaders.js';
import { createBoltGeometry } from './bolt.js';
import { createStudioEnvironment } from './studio.js';
import { createLogo } from './logo3d.js';

const QUALITY = {
  high: { bloom: true, dpr: 1.75, msaa: 4 },
  mid: { bloom: true, dpr: 1.5, msaa: 2 },
  low: { bloom: false, dpr: 1, msaa: 0 },
};

const CAM_START = new THREE.Vector3(0, 2.4, 16);
const CAM_FORMED = new THREE.Vector3(0, 2.1, 12.5);
const LOOK_START = new THREE.Vector3(0, 1.2, 0);
const LOOK_FORMED = new THREE.Vector3(0, 1.5, 0);
const LOGO_Y = 1.9;
const LOGO_CROWN_Y = 4.3;

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
    this.dpr = Math.min(window.devicePixelRatio || 1, this.quality.dpr);
    this.renderer.setPixelRatio(this.dpr);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(36, 1, 0.5, 80);
    this.camera.position.copy(CAM_START);

    this.pointer = new THREE.Vector2();
    this.pointerSmooth = new THREE.Vector2();
    this.look = new THREE.Vector3();

    // target – куди веде скрол, cur – згладжене значення, яке бачить сцена
    this.target = { form: 0, burst: 0 };
    this.cur = { ...this.target };

    this.flash = 0;
    this.flashPos = new THREE.Vector3();
    this.hit = 0;
    this.bolts = [];
    this.nextArc = 1;
    this.bigStrikeDone = false;
    this.visible = true;
    this.frames = 0;
    this.fpsTime = 0;
    this.lastTime = performance.now();
  }

  async init() {
    this.buildBackground();
    this.buildLighting();
    this.buildLogo();
    this.buildFloor();
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
      uFlash: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uSpot: { value: new THREE.Vector2(0, 0.05) },
    };
    const bg = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({ vertexShader: bgVertex, fragmentShader: bgFragment, uniforms: this.bgUniforms, depthTest: false, depthWrite: false }),
    );
    bg.frustumCulled = false;
    bg.renderOrder = -10;
    this.scene.add(bg);
  }

  buildLighting() {
    this.scene.environment = createStudioEnvironment(this.renderer);
    this.scene.environmentIntensity = 1.3;

    // Ковзний контровий промінь: їздить по фасках і дає живі відблиски
    this.sweep = new THREE.DirectionalLight(0xeef1ff, 1.6);
    this.sweep.position.set(-8, 9, 6);
    this.flashLight = new THREE.PointLight(0xdfe6ff, 0, 25, 2);
    this.scene.add(this.sweep, this.flashLight, new THREE.AmbientLight(0x1a1c26, 0.4));
  }

  buildLogo() {
    this.materials = {
      // Графіт із лаковим покриттям
      text: new THREE.MeshPhysicalMaterial({
        color: 0x2b2d38,
        metalness: 0.9,
        roughness: 0.38,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        envMapIntensity: 1.6,
      }),
      // Полірований хром
      bolt: new THREE.MeshPhysicalMaterial({
        color: 0xf2f4fa,
        metalness: 1,
        roughness: 0.1,
        clearcoat: 1,
        clearcoatRoughness: 0.03,
        envMapIntensity: 1.3,
        emissive: 0x9fb2ff,
        emissiveIntensity: 0,
      }),
    };
    this.logoRoot = new THREE.Group();
    this.reflectionRoot = new THREE.Group();
    this.scene.add(this.logoRoot, this.reflectionRoot);
  }

  buildFloor() {
    this.floorUniforms = { uFade: { value: 2.2 }, uOpacity: { value: 1 } };
    this.floor = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 80),
      new THREE.ShaderMaterial({ vertexShader: floorVertex, fragmentShader: floorFragment, uniforms: this.floorUniforms, transparent: true, depthWrite: false }),
    );
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.renderOrder = 5;
    this.scene.add(this.floor);
  }

  // Перебудовує логотип під орієнтацію екрана
  layoutLogo() {
    const layout = this.camera.aspect > 0.9 ? 'row' : 'column';
    if (layout !== this.logoLayout) {
      this.logoLayout = layout;
      if (this.logo) {
        this.logoRoot.remove(this.logo.group);
        this.reflectionRoot.clear();
        this.logo.meshes.forEach((m) => m.geometry.dispose());
      }
      this.logo = createLogo(this.materials, layout);
      this.logoRoot.add(this.logo.group);
      this.reflection = this.logo.group.clone();
      this.reflectionRoot.add(this.reflection);
    }
    const dist = CAM_FORMED.z;
    const viewH = 2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * dist;
    const viewW = viewH * this.camera.aspect;
    this.logoWidth = layout === 'row' ? Math.min(viewW * 0.7, 11) : viewW * 0.84;
    this.logoHeight = this.logoWidth * this.logo.aspect;
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.renderer.setSize(this.width, this.height, false);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.bgUniforms.uRes.value.set(this.width, this.height);
    this.layoutLogo();
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
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.45, 0.5, 0.85);
    this.composer.insertPass(this.bloom, this.composer.passes.length - 1);
  }

  // p – прогрес скролу першого екрана від 0 до 1
  setProgress(p) {
    if (this.reduced) return;
    this.target.form = smooth(0.08, 0.5, p);
    this.target.burst = smooth(0.68, 0.98, p);
  }

  logoToWorld(local) {
    return local.clone().multiplyScalar(this.logoScale).applyEuler(this.logoRoot.rotation).add(this.logoRoot.position);
  }

  strike({ from, to, width = 0.05, branches = 2, power = 0.5, life = 0.3 }) {
    const material = new THREE.ShaderMaterial({
      vertexShader: boltVertex,
      fragmentShader: boltFragment,
      uniforms: { uAlpha: { value: 1 }, uReveal: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const mesh = new THREE.Mesh(createBoltGeometry(from, to, { width, branches }), material);
    mesh.frustumCulled = false;
    this.scene.add(mesh);
    this.bolts.push({ mesh, age: 0, life, power, seed: Math.random() * 10, end: to.clone() });
    this.flashPos.copy(to);
  }

  // Дрібний розряд, що пробігає по контуру хромованої блискавки
  arc() {
    const a = this.logo.anchors;
    const i = Math.floor(Math.random() * a.length);
    const j = (i + 1 + Math.floor(Math.random() * 2)) % a.length;
    const from = this.logoToWorld(a[i]);
    const to = this.logoToWorld(a[j]);
    const out = new THREE.Vector3(0, 0, this.logoHeight * 0.1);
    from.add(out);
    to.add(out);
    this.strike({ from, to, width: 0.03 + Math.random() * 0.03, branches: 2, power: 0.25, life: rand(0.12, 0.25) });
  }

  bigStrike() {
    const to = this.logoToWorld(this.logo.tip);
    const from = new THREE.Vector3(to.x + rand(-1.2, 1.2), to.y + 7, to.z + 0.3);
    this.strike({ from, to, width: 0.11, branches: 5, power: 1.2, life: 0.7 });
    this.hit = 1;
  }

  updateBolts(dt) {
    let flash = 0;
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
      const flicker = 0.85 + 0.15 * Math.sin(b.age * 40 + b.seed);
      u.uAlpha.value = Math.pow(1 - t, 1.5) * flicker;
      flash = Math.max(flash, u.uAlpha.value * b.power);
    }
    return flash;
  }

  update() {
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    const time = now / 1000;

    for (const k of ['form', 'burst']) this.cur[k] += (this.target[k] - this.cur[k]) * Math.min(1, dt * 4.5);
    const { form, burst } = this.cur;

    // Камера: наїзд на логотип зі скролом, легкий паралакс за курсором
    this.pointerSmooth.lerp(this.pointer, Math.min(1, dt * 3));
    this.camera.position.lerpVectors(CAM_START, CAM_FORMED, form);
    this.camera.position.x += this.pointerSmooth.x * 0.5;
    this.camera.position.y += this.pointerSmooth.y * 0.25;
    this.camera.lookAt(this.look.lerpVectors(LOOK_START, LOOK_FORMED, form));

    // Логотип: на старті трохи далі й правіше, на скролі виходить у центр,
    // після удару піднімається як емблема
    const startX = this.camera.aspect > 1.2 ? this.logoWidth * 0.2 : 0;
    const y = THREE.MathUtils.lerp(THREE.MathUtils.lerp(LOGO_Y + 1.6, LOGO_Y, form), LOGO_CROWN_Y, burst);
    const z = THREE.MathUtils.lerp(THREE.MathUtils.lerp(-5, 0, form), -2, burst);
    const x = THREE.MathUtils.lerp(startX, 0, form);
    this.logoScale = THREE.MathUtils.lerp(this.logoWidth, this.logoWidth * 0.42, burst);
    this.logoRoot.position.set(x, y, z);
    this.logo.group.scale.setScalar(this.logoScale);
    this.logoRoot.rotation.set(
      this.pointerSmooth.y * -0.05 + Math.sin(time * 0.4) * 0.015,
      THREE.MathUtils.lerp(-0.35, 0, form) + this.pointerSmooth.x * 0.1 + Math.sin(time * 0.3) * 0.03,
      0,
    );

    // Відбиття у підлозі: дзеркальна копія під лінією контакту
    const floorY = y - this.logoHeight * this.logoScale / this.logoWidth / 2 * (1 - burst) - 0.01;
    this.floor.position.y = floorY;
    this.floor.position.z = z;
    this.reflectionRoot.position.set(x, 2 * floorY - y, z);
    this.reflectionRoot.rotation.set(-this.logoRoot.rotation.x, this.logoRoot.rotation.y, 0);
    this.reflection.scale.set(this.logoScale, -this.logoScale, this.logoScale);
    // Відбиття з'являється, коли логотип виходить у центр, і зникає під час підйому
    const grounded = (1 - smooth(0, 0.3, burst)) * smooth(0.45, 0.85, form);
    this.reflectionRoot.visible = grounded > 0.01;
    this.floor.visible = grounded > 0.01;
    this.floorUniforms.uOpacity.value = grounded;

    if (!this.reduced) {
      this.nextArc -= dt;
      if (this.nextArc <= 0 && burst < 0.5) {
        this.arc();
        if (Math.random() < 0.35) this.arc();
        this.nextArc = rand(0.5, 2.2) * (1 - form * 0.5);
      }
      if (form > 0.94 && !this.bigStrikeDone) {
        this.bigStrikeDone = true;
        this.bigStrike();
      } else if (form < 0.5) {
        this.bigStrikeDone = false;
      }
    }

    this.hit = Math.max(0, this.hit - dt * 0.5);
    this.flash = Math.max(this.flash * Math.exp(-dt * 8), this.updateBolts(dt));

    // Ковзний промінь повільно обходить логотип
    this.sweep.position.set(Math.sin(time * 0.25) * 10, 8 + Math.cos(time * 0.2) * 2, 6);
    this.materials.bolt.emissiveIntensity = this.hit * 0.9 + this.flash * 0.25;
    this.flashLight.position.copy(this.flashPos);
    this.flashLight.intensity = this.flash * 160;

    this.bgUniforms.uTime.value = time;
    this.bgUniforms.uFlash.value = this.flash;
    const spot = this.logoRoot.position.clone().project(this.camera);
    this.bgUniforms.uSpot.value.set(spot.x * 0.5 * this.camera.aspect, spot.y * 0.5);

    this.trackFps(dt);
  }

  // Якщо пристрій не тягне – знижуємо роздільність, потім вимикаємо згладжування і bloom
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
      this.dpr = 1;
      this.renderer.setPixelRatio(1);
      this.resize();
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
