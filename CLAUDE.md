# CLAUDE.md – Stättareds 4H-gård

Detta är den stående instruktionen för alla som arbetar i det här repot — människa
som AI-agent. Den innehåller bara varaktiga regler: inget sessionsspecifikt, och inga
fakta som redan bor i koden eller i ett annat dokument.

När den här guiden och koden säger emot varandra har koden rätt och guiden en bugg —
rätta guiden i samma ändring.

Tydlighet före finurlighet.

---

## 0. Referensdokumentation

Läs relevant dokument i `/docs/` **innan** du skriver kod, CSS eller data.
Dokumenten är den auktoritativa källan. CLAUDE.md sammanfattar principer; dokumenten
definierar detaljerna.

| Fil | Vad den styr |
| --- | --- |
| `docs/01-BIDRA.md` | Uppsättning, kommandon, git-arbetsflöde, lintning |
| `docs/02-krav/index.md` | Kravindex — målgrupp, kravkonventioner och karta till ämnesfilerna |
| `docs/03-arkitektur/index.md` | Arkitekturindex — systemöversikt och karta till ämnesfilerna |
| `docs/04-DATAKONTRAKT.md` | YAML-schema för djur, aktiviteter, platser och skattjakter |
| `docs/05-design/index.md` | Designindex — filosofi, färger, typografi, layout, brytpunkter |
| `docs/05-design/komponenter.md` | Komponenternas visuella regler |
| `docs/05-design/css-strategi.md` | Hur CSS skrivs, filstruktur och designtokens i `:root` |
| `docs/05-design/bilder-och-tillganglighet.md` | Bildhantering, fotoregler, tillgänglighetsminimum |
| `docs/06-MILJOER.md` | Lokalt, förhandsvisning och produktion; bas-sökväg och flytt av drift |
| `docs/07-SAKERHET.md` | Säkerhet i ett publikt repo: checklista före push, CI-härdning, GitHub-inställningar |
| `docs/adr/` | Arkitekturbeslut: varför saker ser ut som de gör |
| `docs/99-sparbarhet/index.md` | Spårbarhetsmatris: krav → dokumentation → test → implementation |

### Vem äger vilken sanning

Skriv aldrig om en annan källas fakta — länka i stället. Ett faktum som står på två
ställen är en bugg som väntar på att inträffa.

| Sanning | Ägare |
| --- | --- |
| Vad sajten gör (krav, acceptanskriterier) | `docs/02-krav/` |
| Hur den är byggd (lager, bygge, CI) | `docs/03-arkitektur/` |
| Varför den är byggd så (beslut) | `docs/adr/` |
| Datastruktur för djur och aktiviteter | `docs/04-DATAKONTRAKT.md` |
| Färger, typografi, spacing | CSS-variabler i `source/assets/css/tokens.css` |
| Innehåll om gården, djuren och aktiviteterna | YAML och Markdown under `source/` |
| Säkerhetsmodell och hur problem rapporteras | `SECURITY.md` |

Regler:

- Hitta inte på färger, spacing eller layoutmönster som inte finns i `docs/05-design/`.
- Ändra inte YAML-filer eller schemat utan att först läsa `docs/04-DATAKONTRAKT.md`.
- CSS måste använda variablerna i `docs/05-design/css-strategi.md` — hårdkoda aldrig
  färger, spacing eller typografi.

---

## 1. Grundprinciper

- Statisk byggutdata. <!-- CL-§1.1 -->
- Ingen server och ingen databasmotor i drift. <!-- CL-§1.2 -->
- Inget klientramverk (ingen React, Vue eller motsvarande). <!-- CL-§1.3 -->
- Minimal JavaScript. <!-- CL-§1.4 -->
- Innehållet först. <!-- CL-§1.5 -->
- Tydlig uppdelning mellan innehåll, layout och styling. <!-- CL-§1.6 -->
- Underhållbar av icke-utvecklare. <!-- CL-§1.7 -->
- Snabb på mobil, även på dålig uppkoppling ute på gården. <!-- CL-§1.8 -->
- Fungerar offline när besökaren väl har laddat sajten. <!-- CL-§1.9 -->

### Språk

- Sajten är på svenska. All text besökaren ser — etiketter, rubriker, beskrivningar,
  felmeddelanden, bekräftelser — ska vara på svenska. <!-- CL-§1.10 -->
