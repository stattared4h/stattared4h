# 0010 — Inga personuppgifter om besökare, och inga konton i fas 1

**Status:** Antagen, 2026-09-06

## Sammanhang

Sajten vänder sig till familjer och skolklasser, och barn använder den. Barn är särskilt
skyddade i dataskyddsförordningen, och en ideell förening har varken juridisk kompetens
eller uthållighet att förvalta personuppgifter om minderåriga över tid.

En sak ligger dessutom nära till hands att göra fel: kartan och framtida skattjakter vill
gärna veta var besökaren är, och platsdata om ett barn är känsligt.

## Beslut

Sajten samlar inte in några personuppgifter om besökare. Ingen analysplattform, inga
tredjepartskakor, inga inbäddningar som spårar, inga formulär som lagrar uppgifter om den som
besöker sajten.

I fas 1 finns inga konton alls ([ADR 0013](0013-faser-admin-nu-skriv-api-sedan.md)). I fas 2
får redaktörer och administratörer inloggning — det är personuppgifter om ett fåtal vuxna
medarbetare, hanterade av föreningen, och något helt annat än att spåra besökare. Den gränsen
är avsiktlig och ska inte suddas.

Behöver en sida komma ihåg något åt besökaren sparas det i `localStorage` i deras egen
webbläsare. Det lämnar aldrig enheten.

Platsdata hämtas bara efter uttrycklig handling från besökaren, används bara i stunden, och
sparas eller skickas aldrig någonstans.

## Övervägda alternativ

- **Anonymiserad besöksstatistik, exempelvis Plausible eller Matomo** — avvisad *tills
  vidare*: mindre integritetskänsligt än de stora alternativen, men fortfarande ett externt
  anrop från en barnsajt, en kostnad och ett biträdesavtal. Vill föreningen ha statistik bör
  den utgå från serverns loggar eller komma tillbaka som en egen ADR.
- **Konton även för besökare** — avvisad: precis det ansvar vi inte ska ta på oss.
- **Kakor i stället för `localStorage`** — avvisad: kakor skickas med varje anrop och drar in
  samtyckeskrav utan att lösa något.

## Konsekvenser

- Ingen kakbanner behövs, eftersom det inte finns något att samtycka till.
- Vi vet inte hur mycket sajten används. Det accepteras medvetet.
- Varje framtida funktion som vill lagra något om en **besökare** — anmälan, tävlingsbidrag,
  högsta poäng med namn — river det här beslutet och kräver en ny ADR, inte bara ett nytt
  formulär.
