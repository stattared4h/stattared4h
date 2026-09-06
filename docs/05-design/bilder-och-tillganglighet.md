# Design — Bilder, tillgänglighet och vad man inte gör

Del av [designindexet](./index.md).

---

## 8. Bilder

Bilderna är sajtens hjärta: ett djur man inte ser är ett djur man inte minns. <!-- 05-§8.1 -->

### Vad som fotograferas

- Djuren i ögonhöjd, inte uppifrån. Ett porträtt där ansiktet syns tydligt gör att
  besökaren känner igen djuret i verkligheten — och det är hela poängen med
  spelen. <!-- 05-§8.2 -->
- Gården som den ser ut, i vardagsljus. Hellre ärligt än putsat. <!-- 05-§8.3 -->
- Varje djur i datat bör ha minst ett foto som duger som porträtt. <!-- 05-§8.4 -->

### Tekniska regler

- Originalet läggs i `source/images/` och commit:as. Härledda storlekar och format
  genereras i bygget och versionshanteras inte. Se
  [ADR 0008](../adr/0008-bilder-i-repot.md). <!-- 05-§8.5 -->
- Varje bild i markupen har `width`, `height` och `loading="lazy"`, utom bilder som syns
  direkt vid sidladdning. <!-- 05-§8.6 -->
- Bilder levereras i modernt format med reserv, och i flera bredder via
  `srcset`. <!-- 05-§8.7 -->

### Personer på bild

Bilder på identifierbara personer, i synnerhet barn, publiceras bara med samtycke från
personen eller vårdnadshavaren. Samtycket noteras hos föreningen, inte i repot. Vid minsta
tvekan används en bild där personen inte går att känna igen. <!-- 05-§8.8 -->

Begärs en bild borttagen räcker det inte att radera filen: den ligger kvar i
git-historiken. `docs/01-BIDRA.md` beskriver vad som då krävs. <!-- 05-§8.9 -->

### Upphovsrätt

Varje bild har en känd upphovsman noterad i datat. Bilder från `4h.se/stattared` används
med föreningens tillstånd. Bilder utan känt ursprung publiceras inte. <!-- 05-§8.10 -->

---

## 9. Tillgänglighet

Minimikrav, inte ambitionsnivå. Sajten drivs av en förening som riktar sig till barn med
olika förutsättningar. <!-- 05-§9.1 -->

- Kontrast enligt WCAG 2.1 AA. Kontrastreglerna i
  [index §2](./index.md#kontrastregler) är formulerade för att uppfylla det. <!-- 05-§9.2 -->
- Färg bär aldrig information ensam. Rätt, fel, hittat och valt visas också med ikon eller
  ord. <!-- 05-§9.3 -->
- Allt går att nå och använda med tangentbord, i en logisk ordning, med synlig
  fokusmarkering. <!-- 05-§9.4 -->
- Varje sida har exakt en `h1`, och rubriknivåerna hoppar inte. <!-- 05-§9.5 -->
- Varje bild har alternativtext som beskriver vad som är viktigt i bilden. Rent
  dekorativa bilder får tom `alt`. <!-- 05-§9.6 -->
- Formulärfält har kopplade etiketter, och felmeddelanden når skärmläsare. <!-- 05-§9.7 -->
- Sidan fungerar vid 200 % textförstoring utan att innehåll klipps eller kräver
  vågrät rullning. <!-- 05-§9.8 -->
- `prefers-reduced-motion` respekteras. <!-- 05-§9.9 -->
- Sidans språk anges med `lang="sv"`. <!-- 05-§9.10 -->

---

## 10. Vad man inte gör

- Hårdkoda inte färger, spacing eller typografi. Använd tokens. <!-- 05-§10.1 -->
- Inför inte färger utanför paletten. Behövs en ny färg är det ett designbeslut som ändrar
  §2, inte en literal i en komponent. <!-- 05-§10.2 -->
- Skriv inte grön text i `--color-green`. Den färgen är en yta. <!-- 05-§10.3 -->
- Sätt inte rubriker i versaler. <!-- 05-§10.4 -->
- Ta inte bort fokusmarkeringen. <!-- 05-§10.5 -->
- Använd inte platshållartext i stället för etikett. <!-- 05-§10.6 -->
- Ladda inte in webbteckensnitt, ikonbibliotek eller CSS-ramverk från ett CDN. Det bryter
  offline-läget. <!-- 05-§10.7 -->
- Bygg inte en komponent till som gör nästan samma sak som en befintlig. Utöka den
  befintliga. <!-- 05-§10.8 -->
- Lägg inte text ovanpå ett fotografi utan en yta bakom. <!-- 05-§10.9 -->
- Använd inte animationer som fördröjer en åtgärd. <!-- 05-§10.10 -->
