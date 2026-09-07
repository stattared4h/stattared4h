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
samt Eleventy-bygget med grundlayout, sidhuvud, sidfot och versionsmodul. Ingen
datadriven sida, ingen validering och ingen service worker finns. Statusen nedan
speglar det.

### Krav (`02-§`)

Kraven är sajtens beställning. Allt annat i matrisen finns för att uppfylla dem.

| ID | Ämne | Status | Anteckning |
| --- | --- | --- | --- |
| `02-§1.7`–`1.9` | Komplement till huvudsidan; länk i sidfoten | `byggd` | Sidfoten på varje sida länkar till huvudsidan och sidhuvudet gör det inte; bevakas av `tests/build/site.test.ts` |
| `02-§1.10` | Tumregel för vad som hör hit | `dokumenterad` | Vägledande |
| `02-§2` | Målgrupp | `dokumenterad` | Vägledande |
| `02-§3.1`–`3.4` | Roller via GitHub, ingen egen inloggning | `manuell` | Kontrollera under *Settings → Rules* att regelverket *Protect main* är aktivt och kräver pull request |
| `02-§3.5` | Djur som lämnat gården behålls | `påbörjad` | Valideraren tar emot `status: gone` och härledningarna behåller djuret (`tests/domain/derive.test.ts`); sidan tillkommer med djursidan (`02-§5.14`) |
| `02-§4` | Kravintag via issues | `dokumenterad` | Process |
| `02-§5.1` | Sidtyper och adresser | `påbörjad` | Startsidan finns i `source/pages/`; plats-, djur-, art- och kartsidan tillkommer med domänskiktet |
| `02-§5.2`–`5.3` | `index.html` i katalog; egen 404-sida | `byggd` | `source/pages/404.njk`; adressformen och 404-sidans text och länkar bevakas av `tests/build/site.test.ts` |
| `02-§5.4` | Sidhuvud | `påbörjad` | `source/layouts/header.njk` på varje sida; status per krav under `02-§10.1`–`10.10` |
| `02-§5.5` | Sidfot | `byggd` | `source/layouts/footer.njk` på varje sida; innehåll och versionsrad bevakas av `tests/build/site.test.ts` |
| `02-§5.6` | En `h1`, `lang`, `title`, `description` | `byggd` | `source/layouts/base.njk`; bevakas per byggd sida av `tests/build/site.test.ts` |
| `02-§5.7`–`5.8` | Startsidan | `saknas` | Dagens startsida är en platshållare utan djurslag |
| `02-§5.9`–`5.13` | Platssidan | `saknas` | |
| `02-§5.14`–`5.18` | Djursidan | `saknas` | |
| `02-§5.19`–`5.22` | Artsidan | `saknas` | |
| `02-§5.23`–`5.27` | Kartan | `saknas` | Mekanismen i `03-§9` |
| `02-§5.28` | Djurkortet | `saknas` | |
| `02-§6.1` | Bara `*.yaml` läses ur `DATA_DIR` | `byggd` | `source/ts/domain/load.ts`; `tests/domain/load.test.ts` |
| `02-§6.2` | Valideringen körs först i bygget | `påbörjad` | `loadValidDataset` i `source/ts/domain/index.ts` kastar vid fel; bygget anropar den när Eleventy tillkommer (`02-§9.1`) |
| `02-§6.3` | Fäller vid allt i `04-§10` och vid okända fält | `byggd` | `source/ts/domain/validate.ts`; varje regel prövas i `tests/domain/validate.test.ts` |
| `02-§6.4` | Varningar | `byggd` | `collectWarnings` i `validate.ts`; QA-datats exakta varningar i `tests/domain/validate.test.ts` |
| `02-§6.5` | Meddelanden på svenska med fil och fält | `byggd` | `formatIssue` i `validate.ts`; `tests/domain/validate.test.ts` och `load.test.ts` |
| `02-§6.6` | `npm run validate` | `byggd` | `scripts/validate.mjs`; `tests/domain/validate-script.test.ts` kör skriptet och kontrollerar felkoden |
| `02-§6.7` | `born` normaliseras | `byggd` | `source/ts/domain/born.ts`; `tests/domain/born.test.ts` |
| `02-§6.8` | Härledningar utan webbläsar-API:er | `byggd` | `source/ts/domain/derive.ts`; `tests/domain/derive.test.ts` mot fallen i QA-README |
| `02-§6.9` | Deterministisk svensk sortering | `byggd` | `source/ts/domain/sort.ts`; `tests/domain/sort.test.ts` |
| `02-§6.10` | Tester mot QA-datat, ogiltiga poster i testet | `byggd` | `tests/domain/helpers.ts` läser `source/data-qa/`; ogiltiga poster byggs i minnet |
| `02-§6.11` | Test: inget `location`-fält | `byggd` | `tests/domain/no-location.test.ts` läser både `source/data` och `source/data-qa` |
| `02-§6.12` | QA har minst 100 individer och täcker vokabulären | `byggd` | `tests/domain/qa-data.test.ts`; `source/data-qa/` har 100 individer |
| `02-§6.13` | Räknade bestånd för djur utan individsidor | `byggd` | `source/ts/domain/load.ts`, `validate.ts`, `derive.ts`; `tests/domain/qa-data.test.ts` |
| `02-§7.1`–`7.9` | Manifest och service worker | `saknas` | |
| `02-§7.10` | Installation på iOS och Android | `saknas` | Blir `manuell` med steget i kravet när service workern finns |
| `02-§8.1` | Bara webbanpassade bilder i repot | `påbörjad` | `npm run image` skriver filer som håller gränserna; `source/images/` har ännu inga bilder. Efterlevnaden bevakas av `02-§8.2` |
| `02-§8.2` | Validering av bildfiler | `saknas` | Valideraren (`04-§10.7`) |
| `02-§8.3` | `npm run image` | `byggd` | `scripts/image.mjs` och `optimiseImage` i `source/ts/build/images.ts`; `tests/build/images.test.ts` |
| `02-§8.4` | `npm run qa:images` | `byggd` | `scripts/qa-images.mjs` skriver till `source/images-qa/`; `tests/build/images.test.ts` |
| `02-§8.5`–`8.7` | Leverans av bilder | `påbörjad` | `renderPicture`, `renderPlaceholder` och Eleventy-pluginen i `source/ts/build/` är testade och inkopplade i `eleventy.config.js`; ingen sida använder shortcoden ännu, och `credit` visas av sidmallen |
| `02-§9.1` | Eleventy och esbuild | `byggd` | `eleventy.config.js` med esbuild i `eleventy.before`; `erasableSyntaxOnly` i `tsconfig.json` fäller `enum` och `namespace`; byggtesterna kör Eleventy som barnprocess |
| `02-§9.2` | Node 22.18 i `.nvmrc` och `engines` | `påbörjad` | Båda finns, och `eleventy.config.js` importerar `.ts` direkt; inget test |
| `02-§9.3` | `npm run lint` | `påbörjad` | Kör html-validate, stylelint med `declaration-strict-value`, eslint, markdownlint och yamllint; inget test som bevakar att alla fem ingår |
| `02-§9.4` | `npm start` med ombygge | `manuell` | `eleventy --serve --port 8080` med `source/ts/` som extra bevakad katalog. Kör `npm start`, ändra en text i `source/pages/index.njk` och bekräfta att sidan laddas om |
| `02-§9.5`–`9.6` | Inga beroenden till besökaren; låsta byggberoenden | `påbörjad` | Sant i dag eftersom inga beroenden finns; inget test |
| `02-§9.7` | Alla skript finns och CI kör dem utan `--if-present` | `påbörjad` | `quality.yml` kör `build`, `lint`, `typecheck` och `test` utan `--if-present`; `validate` saknas |
| `02-§9.8` | Test av bas-sökvägen på det färdiga bygget | `byggd` | `tests/build/site.test.ts` bygger med `BASE_PATH=/prov/` och läser `href`, `src`, `srcset`, `url()`, manifest och `sw.js` |
| `02-§9.9` | Test av tokens och kontrast | `byggd` | `tests/design/tokens.test.ts` läser paletten ur `05-§2` och räknar kontrasten |
| `02-§9.10` | Dokumentkontroll i CI | `byggd` | `scripts/lib/check-docs.ts` via `npm run lint:docs`, som ingår i lint-kedjan i *Project checks*; testad i `tests/docs/check-docs.test.ts` |
| `02-§9.11` | Deploy efter grön kvalitet, `npm ci` | `manuell` | Öppna en körning av *Deploy till QA* i Actions-fliken och bekräfta att den startades av *Quality* med grönt resultat på samma commit, och att steget *Install dependencies* kör `npm ci --ignore-scripts` |
| `02-§9.12` | Produktion och QA i samma utgåva | `manuell` | Efter en körning av *Deploy till QA*: öppna `https://stattared4h.github.io/stattared4h/` och `.../stattared4h/qa/` och bekräfta att båda svarar, och att körningens sammanfattning anger vilken tagg produktionens kod kom från |
| `02-§10.1`–`10.8` | Sidhuvud, hopp-länk, ikonrad, meny, desktopvariant, aktuell sida | `manuell` | `source/layouts/header.njk`, `source/ts/ui/menu.ts`, `layout.css`, `components.css`. Öppna startsidan i 360 px: raden visar Meny och feedback, menyn öppnas med knappen och stängs med Escape, klick utanför och länkval, och sidhuvudet ligger kvar vid rullning. I 1280 px: logga, namn och länkarna Hem, Karta och Om sajten syns, Hem är understruken. Tab från adressfältet landar på "Hoppa till innehållet" |
| `02-§10.9` | 4H-loggan | `påbörjad` | `source/assets/img/4h-logo.svg` är en märkt platshållare; förbundets sajt publicerar loggan bara som PNG. Byts mot förbundets SVG |
| `02-§10.10` | Ingen huvudsidelänk i sidhuvudet | `byggd` | `tests/build/site.test.ts` |
| `02-§10.11`–`10.13` | Installknapp | `saknas` | Kräver manifest och service worker (`02-§7`) |
| `02-§10.14` | Till toppen | `saknas` | |
| `02-§10.15`–`10.20` | Feedback via förifylld GitHub-issue | `saknas` | Issue-mallen `.github/ISSUE_TEMPLATE/feedback.md` finns inte |
| `02-§10.21` | Sidfot | `byggd` | `source/layouts/footer.njk`; huvudsidelänk, integritetsmening och versionsrad bevakas av `tests/build/site.test.ts`. Loggan är platshållaren i `02-§10.9` |
| `02-§10.22` | Versionsradens lydelser | `byggd` | `tests/domain/version.test.ts` prövar varje fall; att raden skrivs, och utelämnas utan version, bevakas av `tests/build/site.test.ts` |
| `02-§10.23` | `VERSION` med `X.Y` | `påbörjad` | `VERSION` finns med `0.0` och deploy-flödena läser den; `package.json` bär fortfarande ett eget `version`-fält; inget test |
| `02-§10.24` | Produktionsdeploy med godkännande, tagg och Release | `manuell` | Kör *Deploy till produktion* från Actions-fliken, godkänn i miljön `production`, och bekräfta att taggen `v0.0.0` och Releasen `v0.0.0` finns och att sidfoten visar `Version 0.0.0` |
| `02-§10.25` | `BUILD_VERSION`, lokal version, ingen i CI | `byggd` | `source/ts/domain/version.ts`, testad i `tests/domain/version.test.ts` |
| `02-§10.26` | Cachenamnet är versionssträngen | `saknas` | Ingen service worker |
| `02-§10.33` | QA-versionen får " – QA PR<n>" | `manuell` | Merga en pull request och öppna körningen av *Deploy till QA*: jobbet *Compute versions* skriver `0.0.0 – QA PR<n>` med numret på pull requesten, och sidfoten under `/qa/` visar samma sträng |
| `02-§10.34` | QA visar släppet utan suffix efter produktionsdeploy | `manuell` | Efter *Deploy till produktion*: körningens sammanfattning visar samma version för QA som för produktionen |
| `02-§10.35` | Innehållsmerge bygger om produktionen med taggens kod | `manuell` | När en tagg finns: merga en ändring i `source/data/` och bekräfta i körningen av *Deploy till QA* att produktionen byggs från taggen och att loggen säger `Copied source/data from main` |
| `02-§10.36` | Releaseguide | `dokumenterad` | `docs/08-SLAPP.md` |
| `02-§10.27` | Om-sidan | `saknas` | |
| `02-§10.28`–`10.29` | Statusrad för ny version och offline | `saknas` | |
| `02-§10.30` | Dela | `saknas` | Kräver de datadrivna sidorna |
| `02-§10.31` | Egen appikon | `saknas` | Ikonen är inte ritad; favicon svarar 404 i dag |
| `02-§10.32` | Inline-SVG-ikoner med `aria-hidden` | `påbörjad` | Sidhuvudets fyra ikoner i `source/layouts/header.njk`; inget test |

