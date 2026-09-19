# Krav — Bilder

Del av [kravindexet](./index.md). Den här filen äger `02-§8`.

Issue: [#10](https://github.com/stattared4h/stattared4h/issues/10),
[#42](https://github.com/stattared4h/stattared4h/issues/42).
Beslut: [ADR 0008](../adr/0008-bilder-i-repot.md),
[ADR 0015](../adr/0015-bilden-som-egen-post.md),
[ADR 0017](../adr/0017-ai-genererade-qa-bilder-i-repot.md).

---

## 8. Bilder

### Bakgrund

ADR 0008 lägger bara webbanpassade bilder i repot och konstaterar att ett hjälpkommando
behövs, annars tar någon genvägar förbi grinden. Bildkedjan blir repots första beroende
med native-kod, och det granskas som ett sådant enligt `07-SAKERHET.md` §6. QA-datat
använder AI-genererade fotografier för att förhandsvisningen ska visa hur en bildburen
sajt faktiskt upplevs innan gårdens egna fotografier finns. De är tydligt märkta och
skilda från gårdens riktiga data.

Den första inmatningen av gårdens hundra djur är fas 1:s tyngsta arbete (ADR 0013), och
`npm run image` tar en bild i taget med alt-texten på kommandoraden. Hundra bilder den
vägen är hundra kommandon, och kopplingen mellan foto och djur blir kvar att göra för
hand. Därför finns ett importkommando som tar en tabell.

ADR 0015 lyfter ut bilden ur djurets fil. Ett foto kan visa två djur, och ett filnamn
som bär ett djurnamn ljuger så snart bilden lagts under fel post — och filen ligger kvar
i historiken även efter en omdöpning. Bilden blev därför en egen post med ett id som
härleds ur innehållet, och undermapparna per posttyp föll bort i samma veva: en bild på
en get i en hage hör inte hemma i vare sig `animals/` eller `places/`.

Kvar stod kopplingen åt andra hållet: djuret räknade upp sina bilder. Den som tar fotot
och den som känner igen djuret är sällan samma person, och sällan på plats samtidigt —
så svaret "det där är Bosse" blev en redigering av Bosses fil, som två svar samtidigt
inte kan göra utan att krocka. ADR 0026 vänder riktningen: bilden bär sina motiv, och
posternas bilder härleds. Ett svar är då ett tillägg i bildens egen fil, och den som
svarar behöver inte veta något om djurets.

### Bildposten

- Varje bild är en egen post, `source/data/images/<bild-id>.yaml`, med `alt` på svenska
  och `credit` med fotografen eller rättighetshavaren. Båda är obligatoriska. <!-- 02-§8.8 -->
- Ett bild-id är `img-` följt av tolv hexadecimala tecken, till exempel
  `img-a3f2c1d8b901`. Tecknen är de första av SHA-256 över den färdiga WebP-filen, så
  id:t kräver ingen räknare och samma foto får alltid samma id. Prefixet gör att YAML
  läser id:t som text även när alla tolv tecknen är siffror. <!-- 02-§8.9 -->
- Bildposten bär vad bilden visar: `animals`, `locations` och `species`, listor av id:n
  ur gårdens data. Alla tre är frivilliga, och var och en får bära flera id:n — ett foto
  med två djur på är en fil, en alt-text och två djur-id:n. <!-- 02-§8.10 -->
- Ett djurs, en plats och en arts bilder härleds ur bildposterna: posten visar varje bild
  som bär dess id. Ingen post räknar upp sina bilder, så kopplingen står på ett enda
  ställe — i bilden, som är det den handlar om. <!-- 02-§8.11 -->
- En innehållssida i Markdown infogar en bild med bildsyntax där adressen är bild-id:t
  och alt-texten är tom: `![](img-a3f2c1d8b901)`. Alt-texten kommer ur bildposten, så
  den står på ett ställe. <!-- 02-§8.12 -->

### Huvudbild och ordning

- Djuret, platsen och arten har ett frivilligt `portrait` med ett enda bild-id: djurets
  porträtt, platsens toppbild och artens bild. Bilden ska bära postens eget id — en
  huvudbild som inte visar djuret fäller valideringen. <!-- 02-§8.28 -->
- En posts bilder står i bild-id:ts ordning med `portrait` först. Utan `portrait` är den
  första i den ordningen postens huvudbild. Ordningen är därmed densamma i varje bygge
  (`02-§6.9`) utan att någon håller en redaktionell lista i takt. <!-- 02-§8.29 -->
- Varje id i `animals`, `locations` och `species` pekar på en post som finns, och står
  högst en gång i sin lista. <!-- 02-§8.30 -->
- Inget djur och ingen plats har ett `photos`-fält, och ingen art ett `photo`-fält.
  Kontraktet känner inte fältnamnen, och valideringen fäller därför för dem
  (`04-§10.11`) i stället för att tyst låta en bildlista ligga kvar utan
  verkan. <!-- 02-§8.31 -->

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
- QA-datasetet refererar cirka 25 delade AI-genererade fotografier som versionshanteras
  i `source/images-qa/`. Varje fotografi är WebP, högst 1200 px på längsta sidan och
  högst 50 KB, utan EXIF, XMP eller ICC, och bär den inbrända märkningen
  "AI-bild · QA". <!-- 02-§8.4 -->
- Valideringen varnar för en bildpost utan motiv som varken en innehållssida eller en
  ledtråd använder, och för en bildfil i bildkatalogen som ingen bildpost hör till. Den
  första är en bild som väntar på någon som vet vad den visar; den andra är utrymme som
  aldrig når besökaren. <!-- 02-§8.13 -->

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
- Kolumnen `post` är id:t på det djur, den plats eller den art bilden visar, och
  kommandot skriver in id:t i bildpostens motivlista. Redaktören klistrar inte in något
  efteråt. Ett `post` som inte finns i datasetet, eller som finns som både djur och
  plats, fäller importen med de andra radfelen. <!-- 02-§8.17 -->
- Fel rapporteras med radnummer, kolumn och vad som ska rättas, på svenska, på samma
  form som datavalideringens meddelanden (`02-§6.5`). <!-- 02-§8.18 -->
- Tabellen läses som CSV med citerade fält, så att en alt-text får innehålla kommatecken,
  citattecken och radbrytningar — en alt-text som beskriver ett djur gör oftast det.
  Både kommatecken och semikolon godtas som avgränsare, eftersom ett kalkylprogram med
  svenska inställningar sparar semikolon, och en inledande byteordningsmarkering
  ignoreras. Redaktören ska inte behöva veta vad någotdera är. <!-- 02-§8.19 -->
- Två rader som pekar på samma bildfil, eller på två filer med identiskt innehåll, ger
  samma bild-id. Kommandot skriver bilden en gång och säger till. <!-- 02-§8.20 -->

### AI-bilder för QA

- Varje bildpost i QA-datasetet har `credit: AI-genererad med OpenAI ImageGen`. En
  bildpost med en credit som börjar med `AI-genererad` är ogiltig i `source/data/`, så
  att en genererad QA-bild inte kan publiceras som gårdens foto. <!-- 02-§8.21 -->
- `npm run qa:prompts` läser QA-datasetet och skriver en tabell med en rad per bildpost.
  Varje rad innehåller bild-id, målfil och en svensk bildprompt sammansatt av alt-texten
  och de djur, arter och platser bilden visar. <!-- 02-§8.22 -->
- `npm run qa:images -- --import <katalog>` läser genererade JPEG-, PNG- eller
  WebP-filer vars filnamn är ett befintligt bild-id, lägger märkningen "AI-bild · QA"
  i bildens nedre hörn och skriver den webbanpassade filen under samma id i
  `source/images-qa/`. Okända id:n och felaktiga filnamn fäller importen innan något
  skrivs. <!-- 02-§8.23 -->
- QA-importen är allt-eller-inget. Samtliga källbilder läses, märks och komprimeras till
  kraven i `02-§8.4` innan den första filen skrivs. En befintlig målfil lämnas orörd, så
  en omkörning är säker. <!-- 02-§8.24 -->
- `npm run qa:images` utan `--import` skapar enfärgade 1200 × 900-platshållare enbart för
  bildposter vars fil saknas och lämnar incheckade fotografier orörda. Därmed kan
  bilderna levereras i omgångar utan att QA-bygget får trasiga bilder. <!-- 02-§8.25 -->
- Bild-id:n härleds inte på nytt vid QA-import. Källfilen och den färdiga WebP-filen
  behåller bildpostens befintliga id, så att QA-datat är stabilt när bilden genereras om.
  <!-- 02-§8.26 -->
- Varken QA-kommandona eller QA-datat skriver i `source/data/` eller `source/images/`.
  Gårdens riktiga data och bilder kan bara ändras genom produktionsflödena.
  <!-- 02-§8.27 -->

### Leverans

- Bygget genererar varje bild i bredderna 400, 800 och 1600 px och skriver `srcset` och
  `sizes`. Varje `img` har `width`, `height` och `loading="lazy"`, utom sidans första
  bild som i stället har `fetchpriority="high"` (`03-§6.3`). <!-- 02-§8.5 -->
- Ett djur eller en art utan bild får en platshållare enligt `05-§6.20`. Ingen sida visar
  en trasig bild. <!-- 02-§8.6 -->
- Varje visad bild har `alt` och fotografens namn ur bildposten, och namnet visas intill
  bilden. <!-- 02-§8.7 -->
