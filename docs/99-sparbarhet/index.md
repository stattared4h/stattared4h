# Spårbarhet

Matrisen kopplar ihop krav, dokumentation, test och implementation. Den svarar på två
frågor: *är det här kravet faktiskt byggt?* och *varför finns den här koden?*

---

## Statusvärden

| Status | Betydelse |
| --- | --- |
| `saknas` | Kravet är formulerat men inget är byggt |
| `dokumenterad` | Beskrivet i arkitektur eller design, inte byggt |
| `byggd` | Implementerad och täckt av test |
| `manuell` | Går inte att testa i kod; verifieras för hand med angivet steg |

Ett krav med status `manuell` måste ha ett konkret verifieringssteg i anteckningsfältet.
"Kontrollera att det ser bra ut" duger inte; "öppna bingosidan i 360 px bredd och bekräfta
att brickan får fem kolumner" duger. <!-- 99-§1.1 -->

---

## Läget nu

Repot innehåller ramverket — process, beslut, datakontrakt och design — men ännu ingen
sajt. Statusen nedan speglar det ärligt.

### Designspecifikation (`05-§`)

| ID-intervall | Ämne | Status | Anteckning |
| --- | --- | --- | --- |
| `05-§1` | Designfilosofi | `dokumenterad` | Vägledande, inte testbar |
| `05-§2.1`–`2.11` | Färgpalett | `byggd` | Levererad i `source/assets/css/tokens.css` |
| `05-§2.12`–`2.18` | Kontrastregler och mörkt läge | `dokumenterad` | Ett kontrasttest över tokens saknas ännu |
| `05-§3` | Typografi | `byggd` | Tokens finns; `base.css` saknas |
| `05-§4` | Layout och spacing | `byggd` | Tokens finns; `layout.css` saknas |
| `05-§5` | Brytpunkter | `dokumenterad` | Tillämpas när layouten skrivs |
| `05-§6` | Komponenter | `saknas` | Skrivs när markupen finns, enligt `05-§7.2` |
| `05-§7.4` | Designtokens | `byggd` | `source/assets/css/tokens.css` |
| `05-§7.1`, `7.5` | Inga hårdkodade värden | `saknas` | Kräver en lint-regel |
| `05-§8` | Bilder | `dokumenterad` | Bildpipeline saknas |
| `05-§9` | Tillgänglighet | `dokumenterad` | Delvis testbar när markupen finns |
| `05-§10` | Vad man inte gör | `dokumenterad` | Delvis kontrollerbar med lint |

### Datakontrakt (`04-§`)

| ID-intervall | Ämne | Status | Anteckning |
| --- | --- | --- | --- |
| `04-§1`–`04-§6` | Schema för djur, aktiviteter, platser, skattjakter | `dokumenterad` | Inga datafiler finns ännu |
| `04-§7` | Validering | `saknas` | Valideraren är nästa steg |

### Krav (`02-§`)

| ID-intervall | Ämne | Status | Anteckning |
| --- | --- | --- | --- |
| `02-§1` | Målgrupp | `dokumenterad` | Vägledande, inte testbar |

### Vad som inte spåras här

Två sorters dokument har medvetet inga `§`-ID och står därför utanför matrisen:

- **ADRerna** i `docs/adr/`. De dokumenterar beslut, inte krav. Ett beslut är inte
  "byggt" eller "saknas" — det gäller eller är ersatt av ett senare beslut.
- **`docs/07-SAKERHET.md`** och `SECURITY.md`. De är vägledning och policy för den som
  förvaltar repot, inte krav på sajten. Att skyddet faktiskt fungerar verifieras av
  CI-kontrollerna själva, inte av den här matrisen. <!-- 99-§1.3 -->

---

## Summering

| Status | Antal ID-intervall |
| --- | --- |
| `byggd` | 4 |
| `dokumenterad` | 9 |
| `saknas` | 3 |
| `manuell` | 0 |

Summeringen uppdateras i fas 5 av processen i `CLAUDE.md`. <!-- 99-§1.2 -->
