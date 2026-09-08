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
| Start | `/` | Navet: ett kort per ärende sajten bär (ADR 0023) |
| Karta | `/karta/` | Kartan med gårdens platser, textlistan under den, och fler kartor i området |
| Djurinfo | `/djuren/` | Sökning på öronmärke, och djurslagen som ingång till artsidorna |
| Plats | `/plats/<id>/` | QR-kodens måladress. Vilka djurslag som går här, och därifrån vidare till djuren |
| Djur | `/djur/<id>/` | Namn, art, ras, stamtavla, bilder. Aldrig var individen står |
| Art | `/arter/<id>/` | Om djurslaget, vilka platser det finns på, och individerna |
| Djurbingo | `/bingo/` | Startskärm och bricka; rutorna slumpas i webbläsaren ur kandidaterna bygget listar (`02-§12`) |
| Spana! | `/spana/` | Startskärm och stopplista; ledtrådarna slumpas i webbläsaren ur katalogen bygget listar (`02-§13`) |
| Om | `/om/` | Vad sajten är, installation, integritet, källkod, version (`02-§10.27`) |
| 404 | `404.html` | Sajtens egen felsida; GitHub Pages serverar den för okända adresser |
| Offline | `/offline/` | Visas av service workern vid navigering utanför cachen |

Platssidan är navet för den som står på gården. QR-koden på hagen är permanent och pekar på
`/plats/<id>/`; den behöver aldrig bytas när djuren flyttar, eftersom det är platsfilen som
ändras. <!-- 03-§4.1 -->

Startsidan är navet för den som kommer utan QR-kod. Den har ingen egen data: korten är en
lista i `homeView` i `source/ts/build/pages.ts` — id, rubrik, rad, adress och symbol — och
ett nytt ärende blir en post i den listan, en rad i menyns `navLinks` och en mall. Kartsidan
och djurinfosidan bär vyer som redan fanns (`views.map`, `views.animals`); ingen ny
härledning tillkom när startsidan delades. <!-- 03-§4.7 -->

Kortens symboler ritas i `HOME_CARD_SYMBOLS` i `source/ts/build/symbols.ts`, bredvid
markörernas, så att de två uppsättningarna delar streck och viewBox och inte kan glida isär.
Djurkortet återanvänder markörens `djurplats`-figur: samma djur på kartan som på
navet. <!-- 03-§4.8 -->

En plats utan djurslag visar det rakt ut och pekar vidare, i stället för en tom
sida. <!-- 03-§4.2 -->

Bygget läser datasetet i `eleventy.config.js` genom `loadValidDataset` innan något
skrivs — händelsehanterarna körs i ordning, så valideringen går före bildgenereringen —
och räknar en färdig vymodell per sida i `source/ts/build/pages.ts`: namn, listor,
länkar, rubriker och meningar. Mallarna i `source/pages/` paginerar över `views` och
skriver bara ut vad modellen säger; all ordval och allt urval testas därför i Node.
Adresserna i modellen är sajtrelativa och får bas-sökvägen av `url`-filtret i mallen;
kartan, som renderas färdig i byggmodulen, får den som argument. <!-- 03-§4.3 -->

Djurslagens bestämda form i rubriker och frågor — "Getterna på gården", "Var finns
fåren?" — härleds ur `plural` i `source/ts/domain/swedish.ts`: plural på -ar, -er och
-or får -na, på -en får -a, och övriga får -en. Regeln täcker gårdens djurslag utan ett
andra fält i vokabulären som kunde glida isär från det första. <!-- 03-§4.4 -->

Djurkortet och djurslagsrutan är Nunjucks-makron i `source/layouts/animal-card.njk` och
`species-tile.njk`, så att djurinfo-, plats- och artsidan delar markup. Markdown i
`description` och i `source/content/arter/` renderas av filtret `markdown`, en
markdown-it utan HTML-genomsläpp; valideringen har redan avvisat HTML i
datat. <!-- 03-§4.5 -->

QR-koderna för skyltarna skrivs av `scripts/qr.mjs` (`02-§5.29`) med paketet `qrcode`,
som räknar modulmatrisen; själva skylten — koden, platsens namn och adressen som
`<title>` — ritas av `source/ts/build/qr.ts`. Paketet är granskat enligt
`07-SAKERHET.md` §6: ett väletablerat bibliotek med lång släpphistorik och få egna
beroenden, låst till exakt version, som bara körs lokalt av den som skriver ut skyltar
och aldrig når bygget eller besökaren. <!-- 03-§4.6 -->

