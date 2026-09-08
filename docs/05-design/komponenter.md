# Design — Komponenter

Visuella regler per komponent. Del av [designindexet](./index.md).

Alla värden refererar till tokens i [css-strategi.md §7.4](./css-strategi.md).
Inga literaler.

---

## 6. Komponenter

### 6.1 Sidhuvud

Sidhuvudet är vitt, klistrat i toppen, med en tunn kantlinje undertill. Under
desktopbrytpunkten är det en rad ikonknappar (6.11): meny och "Tillbaka" till vänster,
"till toppen" i mitten, installation och feedback till höger. Startsidan har ingen
"Tillbaka", och platsen står tom — menyknappen ligger på samma ställe på varje sida. Från desktopbrytpunkten innehåller det
4H-logotypen och sajtens namn till vänster, länkarna i raden, och installation och
feedback som ikoner utan botten till höger (`02-§10.3`, `02-§10.7`). <!-- 05-§6.1 -->

- Menyknappen visar tre streck **och** ordet "Meny" under dem i `--font-size-small`,
  inte bara strecken. Knappen är minst `--tap-target-min` i båda riktningar. <!-- 05-§6.2 -->
- Aktuell sida markeras med djupgrön text och en grön underlinje — aldrig enbart med
  färg, så att markeringen syns även för den som inte skiljer färgerna åt. <!-- 05-§6.3 -->
- Logotypen länkar till startsidan och har alltid en textalternativbeskrivning. <!-- 05-§6.4 -->
- Runt 4H-logotypen — i sidhuvudet, i menykortet och i sidfoten — är en fri yta där inget
  annat får synas. Förbundets profil mäter den i `H`:ets nedre högra kvadrat: en hel
  kvadrat till höger om och under logotypen, en halv upptill och till vänster. Kvadraten är
  12,6 % av logotypens bredd, vilket vid sidhuvudets 44 px höga logotyp blir 8 px till
  höger och under och 4 px upptill och till vänster — `--space-xs` respektive halva. Alla
  tre placeringarna ligger på eller över det. <!-- 05-§6.38 -->
- Sidhuvudets höjd är densamma på varje sida och vid varje rullningsläge, så att
  innehållet aldrig hoppar när det klistras fast. <!-- 05-§6.37 -->

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

- Vit yta, `--radius-md`, `--shadow-card`, innermarginal `--space-md`. Djurkortet, som
  delar telefonens bredd med ett till (`02-§5.50`), har `--space-sm` under
  desktopbrytpunkten: en rasetikett är ett enda långt ord och behöver bredden. En etikett
  som ändå inte får plats bryts hellre än att sticka utanför kortet. <!-- 05-§6.14 -->
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

### 6.16 Navkort

Navkortet är startsidans enda innehåll: ett kort per ärende sajten bär
(`02-§5.7`, ADR 0023). <!-- 05-§6.45 -->

- Samma yta som kortet i 6.4 — vit, `--radius-md`, `--shadow-card` — och samma rutnät som
  djurkorten, två i bredd på mobil och tre från desktopbrytpunkten (`02-§5.64`). Hela
  kortet är länken, och rubriken bär texten (6.4).
- I stället för ett foto står en ritad symbol, 48 px och 64 px från desktopbrytpunkten,
  centrerad på en ljusgrön platta `--color-green-pale` i kortets fulla bredd. Plattan är
  ett band med `--space-md` innermarginal, inte fotots `4:3`-ruta: navets rutnät har inga
  bildkort att linjera mot, och en platta som växer med kortet blir mest tom grönska på en
  bred skärm. Symbolen är `--color-green-deep`, ritad i samma streck som kartans markörer
  (`05-§6.39`), och `aria-hidden`: rubriken säger redan vad kortet är.
- Under plattan står rubriken i `--font-size-h3`, vikt 700, och därunder en rad i
  `--font-size-small` och `--color-ink-soft` som säger vad besökaren hittar. Rubriken är
  ett eller två ord — "Kartan", "Djuren" — eftersom ett kort som delar telefonens bredd
  med ett till annars bryter rubriken över tre rader. En rad under, inte två: kortet ska
  gå att läsa i ett ögonkast, och två kort ska rymmas ovanför vecket på en telefon.
