# Збирає design/brand-concept-v4.html. Запуск: python3 page.py (після build.py)
import os
HERE = os.path.dirname(os.path.abspath(__file__))
DESIGN = os.path.dirname(os.path.dirname(HERE))
V = 'concept-v4'

REFS = [
    ('Pentagram – Electronic Frontier Foundation', 'https://pentagram.com/work/electronic-frontier-foundation', 'Ідентичність стиснута до однієї сильної монограми: літери і є знаком, без емблемних прикрас.'),
    ('Koto – Microsoft Security', 'https://designcompass.org/en/2025/05-1tp-3tea/30/ms-security/', 'Безпека без щитів, замків і темряви: впевнена спокійна мова замість залякування.'),
    ('Pentagram – SimpliSafe', 'https://www.pentagram.com/work/simplisafe/story', 'Охорона як сервіс для людей: простий знак, один колір-якір, жодної мілітарі.'),
    ('Volkswagen, знак 2019', None, 'Дві літери на спільних штрихах, пласкі, без об’єму – знак тримається на 16 px і на капоті (за знанням, сторінку не відкривав).'),
    ('Chevron, знак з 1931', 'https://1000logos.net/chevron-logo/amp/', 'Подвійний шеврон як напрямок – впізнаваний майже сто років; ми беремо принцип, але горизонтальний, у квадраті.'),
    ('Citroën, подвійний шеврон', None, 'Два шеврони – це вже ім’я. Тому наш кут інший (90°), шеврони прорізані, а не накладені (за знанням).'),
    ('WWF, панда (Landor, 1986)', None, 'Тварина з мінімуму плям: око домальовує решту – негативний простір працює замість контуру (за знанням).'),
    ('Lufthansa, журавель (Otl Aicher)', None, 'Птах як інженерне креслення: сітка, кола, сталий штрих – тварина без «малюнку» (за знанням).'),
    ('Twitter, птах 2012 (Martin Grasser)', None, 'Силует, зібраний лише з дуг кіл однієї системи – ремесло видно в побудові (за знанням).'),
    ('Securitas', None, 'Світова охоронна компанія: просте написання і один характерний елемент – цього досить (за знанням).'),
    ('johnson banks – негативний простір', 'https://www.creativebloq.com/branding/craft-logo-using-negative-space-81516081', 'Друге прочитання в просвітах – але лише якщо перше прочитання миттєве.'),
    ('Антиприклад: «Wolf Guard» (Contra)', 'https://contra.com/p/sqc2QRkg-wolf-guard-i-got-a-brief', 'Геометричний вовк для охоронної компанії – кліше ніші. Тому не вовк і не беркут.'),
]

