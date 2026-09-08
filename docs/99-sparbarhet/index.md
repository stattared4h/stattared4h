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
samt Eleventy-bygget med grundlayout, sidhuvud, sidfot, versionsmodul, manifest,
service worker, feedbackdialog, om-sida, startsidans nav av kort (ADR 0023) och de
datadrivna sidorna: karta, djurinfo, plats, djur och art, byggda ur det validerade
datasetet. Bilderna är egna poster med id ur
innehållet (ADR 0015), och 4H-loggan är förbundets egen, härledd ur vektorfilen i
källregistret (ADR 0016). QA-datasetets 100 individer delar på 25 versionshanterade,
permanent märkta AI-bilder (ADR 0017). Individuella djur kan dessutom ha ett publikt,
sökbart märkningsnummer som valideras och visas för besökaren. Redaktörens bildverktyg gör
foton webbanpassade i webbläsaren, på en adress utanför navigationen (ADR 0021, ADR 0022).
Det första spelet, Djurbingo, läser samma dataset och bygger brickan i webbläsaren
(ADR 0009, ADR 0024). Statusen nedan speglar det.

### Krav (`02-§`)

Kraven är sajtens beställning. Allt annat i matrisen finns för att uppfylla dem.

| ID | Ämne | Status | Anteckning |
| --- | --- | --- | --- |
| `02-§1.7`–`1.9` | Komplement till huvudsidan; länk i sidfoten | `byggd` | Sidfoten på varje sida länkar till huvudsidan och sidhuvudet gör det inte; bevakas av `tests/build/site.test.ts` |
| `02-§1.10` | Tumregel för vad som hör hit | `dokumenterad` | Vägledande |
| `02-§2` | Målgrupp | `dokumenterad` | Vägledande |
| `02-§3.1`–`3.4` | Roller via GitHub, ingen egen inloggning | `manuell` | Kontrollera under *Settings → Rules* att regelverket *Protect main* är aktivt och kräver pull request |
| `02-§3.5` | Djur som lämnat gården behålls | `byggd` | Valideraren tar emot `status: gone`, härledningarna behåller djuret (`tests/domain/derive.test.ts`) och djursidan finns kvar med märkningen; `tests/build/data-pages.test.ts` öppnar `djur/bocken/` |
| `02-§4` | Kravintag via issues | `dokumenterad` | Process |
| `02-§5.1` | Sidtyper och adresser | `byggd` | `source/pages/index.njk`, `karta.njk`, `djuren.njk`, `plats.njk`, `djur.njk` och `arter.njk`; de fyra sista paginerar över `views`. `tests/build/data-pages.test.ts` kräver en sida per plats, djur och art, och att `karta/` och `djuren/` skrivs |
| `02-§5.2`–`5.3` | `index.html` i katalog; egen 404-sida | `byggd` | `source/pages/404.njk`; adressformen och 404-sidans text och länkar bevakas av `tests/build/site.test.ts` |
| `02-§5.4` | Sidhuvud | `påbörjad` | `source/layouts/header.njk` på varje sida; status per krav under `02-§10.1`–`10.10` |
| `02-§5.5` | Sidfot | `byggd` | `source/layouts/footer.njk` på varje sida; innehåll och versionsrad bevakas av `tests/build/site.test.ts` |
| `02-§5.6` | En `h1`, `lang`, `title`, `description` | `byggd` | `source/layouts/base.njk`; bevakas per byggd sida av `tests/build/site.test.ts` |
| `02-§5.7`–`5.8` | Startsidan är ett nav av kort | `byggd` | `source/pages/index.njk` med `homeView` i `source/ts/build/pages.ts` (ADR 0023); korten och deras ordning i `tests/build/pages.test.ts`, sidan och att den inte bär kartan, platslistan, artrutorna eller sökningen i `tests/build/data-pages.test.ts` |
| `02-§5.63` | Kortet är en tryckyta med symbol, rubrik och en rad | `byggd` | Makrot `source/layouts/home-card.njk` över `HomeCardView` från `source/ts/build/pages.ts`; symbolerna i `HOME_CARD_SYMBOLS` i `source/ts/build/symbols.ts`. `tests/build/pages.test.ts` kräver rubrik, rad och ritad symbol per kort, `tests/build/data-pages.test.ts` att hela kortet är länken och att varje symbol är `aria-hidden` |
| `02-§5.64` | Två navkort i bredd på mobil, tre från desktopbrytpunkten | `byggd` | Samma `.card-grid` som djurkorten (`02-§5.50`) i `source/layouts/home-card.njk`; `tests/design/card-grid.test.ts` kräver att navet använder rutnätet och att kortet sträcks till radens höjd, `tests/build/data-pages.test.ts` att markupen bär klassen. Öppna `/` i 360 px: båda korten syns utan att rulla |
| `02-§5.65` | Kartsidan | `byggd` | `source/pages/karta.njk` med `views.map`; `tests/build/data-pages.test.ts` kräver ordningen kartan, platslistan, Fler kartor i området, och att sidan finns |
| `02-§5.66` | Djurinfosidan | `byggd` | `source/pages/djuren.njk` med `animalsOverviewView` i `source/ts/build/pages.ts`; artvalet i `tests/build/pages.test.ts`, sidan och det tomma datasetets text i `tests/build/data-pages.test.ts` |
| `02-§5.9`–`5.13` | Platssidan | `byggd` | `source/pages/plats.njk` med `locationView`; Tåmossen, Bräckebur, Lygnslätt 1, A, D och Hönshuset prövas i `tests/build/pages.test.ts` och `data-pages.test.ts` |
| `02-§5.14`–`5.18` | Djursidan | `byggd` | `source/pages/djur.njk` med `animalView`; Rosa, Bocken, Tuva och Vinter prövas i `tests/build/pages.test.ts` och `data-pages.test.ts` |
| `02-§5.19`–`5.22` | Artsidan | `byggd` | `source/pages/arter.njk` med `speciesView` och `readSpeciesContent` i `source/ts/build/content.ts`; getter, hästar och höns prövas i `tests/build/pages.test.ts` och `data-pages.test.ts` |
| `02-§5.23`–`5.26` | Kartan | `byggd` | `source/ts/build/map.ts` och `source/pages/karta.njk`; projektion, markörer och lista i `tests/build/map.test.ts`, `pages.test.ts` och `data-pages.test.ts`, som också kräver att inget anrop går utanför sajten |
| `02-§5.51` | Platslistan i två grupper | `byggd` | `mapListGroups` i `source/ts/build/pages.ts`, renderad av `source/pages/index.njk`; `tests/build/pages.test.ts` kräver rubrikerna, ordningen och att grupperna tillsammans är exakt hela listan, `tests/build/data-pages.test.ts` att båda rubrikerna står på den byggda startsidan |
| `02-§5.52` | Öronmärkessökningen först på djurinfosidan | `byggd` | `source/pages/djuren.njk`; `tests/build/public-id.test.ts` kräver att sökformuläret står före djurslagen, och att startsidan inte bär det |
| `02-§5.27` | Markörer minst 44 px; textbeskrivning | `manuell` | Beskrivningen bevakas av `tests/build/map.test.ts`. Öppna `/karta/` i 360 px och bekräfta att varje markör är minst 44 px hög och bred (mätt till 68 px hög i Chromium) |
| `02-§5.50` | Två djurkort i bredd på mobil, tre från desktopbrytpunkten | `byggd` | `.card-grid` i `layout.css` och kortets `sizes` i `source/layouts/animal-card.njk`; `tests/design/card-grid.test.ts` kräver båda och att de säger samma sak. Öppna `/plats/brackebur/` i 360 px: två getter i bredd |
| `02-§5.28` | Djurkortet | `byggd` | Makrot i `source/layouts/animal-card.njk` med `animalCard` i `pages.ts`; etiketter och platshållare i `tests/build/pages.test.ts` och `data-pages.test.ts` |
| `02-§5.31` | Platssidan visar platsens bilder | `byggd` | `photos` på platsen i `04-§5.6`, `view.photos` i `source/pages/plats.njk` efter faktarutan; `tests/build/data-pages.test.ts` kontrollerar bilderna, fototexten, att djurslagsrutorna står före dem och att en plats utan bilder inte visar någon platshållare |
| `02-§5.29` | `npm run qr` | `byggd` | `scripts/qr.mjs` och `source/ts/build/qr.ts`; `tests/build/qr.test.ts` kör skriptet mot QA-datat och kontrollerar en fil per plats med adressen som `<title>` |
| `02-§5.30` | Ritad kartbakgrund | `byggd` | `parseMapBackground` och `loadMapBackground` i `source/ts/build/map.ts`, konventionen i `source/map/README.md`; `tests/build/map.test.ts` bäddar in en liten SVG och prövar varningen för en plats utanför. Gårdens egen ritning ligger i `source/map/background.svg`, härledd ur OSM-uttaget i källregistret; `tests/design/map-drawing.test.ts` håller den till paletten och utan externa referenser |
| `02-§5.32` | Markören visar namn och symbol, inte djurslag | `byggd` | Markören bär bricka, symbol och namn och inget annat; `tests/build/map.test.ts` läser varje markörs innehåll, djurslagen står bara i listan under kartan |
| `02-§5.33` | Etiketter som annars överlappar | `byggd` | `placeLabels` i `source/ts/build/map.ts` med modifierarna i `layout.css`; `tests/build/map.test.ts` prövar krock, kant, ordningsoberoende och att etiketter utöver fyra döljs. Konstanterna jämförs med `tokens.css` i samma fil. Referensbredderna är kartans egen bredd, inte fönstrets — `tests/build/map.test.ts` härleder dem ur `--space-md` och `.container` |
| `02-§5.53` | Fyra raka etikettlägen kring markören | `byggd` | `LABEL_SIDES` i `source/ts/build/map.ts` är under, över, höger, vänster; de fyra sneda är borta sedan `04-§5.8` tog bort orsaken till dem. `tests/build/map.test.ts` kräver att inget annat läge kan uppstå, att stilmallen har en regel för varje läge i alla tre placeringarna och att inget snett klassnamn finns kvar |
| `02-§5.54` | Etiketten skaver hellre än döljs, men aldrig utanför kanten | `byggd` | `placeLabels` i `source/ts/build/map.ts` faller till det läge som överlappar minst när inget är helt ledigt; kant och zoomhörn är hårda villkor, och en pinne kostar åtta gånger en etikett. `tests/build/map.test.ts` prövar tio markörer på samma fläck, en klunga mitt på ritningen och en vid kanten, att ett namn som inte ryms innanför kanten döljs ändå, och att placeringen är deterministisk |
| `02-§5.55` | Under 600 px syns inga namn förrän namntröskeln | `manuell` | Mediefrågan i `source/assets/css/layout.css` döljer `.map__label` under brytpunkten så länge kartan inte bär `map--names`. Bygget räknar därför ingen smal placering alls — den skulle aldrig visas. CSS-layout går inte att enhetstesta i Node (`CL-§8.6`): öppna `/` i 360 px, bekräfta att markörerna står utan namn, tryck `+` en och två gånger och bekräfta att de fortfarande gör det, tryck en tredje gång och bekräfta att alla namn kommer fram utan att stapla |
| `02-§5.57` | Den inzoomade kartan har en egen etikettplacering | `byggd` | `renderMap` i `source/ts/build/map.ts` kör `placeLabels` en tredje gång mot `referenceWidth × NAMES_AT_SCALE` och skriver `--zoom-`-klassen; `.map--names`-reglerna i `source/assets/css/layout.css` följer den. Tröskeln bor i `source/ts/domain/map-view.ts` så bygget och `map-zoom.ts` läser samma tal. `tests/build/map.test.ts` kräver att referensen är just den, att omgången placerar alla nio markörer på en fläck där överblicken döljer, och att varje markör bär ett zoomläge |
| `02-§5.61` | Fyra placeringar, en per bredd kartan visas i | `byggd` | `renderMap` i `source/ts/build/map.ts` kör `placeLabels` mot 312, 552, 912 och 1248 px och skriver `--label-`, `--wide-`, `--desktop-` och `--zoom-`; mediefrågan på 960 px i `source/assets/css/layout.css` följer desktopplaceringen. `tests/build/map.test.ts` kräver att bredderna är brytpunkternas, att varje markör bär ett desktopläge, och att en sida som inte ryms vid 552 px följs vid 912 |
| `02-§5.62` | Kort namn som bara kartans markör använder | `byggd` | Fältet `shortName` (`04-§5.11`) i platsfilerna, validerat i `source/ts/domain/validate.ts`; `renderMap` sätter det som etikettens text, mäter placeringen mot det, och skriver `aria-label` och `data-name` med det fullständiga namnet så markörens tillgängliga namn och rutan man öppnar är oförändrade. Sex platser bär det. `tests/build/map.test.ts` prövar alla tre delarna |
| `02-§5.58` | Etiketten ligger kloss an mot pricken, inte utanför tryckytan | `byggd` | `LABEL_METRICS.labelOffset` är prickens radie, så etikettens kant möter prickens; spärrytorna i `placeLabels` byggs ur samma mått i stället för ur tryckytan, och `.map__label` i `source/assets/css/components.css` har `pointer-events: none` så ett namn över grannens osynliga marginal aldrig svarar på ett tryck. `tests/build/map.test.ts` kräver att måttet är tokenets och att en grannes marginal inte stoppar ett rakt läge |
| `02-§5.59` | Markör i ytterkanten får namnet rakt åt sidan | `byggd` | `sidesFor` i `source/ts/build/map.ts` sätter det inåtpekande raka läget först när markörens pinne når ritningens kant. `tests/build/map.test.ts` prövar båda kanterna, att mitten är oförändrad, att marginalen skalar med ritningen, och att en grannes ritade prick fortfarande blockerar. På gårdens data ger det Bräckebur och Tåmossen namnet rakt till höger och Dalen och Lygnslätt 1 och 2 rakt till vänster i den breda placeringen |
| `02-§5.60` | Platsen får ange sin egen etikettsida | `byggd` | Fältet `label` i platsfilerna (`04-§5.10`), validerat av `optionalEnum` i `source/ts/domain/validate.ts` och lagt före all automatik av `placeLabels`. Åtta platser kring gårdsplanen och de fyra numrerade hagarna bär det i båda dataseten. `tests/build/map.test.ts` kräver att hagarna ber om över, och att etiketten då stannar innanför sitt band vid varje bredd där den visas — regressionstestet för issue #50 |
| `02-§5.34` | Fler kartor i området | `byggd` | `site.areaMaps` i `eleventy.config.js` och avsnittet i `source/pages/karta.njk`; `tests/build/data-pages.test.ts` kräver rubriken och exakt de två länkmålen, och att inget hämtas utifrån |
| `02-§5.35` | En plats som inte är en djurplats nämner inte djur | `byggd` | `kind` i `source/ts/domain/validate.ts` och `locationView` i `pages.ts`, grenen i `source/pages/plats.njk`; `tests/build/data-pages.test.ts` öppnar QA-datats caféer och toaletter och `tests/domain/validate.test.ts` prövar att djurslag på en sådan plats fäller bygget |
| `02-§5.36` | Visa och söka på öronmärke | `manuell` | Markup och visning bevakas av `tests/build/public-id.test.ts`, söklogiken av `tests/ui/animal-id-search.test.ts`. Bygg QA-sajten, öppna `/djuren/` i 360 px, sök `se-012345-0001` och bekräfta att `/djur/far-astrid/` öppnas och visar `Öronmärke: SE 012345 0001` |
| `02-§5.37` | Exakt normaliserad sökning, ingen suffix-sökning | `byggd` | `findAnimalByPublicId` i `source/ts/ui/animal-id-search.ts`; `tests/ui/animal-id-search.test.ts` prövar mellanslag, bindestreck, skiftläge, tom sträng och suffix |
| `02-§5.38` | Symbol per sorts plats på markören | `byggd` | `PLACE_SYMBOLS` i `source/ts/build/symbols.ts`, en per `LocationKind`, skriven i markören av `renderMap`. `tests/build/symbols.test.ts` kräver en egen symbol per sort, att ingen delas, att inget hämtas utifrån, och räknar om SHA-256 för de tre banor som är lyfta ur ett vägmärke (`09-§1.5`); `tests/build/map.test.ts` kräver att varje markör bär sin sorts symbol och inget mer |
| `02-§5.46`–`5.47` | Ruta på markören; djurslag och länk för en djurplats | `påbörjad` | Bygget skriver den tomma dialogen och lägger namnet, djurslagen, upplysningen och tillgängligheten på markören som `data-`-attribut; `tests/build/map.test.ts` kräver att bara en `djurplats` bär `data-species`, att en plats utan upplysning inte bär ett tomt attribut, och att allt escapas. Att `source/ts/ui/map-popup.ts` sätter ihop rutan av det har inget test — repot enhetstestar ren logik, inte DOM |
| `02-§5.48` | En ruta åt gången; stängs med Escape, tryck utanför och knapp | `manuell` | En `<dialog>` med `showModal()` ger det mesta av webbläsaren. Bygg med `DATA_DIR=source/data-qa`, öppna `/`, tryck på en markör: rutan ska stå mitt på skärmen med sidan bakom nedtonad. Tryck Escape, på bakgrunden och på krysset — var och en ska stänga — och bekräfta att fokus hamnar på markören igen. Tryck på en annan markör och bekräfta att bara en ruta finns |
| `02-§5.49` | Utan JavaScript öppnas ingen ruta | `byggd` | Dialogen skrivs utan `open`, så den visar ingenting utan klientkod, och markören är fortfarande en `<a>` till platssidan; `tests/build/map.test.ts` kräver båda. Stäng av JavaScript i webbläsaren och bekräfta att ett tryck på en markör går till platssidan |
| `02-§5.40` | Zoom och panorering med nyp, drag och Ctrl-hjul | `manuell` | Räknandet är `source/ts/domain/map-view.ts`, prövat i `tests/domain/map-view.test.ts`; kopplingen till händelser är `source/ts/ui/map-zoom.ts`. Bygg med `DATA_DIR=source/data-qa`, öppna `/` på en telefon och nyp isär över gårdsplanen: kartan ska zooma kring fingrarnas mittpunkt. På dator: Ctrl- eller Cmd-hjul zoomar, vanligt hjul rullar sidan |
| `02-§5.41` | Tre knappar, nåbara med tangentbord | `påbörjad` | Markupen skrivs av `renderMap` och bevakas av `tests/build/map.test.ts`, som kräver alla tre knapparna och att gruppen är `hidden` från bygget. Beteendet — att `+` slås av vid maxzoom, `−` vid 1× och att "Visa hela kartan" syns först inzoomad — har inget test |
| `02-§5.42` | Kartan fångar inte sidans rullning vid 1× | `manuell` | `touch-action` på `.map__canvas` i `layout.css`, `pan-y` vid 1× och `none` inzoomad. Öppna `/` **på en riktig telefon** och dra uppåt med fingret på kartan: sidan ska rulla. Zooma in och dra igen: nu ska kartan flytta sig. Headless Chromium duger inte — den simulerar pekhändelser men inte webbläsarens val av gest |
| `02-§5.43` | Markören behåller storlek och koordinat vid varje zoomnivå | `manuell` | Motskalningen är `scale(calc(1 / var(--map-scale)))` i `layout.css`; gränserna som håller ritningen över ramen prövas i `tests/domain/map-view.test.ts`. Öppna `/` i 360 px, mät en markör i DevTools vid utgångsläget och vid full inzoomning: 44 × 44 px båda gångerna, och markören ska sitta kvar på samma punkt i ritningen |
| `02-§5.44` | Alla platsnamn syns inzoomad | `manuell` | `.map--zoomed` upphäver döljandet i `layout.css`. Bygg med `DATA_DIR=source/data-qa`, öppna `/` i 360 px och tryck `+` tre gånger: varje plats i klungan ska synas med namn, också de vars etikett är dold i överblick (`02-§5.33`). Vid ett eller två tryck ska de dolda förbli dolda — där finns ännu inte plats |
| `02-§5.45` | Utan JavaScript är kartan en stillbild | `byggd` | Knappgruppen skrivs `hidden` av bygget och visas av `map-zoom.ts`; `tests/build/map.test.ts` kräver att den är dold i utdatan och att markören fortfarande är en länk till platssidan. Stäng av JavaScript i webbläsaren och bekräfta att kartan syns och listan fungerar |
| `02-§5.39` | Samma symbol framför namnet i listan under kartan | `byggd` | `symbol` på `MapListItem` i `source/ts/build/pages.ts`, skriven i länken av `source/pages/index.njk`; `tests/build/pages.test.ts` kräver rätt symbol för Caféet och en symbol på varje listad plats, `data-pages.test.ts` att den står före namnet i den byggda sidan |
| `04-§5.8` | Koordinaten är den punkt besökaren ska gå till, för en yta dess mitt | `dokumenterad` | Konventionen gäller datat, inte koden: bygget projicerar den punkt som står i filen. De fyra numrerade hagarna bär bandens tyngdpunkter, härledda ur ritningen enligt `docs/09-kallor/index.md`; de elva som låg utanför ritningen bär ungefärliga lägen enligt `04-§5.9` |
| `04-§5.9` | Plats utanför ritningen får ett ungefärligt läge vid kanten | `byggd` | Konventionen gäller datat; de elva lägena står i `source/data/locations/` med en kommentar ovanför `lat`, och härkomsten i `docs/09-kallor/index.md`. `tests/domain/location-coordinates.test.ts` kräver att varje aktiv plats i båda dataseten har koordinater och projiceras innanför ritningen — annars faller regeln tillbaka, en fil i taget, utan att bygget märker det, och att hela pricken ryms innanför kanten i den smalaste kartan |
| `04-§5.10` | Platsen får ange sin egen etikettsida med `label` | `byggd` | `optionalEnum` i `source/ts/domain/validate.ts` tar emot `under`, `over`, `hoger` och `vanster`; `renderMap` översätter till placeringens ord och lägger valet före automatiken. Tolv platser bär det i båda dataseten. `tests/domain/validate.test.ts` och `tests/build/map.test.ts` |
| `04-§5.11` | Kort namn som bara kartan använder, `shortName` | `byggd` | `optionalString` i `source/ts/domain/validate.ts`; `renderMap` sätter det som etikettens text, mäter placeringen mot det och behåller det fullständiga namnet i `aria-label` och `data-name`. Sex platser bär det. `tests/build/map.test.ts` |
| `04-§5.7` | Platsen har en sort | `byggd` | ADR 0019; obligatoriskt `kind` med åtta värden i `source/ts/domain/validate.ts`. `tests/domain/validate.test.ts` prövar att var och en tas emot, att `besoksmal` avvisas, att felmeddelandet räknar upp värdena och att djurslag på annat än en `djurplats` fäller bygget; `tests/domain/qa-data.test.ts` kräver att QA-datat innehåller varje sort |
| `02-§5.33` (dold etikett) | Etiketten kommer fram vid fokus | `manuell` | Bygg med `DATA_DIR=source/data-qa`, öppna `/` i 360 px bredd och tabba till en markör i klungan i mitten: namnet ska komma fram, och markören ska ligga överst |
| `02-§6.1` | Bara `*.yaml` läses ur `DATA_DIR` | `byggd` | `source/ts/domain/load.ts`; `tests/domain/load.test.ts` |
| `02-§6.2` | Valideringen körs först i bygget | `byggd` | `eleventy.config.js` anropar `loadValidDataset` i `eleventy.before`, i sekventiellt händelseläge före bildpluginen; `tests/build/data-pages.test.ts` bygger ett ogiltigt dataset och kräver en tom utkatalog |
| `02-§6.3` | Fäller vid allt i `04-§10` och vid okända fält | `byggd` | Den kompletta domäningången i `source/ts/domain/index.ts` validerar `publicId` och delegerar resten till `source/ts/domain/validate.ts`; `tests/domain/validate.test.ts` och `tests/domain/public-id-validation.test.ts` |
| `02-§6.4` | Varningar | `byggd` | `collectWarnings` och `warnAboutStrayImageFiles` i `validate.ts`; QA-datats exakta varningar i `tests/domain/validate.test.ts` |
| `02-§6.5` | Meddelanden på svenska med fil och fält | `byggd` | `formatIssue` i `validate.ts`; `tests/domain/validate.test.ts` och `load.test.ts` |
| `02-§6.6` | `npm run validate` | `byggd` | `scripts/validate.mjs`; `tests/domain/validate-script.test.ts` kör skriptet och kontrollerar felkoden |
| `02-§6.7` | `born` normaliseras | `byggd` | `source/ts/domain/born.ts`; `tests/domain/born.test.ts` |
| `02-§6.8` | Härledningar utan webbläsar-API:er | `byggd` | `source/ts/domain/derive.ts`; `tests/domain/derive.test.ts` mot fallen i QA-README |
| `02-§6.9` | Deterministisk svensk sortering | `byggd` | `source/ts/domain/sort.ts`; `tests/domain/sort.test.ts` |
| `02-§6.10` | Tester mot QA-datat, ogiltiga poster i testet | `byggd` | `tests/domain/helpers.ts` läser `source/data-qa/`; ogiltiga poster byggs i minnet och går genom samma kompletta `validateDataset` som övriga anrop |
| `02-§6.11` | Test: inget `location`-fält | `byggd` | `tests/domain/no-location.test.ts` läser både `source/data` och `source/data-qa` |
| `02-§6.12` | QA har minst 100 individer och täcker vokabulären | `byggd` | `source/data-qa/` har 100 individer, täcker all vokabulär och ger varje individ minst en av 25 delade bilder; `tests/domain/qa-data.test.ts` bevakar antal, täckning, bilddelning och bild på varje individ |
| `02-§6.13` | Räknade bestånd för djur utan individsidor | `byggd` | `source/ts/domain/load.ts`, `validate.ts`, `derive.ts`; `tests/domain/qa-data.test.ts` |
| `02-§6.14`–`6.16` | Valfritt, formaterat och unikt publikt djur-ID | `byggd` | `readPublicIds` och `validateDataset` i `source/ts/domain/index.ts`, normalisering i `source/ts/domain/public-id.ts`; `tests/domain/public-id.test.ts` och `tests/domain/public-id-validation.test.ts` |
| `02-§6.17` | Räknade bestånd har inget individ-ID | `byggd` | `populations.yaml` saknar fältet i `04-§4.8`; `tests/domain/public-id-validation.test.ts` lägger till `publicId` på ett bestånd och kräver valideringsfel |
| `02-§6.18` | QA-data och edge cases för publikt ID | `byggd` | Fem QA-får har olika formateringar; `tests/domain/public-id-validation.test.ts`, `tests/domain/public-id.test.ts`, `tests/ui/animal-id-search.test.ts` och `tests/build/public-id.test.ts` bevakar kedjan |
| `02-§7.1`–`7.2` | Manifest: namn, färger ur tokens, ikoner; `start_url`, `scope` och `id` ur bas-sökvägen | `byggd` | `source/pages/manifest.njk` med färgerna från `readThemeColours` i `source/ts/build/pwa.ts`; `tests/build/pwa.test.ts` jämför med `tokens.css` och bygger under `/prov/qa/` |
| `02-§7.3` | Registrering på `<bas>sw.js` med scope lika med bas-sökvägen | `manuell` | `source/ts/ui/sw-register.ts` läser `data-base`, som `tests/build/pwa.test.ts` bevakar. Öppna startsidan i Chromium, DevTools → Application → Service Workers: `sw.js` är registrerad med scope lika med bas-sökvägen, och under `/qa/` finns en egen med scope `…/qa/` |
| `02-§7.4` | Förcachen | `byggd` | Kartsidan och djurinfosidan kommer med utan att listan ändras: `source/pages/sw.njk` listar `collections.all`, offline- och 404-sidan, manifestet, `main.js` och allt under `source/assets/`; `tests/build/pwa.test.ts` jämför med filerna i utdatan |
| `02-§7.5` | Cache först för förcachen, nätverk först för foton | `manuell` | Strategivalet i `source/ts/domain/offline.ts` testas i `tests/domain/offline.test.ts`; utförandet är `source/ts/sw.ts`. Ladda startsidan, stäng av nätet (DevTools → Network → Offline) och ladda om: sidan och CSS kommer ur cachen, och ett foto som visats en gång visas igen |
| `02-§7.6` | Cachenamn ur bas-sökväg och version; äldre cacher raderas | `byggd` | `CACHE_NAME` i `source/pages/sw.njk`, bevakat av `tests/build/pwa.test.ts`; raderingen i `source/ts/sw.ts` är verifierad i Chromium: efter Ladda om finns bara den nya cachen |
| `02-§7.7` | Sidor i förcachen svarar offline; okänd adress ger offline-sidan | `manuell` | Efter en första laddning: stoppa servern eller sätt flygplansläge, öppna `/om/` och en påhittad adress — den första visas, den andra ger "Du är offline" med länkar till startsidan och kartan |
| `02-§7.8` | Inga anrop till andra värdar | `byggd` | `tests/build/pwa.test.ts` fäller `http(s)://` i `sw.js` och `main.js`; workern rör aldrig ett annat origin (`tests/domain/offline.test.ts`) |
| `02-§7.9` | QA har egen service worker och eget manifest-`id` | `byggd` | Scope, `id` och cachenamn följer bas-sökvägen; `tests/build/pwa.test.ts` bygger under `/prov/qa/` och jämför med `/` |
| `02-§7.10` | Installation på iOS och Android | `manuell` | Öppna sajten i Safari på en iPhone, lägg den på hemskärmen, sätt flygplansläge och öppna en platssida och en djursida från appen; gör samma sak i Chrome på Android via installknappen |
| `02-§8.1` | Bara webbanpassade bilder i repot, platt katalog | `påbörjad` | `npm run image` skriver filer som håller gränserna, platt och med bild-id:t som filnamn, och `02-§8.2` fäller vid en fil som inte gör det; `source/images/` väntar på gårdens egna fotografier |
| `02-§8.2` | Validering av bildfiler | `byggd` | `validateImageFiles` i `source/ts/domain/validate.ts` fäller vid saknad fil, fel format, för stora mått, för stor fil och kvarlämnad metadata, och rapporterar på bildposten så en delad bild bara felar en gång; bygget skickar bildkatalogen när den finns. `tests/domain/validate.test.ts` prövar varje regel med handbyggda WebP-filer |
| `02-§8.3` | `npm run image` | `byggd` | `scripts/image.mjs` med `optimiseImage` i `source/ts/build/images.ts` och `imageIdFor` i `source/ts/domain/image-id.ts`; skriver bildfilen och bildposten. `tests/build/images.test.ts` prövar nedskalning, metadatarensning, att id:t är filens hash, bildposten, samma foto två gånger och kraven på `--alt` och `--credit` |
| `02-§8.4` | Versionshanterade, märkta AI-bilder i QA | `byggd` | 25 WebP-filer i `source/images-qa/`, märkta av `scripts/qa-images.mjs`; format, mått, filstorlek och metadata bevakas av `tests/domain/validate.test.ts` och märkningen av `tests/build/images.test.ts` |
| `02-§8.5`–`8.7` | Leverans av bilder | `byggd` | `picture`-shortcoden i djurkortet, djurslagsrutan och djur- och artsidan, `credit` i `source/pages/djur.njk` och `arter.njk`; `tests/build/data-pages.test.ts` kontrollerar `srcset`, `width`, `height`, `loading`, `fetchpriority`, `alt` och fototexten på Rosas, Bockens och Tuvas sidor |
| `02-§8.8` | Bildposten med `alt` och `credit` | `byggd` | `validateImagePosts` i `source/ts/domain/validate.ts`, `Image` i `types.ts`, `images/` i `load.ts`; `tests/domain/validate.test.ts` och `tests/domain/qa-data.test.ts`. Se [ADR 0015](../adr/0015-bilden-som-egen-post.md) |
| `02-§8.9` | Bild-id ur innehållets SHA-256 | `byggd` | `source/ts/domain/image-id.ts`; `tests/domain/image-id.test.ts` prövar formen, att hashen är stabil och att prefixet hindrar YAML från att läsa ett id med bara siffror som heltal |
| `02-§8.10`–`8.11` | Referenser och huvudbild | `byggd` | `Fields.photos` och `Fields.imageReference` löser upp id:n till `Image`, `portraitOf` i `source/ts/build/pages.ts` tar den första; `tests/domain/validate.test.ts` prövar delning mellan poster och dubbelreferens, `tests/build/data-pages.test.ts` att en delad bild ger en fil och en alt-text på båda sidorna |
| `02-§8.12` | Bilder i Markdown | `byggd` | Bildregeln i `source/ts/build/markdown.ts` och upplösaren i `images-plugin.ts`; `tests/build/markdown.test.ts` och en markdown-bild i en QA-platsbeskrivning som `tests/build/data-pages.test.ts` följer genom bygget |
| `02-§8.13` | Varning för oanvänd bildpost och oanvänd bildfil | `byggd` | `collectWarnings` och `warnAboutStrayImageFiles` i `validate.ts`; bild-id i Markdown räknas som användning, annars vore varningen falsk. `tests/domain/validate.test.ts` |
| `02-§8.14`–`8.15` | `npm run image:import` i två steg | `byggd` | `scripts/image-import.mjs` med `--scan` och import; `tests/build/image-import.test.ts` kör båda mot en tillfällig fotokatalog och kontrollerar att bara `images/` finns i datakatalogen efteråt |
| `02-§8.16` | Importen är allt-eller-inget | `byggd` | `planImport` samlar alla fel innan något planeras, och CLI:n läser och omvandlar varje foto innan den första filen skrivs; `tests/build/image-import.test.ts` prövar både en trasig tabell och ett foto som saknas |
| `02-§8.17` | Id:n grupperade per post, klistringsfärdiga | `byggd` | `formatIdsByPost` i `scripts/lib/image-import.ts`; `tests/build/image-import.test.ts` prövar formen både som funktion och i kommandots utskrift |
| `02-§8.18`–`8.19` | Felmeddelanden och CSV med citerade fält | `byggd` | `parseTable` och `formatIssue` i `scripts/lib/image-import.ts`; `tests/build/image-import.test.ts` prövar citattecken, kommatecken och radbrytningar i ett fält, semikolon, byteordningsmarkering, CRLF, och att rad och kolumn står i varje meddelande |
| `02-§8.20` | Samma bild två gånger skrivs en gång | `byggd` | Två rader med samma fil fälls i `planImport`; en omkörning hoppar över bilder som finns, eftersom id:t är innehållets hash. `tests/build/image-import.test.ts` |
| `02-§8.21` | AI-credit i QA och spärr i produktion | `byggd` | QA-bildposterna anger OpenAI ImageGen; `validateImagePosts` avvisar credit som börjar med `AI-genererad` utanför QA och bevakas av `tests/domain/validate.test.ts` |
| `02-§8.22` | `npm run qa:prompts` | `byggd` | `buildQaPromptRows` och `qaPromptCsv` i `scripts/lib/qa-images.ts` samt `scripts/qa-prompts.mjs`; `tests/build/qa-images.test.ts` bevakar kontext, stabilt mål och kalkylarkssäker CSV |
| `02-§8.23`–`8.24`, `8.26`–`8.27` | Säker QA-import under befintliga id:n | `byggd` | `scripts/qa-images.mjs --import` validerar alla källor före skrivning, behåller id och befintliga filer, märker, beskär och komprimerar samt vägrar produktionskataloger; `tests/build/images.test.ts` prövar flödet och felvägarna |
| `02-§8.25` | Platshållare bara för saknade QA-filer | `byggd` | `scripts/qa-images.mjs` hoppar över varje befintlig fil; `tests/build/images.test.ts` prövar omkörning och skyddet för `source/images/` |
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
| `02-§10.1`–`10.8` | Sidhuvud, hopp-länk, ikonrad, meny, desktopvariant, aktuell sida | `manuell` | `source/layouts/header.njk`, `source/ts/ui/menu.ts`, `layout.css`, `components.css`. Öppna startsidan i 360 px: raden visar Meny och feedback, menyn öppnas med knappen och stängs med Escape, tryck utanför och länkval, och sidhuvudet ligger kvar vid rullning. Gå vidare till `/om/` och jämför: Meny ligger kvar på samma ställe och Tillbaka har kommit till höger om den (`02-§10.3`). I 1280 px: logga, namn och länkarna Hem, Kartan, Djuren och Om sajten syns utan fälla, Hem är understruken, och installknappen och feedbackknappen ligger längst till höger på samma rad — kontrollera det på startsidan med installknappen framme, för det är där raden har brustit förut. Tab från adressfältet landar på "Hoppa till innehållet" |
| `02-§10.38` | Överlägget tar emot trycket utanför menyn | `manuell` | `[data-menu-overlay]` i `source/layouts/header.njk`, visat av `source/ts/ui/menu.ts` och format av `.site-menu-overlay` i `components.css`; att elementet finns på varje sida bevakas av `tests/build/site.test.ts`. Öppna `/plats/brackebur/` i 360 px, öppna menyn och tryck på artrutan under kortet: menyn stängs och sidan står kvar på platssidan |
| `02-§10.40`–`10.42` | Tillbaka i sidhuvudet | `byggd` | Valet mellan historiken och startsidan är `returnsToSitePage` i `source/ts/ui/back.ts`, testad i `tests/ui/back.test.ts`; `tests/build/site.test.ts` kräver knappen på varje sida utom startsidan, med `aria-label` och en href till startsidan. Öppna `/djur/get-klara/` i 360 px efter att ha kommit från `/plats/brackebur/`: Tillbaka går till hagen; öppna samma adress direkt i en ny flik: Tillbaka går till startsidans nav |
| `02-§10.39` | Menyns länkar håller träffytan | `manuell` | `.site-menu__link` i `components.css`. Öppna menyn i 360 px och mät en länk i DevTools: minst 44 px hög |
| `02-§10.43` | Djuren i menyn fäller ut arterna | `byggd` | `navLinks` med `children` ur `views.animalsOverview.species` i `source/layouts/header.njk`; `tests/build/site.test.ts` kräver att fällan börjar hopfälld, att första underraden är "Alla djuren" och att de åtta arterna följer i datasetets ordning |
| `02-§10.44` | Fällan är `<details>`; ingen egen klientkod | `byggd` | `<details class="site-menu__details">` i `source/layouts/header.njk`; `tests/build/site.test.ts` kräver elementet och att `source/ts/ui/menu.ts` inte nämner `details` eller `summary` |
| `02-§10.45` | Kartan i menyn har inga underrader | `byggd` | `navLinks` utan `children` för kartan i `source/layouts/header.njk`; `tests/build/site.test.ts` kräver att Djuren är den enda `site-menu__summary` på varje byggd sida |
| `02-§10.9` | 4H-loggan | `byggd` | Förbundets egna banor i `source/assets/img/4h-logo.svg`, härledda ur vektorfilen i `docs/09-kallor/`; `tests/design/logo.test.ts` jämför konstverkets kontrollsumma med registret |
| `02-§10.10` | Ingen huvudsidelänk i sidhuvudet | `byggd` | `tests/build/site.test.ts` |
| `02-§10.11`–`10.13` | Installknapp | `manuell` | `source/ts/ui/install.ts`; läget avgörs av `installButtonState` i `source/ts/domain/install.ts`, testad i `tests/domain/install.test.ts`, och `aria-label` bevakas av `tests/build/pwa.test.ts`. Öppna sajten i Chrome på Android: knappen syns när installationserbjudandet kommer, ett tryck visar dialogen, och knappen försvinner efter installation; i Safari på iPhone syns den alltid och ett tryck växlar texten om Dela under sidhuvudet |
| `02-§10.14` | Till toppen | `manuell` | `source/ts/ui/to-top.ts`. Öppna startsidan i 360 px och rulla 300 px: knappen syns; ett tryck rullar mjukt till toppen och knappen försvinner |
| `02-§10.15` | Feedbackdialogens innehåll | `byggd` | `source/layouts/feedback-dialog.njk`; rubrik, mening, kategorier, fält, etiketter och längdgränser bevakas på varje sida av `tests/build/pwa.test.ts` |
| `02-§10.16` | Skicka först när fälten är ifyllda; issue-adressen | `byggd` | `buildFeedbackUrl` och `isFeedbackComplete` i `source/ts/domain/feedback.ts`, testade i `tests/domain/feedback.test.ts`; `source/ts/ui/feedback.ts` öppnar adressen i ny flik med `noopener` |
| `02-§10.17` | Fokus, Escape, klick utanför, kryss, fälten kvar | `manuell` | `<dialog>.showModal()` i `source/ts/ui/feedback.ts`. Öppna dialogen och tabba runt: fokus stannar i den; Escape, klick utanför och krysset stänger, och fokus återgår till feedbackknappen; skriv i fälten, stäng och öppna igen: texten är kvar |
| `02-§10.18` | Offline: text och inaktiv Skicka | `manuell` | Sätt DevTools → Network → Offline och öppna dialogen: "Du är offline. Feedback kräver uppkoppling." och Skicka går inte att trycka; sätt online igen: Skicka aktiveras |
| `02-§10.19` | Issue-mallen med etiketten `feedback` | `byggd` | `.github/ISSUE_TEMPLATE/feedback.md`; front matter bevakas av `tests/build/pwa.test.ts` |
| `02-§10.20` | Sajten skickar inget själv | `byggd` | Bara `window.open` på adressen; `tests/build/pwa.test.ts` fäller `http(s)://` i `main.js` |
| `02-§10.21` | Sidfot | `byggd` | `source/layouts/footer.njk`; huvudsidelänk, integritetsmening och versionsrad bevakas av `tests/build/site.test.ts`. Loggan är förbundets egen i vit variant (`02-§10.9`) |
| `02-§10.22` | Versionsradens lydelser | `byggd` | `tests/domain/version.test.ts` prövar varje fall; att raden skrivs, och utelämnas utan version, bevakas av `tests/build/site.test.ts` |
| `02-§10.23` | `VERSION` med `X.Y` | `påbörjad` | `VERSION` finns med `0.0` och deploy-flödena läser den; `package.json` bär fortfarande ett eget `version`-fält; inget test |
| `02-§10.24` | Produktionsdeploy med godkännande, tagg och Release | `manuell` | Kör *Deploy till produktion* från Actions-fliken, godkänn i miljön `production`, och bekräfta att taggen `v0.0.0` och Releasen `v0.0.0` finns och att sidfoten visar `Version 0.0.0` |
| `02-§10.25` | `BUILD_VERSION`, lokal version, ingen i CI | `byggd` | `source/ts/domain/version.ts`, testad i `tests/domain/version.test.ts` |
| `02-§10.26` | Cachenamnet är bas-sökvägen och versionssträngen | `byggd` | `CACHE_NAME` i `source/pages/sw.njk`; `tests/build/pwa.test.ts` |
| `02-§10.33` | QA-versionen får " – QA PR<n>" | `manuell` | Merga en pull request och öppna körningen av *Deploy till QA*: jobbet *Compute versions* skriver `0.0.0 – QA PR<n>` med numret på pull requesten, och sidfoten under `/qa/` visar samma sträng |
| `02-§10.34` | QA visar släppet utan suffix efter produktionsdeploy | `manuell` | Efter *Deploy till produktion*: körningens sammanfattning visar samma version för QA som för produktionen |
| `02-§10.35` | Innehållsmerge bygger om produktionen med taggens kod | `manuell` | När en tagg finns: merga en ändring i `source/data/` och bekräfta i körningen av *Deploy till QA* att produktionen byggs från taggen och att loggen säger `Copied source/data from main` |
| `02-§10.36` | Releaseguide | `dokumenterad` | `docs/08-SLAPP.md` |
| `02-§10.27` | Om-sidan | `byggd` | `source/pages/om.njk` renderar `source/content/om.md`; `tests/build/pwa.test.ts` kontrollerar texten, källkodslänken och versionen sist |
| `02-§10.28`–`10.29` | Statusrad för ny version och offline | `manuell` | `source/ts/ui/sw-register.ts` och `source/ts/ui/offline.ts` via `source/ts/ui/status-bar.ts`. Bygg om lokalt med en annan `BUILD_VERSION` medan en sida är öppen: "Ny version finns." med Ladda om visas, och efter tryck visar sidfoten den nya versionen och bara den nya cachen finns kvar. Sätt DevTools → Network → Offline: "Du är offline. Du ser den sparade versionen." visas och försvinner när nätet är tillbaka |
| `02-§10.30` | Dela | `manuell` | `source/ts/ui/share.ts` visar `[data-share-button]` när JS kör; valet mellan delning och kopiering testas i `tests/ui/share.test.ts`. Öppna en platssida på en mobil: Dela öppnar delningsarket; på ett skrivbord utan delningsfunktion visar knappen "Länken är kopierad" och urklippet har adressen |
| `02-§10.31` | Egen appikon | `byggd` | `source/assets/img/favicon.svg` och storlekarna från `npm run icons` (`scripts/icons.mjs`); `tests/build/pwa.test.ts` kontrollerar filerna, måtten och länkarna i `<head>` |
| `02-§10.37` | 4H-loggans färger | `byggd` | `tests/design/logo.test.ts` kräver att den gröna filen bara bär logotypgrönt och vitt och att den vita inte bär grönt. Frizonen spåras i `05-§6.38` |
| `02-§10.32` | Inline-SVG-ikoner med `aria-hidden` | `byggd` | Sidhuvudets och dialogens ikoner; `tests/build/pwa.test.ts` kräver `aria-hidden` på varje `<svg>` i varje sida |
| `02-§11.1`–`11.3` | Bildverktygets adress, `noindex` och tystnaden i `robots.txt` | `byggd` | `source/pages/verktyg-bild.njk` med adressen ur `source/ts/build/tool-page.ts`; `tests/build/site.test.ts` kräver sidan på adressen, `noindex` bara där, att ingen annan sida länkar dit och att `robots.txt` inte pekar ut den |
| `02-§11.4` | Adressen är bekvämlighet, inte skydd | `dokumenterad` | [ADR 0022](../adr/0022-verktygssidor-utanfor-navigationen.md); `README.md` säger det rakt ut |
| `02-§11.5`–`11.6` | Verktyget utanför förcachen och utanför `assets/main.js` | `byggd` | `eleventyExcludeFromCollections` och en egen esbuild-bunt bredvid sidan; `tests/build/pwa.test.ts` kräver att inget i förcachen nämner adressen och `tests/build/site.test.ts` att ingen bunt under `assets/` bär koden |
| `02-§11.7`, `11.11`–`11.12` | Flera bilder i samma vända, id ur den färdiga filen, ingenting lämnar webbläsaren | `manuell` | Öppna verktyget, välj två foton på en gång och bekräfta: två kort visas, id:t under varje bild börjar med `img-`, och nätverksfliken visar inga anrop till någon annan värd. Välj sedan samma foto igen — statusraden ska säga att bilden redan är tillagd, och antalet kort ska vara oförändrat |
| `02-§11.8`–`11.10` | Skalning, kvalitetstrappa och en färdig fil utan metadata | `byggd` | `fitWithin` och `encodeUnderLimit` i `source/ts/domain/image-prepare.ts` (`tests/domain/image-prepare.test.ts`) och `stripWebpMetadata` i `source/ts/domain/webp.ts` (`tests/domain/webp.test.ts`). Att `canvas` inte släpper igenom EXIF, och att ett porträttfoto blir stående, är webbläsarens beteende och ingår i kontrollpunkten för `02-§11.23` |
| `02-§11.13`, `11.16` | Bilden bredvid fälten; tangentbord och skärmläsare | `manuell` | Öppna verktyget med två bilder, tabba genom sidan och bekräfta att varje alt-fält, fotograffält och knapp nås i tur och ordning, att varje fält har en synlig etikett, och att felrutan är kopplad till fälten med `aria-describedby` och har `role="alert"` |
| `02-§11.14`–`11.15` | Alt och fotograf obligatoriska; `AI-genererad` avvisas | `byggd` | `imagePostProblems` i `source/ts/domain/image-post.ts`; `tests/domain/image-post.test.ts` prövar tomma fält, HTML och AI-krediten |
| `02-§11.17`, `11.19`, `11.23` | Två leveranssätt, och att filerna passerar valideringen | `manuell` | Bered två foton i verktyget, fyll i fälten, ladda ner arkivet och packa upp det: mappen `source` ska innehålla `source/images/<id>.webp` och `source/data/images/<id>.yaml`. Kopiera dem till en tom datakatalog och kör `DATA_DIR=<katalog> node scripts/validate.mjs` — enda anmärkningen ska vara varningen att ingen post använder bilden. Ladda sedan ner en bild styckvis och bekräfta att de två knapparna ger samma två filer |
| `02-§11.18`, `11.20`–`11.21` | Arkivet och bildpostens form | `byggd` | `createZip` i `source/ts/domain/zip.ts`, läst tillbaka av en egen läsare i `tests/domain/zip.test.ts`, och `formatImagePost` i `source/ts/domain/image-post.ts`, som också är den `npm run image` skriver med |
| `02-§11.22` | Vägen vidare till GitHubs uppladdningsvy | `byggd` | Stegen på sidan; `tests/build/site.test.ts` kräver båda länkarna till uppladdningsvyn |
| `02-§11.24` | Gränsvärdena på ett enda ställe | `byggd` | `source/ts/domain/image-limits.ts`; `tests/domain/image-limits.test.ts` fäller om bygget och domänskiktet skiljer sig åt, eller om någon annan fil deklarerar ett eget gränsvärde |
| `02-§12.1` | Startskärm med storlek och nivå; inga inställningar under spelet | `manuell` | Formuläret `data-bingo-start` i `source/pages/bingo.njk`; `source/ts/ui/bingo.ts` döljer det när brickan visas. Öppna `/bingo/` i 360 px, välj 4 × 4 och tryck Börja spela: sidan visar bara rubriken, lägesraden och brickan, och radioknapparna är borta |
| `02-§12.2` | Sida, navkort och menyrad | `byggd` | `bingoUrl` och kortet i `homeView` i `source/ts/build/pages.ts`, symbolen i `HOME_CARD_SYMBOLS`, raden i `navLinks` i `source/layouts/header.njk`; `tests/build/pages.test.ts` och `tests/build/data-pages.test.ts` kräver kortet, `tests/build/site.test.ts` menyradens plats |
| `02-§12.3` | Sidan i förcachen | `byggd` | Sidan är en vanlig sida i `collections.all`, som `source/pages/sw.njk` listar; `tests/build/pwa.test.ts` kräver varje sida i förcachen |
| `02-§12.4` | Kandidaterna ur datat: art med bild, djur här med porträtt | `byggd` | `bingoView` i `source/ts/build/pages.ts`; `tests/build/pages.test.ts` prövar urvalet och att en art utan bild och ett djur utan porträtt lämnas utanför, `tests/build/data-pages.test.ts` att sidan bär ett `<template>` per kandidat |
| `02-§12.5` | Slumpen i webbläsaren; varje kandidat en gång innan någon upprepas | `byggd` | `drawCandidates` och `buildBoard` i `source/ts/domain/bingo.ts` med injicerad slump; `tests/domain/bingo.test.ts` |
| `02-§12.6` | Hela brickan utan rullning på 360 px; rutor minst 44 px | `manuell` | `.bingo-board` och `.bingo-square` i `components.css`. Öppna `/bingo/` i 360 × 640 px, starta 4 × 4 och bekräfta att nedersta raden syns utan att rulla och att en ruta är minst 44 px; upprepa med webbläsarens adressfält synligt |
| `02-§12.7` | Dialogen från en ruta: bild, namn, mening, en knapp | `manuell` | `openSquare` i `source/ts/ui/bingo.ts` över dialogen i `source/pages/bingo.njk`; markupen bevakas av `tests/build/data-pages.test.ts`. Tryck på en ruta: dialogen visar bilden större, namnet och Hittat!; bocka av, tryck igen: knappen heter Inte hittat ändå |
| `02-§12.8` | Avbocka och ångra är samma handling, utan kontroll | `byggd` | `toggleSquare` i `source/ts/domain/bingo.ts`; `tests/domain/bingo.test.ts` prövar att ett andra tryck tar bort bocken och att brickan inte muteras |
| `02-§12.9` | Brickan i `localStorage`; det inaktuella förkastas; Ny bricka rensar | `byggd` | `serialiseBoard` och `restoreBoard` i `source/ts/domain/bingo.ts`, testade i `tests/domain/bingo.test.ts` inklusive en sparad ruta som sidan inte längre erbjuder; läsning och skrivning i `source/ts/ui/bingo.ts`. Bocka av två rutor, stäng fliken och öppna `/bingo/` igen: brickan och bockarna är kvar |
| `02-§12.10` | Lägesrad och konfetti per färdig vågrät rad | `byggd` | `lines`, `completedLines`, `newlyCompletedLines` och `foundCount` i `source/ts/domain/bingo.ts`, testade i `tests/domain/bingo.test.ts`, som också prövar att en full kolumn och en full diagonal inte är linjer och att ett tryck aldrig avslutar två linjer; `burst("small")` i `source/ts/ui/confetti.ts`. Bocka av en hel rad: lite konfetti faller |
| `02-§12.11` | Full bricka: konfetti, fem sekunders fanfar, Spela igen; reducerad rörelse | `manuell` | `isFull` i domänen är testad, och `fanfareNotes` i `source/ts/ui/fanfare.ts` prövas av `tests/ui/fanfare.test.ts` mot de fem sekunderna; `burst("big")` och `playFanfare` i `source/ts/ui/`. Att det hörs går inte att testa i kod: bocka av alla rutor med ljudet på och ta tid — konfetti, en fanfar som ringer i fem sekunder och rutan Bingo! visas; slå på reducerad rörelse i systemet och gör om: rutan visas utan konfetti |
| `02-§12.12` | Utan kandidater: texten om att djuren inte är inlagda | `byggd` | Grenen i `source/pages/bingo.njk`; `tests/build/data-pages.test.ts` bygger det tomma datasetet och kräver texten |
| `02-§12.13` | Utan JavaScript säger sidan det | `byggd` | `<noscript>` i `source/pages/bingo.njk`; `tests/build/data-pages.test.ts` kräver det |

