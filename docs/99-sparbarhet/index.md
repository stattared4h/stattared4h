# Spårbarhet

Matrisen kopplar ihop krav, dokumentation, test och implementation. Den svarar på två
frågor: *är det här kravet faktiskt byggt?* och *varför finns den här koden?*

---

## Statusvärden

| Status | Betydelse |
| --- | --- |
| `saknas` | Kravet är formulerat men inget är byggt |
| `dokumenterad` | Beskrivet i arkitektur eller design, inte byggt |
| `påbörjad` | Delvis implementerad, eller implementerad utan test |
| `byggd` | Implementerad och täckt av test |
| `manuell` | Går inte att testa i kod; verifieras för hand med angivet steg |

Ett krav med status `manuell` måste ha ett konkret verifieringssteg i anteckningsfältet.
"Kontrollera att det ser bra ut" duger inte; "öppna platssidan i 360 px bredd och bekräfta
att djurslagen syns utan att rulla" duger. <!-- 99-§1.1 -->

`byggd` kräver test. Kod som fungerar men inte bevakas av ett test är `påbörjad`, hur
färdig den än ser ut — det är testet som gör att den förblir färdig. <!-- 99-§1.4 -->

---

## Läget nu

Repot innehåller ramverket — process, beslut, datakontrakt, design och krav för fas 1 —
samt en handskriven startsida och ett provisoriskt byggskript. Ingen datadriven sida,
ingen validering, inget test och ingen service worker finns. Statusen nedan speglar det.

### Krav (`02-§`)

Kraven är sajtens beställning. Allt annat i matrisen finns för att uppfylla dem.

| ID | Ämne | Status | Anteckning |
| --- | --- | --- | --- |
| `02-§1.7`–`1.9` | Komplement till huvudsidan; länk i sidfoten | `påbörjad` | Startsidan länkar i sidfoten; länken i sidhuvudet tas bort med `02-§10.10`. Bevakas av ett sidtest när det finns |
| `02-§1.10` | Tumregel för vad som hör hit | `dokumenterad` | Vägledande |
| `02-§2` | Målgrupp | `dokumenterad` | Vägledande |
| `02-§3.1`–`3.4` | Roller via GitHub, ingen egen inloggning | `manuell` | Kontrollera under *Settings → Rules* att regelverket *Protect main* är aktivt och kräver pull request |
| `02-§3.5` | Djur som lämnat gården behålls | `saknas` | Bevakas av valideraren (`02-§6.3`) |
| `02-§4` | Kravintag via issues | `dokumenterad` | Process |
| `02-§5.1`–`5.3` | Sidtyper, adresser, 404 | `saknas` | Tillkommer med Eleventy |
| `02-§5.4` | Sidhuvud | `påbörjad` | Namn och huvudsidelänk finns på startsidan; kartlänken saknas |
| `02-§5.5` | Sidfot | `påbörjad` | Startsidans sidfot följer `05-§6.30`; inget test |
| `02-§5.6` | En `h1`, `lang`, `title`, `description` | `påbörjad` | Uppfyllt på startsidan; bevakas av html-validate när den finns |
| `02-§5.7`–`5.8` | Startsidan | `saknas` | Dagens startsida är en platshållare utan djurslag |
| `02-§5.9`–`5.13` | Platssidan | `saknas` | |
| `02-§5.14`–`5.18` | Djursidan | `saknas` | |
| `02-§5.19`–`5.22` | Artsidan | `saknas` | |
| `02-§5.23`–`5.27` | Kartan | `saknas` | Mekanismen i `03-§9` |
| `02-§5.28` | Djurkortet | `saknas` | |
| `02-§6.1`–`6.7` | Läsning och validering | `saknas` | Valideraren är nästa steg efter verktygskedjan |
| `02-§6.8`–`6.9` | Härledning och sortering | `saknas` | `source/ts/domain/derive.ts` finns inte |
| `02-§6.10` | Tester mot QA-datat | `saknas` | Datasetet finns; testerna inte |
| `02-§6.11` | Test: inget `location`-fält | `saknas` | |
| `02-§7.1`–`7.9` | Manifest och service worker | `saknas` | |
| `02-§7.10` | Installation på iOS och Android | `saknas` | Blir `manuell` med steget i kravet när service workern finns |
| `02-§8.1`–`8.2` | Bildfiler och validering av dem | `saknas` | `source/images/` finns inte |
| `02-§8.3`–`8.4` | Hjälpkommandon för bilder | `saknas` | Kräver ett bildbibliotek; granskas som beroende |
| `02-§8.5`–`8.7` | Leverans av bilder | `saknas` | |
| `02-§9.1`–`9.2` | Eleventy, esbuild, Node 22.18 | `saknas` | `scripts/build.mjs` är ett provisorium som byts ut |
| `02-§9.3` | `npm run lint` | `påbörjad` | markdownlint och yamllint körs i CI, men inte via `npm run lint`; html-validate, stylelint, eslint saknas |
| `02-§9.4` | `npm start` med ombygge | `påbörjad` | Bygger och serverar; bygger inte om vid ändring |
| `02-§9.5`–`9.6` | Inga beroenden till besökaren; låsta byggberoenden | `påbörjad` | Sant i dag eftersom inga beroenden finns; inget test |
| `02-§9.7` | Alla skript finns och CI kör dem utan `--if-present` | `saknas` | `quality.yml` kör med `--if-present` |
| `02-§9.8` | Test av bas-sökvägen på det färdiga bygget | `påbörjad` | En regex på mallen i `build.mjs`; inget test av `public/` |
| `02-§9.9` | Test av tokens och kontrast | `saknas` | |
| `02-§9.10` | Dokumentkontroll i CI | `saknas` | |
| `02-§9.11` | Deploy efter grön kvalitet, `npm ci` | `saknas` | Deployen kör parallellt med kvalitetsflödet och använder `npm install` |
| `02-§9.12` | Produktion och QA i samma utgåva | `saknas` | |
| `02-§10.1`–`10.10` | Sidhuvud, meny, hoppa-till-innehåll | `saknas` | Startsidans sidhuvud har namn och en huvudsidelänk som ska bort; inga ikonknappar |
| `02-§10.11`–`10.13` | Installknapp | `saknas` | Kräver manifest och service worker (`02-§7`) |
| `02-§10.14` | Till toppen | `saknas` | |
| `02-§10.15`–`10.20` | Feedback via förifylld GitHub-issue | `saknas` | Issue-mallen `.github/ISSUE_TEMPLATE/feedback.md` finns inte |
| `02-§10.21` | Sidfot | `påbörjad` | Huvudsidelänk, repolänk och integritetsmening finns; 4H-loggan och versionen saknas |
| `02-§10.22`–`10.26` | Version i sidfot, `VERSION`, taggar, cachenamn | `saknas` | Ingen `VERSION`-fil, ingen `BUILD_VERSION` i deployen |
| `02-§10.27` | Om-sidan | `saknas` | |
| `02-§10.28`–`10.29` | Statusrad för ny version och offline | `saknas` | |
| `02-§10.30` | Dela | `saknas` | Kräver de datadrivna sidorna |
| `02-§10.31`–`10.32` | Egen appikon, inline-SVG-ikoner | `saknas` | Ikonen är inte ritad; favicon svarar 404 i dag |