- Korten i en rad är lika höga, som djurkorten (`05-§6.14`), så att en längre rad på det
  ena inte lämnar det andra hängande kort.

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
sajten. Innehåller, i ordning: 4H-logotypen i vit variant, länken till huvudsidan på
`4h.se/stattared`, länken till repot, meningen om att sajten inte samlar in uppgifter om
besökaren, och versionen sist i `--font-size-small` med vit text (`02-§10.21`).
Öppettider och kontaktuppgifter hör till huvudsidan (`02-§1.8`). <!-- 05-§6.30 -->

### 6.11 Ikonknapp

En fyrkantig knapp om `--tap-target-min` × `--tap-target-min` med `--radius-md`, botten
`--color-green` och vit inline-SVG-ikon om 22 px. Den används i sidhuvudets rad på mobil
(6.1) och för "till toppen". Från desktopbrytpunkten har installation och feedback ingen
botten och ikonen är `--color-green-deep`. Varje ikonknapp har `aria-label`, och ikonen
`aria-hidden`. <!-- 05-§6.33 -->

### 6.12 Meny

Menyn på mobil är ett kort som fälls ut under sidhuvudet, indraget `--space-xs` från
kanterna, med botten `--color-green`, `--radius-lg` och `--shadow-raised`. Länkarna är
vita, `--font-size-body`, vikt 700, en per rad med lodrät innermarginal `--space-xs`, och
får `--focus-ring` i vitt. Kortet öppnas och stängs med en övergång under 250 ms som
stängs av vid `prefers-reduced-motion`. Från desktopbrytpunkten finns inget kort;
länkarna ligger i sidhuvudets rad i `--color-green-deep`, vikt 600. Varje länk är minst
`--tap-target-min` hög (`02-§10.39`). Medan kortet är öppet ligger ett överlägg i
`--color-backdrop` (`05-§2.20`) över sidan, under kortet men över innehållet, och
sidhuvudets rad ligger ovanpå överlägget så att menyknappen aldrig döljs
(`02-§10.38`). <!-- 05-§6.34 -->

- Menyknappen bär båda lägena i markupen: tre streck med ordet "Meny" när kortet är
  stängt, ett kryss med ordet "Stäng" när det är öppet. Vilket som syns avgörs av
  knappens `aria-expanded`, så tillståndet står på ett ställe. <!-- 05-§6.42 -->
- Raden "Djuren" är en fälla (`02-§10.43`): en `<summary>` med samma mått och vikt som en
  vanlig menylänk, och till höger en vinkel om 16 px som pekar nedåt när raden är hopfälld
  och uppåt när den är utfälld. Layouten ligger på ett element inuti `<summary>`, aldrig på
  `<summary>` självt: en flexad `<summary>` slutar växla i somliga Safari-versioner, och
  fällan får inte behöva script för att öppnas (`02-§10.44`). Vinkeln följer `<details open>`, inte en klass, och roterar
  med samma övergång som kortet — avstängd vid `prefers-reduced-motion`. Webbläsarens egen
  triangel tas bort. Underraderna dras in `--space-md`, står i `--font-size-small` och är
  fortsatt minst `--tap-target-min` höga (`02-§10.39`); den första är "Alla djuren", och
  under den ett djurslag per rad. <!-- 05-§6.46 -->

### 6.13 Dialog

En dialog ligger på ett bakgrundsskikt i `--color-backdrop` (`05-§2.20`) och är en yta
i `--color-surface` med `--radius-lg`, `--shadow-raised` och innermarginal `--space-md`,
som mest `--container-narrow` bred. Rubriken är en `h2`; kryssknappen är en ikonknapp i
övre högra hörnet. Dialogen tonar in på högst 200 ms enligt `05-§7.8`. Den används för
feedback (`02-§10.15`). <!-- 05-§6.35 -->

### 6.14 Statusrad

