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

Node är givet oavsett generator: domänskiktet är TypeScript som ska enhetstestas utan
webbläsare, datavalideringen fäller bygget vid ogiltig data, och klientkoden buntas med
esbuild. Valet står alltså inte om Node, utan om vad som renderar sidorna.

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
- **Hugo** — avvisad, men det närmaste valet: snabbast av alla, och med den minsta
  beroendeytan — en pinnad binär i stället för Eleventy plus ett bildplugin för
  storlekarna i `03-§6.1`. Det som fäller den är kopplingen till domänskiktet.
  Härledningarna bor i en enda testbar modul (`03-§3.1`), och Eleventy importerar den rakt
  av. Hugo kan inte: antingen skrivs de om som Go-mallar — och att söka stamtavlan
  baklänges är obehagligt att uttrycka där, och logiken vore inte längre enhetstestad —
  eller så läggs ett Node-försteg in som serialiserar dem till JSON. Bygget blir då
  Node → Hugo → esbuild med en serialiseringsgräns mitt i, mot Eleventys Node → esbuild.
  Att Go-mallar skulle vara en tröskel för medarbetare väger däremot inte: redaktörer rör
  bara YAML och Markdown (`docs/01-BIDRA.md`), aldrig mallarna, och ett Go-verktyg kör
  redan i CI (actionlint).

## Konsekvenser

- Innehåll kan skrivas och flyttas av icke-utvecklare utan att layoutkod rörs.
- Generatorn delar runtime med domänskiktet, så härledningarna kan enhetstestas i Node och
  användas vid renderingen utan att passera ett filformat på vägen.
- Vi tar en större beroendeyta än nödvändigt — Eleventy med plugin, mot Hugos enda binär.
  Det är byggberoenden som inte når besökaren, så eftersläpning är en underhållsfråga och
  inte en säkerhetsrisk mot publiken. Men i ett repo som annars är beroendeförsiktigt
  (ADR 0011) är det en medveten kostnad, inte ett förbiseende.
- Eleventy har egna konventioner (datakaskaden, `.eleventy.js`) som en ny medarbetare
  behöver läsa på om. `docs/03-arkitektur/` beskriver hur vi använder dem.
- Invändningen mot Hugo är villkorad, inte principiell: den vilar på att härledningarna
  sker i den importerade modulen. Skulle de någon gång gå via genererad JSON i stället —
  vilket `03-§3.2` uttryckligen håller öppet för — faller invändningen, och frågan är
  öppen igen.
