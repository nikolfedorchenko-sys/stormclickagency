# Промпти для генерації образу NOVA

Правило номер один: спочатку згенерувати **character sheet** (референсний сет), далі всі кадри робити з референсом обличчя і фіксованим seed. Три незмінні маркери: гетерохромія (ліве око крижано-блакитне, праве бурштинове), коротке платинове волосся, сережка-блискавка в лівому вусі.

## Опис персонажа (вставляти в будь-який промпт)

```
NOVA, a photorealistic AI news anchor, woman in her late 20s, tall athletic build,
oval face with high cheekbones, almond-shaped eyes with heterochromia (left eye ice-blue,
right eye amber), short sleek platinum-blonde pixie-bob haircut, light skin with natural
texture, minimal makeup, a single small silver lightning-bolt earring in the left ear,
a faint glowing electric-blue circuit pattern on her left temple, wearing a fitted
near-black tailored jacket with thin electric-blue piping over a plain dark top.
Confident, calm, slightly ironic expression.
```

## 1. Character sheet (референс)

```
Character reference sheet of [ОПИС ПЕРСОНАЖА]. Four views on one image: front view,
three-quarter view, profile view, and an extreme close-up of both eyes showing the
heterochromia. Neutral dark grey studio background, soft even studio lighting,
photorealistic, 8k, consistent identity across all views, no text.
--ar 16:9 --style raw
```

Negative (для моделей із негативним промптом): `cartoon, anime, plastic skin, oversaturated, extra earrings, long hair, both eyes same color, logo, text, watermark, cleavage`.

## 2. Аватар каналу (крупний план)

```
Close-up portrait of [ОПИС ПЕРСОНАЖА], looking straight into the camera, slight knowing
half-smile, both different-colored eyes clearly visible, dark studio background with soft
blue and violet rim light, shallow depth of field, photorealistic, editorial quality.
--ar 1:1
```

## 3. Банер каналу

```
Wide cinematic shot of [ОПИС ПЕРСОНАЖА] standing in a futuristic dark newsroom, positioned
on the right third of the frame, three-quarter view, arms relaxed. Background: near-black
space with slow vertical streams of blurred data and text in electric blue (#00E5FF) and
violet (#7C3AED), faint lightning flickers at the edges. Empty space on the left for text.
Cold key light from the left, violet rim light from the back right. Photorealistic.
--ar 16:9
```

## 4. Студійний кадр для щоденного випуску

```
Medium shot (chest up) of [ОПИС ПЕРСОНАЖА] presenting news in a virtual studio, camera
slightly below eye level, looking into the lens, neutral confident expression. Background:
dark studio with blurred vertical data streams in blue and violet, subtle depth. Cold key
light from the left, violet rim light. Space on the lower third for a name caption.
Photorealistic, broadcast quality.
--ar 16:9
```

Для Shorts – той самий промпт з `--ar 9:16` і «medium close-up (shoulders up)».

## 5. Емоції для обкладинок (однакова основа, міняється лише вираз)

| Емоція | Фраза в промпті |
|---|---|
| Скепсис | `one eyebrow raised, skeptical half-smile, head slightly tilted` |
| Здивування | `eyes slightly widened, lips parted, genuinely surprised` |
| «Ну таке» | `warm amused smile, soft eyes, chin slightly down` |
| Серйозно | `serious calm expression, direct gaze, no smile` |
| Пояснює | `mid-sentence, one hand raised explaining, engaged expression` |

```
Close-up of [ОПИС ПЕРСОНАЖА], [ЕМОЦІЯ], dark background with a soft electric-blue glow,
high contrast, sharp focus on the eyes, photorealistic, thumbnail-ready, no text.
--ar 16:9
```

## 6. Відео з аватаром (HeyGen, Higgsfield, Kling, Runway та аналоги)

- Вхід: студійний кадр (п. 4) + аудіодоріжка з TTS.
- Налаштування: мінімальні рухи голови, природні моргання, легкі кивки на межах речень, руки видно лише в «Розборі».
- Промпт руху (де є): `subtle natural head movement, calm professional news anchor delivery, occasional small nod, steady eye contact with camera, no exaggerated gestures`.
- Для Higgsfield: спершу character sheet через AI Influencer (параметри в `02-visual-identity.md`), потім анімація через рекомендований пресет з референсом персонажа.

## 7. Лого

```
Minimalist wordmark logo "NOVA" in a geometric grotesque typeface, the letter V stylized
as a lightning bolt, white on near-black background, flat vector style, no gradients,
centered, no other elements.
--ar 1:1
```
