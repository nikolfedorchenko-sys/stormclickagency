# Власне накреслення великих літер «ШТУРМОВА ВАРТА» у трьох характерах.
# A – геометрія кола (круглі чаші, лігатури ТУ і РТ, як спільна стійка в монограмі);
# B – шевронні чаші й вістря під 45° (як знак «Курс»);
# C – фаски 45° (як скошені кути сови «Вартовий»).
# Кегль: висота великої 100, базова лінія y=100. Стійка V, горизонталь H (оптично тонша), діагональ DG.
import math
from prims import *

V = 16.0; H = 13.5; DG = 16.5; CV = 17.0   # CV – товщина кривої на екваторі (трохи більша за стійку)
OS = 1.6                                  # нависання круглих літер за лінії


def para(xt, xb, wt, wb, yt=0.0, yb=100.0):
    """Діагональний штрих: верхнє ребро від xt шириною wt, нижнє від xb шириною wb."""
    return poly([(xt, yt), (xt + wt, yt), (xb + wb, yb), (xb, yb)])


def hw(dx, dy, t):
    """Горизонтальна ширина штриха товщиною t по нормалі для нахилу dx/dy."""
    L = math.hypot(dx, dy); return t * L / dy


def chamfer_poly(x0, y0, x1, y1, c):
    tl, tr, br, bl = c
    pts = []
    pts += [(x0 + tl, y0)] if tl else [(x0, y0)]
    pts += [(x1 - tr, y0), (x1, y0 + tr)] if tr else [(x1, y0)]
    pts += [(x1, y1 - br), (x1 - br, y1)] if br else [(x1, y1)]
    pts += [(x0 + bl, y1), (x0, y1 - bl)] if bl else [(x0, y1)]
    if tl: pts += [(x0, y0 + tl)]
    return poly(pts)


# ---------- окремі літери: повертають (path, ширина) ----------
def Sh(st, w=90):
    m = U(rect(0, 0, V, 100), rect((w - V) / 2, 0, V, 100), rect(w - V, 0, V, 100), rect(0, 100 - H, w, H))
    if st == 'C':
        c = 10
        m = D(m, poly([(-1, 100 - c), (c, 101), (-1, 101)]), poly([(w + 1, 100 - c), (w - c, 101), (w + 1, 101)]))
    return m, w


def Te(st, w=66):
    return U(rect(0, 0, w, H), rect((w - V) / 2, 0, V, 100)), w


def Ue(st, w=70):
    # права гілка: з правого верхнього кута до низу ліворуч; ліва – з лівого верхнього до стику
    xbR = 8.0                                 # низ правої гілки (лівий край)
    dx = (w - xbR) ; dhR = hw(dx * 0.86, 100, DG)
    xtR = w - dhR
    R = para(xtR, xbR, dhR, dhR)
    yj = 66.0                                 # стик гілок (центр)
    # центральна лінія правої гілки на висоті yj
    cR = lambda y: (xtR + dhR / 2) + ((xbR + dhR / 2) - (xtR + dhR / 2)) * y / 100
    xj = cR(yj)
    dhL = hw(xj - V / 2, yj, DG)
    # ліву гілку ведемо глибоко в праву і обрізаємо по правому краю правої гілки – стик без сходинки
    ext = 1.35
    L = poly([(0, 0), (dhL, 0), (dhL + (xj + dhL / 2 - dhL) * ext, yj * ext), (0 + (xj - dhL / 2) * ext, yj * ext)])
    clip = poly([(-50, -10), (w + (w - xbR - dhR) * 0.1, -10), (xbR + dhR - (w - xbR - dhR) * 0.1, 110), (-50, 110)])
    L = I(L, clip)
    m = U(R, L)
    m = D(m, rect(-20, 100, w + 40, 20), rect(-20, -20, w + 40, 20))
    return m, w


def Er(st, w=None, yb=58):
    w = w or (68 if st == 'B' else 62)
    stem = rect(0, 0, V, 100)
    return U(stem, _bowl(st, V - 0.5, 0, yb, w)), w


def _bowl(st, x0, y0, y1, xr, hb=H):
    """Чаша від стійки x0 до правого краю xr між y0 і y1, з власним просвітом."""
    hh = (y1 - y0) / 2
    if st == 'A':
        r = hh; flat = max(0, xr - x0 - r)
        out = bowl(x0, y0, y1, flat=flat)
        ri = hh - hb; flat_i = xr - CV - x0 - ri
        inn = bowl(x0 - 2, y0 + hb, y1 - hb, flat=flat_i + 2)
        return D(out, inn)
    if st == 'B':
        c = hh                                 # вістря під 45°
        hb = hb - 1
        out = poly([(x0, y0), (xr - c, y0), (xr, y0 + hh), (xr - c, y1), (x0, y1)])
        tip_i = xr - CV * math.sqrt(2)
        ci = hh - hb
        inn = poly([(x0 - 2, y0 + hb), (tip_i - ci, y0 + hb), (tip_i, y0 + hh), (tip_i - ci, y1 - hb), (x0 - 2, y1 - hb)])
        return D(out, inn)
    # C – фаски 45°
    c = min(16, hh * 0.62)
    out = chamfer_poly(x0, y0, xr, y1, (0, c, c, 0))
    ci = max(1.5, c - 0.586 * CV)
    inn = chamfer_poly(x0 - 2, y0 + hb, xr - CV, y1 - hb, (0, ci, ci, 0))
    return D(out, inn)


