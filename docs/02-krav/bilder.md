# Krav — Bilder

Del av [kravindexet](./index.md). Den här filen äger `02-§8`.

Issue: [#10](https://github.com/stattared4h/stattared4h/issues/10).
Beslut: [ADR 0008](../adr/0008-bilder-i-repot.md).

---

## 8. Bilder

### Bakgrund

ADR 0008 lägger bara webbanpassade bilder i repot och konstaterar att ett hjälpkommando
behövs, annars tar någon genvägar förbi grinden. Bildkedjan blir repots första beroende
med native-kod, och det granskas som ett sådant enligt `07-SAKERHET.md` §6. QA-datat
refererar bilder som inte finns; de genereras som platshållare, eftersom påhittade
fotografier aldrig commit:as.

### Filer i repot

- Repot innehåller bara webbanpassade bilder: WebP, högst 1600 px på längsta sidan,
  högst 250 KB, utan EXIF och annan metadata. De ligger i `source/images/animals/`,
  `species/`, `places/` och `content/`. <!-- 02-§8.1 -->
- Valideringen fäller vid en refererad bild som saknas, har fel format, överskrider
  måtten eller storleken, eller bär metadata (`04-§10.7`). <!-- 02-§8.2 -->
- `npm run image -- <fil>` tar ett original i JPEG, PNG eller WebP, skalar till högst
  1600 px, konverterar till WebP under 250 KB, tar bort all metadata och skriver
  resultatet till angiven katalog under `source/images/`. <!-- 02-§8.3 -->
- Bildfilerna som QA-datat refererar genereras av `npm run qa:images` som enfärgade
  WebP-platshållare med postens namn i bilden, och versionshanteras
  inte. <!-- 02-§8.4 -->

### Leverans

- Bygget genererar varje bild i bredderna 400, 800 och 1600 px och skriver `srcset` och
  `sizes`. Varje `img` har `width`, `height` och `loading="lazy"`, utom sidans första
  bild som i stället har `fetchpriority="high"` (`03-§6.3`). <!-- 02-§8.5 -->
- Ett djur eller en art utan bild får en platshållare enligt `05-§6.20`. Ingen sida visar
  en trasig bild. <!-- 02-§8.6 -->
- Varje visad bild har `alt` från datat, och fotografens namn från `credit` visas intill
  bilden. <!-- 02-§8.7 -->
