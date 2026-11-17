# Емблеми концепції v3: A «Брама», B «Ліхтар варти», C «КПП».
# Запуск: python3 emblems.py  (з теки build). Пише ../emblem/*.svg, ../mark/*.svg, ../3d/emblems-data.js
# Усе в кривих (shapely + fontTools), без <text>. Поле 1000×1000, центр 500/500.
import math, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from geom import *
from shapely.geometry import Polygon, Point, box, LineString
from shapely.ops import unary_union
from shapely import affinity

OUT = os.path.join(HERE, '..')
F = Font('IBMPlexSans-Bold.ttf')
FS = Font('IBMPlexSans-SemiBold.ttf')
C = 500


# ---------- центральні символи ----------
def sym_gate(simple=False):
    """A «Брама»: арка з замковим каменем, фрамуга-віяло, під нею Ш – три стійки брами на сходинках."""
    t = 1.0
    if simple:
        outer = unary_union([box(334, 452, 666, 676), disc(500, 452, 166)])
        inner = unary_union([box(390, 452, 610, 676), disc(500, 452, 110)])
        arch = outer.difference(inner)
        sh = unary_union([box(414, 496, 456, 676), box(479, 496, 521, 676), box(544, 496, 586, 676), box(414, 632, 586, 676)])
        plinth = box(300, 690, 700, 740)
        return {'symbol': unary_union([arch, sh, plinth]), 'panes': Polygon()}
    outer = unary_union([box(352, 448, 648, 652), disc(C, 448, 148)])
    inner = unary_union([box(388, 448, 612, 652), disc(C, 448, 112)])
    arch = outer.difference(inner)
    key = Polygon([(472, 286), (528, 286), (517, 344), (483, 344)])
    arch = arch.difference(key.buffer(5)).union(key)
    transom = box(388, 452, 612, 466)
    hub = disc(C, 452, 30).intersection(box(0, 0, 1000, 452))
    spokes = []
    for k in range(1, 8):
        a = math.pi + math.pi * k / 8
        p2 = (C + 140 * math.cos(a), 452 + 140 * math.sin(a))
        spokes.append(LineString([(C, 452), p2]).buffer(3.4, cap_style=2))
    fan = unary_union(spokes).intersection(inner).intersection(box(0, 0, 1000, 452))
    sh = unary_union([box(410, 480, 452, 652), box(479, 480, 521, 652), box(548, 480, 590, 652), box(410, 614, 590, 652)])
    step1 = box(344, 652, 656, 676); step2 = box(318, 676, 682, 700)
    steps = step1.union(step2).difference(box(0, 675, 1000, 677))  # тонкий шов між сходинками
    # заклепки на стулках
    riv = unary_union([disc(x, y, 5, 24) for x in (431, 500, 569) for y in (500, 560)])
    sym = unary_union([arch, transom, hub, fan, sh, steps]).difference(riv.buffer(0))
    sym = sym.union(riv)
    return {'symbol': sym, 'panes': Polygon()}


