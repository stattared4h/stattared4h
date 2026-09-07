# Att bidra

Den här sajten förvaltas av Stättareds 4H-gård. Det mesta som behöver ändras är
**innehåll** — ett nytt djur, ett djurslag som bytt hage — och det kräver ingen
utvecklarmiljö. Bara en ny bild behöver ett kommando, se *Lägga till en bild* nedan.

---

## 1. Roller

Rollerna upprätthålls av GitHub, inte av kod vi skrivit
([ADR 0014](adr/0014-roller-via-github.md)):

| Roll | Behörighet i repot | Kan |
| --- | --- | --- |
| Besökare | ingen | Läsa den publicerade sajten |
| Redaktör | Write | Ändra data och öppna en pull request |
| Administratör | Maintain eller Admin | Godkänna och lägga in ändringen |

En redaktör kan alltså aldrig ändra den publicerade sajten direkt. Allt går via en pull
request som kontrolleras automatiskt innan en administratör lägger in den.

För att bli redaktör behöver du ett GitHub-konto och en inbjudan till repot. Fråga
administratören.

---

## 2. Ändra innehåll utan att installera något

Allt görs i webbläsaren på github.com. Du behöver inte installera något, och du kan göra
det från telefonen.

### Lägga till ett djur

1. Gå till mappen `source/data/animals/`.
2. Klicka **Add file → Create new file**.
3. Döp filen efter djuret, med små bokstäver och bindestreck, och avsluta med `.yaml`.
   `Rosa` blir `rosa.yaml`. `Lilla Gumman` blir `lilla-gumman.yaml`. Å och ä blir `a`,
   ö blir `o` — `Snöbollen` blir `snobollen.yaml`.
   **Filnamnet är djurets id och ändras aldrig sedan**, inte ens om djuret byter namn.
4. Klistra in mallen nedan och fyll i.
5. Klicka **Commit changes**, välj **Create a new branch**, och sedan
   **Propose changes** följt av **Create pull request**.

Mall att klistra in — ta bort raderna du inte har uppgifter till:

```yaml
name: Rosa
species: get
breed: jamtget
sex: female
born: 2021-04-12
mother: stjarna
father: bocken
status: here
description: |
  Skriv några meningar om djuret. Vad är det för personlighet?
  Något besökaren känner igen det på?
photos:
  - img-a3f2c1d8b901
```

Bara `name`, `species`, `sex` och `status` måste vara med. Vet du inte födelsedatumet kan
du skriva bara årtalet, `born: 2021`, eller utelämna raden.

`species` och `breed` måste finnas i `source/data/species.yaml` respektive
`source/data/breeds.yaml`. Saknas arten lägger du till den där först.

`mother` och `father` är filnamnen på föräldrarna utan `.yaml`. Finns föräldern inte i
registret utelämnar du raden — skriv inte ett namn, för fältet vill ha ett id.

`photos` är en lista med bild-id:n, och den första bilden är porträttet. Id:na får du av
`npm run image`, se *Lägga till en bild* nedan. Har djuret ingen bild än utelämnar du
raden — det blir en varning, inte ett fel, och sidan visar en platta med djurslagets namn.

Slå upp vad varje fält betyder i [`04-DATAKONTRAKT.md`](04-DATAKONTRAKT.md).

### Flytta ett djurslag till en annan hage

Djuren har ingen egen plats — det är hagen som säger vilka **djurslag** som går där
([ADR 0012](adr/0012-ingen-individuell-platssparning.md)). En flytt är därför två
ändringar:

1. Öppna hagen djuren lämnar, i `source/data/locations/`, och ta bort arten ur `species`.
2. Öppna hagen de kommer till och lägg till arten i dess `species`.

Glömmer du den ena halvan står djurslaget kvar på båda ställena på sajten. Ingen
kontroll kan fånga det, eftersom samma djurslag på två platser också kan vara sant.

`note` är en kort mening i klartext för det kontrollerna inte kan veta, till exempel
*"Här går bockarna."*

### När ett djur lämnar gården

