# Примітиви для концепції v4: точні криві (кубічні Безьє) і булеві операції через skia-pathops.
# Усі координати – SVG (y донизу). Результат – чисті контури без накладань, мінімум вузлів.
import math, os
import pathops
from pathops import Path, op, PathOp
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.basePen import BasePen
from fontTools.ttLib import TTFont

K = 0.5522847498  # магічне число для чверті кола кубічною кривою
HERE = os.path.dirname(os.path.abspath(__file__))
NIGHT = '#0E1A2B'; NAVY = '#1F3350'; BRASS = '#C9A35A'; LIGHT = '#F4F1EA'; INK = '#0B0F14'


def poly(pts):
    p = Path(); p.moveTo(*pts[0])
    for q in pts[1:]: p.lineTo(*q)
    p.close(); return p


def rect(x, y, w, h):
    return poly([(x, y), (x + w, y), (x + w, y + h), (x, y + h)])


def circle(cx, cy, r):
    p = Path(); k = K * r
    p.moveTo(cx + r, cy)
    p.cubicTo(cx + r, cy + k, cx + k, cy + r, cx, cy + r)
    p.cubicTo(cx - k, cy + r, cx - r, cy + k, cx - r, cy)
    p.cubicTo(cx - r, cy - k, cx - k, cy - r, cx, cy - r)
    p.cubicTo(cx + k, cy - r, cx + r, cy - k, cx + r, cy)
    p.close(); return p


def rrect(x, y, w, h, r):
    """Прямокутник з радіусами кутів r = число або (tl, tr, br, bl)."""
    if not isinstance(r, (tuple, list)): r = (r, r, r, r)
    tl, tr, br, bl = r
    p = Path()
    p.moveTo(x + tl, y)
    p.lineTo(x + w - tr, y)
    if tr: p.cubicTo(x + w - tr + K * tr, y, x + w, y + tr - K * tr, x + w, y + tr)
    p.lineTo(x + w, y + h - br)
    if br: p.cubicTo(x + w, y + h - br + K * br, x + w - br + K * br, y + h, x + w - br, y + h)
    p.lineTo(x + bl, y + h)
    if bl: p.cubicTo(x + bl - K * bl, y + h, x, y + h - bl + K * bl, x, y + h - bl)
    p.lineTo(x, y + tl)
    if tl: p.cubicTo(x, y + tl - K * tl, x + tl - K * tl, y, x + tl, y)
    p.close(); return p


def dshape(x0, y0, y1, r, side=1):
    """«Півстадіон»: прямий край на x0 (від y0 до y1), праворуч (side=1) півколо радіуса r=(y1-y0)/2,
    з прямою вставкою довжиною (r_ext) якщо r < висоти/2 не задано. Тут r = (y1-y0)/2, вставка = 0."""
    h = y1 - y0; rr = h / 2; k = K * rr; s = side
    p = Path(); p.moveTo(x0, y0)
    p.lineTo(x0 + s * 0, y0)
    p.cubicTo(x0 + s * k, y0, x0 + s * rr, y0 + rr - k, x0 + s * rr, y0 + rr)
    p.cubicTo(x0 + s * rr, y0 + rr + k, x0 + s * k, y1, x0, y1)
    p.close()
    if s < 0: p.reverse()
    return p


def bowl(x0, y0, y1, flat=0.0):
    """Прямий відрізок довжиною flat від x0, далі півколо – права частина «В»/«Р»."""
    rr = (y1 - y0) / 2; k = K * rr; xc = x0 + flat
    p = Path(); p.moveTo(x0, y0); p.lineTo(xc, y0)
    p.cubicTo(xc + k, y0, xc + rr, y0 + rr - k, xc + rr, y0 + rr)
    p.cubicTo(xc + rr, y0 + rr + k, xc + k, y1, xc, y1)
    p.lineTo(x0, y1); p.close(); return p


def U(*ps):
    out = Path()
    for p in ps:
        if p is None: continue
        out = op(out, p, PathOp.UNION) if len(list(out.contours)) else _copy(p)
    return out


def _copy(p):
    q = Path(); q.addPath(p); return q


def D(a, *bs):
    for b in bs: a = op(a, b, PathOp.DIFFERENCE)
    return a


def I(a, b):
    return op(a, b, PathOp.INTERSECTION)


def X(a, b):
    return op(a, b, PathOp.XOR)


def tf(p, a=1, b=0, c=0, d=1, e=0, f=0):
    return p.transform(a, b, c, d, e, f)


def move(p, dx, dy): return tf(p, 1, 0, 0, 1, dx, dy)


def scale(p, s, ox=0, oy=0): return tf(p, s, 0, 0, s, ox - s * ox, oy - s * oy)


