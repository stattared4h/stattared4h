# 0010 — Ingen spårning och inga personuppgifter; spelframsteg bor i webbläsaren

**Status:** Antagen, 2026-09-06

## Sammanhang

Sajtens spel riktar sig till barn. Barn är särskilt skyddade i dataskyddsförordningen, och
en ideell förening har varken juridisk kompetens eller uthållighet att förvalta
personuppgifter om minderåriga över tid.

Samtidigt behöver spelen komma ihåg saker mellan sidladdningar: vilka rutor på bingobrickan
som är fyllda, hur långt en skattjakt kommit, vilka djur besökaren redan gissat rätt på.

En annan sak ligger nära till hands att göra fel: en skattjakt vill gärna veta var
besökaren befinner sig, och platsdata om ett barn är känsligt.

## Beslut

Sajten samlar inte in några personuppgifter. Ingen analysplattform, inga tredjepartskakor,
inga inbäddningar som spårar, inga inloggningar, inga formulär som lagrar uppgifter om
besökaren.

Spelframsteg sparas i `localStorage` i besökarens egen webbläsare. Det lämnar aldrig
enheten och når aldrig oss. Det finns en synlig möjlighet att nollställa framsteget.

Platsdata, om en skattjakt använder det, hämtas bara efter uttrycklig handling från
besökaren, används bara i stunden för att avgöra närhet till en post, och sparas eller
skickas aldrig någonstans.

## Övervägda alternativ

- **Anonymiserad besöksstatistik, exempelvis Plausible eller Matomo** — avvisad *tills
  vidare*: mindre integritetskänsligt än de stora alternativen, men det är fortfarande ett
  externt anrop från en barnsajt, en kostnad och ett personuppgiftsbiträdesavtal att
  förvalta. Vill föreningen ha statistik framöver bör den utgå från serverns loggar eller
  komma tillbaka som en ny ADR med den avvägningen skriven.
- **Konton så att spelframsteg följer med mellan enheter** — avvisad: konton för barn är
  precis det ansvar vi inte ska ta på oss, och nyttan är liten för ett bingospel man spelar
  under ett besök.
- **Framsteg i en kaka i stället för `localStorage`** — avvisad: kakor skickas med varje
  anrop och drar in samtyckeskrav utan att lösa något `localStorage` inte redan löser.

## Konsekvenser

- Ingen kakbanner behövs, eftersom det inte finns något att samtycka till. Det är också
  bättre för besökaren än ett banner som ber om lov att spåra.
- Vi vet inte hur mycket sajten används. Det accepteras medvetet.
- Rensar besökaren sin webbläsardata försvinner spelframsteget. Acceptabelt: spelen är
  korta och hör till besöket.
- Varje framtida funktion som vill lagra något om en besökare — anmälan, tävlingsbidrag,
  högsta poäng med namn — river det här beslutet och kräver en ny ADR, inte bara ett nytt
  formulär.