IDEAS = {
 'a': dict(
   name='Лігатура', img='монограма «ШВ»',
   idea='«Ш» і «В» зростаються в одну фігуру: остання стійка «Ш» – це стійка «В», а основа «Ш» перетікає в нижню чашу. Дві літери – одна стіна.',
   build=['Модуль 5, поле 24 × 24 модулі (120).', 'Стійки і просвіти «Ш» – по 3 модулі (15). Горизонталі – 14: оптично тонші на 7 %, щоб не здавались важчими за вертикалі.',
          'Чаші – дуги кіл: верхня r 33, нижня r 34 (нижня більша – знак стоїть, а не падає). Внутрішні r 19 і 20; товщина дуги 15,5 – на 0,5 більша за стійку, бо крива виглядає тоншою.',
          'Середня перекладина «В» – вище центру (52–66), як у класичній антикві.', '22 вузли, одна заливка, без градієнтів.'],
   test='Просвіти: два вузькі прямокутні «коридори» «Ш» і два напівкруглі вікна «В». Перше прочитання – «ШВ». <b>Ризик:</b> латинське прочитання «WB» (Warner Bros., Wildberries). Тому «Ш» строго прямокутна, без скосів, а знак завжди стоїть поруч із кириличним написанням.',
   word='Геометричні круглі чаші. Дві власні лігатури – <b>«ТУ»</b> (перекладина Т переходить у гілку У) і <b>«РТ»</b> (чаша Р зростається з перекладиною Т): той самий принцип спільного штриха, що й у знаку.',
   patch='Вертикальна пластина з радіусом 34 – це радіус нижньої чаші «В».',
   weak=['Головний ризик – схожість із «WB» у латинському прочитанні.', 'Найменш емоційна з трьох: монограма не розповідає історії, її треба «вчити».', 'На 16 px на темному тлі просвіти «Ш» злипаються в сіру смугу – потрібна окрема спрощена версія фавікона.']),
 'b': dict(
   name='Курс', img='шеврон, рух уперед',
   idea='Квадрат – об’єкт під охороною. Два шевронні просвіти під 45° розтинають його на вістря, шеврон і хвостовик: рух уперед і два рубежі охорони в одній фігурі.',
   build=['Квадрат 24 × 24 модулі (120) – найстабільніша форма, тримає аватарку і вивіску.', 'Просвіти – 10,5 по нормалі, вершини на горизонтальній осі в точках x = 61 і x = 98.',
          'Кут при вершині 90°: лінії під 45° чисто лягають на піксельну сітку, на 16 px немає «сходинок».', 'Середній шеврон – 15,7 по нормалі, як стійка в написанні.', '13 вузлів – найпростіший знак з трьох.'],
   test='Просвіти читаються як «»» – рух праворуч, уперед. Квадрат дає вагу й спокій. <b>Ризик:</b> кнопка «перемотати» і подвійний шеврон Citroën. Пом’якшення: шеврони не накладені, а прорізані в квадраті; кут 90° (у Citroën гостріший і вертикальний напрям); горизонталь – не звання і не нарукавний знак.',
   word='Чаші «В» і «Р» та літера «О» – з вістрями під 45°, як шеврони знака; «А» з гострою вершиною. Написання саме «рухається» праворуч.',
   patch='Нашивка-вказівник з вістрям 90° – той самий кут, що в знаку.',
   weak=['Найабстрактніший: без написання не каже «охорона», лише «рух».', 'Шеврон-патерн легко скотити в «спортивний» стиль – потрібні правила в брендбуку.', 'Написання з гострими «О» і «В» – найменш нейтральне; на довгих рядках (вивіска, бланк) може втомлювати.']),
 'c': dict(
   name='Вартовий', img='тварина-вартовий: сова',
   idea='Сова – нічна варта: бачить у темряві й не спить, коли інші сплять. Пасує до нічного синього. Силует голови з пір’яними «вушками»; очі – негативний простір; пряма брова зрізає верх очей – погляд пильний, а не милий.',
   build=['Поле 24 × 24 модулі (120). V-виріз угорі – 24, фаски знизу – 30 (6 модулів) під 45°.', 'Очі – кола r 21 з центрами на x = 33 і 87; зіниці r 8, зсунуті на 4 до центру і вниз – погляд зібраний на глядачеві.',
          'Брова – пряма з нахилом 0,24: при 0,4 сова вже «зла» (перевірили і відкинули).', 'Дзьоб – трикутник вістрям донизу 13 × 16: ромб читався як «ніс черепа».', '26 вузлів.'],
   test='На 16 px – темний блок з двома світлими крапками і «вушками»: сова, а без дзьоба – кіт. <b>Ризики:</b> на темному тлі темні очниці дають «маску/череп» – тому в нашивці й 3D білки очей світлі; надто крута брова дає «Angry Birds» – брову зроблено пологою. Схожість з Hootsuite – там сова кругла й весела, наша – квадратна й сувора.',
   word='Фаски 45° на «О», чашах «В» і «Р», низу «Ш» – відлуння скошених кутів голови.',
   patch='Прямокутна пластина з V-вирізом угорі – «вушка» сови; низ прямий, щоб не було щита.',
   weak=['Найбільш «персонажний»: ризик мультяшності, особливо в кольорі зі світлими білками.', 'Сова часто асоціюється з освітою і книжками.', 'Фаски в написанні дають тактичний, трохи мілітарі відтінок.']),
}


