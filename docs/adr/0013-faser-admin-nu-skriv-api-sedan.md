# 0013 — Två faser: en administratör nu, skriv-API sedan

**Status:** Antagen, 2026-09-06

## Sammanhang

Underlaget beskriver rollerna anonym, redaktör och admin, och ett redaktörsgränssnitt där
behöriga uppdaterar djur från mobilen. Allt det kräver en server som håller en
skrivbehörighet och kontrollerar roller — en repo-token kan aldrig ligga i webbläsaren.

Att bygga det först skulle betyda att ingenting blir publikt förrän autentisering,
behörigheter och en driftmiljö är på plats. Det är den dyraste och mest osäkra delen, och
den blockerar allt som faktiskt möter besökaren.

## Beslut

Arbetet delas i två faser.

**Fas 1 — nu.** Ingen server, ingen inloggning, inga konton. En enda person med
skrivbehörighet till repot underhåller datat genom vanliga commits. Sajten byggs statiskt
och ligger på GitHub Pages. Rollerna är i praktiken två: administratör, som är den personen,
och besökare, som är alla andra.

**Fas 2 — när fas 1 visat sig bära.** Ett litet skriv-API på ett webbhotell tar emot
redaktörernas formulär, kontrollerar roll och skriver YAML-filerna till repot via GitHubs
API. Bygget deployar som förut. Redaktörer rör aldrig GitHub.

Datastrukturen i fas 1 väljs redan nu så att fas 2 blir ett tillägg och inte en migrering:
en fil per djur och per plats, så att API:et kan skriva en post utan att röra någon annan.

## Övervägda alternativ

- **Bygga hela behörighetsmodellen först** — avvisad: dyrast, mest osäkert, och blockerar
  allt som ger värde för besökaren. Vi vet inte ens säkert att den filbaserade modellen
  duger förrän någon fyllt den med hundra riktiga djur.
- **Färdig tjänst med inloggning från start, exempelvis Supabase** — avvisad i
  [ADR 0002](0002-yaml-som-databas.md) på lagringsfrågan. Autentiseringen ensam bär inte in
  hela tjänsten.
- **Låta redaktörerna redigera direkt i GitHubs webbgränssnitt** — avvisad som slutmål: det
  fungerar för en van person men inte för gårdens medlemmar. Som fas 1 med en administratör
  är det däremot precis vad vi gör.

## Konsekvenser

- Sajten kan komma upp utan att ett enda säkerhetsbeslut om konton behöver fattas. I fas 1
  finns ingen inloggning att forcera.
- Utkastfrågan skjuts upp: med en enda redaktör är `status` bara en flagga som styr vad
  sajten visar, inte en behörighetsgräns.
- Bördan i fas 1 ligger på en person. Med ungefär 50 djur in och ut per år blir det
  redigeringar mer eller mindre varje vecka. Det är hanterbart, och det är samtidigt skälet
  att inte skjuta fas 2 för långt fram.
- Den initiala inmatningen av dagens hundra djur är fas 1:s tyngsta arbete och görs bäst med
  en importör från befintlig lista, inte för hand.
- Fas 2 kräver ett driftställe för API:et och därmed en kostnad. Beslutet om var tas när det
  blir aktuellt, i en egen ADR.
