#!/usr/bin/env python3
"""Замінює домен-заглушку https://shturmova-varta.example на справжній у HTML, robots.txt і sitemap.xml.
Запуск із теки site/:  python3 tools/set-domain.py https://shturmova-varta.ua"""
import sys
from pathlib import Path

OLD = "https://shturmova-varta.example"
if len(sys.argv) != 2 or not sys.argv[1].startswith("https://"):
    sys.exit("Вкажіть домен: python3 tools/set-domain.py https://ваш-домен.ua")
new = sys.argv[1].rstrip("/")
root = Path(__file__).resolve().parent.parent
for f in [*root.glob("*.html"), root / "robots.txt", root / "sitemap.xml"]:
    t = f.read_text(encoding="utf-8")
    if OLD in t:
        f.write_text(t.replace(OLD, new), encoding="utf-8")
        print("оновлено:", f.name)
