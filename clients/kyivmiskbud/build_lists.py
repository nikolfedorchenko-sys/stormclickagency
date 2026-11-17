"""Внутрішні переліки документів КМБ (гуртожиток / мережі). Запуск: python3 build_lists.py ."""
import sys
from docx import Document
from docx.shared import Mm, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from build_letters import LETTERS

TITLES = {
    "lyst-1-peredacha-hurtozhytku": ("perelik-1-hurtozhytok",
        "Перелік документів для передачі гуртожитка за адресою: просп. Леся Курбаса, 10-В до комунальної власності (Додаток 1 до наказу ДКВ від 30.09.2025 № 375)"),
    "lyst-2-peredacha-merezh": ("perelik-2-merezhi",
        "Перелік документів для передачі зовнішніх інженерних мереж гуртожитка за адресою: просп. Леся Курбаса, 10-В до комунальної власності (Додаток 1 до наказу ДКВ від 30.09.2025 № 376)"),
}

def clean(t):
    return t.replace(" [уточнити склад]", "")

for l in LETTERS:
    name, title = TITLES[l["file"]]
    doc = Document()
    st = doc.styles["Normal"]; st.font.name = "Times New Roman"; st.font.size = Pt(14)
    st.element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")
    s = doc.sections[0]
    s.page_width, s.page_height = Mm(210), Mm(297)
    s.left_margin, s.right_margin, s.top_margin, s.bottom_margin = Mm(30), Mm(10), Mm(20), Mm(20)
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(12)
    r = p.add_run(title); r.bold = True
    for i, d in enumerate(l["docs"], 1):
        p = doc.add_paragraph(f"{i}. {clean(d)}")
        pf = p.paragraph_format
        pf.left_indent = Mm(7); pf.first_line_indent = Mm(-7); pf.space_after = Pt(6)
    doc.save(f"{name}.docx")
    print(name)