def sym_lantern(simple=False):
    """B «Ліхтар варти»: стійки клітки ліхтаря – це Ш, між ними два світлі вікна."""
    if simple:
        ring_ = disc(C, 300, 40).difference(disc(C, 300, 18))
        roof = Polygon([(380, 400), (620, 400), (566, 344), (434, 344)])
        posts = unary_union([box(384, 420, 432, 640), box(476, 420, 524, 640), box(568, 420, 616, 640), box(384, 600, 616, 640)])
        base = Polygon([(370, 652), (630, 652), (600, 700), (400, 700)])
        panes = unary_union([box(444, 432, 464, 588), box(536, 432, 556, 588)])
        return {'symbol': unary_union([ring_, roof, posts, base]), 'panes': panes}
    ring_ = disc(C, 314, 28).difference(disc(C, 314, 15))
    neck = box(490, 340, 510, 356)
    cap = Polygon([(452, 384), (548, 384), (528, 356), (472, 356)])
    roof = Polygon([(398, 404), (602, 404), (556, 380), (444, 380)])
    brim = box(392, 404, 608, 416)
    posts = unary_union([box(404, 430, 438, 628), box(483, 430, 517, 628), box(562, 430, 596, 628), box(404, 596, 596, 628)])
    # дрібні деталі: гвинти на брилі, ребра даху
    ribs = unary_union([LineString([(C + dx, 384), (C + dx * 1.9, 404)]).buffer(1.6) for dx in (-30, -10, 10, 30)])
    roof = roof.difference(ribs)
    foot = Polygon([(398, 628), (602, 628), (582, 652), (418, 652)])
    plate = box(432, 652, 568, 668)
    feet = unary_union([box(440, 668, 470, 682), box(530, 668, 560, 682)])
    panes = unary_union([box(448, 440, 473, 586), box(527, 440, 552, 586)])
    # тонкі хрестовини скла (у панелях)
    mull = unary_union([box(448, 510, 473, 514), box(527, 510, 552, 514)])
    panes = panes.difference(mull)
    sym = unary_union([ring_, neck, cap, roof, brim, posts, foot, plate, feet])
    return {'symbol': sym, 'panes': panes}


def sym_kpp(simple=False):
    """C «КПП»: Ш – три стовпчики проїзду, над ними піднята смугаста стріла шлагбаума."""
    ang = -13
    if simple:
        sh = unary_union([box(372, 470, 428, 690), box(472, 470, 528, 690), box(572, 470, 628, 690), box(372, 634, 628, 690)])
        arm = box(330, 376, 690, 424)
        arm = affinity.rotate(arm, ang, origin=(372, 400))
        light = unary_union([box(420 + 90 * i, 376, 465 + 90 * i, 424) for i in range(3)])
        light = affinity.rotate(light, ang, origin=(372, 400)).intersection(arm)
        return {'symbol': sh.union(arm.difference(light)), 'panes': light, 'stripes': light}
    sh = unary_union([box(392, 486, 436, 668), box(478, 486, 522, 668), box(564, 486, 608, 668), box(392, 630, 608, 668)])
    caps = unary_union([box(386, 478, 442, 488), box(472, 478, 528, 488), box(558, 478, 614, 488)])
    housing = box(340, 410, 400, 470)
    housing = housing.difference(box(352, 446, 388, 452))
    arm = box(380, 412, 712, 440)
    tip = box(704, 418, 712, 434)
    stripes = unary_union([box(430 + 56 * i, 412, 458 + 56 * i, 440) for i in range(5)])
    arm_r = affinity.rotate(arm, ang, origin=(372, 426))
    stripes_r = affinity.rotate(stripes, ang, origin=(372, 426)).intersection(arm_r)
    pivot = disc(372, 426, 20).difference(disc(372, 426, 7))
    lamp = disc(370, 396, 9)
    base = box(330, 668, 670, 690)
    curb = unary_union([box(300 + 40 * i, 694, 330 + 40 * i, 704) for i in range(10)])
    sym = unary_union([sh, caps, housing.difference(disc(372, 426, 22)), arm_r.difference(disc(372, 426, 22)), pivot, base, curb, lamp])
    sym = sym.difference(stripes_r.buffer(0.01))
    return {'symbol': sym, 'panes': stripes_r, 'stripes': stripes_r}