En statusrad ligger direkt under sidhuvudet, i hela bredden, med botten
`--color-green-pale` och text i `--color-green-deep`, innermarginal `--space-xs`
`--space-md`, och högst en knapp (sekundär variant) till höger om texten. Den används
för "Ny version finns" och "Du är offline" (`02-§10.28`–`10.29`), och för iOS-texten om
installation (`02-§10.12`). Aldrig fler än en statusrad åt gången. <!-- 05-§6.36 -->

### 6.10 Karta

Kartan över gården visar platser ur samma data som resten av sajten. Den har alltid en
textbaserad motsvarighet under sig — en lista över platserna — så att informationen finns
även när kartan inte kan laddas eller inte går att använda med skärmläsare. <!-- 05-§6.31 -->

Markören är en rund bricka om `--space-md`, centrerad i träffytan `--tap-target-min`
(`05-§4.15`), med en ring `--border-width` och `--shadow-raised`. Ringen är motsatsen
till brickans botten — grön kring den ljusa, vit kring den fyllda — så att markören
behåller sin kant både över ritningens ljusa mark och över dess mörka byggnader. Det är
samma yta som prickens, så en symbol i stället för en prick gör inte klungan kring
gårdsplanen trängre än den redan är (`02-§5.33`). Inuti står platsens symbol, 20 px. De
ritade symbolerna har samma streck som sidhuvudets ikoner (6.11); de tre som är ett
vägmärkes egen figur är fyllda, och behöver de 20 px för att koppen och huset inte ska
klumpa ihop sig. En `djurplats` är fylld — botten
`--color-green`, symbolen vit — och gårdens övriga platser är ljusa: botten
`--color-surface`, symbolen `--color-green-deep`. Så syns det redan på håll, före
symbolens form, vilka markörer som är djur. <!-- 05-§6.39 -->

Nya symboler ritas inte fritt. Finns ett svenskt vägmärke vars figur stämmer med platsen
är symbolen den figuren (`02-§5.38`); saknas den följer motivet vanlig svensk skyltning,
ritat i sidhuvudets streck.

I listan under kartan står samma symbol framför platsens namn, 20 px i
`--color-green-deep`, utan bricka. Listan är därmed också symbolernas
teckenförklaring (`02-§5.39`). <!-- 05-§6.40 -->

Rutan som öppnas på en markör är en dialog (6.13) mitt på skärmen, som mest 22 rem bred —
smalare än feedbackdialogen, eftersom den rymmer ett namn och några rader, inte ett
formulär. Överst platsens namn som dialogens rubrik med stängknappen bredvid, därunder
djurslagen i halvfet, och upplysningen och tillgängligheten i `--color-ink-soft`. Sist
länken som en primär knapp, och bara när platsen är en `djurplats`. <!-- 05-§6.43 -->

Kartans tre knappar — zooma in, zooma ut och "Visa hela kartan" — är ikonknappar (6.11)
som ligger i kartans nedre högra hörn, staplade med `--space-xs` mellan sig och
`--space-sm` från kanten. De ligger ovanpå ritningen, så de har alltid botten
`--color-surface`, ikon `--color-green-deep` och `--shadow-raised` för att synas mot både
ljus mark och mörk byggnad. "Visa hela kartan" syns bara när kartan är inzoomad; de andra
två alltid, och den som inte kan användas mer är nedtonad och `disabled`. Alla tre är
dolda tills JavaScript kör (`02-§5.41`). <!-- 05-§6.41 -->

### 6.17 Bingobricka

