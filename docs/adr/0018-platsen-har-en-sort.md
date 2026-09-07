# 0018 — Platsen har en sort

**Status:** Ersatt av [ADR 0019](0019-platsens-sort-styr-symbolen.md), 2026-09-07

## Sammanhang

Datakontraktet känner en enda sorts plats: hagen. Fältet `species` bär djurslagen som går
där, och platssidan är byggd kring dem. En aktiv plats utan djurslag säger "Just nu går
inga djur här" (`02-§5.12`), vilket är rätt för en tom hage.

Gården har mer än hagar. Den har ett café, ett vandrarhem, Lottas våffelstuga, ett stall,
toaletter, en ställplats, en lekplats, en käpphästbana, en hitta vilse-stig och en väg
till badplatsen. Besökaren letar efter dem på kartan, och QR-koden på en dörr ska kunna
peka på en sida precis som QR-koden på en hage gör.

Förs de in som platser i dag blir följden att våffelstugans sida meddelar att inga djur
går där. Meningen är inte fel — det går faktiskt inga djur i våffelstugan — men den
besvarar en fråga ingen ställde, och den avslöjar att sajten tror att allt är en hage.

Samma sak gäller kartan. Alla markörer ser likadana ut. Ska en toalett få en toalettsymbol
och ett café en cafésymbol behöver bygget veta vad platsen är.

## Beslut

Platsen får ett obligatoriskt fält `kind` med två värden:

- `djurplats` — hage eller djurhus. Djurslag hör hit, och sidan talar om djur.
- `besoksmal` — allt annat besökaren går till. `species` ska vara tom, och sidan nämner
  inte djur alls.

Två värden, inte tio. Skillnaden mellan en toalett och en lekplats syns i namnet och
senare i markörens symbol; den behöver ingen egen sort i datat förrän något i bygget
faktiskt beror på den. Fler värden kan läggas till när ett sådant beroende uppstår.

Fältet är obligatoriskt och har inget standardvärde. En plats utan `kind` fäller
valideringen, av samma skäl som `accessible` gör det (`04-§5.3`): det är ingen uppgift att
gissa, och en tyst gissning är svår att upptäcka i efterhand.

## Övervägda alternativ

**Härleda sorten ur `species`.** En plats med tomma djurslag skulle vara ett besöksmål.
Avvisat: en hage där djuren tillfälligt flyttats har också tom lista, och skulle då byta
sort av sig själv. Sorten är ett faktum om platsen, inte en följd av vem som står i den
just nu.

**En egen filtyp för besöksmål.** Avvisat: besöksmålet delar allt annat med hagen — namn,
bild, beskrivning, koordinat, tillgänglighet, QR-kod och adress. Två filtyper hade
dubblerat kontraktet för att skilja på en enda rad.

**Fler sorter direkt** — `hage`, `hus`, `mat`, `lek`, `service`. Avvisat tills vidare:
varje värde måste bäras av kod som gör något med det, annars är det bara en etikett som
någon ska hålla aktuell. Symbolerna på kartan blir troligen det första sådana beroendet,
och då tas frågan upp igen.

## Konsekvenser

Varje befintlig platsfil får en rad. De sexton som ligger i `source/data/locations/` är
hagar och djurhus, alltså `djurplats`.

Platssidan får två utseenden. Meningen "Just nu går inga djur här" gäller bara
`djurplats`; ett besöksmål utan djurslag visar ingen sådan mening och ingen tom rubrik.

Valideringen får en regel till: ett besöksmål med djurslag är ett fel, inte en varning.
Det fångar den troliga misstaget att kopiera en hagfil när man lägger till ett café.

Kartan kan senare ge markören en symbol per sort utan att datat rörs igen.
