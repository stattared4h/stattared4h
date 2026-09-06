# Design — CSS-strategi

Hur stilmallen är organiserad, och de designtokens allt annat refererar till.

Del av [designindexet](./index.md). Avsnitts-ID (`05-§N.M`) är stabila och citeras från
kod; de kodar inte filens sökväg.

All CSS måste använda variablerna i §7.4. Hårdkoda aldrig färger, spacing eller
typografi. <!-- 05-§7.1 -->

---

## 7. CSS-strategi

### Hur CSS skrivs

Skriv CSS för en komponent först när dess HTML finns. Spekulativ CSS — skriven innan
markupen är satt — skapar spill och drift. <!-- 05-§7.2 -->

Reglerna i korthet: <!-- 05-§7.3 -->

- Ingen preprocessor. CSS-variabler räcker.
- Inget CSS-ramverk. Handskrivet och minimalt.
- Ingen `!important` utan en kommentar som förklarar varför.
- Selektorer hålls platta. En klass per komponentdel, inga djupa nästlingar.
- Klassnamn på engelska enligt ADR 0006, i mönstret `block__del--variant`.

### Filstruktur

En källfil per skikt under `source/assets/css/`, laddade i denna ordning: <!-- 05-§7.10 -->

| Fil | Innehåll |
| --- | --- |
| `tokens.css` | Enbart `:root`-variablerna i §7.4. Inga selektorer. |
| `base.css` | Återställning, elementstandarder, typografi, fokusmarkering |
| `layout.css` | Behållare, rutnät, sidhuvud- och sidfotsstruktur |
| `components.css` | Allt i §6 |
| `utilities.css` | Ett fåtal hjälpklasser, exempelvis `.visually-hidden`. Skapas när den första behövs |

Ingen annan fil än `tokens.css` får definiera en variabel. Det gör paletten sökbar på
ett ställe. <!-- 05-§7.5 -->

Kommentarerna i CSS-filerna är på engelska. De ligger i kod, och kod är engelsk enligt
[ADR 0006](../adr/0006-sprak-i-kod-och-dokumentation.md). <!-- 05-§7.9 -->

### Designtokens

Dessa bor i `source/assets/css/tokens.css` och är den enda platsen där ett färg-,
spacing- eller typografivärde skrivs som literal i kod. Värdena *beslutas* i §2–§5 och
*levereras* i filen; det här dokumentet upprepar dem inte, så att de inte kan glida
isär. Ett test jämför filen mot §2 (`02-§9.7`). <!-- 05-§7.4 -->

Tokens namnges efter vad de är, inte var de används:

| Grupp | Namn | Beslutas i |
| --- | --- | --- |
| Färg | `--color-green`, `--color-green-deep`, `--color-green-pale`, `--color-page`, `--color-surface`, `--color-ink`, `--color-ink-soft`, `--color-border`, `--color-sun`, `--color-sun-ink`, `--color-danger` | §2 |
| Typografi | `--font-sans`, `--font-size-body`, `--font-size-small`, `--font-size-h1`, `--font-size-h2`, `--font-size-h3`, `--line-height-body`, `--line-height-heading` | §3 |
| Spacing | `--space-xs` … `--space-xxl` | §4 |
| Layout | `--container-wide`, `--container-narrow`, `--tap-target-min` | §4 |
| Form | `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-full`, `--shadow-card`, `--shadow-raised`, `--border-width`, `--focus-ring`, `--focus-offset` | §6 |

Rubrikstorlekarna är de enda tokens som ändras med skärmbredd. Brödtexten är avsiktligt
lika stor överallt. <!-- 05-§7.6 -->

### Fokusmarkering

Varje interaktivt element visar `--focus-ring` med `--focus-offset` vid
tangentbordsfokus. Fokusmarkeringen tas aldrig bort utan att ersättas med något minst
lika tydligt. <!-- 05-§7.7 -->

### Rörelse

Övergångar är korta, under 200 ms, och rör bara `opacity` och `transform`. Allt sådant
respekterar `prefers-reduced-motion: reduce` genom att stängas av. <!-- 05-§7.8 -->
