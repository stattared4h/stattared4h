# 0014 — Rollerna upprätthålls av GitHub, inte av vår kod

**Status:** Antagen, 2026-09-06

## Sammanhang

Underlaget beskriver tre roller: anonym, redaktör och admin, med kravet att behörighet
verifieras i backend och inte bara genom att gömma knappar i gränssnittet.

Systersajten SB Sommar löser det med en signerad token på formen
`namn_roll_epoch_sig`, en HMAC-SHA256 med hemligheten `ADMIN_TOKEN_SECRET` i serverns
miljö. Tokens är självvaliderande — ingen lista över utfärdade tokens finns — och rollerna
är `admin`, `early` och `superadmin`.

Den modellen kräver en server, eftersom signeringshemligheten aldrig kan ligga i
webbläsaren. Och hela dess poäng är att användaren **slipper** ha ett GitHub-konto.

I fas 1 har vi ingen server ([ADR 0013](0013-faser-admin-nu-skriv-api-sedan.md)), och
redaktörerna har GitHub-konton eftersom de redigerar via pull request.

## Beslut

I fas 1 är GitHub autentiseringen. Rollerna upprätthålls av repots behörigheter och av
regelverket på `main`, inte av kod vi skriver.

| Roll | GitHub-behörighet | Kan |
| --- | --- | --- |
| Besökare | ingen | Läsa den publicerade sajten |
| Redaktör | Write | Skapa gren, ändra data, öppna pull request |
| Administratör | Maintain eller Admin | Merga pull request |

Regelverket kräver pull request till `main`, så en redaktör kan inte skriva direkt till
den publicerade sajten. CI validerar datat på vägen, så en trasig ändring når aldrig
besökarna.

Vi inför **ingen** egen token i fas 1. Att lägga ett eget inloggningssystem ovanpå
GitHubs vore ett andra, svagare skydd för samma sak.

Token-modellen hör till fas 2 och blir aktuell först den dag redaktörer inte ska behöva
GitHub-konto. Då finns servern som kan hålla hemligheten, och SB Sommars format kan
återanvändas.

## Övervägda alternativ

- **Egen token redan nu** — avvisad: den kan inte valideras utan server, och med
  GitHub-konton som ändå krävs skyddar den ingenting som repobehörigheten inte redan
  skyddar.
- **Alla redigerar direkt på `main`** — avvisad: ingen validering hinner köra före
  publicering, och rollen redaktör blir omöjlig att skilja från administratör.
- **Kräva en godkännande-granskning på varje PR** — avvisad *tills vidare*, se nedan.

## Konsekvenser

- Rollmodellen kostar ingen kod och ingen drift. Den är dessutom granskningsbar: varje
  ändring har en namngiven upphovsperson och en tidpunkt.
- Redaktören måste ha ett GitHub-konto och lära sig en enkel väg genom webbgränssnittet.
  `docs/01-BIDRA.md` §1 beskriver den steg för steg.
- **Gränsen mellan redaktör och administratör är ännu inte skarp.** Regelverket kräver
  pull request men `required_approving_review_count` är `0`, så den som har skrivrätt kan
  merga sin egen. Höjs värdet till `1` blir gränsen verklig — men då kan en ensam
  administratör inte längre merga sitt eget arbete. Så länge gården har en enda redaktör
  vore kravet bara i vägen. Det höjs den dag en andra redaktör faktiskt finns, och det är
  ett medvetet uppskjutet beslut och inte ett förbiseende.
- Redaktörer får läsa hela repot, inklusive utkast. Med `status`-flaggan som enda
  utkastmekanism är det acceptabelt; det är gårdens egna medarbetare.
