# Krav — Installation och offline

Del av [kravindexet](./index.md). Den här filen äger `02-§7`.

Issue: [#12](https://github.com/stattared4h/stattared4h/issues/12).
Beslut: [ADR 0004](../adr/0004-pwa-offline-forst.md),
[ADR 0005](../adr/0005-konfigurerbar-bassokvag.md).

---

## 7. Installation och offline

### Bakgrund

Sajten används där täckningen är sämst, ute vid hagarna. ADR 0004 valde en installerbar
PWA med offline-först. Kraven nedan gör det valet mätbart. QA-bygget under `/qa/`
(`06-§1`) får en egen service worker med eget scope, så att en besökare som en gång öppnat
QA aldrig får QA-innehåll i produktionens cache.

### Manifest

- Sajten har ett webbappmanifest med `name` "Djuren på Stättared", `short_name`
  "Stättared", `display: standalone`, `lang: sv`, `theme_color` lika med `05-§2.1` och
  `background_color` lika med `05-§2.4`, och ikoner i 192 och 512 px, varav en
  maskbar. <!-- 02-§7.1 -->
- Manifestets `start_url`, `scope` och `id` byggs från bas-sökvägen. <!-- 02-§7.2 -->

### Service worker

- Varje sida registrerar service workern på `<bas>sw.js` med scope lika med
  bas-sökvägen. <!-- 02-§7.3 -->
- Vid installation förcachar service workern startsidan, kartsidan, djurinfosidan,
  om-sidan, alla plats-, djur- och artsidor, 404-sidan, offline-sidan, CSS, buntad JS,
  manifestet och ikonerna. <!-- 02-§7.4 -->
- Sidor och tillgångar i förcachen svaras cache först. Fotografier svaras nätverk först
  med cache som reserv, och läggs i cachen när de hämtats. <!-- 02-§7.5 -->
- Cachens namn är bas-sökvägen följd av versionssträngen, `/stattared4h/1.0.4`
  (`02-§10.26`); saknar bygget version heter cachen `<bas>s4h-dev`. Vid aktivering
  raderas alla cacher under samma bas-sökväg med annat namn; cacher under en annan
  bas-sökväg på samma värd, som QA:s under produktionens, rörs inte
  (`03-§5.2`). <!-- 02-§7.6 -->
- Efter en första laddning går varje sida i förcachen att öppna utan uppkoppling. En
  navigering till något utanför cachen visar offline-sidan, med texten "Du är offline"
  och en länk till startsidan. <!-- 02-§7.7 -->
- Sajten gör inga anrop till andra värdar vid körning. <!-- 02-§7.8 -->
- QA-bygget har en egen service worker med scope `<bas>qa/` och ett eget manifest-`id`,
  så att QA och produktion aldrig delar cache. <!-- 02-§7.9 -->

### Installation

- Sajten går att lägga på hemskärmen i Safari på iOS och Chrome på Android, och
  offline-läget verifieras på en riktig iPhone innan fas 1 anses klar. Manuell
  kontrollpunkt: sätt telefonen i flygplansläge efter en första laddning och öppna en
  platssida och en djursida. <!-- 02-§7.10 -->