Brickan (`02-§12`) är ett kvadratiskt rutnät med `--space-xs` mellan rutorna, så brett
som spalten tillåter men aldrig högre än det som återstår av skärmen under sidhuvudet,
rubriken och lägesraden (`02-§12.6`). Varje ruta är en knapp utan innermarginal, vit med
`--color-border` som ram och `--radius-sm`: bilden fyller rutan och namnet står under den
i `--font-size-small`, vikt 600, `--color-green-deep`, en rad med avhugg. En avbockad ruta
byter ram och botten till `--color-sun` (`05-§2.9`), namnet till `--color-sun-ink`, tonar
ned bilden och lägger en bock i `--color-sun-ink` över den — bilden syns fortfarande,
så barnet ser vilket djur bocken gäller. Lägesraden ovanför brickan är centrerad,
`--color-ink-soft` och vikt 600. Dialogen som öppnas från en ruta är dialogen i 6.13 med
bilden överst i `--radius-md`. Vinstrutan under brickan är faktarutan i 6.6 med rubriken
"Bingo!" i `--font-size-h1` och `--color-sun-ink`, centrerad. Konfettin ritas i
`--color-sun`, `--color-green`, `--color-green-pale` och `--color-green-deep`, lästa ur
tokens vid körning. <!-- 05-§6.47 -->

### 6.18 Spanalistan

Spana! (`02-§13`) är bingots syskon och lånar dess delar: lägesraden, den avbockade rutan,
vinstrutan och konfettin är samma som i 6.17. Skillnaden är att stoppen står i **en spalt**
och inte i ett rutnät. En runda är fyra eller åtta stopp och ska rullas igenom med tummen
medan man går, inte överblickas på en gång som brickan — och ledtrådens bild är hela
frågan, så den får all bredd spalten har.

Ett stopp är en knapp i kortets yta (6.4) med bilden överst i `--radius-md`, som mest
240 px hög så att åtta stopp inte blir åtta skärmar att rulla igenom, och ordningsnumret
i `--color-ink-soft` under den. Bilden beskärs aldrig: höjden är tagen och inte bredden,
som i verktygets kort (6.15), eftersom en beskärning kan klippa bort just den detalj
spelaren ska leta efter. Ett stående foto blir därför smalare än kortet, centrerat. Ett avbockat stopp bär samma soltoner och samma bock som
bingots ruta (`05-§6.47`), så att de två spelen känns igen som ett par.

Dialogen är dialogen i 6.13 med bilden överst i `--radius-md` och som mest 45 % av
skärmhöjden — högre, och svaret och knappen hamnar utanför skärmen på en telefon —
ledtrådstexten under den i brödtext, och därunder — bara när stoppet är avbockat — svaret: platsens namn i
halvfet på en ljusgrön platta `--color-green-pale`, samma par som statusraden i 6.14,
eftersom det är ett besked och inte ett fel. Knappen ligger sist och byter etikett med
tillståndet. <!-- 05-§6.48 -->

### 6.15 Bildverktygets kort

Verktygssidan (`02-§11`) lånar sidans egna delar: fälten är formulärfält (6.8), knapparna
är knappar (6.3), och kortet runt varje bild är kortet (6.4) med `--space-sm` som
innermarginal i stället för `--space-md`, eftersom bilden själv bär höjden.

Listan över beredda bilder är ett rutnät med `--space-md` mellan korten, utan punkter.
Varje kort börjar med bilden, som är centrerad, som mest 320 px hög och aldrig bredare än
kortet — höjden är tagen och inte bredden, så att ett stående foto inte fyller hela
skärmen. Under bilden står filnamnet, bild-id:t, måtten och storleken i `--font-size-small`
och `--color-ink-soft`, och därunder de två fälten. Felmeddelandet står under fälten i
`--color-danger`, samma regel som 6.8. Nedladdningsknapparna är sekundära och ligger sist,
sida vid sida med `--space-xs` mellan sig och radbrytning på smal skärm.

Kryssrutan "Det här är en ledtråd till Spana!" står under de två fälten, som en vanlig
kryssruta (6.8) med etiketten efter rutan. Ikryssad fäller den ut platsväljaren och
ledtrådsfältet i samma spalt och med samma etikettstil som fälten ovanför; ofylld syns
ingenting av dem. Ledtrådens nedladdningsknapp står sist bland de andra sekundära
knapparna och finns bara när rutan är i.

Statusraden överst i verktyget är ljusgrön `--color-green-pale` med djupgrön text, samma
par som platshållaren (6.20), eftersom den säger hur det går och inte att något är
fel. <!-- 05-§6.44 -->
