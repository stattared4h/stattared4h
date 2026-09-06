# 0001 — Statiskt byggd sajt utan klientramverk

**Status:** Antagen, 2026-09-06

## Sammanhang

Stättareds 4H-gård är en ideell förening. Sajten är ett komplement till gårdens huvudsida
på `4h.se/stattared`: den presenterar djuren och hjälper besökaren att hitta rätt bland
hagarna, medan öppettider och bokningar blir kvar på huvudsidan. Besökarna kommer från mobilen, ofta stående
ute på gården där täckningen är ojämn. Den som förvaltar sajten över tid är inte
utvecklare, och bemanningen i en förening växlar mellan säsonger.

Det ger tre krav: billig drift, tålighet mot att stå orörd i månader utan
säkerhetsuppdateringar, och snabb laddning på en halvdan uppkoppling.

## Beslut

Varje sida byggs till statisk HTML, CSS och JavaScript och serveras som filer. Ingen
applikationsserver renderar sidor vid anrop, och inget klientrenderande ramverk används.

Interaktiviteten — kartan, filtrering, senare spel — skrivs som liten avgränsad
TypeScript som förstärker färdig HTML. DOM byggs med `createElement` och `textContent`;
`innerHTML` används inte, vilket samtidigt är skyddet mot XSS.

Det här beslutet handlar om **rendering**, inte om att sajten aldrig får ha en server.
[ADR 0013](0013-faser-admin-nu-skriv-api-sedan.md) inför i fas 2 ett litet skriv-API som
tar emot redaktörernas ändringar. Det API:et renderar inga sidor — det skriver data till
repot, och bygget gör resten.

## Övervägda alternativ

- **WordPress, som dagens 4h.se/stattared** — avvisad: kräver PHP-värd, löpande
  uppdateringar av kärna och plugins, och en inloggning någon måste förvalta. En förening
  som glömmer uppdatera under en säsong får en angripbar sajt.
- **React eller Vue som SPA** — avvisad: kilobyte och ett beroendeträd som ruttnar, för
  vad som i grunden är innehållssidor. Sämre förstaladdning på mobil, vilket är precis fel
  avvägning här.
- **Serverrendering vid anrop** — avvisad: kräver en server som är uppe, vilket är
  det driftansvar vi inte vill ta på oss.

## Konsekvenser

- Drift blir nära gratis och kräver ingen övervakning.
- Angreppsytan mot besökaren är i praktiken bara innehållet.
- Priset är att en ändring kräver ett bygge. Det tar någon minut, vilket är gott och väl
  tillräckligt eftersom det som ändras oftast — vilka djurslag som går i en hage — ändras
  säsongsvis och inte i realtid.
- En funktion som kräver att servern vet något om den enskilda besökaren kan inte byggas
  utan att det här beslutet först rivs upp.
