# Авто охорони (позашляховик, вид збоку) для ілюстрацій і носіїв. Локальні координати: x 0..900, земля y=0.
import math
from geom import d, Font, disc, box
from shapely.geometry import Polygon
from shapely.ops import unary_union

WF = (190, -82); WR = (716, -82)


def body_path():
    return ('M24 -44 C10 -50 6 -66 8 -84 L12 -118 C14 -132 24 -142 44 -148 L250 -176 C276 -180 296 -186 312 -196 '
            'L392 -286 C402 -298 418 -306 440 -308 L748 -310 C780 -310 806 -302 826 -284 L866 -238 C878 -224 886 -206 888 -186 '
            'L892 -96 C893 -70 888 -52 876 -44 L812 -44 A98 98 0 0 0 620 -44 L286 -44 A98 98 0 0 0 94 -44 Z')


def glass_path():
    return 'M330 -190 L406 -280 C412 -288 422 -292 434 -292 L746 -293 C772 -293 794 -286 810 -272 L846 -232 C850 -226 850 -214 846 -206 L842 -196 Z'


def car(uid, livery='plain', emblem_svg='', word=None, phone=None, headlights=True, scale=1.0, tx=0, ty=0):
    """Повертає SVG-групу. livery: plain | guilloche | metal | skyline."""
    s = [f'<g transform="translate({tx} {ty}) scale({scale})">']
    s.append(f'''<defs>
<linearGradient id="{uid}body" x1="0" y1="-310" x2="0" y2="-40" gradientUnits="userSpaceOnUse">
<stop offset="0" stop-color="#2B4568"/><stop offset=".28" stop-color="#1F3350"/><stop offset=".42" stop-color="#3A5A85"/>
<stop offset=".47" stop-color="#1A2C47"/><stop offset="1" stop-color="#0B1524"/></linearGradient>
<linearGradient id="{uid}glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22324A"/><stop offset=".5" stop-color="#0A121D"/><stop offset="1" stop-color="#162438"/></linearGradient>
<linearGradient id="{uid}stripe" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8E6A2C"/><stop offset=".3" stop-color="#E9CF8F"/><stop offset=".55" stop-color="#B8904A"/><stop offset=".8" stop-color="#F3DFA6"/><stop offset="1" stop-color="#9A7535"/></linearGradient>
<radialGradient id="{uid}rim" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#C8CCD2"/><stop offset=".6" stop-color="#6B727C"/><stop offset="1" stop-color="#2C3138"/></radialGradient>
<linearGradient id="{uid}beam" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#FFF1CC" stop-opacity=".55"/><stop offset="1" stop-color="#FFF1CC" stop-opacity="0"/></linearGradient>
<clipPath id="{uid}bc"><path d="{body_path()}"/></clipPath>
<filter id="{uid}blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
</defs>''')
    # тінь під авто
    s.append(f'<ellipse cx="452" cy="2" rx="470" ry="14" fill="#000" opacity=".55" filter="url(#{uid}blur)"/>')
    if headlights:
        s.append(f'<path d="M14 -112 L-420 -60 L-420 30 L10 -96 Z" fill="url(#{uid}beam)" opacity=".7"/>')
    s.append(f'<path d="{body_path()}" fill="url(#{uid}body)"/>')
    s.append(f'<g clip-path="url(#{uid}bc)">')
    # лівреї
    if livery in ('guilloche', 'metal', 'skyline', 'plain'):
        s.append(f'<path d="M0 -128 L900 -138 L900 -104 L0 -96 Z" fill="url(#{uid}stripe)"/>')
        s.append('<path d="M0 -92 L900 -100 L900 -96 L0 -88 Z" fill="#C9A35A" opacity=".8"/>')
    if livery == 'guilloche':
        for i in range(10):
            pts = ' '.join(f'{x},{-74 + i*2.6 + 5*math.sin(x/14 + i*0.7):.1f}' for x in range(0, 901, 6))
            s.append(f'<polyline points="{pts}" fill="none" stroke="#C9A35A" stroke-opacity=".45" stroke-width="1"/>')
    if livery == 'skyline':
        import random; R = random.Random(7); x = 0; sk = []
        while x < 900:
            w = R.randint(16, 46); h = R.randint(14, 58)
            sk.append(f'M{x} -44 V{-44 - h} H{x + w} V-44 Z'); x += w + R.randint(0, 6)
        s.append(f'<path d="{"".join(sk)}" fill="#C9A35A" opacity=".55"/>')
    if livery == 'metal':
        s.append(f'<path d="M0 -300 L900 -300 L900 -240 L0 -230 Z" fill="#fff" opacity=".05"/>')
    # відблиск плеча
    s.append('<path d="M40 -150 C300 -182 600 -190 890 -186 L890 -176 C600 -180 300 -172 40 -142 Z" fill="#9FB8E0" opacity=".35"/>')
    s.append('</g>')
    # скло
    s.append(f'<path d="{glass_path()}" fill="url(#{uid}glass)"/>')
    s.append('<path d="M450 -292 L520 -292 L470 -196 L400 -196 Z" fill="#fff" opacity=".07"/><path d="M600 -293 L630 -293 L585 -196 L555 -196 Z" fill="#fff" opacity=".05"/>')
    s.append('<path d="M556 -293 h18 v97 h-18 Z M724 -293 h22 l10 97 h-26 Z" fill="#0B1320"/>')
    s.append('<path d="M330 -190 L846 -200" stroke="#0B1320" stroke-width="3"/>')
    # рейлінги і маячок
    s.append('<path d="M440 -312 L760 -314" stroke="#1A1F27" stroke-width="7" stroke-linecap="round"/>')
    s.append('<rect x="520" y="-336" width="150" height="20" rx="6" fill="#121C2B"/><rect x="528" y="-333" width="40" height="12" rx="3" fill="#E59B3A" opacity=".85"/><rect x="622" y="-333" width="40" height="12" rx="3" fill="#E59B3A" opacity=".85"/><rect x="574" y="-333" width="42" height="12" rx="3" fill="#C9D3E2" opacity=".6"/>')
    # шви дверей, ручки, дзеркало
    s.append('<path d="M330 -192 C328 -150 326 -100 332 -48 M566 -196 C566 -140 566 -96 568 -48 M760 -200 C770 -150 774 -110 780 -60" fill="none" stroke="#08101B" stroke-width="2.4"/>')
    s.append('<rect x="508" y="-178" width="40" height="8" rx="4" fill="#0A111C"/><rect x="730" y="-180" width="40" height="8" rx="4" fill="#0A111C"/>')
    s.append('<path d="M318 -196 C302 -206 296 -222 312 -228 L344 -224 L340 -196 Z" fill="#162740"/>')
    # світло
    s.append('<path d="M14 -118 C20 -128 40 -136 72 -140 L76 -128 C50 -124 30 -118 18 -108 Z" fill="#FFF6DD"/>')
    s.append(f'<ellipse cx="40" cy="-122" rx="40" ry="14" fill="#FFF1CC" opacity=".55" filter="url(#{uid}blur)"/>')
    s.append('<path d="M884 -214 L890 -150 L878 -150 L872 -206 Z" fill="#E0343A"/>')
    s.append(f'<ellipse cx="884" cy="-182" rx="14" ry="34" fill="#FF3B3B" opacity=".45" filter="url(#{uid}blur)"/>')
    s.append('<path d="M8 -70 L60 -66 L58 -58 L8 -60 Z" fill="#0A111C"/><path d="M840 -70 L890 -72 L890 -62 L842 -60 Z" fill="#0A111C"/>')
    # колеса
    for i, (cx, cy) in enumerate((WF, WR)):
        s.append(f'<circle cx="{cx}" cy="{cy}" r="86" fill="#07090D"/><circle cx="{cx}" cy="{cy}" r="82" fill="#14171C"/>')
        s.append(f'<circle cx="{cx}" cy="{cy}" r="56" fill="url(#{uid}rim)"/>')
        sp = []
        for k in range(10):
            a = 2 * math.pi * k / 10
            a1, a2 = a - 0.11, a + 0.11
            sp.append(f'M{cx + 14*math.cos(a1):.1f} {cy + 14*math.sin(a1):.1f} L{cx + 52*math.cos(a - 0.07):.1f} {cy + 52*math.sin(a - 0.07):.1f} L{cx + 52*math.cos(a + 0.07):.1f} {cy + 52*math.sin(a + 0.07):.1f} L{cx + 14*math.cos(a2):.1f} {cy + 14*math.sin(a2):.1f} Z')
        s.append(f'<circle cx="{cx}" cy="{cy}" r="50" fill="#1B1F26"/><path d="{"".join(sp)}" fill="#A9B0BA"/>')
        s.append(f'<circle cx="{cx}" cy="{cy}" r="15" fill="#C9A35A"/><circle cx="{cx}" cy="{cy}" r="6" fill="#0E1A2B"/>')
        s.append(f'<path d="M{cx-60} {cy-58} A84 84 0 0 1 {cx+60} {cy-58}" fill="none" stroke="#fff" stroke-opacity=".08" stroke-width="3"/>')
    # емблема на дверях
    if emblem_svg:
        s.append(emblem_svg)
    if word:
        s.append(word)
    if phone:
        s.append(phone)
    s.append('</g>')
    return ''.join(s)
