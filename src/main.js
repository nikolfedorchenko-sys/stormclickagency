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
import { initFunnel } from './funnel.js';
import { initChart } from './chart.js';
import { initQuiz } from './quiz.js';
import { initAssistant } from './assistant.js';

gsap.registerPlugin(ScrollTrigger);

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = () => innerWidth < 720;

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

function intro() {
  if (reducedMotion) return;
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .from('.header', { autoAlpha: 0, y: -20, duration: 0.8 }, 0)
    .from('.hero-tag', { autoAlpha: 0, y: 16, duration: 0.7 }, 0.1)
    .from('.hero-title .line > span', { yPercent: 110, duration: 1, stagger: 0.1 }, 0.15)
    .from('.hero-subtitle, .hero-actions', { autoAlpha: 0, y: 20, duration: 0.8, stagger: 0.08 }, 0.4)
    .from('.panel', { autoAlpha: 0, y: 60, duration: 1.1 }, 0.55)
    .from('.pcard', { autoAlpha: 0, y: 24, duration: 0.8, stagger: 0.12 }, 0.8)
    .from('.pmsg', { autoAlpha: 0, y: 10, duration: 0.5, stagger: 0.35 }, 1.1)
    .add(() => document.querySelector('.panel').classList.add('is-live'), 1.2);
  // Панель ледь зміщується за курсором
  if (matchMedia('(pointer: fine)').matches) {
    const panel = document.querySelector('.panel');
    window.addEventListener('pointermove', (e) => {
      const x = (e.clientX / innerWidth - 0.5) * 6;
      const y = (e.clientY / innerHeight - 0.5) * 4;
      gsap.to(panel, { rotateY: x, rotateX: -y, duration: 1.2, ease: 'power2.out' });
    });
  }
}

async function boot() {
  initI18n();
  initLinks();
  initMenu();
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
  document.body.classList.add('in-hero');
  initHeader();
  initFunnel(document.querySelector('.funnel'), { reducedMotion });
  initChart(document.querySelector('.chart'));
  initQuiz(document.getElementById('quiz'));
  initAssistant(document.getElementById('assistant'));

  intro();
  ScrollTrigger.refresh();
}

boot();
