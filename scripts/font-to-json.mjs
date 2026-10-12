// Конвертує гліфи напису з Unbounded Bold у формат шрифту three.js (typeface JSON).
// Запуск: node scripts/font-to-json.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const opentype = require('opentype.js');

const SRC = 'node_modules/@fontsource/unbounded/files/unbounded-latin-700-normal.woff';
const OUT = 'src/scene/unbounded-bold.json';
const CHARS = 'STORMCLICK';

const font = opentype.parse(readFileSync(SRC).buffer);
const glyphs = {};

for (const ch of new Set(CHARS)) {
  const glyph = font.charToGlyph(ch);
  const parts = [];
  // three.js очікує для кривих спочатку кінцеву точку, потім контрольні
  for (const c of glyph.path.commands) {
    if (c.type === 'M') parts.push('m', c.x, c.y);
    else if (c.type === 'L') parts.push('l', c.x, c.y);
    else if (c.type === 'Q') parts.push('q', c.x, c.y, c.x1, c.y1);
    else if (c.type === 'C') parts.push('b', c.x, c.y, c.x1, c.y1, c.x2, c.y2);
  }
  const box = glyph.getBoundingBox();
  glyphs[ch] = {
    ha: glyph.advanceWidth,
    x_min: box.x1,
    x_max: box.x2,
    o: parts.map((v) => (typeof v === 'number' ? Math.round(v) : v)).join(' '),
  };
}

const json = {
  glyphs,
  familyName: 'Unbounded',
  ascender: font.ascender,
  descender: font.descender,
  underlinePosition: -100,
  underlineThickness: 50,
  boundingBox: { yMin: font.tables.head.yMin, xMin: font.tables.head.xMin, yMax: font.tables.head.yMax, xMax: font.tables.head.xMax },
  resolution: font.unitsPerEm,
  original_font_information: { full_font_name: 'Unbounded Bold' },
  cssFontWeight: 'bold',
  cssFontStyle: 'normal',
};

writeFileSync(OUT, JSON.stringify(json));
console.log(`${OUT}: ${Object.keys(glyphs).length} glyphs`);
