# Krav — Sidor och navigering

Del av [kravindexet](./index.md). Den här filen äger `02-§5`.

Issues: [#6](https://github.com/stattared4h/stattared4h/issues/6),
[#7](https://github.com/stattared4h/stattared4h/issues/7),
[#9](https://github.com/stattared4h/stattared4h/issues/9),
[#13](https://github.com/stattared4h/stattared4h/issues/13),
[#19](https://github.com/stattared4h/stattared4h/issues/19),
[#50](https://github.com/stattared4h/stattared4h/issues/50),
[#51](https://github.com/stattared4h/stattared4h/issues/51).

---

## 5. Sidor och navigering

### Bakgrund

Sidorna beskrevs först i issues #6, #7, #9 och #13. Två saker avgjordes när kraven
skrevs. Issue #13 kallade artsidan "en senare utbyggnad", men flödet plats → djurslag →
individ i #6 och #7 går via artsidan, så den är kärna i fas 1 i en minimal form; den
redaktionella prosan kan komma senare. Issue #9 och #19 beskrev två kartor — en ur
koordinater och en ritad SVG matchad på id. Datakontraktet bär koordinater
(`04-§5`), så markörerna räknas ur `lat`/`lon`, och en ritad bakgrund är ett tillägg.

Platssidan visar individer, som `03-§3` och `05-§6.26` säger, men under en rubrik som
gör det tydligt att listan är djurslagets djur på gården, inte en påstådd placering.
Det är hur `03-§3` och ADR 0012 går ihop med #7:s regel att aldrig lova att ett
namngivet djur står i hagen.

Kartans markörer såg först likadana ut, och en besökare som letade efter en toalett fick
läsa sig fram namn för namn. Issue #51 bad om en symbol per sorts plats, som på gårdens
skyltar. Symbolerna är det bygget som först beror på vad en plats är, och därför bär
`kind` sedan dess åtta värden i stället för två (ADR 0019).

Platslistan under kartan var en platt alfabetisk lista på trettiotvå rader, där hagar och
djurhus låg blandade med toaletter, parkeringar, grillplatser och vandrarhem. Den som stod
på gården och undrade vilken hage hen skulle gå till läste sig igenom parkeringarna på
vägen, och "Djuren på gården" började 2 462 px ned — efter kartan, listan och ett formulär
för att skriva av ett märkningsnummer (issue #62).

Det uppenbara vore att flytta upp djurslagen ovanför listan. Det gjordes inte: artrutnätet
är omkring 760 px högt och skulle knuffa ned kartans textalternativ lika långt, och kartan
plus listan är orienteringsverktyget för den som står i hagen. Orienteringen väger tyngre
än ordningen. `02-§5.51` gör listan värd sina rader i stället, och `02-§5.52` flyttar det
som inte hörde hemma mitt på sidan.

Djurkorten låg först i en kolumn på mobil: `auto-fit` med ett minimum på 280 px ger
aldrig två kolumner i en telefons 312 px innehållsbredd. Platssidan för Bräckebur blev
8 249 px lång för nitton getter — tio skärmars rullning — och barnet som ska känna igen
geten framför sig fick hålla nitton foton i minnet i stället för att jämföra dem på
skärmen (issue #61). `02-§5.50` sätter antalet per bredd i stället.

Etiketterna hade först fyra lägen — under, över, höger, vänster — och tog det första
lediga. "Under" är ledig för de fyra numrerade hagarna, så den vann varje gång. Betesmarken
är indelad i band som löper nordväst–sydost, och en etikett rakt under markören glider
därför på tvärs mot bandet, mot staketet och in i grannhagen (issue #50). `02-§5.53` ger
placeringen fyra sneda lägen till och prövar dem först. Alternativet — att låta varje plats
välja sida i sin YAML — avvisades: utseende hör inte hemma i datat, och en regel som gäller
alla platser lika är värd mer än handpåläggning per plats.

Samma issue bad också om att kunna zooma. Åtta av gårdens platser ligger i en klunga kring
gårdsplanen, inom några tiotal meter från varandra, och i överblick får deras namn inte
plats. Zoomen är sajtens första riktiga klientkod, och vad den får kosta i en sajt som
håller på minimal JavaScript (`CL-§1.4`) avgörs i ADR 0020.

### Sidtyper och adresser

- Sajten har fyra sidtyper: startsidan `/`, platssidan `/plats/<id>/`, djursidan
  `/djur/<id>/` och artsidan `/arter/<id>/`. Adressen byggs av postens id och ändras
  aldrig. Kartan har ingen egen adress: den bor på startsidan. <!-- 02-§5.1 -->
- Varje sidadress slutar med snedstreck och skrivs som `index.html` i en katalog, så att
  GitHub Pages och den lokala servern svarar likadant. <!-- 02-§5.2 -->
- En adress som inte finns visar sajtens egen 404-sida, med sidhuvud och sidfot, texten
  "Sidan finns inte" och en länk till startsidan. <!-- 02-§5.3 -->

### Gemensamt för alla sidor

- Sidhuvudet följer `02-§10.1`–`10.10`. <!-- 02-§5.4 -->
- Sidfoten följer `02-§10.21`–`10.22`. <!-- 02-§5.5 -->
- Varje sida har exakt en `h1`, `lang="sv"`, en `<title>` som börjar med sidans namn och
  slutar med "Stättareds 4H-gård", och en `meta description`. <!-- 02-§5.6 -->

### Startsidan

- Startsidan visar först kartan över gården, sedan platslistan (`02-§5.51`), och därunder
  djurslagen som finns på gården — arter med minst ett djur med `status: here` eller ett
  räknat bestånd (`04-§4.7`) — som tryckytor med artens bild och namn i plural, länkade
  till artsidan. Besökaren står på gården med telefonen: kartan är det första hen behöver,
  djuren det andra. Är inget djurslag inlagt säger startsidan det och pekar på
  huvudsidan. <!-- 02-§5.7 -->
- Öronmärkessökningen (`02-§5.36`) är startsidans sista avsnitt före "Fler kartor i
  området". Den kräver att besökaren står intill djuret med numret läsbart och är därmed
  det ovanligaste av startsidans ärenden. <!-- 02-§5.52 -->
- Startsidan säger i en mening vad sajten är och pekar på huvudsidan
  (`02-§1.9`). <!-- 02-§5.8 -->

### Platssidan

- Platssidan visar platsens namn som `h1` och omedelbart därunder platsens djurslag som
  tryckytor (`05-§6.24`), länkade till artsidan. <!-- 02-§5.9 -->
- Platsens `note` visas under djurslagen och `description` som brödtext.
  Tillgängligheten visas i ord i en faktaruta: "Hit når man med rullstol och barnvagn"
  eller "Hit når man inte med rullstol eller barnvagn". <!-- 02-§5.10 -->
- Under det listas djuren av platsens djurslag med `status: here` som djurkort, under en
  rubrik per djurslag på formen "Getterna på gården". Ett djurslag med räknade bestånd
  (`04-§4.7`) får i stället en mening på formen "På gården finns 18 svarta dvärghöns och
  14 orusthöns." Sidan påstår inte att en namngiven individ står på platsen
  (ADR 0012). <!-- 02-§5.11 -->
- En aktiv plats med `kind: djurplats` utan djurslag visar "Just nu går inga djur här"
  och en länk till startsidan med kartan. <!-- 02-§5.12 -->
- En plats vars `kind` inte är `djurplats` nämner inte djur: ingen djurlista, ingen rubrik per
  djurslag och ingen mening om att inga djur går där. Sidan visar namnet, texten,
  tillgängligheten och bilderna. I kartans lista står platsen med namn och länk,
  utan text om djurslag. <!-- 02-§5.35 -->
- En plats med `active: false` behåller sin adress, visar "Den här platsen används inte
  just nu" och en länk till startsidan med kartan, och finns varken på kartan eller i
  kartans lista. <!-- 02-§5.13 -->
- Platssidan visar platsens bilder med `alt` och fotografens namn, efter faktarutan och
  före djurlistan, så att djurslagen överst inte trängs undan (`05-§6.24`). En plats utan
  bilder visar ingen platshållare. <!-- 02-§5.31 -->
- `npm run qr` skriver en SVG-fil per plats till `qr/<id>.svg`, med adressen
  `<sajtens adress>plats/<id>/`, i ett format som går att skriva ut på en skylt.
  Adressen tas ur miljövariabeln `SITE_URL` med
  `https://stattared4h.github.io/stattared4h/` som standard. Inaktiva platser får
  också en kod, eftersom adressen är permanent. <!-- 02-§5.29 -->

### Djursidan

- Djursidan visar namnet som `h1`, porträttbilden, arten som länk till artsidan, rasen
  med "lantras" när `heritage: true`, könet, födelseuppgiften som "Född 2021" eller
  "Född 12 april 2021", och `description` renderad från Markdown. En uppgift som saknas
  visas inte. <!-- 02-§5.14 -->
- Djursidan visar stamtavlan: mor, far, avkomma och syskon som länkar till respektive
  djursida. Syskon är djur som delar minst en förälder. <!-- 02-§5.15 -->
- Djursidan visar djurets alla bilder med `alt` och fotografens namn. <!-- 02-§5.16 -->
- Djursidan påstår aldrig var individen står. Den länkar till artsidan, som visar var
  djurslaget finns (`04-§8.2`). <!-- 02-§5.17 -->
- Ett djur med `status: gone` behåller sin sida med märkningen "Har lämnat gården"
  överst, och samma märkning syns på varje kort som visar djuret. <!-- 02-§5.18 -->

### Artsidan

- Artsidan visar artens namn i plural som `h1`, artens bild, och de aktiva platser vars
  `species` innehåller arten, som länkar till platssidorna. <!-- 02-§5.19 -->
- Artsidan listar artens djur med `status: here` som djurkort, och därunder djur med
  `status: gone` under rubriken "Har lämnat gården". En art med räknade bestånd visar i
  stället meningen "På gården finns 18 svarta dvärghöns och 14 orusthöns." <!-- 02-§5.20 -->
- Finns arten på ingen aktiv plats säger artsidan "Just nu vet vi inte var getterna går"
  och länkar till startsidan med kartan. <!-- 02-§5.21 -->
- Finns `source/content/arter/<id>.md` renderas dess Markdown som artens redaktionella
  text. Saknas filen visas ingen text och ingen tom rubrik. <!-- 02-§5.22 -->

### Kartan

Kartan har ingen egen sida. Den är det första på startsidan (`02-§5.1`, `02-§5.7`).

- Startsidan visar en karta över gården: en SVG som bygget genererar, där varje aktiv
  plats med koordinater är en markör med platsens namn, länkad till platssidan. Länken är
  markörens grund: utan JavaScript går ett tryck dit, med JavaScript öppnas en ruta med
  mer om platsen (`02-§5.46`). <!-- 02-§5.23 -->
- Under kartan står en textlista med samma platser, deras djurslag i plural och länk till
  platssidan. Listan är en fullvärdig väg till informationen utan kartan. <!-- 02-§5.24 -->
- Listan är delad i två grupper med var sin rubrik: "Hagar och djurhus" — platserna med
  `kind: djurplats`, med eller utan djur just nu — och därefter "Annat på gården" med
  övriga sorter. Inom varje grupp står platserna i samma ordning som förut, och
  tillsammans innehåller grupperna varje plats kartan visar, så listan förblir en
  fullvärdig väg till informationen (`02-§5.24`). En grupp utan platser visas
  inte. <!-- 02-§5.51 -->
- En aktiv plats utan koordinater finns i listan men inte på kartan. <!-- 02-§5.25 -->
- Kartan laddar inga kartplattor och gör inga anrop utanför sajten. <!-- 02-§5.26 -->
- Varje markör är minst 44 × 44 px, och kartan har en textbeskrivning: "Karta över
  Stättared med gårdens hagar". <!-- 02-§5.27 -->
- Finns `source/map/background.svg` och `source/map/background.yaml` ritas den filen
  under markörerna, inbäddad i sidan utan externa resurser, och markörerna placeras i
  ritningens koordinatsystem enligt de kanter `background.yaml` anger (`03-§9.2`).
  Bygget varnar om en plats hamnar utanför ritningen. Saknas filerna visas markörerna på
  en tom platta. <!-- 02-§5.30 -->
- Markören visar platsens namn och sortens symbol (`02-§5.38`), inget mer. Djurslagen står
  aldrig på ritningen, så att den förblir läsbar när hagarna ligger tätt; de står i listan
  under kartan och i den ruta besökaren själv öppnar (`02-§5.46`). Skillnaden är vem som
  bett om texten: ritningen bär bara det som måste synas hela tiden. <!-- 02-§5.32 -->
- Två markörer vars etiketter annars skulle överlappa får sina etiketter placerade på
  var sin sida om markören, så att båda går att läsa, och en etikett hålls innanför
  ritningens kant. Ligger fler markörer på samma fläck än det finns lediga lägen får de
  som blir över det läge som skaver minst (`02-§5.54`); först när inget av de åtta lägena
  ryms innanför kanten visas etiketten inte på kartan. Namnet är då kvar som markörens
  tillgängliga namn, syns när markören pekas på eller får fokus, och står alltid i listan
  under kartan (`02-§5.24`). Bygget räknar placeringen för kartans egen bredd, inte
  fönstrets: på en 360 px telefon är kartan 312 px bred, resten är behållarens innerkant.
  Räkningen är deterministisk: samma platsdata ger samma placering. <!-- 02-§5.33 -->
- Etiketten har åtta möjliga lägen kring markören: fyra sneda och fyra raka. De sneda
  prövas först — ett snett läge lämnar stråket rakt under och rakt bredvid markören fritt
  åt grannen. Betesmarkens band löper nordväst–sydost, så av de sneda prövas de två som
  följer den riktningen först: snett upp till vänster och snett ned till höger. En etikett
  på den andra diagonalen går på tvärs över staketet in i grannhagen. Ordningen är därmed
  snett upp vänster, snett ned höger, snett upp höger, snett ned vänster, och därefter de
  raka: under, över, höger, vänster. Ordningen är fast, så placeringen är
  deterministisk. Hörnet där zoomknapparna ligger (`02-§5.41`) räknas som upptaget, så
  ingen etikett hamnar bakom en knapp. <!-- 02-§5.53 -->
- **Ingen etikett hamnar utanför ritningens kant.** Det är den regel som väger tyngst;
  en etikett som sticker ut klipps av kartan och blir obegriplig. Finns inget helt ledigt
  läge innanför kanten väljs det läge som skaver minst mot det som redan står där, hellre
  än att namnet inte visas alls. Att skava mot en annan etikett väger lättare än att täcka
  en annan markörs prick, eftersom pricken är det besökaren trycker på; texten går att läsa
  förbi, en dold prick går inte att hitta. Zoomknapparnas hörn (`02-§5.41`) är fortsatt
  helt förbjudet. En etikett som ligger delvis över en annan hör fortfarande ihop med sin
  prick, eftersom strecket i `02-§5.55` visar vilken. <!-- 02-§5.54 -->
- **Under 600 px visar överblicken inga namn alls.** Kartan är då 312 px bred, och
  gårdens trettiofyra platser får inte plats med namn bredvid varandra hur de än placeras;
  `02-§5.54` skulle lägga dem i en vägg av text över ritningen. Markörerna med sina
  symboler (`02-§5.38`) räcker för att se var platserna ligger, namnen står i listan under
  kartan (`02-§5.24`), och de kommer fram så snart besökaren zoomar (`02-§5.44`) eller
  pekar på en markör. Från 600 px finns utrymmet, och då gäller `02-§5.54` som skrivet:
  namnen syns direkt. <!-- 02-§5.55 -->
- Varje markör bär en symbol som visar vad platsen är. Sorterna i `kind` (`04-§5.7`) har
  var sin symbol: hage, mat, grill, toalett, parkering, lek, boende och husbil. Finns ett
  svenskt vägmärke för det platsen är, och stämmer märkets figur med gårdens plats, är
  symbolen den figuren: H5 servering, H8 vandrarhem och H28 husbilsplats. Övriga är ritade
  för sajten, och ingen symbol påstår något om platsen som inte är sant. Symbolen påstår aldrig något om platsen som inte är sant.
  Symbolen är ritad i sidan, hämtas inte utifrån (`02-§5.26`) och är dold för
  skärmläsaren — markörens tillgängliga namn är platsens namn, som förut. <!-- 02-§5.38 -->
- Samma symbol står framför platsens namn i listan under kartan. Den som möter en symbol
  på ritningen hittar därmed dess betydelse i text på samma sida, utan egen
  teckenförklaring (`02-§5.24`). <!-- 02-§5.39 -->
- Startsidan länkar vidare till gårdens egen sida om vandring och fiske och till
  Naturkartan för Kungsbacka, under rubriken "Fler kartor i området". Länkarna är vanliga
  länkar; sidan bäddar inte in något från dem (`02-§5.26`). <!-- 02-§5.34 -->
- Kartan går att zooma och panorera. På pekskärm zoomar besökaren med ett nyp och drar
  kartan med ett finger; på dator zoomar `Ctrl`- eller `Cmd`-hjul, medan vanligt hjul
  rullar sidan som på varje annan sida. <!-- 02-§5.40 -->
- Kartan har tre knappar: zooma in, zooma ut och "Visa hela kartan". De går att nå med
  tangentbord, och genom dem finns zoomen även för den som inte nyper eller har
  mus. <!-- 02-§5.41 -->
- Vid 1× tar kartan bara nyp, inte drag: en besökare som rullar förbi startsidan med
  fingret på kartan rullar sidan. Först när kartan är inzoomad tar den också drag, och då
  går den att panorera. <!-- 02-§5.42 -->
- Markören behåller sin storlek och sin träffyta om minst 44 × 44 px (`02-§5.27`) vid
  varje zoomnivå, och sitter kvar på sin koordinat när kartan flyttas eller zoomas — som
  en nål på en karta, inte som en del av bilden. <!-- 02-§5.43 -->
- Zoomad tillräckligt långt in visar kartan alla platsnamn, också de etiketter som döljs
  i överblick när markörerna ligger för tätt (`02-§5.33`). Klungan kring gårdsplanen går
  därmed att särskilja: varje plats syns med namn. Att kartan bara är inzoomad räcker inte
  — åtta platser inom några tiotal meter staplar sina etiketter även vid dubbel förstoring,
  och staplade namn är sämre än inga. <!-- 02-§5.44 -->
- Utan JavaScript visas kartan som en stillbild i sitt utgångsläge, knapparna syns inte,
  och listan under kartan är fortfarande en fullvärdig väg till informationen
  (`02-§5.24`). Zoomen hämtar ingenting utifrån (`02-§5.26`). <!-- 02-§5.45 -->
- Ett tryck på en markör öppnar en ruta mitt på skärmen med mer om platsen: namnet,
  platsens `note` när den finns, och tillgängligheten i ord. Mitt på skärmen finns alltid
  plats, vilket en ruta förankrad vid markören inte har — kartan är omkring 270 px hög på
  en telefon. Rutan hämtar ingenting utifrån (`02-§5.26`); allt den visar står redan i
  sidan. <!-- 02-§5.46 -->
- För en `djurplats` visar rutan också djurslagen i plural, eller "Just nu går inga djur
  här", och en länk till platssidan med texten "Se djuren här". Övriga sorter visar ingen
  länk: rutan säger allt deras sida säger, och en länk vidare till en sida som upprepar
  det vore en omväg. Deras sida finns kvar och QR-koden på plats leder dit
  (`02-§5.29`). <!-- 02-§5.47 -->
- Högst en ruta är öppen åt gången, och medan den är öppen är resten av sidan inte
  åtkomlig. Den stängs med Escape, med ett tryck utanför den och med sin egen stängknapp,
  och fokus går tillbaka till markören som öppnade den. <!-- 02-§5.48 -->
- Utan JavaScript öppnas ingen ruta. Ett tryck på markören går då till platssidan, som
  bär samma uppgifter i sin helhet. <!-- 02-§5.49 -->

### Djurkortet

- Djurkortet (`05-§6.18`) visar porträttbild eller platshållare, namn och djurslag, och
  hela kortet länkar till djursidan. <!-- 02-§5.28 -->
- Djurkorten ligger två i bredd under desktopbrytpunkten (`05-§5.3`) och tre från den, så
  att flera djur syns samtidigt på en telefon. Kortets `sizes` motsvarar den kolumnbredd
  kortet faktiskt får, så att en telefon inte hämtar bilder för en helskärmsbredd
  (`02-§8.5`). <!-- 02-§5.50 -->
