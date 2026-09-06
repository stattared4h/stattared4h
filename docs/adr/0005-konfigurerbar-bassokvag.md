# 0005 — Bas-sökvägen är konfigurerbar; GitHub Pages nu, webbhotell sedan

**Status:** Antagen, 2026-09-06

## Sammanhang

Sajten ska först ligga på GitHub Pages, och möjligen flyttas till ett webbhotell senare —
till exempel om den ska ligga under 4h.se eller om ett skriv-API någon gång behövs.

De två platserna skiljer sig på ett sätt som är lätt att missa och dyrt att upptäcka
sent: på GitHub Pages ligger projektsajten under en underkatalog, `/stattared4h/`, medan
ett webbhotell eller en egen domän lägger den i roten, `/`. Varje absolut länk som börjar
med `/` pekar fel på den ena av de två. Samma sak gäller service workerns scope och
manifestets `start_url`, där felet dessutom yttrar sig som att installationen eller
offline-läget tyst slutar fungera.

## Beslut

Bygget känner till en bas-sökväg, satt via en miljövariabel med `/` som standard. Varje
intern länk, varje resursreferens, service workerns registrering och scope samt
manifestets `start_url` och `scope` byggs genom en hjälpfunktion som sätter bas-sökvägen
framför. Ingen absolut sökväg skrivs för hand i mallar eller kod.

Deploy till GitHub Pages sätter bas-sökvägen till `/stattared4h/`. En flytt till
webbhotell eller egen domän innebär att bas-sökvägen blir `/` och att deploy-steget byts
ut — inget annat.

Ett test bevakar att bygget inte innehåller absoluta sökvägar som kringgår
hjälpfunktionen.

## Övervägda alternativ

- **Bara relativa sökvägar** — avvisad: fungerar för länkar mellan sidor men inte för
  service-worker-scope eller manifestfält, och blir bräckligt så fort sidor ligger på
  olika djup.
- **Hårdkoda `/stattared4h/` nu och söka och ersätta vid flytten** — avvisad: exakt den
  sortens uppskjutna arbete som blir en halvdags felsökning av en trasig service worker
  vid sämsta tänkbara tillfälle.
- **Egen domän direkt** — avvisad som förutsättning: domänen är inte beslutad, och
  beslutet ska inte blockera att sajten kommer upp.

## Konsekvenser

- Flytten mellan drifter blir ett konfigurationsbyte, inte en refaktorering.
- Sajten går att förhandsgranska från vilken underkatalog som helst, vilket också gör
  PR-förhandsvisningar möjliga.
- Priset är lite ceremoni: en hjälpfunktion runt varje sökväg i mallarna. Testet finns
  för att den ceremonin ska vara omöjlig att glömma.