- All dokumentation, alla ADRer och alla commit-meddelanden skrivs på svenska. <!-- CL-§1.11 -->
- Kod är engelsk: variabelnamn, funktionsnamn, filnamn, YAML-fältnamn och kommentarer
  i kodfiler. Gränsen går vid filen — allt inuti en kodfil är engelskt, varje fristående
  dokument är svenskt. Det håller koden konsekvent med de bibliotek och verktyg den vilar
  på. Se ADR 0006. <!-- CL-§1.12 -->
- När du skriver krav i `docs/02-krav/`: beskriv **önskat läge**, inte
  "ändringar" eller "förbättringar". <!-- CL-§1.13 -->
  - Skriv varje krav som ett fristående faktum om hur systemet fungerar. En läsare som
    aldrig sett koden ska förstå kravet utan att veta vad som fanns förut.
  - **Dåligt**: "Cacheversionen ska höjas till v4." / "Bingosidan ska läggas till i menyn."
  - **Bra**: "Service workerns cache heter `s4h-v4`." / "Huvudmenyn innehåller Bingo."
  - Undvik ord som: "ändrad", "uppdaterad", "ersatt", "borttagen", "höjd", "ny".
  - Avsnittet *Bakgrund* överst i varje kravsektion är enda platsen där motiv och
    historik hör hemma.

---

## 2. Arkitekturramar

Implementationen ska:

- Producera statisk HTML, CSS och JS som slutresultat. <!-- CL-§2.1 -->
- Bygga innehållssidor från Markdown. <!-- CL-§2.2 -->
- Hålla djur, aktiviteter, platser och skattjakter i strukturerad data med en enda
  sanningskälla. <!-- CL-§2.3 -->
- Återanvända layoutkomponenter mellan sidor. <!-- CL-§2.4 -->
- Undvika duplicerad markup. <!-- CL-§2.5 -->
- Undvika tunga körtidsberoenden. <!-- CL-§2.6 -->
- Bygga alla interna länkar och service-worker-scope från en konfigurerbar
  bas-sökväg — aldrig hårdkodad. Se ADR 0005. <!-- CL-§2.12 -->

Gör INTE:

- Bygg inte en SPA. <!-- CL-§2.7 -->
- Inför inte en databasmotor. <!-- CL-§2.8 -->
- Använd inte klientrenderande ramverk. <!-- CL-§2.9 -->
- Bygg inte egna komplexa byggsystem utan tydlig motivering. <!-- CL-§2.10 -->

Föredra etablerade, väl beprövade verktyg för statiska sajter. <!-- CL-§2.11 -->

### Kodregler som inte förhandlas

- Ingen `innerHTML`. DOM byggs med `createElement` och `textContent`. Det är samtidigt
  skyddet mot XSS. <!-- CL-§2.13 -->
- Domänlogik (spelregler, urval, sortering) hålls fri från webbläsar-API:er så att den
  går att enhetstesta i Node. <!-- CL-§2.14 -->
- Inga CDN:er och inga externa anrop i drift. Allt som sajten behöver ligger i bygget,
  annars fungerar den inte offline. <!-- CL-§2.15 -->
- Inga personuppgifter om besökare, ingen spårning, inga tredjepartskakor. Sajten
  används av barn. Se ADR 0010. <!-- CL-§2.16 -->
- Repot är publikt. Inga hemligheter, inga verkliga värdnamn och inga personuppgifter
  i kod, testdata, kommentarer eller commit-meddelanden. Se `docs/07-SAKERHET.md`
  och ADR 0011. <!-- CL-§2.17 -->

---

## 3. Innehållsmodell

Innehållssidor:

- Byggs av modulära sektioner. <!-- CL-§3.1 -->
- Skrivs i Markdown. <!-- CL-§3.2 -->
- Kan skrivas om eller flyttas utan att layoutkoden rörs. <!-- CL-§3.3 -->

Datadrivna sidor — djurpresentationer, aktivitetsöversikt, karta, bingo, gissa djuret
och skattjakt — läser samma strukturerade data och delar layoutstruktur. <!-- CL-§3.4 -->

---

## 4. Dataregler

Data om gården ska:

- Bo i en central strukturerad källa. <!-- CL-§4.1 -->
- Driva djurpresentationer, aktiviteter, karta, spel och eventuella flöden. <!-- CL-§4.2 -->

Det ska finnas:

- Inga duplicerade definitioner av samma djur eller aktivitet. <!-- CL-§4.3 -->
- Deterministisk sortering. <!-- CL-§4.4 -->
- Tydlig validering av obligatoriska fält. <!-- CL-§4.5 -->
- Stabila identifierare som aldrig ändras när ett djur väl finns. <!-- CL-§4.6 -->