def rotate(p, deg, ox=0, oy=0):
    a = math.radians(deg); c, s = math.cos(a), math.sin(a)
    return tf(p, c, s, -s, c, ox - c * ox + s * oy, oy - s * ox - c * oy)


def mirror_x(p, ax):  # дзеркало відносно вертикалі x = ax
    return tf(p, -1, 0, 0, 1, 2 * ax, 0)


def to_d(p, nd=2):
    pen = SVGPathPen(None, ntos=lambda v: (f'{v:.{nd}f}').rstrip('0').rstrip('.') if '.' in f'{v:.{nd}f}' else f'{v:.{nd}f}')
    q = _copy(p); q.simplify(); q.draw(pen)
    return pen.getCommands()


def bounds(p):
    return p.bounds


def node_count(p):
    q = _copy(p); q.simplify()
    return sum(1 for v, pts in q.segments if v in ('lineTo', 'curveTo', 'qCurveTo'))


class _Flat(BasePen):
    def __init__(self, steps=12):
        super().__init__(None); self.cs = []; self.cur = []; self.steps = steps
    def _moveTo(self, p): self.cur = [p]
    def _lineTo(self, p): self.cur.append(p)
    def _curveToOne(self, p1, p2, p3):
        p0 = self.cur[-1]
        for i in range(1, self.steps + 1):
            t = i / self.steps; u = 1 - t
            self.cur.append((u**3*p0[0]+3*u*u*t*p1[0]+3*u*t*t*p2[0]+t**3*p3[0], u**3*p0[1]+3*u*u*t*p1[1]+3*u*t*t*p2[1]+t**3*p3[1]))
    def _qCurveToOne(self, p1, p2):
        p0 = self.cur[-1]
        for i in range(1, self.steps + 1):
            t = i / self.steps; u = 1 - t
            self.cur.append((u*u*p0[0]+2*u*t*p1[0]+t*t*p2[0], u*u*p0[1]+2*u*t*p1[1]+t*t*p2[1]))
    def _closePath(self):
        if len(self.cur) > 2: self.cs.append(self.cur)
        self.cur = []
    _endPath = _closePath


def flatten(p, steps=12):
    q = _copy(p); q.simplify(); pen = _Flat(steps); q.draw(pen); return pen.cs


def to_three(p, cx, cy, s, steps=14):
    """Контури → [{o:[...], h:[[...]]}] для three.js Shape (y угору, центр cx,cy, масштаб s)."""
    from shapely.geometry import Polygon
    cs = flatten(p, steps)
    polys = []
    for c in cs:
        pg = Polygon(c)
        if pg.area == 0: continue
        polys.append((c, pg))
    polys.sort(key=lambda t: -t[1].area)
    outers = []
    for c, pg in polys:
        parent = None
        for o in outers:
            if o['pg'].contains(pg.representative_point()) and not any(h.contains(pg.representative_point()) for h in o['hp']):
                parent = o; break
        if parent is None:
            outers.append({'c': c, 'pg': pg, 'h': [], 'hp': []})
        else:
            parent['h'].append(c); parent['hp'].append(pg)
    def fl(c):
        r = []
        for x, y in c: r += [round((x - cx) * s, 3), round(-(y - cy) * s, 3)]
        return r
    return [{'o': fl(o['c']), 'h': [fl(h) for h in o['h']]} for o in outers]


# ---------- шрифт у криві ----------
class Font:
    def __init__(self, name='IBMPlexSans-SemiBold.ttf'):
        self.f = TTFont(os.path.join(HERE, 'fonts', name))
        self.gs = self.f.getGlyphSet(); self.cmap = self.f.getBestCmap(); self.hmtx = self.f['hmtx']
        self.cap = self.f['OS/2'].sCapHeight

    def text(self, s, x, base, cap, track=0.0):
        """Рядок у криві: базова лінія base, висота великих cap, трекінг у частках cap. Повертає (path, ширина)."""
        sc = cap / self.cap; out = Path(); cx = x
        for i, ch in enumerate(s):
            g = self.cmap[ord(ch)]; adv = self.hmtx[g][0]
            gp = Path(); pen = gp.getPen(glyphSet=self.gs); self.gs[g].draw(pen)
            gp = gp.transform(sc, 0, 0, -sc, cx, base)
            out.addPath(gp)
            cx += adv * sc + (track * cap if i < len(s) - 1 else 0)
        out.simplify()
        return out, cx - x


def svg(w, h, body, title, vb=None, desc=None):
    vb = vb or f'0 0 {w} {h}'
    t = f'<title>{title}</title>' + (f'<desc>{desc}</desc>' if desc else '')
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{w}" height="{h}" role="img">{t}{body}</svg>\n'