### Designspecifikation (`05-§`)

| ID | Ämne | Status | Anteckning |
| --- | --- | --- | --- |
| `05-§1` | Designfilosofi | `dokumenterad` | Vägledande |
| `05-§2.1`–`2.11` | Färgpalett | `byggd` | `tokens.css`, bevakad av `tests/design/tokens.test.ts` |
| `05-§2.12`–`2.18` | Kontrastregler och mörkt läge | `byggd` | Kontrastparen räknas i `tests/design/tokens.test.ts` |
| `05-§2.19` | Logotypgrön bara i logotypens SVG | `påbörjad` | Testet bevakar att färgen inte är en token; logotypen finns inte i repot ännu |
| `05-§2.20` | Bakgrundsskikt för dialog | `byggd` | `--color-backdrop` i `tokens.css`, bevakad av testet |
| `05-§3` | Typografi | `påbörjad` | Tokens bevakas av testet; navigeringen (`05-§3.9`) i `layout.css` utan test |
| `05-§4.1`–`4.10` | Behållare och spacing | `påbörjad` | Tokens bevakas av testet; `layout.css` använder dem i behållare, sidhuvud och sidfot utan test |
| `05-§4.11`–`4.15` | Rutnät och träffytor | `dokumenterad` | Rutnätet skrivs med djurkorten |
| `05-§5` | Brytpunkter | `dokumenterad` | Tillämpas när layouten skrivs |
| `05-§6.3` | Knappar | `påbörjad` | `.button` på startsidan, 47 px hög |
| `05-§6.1`–`6.4` | Sidhuvud | `manuell` | `layout.css`. Öppna startsidan i 360 px och 1280 px: vitt sidhuvud med kantlinje som ligger kvar vid rullning, ikonknappar på mobil, logga och länkar på desktop, aktuell sida understruken |
| `05-§6.15` | Kortets bild i 4:3 | `dokumenterad` | Kortets CSS skrivs med djurkorten; platshållaren (`05-§6.20`) håller redan 4:3 |
| `05-§6.17` | `width` och `height` på varje bild | `påbörjad` | `renderPicture` sätter dem, bevakat av `tests/build/images.test.ts`; ingen sida använder den ännu |
| `05-§6.20` | Platshållare för saknat foto | `påbörjad` | `renderPlaceholder` och `.image-placeholder` i `components.css`; markupen är testad, utseendet kontrolleras när en sida visar den |
| `05-§6.30` | Sidfot | `manuell` | `source/layouts/footer.njk`, `layout.css`. Öppna en sida och bekräfta djupgrön botten, vit text, och ordningen logga, huvudsidelänk, repolänk, integritetsmening, version |
| `05-§6.33`–`6.34`, `6.37` | Ikonknapp, meny, sidhuvudets höjd | `manuell` | `components.css`, `layout.css`. I 360 px: knapparna är 44 px, menykortet är grönt med vita länkar och glider in under sidhuvudet; sidhuvudets höjd är densamma före och efter rullning och i 1280 px |
| `05-§6.35`–`6.36` | Dialog, statusrad | `saknas` | |
| `05-§6` övrigt | Komponenter | `saknas` | Skrivs när markupen finns, enligt `05-§7.2` |
| `05-§7.1`, `7.5` | Inga hårdkodade värden | `byggd` | stylelint-regeln `declaration-strict-value` fäller literaler utanför `tokens.css` |
| `05-§7.4` | Designtokens | `byggd` | `tokens.css`, bevakad av `tests/design/tokens.test.ts` |
| `05-§7.7`–`7.8` | Fokusmarkering, rörelse | `påbörjad` | I `base.css`; inget test |
| `05-§7.10` | Filstruktur för CSS | `påbörjad` | Fyra filer, laddade i ordning av `source/layouts/base.njk`; `utilities.css` skapas vid behov; inget test |
| `05-§8` | Bilder | `påbörjad` | `05-§8.5` genom `generateImageSizes`; `8.6`–`8.7` genom `renderPicture`, ännu utan sida; foto- och samtyckesreglerna är vägledning |
| `05-§9` | Tillgänglighet | `dokumenterad` | Delvis testbar med html-validate |
| `05-§10` | Vad man inte gör | `dokumenterad` | Delvis kontrollerbar med lint |

