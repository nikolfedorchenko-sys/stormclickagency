import '@fontsource/unbounded/500.css';
import '@fontsource/unbounded/600.css';
import '@fontsource/unbounded/700.css';
import '@fontsource-variable/manrope';
import 'lenis/dist/lenis.css';
import './styles/tokens.css';
import './styles/main.css';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { CONFIG } from './config.js';
import { initI18n, onLangChange } from './i18n.js';
import { initStorm } from './storm.js';
import { initProof } from './proof.js';
import { initCursor } from './cursor.js';
import { initFunnel } from './funnel.js';
import { initChart } from './chart.js';
import { initQuiz } from './quiz.js';
import { initAssistant } from './assistant.js';
import { initServices } from './services.js';

gsap.registerPlugin(ScrollTrigger);

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = () => innerWidth < 720;

function initLinks() {
  document.querySelectorAll('[data-link=telegram]').forEach((a) => { a.href = `https://t.me/${CONFIG.telegram}`; });
  document.querySelectorAll('[data-link=whatsapp]').forEach((a) => { a.href = `https://wa.me/${CONFIG.whatsapp}`; });
  document.querySelectorAll('[data-link=email]').forEach((a) => { a.href = `mailto:${CONFIG.email}`; a.textContent = CONFIG.email; });
  document.getElementById('year').textContent = new Date().getFullYear();
}

let lenis = null;

// Мобільне меню (<1200): повноекранне, прокрутка сторінки під ним заблокована
function initMenu() {
  const nav = document.getElementById('nav');
  const toggle = document.querySelector('.nav-toggle');
  const set = (open) => {
    if (open === nav.classList.contains('open')) return;
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    document.documentElement.classList.toggle('menu-open', open);
    if (lenis) { if (open) lenis.stop(); else lenis.start(); }
  };
  toggle.addEventListener('click', () => set(!nav.classList.contains('open')));
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => set(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('open')) { set(false); toggle.focus(); } });
  matchMedia('(min-width: 1200px)').addEventListener('change', () => set(false));
}

// Поки видно перший екран, плаваюча кнопка асистента і мобільна липка «Отримати розрахунок» сховані
// (обидві дії вже є в героєві); після прокрутки за перший екран – з'являються.
function initHeroState() {
  const hero = document.getElementById('hero');
  document.body.classList.add('in-hero');
  if (!hero || !('IntersectionObserver' in window)) return;
  new IntersectionObserver(([e]) => document.body.classList.toggle('in-hero', e.isIntersecting)).observe(hero);
}

// Події аналітики: клік по елементу з data-track. Лічильники (GA4 / Meta / TikTok) на сайті ще не
// підключені – ідентифікаторів у config.js немає; події йдуть у dataLayer і підхопляться менеджером тегів.
function initTracking() {
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-track]');
    if (!el) return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: el.dataset.track, lang: document.documentElement.lang });
  });
}

function initSmoothScroll() {
  lenis = new Lenis({ lerp: 0.085 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  // Якірні посилання їдуть плавно
  document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const target = a.getAttribute('href');
    if (target.length < 2) return;
    e.preventDefault();
    // відступ – висота фіксованої шапки (64 / 80), щоб заголовок секції не ховався під нею
    lenis.scrollTo(target, { offset: -document.querySelector('.header').offsetHeight });
  }));
  return lenis;
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
  document.querySelectorAll('[data-tilt]:not([data-tilt-ready])').forEach((card) => {
    card.dataset.tiltReady = '1';
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

async function boot() {
  initI18n();
  initProof(document.querySelector('.proof'));
  // Сцена шторму стартує сама після load + шрифтів; при зміні мови – перерахунок заборонених зон
  const storm = initStorm(document.getElementById('hero'));
  onLangChange(() => requestAnimationFrame(storm.relayout));
  initLinks();
  initMenu();
  initHeroState();
  initTracking();
  // асистент підключається одразу: кнопки першого екрана не мають бути «мертвими», поки вантажаться шрифти
  initAssistant(document.getElementById('assistant'));
  initCursor({ reducedMotion });
  await document.fonts.ready;

  if (reducedMotion) {
    document.documentElement.classList.add('reduced-motion');
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
  } else {
    initSmoothScroll();
    initReveals();
    initTilt();
  }
  initHeader();
  document.addEventListener('services:rendered', () => { initTilt(); ScrollTrigger.refresh(); });
  initTilt();
  initFunnel(document.querySelector('.funnel'), { reducedMotion });
  initChart(document.querySelector('.chart'));
  initServices();
  initQuiz(document.getElementById('quiz'));

  ScrollTrigger.refresh();
}

boot();
