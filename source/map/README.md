# Ritad kartbakgrund

Kartan på startsidan ritas ur platsernas koordinater i `source/data/locations/`. Utan
något i den här katalogen visas markörerna på en tom ljusgrön platta. Lägger man två
filer här ritas en egen bakgrund — byggnader, vägar, hagarnas former — under
markörerna (`02-§5.30`, `03-§9.2`):

| Fil | Innehåll |
| --- | --- |
| `background.svg` | Ritningen, sparad från valfritt ritprogram (Inkscape, Illustrator, Figma) |
| `background.yaml` | Vilka koordinater ritningens fyra kanter motsvarar |

Båda filerna behövs. Finns bara den ena stannar bygget och säger vilken som saknas.

## `background.yaml`

Fyra tal i WGS84-decimalgrader — samma format som `lat` och `lon` i platsfilerna:

```yaml
north: 57.414500 # latitud vid ritningens överkant
south: 57.410500 # latitud vid underkanten
west: 12.211000 # longitud vid vänsterkanten
east: 12.217500 # longitud vid högerkanten
```

Ritningen ska alltså vara ritad med norr uppåt och i skala, så att en punkt på marken
hamnar rätt när bygget räknar om `lat`/`lon` till procent av ritningens bredd och höjd.
Enklast är att lägga ett flygfoto eller en kartbild som mall i ritprogrammet, rita
ovanpå, läsa av koordinaterna i hörnen och sedan ta bort mallen innan filen sparas.

En plats vars koordinater hamnar utanför ritningen visas inte på kartan; bygget varnar
med platsens id och ber dig vidga kanterna.

## `background.svg`

- Spara som vanlig SVG med ett `viewBox`-attribut på rotelementet. Det gör
  ritprogrammet självt. Saknas `viewBox` godtas `width` och `height` i pixlar.
- Sätt färger som attribut på formerna (`fill`, `stroke`), inte i ett `<style>`-element.
  Bygget bäddar in ritningen direkt i sidan, och ett `<style>` skulle påverka hela
  sidan. Använd gärna sajtens färger i `docs/05-design/index.md` §2.
- Ge former som betyder något ett id som börjar med `map-`, till exempel `map-ladugard`,
  så att de inte krockar med sidans egna id:n.
- Inget får hämtas utifrån: inga `<image>`-element, inga länkar till andra sajter, inga
  skript. Bygget vägrar en fil som innehåller sådant, eftersom sajten ska fungera offline
  och aldrig anropa något utanför sig själv.
- Ta bort mallbilden och lager du inte vill publicera innan du sparar; allt i filen
  hamnar på sajten.

## Byta ritningen

Ersätt `background.svg` med den nya filen och uppdatera `background.yaml` om hörnen
flyttat. Bygg om, öppna `/` och kontrollera att markörerna sitter där hagarna är.
Sitter de fel är det nästan alltid ett av de fyra talen i `background.yaml`.

Gårdens ritning ligger i repot. Den är härledd ur OSM-uttaget i
[källregistret](../../docs/09-kallor/index.md), som också säger vad i den som är gårdens
egna markeringar och hur säkra de är. Mekanismen testas dessutom med en liten SVG i
`tests/build/map.test.ts`.
