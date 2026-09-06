# Arkitekturbeslut

Varje betydande och svårvänt beslut får en numrerad post här: sammanhanget det fattades
i, själva beslutet, alternativen som övervägdes och avvisades, och konsekvenserna vi
accepterade. Poängen är att en framtida medarbetare — människa eller AI — ska kunna se
*varför* saker ser ut som de gör, utan att avgjorda frågor tas upp igen från noll.

Regler:

- En arkitektoniskt betydande ändring landar **med en ny ADR i samma pull request**.
- ADRer är oföränderlig historik: för att riva upp ett beslut skriver du en ny ADR som
  ersätter det gamla och länkar de två — redigera aldrig det gamla beslutet.
- Håll varje post till en sida eller mindre.

Mall: `NNNN-kort-titel.md` med rubrikerna **Status** (Antagen/Ersatt + datum),
**Sammanhang**, **Beslut**, **Övervägda alternativ** och **Konsekvenser**.

## Register

| # | Beslut |
| --- | --- |
| 0001 | [Statisk sajt utan server och utan klientramverk](0001-statisk-sajt-utan-ramverk.md) |
| 0002 | [Innehållsdata är versionerad YAML, inte SQLite](0002-yaml-som-databas.md) |
| 0003 | [Eleventy som statisk generator](0003-eleventy-som-generator.md) |
| 0004 | [PWA med offline-först och förcachad gårdsdata](0004-pwa-offline-forst.md) |
| 0005 | [Bas-sökvägen är konfigurerbar; GitHub Pages nu, webbhotell sedan](0005-konfigurerbar-bassokvag.md) |
| 0006 | [Svenska i dokumentation och gränssnitt, engelska i kod](0006-sprak-i-kod-och-dokumentation.md) |
| 0007 | [Designen ärver 4H:s visuella identitet](0007-designen-arver-4h-identitet.md) |
| 0008 | [Fotografier commit:as som binärer; härledda format genereras](0008-bilder-i-repot.md) |
| 0009 | [Spelen är datadrivna och delar gårdens datakälla](0009-datadrivna-spel.md) |
| 0010 | [Ingen spårning och inga personuppgifter; spelframsteg bor i webbläsaren](0010-ingen-sparning-av-besokare.md) |
