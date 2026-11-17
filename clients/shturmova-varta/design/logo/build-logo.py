# Генератор SVG-логотипів «Штурмова варта». Запуск: python3 build-logo.py <тека-результату> <Onest-SemiBold.ttf>
# Потрібен fontTools (pip install fonttools). Onest 600 TTF – Google Fonts (OFL).
import sys, os
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

OUT = sys.argv[1]
FONT = sys.argv[2]
GRAPHITE = '#16181C'; PAPER = '#F3F1EC'; SIGNAL = '#FF5B1F'; BLACK = '#000000'; WHITE = '#FFFFFF'

# --- custom lettering, cap height 100, stroke 20, y down ---
G = {
 'Ш': (96, ['M0 0H20V80H38V0H58V80H76V0H96V100H0Z']),
 'Т': (76, ['M0 0H76V20H48V100H28V20H0Z']),
 'У': (76, ['M0 0H20V40H56V0H76V100H0V80H56V60H0Z']),
 'Р': (76, ['M0 0H60L76 16V64H20V100H0Z', 'M20 20V44H56V20Z']),
 'М': (92, ['M0 0H22L46 44L70 0H92V100H72V40L54 74H38L20 40V100H0Z']),
 'О': (76, ['M0 0H60L76 16V100H0Z', 'M20 20V80H56V20Z']),
 'В': (76, ['M0 0H58L72 14V40L66 48L76 58V100H0Z', 'M20 18V40H52V18Z', 'M20 58V82H56V58Z']),
 'А': (76, ['M0 0H60L76 16V100H56V64H20V100H0Z', 'M20 20V46H56V20Z']),
}
TRACK = 12; SPACE = 40

def word(text, x0=0, y0=0, s=1.0):
    parts = []; x = x0
    for ch in text:
        if ch == ' ':
            x += SPACE * s; continue
        w, ps = G[ch]
        d = ' '.join(ps)
        parts.append(f'<path transform="translate({x:.2f} {y0:.2f}) scale({s})" d="{d}"/>')
        x += (w + TRACK) * s
    return parts, x - TRACK * s - x0

MARK_BODY = 'M0 0H24V76H38V38H62V76H76V0H86L100 14V100H0Z'
MARK_DOT = (38, 0, 24, 24)

def mark(x, y, s, body, dot):
    r = MARK_DOT
    return [f'<path fill="{body}" transform="translate({x} {y}) scale({s})" d="{MARK_BODY}"/>',
            f'<rect fill="{dot}" x="{x + r[0]*s:.2f}" y="{y + r[1]*s:.2f}" width="{r[2]*s:.2f}" height="{r[3]*s:.2f}"/>']

font = TTFont(FONT); gs = font.getGlyphSet(); cmap = font.getBestCmap(); hmtx = font['hmtx']
CAP = font['OS/2'].sCapHeight

def outline(text, x, y_top, cap_px, target_w=None):
    """Onest text as paths. y_top = top of caps. Tracking fills target_w if given."""
    sc = cap_px / CAP
    adv = [hmtx[cmap[ord(c)]][0] * sc for c in text]
    natural = sum(adv)
    tr = (target_w - natural) / (len(text) - 1) if target_w else 0.08 * cap_px / 0.707
    out = []; cx = x
    for c, a in zip(text, adv):
        pen = SVGPathPen(gs)
        tp = TransformPen(pen, (sc, 0, 0, -sc, cx, y_top + cap_px))
        gs[cmap[ord(c)]].draw(tp)
        out.append(f'<path d="{pen.getCommands()}"/>')
        cx += a + tr
    return out, tr / cap_px

def svg(w, h, body, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} {h:.0f}" width="{w:.0f}" height="{h:.0f}" role="img" aria-label="{title}">'
            f'<title>{title}</title>' + ''.join(body) + '</svg>\n')

def primary(fg, dot):
    m = mark(0, 0, 2.2, fg, dot)
    x = 220 + 44
    l1, w1 = word('ШТУРМОВА', x, 0)
    l2, w2 = word('ВАРТА', x, 120)
    dx = x + w2 + 30
    dw = x + w1 - dx
    d1, t1 = outline('ОХОРОННА', dx, 120, 30, dw)
    d2, t2 = outline('КОМПАНІЯ', dx, 190, 30, dw)
    body = m + [f'<g fill="{fg}">'] + l1 + l2 + d1 + d2 + ['</g>']
    return svg(x + w1, 220, body, 'Штурмова варта – охоронна компанія'), (t1, t2)

def horizontal(fg, dot):
    m = mark(0, 0, 1.0, fg, dot)
    x = 100 + 30
    l, w = word('ШТУРМОВА ВАРТА', x, 0)
    return svg(x + w, 100, m + [f'<g fill="{fg}">'] + l + ['</g>'], 'Штурмова варта')

def markonly(fg, dot):
    return svg(100, 100, mark(0, 0, 1.0, fg, dot), 'Штурмова варта – знак')

variants = {
 'color': (GRAPHITE, SIGNAL), 'inverse': (PAPER, SIGNAL),
 'mono-black': (BLACK, BLACK), 'mono-white': (WHITE, WHITE),
}
for name, (fg, dot) in variants.items():
    s, tr = primary(fg, dot)
    open(os.path.join(OUT, f'sv-primary-{name}.svg'), 'w').write(s)
    open(os.path.join(OUT, f'sv-horizontal-{name}.svg'), 'w').write(horizontal(fg, dot))
    open(os.path.join(OUT, f'sv-mark-{name}.svg'), 'w').write(markonly(fg, dot))
print('descriptor tracking em', tr)
