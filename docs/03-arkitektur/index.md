# Arkitektur — index

Hur sajten är byggd. *Varför* den är byggd så står i [`../adr/`](../adr/README.md);
*vad* den ska göra står i [`../02-krav/`](../02-krav/index.md).

Avsnitts-ID (`03-§N.M`) är stabila och citeras från kod och spårbarhetsmatrisen.

---

## 1. Systemöversikt

Sajten är en statiskt byggd PWA. Ingenting körs på en server; allt avgörs vid bygget eller i
besökarens webbläsare. <!-- 03-§1.1 -->

```text
source/                      bygge (Eleventy + esbuild)        public/
├── data/*.yaml       ──┐                                   ┌── *.html
├── content/*.md      ──┼──►  1. läs och validera data  ──┐  ├── assets/*.css
├── layouts/*.njk     ──┤     2. härled vyer            ─┼─►├── assets/*.js
├── assets/css/*.css  ──┤     3. rendera sidor          ─┤  ├── images/*
├── assets/ts/*.ts    ──┤     4. generera bildstorlekar ─┤  ├── manifest.webmanifest
└── images/*          ──┘     5. skriv manifest + sw    ─┘  └── sw.js
```

Steg 1 fäller bygget vid ogiltig data, så inget felaktigt når `public/`. <!-- 03-§1.2 -->

---

## 2. Skikt

| Skikt | Katalog | Får känna till |
| --- | --- | --- |
| Data | `source/data/` | ingenting — det är ren YAML |
| Domän | `source/ts/domain/` | data; **inga** webbläsar-API:er |
| Vy | `source/ts/ui/` | DOM och domän |
| Mallar | `source/layouts/`, `source/content/` | data via Eleventy |
| Tester | `tests/` | domän, validering och det färdiga bygget; körs i Node |

Domänskiktet är rent: ingen `window`, `document` eller `navigator`. Där bor härledningarna
och senare spelreglerna, och därför går de att enhetstesta i Node utan
webbläsare. <!-- 03-§2.1 -->

Vyskiktet bygger DOM med `createElement` och `textContent`. Ingen `innerHTML` finns i
kodbasen; det är samtidigt skyddet mot XSS. <!-- 03-§2.2 -->

---

## 3. Härledda vyer

Datat lagrar bara det som är sant om en enskild post. Allt som kopplar ihop poster räknas
fram i bygget, så att samma faktum aldrig står på två ställen. Härledningarna bor i **en**
modul, `source/ts/domain/derive.ts`. <!-- 03-§3.1 -->

| Vy | Härleds ur |
| --- | --- |
| Djuren på en plats | platsens `species` → djur med den arten och `status: here` |
| Var ett djurslag finns | platser vars `species` innehåller arten |
| Avkomma och syskon | djurens `mother` och `father`, sökta baklänges |
| Djur per ras | djurens `breed` |

Att härledningarna ligger samlade är avsiktligt: skulle placeringen någon gång behöva hämtas
vid sidladdning i stället för vid bygget är det en modul som byts, inte varje
sida. <!-- 03-§3.2 -->

Sorteringen sker vid bygget och är deterministisk, så att två byggen av samma data ger
identiska filer. <!-- 03-§3.3 -->

---

## 4. Sidor

| Sida | Adress | Innehåll |
| --- | --- | --- |
| Start | `/` | Djurslagen på gården som ingång till artsidorna, och kartan |
| Plats | `/plats/<id>/` | QR-kodens måladress. Vilka djurslag som går här, och därifrån vidare till djuren |
| Djur | `/djur/<id>/` | Namn, art, ras, stamtavla, bilder. Aldrig var individen står |
| Art | `/arter/<id>/` | Om djurslaget, vilka platser det finns på, och individerna |
| Karta | `/karta/` | Gårdens platser, med en textlista under kartan |
| Om | `/om/` | Vad sajten är, installation, integritet, källkod, version (`02-§10.27`) |
| 404 | `404.html` | Sajtens egen felsida; GitHub Pages serverar den för okända adresser |
| Offline | `/offline/` | Visas av service workern vid navigering utanför cachen |

Platssidan är navet. QR-koden på hagen är permanent och pekar på `/plats/<id>/`; den behöver
aldrig bytas när djuren flyttar, eftersom det är platsfilen som ändras. <!-- 03-§4.1 -->

En plats utan djurslag visar det rakt ut och pekar vidare, i stället för en tom
sida. <!-- 03-§4.2 -->

---