### Datakontrakt (`04-§`)

| ID | Ämne | Status | Anteckning |
| --- | --- | --- | --- |
| `04-§1`–`04-§9` | Modell för djur, arter, raser, bestånd, platser och bilder | `påbörjad` | Domänlagret läser och validerar modellen, inklusive räknade bestånd; bildfilerna saknas ännu |
| `04-§4.2` | Djur har inget `location`-fält | `byggd` | Valideraren fäller (`tests/domain/validate.test.ts`) och `tests/domain/no-location.test.ts` bevakar datat |
| `04-§10` | Validering | `byggd` | `source/ts/domain/validate.ts`; `tests/domain/validate.test.ts`. Bildkontrollen (`04-§10.7`) prövas med handbyggda WebP-filer i `tests/domain/webp.test.ts` tills `source/images-qa/` finns |

### Miljöer (`06-§`)

| ID | Ämne | Status | Anteckning |
| --- | --- | --- | --- |
| `06-§1.1`–`1.2` | QA och produktion ur samma kod i samma utgåva | `manuell` | Efter *Deploy till produktion*: sidfoten i `https://stattared4h.github.io/stattared4h/` och `.../qa/` visar samma version |
| `06-§1.3` | QA-sidor bär `noindex` | `byggd` | `source/layouts/base.njk` när `DATA_DIR` slutar på `data-qa`; `tests/build/site.test.ts` bygger QA och produktion och jämför |
| `06-§1.4` | QA har egen service worker och eget manifest-`id` | `saknas` | Ingen service worker |
| `06-§1.5` | QA-versionen får tillägget " – QA" | `manuell` | Kontrollpunkten för `02-§10.33` |
| `06-§2.1` | `DATA_DIR` väljer dataset | `påbörjad` | `defaultDataDir()` i `source/ts/domain/index.ts` och `npm run validate` läser `DATA_DIR` (`tests/domain/validate-script.test.ts`); bygget läser ännu inget dataset |
| `06-§2.2` | Tester körs mot QA-data | `byggd` | `tests/domain/helpers.ts` pekar på `source/data-qa/`; ingen domäntest läser `source/data` utom `02-§6.11` |
| `06-§2.3` | QA-datat prövar gränsfallen | `påbörjad` | 100 individer och två räknade hönsbestånd finns; bildfilerna genereras av `npm run qa:images` (`02-§8.4`) |
| `06-§2.4` | Kontraktsändring ändrar QA-datat | `dokumenterad` | Process |
| `06-§3.1` | `BASE_PATH` | `byggd` | Blir Eleventys `pathPrefix` i `eleventy.config.js`; `tests/build/site.test.ts` bygger med `/prov/` |
| `06-§3.2` | Varje adress via hjälpfunktionen | `byggd` | Eleventys `url`-filter i mallarna; testet är `02-§9.8` |
| `06-§3.3` | QA under `/qa/` | `manuell` | Kontrollpunkten för `02-§9.12`: `.../stattared4h/qa/` svarar med stil |
| `06-§3.4` | CI sätter bas-sökvägen via `configure-pages` | `manuell` | Öppna `https://stattared4h.github.io/stattared4h/` och `.../qa/` och bekräfta att båda sidorna har stil |
| `06-§3.5` | Bygget vägrar handskriven absolut sökväg | `byggd` | `eleventy.config.js` läser mallarna före rendering och fäller; `tests/build/site.test.ts` bygger en mall med `href="/karta/"` och väntar felet |
| `06-§4`–`06-§5` | Flytt till webbhotell, hemligheter | `dokumenterad` | Vägledning |

