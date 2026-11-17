# Спільна геометрія для концепції v3 «Штурмова варта».
# Шрифт IBM Plex Sans (OFL) переводиться в криві через fontTools + shapely – у SVG немає <text>.
import math, os
from fontTools.ttLib import TTFont
from fontTools.pens.basePen import BasePen
from shapely.geometry import Polygon, MultiPolygon, Point, box
from shapely.ops import unary_union
from shapely import affinity

HERE = os.path.dirname(os.path.abspath(__file__))
NIGHT = '#0E1A2B'; NAVY = '#1F3350'; BRASS = '#C9A35A'; LIGHT = '#F4F1EA'


class FlatPen(BasePen):
    """Записує контури гліфа як ламані (криві розбиваються на відрізки)."""
    def __init__(self, gs, steps=8):
        super().__init__(gs); self.contours = []; self.cur = []; self.steps = steps
    def _moveTo(self, p): self.cur = [p]
    def _lineTo(self, p): self.cur.append(p)
    def _curveToOne(self, p1, p2, p3):
        p0 = self.cur[-1]
        for i in range(1, self.steps + 1):
            t = i / self.steps; u = 1 - t
            self.cur.append((u**3*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t**3*p3[0],
                             u**3*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t**3*p3[1]))
    def _qCurveToOne(self, p1, p2):
        p0 = self.cur[-1]
        for i in range(1, self.steps + 1):
            t = i / self.steps; u = 1 - t
            self.cur.append((u*u*p0[0] + 2*u*t*p1[0] + t*t*p2[0], u*u*p0[1] + 2*u*t*p1[1] + t*t*p2[1]))
    def _closePath(self):
        if len(self.cur) > 2: self.contours.append(self.cur)
        self.cur = []
    _endPath = _closePath


class Font:
    def __init__(self, name='IBMPlexSans-Bold.ttf'):
        self.f = TTFont(os.path.join(HERE, 'fonts', name))
        self.gs = self.f.getGlyphSet(); self.cmap = self.f.getBestCmap(); self.hmtx = self.f['hmtx']
        self.cap = self.f['OS/2'].sCapHeight
        self._cache = {}

    def glyph(self, ch):
        """Гліф у одиницях шрифту, вісь y угору. Повертає (геометрія, ширина)."""
        if ch in self._cache: return self._cache[ch]
        g = self.cmap[ord(ch)]; adv = self.hmtx[g][0]
        pen = FlatPen(self.gs); self.gs[g].draw(pen)
        geom = Polygon()
        for c in pen.contours:
            p = Polygon(c).buffer(0)
            geom = geom.symmetric_difference(p)
        self._cache[ch] = (geom, adv)
        return geom, adv

    def width(self, text, cap_px, track=0.0):
        sc = cap_px / self.cap; w = 0
        for i, ch in enumerate(text):
            w += self.glyph(ch)[1] * sc + (track * cap_px if i < len(text) - 1 else 0)
        return w

    def line(self, text, x, y_base, cap_px, track=0.0):
        """Рядок у SVG-координатах (y донизу), базова лінія y_base."""
        sc = cap_px / self.cap; out = []; cx = x
        for ch in text:
            g, adv = self.glyph(ch)
            if not g.is_empty:
                t = affinity.affine_transform(g, [sc, 0, 0, -sc, cx, y_base])
                out.append(t)
            cx += adv * sc + track * cap_px
        return unary_union(out) if out else Polygon()

    def arc(self, text, cx, cy, r_mid, cap_px, center_deg, track=0.0, bottom=False):
        """Текст по колу. center_deg – центр напису (0 = верх, за годинниковою).
        bottom=True – напис унизу, читається зліва направо, верх літер до центру."""
        sc = cap_px / self.cap
        total = self.width(text, cap_px, track)
        rb = r_mid + cap_px / 2 if bottom else r_mid - cap_px / 2   # базова лінія
        out = []; s = -total / 2
        for ch in text:
            g, adv = self.glyph(ch); w = adv * sc
            mid = s + w / 2
            if not g.is_empty:
                loc = affinity.affine_transform(g, [sc, 0, 0, sc, -adv * sc / 2, 0])  # центр по x, y угору
                a = mid / rb
                if not bottom:
                    phi = math.radians(center_deg) + a
                    P = (cx + rb * math.sin(phi), cy - rb * math.cos(phi))
                    T = (math.cos(phi), math.sin(phi)); U = (math.sin(phi), -math.cos(phi))
                else:
                    psi = math.radians(center_deg) + a
                    P = (cx + rb * math.sin(psi), cy + rb * math.cos(psi))
                    T = (math.cos(psi), -math.sin(psi)); U = (-math.sin(psi), -math.cos(psi))
                out.append(affinity.affine_transform(loc, [T[0], U[0], T[1], U[1], P[0], P[1]]))
            s += w + track * cap_px
        return unary_union(out)


