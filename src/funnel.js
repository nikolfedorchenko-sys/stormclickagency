// Воронка: відвідувачі-частинки течуть згори вниз, звужуються і стають заявками.
// Канвас 2D, легкий, запускається лише коли блок у кадрі.
export function initFunnel(canvas, { reducedMotion }) {
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0;
  let h = 0;
  let running = false;
  let raf = 0;
  const particles = [];
  const N = 140;

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    w = r.width;
    h = r.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const spawn = (p = {}) => {
    p.t = Math.random() * -0.3;
    p.x = Math.random();
    p.speed = 0.0025 + Math.random() * 0.0035;
    p.lead = Math.random() < 0.08;
    p.size = 1.2 + Math.random() * 1.6;
    return p;
  };
  // На старті воронка вже заповнена, а не чекає, поки частинки дійдуть
  for (let i = 0; i < N; i++) particles.push(Object.assign(spawn({}), { t: Math.random() }));

  // Ширина воронки на висоті t (0 зверху, 1 знизу)
  const width = (t) => 1 - 0.78 * (t < 0.55 ? Math.pow(t / 0.55, 1.5) : 1);

  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    // Стінки воронки
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const x = w / 2 - width(t) * w * 0.45;
      i ? ctx.lineTo(x, t * h) : ctx.moveTo(x, t * h);
    }
    for (let i = 40; i >= 0; i--) {
      const t = i / 40;
      ctx.lineTo(w / 2 + width(t) * w * 0.45, t * h);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(120, 130, 255, 0.04)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(160, 170, 255, 0.16)';
    ctx.lineWidth = 1;
    ctx.stroke();

    for (const p of particles) {
      if (!reducedMotion) p.t += p.speed;
      if (p.t > 1.05) spawn(p);
      if (p.t < 0) continue;
      const half = width(p.t) * w * 0.45;
      const x = w / 2 + (p.x - 0.5) * 2 * half * 0.92;
      const y = p.t * h;
      const bottom = p.t > 0.6;
      const alpha = bottom ? (p.lead ? 1 : 0.25) : 0.7;
      ctx.beginPath();
      ctx.arc(x, y, bottom && p.lead ? p.size * 1.6 : p.size, 0, Math.PI * 2);
      ctx.fillStyle = bottom && p.lead ? `rgba(220, 226, 255, ${alpha})` : `rgba(150, 160, 255, ${alpha})`;
      ctx.fill();
    }
    if (running && !reducedMotion) raf = requestAnimationFrame(draw);
  };

  const io = new IntersectionObserver(([e]) => {
    running = e.isIntersecting;
    if (running) { resize(); cancelAnimationFrame(raf); draw(); } else cancelAnimationFrame(raf);
  }, { threshold: 0.1 });
  io.observe(canvas);
  window.addEventListener('resize', () => { if (running) resize(); });
}
