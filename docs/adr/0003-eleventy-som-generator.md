# 0003 — Eleventy som statisk generator

**Status:** Antagen, 2026-09-06

## Sammanhang

ADR 0001 slår fast att utdatan är statiska filer. Något måste ändå bygga dem: sajten har
återkommande sidhuvud och sidfot, ett tiotal innehållssidor i Markdown, och en sida per
djur som ska genereras ur strukturerad data. Att skriva den markupen för hand innebär
duplicering och drift mellan sidorna.

Två närliggande projekt visar två vägar. SBsommar bygger med egna Node-skript, vilket ger
full kontroll men blir mycket egen kod att förvalta. Libell använder Vite och TypeScript,
vilket passar en app med en enda skärm men är trubbigt för många innehållssidor i Markdown.

## Beslut

Eleventy (11ty) bygger sajten. Innehållssidor skrivs i Markdown, layouter och
komponenter som Nunjucks-mallar, och djur- och aktivitetssidor genereras från YAML via
Eleventys datakatalog och paginering.

Den lilla mängd klientkod som behövs — spelen, kartan, service workern — skrivs i
TypeScript och buntas med esbuild som ett byggsteg. Ingen ramverksruntime skickas till
besökaren.

## Övervägda alternativ

- **Egna byggskript, som SBsommar** — avvisad: vi skulle skriva och sedan förvalta
  Markdown-rendering, mallhantering, paginering och watch-läge själva. CLAUDE.md §2.10
  säger uttryckligen att egna komplexa byggsystem kräver tydlig motivering, och här finns
  ingen: behoven är helt vanliga.
- **Vite och TypeScript, som Libell** — avvisad som *huvudverktyg*: Vite är utmärkt för
  applikationer men saknar innehållsmodellen — Markdown-samlingar, paginering per djur,
  layoutarv — som är kärnan i den här sajten. Vi använder ändå Libells lärdomar om
  ren DOM, offline och testbar domänlogik.
- **Astro** — avvisad: kan allt vi behöver, men drar in ett komponentramverk och en
  hydreringsmodell vi uttryckligen inte vill ha (ADR 0001). Mer maskineri än uppgiften bär.
- **Hugo** — avvisad: snabbast av alla, men Go-mallar och ett Go-verktyg vid sidan av en
  i övrigt Node-baserad verktygskedja gör tröskeln högre för tillfälliga medarbetare.

## Konsekvenser

- Innehåll kan skrivas och flyttas av icke-utvecklare utan att layoutkod rörs.
- Verktyget är etablerat och Node-baserat, samma ekosystem som lint, tester och CI.
- Vi tar på oss ett beroende som behöver uppdateras. Det är ett byggberoende — inget av
  det når besökaren — så eftersläpning är en underhållsfråga, inte en säkerhetsrisk mot
  publiken.
- Eleventy har egna konventioner (datakaskaden, `.eleventy.js`) som en ny medarbetare
  behöver läsa på om. `docs/03-arkitektur/` beskriver hur vi använder dem.
