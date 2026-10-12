// Тимчасовий логотип: блискавка + словесний знак. Коли буде фінальний логотип,
// достатньо замінити BOLT_PATH і напис.
export const BOLT_PATH = 'M58 0 L12 78 L44 78 L30 140 L90 52 L57 52 L76 0 Z';
const BOLT_W = 100;
const BOLT_H = 140;

/**
 * Малює логотип на прихованому canvas і повертає координати непрозорих пікселів,
 * нормалізовані до ширини 1 (x від -0.5 до 0.5), та центр іконки-блискавки.
 * layout: 'row' – іконка ліворуч від напису, 'column' – іконка над написом.
 */
export function sampleLogo(layout) {
  const W = 1400;
  const H = layout === 'row' ? 300 : 1000;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#fff';

  const text = 'STORMCLICK';
  let fontSize = layout === 'row' ? 150 : 190;
  ctx.font = `700 ${fontSize}px Unbounded, sans-serif`;
  let textW = ctx.measureText(text).width;

  let iconH;
  let iconX;
  let iconY;
  let textX;
  let textY;
  if (layout === 'row') {
    iconH = fontSize * 1.35;
    const iconW = (iconH * BOLT_W) / BOLT_H;
    const gap = fontSize * 0.35;
    const total = iconW + gap + textW;
    const scale = Math.min(1, (W * 0.96) / total);
    fontSize *= scale;
    ctx.font = `700 ${fontSize}px Unbounded, sans-serif`;
    textW = ctx.measureText(text).width;
    iconH *= scale;
    const iw = (iconH * BOLT_W) / BOLT_H;
    const start = (W - (iw + gap * scale + textW)) / 2;
    iconX = start;
    iconY = (H - iconH) / 2;
    textX = start + iw + gap * scale;
    textY = H / 2;
  } else {
    const scale = Math.min(1, (W * 0.96) / textW);
    fontSize *= scale;
    ctx.font = `700 ${fontSize}px Unbounded, sans-serif`;
    textW = ctx.measureText(text).width;
    iconH = H * 0.5;
    const iw = (iconH * BOLT_W) / BOLT_H;
    iconX = (W - iw) / 2;
    iconY = H * 0.08;
    textX = (W - textW) / 2;
    textY = H * 0.8;
  }

  ctx.save();
  ctx.translate(iconX, iconY);
  ctx.scale(iconH / BOLT_H, iconH / BOLT_H);
  ctx.fill(new Path2D(BOLT_PATH));
  ctx.restore();

  ctx.textBaseline = 'middle';
  ctx.fillText(text, textX, textY);

  const data = ctx.getImageData(0, 0, W, H).data;
  const step = layout === 'row' ? 3 : 4;
  const pts = [];
  for (let y = 0; y < H; y += step) {
    for (let x = 0; x < W; x += step) {
      if (data[(y * W + x) * 4 + 3] > 128) pts.push((x / W) - 0.5, -((y / H) - 0.5) * (H / W));
    }
  }

  const iw = (iconH * BOLT_W) / BOLT_H;
  return {
    points: new Float32Array(pts),
    height: H / W,
    icon: { x: (iconX + iw / 2) / W - 0.5, y: -((iconY + iconH / 2) / H - 0.5) * (H / W) },
  };
}
