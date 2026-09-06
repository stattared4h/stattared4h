# 0006 — Svenska i dokumentation och gränssnitt, engelska i kod

**Status:** Antagen, 2026-09-06

## Sammanhang

Sajten vänder sig till svenska besökare och förvaltas av en svensk förening. De som läser
dokumentationen och fattar beslut om innehållet är gårdens medlemmar — inte nödvändigtvis
utvecklare, och inte nödvändigtvis bekväma på engelska.

Samtidigt är all kod omgiven av engelska: HTML-attribut, JavaScript-nyckelord,
biblioteksfunktioner, Eleventys egna konventioner. En kodbas som blandar svenska
identifierare med engelska API-anrop blir svårläst på ett eget sätt.

## Beslut

Svenska används för allt en människa läser som inte är kod: dokumentation, ADRer,
kravtexter, commit-meddelanden, PR-beskrivningar, och all text besökaren ser på sajten.

Engelska används i kod: variabel- och funktionsnamn, filnamn i `source/` och `tests/`,
fältnamn i YAML och JSON, **och kommentarer i kodfiler** — CSS, TypeScript och
arbetsflöden.

Gränsen går vid filen, inte vid meningen. Allt inuti en kodfil är engelskt; varje
fristående dokument är svenskt. Det gör regeln möjlig att följa utan att väga varje rad
för sig, och gör det uppenbart var en text hör hemma: ska den läsas av någon som inte
programmerar hör den hemma i `docs/`, inte i en kommentar.

YAML-fältnamnen är alltså engelska (`name`, `species`, `born`), medan värdena är svenska.
Datakontraktet i `docs/04-DATAKONTRAKT.md` förklarar varje fält på svenska, så den som
redigerar en djurfil kan slå upp vad fältet betyder utan att kunna engelska.

## Övervägda alternativ

- **Engelska genomgående**, som Libell och SBsommar — avvisad: gör dokumentationen
  otillgänglig för just de gårdsmedlemmar som ska förvalta innehållet. Vinsten skulle vara
  konsekvens med två andra projekt, vilket väger lätt mot det.
- **Svenska även i kod och YAML-fält** — avvisad: svenska identifierare bland engelska
  API:er blir ojämnt att läsa, åäö i nycklar och filnamn ställer till det i verktygskedjor,
  och varje framtida medarbetare som kan programmera kan engelska. Vi löser
  begripligheten med förklaringar i datakontraktet i stället.
- **Tvåspråkig dokumentation** — avvisad: två versioner som glider isär är värre än en
  version på fel språk.

## Konsekvenser

- En gårdsmedlem kan läsa hela `docs/` och förstå vad sajten gör och varför.
- Kodbasen förblir konsekvent med sina bibliotek.
- Gränssnittstexter ligger på ett ställe och är svenska. Skulle sajten någon gång behöva
  engelska för utländska besökare krävs en översättningsmekanism — och en ny ADR.
- Sökningar i repot måste ibland göras på båda språken: kravet heter något på svenska,
  koden som uppfyller det något på engelska. Spårbarhetsmatrisen finns delvis för att
  överbrygga det.
- En förklaring som en gårdsmedlem behöver kan inte gömmas i en kodkommentar, eftersom
  den kommentaren är engelsk. Den måste skrivas i `docs/`, där den ändå gör mer nytta.
