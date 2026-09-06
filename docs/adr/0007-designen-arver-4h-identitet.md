# 0007 — Designen ärver 4H:s visuella identitet

**Status:** Antagen, 2026-09-06

## Sammanhang

Gården har redan en sajt på `4h.se/stattared`, byggd på 4H-förbundets gemensamma
WordPress-tema. Besökare som känner igen 4H ska känna igen sig här, och den nya sajten ska
inte se ut som ett främmande projekt vid sidan av föreningen. Vi har tillstånd att använda
bilder och logotyper därifrån.

Det befintliga temat är samtidigt inte något att kopiera rakt av: det är Bootstrap plus ett
lager plugins, utan medveten typografi och utan mobilfokus.

## Beslut

Vi ärver 4H:s **visuella identitet** — färgerna och logotypen — men bygger vår egen
typografi, spacing och komponenter ovanpå.

Färgerna hämtas ur det befintliga temats stilmall och blir sajtens tokens:
mörkgrön `#15623e` för sidfot, rubriker och all grön text, ljusgrön `#e7fdf3` som mjuk
bakgrundston, och `#404040` för brödtext. Logotypens gröna `#467c45` används där
logotypen förekommer.

Temats primärgröna `#008b45` levereras justerad som `#00863f`. Skälet är mätbart: vit
text på `#008b45` landar på 4,39:1 och missar WCAG AA-gränsen 4,5:1, medan `#00863f` når
4,69:1. Skillnaden är omöjlig att se med ögat och avgörande för läsbarheten.

Typografi, rytm, komponentformer och interaktionsmönster definieras i `docs/05-design/` och
är våra egna, valda för läsbarhet på mobil ute i solsken.

## Övervägda alternativ

- **Kopiera temat pixel för pixel** — avvisad: vi skulle ärva Bootstrap-beroendet och en
  layout gjord för skrivbord, och binda oss vid ett tema vi inte styr över.
- **Helt egen visuell identitet** — avvisad: bryter igenkänningen mot 4H och gör att
  gården framstår som två olika organisationer beroende på vilken sajt man hamnar på.
- **Vänta på grafisk profil från förbundet** — avvisad: blockerar arbetet på något vi inte
  råder över, och färgerna i temat är i praktiken profilen.

## Konsekvenser

- Sajten känns som 4H utan att ärva teknisk skuld.
- Färgerna är låsta som tokens. En ändring sker på ett ställe, i `tokens.css`.
- Kontrasten måste kontrolleras aktivt. Även den justerade gröna är en **ytfärg**:
  `#00863f` som text mot sidbotten ger 4,31:1 och underkänns, medan vit text på samma
  gröna når 4,69:1 och godkänns. Grön text är därför alltid `#15623e`. Reglerna står
  i `docs/05-design/index.md` §2.
- Logotypen tillhör 4H. Den används enligt förbundets riktlinjer och får inte ritas om,
  färgas om eller byggas in i egna märken.
