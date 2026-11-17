# Ілюстрації концепції v3: 1) КПП складу (ізометрія), 2) нічне місто і пост бізнес-центру, 3) авто охорони.
# Процедурна векторна графіка: сотні елементів, світло, градієнти, зерно. Люди – силуети без облич.
import math, random, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from geom import HERE, d
import emblems as E
from car import car

OUT = os.path.join(HERE, '..', 'illustration')
W, H = 1600, 1000


def wrap(body, title, w=W, h=H, extra_defs=''):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="{title}"><title>{title}</title>'
            f'<defs>{COMMON_DEFS}{extra_defs}</defs>{body}'
            f'<rect width="{w}" height="{h}" filter="url(#grain)" opacity=".10"/></svg>\n')


COMMON_DEFS = '''
<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 1.4 -.2"/></filter>
<filter id="b2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2"/></filter>
<filter id="b6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
<filter id="b14" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
<filter id="b30" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="30"/></filter>
<radialGradient id="pool"><stop offset="0" stop-color="#FFD98F" stop-opacity=".55"/><stop offset=".5" stop-color="#E7B860" stop-opacity=".16"/><stop offset="1" stop-color="#C9A35A" stop-opacity="0"/></radialGradient>
<radialGradient id="poolCool"><stop offset="0" stop-color="#BFD3F2" stop-opacity=".35"/><stop offset="1" stop-color="#9FB8E0" stop-opacity="0"/></radialGradient>
<linearGradient id="cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE6AE" stop-opacity=".42"/><stop offset="1" stop-color="#FFE6AE" stop-opacity="0"/></linearGradient>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050A12"/><stop offset=".55" stop-color="#0E1A2B"/><stop offset=".85" stop-color="#1F3350"/><stop offset="1" stop-color="#2F4A70"/></linearGradient>
'''


def stars(R, n, x0, y0, x1, y1):
    out = []
    for _ in range(n):
        x, y = R.uniform(x0, x1), R.uniform(y0, y1); r = R.choice([0.6, 0.8, 1, 1, 1.3, 1.8])
        out.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r}" fill="#F4F1EA" opacity="{R.uniform(.25, .9):.2f}"/>')
    return ''.join(out)


def person(x, y, h=60, col='#05080D', pose='stand'):
    """Силует без обличчя: голова, плечі, корпус, ноги. (x,y) – точка стоп."""
    k = h / 60
    head = f'<circle cx="{x}" cy="{y - 53*k:.1f}" r="{6*k:.1f}"/>'
    cap = f'<path d="M{x-7*k:.1f} {y-55*k:.1f} h{14*k:.1f} l{3*k:.1f} {2*k:.1f} h{-20*k:.1f} Z"/>'
    body = (f'<path d="M{x-11*k:.1f} {y-45*k:.1f} Q{x} {y-49*k:.1f} {x+11*k:.1f} {y-45*k:.1f} L{x+12*k:.1f} {y-24*k:.1f} L{x+8*k:.1f} {y-24*k:.1f} '
            f'L{x+7*k:.1f} {y} L{x+2*k:.1f} {y} L{x} {y-20*k:.1f} L{x-2*k:.1f} {y} L{x-7*k:.1f} {y} L{x-8*k:.1f} {y-24*k:.1f} L{x-12*k:.1f} {y-24*k:.1f} Z"/>')
    return f'<g fill="{col}">{head}{cap}{body}</g>'


# ============ 1. КПП складу (ізометрія) ============
S = 13; OX = 800; OY = 120
C30 = math.cos(math.radians(30))


def iso(x, y, z=0):
    return (OX + (x - y) * S * C30, OY + (x + y) * S * 0.5 - z * S)


def P(pts):
    return 'M' + 'L'.join(f'{a:.1f} {b:.1f}' for a, b in pts) + 'Z'


def ibox(x0, x1, y0, y1, z0, z1, top='#2A3F5E', left='#1A2B44', right='#13213A', extra=''):
    t = P([iso(x0, y0, z1), iso(x1, y0, z1), iso(x1, y1, z1), iso(x0, y1, z1)])
    l = P([iso(x0, y1, z0), iso(x1, y1, z0), iso(x1, y1, z1), iso(x0, y1, z1)])
    r = P([iso(x1, y0, z0), iso(x1, y1, z0), iso(x1, y1, z1), iso(x1, y0, z1)])
    return f'<path d="{l}" fill="{left}" {extra}/><path d="{r}" fill="{right}" {extra}/><path d="{t}" fill="{top}" {extra}/>'


def iline(a, b, col, w=1, op=1):
    (x1, y1), (x2, y2) = iso(*a), iso(*b)
    return f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{col}" stroke-width="{w}" stroke-opacity="{op}"/>'


def ipool(x, y, r, grad='pool'):
    cx, cy = iso(x, y)
    return f'<ellipse cx="{cx:.0f}" cy="{cy:.0f}" rx="{r*S*C30*1.4:.0f}" ry="{r*S*0.5*1.4:.0f}" fill="url(#{grad})"/>'


