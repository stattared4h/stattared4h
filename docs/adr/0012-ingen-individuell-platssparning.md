# 0012 — Platsen bär djurslagen; enskilda djur spåras inte

**Status:** Antagen, 2026-09-06

## Sammanhang

Besökaren vill veta var getterna, korna, fåren och hästarna finns. QR-koden sitter på
hagen och ska svara på vad som går där.

Det naturliga första utkastet är att varje djur har en plats, och att flyttar registreras
som historik. Så var underlaget skrivet, och så modellerade vi först.

Men på gården flyttas djur **ofta och individuellt**. Ett djur byter hage av skäl som
ingen registrerar i stunden.

## Beslut

Platsen äger uppgiften om vilka **djurslag** som finns där. Ett djur har inget
`location`-fält, och får aldrig få ett. Ingen placeringshistorik registreras.

```yaml
# locations/gethagen.yaml
name: Gethagen
species: [get, får]
note: Här går bockarna.
```

Flera djurslag kan gå i samma hage, och samma djurslag kan finnas på flera platser.
Besökaren får svar från båda hållen ur samma fält: artsidan listar platserna där arten
finns, och platssidan listar djurslagen som går där och låter besökaren välja bland dem.

Valideringen avvisar aktivt ett `location`-fält på ett djur, så att beslutet inte urholkas
av en välmenande framtida ändring.

## Övervägda alternativ

- **Plats på varje djur** — avvisad, och skälet är inte att uppgiften saknar värde utan att
  den skulle vara **osann**. Flyttas djur individuellt och ofta är en individuell
  platsuppgift inaktuell inom dagar. Ett register som ljuger är sämre än inget register, och
  en besökare som letar efter Rosa i fel hage får en sämre upplevelse än en som får veta att
  getter finns i Gethagen och Bockhagen.
- **Namngivna grupper med en plats var** — avvisad: det krävde att någon hittade på
  identifierare för "bockarna" och "årets killingar" och höll dem stabila över tid. Det är
  jargong förklädd till schema, och det löser inget som artlistan på platsen inte redan löser.
- **Placeringshistorik som tidsserie** — avvisad: bygger på individdata vi inte har, och
  git bevarar redan varje ändring av platsfilerna.

## Konsekvenser

- Att flytta ett djurslag är två små ändringar: ta bort arten ur en platsfil, lägg till den i
  en annan. Ingen validering kan fånga en glömd halva, eftersom samma djurslag på två platser
  också kan vara sant. Det är en accepterad kostnad.
- Djurets sida påstår aldrig var djuret står. Den säger vilken art det är och länkar vidare.
- Färskheten upphör att vara ett problem. Vilka djurslag som går i en hage ändras säsongsvis,
  så ett statiskt bygge räcker och QR-koden hinner aldrig bli fel på grund av byggtiden.
- Underlaget i issue #5, #7 och #9 utgår från individspårning och behöver rättas efter det
  här beslutet. Redaktörsverktyget för att flytta enskilda djur i #9 utgår helt.