def img(src, alt, w=None, h=None, cls='', style=''):
    a = f' width="{w}"' if w else ''
    a += f' height="{h}"' if h else ''
    return f'<img src="{V}/{src}" alt="{alt}"{a}{" class=" + chr(34) + cls + chr(34) if cls else ""}{" style=" + chr(34) + style + chr(34) if style else ""} loading="lazy">'


def idea_block(k, n):
    d = IDEAS[k]; L = k.upper()
    lis = ''.join(f'<li>{x}</li>' for x in d['build'])
    weak = ''.join(f'<li>{x}</li>' for x in d['weak'])
    sizes = ''.join(f'<figure class="px"><img src="{V}/mark/{k}-favicon.svg" alt="фавікон {s} px" width="{s}" height="{s}"><figcaption>{s} px</figcaption></figure>' for s in (64, 32, 16))
    zoom = ''.join(f'<figure class="px"><img src="{V}/png/{k}-favicon-{s}.png" alt="растр {s} px, збільшено" width="96" height="96" style="image-rendering:pixelated"><figcaption>{s} px ×{96 // s}</figcaption></figure>' for s in (32, 16))
    return f'''
<section class="idea" id="{k}">
 <div class="wrap">
  <div class="ih"><span class="n">{L}</span><div><p class="mono">Ідея {n} · {d['img']}</p><h2>«{d['name']}»</h2><p class="lead">{d['idea']}</p></div></div>

  <div class="g2">
   <figure class="panel light big">{img(f'lockup/{k}-lockup-light.svg', f'Знак і написання «{d["name"]}» на світлому', 440)}<figcaption>1 · Знак + написання, світле тло</figcaption></figure>
   <figure class="panel dark big">{img(f'lockup/{k}-lockup-dark.svg', f'Знак і написання «{d["name"]}» на темному', 440)}<figcaption>1 · Знак + написання, темне тло</figcaption></figure>
  </div>
  <div class="g2 mt">
   <figure class="panel light">{img(f'lockup/{k}-lockup-line-light.svg', 'Горизонтальний логотип', 560)}<figcaption>Горизонтальна версія з дескриптором</figcaption></figure>
   <figure class="panel dark">{img(f'lockup/{k}-lockup-line-dark.svg', 'Горизонтальний логотип, темне тло', 560)}<figcaption>Для шапки сайту і бланків</figcaption></figure>
  </div>

  <div class="g2 mt build">
   <figure class="panel light">{img(f'construction/{k}-construction.svg', f'Побудова знака «{d["name"]}»: сітка і кола', 520, 520)}<figcaption>Побудова: сітка 24 × 24 модулі, кола і кути</figcaption></figure>
   <div class="txt"><h3>Побудова</h3><ul>{lis}</ul>
     <h3>Тест читабельності</h3><p>{d['test']}</p></div>
  </div>

  <div class="g4 mt">
   <figure class="panel light">{img(f'mark/{k}-mark-color.svg', 'Кольоровий', 120, 120)}<figcaption>Кольоровий</figcaption></figure>
   <figure class="panel dark">{img(f'mark/{k}-mark-inverse.svg', 'Інверсний', 120, 120)}<figcaption>Інверсний</figcaption></figure>
   <figure class="panel white">{img(f'mark/{k}-mark-mono-black.svg', 'Моно чорний', 120, 120)}<figcaption>Моно чорний</figcaption></figure>
   <figure class="panel brass">{img(f'mark/{k}-mark-mono-white.svg', 'Моно білий', 120, 120)}<figcaption>Моно білий на латуні</figcaption></figure>
  </div>
  <div class="sizes mt"><div class="row">{sizes}</div><div class="row">{zoom}</div><p class="cap">Зліва – справжній розмір у браузері (64 / 32 / 16 px), справа – растр 32 і 16 px, збільшений без згладжування.</p></div>

  <h3 class="sub">2 · Емблема-нашивка</h3>
  <div class="g3">
   <figure class="panel light">{img(f'emblem/{k}-patch-color.svg', 'Нашивка, кольорова', 300)}<figcaption>Кольорова (вишивка: латунна нитка, синє тло)</figcaption></figure>
   <figure class="panel white">{img(f'emblem/{k}-patch-mono.svg', 'Нашивка, моно', 300)}<figcaption>Монохромна – для гравіювання і печатки</figcaption></figure>
   <figure class="panel dark">{img(f'3d/render-{k}-patch.png', '3D: латунь і емаль', 360, 360)}<figcaption>3D: латунь + емаль, студійне світло (<a href="{V}/3d/emblem-3d.html?v={k}">живий</a>)</figcaption></figure>
  </div>
  <p class="cap">{d['patch']}</p>

  <h3 class="sub">3 · Шрифтовий логотип</h3>
  <figure class="panel light wide">{img(f'wordmark/{k}-wordmark-light.svg', 'Шрифтовий логотип', 1100)}</figure>
  <div class="g2 mt">
   <figure class="panel dark">{img(f'wordmark/{k}-wordmark-dark.svg', 'Шрифтовий логотип, темне тло', 560)}</figure>
   <figure class="panel light">{img(f'wordmark/{k}-wordmark-stack-light.svg', 'Шрифтовий логотип у два рядки', 300)}</figure>
  </div>
  <p class="cap">{d['word']} Літери накреслено з нуля в кривих (стійка 16, горизонталь 13,5, діагональ 16,5 на висоту 100), кернінг – попарно.</p>

  <h3 class="sub">Носії</h3>
  <figure class="panel hero">{img(f'hero/{k}-hero.png', f'Перший екран сайту 1440 з 3D-емблемою «{d["name"]}»', 1440, 900)}<figcaption>Перший екран сайту, 1440. <a href="{V}/hero/{k}-hero.html?live">Відкрити з живою 3D-емблемою</a></figcaption></figure>
  <div class="g2 mt">
   <figure class="panel light car">{img(f'carriers/{k}-car.svg', 'Борт умовного позашляховика', 1000, 420)}<figcaption>Борт умовного позашляховика</figcaption></figure>
   <figure class="panel light ava"><div class="avas"><span class="av c">{img(f'mark/{k}-avatar.svg', 'Аватарка, кругла', 140, 140)}</span><span class="av s">{img(f'mark/{k}-favicon.svg', 'Аватарка, квадратна', 140, 140)}</span><span class="av sm">{img(f'mark/{k}-avatar.svg', 'Аватарка 40 px', 40, 40)}</span></div><figcaption>Аватарка: кругла (соцмережі), квадратна (месенджери), 40 px у стрічці</figcaption></figure>
  </div>

  <div class="weak"><h3>Чесно про слабкі місця</h3><ul>{weak}</ul></div>
 </div>
</section>'''