def lamp_pole(x, y, h=8, arm_dx=0.0, arm_dy=1.2):
    s = iline((x, y, 0), (x, y, h), '#0A121E', 3)
    s += iline((x, y, h), (x + arm_dx, y + arm_dy, h), '#0A121E', 2.4)
    lx, ly = iso(x + arm_dx, y + arm_dy, h - 0.15)
    gx, gy = iso(x + arm_dx, y + arm_dy, 0)
    s += f'<path d="M{lx-5:.0f} {ly:.0f} L{lx+5:.0f} {ly:.0f} L{gx+46:.0f} {gy:.0f} L{gx-46:.0f} {gy:.0f} Z" fill="url(#cone)" opacity=".55"/>'
    s += f'<circle cx="{lx:.0f}" cy="{ly:.0f}" r="9" fill="#FFE1A0" filter="url(#b6)"/><circle cx="{lx:.0f}" cy="{ly:.0f}" r="2.6" fill="#FFF8E6"/>'
    return s


def illus_kpp():
    R = random.Random(11); b = []
    b.append(f'<rect width="{W}" height="{H}" fill="url(#sky)"/>')
    b.append(stars(R, 160, 0, 0, W, 300))
    # далеке місто на горизонті
    x = 0; sk = []
    while x < W:
        w = R.randint(14, 40); h = R.randint(10, 70)
        sk.append(f'M{x} 330 V{330-h} H{x+w} V330 Z'); x += w + R.randint(0, 4)
    b.append(f'<path d="{"".join(sk)}" fill="#14243B"/>')
    b.append(f'<rect x="0" y="250" width="{W}" height="120" fill="#2F4A70" opacity=".25" filter="url(#b30)"/>')
    for _ in range(90):
        xx = R.uniform(0, W); yy = R.uniform(270, 328)
        b.append(f'<rect x="{xx:.0f}" y="{yy:.0f}" width="2" height="2" fill="#E9C98A" opacity="{R.uniform(.3,.8):.2f}"/>')
    # земля
    g = P([iso(-60, -60), iso(130, -60), iso(130, 130), iso(-60, 130)])
    b.append(f'<path d="{g}" fill="#0C1626"/>')
    b.append(f'<path d="{P([iso(-2,-2),iso(64,-2),iso(64,40),iso(-2,40)])}" fill="#111E31"/>')
    # плитка двору
    for i in range(0, 65, 2): b.append(iline((i, -2), (i, 40), '#18283F', 1))
    for j in range(-2, 41, 2): b.append(iline((-2, j), (64, j), '#18283F', 1))
    # дорога
    b.append(f'<path d="{P([iso(9,22),iso(18,22),iso(18,140),iso(9,140)])}" fill="#0A1220"/>')
    for j in range(42, 120, 4): b.append(iline((13.5, j), (13.5, j + 2), '#C9A35A', 2, .7))
    b.append(iline((9.3, 40), (9.3, 140), '#3A4E6C', 1.5)); b.append(iline((17.7, 40), (17.7, 140), '#3A4E6C', 1.5))
    # розмітка паркування
    for i in range(30, 60, 4): b.append(iline((i, 30), (i, 37), '#7C8BA3', 1.4, .6))
    b.append(iline((30, 37), (58, 37), '#7C8BA3', 1.4, .6))
    # стоп-лінія і «зебра» перед шлагбаумом
    for i in range(10, 17): b.append(f'<path d="{P([iso(i,41),iso(i+0.6,41),iso(i+0.6,42.2),iso(i,42.2)])}" fill="#F4F1EA" opacity=".55"/>')
    # плями світла на землі
    for (x, y, r) in [(31, 24, 4), (36, 24, 4.5), (41, 24, 4), (46, 24, 4.5), (51, 24, 4), (13, 42, 6), (21, 45, 5), (2, 38, 5), (62, 38, 5), (62, 2, 5), (30, 40, 5), (46, 40, 5)]:
        b.append(ipool(x, y, r))
    # склад
    b.append(ibox(26, 58, 4, 22, 0, 11, top='#22344F', left='#1B2D47', right='#132239'))
    # освітлення стіни знизу
    wl = P([iso(26, 22, 0), iso(58, 22, 0), iso(58, 22, 6), iso(26, 22, 6)])
    b.append(f'<linearGradient id="wl" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#E7B860" stop-opacity=".28"/><stop offset="1" stop-color="#E7B860" stop-opacity="0"/></linearGradient><path d="{wl}" fill="url(#wl)"/>')
    # профнастил
    for k in range(0, 160):
        x = 26 + k * 0.2
        b.append(iline((x, 22, 0.1), (x, 22, 10.9), '#0F1D31' if k % 2 else '#24395A', 0.8))
    for k in range(0, 90):
        y = 4 + k * 0.2
        b.append(iline((58, y, 0.1), (58, y, 10.9), '#0C1829' if k % 2 else '#1B2C46', 0.8))
    # парапет, вентиляція, ліхтарі на даху
    b.append(ibox(26, 58, 4, 4.4, 11, 11.6, '#2C4263', '#1E3150', '#18283F'))
    b.append(ibox(26, 58, 21.6, 22, 11, 11.6, '#2C4263', '#22385A', '#18283F'))
    b.append(ibox(57.6, 58, 4, 22, 11, 11.6, '#2C4263', '#22385A', '#18283F'))
    for (x, y) in [(31, 8), (37, 8), (43, 8), (49, 8), (31, 15), (37, 15), (43, 15), (49, 15)]:
        b.append(ibox(x, x + 3.6, y, y + 2.2, 11, 11.5, '#3B5A86', '#2A4467', '#1D3150'))
    for (x, y) in [(53, 9), (53, 15)]:
        b.append(ibox(x, x + 2.4, y, y + 2.4, 11, 13, '#2E4568', '#20324E', '#18273E'))
        cx, cy = iso(x + 1.2, y + 1.2, 13.02); b.append(f'<ellipse cx="{cx:.0f}" cy="{cy:.0f}" rx="12" ry="6" fill="#0E1A2B"/>')
    # ворота доків
    for i, x in enumerate([29, 34, 39, 44, 49, 54]):
        if x + 3.2 > 58: continue
        b.append(f'<path d="{P([iso(x,22,0),iso(x+3.2,22,0),iso(x+3.2,22,3.8),iso(x,22,3.8)])}" fill="#0A1322"/>')
        for k in range(1, 12):
            b.append(iline((x, 22, k * 0.32), (x + 3.2, 22, k * 0.32), '#24395A', 1))
        lx, ly = iso(x + 1.6, 22, 4.6)
        b.append(f'<circle cx="{lx:.0f}" cy="{ly:.0f}" r="10" fill="#FFD98F" opacity=".7" filter="url(#b6)"/><circle cx="{lx:.0f}" cy="{ly:.0f}" r="2.5" fill="#FFF6DF"/>')
        b.append(f'<path d="{P([iso(x+1.4,22,4.5),iso(x+1.8,22,4.5),iso(x+3.6,26,0),iso(x-0.4,26,0)])}" fill="url(#cone)" opacity=".35"/>')
        b.append(ibox(x - 0.3, x + 3.5, 22, 22.6, 0, 1.1, '#2A4060', '#1E3150', '#152540'))
    # таблички-номери доків (без тексту – плашки)
    for x in [29, 34, 39, 44, 49]:
        b.append(f'<path d="{P([iso(x+1.1,22,5.4),iso(x+2.1,22,5.4),iso(x+2.1,22,6),iso(x+1.1,22,6)])}" fill="#C9A35A"/>')
    # причепи біля доків
    for x in [34, 44]:
        b.append(ibox(x - 0.1, x + 3.3, 22.6, 34, 1.2, 5.0, '#E9E3D6', '#CFC7B6', '#B2AA98'))
        for k in range(1, 18): b.append(iline((x + 3.3, 22.6 + k * 0.62, 1.3), (x + 3.3, 22.6 + k * 0.62, 4.9), '#9C9482', 0.8))
        b.append(f'<path d="{P([iso(x-0.1,34,1.2),iso(x+3.3,34,1.2),iso(x+3.3,34,5),iso(x-0.1,34,5)])}" fill="#A79F8C"/>')
        b.append(iline((x + 1.6, 34, 1.3), (x + 1.6, 34, 4.9), '#6E6757', 1.2))
        for y in (30.6, 32.2):
            cx, cy = iso(x + 3.3, y, 0.6); b.append(f'<ellipse cx="{cx:.0f}" cy="{cy:.0f}" rx="9" ry="10" fill="#07090D"/>')
        b.append(f'<path d="{P([iso(x+3.3,26,1.2),iso(x+3.3,33.6,1.2),iso(x+3.3,33.6,1.6),iso(x+3.3,26,1.6)])}" fill="#C9A35A" opacity=".9"/>')
    # огорожа: стовпчики + сітка + колючий дріт (без агресії – рівна лінія)
    def fence(a, b_, n):
        out = []
        for i in range(n + 1):
            t = i / n; x = a[0] + (b_[0] - a[0]) * t; y = a[1] + (b_[1] - a[1]) * t
            out.append(iline((x, y, 0), (x, y, 2.6), '#2E4466', 2))
            out.append(f'<circle cx="{iso(x,y,2.6)[0]:.1f}" cy="{iso(x,y,2.6)[1]:.1f}" r="1.6" fill="#C9A35A"/>')
        for zz in [0.4, 1.0, 1.6, 2.2, 2.5]:
            out.append(iline((a[0], a[1], zz), (b_[0], b_[1], zz), '#3B5578', 0.9, .8))
        m = int(math.dist(a, b_) / 0.5)
        for i in range(m):
            t = i / m; x = a[0] + (b_[0] - a[0]) * t; y = a[1] + (b_[1] - a[1]) * t
            out.append(iline((x, y, 0.2), (x, y, 2.4), '#29405F', 0.5, .7))
        return ''.join(out)
    b.append(fence((62, -2), (62, 40), 21))
    b.append(fence((-2, 40), (9, 40), 5))
    b.append(fence((18, 40), (62, 40), 22))
    b.append(fence((-2, -2), (-2, 40), 21))
    # камери на стовпах огорожі
    for (x, y) in [(62, 10), (62, 28), (30, 40), (50, 40), (-2, 20)]:
        cx, cy = iso(x, y, 3.2)
        b.append(iline((x, y, 2.6), (x, y, 3.2), '#2E4466', 2))
        b.append(f'<rect x="{cx-7:.0f}" y="{cy-4:.0f}" width="14" height="7" rx="2" fill="#D9DEE6"/><circle cx="{cx-6:.0f}" cy="{cy-.5:.0f}" r="1.8" fill="#C0353A"/>')
    # ліхтарні стовпи
    for (x, y, dx, dy) in [(2, 38, 0, -1), (62, 38, -1, 0), (62, 2, -1, 0), (30, 39.5, 0, -1.2), (46, 39.5, 0, -1.2), (20, 47, 0, -1)]:
        b.append(lamp_pole(x, y, 8, dx, dy))
    # шлагбаум
    b.append(ibox(17.6, 18.6, 40.2, 41.2, 0, 1.4, '#C9A35A', '#9F7E3C', '#7E6230'))
    for i in range(8):
        x0 = 17.6 - (i + 1) * 0.95; x1 = x0 + 0.95
        col = ('#F4F1EA', '#C0353A')[i % 2]
        b.append(f'<path d="{P([iso(x0,40.6,1.05),iso(x1,40.6,1.05),iso(x1,40.6,1.35),iso(x0,40.6,1.35)])}" fill="{col}"/>')
    b.append(ibox(9.6, 10.0, 40.4, 40.8, 0, 1.05, '#C9A35A', '#8A6A2E', '#6A4F20'))
    # будка охорони
    b.append(ibox(19, 23.4, 41, 45.4, 0, 3.0, '#2A4060', '#22385A', '#1A2D49'))
    # вікна будки (світяться)
    def win(face, a0, a1, z0, z1):
        if face == 'L':
            pts = [iso(a0, 45.4, z0), iso(a1, 45.4, z0), iso(a1, 45.4, z1), iso(a0, 45.4, z1)]
        else:
            pts = [iso(23.4, a0, z0), iso(23.4, a1, z0), iso(23.4, a1, z1), iso(23.4, a0, z1)]
        return f'<path d="{P(pts)}" fill="#FFD98F"/><path d="{P(pts)}" fill="#FFF3D1" opacity=".45" filter="url(#b6)"/>'
    b.append(win('L', 19.4, 21.2, 1.2, 2.6)); b.append(win('L', 21.6, 23.0, 1.2, 2.6))
    b.append(win('R', 41.4, 43.0, 1.2, 2.6)); b.append(win('R', 43.4, 45.0, 1.2, 2.6))
    # силует у вікні
    px, py = iso(20.4, 45.4, 1.2); b.append(person(round(px), round(py) + 2, 26, '#5B4A2A'))
    # дах будки з виносом, антена, номер-плашка
    b.append(ibox(18.6, 23.8, 40.6, 45.8, 3.0, 3.35, '#3A5680', '#2A4467', '#22385A'))
    b.append(iline((22.6, 41.6, 3.35), (22.6, 41.6, 5.2), '#9FB8E0', 1.2))
    b.append(f'<circle cx="{iso(22.6,41.6,5.2)[0]:.0f}" cy="{iso(22.6,41.6,5.2)[1]:.0f}" r="2" fill="#E0343A"/>')
    b.append(f'<path d="{P([iso(19.6,45.4,2.75),iso(21.2,45.4,2.75),iso(21.2,45.4,2.95),iso(19.6,45.4,2.95)])}" fill="#C9A35A"/>')
    # світло з вікон будки на землю
    b.append(ipool(21, 48.5, 3.4)); b.append(ipool(26, 43, 3))
    # охоронець біля будки
    px, py = iso(18.2, 46.8); b.append(person(round(px), round(py), 34, '#04070C'))
    lx, ly = iso(18.2, 46.8, 1.4); b.append(f'<path d="M{lx+4:.0f} {ly:.0f} L{lx-90:.0f} {ly+70:.0f} L{lx-40:.0f} {ly+96:.0f} Z" fill="#FFF1CC" opacity=".16"/>')
    # авто охорони біля будки
    b.append(ibox(24.8, 26.8, 47, 51.6, 0.3, 1.25, '#2E4A72', '#1F3350', '#18294A'))
    b.append(ibox(25.0, 26.6, 48.1, 50.6, 1.25, 1.95, '#1A2638', '#16233A', '#0E1828'))
    b.append(f'<path d="{P([iso(24.8,51.6,0.7),iso(26.8,51.6,0.7),iso(26.8,51.6,0.9),iso(24.8,51.6,0.9)])}" fill="#C9A35A"/>')
    b.append(f'<path d="{P([iso(26.8,47,0.62),iso(26.8,51.6,0.62),iso(26.8,51.6,0.86),iso(26.8,47,0.86)])}" fill="#C9A35A"/>')
    for (x, y) in [(26.8, 48.1), (26.8, 50.6)]:
        cx, cy = iso(x, y, 0.35); b.append(f'<ellipse cx="{cx:.0f}" cy="{cy:.0f}" rx="6" ry="7" fill="#05070A"/>')
    hx, hy = iso(25.8, 51.6, 0.9)
    b.append(f'<path d="M{hx-8:.0f} {hy:.0f} L{hx-130:.0f} {hy+60:.0f} L{hx-40:.0f} {hy+110:.0f} L{hx+8:.0f} {hy+4:.0f} Z" fill="#FFF1CC" opacity=".18"/>')
    b.append(f'<circle cx="{hx-6:.0f}" cy="{hy:.0f}" r="5" fill="#FFF6DD" filter="url(#b2)"/><circle cx="{hx+8:.0f}" cy="{hy+4:.0f}" r="5" fill="#FFF6DD" filter="url(#b2)"/>')
    # вантажівка, що під'їжджає
    b.append(ibox(10.2, 16.8, 66, 78, 0.6, 4.4, '#D9D2C2', '#BDB4A1', '#9F9786'))
    b.append(ibox(10.4, 16.6, 61, 65.6, 0.6, 3.6, '#2B3F5E', '#22385A', '#182A44'))
    b.append(f'<path d="{P([iso(10.6,61,2.2),iso(16.4,61,2.2),iso(16.4,61,3.3),iso(10.6,61,3.3)])}" fill="#0A121D"/>')
    for x in (11, 16):
        cx, cy = iso(x, 61, 1.2); b.append(f'<circle cx="{cx:.0f}" cy="{cy:.0f}" r="6" fill="#FFF6DD" filter="url(#b2)"/>')
    tx, ty = iso(13.5, 61, 1.2)
    b.append(f'<path d="M{tx-40:.0f} {ty:.0f} L{tx+40:.0f} {ty:.0f} L{tx+210:.0f} {ty-150:.0f} L{tx+80:.0f} {ty-200:.0f} Z" fill="#FFF1CC" opacity=".12"/>')
    for (x, y) in [(16.8, 63), (16.8, 70), (16.8, 75)]:
        cx, cy = iso(x, y, 0.5); b.append(f'<ellipse cx="{cx:.0f}" cy="{cy:.0f}" rx="8" ry="9" fill="#05070A"/>')
    # кущі вздовж огорожі
    for i in range(36):
        x = R.uniform(24, 62); y = R.uniform(41, 44)
        cx, cy = iso(x, y, 0.4); r = R.uniform(5, 11)
        b.append(f'<ellipse cx="{cx:.0f}" cy="{cy:.0f}" rx="{r:.0f}" ry="{r*.7:.0f}" fill="{R.choice(["#0D1A22","#10202A","#0B1620"])}"/>')
    # туман знизу і віньєтка
    b.append(f'<rect x="0" y="{H-260}" width="{W}" height="260" fill="#0E1A2B" opacity=".55" filter="url(#b30)"/>')
    b.append(f'<radialGradient id="vig" cx=".5" cy=".5" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient><rect width="{W}" height="{H}" fill="url(#vig)"/>')
    return wrap(''.join(b), 'Ілюстрація: КПП складу вночі, ізометрія')


