# Krav — Bilder

Del av [kravindexet](./index.md). Den här filen äger `02-§8`.

Issue: [#10](https://github.com/stattared4h/stattared4h/issues/10).
Beslut: [ADR 0008](../adr/0008-bilder-i-repot.md),
[ADR 0015](../adr/0015-bilden-som-egen-post.md).

---

## 8. Bilder

### Bakgrund

ADR 0008 lägger bara webbanpassade bilder i repot och konstaterar att ett hjälpkommando
behövs, annars tar någon genvägar förbi grinden. Bildkedjan blir repots första beroende
med native-kod, och det granskas som ett sådant enligt `07-SAKERHET.md` §6. QA-datat
refererar bilder som inte finns; de genereras som platshållare, eftersom påhittade
fotografier aldrig commit:as.

Den första inmatningen av gårdens hundra djur är fas 1:s tyngsta arbete (ADR 0013), och
`npm run image` tar en bild i taget med alt-texten på kommandoraden. Hundra bilder den
vägen är hundra kommandon, och kopplingen mellan foto och djur blir kvar att göra för
hand. Därför finns ett importkommando som tar en tabell.

ADR 0015 lyfter ut bilden ur djurets fil. Ett foto kan visa två djur, och ett filnamn
som bär ett djurnamn ljuger så snart bilden lagts under fel post — och filen ligger kvar
i historiken även efter en omdöpning. Bilden blev därför en egen post med ett id som
härleds ur innehållet, och undermapparna per posttyp föll bort i samma veva: en bild på
en get i en hage hör inte hemma i vare sig `animals/` eller `places/`.

### Bildposten

- Varje bild är en egen post, `source/data/images/<bild-id>.yaml`, med `alt` på svenska
  och `credit` med fotografen eller rättighetshavaren. Båda är obligatoriska. <!-- 02-§8.8 -->
- Ett bild-id är `img-` följt av tolv hexadecimala tecken, till exempel
  `img-a3f2c1d8b901`. Tecknen är de första av SHA-256 över den färdiga WebP-filen, så
  id:t kräver ingen räknare och samma foto får alltid samma id. Prefixet gör att YAML
  läser id:t som text även när alla tolv tecknen är siffror. <!-- 02-§8.9 -->
- Djur och platser refererar bilder med `photos`, en lista av bild-id:n; en art med
  `photo`, ett enda bild-id. Samma bild-id får stå i flera poster — ett foto med två
  djur på finns som en fil och en alt-text. <!-- 02-§8.10 -->
- Den första bilden i `photos` är postens huvudbild: djurets porträtt och platsens
  toppbild. Ordningen i listan är ordningen på sidan. <!-- 02-§8.11 -->
- En innehållssida i Markdown infogar en bild med bildsyntax där adressen är bild-id:t
  och alt-texten är tom: `![](img-a3f2c1d8b901)`. Alt-texten kommer ur bildposten, så
  den står på ett ställe. <!-- 02-§8.12 -->

### Filer i repot

- Repot innehåller bara webbanpassade bilder: WebP, högst 1600 px på längsta sidan,
  högst 250 KB, utan EXIF och annan metadata. De ligger platt i `source/images/`, en fil
  per bildpost, med bild-id:t som filnamn. <!-- 02-§8.1 -->
- Valideringen fäller vid en refererad bild som saknas, har fel format, överskrider
  måtten eller storleken, eller bär metadata (`04-§10.7`). <!-- 02-§8.2 -->
- `npm run image -- <fil> --alt <text> --credit <namn>` tar ett original i JPEG, PNG
  eller WebP, skalar till högst 1600 px, konverterar till WebP under 250 KB, tar bort
  all metadata, räknar ut bild-id:t ur resultatet och skriver både bildfilen och
  bildposten. Kommandot skriver ut id:t att referera. Finns bilden redan sedan tidigare
  säger kommandot det och skriver ingenting. <!-- 02-§8.3 -->
- Bildfilerna som QA-datat refererar genereras av `npm run qa:images` som enfärgade
  WebP-platshållare med alt-texten i bilden, och versionshanteras inte. <!-- 02-§8.4 -->
- Valideringen varnar för en bildpost som ingen refererar, och för en bildfil i
  bildkatalogen som ingen bildpost hör till. Båda är utrymme som aldrig når
  besökaren. <!-- 02-§8.13 -->

### Många bilder på en gång

- `npm run image:import -- --scan <katalog>` skriver en tabell i CSV-format med en rad
  per bildfil i katalogen. Kolumnen `fil` är ifylld; `post`, `alt` och `fotograf` fylls i
  av redaktören. Filnamnen skrivs av kommandot, eftersom ett kameranamn inte säger något
  om motivet och hundra filnamn inte skrivs av för hand. <!-- 02-§8.14 -->
- `npm run image:import -- <tabell> --photos <katalog>` bereder varje rads bild som
  `npm run image` gör och skriver bildposterna. Kommandot rör aldrig djurens, platsernas
  eller arternas filer. <!-- 02-§8.15 -->
- Importen är allt-eller-inget: varje rad kontrolleras först, och hittas ett fel skrivs
  ingenting alls. En avbruten import lämnar aldrig hälften av bilderna inlagda. <!-- 02-§8.16 -->
- Kommandot skriver ut bild-id:na grupperade per `post`, i den form de har i en
  YAML-fil, så att de går att klistra in i djurets eller platsens `photos`. <!-- 02-§8.17 -->
- Fel rapporteras med radnummer, kolumn och vad som ska rättas, på svenska, på samma
  form som datavalideringens meddelanden (`02-§6.5`). <!-- 02-§8.18 -->
- Tabellen läses som CSV med citerade fält, så att en alt-text får innehålla kommatecken,
  citattecken och radbrytningar — en alt-text som beskriver ett djur gör oftast det.
  Både kommatecken och semikolon godtas som avgränsare, eftersom ett kalkylprogram med
  svenska inställningar sparar semikolon, och en inledande byteordningsmarkering
  ignoreras. Redaktören ska inte behöva veta vad någotdera är. <!-- 02-§8.19 -->
- Två rader som pekar på samma bildfil, eller på två filer med identiskt innehåll, ger
  samma bild-id. Kommandot skriver bilden en gång och säger till. <!-- 02-§8.20 -->

### Leverans

- Bygget genererar varje bild i bredderna 400, 800 och 1600 px och skriver `srcset` och
  `sizes`. Varje `img` har `width`, `height` och `loading="lazy"`, utom sidans första
  bild som i stället har `fetchpriority="high"` (`03-§6.3`). <!-- 02-§8.5 -->
- Ett djur eller en art utan bild får en platshållare enligt `05-§6.20`. Ingen sida visar
  en trasig bild. <!-- 02-§8.6 -->
- Varje visad bild har `alt` och fotografens namn ur bildposten, och namnet visas intill
  bilden. <!-- 02-§8.7 -->
