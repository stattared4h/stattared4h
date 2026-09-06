# Att bidra

Den här sajten förvaltas av Stättareds 4H-gård. Det mesta som behöver ändras är
**innehåll** — ett nytt djur, en ändrad öppettid, en ny aktivitet — och det kräver ingen
utvecklarmiljö.

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
  - file: rosa-1.webp
    alt: Rosa, en brun get med vit nos, tittar rakt in i kameran.
    credit: Anna Andersson
    portrait: true
```

Bara `name`, `species`, `sex` och `status` måste vara med. Vet du inte födelsedatumet kan
du skriva bara årtalet, `born: 2021`, eller utelämna raden.

`species` och `breed` måste finnas i `source/data/species.yaml` respektive
`source/data/breeds.yaml`. Saknas arten lägger du till den där först.

`mother` och `father` är filnamnen på föräldrarna utan `.yaml`. Finns föräldern inte i
registret utelämnar du raden — skriv inte ett namn, för fältet vill ha ett id.

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

Lägg bilden i `source/images/animals/` och referera bara filnamnet från djurets `photos`.
Filnamnet ska börja med djurets id: `rosa-1.webp`.

Bilden ska vara webbanpassad innan den läggs in — WebP, högst 1600 pixlar på längsta sidan
och högst 250 KB — och EXIF ska vara borttaget, eftersom mobilfoton annars bär med sig
GPS-positionen där bilden togs. Se [ADR 0008](adr/0008-bilder-i-repot.md).

Varje bild behöver `alt` som beskriver vad man ser, och `credit` med den som tagit den.
Publicera aldrig en bild på en identifierbar person utan samtycke.

### Vad som händer sedan

Kontrollerna körs automatiskt på din pull request. Blir de gröna kan en administratör
lägga in ändringen, och sajten byggs om inom några minuter.

Blir en kontroll röd står det i meddelandet vad som är fel. De vanligaste är ett datum som
inte finns, en art som inte är upplagd, eller en förälder som stavats fel. Rätta i samma
pull request — kontrollerna körs om av sig själva.

---

## 3. Utvecklingsmiljö

Node 22 eller senare.

```bash
git clone https://github.com/stattared4h/stattared4h.git
cd stattared4h
npm install
npm start          # utvecklingsserver med omladdning
```

Andra kommandon:

| Kommando | Gör |
| --- | --- |
| `npm run build` | Bygger sajten till `public/` |
| `npm run serve` | Serverar `public/` utan att bygga om |

Bygget tar `BASE_PATH`, med `/` som standard:

```bash
BASE_PATH=/stattared4h/ npm run build
```

Kommandona `npm test`, `npm run lint` och `npm run validate` finns ännu inte — de
tillkommer med valideraren och testerna. Spårbarhetsmatrisen visar vad som finns.

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
| Project checks | Kör projektets egna lint-, typkontroll-, bygg- och testskript |
| Markdown lint | Lintar all dokumentation |
| YAML lint | Lintar datafiler och konfiguration |
| Workflow lint | Kontrollerar arbetsflödena i `.github/workflows/` |
| Documentation links | Verifierar att dokumentationens interna länkar pekar rätt |

När du öppnar en pull request fylls mallen i `.github/pull_request_template.md` i
automatiskt. Gå igenom den — den är en checklista, inte en formalitet.

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

- CSS använder enbart variablerna i `source/assets/css/tokens.css`. Ett hårdkodat
  färgvärde fälls av lintningen.
- Markdown lintas. Rader bryts vid rimlig längd.
- TypeScript typkontrolleras strikt.
- Kod och fältnamn på engelska, allt en människa läser på svenska
  ([ADR 0006](adr/0006-sprak-i-kod-och-dokumentation.md)).
