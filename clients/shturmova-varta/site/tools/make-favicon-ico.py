#!/usr/bin/env python3
"""favicon.ico (16/32/48) з PNG, які зробив make-icons-og.cjs (og.jpg він тепер пише сам; гілка og.png – для старих запусків). Запуск із теки site/."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
big = Image.open(ROOT / "icons" / "favicon-48.png").convert("RGBA")
imgs = [Image.open(ROOT / "icons" / f"favicon-{s}.png").convert("RGBA") for s in (16, 32)]
big.save(ROOT / "favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)], append_images=imgs)
print("favicon.ico")
og = ROOT / "img" / "og.png"
if og.exists():
    Image.open(og).convert("RGB").save(ROOT / "img" / "og.jpg", "JPEG", quality=86, optimize=True, progressive=True)
    og.unlink()
    print("img/og.jpg")
