# Stättareds 4H-gård

Hemsida och innehållsdatabas för Stättareds 4H-gård: gårdens djur, aktiviteter och
platser — plus interaktiva spel som djurbingo, gissa vad djuret heter och skattjakter,
som hjälper besökare att upptäcka omgivningarna.

Sajten är en installerbar webbapp (PWA) för iOS och Android. Den är statisk, fungerar
offline och samlar inte in några personuppgifter.

## Var saker finns

| Vad | Var |
| --- | --- |
| Arbetsprocessen — läs denna först | [`CLAUDE.md`](CLAUDE.md) |
| Ändra innehåll utan utvecklarmiljö | [`docs/01-BIDRA.md`](docs/01-BIDRA.md) |
| Vad sajten ska göra | [`docs/02-krav/`](docs/02-krav/index.md) |
| Hur den är byggd | [`docs/03-arkitektur/`](docs/03-arkitektur/index.md) |
| Datastrukturen för djur och aktiviteter | [`docs/04-DATAKONTRAKT.md`](docs/04-DATAKONTRAKT.md) |
| Färger, typografi, komponenter | [`docs/05-design/`](docs/05-design/index.md) |
| Miljöer och drift | [`docs/06-MILJOER.md`](docs/06-MILJOER.md) |
| Säkerhet i ett publikt repo | [`docs/public-repo-safety.md`](docs/public-repo-safety.md) |
| Varför saker ser ut som de gör | [`docs/adr/`](docs/adr/README.md) |

## Säkerhet

Repot är publikt. Allt som läggs här — git-historik, commit-uppgifter, grenar och
loggar från GitHub Actions — är synligt för alla, och får därför aldrig innehålla
lösenord, nycklar, tokens eller personuppgifter.

- [Säkerhetspolicy](SECURITY.md) — hur du rapporterar ett problem, och vad som gäller om
  en hemlighet råkat hamna i repot.
- [Säkerhet i ett publikt repo](docs/public-repo-safety.md) — checklistan före push och
  skälen bakom varje regel.

## Automatiska kontroller

Varje push och pull request kör hemlighetsskanning av hela historiken, CodeQL,
granskning av nya beroenden, lintning av Markdown, YAML och arbetsflöden, samt en
kontroll av att dokumentationens länkar pekar rätt. `main` skyddas av regelverket i
[`.github/rulesets/main-protection.json`](.github/rulesets/main-protection.json).

## Läget

Ramverket är på plats: process, arkitekturbeslut, datakontrakt och designsystem.
Själva sajten är inte byggd ännu — se
[spårbarhetsmatrisen](docs/99-sparbarhet/index.md) för vad som finns och vad som saknas.

Designen ärver 4H:s visuella identitet från `4h.se/stattared`, med tillstånd.

## Licens

[MIT](LICENSE)
