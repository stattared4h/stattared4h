# Att bidra

Den här sajten förvaltas av Stättareds 4H-gård. Det mesta som behöver ändras är
**innehåll** — ett nytt djur, en ändrad öppettid, en ny aktivitet — och det kräver ingen
utvecklarmiljö.

---

## 1. Ändra innehåll utan att installera något

Gårdens data ligger som textfiler i det här repot och går att redigera direkt i GitHubs
webbgränssnitt.

1. Gå till filen, till exempel `source/data/animals/rosa.yaml`.
2. Klicka på pennan för att redigera.
3. Gör ändringen. Följ mönstret som redan finns i filen, och slå upp fälten i
   [`04-DATAKONTRAKT.md`](04-DATAKONTRAKT.md) om något är oklart.
4. Välj **Create a new branch** och skapa en pull request.
5. Kontrollerna körs automatiskt. Blir de gröna kan ändringen granskas och läggas in.
   Blir de röda står det i meddelandet vad som är fel — oftast ett stavfel i ett datum
   eller ett djur som pekar på en plats som inte finns.

Bilder läggs i `source/images/` och refereras från djurets post. Varje bild behöver
alternativtext och en uppgift om vem som tagit den.

**Ta aldrig bort ett djur ur filen när det lämnar gården.** Sätt `status: gone`.
Att radera posten bryter länkar och raderar historien.

---

## 2. Utvecklingsmiljö

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
| `npm test` | Kör enhetstester och datavalidering |
| `npm run lint` | Lintar HTML, CSS, TypeScript och Markdown |
| `npm run validate` | Kör bara datavalideringen, med varningar |

Allt ska vara grönt innan du commit:ar. Aktivera de delade git-hookarna en gång:

```bash
git config core.hookspath .githooks
```

---

## 3. Arbetsflöde

Hela processen — från samsyn till merge — står i [`../CLAUDE.md`](../CLAUDE.md) §8. Den
gäller människor lika mycket som AI-agenter. I korthet:

- Aldrig direkt på `main`. Ny gren för varje ändring.
- Krav först, sedan dokumentation och spårbarhet, sedan tester, sedan kod.
- Commit-meddelanden på svenska, i formen `funktion:`, `fix:`, `dokumentation:`, `test:`.
- Ett arkitektoniskt betydande beslut landar med en ADR i samma pull request.
- Merge till `main` deployar. `main` ska alltid gå att släppa.

---

## 4. Kontroller som körs automatiskt

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

## 5. När en bild måste bort av rättighetsskäl

Att radera filen räcker inte: den ligger kvar i git-historiken och går att hämta fram.
Måste en bild bort på riktigt — för att någon på bilden ber om det, eller av
upphovsrättsliga skäl — krävs en omskrivning av historiken och en tvingad push, och att
alla med en lokal kopia hämtar om repot.

Det är ett ingrepp som ska göras medvetet och samordnat, inte i förbifarten. Kontakta den
som förvaltar repot.

---

## 6. Lintning och stil

- CSS använder enbart variablerna i `source/assets/css/tokens.css`. Ett hårdkodat
  färgvärde fälls av lintningen.
- Markdown lintas. Rader bryts vid rimlig längd.
- TypeScript typkontrolleras strikt.
- Kod och fältnamn på engelska, allt en människa läser på svenska
  ([ADR 0006](adr/0006-sprak-i-kod-och-dokumentation.md)).
