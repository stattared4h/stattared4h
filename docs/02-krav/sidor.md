# Krav — Sidor och navigering

Del av [kravindexet](./index.md). Den här filen äger `02-§5`.

Issues: [#6](https://github.com/stattared4h/stattared4h/issues/6),
[#7](https://github.com/stattared4h/stattared4h/issues/7),
[#9](https://github.com/stattared4h/stattared4h/issues/9),
[#13](https://github.com/stattared4h/stattared4h/issues/13).

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

### Sidtyper och adresser

- Sajten har fem sidtyper: startsidan `/`, platssidan `/plats/<id>/`, djursidan
  `/djur/<id>/`, artsidan `/arter/<id>/` och kartan `/karta/`. Adressen byggs av
  postens id och ändras aldrig. <!-- 02-§5.1 -->
- Varje sidadress slutar med snedstreck och skrivs som `index.html` i en katalog, så att
  GitHub Pages och den lokala servern svarar likadant. <!-- 02-§5.2 -->
- En adress som inte finns visar sajtens egen 404-sida, med sidhuvud och sidfot, texten
  "Sidan finns inte" och länkar till startsidan och kartan. <!-- 02-§5.3 -->

### Gemensamt för alla sidor

- Sidhuvudet (`05-§6.1`) innehåller sajtens namn som länk till startsidan, en länk till
  kartan och länken till huvudsidan på `4h.se/stattared`. <!-- 02-§5.4 -->
- Sidfoten följer `05-§6.30`. <!-- 02-§5.5 -->
- Varje sida har exakt en `h1`, `lang="sv"`, en `<title>` som börjar med sidans namn och
  slutar med "Stättareds 4H-gård", och en `meta description`. <!-- 02-§5.6 -->

### Startsidan

- Startsidan visar djurslagen som finns på gården — arter med minst ett djur med
  `status: here` — som tryckytor med artens bild och namn i plural, länkade till
  artsidan, och därefter en länk till kartan. <!-- 02-§5.7 -->
- Startsidan säger i en mening vad sajten är och pekar på huvudsidan
  (`02-§1.9`). <!-- 02-§5.8 -->

### Platssidan

- Platssidan visar platsens namn som `h1` och omedelbart därunder platsens djurslag som
  tryckytor (`05-§6.24`), länkade till artsidan. <!-- 02-§5.9 -->
- Platsens `note` visas under djurslagen och `description` som brödtext.
  Tillgängligheten visas i ord i en faktaruta: "Hit når man med rullstol och barnvagn"
  eller "Hit når man inte med rullstol eller barnvagn". <!-- 02-§5.10 -->
- Under det listas djuren av platsens djurslag med `status: here` som djurkort, under en
  rubrik per djurslag på formen "Getterna på gården". Sidan påstår inte att en namngiven
  individ står på platsen (ADR 0012). <!-- 02-§5.11 -->
- En aktiv plats utan djurslag visar "Just nu går inga djur här" och en länk till
  kartan. <!-- 02-§5.12 -->
- En plats med `active: false` behåller sin adress, visar "Den här platsen används inte
  just nu" och en länk till kartan, och finns varken på kartan eller i kartans
  lista. <!-- 02-§5.13 -->

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
  `status: gone` under rubriken "Har lämnat gården". <!-- 02-§5.20 -->
- Finns arten på ingen aktiv plats säger artsidan "Just nu vet vi inte var getterna går"
  och länkar till kartan. <!-- 02-§5.21 -->
- Finns `source/content/arter/<id>.md` renderas dess Markdown som artens redaktionella
  text. Saknas filen visas ingen text och ingen tom rubrik. <!-- 02-§5.22 -->

### Kartan

- Kartsidan visar en karta över gården: en SVG som bygget genererar, där varje aktiv
  plats med koordinater är en markör med platsens namn, länkad till
  platssidan. <!-- 02-§5.23 -->
- Under kartan står en textlista med samma platser, deras djurslag i plural och länk till
  platssidan. Listan är en fullvärdig väg till informationen utan kartan. <!-- 02-§5.24 -->
- En aktiv plats utan koordinater finns i listan men inte på kartan. <!-- 02-§5.25 -->
- Kartan laddar inga kartplattor och gör inga anrop utanför sajten. <!-- 02-§5.26 -->
- Varje markör är minst 44 × 44 px, och kartan har en textbeskrivning: "Karta över
  Stättared med gårdens hagar". <!-- 02-§5.27 -->

### Djurkortet

- Djurkortet (`05-§6.18`) visar porträttbild eller platshållare, namn och djurslag, och
  hela kortet länkar till djursidan. <!-- 02-§5.28 -->
