# 0021 — Bilden bereds i webbläsaren, med valideringen som enda grind

**Status:** Antagen, 2026-09-08

## Sammanhang

`npm run image` webbanpassar ett foto med sharp: rätar upp efter EXIF, skalar till 1600
px, kodar om till WebP under 250 KB och tar bort all metadata
([ADR 0008](0008-bilder-i-repot.md)). Kommandot kräver Node, ett klonat repo och en
terminal, och stänger därmed ute den gårdsmedlem som ska förvalta innehållet
(`02-§2.4`).

Fas 2:s skriv-API ([ADR 0013](0013-faser-admin-nu-skriv-api-sedan.md)) skulle lösa det
med en server som kör samma sharp. Den ligger längre fram, och under tiden är bilderna
det som avgör om sajten är värd något.

Webbläsaren kan redan allt som behövs: `canvas` skalar och kodar om, och `crypto.subtle`
räknar SHA-256. Men `canvas.toBlob` ger inte samma bytes som sharp. Kvalitetsskalan är
inte densamma, kodaren är webbläsarens egen och skiljer sig mellan Chrome, Safari och
Firefox, och skalningen använder en annan filtrering. Samma foto blir därför inte samma
fil — och alltså inte samma bild-id ([ADR 0015](0015-bilden-som-egen-post.md)) — beroende
på var det bereddes.

## Beslut

Bilden får beredas i webbläsaren, och valideringen är enda grinden.

Verktygssidan (`02-§11`) gör i klienten vad `optimiseImage` gör i Node: rätar upp,
skalar till `MAX_IMAGE_EDGE`, sänker kvaliteten steg för steg tills filen håller
`MAX_IMAGE_BYTES`, och räknar id:t ur resultatet. Gränsvärdena är desamma, hämtade ur
samma modul (`02-§11.24`), så det finns inget tal att glömma att ändra på det ena
stället.

Att resultatet inte är identiskt med sharps accepteras. Kravet på en bild i repot är
inte "sharp skrev den" utan det `02-§8.1` säger: WebP, inom måtten, inom storleken, utan
metadata. Det kontrollerar `npm run validate` på varje pull request, oavsett var filen
kom ifrån.

Två följder skrivs ut, så att ingen upptäcker dem själv senare:

- **Samma foto kan få två id.** Berett i webbläsaren och berett med `npm run image` ger
  olika bytes och därmed olika id. Duplikatskyddet i `npm run image` — samma foto ger
  samma id — gäller bara inom en och samma kedja.
- **Metadata försvinner av mekanismen, inte av en flagga.** `canvas` bär bildpunkter,
  ingenting annat. EXIF, XMP och ICC kan inte följa med, och GPS-positionen i ett
  mobilfoto stannar i telefonen. Det är samma skydd som sharp ger, av ett annat skäl.

Uppräteringen efter EXIF-orientering överlåts på webbläsaren. Sedan `image-orientation:
from-image` blev normalläge läser varje aktuell webbläsare orienteringen ur filen och
vänder bilden innan den ritas, så ingen egen EXIF-tolk behövs. Att det faktiskt sker är
en manuell kontrollpunkt: ett porträttfoto ska bli stående.

## Övervägda alternativ

- **Vänta på fas 2 och kör sharp på servern** — avvisad: rätt slutmål, men det låter
  `source/data/` stå tom under tiden. Beredningen i klienten är dessutom exakt det steg
  fas 2 behöver; bara sista steget byts ut när skriv-API:t finns.
- **WebAssembly-bygge av libwebp i klienten, för identiska bytes** — avvisad: hundratals
  kilobyte kod och ett tungt beroende, för att göra id:t förutsägbart. Id:t behöver inte
  vara förutsägbart, bara stabilt när filen väl finns.
- **Egen EXIF-tolk och `imageOrientation: "none"`** — avvisad: mer kod att underhålla för
  ett beteende webbläsaren redan har rätt.

## Konsekvenser

- Redaktören behöver ingen utvecklarmiljö för en bild, vilket var hela poängen.
- Kvaliteten på en bild beredd i klienten kan bli marginellt sämre än sharps vid samma
  filstorlek. Gränsen är storleken, och den hålls.
- Verktygssidans logik som går att köra utan webbläsare — kvalitetstrappan, id:t, YAML:en
  och arkivet — ligger i domänskiktet och är enhetstestad i Node (`CL-§2.14`).
  Canvas-anropen är manuella kontrollpunkter.
- `crypto.subtle` finns bara i en säker kontext. Sajten körs över HTTPS och lokalt på
  `localhost`, som båda räknas som säkra, så det är ingen begränsning i praktiken.