# ============ 2. Нічне місто і пост бізнес-центру ============
def building(R, x, w, top, base, col, lit, win=(6, 9, 4, 6), warm=True, ant=False):
    s = [f'<rect x="{x}" y="{top}" width="{w}" height="{base-top}" fill="{col}"/>']
    ww, wh, gx, gy = win
    yy = top + 8
    while yy + wh < base - 6:
        xx = x + 5
        while xx + ww < x + w - 4:
            if R.random() < lit:
                c = R.choice(['#FFD98F', '#FFE4AE', '#F6C873', '#BFD3F2'] if warm else ['#BFD3F2', '#DDE6F3'])
                s.append(f'<rect x="{xx:.0f}" y="{yy:.0f}" width="{ww}" height="{wh}" fill="{c}" opacity="{R.uniform(.45,.95):.2f}"/>')
            xx += ww + gx
        yy += wh + gy
    if ant:
        s.append(f'<line x1="{x+w/2}" y1="{top}" x2="{x+w/2}" y2="{top-30}" stroke="{col}" stroke-width="2"/><circle cx="{x+w/2}" cy="{top-30}" r="2.4" fill="#FF4A4A"/><circle cx="{x+w/2}" cy="{top-30}" r="7" fill="#FF4A4A" opacity=".35" filter="url(#b2)"/>')
    return ''.join(s)


