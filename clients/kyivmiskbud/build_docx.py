import re, sys
from docx import Document
from docx.shared import Mm, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_COLOR_INDEX, WD_TAB_ALIGNMENT, WD_BREAK
from docx.enum.section import WD_SECTION
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

OUT = sys.argv[1]
FONT = "Times New Roman"
SIZE = 14


def setup_section(sec):
    sec.page_width, sec.page_height = Mm(210), Mm(297)
    sec.left_margin, sec.right_margin = Mm(30), Mm(10)
    sec.top_margin, sec.bottom_margin = Mm(20), Mm(20)
    sec.header_distance = Mm(10)
    sec.different_first_page_header_footer = True
    hdr = sec.header
    hdr.is_linked_to_previous = False
    p = hdr.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    for el in list(p._p):
        if el.tag == qn("w:r"):
            p._p.remove(el)
    r = p.add_run()
    for kind, text in (("begin", None), (None, "PAGE"), ("end", None)):
        if kind:
            fc = OxmlElement("w:fldChar"); fc.set(qn("w:fldCharType"), kind); r._r.append(fc)
        else:
            it = OxmlElement("w:instrText"); it.set(qn("xml:space"), "preserve"); it.text = text; r._r.append(it)
    r.font.name = FONT; r.font.size = Pt(12)


def restart_numbering(sec):
    pg = OxmlElement("w:pgNumType"); pg.set(qn("w:start"), "1")
    sec._sectPr.append(pg)


def base_styles(doc):
    st = doc.styles["Normal"]
    st.font.name = FONT; st.font.size = Pt(SIZE)
    st.element.rPr.rFonts.set(qn("w:eastAsia"), FONT)
    pf = st.paragraph_format
    pf.space_before = Pt(0); pf.space_after = Pt(0); pf.line_spacing = 1.0


def add_runs(p, text, bold=False, size=None, highlight_all=False):
    # highlight [..] placeholders
    text = text.replace("№ ", "№\u00a0").replace("107-2530", "107\u20112530").replace("173/0/2-26", "173/0/2\u201126")
    parts = re.split(r"(\[[^\[\]]*(?:\[[^\[\]]*\][^\[\]]*)*\])", text)
    for part in parts:
        if not part:
            continue
        r = p.add_run(part)
        r.bold = bold
        r.font.name = FONT
        r.font.size = Pt(size or SIZE)
        if highlight_all or (part.startswith("[") and part.endswith("]")):
            r.font.highlight_color = WD_COLOR_INDEX.YELLOW
    return p


def para(doc, text="", indent_first=None, left=None, bold=False, spacing=1.0, before=0, after=0,
         align=WD_ALIGN_PARAGRAPH.JUSTIFY, size=None, highlight_all=False, keep=False):
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.alignment = align
    pf.line_spacing = spacing
    pf.space_before = Pt(before); pf.space_after = Pt(after)
    if indent_first is not None:
        pf.first_line_indent = Mm(indent_first)
    if left is not None:
        pf.left_indent = Mm(left)
    if keep:
        pf.keep_with_next = True
    add_runs(p, text, bold=bold, size=size, highlight_all=highlight_all)
    return p