---

## 5. Kvalitetskrav från dag ett

### Lintning

- HTML-validering <!-- CL-§5.1 -->
- CSS-lintning <!-- CL-§5.2 -->
- JS- och TS-lintning <!-- CL-§5.3 -->
- Markdown-lintning <!-- CL-§5.13 -->

Bygget ska misslyckas om lintningen misslyckas. <!-- CL-§5.4 -->

### Datavalidering

Data ska valideras för: <!-- CL-§5.5 -->

- Obligatoriska fält <!-- CL-§5.6 -->
- Giltiga datum <!-- CL-§5.7 -->
- Sluttid efter starttid <!-- CL-§5.8 -->
- Inga dubbletter av identifierare <!-- CL-§5.9 -->
- Att varje refererad bild och plats faktiskt finns <!-- CL-§5.14 -->

### Byggintegritet

Sajten ska:

- Byggas lokalt. <!-- CL-§5.10 -->
- Byggas i GitHub Actions. <!-- CL-§5.11 -->
- Fälla CI om bygget misslyckas. <!-- CL-§5.12 -->

---

## 6. Klart-definition — gå igenom listan för varje ökning

1. **Förankra.** Ändringen spåras till ett krav med acceptanskriterier i
   `docs/02-krav/`. Beteendeförändringar uppdaterar kravdokumentet **i samma
   ändring**, och ett arkitektoniskt betydande beslut får en ny ADR.
2. **Testa först.** Där logiken går att testa (domän, parsning, validering) skriv det
   fallerande testet från acceptanskriterierna och implementera tills det blir grönt.
   Försvaga eller radera aldrig ett befintligt test för att få grönt — regressionstester
   kodifierar verkliga buggar.
3. **Verifiera visuellt.** För UI-ändringar: kör sajten och titta på den, i både mobil-
   och desktopbredd, i ljust och mörkt läge om det berörs.
4. **Allt grönt före commit:** bygge, lint, typkontroll och tester.
5. **Commit:a smått.** En avgränsad sak per commit, beskrivande ämnesrad på svenska,
   nya commits hellre än att skriva om redan pushad historik.
6. **Jobba i gren.** Aldrig direkt på `main`. Varje merge till `main` deployar, så
   `main` ska alltid gå att släppa.

---

## 7. Git-arbetsflöde

- Pusha aldrig direkt till `main`. <!-- CL-§7.1 -->
- I början av varje session, innan någon kod skrivs: <!-- CL-§7.2 -->

  ```bash
  git checkout main
  git pull
  git checkout -b grennamn
  ```

- Välj ett beskrivande grennamn (`fix/bingo-sortering`, `feat/djurkort`,
  `docs/datakontrakt`). Kommer uppgiften från ett GitHub-issue, ta med numret:
  `feat/42-skattjakt`. <!-- CL-§7.3 -->
- När en gren är mergad och mergen hämtats hem via `main`, radera den lokala
  grenen. <!-- CL-§7.4 -->

---

## 8. Utvecklingsprocess

När du implementerar en ny funktion eller en betydande ändring, följ faserna i
ordning. Hoppa inte över faser. Varje fas avslutas med en commit. <!-- CL-§8.1 -->

### Regel om ombasering vid parallellt arbete

När flera grenar är i luften ändras delade dokument (`99-sparbarhet/`, `02-krav/`,
arkitektur- och designdokument) ofta på `main` och är känsliga för
numreringskonflikter. <!-- CL-§8.24 -->

Innan du redigerar en delad dokumentfil, basera om på senaste `main`: <!-- CL-§8.25 -->

```bash
git fetch origin main
git rebase origin/main
```

Det gäller genom alla faser — inte bara i fas 7. Kostnaden för att basera om när `main`
inte rört sig är noll; kostnaden för att upptäcka konflikter sent är hög. <!-- CL-§8.26 -->

### Fas 0 — Samsyn

Innan krav skrivs: diskutera förfrågan. <!-- CL-§8.0 -->
Fasen gäller **alla** uppdrag — buggar, funktioner, refaktoreringar, dataändringar,
dokumentation. Användaren har inte alltid rätt och ska få veta det när det är relevant.

**Förstå och ifrågasätt uppdraget:**

- Läs förfrågan noga. Peka ut allt som är oklart, tvetydigt eller möjligen fel.
- Kontrollera om förfrågan krockar med befintliga krav, arkitekturbeslut eller
  datakontraktet.
- Föreslå alternativ om du ser en bättre väg.
- Lyft tekniska invändningar, till exempel ett upplägg som krockar med att sajten
  ska vara statisk och fungera offline.