---

## 5. Offline och service worker

Service workern förcachar sidskal, CSS, buntad JS, ikoner samt plats- och djursidorna.
Strategin är cache först för dessa, och nätverk först med cache som reserv för
fotografier. <!-- 03-§5.1 -->

Cachenamnet är bas-sökvägen följd av versionssträngen (`02-§10.26`) och sätts av bygget,
aldrig för hand: mallen `source/pages/sw.njk` skriver konstanterna `BASE`, `CACHE_NAME`
och `PRECACHE` och därefter `source/ts/sw.ts`, buntad till en sträng av esbuild i
`source/ts/build/pwa.ts`. Vid aktivering raderas cacher med annat namn under samma
bas-sökväg; produktionens worker rör därför aldrig QA:s cache under `/qa/` och tvärtom.
Sidan registrerar workern via `source/ts/ui/sw-register.ts`; en ny worker som väntar på
att ta över visar statusraden "Ny version finns", och knappen skickar `skipWaiting` och
laddar om när kontrollen bytts (`02-§10.28`). Valet av strategi per begäran är en ren
funktion i `source/ts/domain/offline.ts`, testad i Node. <!-- 03-§5.2 -->

Service workerns scope och manifestets `start_url` byggs från bas-sökvägen i
[ADR 0005](../adr/0005-konfigurerbar-bassokvag.md). <!-- 03-§5.3 -->

Offline-sidan ingår i förcachen och svaras vid en navigering utanför den (`02-§7.7`).
QA-bygget under `/qa/` har en egen service worker med scope `<bas>qa/` och ett eget
manifest-`id`, så att QA och produktion aldrig delar cache (`02-§7.9`). <!-- 03-§5.4 -->

---

## 6. Bilder

Källbilderna är redan webbanpassade ([ADR 0008](../adr/0008-bilder-i-repot.md)). Bygget
genererar bara mindre storlekar för `srcset`. <!-- 03-§6.1 -->

Sökvägen till en bild byggs av en upplösare utifrån bild-id:t i YAML. Datat känner aldrig
till var filerna ligger. <!-- 03-§6.2 -->

Varje bild får `width`, `height` och `loading="lazy"` — utom den första bilden på sidan, som
laddas ivrigt med `fetchpriority="high"` så att den inte fördröjer hur snabb sidan
känns. <!-- 03-§6.3 -->

Mekanismen bor i `source/ts/build/images.ts` — storlekar, `renderPicture` och
`renderPlaceholder` — och i `images-plugin.ts`, som registrerar Nunjucks-shortcoden
`picture` i Eleventy. Bildkatalogen härleds ur datasetet (`04-§9.4`).

En art kan ha en bild (`04-§6.3`). Den används i djurslagsrutorna på start- och
platssidan och på artsidan. Saknas den visas artens namn på en ljusgrön platta
(`05-§6.20`). <!-- 03-§6.4 -->

Bilden är en egen post ([ADR 0015](../adr/0015-bilden-som-egen-post.md)). Valideringen
löser upp varje bild-id till `{ id, alt, credit }` när datasetet normaliseras, så
vymodellerna i `pages.ts` och mallarna arbetar med ett färdigt bildobjekt och behöver
aldrig slå upp något själva. Härledningen går åt ett håll, som alla andra i
`04-§8`. <!-- 03-§6.5 -->

Importen av många bilder (`02-§8.14`–`8.20`) är samma kedja med en tabell framför:
`scripts/lib/image-import.ts` läser CSV:n, kontrollerar varje rad och planerar arbetet;
`scripts/image-import.mjs` utför planen med samma `optimiseImage` och `imageIdFor` som
`npm run image`. Uppdelningen finns för att allt utom filskrivningen ska gå att
enhetstesta i Node, på samma sätt som dokumentkontrollen i `scripts/lib/check-docs.ts`.
Planeringen är skild från utförandet också av ett andra skäl: importen är
allt-eller-inget (`02-§8.16`), och det kräver att varje rad är godkänd innan den första
filen skrivs. <!-- 03-§6.7 -->

QA-bilderna har en separat, envägs kedja enligt ADR 0017. `npm run qa:prompts` läser
bildposterna och deras bakåtreferenser och skriver promptunderlaget. Genereringen sker
utanför bygget. `npm run qa:images -- --import <katalog>` kontrollerar samtliga
källfiler, lägger märkningen i en SVG-overlay och använder `optimiseImage` med QA:s
gränser innan något skrivs. Utan `--import` fyller samma kommando bara saknade filer
med platshållare. Båda lägena vägrar en produktionskatalog. <!-- 03-§6.8 -->

