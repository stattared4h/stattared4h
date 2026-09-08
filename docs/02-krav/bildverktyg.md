# Krav — Bildverktyget

Del av [kravindexet](./index.md). Den här filen äger `02-§11`.

Issue: [#38](https://github.com/stattared4h/stattared4h/issues/38).
Beslut: [ADR 0008](../adr/0008-bilder-i-repot.md),
[ADR 0013](../adr/0013-faser-admin-nu-skriv-api-sedan.md),
[ADR 0014](../adr/0014-roller-via-github.md),
[ADR 0015](../adr/0015-bilden-som-egen-post.md),
[ADR 0021](../adr/0021-bildberedning-i-webblasaren.md),
[ADR 0022](../adr/0022-verktygssidor-utanfor-navigationen.md).

---

## 11. Bildverktyget

### Bakgrund

`npm run image` (`02-§8.3`) kräver Node, ett klonat repo och en terminal. Det utesluter
gårdsmedlemmen som förvaltar innehållet (`02-§2.4`), och det är hen sajten ska förvaltas
av. Fas 2:s skriv-API ([ADR 0013](../adr/0013-faser-admin-nu-skriv-api-sedan.md)) löser
det på riktigt, men ligger längre fram — och under tiden står `source/data/` tom, medan
bilderna är det som avgör om sajten är värd något.

Det som behövs för att komma i gång är smalare än ett redaktörsgränssnitt: ett sätt att
göra ett mobilfoto webbanpassat utan terminal. Resten av vägen in i repot klarar GitHubs
egen uppladdningsvy, som skapar gren och pull request åt redaktören. Inloggningen är
redaktörens GitHub-konto, precis som i `02-§3.4` och
[ADR 0014](../adr/0014-roller-via-github.md) — verktyget har ingen egen.

Verktyget är därmed inte en genväg förbi fas 2 utan dess första steg: beredningen av
bilden är exakt vad ett redaktörsgränssnitt behöver göra, och när skriv-API:t finns byts
bara sista steget ut.

### Adressen

- Bildverktyget bor på `/verktyg/bild-3ed93205946a/`. Adressen står i `README.md` och i
  `docs/01-BIDRA.md`; ingen byggd sida länkar dit, och den står varken i menyn eller i
  sidfoten. <!-- 02-§11.1 -->
- Sidan bär `<meta name="robots" content="noindex">` i varje bygge, även produktionens.
  Adressen står i ett publikt README som sökmotorer läser, så utan taggen vore den
  sökbar. <!-- 02-§11.2 -->
- `robots.txt` nämner inte verktygets adress. En `Disallow`-rad vore en skylt som pekar
  rakt på den. <!-- 02-§11.3 -->
- Den svårgissade adressen håller sidan borta från besökaren vid hagen. Den är inte ett
  skydd: repot är publikt, och sidan innehåller inga hemligheter, tar emot inga
  personuppgifter och kan inte skriva någonstans
  ([ADR 0022](../adr/0022-verktygssidor-utanfor-navigationen.md)). <!-- 02-§11.4 -->
- Verktygssidan och dess skript ligger utanför service workerns förcache (`02-§7.4`). En
  besökare som installerar appen laddar aldrig ner dem. <!-- 02-§11.5 -->
- Verktygets klientkod är en egen bunt under verktygets egen adress och ingår inte i
  `assets/main.js`, som varje besökare hämtar. <!-- 02-§11.6 -->

### Bereda bilder

- Sidan tar emot en eller flera bildfiler i JPEG, PNG eller WebP, från filväljaren eller
  direkt från kameran. Flera bilder i samma vända är ett krav: den första inmatningen av
  gårdens djur är fas 1:s tyngsta arbete. <!-- 02-§11.7 -->
- Varje bild rätas upp efter sin EXIF-orientering, skalas till högst `MAX_IMAGE_EDGE` på
  längsta sidan och kodas om till WebP under `MAX_IMAGE_BYTES` — samma gränser som
  `02-§8.1`. En bild som redan är mindre förstoras inte. <!-- 02-§11.8 -->
- Den färdiga filen bär varken EXIF, XMP eller ICC. Omkodningen sker i webbläsarens
  `canvas`, som bara bär bildpunkter vidare, så mobilfotots GPS-position stannar i
  telefonen ([ADR 0008](../adr/0008-bilder-i-repot.md)); den färgprofil kodaren lägger
  till på egen hand tas bort ur filen innan den lämnas ifrån sig. <!-- 02-§11.9 -->
- Kvaliteten sänks steg för steg tills filen håller storleksgränsen, efter samma
  princip som `optimiseImage`. Håller den inte ens på lägsta steget rapporteras bilden
  som ett fel, och de övriga bilderna bereds ändå. <!-- 02-§11.10 -->
- Bild-id:t räknas ut ur den färdiga WebP-filen enligt `02-§8.9`. Två filer som ger
  samma resultat får samma id, och sidan bereder dem en gång och säger till. <!-- 02-§11.11 -->
- Sidan hämtar ingenting från någon annan värd och skickar ingenting någonstans. Bilden
  lämnar aldrig redaktörens webbläsare förrän hen själv laddar upp den på
  github.com. <!-- 02-§11.12 -->

### Alt-text och fotograf

- Varje beredd bild har ett fält för `alt` och ett för `credit`, båda med synlig etikett,
  och bilden syns bredvid fälten så att alt-texten skrivs med motivet framför
  sig. <!-- 02-§11.13 -->
- Båda fälten är obligatoriska. Så länge någon bild saknar `alt` eller `credit` går
  filerna inte att hämta, och sidan säger vilken bild det gäller. En bild utan alt-text
  kommer ändå inte förbi valideringen, och det ska framgå på sidan i stället för först i
  CI. <!-- 02-§11.14 -->
- En `credit` som börjar med `AI-genererad` avvisas med samma motivering som
  `02-§8.21`: en genererad bild får inte publiceras som gårdens
  fotografi. <!-- 02-§11.15 -->
- Felmeddelanden når skärmläsare (`05-§9.7`), och varje fält når och lämnas med
  tangentbord (`05-§9.4`). <!-- 02-§11.16 -->

### Leverans till GitHub

- Sidan levererar de färdiga filerna på två sätt, eftersom vägen vidare skiljer sig
  mellan dator och telefon. <!-- 02-§11.17 -->
- **Ett arkiv:** en `.zip` med `source/images/<bild-id>.webp` och
  `source/data/images/<bild-id>.yaml` för samtliga beredda bilder. Katalogerna ligger i
  arkivet, så att den uppackade mappen `source` kan dras rakt in i GitHubs
  uppladdningsvy och båda filsorterna hamnar rätt i en enda pull
  request. <!-- 02-§11.18 -->
- **En fil i taget:** varje bild har dessutom en knapp för sin `.webp` och en för sin
  `.yaml`. På en telefon finns varken uppackning eller mappuppladdning, och där är
  styckvis den väg som fungerar. <!-- 02-§11.19 -->
- Arkivet lagrar filerna utan komprimering. WebP är redan komprimerat, och en egen
  deflate vore kod utan värde. <!-- 02-§11.20 -->
- Bildposten har samma form som den `npm run image` skriver: `alt` och `credit`, i den
  ordningen, en rad var. Samma bild ska ge samma fil oavsett vilken väg den kom
  in. <!-- 02-§11.21 -->
- Sidan beskriver vägen vidare i klartext, steg för steg, och länkar till repots
  uppladdningsvy på github.com. Länken leder till en inloggningsspärrad sida hos GitHub
  — redaktören måste vara inloggad med sitt konto och ha skrivrätt
  (`02-§3.2`). <!-- 02-§11.22 -->
- Filerna sidan levererar passerar `npm run validate` och CI utan efterarbete: WebP inom
  måtten och storleken, utan metadata, med ett id som är hashen av filen och en bildpost
  med `alt` och `credit`. <!-- 02-§11.23 -->

### Gränsvärdena

- `MAX_IMAGE_EDGE` och `MAX_IMAGE_BYTES` är definierade på ett enda ställe, som
  valideringen, bygget, kommandona och klientkoden alla läser. Ett tal som står på flera
  ställen slutar stämma på det ena. <!-- 02-§11.24 -->