### Designspecifikation (`05-§`)

| ID | Ämne | Status | Anteckning |
| --- | --- | --- | --- |
| `05-§1` | Designfilosofi | `dokumenterad` | Vägledande |
| `05-§2.1`–`2.11` | Färgpalett | `påbörjad` | Levererad i `tokens.css`; testet i `02-§9.9` saknas |
| `05-§2.12`–`2.18` | Kontrastregler och mörkt läge | `dokumenterad` | Testas av `02-§9.9` |
| `05-§2.19` | Logotypgrön bara i logotypens SVG | `dokumenterad` | Logotypen finns inte i repot ännu |
| `05-§2.20` | Bakgrundsskikt för dialog | `saknas` | Token `--color-backdrop` finns inte i `tokens.css` |
| `05-§3` | Typografi | `påbörjad` | Tokens och `base.css`; `05-§3.9` navigering saknas |
| `05-§4.1`–`4.10` | Behållare och spacing | `påbörjad` | Tokens och `layout.css`; inget test |
| `05-§4.11`–`4.15` | Rutnät och träffytor | `dokumenterad` | Rutnätet skrivs med djurkorten |
| `05-§5` | Brytpunkter | `dokumenterad` | Tillämpas när layouten skrivs |
| `05-§6.3` | Knappar | `påbörjad` | `.button` på startsidan, 47 px hög |
| `05-§6.30` | Sidfot | `påbörjad` | Startsidans sidfot; logotyp och version saknas |
| `05-§6.33`–`6.37` | Ikonknapp, meny, dialog, statusrad, sidhuvudets höjd | `saknas` | |
| `05-§6` övrigt | Komponenter | `saknas` | Skrivs när markupen finns, enligt `05-§7.2` |
| `05-§7.1`, `7.5` | Inga hårdkodade värden | `saknas` | Kräver stylelint (`02-§9.3`); följs i dag för hand |
| `05-§7.4` | Designtokens | `påbörjad` | `tokens.css`; testet i `02-§9.9` saknas |
| `05-§7.7`–`7.8` | Fokusmarkering, rörelse | `påbörjad` | I `base.css`; inget test |
| `05-§7.10` | Filstruktur för CSS | `påbörjad` | Tre av fyra filer; `utilities.css` skapas vid behov |
| `05-§8` | Bilder | `dokumenterad` | Kraven i `02-§8` |
| `05-§9` | Tillgänglighet | `dokumenterad` | Delvis testbar med html-validate |
| `05-§10` | Vad man inte gör | `dokumenterad` | Delvis kontrollerbar med lint |

