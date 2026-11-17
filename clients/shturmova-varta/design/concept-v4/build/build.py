# Збирає всі SVG концепції v4 + дані для 3D. Запуск: python3 build.py
import os, json, math, re
from prims import *
from marks import MARKS, NAMES, R2
from letters import word

ROOT = os.path.dirname(HERE)
def out(rel, txt):
    p = os.path.join(ROOT, rel); os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, 'w').write(txt); return p

PLEX = Font('IBMPlexSans-SemiBold.ttf')
DESC = 'ОХОРОННА КОМПАНІЯ'


def parts(k):
    """(основа, акцент) – акцент латунню в кольоровій версії."""
    m = MARKS[k]()
    if k == 'b':
        cs = sorted(list(m.contours), key=lambda c: c.bounds[0])
        base = U(cs[0], cs[2]); acc = cs[1]
        return base, acc
    if k == 'c':
        from marks import owl_layers
        L = owl_layers()
        return L['head'], L['pupils']
    return m, None


def g(path, fill, t=''):
    return f'<path d="{to_d(path)}" fill="{fill}"{t}/>'


def mark_svg(k, base_c, acc_c, bg=None, size=120, title=''):
    base, acc = parts(k)
    body = (f'<rect width="120" height="120" fill="{bg}"/>' if bg else '') + g(base, base_c) + (g(acc, acc_c) if acc is not None else '')
    return svg(size, size, body, title, vb='0 0 120 120')


# ---------- написання ----------
STYLE = {'a': 'A', 'b': 'B', 'c': 'C'}


def wordline(k, cap):
    m, w = word('ШТУРМОВА ВАРТА', STYLE[k], cap=cap)
    return m, w


def stack2(k, cap, gap):
    l1, w1 = word('ШТУРМОВА', STYLE[k], cap=cap)
    l2, w2 = word('ВАРТА', STYLE[k], cap=cap)
    l2 = move(l2, 0, cap + gap)
    return U(l1, l2), max(w1, w2)


def desc_path(x, base, cap, track=0.2, text=DESC):
    return PLEX.text(text, x, base, cap, track)


# ---------- 1. знаки ----------
def build_marks():
    for k in MARKS:
        n = NAMES[k]
        out(f'mark/{k}-mark-color.svg', mark_svg(k, NIGHT, BRASS, title=f'Штурмова варта – знак «{n}», кольоровий'))
        out(f'mark/{k}-mark-inverse.svg', mark_svg(k, LIGHT, BRASS, title=f'Штурмова варта – знак «{n}», інверсний (для темного тла)'))
        out(f'mark/{k}-mark-mono-black.svg', mark_svg(k, INK, INK, title=f'Штурмова варта – знак «{n}», монохромний чорний'))
        out(f'mark/{k}-mark-mono-white.svg', mark_svg(k, '#FFFFFF', '#FFFFFF', title=f'Штурмова варта – знак «{n}», монохромний білий'))
        base, acc = parts(k)
        fc = {'a': (BRASS, BRASS), 'b': (LIGHT, BRASS), 'c': (BRASS, LIGHT)}[k]
        body = f'<rect x="-14" y="-14" width="148" height="148" fill="{NIGHT}"/>' + g(base, fc[0]) + (g(acc, fc[1]) if acc is not None else '')
        if k == 'c':   # на 16 px зіниці – темні крапки в світлих очах: очі «прорізані» до тла, тому малюємо їх світлим
            pass
        out(f'mark/{k}-favicon.svg', svg(120, 120, body, f'Штурмова варта – фавікон «{n}»', vb='-14 -14 148 148'))
        body2 = f'<rect x="-40" y="-40" width="200" height="200" fill="{NIGHT}"/>' + g(base, fc[0]) + (g(acc, fc[1]) if acc is not None else '')
        out(f'mark/{k}-avatar.svg', svg(200, 200, body2, f'Штурмова варта – аватарка «{n}»', vb='-40 -40 200 200'))


