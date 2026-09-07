# 0019 — Platsens sort styr markörens symbol

**Status:** Antagen, 2026-09-07. Ersätter [ADR 0018](0018-platsen-har-en-sort.md).

## Sammanhang

[ADR 0018](0018-platsen-har-en-sort.md) gav platsen ett obligatoriskt `kind` med två
värden: `djurplats` för hagen och djurhuset, `besoksmal` för allt annat besökaren går
till. Två värden räckte för det beslutet bar: platssidan talar om djur eller låter bli.

Beslutet sköt medvetet upp frågan om fler värden och skrev ut villkoret för att ta upp
den igen: *varje värde måste bäras av kod som gör något med det, annars är det bara en
etikett som någon ska hålla aktuell. Symbolerna på kartan blir troligen det första
sådana beroendet.*

Issue #51 är det beroendet. Gården har bett om en symbol per markör, som på skyltarna:
toalett, café, parkering. Kartan visar trettio platser, åtta av dem i en klunga kring
gårdsplanen, och i överblick är de i dag likadana gröna prickar. Med `besoksmal` som
enda alternativ till `djurplats` skulle caféet, toaletten, parkeringen, lekplatsen,
grillplatsen och vandrarhemmet dela symbol — vilket är samma sak som ingen symbol alls.

## Beslut

`kind` har åtta värden. Varje värde bär en egen symbol på kartan, och inget värde finns
utan symbol:

| Värde | Platsen är | Exempel |
| --- | --- | --- |
| `djurplats` | hage eller djurhus | 1:an, Hönshuset, Stallet |
| `mat` | serverar mat eller dryck | Caféet, Lottas våffelstuga |
| `grill` | grillplats att sitta vid | Grillplatsen vid gårdsplanen |
| `toalett` | toalett | Toaletterna |
| `parkering` | parkering för bil | Parkeringen vid infarten |
| `lek` | lek och aktivitet | Lekplatsen, Käpphästbanan |
| `boende` | övernattning inomhus | Vandrarhemmet |
| `husbil` | ställplats för husbilar | Ställplatsen |

`besoksmal` utgår. Det var samlingsnamnet för de sex sista raderna, och när var och en
har ett eget värde är samlingen inget en platsfil behöver kunna säga.

Det som gällde `besoksmal` i övrigt gäller nu varje värde som inte är `djurplats`:
`species` ska vara tom, och sidan nämner inte djur (`02-§5.35`). Regeln uttrycks som
*bara en `djurplats` får ha djurslag* i stället för att räkna upp de sex andra.

Fältet är fortfarande obligatoriskt, har fortfarande inget standardvärde, och härleds
fortfarande aldrig ur `species` — en hage vars djur tillfälligt flyttats är fortfarande
en hage. Den delen av ADR 0018 står kvar oförändrad.

### Symbolerna ritas inte fritt

Finns ett svenskt vägmärke för det platsen är, och stämmer märkets figur med gårdens
plats, **är symbolen den figuren** — inte vår tolkning av den. Figuren lyfts ur
märkesfilen och färgas om. Det gäller `mat` (H5 servering), `boende` (H8 vandrarhem) och
`husbil` (H28 husbilsplats). Besökaren har mött dem vid infarten och på skylten, och en
egen tolkning av samma sak vore sämre av precis det skälet — vilket också gick att se:
våra egna försök att rita en alkovhusbil blev en skåpbil.

Fem symboler har ingen figur att hämta:

- `parkering` följer E19, men märkets P är urskuret ur den blå plattan och finns inte som
  figur i filen. Bokstaven ritas.
- `toalett` har ett vägmärke — H14 — men följer det inte. H14 ritar ett utedass med hjärta
  på dörren, och gårdens toaletter är inget utedass. Där är symbolen de två figurerna från
  skylten på dörren, som säger toalett utan att påstå något om byggnaden. Standarden är
  förlagan, inte ett facit som går före det som faktiskt finns på gården.
- `djurplats`, `grill` och `lek` har inget vägmärke alls. Djurplatsen är gårdens egen, och
  grillen och gungorna följer motivet på vanlig svensk friluftsskyltning.