**Radera aldrig djurets fil.** Sätt `status: gone`. Djuret försvinner då från hagarna men
finns kvar med sin sida, sin stamtavla och sina bilder. Raderar du filen bryts länkar, och
avkomman förlorar sin förälder.

### Lägga till en bild

Bilder kräver utvecklingsmiljön i §3, eftersom originalet måste webbanpassas först: repot
tar bara WebP, högst 1600 pixlar på längsta sidan och högst 250 KB, utan EXIF — mobilfoton
bär annars med sig GPS-positionen där bilden togs
([ADR 0008](adr/0008-bilder-i-repot.md)). Kommandot `npm run image` gör allt det:

```bash
npm run image -- ~/Bilder/IMG_1234.jpg \
  --alt "Rosa och Stjärna står tillsammans i Björkhagen." \
  --credit "Anna Karlsson"
```

Det skriver två filer och skriver ut bildens id:

```text
source/images/img-a3f2c1d8b901.webp          bilden, nedskalad och rensad på metadata
source/data/images/img-a3f2c1d8b901.yaml     alt-texten och fotografen
```

Originalet rörs inte. Id:t räknas ut ur bildens innehåll
([ADR 0015](adr/0015-bilden-som-egen-post.md)), så du väljer inget namn och behöver inte
veta vilket nummer som var sist. Laddar du upp samma foto igen får det samma id, och
kommandot säger att bilden redan finns i stället för att göra en kopia.

`--alt` beskriver vad som är viktigt i bilden och `--credit` vem som tagit den. Båda
krävs: en bild utan alt-text kommer ändå inte förbi valideringen. Publicera aldrig en
bild på en identifierbar person utan samtycke.

Referera sedan id:t från djuret eller platsen:

```yaml
photos:
  - img-a3f2c1d8b901
  - img-7be014aa39c2
```

Den **första bilden i listan är huvudbilden**: djurets porträtt, platsens toppbild. Vill
du byta porträtt flyttar du raden överst. En art har i stället ett enda id:
`photo: img-a3f2c1d8b901`.

Samma id får stå hos flera poster. Ett foto med två djur på läggs in en gång och
refereras från båda — filen finns en gång och alt-texten skrivs en gång.

I en innehållstext i Markdown infogas bilden med tom alt-text, eftersom texten redan står
i bildposten:

```markdown
![](img-a3f2c1d8b901)
```

### Många bilder på en gång

Ska du lägga in en hög med foton — den första omgången är runt hundra — är `npm run
image` en bild i taget för långsamt. Använd importen i stället. Den arbetar i två steg,
med ditt eget ifyllande emellan.

**Steg 1. Låt kommandot skriva listan.**

```bash
npm run image:import -- --scan ~/Bilder/gard
```

Det skriver `bilder.csv` med en rad per foto i katalogen. Bara `fil` är ifylld:

```text
fil,post,alt,fotograf
IMG_0001.jpg,,,
IMG_0002.jpg,,,
```

**Steg 2. Fyll i tabellen.** Öppna `bilder.csv` i Excel, Numbers eller Google Kalkylark
— eller i en vanlig textredigerare. Fyll i tre kolumner medan du tittar på bilderna:

| Kolumn | Vad du skriver |
| --- | --- |
| `post` | Id:t på djuret, platsen eller arten bilden hör till, alltså filnamnet utan `.yaml` — `rosa`, `gethagen` |
| `alt` | Vad som är viktigt i bilden, på svenska. Skriv en mening, inte ett ord |
| `fotograf` | Den som tagit bilden |

Två rader med samma `post` blir två bilder på det djuret, i den ordning de står.
Kommatecken och citattecken i alt-texten är inget problem. Välj **Spara som** och
formatet **CSV** när du är klar — sparar du i kalkylprogrammets eget format, som `.xlsx`,
säger importen till. Semikolon i stället för kommatecken går också bra; ett svenskt
kalkylprogram skriver ofta det.

**Steg 3. Kör importen.**

```bash
npm run image:import -- bilder.csv --photos ~/Bilder/gard
```

