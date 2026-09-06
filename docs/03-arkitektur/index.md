# Arkitektur — index

Hur sajten är byggd. *Varför* den är byggd så står i [`../adr/`](../adr/README.md);
*vad* den ska göra står i [`../02-krav/`](../02-krav/index.md).

Avsnitts-ID (`03-§N.M`) är stabila och citeras från kod och spårbarhetsmatrisen.

---

## 1. Systemöversikt

Sajten är en statisk PWA. Ingenting körs på en server; allt avgörs vid bygget eller i
besökarens webbläsare. <!-- 03-§1.1 -->

```text
source/                      bygge (Eleventy + esbuild)        public/
├── data/*.yaml       ──┐                                   ┌── *.html
├── content/*.md      ──┼──►  1. läs och validera data  ──┐  ├── assets/*.css
├── layouts/*.njk     ──┤     2. rendera sidor           ─┼─►├── assets/*.js
├── assets/css/*.css  ──┤     3. bunta klientkod         ─┤  ├── data/*.json
├── assets/ts/*.ts    ──┤     4. generera bildvarianter  ─┤  ├── images/*
└── images/*          ──┘     5. skriv manifest + sw     ─┘  ├── manifest.webmanifest
                                                            └── sw.js
```

Fem steg, i ordning. Steg 1 fäller bygget vid ogiltig data, så inget felaktigt når
`public/`. <!-- 03-§1.2 -->

---

## 2. Skikt

| Skikt | Katalog | Får känna till |
| --- | --- | --- |
| Data | `source/data/` | ingenting — det är ren YAML |
| Domän | `source/ts/domain/` | data; **inga** webbläsar-API:er |
| Lagring | `source/ts/storage/` | `localStorage` |
| Vy | `source/ts/ui/` | DOM, domän, lagring |
| Mallar | `source/layouts/`, `source/content/` | data via Eleventy |

Domänskiktet är rent: ingen `window`, `document`, `navigator` eller `localStorage`. Det
är där spelreglerna bor, och det är därför de går att enhetstesta i Node utan
webbläsare. Regeln är hämtad från Libell och har visat sig bära. <!-- 03-§2.1 -->

Vyskiktet bygger DOM med `createElement` och `textContent`. Ingen `innerHTML` finns i
kodbasen; det är samtidigt skyddet mot XSS. <!-- 03-§2.2 -->

---

## 3. Datakedjan

1. YAML läses av Eleventys datakaskad och valideras mot schemat i
   [`../04-DATAKONTRAKT.md`](../04-DATAKONTRAKT.md). <!-- 03-§3.1 -->
2. Validerad data blir dels sidor — en per djur, en per aktivitet, en per skattjakt —
   dels JSON under `public/data/` som spelen hämtar. <!-- 03-§3.2 -->
3. JSON-filerna innehåller bara det spelen behöver. Fotografernas namn och långa
   beskrivningar följer inte med in i spelens data. <!-- 03-§3.3 -->
4. Sorteringen sker vid bygget och är deterministisk, så att två byggen av samma data ger
   identiska filer. <!-- 03-§3.4 -->

---

## 4. Spelen

Varje spel består av en regelmodul och en presentationsdel, enligt
[ADR 0009](../adr/0009-datadrivna-spel.md). <!-- 03-§4.1 -->

| Spel | Regelmodul | Vad den avgör |
| --- | --- | --- |
| Djurbingo | `domain/bingo.ts` | Vilka djur som får plats på brickan och när raden är full |
| Gissa djuret | `domain/guess.ts` | Fråge- och svarsurval, om ett svar är rätt |
| Skattjakt | `domain/hunt.ts` | Postordning, närhetsbedömning, svarsjämförelse |

Slumpen ligger i webbläsaren, inte i bygget, så att brickan blir ny varje gång. Slumpen
tas via en injicerad funktion, vilket gör den utbytbar mot ett fast frö i testerna. <!-- 03-§4.2 -->

Spelframsteg sparas i `localStorage` under en nyckel per spel, med en versionsstämpel så
att gammalt sparat läge kan kasseras utan att krascha. Inget lämnar enheten
([ADR 0010](../adr/0010-ingen-sparning-av-besokare.md)). <!-- 03-§4.3 -->

---

## 5. Offline och service worker

Service workern förcachar sidskal, CSS, buntad JS, ikoner och gårdsdatans JSON. Strategin
är cache först för dessa, och nätverk först med cache som reserv för
fotografier. <!-- 03-§5.1 -->

Cachenamnet innehåller ett byggnummer och sätts av bygget, aldrig för hand. Vid
aktivering raderas cacher med annat namn. <!-- 03-§5.2 -->

Service workerns scope och manifestets `start_url` byggs från bas-sökvägen i
[ADR 0005](../adr/0005-konfigurerbar-bassokvag.md). <!-- 03-§5.3 -->

---

## 6. Bygget och CI

- `npm run build` bygger till `public/`. <!-- 03-§6.1 -->
- `npm test` kör enhetstesterna för domänskiktet och datavalideringen. <!-- 03-§6.2 -->
- `npm run lint` kör lintning av HTML, CSS, TypeScript och Markdown. <!-- 03-§6.3 -->
- CI kör bygge, lint, validering och tester på varje pull request och fäller vid
  fel. <!-- 03-§6.4 -->
- Merge till `main` bygger och deployar. `main` ska alltid gå att släppa. <!-- 03-§6.5 -->

Ett test bevakar att inget absolut sökvägsuttryck kringgår bas-sökvägens
hjälpfunktion. <!-- 03-§6.6 -->
