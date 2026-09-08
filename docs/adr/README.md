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
| 0001 | [Statiskt byggd sajt utan klientramverk](0001-statisk-sajt-utan-ramverk.md) |
| 0002 | [Gårdens data är YAML-filer i repot](0002-yaml-som-databas.md) |
| 0003 | [Eleventy som statisk generator](0003-eleventy-som-generator.md) |
| 0004 | [Installerbar PWA med offline-först](0004-pwa-offline-forst.md) |
| 0005 | [Bas-sökvägen är konfigurerbar; GitHub Pages nu, webbhotell sedan](0005-konfigurerbar-bassokvag.md) |
| 0006 | [Svenska i dokumentation och gränssnitt, engelska i kod](0006-sprak-i-kod-och-dokumentation.md) |
| 0007 | [Designen ärver 4H:s visuella identitet](0007-designen-arver-4h-identitet.md) |
| 0008 | [Bara webbanpassade bilder, i repot, utan LFS](0008-bilder-i-repot.md) |
| 0009 | [Spel läser gårdens data; de har ingen egen](0009-datadrivna-spel.md) |
| 0010 | [Inga personuppgifter om besökare, och inga konton i fas 1](0010-ingen-sparning-av-besokare.md) |
| 0011 | [Säkerhetsläget för ett publikt repo](0011-sakerhetslage-for-publikt-repo.md) |
| 0012 | [Platsen bär djurslagen; enskilda djur spåras inte](0012-ingen-individuell-platssparning.md) |
| 0013 | [Två faser: en administratör nu, skriv-API sedan](0013-faser-admin-nu-skriv-api-sedan.md) |
| 0014 | [Rollerna upprätthålls av GitHub, inte av vår kod](0014-roller-via-github.md) |
| 0015 | [Bilden är en egen post med ett id ur innehållet](0015-bilden-som-egen-post.md) |
| 0016 | [Förbundets grafiska profil är källan för logotypen](0016-grafiska-profilen-ar-kallan.md) — ersätter färghärledningen i 0007 |
| 0017 | [AI-genererade QA-bilder i repot](0017-ai-genererade-qa-bilder-i-repot.md) |
| 0018 | [Platsen har en sort](0018-platsen-har-en-sort.md) |
| 0019 | [Platsens sort styr markörens symbol](0019-platsens-sort-styr-symbolen.md) |
| 0020 | [Kartan zoomas i klienten](0020-kartan-zoomas-i-klienten.md) |
| 0021 | [Bilden bereds i webbläsaren, med valideringen som enda grind](0021-bildberedning-i-webblasaren.md) |
| 0022 | [Verktygssidor ligger utanför navigationen, inte bakom ett lås](0022-verktygssidor-utanfor-navigationen.md) |
| 0023 | [Startsidan är ett nav, inte sajtens innehåll](0023-startsidan-ar-ett-nav.md) |
