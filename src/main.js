import '@fontsource/unbounded/500.css';
import '@fontsource/unbounded/700.css';
import '@fontsource-variable/manrope';
import 'lenis/dist/lenis.css';
import './styles/main.css';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { CONFIG } from './config.js';
import { initI18n } from './i18n.js';
import { initCursor } from './cursor.js';
import { Preloader } from './preloader.js';

gsap.registerPlugin(ScrollTrigger);

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function detectTier() {
  const coarse = matchMedia('(pointer: coarse)').matches;
  const small = innerWidth < 768;
  const memory = navigator.deviceMemory || 8;
  const cores = navigator.hardwareConcurrency || 8;
  if (memory <= 2 || cores <= 2) return 'low';
  if (coarse || small || memory <= 4 || cores <= 4) return 'mid';
  return 'high';
}

function initLinks() {
  document.querySelectorAll('[data-link=telegram]').forEach((a) => { a.href = `https://t.me/${CONFIG.telegram}`; });
  document.querySelectorAll('[data-link=whatsapp]').forEach((a) => { a.href = `https://wa.me/${CONFIG.whatsapp}`; });
}

async function initScene(preloader) {
  const canvas = document.getElementById('scene');
  try {
    const { Storm } = await preloader.track(import('./scene/Storm.js'), 0.35);
    const storm = new Storm(canvas, { tier: detectTier(), reducedMotion });
    await storm.init();
    preloader.add(0.3);
    storm.update();
    storm.render();
    preloader.add(0.15);
    return storm;
  } catch (err) {
    console.error(err);
    document.documentElement.classList.add('no-webgl');
    return null;
  }
}

function initScroll(storm) {
  if (reducedMotion) {
    document.documentElement.classList.add('reduced-motion');
    return;
  }

  const lenis = new Lenis({ lerp: 0.085 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  const hero = document.getElementById('hero');
  ScrollTrigger.create({
    trigger: hero,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => storm?.setProgress(self.progress),
  });

  // Тексти етапів синхронізовані з тим, що відбувається у сцені
  gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom bottom', scrub: 0.6 } })
    .to('.hero-scroll', { autoAlpha: 0, duration: 0.04 }, 0.01)
    .to('.stage-1', { autoAlpha: 0, y: -60, duration: 0.12, ease: 'power1.in' }, 0.06)
    .fromTo('.stage-2', { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: 0.08 }, 0.47)
    .to('.stage-2', { autoAlpha: 0, y: -50, duration: 0.08 }, 0.66)
    .fromTo('.stage-3 .stage-title', { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.1 }, 0.8)
    .fromTo('.stage-3 .chip', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.08, stagger: 0.015 }, 0.84)
    .set({}, {}, 1);

  // Сцена не рендериться, коли перший екран прокручено далеко
  ScrollTrigger.create({
    trigger: hero,
    start: 'top bottom',
    end: 'bottom+=100% top',
    onToggle: (self) => { if (storm) storm.visible = self.isActive; },
  });

  ScrollTrigger.create({
    start: 80,
    onToggle: (self) => document.querySelector('.header').classList.toggle('is-scrolled', self.isActive),
  });
}

function intro(storm) {
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .from('.header', { autoAlpha: 0, y: -20, duration: 0.8 }, 0)
    .from('.hero-badge', { autoAlpha: 0, y: 20, duration: 0.8 }, 0.1)
    .from('.hero-title .line > span', { yPercent: 110, duration: 1.1, stagger: 0.1 }, 0.15)
    .from('.hero-subtitle, .hero-actions, .hero-scroll', { autoAlpha: 0, y: 24, duration: 0.9, stagger: 0.08 }, 0.45);
  if (storm && !reducedMotion) setTimeout(() => { storm.arc(); storm.arc(); }, 300);
}

async function boot() {
  initI18n();
  initLinks();
  initCursor({ reducedMotion });
  const preloader = new Preloader(document.querySelector('.preloader'));
  preloader.track(document.fonts.ready, 0.2);
  const storm = await initScene(preloader);
  initScroll(storm);
  storm?.start();
  await preloader.finish();
  intro(storm);
}

boot();