def Ve(st, w=None):
    w = w or (70 if st == 'B' else 64)
    mid = 45.5
    up = _bowl(st, V - 0.5, 0, mid + H, w - 4)
    lo = _bowl(st, V - 0.5, mid, 100, w)
    return U(rect(0, 0, V, 100), up, lo), w


def Em(st, w=86):
    yv = 100 if st != 'C' else 92
    dh = hw(w / 2 - V, yv, DG)
    L = poly([(0, 0), (dh, 0), (w / 2 + dh / 2, yv), (w / 2 - dh / 2, yv)])
    Rr = mirror_x(L, w / 2)
    m = U(rect(0, 0, V, 100), rect(w - V, 0, V, 100), L, Rr)
    if st == 'A':   # гострий низ вершини обрізаємо по базовій лінії
        m = D(m, rect(-10, 100, w + 20, 20))
    if st == 'B':
        m = D(m, rect(-10, 100, w + 20, 20))
    return m, w


def O(st, w=None):
    if st == 'A':
        r = 50 + OS; w = 2 * r
        return D(circle(r, 50, r), circle(r, 50, r - CV)), w
    if st == 'B':
        w = 96; c = 38
        out = poly([(0, 50), (c, 0), (w - c, 0), (w, 50), (w - c, 100), (c, 100)])
        # внутрішній контур: паралельні грані з тією самою товщиною по нормалі
        ang = math.atan2(50, c); t_h = CV / math.sin(ang)
        ci = c - (t_h - H / math.tan(ang)) if False else c * (50 - H) / 50
        xi0 = t_h; xi1 = w - t_h
        inn = poly([(xi0, 50), (xi0 + ci * 1.0, H), (xi1 - ci, H), (xi1, 50), (xi1 - ci, 100 - H), (xi0 + ci, 100 - H)])
        return D(out, inn), w
    w = 88; c = 26
    out = chamfer_poly(0, 0, w, 100, (c, c, c, c))
    ci = c - 0.586 * CV
    inn = chamfer_poly(V + 1, H, w - V - 1, 100 - H, (ci, ci, ci, ci))
    return D(out, inn), w


def Ae(st, w=78):
    """А: зовнішній трикутник/трапеція мінус внутрішній трикутник, зсунутий на DG по нормалі до ніжок."""
    yA = -5.0 if st == 'B' else 0.0           # гостра вершина B трохи нависає, як у шрифтах
    a = 0.0 if st == 'B' else 9.0             # ширина пласкої вершини A/C
    # кут ніжки
    half = (w - a) / 2; hgt = 100 - yA
    al = math.atan2(half, hgt)
    outer = poly([(w / 2 - a / 2, yA), (w / 2 + a / 2, yA), (w, 100), (0, 100)])
    # внутрішній трикутник: вершина нижче на DG / sin(al) від уявної вершини
    yv = yA - (a / 2) / math.tan(al)          # уявна гостра вершина
    yi = yv + DG / math.sin(al)
    xi = lambda y: (y - yi) * math.tan(al)
    inner = poly([(w / 2, yi), (w / 2 + xi(130), 130), (w / 2 - xi(130), 130)])
    m = D(outer, inner)
    yb0 = 61
    m = U(m, I(rect(0, yb0, w, H), outer))
    m = D(m, rect(-10, 100, w + 20, 30))
    return m, w


GLYPH = {'Ш': Sh, 'Т': Te, 'У': Ue, 'Р': Er, 'М': Em, 'О': O, 'В': Ve, 'А': Ae}

# Міжлітерні проміжки (кернінг) у одиницях кегля 100. Базовий просвіт + пари.
BASE = 13.0
KERN = {
    'A': {('Т', 'У'): -10, ('У', 'Р'): -4, ('Р', 'Т'): -10, ('А', 'Р'): -1, ('В', 'А'): -3, ('Т', 'А'): -12, ('О', 'В'): -1, ('М', 'О'): -1, ('Р', 'М'): 1},
    'B': {('Т', 'У'): -12, ('У', 'Р'): -4, ('Р', 'Т'): -9, ('В', 'А'): -3, ('Т', 'А'): -12, ('О', 'В'): -3, ('М', 'О'): -3},
    'C': {('Т', 'У'): -12, ('У', 'Р'): -4, ('Р', 'Т'): -9, ('В', 'А'): -3, ('Т', 'А'): -12, ('О', 'В'): -1, ('М', 'О'): -1},
}
# Лігатури: у характері A перекладина Т зливається з лівою гілкою У, а чаша Р – з перекладиною Т.
LIGA = {'A': {('Т', 'У'): -19, ('Р', 'Т'): -15.5}}


def word(text, st, x=0.0, base=None, cap=100.0, space=34.0, track=0.0):
    """Слово/рядок у криві. Повертає (path, ширина)."""
    sc = cap / 100.0; out = Path(); cx = 0.0; prev = None
    if base is None: base = cap
    parts = []
    for ch in text:
        if ch == ' ':
            cx += space; prev = None; continue
        g, w = GLYPH[ch](st)
        if prev:
            k = LIGA.get(st, {}).get((prev, ch))
            if k is None: k = KERN[st].get((prev, ch), 0)
            else: k = k - BASE - track
            cx += BASE + track + k
        parts.append(move(g, cx, 0))
        cx += w; prev = ch
    m = U(*parts)
    m = tf(m, sc, 0, 0, sc, x, base - 100 * sc)
    return m, cx * sc