# ---------- рамки ----------
def frame(kind):
    L = {}
    if kind == 'circle':
        L['outer'] = disc(C, C, 500)
        L['knurl'] = knurl(C, C, 500, 489, 180).difference(disc(C, C, 486))
        L['rim'] = ring(C, C, 462, 488)
        L['groove'] = ring(C, C, 444, 462)
        L['beads'] = unary_union([disc(C + 453 * math.cos(2 * math.pi * i / 96), C + 453 * math.sin(2 * math.pi * i / 96), 4.3, 16) for i in range(96)])
    elif kind == 'octagon':
        o = regpoly(C, C, 500 / math.cos(math.pi / 8), 8, math.pi / 8)
        L['outer'] = o
        L['knurl'] = o.difference(o.buffer(-10, join_style=2)).difference(Polygon())
        L['rim'] = o.buffer(-12, join_style=2).difference(o.buffer(-40, join_style=2))
        L['groove'] = o.buffer(-40, join_style=2).difference(disc(C, C, 444))
        vs = list(o.buffer(-26, join_style=2).exterior.coords)[:-1]
        L['beads'] = unary_union([disc(x, y, 9, 24) for x, y in vs])
        L['spandrel'] = o.buffer(-48, join_style=2).difference(disc(C, C, 446))
    else:
        s = squircle(C, C, 500, 4.6)
        L['outer'] = s
        L['knurl'] = s.difference(s.buffer(-9))
        L['rim'] = s.buffer(-11).difference(s.buffer(-40))
        L['groove'] = s.buffer(-40).difference(disc(C, C, 444))
        pts = [(C + 392 * sx, C + 392 * sy) for sx in (-1, 1) for sy in (-1, 1)]
        heads = unary_union([disc(x, y, 18, 32) for x, y in pts])
        slots = unary_union([affinity.rotate(box(x - 13, y - 2.6, x + 13, y + 2.6), 35, origin=(x, y)) for x, y in pts])
        L['beads'] = heads.difference(slots)
        L['spandrel'] = s.buffer(-48).difference(disc(C, C, 446)).difference(heads.buffer(6))
    L['line_out'] = ring(C, C, 436, 444)
    L['band'] = ring(C, C, 336, 436)
    L['line_in'] = ring(C, C, 326, 336)
    L['field'] = disc(C, C, 326)
    return L


def ring_text():
    top = F.arc('ШТУРМОВА ВАРТА', C, C, 386, 50, 0, track=0.16)
    bot = F.arc('ОХОРОННА КОМПАНІЯ', C, C, 386, 46, 0, track=0.12, bottom=True)
    seps = unary_union([star4(C + 386 * sx, C, 17, 0.3) for sx in (-1, 1)])
    dots = unary_union([disc(C + 386 * math.sin(math.radians(a)), C - 386 * math.cos(math.radians(a)), 3.4, 12) for a in (-80, -74, 74, 80)])
    return top, bot, seps.union(dots)


def kyiv(y=772):
    w = FS.width('КИЇВ', 26, 0.34)
    t = FS.line('КИЇВ', C - w / 2, y, 26, 0.34)
    dash = unary_union([box(C - w / 2 - 54, y - 15, C - w / 2 - 20, y - 11), box(C + w / 2 + 20, y - 15, C + w / 2 + 54, y - 11)])
    return t.union(dash)


# ---------- фони поля ----------
def guilloche_paths(n_curves=30, waves=24, amp=9.0, r0=40, r1=318, phase_mul=0.5):
    out = []
    for i in range(n_curves):
        R = r0 + (r1 - r0) * i / (n_curves - 1)
        ph = i * math.pi * phase_mul
        pts = []
        for k in range(481):
            th = 2 * math.pi * k / 480
            r = R + amp * math.cos(waves * th + ph) * (0.4 + 0.6 * R / r1)
            pts.append(f'{C + r * math.cos(th):.1f} {C + r * math.sin(th):.1f}')
        out.append('M' + 'L'.join(pts) + 'Z')
    return out


def sunburst(n=64, r=330):
    w = []
    for i in range(n):
        if i % 2: continue
        a0 = 2 * math.pi * i / n; a1 = 2 * math.pi * (i + 1) / n
        w.append(Polygon([(C, C), (C + r * math.cos(a0), C + r * math.sin(a0)), (C + r * math.cos(a1), C + r * math.sin(a1))]))
    return unary_union(w).intersection(disc(C, C, 326))


