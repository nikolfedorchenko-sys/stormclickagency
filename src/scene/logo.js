// Тимчасовий логотип: блискавка + словесний знак. Коли буде фінальний логотип,
// достатньо замінити BOLT_PATH і напис.
export const BOLT_PATH = 'M58 0 L12 78 L44 78 L30 140 L90 52 L57 52 L76 0 Z';
const BOLT_W = 100;
const BOLT_H = 140;
const TEXT = 'STORMCLICK';

function draw(ctx, layout, W, H) {
  let fontSize = layout === 'row' ? 150 : 190;
  ctx.font = `700 ${fontSize}px Unbounded, sans-serif`;
  let textW = ctx.measureText(TEXT).width;
  let iconH;
  let iconX;
  let iconY;
  let textX;
  let textY;

  if (layout === 'row') {
    iconH = fontSize * 1.35;
    const gap = fontSize * 0.35;
    const scale = Math.min(1, (W * 0.94) / ((iconH * BOLT_W) / BOLT_H + gap + textW));
    fontSize *= scale;
    ctx.font = `700 ${fontSize}px Unbounded, sans-serif`;
    textW = ctx.measureText(TEXT).width;
    iconH *= scale;
    const iw = (iconH * BOLT_W) / BOLT_H;
    const start = (W - (iw + gap * scale + textW)) / 2;
    iconX = start;
    iconY = (H - iconH) / 2;
    textX = start + iw + gap * scale;
    textY = H / 2;
  } else {
    fontSize *= Math.min(1, (W * 0.94) / textW);
    ctx.font = `700 ${fontSize}px Unbounded, sans-serif`;
    textW = ctx.measureText(TEXT).width;
    iconH = H * 0.5;
    iconX = (W - (iconH * BOLT_W) / BOLT_H) / 2;
    iconY = H * 0.08;
    textX = (W - textW) / 2;
    textY = H * 0.8;
  }

  ctx.fillStyle = '#fff';
  ctx.save();
  ctx.translate(iconX, iconY);
  ctx.scale(iconH / BOLT_H, iconH / BOLT_H);
  ctx.fill(new Path2D(BOLT_PATH));
  ctx.restore();
  ctx.textBaseline = 'middle';
  ctx.fillText(TEXT, textX, textY);

  const iw = (iconH * BOLT_W) / BOLT_H;
  return { x: iconX + iw / 2, y: iconY + iconH / 2 };
}

/**
 * Малює логотип на прихованому canvas і розкладає його на рівномірну сітку точок,
 * щоб кожна частинка отримала власне місце (без згустків і дірок).
 * layout: 'row' – іконка ліворуч від напису, 'column' – іконка над написом.
 * target – скільки частинок піде в логотип; крок сітки підбирається під це число.
 * Повертає точки (x, y, edge) у координатах ширини 1, canvas для підкладки і центр іконки.
 */
export function sampleLogo(layout, target) {
  const W = 1600;
  const H = layout === 'row' ? 340 : 1140;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const icon = draw(ctx, layout, W, H);

  const alpha = ctx.getImageData(0, 0, W, H).data;
  const solid = (x, y) => x >= 0 && y >= 0 && x < W && y < H && alpha[(Math.round(y) * W + Math.round(x)) * 4 + 3] > 127;

  let area = 0;
  for (let i = 3; i < alpha.length; i += 4) if (alpha[i] > 127) area++;
  // Крок такий, щоб точок було трохи менше, ніж частинок: тоді кожна точка зайнята
  const step = Math.max(1.6, Math.sqrt(area / target) * 1.03);

  const pts = [];
  for (let row = 0, y = step / 2; y < H; y += step, row++) {
    // Зсув через рядок дає гексагональну сітку – вона виглядає щільніше за квадратну
    for (let x = step / 2 + (row % 2) * (step / 2); x < W; x += step) {
      if (!solid(x, y)) continue;
      const e = step * 1.2;
      const edge = !solid(x + e, y) || !solid(x - e, y) || !solid(x, y + e) || !solid(x, y - e) ? 1 : 0;
      pts.push(x / W - 0.5, -(y / H - 0.5) * (H / W), edge);
    }
  }

  // Перемішуємо, щоб частинки з різних частин шторму летіли в різні місця логотипа
  const n = pts.length / 3;
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    for (let k = 0; k < 3; k++) [pts[i * 3 + k], pts[j * 3 + k]] = [pts[j * 3 + k], pts[i * 3 + k]];
  }

  return {
    points: new Float32Array(pts),
    spacing: step / W,
    height: H / W,
    canvas,
    icon: { x: icon.x / W - 0.5, y: -(icon.y / H - 0.5) * (H / W) },
  };
}