# ---------------- Letter ----------------
def build_letter(path):
    doc = Document(); base_styles(doc)
    sec = doc.sections[0]; setup_section(sec)

    # space for the blank (канцелярія), then reference to incoming letter
    para(doc, "На № 107-2530 від 19.03.2026", align=WD_ALIGN_PARAGRAPH.LEFT, size=12, before=0)

    for i, line in enumerate(["Голові Святошинської районної",
                              "в місті Києві державної адміністрації",
                              "Георгію ЗАНТАРАЇ"]):
        para(doc, line, left=90, align=WD_ALIGN_PARAGRAPH.LEFT, spacing=1.0, before=18 if i == 0 else 0)

    para(doc, "Про розгляд пакетів документів для безоплатної передачі до комунальної власності "
              "гуртожитка з прилеглими інженерними мережами за адресою: просп. Леся Курбаса, 10-В",
         bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, before=24, after=0)
    # заголовок: обмежимо ширину ~ до правого берега допустимо (понад 5 рядків при 73 мм)

    para(doc, "Шановний пане Георгію!", align=WD_ALIGN_PARAGRAPH.CENTER, before=18, after=12)

    body = [
        "ПрАТ «Холдингова компанія «Київміськбуд» (далі – Товариство) розглянуло лист Святошинської районної в місті Києві державної адміністрації від 19.03.2026 № 107-2530, наданий у відповідь на лист Товариства від 13.02.2026 № 173/0/2-26 щодо безоплатної передачі до комунальної власності територіальної громади міста Києва гуртожитка з прилеглими інженерними мережами, розташованого за адресою: м. Київ, просп. Леся Курбаса, 10-В.",
        "Правлінням і наглядовою радою Товариства прийнято рішення про безоплатну передачу до комунальної власності територіальної громади міста Києва гуртожитка та прилеглих до нього інженерних мереж (рішення правління від [дата] , протокол № [__]; рішення наглядової ради від [дата], протокол № [__]).".replace(" ,", ","),
        "Відповідно до рішення Київської міської ради від 11.09.2025 № 76/10543 «Про впорядкування прийняття майна до комунальної власності територіальної громади міста Києва та передачі майна комунальної форми власності у володіння і користування, до сфери управління районних в місті Києві державних адміністрацій, а також передачі на праві узуфрукта комунального майна», наказів Департаменту комунальної власності м. Києва виконавчого органу Київської міської ради (Київської міської державної адміністрації) від 30.09.2025 № 375 і № 376 та на виконання Вашого листа від 19.03.2026 № 107-2530 Товариство направляє два пакети документів:",
        "1) на гуртожиток як об'єкт нерухомості – відповідно до Додатка 1 до наказу Департаменту комунальної власності м. Києва від 30.09.2025 № 375;",
        "2) на зовнішні інженерні мережі, прилеглі до гуртожитка, – відповідно до Додатка 1 до наказу Департаменту комунальної власності м. Києва від 30.09.2025 № 376.",
        "Внутрішньобудинкові інженерні мережі передаються разом із будівлею гуртожитка і описані в першому пакеті. До другого пакета включено лише зовнішні мережі.",
    ]
    for t in body:
        para(doc, t, indent_first=10, spacing=1.15)


    rest = [
        "Замість документів, передбачених [пунктами – уточнити, напр.: п. 8, 10, 11 Додатка 1 до наказу № 375; п. 9 Додатка 1 до наказу № 376], у відповідних пакетах додаються довідки (пояснення) Товариства про їх незастосування, оскільки [підстава по кожному пункту – уточнити].",
        "Просимо розглянути подані пакети документів та ініціювати підготовку розпорядчого документа про безоплатне прийняття до комунальної власності територіальної громади міста Києва гуртожитка та прилеглих зовнішніх інженерних мереж за адресою: м. Київ, просп. Леся Курбаса, 10-В.",
        "Товариство готове надати додаткові документи або пояснення на Ваш запит.",
    ]
    for t in rest:
        para(doc, t, indent_first=10, spacing=1.15)

    # Додатки: label without indent, items aligned after the label (hanging)
    items = [
        "1. Пакет документів на гуртожиток за Додатком 1 до наказу Департаменту комунальної власності м. Києва від 30.09.2025 № 375 згідно з описом на [__] арк. в 1 прим.",
        "2. Пакет документів на зовнішні інженерні мережі за Додатком 1 до наказу Департаменту комунальної власності м. Києва від 30.09.2025 № 376 згідно з описом на [__] арк. в 1 прим.",
    ]
    p = para(doc, "Додатки: " + items[0], align=WD_ALIGN_PARAGRAPH.JUSTIFY, before=18)
    p.paragraph_format.left_indent = Mm(23); p.paragraph_format.first_line_indent = Mm(-23)
    p = para(doc, items[1], align=WD_ALIGN_PARAGRAPH.JUSTIFY)
    p.paragraph_format.left_indent = Mm(23)

    # Підпис: посада без відступу, ім'я на 125 мм
    p = para(doc, "", align=WD_ALIGN_PARAGRAPH.LEFT, before=36)
    p.paragraph_format.tab_stops.add_tab_stop(Mm(170), WD_TAB_ALIGNMENT.RIGHT)
    add_runs(p, "Голова правління\tВалерій ЗАСУЦЬКИЙ")

    doc.save(path)


