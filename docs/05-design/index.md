# Designspecifikation — Stättareds 4H-gård

Visuell referens för sajten. Detta dokument är sanningskällan för designbeslut.

Designen ärver 4H:s visuella identitet enligt [ADR 0007](../adr/0007-designen-arver-4h-identitet.md).
Färgerna kommer från 4H-förbundets tema; typografi, rytm och komponenter är våra egna.

Designen är uppdelad på ämnesfiler. Avsnitts-ID (`05-§N.M`) är stabila strängar som
citeras från kod, tester och `99-sparbarhet/` — ID:t kodar inte filens sökväg, så ett
avsnitt kan flyttas mellan filer utan att referenser går sönder.

| Fil | Ämne | Avsnitt |
| --- | --- | --- |
| `index.md` (denna) | Filosofi, färg, typografi, layout, brytpunkter | §1–§5 |
| [`komponenter.md`](./komponenter.md) | Komponenternas visuella regler | §6 |
| [`css-strategi.md`](./css-strategi.md) | Hur CSS skrivs, filstruktur, designtokens | §7 |
| [`bilder-och-tillganglighet.md`](./bilder-och-tillganglighet.md) | Bilder, tillgänglighet, vad man inte gör | §8–§10 |

---

## 1. Designfilosofi

- Sajten används **utomhus, på en mobil, i solsken, ofta av ett barn**. Varje
  designbeslut vägs mot det. <!-- 05-§1.1 -->
- Varm, välkomnande och lantlig känsla — inte myndighetsaktig och inte
  barnslig. <!-- 05-§1.2 -->
- Höga kontraster och stora träffytor. Läsbarhet slår elegans varje gång. <!-- 05-§1.3 -->
- Innehållet först: djuren och hagarna är sajten, inte dekorationen runt dem. <!-- 05-§1.4 -->
- Snabb och lätt. Ingen dekorativ överlast, inga animationer som väntar på sig. <!-- 05-§1.5 -->
- Igenkännbart som 4H. En besökare ska se sambandet med `4h.se`. <!-- 05-§1.6 -->

---

## 2. Färgpalett

### Grundfärger

| ID | Namn | Hex | Användning |
| --- | --- | --- | --- |
| `05-§2.1` | Grön | `#00863f` | Ytor, knappar, aktiva tillstånd — alltid med **vit** text |
| `05-§2.2` | Djupgrön | `#15623e` | All grön **text**, rubriker, sidfot, hover |
| `05-§2.3` | Ljusgrön | `#e7fdf3` | Mjuk bakgrundston, faktarutor, markerade rader |
| `05-§2.4` | Sidbotten | `#f4f6f3` | Sidans bakgrund, en aning grönbruten |
| `05-§2.5` | Vit | `#ffffff` | Kort, innehållsytor, formulärfält |
| `05-§2.6` | Bläck | `#404040` | Brödtext |
| `05-§2.7` | Dämpat bläck | `#5a5a5a` | Metatext, bildtexter, hjälptexter |
| `05-§2.8` | Kantlinje | `#dfe3dd` | Avgränsare, kortkanter, fältramar |
| `05-§2.9` | Sol | `#f2b134` | Accent reserverad för framtida spel enligt ADR 0009. Används inte i fas 1 |
| `05-§2.10` | Solbläck | `#7a4b00` | Text på ljus botten när solaccenten behöver ord |
| `05-§2.11` | Varning | `#b3261e` | Felmeddelanden, destruktiva åtgärder |
| `05-§2.19` | Logotypgrön | `#00693f` | Bara inne i 4H-logotypens egna SVG-filer (ADR 0016). Aldrig som token, yta eller text |
| `05-§2.20` | Bakgrundsskikt | `rgb(64 64 64 / 60%)` | Skiktet bakom en dialog: bläck med 60 % opacitet |

### Varför den gröna inte är exakt 4H:s

4H-temats gröna är `#008b45`. Vit text på den färgen landar på 4,39:1 och missar
AA-gränsen 4,5:1. Vi levererar därför `#00863f`, ett snäpp mörkare och i praktiken
omöjlig att skilja från originalet, som landar på 4,69:1. Djupgrön `#15623e` och
ljusgrön `#e7fdf3` är hämtade oförändrade ur temat. <!-- 05-§2.12 -->

### Förhållandet till förbundets grafiska profil

Källan för 4H:s identitet är Riksförbundet Sveriges 4H:s grafiska profil från 2023, inte
temats stilmall (ADR 0016). Profilen står i källregistret,
[`docs/09-kallor/`](../09-kallor/index.md), med adress, datum och kontrollsumma; dess
palett skrivs inte av hit. <!-- 05-§2.21 -->

De gröna tokens ovan är hämtade ur temat och sammanfaller inte med profilen. Avvikelsen är
känd och står här hellre än att vara osynlig:

| Token | Vårt värde | Profilens närmaste | Läge |
| --- | --- | --- | --- |
| `--color-green` | `#00863f` | `#008b44` | Avviker. Profilens värde bär inte vit text: 4,40:1 |
| `--color-green-deep` | `#15623e` | `#00693f` | Avviker. Profilens värde klarar både vit text på sig och sig själv som text |
| `--color-green-pale` | `#e7fdf3` | `#82c381` | Avviker. Profilen har ingen ljus bakgrundston |

Att flytta paletten dit är en egen ändring, eftersom profilens två gröna inte kan vara yta
och hovring åt varandra när bara den ena bär vit text. Logotypgrönt `05-§2.19` följer
däremot profilen redan.

### Kontrastregler

Dessa regler är absoluta och testas: <!-- 05-§2.13 -->

- **Grön text finns inte.** Behöver text vara grön använder den djupgrön `#15623e`.
  Grön `#00863f` mot sidbotten ger 4,31:1 och underkänns — därför är den en **ytfärg**,
  aldrig en textfärg. <!-- 05-§2.14 -->
