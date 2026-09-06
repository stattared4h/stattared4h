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

## Var kraven kommer ifrån

Uppdrag kommer in som **GitHub-issues**. Där formuleras målbilden med acceptanskriterier,
och där förs diskussionen med gården. <!-- 02-§2.1 -->

Issues är intaget; den här katalogen är det varaktiga registret. Ett issue stängs när
arbetet är gjort, men kravet ska gå att läsa i repot om fem år. Därför skrivs varje
överenskommet krav in här med ett `02-§`-ID, och issue-numret noteras intill. <!-- 02-§2.2 -->

Går ett beslut emot vad ett issue säger — vilket har hänt, se
[ADR 0012](../adr/0012-ingen-individuell-platssparning.md) — kommenteras issuet med skälet,
så att avvikelsen syns där kravet väcktes. <!-- 02-§2.3 -->

---

## Kartan över kravfiler

Kraven delas upp i ämnesfiler allteftersom de skrivs. Varje fil äger ett intervall av
`02-§N`, och intervallet står här. Nya kravområden läggs till i tabellen när de skapas.

| Fil | Ämne | Avsnitt |
| --- | --- | --- |
| `index.md` (denna) | Målgrupp, kravkonventioner och intag | §1, §2 |

Kravfiler skrivs i takt med att funktioner tas fram, enligt fas 1 i `CLAUDE.md`. Att den
här tabellen är kort betyder att sajten är i sin början — inte att kraven saknas.
