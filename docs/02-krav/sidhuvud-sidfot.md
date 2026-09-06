# Krav — Sidhuvud, sidfot och version

Del av [kravindexet](./index.md). Den här filen äger `02-§10`.

Issue: [#24](https://github.com/stattared4h/stattared4h/issues/24).
Beslut: [ADR 0004](../adr/0004-pwa-offline-forst.md),
[ADR 0007](../adr/0007-designen-arver-4h-identitet.md),
[ADR 0010](../adr/0010-ingen-sparning-av-besokare.md).

---

## 10. Sidhuvud, sidfot och version

### Bakgrund

Sidhuvudet och sidfoten är gemensamma för alla sidor och bär det som inte hör till någon
enskild sida: navigering, installation, feedback, version och vägen till huvudsidan.
Mönstren är prövade i föreningens andra sajter och tas över: en klistrad rad av
ikonknappar på mobil, en installknapp som bara syns när den kan göra något, feedback
som en förifylld GitHub-issue utan server, och en version i sidfoten som talar om ifall
besökaren ser ett släpp eller en kandidat.

Tre saker avgjordes när kraven skrevs. Sidhuvudet bär bara 4H-loggan; gården har ingen
egen logga, och namnet står i text. Länken till huvudsidan ligger enbart i sidfoten, så
att sidhuvudet får plats i 360 px bredd. Och appikonen är sajtens egen: 4H-loggan får
inte byggas in i egna märken (ADR 0007).

### Sidhuvudet

- Varje sida har samma sidhuvud överst, klistrat i fönstrets topp så att det syns vid
  rullning, med botten `--color-surface` och kantlinje `--color-border`
  (`05-§6.1`). <!-- 02-§10.1 -->
- Första fokuserbara elementet på varje sida är länken "Hoppa till innehållet", som
  leder till `<main>` och syns när den har fokus. <!-- 02-§10.2 -->
- Under desktopbrytpunkten (`05-§5.3`) är sidhuvudet en rad ikonknappar (`05-§6.33`),
  minst `--tap-target-min`: menyknappen längst till vänster, installknappen direkt till
  höger om den, "till toppen" i mitten och feedbackknappen längst till
  höger. <!-- 02-§10.3 -->
- Menyknappen visar tre streck och ordet "Meny", har `aria-expanded` och
  `aria-controls`, och öppnar menyn. <!-- 02-§10.4 -->
- Menyn fälls ut under raden som ett kort (`05-§6.34`) med 4H-loggan överst, följd av
  länkarna "Startsidan", "Karta över gården" och "Om sajten". <!-- 02-§10.5 -->
- Menyn stängs med Escape, med klick utanför den och när en länk väljs. Stängs den
  med Escape återgår fokus till menyknappen. <!-- 02-§10.6 -->
- Från desktopbrytpunkten visar sidhuvudet 4H-loggan till vänster med sajtens namn
  "Djuren på Stättared" som text intill, länkarna "Hem", "Karta" och "Om sajten" i
  raden, och installknappen och feedbackknappen som ikoner utan botten längst till
  höger. Menyknappen och "till toppen" finns inte i den bredden. <!-- 02-§10.7 -->
- Länken för aktuell sida är markerad enligt `05-§6.3` och har
  `aria-current="page"`. <!-- 02-§10.8 -->
- 4H-loggan är förbundets egen SVG, oförändrad, med alternativtexten "4H", och länkar
  till startsidan. <!-- 02-§10.9 -->
- Sidhuvudet innehåller ingen länk till huvudsidan; den finns i sidfoten
  (`02-§1.9`). <!-- 02-§10.10 -->

### Installknappen

- Installknappen är dold tills webbläsaren erbjuder installation. Då visas den, och ett
  tryck visar webbläsarens installationsdialog. När sajten är installerad, eller redan
  körs som installerad app, visas knappen aldrig. <!-- 02-§10.11 -->
- På iOS, som saknar installations-API, visas knappen alltid i webbläsaren, och ett tryck
  växlar en text under sidhuvudet: "Tryck på Dela och välj Lägg till på
  hemskärmen". <!-- 02-§10.12 -->
- Knappen har `aria-label` "Installera appen". <!-- 02-§10.13 -->

### Till toppen

- Knappen "till toppen" är dold tills sidan rullats minst 300 px. Ett tryck rullar till
  sidans topp, mjukt utom när `prefers-reduced-motion` är satt. Knappen har `aria-label`
  "Till toppen". <!-- 02-§10.14 -->

### Feedback

- Feedbackknappen har `aria-label` "Ge feedback" och öppnar en dialog (`05-§6.35`) med
  rubriken "Feedback om sajten", en mening som säger att den gäller sajten och inte
  gården, kategorierna Fel, Förslag och Övrigt, fältet Rubrik (högst 200 tecken) och
  fältet Beskrivning (högst 2 000 tecken). <!-- 02-§10.15 -->
- Knappen "Skicka" är aktiv först när Rubrik och Beskrivning är ifyllda. Ett tryck öppnar
  GitHubs sida för nytt issue i repot i en ny flik med `noopener`, förifylld med
  issue-mallen `feedback.md`, rubriken "[Feedback] <kategori>: <rubrik>", beskrivningen,
  och sist en metadatarad med version, sidans adress, fönstrets storlek, tidpunkt och
  webbläsare. Besökaren ser allt innan issuet skapas och skapar det under sitt eget
  GitHub-konto. <!-- 02-§10.16 -->
- Dialogen håller fokus inom sig, stängs med Escape, med klick utanför den och med
  kryssknappen, och återlämnar fokus till feedbackknappen. Ifyllda fält finns kvar om
  dialogen öppnas igen under samma sidvisning. <!-- 02-§10.17 -->
- Är webbläsaren offline visar dialogen "Du är offline. Feedback kräver uppkoppling."
  och "Skicka" är inaktiv tills nätet är tillbaka. <!-- 02-§10.18 -->
- Repot har issue-mallen `.github/ISSUE_TEMPLATE/feedback.md` med etiketten
  `feedback`. <!-- 02-§10.19 -->
- Sajten skickar aldrig något själv. Det enda som lämnar sidan är den adress
  besökaren själv öppnar (ADR 0010). <!-- 02-§10.20 -->

### Sidfoten

- Varje sida har samma sidfot sist, med botten `--color-green-deep` och vit text
  (`05-§6.30`): 4H-loggan i vit variant med alternativtexten "4H", länken "Stättareds
  4H-gård" till `https://www.4h.se/stattared/`, länken "Källkoden på GitHub" till repot,
  meningen "Sidan samlar inga uppgifter om dig.", och versionen sist i
  `--font-size-small`. <!-- 02-§10.21 -->
- Versionsraden lyder "Version 1.2.0" för ett släpp, "Version 1.2.0 – CR31" för en
  kandidat, "Version 0.0.PR31" före första släppet, "Version 1.2.0 – lokal 2026-09-06
  18:40" för ett lokalt bygge, och får tillägget " – QA" i QA-bygget. Ett CI-bygge utan versionsuppgift visar ingen
  versionsrad. <!-- 02-§10.22 -->

### Version

- Filen `VERSION` i repots rot innehåller huvud- och delversion, `X.Y`. <!-- 02-§10.23 -->
- Första deployen av en ny `X.Y` är släppet: versionen är `X.Y.0`, commiten taggas
  `vX.Y.0`, och en GitHub Release skapas med anteckningarna i `docs/releases/vX.Y.0.md`
  när filen finns. Varje senare deploy på samma `X.Y` är en kandidat: versionen är
  `X.Y.0 – CR<n>` där `n` är numret på den pull request som mergades, och commiten
  taggas `vX.Y.0-CR<n>`. <!-- 02-§10.24 -->
- Så länge `VERSION` är `0.0` finns inget släpp: varje deploy får versionen `0.0.PR<n>`
  med numret på den mergade pull requesten, utan tagg och utan GitHub Release. Första
  släppet är `1.0.0`, den dag `VERSION` sätts till `1.0`. <!-- 02-§10.33 -->
- Versionssträngen når bygget som miljövariabeln `BUILD_VERSION`. Saknas den lokalt
  bygger bygget själv en lokal version ur senaste taggen och klockslaget; saknas den i
  CI sätts ingen version. <!-- 02-§10.25 -->
- Service workerns cachenamn är versionssträngen, så att versionen i sidfoten och cachen
  aldrig pekar på olika byggen (`02-§7.6`). <!-- 02-§10.26 -->

### Om sajten

- Sidan `/om/` visar vad sajten är, att den fungerar offline, hur den läggs på
  hemskärmen i iOS och Android, att den inte samlar in uppgifter om besökaren, länken
  till källkoden, och versionen sist. Texten kommer från `source/content/om.md`; versionen
  sätts av bygget. <!-- 02-§10.27 -->

### Uppdatering och offline

- När service workern har installerat en ny version medan sidan är öppen visas en
  statusrad (`05-§6.36`) under sidhuvudet: "Ny version finns." med knappen "Ladda om".
  Ett tryck tar den nya versionen i bruk och laddar om sidan. <!-- 02-§10.28 -->
- När webbläsaren är offline visas statusraden "Du är offline. Du ser den sparade
  versionen." Raden försvinner när nätet är tillbaka. <!-- 02-§10.29 -->

### Dela

- Plats-, art- och djursidor har knappen "Dela" under sidans `h1`. Ett tryck delar
  sidans titel och adress med enhetens delningsfunktion; saknar webbläsaren den kopierar
  knappen adressen och visar "Länken är kopierad". <!-- 02-§10.30 -->

### Ikoner

- Sajten har en egen appikon, inte 4H-loggan: en enkel grön symbol som fungerar i 48 px.
  Den levereras som `favicon.svg`, `favicon.ico`, `apple-touch-icon.png` i 180 px, och
  manifestets ikoner (`02-§7.1`). <!-- 02-§10.31 -->
- Alla ikoner i sidhuvud, sidfot och knappar är inline-SVG i markupen med
  `aria-hidden="true"`. Inget ikonteckensnitt, inget externt anrop. <!-- 02-§10.32 -->
