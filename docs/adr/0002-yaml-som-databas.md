# 0002 — Innehållsdata är versionerad YAML, inte SQLite

**Status:** Antagen, 2026-09-06

## Sammanhang

Uppdraget beskrevs som "en hemsida och databas för gårdens djur och aktiviteter". Ordet
databas väcker frågan om en riktig databasmotor, och SQLite övervägdes uttryckligen
eftersom det är en fildatabas och därför verkar passa en sajt utan server.

Datamängden är liten och långsam: i storleksordningen några tiotal djur, ett par tiotal
återkommande aktiviteter, en handfull platser och några skattjakter. Den ändras när ett
djur föds, säljs eller dör, och när säsongens program spikas — inte kontinuerligt.

De som redigerar datat är gårdens medlemmar, inte utvecklare.

## Beslut

Gårdens data bor som YAML-filer i repot under `source/data/`, med ett schema definierat i
`docs/04-DATAKONTRAKT.md` och validering som fäller CI. Bygget läser YAML och genererar
både de statiska sidorna och de JSON-filer som spelen hämtar.

YAML är sanningen. Skulle vi någon gång behöva riktig frågekraft genereras en
SQLite-fil från YAML som ett byggsteg — aldrig tvärtom.

## Övervägda alternativ

- **SQLite i webbläsaren via sql.js eller wa-sqlite** — avvisad. Den kostar tre saker som
  väger tungt här: den binära `.sqlite`-filen går inte att granska i en diff, den går inte
  att redigera av en gårdsmedlem i GitHubs webbgränssnitt, och den går inte att validera
  fält för fält i CI. Dessutom laddar besökaren ner ungefär en megabyte WASM för att kunna
  ställa SQL-frågor mot data som ryms i en handfull kilobyte JSON. Vi skulle betala för
  frågekraft vi inte behöver med granskningsbarhet vi behöver mycket.
- **SQLite bakom ett API** — avvisad: kräver en server och river ADR 0001.
- **JSON i stället för YAML** — avvisad: JSON saknar kommentarer och är känsligare för
  syntaxfel vid handredigering. Kommentarer spelar roll när den som redigerar kommer
  tillbaka till filen ett år senare.
- **Ett headless CMS (Contentful, Sanity)** — avvisad: månadskostnad, ett externt beroende
  som kan läggas ned, och inloggningar att förvalta. Se ADR 0001.

## Konsekvenser

- Varje ändring av gårdens data blir en granskningsbar commit med historik. Det går att se
  när ett djur lades till och av vem.
- Validering sker före publicering i stället för vid inläsning i webbläsaren. Ett stavfel i
  ett datum fäller CI i stället för att bli en trasig sida.
- Redigering kräver GitHub. En gårdsmedlem kan ändra i webbgränssnittet, men det är ett
  steg mer tekniskt än ett administrationsgränssnitt. `docs/01-BIDRA.md` beskriver hur.
- Vi får ingen ad hoc-frågekraft. Behöver en sida en ny genomskärning av datat skrivs den
  i byggkoden, inte som en SQL-fråga.
- Modellen håller så länge datamängden är i hundratal. Går den mot tiotusentals poster,
  eller ska den redigeras av många samtidigt, är det dags att ompröva beslutet i en ny ADR.
