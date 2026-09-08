# Krav — Spel

Del av [kravindexet](./index.md). Den här filen äger `02-§12` och `02-§13`.

Beslut: [ADR 0009](../adr/0009-datadrivna-spel.md),
[ADR 0010](../adr/0010-ingen-sparning-av-besokare.md),
[ADR 0024](../adr/0024-djurbingo-pa-arlighet.md),
[ADR 0025](../adr/0025-spelets-ledtradar-ar-egna-poster.md).

---

## 12. Djurbingo

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

---

## 13. Spana!

### Bakgrund

Djurbingo (`02-§12`) ber besökaren hitta djur. Spana! ber hen hitta gården: en närbild på
en detalj — en gunga, en käpphäst, en gärsgård — och frågan var på gården den sitter.
Spelen är syskon och delar allt utom vad rutan visar, så dragningen bor i en modul båda
läser (`03-§12.3`).

Ärlighetsprincipen i [ADR 0024](../adr/0024-djurbingo-pa-arlighet.md) gäller oförändrad.
Spelaren bockar av själv. Ingen QR-kod och ingen platskontroll avgör om detaljen
verkligen hittades — det vore att göra spelet till ett prov, och platsen som avslöjas när
spelaren tryckt "Hittat!" är ett svar, inte ett facit att bli underkänd mot.

Ledtrådarna är egna poster i stället för fält på platsen
([ADR 0025](../adr/0025-spelets-ledtradar-ar-egna-poster.md)). En plats kan bära flera
ledtrådar eller ingen alls, och en detalj är ett fotografi som byts ut oftare än hagen den
sitter i.

### Sidan

- Spana! har sidan `/spana/`, ett kort på startsidans nav (`02-§5.63`) med rubriken
  "Spana!" och raden "Hitta detaljen på bilden, någonstans på gården.", och en rad i menyn
  (`02-§10.5`) efter Djurbingo. Kortets symbol är ett ritat förstoringsglas i samma streck
  som de andra korten (`05-§6.45`). <!-- 02-§13.1 -->
- Sidan ingår i service workerns förcache som varje annan sida (`02-§7.4`), och spelet
  fungerar offline när sidan väl har öppnats. <!-- 02-§13.2 -->
- Finns ingen ledtråd i katalogen säger sidan att ledtrådarna inte är inlagda ännu och
  pekar på huvudsidan, i stället för en tom lista. <!-- 02-§13.3 -->
- Utan JavaScript säger sidan att spelet behöver det. <!-- 02-§13.4 -->

### Ledtrådarna

- Stoppen kommer ur ledtrådskatalogen (`04-§11`): en bild som visar en detalj på nära håll,
  en frivillig kort ledtrådstext och den plats som är svaret. Platsernas egna filer bär
  ingen speldata. <!-- 02-§13.5 -->
- Sidan listar varje ledtråd i katalogen i datasetets egen ordning, med bilden, texten när
  den finns och namnet på platsen den hör till, så att två bygg av samma data ger samma
  sida. <!-- 02-§13.6 -->

### Rundan

- Innan spelet börjar väljer spelaren på en startskärm hur lång rundan är — "Kort runda"
  om fyra stopp eller "Lång runda" om åtta — och nivå: "Lätt" visar ledtrådens bild och
  dess text när den finns, "Svårt" visar bara bilden. Valen görs bara där: under spelet
  finns inga inställningar. <!-- 02-§13.7 -->
- En runda har så många stopp som valet säger, men aldrig fler än katalogen har
  ledtrådar, och samma ledtråd förekommer aldrig två gånger i samma runda. Varje val bär
  antalet stopp det faktiskt ger — "Lång runda, 5 stopp" när katalogen har fem — och en
  längd som inte ger fler stopp än en kortare erbjuds inte alls. Stoppen slumpas i
  webbläsaren varje gång en runda börjar. <!-- 02-§13.8 -->
- Nivån avgör vad spelaren ser, inte vilka ledtrådar som dras: samma katalog och samma
  slump ger samma runda på båda nivåerna. <!-- 02-§13.9 -->
- Rundans stopp står som en lista av knappar, en per stopp, med ledtrådens bild och samma
  avbockade läge som bingots ruta (`05-§6.48`). <!-- 02-§13.10 -->
- Ett tryck på ett stopp öppnar en dialog (`05-§6.35`) med bilden i större format,
  ledtrådstexten när nivån är "Lätt" och ledtråden har en, och en knapp. För ett stopp som
  inte är avbockat heter knappen "Hittat!"; för ett avbockat heter den "Inte hittat
  ändå". <!-- 02-§13.11 -->
- Att bocka av och att ta bort en bock är samma handling. Spelet kontrollerar inte att
  detaljen verkligen hittats, och ber inte om bekräftelse åt något håll
  (ADR 0024). <!-- 02-§13.12 -->
- När "Hittat!" trycks stannar dialogen öppen och visar platsens namn: svaret på var
  detaljen sitter. Det är ett avslöjande, inte en fråga — spelaren har inte svarat på
  något och kan varken ha rätt eller fel. Namnet står kvar så länge stoppet är avbockat
  och försvinner när bocken tas bort. <!-- 02-§13.13 -->
- Rundan, med sina bockar, sparas i `localStorage` i besökarens egen webbläsare
  (ADR 0010) under en egen nyckel, skild från bingots, och visas igen när sidan öppnas
  nästa gång. En sparad runda som nämner en ledtråd katalogen inte längre har förkastas i
  sin helhet, och startskärmen visas. Knapparna "Ny runda" och "Spela igen" rensar det
  sparade och visar startskärmen. Inget annat sparas. <!-- 02-§13.14 -->
- Ovanför listan står hur många stopp som är avbockade av hur många. Varje avbockning ger
  lite konfetti. <!-- 02-§13.15 -->
- När alla stopp är avbockade är rundan klar: mycket konfetti, en fanfar och en ruta under
  listan som säger det och erbjuder "Spela igen". Den heter inte samma sak som knappen
  under listan: två knappar med samma namn på samma skärm säger inte vilken som är
  vilken. Konfettin och fanfaren är sajtens egna
  (`02-§12.11`), och med `prefers-reduced-motion: reduce` visas rutan utan
  konfetti. <!-- 02-§13.16 -->
