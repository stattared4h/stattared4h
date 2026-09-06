# Design — Komponenter

Visuella regler per komponent. Del av [designindexet](./index.md).

Alla värden refererar till tokens i [css-strategi.md §7.4](./css-strategi.md).
Inga literaler.

---

## 6. Komponenter

### 6.1 Sidhuvud

Sidhuvudet är vitt, klistrat i toppen, med en tunn kantlinje undertill. Det innehåller
4H-logotypen till vänster och navigeringen till höger. <!-- 05-§6.1 -->

- På mobil fälls navigeringen ihop till en menyknapp med tydlig text, inte bara tre
  streck. Knappen är minst `--tap-target-min` i båda riktningar. <!-- 05-§6.2 -->
- Aktuell sida markeras med djupgrön text och en grön underlinje — aldrig enbart med
  färg, så att markeringen syns även för den som inte skiljer färgerna åt. <!-- 05-§6.3 -->
- Logotypen länkar till startsidan och har alltid en textalternativbeskrivning. <!-- 05-§6.4 -->

### 6.2 Hero

Startsidans hero är ett fotografi från gården med en läsbar textruta ovanpå. <!-- 05-§6.5 -->

- Texten ligger aldrig direkt på fotografiet. Den ligger på en yta med
  `--color-surface`, eller på en djupgrön platta, så att kontrasten är känd oavsett
  bild. <!-- 05-§6.6 -->
- Heron har högst en primär och en sekundär åtgärd. <!-- 05-§6.7 -->
- Höjden är innehållsstyrd. Ingen fast höjd som klipper texten på en liten
  skärm. <!-- 05-§6.8 -->

### 6.3 Knappar

Tre varianter, inte fler: <!-- 05-§6.9 -->

| Variant | Bakgrund | Text | Användning |
| --- | --- | --- | --- |
| Primär | `--color-green` | vit | Sidans huvudåtgärd, en per vy |
| Sekundär | genomskinlig, `--color-green-deep` kant | `--color-green-deep` | Sidoåtgärder |
| Fara | `--color-danger` | vit | Nollställ framsteg och liknande |

- Radie `--radius-full`, innermarginal `--space-xs` lodrätt och `--space-md` vågrätt.
  Höjden styrs av minsta höjd `--tap-target-min`, inte av marginalen. <!-- 05-§6.10 -->
- Hovring och aktivt tillstånd mörknar bakgrunden till `--color-green-deep`. <!-- 05-§6.11 -->
- Inaktiverade knappar undviks. Går en åtgärd inte att göra, förklara varför i text i
  stället för att visa en grå knapp utan besked. <!-- 05-§6.12 -->

### 6.4 Kort

Kortet är sajtens arbetshäst: ett djur, ett djurslag, en plats. <!-- 05-§6.13 -->

- Vit yta, `--radius-md`, `--shadow-card`, innermarginal `--space-md`. <!-- 05-§6.14 -->
- Bilden ligger överst i fast bildförhållande `4:3` med `object-fit: cover`, så att
  rutnätet inte hoppar när bilderna har olika mått. <!-- 05-§6.15 -->
- Rubriken är en länk, och hela kortet är klickbart — men länken bär texten, så att en
  skärmläsare läser upp något meningsfullt. <!-- 05-§6.16 -->
- Varje bild har `width` och `height` i markupen, så att layouten inte hoppar under
  inläsning. <!-- 05-§6.17 -->

### 6.5 Djurkort

Djurkortet är ett kort med tillägg: art och namn i rubriken, och små etiketter för det
datat vet — rasen, "lantras", och "har lämnat gården" för `status: gone`. <!-- 05-§6.18 -->

- Etiketter har ljusgrön botten och djupgrön text, `--radius-full`,
  `--font-size-small`. <!-- 05-§6.19 -->
- Saknar djuret foto visas en ljusgrön platta med djurslagets namn i djupgrön text,
  aldrig en trasig bild. <!-- 05-§6.20 -->

### 6.6 Faktaruta

Ljusgrön botten, `--radius-md`, ingen kantlinje. Används för platsens `note`,
tillgänglighetsuppgiften och regler vid hagen, som att inte mata djuren. Aldrig fler än
två per sida — blir de fler slutar de märkas. <!-- 05-§6.21 -->

### 6.7 Platssida

Platssidan är QR-kodens måladress och sajtens viktigaste vy. Den läses ofta i solsken, med
en hand, av någon som just skannat en skylt. <!-- 05-§6.22 -->

- Platsens namn som `h1`, direkt under sidhuvudet. Ingen hero-bild som trycker ner
  svaret. <!-- 05-§6.23 -->
- Därefter, omedelbart: vilka djurslag som går här, som stora tryckytor med artens bild och
  namn i plural — "Getter", "Får". Det är sidans svar och ska synas utan att man
  rullar. <!-- 05-§6.24 -->
- `note` från platsen visas som en kort mening under djurslagen, i dämpad text. <!-- 05-§6.25 -->
- Under det: djuren av de arterna med `status: here`, som djurkort, under en rubrik som
  säger vad listan är — "Getterna på gården", aldrig "Djuren i hagen". Sajten vet vilka
  djurslag som går här, inte vilka individer (ADR 0012). <!-- 05-§6.26 -->
- En tom plats säger det rakt ut — "Just nu går inga djur här" — och länkar till kartan.
  Aldrig en tom yta. <!-- 05-§6.27 -->

### 6.8 Formulärfält

- Etiketten står ovanför fältet och är alltid synlig. Platshållartext ersätter aldrig en
  etikett. <!-- 05-§6.32 -->
- Fältet är vitt med `--color-border` ram, `--radius-sm`, minsta höjd
  `--tap-target-min`. <!-- 05-§6.28 -->
- Fel visas under fältet i `--color-danger`, med ord som säger vad som är fel och hur man
  rättar det — inte bara "ogiltigt värde". <!-- 05-§6.29 -->

### 6.9 Sidfot

Djupgrön botten `--color-green-deep` med vit text — 7,4:1, den mest kontrastrika ytan på
sajten. Innehåller länken till huvudsidan på `4h.se/stattared`, en mening om att sajten
inte samlar in uppgifter om besökaren, och länken till repot. Öppettider och
kontaktuppgifter hör till huvudsidan (`02-§1.8`). <!-- 05-§6.30 -->

### 6.10 Karta

Kartan över gården visar platser ur samma data som resten av sajten. Den har alltid en
textbaserad motsvarighet under sig — en lista över platserna — så att informationen finns
även när kartan inte kan laddas eller inte går att använda med skärmläsare. <!-- 05-§6.31 -->
