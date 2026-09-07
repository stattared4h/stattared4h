# 0015 — Bilden är en egen post med ett id ur innehållet

**Status:** Antagen, 2026-09-07

Bygger vidare på [ADR 0008](0008-bilder-i-repot.md), som avgjorde vad som får ligga i
repot. Den här ADR:n avgör hur bilderna namnges och kopplas till posterna.

## Sammanhang

I den första modellen bodde bilden inuti djurets fil, och filnamnet måste inledas med
djurets id:

```yaml
photos:
  - file: rosa-1.webp
    alt: Porträtt av Rosa.
    credit: Anna Karlsson
```

Två problem följde av det.

**En bild kan visa flera djur.** Ett foto med Rosa och Stjärna i samma hage har ingen
plats i modellen. Antingen läggs samma fil in två gånger under två namn, eller så skrivs
alt-texten och upphovsuppgiften på två ställen där de kan glida isär. Med ungefär 50 nya
djur om året och tre foton per djur är gruppbilder inte ett undantagsfall.

**Ett namn kan bli fel.** Filnamnet `rosa-1.webp` påstår att bilden hör till Rosa. Läggs
den under fel djur, eller döps djuret om, ljuger namnet — och eftersom filen ligger kvar
i git-historiken går det inte att städa bort med en omdöpning (`docs/01-BIDRA.md` §6).

Undermapparna `animals/`, `species/`, `places/` och `content/` vilade på samma antagande:
att en bild tillhör ett slags post. Ett foto på en get i en hage tillhör två.

Ett löpnummer som id vore heller inte gratis. Det kräver att den som lägger till en bild
vet vilket nummer som var sist. Två parallella pull requests väljer samma, och i fas 2
([ADR 0013](0013-faser-admin-nu-skriv-api-sedan.md)) gör två redaktörer som laddar upp
samtidigt likadant.

## Beslut

**Bilden är en egen post.** Den ligger i `source/data/images/<bild-id>.yaml` med `alt`
och `credit`, och filen i `source/images/<bild-id>.webp`. Djur och platser refererar
bilder med `photos`, en lista av bild-id:n; en art med `photo`, ett enda id. Samma id får
stå i flera poster.

**Id:t är `img-` följt av de första tolv hexadecimala tecknen av SHA-256 över den färdiga
WebP-filen.** Ingen räknare behövs, så ingen samordning krävs mellan parallella
ändringar. Samma foto får alltid samma id, så en dubblett blir samma fil i stället för en
kopia. Prefixet finns för att YAML annars skulle läsa ett id med bara siffror — ungefär
tre bilder på tusen — som ett heltal.

Hashen är hur `npm run image` **härleder** ett nytt id. Valideringen kontrollerar id:ts
form, inte att det motsvarar filens innehåll: QA-platshållarna genereras om av sharp och
skulle annars börja fela vid en versionshöjning.

**Bildkatalogen är platt.** Undermapparna per posttyp försvinner.

**Bilder i Markdown går genom samma poster:** `![](img-a3f2c1d8b901)`. Alt-texten kommer
ur bildposten, aldrig ur Markdown-filen.

## Övervägda alternativ

- **Behålla filnamn som inleds med postens id** — avvisad: det är just den modell som
  inte klarar en bild med två djur på, och som gör namnet osant när en bild hamnar fel.
- **Löpnummer, `img-0001`** — avvisad: kräver en räknare, och därmed samordning som
  varken parallella pull requests eller fas 2:s skriv-API kan ge.
- **Datum plus slumptal, `2026-09-07-a3f2`** — avvisad: löser räknarproblemet men ger
  ingen dubblettigenkänning, och datumet är ett faktum om filen som ingen läser.
- **Metadata kvar i djurets fil, bara filnamnet delat** — avvisad: alt-texten och
  upphovsuppgiften skulle stå en gång per post som använder bilden.
- **Bildposten listar sina motiv i stället för tvärtom** — avvisad: att lägga till ett
  foto hos ett djur skulle då ändra bildens fil, och ordningen mellan ett djurs bilder
  skulle inte ha någonstans att bo.

## Konsekvenser

- En bildfil finns en gång oavsett hur många poster som visar den, och alt-texten skrivs
  en gång. Repostorleken i ADR 0008 håller med marginal.
- `source/images/` går inte att bläddra i: id:t säger ingenting om motivet. Alt-texten
  står i `source/data/images/` bredvid, och det är där man letar.
- Att byta ut en bild ger en ny fil och ett nytt id; den gamla posten tas bort. Det är
  avsiktligt — en omkodad bild *är* en annan fil.
- Valideringen varnar för en bildpost som ingen refererar och för en bildfil utan post,
  eftersom oanvänt utrymme är precis vad ADR 0008 vill undvika.
- Beslutet fattas medan `source/data/` fortfarande är tom. Det finns inget riktigt foto
  att migrera; bara QA-datat skrivs om.
