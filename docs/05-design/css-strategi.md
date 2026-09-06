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

En källfil per skikt under `source/assets/css/`, sammanfogade i byggordning:

| Fil | Innehåll |
| --- | --- |
| `tokens.css` | Enbart `:root`-variablerna i §7.4. Inga selektorer. |
| `base.css` | Återställning, elementstandarder, typografi, fokusmarkering |
| `layout.css` | Behållare, rutnät, sidhuvud- och sidfotsstruktur |
| `components.css` | Allt i §6 |
| `utilities.css` | Ett fåtal hjälpklasser, exempelvis `.visually-hidden` |

Ingen annan fil än `tokens.css` får definiera en variabel. Det gör paletten sökbar på
ett ställe. <!-- 05-§7.5 -->

Kommentarerna i CSS-filerna är på engelska. De ligger i kod, och kod är engelsk enligt
[ADR 0006](../adr/0006-sprak-i-kod-och-dokumentation.md). <!-- 05-§7.9 -->

### Designtokens

Dessa bor i `source/assets/css/tokens.css` och är den enda platsen där ett färg-,
spacing- eller typografivärde skrivs som literal. <!-- 05-§7.4 -->

```css
:root {
  /* Colour — see 05-§2 for the contrast rules */
  --color-green: #00863f;        /* surfaces and buttons, always with white text */
  --color-green-deep: #15623e;   /* all green text, headings, footer */
  --color-green-pale: #e7fdf3;   /* soft background tint */
  --color-page: #f4f6f3;         /* page background */
  --color-surface: #ffffff;      /* cards and content surfaces */
  --color-ink: #404040;          /* body text */
  --color-ink-soft: #5a5a5a;     /* meta text */
  --color-border: #dfe3dd;       /* dividers and field borders */
  --color-sun: #f2b134;          /* game accent */
  --color-sun-ink: #7a4b00;      /* the sun tone as text on a light background */
  --color-danger: #b3261e;       /* errors and destructive actions */

  /* Typography */
  --font-sans: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --font-size-body: 17px;
  --font-size-small: 15px;
  --font-size-h1: 30px;
  --font-size-h2: 24px;
  --font-size-h3: 20px;
  --line-height-body: 1.6;
  --line-height-heading: 1.25;

  /* Spacing */
  --space-xs: 8px;
  --space-sm: 16px;
  --space-md: 24px;
  --space-lg: 40px;
  --space-xl: 64px;
  --space-xxl: 96px;

  /* Layout */
  --container-wide: 1200px;
  --container-narrow: 680px;
  --tap-target-min: 44px;

  /* Form */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 20px;
  --radius-full: 999px;
  --shadow-card: 0 2px 8px rgb(21 98 62 / 8%);
  --shadow-raised: 0 6px 20px rgb(21 98 62 / 14%);
  --border-width: 1px;
  --focus-ring: 3px solid var(--color-green-deep);
  --focus-offset: 2px;
}

@media (min-width: 960px) {
  :root {
    --font-size-h1: 40px;
    --font-size-h2: 30px;
    --font-size-h3: 22px;
  }
}
```

Rubrikstorlekarna är de enda tokens som ändras med skärmbredd. Brödtexten är avsiktligt
lika stor överallt. <!-- 05-§7.6 -->

### Fokusmarkering

Varje interaktivt element visar `--focus-ring` med `--focus-offset` vid
tangentbordsfokus. Fokusmarkeringen tas aldrig bort utan att ersättas med något minst
lika tydligt. <!-- 05-§7.7 -->

### Rörelse

Övergångar är korta, under 200 ms, och rör bara `opacity` och `transform`. Allt sådant
respekterar `prefers-reduced-motion: reduce` genom att stängas av. <!-- 05-§7.8 -->
