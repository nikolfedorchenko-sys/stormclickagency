#!/usr/bin/env python3
"""Оптимізація фото для сайту: img/src/*.jpg -> img/photo/<назва>-{600,1200}.{webp,jpg}.

Запуск із теки site/:  python3 tools/optimize-images.py
Потрібен лише Pillow (pip install pillow). Повторний запуск перезаписує результати.
Нові фото: покладіть JPEG/PNG у img/src/ (бажано 1200 px завширшки або більше) і запустіть скрипт.
"""
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC, OUT = ROOT / "img" / "src", ROOT / "img" / "photo"
WIDTHS = (600, 1200)

OUT.mkdir(parents=True, exist_ok=True)
for f in sorted(SRC.glob("*")):
    if f.suffix.lower() not in (".jpg", ".jpeg", ".png"):
        continue
    im = ImageOps.exif_transpose(Image.open(f)).convert("RGB")
    for w in WIDTHS:
        r = im if im.width <= w else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        base = OUT / f"{f.stem}-{w}"
        r.save(base.with_suffix(".webp"), "WEBP", quality=78, method=6)
        r.save(base.with_suffix(".jpg"), "JPEG", quality=80, optimize=True, progressive=True)
        print(f"{base.name}: {r.width}x{r.height}  webp {base.with_suffix('.webp').stat().st_size // 1024} KB, "
              f"jpg {base.with_suffix('.jpg').stat().st_size // 1024} KB")