# ---------------- Описи ----------------
P1 = [
    ("Звернення про волевиявлення щодо безоплатної передачі з таблицею характеристик об'єкта (найменування, адреса, загальна площа, рік побудови/введення в експлуатацію, реєстраційний номер об'єкта нерухомого майна, ринкова вартість без ПДВ, охоронний статус)", "п. 1"),
    ("Рішення правління Товариства від [дата] № [__] і рішення наглядової ради Товариства від [дата] № [__] про безоплатну передачу (засвідчені копії / витяги з протоколів)", "п. 2"),
    ("Рішення Київської міської ради про відведення земельної ділянки, план земельної ділянки, кадастровий план, акт визначення меж земельної ділянки", "п. 3"),
    ("Документ про прийняття об'єкта в експлуатацію (декларація / акт готовності / сертифікат / акти робочої комісії / акти виконаних робіт)", "п. 4"),
    ("Копії документів, що підтверджують право власності", "п. 5"),
    ("Копія установчих документів Товариства", "п. 6"),
    ("Відомості про відсутність обтяжень чи обмежень на майно", "п. 7"),
    ("Згода інвесторів та копії інвестиційних договорів [або: довідка (пояснення) про незастосування]", "п. 8"),
    ("Звіт про оцінку майна (вартість без ПДВ)", "п. 9"),
    ("Довідка (пояснення) про незастосування: передача на праві узуфрукта Товариством не пропонується", "п. 10"),
    ("Погодження холдингу/об'єднання [або: довідка (пояснення) про незастосування]", "п. 11"),
    ("Відомості про кінцевого бенефіціарного власника та структуру власності Товариства", "п. 12"),
    ("Інші документи: технічний паспорт, інвентарна відомість (у т. ч. внутрішньобудинкові мережі), матеріали фотофіксації [уточнити склад]", "п. 13"),
]
P2 = [
    ("Звернення про волевиявлення щодо безоплатної передачі до комунальної власності із зазначенням найменування, технічних характеристик і ринкової вартості (без ПДВ) мереж", "п. 1"),
    ("Рішення правління Товариства від [дата] № [__] і рішення наглядової ради Товариства від [дата] № [__] із зазначенням найменування, технічних характеристик і ринкової вартості мереж", "п. 2"),
    ("Копія статуту Товариства", "п. 3"),
    ("Документ про введення мереж в експлуатацію (декларація / акт готовності / сертифікат / акт введення в експлуатацію)", "п. 4"),
    ("Витяг з Державного реєстру речових прав на нерухоме майно [або: пояснення, що мережі не підлягають державній реєстрації]", "п. 5"),
    ("Перелік об'єктів передачі, погоджений із суб'єктом господарювання, на баланс якого передаватимуться мережі", "п. 6"),
    ("Довідка про джерела фінансування будівництва мереж", "п. 7"),
    ("Відомості про відсутність обтяжень чи обмежень на майно", "п. 8"),
    ("Згода інвесторів та копії інвестиційних договорів [або: довідка (пояснення) про незастосування]", "п. 9"),
    ("Звіт про оцінку майна (вартість кожного об'єкта без ПДВ)", "п. 10"),
    ("Рішення Київської міської ради про відведення земельної ділянки, план земельної ділянки, кадастровий план, акт визначення меж земельної ділянки", "п. 11"),
    ("Відомості про кінцевого бенефіціарного власника та структуру власності Товариства", "п. 13"),
    ("Інші документи: виконавчі схеми, технічні паспорти мереж, акти розмежування балансової належності, матеріали фотофіксації [уточнити склад]", "п. 14"),
]


