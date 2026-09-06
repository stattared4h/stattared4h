# Krav — index

Vad sajten ska göra, uttryckt som fristående fakta om önskat läge.

*Hur* det byggs står i [`../03-arkitektur/`](../03-arkitektur/index.md);
*varför* i [`../adr/`](../adr/README.md).

---

## Så här skrivs krav

Varje krav är ett **fristående faktum om hur systemet fungerar**, inte en beskrivning av
en ändring. En läsare som aldrig sett kodbasen ska förstå kravet utan att veta vad som
fanns förut.

- **Dåligt**: "Bingosidan ska läggas till i menyn." / "Cacheversionen höjs till v4."
- **Bra**: "Huvudmenyn innehåller Bingo." / "Service workerns cache heter `s4h-v4`."

Undvik orden *ändrad, uppdaterad, ersatt, borttagen, ny, förbättrad*. Bakgrund och motiv
hör hemma i avsnittet **Bakgrund** överst i varje kravsektion — ingen annanstans.

Varje krav får ett stabilt ID i formatet `02-§N.M` som en HTML-kommentar efter texten.
ID:t citeras från tester och spårbarhetsmatrisen och ändras aldrig, inte ens om kravet
flyttas till en annan fil.

---

## 1. Målgrupp

Sajten har fyra läsare, i prioritetsordning: <!-- 02-§1.1 -->

1. **Besökaren på gården**, med mobilen i handen, som vill veta vad som händer nu, vilket
   djur den tittar på, och vad man kan göra härnäst. Ojämn täckning. Ofta sol i
   skärmen. <!-- 02-§1.2 -->
2. **Barnet som spelar**, i grundskoleåldern, som använder bingo, gissningsleken och
   skattjakten för att upptäcka gården. Läser inte långa texter. <!-- 02-§1.3 -->
3. **Den som planerar besöket** hemma vid datorn: öppettider, hitta hit, vad som passar
   åldern, bokning för skola eller grupp. <!-- 02-§1.4 -->
4. **Gårdsmedlemmen som förvaltar innehållet**, som lägger till ett djur eller en
   aktivitet utan att vara utvecklare. <!-- 02-§1.5 -->

Mobilen är utgångsläget. Skrivbordsvyn är den fördjupning som läsare 3 får. <!-- 02-§1.6 -->

---

## Kartan över kravfiler

Kraven delas upp i ämnesfiler allteftersom de skrivs. Varje fil äger ett intervall av
`02-§N`, och intervallet står här. Nya kravområden läggs till i tabellen när de skapas.

| Fil | Ämne | Avsnitt |
| --- | --- | --- |
| `index.md` (denna) | Målgrupp och kravkonventioner | §1 |

Kravfiler skrivs i takt med att funktioner tas fram, enligt fas 1 i `CLAUDE.md`. Att den
här tabellen är kort betyder att sajten är i sin början — inte att kraven saknas.
