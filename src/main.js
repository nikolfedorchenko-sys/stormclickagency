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
import { initFunnel } from './funnel.js';
import { initChart } from './chart.js';
import { initQuiz } from './quiz.js';

gsap.registerPlugin(ScrollTrigger);

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = () => innerWidth < 720;

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
  document.querySelectorAll('[data-link=email]').forEach((a) => { a.href = `mailto:${CONFIG.email}`; a.textContent = CONFIG.email; });
  document.getElementById('year').textContent = new Date().getFullYear();
}

function initMenu() {
  const nav = document.getElementById('nav');
  const toggle = document.querySelector('.nav-toggle');
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => nav.classList.remove('open')));
}

async function initScene(preloader) {
  const canvas = document.getElementById('scene');
  try {
    const { Storm } = await preloader.track(import('./scene/Storm.js'), 0.3);
    const storm = new Storm(canvas, { tier: detectTier(), reducedMotion });
    await preloader.track(storm.init(), 0.35);
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

function initSmoothScroll() {
  const lenis = new Lenis({ lerp: 0.085 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  // Якірні посилання їдуть плавно
  document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const target = a.getAttribute('href');
    if (target.length < 2) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: -60 });
  }));
  return lenis;
}

function initHero(storm) {
  const hero = document.getElementById('hero');
  ScrollTrigger.create({
    trigger: hero,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => storm?.setProgress(self.progress),
  });

  // Тексти етапів синхронізовані зі сценою: 0.45–0.65 удар, 0.75+ напис і послуги
  gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom bottom', scrub: 0.6 } })
    .to('.hero-scroll', { autoAlpha: 0, duration: 0.04 }, 0.01)
    .to('.stage-1', { autoAlpha: 0, y: -60, duration: 0.12, ease: 'power1.in' }, 0.05)
    .fromTo('.stage-2', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.08 }, 0.5)
    .to('.stage-2', { autoAlpha: 0, y: -40, duration: 0.08 }, 0.66)
    .fromTo('.stage-3', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.1 }, 0.84)
    .set({}, {}, 1);

  // Сцена не рендериться, коли перший екран далеко позаду
  ScrollTrigger.create({
    trigger: hero,
    start: 'top bottom',
    end: 'bottom+=60% top',
    onToggle: (self) => {
      if (storm) storm.visible = self.isActive;
      document.getElementById('scene').classList.toggle('is-off', !self.isActive);
      // Закріплена кнопка на телефоні з'являється лише після першого екрана
      document.body.classList.toggle('in-hero', self.isActive);
    },
  });
}

function initServices() {
  const section = document.querySelector('.services');
  const track = document.querySelector('.services-track');
  const pin = document.querySelector('.services-pin');
  if (isMobile()) return; // На телефоні картки йдуть стовпчиком
  const distance = () => track.scrollWidth - innerWidth + parseFloat(getComputedStyle(track).paddingLeft) * 2;
  gsap.to(track, {
    x: () => -distance(),
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: () => `+=${distance()}`,
      pin,
      scrub: 0.8,
      invalidateOnRefresh: true,
      anticipatePin: 1,
    },
  });
  gsap.to('.services-hint', { autoAlpha: 0, scrollTrigger: { trigger: section, start: 'top+=200 top', end: '+=200', scrub: true } });
}

function initReveals() {
  document.querySelectorAll('.reveal').forEach((el) => {
    gsap.fromTo(el, { autoAlpha: 0, y: 36 }, {
      autoAlpha: 1, y: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });
  // Лічильники
  document.querySelectorAll('[data-count]').forEach((el) => {
    const target = Number(el.dataset.count);
    const obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 85%', once: true,
      onEnter: () => gsap.to(obj, { v: target, duration: 1.8, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(obj.v).toLocaleString('uk-UA'); } }),
    });
  });
}

// 3D-нахил карток за курсором
function initTilt() {
  if (!matchMedia('(pointer: fine)').matches) return;
  document.querySelectorAll('[data-tilt]').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty('--rx', `${-y * 7}deg`);
      card.style.setProperty('--ry', `${x * 9}deg`);
      card.style.setProperty('--mx', `${(x + 0.5) * 100}%`);
      card.style.setProperty('--my', `${(y + 0.5) * 100}%`);
    });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  });
}

function initHeader() {
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
  if (storm && !reducedMotion) setTimeout(() => storm.arc(), 600);
}

async function boot() {
  initI18n();
  initLinks();
  initMenu();
  initCursor({ reducedMotion });
  const preloader = new Preloader(document.querySelector('.preloader'));
  preloader.track(document.fonts.ready, 0.2);
  const storm = await initScene(preloader);

  if (reducedMotion) {
    document.documentElement.classList.add('reduced-motion');
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
  } else {
    initSmoothScroll();
    initHero(storm);
    initServices();
    initReveals();
    initTilt();
  }
  document.body.classList.add('in-hero');
  initHeader();
  initFunnel(document.querySelector('.funnel'), { reducedMotion });
  initChart(document.querySelector('.chart'));
  initQuiz(document.getElementById('quiz'));

  storm?.start();
  await preloader.finish();
  intro(storm);
  ScrollTrigger.refresh();
}

boot();
