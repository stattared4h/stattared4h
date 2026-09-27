# 0026 — Fotots position står i bildposten, aldrig i bildfilen

**Status:** Antagen, 2026-09-27. Ersätter meningen i
[ADR 0021](0021-bildberedning-i-webblasaren.md) om att GPS-positionen stannar i telefonen.

## Sammanhang

Bildverktyget ritar om varje foto i `canvas`, och all metadata försvinner på vägen —
också GPS-positionen i ett mobilfoto. Det var ett medvetet val i ADR 0021. Men positionen
har ett värde: den säger var på gården bilden togs, och därmed vilken plats bilden
troligen hör till. Den kan senare bära bilder på kartan.

Det finns två sätt att låta den följa med: lämna EXIF kvar i bildfilen, eller läsa ut den
och skriva den som data.

## Beslut

Positionen läses ur originalets EXIF innan bilden ritas om, och skrivs som `lat` och
`lon` i bildposten (`04-§9.13`). Bildfilen förblir fri från metadata (`04-§10.7`).

- **Bara EXIF.** Saknar fotot position frågar verktyget inte efter någon, och använder
  inte telefonens läge. Bilder laddas oftast upp hemma, dagar senare, så telefonens läge
  vid uppladdningen är fel oftare än rätt.
- **Bara på gården.** En position längre än 500 m från varje plats med koordinater följer
  inte med, och valideringen avvisar den. Samma funktion avgör båda.
- **Positionen kopplar ingenting.** Vilken plats bilden visas på avgörs av platsens
  `photos`, som förut. Verktyget förvaljer den närmaste platsen och visar raden som ska in
  i platsfilen, men skriver aldrig filen själv.

## Övervägda alternativ

- **Lämna EXIF kvar i WebP-filen** — avvisad: osynligt i en pull request, går inte att
  validera, och drar med sig tidpunkt och telefonmodell. Bygget skulle dessutom behöva
  tolka EXIF för att använda positionen.
- **Telefonens position via Geolocation när positionen saknas** — avvisad: uppladdningen
  sker sällan där bilden togs.
- **Låta bildposten peka ut sin plats i stället för platsens `photos`** — avvisad: två
  sätt att koppla samma sak, och `photos` bär också ordningen på sidan (`02-§8.11`).

## Konsekvenser

- Mobilernas bildväljare tar ofta bort positionen själva, iOS alltid om inte användaren
  valt annat. Positionen är därför en bonus när den finns, aldrig något som kan krävas.
- En bildpost med position är fortfarande en giltig bildpost utan: `npm run image` skriver
  ingen position.
- Positionen står i ett publikt repo. Den visar var på gården fotografen stod, vilket
  gården redan visar på sin karta; gårdsgränsen håller allt annat ute.
