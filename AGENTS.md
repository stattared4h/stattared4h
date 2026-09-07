# AGENTS.md – instruktioner för AI-agenter

Detta är startpunkten för **alla AI-agenter** som arbetar i repot, oavsett leverantör
eller verktyg (ChatGPT, Codex, Claude Code, GitHub Copilot eller annan agent).

## Börja här – obligatoriskt

1. Läs **hela `CLAUDE.md` innan du analyserar eller ändrar något**. Trots filnamnet är
   den repots gemensamma, stående instruktion för människor och alla AI-agenter.
2. Läs därefter de dokument under `docs/` som `CLAUDE.md` pekar ut för uppgiften.
3. Vid ny funktion, bugg, refaktorering, dataändring eller dokumentationsändring: följ
   **`CLAUDE.md` §8 Utvecklingsprocess, fas 0–8, i ordning**. Hoppa inte över en fas.
4. Kontrollera alltid aktuell `main` och befintliga krav/ADR/datakontrakt innan du
   föreslår eller implementerar en lösning.

## Fasgrindar som är lätta att missa

- **Fas 0 – Samsyn:** diskutera och ifrågasätt uppdraget innan krav eller kod skrivs.
- **Fas 1 – Krav:** krav och acceptanskriterier före implementation.
- **Fas 2 – Dokumentation och spårbarhet:** arkitektur/design/datakontrakt vid behov,
  samt spårbarhet med status `saknas`.
- **Fas 3 – Tester:** skriv testbara acceptanskriterier som tester före implementation.
- **Fas 4 – Implementation:** implementera tills testerna är gröna. **Stanna sedan för
  användarens lokala granskning** innan fas 5.
- **Fas 5 – Granskning och spårbarhet:** kontrollera hela kedjan krav → dokumentation →
  test → implementation och uppdatera slutlig spårbarhet.
- **Fas 6 – Slutkontroll:** strukturerade granskningsvarv; UI ska faktiskt användas i
  webbläsare när miljön medger det. Om det inte går ska det sägas uttryckligen.
- **Fas 7 – Ombasering och PR:** basera om mot aktuell `main`, kör kontroller igen och
  skapa PR.
- **Fas 8 – CI, merge och städning:** alla kontroller gröna. **Merge kräver alltid
  användarens uttryckliga godkännande.**

Denna lista är endast en navigeringshjälp. Om den och `CLAUDE.md` skiljer sig gäller
`CLAUDE.md`; rätta då `AGENTS.md` i samma ändring.

## Innan du säger ”klart”

Kontrollera minst att:

- alla tillämpliga faser 0–8 faktiskt har genomförts,
- krav, datakontrakt, ADR/design och spårbarhet är konsekventa,
- QA-data och tester täcker relevanta normalfall och edge cases,
- inga befintliga tester har försvagats för att få CI grönt,
- hela CI är grön,
- manuella kontrollpunkter är genomförda eller uttryckligen redovisade,
- användaren har godkänt merge när ändringen ska till `main`.

Säg aldrig att en funktion är färdig enbart för att implementationen finns eller för
att en enskild CI-kontroll är grön.
