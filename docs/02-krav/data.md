# Krav — Data och validering

Del av [kravindexet](./index.md). Den här filen äger `02-§6`.

Issues: [#4](https://github.com/stattared4h/stattared4h/issues/4),
[#5](https://github.com/stattared4h/stattared4h/issues/5).

---

## 6. Data och validering

### Bakgrund

Datastrukturen står i [`04-DATAKONTRAKT.md`](../04-DATAKONTRAKT.md) och upprepas inte
här. Kraven nedan säger vad bygget gör med datat, vad valideringen fäller och hur den
talar med redaktören. Tre saker avgjordes när kraven skrevs: okända fält är fel, så att
ett felstavat fältnamn inte tyst ignoreras; `born` normaliseras av valideraren, eftersom
YAML läser `2021-04-12` som datum och `2016` som heltal; och sorteringen är svensk, så
att Å, Ä och Ö hamnar sist och inte bland A och O.

### Läsning och validering

- Bygget läser datasetet i `DATA_DIR` (`06-§2.1`). Det läser bara `*.yaml`; andra filer i
  katalogen, som `README.md`, ignoreras. <!-- 02-§6.1 -->
- Valideringen körs först i bygget. Fäller den skrivs ingenting till
  `public/`. <!-- 02-§6.2 -->
- Valideringen fäller vid varje fel i `04-§10`, och dessutom vid ett fält som inte finns i
  kontraktet. <!-- 02-§6.3 -->
- Valideringen varnar, utan att fälla, vid ett djur utan foto, en aktiv plats utan
  djurslag, en aktiv plats utan koordinater, en art utan bild, och en art vars djur med
  `status: here` inte finns på någon aktiv plats. <!-- 02-§6.4 -->
- Varje fel och varning skrivs på svenska med fil, fält och vad som ska rättas, så att en
  redaktör förstår meddelandet i pull requestens logg. <!-- 02-§6.5 -->
- `npm run validate` kör valideringen ensam mot `DATA_DIR` och avslutar med felkod vid
  fel. <!-- 02-§6.6 -->
- `born` tas emot som datum, heltal eller text, normaliseras till text på formen
  `YYYY-MM-DD` eller `YYYY`, och fälls om värdet inte är ett giltigt datum eller ligger i
  framtiden. <!-- 02-§6.7 -->

### Härledning och sortering

- Härledningarna i `04-§8` räknas i en modul utan webbläsar-API:er
  (`03-§3.1`). <!-- 02-§6.8 -->
- Alla listor sorteras deterministiskt: djur efter namn i svensk ordning, sedan id;
  platser efter namn, sedan id; arter i den ordning de står i
  `species.yaml`. <!-- 02-§6.9 -->

### Tester

- Testerna körs mot `source/data-qa/` (`06-§2.2`). QA-datat är alltid giltigt; varje
  regel som fäller prövas med en ogiltig post skriven i testet, inte i
  datasetet. <!-- 02-§6.10 -->
- Ett test bevakar att inget djur i något dataset har ett `location`-fält
  (`04-§4.2`). <!-- 02-§6.11 -->
