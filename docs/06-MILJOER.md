# Miljöer

Var sajten körs, vilket dataset varje miljö läser, och vad som skiljer dem åt.

---

## 1. Miljöerna

| Miljö | Adress | Dataset | Bas-sökväg | Version i sidfoten |
| --- | --- | --- | --- | --- |
| Lokalt | `http://localhost:8080` | valfritt via `DATA_DIR`, `source/data/` som standard | `/` | `1.2.0 – lokal 2026-09-06 18:40` |
| QA | GitHub Pages, under `/qa/` | `source/data-qa/` | `/stattared4h/qa/` | `1.2.0 – CR31 – QA` |
| Produktion | GitHub Pages, i roten | `source/data/` | `/stattared4h/` | `1.2.0` eller `1.2.0 – CR31`; `0.0.PR31` före första släppet |

QA och produktion byggs ur **samma kod** och skiljer sig bara på vilket dataset de läser
och var de hamnar. Det är hela poängen: en avvikelse mellan miljöerna kan bara bero på
datat, aldrig på att koden är en annan. <!-- 06-§1.1 -->

Båda ligger i samma Pages-utgåva, så det behövs ingen andra värd och ingen andra
deploy. <!-- 06-§1.2 -->

QA har en egen service worker med scope `/stattared4h/qa/` och ett eget manifest-`id`
(`02-§7.9`), så att den som öppnat QA inte får påhittade djur i produktionens
cache. <!-- 06-§1.4 -->

QA-bygget får samma versionssträng som produktionen med tillägget " – QA", så att den
som läser sidfoten aldrig tar QA för produktion (`02-§10.22`). <!-- 06-§1.5 -->

Varje sida i QA-bygget bär `<meta name="robots" content="noindex">`, så att påhittade
djur aldrig hamnar i en sökmotor. En `robots.txt` duger inte till det: på en projektsajt
under GitHub Pages läser sökmotorer bara värdens rot, `stattared4h.github.io/robots.txt`,
som repot inte äger. <!-- 06-§1.3 -->

---

## 2. Datasetet väljs med `DATA_DIR`

Bygget läser miljövariabeln `DATA_DIR`, med `source/data` som standard. <!-- 06-§2.1 -->

```bash
npm start                              # bygger och serverar på localhost:8080
DATA_DIR=source/data npm run build     # produktion
DATA_DIR=source/data-qa npm run build  # QA
```

`DATA_DIR` får verkan när de datadrivna sidorna byggs. Bygget renderar i dag bara
startsidan; se spårbarhetsmatrisen för vad som finns och vad som saknas.

**Testerna körs alltid mot `source/data-qa/`, aldrig mot gårdens riktiga data.** Ett test
får aldrig kunna börja fallera för att gården sålt en get. <!-- 06-§2.2 -->

Datasetet i [`source/data-qa/`](../source/data-qa/README.md) är påhittat och valt för att
pröva kontraktets gränsfall — samma djurslag på flera platser, flera djurslag i samma hage,
en tom hage, ett djur utan foton. Dess README listar vad varje post finns för. <!-- 06-§2.3 -->

Ändras datakontraktet ändras QA-datat i samma commit. Annars slutar testerna bevaka det de
påstår sig bevaka. <!-- 06-§2.4 -->

---

## 3. Bas-sökvägen

Det som skiljer miljöerna åt i adressen hanteras av `BASE_PATH`, med `/` som
standard. <!-- 06-§3.1 -->

```bash
BASE_PATH=/stattared4h/ npm run build
```

Varje intern länk, varje resursreferens, service workerns scope och manifestets
`start_url` byggs genom bas-sökvägens hjälpfunktion. Ingen absolut sökväg skrivs för hand,
och ett test bevakar regeln. Bakgrunden står i
[ADR 0005](adr/0005-konfigurerbar-bassokvag.md). <!-- 06-§3.2 -->

QA-bygget ärver samma mekanism med `/stattared4h/qa/`, vilket också är det löpande beviset
för att bas-sökvägen fungerar — går QA att öppna, går flytten till ett webbhotell att
göra. <!-- 06-§3.3 -->

I CI sätts den inte för hand: `actions/configure-pages` räknar fram `base_path`, och
deploy-arbetsflödet skickar vidare den. Byter repot namn eller får en egen domän följer
sajten med utan att någon ändrar en rad. <!-- 06-§3.4 -->

Bygget vägrar dessutom rendera en sida vars mall innehåller en handskriven absolut
sökväg. Regeln kan alltså inte urholkas av förbiseende. <!-- 06-§3.5 -->

---

## 4. Att flytta till ett webbhotell

Flytten är avsiktligt liten: <!-- 06-§4.1 -->

1. Sätt `BASE_PATH` till `/`, eller till underkatalogen sajten ska ligga i.
2. Byt deploy-steget i CI mot en överföring av `public/` till webbhotellet.
3. Se till att webbhotellet skickar rätt cache-huvuden: långa tider för filer med
   innehållshash i namnet, ingen cachning för `sw.js` och `manifest.webmanifest`.

Punkt 3 glöms oftast. En cachad service worker låser besökarna vid en gammal version av
sajten. <!-- 06-§4.2 -->

Ingen kod behöver ändras.

---

## 5. Hemligheter

Sajten har inga hemligheter i fas 1. Ingen API-nyckel, ingen databasuppgift, ingen
tredjepartstjänst. Deploy till GitHub Pages sker med den token GitHub Actions redan
har. <!-- 06-§5.1 -->

Fas 2 inför ett skriv-API med en GitHub-token
([ADR 0013](adr/0013-faser-admin-nu-skriv-api-sedan.md)). Den bor hos API:et, aldrig i
bygget — bygget är publikt läsbart för besökaren. <!-- 06-§5.2 -->
