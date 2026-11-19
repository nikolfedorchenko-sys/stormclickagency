#!/usr/bin/env python3
"""Замінює домен-заглушку https://shturmova-varta.example на справжній у HTML, robots.txt і sitemap.xml
і прибирає службові коментарі «Домен-заглушка …» (у HTML, sitemap.xml – <!-- … -->, у robots.txt – рядок # …).
Запуск із теки site/:  python3 tools/set-domain.py https://shturmova-varta.ua"""
import re
import sys
from pathlib import Path

OLD = "https://shturmova-varta.example"
if len(sys.argv) != 2 or not sys.argv[1].startswith("https://"):
    sys.exit("Вкажіть домен: python3 tools/set-domain.py https://ваш-домен.ua")
new = sys.argv[1].rstrip("/")
root = Path(__file__).resolve().parent.parent
NOTE_XML = re.compile(r"[ \t]*<!--\s*Домен-заглушка.*?-->[ \t]*\n?", re.S)
NOTE_TXT = re.compile(r"^#\s*Домен-заглушка.*\n?", re.M)
for f in [*root.glob("*.html"), root / "robots.txt", root / "sitemap.xml"]:
    t = f.read_text(encoding="utf-8")
    u = (NOTE_TXT if f.suffix == ".txt" else NOTE_XML).sub("", t).replace(OLD, new)
    if u != t:
        f.write_text(u, encoding="utf-8")
        print("оновлено:", f.name)
left = [f.name for f in [*root.glob("*.html"), root / "robots.txt", root / "sitemap.xml"] if OLD in f.read_text(encoding="utf-8") or "Домен-заглушка" in f.read_text(encoding="utf-8")]
if left:
    sys.exit("УВАГА: заглушка лишилась у " + ", ".join(left))
