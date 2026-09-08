# 0025 — Spelets ledtrådar är egna poster, inte fält på platsen

**Status:** Antagen, 2026-09-08

Bygger vidare på [ADR 0009](0009-datadrivna-spel.md), som sa att ett spel som behöver
något datat inte kan uttrycka får lägga till *frivilliga fält* i datakontraktet.

## Sammanhang

Spana! (`02-§13`) visar en närbild på en detalj — en gunga, en käpphäst, en gärsgård —
och frågar var på gården den sitter. Spelet behöver tre uppgifter som inget befintligt
fält bär: vilken bild som är ledtråden, vilken plats som är svaret, och en frivillig
mening som hjälper den som kör fast.

ADR 0009:s bokstav pekar på fält i en befintlig post, och den posten skulle vara platsen:
`clueImage`, `clueText` bredvid `species` och `accessible` i `locations/<id>.yaml`.

Tre saker talar emot det.

En plats kan bära **flera** ledtrådar — gårdsplanen har både en gunga och en grill — och
en plats kan bära **ingen**. Fält på platsen skulle alltså bli listor av par, alltså en
egen posttyp ändå, inuti en fil som handlar om något annat.

Ledtråden lever i en annan takt än platsen. Hagen ligger kvar i tjugo år; ledtrådsfotot
byts när gungan målas om. Att blanda dem gör att varje bildbyte rör en fil som besökarens
platssida byggs ur.

Och `04-§5` beskriver platsen som ett faktum om gården. En ledtråd är ett faktum om ett
spel. Ett spel som läggs ned skulle lämna kvar fält i platsfilerna som ingen längre vet
vad de gör.

## Beslut

Ledtrådarna är **egna poster** i en egen katalog, `source/data/clues/<bild-id>.yaml`
(`04-§11`), med `location` och en frivillig `text`. Platsfilerna rörs inte.

**Postens filnamn är bild-id:t** för den bild ledtråden visar. Ledtråden får därmed ingen
egen identifierare, och det finns ingen `image`-rad inuti filen: bilden och ledtråden kan
inte hamna i otakt, eftersom de heter samma sak. Bildverktyget (`02-§11`) levererar de två
filerna tillsammans av samma skäl.

ADR 0009 gäller i sak: spelet får ingen egen kopia av gårdens djur, arter eller platser.
Ledtråden refererar platsen; den beskriver den inte. Det är ADR 0009:s *form* — "frivilliga
fält" — som vidgas till "frivilliga fält eller en egen posttyp, när spelets data inte är
ett faktum om en befintlig post".

## Övervägda alternativ

- **Fält på platsen** — avvisad: en plats kan ha flera ledtrådar eller ingen, så fälten
  blir en lista av par i en fil som handlar om något annat, och ett nedlagt spel lämnar
  kvar dem.
- **Ledtrådar i bildposten** — avvisad: `alt` och `credit` är fakta om bilden oavsett var
  den visas (ADR 0015). Att lägga speldata där gör bildposten till en gemensam soptunna,
  och samma bild kan visas på en djursida utan att vara en ledtråd.
- **Eget id på ledtråden plus en `image`-rad** — avvisad: samma faktum på två ställen, och
  precis det par som kan hamna fel när verktyget levererar filerna.
- **En enda `clues.yaml`** — avvisad: ledtrådarna läggs till en i taget av en redaktör
  genom en pull request, och en delad fil kolliderar vid varje tillägg — samma skäl som
  gav bilderna egna filer (`04-§2.5`).

## Konsekvenser

- Nästa spel som behöver egen data följer mönstret: en katalog, en post per sak,
  referenser till gårdens data i stället för kopior av den.
- Att byta ut en ledtrådsbild ger ett nytt bild-id (ADR 0015) och därmed en ny
  ledtrådsfil. Den gamla tas bort i samma ändring, precis som den gamla bildposten.
- En bild kan vara ledtråd högst en gång, eftersom filnamnet är bild-id:t. Ska samma motiv
  vara två ledtrådar är det två foton.
- Valideringen får ett kontrollområde till: ledtrådens filnamn ska vara ett bild-id som
  har en bildpost, och `location` ska peka på en plats som finns (`04-§10.17`).