**Bedöm storleken:**

- Om uppdraget är så stort att det riskerar att bli forcerat eller spänna över för
  många frågor samtidigt — säg det rakt ut. <!-- CL-§8.13 -->
- Börja då inte implementera. Bryt i stället ner uppdraget i en numrerad lista av
  fristående arbetspaket, skriv en färdig prompt för vart och ett, och stanna. <!-- CL-§8.14 -->
- Det finns ingen fast gräns — använd omdöme. En avgränsad funktion är en session.
  Flera nya sidor, en ny datamodell eller en refaktorering tvärs över många filer är
  kandidater för uppdelning.

**Kom överens innan du går vidare:**

- Enas om omfattning och angreppssätt innan något krav skrivs.
- Fasen avslutas inte med en commit. Den avslutas med gemensam förståelse.
- **Även när rättningen verkar självklar** — en enradare, ett stavfel, en uppenbar bugg
  — pausa och bekräfta: återge problemet, den föreslagna lösningen och eventuella
  avvägningar i en eller två meningar. En feltolkad prompt är svårare att ångra än ett
  överhoppat steg.

Stämpla inte prompter med automatik. Känns något fel, säg det. Är något för stort, dela upp det.

### Fas 1 — Krav

Innan någon kod skrivs: <!-- CL-§8.2 -->

- Omvandla det överenskomna uppdraget till strukturerade krav.
- Lägg dem i rätt ämnesfil under `docs/02-krav/` med korrekta `02-§`-ID och
  inline-kommentarmarkörer.
- Commit: `dokumentation: krav för [funktion]`

### Fas 2 — Dokumentation och spårbarhet

- Dokumentera hur varje krav är eller ska bli implementerat i relevanta arkitektur-
  och designdokument. <!-- CL-§8.3 -->
- Lägg in alla nya krav i `docs/99-sparbarhet/` med status `saknas`. <!-- CL-§8.4 -->
- Skriv en ADR om beslutet är arkitektoniskt betydande.
- Commit: `dokumentation: design och spårbarhet för [funktion]`

### Fas 3 — Tester

- Skriv tester för varje testbart krav. <!-- CL-§8.5 -->
- Går ett krav inte att testa i kod (visuellt, UX, eller till sin natur manuellt),
  dokumentera skälet i spårbarhetsmatrisens anteckningsfält och märk det som en
  manuell kontrollpunkt. <!-- CL-§8.6 -->
- Krav som bara rör webbläsarbeteende (DOM, `fetch`, `localStorage`, CSS-layout) går
  inte att enhetstesta i Node. Märk dem som manuella kontrollpunkter med ett konkret,
  utförbart verifieringssteg — till exempel *"öppna bingosidan i mobilbredd och
  bekräfta att brickan får fem kolumner"*.
- Commit: `test: tester för [funktion]`

### Fas 4 — Implementation

- Skriv kod tills alla tester blir gröna. <!-- CL-§8.7 -->
- Commit: `funktion: implementera [funktion]`

**Vänta på användarens granskning av resultatet:**

Efter implementationscommiten, stanna och låt användaren se resultatet **köra
lokalt** innan du går vidare. <!-- CL-§8.32 -->

- Grenen ska vara utcheckad lokalt och utvecklingsservern igång, så att användaren
  faktiskt kan klicka på ändringen — inte bara läsa en sammanfattning.
- För UI-ändringar: ange exakta adresser att öppna och hur man når det tillstånd som
  ändrats.
- För data- eller byggändringar: ange exakt kommando att köra.
- För rena dokumentändringar: peka ut filsökvägar och radintervall.
- Starta inte fas 5 förrän användaren tittat på det som kör och signalerat att
  riktningen stämmer. Vill de ha ändringar, revidera och kör fas 4 igen.

Skälet: gick fas 4 åt fel håll är varje minut som läggs på spårbarhet, extra
granskningsvarv och PR bortkastad. En kort paus här är billig; omarbete efter fas 8 är
det inte.

### Fas 5 — Granskning och spårbarhetsuppdatering

- Kontrollera att krav, dokumentation, tester och implementation hänger ihop och är
  fullständiga. <!-- CL-§8.8 -->
- Uppdatera spårbarhetsmatrisen: slutliga statusar, referenser till implementation,
  länkade tester. <!-- CL-§8.9 -->
