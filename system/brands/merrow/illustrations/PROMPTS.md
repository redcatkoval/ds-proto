# Merrow — как получены иллюстрации

Сгенерированы в ChatGPT по одному промпту на картинку. К каждому промпту
приложена картинка-референс (стеклянный переключатель): она задаёт только
материал и свет, цвет — из текста. Новая иллюстрация делается так же, чтобы
серия оставалась одной.

## Общая часть (вставляется в каждый промпт целиком)

```
Use the attached image as a reference for material, glossiness and lighting only — not for colour. Material: glossy translucent glass with thick rounded chunky forms, soft bevelled edges, bright rim highlights and subtle inner refraction, exactly like the reference. Colour: the glass is tinted in one brand teal palette — main body #12A594, lighter edges and highlights #A1DED2 and #E0F8F3, deeper shade in thick areas #008573, darkest accents #0D3D38. Only a faint aqua-mint shimmer on the rim highlights. No blue, no violet, no pink, no purple. Three-quarter view from slightly above, centred, generous empty space around the object. Soft studio lighting from the top left, no harsh shadows. Clean, calm, premium, toy-like but not childish. No text, no letters, no numbers, no logos, no people. Transparent background, PNG with alpha channel, no backdrop, no floor, no drop shadow on the ground.
```

Начало промпта: `Create a square 1024×1024 image. Subject: …` — и сцена.

## Сцены

| файл | сцена |
|---|---|
| empty-orders.png | an open glass parcel box, empty inside, lid slightly lifted, a small glass receipt curling out of it |
| empty-products.png | a blank glass price tag on a soft looped string, with a small rounded hole, floating at a gentle tilt |
| no-results.png | a glass magnifying glass leaning over a small empty shallow glass dish |
| no-images.png | a glass photo frame standing at an angle, showing a simple soft hill and sun shape inside, with a small rounded upward arrow floating above it |
| empty-stock.png | three stacked glass storage boxes, the top one open and empty, slightly offset like a playful tower |
| welcome.png | a small glass shop front with a rounded awning and a door, like a miniature market stall |
| all-set.png | a rounded glass badge with a thick checkmark, slightly tilted, with two small glass sparkles |
| load-failed.png | a glass plug and socket pulled slightly apart, with a small gap between them, calm and not alarming |

После генерации картинка уменьшается до 512×512 и кладётся сюда под именем места.