def road():
    """Перспектива дороги для C: горизонт, смуги, зірки в небі."""
    hz = 470
    lines = []
    for x in range(-900, 1901, 120):
        lines.append(LineString([(C, hz - 40), (x, 1100)]).buffer(1.4))
    lanes = unary_union(lines).intersection(box(0, hz, 1000, 1000))
    horiz = unary_union([box(0, hz + (k ** 1.8) * 3.2, 1000, hz + (k ** 1.8) * 3.2 + 1.6) for k in range(1, 18)])
    sky = unary_union([box(0, y, 1000, y + 1.2) for y in range(180, hz - 6, 9)])
    return lanes.union(horiz).intersection(disc(C, C, 326)), sky.intersection(disc(C, C, 326))


VARIANTS = {
    'a': {'name': 'Брама', 'frame': 'circle', 'sym': sym_gate},
    'b': {'name': 'Ліхтар варти', 'frame': 'octagon', 'sym': sym_lantern},
    'c': {'name': 'КПП', 'frame': 'squircle', 'sym': sym_kpp},
}


def build(k):
    v = VARIANTS[k]; L = frame(v['frame']); S = v['sym']()
    top, bot, seps = ring_text()
    if k == 'b':
        S = {kk: affinity.scale(vv, 1.12, 1.12, origin=(C, 490)) for kk, vv in S.items()}
    L.update({'letters': top.union(bot), 'seps': seps, 'kyiv': kyiv(), 'symbol': S['symbol'], 'panes': S['panes']})
    L['micro'] = micro_ring()
    return L