# ---------- 2. написання і знак+написання ----------
def build_lockups():
    for k in MARKS:
        n = NAMES[k]
        base, acc = parts(k)
        # знак + двоярусне написання: верх першого рядка = верх знака, база другого = низ знака
        cap = 48; gap = 24; gx = 34
        st, sw = stack2(k, cap, gap)
        st = move(st, 120 + gx, 0)
        W = 120 + gx + sw
        for mode, (mc, ac, tc) in {'light': (NIGHT, BRASS, NIGHT), 'dark': (LIGHT, BRASS, LIGHT)}.items():
            body = g(base, mc) + (g(acc, ac) if acc is not None else '') + g(st, tc)
            out(f'lockup/{k}-lockup-{mode}.svg', svg(round(W), 120, body, f'Штурмова варта – знак «{n}» і написання, {"світле" if mode == "light" else "темне"} тло', vb=f'0 0 {W:.1f} 120'))
        # горизонтальна версія в один рядок + дескриптор
        cap1 = 40
        wl, ww = wordline(k, cap1)
        wl = move(wl, 120 + gx, 30)
        dp, dw = desc_path(120 + gx, 92, 10.5, 0.36)
        Wh = 120 + gx + ww
        for mode, (mc, ac, tc) in {'light': (NIGHT, BRASS, NIGHT), 'dark': (LIGHT, BRASS, LIGHT)}.items():
            body = g(base, mc) + (g(acc, ac) if acc is not None else '') + g(wl, tc) + g(dp, BRASS if mode == 'dark' else '#7A5C24')
            out(f'lockup/{k}-lockup-line-{mode}.svg', svg(round(Wh), 120, body, f'Штурмова варта – горизонтальний логотип «{n}»', vb=f'0 0 {Wh:.1f} 120'))
        # суто шрифтовий логотип
        capw = 60
        wl, ww = wordline(k, capw)
        dcap = 12; dbase = capw + 30
        dp, dw = desc_path(0, dbase, dcap, 0.34)
        kp, kw = desc_path(0, dbase, dcap, 0.34, 'КИЇВ')
        kp = move(kp, ww - kw, 0)
        rule = rect(dw + 16, dbase - dcap / 2 - 0.7, ww - kw - dw - 32, 1.4)
        dp = U(dp, kp, rule)
        Hh = capw + 31
        for mode, (tc, dc) in {'light': (NIGHT, '#7A5C24'), 'dark': (LIGHT, BRASS)}.items():
            body = g(wl, tc) + g(dp, dc)
            out(f'wordmark/{k}-wordmark-{mode}.svg', svg(round(ww), Hh, body, f'Штурмова варта – шрифтовий логотип «{n}»', vb=f'0 -1 {ww:.1f} {Hh + 2}'))
        # двоярусне написання без знака
        st2, sw2 = stack2(k, 60, 26)
        for mode, tc in {'light': NIGHT, 'dark': LIGHT}.items():
            out(f'wordmark/{k}-wordmark-stack-{mode}.svg', svg(round(sw2), 146, g(st2, tc), f'Штурмова варта – шрифтовий логотип у два рядки «{n}»', vb=f'0 0 {sw2:.1f} 146'))


# ---------- 3. нашивки ----------
def patch_shape(k):
    if k == 'a':   # вертикальна пластина з великими радіусами – як чаші «В»
        W, Hh = 240, 300
        return rrect(0, 0, W, Hh, 34), W, Hh
    if k == 'b':   # горизонтальна нашивка-вказівник: правий край – вістря 90°
        W, Hh = 400, 170
        return poly([(0, 0), (W - Hh / 2, 0), (W, Hh / 2), (W - Hh / 2, Hh), (0, Hh)]), W, Hh
    W, Hh = 240, 300   # C: прямокутна пластина з V-вирізом угорі, як «вушка» сови; низ прямий (не щит)
    return U(D(rrect(0, 0, W, Hh, (0, 0, 14, 14)), poly([(28, -1), (W / 2, 28), (W - 28, -1)]))), W, Hh


def inset(p, d):
    """Внутрішній контур на відстані d (через обведення pathops)."""
    s = Path(); s.addPath(p)
    st = Path(); st.addPath(p); st.stroke(2 * d, pathops.LineCap.BUTT_CAP, pathops.LineJoin.MITER_JOIN, 10)
    return D(p, st)