Uppsättningen blandar därmed fyllda skyltfigurer med streckade ritningar. Det är priset
för att bara tre av åtta sorter har en figur att hämta, och det är värt att betala: en
riktig husbil slår en ritad, och att göra om de fem övriga till fyllda silhuetter hade
bara bytt ut våra streck mot våra fyllningar — fortfarande våra — och samtidigt brutit mot
sidhuvudets ikoner (`05-§6.33`).

Den blå plattan följer aldrig med — bara figuren, i `currentColor`. Figurerna behöver
också luft: i 16 px blev koppen och huset mörka klumpar, så symbolen är 20 px
(`05-§6.39`). Husbilen klarade 16 px, för hos den *är* silhuetten informationen.
`docs/09-kallor/index.md` bär filerna, hämtdatum och kontrollsummor — både för
märkesfilen och för den lyfta banan, så att ett test kan slå fast att figuren är
oförändrad.

## Övervägda alternativ

**Behålla två värden och lägga symbolen i ett eget fält,** exempelvis
`symbol: toalett`. Avvisat: två fält skulle beskriva samma sak och kunna säga emot
varandra — en `djurplats` med `symbol: toalett` är obegriplig men fullt möjlig att
skriva. Dessutom vore det ett utseendeval i datat, vilket `CLAUDE.md` §0 håller isär:
YAML bär fakta om gården, CSS och bygget bär utseendet. Sorten *är* faktumet; symbolen
är bygget som följer av det.

**Nio värden**, med `hage` skild från `djurhus` och `stallplats` skild från `boende`.
Avvisat: skillnaden mellan en hage och ett djurhus syns inte i en symbol som ska gå att
läsa i 22 px, och ingen annan del av bygget skiljer dem åt. Villkoret från ADR 0018
gäller även åt det här hållet — ett värde utan beroende är bara en etikett.

**Härleda symbolen ur namnet.** "Parkeringen vid infarten" börjar med "Parkering". Ett
namn är inget kontrakt: det byter gården när den vill, och "Trekanten" avslöjar
ingenting.

**Rita alla åtta själva, i sajtens streck.** Ett sammanhållet formspråk, och det var
vägen fram tills husbilen prövades: en alkovhusbil i streck blev en skåpbil. Avvisat för
de tre som har en figur — men behållet för de fem som inte har det.

**Göra hela uppsättningen till fyllda silhuetter,** så att de tre hämtade och de fem
ritade ser lika ut. Avvisat: de fem hade fortfarande varit våra, bara fyllda, och en helt
fylld uppsättning skaver mot sidhuvudets streckade ikoner (`05-§6.33`).

**Följa SS-ISO 7001,** den standard som faktiskt täcker alla sorterna, lekplatsen
inräknad. Avvisat: standarden säljs av SIS och symbolerna är upphovsrättsskyddade. Repot
är publikt (`CL-§2.17`), och att lägga in dem utan licens vore inte vårt att göra.

## Konsekvenser

Trettio platsfiler i `source/data/locations/` och trettiotvå i `source/data-qa/` byter
värde på en rad — de tolv som inte är hagar eller djurhus.

Valideringen räknar upp åtta värden i stället för två. En fil med `kind: besoksmal`
fäller därmed valideringen med en svensk mening som säger vilka värden som finns, vilket
är rätt: värdet finns inte längre, och en tyst översättning till någon av de åtta vore en
gissning om vad platsen är.

Bygget får en symbol per värde som inline-SVG (`03-§9.5`). En framtida åttonde sort
kostar därmed en symbol att rita — vilket är avsikten: kravet att värdet ska bäras av
kod är kvar, det är bara uppfyllt nu.

Kartan blir läsbar i överblick utan att etiketterna behöver rymmas. Trängseln kring
gårdsplanen (`02-§5.33`) försvinner inte av det här beslutet — den frågan hör till
zoomen i #51 och till #50 — men en dold etikett kostar mindre när prickens form redan
säger vad platsen är.
