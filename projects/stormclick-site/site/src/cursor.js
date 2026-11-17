// Курсор-іскра: точка, кільце з інерцією і шлейф іскор на рух миші.
export function initCursor({ reducedMotion }) {
  if (!matchMedia('(pointer: fine)').matches) return;
  document.documentElement.classList.add('has-cursor');

  const dot = document.createElement('div');
  dot.className = 'cursor-dot';
  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  const canvas = document.createElement('canvas');
  canvas.className = 'cursor-sparks';
  document.body.append(canvas, ring, dot);
  const ctx = canvas.getContext('2d');

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const resize = () => {
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener('resize', resize);

  const pos = { x: innerWidth / 2, y: innerHeight / 2 };
  const ringPos = { ...pos };
  const sparks = [];
  let last = null;

  window.addEventListener('pointermove', (e) => {
    pos.x = e.clientX;
    pos.y = e.clientY;
    document.documentElement.classList.remove('cursor-hidden');
    if (reducedMotion || !last) { last = { ...pos }; return; }
    const speed = Math.hypot(pos.x - last.x, pos.y - last.y);
    const n = Math.min(3, Math.floor(speed / 12));
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 0.4 + Math.random() * 1.6;
      sparks.push({ x: pos.x, y: pos.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, hue: Math.random() });
    }
    last = { ...pos };
  });
  document.addEventListener('pointerleave', () => document.documentElement.classList.add('cursor-hidden'));

  document.addEventListener('pointerover', (e) => {
    ring.classList.toggle('is-hover', !!e.target.closest('a, button'));
  });

  const loop = () => {
    requestAnimationFrame(loop);
    ringPos.x += (pos.x - ringPos.x) * 0.18;
    ringPos.y += (pos.y - ringPos.y) * 0.18;
    dot.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
    ring.style.transform = `translate(${ringPos.x}px, ${ringPos.y}px)`;

    ctx.clearRect(0, 0, innerWidth, innerHeight);
    if (!sparks.length) return;
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.life -= 0.045;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      const px = s.x;
      const py = s.y;
      s.x += s.vx;
      s.y += s.vy;
      s.vx *= 0.94;
      s.vy *= 0.94;
      ctx.strokeStyle = s.hue > 0.5 ? `rgba(150,170,255,${s.life})` : `rgba(180,140,255,${s.life})`;
      ctx.lineWidth = 1.5 * s.life;
      ctx.beginPath();
      ctx.moveTo(px - s.vx * 3, py - s.vy * 3);
      ctx.lineTo(s.x, s.y);
      ctx.stroke();
    }
  };
  loop();
}