## 5. Offline och service worker

Service workern förcachar sidskal, CSS, buntad JS, ikoner samt plats- och djursidorna.
Strategin är cache först för dessa, och nätverk först med cache som reserv för
fotografier. <!-- 03-§5.1 -->

Cachenamnet är versionssträngen (`02-§10.26`) och sätts av bygget, aldrig för hand. Vid
aktivering raderas cacher med annat namn. En ny worker som väntar på att ta över
signalerar till sidan, som visar statusraden "Ny version finns"; knappen skickar
`skipWaiting` och laddar om (`02-§10.28`). <!-- 03-§5.2 -->

Service workerns scope och manifestets `start_url` byggs från bas-sökvägen i
[ADR 0005](../adr/0005-konfigurerbar-bassokvag.md). <!-- 03-§5.3 -->

Offline-sidan ingår i förcachen och svaras vid en navigering utanför den (`02-§7.7`).
QA-bygget under `/qa/` har en egen service worker med scope `<bas>qa/` och ett eget
manifest-`id`, så att QA och produktion aldrig delar cache (`02-§7.9`). <!-- 03-§5.4 -->

---

## 6. Bilder

Källbilderna är redan webbanpassade ([ADR 0008](../adr/0008-bilder-i-repot.md)). Bygget
genererar bara mindre storlekar för `srcset`. <!-- 03-§6.1 -->

Sökvägen till en bild byggs av en upplösare utifrån filnamnet i YAML. Datat känner aldrig
till var filerna ligger. <!-- 03-§6.2 -->

Varje bild får `width`, `height` och `loading="lazy"` — utom den första bilden på sidan, som
laddas ivrigt med `fetchpriority="high"` så att den inte fördröjer hur snabb sidan
känns. <!-- 03-§6.3 -->

Mekanismen bor i `source/ts/build/images.ts` — storlekar, `renderPicture` och
`renderPlaceholder` — och i `images-plugin.ts`, som registrerar Nunjucks-shortcoden
`picture` i Eleventy. Bildkatalogen härleds ur datasetet (`04-§9.4`).

En art kan ha en bild (`04-§6.3`) i `source/images/species/`. Den används i
djurslagsrutorna på start- och platssidan och på artsidan. Saknas den visas artens namn
på en ljusgrön platta (`05-§6.20`). <!-- 03-§6.4 -->

---

## 7. Redigering

I fas 1 redigeras datat med vanliga commits av en enda administratör
([ADR 0013](../adr/0013-faser-admin-nu-skriv-api-sedan.md)). Det finns ingen server, ingen
inloggning och inget skriv-API. <!-- 03-§7.1 -->

Filuppdelningen — en fil per djur och per plats — är ändå vald för fas 2, då ett skriv-API
ska kunna skriva en post utan att röra någon annan. <!-- 03-§7.2 -->

---

## 8. Bygget och CI

- `npm run build` bygger till `public/`. <!-- 03-§8.1 -->
- `npm test` kör enhetstester för domänskiktet och datavalideringen. <!-- 03-§8.2 -->
- `npm run lint` lintar HTML, CSS, TypeScript och Markdown. <!-- 03-§8.3 -->
- CI kör bygge, lint, validering och tester på varje pull request och fäller vid fel. <!-- 03-§8.4 -->
- Merge till `main` bygger och deployar till GitHub Pages. <!-- 03-§8.5 -->

Två tester bevakar regler som annars urholkas tyst: att inget absolut sökvägsuttryck kringgår
bas-sökvägens hjälpfunktion, och att inget djur har fått ett `location`-fält. <!-- 03-§8.6 -->

- Node 22.18 eller senare krävs. Eleventys konfiguration importerar domänskiktets
  TypeScript direkt, och Node tar bort typannoteringarna utan kompilering. Domänen
  undviker därför `enum`, `namespace` och parameteregenskaper, som kräver
  kompilering. <!-- 03-§8.7 -->
- Två deploy-arbetsflöden delar ett återanvändbart: "Deploy till QA" (`deploy-qa.yml`)
  triggas av att arbetsflödet "Quality" avslutats på `main` och kör bara när det blev
  grönt på den commiten; "Deploy till produktion" (`deploy-prod.yml`) av "Run workflow"
  med ett godkännandejobb i miljön `production`. Det återanvändbara flödet `deploy.yml`
  tar `version`, `qa_version` och `production_from_latest_tag`, bygger båda miljöerna
  och laddar upp en Pages-artefakt (`02-§9.11`). Inget flöde checkar ut en ref som
  kommer ur indata eller ur en händelse: utcheckningen är alltid flödets egen commit på
  `main`, QA-deployen kör bara när den gröna commiten är `main`:s huvud, och
  släpptaggen slås upp i `main`:s historik. De två deploy-jobben delar `concurrency`-gruppen
  `pages`, så bara en deploy kör åt gången och en pågående avbryts
  aldrig. <!-- 03-§8.8 -->
