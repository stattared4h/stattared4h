# Krav — Spel

Del av [kravindexet](./index.md). Den här filen äger `02-§12`.

Beslut: [ADR 0009](../adr/0009-datadrivna-spel.md),
[ADR 0010](../adr/0010-ingen-sparning-av-besokare.md),
[ADR 0024](../adr/0024-djurbingo-pa-arlighet.md).

---

## 12. Spel

### Bakgrund

Uppdraget nämner spel som hjälper besökaren att upptäcka gården. ADR 0009 satte
riktningen — spelen läser gårdens data och har ingen egen — och ADR 0023 gjorde
startsidan till ett nav med plats för ett kort per spel. Djurbingo är det första spelet.

Två saker avgjordes när kraven skrevs. Spelet kontrollerar ingenting: barnet bockar av
det barnet hittat, och det räcker. QR-koder, platsdata eller andra bevis skulle göra
spelet till en kontroll av barnet, och gården har bett om ett spel. Och brickan ska rymmas
på en telefonskärm utan att rullas: den som står i hagen med ena handen på staketet ska
se hela brickan på en gång.

En tredje sak avgjordes när spelet väl gick att spela: bara den vågräta raden ger konfetti
på vägen. Räknades kolumner och diagonaler med avslutade nästan varje bock mot slutet av
brickan någon linje, ofta två på samma tryck, och konfettin slutade betyda något långt
innan bingot. Raden ensam räcker, och den är den linje ett barn ser utan att leta.

### Sidan

- Djurbingo har sidan `/bingo/`, ett kort på startsidans nav (`02-§5.63`) med rubriken
  "Djurbingo" och en rad i menyn (`02-§10.5`) mellan Djuren och Om sajten. Kortets symbol
  är en ritad bricka i samma streck som de andra korten (`05-§6.45`). <!-- 02-§12.2 -->
- Sidan ingår i service workerns förcache som varje annan sida (`02-§7.4`), och spelet
  fungerar offline när sidan väl har öppnats. <!-- 02-§12.3 -->
- Finns inget djurslag med bild säger sidan att djuren inte är inlagda ännu och pekar på
  huvudsidan, i stället för en tom bricka. <!-- 02-§12.12 -->
- Utan JavaScript säger sidan att spelet behöver det. <!-- 02-§12.13 -->

### Brickan

- Innan spelet börjar väljer spelaren på en startskärm hur stor brickan är — 3 × 3 eller
  4 × 4 — och vad rutorna visar. Valen görs bara där: under spelet finns inga inställningar
  som tar plats från brickan. <!-- 02-§12.1 -->
- Rutorna kommer ur gårdens data (ADR 0009). På nivån **djurslag** visar en ruta artens
  bild (`04-§6`) och artens namn, och vilket djur som helst av arten räknas. På nivån
  **just det djuret** visar en ruta ett enskilt djurs porträtt (`02-§8.11`) och namn, och
  bara det djuret räknas. En art utan bild och ett djur utan porträtt eller med
  `status: gone` blir aldrig en ruta; räknade bestånd (`04-§4.7`) deltar bara som
  djurslag. Nivån *just det djuret* erbjuds bara när minst ett djur kan bli en
  ruta. <!-- 02-§12.4 -->
- Brickan slumpas i webbläsaren varje gång ett spel börjar. Slumpen tar varje kandidat en
  gång innan någon upprepas, så att en bricka bara får dubbletter när datat har färre
  kandidater än rutor. <!-- 02-§12.5 -->
- Hela brickan syns utan att rullas i porträttläge på en telefon med 360 px bredd, med
  sidhuvud och lägesrad ovanför. Brickan är kvadratisk och varje ruta minst
  44 px. <!-- 02-§12.6 -->
- Ett tryck på en ruta öppnar en dialog (`05-§6.35`) med rutans bild i större format,
  namnet, en mening som säger vad som ska hittas och en knapp. För en ruta som inte är
  avbockad heter knappen "Hittat!"; för en avbockad heter den "Inte hittat
  ändå". <!-- 02-§12.7 -->
- Att bocka av och att ta bort en bock är samma handling. Spelet kontrollerar inte att
  djuret verkligen hittats, och ber inte om bekräftelse åt något håll. <!-- 02-§12.8 -->
- Brickan, med sina bockar, sparas i `localStorage` i besökarens egen webbläsare
  (ADR 0010) och visas igen när sidan öppnas nästa gång. En sparad bricka som nämner
  något sidan inte längre erbjuder förkastas, och startskärmen visas. Knapparna "Ny
  bricka" och "Spela igen" rensar det sparade och visar startskärmen. Inget annat
  sparas. <!-- 02-§12.9 -->

### Vinsten

- Under brickan står hur många rutor som är avbockade av hur många. När ett tryck gör en
  vågrät rad komplett faller lite konfetti. Kolumner och diagonaler är inga linjer i
  spelet och firas inte. <!-- 02-§12.10 -->
- När alla rutor är avbockade är det bingo: mycket konfetti, en fem sekunder lång fanfar
  och en ruta under brickan som säger det och erbjuder "Spela igen". Fanfaren är en kort
  slinga som spelas om tills de fem sekunderna är fyllda, och slutackordet klingar ut på
  sekunden. Konfettin ritas av sajtens egen kod på en canvas i sajtens färger; fanfaren
  syntetiseras i webbläsaren. Ingen ljudfil och inget bibliotek når besökaren (`02-§9.5`).
  Med `prefers-reduced-motion: reduce` visas rutan utan konfetti. <!-- 02-§12.11 -->
