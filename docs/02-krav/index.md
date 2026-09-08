# Krav — index

Vad sajten ska göra, uttryckt som fristående fakta om önskat läge.

*Hur* det byggs står i [`../03-arkitektur/`](../03-arkitektur/index.md);
*varför* i [`../adr/`](../adr/README.md).

---

## Så här skrivs krav

Varje krav är ett **fristående faktum om hur systemet fungerar**, inte en beskrivning av
en ändring. En läsare som aldrig sett kodbasen ska förstå kravet utan att veta vad som
fanns förut.

- **Dåligt**: "Kartsidan ska läggas till i menyn." / "Cacheversionen höjs till v4."
- **Bra**: "Sidhuvudet innehåller en länk till kartan." / "Service workerns cache heter `s4h-v4`."

Undvik orden *ändrad, uppdaterad, ersatt, borttagen, ny, förbättrad*. Bakgrund och motiv
hör hemma i avsnittet **Bakgrund** överst i varje kravsektion — ingen annanstans.

Varje krav får ett stabilt ID i formatet `02-§N.M` som en HTML-kommentar efter texten.
ID:t citeras från tester och spårbarhetsmatrisen och ändras aldrig, inte ens om kravet
flyttas till en annan fil.

---

## 1. Vad sajten är — och inte är

Sajten är ett **komplement** till Stättareds 4H-gårds huvudsida på `4h.se/stattared`.
Den ersätter den inte, och ska inte växa till en andra hemsida för gården. <!-- 02-§1.7 -->

Här bor djuren och hagarna: vem djuret är, vem det är släkt med, och vilka djurslag som
går var. Öppettider, boende, bokningar, nyheter, medlemskap och kontaktuppgifter hör till
huvudsidan och ska inte dupliceras här — ett faktum som står på två ställen slutar
stämma på det ena. <!-- 02-§1.8 -->

Varje sida länkar till huvudsidan i sidfoten. Länken är en permanent väg vidare, inte en
tillfällig hänvisning i väntan på eget innehåll. <!-- 02-§1.9 -->

Tveka aldrig om en funktion hör hemma här: frågan är om den handlar om djuren eller om
platserna de går på. Gör den inte det hör den till huvudsidan. <!-- 02-§1.10 -->

---

## 2. Målgrupp

Sajten har tre läsare, i prioritetsordning: <!-- 02-§2.1 -->

1. **Besökaren på gården**, med mobilen i handen framför en hage, som vill veta vilka djur
   som går där och vad de heter. Ojämn täckning. Ofta sol i skärmen. <!-- 02-§2.2 -->
2. **Barnet**, i grundskoleåldern, som vill känna igen djuret det just klappat. Läser inte
   långa texter. <!-- 02-§2.3 -->
3. **Gårdsmedlemmen som förvaltar innehållet**, som lägger till ett djur utan att vara
   utvecklare. <!-- 02-§2.4 -->

Den som planerar sitt besök hemma vid datorn — öppettider, hitta hit, bokning för skola
eller grupp — är huvudsidans läsare, inte vår. <!-- 02-§2.5 -->

Mobilen är utgångsläget, eftersom sajten framför allt används på plats. Skrivbordsvyn är
fördjupningen för den som vill läsa vidare om djuren hemma. <!-- 02-§2.6 -->

---

## 3. Roller och redigering

Sajten har tre roller. De upprätthålls av GitHubs behörigheter och av regelverket på
`main`, inte av kod i det här repot — se
[ADR 0014](../adr/0014-roller-via-github.md). <!-- 02-§3.1 -->

| Roll | Kan |
| --- | --- |
| Besökare | Läsa den publicerade sajten. Ingen inloggning finns |
| Redaktör | Ändra data och öppna en pull request |
| Administratör | Lägga in en pull request på `main` |

- En redaktör kan inte ändra den publicerade sajten direkt. Varje ändring går genom en
  pull request där datavalidering och lintning körs innan den kan läggas
  in. <!-- 02-§3.2 -->
- Redaktören arbetar i GitHubs webbgränssnitt och behöver ingen utvecklarmiljö.
  `docs/01-BIDRA.md` §2 beskriver vägen steg för steg. <!-- 02-§3.3 -->
- Sajten har ingen egen inloggning och ingen egen token. Autentiseringen är
  GitHubs. <!-- 02-§3.4 -->
- Ett djur som lämnat gården raderas aldrig. Det får `status: gone` och behåller sin sida,
  sin stamtavla och sina bilder. <!-- 02-§3.5 -->

---

## 4. Var kraven kommer ifrån

Uppdrag kommer in som **GitHub-issues**. Där formuleras målbilden med acceptanskriterier,
och där förs diskussionen med gården. <!-- 02-§4.1 -->

Issues är intaget; den här katalogen är det varaktiga registret. Ett issue stängs när
arbetet är gjort, men kravet ska gå att läsa i repot om fem år. Därför skrivs varje
överenskommet krav in här med ett `02-§`-ID, och issue-numret noteras intill. <!-- 02-§4.2 -->

Går ett beslut emot vad ett issue säger — vilket har hänt, se
[ADR 0012](../adr/0012-ingen-individuell-platssparning.md) — kommenteras issuet med skälet,
så att avvikelsen syns där kravet väcktes. <!-- 02-§4.3 -->

---

## Kartan över kravfiler

Kraven delas upp i ämnesfiler allteftersom de skrivs. Varje fil äger ett intervall av
`02-§N`, och intervallet står här. Nya kravområden läggs till i tabellen när de skapas.

| Fil | Ämne | Avsnitt |
| --- | --- | --- |
| `index.md` (denna) | Avgränsning, målgrupp, roller, kravkonventioner och intag | §1–§4 |
| [`sidor.md`](./sidor.md) | Sidtyper, navigering, start-, plats-, djur- och artsida, karta | §5 |
| [`data.md`](./data.md) | Läsning, validering, härledning, sortering, tester | §6 |
| [`offline.md`](./offline.md) | Manifest, service worker, installation | §7 |
| [`bilder.md`](./bilder.md) | Bildfiler, bildkedja, leverans | §8 |
| [`bygge.md`](./bygge.md) | Verktygskedja, kontroller, deploy | §9 |
| [`sidhuvud-sidfot.md`](./sidhuvud-sidfot.md) | Sidhuvud, meny, installation, feedback, sidfot, version | §10 |
| [`bildverktyg.md`](./bildverktyg.md) | Bildverktyget i webbläsaren: adress, beredning, leverans | §11 |
| [`spel.md`](./spel.md) | Spelen: Djurbingo och Spana! — urval, nivåer, avbockning, vinst | §12–§13 |

Filerna ovan täcker fas 1 enligt epic #3 samt det första spelet. Nya kravområden — fler
spel, redaktörsgränssnittet i fas 2 — får egna filer och nästa lediga avsnittsnummer.
