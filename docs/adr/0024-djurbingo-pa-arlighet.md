# 0024 — Djurbingo bygger på ärlighet; firandet är sajtens eget

**Status:** Antagen, 2026-09-08

## Sammanhang

Djurbingo är det första spelet enligt [ADR 0009](0009-datadrivna-spel.md): en bricka
med djur att hitta på gården. Tre frågor behövde svar innan det byggdes.

Ska spelet kontrollera att barnet verkligen hittat djuret? Gården har QR-koder på hagarna
och telefonen har GPS, så det går att kräva bevis. Var ska brickan bo mellan besöken? Och
hur firas en full bricka, när sajten inte får skicka något till en tredje part
(`02-§9.5`) och ska fungera offline?

## Beslut

**Spelet litar på spelaren.** En ruta bockas av med ett tryck, och bocken tas bort med
ett tryck till. Ingen QR-kod, ingen plats, ingen bekräftelsefråga. Att ångra är lika lätt
som att bocka: en felaktig bock är inget fusk, det är ett barn som tryckte fel.

**Vinsten är full bricka**, på både 3 × 3 och 4 × 4. En färdig rad får lite konfetti på
vägen. Rad-bingo som vinst avvisades: nio djur är inte fler än att alla kan hittas, och
"full bricka" är en regel som ett barn förstår utan förklaring.

**Brickan sparas i `localStorage`**, i besökarens egen webbläsare, som
[ADR 0010](0010-ingen-sparning-av-besokare.md) tillåter. Den överlever att telefonen
låser sig mitt i hagen och lämnar aldrig enheten. Inget namn, ingen poänglista.

**Konfettin är sajtens egen kod** — en canvas, en handfull rader fysik, färgerna ur
tokens.css — och **fanfaren syntetiseras** med Web Audio API. Ingen ljudfil i repot, ingen
licens att spåra, inget bibliotek som når besökaren.

## Övervägda alternativ

- **QR-koden på hagen låser upp rutan** — avvisad *tills vidare*: det gör spelet till en
  kontroll av barnet och kräver att skylten sitter uppe och går att skanna i solsken.
  Skulle gården vilja ha en skattjakt där platsen är poängen är det ett eget spel, och
  QR-koderna finns redan för det.
- **GPS** — avvisad: på en gård om några hundra meter är felmarginalen större än hagen, och
  [ADR 0010](0010-ingen-sparning-av-besokare.md) vill inte ha platsdata om barn ens i
  stunden.
- **Ett konfettibibliotek** — avvisad: `02-§9.5` säger att inga beroenden når besökaren, och
  effekten är billig att skriva själv.
- **En inspelad fanfar** — avvisad: en ljudfil är ett verk som ska registreras i
  källregistret och cachas offline; fyra toner ur en oscillator är varken eller.

## Konsekvenser

- Spelet går att fuska i. Det är avsikten: det är gårdens spel, inte gårdens prov.
- Brickan tar all skärmyta under sidhuvudet. Inställningarna får därför bara finnas på
  startskärmen, inte under spelet.
- Ett spel som senare vill *bevisa* något — en tävling, en poänglista — river upp både det
  här beslutet och ADR 0010, och kräver en ny ADR.
