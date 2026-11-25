// Geologica з віссю SHRP (гострі кути): саме shrp.css – у index.css/wght.css осі SHRP немає. Родина 'Geologica Variable'.
import '@fontsource-variable/geologica/shrp.css';
import 'lenis/dist/lenis.css';
import './styles/tokens.css';
import './styles/main.css';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { CONFIG } from './config.js';
import { initI18n, onLangChange } from './i18n.js';
import { initStorm } from './storm.js';
import { initSky } from './sky.js';
import { initPainPulse } from './painPulse.js';
import { initFlow } from './flow.js';
import { initFactsLive } from './factsLive.js';
import { initCasesLive } from './casesLive.js';
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
  // Те саме, поки на екрані форма квізу: липка кнопка (до 720 px) веде сюди ж і перекривала б «Далі»,
  // а кнопка асистента (до 1600 px) налазить на картку квізу. Стежимо за самою формою, а не за секцією
  // #contact: секція починається текстом і кнопками месенджерів, і на екрані FAQ кнопка дії має лишатися.
  // Спрацьовує не з першого пікселя форми, а коли її верх доходить до плаваючих кнопок: кнопка асистента
  // стоїть на 20 px від низу й має 52 px (верх – 72 px), на телефоні вона над липкою кнопкою (верх – 136 px).
  // Раніше кнопки зникали, щойно в екрані з'являлося 20 px форми, – на 1440 ще на екрані FAQ.
  const quiz = document.getElementById('quiz');
  if (!quiz) return;
  const narrow = matchMedia('(max-width: 720px)');
  let io = null;
  const watch = () => {
    if (io) io.disconnect();
    io = new IntersectionObserver(([e]) => document.body.classList.toggle('in-quiz', e.isIntersecting), { rootMargin: `0px 0px -${narrow.matches ? 140 : 76}px 0px` });
    io.observe(quiz);
  };
  watch();
  narrow.addEventListener('change', watch);
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
  // Якорі груп послуг (рядок під заголовком секції) рендерить services.js, і заново при зміні мови, –
  // тому слухаємо на документі. Відступ під шапку задає scroll-margin-top групи (Lenis його враховує).
  // Фокус переносимо на групу, щоб наступний Tab ішов у її картки, а не назад у рядок якорів.
  document.addEventListener('click', (e) => {
    const a = e.target.closest('.pain-nav a');
    const group = a && document.getElementById(a.getAttribute('href').slice(1));
    if (!group) return;
    e.preventDefault();
    lenis.scrollTo(group);
    group.focus({ preventScroll: true });
  });
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
  // Фон шапки – за умовою «прокручено більше 80 px». ScrollTrigger без end тут не годиться:
  // у самому низу сторінки він стає неактивним, і шапка знову прозора.
  const header = document.querySelector('.header');
  const update = () => header.classList.toggle('is-scrolled', window.scrollY > 80);
  window.addEventListener('scroll', update, { passive: true });
  update();
}

async function boot() {
  initI18n();
  initProof(document.querySelector('.proof'));
  // Сцена шторму стартує сама після load + шрифтів; при зміні мови – перерахунок заборонених зон
  const storm = initStorm(document.getElementById('hero'));
  onLangChange(() => requestAnimationFrame(storm.relayout));
  // Фоновий шторм сторінки: зони рахуються в момент удару, тож при зміні мови нічого перераховувати не треба
  const sky = initSky();
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
    sky.setLenis(lenis);   // зсув удару під час прокрутки – з реальної прокрутки Lenis
    initReveals();
    initTilt();
  }
  initHeader();
  document.addEventListener('services:rendered', () => { initTilt(); ScrollTrigger.refresh(); });
  initTilt();
  initFunnel(document.querySelector('.funnel'), { reducedMotion });
  initChart(document.querySelector('.chart'));
  initPainPulse();       // до initServices: картки рендеряться там і повідомляють подією services:rendered
  initServices();
  initFlow(document.querySelector('[data-flow]'));
  initFactsLive(document.getElementById('facts'));
  initCasesLive();
  initQuiz(document.getElementById('quiz'));

  ScrollTrigger.refresh();
}

boot();
