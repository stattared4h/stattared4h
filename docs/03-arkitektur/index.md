# Arkitektur — index

Hur sajten är byggd. *Varför* den är byggd så står i [`../adr/`](../adr/README.md);
*vad* den ska göra står i [`../02-krav/`](../02-krav/index.md).

Avsnitts-ID (`03-§N.M`) är stabila och citeras från kod och spårbarhetsmatrisen.

---

## 1. Systemöversikt

Sajten är en statiskt byggd PWA. Ingenting körs på en server; allt avgörs vid bygget eller i
besökarens webbläsare. <!-- 03-§1.1 -->

```text
source/                      bygge (Eleventy + esbuild)        public/
├── data/*.yaml       ──┐                                   ┌── *.html
├── content/*.md      ──┼──►  1. läs och validera data  ──┐  ├── assets/*.css
├── layouts/*.njk     ──┤     2. härled vyer            ─┼─►├── assets/*.js
├── assets/css/*.css  ──┤     3. rendera sidor          ─┤  ├── images/*
├── assets/ts/*.ts    ──┤     4. generera bildstorlekar ─┤  ├── manifest.webmanifest
└── images/*          ──┘     5. skriv manifest + sw    ─┘  └── sw.js
```

Steg 1 fäller bygget vid ogiltig data, så inget felaktigt når `public/`. <!-- 03-§1.2 -->

---

## 2. Skikt

| Skikt | Katalog | Får känna till |
| --- | --- | --- |
| Data | `source/data/` | ingenting — det är ren YAML |
| Domän | `source/ts/domain/` | data; **inga** webbläsar-API:er |
| Vy | `source/ts/ui/` | DOM och domän |
| Mallar | `source/layouts/`, `source/content/` | data via Eleventy |

Domänskiktet är rent: ingen `window`, `document` eller `navigator`. Där bor härledningarna
och senare spelreglerna, och därför går de att enhetstesta i Node utan
webbläsare. <!-- 03-§2.1 -->

Vyskiktet bygger DOM med `createElement` och `textContent`. Ingen `innerHTML` finns i
kodbasen; det är samtidigt skyddet mot XSS. <!-- 03-§2.2 -->

---

## 3. Härledda vyer

Datat lagrar bara det som är sant om en enskild post. Allt som kopplar ihop poster räknas
fram i bygget, så att samma faktum aldrig står på två ställen. Härledningarna bor i **en**
modul, `source/ts/domain/derive.ts`. <!-- 03-§3.1 -->

| Vy | Härleds ur |
| --- | --- |
| Djuren på en plats | platsens `species` → djur med den arten och `status: here` |
| Var ett djurslag finns | platser vars `species` innehåller arten |
| Avkomma och syskon | djurens `mother` och `father`, sökta baklänges |
| Djur per ras | djurens `breed` |

Att härledningarna ligger samlade är avsiktligt: skulle placeringen någon gång behöva hämtas
vid sidladdning i stället för vid bygget är det en modul som byts, inte varje
sida. <!-- 03-§3.2 -->

Sorteringen sker vid bygget och är deterministisk, så att två byggen av samma data ger
identiska filer. <!-- 03-§3.3 -->

---

## 4. Sidor

| Sida | Adress | Innehåll |
| --- | --- | --- |
| Plats | `/plats/<id>/` | QR-kodens måladress. Vilka djurslag som går här, och därifrån vidare till djuren |
| Djur | `/djur/<id>/` | Namn, art, ras, stamtavla, bilder. Aldrig var individen står |
| Art | `/arter/<id>/` | Om djurslaget, vilka platser det finns på, och individerna |
| Karta | `/karta/` | Gårdens platser, med en textlista under kartan |

Platssidan är navet. QR-koden på hagen är permanent och pekar på `/plats/<id>/`; den behöver
aldrig bytas när djuren flyttar, eftersom det är platsfilen som ändras. <!-- 03-§4.1 -->

En plats utan djurslag visar det rakt ut och pekar vidare, i stället för en tom
sida. <!-- 03-§4.2 -->

---

## 5. Offline och service worker

Service workern förcachar sidskal, CSS, buntad JS, ikoner samt plats- och djursidorna.
Strategin är cache först för dessa, och nätverk först med cache som reserv för
fotografier. <!-- 03-§5.1 -->

Cachenamnet innehåller ett byggnummer och sätts av bygget, aldrig för hand. Vid aktivering
raderas cacher med annat namn. <!-- 03-§5.2 -->

Service workerns scope och manifestets `start_url` byggs från bas-sökvägen i
[ADR 0005](../adr/0005-konfigurerbar-bassokvag.md). <!-- 03-§5.3 -->

---

## 6. Bilder

Källbilderna är redan webbanpassade ([ADR 0008](../adr/0008-bilder-i-repot.md)). Bygget
genererar bara mindre storlekar för `srcset`. <!-- 03-§6.1 -->

Sökvägen till en bild byggs av en upplösare utifrån filnamnet i YAML. Datat känner aldrig
till var filerna ligger. <!-- 03-§6.2 -->

Varje bild får `width`, `height` och `loading="lazy"` — utom den första bilden på sidan, som
laddas ivrigt med `fetchpriority="high"` så att den inte fördröjer hur snabb sidan
känns. <!-- 03-§6.3 -->

---

## 7. Redigering

I fas 1 redigeras datat med vanliga commits av en enda administratör
([ADR 0013](../adr/0013-faser-admin-nu-skriv-api-sedan.md)). Det finns ingen server, ingen
inloggning och inget skriv-API. <!-- 03-§7.1 -->

Filuppdelningen — en fil per djur och per plats — är ändå vald för fas 2, då ett skriv-API
ska kunna skriva en post utan att röra någon annan. <!-- 03-§7.2 -->

---

## 8. Bygget och CI

- `npm run build` bygger till `public/`. <!-- 03-§8.1 -->
- `npm test` kör enhetstester för domänskiktet och datavalideringen. <!-- 03-§8.2 -->
- `npm run lint` lintar HTML, CSS, TypeScript och Markdown. <!-- 03-§8.3 -->
- CI kör bygge, lint, validering och tester på varje pull request och fäller vid fel. <!-- 03-§8.4 -->
- Merge till `main` bygger och deployar till GitHub Pages. <!-- 03-§8.5 -->

Två tester bevakar regler som annars urholkas tyst: att inget absolut sökvägsuttryck kringgår
bas-sökvägens hjälpfunktion, och att inget djur har fått ett `location`-fält. <!-- 03-§8.6 -->