### Designspecifikation (`05-§`)

| ID | Ämne | Status | Anteckning |
| --- | --- | --- | --- |
| `05-§1` | Designfilosofi | `dokumenterad` | Vägledande |
| `05-§2.1`–`2.11` | Färgpalett | `byggd` | `tokens.css`, bevakad av `tests/design/tokens.test.ts` |
| `05-§2.12`–`2.18` | Kontrastregler och mörkt läge | `byggd` | Kontrastparen räknas i `tests/design/tokens.test.ts` |
| `05-§2.19` | Logotypgrön bara i logotypens SVG | `byggd` | `tests/design/tokens.test.ts` bevakar att färgen inte är en token; `tests/design/logo.test.ts` att den är den enda gröna i logotypfilen |
| `05-§2.21` | Grafiska profilen är källan; känd avvikelse i de gröna | `dokumenterad` | Avvikelsetabellen i `docs/05-design/index.md` §2 och ADR 0016. Att flytta paletten är en egen ändring |
| `05-§2.20` | Bakgrundsskikt för dialog | `byggd` | `--color-backdrop` i `tokens.css`, bevakad av testet |
| `05-§3` | Typografi | `påbörjad` | Tokens bevakas av testet; navigeringen (`05-§3.9`) i `layout.css` utan test |
| `05-§4.1`–`4.10` | Behållare och spacing | `påbörjad` | Tokens bevakas av testet; `layout.css` använder dem i behållare, sidhuvud och sidfot utan test |
| `05-§4.11`–`4.14` | Rutnät | `byggd` | `.card-grid` och `.species-grid` i `layout.css`: djurslagsrutorna med `auto-fill` och `minmax`, djurkorten med två kolumner som blir tre vid desktopbrytpunkten. Kolumnantalet och kortens `sizes` bevakas av `tests/design/card-grid.test.ts` |
| `05-§4.15` | Träffytor minst 44 px | `manuell` | Öppna `/`, `/plats/lygnslatt-1/` och `/djur/rosa/` i 360 px och bekräfta att markörer, djurslagsrutor, kort, knappar och släktlänkar är minst 44 px höga (mätt i Chromium: markörer 68 px, rutor 155 px, länkar 44 px) |
| `05-§5` | Brytpunkter | `dokumenterad` | Tillämpas när layouten skrivs |
| `05-§6.9`–`6.12` | Knappar | `manuell` | `.button`, `.button--secondary` och `.button:disabled` i `components.css`. Öppna feedbackdialogen: Skicka är grön med vit text och halvgenomskinlig med en förklarande mening tills fälten är ifyllda; statusradens Ladda om är sekundär med djupgrön kant |
| `05-§6.1`–`6.4` | Sidhuvud | `manuell` | `layout.css`. Öppna startsidan i 360 px och 1280 px: vitt sidhuvud med kantlinje som ligger kvar vid rullning, ikonknappar på mobil, logga och länkar på desktop, aktuell sida understruken |
| `05-§6.13`–`6.14` | Kortet | `manuell` | `.card` och `.animal-card` i `components.css`. Öppna `/arter/get/` och bekräfta vit yta, rundade hörn, skugga och innermarginal i kortets textdel |
| `05-§6.15` | Kortets bild i 4:3 | `manuell` | `.animal-card__image` med `aspect-ratio: 4 / 3` och `object-fit: cover`. Öppna `/plats/lygnslatt-1/` och bekräfta att korten med foto och korten med platshållare är lika höga |
| `05-§6.16` | Rubriken är länk, hela kortet klickbart | `manuell` | `.card__link::after` täcker kortet. Öppna `/arter/get/`, klicka på ett korts bild och bekräfta att djursidan öppnas; tabba till kortet och bekräfta att namnet får fokusring |
| `05-§6.44` | Bildverktygets kort, lista och statusrad | `manuell` | `.image-tool__*` i `components.css`, byggda av `source/ts/ui/image-tool/tool.ts`. Öppna verktyget med ett stående och ett liggande foto i 390 px bredd och bekräfta att båda bilderna får plats utan att fylla skärmen, att fälten står under bilden med synliga etiketter, och att nedladdningsknapparna bryter rad i stället för att svämma över |
| `05-§6.17` | `width` och `height` på varje bild | `byggd` | `renderPicture` sätter dem; `tests/build/data-pages.test.ts` kräver dem på varje bild på Rosas sida |
| `05-§6.18`–`6.19` | Djurkortets etiketter | `byggd` | `tags` i `animalCard` och `.tag` i `components.css`; ras, "Lantras" och "Har lämnat gården" prövas i `tests/build/pages.test.ts` och `data-pages.test.ts`. Utseendet: öppna `/arter/get/` och bekräfta ljusgröna etiketter med djupgrön text |
| `05-§6.20` | Platshållare för saknat foto | `byggd` | `renderPlaceholder` med artnamnet som etikett; `tests/build/data-pages.test.ts` kräver plattan med "Get" på Bockens sida |
| `05-§6.21` | Faktaruta | `manuell` | `.note` för tillgängligheten på platssidan. Öppna `/plats/brackebur/` och bekräfta en ljusgrön ruta utan kantlinje under djurslagen |
| `05-§6.22`–`6.27` | Platssida | `byggd` | `source/pages/plats.njk`: `h1`, djurslagsrutor, `note` i dämpad text, rubriken "Getterna på gården" och den tomma platsens text prövas i `tests/build/data-pages.test.ts`. Öppna `/plats/lygnslatt-1/` i 360 px och bekräfta att båda djurslagsrutorna syns utan att rulla |
| `05-§6.28`–`6.29`, `6.32` | Formulärfält | `manuell` | `.field` i `components.css`. Öppna feedbackdialogen: etiketterna Rubrik och Beskrivning står ovanför fälten, som är vita med ram, rundade hörn och minst 44 px höga. Felmeddelanden (`05-§6.29`) har ingen markup ännu: dialogen förebygger fel genom att Skicka är inaktiv tills fälten är ifyllda |
| `05-§6.43` | Rutan på markören | `manuell` | `.map-popup` i `components.css`. Öppna en markör i 360 px och 1280 px: dialogen står mitt på skärmen, som mest 22 rem bred, med namnet som rubrik och krysset bredvid, djurslagen i halvfet och de två raderna dämpade. Öppna en hage och ett café och bekräfta att bara hagen har knappen "Se djuren här" |
| `05-§6.41` | Kartans zoomknappar | `manuell` | `.map__control` och `.map__controls` i `components.css` och `layout.css`. Öppna `/` i 360 px och 1280 px: knapparna står i kartans nedre högra hörn, ljusa med grön ikon och skugga, `−` nedtonad vid 1×, `+` nedtonad vid maxzoom, och "Visa hela kartan" syns bara inzoomad |
| `05-§6.39`–`6.40` | Markörens bricka och symbolen i listan | `manuell` | `.map__pin`, `.map__symbol` och `.place-list__symbol` i `components.css`. Bygg med `DATA_DIR=source/data-qa`, öppna `/` i 360 px och bekräfta att hagarnas markörer är fyllda gröna brickor med vit symbol och att gårdens övriga är ljusa med grön ring och grön symbol, samt att samma symbol står framför namnet i listan under kartan |
| `05-§6.31` | Kartan har en textlista | `byggd` | `views.map.list` i `source/pages/karta.njk`; `tests/build/data-pages.test.ts` kräver varje aktiv plats i listan |
| `05-§6.30` | Sidfot | `manuell` | `source/layouts/footer.njk`, `layout.css`. Öppna en sida och bekräfta djupgrön botten, vit text, och ordningen logga, huvudsidelänk, repolänk, integritetsmening, version |
| `05-§6.33`–`6.34`, `6.37` | Ikonknapp, meny, sidhuvudets höjd | `manuell` | `components.css`, `layout.css`. I 360 px: knapparna är 44 px, menykortet är grönt med vita länkar och glider in under sidhuvudet över ett mörkt överlägg som lämnar sidhuvudets rad synlig; sidhuvudets höjd är densamma före och efter rullning och i 1280 px |
| `05-§6.42` | Menyknappens två lägen i markupen | `byggd` | Båda ikonerna och båda etiketterna ligger i `source/layouts/header.njk` och väljs av `aria-expanded` i `components.css`; `tests/build/site.test.ts` kräver att båda finns och att knappen börjar hopfälld |
| `05-§6.45` | Navkortet | `manuell` | `.home-card*` i `components.css`; plattans färg och kortets sträckning bevakas av `tests/design/card-grid.test.ts`, men utseendet är CSS-layout och går inte att enhetstesta i Node (`CL-§8.6`). Öppna `/` i 360 px och bekräfta att de två korten är lika höga, att rubrikerna står på en rad och att båda syns utan att rulla; öppna i 1280 px och bekräfta att symbolplattan är ett band och inte en tom fjärdedel av kortet |
| `05-§6.46` | Menyns fällbara rad och dess vinkel | `manuell` | `.site-menu__summary`, `.site-menu__chevron` och `.site-menu__sublist` i `components.css`; markupen bevakas av `tests/build/site.test.ts`. Öppna menyn i 360 px: raden Djuren har en vinkel som pekar nedåt, ett tryck fäller ut arterna och vänder vinkeln uppåt, underraderna är indragna och minst 44 px höga, och kortet rullar inuti sig självt i stället för att gå utanför skärmens nederkant |
| `05-§6.47` | Bingobrickan | `manuell` | `.bingo-*` och `.confetti` i `components.css`; färgerna läses ur tokens i `source/ts/ui/confetti.ts`. Öppna `/bingo/` i 360 px och bekräfta att en avbockad ruta har gul ram och botten med bocken över en nedtonad bild, att namnen står på en rad, och att dialogens bild har rundade hörn; öppna i 1280 px och bekräfta att brickan inte växer förbi skärmens höjd |
| `05-§6.35`–`6.36` | Dialog, statusrad | `manuell` | `.dialog` och `.status-bar` i `components.css`. Öppna feedbackdialogen i 360 px och 1280 px: mörkt bakgrundsskikt, vit yta med rundade hörn och kryssknapp uppe till höger, som mest 680 px bred, intonad på under 200 ms; sätt DevTools → Network → Offline: ljusgrön rad med djupgrön text direkt under sidhuvudet |
| `05-§6.38` | Frizon runt 4H-logotypen | `manuell` | Öppna `/` i 1280 px och mät i DevTools att avståndet från logotypen till sajtnamnet är minst 8 px och till sidhuvudets över- och underkant minst 4 respektive 8 px; öppna menyn i 360 px och sidfoten och bekräfta minst 8 px under logotypen |
| `05-§6` övrigt | Hero | `saknas` | Skrivs när markupen finns, enligt `05-§7.2`; heron väntar på ett fotografi från gården |
| `05-§7.1`, `7.5` | Inga hårdkodade värden | `byggd` | stylelint-regeln `declaration-strict-value` fäller literaler utanför `tokens.css` |
| `05-§7.4` | Designtokens | `byggd` | `tokens.css`, bevakad av `tests/design/tokens.test.ts` |
| `05-§7.7`–`7.8` | Fokusmarkering, rörelse | `påbörjad` | I `base.css`; inget test |
| `05-§7.10` | Filstruktur för CSS | `påbörjad` | Fyra filer, laddade i ordning av `source/layouts/base.njk`; `utilities.css` skapas vid behov; inget test |
| `05-§8.1`–`8.4`, `8.8`–`8.10` | Fotoregler, personer, upphovsrätt | `dokumenterad` | Vägledning för den som fotograferar; `credit` visas intill varje bild (`02-§8.7`) |
| `05-§8.5`–`8.7` | Tekniska bildregler | `byggd` | `generateImageSizes` och `renderPicture`, använda av sidorna; `srcset`, `width`, `height` och `loading` bevakas av `tests/build/data-pages.test.ts`. En bild i brödtext delar utseende med en bild i en figure i `source/assets/css/components.css` |
| `05-§8.11` | Logotypens ursprung står i källregistret | `byggd` | `tests/design/logo.test.ts` kräver adress, hämtdatum och besked om filen ligger i repot för varje källa |
| `05-§8.12` | Märkning och motiv för QA-bilder | `byggd` | De 25 fotorealistiska motiven i `source/images-qa/` saknar personer och har permanent märkning; `tests/build/images.test.ts` bevakar märkningen, medan motivvalet har verifierats visuellt |
| `05-§8.13` | Två vägar fram till samma webbanpassade fil | `dokumenterad` | `npm run image` och bildverktyget (`02-§11`) delar gränsvärden, id-beräkning och bildpostens form; valideringen är grinden ([ADR 0021](../adr/0021-bildberedning-i-webblasaren.md)) |
| `05-§9` | Tillgänglighet | `dokumenterad` | Delvis testbar med html-validate |
| `05-§10` | Vad man inte gör | `dokumenterad` | Delvis kontrollerbar med lint |

