# Släpp till produktion

Hur sajten deployas till produktion, och hur versionerna hänger ihop. Guiden förutsätter
att ändringen är mergad till `main` och kontrollerad i QA.

Kraven står i [`02-krav/sidhuvud-sidfot.md`](02-krav/sidhuvud-sidfot.md) §10 och
mekanismen i [`03-arkitektur/index.md`](03-arkitektur/index.md) §8 och §10. Miljöerna
beskrivs i [`06-MILJOER.md`](06-MILJOER.md).

---

## 1. Två vägar till besökaren

| Vad som mergats till `main` | QA under `/qa/` | Produktion |
| --- | --- | --- |
| Kod, mallar, CSS, dokumentation | Deployas direkt | Oförändrad tills någon släpper |
| Innehåll i `source/data/` och `source/content/` | Deployas direkt | Deployas direkt, byggt med produktionens kod |

Kod når alltså produktionen bara genom ett medvetet släpp. Innehåll — ett nytt djur, en
flyttad art, en ny text — når besökarna inom några minuter utan att någon gör något mer
än att merga.

---

## 2. Innan du släpper

- [ ] Ändringen är mergad till `main` och alla kontroller var gröna.
- [ ] QA-deployen är klar och du har öppnat QA i en webbläsare. Sidfoten visar
      `X.Y.P – QA PR<n>` med numret på din pull request.
- [ ] Det du ändrat ser rätt ut i QA, i mobilbredd.

Är något av detta inte sant: rätta först. Släpp inte trasig kod.

---

## 3. Släpp

1. Öppna repot på GitHub och fliken **Actions**.
2. Välj **Deploy till produktion** i listan till vänster.
3. Klicka **Run workflow**, behåll `main`, och klicka **Run workflow** igen.
4. Arbetsflödet stannar och väntar på godkännande. Öppna körningen, klicka
   **Review deployments**, välj `production` och **Approve and deploy**.

Väntan i steg 4 kommer av att miljön `production` har granskare i repots inställningar
(se [`07-SAKERHET.md`](07-SAKERHET.md) §8). Saknar miljön granskare stannar
arbetsflödet inte, utan deployar direkt.

Jobben i körningen är *Approve and compute version*, *Deploy* (som bygger produktionen
och QA i samma utgåva) och *Tag and release*. Efter ett par minuter är produktionen
uppdaterad. Sidfoten visar den nya versionen,
till exempel `1.0.5`, och QA visar samma version utan suffix tills nästa merge.

---

## 4. Kontrollera efteråt

- [ ] Öppna produktionen och en platssida. Sidfoten visar den nya versionen.
- [ ] Det du ändrat ser rätt ut.
- [ ] Öppna sajten i en installerad app på en telefon: statusraden "Ny version finns"
      visas, och "Ladda om" ger den nya versionen.

---

## 5. Rollback

Går något fel i produktionen: ångra ändringen på `main` och släpp igen.

```bash
git revert <commit>
git push
```

Det gäller även innehåll: ett felaktigt djur rättas med en ny commit, aldrig genom att
skriva om historiken.

---

## 6. Se vad som är deployat

Taggarna skapas av arbetsflödet på GitHub; en lokal klon har dem inte förrän de hämtats.

```bash
git fetch --tags
git tag --sort=-v:refname | head -5          # senaste släppen
git log v1.0.0..HEAD --oneline                # vad som hänt sedan 1.0.0
```

Eller läs sidfoten: produktionen visar versionen, QA visar versionen och senaste PR.
Varje körning av *Deploy till QA* och *Deploy till produktion* skriver också ut i sin
sammanfattning vilken version som byggdes och från vilken tagg produktionens kod kom.

---

## 7. Versioner

Versionsnumret följer [semantisk versionering](https://semver.org/lang/sv/):

- **Patch** (`1.0.5`) räknas upp av sig själv vid varje produktionsdeploy. Ingen gör
  något.
- **Delversion** (`1.1.0`) höjs för hand i filen `VERSION` när ändringarna sedan
  senaste `.0` känns som en milstolpe: en ny sida, en ny funktion besökaren märker.
- **Huvudversion** (`2.0.0`) höjs när sajten gjorts om så att en återkommande besökare
  blir överraskad.

`VERSION` innehåller bara `X.Y`. Första produktionsdeployen efter en höjning blir
`X.Y.0`, taggas, och får en GitHub Release med automatiskt genererade anteckningar ur
de mergade pull requesterna. Därför är pull requesternas titlar viktiga: de blir
släppanteckningarna.

Före första släppet är `VERSION` `0.0`. QA visar då `0.0.0 – QA PR<n>`, och ingen
produktion finns förrän någon släpper `0.0.0`.

### Höja delversionen

1. Läs vad som mergats sedan senaste `.0`: `git log v1.0.0..HEAD --oneline`.
2. Ändra `VERSION` i en egen pull request, till exempel från `1.0` till `1.1`.
3. Merga och släpp enligt §3. Släppet blir `1.1.0` och får en Release.