- Text på grön yta är alltid vit. <!-- 05-§2.15 -->
- Brödtext är `#404040` på vit eller sidbotten (10,4:1 respektive 9,5:1). <!-- 05-§2.16 -->
- Solfärgen `#f2b134` bär aldrig vit text. Behövs text ovanpå den är den `#404040`. <!-- 05-§2.17 -->

### Mörkt läge

Sajten har medvetet **inget mörkt läge**. Den används i huvudsak utomhus i dagsljus, där
ett ljust gränssnitt är läsbarare, och en andra palett skulle fördubbla underhållet av
kontrastreglerna ovan utan tydlig nytta. Tokenstrukturen i §7 är ändå upplagd så att ett
mörkt läge kan läggas till senare utan att komponenterna rörs. <!-- 05-§2.18 -->

---

## 3. Typografi

### Teckensnitt

Systemets egna teckensnitt används. Inga webbteckensnitt laddas: de kostar en
nätverkshämtning på en uppkoppling vi inte kan lita på, och offline-läget i ADR 0004 blir
enklare utan dem. <!-- 05-§3.1 -->

```css
--font-sans: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
```

Samma stack för rubriker och brödtext. Skillnaden görs med storlek och vikt, inte med
teckensnitt. <!-- 05-§3.2 -->

### Skala

Skalan är satt för mobil först. Rubrikerna växer på större skärmar, brödtexten gör det inte.

| ID | Element | Mobil | Desktop | Vikt | Färg |
| --- | --- | --- | --- | --- | --- |
| `05-§3.3` | H1 | 30px | 40px | 700 | `#15623e` |
| `05-§3.4` | H2 | 24px | 30px | 700 | `#15623e` |
| `05-§3.5` | H3 | 20px | 22px | 700 | `#15623e` |
| `05-§3.6` | Brödtext | 17px | 17px | 400 | `#404040` |
| `05-§3.7` | Liten text | 15px | 15px | 400 | `#5a5a5a` |
| `05-§3.8` | Knapptext | 17px | 17px | 600 | varierar |
| `05-§3.9` | Navigering | 17px | 17px | 600 | `#15623e` |

Brödtexten är 17px, inte 16px. En punkt större kostar ingenting och är märkbart lättare
att läsa på en telefon i solljus. <!-- 05-§3.10 -->

Radhöjd för brödtext: `1.6`. Radlängd hålls under ungefär 70 tecken. <!-- 05-§3.11 -->

Rubriker sätts aldrig i versaler. Svenska ord med åäö tappar läsbarhet i versalsättning. <!-- 05-§3.12 -->

---

## 4. Layout och spacing

### Behållare

| ID | Typ | Maxbredd | Användning |
| --- | --- | --- | --- |
| `05-§4.1` | Bred | `1200px` | Sidhuvud, sidfot, kortrutnät |
| `05-§4.2` | Smal | `680px` | Löpande text, artiklar, formulär |

Behållaren centreras med `margin-inline: auto` och har `--space-md` i sidmarginal på
små skärmar. <!-- 05-§4.3 -->

### Spacingrytm

Basenhet: `8px`. Alla värden är multiplar av den. <!-- 05-§4.4 -->

| ID | Token | Värde | Användning |
| --- | --- | --- | --- |
| `05-§4.5` | `--space-xs` | 8px | Täta mellanrum, ikonmarginal |
| `05-§4.6` | `--space-sm` | 16px | Mellan textelement |
| `05-§4.7` | `--space-md` | 24px | Kortens innermarginal, formulärfält |
| `05-§4.8` | `--space-lg` | 40px | Mellan sektioner på en sida |
| `05-§4.9` | `--space-xl` | 64px | Mellan större sidsektioner |
| `05-§4.10` | `--space-xxl` | 96px | Hero, sidans topp och botten |

### Rutnät

- Mobil: en kolumn för text och sektioner. <!-- 05-§4.11 -->
- Djur- och platskorten är två i bredd redan på mobil. Kortet bärs av sitt foto, och
  ett barn som ska känna igen djuret framför sig jämför fotona med varandra — det går
  bara om flera syns samtidigt. En hage med tjugo getter är annars tio skärmars
  rullning. <!-- 05-§4.12 -->
- Desktop: tre kolumner för djur- och platskort. <!-- 05-§4.13 -->
- CSS Grid utan rutnätsramverk. Rutnät där fler kolumner alltid är bättre — som
  djurslagsrutorna — använder `auto-fit` och `minmax`, så att antalet följer av bredden.
  Djur- och platskorten har ett bestämt antal per bredd i stället, satt vid
  desktopbrytpunkten: `auto-fit` kan inte uttrycka "exakt två, sedan exakt tre", utan ger
  fler och fler kolumner ju bredare fönstret blir. <!-- 05-§4.14 -->

### Träffytor

Allt klickbart är minst `44 × 44px`. Det gäller även ikonknappar, djurslagsrutorna på
platssidan och markörerna på kartan. Ett barn med små händer och en vuxen med vantar ska träffa lika säkert. <!-- 05-§4.15 -->

---

## 5. Brytpunkter

| ID | Namn | Bredd | Beskrivning |
| --- | --- | --- | --- |
| `05-§5.1` | Mobil | < 600px | En kolumn, staplat, hopfälld meny |
| `05-§5.2` | Surfplatta | 600–959px | Två kolumner |
| `05-§5.3` | Desktop | ≥ 960px | Full layout, tre kolumner, utfälld meny |

Mobil är utgångsläget. Mediefrågor skrivs som `min-width` och lägger till, aldrig
`max-width` som tar bort. <!-- 05-§5.4 -->
