# Krav — Bygge, kvalitet och drift

Del av [kravindexet](./index.md). Den här filen äger `02-§9`.

Issue: [#12](https://github.com/stattared4h/stattared4h/issues/12).
Beslut: [ADR 0003](../adr/0003-eleventy-som-generator.md),
[ADR 0005](../adr/0005-konfigurerbar-bassokvag.md),
[ADR 0011](../adr/0011-sakerhetslage-for-publikt-repo.md).

---

## 9. Bygge, kvalitet och drift

### Bakgrund

`CLAUDE.md` §5 kräver lintning, datavalidering och byggintegritet från dag ett, och
`03-§8` beskriver kommandona. Kraven nedan gör dem kontrollerbara. Två saker avgjordes
när kraven skrevs. Eleventy importerar domänskiktets TypeScript direkt (ADR 0003), vilket
förutsätter Node 22.18 eller senare, som tar bort typannoteringar utan verktyg; det står
nu som krav. Och deployen får inte köra parallellt med kvalitetskontrollerna, för då
deployar en röd `main` ändå.

### Verktygskedja

- Sajten byggs av Eleventy från `source/` till `public/`, med esbuild för klientkoden.
  Domänskiktet är TypeScript utan `enum`, `namespace` och parameteregenskaper, så att
  Node kan köra det utan kompilering. <!-- 02-§9.1 -->
- Node 22.18 eller senare krävs, angivet i `.nvmrc` och i `package.json`
  `engines`. <!-- 02-§9.2 -->
- `npm run lint` kör html-validate på `public/`, stylelint på CSS med en regel som fäller
  färg-, spacing- och typografiliteraler utanför `tokens.css`, eslint på TypeScript,
  markdownlint och yamllint. <!-- 02-§9.3 -->
- `npm start` bygger, serverar på `localhost:8080` och bygger om när en fil i `source/`
  ändras. <!-- 02-§9.4 -->
- Besökaren får bara kod som skrivits i repot. Inga beroenden skickas till
  webbläsaren. <!-- 02-§9.5 -->
- Beroenden är byggtidsberoenden med låst version i `package-lock.json`, granskade enligt
  `07-SAKERHET.md` §6. <!-- 02-§9.6 -->

### Kontroller

- `package.json` har skripten `build`, `start`, `validate`, `test`, `lint` och
  `typecheck`, och CI kör `lint`, `typecheck`, `build` och `test` på varje pull request
  utan `--if-present`, så att ett saknat skript fäller. <!-- 02-§9.7 -->
- Ett test bygger sajten med `BASE_PATH=/prov/` och fäller om `public/` innehåller ett
  `href`, `src`, `srcset`, `url()`, manifestfält eller en service-worker-sökväg som
  börjar med `/` utan att börja med `/prov/`. <!-- 02-§9.8 -->
- Ett test jämför `tokens.css` med paletten i `05-§2` och skalan i `05-§3`, och räknar
  kontrasten för paren i `05-§2.13` mot WCAG AA. <!-- 02-§9.9 -->
- CI kör en dokumentkontroll som fäller om ett `§`-ID förekommer två gånger, om
  spårbarhetsmatrisen citerar ett ID som inte finns, om matrisens summering inte stämmer
  med dess rader, eller om en kommentar i kod eller konfiguration pekar på en fil som
  saknas. <!-- 02-§9.10 -->

### Drift

- Deploy till GitHub Pages körs bara när alla kvalitetskontroller är gröna på samma
  commit, och installerar beroenden med `npm ci`. QA-deployen startar av sig själv vid
  merge till `main`; produktionsdeployen startas för hand och godkänns i miljön
  `production` (`02-§10.24`, `02-§10.33`). <!-- 02-§9.11 -->
- Varje deploy bygger en Pages-utgåva med produktionen i roten och QA under `/qa/`
  (`06-§1`). QA byggs från `main` med `source/data-qa/`. Produktionen byggs från
  senaste produktionstaggens kod med `source/data/` och `source/content/` från `main`,
  utom i produktionsdeployen, där den byggs från `main`. <!-- 02-§9.12 -->