def page():
    refs = ''.join(f'<li><b>{n}</b>{(" – <a href=" + chr(34) + u + chr(34) + ">посилання</a>") if u else ""}<span>{t}</span></li>' for n, u, t in REFS)
    blocks = ''.join(idea_block(k, i + 1) for i, k in enumerate('abc'))
    strip = ''.join(f'<div class="sc"><p class="mono">{k.upper()} · «{IDEAS[k]["name"]}»</p><div class="row">' +
                    ''.join(f'<img src="{V}/mark/{k}-favicon.svg" alt="" width="{s}" height="{s}">' for s in (64, 32, 16)) +
                    f'<img src="{V}/mark/{k}-mark-color.svg" alt="" width="64" height="64" class="onl"></div></div>' for k in 'abc')
    html = f'''<!doctype html>
<html lang="uk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Штурмова варта – концепція v4</title>
<meta name="description" content="Етап 0, концепція v4: три знаки – монограма, шеврон, тварина-вартовий – кожен у трьох формах. На погодження.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500&family=IBM+Plex+Sans:wght@400;600&display=swap" rel="stylesheet">
<style>
:root {{ --night:#0E1A2B; --navy:#1F3350; --brass:#C9A35A; --brass-ink:#E2C27E; --brass-dark:#7A5C24; --light:#F4F1EA; --deep:#08111D; --muted:#AEB8C7; --text:#D5DCE6; --line:rgba(201,163,90,.25); --gut:clamp(16px,4vw,56px); }}
* {{ box-sizing:border-box; margin:0; padding:0; }}
html, body {{ background:var(--deep); color:var(--light); font:16px/1.55 'IBM Plex Sans', system-ui, sans-serif; -webkit-font-smoothing:antialiased; }}
img {{ display:block; max-width:100%; height:auto; }}
a {{ color:var(--brass-ink); }}
.wrap {{ max-width:1320px; margin:0 auto; padding:0 var(--gut); }}
.mono {{ font-family:'IBM Plex Mono', monospace; font-size:13px; letter-spacing:.14em; text-transform:uppercase; color:var(--brass-ink); }}
.cap {{ font-size:14px; color:var(--muted); margin-top:12px; max-width:880px; }}
h1 {{ font-size:clamp(40px,6vw,80px); line-height:1; font-weight:600; letter-spacing:-.02em; margin-top:18px; }}
h2 {{ font-size:clamp(34px,4.4vw,60px); line-height:1; font-weight:600; letter-spacing:-.015em; margin-top:8px; }}
h3 {{ font-size:20px; font-weight:600; line-height:1.2; }}
.lead {{ font-size:clamp(17px,1.5vw,20px); color:var(--text); max-width:820px; margin-top:16px; }}
header {{ padding:clamp(48px,8vw,110px) 0 clamp(32px,5vw,64px); border-bottom:1px solid var(--line); }}
.toc {{ display:flex; flex-wrap:wrap; gap:10px; margin-top:28px; }}
.toc a {{ text-decoration:none; color:var(--light); border:1px solid var(--line); padding:10px 16px; font-size:15px; }}
.toc a b {{ color:var(--brass-ink); font-family:'IBM Plex Mono', monospace; font-weight:500; margin-right:8px; }}
.lessons {{ display:grid; grid-template-columns:repeat(3,1fr); gap:24px; margin-top:40px; }}
.lessons div {{ border-top:2px solid var(--brass); padding-top:14px; font-size:15px; color:var(--text); }}
.lessons b {{ display:block; color:var(--light); margin-bottom:4px; }}
section {{ padding:clamp(56px,8vw,112px) 0 0; }}
.refs ol {{ list-style:none; display:grid; grid-template-columns:repeat(3,1fr); gap:0 28px; margin-top:24px; counter-reset:r; }}
.refs li {{ padding:14px 0; border-top:1px solid rgba(244,241,234,.1); font-size:14px; color:var(--muted); counter-increment:r; }}
.refs li b {{ color:var(--light); font-weight:600; }}
.refs li b:before {{ content:counter(r, decimal-leading-zero) '  '; font-family:'IBM Plex Mono', monospace; color:var(--brass-ink); font-weight:500; }}
.refs li span {{ display:block; margin-top:2px; }}
.strip {{ display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-top:28px; }}
.strip .sc {{ background:var(--night); padding:20px; }}
.strip .row {{ display:flex; align-items:center; gap:18px; margin-top:14px; }}
.strip .onl {{ background:var(--light); padding:6px; width:76px; height:76px; margin-left:auto; }}
.ih {{ display:grid; grid-template-columns:auto 1fr; gap:28px; align-items:start; }}
.ih .n {{ font-family:'IBM Plex Mono', monospace; font-size:clamp(64px,9vw,128px); line-height:.8; color:var(--brass); }}
.idea {{ border-top:1px solid var(--line); margin-top:clamp(56px,8vw,112px); }}
.idea .ih {{ margin-bottom:36px; }}
.panel {{ padding:clamp(20px,3vw,44px); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; }}
.panel figcaption {{ font-size:14px; color:inherit; opacity:.75; align-self:flex-start; }}
.panel.light {{ background:var(--light); color:var(--night); }}
.panel.white {{ background:#fff; color:var(--night); }}
.panel.dark {{ background:var(--night); color:var(--light); }}
.panel.brass {{ background:var(--brass); color:var(--night); }}
.panel.big {{ min-height:260px; }}
.panel.wide {{ padding:clamp(24px,4vw,64px); }}
.panel.hero {{ padding:0; background:var(--night); }}
.panel.hero figcaption {{ padding:12px 16px; align-self:stretch; }}
.panel.car {{ padding:0; }} .panel.car figcaption {{ padding:0 16px 12px; }}
.g2 {{ display:grid; grid-template-columns:1fr 1fr; gap:16px; }}
.g3 {{ display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }}
.g4 {{ display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }}
.mt {{ margin-top:16px; }}
.build .txt {{ padding:8px 0 0 12px; }}
.build ul {{ margin:12px 0 28px 18px; color:var(--text); font-size:15px; }}
.build li {{ margin:6px 0; }}
.build p {{ color:var(--text); font-size:15px; margin-top:10px; }}
.build p b {{ color:var(--brass-ink); }}
.sizes {{ background:var(--night); padding:24px; display:grid; grid-template-columns:auto auto 1fr; gap:40px; align-items:end; }}
.sizes .row {{ display:flex; gap:28px; align-items:flex-end; }}
.sizes .cap {{ margin:0; }}
.px figcaption {{ font-family:'IBM Plex Mono', monospace; font-size:12px; color:var(--muted); margin-top:8px; }}
.sub {{ display:flex; align-items:center; gap:14px; margin:56px 0 18px; font-size:22px; }}
.sub:after {{ content:''; flex:1; height:1px; background:var(--line); }}
.avas {{ display:flex; gap:28px; align-items:center; }}
.av img {{ display:block; }}
.av.c img {{ border-radius:50%; }}
.av.s img {{ border-radius:22%; }}
.av.sm img {{ border-radius:50%; }}
.weak {{ margin-top:40px; border-left:3px solid var(--brass); padding:4px 0 4px 20px; }}
.weak ul {{ margin:10px 0 0 18px; color:var(--text); }}
.pal {{ display:grid; grid-template-columns:1.3fr 1fr; gap:16px; margin-top:24px; }}
.sw {{ display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }}
.sw div {{ height:150px; padding:12px; font-family:'IBM Plex Mono', monospace; font-size:12px; display:flex; flex-direction:column; justify-content:flex-end; }}
table {{ width:100%; border-collapse:collapse; font-size:14px; margin-top:16px; }}
td, th {{ text-align:left; padding:8px 6px; border-bottom:1px solid rgba(244,241,234,.1); }}
th {{ color:var(--muted); font-weight:400; }}
.ok {{ color:#9FD3A8; }} .no {{ color:#F0A39A; }}
.card {{ background:var(--night); padding:28px; display:flex; flex-direction:column; gap:18px; }}
.card .h {{ font-size:34px; font-weight:600; line-height:1.05; }}
.card .h span {{ color:var(--brass-ink); }}
.card .b {{ color:var(--text); }}
.card .btn {{ background:var(--brass); color:var(--night); font-weight:600; padding:12px 20px; align-self:flex-start; }}
.card .lt {{ background:var(--light); color:var(--night); padding:20px; }}
.card .lt small {{ color:var(--brass-dark); font-family:'IBM Plex Mono', monospace; letter-spacing:.12em; }}
.mood {{ display:grid; grid-template-columns:1.4fr .8fr 1fr; gap:16px; margin-top:24px; }}
.mood img {{ width:100%; height:340px; object-fit:cover; }}
.agree {{ margin-top:24px; display:grid; gap:16px; }}
.agree .q {{ background:var(--night); padding:22px 24px; }}
.agree .q h3 {{ font-size:18px; }}
.agree ol {{ list-style:none; display:flex; flex-wrap:wrap; gap:10px; margin-top:12px; }}
.agree li {{ border:1px solid var(--line); padding:8px 14px; font-size:15px; }}
.agree li.rec {{ border-color:var(--brass); background:rgba(201,163,90,.1); }}
.agree li.rec:after {{ content:'  · рекомендую'; color:var(--brass-ink); font-size:13px; }}
footer {{ padding:72px 0 64px; color:var(--muted); font-size:14px; }}
@media (max-width:900px) {{
  .g2, .g3, .g4, .lessons, .refs ol, .strip, .pal, .mood {{ grid-template-columns:1fr; }}
  .g4 {{ grid-template-columns:1fr 1fr; }}
  .sizes {{ grid-template-columns:1fr; gap:20px; }}
  .ih {{ grid-template-columns:1fr; gap:8px; }}
  .sw {{ grid-template-columns:1fr 1fr; }}
  .avas {{ flex-wrap:wrap; }}
}}
@media print {{ .idea, section {{ break-inside:auto; }} .panel, .q {{ break-inside:avoid; }} }}
</style>
</head>
<body>
<header><div class="wrap">
 <p class="mono">Штурмова варта · етап 0 · концепція v4 · на погодження</p>
 <h1>Три знаки.<br>Кожен – у трьох формах.</h1>
 <p class="lead">Монограма «ШВ», шеврон і тварина-вартовий. Для кожної ідеї: знак + написання, емблема-нашивка і суто шрифтовий логотип, плюс побудова, малі розміри, 3D на першому екрані і борт авто. Палітра і IBM Plex – без змін.</p>
 <nav class="toc"><a href="#refs"><b>00</b>Референси</a><a href="#a"><b>A</b>«Лігатура»</a><a href="#b"><b>B</b>«Курс»</a><a href="#c"><b>C</b>«Вартовий»</a><a href="#palette"><b>04</b>Палітра і шрифти</a><a href="#agree"><b>05</b>Що погодити</a></nav>
 <div class="lessons">
  <div><b>Що прибрали після v3</b>Кільцеві написи, гільйош, мікротекст, рельєфні поля, «монетні» обідки. У знаках v4 – одна заливка, від 13 до 26 вузлів.</div>
  <div><b>Звідки впевненість</b>Кожен знак побудовано на сітці 24 × 24 модулі з колами і кутами – креслення показано поруч зі знаком.</div>
  <div><b>Де метал</b>3D – латунь і емаль, але сама форма проста. Метал підсилює знак, а не замінює його.</div>
 </div>
</div></header>

<section class="refs" id="refs"><div class="wrap">
 <p class="mono">00 · Мудборд референсів</p><h2>На що рівняємось</h2>
 <p class="cap">Чужі знаки сюди не вставлено – лише назва, посилання і що саме в них сильне. Позначка «за знанням» – сторінку під час пошуку не відкривав.</p>
 <ol>{refs}</ol>
 <div class="strip">{strip}</div>
 <p class="cap">Три знаки поруч: 64 / 32 / 16 px на темному і кольорова версія на світлому.</p>
</div></section>
{blocks}

<section id="palette"><div class="wrap">
 <p class="mono">04 · Палітра і шрифти</p><h2>Без змін – на носії</h2>
 <div class="pal">
  <div class="card">
   <p class="mono">IBM Plex Mono 500 · рубрики</p>
   <p class="h">Охорона об’єктів <span>і людей</span></p>
   <p class="b">IBM Plex Sans 400 – основний текст. 600 – заголовки й кнопки. Характер бренду несе власне написання логотипа, тому третій шрифт не додаємо: Plex нейтральний і має повну українську кирилицю (Ґ, Є, І, Ї, ʼ), ліцензія OFL.</p>
   <span class="btn">Залишити заявку</span>
   <div class="lt"><small>СВІТЛЕ ТЛО</small><p>Текст нічним синім на світлому. Латунь на світлому – лише для великих елементів і ліній; для тексту – темна латунь #7A5C24.</p></div>
  </div>
  <div>
   <div class="sw"><div style="background:#0E1A2B;color:#F4F1EA">Нічний синій<br>#0E1A2B</div><div style="background:#1F3350;color:#F4F1EA">Синій<br>#1F3350</div><div style="background:#C9A35A;color:#0E1A2B">Латунь<br>#C9A35A</div><div style="background:#F4F1EA;color:#0E1A2B">Світлий<br>#F4F1EA</div></div>
   <table><tr><th>Текст / тло</th><th>Контраст</th><th>WCAG</th></tr>
    <tr><td>Світлий на нічному синьому</td><td>15,5 : 1</td><td class="ok">AAA</td></tr>
    <tr><td>Латунь на нічному синьому</td><td>7,4 : 1</td><td class="ok">AAA</td></tr>
    <tr><td>Латунь на синьому #1F3350</td><td>5,4 : 1</td><td class="ok">AA</td></tr>
    <tr><td>Нічний синій на латуні (кнопка)</td><td>7,4 : 1</td><td class="ok">AAA</td></tr>
    <tr><td>Темна латунь #7A5C24 на світлому</td><td>5,5 : 1</td><td class="ok">AA</td></tr>
    <tr><td>Латунь #C9A35A на світлому</td><td>2,1 : 1</td><td class="no">не для тексту</td></tr>
   </table>
  </div>
 </div>
 <h3 class="sub">Настрій</h3>
 <div class="mood">
  <img src="concept-ai/01-kpp-night.jpg" alt="КПП складу вночі" width="1536" height="864" loading="lazy">
  <img src="concept-ai/02-guard-entrance.jpg" alt="Охоронець біля входу бізнес-центру" width="1024" height="1280" loading="lazy">
  <img src="concept-ai/05-keycard.jpg" alt="Рука в рукавичці з ключ-карткою" width="1280" height="960" loading="lazy">
 </div>
 <p class="cap">Зображення згенеровані раніше для v3 у межах дозволеного ліміту (Figma AI, 17.11.2026, джерело – concept-ai/SOURCES.md). Нових генерацій для v4 не робили. Це настрій, не фото клієнта; на сайті – з підписом «ілюстративне фото» або замінити реальними.</p>
</div></section>

<section id="agree"><div class="wrap">
 <p class="mono">05 · Що погодити</p><h2>Оберіть варіант у кожному питанні</h2>
 <div class="agree">
  <div class="q"><h3>1. Який напрям беремо в брендбук?</h3><ol><li class="rec">B «Курс» – шеврон у квадраті</li><li>C «Вартовий» – сова</li><li>A «Лігатура» – монограма ШВ</li><li>Жоден – новий раунд з іншими образами</li></ol></div>
  <div class="q"><h3>2. Яка форма логотипа основна?</h3><ol><li class="rec">Знак + написання у два рядки</li><li>Знак + написання в один рядок з дескриптором</li><li>Емблема-нашивка</li><li>Лише шрифтовий логотип</li></ol></div>
  <div class="q"><h3>3. Яким буде написання «ШТУРМОВА ВАРТА»?</h3><ol><li class="rec">З характером обраного знака (як на цій сторінці)</li><li>Геометричне з круглими чашами (A) для будь-якого знака</li><li>IBM Plex Sans SemiBold без доопрацювань</li></ol></div>
  <div class="q"><h3>4. Що показує 3D на першому екрані?</h3><ol><li class="rec">Нашивку з написом (латунь + емаль), як у кадрах</li><li>Лише знак без пластини</li><li>Статичний рендер замість живої моделі</li></ol></div>
  <div class="q"><h3>5. Якщо обрано сову – який характер?</h3><ol><li class="rec">Як є: пильний погляд, пряма брова</li><li>Спокійніший: без брови, круглі очі</li><li>Замінити твариною – вартовий пес</li></ol></div>
 </div>
</div></section>

<footer><div class="wrap">Storm Click для ТОВ «Охоронна компанія «Штурмова варта», Київ · +380 67 549 5710 · концепція v4. Файли: {V}/ (знаки, написання, нашивки, 3D, кадри першого екрана, авто). Генератор: {V}/build/.</div></footer>
</body>
</html>
'''
    open(os.path.join(DESIGN, 'brand-concept-v4.html'), 'w').write(html)


if __name__ == '__main__':
    page(); print('ok')
