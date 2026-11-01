#!/usr/bin/env python3
"""Генерує сценарій випуску голосом NOVA з JSON-добірки новин.

Приклад:
    python generate_episode.py --news news.example.json --format digest --out episode.md

Формати: digest (Гаряча десятка), short (Блискавка), deep-dive (Розбір), weekly (Шторм тижня).
Ключ API береться з ANTHROPIC_API_KEY (або профілю `ant auth login`).
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
SYSTEM_PROMPT_PATH = HERE.parent / "prompts" / "system-prompt.md"
MODEL = "claude-opus-5-5"

FORMAT_HINTS = {
    "digest": "Формат: digest («Гаряча десятка»), 5–7 хвилин, 7–10 новин.",
    "short": "Формат: short («Блискавка»), одна новина, 60–110 слів, без інтро й аутро.",
    "deep-dive": "Формат: deep-dive («Розбір»), одна тема, 10–15 хвилин.",
    "weekly": "Формат: weekly («Шторм тижня»), п’ять подій тижня за Шкалою Шторму.",
}


def load_system_prompt() -> str:
    text = SYSTEM_PROMPT_PATH.read_text(encoding="utf-8")
    # Промпт починається після роздільника "---" (усе до нього – пояснення для людей).
    marker = "\n---\n"
    return text.split(marker, 1)[1].strip() if marker in text else text


def build_user_message(news: dict, fmt: str, extra: str | None) -> str:
    parts = [
        FORMAT_HINTS[fmt],
        "Використовуй лише факти з добірки нижче. Нічого не додавай від себе.",
    ]
    if extra:
        parts.append(f"Додаткові вказівки редактора: {extra}")
    parts.append("Добірка новин (JSON):")
    parts.append(json.dumps(news, ensure_ascii=False, indent=2))
    return "\n\n".join(parts)


def generate(news: dict, fmt: str, extra: str | None, effort: str) -> str:
    import anthropic

    client = anthropic.Anthropic()
    # Серверний fallback: якщо класифікатор безпеки відхилить запит, його
    # автоматично перенаправлять на іншу модель замість помилки.
    with client.beta.messages.stream(
        model=MODEL,
        max_tokens=16000,
        system=load_system_prompt(),
        messages=[{"role": "user", "content": build_user_message(news, fmt, extra)}],
        output_config={"effort": effort},
        betas=["server-side-fallback-2026-07-01"],
        fallbacks="default",
    ) as stream:
        for text in stream.text_stream:
            print(text, end="", file=sys.stderr, flush=True)
        message = stream.get_final_message()

    print(file=sys.stderr)
    if message.stop_reason == "refusal":
        details = getattr(message, "stop_details", None)
        reason = getattr(details, "explanation", None) or "без пояснення"
        raise SystemExit(f"Модель відхилила запит: {reason}")
    if message.stop_reason == "max_tokens":
        print("Увага: відповідь обрізано за max_tokens.", file=sys.stderr)

    return "".join(block.text for block in message.content if block.type == "text")


def main() -> None:
    parser = argparse.ArgumentParser(description="Сценарій випуску голосом NOVA")
    parser.add_argument("--news", required=True, help="JSON-файл із добіркою новин")
    parser.add_argument("--format", default="digest", choices=sorted(FORMAT_HINTS))
    parser.add_argument("--out", help="Куди зберегти сценарій (.md). За замовчуванням – stdout")
    parser.add_argument("--extra", help="Додаткові вказівки редактора")
    parser.add_argument("--effort", default="high", choices=["low", "medium", "high", "xhigh", "max"])
    parser.add_argument("--dry-run", action="store_true", help="Показати промпт без виклику API")
    args = parser.parse_args()

    news = json.loads(Path(args.news).read_text(encoding="utf-8"))

    if args.dry_run:
        print("=== SYSTEM ===\n" + load_system_prompt())
        print("\n=== USER ===\n" + build_user_message(news, args.format, args.extra))
        return

    script = generate(news, args.format, args.extra, args.effort)
    if "—" in script:
        script = script.replace("—", "–")

    if args.out:
        Path(args.out).write_text(script, encoding="utf-8")
        print(f"Сценарій збережено: {args.out}", file=sys.stderr)
    else:
        print(script)


if __name__ == "__main__":
    main()