- Produktion och QA byggs i samma deploy: två byggen med olika `DATA_DIR`, `BASE_PATH`
  och `BUILD_VERSION`, där QA-bygget läggs under `public/qa/` innan artefakten laddas
  upp. I QA-deployen checkas produktionens kod ut från senaste produktionstaggen —
  den högsta `vX.Y.P` oavsett serie, så att kod som inte släppts aldrig når roten — i
  en egen katalog, och `source/data/` och `source/content/` kopieras dit från `main`
  innan bygget; finns ingen tagg byggs produktionen från `main`. I produktionsdeployen
  byggs båda från `main`. <!-- 03-§8.9 -->

---

## 9. Kartan

Kartan är en SVG som bygget genererar ur platsernas `lat`/`lon` (`02-§5.23`).
Projektionen är linjär: den omslutande rektangeln kring alla aktiva platser med
koordinater, med marginal, mappas på SVG:ns `viewBox`. Vid gårdens storlek är jordens
krökning försumbar. Varje markör är ett `<a>`-element med platsens id, namn och
länk. <!-- 03-§9.1 -->

En ritad bakgrund — byggnader, vägar, hagarnas former — kan läggas under markörerna
(issue #19). Ritningen anger då vilka koordinater dess hörn motsvarar, så att bygget kan
placera markörerna rätt i den. Platsernas geometri bor ändå i YAML, aldrig i
ritningen. <!-- 03-§9.2 -->

---

## 10. Sidhuvud, sidfot och version

Sidhuvud och sidfot är två Eleventy-inkluderingar, `source/layouts/header.njk` och
`source/layouts/footer.njk`, som grundlayouten tar in på varje sida. Ingen sida skriver
egen markup för dem. Ikonerna är inline-SVG i inkluderingarna. <!-- 03-§10.1 -->

Beteendet — meny, installknapp, "till toppen", feedbackdialog, statusrader, dela — är
små moduler under `source/ts/ui/`, buntade till en fil. Varje modul letar upp sitt
element och gör ingenting om det saknas, så en sida utan feedbackknapp kostar inget.
Sidorna är läsbara och länkarna följbara utan JavaScript; bara menyknappen, dialogen
och knapparna kräver det. <!-- 03-§10.2 -->

Feedback bygger en adress till `github.com/<repo>/issues/new` med `template`, `title`
och `body` som frågeparametrar och öppnar den i ny flik. Ingen kod på sajten talar med
GitHub; det gör besökarens webbläsare, i besökarens namn. <!-- 03-§10.3 -->

Versionen räknas i deploy-arbetsflödena, aldrig i bygget. `deploy-prod.yml` läser `X.Y`
ur `VERSION`, tar senaste taggen `vX.Y.*` och räknar upp patchnumret; efter lyckad
deploy sätter ett jobb med `contents: write` den annoterade taggen och, för den första
taggen i serien, en GitHub Release med `--generate-notes` (`02-§10.24`).
`deploy-qa.yml` tar versionen ur senaste taggen `vX.Y.*` för `X.Y` i `VERSION`, eller
`X.Y.0` när serien saknar tagg, och lägger till " – QA PR<n>", där numret hämtas via
GitHubs API för commiten eftersom en rebase-merge inte bär det i ämnesraden, med kort
SHA som reserv (`02-§10.33`). Produktionsdeployen skickar sin version som både
`version` och `qa_version`, så QA visar släppet utan suffix (`02-§10.34`). Strängen skickas som
`BUILD_VERSION` till bygget, som skriver in den i sidfoten, om-sidan, manifestets
`version`-fält och service workerns cachenamn. <!-- 03-§10.4 -->

Utan `BUILD_VERSION` bygger bygget en lokal version ur senaste taggen och klockslaget i
Europe/Stockholm, utom när `GITHUB_ACTIONS` är satt: då sätts ingen version alls,
eftersom en felaktig version är sämre än ingen (`02-§10.25`). Logiken bor i
`source/ts/domain/version.ts` och testas i Node. <!-- 03-§10.5 -->
