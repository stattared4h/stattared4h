# 0001 — Statisk sajt utan server och utan klientramverk

**Status:** Antagen, 2026-09-06

## Sammanhang

Stättareds 4H-gård är en ideell förening. Sajten ska presentera gården, djuren och
aktiviteterna, och köra några små spel som hjälper besökare att upptäcka omgivningarna.
Besökarna kommer i huvudsak från mobilen, ofta stående ute på gården där täckningen är
ojämn. Den som förvaltar sajten över tid är sannolikt inte utvecklare, och bemanningen i
en förening växlar mellan säsonger.

Det ger tre krav som styr allt annat: sajten måste vara billig att driva, tåla att stå
orörd i månader utan säkerhetsuppdateringar, och ladda snabbt på en halvdan mobil
uppkoppling.

## Beslut

Sajten byggs till statisk HTML, CSS och JavaScript och serveras som filer. Ingen
applikationsserver, ingen databasmotor i drift, inget klientrenderande ramverk.

Interaktiviteten — spel, filtrering, kartan — skrivs som liten, avgränsad TypeScript som
förstärker färdig HTML. DOM byggs med `createElement` och `textContent`; `innerHTML`
används inte, vilket samtidigt är sajtens skydd mot XSS.

## Övervägda alternativ

- **WordPress, som dagens 4h.se/stattared** — avvisad: kräver PHP-värd, löpande
  säkerhetsuppdateringar av kärna och plugins, och en inloggning någon måste förvalta.
  En förening som glömmer uppdatera under en säsong får en angripbar sajt.
- **React eller Vue som SPA** — avvisad: kilobyte och ett beroendeträd som ruttnar, för
  vad som i grunden är innehållssidor plus tre små spel. Dessutom sämre förstaladdning
  på mobil, vilket är precis fel avvägning här.
- **Ren handskriven HTML utan generator** — avvisad: duplicerad markup i varje sidhuvud
  och sidfot, och djurpresentationerna skulle behöva underhållas för hand. Se ADR 0003.

## Konsekvenser

- Drift blir nära gratis och kräver ingen övervakning.
- Angreppsytan är i praktiken bara innehållet: det finns ingen inloggning att forcera
  och ingen databas att injicera i.
- Priset är att allt som ändras kräver ett bygge. Redigering sker i repot, inte i ett
  administrationsgränssnitt — det gör förvaltarens vardag lite mer teknisk, och är skälet
  till att datat måste vara läsbar text (ADR 0002) och processen tydligt beskriven.
- Funktioner som i sig kräver en server — inloggning, bokning, uppladdning av bilder från
  webbläsaren — kan inte byggas utan att det här beslutet först rivs upp i en ny ADR.