- Uppdatera summeringarna i matrisen. <!-- CL-§8.10 -->
- Commit:a bara om matrisen faktiskt behövde uppdateras.
- Commit (vid behov): `dokumentation: spårbarhetsuppdatering för [funktion]`

### Fas 6 — Slutkontroll

Gör en strukturerad genomgång ur flera perspektiv. <!-- CL-§8.11 -->
Upprepa varv tills ett helt varv inte hittar något att rätta, eller tills 5 varv är
gjorda — det som inträffar först. <!-- CL-§8.12 -->

Gå igenom varje perspektiv i tur och ordning:

- **Utvecklare**: Är koden ren, konsekvent med befintliga mönster och underhållbar?
  Finns ohanterade specialfall? Är något överkonstruerat eller underförklarat?
- **Besökare på gården**: Går uppgiften att slutföra på en mobil, med en hand, ute i
  solsken? Är etiketter, fel och bekräftelser tydliga? Är svenskan korrekt och naturlig?
- **Barn som spelar**: Förstår ett barn i lågstadieåldern vad som ska göras utan att en
  vuxen förklarar? Är texten läsbar och knapparna tillräckligt stora?
- **Nybörjarutvecklare**: Skulle någon ny i kodbasen förstå vad som lagts till? Finns
  förvirrande namn, underförstådda antaganden eller saknade kommentarer?
- **Förstagångsbesökare**: Känns funktionen som en del av samma sajt? Skaver något i
  ton, stil eller layout?
- **AI-självgranskning**: Ta ett steg tillbaka — missade jag något? Tog jag genvägar?
  Följde jag alla ramar? Något jag skulle gjort annorlunda?

**Webbläsarkontroll för UI-ändringar:**

När ändringen rör HTML, CSS eller klientkod — något besökaren ser eller klickar på —
är besökarperspektivet inte avklarat förrän funktionen faktiskt använts i en
webbläsare. <!-- CL-§8.30 -->

- Starta utvecklingsservern.
- Gå igenom det normala flödet och de relevanta specialfallen.
- Kontrollera att andra funktioner på samma sida beter sig som förut.
- Kan en webbläsarkontroll omöjligt göras i den aktuella miljön, säg det uttryckligen i
  granskningsanteckningarna i stället för att tyst hoppa över den.

Enhetstester, lint och kodskanning verifierar kodens korrekthet, inte funktionens.

Efter varje varv: rätta det som hittats och commit:a: `fix: förbättringar efter
granskning av [funktion] (varv N)`

Hittar ett varv inget att rätta, stanna — ingen commit behövs. Funktionen är klar.

### Fas 7 — Ombasering och pull request

Innan en PR öppnas, se till att grenen är i fas med `main`. <!-- CL-§8.15 -->

```bash
git fetch origin main
git rebase origin/main
```

- Vid konflikter: lös dem, `git add` de lösta filerna och `git rebase --continue`. <!-- CL-§8.16 -->
- Efter lyckad ombasering: kör tester och lint igen för att bekräfta att grenen är
  ren. <!-- CL-§8.17 -->
- Skapa PR:en. Titel: kort imperativ fras under 70 tecken. Beskrivning: punktlista,
  testplan och eventuella manuella kontrollpunkter. <!-- CL-§8.18 -->
- Kommer uppgiften från ett issue, ta med `Closes #<nummer>`. <!-- CL-§8.29 -->
- Ingen commit behövs — PR:en är leveransen.

### Fas 8 — CI, merge och städning

- Kontrollera att **alla** CI-kontroller är gröna. Merge:a inte medan någon kontroll är
  pågående eller röd. <!-- CL-§8.20 -->
- Fallerar en kontroll: utred, rätta på grenen, pusha och kontrollera igen. <!-- CL-§8.21 -->

**Vänta på användarens godkännande:**

När CI är grönt, stanna och vänta på att användaren granskar och uttryckligen godkänner
mergen. Merge:a inte på grön CI allena. <!-- CL-§8.31 -->

- Sammanfatta vad som är redo: PR-länk, CI-status, manuella kontrollpunkter.
- Tolka inte tystnad, tidigare samsyn om omfattning eller ett godkännande av planen som
  klartecken att merge:a. Merge till `main` deployar till besökarna och kräver alltid ett
  uttryckligt ja.
- Vill användaren ha ändringar, gå tillbaka till rätt fas innan merge.

**Merge och städa:**

```bash
git checkout main
git pull
git branch -d <grennamn>
```

<!-- CL-§8.22 -->
<!-- CL-§8.23 -->

---

## Slutregel

Om något tillför komplexitet utan tydligt värde ska det inte tillföras.