### Datakontrakt (`04-§`)

| ID | Ämne | Status | Anteckning |
| --- | --- | --- | --- |
| `04-§1`–`04-§9` | Modell för djur, arter, raser, bestånd, platser och bilder | `påbörjad` | Domänlagret läser och validerar modellen, inklusive räknade bestånd, publikt djur-ID och bildposter; gårdens egna bildfiler saknas ännu |
| `04-§3.6`, `04-§4.9` | Publikt djur-ID skiljt från tekniskt id | `byggd` | Datakontraktet definierar fältet; `source/ts/domain/index.ts` behåller originalvärdet och `source/ts/domain/public-id.ts` normaliserar jämförelsen; `tests/domain/public-id-validation.test.ts` |
| `04-§4.2` | Djur har inget `location`-fält | `byggd` | Valideraren fäller (`tests/domain/validate.test.ts`) och `tests/domain/no-location.test.ts` bevakar datat |
| `04-§8` | Härledda vyer | `byggd` | `source/ts/domain/derive.ts` matar vymodellerna i `source/ts/build/pages.ts`; `tests/domain/derive.test.ts` och `tests/build/pages.test.ts`. Djursidan påstår aldrig var individen står (`04-§8.2`): `tests/build/data-pages.test.ts` kräver att ordet `location` inte finns på någon sida |
| `04-§10` | Validering | `byggd` | Den kompletta ingången är `source/ts/domain/index.ts`, som validerar `publicId` och delegerar övriga kontraktsregler till `source/ts/domain/validate.ts`; `tests/domain/validate.test.ts` och `tests/domain/public-id-validation.test.ts` |
| `04-§10.15` | AI-credit avvisas i produktion | `byggd` | `validateImagePosts` skiljer QA från produktion via datakatalogen; `tests/domain/validate.test.ts` prövar båda fallen |
| `04-§10.16` | Publikt ID har giltig form och normaliserad unikhet | `byggd` | `readPublicIds` och `normalisePublicId`; `tests/domain/public-id.test.ts` och `tests/domain/public-id-validation.test.ts` |

