# 0026 — Bilden bär sina motiv; postens bilder härleds

**Status:** Antagen, 2026-09-19

Bygger vidare på [ADR 0015](0015-bilden-som-egen-post.md), som gjorde bilden till en egen
post, och på [ADR 0013](0013-faser-admin-nu-skriv-api-sedan.md), som säger att fas 1
redigerar data genom pull requests.

## Sammanhang

Bilden är en egen post sedan ADR 0015, men kopplingen mellan bild och djur bodde kvar i
djuret: `photos` i `animals/<id>.yaml` räknade upp bildernas id. Riktningen fungerade så
länge samma person gjorde båda sakerna — laddade upp fotot och visste vad det föreställde.

Det gör de inte. Den som går runt med kameran är sällan den som kan gårdens hundra
individer vid namn, och de är sällan på plats samtidigt. Arbetet måste kunna delas upp:
en person lämnar bilderna, en annan svarar på vad de visar, i sin egen takt.

Med `photos` i djurets fil blir varje sådant svar en **redigering av en befintlig fil**.
Tre saker följer av det:

- Två svar om samma djur krockar i samma fil, och två svar om olika djur kan inte samlas
  i en pull request utan att röra två filer.
- Ett verktyg som ska hjälpa den som svarar måste kunna skriva om en fil det läste när
  sidan byggdes. Är sidan en dag gammal skriver den över det som hänt sedan dess.
- GitHubs egen väg för den som saknar skrivrätt — förifylld ny fil, fork och pull request
  med ett klick — finns bara för filer som inte redan finns.

Ett svar som i stället är ett **tillägg i bildens egen fil** har inget av det emot sig.
Och sakligt hör uppgiften hemma där: att bilden visar Bosse är ett faktum om bilden, lika
mycket som dess alt-text är det.

Kostnaden för att vända riktningen är som lägst just nu: `source/data/` innehåller inga
djur och inga bilder. QA-datasetets hundra djur vänds med ett skript. Om ett halvår är
samma ändring hundra filer som någon har skrivit för hand.

## Beslut

**Bildposten bär sina motiv.** `source/data/images/<bild-id>.yaml` får tre frivilliga
listor — `animals`, `locations` och `species` — med id:n ur gårdens data (`04-§9.13`).

**Posternas bilder härleds.** Djuret, platsen och arten räknar inte upp sina bilder;
bygget samlar dem ur bildposterna. Fälten `photos` och `photo` finns inte, och eftersom
kontraktet inte känner igen dem fäller valideringen om de skrivs (`02-§8.31`).

**Huvudbilden pekas ut, inte ordnad fram.** Djuret, platsen och arten får ett frivilligt
`portrait` med ett enda bild-id, som ska bära postens eget id. Resten står i bild-id:ts
ordning, vilket är godtyckligt men stabilt — och därmed deterministiskt som `02-§6.9`
kräver.

Härledningen sker i valideringen, som redan slår upp varje bild-id och redan bygger det
validerade datasetet. Sidor, mallar och spel ser samma `photos` som förut och rörs inte.

## Övervägda alternativ

- **Behålla `photos` och låta verktyget skriva ut ett förslag att klistra in** — avvisad:
  då är verktyget en kopieringsmaskin och administratören blir flaskhalsen, vilket är
  precis det arbetsdelningen skulle lösa.
- **Både `photos` på posten och motiv på bilden** — avvisad: samma faktum på två ställen
  (`CL-§4.3`). En validering som håller dem i takt är en lapp på ett problem som inte
  behöver finnas.
- **Motiven i en egen post bredvid bildposten**, som ledtrådarna i ADR 0025 — avvisad:
  ledtråden är ett faktum om ett *spel* och kan läggas ned, medan motivet är ett faktum
  om bilden som gäller överallt där den visas. Två filer per bild som alltid följs åt är
  en fil för mycket.
- **Behålla ordningen i en redaktionell lista på posten** — avvisad: listan skulle vara
  kvar av `photos` under ett annat namn, med samma krockar. Ett `portrait` räcker för det
  enda ordningsbeslut som syns för besökaren.

## Konsekvenser

- Att svara på vad en bild visar är ett tillägg i en fil, och två personer kan svara på
  var sin bild utan att veta om varandra.
- Kategoriseringsverktyget (`/verktyg/tagga-78f21e48c35b/`) kan leverera ett svar som en
  ny eller ändrad bildpost, utan att röra djurens filer.
- En bild utan motiv är en bild som väntar på någon som känner igen den. Valideringens
  varning för en bildpost ingen använder blir därmed kön att beta av (`02-§8.13`).
- Att ta bort ett djur ur registret kräver att djurets id tas ur de bildposter som bär
  det, annars fäller referenskontrollen. Det är samma arbete som förut, i andra filer.
- Bildernas inbördes ordning på en sida går inte längre att välja fritt. Porträttet väljs;
  resten sorteras på id. För ett djur med två eller tre foton är det ingen förlust.
- `npm run image:import` skriver kolumnen `post` rakt in i bildposten och kontrollerar att
  id:t finns (`02-§8.17`). Ett stavfel i tabellen fälls vid importen i stället för att
  följa med in i ett klistrat block.
