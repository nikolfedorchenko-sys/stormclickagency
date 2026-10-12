import { gsap } from 'gsap';

// Прелоадер: блискавка «заряджається» відповідно до реального прогресу завантаження.
export class Preloader {
  constructor(root) {
    this.root = root;
    this.fill = root.querySelector('.preloader-fill');
    this.value = root.querySelector('.preloader-value');
    this.target = 0;
    this.shown = 0;
    this.startedAt = performance.now();
    this.tick = this.tick.bind(this);
    requestAnimationFrame(this.tick);
  }

  add(amount) {
    this.target = Math.min(1, this.target + amount);
  }

  track(promise, amount) {
    return promise.finally(() => this.add(amount));
  }

  tick() {
    // Плавно доганяємо реальний прогрес, але не стоїмо на місці
    this.shown += Math.max((this.target - this.shown) * 0.08, this.shown < this.target ? 0.004 : 0);
    this.shown = Math.min(this.shown, this.target);
    const pct = Math.round(this.shown * 100);
    this.fill.setAttribute('y', String(140 - this.shown * 140));
    this.value.textContent = `${pct}%`;
    if (!this.done) requestAnimationFrame(this.tick);
  }

  async finish(minDuration = 1100) {
    this.target = 1;
    await new Promise((resolve) => {
      const wait = () => (this.shown >= 0.999 && performance.now() - this.startedAt >= minDuration
        ? resolve() : requestAnimationFrame(wait));
      wait();
    });
    this.done = true;
    await gsap.timeline()
      .to(this.root.querySelector('.preloader-bolt'), { scale: 1.25, filter: 'brightness(2.5)', duration: 0.25, ease: 'power2.out' })
      .to(this.root, { autoAlpha: 0, duration: 0.6, ease: 'power2.inOut' }, '+=0.05')
      .then();
    this.root.remove();
  }
}
