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

`kind` har sju värden. Varje värde bär en egen symbol på kartan, och inget värde finns
utan symbol:

| Värde | Platsen är | Exempel |
| --- | --- | --- |
| `djurplats` | hage eller djurhus | 1:an, Hönshuset, Stallet |
| `mat` | serverar mat eller dryck | Caféet, Lottas våffelstuga |
| `grill` | grillplats att sitta vid | Grillplatsen vid gårdsplanen |
| `toalett` | toalett | Toaletterna |
| `parkering` | parkering för bil | Parkeringen vid infarten |
| `lek` | lek och aktivitet | Lekplatsen, Käpphästbanan |
| `boende` | övernattning | Vandrarhemmet, Ställplatsen |

`besoksmal` utgår. Det var samlingsnamnet för de sex sista raderna, och när var och en
har ett eget värde är samlingen inget en platsfil behöver kunna säga.

Det som gällde `besoksmal` i övrigt gäller nu varje värde som inte är `djurplats`:
`species` ska vara tom, och sidan nämner inte djur (`02-§5.35`). Regeln uttrycks som
*bara en `djurplats` får ha djurslag* i stället för att räkna upp de sex andra.

Fältet är fortfarande obligatoriskt, har fortfarande inget standardvärde, och härleds
fortfarande aldrig ur `species` — en hage vars djur tillfälligt flyttats är fortfarande
en hage. Den delen av ADR 0018 står kvar oförändrad.

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

## Konsekvenser

Trettio platsfiler i `source/data/locations/` och trettiotvå i `source/data-qa/` byter
värde på en rad — de tolv som inte är hagar eller djurhus.

Valideringen räknar upp sju värden i stället för två. En fil med `kind: besoksmal`
fäller därmed valideringen med en svensk mening som säger vilka värden som finns, vilket
är rätt: värdet finns inte längre, och en tyst översättning till någon av de sju vore en
gissning om vad platsen är.

Bygget får en symbol per värde som inline-SVG (`03-§9.5`). En framtida åttonde sort
kostar därmed en symbol att rita — vilket är avsikten: kravet att värdet ska bäras av
kod är kvar, det är bara uppfyllt nu.

Kartan blir läsbar i överblick utan att etiketterna behöver rymmas. Trängseln kring
gårdsplanen (`02-§5.33`) försvinner inte av det här beslutet — den frågan hör till
zoomen i #51 och till #50 — men en dold etikett kostar mindre när prickens form redan
säger vad platsen är.