def micro_ring(r_mid=331, cap=6.4):
    unit = 'ШТУРМОВА ВАРТА · '
    rb = r_mid - cap / 2
    n = int(2 * math.pi * rb // FS.width(unit, cap, 0.1))
    txt = (unit * n).rstrip()
    w0 = FS.width(txt, cap, 0.0)
    tr = (2 * math.pi * rb - w0 - FS.width(' ', cap)) / (len(txt) * cap)
    return FS.arc(txt, C, C, r_mid, cap, 0, track=tr)


# ---------- SVG ----------
def defs(p):
    return f'''<defs>
<linearGradient id="{p}brass" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="#7A5A27"/><stop offset=".16" stop-color="#EAD08F"/><stop offset=".34" stop-color="#B68D46"/>
<stop offset=".52" stop-color="#F7E6B3"/><stop offset=".7" stop-color="#9E7737"/><stop offset=".86" stop-color="#D8B670"/><stop offset="1" stop-color="#6A4C1E"/></linearGradient>
<linearGradient id="{p}brass2" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#F3DFA6"/><stop offset=".45" stop-color="#C9A35A"/><stop offset=".55" stop-color="#A9843F"/><stop offset="1" stop-color="#E2C27E"/></linearGradient>
<radialGradient id="{p}enamel" cx=".35" cy=".28" r=".8">
<stop offset="0" stop-color="#2D4A72"/><stop offset=".5" stop-color="#1F3350"/><stop offset="1" stop-color="#122038"/></radialGradient>
<radialGradient id="{p}field" cx=".5" cy=".42" r=".6">
<stop offset="0" stop-color="#1D3150"/><stop offset=".62" stop-color="#0E1A2B"/><stop offset="1" stop-color="#08111D"/></radialGradient>
<radialGradient id="{p}glow" cx=".5" cy=".5" r=".5">
<stop offset="0" stop-color="#FFE7A8" stop-opacity=".55"/><stop offset=".45" stop-color="#C9A35A" stop-opacity=".18"/><stop offset="1" stop-color="#C9A35A" stop-opacity="0"/></radialGradient>
<linearGradient id="{p}pane" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#FFF4D1"/><stop offset=".6" stop-color="#F6D58A"/><stop offset="1" stop-color="#D9A94E"/></linearGradient>
<linearGradient id="{p}sheen" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".4" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
</defs>'''


def emboss(geom, fill, p, depth=4, hi=True):
    dd = d(geom)
    s = f'<path fill="#2A1D08" fill-opacity=".75" transform="translate({depth*.6:.1f} {depth:.1f})" d="{dd}"/>'
    if hi: s += f'<path fill="#FFF3CF" fill-opacity=".7" transform="translate(-1.2 -1.6)" d="{dd}"/>'
    return s + f'<path fill="{fill}" d="{dd}"/>'


def svg_color(k, p=None, glare=True):
    p = p or f'e{k}'
    L = build(k); s = [defs(p)]
    s.append(f'<path fill="#05090F" fill-opacity=".35" transform="translate(6 10)" d="{d(L["outer"])}"/>')
    s.append(f'<path fill="url(#{p}brass)" d="{d(L["outer"])}"/>')
    s.append(f'<path fill="#5B4219" fill-opacity=".55" d="{d(L["knurl"])}"/>')
    s.append(f'<path fill="url(#{p}brass)" d="{d(L["rim"])}"/>')
    s.append(f'<path fill="#14243B" d="{d(L["groove"])}"/>')
    if 'spandrel' in L:
        s.append(f'<path fill="#0E1A2B" d="{d(L["spandrel"])}"/>')
        s.append(f'<path fill="#C9A35A" fill-opacity=".55" d="{d(hatch(L["spandrel"], 7, 45, 1.6))}"/>')
    s.append(emboss(L['beads'], f'url(#{p}brass2)', p, 2.5))
    s.append(emboss(L['line_out'], f'url(#{p}brass2)', p, 2))
    s.append(f'<path fill="#0A1320" d="{d(ring(C, C, 324, 338))}"/>')
    s.append(f'<path fill="#D9B873" d="{d(L["micro"], 2)}"/>')
    s.append(f'<path fill="#C9A35A" d="{d(ring(C, C, 337, 340).union(ring(C, C, 322, 325)))}"/>')
    s.append(f'<path fill="url(#{p}enamel)" d="{d(L["band"])}"/>')
    s.append(f'<path fill="url(#{p}field)" d="{d(L["field"])}"/>')
    # фон поля
    fld = d(L['field'])
    s.append(f'<clipPath id="{p}fc"><path d="{fld}"/></clipPath><g clip-path="url(#{p}fc)">')
    if k == 'a':
        s.append(f'<g fill="none" stroke="#C9A35A" stroke-opacity=".26" stroke-width="1.3">' + ''.join(f'<path d="{g}"/>' for g in guilloche_paths()) + '</g>')
        s.append(f'<g fill="none" stroke="#C9A35A" stroke-opacity=".16" stroke-width="1.1">' + ''.join(f'<path d="{g}"/>' for g in guilloche_paths(30, 24, 9, 44, 322, 1.0)) + '</g>')
    elif k == 'b':
        s.append(f'<path fill="#1F3350" fill-opacity=".85" d="{d(sunburst())}"/>')
        s.append(f'<circle cx="500" cy="515" r="300" fill="url(#{p}glow)"/>')
    else:
        lanes, sky = road()
        s.append(f'<path fill="#1F3350" d="{d(box(0, 470, 1000, 1000).intersection(L["field"]))}"/>')
        s.append(f'<path fill="#C9A35A" fill-opacity=".38" d="{d(lanes)}"/>')
        s.append(f'<path fill="#C9A35A" fill-opacity=".14" d="{d(sky)}"/>')
        stars = unary_union([star4(x, y, r, .22) for x, y, r in [(300, 300, 9), (650, 250, 7), (720, 360, 5), (260, 400, 5), (560, 220, 4), (420, 260, 4), (780, 300, 4)]])
        s.append(f'<path fill="#F4E3B4" d="{d(stars)}"/>')
    s.append('</g>')
    # написи
    s.append(emboss(L['letters'], f'url(#{p}brass2)', p, 3))
    s.append(emboss(L['seps'], f'url(#{p}brass2)', p, 2))
    s.append(emboss(L['kyiv'], f'url(#{p}brass2)', p, 2, hi=False))
    # символ
    sym = L['symbol']
    if k == 'b':
        s.append(f'<path fill="url(#{p}pane)" d="{d(L["panes"])}"/>')
    if k == 'c':
        s.append(f'<path fill="#2A1D08" fill-opacity=".7" transform="translate(3 6)" d="{d(L["panes"])}"/>')
        s.append(f'<path fill="#F4F1EA" d="{d(L["panes"])}"/>')
    s.append(emboss(sym, f'url(#{p}brass)', p, 7))
    shade = hatch(sym.intersection(box(500, 0, 1000, 1000)), 6.5, -45, 1.5)
    s.append(f'<path fill="#5E4318" fill-opacity=".5" d="{d(shade)}"/>')
    if glare:
        s.append(f'<path fill="url(#{p}sheen)" d="{d(L["outer"].buffer(-12))}"/>')
    return s


def svg_mono(k, col):
    L = build(k); s = []
    s.append(f'<path fill="{col}" d="{d(L["rim"].union(L["knurl"]))}"/>')
    s.append(f'<path fill="{col}" d="{d(L["beads"])}"/>')
    s.append(f'<path fill="{col}" d="{d(L["line_out"].union(L["line_in"]))}"/>')
    s.append(f'<path fill="{col}" d="{d(L["letters"].union(L["seps"]).union(L["kyiv"]))}"/>')
    if 'spandrel' in L:
        s.append(f'<path fill="{col}" d="{d(hatch(L["spandrel"], 9, 45, 2.2))}"/>')
    if k == 'a':
        s.append(f'<g fill="none" stroke="{col}" stroke-width="1.6">' + ''.join(f'<path d="{g}"/>' for g in guilloche_paths(16, 24, 9, 40, 318)) + '</g>')
        sym = L['symbol'].buffer(10).difference(L['symbol'])
        s.append(f'<path fill="{col}" d="{d(sym)}" fill-opacity="0"/>')
    elif k == 'b':
        s.append(f'<path fill="{col}" d="{d(sunburst().difference(L["symbol"].buffer(26)).difference(L["panes"].buffer(26)).difference(L["kyiv"].buffer(14)))}"/>')
    else:
        lanes, sky = road()
        s.append(f'<path fill="{col}" d="{d(lanes.difference(L["symbol"].buffer(14)).difference(L["kyiv"].buffer(14)))}"/>')
    # символ з «повітрям» навколо – вирізаємо фон
    s.insert(0, '')
    knock = L['symbol'].buffer(12)
    body = ''.join(s)
    return body, knock, L


def write_svg(path, vb, body, title, w=None, h=None):
    w = w or vb[2]; h = h or vb[3]
    open(path, 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{" ".join(str(x) for x in vb)}" width="{w}" height="{h}" role="img" aria-label="{title}"><title>{title}</title>{body}</svg>\n')


def mono_full(k, col):
    """Монохром: фон поля під символом вирізається, символ суцільний, вікна/смуги – порожні."""
    L = build(k)
    parts = [L['rim'].union(L['knurl']), L['beads'], L['line_out'].union(L['line_in']), L['letters'], L['seps'], L['kyiv']]
    sym = L['symbol']
    if k == 'c': sym = sym  # смуги стріли лишаються порожніми – читається як смугаста стріла
    knock = sym.union(L['panes']).buffer(34).buffer(-22)
    if 'spandrel' in L: parts.append(hatch(L['spandrel'], 9, 45, 2.4))
    if k == 'b': parts.append(sunburst().difference(knock.buffer(14)).difference(L['kyiv'].buffer(16)))
    if k == 'c':
        lanes, sky = road(); parts.append(lanes.difference(knock).difference(L['kyiv'].buffer(16)))
        parts.append(L['panes'].difference(L['panes'].buffer(-5)))  # контур світлих смуг
    parts.append(sym)
    g = unary_union(parts)
    body = f'<path fill="{col}" fill-rule="evenodd" d="{d(g)}"/>'
    if k == 'a':
        gp = ''.join(f'<path d="{x}"/>' for x in guilloche_paths(24, 36, 5, 40, 318))
        body = (f'<clipPath id="m{k}{col[1:]}"><path d="{d(L["field"].difference(knock).difference(L["kyiv"].buffer(16)))}"/></clipPath>'
                f'<g clip-path="url(#m{k}{col[1:]})" fill="none" stroke="{col}" stroke-width="1.7">{gp}</g>') + body
    return body


# ---------- спрощені знаки ----------
def mark_geom(k):
    S = VARIANTS[k]['sym'](simple=True)
    if k == 'a': bg = disc(C, C, 500)
    elif k == 'b': bg = regpoly(C, C, 500 / math.cos(math.pi / 8), 8, math.pi / 8)
    else: bg = squircle(C, C, 500, 4.6)
    rim = bg.difference(bg.buffer(-26, join_style=2)) if k != 'a' else ring(C, C, 474, 500)
    f, cy = {'a': (1.1, 512), 'b': (1.14, 500), 'c': (1.14, 530)}[k]
    S = {kk: affinity.scale(vv, f, f, origin=(C, cy)) for kk, vv in S.items()}
    return bg, rim, S


def fav_svg(k):
    bg, rim, S = mark_geom(k)
    f = 1.22
    S = {kk: affinity.scale(vv, f, f, origin=(C, C)) for kk, vv in S.items()}
    out = f'<path fill="#0E1A2B" d="{d(bg)}"/><path fill="#C9A35A" d="{d(S["symbol"].intersection(bg.buffer(-40)))}"/>'
    if not S['panes'].is_empty: out += f'<path fill="#F4D9A0" d="{d(S["panes"])}"/>'
    return out


def mark_svg(k, scheme):
    bg, rim, S = mark_geom(k)
    sch = {'color': ('#0E1A2B', '#C9A35A', '#C9A35A', '#F4D9A0'),
           'inverse': ('#C9A35A', '#0E1A2B', '#0E1A2B', '#F4F1EA'),
           'light': ('#F4F1EA', '#0E1A2B', '#C9A35A', '#C9A35A'),
           'mono-black': ('#000', '#FFF', '#FFF', '#FFF'),
           'mono-white': ('#FFF', '#000', '#000', '#000')}[scheme]
    bgc, symc, rimc, panec = sch
    if scheme.startswith('mono'):
        # монохром: фон-плашка одного кольору, символ вирізаний
        col = '#000' if scheme == 'mono-black' else '#FFF'
        g = bg.difference(S['symbol'].difference(rim)).difference(bg.buffer(-18, join_style=2).difference(bg.buffer(-40, join_style=2)) if True else Polygon())
        g = g.union(S['panes']) if k != 'c' else g.union(S.get('stripes', Polygon()))
        return f'<path fill="{col}" fill-rule="evenodd" d="{d(g)}"/>'
    out = f'<path fill="{bgc}" d="{d(bg)}"/><path fill="{rimc}" d="{d(rim)}"/><path fill="{symc}" d="{d(S["symbol"])}"/>'
    if not S['panes'].is_empty: out += f'<path fill="{panec}" d="{d(S["panes"])}"/>'
    return out


def lockup(k, scheme):
    """Знак + написання в рядок: ШТУРМОВА / ВАРТА + ОХОРОННА КОМПАНІЯ."""
    mk = mark_svg(k, 'color' if scheme == 'dark' else 'light')
    word = '#F4F1EA' if scheme == 'dark' else '#0E1A2B'; sub = '#C9A35A' if scheme == 'dark' else '#8A6A2E'
    x = 1180
    l1 = F.line('ШТУРМОВА', x, 400, 300, 0.04); l2 = F.line('ВАРТА', x, 760, 300, 0.04)
    w = max(F.width('ШТУРМОВА', 300, 0.04), F.width('ВАРТА', 300, 0.04))
    sw = FS.width('ОХОРОННА КОМПАНІЯ', 92, 0.32)
    l3 = FS.line('ОХОРОННА КОМПАНІЯ', x, 960, 92, 0.32)
    rule = box(x, 856, x + w, 866)
    body = f'<g>{mk}</g><path fill="{word}" d="{d(l1.union(l2))}"/><path fill="{sub}" d="{d(l3.union(rule))}"/>'
    return body, x + max(w, sw) + 20


if __name__ == '__main__':
    os.makedirs(os.path.join(OUT, 'emblem'), exist_ok=True); os.makedirs(os.path.join(OUT, 'mark'), exist_ok=True)
    data = {}
    for k, v in VARIANTS.items():
        nm = v['name']
        write_svg(os.path.join(OUT, 'emblem', f'{k}-emblem-color.svg'), (-10, -10, 1030, 1030), ''.join(svg_color(k)), f'Штурмова варта – емблема {k.upper()} «{nm}», кольорова', 1030, 1030)
        for col, nmc in (('#0E1A2B', 'mono-night'), ('#F4F1EA', 'mono-light'), ('#000000', 'mono-black')):
            write_svg(os.path.join(OUT, 'emblem', f'{k}-emblem-{nmc}.svg'), (0, 0, 1000, 1000), mono_full(k, col), f'Штурмова варта – емблема {k.upper()} «{nm}», монохром')
        for sch in ('color', 'inverse', 'light', 'mono-black', 'mono-white'):
            write_svg(os.path.join(OUT, 'mark', f'{k}-mark-{sch}.svg'), (0, 0, 1000, 1000), mark_svg(k, sch), f'Штурмова варта – спрощений знак {k.upper()} «{nm}»')
        write_svg(os.path.join(OUT, 'mark', f'{k}-favicon.svg'), (0, 0, 1000, 1000), fav_svg(k), f'Штурмова варта – знак {k.upper()} для 16–32 px')
        for sch in ('dark', 'light'):
            body, w = lockup(k, sch)
            write_svg(os.path.join(OUT, 'mark', f'{k}-lockup-{sch}.svg'), (0, 0, round(w), 1000), body, f'Штурмова варта – знак {k.upper()} і написання', round(w / 4), 250)
        # дані для 3D
        L = build(k); bg, rim, S = mark_geom(k)
        sc = 1 / 100
        lanes, sky = road()
        data[k] = {
            'outer': to_json(L['outer'], sc, C, C),
            'outerEdge': to_json(knurl(C, C, 500, 489, 180) if k == 'a' else L['outer'], sc, C, C, 0.05),
            'rim': to_json(L['rim'], sc, C, C), 'groove': to_json(L['groove'], sc, C, C),
            'beads': to_json(L['beads'], sc, C, C), 'lines': to_json(L['line_out'].union(L['line_in']), sc, C, C),
            'band': to_json(L['band'], sc, C, C), 'field': to_json(L['field'], sc, C, C),
            'letters': to_json(L['letters'].union(L['seps']), sc, C, C, 0.25), 'kyiv': to_json(L['kyiv'], sc, C, C, 0.2),
            'symbol': to_json(L['symbol'], sc, C, C, 0.2), 'panes': to_json(L['panes'], sc, C, C),
            'spandrel': to_json(L.get('spandrel', Polygon()), sc, C, C),
            'relief': to_json(lanes if k == 'c' else (sunburst() if k == 'b' else Polygon()), sc, C, C, 0.3),
            'mark': {'bg': to_json(bg, sc, C, C), 'rim': to_json(rim, sc, C, C), 'symbol': to_json(S['symbol'], sc, C, C), 'panes': to_json(S['panes'], sc, C, C)},
        }
    open(os.path.join(OUT, '3d', 'emblems-data.js'), 'w').write('window.EMBLEMS=' + json.dumps(data, separators=(',', ':')) + ';\n')
    print('ok')
