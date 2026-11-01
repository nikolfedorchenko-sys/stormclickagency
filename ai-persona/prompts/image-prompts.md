# Промпти для генерації образу DAN

Головне правило: обличчя Дана ніколи не описуємо словами. Ідентичність дає навчений Soul-персонаж (`soul_id: 60a19c9a-cbef-4c9f-ad86-8f863f562e24`, модель `soul_2`) або елемент-референс для інших моделей. У промпті описуємо лише кадр, одяг, світло, емоцію та фон.

## Як підставляти ідентичність

| Інструмент | Як передати обличчя |
|---|---|
| Higgsfield Soul 2.0 / Soul Cinema | `model: soul_2` (або `soul_cinematic`) + `soul_id`. У промпті – «the man» |
| Nano Banana Pro / GPT Image 2 / Seedream / Cinema Studio | елемент `<<<53afff07-bf92-46db-9e2d-dffad567f867>>>` у тексті промпта |
| Kling 3.0 (відео) | затверджений студійний кадр як `start_image` + той самий елемент |
| Інші генератори (Midjourney, Flux) | character reference / image prompt із затвердженого студійного кадру, вага референсу максимальна |

Сталі елементи одягу в кожному промпті:

```
wearing a fitted near-black tailored jacket with thin electric-blue piping over a plain dark
crew-neck top, a small silver lightning-bolt pin on the left lapel
```

## 1. Базовий студійний кадр (щоденний випуск)

```
Medium shot (chest up) of the man presenting news in a futuristic virtual newsroom, camera
slightly below eye level, looking straight into the lens, calm confident slightly ironic
expression, [ОДЯГ]. Background: dark studio with blurred vertical streams of data in electric
blue (#00E5FF) and violet (#7C3AED), subtle depth, faint lightning flicker at the edges.
Cold key light from the left, violet rim light from the back right. Empty space in the lower
third for a name caption. Photorealistic, broadcast quality, natural skin texture.
```
Формат: 16:9, якість 2k. Для Shorts – 9:16 і «medium close-up (shoulders up)».

## 2. Аватар каналу

```
Close-up portrait of the man looking straight into the camera, slight knowing half-smile,
[ОДЯГ], dark studio background with soft blue and violet rim light, shallow depth of field,
photorealistic, editorial quality.
```
Формат: 1:1.

## 3. Банер каналу

```
Wide cinematic shot of the man standing in a futuristic dark newsroom, positioned on the
right third of the frame, three-quarter view, arms relaxed, [ОДЯГ]. Background: near-black
space with slow vertical streams of blurred data and text in electric blue and violet, faint
lightning flickers at the edges. Empty space on the left for text. Cold key light from the
left, violet rim light from the back right. Photorealistic.
```
Формат: 16:9.

## 4. «Розбір» (недільний формат)

```
Medium shot of the man in a dark navy tailored suit with a crisp white shirt, no tie, small
silver lightning-bolt pin on the lapel, standing beside a large translucent holographic
screen with a timeline, one hand gesturing toward it, engaged explaining expression.
Dark newsroom, blue and violet accent lighting. Photorealistic, broadcast quality.
```

## 5. Емоції для обкладинок

Основа – промпт № 2, міняється лише вираз:

| Емоція | Фраза в промпті |
|---|---|
| Скепсис | `one eyebrow raised, skeptical half-smile, head slightly tilted` |
| Здивування | `eyes slightly widened, lips parted, genuinely surprised` |
| «Ну таке» | `warm amused smile, relaxed eyes, chin slightly down` |
| Серйозно | `serious calm expression, direct gaze, no smile` |
| Пояснює | `mid-sentence, one hand raised explaining, engaged expression` |

```
Close-up of the man, [ЕМОЦІЯ], [ОДЯГ], dark background with a soft electric-blue glow,
high contrast, sharp focus on the eyes, photorealistic, thumbnail-ready, no text.
```
Формат: 16:9. Генерувати по 4 варіанти на емоцію, відбирати один у бібліотеку обкладинок.

## 6. Відео з аватаром

- Вхід: затверджений студійний кадр (№ 1) як стартовий кадр + аудіодоріжка з TTS.
- Промпт руху: `subtle natural head movement, calm professional news anchor delivery, occasional small nod, steady eye contact with camera, natural blinking, lips synced to speech, no exaggerated gestures, static camera`.
- Higgsfield: Kling 3.0 з `start_image` і елементом, або Cinema Studio Video з елементом. Для lip-sync – окремий інструмент синхронізації губ з аудіо.
- Довжина кліпу – по одному блоку сценарію (20–60 с), склеювати на монтажі, між блоками – плашка або медіа новини.

## 7. Лого

```
Minimalist wordmark logo "DAN" in a geometric grotesque typeface, the crossbar of the letter
A stylized as a lightning bolt, white on near-black background, flat vector style,
no gradients, centered, no other elements.
```
Формат: 1:1.

## Негативні підказки (де підтримуються)

`cartoon, anime, plastic skin, oversaturated, different face, changed beard, long hair, logo text, watermark, extra people`
