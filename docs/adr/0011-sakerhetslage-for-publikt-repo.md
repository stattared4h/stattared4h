# 0011 — Säkerhetsläget för ett publikt repo

**Status:** Antagen, 2026-09-06 (efterhandsdokumenterad)

## Sammanhang

Repot är publikt från början. Det är rätt för en ideell förening — det gör arbetet
granskningsbart och sänker tröskeln för den som vill hjälpa till — men det innebär att
git-historik, commit-uppgifter, grenar, ärenden och Actions-loggar är läsbara för vem som
helst, för alltid. En hemlighet som commit:as är röjd i samma ögonblick, även om den tas
bort en minut senare.

Två saker gör risken konkret här. Sajten handlar om en gård där barn rör sig, så
personuppgifter och bilder är känsligare än i ett vanligt kodprojekt. Och repot kommer att
ta emot kod skriven av AI-agenter och tillfälliga medarbetare, där ingen enskild person
har full överblick över varje diff.

Den här ADR:n dokumenterar i efterhand det säkerhetsläge som infördes innan någon
applikationskod fanns, så att skälen finns nedskrivna och går att ompröva.

## Beslut

Skyddet ligger i tre lager, och alla tre är automatiska.

**Innan kod når repot:** `.gitignore` täcker nycklar, certifikat, inloggningsfiler och
lokala miljöfiler. GitHubs push protection och secret scanning är påslagna.

**När en pull request öppnas:** Gitleaks skannar hela historiken, CodeQL analyserar
källkoden, dependency review stoppar beroenden med kända allvarliga sårbarheter, och
lintning av Markdown, YAML och arbetsflöden körs. En kontroll verifierar att
dokumentationens interna länkar pekar rätt.

**I hur CI körs:** GitHub Actions är låsta till commit-SHA i stället för rörliga taggar.
Arbetsflöden är läsbehöriga som standard och höjer behörighet per jobb. Utcheckningar
använder `persist-credentials: false`. Beroenden installeras med `--ignore-scripts`, så
ett komprometterat paket inte kan köra installationshakar i CI.

`main` skyddas av ett regelverk som kräver pull request, linjär historik och gröna
kontroller.

## Övervägda alternativ

- **Privat repo** — avvisad: gör arbetet ogranskningsbart utifrån och löser inget som de
  här lagren inte löser. Ett privat repo som senare görs publikt tar dessutom med sig hela
  sin historik, vilket är det farligaste av alla lägen.
- **Enbart manuell granskning** — avvisad: en hemlighet i en diff är precis det en trött
  människa missar, och en del av arbetet görs av agenter.
- **Rörliga taggar för Actions** (`@v4`) — avvisad: en tagg kan flyttas av den som äger
  den, vilket gör varje körning till ett förtroendebeslut om en tredje part. En SHA kan
  inte flyttas.
- **Krav på godkännande av en andra person** — avvisad *tills vidare*: föreningen har
  inte alltid två personer tillgängliga, och ett krav som inte går att uppfylla leder till
  att skyddet kringgås. Kontrollerna är automatiska i stället.

## Konsekvenser

- Ingen kod når `main` utan att ha passerat hemlighetsskanning, kodanalys och
  beroendegranskning.
- Bidrag går långsammare. En röd kontroll blockerar, även när ändringen är trivial. Det
  är avsikten.
- Uppdateringar av Actions kräver att en SHA byts för hand, med Dependabot som hjälp.
  Något mer arbete, i utbyte mot att ingen tredje part kan ändra vad vår CI kör.
- Skyddet gäller repot, inte sajten. Att sajten inte samlar in personuppgifter är ett
  eget beslut, [ADR 0010](0010-ingen-sparning-av-besokare.md), och det som skyddar
  besökarna.
- Delar av läget bor i GitHubs inställningar och inte i filer. `docs/07-SAKERHET.md` §8
  listar dem, så att de går att kontrollera vid ett ägarbyte.
