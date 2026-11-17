# Промпти для фото «Штурмова варта» – ChatGPT та інші генератори

Шість кадрів уже згенеровано у Figma AI (`../../concept-ai/`, див. `SOURCES.md`). Нижче – промпти, щоб догенерувати решту кадрів або перегенерувати слабкі (01 – латунний шлагбаум замість червоно-білого, 02 – без кашкета, 04 – авто без схожості з поліцейським, 06 – повна версія).

Усе – ілюстративні зображення настрою. На сайті з підписом «ілюстративне фото» або з заміною на реальні фото об'єктів клієнта.

## Єдиний стиль – додавати до кожного промпту

```
STYLE: cinematic night photography, Kyiv-like modern European city (no landmarks), deep night-blue palette (#0E1A2B, #1F3350) with warm brass-gold practical lights (#C9A35A), sodium and warm LED street lamps, wet asphalt with soft reflections, light haze, calm and orderly mood, no drama, no action. Shot on 35mm full-frame, 35mm or 50mm prime lens, f/2.0, subtle Kodak Portra 800 film grain, gentle halation around lights, natural contrast, slightly lifted blacks, no oversaturation.
NEGATIVE: no faces visible, no readable text, no letters, no numbers, no license plates, no logos, no brand names, no weapons, no guns, no batons, no police or military insignia, no police light bars, no camouflage, no shields, no eagles, no tridents, no skulls, no red-and-white police stripes, no blood, no aggression, no people looking at camera.
```

## Кадри

### 1. Нічний КПП складу (заміна 01) – 16:9
```
A quiet night checkpoint at the entrance of a modern logistics warehouse. A small guard booth with large warm-lit windows, a lowered boom barrier painted dark navy with thin brass-gold bands, wet asphalt reflecting the light, perimeter fence in the background, loading docks softly lit. Wide establishing shot from eye level, slightly off-axis. Empty scene, no people. Aspect ratio 16:9.
```

### 2. Охоронець зі спини на посту (заміна 02) – 4:5
```
A security guard seen strictly from behind, standing calmly at the glass entrance of a modern business center at night. Dark navy uniform jacket without a cap, short hair, no visible patches with text. The lobby behind the glass glows warm; the city lights blur in the background. Medium shot from behind at shoulder height, guard in the left third of the frame. Face not visible. Aspect ratio 4:5.
```

### 3. Авто охорони з брендуванням (заміна 04) – 16:9
```
A dark navy mid-size civilian SUV (generic design, not a police model, no light bar, no push bar) parked by the gates of a warehouse at night. A clean horizontal brass-gold stripe along the lower doors and a blank matte navy rectangular plate on the front door for a future logo – plate completely empty. Side three-quarter view, low camera, reflections on wet asphalt. No text, no plates. Aspect ratio 16:9.
```

### 4. Латунна 3D-емблема на темно-синьому тлі – 1:1
```
Macro product shot of a round polished brass badge with deep navy blue vitreous enamel, reeded coin edge, engraved fine guilloche pattern in the center, raised brass lettering ring that is blurred and unreadable. The central motif is a simple arched gate (arch with a keystone and three vertical bars) – geometric, architectural. Resting on dark navy velvet, studio softbox reflections on the metal, shallow depth of field. No readable text, no trident, no arrows, no shield. Aspect ratio 1:1.
```
Примітка: генератор навряд чи точно відтворить знак – кадр лише для настрою матеріалу; справжня емблема – 3D-рендер з `3d/`.

### 5. Рука в рукавичці з ключ-карткою – 4:3
```
Close-up of a hand in a black leather glove holding a blank matte navy key card near a modern access-control reader with a small warm amber indicator light, mounted on a dark glass door at night. Bokeh of warm city lights behind. No text on the card, no logos. Aspect ratio 4:3.
```

### 6. Панорама периметра складу – 21:9
```
Long panoramic view along the perimeter fence of a large warehouse complex at night: tall metal fence, evenly spaced warm floodlights on poles, CCTV cameras on posts, light pools on wet asphalt, light fog in the distance. Calm, orderly, symmetrical rhythm of lights. No people. Aspect ratio 21:9.
```

### 7. Супровід – двері авто (заміна 06) – 3:2
```
A person in a dark coat stepping out of the rear door of a black executive sedan in front of a business center entrance at night, while a security escort in a dark suit holds the door; both seen from behind or in silhouette, faces not visible. Warm lobby light, reflections on the wet pavement, city bokeh. Aspect ratio 3:2.
```

### 8. Обхід території з ліхтариком – 3:2
```
A security guard seen from behind walking along a row of closed loading-dock doors at night, holding a flashlight that casts a soft warm beam on the ground. Long shadows, wet concrete, a single warm lamp over each dock. Wide shot, guard small in the frame, face not visible. Aspect ratio 3:2.
```

## Перевірка після генерації

- Немає облич, тексту, номерів, логотипів, зброї, поліцейських ознак (маячки, смуги, шеврони).
- Палітра – нічний синій і латунь; червоний – лише стоп-сигнали.
- Не схоже на конкретні реальні об'єкти чи людей.
- Записати в `SOURCES.md`: сервіс, модель, дата, промпт, умови ліцензії сервісу.