### Arkitektur (`03-§`)

| ID | Ämne | Status | Anteckning |
| --- | --- | --- | --- |
| `03-§1`–`03-§7` | Byggkedja, skikt, härledda vyer, sidor, offline, bilder, redigering | `dokumenterad` | Mekanismerna bakom `02-§5`–`02-§8` |
| `03-§6.1` | Bygget genererar bara mindre storlekar | `byggd` | `generateImageSizes` i `source/ts/build/images.ts`; `tests/build/images.test.ts` |
| `03-§6.2` | Upplösare från filnamn till sökväg | `byggd` | `imagesDirFor` och `renderPicture`; `tests/build/images.test.ts` |
| `03-§6.3` | `width`, `height`, `loading`, `fetchpriority` | `påbörjad` | `renderPicture` är testad; sidorna använder den inte ännu |
| `03-§8.1` | `npm run build` | `byggd` | `eleventy` med `eleventy.config.js`; byggtesterna kör samma bygge till en tillfällig katalog |
| `03-§8.2`–`8.4` | Test, lint och CI | `påbörjad` | `npm test`, `npm run lint` och CI kör dem (`02-§9.7`); valideringen körs av bygget först när datat kopplas in |
| `03-§8.5` | Merge till `main` deployar | `manuell` | Merga till `main` och bekräfta att *Deploy till QA* startar när *Quality* blivit grön (`02-§9.11`) |
| `03-§8.6` | Bevakande tester | `byggd` | Bas-sökvägen i `tests/build/site.test.ts` (`02-§9.8`); `location`-fältet i `tests/domain/no-location.test.ts` (`02-§6.11`) |
| `03-§8.7` | Node 22.18; Eleventy importerar TypeScript direkt | `påbörjad` | `eleventy.config.js` importerar `source/ts/domain/version.ts`; `erasableSyntaxOnly` bevakas av typkontrollen, inte av ett test |
| `03-§8.8`–`8.9` | Två deploy-flöden med ett återanvändbart; dubbelbygge | `manuell` | Kontrollpunkterna för `02-§9.11`–`9.12` och `02-§10.35` |
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
| `saknas` | 20 |
| `dokumenterad` | 15 |
| `påbörjad` | 28 |
| `byggd` | 42 |
| `manuell` | 18 |

Summeringen räknar rader i tabellerna under *Läget nu* och uppdateras i fas 5 av processen i
`CLAUDE.md`. Dokumentkontrollen i `02-§9.10` fäller när den inte stämmer. <!-- 99-§1.2 -->
