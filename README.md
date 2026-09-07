# Stättareds 4H-gård

**Sajten:** <https://stattared4h.github.io/stattared4h/>

Djurguide för Stättareds 4H-gård: gårdens djur, arter och hagar. QR-koden på hagen visar
vilka djurslag som går där, och därifrån hittar besökaren vidare till varje djur.

**Det här är ett komplement till gårdens huvudsida på
[4h.se/stattared](https://www.4h.se/stattared/), inte en ersättning för den.** Öppettider,
boende, bokningar och nyheter finns kvar där. Här bor bara djuren och hagarna.

Sajten byggs som en installerbar webbapp (PWA) för iOS och Android: statisk, offline-tålig
och utan personuppgifter om besökaren. Hur långt det kommit står under *Läget* nedan.

## Var saker finns

| Vad | Var |
| --- | --- |
| Arbetsprocessen — läs denna först | [`CLAUDE.md`](CLAUDE.md) |
| Ändra innehåll utan utvecklarmiljö | [`docs/01-BIDRA.md`](docs/01-BIDRA.md) |
| Vad sajten ska göra | [`docs/02-krav/`](docs/02-krav/index.md) |
| Hur den är byggd | [`docs/03-arkitektur/`](docs/03-arkitektur/index.md) |
| Datastrukturen för djur och platser | [`docs/04-DATAKONTRAKT.md`](docs/04-DATAKONTRAKT.md) |
| Färger, typografi, komponenter | [`docs/05-design/`](docs/05-design/index.md) |
| Miljöer och drift | [`docs/06-MILJOER.md`](docs/06-MILJOER.md) |
| Säkerhet i ett publikt repo | [`docs/07-SAKERHET.md`](docs/07-SAKERHET.md) |
| Släpp till produktion | [`docs/08-SLAPP.md`](docs/08-SLAPP.md) |
| Varför saker ser ut som de gör | [`docs/adr/`](docs/adr/README.md) |

## Säkerhet

Repot är publikt. Allt som läggs här — git-historik, commit-uppgifter, grenar och
loggar från GitHub Actions — är synligt för alla, och får därför aldrig innehålla
lösenord, nycklar, tokens eller personuppgifter.

- [Säkerhetspolicy](SECURITY.md) — hur du rapporterar ett problem, och vad som gäller om
  en hemlighet råkat hamna i repot.
- [Säkerhet i ett publikt repo](docs/07-SAKERHET.md) — checklistan före push och
  skälen bakom varje regel.

## Automatiska kontroller

Varje push och pull request kör hemlighetsskanning av hela historiken, CodeQL,
granskning av nya beroenden, lintning av HTML, CSS, TypeScript, Markdown, YAML och
arbetsflöden, typkontroll, enhetstesterna, bygget och en kontroll av att dokumentationens
länkar och `§`-ID:n pekar rätt. `main` skyddas av regelverket i
[`.github/rulesets/main-protection.json`](.github/rulesets/main-protection.json).

## Läget

Sajten är byggd: start-, plats-, djur-, art- och kartsidan genereras ur YAML-datat, den
fungerar offline som installerbar app, och varje merge till `main` deployar QA under
[`/qa/`](https://stattared4h.github.io/stattared4h/qa/). Produktionen släpps för hand
enligt [`docs/08-SLAPP.md`](docs/08-SLAPP.md).

Gårdens egna djur är ännu inte inlagda — `source/data/` är tom, så produktionen visar
bara startsidan medan QA visar sajten med påhittat innehåll. Se
[spårbarhetsmatrisen](docs/99-sparbarhet/index.md) för vad varje krav har för status.

Designen ärver 4H:s visuella identitet från `4h.se/stattared`, med tillstånd.

## Licens

Koden är [MIT](LICENSE). Innehållet är det inte: texter och fotografier under
`source/data/`, `source/content/` och `source/images/` tillhör Stättareds 4H-gård och de
fotografer som anges i `credit`, och 4H-logotypen tillhör Riksförbundet Sveriges 4H
(ADR 0007). Fråga före återanvändning.

Kartans symboler (`source/ts/build/symbols.ts`): fem är ritade för sajten och omfattas av
MIT-licensen. Tre är ett svenskt vägmärkes egen figur — H5, H8 och H28 — vars utformning är
fastställd i vägmärkesförordningen (2007:90) och därmed är ett officiellt verk enligt
9 § upphovsrättslagen. `docs/09-kallor/index.md` säger vilken fil var symbol kommer ur.