def ring(cx, cy, r1, r2, res=256):
    return Point(cx, cy).buffer(r2, res).difference(Point(cx, cy).buffer(r1, res))


def disc(cx, cy, r, res=256):
    return Point(cx, cy).buffer(r, res)


def regpoly(cx, cy, r, n, rot=0.0):
    return Polygon([(cx + r * math.cos(rot + 2 * math.pi * i / n), cy + r * math.sin(rot + 2 * math.pi * i / n)) for i in range(n)])


def star4(cx, cy, r, inner=0.32, rot=0.0):
    pts = []
    for i in range(8):
        rr = r if i % 2 == 0 else r * inner
        a = rot + math.pi / 4 * i - math.pi / 2
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    return Polygon(pts)


def knurl(cx, cy, r_out, r_in, teeth):
    pts = []
    for i in range(teeth * 2):
        a = 2 * math.pi * i / (teeth * 2)
        rr = r_out if i % 2 == 0 else r_in
        a2 = a + (math.pi / teeth) * 0.5
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
        pts.append((cx + rr * math.cos(a2), cy + rr * math.sin(a2)))
    return Polygon(pts)


def squircle(cx, cy, half, n=4.2, res=360):
    pts = []
    for i in range(res):
        t = 2 * math.pi * i / res
        c, s = math.cos(t), math.sin(t)
        pts.append((cx + half * math.copysign(abs(c) ** (2 / n), c), cy + half * math.copysign(abs(s) ** (2 / n), s)))
    return Polygon(pts)


def _ring_d(coords, nd=1):
    pts = list(coords)
    if len(pts) > 1 and pts[0] == pts[-1]: pts = pts[:-1]
    f = f'{{:.{nd}f}}'
    return 'M' + 'L'.join(f'{f.format(x)} {f.format(y)}' for x, y in pts) + 'Z'


def d(geom, nd=1):
    """shapely → SVG path d (для fill-rule evenodd)."""
    if geom.is_empty: return ''
    polys = geom.geoms if hasattr(geom, 'geoms') else [geom]
    parts = []
    for p in polys:
        if p.geom_type != 'Polygon' or p.is_empty: continue
        parts.append(_ring_d(p.exterior.coords, nd))
        for h in p.interiors: parts.append(_ring_d(h.coords, nd))
    return ''.join(parts)


def to_json(geom, scale=1.0, cx=0, cy=0, simplify=0.4):
    """shapely → [{o:[x,y,...], h:[[...]]}] для three.js (y угору, центр 0)."""
    if geom.is_empty: return []
    geom = geom.simplify(simplify)
    polys = geom.geoms if hasattr(geom, 'geoms') else [geom]
    out = []
    def flat(coords):
        pts = list(coords)[:-1]; r = []
        for x, y in pts: r += [round((x - cx) * scale, 2), round(-(y - cy) * scale, 2)]
        return r
    for p in polys:
        if p.geom_type != 'Polygon' or p.is_empty: continue
        out.append({'o': flat(p.exterior.coords), 'h': [flat(h.coords) for h in p.interiors]})
    return out


def hatch(region, step=7, angle=45, width=2.2, bounds=(0, 0, 1000, 1000)):
    """Гравірувальне штрихування: смуги під кутом, обрізані по region."""
    x0, y0, x1, y1 = bounds; L = max(x1 - x0, y1 - y0) * 1.6
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    lines = []
    k = -L
    while k < L:
        lines.append(box(cx - L, cy + k - width / 2, cx + L, cy + k + width / 2)); k += step
    g = affinity.rotate(unary_union(lines), angle, origin=(cx, cy))
    return g.intersection(region)