### Miljöer (`06-§`)

| ID | Ämne | Status | Anteckning |
| --- | --- | --- | --- |
| `06-§1.1`–`1.2` | QA och produktion ur samma kod i samma utgåva | `manuell` | Efter *Deploy till produktion*: sidfoten i `https://stattared4h.github.io/stattared4h/` och `.../qa/` visar samma version |
| `06-§1.3` | QA-sidor bär `noindex` | `byggd` | `source/layouts/base.njk` när `DATA_DIR` slutar på `data-qa`; `tests/build/site.test.ts` bygger QA och produktion och jämför |
| `06-§1.4` | QA har egen service worker och eget manifest-`id` | `byggd` | Scope, `start_url`, `id` och cachenamn följer bas-sökvägen; `tests/build/pwa.test.ts` bygger under `/prov/qa/` |
| `06-§1.5` | QA-versionen får tillägget " – QA" | `manuell` | Kontrollpunkten för `02-§10.33` |
| `06-§2.1` | `DATA_DIR` väljer dataset | `byggd` | `eleventy.config.js` läser `DATA_DIR` och bygger sidorna ur det datasetet; `tests/build/data-pages.test.ts` bygger QA-datat och ett tomt dataset i en tillfällig katalog |
| `06-§2.2` | Tester körs mot QA-data | `byggd` | `tests/domain/helpers.ts` pekar på `source/data-qa/`; ingen domäntest läser `source/data` utom `02-§6.11` |
| `06-§2.3` | QA-datat prövar gränsfallen | `byggd` | 100 individer, två räknade hönsbestånd, 25 delade bilder, fem formateringsvarianter av publikt djur-ID, en tom hage och en aktiv plats utan foto finns; domän-, UI- och byggtester bevakar fallen |
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
| `03-§1`–`03-§2` | Byggkedja och skikt | `dokumenterad` | Mekanismerna bakom `02-§5`–`02-§8` |
| `03-§3` | Härledda vyer | `byggd` | `source/ts/domain/derive.ts`, sorterat och utan webbläsar-API:er; `tests/domain/derive.test.ts` och `sort.test.ts` |
| `03-§4` | Sidor, vymodeller, bestämd form, makron, Markdown, QR | `byggd` | `source/ts/build/pages.ts`, `source/ts/domain/swedish.ts`, `source/layouts/animal-card.njk`, `species-tile.njk`, `home-card.njk`, `scripts/qr.mjs`; `tests/build/pages.test.ts`, `tests/domain/swedish.test.ts`, `tests/build/qr.test.ts` |
| `03-§5` | Offline och service worker | `byggd` | `source/ts/sw.ts`, `source/pages/sw.njk`, `source/ts/build/pwa.ts`, `source/ts/ui/sw-register.ts`; strategin i `tests/domain/offline.test.ts`, bygget i `tests/build/pwa.test.ts` |
| `03-§7` | Redigering | `dokumenterad` | Process |
| `03-§6.4` | Artens bild i rutor och på artsidan | `byggd` | `species-tile.njk` och `source/pages/arter.njk`; platshållaren med artnamnet bevakas av `tests/build/data-pages.test.ts` |
| `03-§6.1` | Bygget genererar bara mindre storlekar | `byggd` | `generateImageSizes` i `source/ts/build/images.ts`; `tests/build/images.test.ts` |
| `03-§6.2` | Upplösare från bild-id till sökväg | `byggd` | `imagesDirFor` och `renderPicture`; `tests/build/images.test.ts` kontrollerar också att ingen sökväg har en underkatalog per posttyp |
| `03-§6.5` | Bild-id löses upp när datasetet normaliseras | `byggd` | `Fields.imageReference` i `validate.ts` ger `Animal.photos`, `Location.photos` och `Species.photo` färdiga `Image`-objekt; `tests/domain/validate.test.ts` |
| `03-§6.7` | Importen delad i planering och utförande | `byggd` | `scripts/lib/image-import.ts` är ren och testas på strängar; `scripts/image-import.mjs` gör filarbetet. `tests/build/image-import.test.ts` |
| `03-§6.8` | Prompt- och importkedja för QA-bilder | `byggd` | `scripts/lib/qa-images.ts`, `scripts/qa-prompts.mjs` och importläget i `scripts/qa-images.mjs`; `tests/build/qa-images.test.ts` och `tests/build/images.test.ts` bevakar kedjan |
| `03-§6.6` | Bilder i Markdown genom samma kedja | `byggd` | `renderMarkdown(text, { renderImage })` och `markdownImages` från `images-plugin.ts`; `tests/build/markdown.test.ts` |
| `03-§6.3` | `width`, `height`, `loading`, `fetchpriority` | `byggd` | `renderPicture` med `eager` för sidans första bild; `tests/build/data-pages.test.ts` kräver `fetchpriority="high"` på porträttet och `loading="lazy"` på nästa bild |
| `03-§8.1` | `npm run build` | `byggd` | `eleventy` med `eleventy.config.js`; byggtesterna kör samma bygge till en tillfällig katalog |
| `03-§8.2`–`8.4` | Test, lint och CI | `påbörjad` | `npm test`, `npm run lint` och CI kör dem (`02-§9.7`); valideringen körs av bygget först när datat kopplas in |
| `03-§8.5` | Merge till `main` deployar | `manuell` | Merga till `main` och bekräfta att *Deploy till QA* startar när *Quality* blivit grön (`02-§9.11`) |
| `03-§8.6` | Bevakande tester | `byggd` | Bas-sökvägen i `tests/build/site.test.ts` (`02-§9.8`); `location`-fältet i `tests/domain/no-location.test.ts` (`02-§6.11`) |
| `03-§8.7` | Node 22.18; Eleventy importerar TypeScript direkt | `påbörjad` | `eleventy.config.js` importerar `source/ts/domain/version.ts`; `erasableSyntaxOnly` bevakas av typkontrollen, inte av ett test |
| `03-§8.8`–`8.9` | Två deploy-flöden med ett återanvändbart; dubbelbygge | `manuell` | Kontrollpunkterna för `02-§9.11`–`9.12` och `02-§10.35` |
| `03-§9` | Kartan | `byggd` | `source/ts/build/map.ts` med `mapFrame`, `projectPoint`, `renderMap` och bakgrunden; `tests/build/map.test.ts` |
| `03-§9.7` | Rutan: en tom dialog från bygget, fylld ur markörens data | `påbörjad` | `MAP_POPUP` i `source/ts/build/map.ts` och `source/ts/ui/map-popup.ts`. Markupen är testad i `tests/build/map.test.ts`, inklusive att den byggda sidan inte innehåller något tomt `h2`; modulen har inget test |
| `03-§9.6` | Zoomen: domänmodul och tunn UI-modul | `byggd` | `source/ts/domain/map-view.ts` utan webbläsar-API:er; `tests/domain/map-view.test.ts` prövar ankarpunkten, gränserna, vägen tillbaka till utgångsläget och att ingen kant dras in i ramen. `source/ts/ui/map-zoom.ts` håller sig till händelser och en `transform` |
| `03-§9.5` | Symbolerna som inline-SVG i bygget | `byggd` | `source/ts/build/symbols.ts` med `Record<LocationKind, string>`, så att en sort utan symbol fäller `npm run typecheck`. Tre symboler är vägmärkets egen figur, registrerade med kontrollsumma i `docs/09-kallor/index.md` och bevakade av `tests/build/symbols.test.ts` |
| `03-§9.3`–`9.4` | Etikettplacering och länkar vidare | `byggd` | `placeLabels` och kartsidans avsnitt; `tests/build/map.test.ts` och `data-pages.test.ts` |
| `03-§10.1`, `10.4`–`10.5` | Sidhuvud, sidfot, version | `dokumenterad` | Mekanismen bakom `02-§10` |
| `03-§10.6` | Tillbaka är en länk som klientkoden uppgraderar | `byggd` | `source/ts/ui/back.ts`; villkoret `returnsToSitePage` testas i `tests/ui/back.test.ts`, och att markupen är en `<a>` med href till startsidan i `tests/build/site.test.ts` |
| `03-§10.2`–`10.3` | Beteendemoduler under `source/ts/ui/`; feedback-adressen | `byggd` | `source/ts/ui/main.ts` registrerar modulerna, som var och en gör ingenting utan sitt element; `tests/build/pwa.test.ts` bevakar markupen de hakar i och `tests/domain/feedback.test.ts` adressen |
| `03-§11.1`–`11.2` | Adressen som en sanning i bygget; undantagen från förcachen och indexeringen | `byggd` | `IMAGE_TOOL_PATH` i `source/ts/build/tool-page.ts` läses av `eleventy.config.js`, mallen och byggtesterna; `tests/build/site.test.ts` och `tests/build/pwa.test.ts` |
| `03-§11.3`–`11.5` | Lagerdelningen: domänlogik i Node, canvas i `ui/`, id via `crypto.subtle` | `byggd` | `source/ts/domain/image-prepare.ts`, `zip.ts`, `image-post.ts` och `image-limits.ts` testas i Node; `source/ts/ui/image-tool/` håller sig till canvas och DOM. `imageIdFor` är samma funktion i bygget, kommandona och webbläsaren (`tests/domain/image-id.test.ts`) |
| `03-§12.1` | Kandidaterna från bygget som `<template>` per post | `byggd` | `bingoView` i `source/ts/build/pages.ts` och poolen i `source/pages/bingo.njk`; `tests/build/data-pages.test.ts` räknar malldelarna och kräver bildkedjans markup i dem |
| `03-§12.2` | Regler i domänen, DOM i vyn, firande utan beroenden | `byggd` | `source/ts/domain/bingo.ts` testad i `tests/domain/bingo.test.ts`; `source/ts/ui/bingo.ts`, `confetti.ts` och `fanfare.ts` håller sig till DOM, canvas och Web Audio, och `tests/build/pwa.test.ts` kräver att den buntade koden inte pekar på någon annan värd. Fanfarens tonlista är ren data i `fanfareNotes`, testad utan webbläsare i `tests/ui/fanfare.test.ts` |

### Källregister (`09-§`)

| ID | Ämne | Status | Anteckning |
| --- | --- | --- | --- |
| `09-§1.1`, `1.3`, `1.5` | Adress, datum och kontrollsumma för varje källa | `byggd` | `tests/design/logo.test.ts` prövar registrets form, den lagrade filens kontrollsumma och konstverkets |
| `09-§1.2`, `1.4` | Vad som läggs in i repot; att registret inte äger upphovsrätten | `dokumenterad` | Gränsen vid ~1 MB följer ADR 0008; ägandet står i `README.md` |
| `09-§1.6` | Ursprung för AI-genererat material | `dokumenterad` | Källregistret anger OpenAI ImageGen, datum och det härledda promptunderlaget |

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
| `saknas` | 1 |
| `dokumenterad` | 20 |
| `påbörjad` | 17 |
| `byggd` | 174 |
| `manuell` | 62 |

Summeringen räknar rader i tabellerna under *Läget nu* och uppdateras i fas 5 av processen i
`CLAUDE.md`. Dokumentkontrollen i `02-§9.10` fäller när den inte stämmer. <!-- 99-§1.2 -->