### Datakontrakt (`04-§`)

| ID | Ämne | Status | Anteckning |
| --- | --- | --- | --- |
| `04-§1`–`04-§9` | Modell för djur, arter, raser, platser och bilder | `dokumenterad` | QA-datat i `source/data-qa/` följer kontraktet; ingen kod läser det ännu |
| `04-§4.2` | Djur har inget `location`-fält | `saknas` | Bevakas av `02-§6.11` |
| `04-§10` | Validering | `saknas` | Kraven i `02-§6` |

### Miljöer (`06-§`)

| ID | Ämne | Status | Anteckning |
| --- | --- | --- | --- |
| `06-§1.1`–`1.2`, `1.4` | QA och produktion ur samma kod i samma utgåva | `saknas` | Deployen bygger bara produktion |
| `06-§1.3` | QA-sidor bär `noindex` | `saknas` | `source/robots.txt` finns men verkar inte på en projektsajt |
| `06-§1.5` | QA-versionen får tillägget " – QA" | `saknas` | |
| `06-§2.1` | `DATA_DIR` väljer dataset | `saknas` | Bygget läser inget dataset |
| `06-§2.2` | Tester körs mot QA-data | `saknas` | Inga tester finns |
| `06-§2.3` | QA-datat prövar gränsfallen | `påbörjad` | Datasetet finns och `source/data-qa/README.md` listar fallen; bildfilerna saknas |
| `06-§2.4` | Kontraktsändring ändrar QA-datat | `dokumenterad` | Process |
| `06-§3.1` | `BASE_PATH` | `påbörjad` | `scripts/build.mjs`; ersätts av Eleventys `pathPrefix` |
| `06-§3.2`–`3.3` | Hjälpfunktion och QA under `/qa/` | `saknas` | Testet är `02-§9.8` |
| `06-§3.4` | CI sätter bas-sökvägen via `configure-pages` | `manuell` | Öppna `https://stattared4h.github.io/stattared4h/` och bekräfta att sidan har stil |
| `06-§3.5` | Bygget vägrar handskriven absolut sökväg | `påbörjad` | Regex på mallen; ersätts av `02-§9.8` |
| `06-§4`–`06-§5` | Flytt till webbhotell, hemligheter | `dokumenterad` | Vägledning |

### Arkitektur (`03-§`)

| ID | Ämne | Status | Anteckning |
| --- | --- | --- | --- |
| `03-§1`–`03-§7` | Byggkedja, skikt, härledda vyer, sidor, offline, bilder, redigering | `dokumenterad` | Mekanismerna bakom `02-§5`–`02-§8` |
| `03-§8.1` | `npm run build` | `påbörjad` | Provisoriskt skript utan Eleventy |
| `03-§8.2`–`8.4` | Test, lint och CI | `saknas` | Kraven i `02-§9` |
| `03-§8.5` | Merge till `main` deployar | `påbörjad` | Fungerar, men utan beroende av kvalitetsflödet (`02-§9.11`) |
| `03-§8.6`–`8.9` | Bevakande tester, Node 22.18, deploy-ordning, dubbelbygge | `saknas` | |
| `03-§9` | Kartan | `dokumenterad` | |
| `03-§10` | Sidhuvud, sidfot, version och feedback | `dokumenterad` | Mekanismen bakom `02-§10` |

---

### Vad som inte spåras här

Två sorters dokument har medvetet inga `§`-ID och står därför utanför matrisen:

- **ADRerna** i `docs/adr/`. De dokumenterar beslut, inte krav. Ett beslut är inte
  "byggt" eller "saknas" — det gäller eller är ersatt av ett senare beslut.
- **`docs/07-SAKERHET.md`** och `SECURITY.md`. De är vägledning och policy för den som
  förvaltar repot, inte krav på sajten. Att skyddet faktiskt fungerar verifieras av
  CI-kontrollerna själva, inte av den här matrisen. <!-- 99-§1.3 -->

---

## Summering

| Status | Antal rader |
| --- | --- |
| `saknas` | 46 |
| `dokumenterad` | 17 |
| `påbörjad` | 22 |
| `byggd` | 0 |
| `manuell` | 2 |

Summeringen räknar rader i tabellerna under *Läget nu* och uppdateras i fas 5 av processen i
`CLAUDE.md`. Dokumentkontrollen i `02-§9.10` fäller när den inte stämmer. <!-- 99-§1.2 -->
