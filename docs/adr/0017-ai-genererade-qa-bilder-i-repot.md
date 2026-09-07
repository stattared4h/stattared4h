# 0017 — AI-genererade QA-bilder versionshanteras

**Status:** Antagen, 2026-09-07

Ersätter ADR 0008:s beslut att QA-bilder alltid är ignorerade platshållare. Gårdens
riktiga bilder följer fortfarande ADR 0008 och ADR 0015 utan ändring.

## Sammanhang

QA-datasetet har hundra påhittade djur men dess 101 bildposter visas som gröna plattor.
Det prövar datamodellen, men ger ingen rättvisande förhandsvisning av en sajt där
fotografierna bär igenkänning och känsla.

AI-genererade bilder kan göra QA användbart innan gårdens foton finns. De kan samtidigt
misstas för verkliga Stättaredsdjur i en beskuren skärmdump, och en incheckad fil ligger
kvar i git-historiken efter att den tagits bort.

## Beslut

QA använder cirka 25 fotorealistiska bilder som delas mellan flera poster. Det håller
den permanenta datamängden liten och prövar den delning som ADR 0015 medger. Bildpostens
befintliga id behålls vid generering och import; QA-id:t verifieras därför fortfarande
bara till formen.

Varje bild märks permanent med texten "AI-bild · QA" på en mörk yta i nedre hörnet.
Märkningen läggs in av importkommandot och följer därmed med en skärmdump. Motiven visar
inga personer. Bildpostens credit är `AI-genererad med OpenAI ImageGen`, och
produktionsdatasetet avvisar varje credit som börjar med `AI-genererad`.

Filerna versionshanteras i `source/images-qa/` som WebP med högst 1200 px längsta sida,
högst 50 KB och utan EXIF, XMP eller ICC. `npm run qa:prompts` bygger reproducerbara
promptunderlag ur QA-datat. `npm run qa:images -- --import <katalog>` märker och
webbanpassar genererade källbilder under bildposternas befintliga id. Kommandot utan
`--import` fyller bara saknade filer med platshållare och rör aldrig en befintlig bild.

## Övervägda alternativ

- **101 unika bilder** — avvisad: fem gånger större permanent arbete och lagring utan
  motsvarande QA-värde.
- **Illustrerad stil utan märkning** — avvisad: svårare att bedöma hur fotografier
  fungerar i layouten.
- **Fotorealistiskt utan inbränd märkning** — avvisad: en skärmdump kan då framstå som
  ett påstående om gårdens riktiga djur.
- **Generering i CI eller vid sidladdning** — avvisad: bygger in externa anrop, nycklar
  och icke-determinism i ett statiskt offlinebygge.

## Konsekvenser

- QA visar foton direkt efter en vanlig utcheckning och kan visas för styrelsen utan
  ett lokalt förberedelsesteg.
- Ungefär 1,25 MB läggs permanent till i git-historiken. Nya versioner ökar den summan.
- Flera påhittade djur visar samma motiv. Det är avsiktligt och får aldrig tolkas som
  identitetsdata om gårdens djur.
- Platshållarflödet finns kvar för ofullständiga leveransomgångar, men färdiga bilder
  ersätts aldrig av kommandot.
- `source/data/` och `source/images/` påverkas inte.
