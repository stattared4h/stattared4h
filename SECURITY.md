# Säkerhetspolicy

Det här repot är publikt. Allt som läggs i det — git-historik, grenar, taggar,
commit-uppgifter, ärenden och loggar från GitHub Actions — är synligt för vem som helst.
Det får därför aldrig innehålla giltiga lösenord, privata nycklar, åtkomsttokens,
privat driftkonfiguration eller personuppgifter.

## Rapportera ett säkerhetsproblem

Öppna inte ett publikt ärende som innehåller lösenord, tokens, privata nycklar,
uppgifter om privata värdar eller en fungerande angreppsbeskrivning.

Rapportera privat i stället:

1. Använd GitHubs privata sårbarhetsrapportering på det här repot
   (**Security → Report a vulnerability**) när den är aktiverad.
2. Kontakta annars den som äger repot privat via deras GitHub-profil, innan du delar
   någon känslig detalj.

Beskriv vad du sett, hur det går att återskapa, och vilken commit eller version det
gäller. Räkna med ett första svar inom några arbetsdagar.

## Om en hemlighet hamnat i repot

Betrakta en hemlighet som röjd så snart den commit:ats, även om commiten ångras inom
någon sekund. Att radera en fil i en senare commit tar inte bort den ur tidigare
historik, och publika repon klonas, förgrenas och speglas automatiskt.

1. Återkalla eller byt ut uppgiften hos tjänsten som utfärdat den. Det är det enda
   steget som faktiskt tar bort risken.
2. Ta bort värdet ur arbetskopian.
3. Skriv om git-historiken om värdet inte får vara åtkomligt, och tvinga fram en push
   med försiktighet.
4. Kontrollera förgreningar, cacher, Actions-loggar och byggartefakter efter kopior.
5. Gå igenom tjänstens åtkomstloggar efter oväntad användning.

## Repohygien

Repot är byggt kring de här reglerna:

- `.env`-filer, lokala åsidosättningar och värdspecifik konfiguration stannar lokalt.
- Privata nycklar, certifikat och vanliga inloggningsfiler ignoreras av `.gitignore`.
- Dokumentationen använder platshållare som `example.com` och `192.0.2.10` i stället för
  verklig infrastruktur.
- GitHub Actions är låsta till commit-SHA, inte till rörliga taggar.
- Arbetsflöden är läsbehöriga som standard och höjer behörighet per jobb.
- CI-utcheckningar sparar inte Actions-token i arbetskopian.
- Beroenden installeras i CI utan livscykelskript.
- Gitleaks skannar hela git-historiken vid varje push och pull request.
- CodeQL analyserar källkoden när sådan finns, plus varje vecka.
- Nya beroenden i en pull request granskas mot kända sårbarheter.

Se [Säkerhet i ett publikt repo](docs/07-SAKERHET.md) för hela checklistan och skälen
bakom varje regel.

## Versioner som stöds

Repot publicerar ännu inga släppta versioner. Säkerhetsrättningar görs på grenen `main`.
