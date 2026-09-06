# Pull request

## Sammanfattning

Beskriv vad som ändrats och varför.

## Förankring

- [ ] Ändringen spåras till ett krav i `docs/02-krav/` med rätt `02-§`-ID.
- [ ] Beteendeförändringar uppdaterar kravdokumentet i samma ändring.
- [ ] Arkitektoniskt betydande beslut har en ADR i den här pull requesten.
- [ ] Spårbarhetsmatrisen i `docs/99-sparbarhet/` är uppdaterad.

## Testplan

Beskriv hur ändringen är verifierad. Lista manuella kontrollpunkter med konkreta steg,
till exempel *"öppna platssidan i 360 px bredd och bekräfta att djurslagen syns utan
att rulla"*.

- [ ] Bygge, lint, typkontroll och tester är gröna lokalt.
- [ ] UI-ändringar är använda i en webbläsare, i mobil- och desktopbredd.

## Säkerhet och integritet

- [ ] Jag har granskat diffen efter lösenord, tokens, nycklar, privata värdnamn,
      adresser och personuppgifter.
- [ ] Ingen hemlighet finns i kod, tester, testdata, kommentarer eller
      commit-meddelanden.
- [ ] Nya beroenden är nödvändiga, och jag har kontrollerat deras ursprung och underhåll.
- [ ] Ändringen samlar inte in personuppgifter om besökare (se ADR 0010).

Beskriv förändringar som rör autentisering, behörighet, hantering av indata eller
hemligheter, nätverksexponering, beroenden eller CI-behörigheter. Skriv `Inga` om det
inte finns några.