def illus_city():
    R = random.Random(23); b = []
    b.append(f'<rect width="{W}" height="{H}" fill="url(#sky)"/>')
    b.append(stars(R, 240, 0, 0, W, 420))
    b.append('<circle cx="1240" cy="150" r="34" fill="#F4E9CC"/><circle cx="1256" cy="140" r="32" fill="#0B1525"/><circle cx="1240" cy="150" r="80" fill="#F4E9CC" opacity=".08" filter="url(#b14)"/>')
    for i in range(6):
        b.append(f'<ellipse cx="{R.uniform(0,W):.0f}" cy="{R.uniform(120,380):.0f}" rx="{R.uniform(120,300):.0f}" ry="{R.uniform(10,24):.0f}" fill="#2F4A70" opacity=".22" filter="url(#b14)"/>')
    # далекий план
    x = -10
    while x < W:
        w = R.randint(26, 60); top = R.randint(470, 580)
        b.append(building(R, x, w, top, 700, '#13233A', 0.10, (3, 4, 3, 4))); x += w + R.randint(0, 6)
    b.append(f'<rect x="0" y="540" width="{W}" height="200" fill="#2F4A70" opacity=".35" filter="url(#b30)"/>')
    # середній план
    x = -20
    while x < 1100:
        w = R.randint(50, 110); top = R.randint(380, 560)
        b.append(building(R, x, w, top, 760, R.choice(['#0F1C2F', '#112035', '#0D192A']), 0.22, (5, 7, 4, 6), ant=R.random() < .3)); x += w + R.randint(4, 18)
    # міст-естакада з ліхтарями
    b.append('<rect x="0" y="690" width="1120" height="14" fill="#0A1322"/>')
    for i in range(24):
        xx = 20 + i * 46
        b.append(f'<line x1="{xx}" y1="690" x2="{xx}" y2="664" stroke="#0A1322" stroke-width="2"/><circle cx="{xx}" cy="664" r="2.4" fill="#FFE1A0"/><circle cx="{xx}" cy="664" r="8" fill="#FFD98F" opacity=".35" filter="url(#b2)"/>')
    for i in range(14):
        xx = 40 + i * 80; b.append(f'<rect x="{xx}" y="704" width="14" height="60" fill="#0A1322"/>')
    # бізнес-центр праворуч (передній план)
    bx, bw, btop = 1100, 420, 120
    b.append(f'<linearGradient id="tower" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#22385A"/><stop offset=".55" stop-color="#162845"/><stop offset="1" stop-color="#0D1A2C"/></linearGradient>')
    b.append(f'<path d="M{bx} {btop+60} L{bx+bw*0.62} {btop} L{bx+bw} {btop+40} L{bx+bw} 800 L{bx} 800 Z" fill="url(#tower)"/>')
    # навісна стіна: сітка
    for k in range(0, 32):
        xx = bx + 12 + k * 13
        b.append(f'<line x1="{xx}" y1="{btop+70}" x2="{xx}" y2="740" stroke="#2D4A72" stroke-width="{1.6 if k%4==0 else .7}"/>')
    for k in range(0, 46):
        yy = btop + 80 + k * 13.5
        if yy > 740: break
        b.append(f'<line x1="{bx}" y1="{yy}" x2="{bx+bw}" y2="{yy}" stroke="#2D4A72" stroke-width=".8"/>')
        for c in range(32):
            if R.random() < 0.09:
                b.append(f'<rect x="{bx+13+c*13}" y="{yy+1.5}" width="11" height="10.5" fill="{R.choice(["#FFD98F","#F6C873","#BFD3F2"])}" opacity="{R.uniform(.4,.9):.2f}"/>')
    # відображення неба на склі
    b.append(f'<path d="M{bx} {btop+60} L{bx+160} {btop+30} L{bx+40} 740 L{bx} 740 Z" fill="#9FB8E0" opacity=".08"/>')
    b.append(f'<path d="M{bx+230} {btop+18} L{bx+270} {btop+12} L{bx+150} 740 L{bx+110} 740 Z" fill="#9FB8E0" opacity=".05"/>')
    # вестибюль і пост
    b.append(f'<rect x="{bx}" y="740" width="{bw}" height="70" fill="#FFD98F" opacity=".9"/>')
    b.append(f'<rect x="{bx}" y="740" width="{bw}" height="70" fill="#FFE9B8" opacity=".6" filter="url(#b14)"/>')
    for k in range(9): b.append(f'<rect x="{bx+k*48}" y="740" width="5" height="70" fill="#2A3442"/>')
    b.append(f'<rect x="{bx-20}" y="728" width="{bw+40}" height="14" fill="#0F1C2F"/><rect x="{bx-20}" y="740" width="{bw+40}" height="3" fill="#C9A35A"/>')
    b.append(f'<rect x="{bx+150}" y="784" width="120" height="26" fill="#2B2418"/>')  # стійка ресепшн
    b.append(person(bx + 210, 790, 40, '#3A2E1A'))
    # будка-пост на вулиці + охоронець
    b.append('<rect x="1010" y="740" width="70" height="72" fill="#1A2B44"/><rect x="1004" y="734" width="82" height="8" fill="#2A4060"/><rect x="1018" y="752" width="54" height="30" fill="#FFD98F"/><rect x="1018" y="752" width="54" height="30" fill="#FFF3D1" opacity=".5" filter="url(#b6)"/>')
    b.append('<rect x="1030" y="790" width="30" height="4" fill="#C9A35A"/>')
    b.append(person(1100, 846, 62, '#03060A'))
    # вулиця
    b.append(f'<linearGradient id="road2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B1524"/><stop offset="1" stop-color="#05090F"/></linearGradient><rect x="0" y="812" width="{W}" height="{H-812}" fill="url(#road2)"/>')
    b.append(f'<rect x="0" y="812" width="{W}" height="6" fill="#22344F"/><rect x="0" y="836" width="{W}" height="2" fill="#2C3E5A"/>')
    # стовпчики
    for i in range(10):
        xx = 1120 + i * 46
        b.append(f'<rect x="{xx}" y="820" width="9" height="28" rx="3" fill="#18283F"/><rect x="{xx}" y="824" width="9" height="3" fill="#C9A35A"/>')
    # відображення на мокрому асфальті
    for i in range(40):
        xx = R.uniform(0, 1100); w = R.uniform(2, 6)
        b.append(f'<rect x="{xx:.0f}" y="{R.uniform(850,960):.0f}" width="{w:.0f}" height="{R.uniform(20,80):.0f}" fill="#FFD98F" opacity="{R.uniform(.05,.18):.2f}" filter="url(#b2)"/>')
    b.append(f'<rect x="{bx}" y="850" width="{bw}" height="120" fill="#FFD98F" opacity=".12" filter="url(#b14)"/>')
    for k in range(12):
        b.append(f'<line x1="{60+k*130}" y1="920" x2="{120+k*130}" y2="920" stroke="#C9A35A" stroke-width="4" opacity=".6"/>')
    # ліхтарі вулиці
    for xx in (120, 420, 720, 980):
        b.append(f'<line x1="{xx}" y1="830" x2="{xx}" y2="640" stroke="#0A1322" stroke-width="5"/><line x1="{xx}" y1="642" x2="{xx+34}" y2="636" stroke="#0A1322" stroke-width="4"/>')
        b.append(f'<path d="M{xx+28} 640 L{xx+40} 640 L{xx+110} 830 L{xx-40} 830 Z" fill="url(#cone)" opacity=".5"/><circle cx="{xx+34}" cy="640" r="12" fill="#FFE1A0" filter="url(#b6)"/><circle cx="{xx+34}" cy="640" r="3" fill="#FFF8E6"/>')
        b.append(f'<ellipse cx="{xx+34}" cy="840" rx="110" ry="16" fill="url(#pool)"/>')
    # авто охорони
    emb = f'<g transform="translate(410 -240) scale(.13)">{"".join(E.svg_color("a", p="ct", glare=False))}</g>'
    b.append(car('c2', 'plain', emb, scale=0.5, tx=500, ty=884))
    b.append(f'<rect x="500" y="884" width="450" height="60" fill="#1F3350" opacity=".25" filter="url(#b14)"/>')
    b.append(f'<radialGradient id="vig2" cx=".5" cy=".45" r=".8"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></radialGradient><rect width="{W}" height="{H}" fill="url(#vig2)"/>')
    return wrap(''.join(b), 'Ілюстрація: нічне місто, бізнес-центр і пост охорони')


