import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { boltVertex, boltFragment } from './shaders.js';
import { createBoltGeometry } from './bolt.js';
import { createNoiseTexture } from './noise.js';
import { CloudPass } from './CloudPass.js';
import { BoltPass } from './BoltPass.js';
import { createLogo } from './logo3d.js';

const QUALITY = {
  high: { steps: 40, lightSteps: 3, bloom: true, dpr: 1.5 },
  mid: { steps: 26, lightSteps: 2, bloom: false, dpr: 1.25 },
  low: { steps: 16, lightSteps: 1, bloom: false, dpr: 1 },
};

const CAM_START = new THREE.Vector3(0, 3.8, 15);
const CAM_DIVE = new THREE.Vector3(0, 2.9, 11.5);
const LOOK_START = new THREE.Vector3(0, 1.5, 0);
const LOOK_DIVE = new THREE.Vector3(0, 1.9, 0);
const CLOUD_TOP = 1.1;
const LOGO_HIDDEN_Y = -3.2;
const LOGO_Y = 2.1;
const LOGO_CROWN_Y = 4.4;

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
    this.renderer.toneMappingExposure = 1.05;
    this.dpr = Math.min(window.devicePixelRatio || 1, this.quality.dpr);
    this.renderer.setPixelRatio(this.dpr);

    this.scene = new THREE.Scene();
    this.boltScene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.5, 80);
    this.camera.position.copy(CAM_START);

    this.pointer = new THREE.Vector2();
    this.pointerSmooth = new THREE.Vector2();
    this.look = new THREE.Vector3();

    // target – куди веде скрол, cur – згладжене значення, яке бачить сцена
    this.target = { form: 0, burst: 0, storm: 0.3 };
    this.cur = { ...this.target };

    this.flash = 0;
    this.flashPos = new THREE.Vector3(0, -0.5, -5);
    this.hit = 0;
    this.bolts = [];
    this.nextStrike = 1.2;
    this.bigStrikeDone = false;
    this.visible = true;
    this.frames = 0;
    this.fpsTime = 0;
    this.lastTime = performance.now();
  }

  async init() {
    this.buildEnvironment();
    this.buildLogo();
    this.noise = createNoiseTexture(64);
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

  buildEnvironment() {
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.5;
    pmrem.dispose();

    const key = new THREE.DirectionalLight(0x7f93ff, 2.2);
    key.position.set(-6, 8, 6);
    const fill = new THREE.PointLight(0x9a5cff, 60, 40, 2);
    fill.position.set(7, 3, 4);
    this.flashLight = new THREE.PointLight(0xaab4ff, 0, 30, 2);
    this.scene.add(key, fill, this.flashLight);
  }

  buildLogo() {
    this.materials = {
      text: new THREE.MeshPhysicalMaterial({
        color: 0x161b44,
        metalness: 0.8,
        roughness: 0.26,
        clearcoat: 1,
        clearcoatRoughness: 0.12,
        emissive: 0x3b3fff,
        emissiveIntensity: 0.22,
      }),
      bolt: new THREE.MeshPhysicalMaterial({
        color: 0x9fb0ff,
        metalness: 0.35,
        roughness: 0.14,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        emissive: 0x6f7dff,
        emissiveIntensity: 0.9,
      }),
    };
    this.logoRoot = new THREE.Group();
    this.logoRoot.position.y = LOGO_HIDDEN_Y;
    this.scene.add(this.logoRoot);
  }

  // Перебудовує логотип під орієнтацію екрана
  layoutLogo() {
    const layout = this.camera.aspect > 0.9 ? 'row' : 'column';
    if (layout !== this.logoLayout) {
      this.logoLayout = layout;
      if (this.logo) {
        this.logoRoot.remove(this.logo.group);
        this.logo.meshes.forEach((m) => m.geometry.dispose());
      }
      this.logo = createLogo(this.materials, layout);
      this.logoRoot.add(this.logo.group);
    }
    // Ширина підбирається під кадр після «занурення» камери
    const dist = CAM_DIVE.z;
    const viewH = 2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * dist;
    const viewW = viewH * this.camera.aspect;
    this.logoWidth = layout === 'row' ? Math.min(viewW * 0.72, 11) : viewW * 0.82;
    this.logo.group.scale.setScalar(this.logoWidth);
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.renderer.setSize(this.width, this.height, false);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.viewH = 2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * CAM_START.z;
    this.viewW = this.viewH * this.camera.aspect;
    this.layoutLogo();
    this.composer?.setSize(this.width, this.height);
    this.cloudPass?.uniforms.uRes.value.set(this.width * this.dpr, this.height * this.dpr);
  }

  buildComposer() {
    const size = this.renderer.getDrawingBufferSize(new THREE.Vector2());
    const target = new THREE.WebGLRenderTarget(size.x, size.y, {
      type: THREE.HalfFloatType,
      depthTexture: new THREE.DepthTexture(size.x, size.y, THREE.UnsignedIntType),
    });
    this.composer = new EffectComposer(this.renderer, target);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.cloudPass = new CloudPass(this.camera, this.noise, this.quality);
    this.cloudPass.uniforms.uRes.value.set(size.x, size.y);
    this.composer.addPass(this.cloudPass);
    this.composer.addPass(new BoltPass(this.boltScene, this.camera));
    if (this.quality.bloom) this.addBloom();
    this.composer.addPass(new OutputPass());
  }

  async addBloom() {
    const { UnrealBloomPass } = await import('three/examples/jsm/postprocessing/UnrealBloomPass.js');
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.75, 0.6, 0.55);
    this.composer.insertPass(this.bloom, this.composer.passes.length - 1);
  }

  // p – прогрес скролу першого екрана від 0 до 1
  setProgress(p) {
    if (this.reduced) return;
    this.target.storm = 0.3 + 0.7 * smooth(0, 0.45, p);
    this.target.form = smooth(0.1, 0.5, p);
    this.target.burst = smooth(0.68, 0.98, p);
  }

  strike({ from, to, width = 0.16, branches = 4, power = 0.7, life = 0.55 } = {}) {
    const z = rand(-9, -3);
    const start = from || new THREE.Vector3(rand(-0.4, 0.4) * this.viewW, rand(4.5, 6), z);
    const end = to || new THREE.Vector3(start.x + rand(-2.5, 2.5), rand(-1.2, 0.2), z);
    const material = new THREE.ShaderMaterial({
      vertexShader: boltVertex,
      fragmentShader: boltFragment,
      uniforms: { uAlpha: { value: 1 }, uReveal: { value: 0 }, uCloudTop: { value: CLOUD_TOP } },
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const mesh = new THREE.Mesh(createBoltGeometry(start, end, { width, branches }), material);
    mesh.frustumCulled = false;
    this.boltScene.add(mesh);
    this.bolts.push({ mesh, age: 0, life, power, seed: Math.random() * 10, end: end.clone() });
    this.flashPos.copy(end);
  }

  bigStrike() {
    const to = this.logo.tip.clone().multiplyScalar(this.logoWidth).add(this.logoRoot.position);
    const from = new THREE.Vector3(to.x + rand(-1.5, 1.5), 7, to.z + 0.2);
    this.strike({ from, to, width: 0.3, branches: 8, power: 1.3, life: 0.9 });
    this.hit = 1;
  }

  updateBolts(dt) {
    let flash = 0;
    let pos = null;
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const b = this.bolts[i];
      b.age += dt;
      const t = b.age / b.life;
      if (t >= 1) {
        this.boltScene.remove(b.mesh);
        b.mesh.geometry.dispose();
        b.mesh.material.dispose();
        this.bolts.splice(i, 1);
        continue;
      }
      const u = b.mesh.material.uniforms;
      u.uReveal.value = Math.min(1, b.age / 0.08);
      // Кілька повторних спалахів у затухаючому каналі, як у справжньої блискавки
      const flicker = 0.85 + 0.15 * Math.sin(b.age * 30 + b.seed);
      u.uAlpha.value = Math.pow(1 - t, 1.6) * flicker;
      const f = u.uAlpha.value * b.power;
      if (f > flash) {
        flash = f;
        pos = b.end;
      }
    }
    if (pos) this.flashPos.lerp(pos, 0.5);
    return flash;
  }

  update() {
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    const time = now / 1000;

    for (const k of ['form', 'burst', 'storm']) this.cur[k] += (this.target[k] - this.cur[k]) * Math.min(1, dt * 4.5);
    const { form, burst, storm } = this.cur;

    if (!this.reduced) {
      this.nextStrike -= dt;
      // Поки логотип зібраний, випадкові розряди не б'ють, щоб не перетинати його
      const formed = form > 0.85 && burst < 0.5;
      if (this.nextStrike <= 0) {
        if (!formed) this.strike({ power: rand(0.5, 0.9) });
        this.nextStrike = Math.max(0.7, rand(1.4, 4.5) / (0.4 + storm * 1.8));
      }
      if (form > 0.94 && !this.bigStrikeDone) {
        this.bigStrikeDone = true;
        this.bigStrike();
      } else if (form < 0.5) {
        this.bigStrikeDone = false;
      }
    }

    this.hit = Math.max(0, this.hit - dt * 0.6);
    this.flash = Math.max(this.flash * Math.exp(-dt * 7), this.updateBolts(dt));

    // Камера: занурення в хмари зі скролом, легкий паралакс за курсором
    this.pointerSmooth.lerp(this.pointer, Math.min(1, dt * 3));
    const dive = smooth(0, 1, form);
    this.camera.position.lerpVectors(CAM_START, CAM_DIVE, dive);
    this.camera.position.x += this.pointerSmooth.x * 0.7;
    this.camera.position.y += this.pointerSmooth.y * 0.35;
    this.camera.lookAt(this.look.lerpVectors(LOOK_START, LOOK_DIVE, dive));

    // Логотип: піднімається з хмар, після удару відходить угору як емблема
    const rise = smooth(0, 1, form);
    this.logoRoot.visible = rise > 0.03;
    let y = THREE.MathUtils.lerp(LOGO_HIDDEN_Y, LOGO_Y, rise);
    let scale = this.logoWidth;
    y = THREE.MathUtils.lerp(y, LOGO_CROWN_Y, burst);
    scale = THREE.MathUtils.lerp(scale, this.logoWidth * 0.42, burst);
    this.logoRoot.position.set(0, y, THREE.MathUtils.lerp(0, -2, burst));
    this.logo.group.scale.setScalar(scale);
    this.logoRoot.rotation.x = THREE.MathUtils.lerp(-0.55, 0, rise) + this.pointerSmooth.y * -0.06;
    this.logoRoot.rotation.y = this.pointerSmooth.x * 0.12 + Math.sin(time * 0.5) * 0.03;

    // Сяйво логотипа: після удару спалахує і повільно гасне
    const glow = 1 + this.hit * 2.5 + this.flash * 0.6;
    this.materials.bolt.emissiveIntensity = 0.55 * glow;
    this.materials.text.emissiveIntensity = 0.22 * (1 + this.hit * 4);

    this.flashLight.position.copy(this.flashPos);
    this.flashLight.intensity = this.flash * 400;

    const u = this.cloudPass.uniforms;
    u.uTime.value = time;
    u.uStorm.value = storm;
    u.uFlash.value = this.flash;
    u.uFlashPos.value.copy(this.flashPos);
    u.uClear.value = rise * (1 - burst * 0.5);
    u.uClearPos.value.set(0, y - 0.6, 0);

    this.trackFps(dt);
  }

  // Якщо пристрій не тягне – знижуємо роздільність, потім кількість кроків у хмарах
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
    } else if (this.quality.steps > 16) {
      this.quality.steps = 16;
      this.quality.lightSteps = 1;
      this.cloudPass.material.defines.STEPS = 16;
      this.cloudPass.material.defines.LIGHT_STEPS = 1;
      this.cloudPass.material.needsUpdate = true;
      if (this.bloom) {
        this.composer.removePass(this.bloom);
        this.bloom = null;
      }
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