Kommandot bereder varje bild precis som `npm run image` gör, skriver bildposterna, och
skriver ut id:na grupperade per post:

```text
rosa:
  - img-983a851829da
  - img-88c164764c6d

gethagen:
  - img-e28ead3d09f0
```

Är något fel på någon rad skrivs **ingenting alls** — du får en lista med radnummer och
vad som ska rättas, fixar tabellen och kör om. Du får aldrig hälften av bilderna inlagda.

**Steg 4. Klistra in.** Kommandot rör aldrig djurens filer; det är du som avgör var
bilderna hör hemma. Kopiera raderna under `rosa:` in i `source/data/animals/rosa.yaml`
under `photos:`, och så vidare. Kör `npm run validate` när du är klar.

### Vad som händer sedan

Kontrollerna körs automatiskt på din pull request. Blir de gröna kan en administratör
lägga in ändringen, och sajten byggs om inom några minuter.

Blir en kontroll röd står det i meddelandet vad som är fel. De vanligaste är ett datum som
inte finns, en art som inte är upplagd, eller en förälder som stavats fel. Rätta i samma
pull request — kontrollerna körs om av sig själva.

Samma kontroll går att köra själv med `npm run validate`, som skriver varje fel och
varning på svenska med fil och fält. Ett fel stoppar bygget; en varning — ett djur utan
foto, en aktiv hage utan djurslag — är tillåten men troligen ett förbiseende.

---

## 3. Utvecklingsmiljö

Node 22.18 eller senare — bygget importerar TypeScript direkt, se `03-§8.7`.

```bash
git clone https://github.com/stattared4h/stattared4h.git
cd stattared4h
npm install
npm start          # bygger, serverar public/ på localhost:8080 och bygger om vid ändring i source/
```

Andra kommandon:

| Kommando | Gör |
| --- | --- |
| `npm run build` | Bygger sajten till `public/` med Eleventy; klientkoden buntas med esbuild |
| `npm run image -- <fil> --alt <text> --credit <namn>` | Webbanpassar ett foto, skriver bildfilen och bildposten (§2) |
| `npm run image:import -- --scan <katalog>` | Skriver en tabell med en rad per foto i katalogen, att fylla i (§2) |
| `npm run image:import -- <tabell> --photos <katalog>` | Bereder alla foton i tabellen och skriver bildposterna (§2) |
| `npm run icons` | Genererar `favicon.ico`, `apple-touch-icon.png` och manifestikonerna ur `source/assets/img/favicon.svg`; kör efter en ändring av SVG:n och committa resultatet |
| `npm run qa:images` | Genererar platshållarbilderna som QA-datat refererar, i `source/images-qa/` |
| `npm run qr` | Skriver en utskrivbar QR-kod per plats till `qr/`, med adressen ur `SITE_URL` (`02-§5.29`) |
| `npm test` | Kör testerna i `tests/` mot QA-datat; byggtesterna kör Eleventy till en tillfällig katalog |
| `npm run lint` | Lintar CSS, TypeScript, Markdown, YAML och den byggda HTML:en, och kör dokumentkontrollen — kör `npm run build` först |
| `npm run lint:docs` | Dokumentkontrollen ensam: dubbla `§`-ID, citeringar i spårbarhetsmatrisen, dess summering, och sökvägar i kodkommentarer |
| `npm run typecheck` | Typkontrollerar TypeScript strikt |
| `npm run validate` | Validerar datat i `DATA_DIR` (`source/data` som standard) och avslutar med felkod vid fel |

Bygget styrs av miljövariabler, alla med en standard som passar lokalt; vad de betyder
står i [`06-MILJOER.md`](06-MILJOER.md):

```bash
BASE_PATH=/stattared4h/ npm run build      # bas-sökväg, standard /
DATA_DIR=source/data-qa npm run build      # dataset, standard source/data
BUILD_VERSION=1.0.4 npm run build          # version i sidfoten; lokalt räknas den fram
```