# ============ 3. Авто охорони на нічній вулиці ============
def illus_car():
    R = random.Random(5); b = []
    b.append(f'<rect width="{W}" height="{H}" fill="#08101B"/>')
    # фасади: вітрини з ролетами, вікна, ліхтарі
    x = 0
    while x < W:
        w = R.randint(260, 380); col = R.choice(['#101D30', '#13223A', '#0E1A2B'])
        b.append(f'<rect x="{x}" y="0" width="{w}" height="700" fill="{col}"/>')
        b.append(f'<rect x="{x}" y="0" width="3" height="700" fill="#0A1322"/>')
        for r in range(4):
            for c in range(int(w // 70)):
                wx = x + 20 + c * 70; wy = 40 + r * 120
                lit = R.random() < 0.3
                b.append(f'<rect x="{wx}" y="{wy}" width="44" height="74" fill="{"#F6C873" if lit else "#0A1322"}" opacity="{.85 if lit else 1}"/>')
                if lit:
                    b.append(f'<rect x="{wx}" y="{wy}" width="44" height="74" fill="#FFE4AE" opacity=".35" filter="url(#b6)"/><rect x="{wx+21}" y="{wy}" width="2" height="74" fill="#5A4422"/>')
                else:
                    b.append(f'<rect x="{wx+3}" y="{wy+3}" width="38" height="2" fill="#22344F"/>')
                b.append(f'<rect x="{wx-4}" y="{wy+74}" width="52" height="5" fill="#1C2D47"/>')
        # вітрина з ролетою
        b.append(f'<rect x="{x+20}" y="540" width="{w-40}" height="150" fill="#16263D"/>')
        for k in range(30): b.append(f'<rect x="{x+20}" y="{542+k*5}" width="{w-40}" height="1.4" fill="#22385A"/>')
        b.append(f'<rect x="{x+20}" y="520" width="{w-40}" height="18" fill="#0B1424"/>')
        x += w
    # світло ліхтаря на фасаді
    for xx in (300, 900, 1450):
        b.append(f'<ellipse cx="{xx}" cy="520" rx="260" ry="200" fill="url(#pool)" opacity=".7"/>')
        b.append(f'<line x1="{xx}" y1="790" x2="{xx}" y2="430" stroke="#070D16" stroke-width="8"/><path d="M{xx-6} 432 h40 v10 h-40 Z" fill="#070D16"/><circle cx="{xx+26}" cy="446" r="16" fill="#FFE1A0" filter="url(#b6)"/><circle cx="{xx+26}" cy="446" r="4" fill="#FFF8E6"/>')
        b.append(f'<path d="M{xx+14} 446 L{xx+38} 446 L{xx+170} 790 L{xx-120} 790 Z" fill="url(#cone)" opacity=".45"/>')
    # тротуар і бордюр
    b.append(f'<rect x="0" y="700" width="{W}" height="70" fill="#1A2638"/>')
    for k in range(0, W, 64): b.append(f'<rect x="{k}" y="700" width="1.5" height="70" fill="#243652"/>')
    b.append(f'<rect x="0" y="766" width="{W}" height="10" fill="#2A3B55"/>')
    # дорога, мокра
    b.append(f'<linearGradient id="road3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0D1828"/><stop offset="1" stop-color="#04070C"/></linearGradient><rect x="0" y="776" width="{W}" height="{H-776}" fill="url(#road3)"/>')
    # відображення авто (віддзеркалене, розмите)
    emb = f'<g transform="translate(400 -250) scale(.14)">{"".join(E.svg_color("a", p="c3e", glare=False))}</g>'
    wordp = E.F.line('ШТУРМОВА ВАРТА', 590, -212, 22, 0.08)
    word = f'<path fill="#F4F1EA" d="{d(wordp)}"/>'
    phone = f'<path fill="#C9A35A" d="{d(E.FS.line("+380 67 549 5710", 596, -178, 16, 0.06))}"/>'
    b.append(f'<g transform="translate(0 1752) scale(1 -1)" opacity=".28" filter="url(#b6)">{car("c3r", "plain", "", headlights=False, scale=1.05, tx=420, ty=880)}</g>')
    b.append(car('c3', 'guilloche', emb, word, phone, headlights=True, scale=1.05, tx=420, ty=876))
    # блики на дорозі
    for i in range(30):
        xx = R.uniform(0, W)
        b.append(f'<rect x="{xx:.0f}" y="{R.uniform(890,990):.0f}" width="{R.uniform(2,5):.0f}" height="{R.uniform(16,60):.0f}" fill="{R.choice(["#FFD98F","#9FB8E0"])}" opacity="{R.uniform(.06,.2):.2f}" filter="url(#b2)"/>')
    for k in range(9):
        b.append(f'<rect x="{k*190-40}" y="960" width="110" height="5" fill="#C9A35A" opacity=".35"/>')
    # дощ – дрібні штрихи
    rain = ''.join(f'<line x1="{(xx:=R.uniform(0,W)):.0f}" y1="{(yy:=R.uniform(0,H)):.0f}" x2="{xx-4:.0f}" y2="{yy+18:.0f}"/>' for _ in range(260))
    b.append(f'<g stroke="#BFD3F2" stroke-opacity=".18" stroke-width="1">{rain}</g>')
    b.append(f'<radialGradient id="vig3" cx=".5" cy=".55" r=".8"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".65"/></radialGradient><rect width="{W}" height="{H}" fill="url(#vig3)"/>')
    return wrap(''.join(b), 'Ілюстрація: авто охорони на нічній вулиці')


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    open(os.path.join(OUT, 'illus-1-kpp.svg'), 'w').write(illus_kpp())
    open(os.path.join(OUT, 'illus-2-city.svg'), 'w').write(illus_city())
    open(os.path.join(OUT, 'illus-3-car.svg'), 'w').write(illus_car())
    print('ok')
