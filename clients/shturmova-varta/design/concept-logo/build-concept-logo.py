# Генератор SVG концепції логотипа «Штурмова варта» (етап 0, три варіанти).
# Запуск: python3 build-concept-logo.py <тека-результату> <IBMPlexSans-Bold.ttf>
# Потрібен fontTools. IBM Plex Sans 700 – Google Fonts, OFL. Написання переводиться в криві, <text> немає.
import sys, os
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

OUT, FONT = sys.argv[1], sys.argv[2]
NIGHT = '#0E1A2B'; NAVY = '#1F3350'; BRASS = '#C9A35A'; LIGHT = '#F4F1EA'

# Знаки в полі 100×100, вісь y донизу. Кожен – список (роль, path). Ролі: base – основний колір, accent – латунь,
# alt – другий колір смуг (на світлому – нічний, на темному – світлий).
MARKS = {
 # A. «Мур»: Ш як фортечний мур – три зубці і основа; латунна смуга – фундамент.
 'a': [('base', 'M0 0H24V58H38V0H62V58H76V0H100V78H0Z'),
       ('accent', 'M0 86H100V100H0Z')],
 # B. «КПП»: Ш під смугастою стрілою шлагбаума – доступ під контролем.
 'b': [('base', 'M0 36H20V82H40V36H60V82H80V36H100V100H0Z'),
       ('accent', 'M0 10H25V24H0Z'), ('alt', 'M25 10H50V24H25Z'),
       ('accent', 'M50 10H75V24H50Z'), ('alt', 'M75 10H100V24H75Z')],
 # C. «Світло у вікні»: В – будівля на два поверхи, у нижньому вікні світло варти.
 'c': [('base', 'M8 0H74L90 16V36L80 46L92 58V100H8Z M28 18V38H70V18Z M28 58V82H72V58Z'),
       ('accent', 'M36 64H64V76H36Z')],
}
SCHEMES = {
 'color':      {'base': NIGHT, 'accent': BRASS, 'alt': NIGHT, 'word': NIGHT},
 'inverse':    {'base': LIGHT, 'accent': BRASS, 'alt': LIGHT, 'word': LIGHT},
 'mono-black': {'base': '#000', 'accent': '#000', 'alt': '#000', 'word': '#000'},
 'mono-white': {'base': '#FFF', 'accent': '#FFF', 'alt': '#FFF', 'word': '#FFF'},
}
NAMES = {'a': 'Мур', 'b': 'КПП', 'c': 'Світло у вікні'}

font = TTFont(FONT); gs = font.getGlyphSet(); cmap = font.getBestCmap(); hmtx = font['hmtx']
CAP = font['OS/2'].sCapHeight

def outline(text, x, y_top, cap_px, track_em=0.06):
    sc = cap_px / CAP; out = []; cx = x
    for c in text:
        if c == ' ':
            cx += hmtx[cmap[32]][0] * sc; continue
        g = cmap[ord(c)]
        pen = SVGPathPen(gs)
        gs[g].draw(TransformPen(pen, (sc, 0, 0, -sc, cx, y_top + cap_px)))
        out.append(f'<path d="{pen.getCommands()}"/>')
        cx += hmtx[g][0] * sc + track_em * cap_px
    return out, cx - track_em * cap_px - x

def mark_paths(k, sch, x=0, y=0, s=1.0):
    out = []
    for role, d in MARKS[k]:
        fill = SCHEMES[sch][role]
        out.append(f'<path fill="{fill}" fill-rule="evenodd" transform="translate({x} {y}) scale({s})" d="{d}"/>')
    return out

def svg(w, h, body, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} {h:.0f}" width="{w:.0f}" height="{h:.0f}" '
            f'role="img" aria-label="{title}"><title>{title}</title>' + ''.join(body) + '</svg>\n')

for k in MARKS:
    for sch in SCHEMES:
        t = f'Штурмова варта – знак, варіант {k.upper()} «{NAMES[k]}»'
        open(os.path.join(OUT, f'{k}-mark-{sch}.svg'), 'w').write(svg(100, 100, mark_paths(k, sch), t))
        x = 128
        l1, w1 = outline('ШТУРМОВА', x, 4, 38)
        l2, w2 = outline('ВАРТА', x, 58, 38)
        body = mark_paths(k, sch) + [f'<g fill="{SCHEMES[sch]["word"]}">'] + l1 + l2 + ['</g>']
        t = f'Штурмова варта – логотип, варіант {k.upper()} «{NAMES[k]}»'
        open(os.path.join(OUT, f'{k}-lockup-{sch}.svg'), 'w').write(svg(x + max(w1, w2) + 2, 100, body, t))
print('ok')
