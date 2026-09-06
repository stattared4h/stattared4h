# 0002 — Gårdens data är YAML-filer i repot

**Status:** Antagen, 2026-09-06

## Sammanhang

Uppdraget beskrevs som "en hemsida och databas för gårdens djur". Ordet databas väcker
frågan om en databasmotor, och både SQLite och Postgres bakom en tjänst som Supabase
övervägdes.

Gården har omkring 100 djur och det tillkommer ungefär 50 om året. Historiska djur bevaras,
så registret växer till några hundra poster på fem år och kanske tusen på tjugo. Datat
ändras när ett djur föds, säljs eller dör, och när djurslag flyttar mellan hagar — inte
kontinuerligt.

Ett krav vägde tungt: redaktörerna ska kunna uppdatera utan att använda GitHub. Det
utgångsläget läste vi först som att datat inte kunde ligga i git. Det stämmer inte —
redaktören behöver inte röra GitHub, det räcker att något commit:ar åt dem. Systersajten
SB Sommar gör precis det: ett skriv-API tar emot formuläret och skriver en fragmentfil via
GitHubs API.

## Beslut

Gårdens data bor som YAML-filer i repot under `source/data/`, med schema och validering
enligt [`04-DATAKONTRAKT.md`](../04-DATAKONTRAKT.md). Bygget läser YAML och genererar
sidorna.

En fil per djur och per plats. Kontrollerad vokabulär — arter och raser — i var sin
gemensam fil. Fragmenteringen är vald så att två redigeringar aldrig rör samma fil, vilket
är vad ett skriv-API behöver i fas 2.

Historik behöver ingen datastruktur: varje ändring är en commit med tidsstämpel och diff.
Git *är* loggen.

## Övervägda alternativ

- **Postgres via Supabase** — avvisad: en tjänst att förvalta, ett personuppgiftsbiträdes-
  avtal, och en gratisnivå som historiskt pausat projekt som stått oanvända någon vecka.
  En gårdssajt är tyst i november, och en sajt som ligger nere för att ingen tittat på den
  är oacceptabel.
- **SQLite i webbläsaren via sql.js** — avvisad: den binära filen går inte att granska i en
  diff, och besökaren skulle ladda ungefär en megabyte WASM för frågekraft som några hundra
  poster inte behöver.
- **JSON i stället för YAML** — avvisad: JSON saknar kommentarer och är känsligare för
  syntaxfel vid handredigering.
- **Ett headless CMS** — avvisad: månadskostnad och ett externt beroende som kan läggas ned.

## Konsekvenser

- Varje ändring blir en granskningsbar commit med historik, utan att vi bygger något.
- Validering sker före publicering. Ett stavfel i ett art-id fäller CI i stället för att bli
  en trasig sida.
- Vi får ingen ad hoc-frågekraft. Behöver en sida en ny genomskärning skrivs den i
  byggkoden, inte som en SQL-fråga. Vid den här datamängden är det en icke-fråga.
- Massändringar över alla djur blir skript i stället för en `UPDATE`.
- Modellen håller så länge posterna räknas i hundratal och några få personer redigerar. Går
  det mot tiotusentals poster eller många samtidiga redaktörer är det dags att ompröva.
