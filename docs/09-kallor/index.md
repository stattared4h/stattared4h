# Källregister

Externt material som sajten vilar på — förbundets logotyp, den grafiska profilen, allt
annat vi hämtar utifrån. Registret svarar på tre frågor: *var kom det ifrån*, *när hämtade
vi det*, och *är det fortfarande samma fil*.

Utan registret blir en hämtad fil på några månader omöjlig att skilja från något någon
ritat själv. Med det går varje härlett värde att spåra tillbaka till sin källa.

---

## Regler

- Varje källa har adress, hämtdatum, kontrollsumma (SHA-256) och en rad om vad vi härlett
  ur den. <!-- 09-§1.1 -->
- Små filer som är den direkta källan till något vi levererar läggs in här. Stora filer
  ligger kvar hos utgivaren — gränsen går vid ungefär 1 MB, av samma skäl som original inte
  bor i repot (ADR 0008). Kontrollsumman gör den utelämnade filen igenkännbar vid ny
  hämtning. <!-- 09-§1.2 -->
- Kontrollsummor räknas med `sha256sum`. <!-- 09-§1.3 -->
- Registret säger inget om upphovsrätt. Vem som äger vad står i `README.md` under
  *Licens*. <!-- 09-§1.4 -->
- Härleder vi en fil ur en källa bär registret en kontrollsumma för det härledda
  innehållet, så att ett test kan slå fast att det är oförändrat. <!-- 09-§1.5 -->
- AI-genererade filer anger generator, datum och det versionshanterade promptunderlaget
  i stället för en extern adress och en källfils kontrollsumma. De färdiga filerna är
  själva primärmaterialet. <!-- 09-§1.6 -->

---

## Källor

### AI-genererade fotografier för QA

| | |
| --- | --- |
| Generator | OpenAI ImageGen |
| Genererade | 2026-09-07 |
| Promptunderlag | `npm run qa:prompts`, härlett ur `source/data-qa/` |
| I repot | `source/images-qa/*.webp` |

Bilderna föreställer påhittade djur, innehåller inga personer och används bara av
QA-datasetet. Importkommandot lägger in märkningen "AI-bild · QA", skalar, kodar om
och tar bort metadata enligt ADR 0017. Bildposterna anger samma ursprung med
`credit: AI-genererad med OpenAI ImageGen`.

### 4H-logotypen

| | |
| --- | --- |
| Utgivare | Riksförbundet Sveriges 4H |
| Adress | `https://www.4h.se/wp-content/uploads/2015/05/4H-logga.pdf` |
| Hämtad | 2026-09-07 |
| SHA-256 | `a54bb2f7b6068a68dcfebe9e84ce9fe93fd558879f0d6eee8bf9aceca5c7ee68` |
| I repot | `docs/09-kallor/4h-logga.pdf` (783 KB) |

Illustrator-PDF från 2015, en sida, 152,651 × 105,775 pt. Innehåller inga bilder och inga
typsnitt — enbart vektorbanor. Det är den enda vektorversion av logotypen förbundet
publicerar; temat på `4h.se` levererar bara PNG.

`source/assets/img/4h-logo.svg` och `4h-logo-white.svg` är härledda ur den med:

```bash
pdftocairo -svg 4h-logga.pdf 4h-logo-raw.svg
```

Banorna är därefter oförändrade. Det som sätts för hand är fyllningsfärgen, och i den vita
varianten en mask som slår hål på klöverns fyra `H`.

Konstverkets kontrollsumma — SHA-256 över de sorterade unika `d`-attributen i vardera fil —
är:

```text
ab6045f459251f78ecd9547ec4faaf2f47a6ca5a3f3edc54a597db1902e8e19d
```

Båda SVG-filerna ska ge exakt den summan. `tests/design/logo.test.ts` slår fast det, så en
ändring av logotypens form fäller testet i stället för att smyga sig igenom.

PDF:ens egna färger är CMYK. Konverteringen ger ungefär `#00613b`, och förbundets
rasterfiler ligger på `#00633a`. Ingen av dem används: profilen anger `#00693f` och säger
att HEX-värdet gäller.

### Grafisk profil för Sveriges 4H

| | |
| --- | --- |
| Utgivare | Riksförbundet Sveriges 4H, kommunikationsgruppen |
| Adress | `https://www.4h.se/wp-content/uploads/2026/07/Grafisk-Profil-Sveriges-4H.pdf` |
| Antagen | 2023 |
| Hämtad | 2026-09-07 |
| SHA-256 | `8a2827af25753eaebc4472800b6b7eb3bf7f7281651cc5e4c5c290ab6e573187` |
| I repot | Nej — 45 MB, se `09-§1.2` |

44 sidor. Det vi härleder ur den:

| Sida | Vad | Var det används |
| --- | --- | --- |
| 9 | Logotypens färg `#00693f`, RGB 0/105/63, PMS 7727 C | `05-§2.19` |
| 10 | Logotypen får bara vara mörkgrön, svart eller vit; inget läggs ovanpå den; den vrids eller ändras inte | `02-§10.37` |
| 10 | Gården får använda logotypen; en medlem får inte skapa en egen | ADR 0016 |
| 11 | Frizon: en hel kvadrat till höger och under, en halv upptill och till vänster | `05-§6.38` |
| 12 | Namnlås för profilbilder tas fram av kommunikationsgruppen på begäran | ADR 0016 |
| 19 | Paletten på nio färger | `docs/05-design/index.md` §2 |

Paletten på sidan 19, ordagrant:

| Grön | Gul | Rosa |
| --- | --- | --- |
| `#00693f` primär | `#f1a41e` | `#641537` |
| `#008b44` | `#f6ba52` | `#bc5466` |
| `#82c381` | `#f9c96c` | `#ee8b8b` |

### 4H-temats stilmall

| | |
| --- | --- |
| Utgivare | Riksförbundet Sveriges 4H |
| Adress | `https://www.4h.se/wp-content/themes/rs4Htheme_v2/css/bst.css` |
| Hämtad | 2026-09-06 |
| I repot | Nej |

Källan till färgerna i ADR 0007, hämtad innan den grafiska profilen var känd. Den är
**inte** längre en giltig källa för färg: där temat och profilen säger emot varandra gäller
profilen (ADR 0016). Posten står kvar för att förklara var `#15623e`, `#e7fdf3` och
`#00863f` kommer ifrån.

### OpenStreetMap över Stättared

| | |
| --- | --- |
| Utgivare | OpenStreetMap-bidragsgivarna |
| Adress | `https://api.openstreetmap.org/api/0.6/map?bbox=12.3355,57.3355,12.3455,57.3405` |
| Hämtad | 2026-09-07 |
| Licens | ODbL 1.0 |
| SHA-256 | `8ff12d33f735452978bc99b9558c4ce695026035b0e206e8f524c87d2c6d848a` |
| I repot | `docs/09-kallor/stattared-osm.xml` (84 KB) |

Adressen är en levande fråga: samma adress ger ett annat svar i morgon, eftersom OSM
ändras hela tiden. Därför ligger just det uttag arbetet vilar på i repot, med sin
kontrollsumma — annars vore källan omöjlig att kontrollera i efterhand.

Uttaget innehåller Stättaredsvägen, gårdsplanen, fyra byggnader, tre parkeringar och
betesmarken sydost om vägen. Det användes för att kontrollera att gårdens koordinater
ligger rätt, och är underlaget när den ritade bakgrunden (`02-§5.30`) en gång ritas.

`source/map/background.svg` är ritad ur det här uttaget, med två tillägg som gården själv
märkt ut på ritningen och som inte finns i OSM: den nya toalettbyggnaden och de tre
staketen som delar betesmarken i 1:an, 2:an, 3:an och 4:an. De är gårdens egna uppgifter,
avlästa ur ritningen, och håller på någon meter — inte uppmätta.

Att indelningen stämmer går att pröva: de fyra numrerade hagarnas koordinater, som lästes
ur ett ortofoto innan staketen fanns, hamnar i var sitt fält och i ordning från nordost
till sydväst. Två oberoende avläsningar som pekar åt samma håll.

Resten följer OSM:s taggar. Formerna följer taggarna:
`landuse=meadow` och `grass` blir betesmark, `landuse=farmyard` gårdsplanen,
`amenity=parking` parkeringarna, `barrier=wall` en streckad gräns, `highway=unclassified`
och `service` vägarna, `highway=path` stigarna, och `building` husen. Inget är påhittat:
ritningen visar det OSM känner till, ingenting annat. Hagarnas inre gränser saknas därför
än så länge, och gårdens nya toalettbyggnad likaså — den finns inte i OSM.

En ritning härledd ur OSM är ett *produced work* i ODbL:s mening: den ska bära
"© OpenStreetMap contributors", men gör inte resten av repot till ODbL. Google Maps och
Google Earth är **inte** användbara här — deras villkor förbjuder uttryckligen att rita
av satellitbilden.

### Hagarnas namn — gårdens egen skylt

Den här källan har varken adress eller kontrollsumma, och det är avsiktligt: den är
ingen hämtad fil utan en skylt på gården, fotograferad 2026-09-07. Reglerna ovan
(`09-§1.1`) är skrivna för filer vi laddat ner. Posten står här ändå, eftersom frågan
*var kom det ifrån* är precis lika viktig för hagarnas namn som för en logotyp.

Namnen i `source/data/locations/` är skyltens: Tåmossen, Bräckebur, Dammen, Lilla och
Stora grishagen, Ekbacken, Trekanten, 1:an–4:an, Dalen, Lygnslätt 1 och 2, gethuset och
kanin- och hönshuset. Gården har godkänt att uppgifterna används.

Skylten är också enda kända källan till vilken hage som är vilken. Gården har två skyltar
med **olika** bokstavssystem — pappersskylten märker husen A–D, den målade tavlan märker
platserna A–Q och husen 1–5 — och de går inte att lägga ihop. Sajten följer
pappersskylten.