def patch_layers(k):
    shp, W, Hh = patch_shape(k)
    field = inset(shp, 9)
    base, acc = parts(k)
    if k in ('a', 'c'):
        ms = 0.9 if k == 'a' else 0.9
        mx = (W - 120 * ms) / 2; my = 50 if k == 'a' else 62
        mk = tf(base, ms, 0, 0, ms, mx, my); ac = tf(acc, ms, 0, 0, ms, mx, my) if acc is not None else None
        wl1, w1 = word('ШТУРМОВА', STYLE[k], cap=22); wl2, w2 = word('ВАРТА', STYLE[k], cap=22)
        yb = my + 120 * ms + 30
        wl1 = move(wl1, (W - w1) / 2, yb); wl2 = move(wl2, (W - w2) / 2, yb + 22 + 16)
        words = U(wl1, wl2)
    else:
        ms = 1.0; mx = 30; my = 25
        mk = move(base, mx, my); ac = move(acc, mx, my)
        wl1, w1 = word('ШТУРМОВА', 'B', cap=22); wl2, w2 = word('ВАРТА', 'B', cap=22)
        x0 = mx + 120 + 24
        wl1 = move(wl1, x0, 54); wl2 = move(wl2, x0, 54 + 22 + 18)
        words = U(wl1, wl2)
    whites = None
    if k == 'c':
        from marks import owl_layers
        whites = tf(owl_layers()['whites'], ms, 0, 0, ms, mx, my)
    return dict(shape=shp, field=field, mark=mk, acc=ac, words=words, W=W, H=Hh, whites=whites)


def build_patches():
    for k in MARKS:
        L = patch_layers(k); W, Hh = L['W'], L['H']; n = NAMES[k]
        for mode in ('color', 'mono'):
            if mode == 'color':
                body = g(L['shape'], BRASS) + g(L['field'], NIGHT) + g(L['mark'], BRASS) + (g(D(L['whites'], L['acc']), LIGHT) + g(L['acc'], NIGHT) if k == 'c' else (g(L['acc'], LIGHT) if L['acc'] is not None else '')) + g(L['words'], LIGHT)
            else:
                ring = D(L['shape'], L['field'])
                body = g(ring, INK) + g(L['mark'], INK) + (g(L['acc'], INK) if L['acc'] is not None else '') + g(L['words'], INK)
            out(f'emblem/{k}-patch-{mode}.svg', svg(W, Hh, body, f'Штурмова варта – нашивка «{n}», {"кольорова" if mode == "color" else "монохромна"}', vb=f'0 0 {W} {Hh}'))


# ---------- 4. 3D-дані ----------
def build_3d():
    data = {}
    for k in MARKS:
        L = patch_layers(k); W, Hh = L['W'], L['H']
        s = 8.0 / max(W, Hh); cx, cy = W / 2, Hh / 2
        d = {'rim': to_three(L['shape'], cx, cy, s), 'ring': to_three(D(L['shape'], L['field']), cx, cy, s), 'field': to_three(L['field'], cx, cy, s),
             'mark': to_three(L['mark'], cx, cy, s), 'words': to_three(L['words'], cx, cy, s, steps=6)}
        if L['acc'] is not None: d['acc'] = to_three(L['acc'], cx, cy, s)
        if L.get('whites') is not None: d['whites'] = to_three(D(L['whites'], L['acc']), cx, cy, s)
        # окремо – сам знак без пластини
        base, acc = parts(k); s2 = 6.0 / 120
        d['solo'] = to_three(base, 60, 60, s2)
        if acc is not None: d['soloAcc'] = to_three(acc, 60, 60, s2)
        data[k] = d
    out('3d/data-v4.js', 'window.SV4=' + json.dumps(data, separators=(',', ':')) + ';\n')


# ---------- 5. авто ----------
def car_svg(k, uid):
    from car4 import car
    base, acc = parts(k)
    n = NAMES[k]
    st, sw = stack2(k, 48, 24)
    lock = U(base, move(st, 154, 0))
    lw = 154 + sw
    # знак+написання на передніх дверях
    sc = 196 / lw
    tx, ty = 346, -152
    emb = f'<g transform="translate({tx} {ty}) scale({sc:.4f})">' + g(base, LIGHT) + (g(acc, BRASS) if acc is not None else '') + g(move(st, 154, 0), LIGHT) + '</g>'
    ph, pw = PLEX.text('+380 67 549 5710', 0, 0, 14, 0.04)
    phone = f'<g transform="translate(346 -72)">' + g(ph, LIGHT) + '</g>'
    extra = ''
    if k == 'b':   # шеврони-просвіти як фірмова стрічка вздовж поясної лінії
        tips = [98 + 37 * i for i in range(-1, 22)]
        pat = D(rect(0, 0, 820, 120), *[poly([(t - 60, -1), (t - 60 + 10.5 * R2, -1), (t + 10.5 * R2, 60), (t - 60 + 10.5 * R2, 121), (t - 60, 121), (t, 60)]) for t in tips])
        extra = f'<clipPath id="cl{uid}"><path d="M560 -200 H890 V-140 H560 Z"/></clipPath><g clip-path="url(#cl{uid})"><g transform="translate(590 -190) scale(.34)">' + g(pat, BRASS) + '</g></g>'
    if k == 'c':
        from marks import owl_layers
        OL = owl_layers()
        extra = f'<g transform="translate(636 -200) scale(.56)">' + g(OL['head'], BRASS) + g(OL['eyes'], LIGHT) + g(OL['pupils'], NIGHT) + '</g>'
    if k == 'a':
        extra = '<path d="M214 -167 L884 -177 L884 -173 L214 -163 Z" fill="#C9A35A"/>'
    return car(uid, emblem_svg=extra + emb, phone=phone)


