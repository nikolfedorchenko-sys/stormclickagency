import * as THREE from 'three';
import {
  skyVertex, skyFragment,
  plateVertex, plateFragment,
  particleVertex, particleFragment,
  boltVertex, boltFragment,
} from './shaders.js';
import { createBoltGeometry } from './bolt.js';
import { sampleLogo } from './logo.js';

const PARTICLES = { high: 42000, mid: 24000, low: 12000 };
const OCTAVES = { high: 5, mid: 4, low: 3 };
const LOGO_SHARE = 0.78;

const smooth = (a, b, x) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};
const rand = (a, b) => a + Math.random() * (b - a);

export class Storm {
  constructor(canvas, { tier = 'high', reducedMotion = false } = {}) {
    this.canvas = canvas;
    this.tier = tier;
    this.reduced = reducedMotion;
    this.count = PARTICLES[tier];

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x000000, 1);
    this.dpr = Math.min(window.devicePixelRatio || 1, tier === 'high' ? 1.75 : 1.5);
    this.renderer.setPixelRatio(this.dpr);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    this.camera.position.set(0, 0, 14);

    this.pointer = new THREE.Vector2();
    this.pointerSmooth = new THREE.Vector2();
    this.pointerActive = 0;
    this.raycaster = new THREE.Raycaster();
    this.plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    this.hit = new THREE.Vector3();

    // target – куди веде скрол, cur – згладжене значення, яке бачить шейдер
    this.target = { form: 0, burst: 0, storm: 0.35 };
    this.cur = { ...this.target };

