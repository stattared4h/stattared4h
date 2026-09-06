# Miljöer

Var sajten körs, och vad som skiljer miljöerna åt.

---

## 1. Miljöerna

| Miljö | Adress | Byggs från | Bas-sökväg |
| --- | --- | --- | --- |
| Lokalt | `http://localhost:8080` | arbetskopian | `/` |
| Produktion | GitHub Pages | `main` | `/stattared4h/` |

Det finns medvetet ingen separat testmiljö. En pull request som bygger grönt och kan
köras lokalt är tillräcklig kontroll för en sajt av den här storleken. Skulle behovet
uppstå läggs en förhandsvisning per pull request till — bas-sökvägen är redan
förberedd för det. <!-- 06-§1.1 -->

---

## 2. Bas-sökvägen

Det enda som verkligen skiljer miljöerna åt är var sajten ligger i adressen. GitHub Pages
lägger projektsajten under `/stattared4h/`; ett webbhotell eller en egen domän lägger den
i roten.

Bygget läser bas-sökvägen ur miljövariabeln `BASE_PATH`, med `/` som
standard. <!-- 06-§2.1 -->

```bash
BASE_PATH=/stattared4h/ npm run build
```

Varje intern länk, varje resursreferens, service workerns scope och manifestets
`start_url` byggs genom bas-sökvägens hjälpfunktion. Ingen absolut sökväg skrivs för
hand. Ett test bevakar regeln. Bakgrunden står i
[ADR 0005](adr/0005-konfigurerbar-bassokvag.md). <!-- 06-§2.2 -->

---

## 3. Att flytta till ett webbhotell

Flytten är avsiktligt liten. Den består av tre saker: <!-- 06-§3.1 -->

1. Sätt `BASE_PATH` till `/` — eller till underkatalogen, om sajten ska ligga i en sådan.
2. Byt ut deploy-steget i CI mot en överföring av `public/` till webbhotellet.
3. Se till att webbhotellet skickar rätt cache-huvuden: långa tider för filer med
   innehållshash i namnet, ingen cachning för `sw.js` och `manifest.webmanifest`.

Punkt 3 är den som brukar glömmas. En cachad service worker låser besökarna vid en gammal
version av sajten. <!-- 06-§3.2 -->

Ingen kod behöver ändras. Det är hela poängen med ADR 0005.

---

## 4. Hemligheter

Sajten har inga hemligheter. Ingen API-nyckel, ingen databasuppgift, ingen
tredjepartstjänst. Deploy till GitHub Pages sker med den token GitHub Actions redan
har. <!-- 06-§4.1 -->

Skulle en flytt till webbhotell kräva uppgifter för överföring läggs de som
repohemligheter och används enbart av deploy-steget. Ingen hemlighet hamnar någonsin i
bygget, eftersom bygget är publikt läsbart för besökaren. <!-- 06-§4.2 -->