Bilder i Markdown renderas av samma kedja: `renderMarkdown` tar en upplösare som
översätter `![](img-…)` till samma markup som shortcoden ger, med alt-texten ur
bildposten. Utan upplösare — i ett enhetstest, eller för en text utan bilder — blir
resultatet oförändrat. <!-- 03-§6.6 -->

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

Kartan är en SVG som bygget genererar ur platsernas `lat`/`lon` (`02-§5.23`), i
`source/ts/build/map.ts`. Projektionen är linjär: den omslutande rektangeln kring alla
aktiva platser med koordinater, med marginal, mappas på SVG:ns `viewBox`, vars proportion
följer markens inom gränser. Vid gårdens storlek är jordens krökning försumbar. Varje
markör är ett `<a>`-element med platsens id, namn och länk, lagt som HTML ovanpå
SVG:n och placerat i procent av ritningen — så behåller markören sin storlek och
läsbara etikett i varje skärmbredd medan ritningen skalar med sidan. <!-- 03-§9.1 -->

En ritad bakgrund — byggnader, vägar, hagarnas former — kan läggas under markörerna
(issue #19): `source/map/background.svg` med `source/map/background.yaml`, som anger
vilka latituder och longituder ritningens över-, under-, vänster- och högerkant motsvarar.
Bygget bäddar in ritningens innehåll i sidan, utan externa resurser, och projicerar
markörerna in i ritningens `viewBox`; en plats utanför ritningen utelämnas med en
varning i loggen. Ritningen får inte innehålla skript, stilmallar, bilder eller länkar
utåt — bygget vägrar då. Konventionen i detalj står i `source/map/README.md`.
Platsernas geometri bor ändå i YAML, aldrig i ritningen. <!-- 03-§9.2 -->

Etiketterna placeras vid bygget så att de inte döljer varandra (`02-§5.33`). Bygget kan
inte mäta text — det finns ingen webbläsare vid bygget — så det uppskattar etikettens ruta
ur namnets längd och måtten i `tokens.css`: teckenstorlek, innerkant och den ritade
prickens storlek. Konstanterna för teckenbredd och radhöjd är uppmätta i Chromium och satta
strax över det värsta uppmätta fallet: att gissa för brett flyttar en etikett i onödan, att
gissa för smalt lägger två ovanpå varandra, och bara det senare syns för besökaren.
Uppskattningen är just en uppskattning: den skiljer bra fall från dåliga, den garanterar
inga pixlar.

Rutorna räknas i pixlar, och **en gång per bredd kartan faktiskt visas i** (`02-§5.61`):
552 px för surfplattan, 912 för desktopen och 1248 för den inzoomade kartan. En placering
räknad för den smalaste skärmen skulle annars styra alla bredare. Under 600 px räknas ingen
placering alls, eftersom inget namn visas där förrän kartan är inzoomad så långt att den
inzoomade placeringen tagit över (`02-§5.55`).

Inom varje omgång tas platserna norrifrån och söderut. Först läggs de namn platsen själv
bett om en sida för (`02-§5.60`); resten får det första lediga av fyra raka lägen — under,
över, höger, vänster (`02-§5.53`). Ett läge som skulle skjuta etiketten utanför ritningen
eller in bakom en zoomknapp räknas som upptaget, så en plats vid kanten vänder etiketten
inåt. Det en etikett i övrigt måste hålla sig undan är den ritade pricken, inte tryckytan
runt den (`02-§5.58`). Finns inget helt ledigt läge tas det som överlappar minst, hellre än
att namnet döljs (`02-§5.54`); först när inget av de fyra ryms innanför kanten döljs
etiketten visuellt, och namnet finns då kvar för skärmläsaren och i listan under kartan.
Sidan skrivs som en modifierare på markören — `--wide-`, `--desktop-` och `--zoom-` — och
CSS lägger etiketten där. <!-- 03-§9.3 -->

Markören bär en symbol per sorts plats (`02-§5.38`). `source/ts/build/symbols.ts` håller
en symbol per `kind`-värde (`04-§5.7`) som en sträng med SVG-banor, och bygget skriver in
den i markören och i listposten under kartan. Tre av symbolerna är inte våra alls: de är
vägmärkets egen figur, lyft ur märkesfilen och färgad om — `docs/09-kallor/index.md` säger
vilken fil, med kontrollsumma både för filen och för den lyfta banan. De fem övriga har
ingen figur att hämta och är ritade här i sidhuvudets streck. Den blå skyltplattan följer
aldrig med. Symbolerna är ritade i sidan av samma skäl
som resten av kartan: sajten hämtar ingenting utifrån och ska fungera offline
(`02-§5.26`). De ligger i kod och inte som filer under `source/assets/`, eftersom en
`<img>` vore ett anrop per markör och en sprite-fil vore ett tredje ställe att hålla
i takt med `kind`. Typen är knuten till `LocationKind`, så ett nytt värde utan symbol är
ett typfel vid `npm run typecheck` och inte en tom markör i drift. <!-- 03-§9.5 -->

Zoomen bor i två delar (ADR 0020). `source/ts/domain/map-view.ts` är räknandet: vyn som
`{ x, y, scale }`, zoom kring en ankarpunkt, panorering och gränser, utan ett enda
webbläsar-API — därför enhetstestbart i Node (`CL-§2.14`). `source/ts/ui/map-zoom.ts` är
kopplingen: pekar- och tangentbordshändelser in, vyn ut, satt som `transform` på omslaget
`.map__canvas`. Markörerna motskalas med `scale(1 / z)` genom variabeln `--map-scale`, så
de behåller sin storlek och sin träffyta medan ritningen växer (`02-§5.43`). Vid 1× har
omslaget `touch-action: pan-y` och tar bara nyp; inzoomad byter det till `none` och tar
också drag, så kartsidan går att rulla förbi (`02-§5.42`). Knapparna är dolda tills
modulen kör, som installknappen (`03-§10.2`). Vid tillräcklig förstoring sätts också
`map--names`, som byter till den inzoomade placeringen och visar varje namn (`02-§5.44`,
`02-§5.57`); under 600 px är det där namnen alls kommer fram (`02-§5.55`). Tröskeln är
mätt i Chromium mot klungan vid gårdsplanen och bor i `map-view.ts`, så bygget och
klientkoden läser samma tal. <!-- 03-§9.6 -->

Rutan på markören (`02-§5.46`) är **en** ruta, inte trettio. Bygget skriver den tom, som
feedbackdialogen skrivs tom (`03-§10.2`), och lägger det den ska visa på varje markör som
`data-`-attribut: `data-kind`, `data-note`, `data-species` och `data-access`. `map-popup.ts`
fyller rutan med `textContent` och flyttar den till markörens `left`/`top` — samma procent
av ritningen, så rutan hör ihop med sin plats. Ingen `innerHTML` någonstans (`CL-§2.13`).

Rutan är en `<dialog>` som öppnas med `showModal()`, samma komponent som
feedbackdialogen: mitt på skärmen, med fokus fångat, Escape och bakgrund gratis från
webbläsaren. Ett kort förankrat vid markören prövades först och övergavs — kartan klipper
det som lämnar den, eftersom zoomen behöver en kant, och på en telefon är kartan omkring
270 px hög, för lite för ett kort som ska rymma namn, djurslag och en väg vidare. Markören
förblir en `<a>` till platssidan; modulen fångar klicket med `preventDefault`, vilket är
det som gör att sidan fungerar likadant som förut när JavaScript uteblir
(`02-§5.49`). <!-- 03-§9.7 -->

Kartsidan länkar vidare till gårdens egna kartor och till Naturkartan (`02-§5.34`). Det
är vanliga länkar i markupen, inte inbäddat innehåll: sajten hämtar fortfarande ingenting
utifrån (`02-§5.26`). <!-- 03-§9.4 -->

---

## 10. Sidhuvud, sidfot och version

Sidhuvud och sidfot är två Eleventy-inkluderingar, `source/layouts/header.njk` och
`source/layouts/footer.njk`, som grundlayouten tar in på varje sida. Ingen sida skriver
egen markup för dem. Ikonerna är inline-SVG i inkluderingarna. <!-- 03-§10.1 -->

Beteendet — meny, "Tillbaka", installknapp, "till toppen", feedbackdialog, statusrader,
dela — är små moduler under `source/ts/ui/`, buntade till en fil. Varje modul letar upp
sitt element och gör ingenting om det saknas, så en sida utan feedbackknapp kostar inget.
Sidorna är läsbara och länkarna följbara utan JavaScript; bara menyknappen, dialogen
och knapparna kräver det. <!-- 03-§10.2 -->

Menyns rader kommer ur `navLinks` i `source/layouts/header.njk`, som sidhuvudets rad och
menykortet båda läser: en post per ärende, och för "Djuren" dessutom en lista med
underrader byggd ur `views.animals.species`. Fällan är `<details>`/`<summary>`
(`02-§10.44`), så utfällningen har ingen klientkod alls — `source/ts/ui/menu.ts` rör bara
kortet, som förut. Att en rad har underrader syns i markupen, inte i en klass: mallen
väljer `<details>` när posten bär `children` och `<a>` när den inte gör
det. <!-- 03-§10.7 -->

"Tillbaka" (`02-§10.40`) är en länk till startsidan i markupen, och `source/ts/ui/back.ts`
byter den mot `history.back()` först när `document.referrer` pekar på en sida under samma
ursprung och samma bas-sökväg. Villkoret är funktionen `returnsToSitePage`, fri från
webbläsar-API:er och därför enhetstestad i Node (`CL-§2.14`). Utan JavaScript, och för
den som kommit utifrån, är knappen kvar som den länk den är. <!-- 03-§10.6 -->

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

---

## 11. Bildverktyget

Verktygssidan (`02-§11`) är en vanlig Eleventy-sida med en egen klientbunt. Den bor på
`/verktyg/bild-3ed93205946a/`, och adressen är skriven på ett enda ställe:
`IMAGE_TOOL_PATH` i `source/ts/build/tool-page.ts`. Därifrån hämtar sidans `permalink`,
esbuilds utfil och byggtesterna sin sökväg, så adressen kan inte ligga i otakt med sig
själv. <!-- 03-§11.1 -->

Sidan sätter `eleventyExcludeFromCollections: true`, och det är det som håller den ur
service workerns förcache: `source/pages/sw.njk` bygger `PRECACHE` ur `collections.all`
(`02-§7.4`, `02-§11.5`). Klientbunten skrivs till verktygets egen katalog och inte till
`assets/`, så den fastnar varken i förcachens tillgångslista eller i `assets/main.js`
som varje besökare hämtar (`02-§11.6`). Sidan bär `noindex` genom `noindex: true` i sin
front matter, vilket `source/layouts/base.njk` läser (`02-§11.2`). <!-- 03-§11.2 -->

Arbetet är delat i tre lager, efter samma linje som resten av kodbasen: det som går att
köra utan webbläsare ligger i domänskiktet och testas i Node (`CL-§2.14`), och bara
canvas-anropen ligger i `source/ts/ui/`.

| Modul | Ansvar |
| --- | --- |
| `source/ts/domain/image-limits.ts` | `MAX_IMAGE_EDGE`, `MAX_IMAGE_BYTES` och kvalitetstrappan — den enda sanningen (`02-§11.24`) |
| `source/ts/domain/zip.ts` | Zip-arkivet: CRC-32, lokala huvuden, central katalog, allt lagrat utan komprimering (`02-§11.18`, `02-§11.20`) |
| `source/ts/domain/image-post.ts` | Bildpostens YAML och kontrollen av `alt` och `credit` (`02-§11.14`, `02-§11.15`, `02-§11.21`) |
| `source/ts/domain/clue-post.ts` | Ledtrådspostens YAML och kontrollen av plats och text (`02-§11.25`–`11.29`, `04-§11`) |
| `source/ts/domain/yaml-scalar.ts` | Citeringen båda posterna skriver med, så samma värde stavas likadant |
| `source/ts/domain/image-prepare.ts` | Skalningsbeslutet och kvalitetstrappan som ren logik, med kodaren som argument (`02-§11.8`, `02-§11.10`) |
| `source/ts/ui/image-tool/` | Filväljaren, canvas, formuläret och nedladdningarna |

`prepareEncoded` i `image-prepare.ts` tar en kodarfunktion och prövar kvalitetsstegen
tills resultatet håller storleksgränsen. Den vet ingenting om `canvas`, och testas därför
med en påhittad kodare i Node — samma mönster som `optimiseImage` följer på andra sidan
([ADR 0021](../adr/0021-bildberedning-i-webblasaren.md)). <!-- 03-§11.3 -->

Bild-id:t räknas ut med `crypto.subtle` i stället för `node:crypto`, så `imageIdFor` är
samma funktion i bygget, i kommandona och i webbläsaren (`02-§11.11`). Den är asynkron
av det skälet: WebCrypto har inget synkront gränssnitt. <!-- 03-§11.4 -->

Platsväljaren för ledtrådar (`02-§11.26`) är byggd på samma sätt som spelens kandidater:
`imageToolView` i `source/ts/build/pages.ts` listar gårdens aktiva platser, mallen skriver
dem i sidan som en `<template>` med en färdig `<select>`, och verktyget klonar den in i
varje kort som kryssas i. Ingen förfrågan går iväg när redaktören står i en hage, och
listan kan inte gå i otakt med datat: den byggdes ur det. <!-- 03-§11.6 -->

Sidan skriver ingenting och talar inte med GitHub. Den bygger en adress till repots
uppladdningsvy och låter redaktörens webbläsare öppna den, precis som feedbacklänken gör
(`03-§10.3`). Behörigheten kontrolleras av GitHub, inte av oss
([ADR 0014](../adr/0014-roller-via-github.md)). <!-- 03-§11.5 -->

---

## 12. Spel

Ett spel följer [ADR 0009](../adr/0009-datadrivna-spel.md): reglerna i domänskiktet, DOM
i vyskiktet, datat ur samma dataset som sidorna. Djurbingo (`02-§12`) är byggt så:

Bygget räknar fram vad brickan kan fråga efter — `bingoView` i `source/ts/build/pages.ts`
listar varje art med bild och varje djur som är kvar och har porträtt — och mallen
`source/pages/bingo.njk` skriver dem i sidan som ett `<template>` per kandidat, med samma
`picture`-markup som djurkorten. Malldelarna är inerta tills skriptet klonar en in i en
ruta, så hundra djur kostar sidan ingenting att visa, och bildkedjan (`03-§6`) är den
enda som skriver bildmarkup. <!-- 03-§12.1 -->

Reglerna bor i `source/ts/domain/bingo.ts`: dragningen, som tar varje kandidat en gång
innan någon upprepas, brickan, avbockningen, raderna — de vågräta, de enda som ger
konfetti (`02-§12.10`) — och vinsten, och den form som sparas och läses tillbaka. Slumpen är en injicerad funktion, så testerna i
`tests/domain/bingo.test.ts` ger den ett fast frö. `source/ts/ui/bingo.ts` läser
kandidaterna ur sidan, bygger rutorna med `createElement`, öppnar dialogen och skriver
brickan till `localStorage` efter varje ändring; `confetti.ts` och `fanfare.ts` bredvid
den är firandet, utan beroenden och utan filer ([ADR 0024](../adr/0024-djurbingo-pa-arlighet.md)).
Fanfaren lägger ut sina toner som ren data — `fanfareNotes` ger frekvens, starttid och
längd — och bara den korta funktion som spelar upp dem rör Web Audio, så att längden
(`02-§12.11`) går att pröva i Node. <!-- 03-§12.2 -->

Dragningen är gemensam. `source/ts/domain/draw.ts` äger `shuffle` och `drawCandidates`:
en blandad genomgång av alla kandidater, och en till om fler behövs, så att varje kandidat
tas en gång innan någon upprepas (`02-§12.5`). Båda spelen bygger på den, och slumpen är
en injicerad funktion hela vägen, så `tests/domain/draw.test.ts` prövar fördelningen på
ett ställe i stället för en gång per spel. <!-- 03-§12.3 -->

Spana! (`02-§13`) följer samma tre lager. Bygget listar katalogens ledtrådar — `spanaView`
i `source/ts/build/pages.ts` läser `dataset.clues`, slår upp platsens namn och lämnar
ordningen som datasetet har den — och räknar samtidigt ut vilka rundlängder som är värda
att erbjuda, så att startskärmen aldrig lovar fler stopp än katalogen räcker till
(`spanaRounds`, `02-§13.8`) — och `source/pages/spana.njk` skriver dem som ett
`<template>` per ledtråd, med ledtrådens text och platsens namn på `data`-attribut bredvid
bilden. Reglerna ligger i `source/ts/domain/spana.ts`: rundan, avbockningen, den sparade
formen och hur många stopp en runda får när katalogen är mindre än rundan
(`02-§13.8`). `source/ts/ui/spana.ts` bygger listan, öppnar dialogen och avslöjar platsen
när "Hittat!" trycks. Ledtrådarna är egna poster i datat
([ADR 0025](../adr/0025-spelets-ledtradar-ar-egna-poster.md)); spelet har fortfarande ingen
egen kopia av gårdens platser, bara en referens till dem. <!-- 03-§12.4 -->