def set_cell(cell, text, bold=False, align=WD_ALIGN_PARAGRAPH.LEFT):
    cell.text = ""
    p = cell.paragraphs[0]; p.alignment = align
    add_runs(p, text, bold=bold, size=12)


def opys(doc, sec, number, title, order, rows):
    setup_section(sec); restart_numbering(sec)
    para(doc, f"Додаток {number}", left=100, align=WD_ALIGN_PARAGRAPH.LEFT, size=12)
    para(doc, "до листа ПрАТ «ХК «Київміськбуд»", left=100, align=WD_ALIGN_PARAGRAPH.LEFT, size=12)
    para(doc, "ОПИС", bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, before=18)
    para(doc, title, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, after=12)
    t = doc.add_table(rows=1, cols=4); t.style = "Table Grid"
    widths = [Mm(12), Mm(110), Mm(25), Mm(23)]
    for c, h in zip(t.rows[0].cells, ["№ з/п", "Найменування документа", f"Пункт Додатка 1 до наказу {order}", "Кількість аркушів"]):
        set_cell(c, h, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER)
    for i, (d, pt) in enumerate(rows, 1):
        cells = t.add_row().cells
        set_cell(cells[0], str(i), align=WD_ALIGN_PARAGRAPH.CENTER)
        set_cell(cells[1], d)
        set_cell(cells[2], pt, align=WD_ALIGN_PARAGRAPH.CENTER)
        set_cell(cells[3], "", align=WD_ALIGN_PARAGRAPH.CENTER)
    t.autofit = False
    tblPr = t._tbl.tblPr
    lay = OxmlElement("w:tblLayout"); lay.set(qn("w:type"), "fixed"); tblPr.append(lay)
    grid = t._tbl.tblGrid
    for gc, w in zip(grid.findall(qn("w:gridCol")), widths):
        gc.set(qn("w:w"), str(int(w.twips)))
    for row in t.rows:
        for c, w in zip(row.cells, widths):
            c.width = w
    p = para(doc, "", align=WD_ALIGN_PARAGRAPH.LEFT, before=36)
    p.paragraph_format.tab_stops.add_tab_stop(Mm(170), WD_TAB_ALIGNMENT.RIGHT)
    add_runs(p, "Голова правління\tВалерій ЗАСУЦЬКИЙ")


def build_opysy(path):
    doc = Document(); base_styles(doc)
    opys(doc, doc.sections[0], 1,
         "документів на гуртожиток за адресою: м. Київ, просп. Леся Курбаса, 10-В, "
         "що подаються відповідно до Додатка 1 до наказу Департаменту комунальної власності м. Києва від 30.09.2025 № 375",
         "№ 375", P1)
    sec2 = doc.add_section(WD_SECTION.NEW_PAGE)
    opys(doc, sec2, 2,
         "документів на зовнішні інженерні мережі, прилеглі до гуртожитка за адресою: м. Київ, просп. Леся Курбаса, 10-В, "
         "що подаються відповідно до Додатка 1 до наказу Департаменту комунальної власності м. Києва від 30.09.2025 № 376",
         "№ 376", P2)
    doc.save(path)


if __name__ == "__main__":
    build_letter(OUT + "/suprovidnyi-lyst-do-svyatoshynskoi-rda.docx")
    build_opysy(OUT + "/opysy-dodatkiv-do-lysta.docx")
    print("ok")