def build_cars():
    for k in MARKS:
        body = f'<rect width="1000" height="420" fill="#E9E5DC"/><rect y="372" width="1000" height="48" fill="#D8D2C5"/>' + car_svg(k, f'c{k}').replace('<g transform="translate(0 0) scale(1.0)">', '<g transform="translate(50 380)">', 1)
        out(f'carriers/{k}-car.svg', svg(1000, 420, body, f'Штурмова варта – борт позашляховика, знак «{NAMES[k]}»'))


if __name__ == '__main__':
    build_marks(); build_lockups(); build_patches(); build_3d(); build_cars()
    for k in MARKS:
        print(k, 'вузлів у знаку:', node_count(MARKS[k]()))
    print('ok')


# ---------- 6. креслення побудови ----------
def build_construction():
    G = '#0E1A2B'; C = '#B0802F'
    def grid():
        s = ['<g stroke="#0E1A2B" stroke-opacity=".10" stroke-width=".25">']
        for i in range(0, 121, 5):
            s.append(f'<path d="M{i} -10V130M-10 {i}H130"/>')
        s.append('</g><g stroke="#0E1A2B" stroke-opacity=".22" stroke-width=".35">')
        for i in range(0, 121, 30):
            s.append(f'<path d="M{i} -10V130M-10 {i}H130"/>')
        s.append('</g>')
        return ''.join(s)
    def circ(cx, cy, r, dash=False):
        return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{C}" stroke-width=".45"{" stroke-dasharray=\"1.5 1.2\"" if dash else ""}/><circle cx="{cx}" cy="{cy}" r=".9" fill="{C}"/>'
    def line(x1, y1, x2, y2, dash=True):
        return f'<path d="M{x1} {y1}L{x2} {y2}" stroke="{C}" stroke-width=".45" fill="none"{" stroke-dasharray=\"2 1.4\"" if dash else ""}/>'
    for k in MARKS:
        m = MARKS[k]()
        body = f'<rect x="-14" y="-14" width="148" height="148" fill="#F4F1EA"/>' + grid() + f'<path d="{to_d(m)}" fill="{G}" fill-opacity=".9"/>'
        if k == 'a':
            body += circ(82, 33, 33) + circ(81.5, 33, 19, True) + circ(84, 86, 34) + circ(83.5, 86, 20, True)
            for x in (15, 30, 45, 60, 75): body += line(x, -8, x, 128)
            for y in (14, 52, 66, 106): body += line(-8, y, 128, y)
        if k == 'b':
            for tx in (98, 61):
                body += line(tx - 70, -10, tx + 0, 60) + line(tx, 60, tx - 70, 130)
            body += line(0, 0, 120, 120) + line(0, 120, 120, 0) + line(-8, 60, 128, 60)
            body += f'<path d="M91 53 A10 10 0 0 1 91 67" fill="none" stroke="{C}" stroke-width=".45"/>'
            body += circ(60, 60, 60, True)
        if k == 'c':
            body += circ(33, 70, 21) + circ(87, 70, 21) + circ(37, 74, 8, True) + circ(83, 74, 8, True)
            body += line(-6, 43.2, 60, 59) + line(60, 59, 126, 43.2)
            body += line(0, 0, 60, 24) + line(60, 24, 120, 0)
            body += line(-6, 84, 42, 132) + line(126, 84, 78, 132) + line(60, -8, 60, 128)
            body += line(-8, 70, 128, 70)
        out(f'construction/{k}-construction.svg', svg(560, 560, body, f'Штурмова варта – побудова знака «{NAMES[k]}»', vb='-14 -14 148 148'))


if __name__ == '__main__':
    build_construction()