`npm run lint:yaml` kräver [yamllint](https://yamllint.readthedocs.io/), som installeras
med `pip install yamllint`.

`npm run validate` kontrollerar också bildfilerna när bildkatalogen finns:
`source/images-qa` för `DATA_DIR=source/data-qa`, annars `source/images`. Saknas katalogen
hoppas filkontrollen över och det står i utskriften.

Två varningar är värda att städa bort när de dyker upp: en bildpost som ingen refererar,
och en bildfil som ingen bildpost hör till. Ingen av dem når besökaren, men båda ligger
kvar i git-historiken för alltid.

---

## 4. Arbetsflöde

Hela processen — från samsyn till merge — står i [`../CLAUDE.md`](../CLAUDE.md) §8. Den
gäller människor lika mycket som AI-agenter. I korthet:

- Aldrig direkt på `main`. Ny gren för varje ändring.
- Krav först, sedan dokumentation och spårbarhet, sedan tester, sedan kod.
- Commit-meddelanden på svenska, i formen `funktion:`, `fix:`, `dokumentation:`, `test:`.
- Ett arkitektoniskt betydande beslut landar med en ADR i samma pull request.
- Merge till `main` deployar. `main` ska alltid gå att släppa.

---

## 5. Kontroller som körs automatiskt

Varje push och pull request kör dessa. Alla måste vara gröna innan något kan läggas
in i `main`.

| Kontroll | Vad den gör |
| --- | --- |
| Secret scan | Skannar hela git-historiken efter lösenord, nycklar och tokens |
| CodeQL | Säkerhetsanalys av källkoden, plus en gång i veckan |
| Dependency review | Stoppar nya beroenden med kända allvarliga sårbarheter |
| Project checks | Kör bygget, lint (inklusive dokumentkontrollen `npm run lint:docs`), typkontroll och tester |
| Markdown lint | Lintar all dokumentation |
| YAML lint | Lintar datafiler och konfiguration |
| Workflow lint | Kontrollerar arbetsflödena i `.github/workflows/` |
| Documentation links | Verifierar att dokumentationens interna länkar pekar rätt |

När du öppnar en pull request fylls mallen i `.github/pull_request_template.md` i
automatiskt. Gå igenom den — den är en checklista, inte en formalitet.

Två arbetsflöden deployar, och de är inte kontroller:

| Arbetsflöde | När det kör | Vad det gör |
| --- | --- | --- |
| Deploy till QA | Av sig självt när *Quality* blivit grön på `main` | Deployar QA under `/qa/` och bygger om produktionen med senaste taggens kod och `main`:s innehåll |
| Deploy till produktion | När någon startar det och godkänner i miljön `production` | Släpper `main` till produktionen, sätter en tagg och skriver en Release |

Stegen för ett släpp står i [`08-SLAPP.md`](08-SLAPP.md).

Bakgrunden till varför säkerheten ser ut så här står i
[`07-SAKERHET.md`](07-SAKERHET.md) och [ADR 0011](adr/0011-sakerhetslage-for-publikt-repo.md).

---

## 6. När en bild måste bort av rättighetsskäl

Att radera filen räcker inte: den ligger kvar i git-historiken och går att hämta fram.
Måste en bild bort på riktigt — för att någon på bilden ber om det, eller av
upphovsrättsliga skäl — krävs en omskrivning av historiken och en tvingad push, och att
alla med en lokal kopia hämtar om repot.

Det är ett ingrepp som ska göras medvetet och samordnat, inte i förbifarten. Kontakta den
som förvaltar repot.

---

## 7. Lintning och stil

- CSS använder enbart variablerna i `source/assets/css/tokens.css`. Stylelint fäller ett
  hårdkodat färg-, spacing- eller typografivärde utanför den filen (`02-§9.3`).
- Markdown lintas. Rader bryts vid rimlig längd.
- TypeScript typkontrolleras strikt med `npm run typecheck`.
- Kod och fältnamn på engelska, allt en människa läser på svenska
  ([ADR 0006](adr/0006-sprak-i-kod-och-dokumentation.md)).
