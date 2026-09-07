# 0008 — Bara webbanpassade bilder, i repot, utan LFS

**Status:** Antagen, 2026-09-06. Namngivningen och mappstrukturen nedan är ersatta av
[ADR 0015](0015-bilden-som-egen-post.md). Regeln om ignorerade QA-platshållare är
ersatt av [ADR 0017](0017-ai-genererade-qa-bilder-i-repot.md); produktionsbildernas
gränser, lagringsvalet och beroendegranskningen gäller.

## Sammanhang

En sajt om gårdens djur står och faller med bilderna. Med omkring 100 djur nu och ungefär 50
tillkommande per år blir det snabbt mycket bilddata, och raderade filer ligger kvar i
git-historiken för alltid.

Räknat på tre foton per djur ligger fem år på cirka 0,25 GB om varje bild hålls under
250 KB, plus knappt 0,15 GB ersatta bilder kvar i historiken. Med 500 KB per bild passeras
GitHubs rekommenderade gräns om 1 GB inom tio år.

Horisonten är satt till fem år. Därefter finns andra möjligheter, och då byggs det om.

## Beslut

Bara **webbanpassade** bilder läggs i repot: WebP, högst 1600 px på längsta sidan och högst
250 KB. Bygget genererar de mindre storlekarna nedåt. Originalen bevaras i gårdens eget
arkiv och läggs aldrig in här.

Bilderna ligger i `source/images/animals/`, `places/` och `content/`, platt inom varje mapp,
med filnamn som inleds med postens id. YAML refererar **bara filnamnet**, aldrig en sökväg,
så att lagringen kan bytas utan att datat rörs.

En kontroll i CI fäller bygget vid överskriden storlek eller fel format, och kräver att EXIF
är strippat.

## Övervägda alternativ

- **Git LFS** — avvisad, och mer data gör den sämre snarare än bättre. LFS-bandbredden på
  gratisnivån ligger i storleksordningen 1 GB i månaden, och varje bygge som hämtar bilderna
  räknas av — vid 0,9 GB bilder tar kvoten slut nästan omedelbart och bygget stannar. LFS
  löser klonstorlek, vilket inte är vårt problem, och förvärrar CI, vilket är det. Dessutom
  får den som klonar utan LFS installerat pekarfiler i stället för bilder.
- **Objektlagring, exempelvis R2 eller B2** — avvisad *för fem år framåt*: den fungerar utan
  backend redan i fas 1, men lägger till en extern tjänst, en räkning och ett andra ställe att
  förvalta för ett problem vi inte har inom horisonten. Den blir rätt den dag redaktörer ska
  ladda upp från telefonen.
- **Commit:a originalen** — avvisad: tio gånger så mycket data för en kvalitet sajten aldrig
  levererar.
- **Textfritt repo, som systerprojektet Libell** — avvisad: fotografier av kor går inte att
  generera ur kod.

## Konsekvenser

- Repot håller sig runt 0,4 GB efter fem år, med marginal till alla gränser.
- Ingen extern tjänst, ingen kostnad, och offline-läget håller eftersom allt ligger i bygget.
- Originalen finns inte här. Behövs en högupplöst bild för tryck hämtas den ur gårdens arkiv.
- Ett borttaget foto finns kvar i git-historiken. Måste en bild bort av upphovsrättsliga skäl
  eller för att någon på bilden ber om det krävs mer än en vanlig commit;
  `docs/01-BIDRA.md` beskriver det.
- Ett hjälpkommando behövs för att skala om, strippa EXIF och konvertera, annars blir manuellt
  bildarbete tröttsamt nog att någon tar genvägar förbi grinden.

## Beroende

Hjälpkommandot och byggets storleksgenerering använder [sharp](https://github.com/lovell/sharp),
repots första beroende med native-kod. Granskat enligt `07-SAKERHET.md` §6:

- **Ursprung och underhåll.** sharp är ett Node-bindningslager runt bildbiblioteket
  libvips, utvecklat och underhållet av Lovell Fuller sedan 2013 under Apache-2.0, med
  regelbundna släpp och ett av de mest använda bildpaketen i npm-registret — Next.js
  och Astro bygger sin bildoptimering på det. Paketnamnet är kort och etablerat; det
  finns ingen känd namnförväxling att vara vaksam på.
- **Native-binärer utan installationsskript.** Binärerna levereras förbyggda som
  optionella beroenden, `@img/sharp-<plattform>` och `@img/sharp-libvips-<plattform>`,
  och npm väljer den variant som passar maskinen. Paketet har inget `install`-skript,
  så `npm ci --ignore-scripts` i CI fungerar oförändrat — verifierat vid införandet.
  Ingenting kompileras och ingenting hämtas utanför npm-registret.
- **Låsfilen** listar samtliga plattformsvarianter med integritetshashar, så bygget är
  reproducerbart. Dependabot och kontrollen *Dependency review* bevakar dem.
- **Når aldrig besökaren.** sharp körs bara vid bygget och i `npm run image` och
  `npm run qa:images`. Det som publiceras är WebP-filer och HTML; ingen kod från sharp
  hamnar i `public/`.
- **Transitiva beroenden:** `@img/colour`, `detect-libc` och `semver`, samt
  `@emnapi/runtime` och `tslib` för wasm-varianten.