    this.spin = 0;
    this.flash = 0;
    this.shock = 1;
    this.bolts = [];
    this.nextStrike = 1.5;
    this.bigStrikeDone = false;
    this.visible = true;
    this.frames = 0;
    this.fpsTime = 0;
    this.lastTime = performance.now();
  }

  async init() {
    await document.fonts.load('700 100px Unbounded');
    this.buildSky();
    this.buildParticles();
    this.resize();
    if (this.tier === 'high') await this.setupBloom();

    window.addEventListener('resize', () => this.resize());
    window.addEventListener('pointermove', (e) => {
      this.pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
      this.pointerActive = 1;
    });
    document.addEventListener('pointerleave', () => { this.pointerActive = 0; });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) this.lastTime = performance.now();
    });
  }

  buildSky() {
    this.skyUniforms = {
      uTime: { value: 0 },
      uStorm: { value: this.cur.storm },
      uFlash: { value: 0 },
      uFlashPos: { value: new THREE.Vector2(0, 0.4) },
      uRes: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: this.pointerSmooth },
    };
    const sky = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        vertexShader: skyVertex,
        fragmentShader: skyFragment,
        uniforms: this.skyUniforms,
        defines: { OCTAVES: OCTAVES[this.tier] },
        depthTest: false,
        depthWrite: false,
      }),
    );
    sky.frustumCulled = false;
    sky.renderOrder = -1;
    this.scene.add(sky);
  }

  buildParticles() {
    const n = this.count;
    const storm = new Float32Array(n * 3);
    const random = new Float32Array(n * 4);
    this.isLogo = new Uint8Array(n);

    for (let i = 0; i < n; i++) {
      // Спіральні рукави, як у супутникового знімка циклону
      const r = 0.25 + Math.pow(Math.random(), 0.7) * 5.2;
      const arm = Math.floor(Math.random() * 3);
      const spread = (Math.random() - 0.5) * (0.5 + 0.25 * r) * Math.random();
      storm[i * 3] = r;
      storm[i * 3 + 1] = arm * ((Math.PI * 2) / 3) + Math.log(r + 1) * 2.4 + spread;
      storm[i * 3 + 2] = (Math.random() + Math.random() - 1) * 1.6;
      for (let k = 0; k < 4; k++) random[i * 4 + k] = Math.random();
      this.isLogo[i] = Math.random() < LOGO_SHARE ? 1 : 0;
    }
    this.logoCount = this.isLogo.reduce((a, b) => a + b, 0);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    geo.setAttribute('aStorm', new THREE.BufferAttribute(storm, 3));
    geo.setAttribute('aRandom', new THREE.BufferAttribute(random, 4));
    geo.setAttribute('aLogo', new THREE.BufferAttribute(new Float32Array(n * 4), 4));
    this.particleGeo = geo;

    this.particleUniforms = {
      uTime: { value: 0 },
      uSpin: { value: 0 },
      uForm: { value: this.cur.form },
      uBurst: { value: 0 },
      uFlash: { value: 0 },
      uShock: { value: 1 },
      uStormScale: { value: 1 },
      uStormCenter: { value: new THREE.Vector3(0, 0.6, -1) },
      uSize: { value: this.tier === 'high' ? 2.4 : 3 },
      uLogoSize: { value: 2 },
      uPixelRatio: { value: this.dpr },
      uMouse: { value: new THREE.Vector3(99, 99, 0) },
    };
    const points = new THREE.Points(geo, new THREE.ShaderMaterial({
      vertexShader: particleVertex,
      fragmentShader: particleFragment,
      uniforms: this.particleUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }));
    points.frustumCulled = false;
    this.points = points;
    this.scene.add(points);
  }

  // Розміщує точки логотипа під поточний розмір екрана
  layoutLogo() {
    const aspect = this.width / this.height;
    const layout = aspect > 0.9 ? 'row' : 'column';
    if (layout !== this.logoLayout) {
      this.logoLayout = layout;
      this.logo = sampleLogo(layout, this.logoCount);
      this.buildLogoPlate();
    }
    const { points, icon, spacing, height } = this.logo;
    const count = points.length / 3;
    const logoW = layout === 'row' ? Math.min(this.viewW * 0.74, 11.5) : this.viewW * 0.78;
    const offsetY = layout === 'row' ? 0.35 : 0.9;
    const gap = spacing * logoW;

    const attr = this.particleGeo.attributes.aLogo;
    const arr = attr.array;
    let k = 0;
    for (let i = 0; i < this.count; i++) {
      if (this.isLogo[i]) {
        // Кожна частинка займає свою точку сітки; зайві – в проміжки між точками
        const j = (k % count) * 3;
        const extra = k >= count ? 0.5 : 0;
        arr[i * 4] = points[j] * logoW + extra * gap;
        arr[i * 4 + 1] = points[j + 1] * logoW + offsetY + extra * gap * 0.5;
        arr[i * 4 + 2] = 0;
        arr[i * 4 + 3] = 1 + points[j + 2];
        k++;
      } else {
        // Пил позаду логотипа – дає глибину, але не перекриває літери
        arr[i * 4] = (Math.random() - 0.5) * this.viewW * 1.4;
        arr[i * 4 + 1] = (Math.random() - 0.5) * this.viewH * 1.3;
        arr[i * 4 + 2] = rand(-9, -1.5);
        arr[i * 4 + 3] = 0;
      }
    }
    attr.needsUpdate = true;
    this.iconWorld = new THREE.Vector3(icon.x * logoW, icon.y * logoW + offsetY, 0);

    // Розмір частинки логотипа під крок сітки, щоб літери були суцільними
    const formedZ = 12.8;
    const pxPerUnit = this.height / (2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * formedZ);
    this.particleUniforms.uLogoSize.value = 1.9 * gap * pxPerUnit * (formedZ / 12);

    this.plate.scale.set(logoW, logoW * height, 1);
    this.plate.position.set(0, offsetY, -0.02);
  }

  // Світна підкладка у формі логотипа під частинками
  buildLogoPlate() {
    const { canvas } = this.logo;
    const glow = document.createElement('canvas');
    glow.width = canvas.width / 4;
    glow.height = canvas.height / 4;
    const g = glow.getContext('2d');
    g.filter = 'blur(6px)';
    g.drawImage(canvas, 0, 0, glow.width, glow.height);

    if (!this.plate) {
      this.plateUniforms = {
        uMap: { value: null },
        uGlow: { value: null },
        uOpacity: { value: 0 },
        uFlash: { value: 0 },
      };
      this.plate = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.ShaderMaterial({
          vertexShader: plateVertex,
          fragmentShader: plateFragment,
          uniforms: this.plateUniforms,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      this.plate.frustumCulled = false;
      this.scene.add(this.plate);
    }
    this.plateUniforms.uMap.value?.dispose();
    this.plateUniforms.uGlow.value?.dispose();
    this.plateUniforms.uMap.value = new THREE.CanvasTexture(canvas);
    this.plateUniforms.uGlow.value = new THREE.CanvasTexture(glow);
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.renderer.setSize(this.width, this.height, false);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.viewH = 2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * this.camera.position.z;
    this.viewW = this.viewH * this.camera.aspect;
    this.skyUniforms.uRes.value.set(this.width, this.height);
    this.particleUniforms.uStormScale.value = Math.min(1.25, Math.max(0.55, this.viewW / 15));
    // На широких екранах шторм зміщений праворуч, щоб не перекривати заголовок
    const center = this.particleUniforms.uStormCenter.value;
    center.x = this.camera.aspect > 1.2 ? this.viewW * 0.17 : 0;
    center.y = this.camera.aspect > 0.9 ? 0.6 : 1.4;
    this.layoutLogo();
    this.composer?.setSize(this.width, this.height);
  }

  async setupBloom() {
    const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }] = await Promise.all([
      import('three/examples/jsm/postprocessing/EffectComposer.js'),
      import('three/examples/jsm/postprocessing/RenderPass.js'),
      import('three/examples/jsm/postprocessing/UnrealBloomPass.js'),
      import('three/examples/jsm/postprocessing/OutputPass.js'),
    ]);
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.85, 0.55, 0.12);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
  }

  // p – прогрес скролу першого екрана від 0 до 1
  setProgress(p) {
    if (this.reduced) return;
    this.target.storm = 0.35 + 0.65 * smooth(0, 0.45, p);
    this.target.form = smooth(0.1, 0.46, p);
    this.target.burst = smooth(0.68, 0.98, p);
  }

  strike({ from, to, width = 0.14, branches = 4, power = 0.7, life = 0.55 } = {}) {
    const top = this.viewH / 2 + 1;
    const start = from || new THREE.Vector3(rand(-0.45, 0.45) * this.viewW, top, rand(-4, -2));
    const end = to || new THREE.Vector3(start.x + rand(-3, 3), rand(-this.viewH * 0.35, this.viewH * 0.1), start.z);
    const material = new THREE.ShaderMaterial({
      vertexShader: boltVertex,
      fragmentShader: boltFragment,
      uniforms: { uAlpha: { value: 1 }, uReveal: { value: 0 } },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    const mesh = new THREE.Mesh(createBoltGeometry(start, end, { width, branches }), material);
    mesh.frustumCulled = false;
    this.scene.add(mesh);
    this.bolts.push({ mesh, age: 0, life, power, seed: Math.random() * 10 });

    const s = start.clone().project(this.camera);
    this.skyUniforms.uFlashPos.value.set(s.x * 0.5 * this.camera.aspect, Math.min(s.y, 1) * 0.5);
  }

  bigStrike() {
    const to = this.iconWorld.clone();
    const from = new THREE.Vector3(to.x + rand(-1, 1), this.viewH / 2 + 2, 0);
    this.strike({ from, to, width: 0.26, branches: 7, power: 1.15, life: 0.8 });
    this.shock = 0;
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
      u.uReveal.value = Math.min(1, b.age / 0.07);
      // Кілька повторних спалахів у затухаючому каналі, як у справжньої блискавки
      const flicker = 0.65 + 0.35 * Math.sin(b.age * 55 + b.seed);
      u.uAlpha.value = Math.pow(1 - t, 1.6) * flicker;
      flash = Math.max(flash, u.uAlpha.value * b.power);
    }
    return flash;
  }

  update() {
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    const time = now / 1000;

    for (const k of ['form', 'burst', 'storm']) this.cur[k] += (this.target[k] - this.cur[k]) * Math.min(1, dt * 5);
    const { form, burst, storm } = this.cur;

    if (!this.reduced) {
      this.nextStrike -= dt;
      const formed = form > 0.85 && burst < 0.1;
      if (this.nextStrike <= 0) {
        if (!formed) this.strike();
        this.nextStrike = Math.max(0.9, rand(1.2, 4) / (0.4 + storm * 1.6));
      }
      if (form > 0.93 && !this.bigStrikeDone) {
        this.bigStrikeDone = true;
        this.bigStrike();
      } else if (form < 0.5) {
        this.bigStrikeDone = false;
      }
    }

    this.spin += dt * (this.reduced ? 0.04 : 0.12 + storm * 0.35) * (1 - form * 0.7);
    this.shock = Math.min(1, this.shock + dt * 0.9);
    this.flash = Math.max(this.flash * Math.exp(-dt * 7), this.updateBolts(dt));

    this.pointerSmooth.lerp(this.pointer, Math.min(1, dt * 4));
    this.raycaster.setFromCamera(this.pointerSmooth, this.camera);
    if (this.raycaster.ray.intersectPlane(this.plane, this.hit)) {
      const m = this.particleUniforms.uMouse.value;
      m.set(this.hit.x, this.hit.y, m.z + (this.pointerActive * (this.reduced ? 0 : 1) - m.z) * dt * 3);
    }

    // Камера злегка йде за курсором – об'єм і паралакс
    this.camera.position.x = this.pointerSmooth.x * 0.9;
    this.camera.position.y = this.pointerSmooth.y * 0.6;
    this.camera.position.z = 14 - form * 1.2 + burst * 2;
    this.camera.lookAt(0, 0.3, 0);

    const pu = this.particleUniforms;
    pu.uTime.value = time;
    pu.uSpin.value = this.spin;
    pu.uForm.value = form;
    pu.uBurst.value = burst;
    pu.uFlash.value = this.flash;
    pu.uShock.value = this.shock;

    // Підкладка проявляється, коли частинки вже майже на місцях
    this.plateUniforms.uOpacity.value = Math.pow(Math.max(0, (form - 0.75) / 0.25), 2) * (1 - burst);
    this.plateUniforms.uFlash.value = this.flash;

    const su = this.skyUniforms;
    su.uTime.value = time;
    su.uStorm.value = storm;
    su.uFlash.value = this.flash;

    this.trackFps(dt);
  }

  // Якщо пристрій не тягне – знижуємо роздільність, потім вимикаємо bloom
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
      this.particleUniforms.uPixelRatio.value = 1;
      this.resize();
    } else if (this.composer) {
      this.composer = null;
    } else {
      this.fpsChecked = true;
    }
  }

  render() {
    if (this.composer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
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
