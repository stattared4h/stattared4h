# Krav — Sidor och navigering

Del av [kravindexet](./index.md). Den här filen äger `02-§5`.

Issues: [#6](https://github.com/stattared4h/stattared4h/issues/6),
[#7](https://github.com/stattared4h/stattared4h/issues/7),
[#9](https://github.com/stattared4h/stattared4h/issues/9),
[#13](https://github.com/stattared4h/stattared4h/issues/13),
[#19](https://github.com/stattared4h/stattared4h/issues/19),
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

- Startsidan visar först kartan över gården, sedan platslistan, och därunder djurslagen
  som finns på gården — arter med minst ett djur med `status: here` eller ett räknat
  bestånd (`04-§4.7`) — som tryckytor med artens bild och namn i plural, länkade till
  artsidan. Besökaren står på gården med telefonen: kartan är det första hen behöver,
  djuren det andra. Är inget djurslag inlagt säger startsidan det och pekar på
  huvudsidan. <!-- 02-§5.7 -->
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
  plats med koordinater är en markör med platsens namn, länkad till
  platssidan. <!-- 02-§5.23 -->
- Under kartan står en textlista med samma platser, deras djurslag i plural och länk till
  platssidan. Listan är en fullvärdig väg till informationen utan kartan. <!-- 02-§5.24 -->
- En aktiv plats utan koordinater finns i listan men inte på kartan. <!-- 02-§5.25 -->
- Kartan laddar inga kartplattor och gör inga anrop utanför sajten. <!-- 02-§5.26 -->
- Varje markör är minst 44 × 44 px, och kartan har en textbeskrivning: "Karta över
  Stättared med gårdens hagar". <!-- 02-§5.27 -->
- Finns `source/map/background.svg` och `source/map/background.yaml` ritas den filen
  under markörerna, inbäddad i sidan utan externa resurser, och markörerna placeras i
  ritningens koordinatsystem enligt de kanter `background.yaml` anger (`03-§9.2`).
  Bygget varnar om en plats hamnar utanför ritningen. Saknas filerna visas markörerna på
  en tom platta. <!-- 02-§5.30 -->
- Markören visar platsens namn och sortens symbol (`02-§5.38`), inget mer. Vilka djurslag
  som går var står i listan under kartan, aldrig i markörerna, så att ritningen förblir
  läsbar när hagarna ligger tätt. <!-- 02-§5.32 -->
- Två markörer vars etiketter annars skulle överlappa får sina etiketter placerade på
  var sin sida om markören, så att båda går att läsa, och en etikett hålls innanför
  ritningens kant. Ligger fler markörer på samma fläck än det finns sidor visas de
  etiketter som blir över inte på kartan: namnet är kvar som markörens tillgängliga namn, syns
  när markören pekas på eller får fokus, och står alltid i listan under kartan
  (`02-§5.24`). Bygget räknar placeringen för en karta som är 360 px bred — den trängsta
  vyn i mobilläget (`05-§5.1`) — och räknar deterministiskt: samma platsdata ger samma
  placering. <!-- 02-§5.33 -->
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

### Djurkortet

- Djurkortet (`05-§6.18`) visar porträttbild eller platshållare, namn och djurslag, och
  hela kortet länkar till djursidan. <!-- 02-§5.28 -->
