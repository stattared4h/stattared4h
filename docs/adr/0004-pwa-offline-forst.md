# 0004 — PWA med offline-först och förcachad gårdsdata

**Status:** Antagen, 2026-09-06

## Sammanhang

Besökarna använder sajten medan de går runt på gården. Täckningen där är ojämn, och
spelen — djurbingo, gissa djuret, skattjakt — är just det som används längst bort från
byggnaderna. En skattjakt som slutar fungera mitt i en runda för att mobilen tappar
kontakt är värdelös.

Uppdraget pekar också ut installation på både iOS och Android, så att sajten kan startas
från hemskärmen som en app.

## Beslut

Sajten är en installerbar PWA. Ett webbappmanifest och en service worker ingår i bygget.

Service workern förcachar sajtens skal, CSS, de buntade skripten, ikonerna och den
genererade JSON-datan om djur, aktiviteter, platser och skattjakter vid installation.
Strategin är cache först för skal och data, och nätverk först med cache som reserv för
fotografier.

En besökare som laddat sajten en gång ska kunna spela klart varje spel helt utan
uppkoppling.

## Övervägda alternativ

- **Vanlig webbsida utan service worker** — avvisad: löser inte grundproblemet, som är
  att spelen används där täckningen är sämst.
- **Native-appar för iOS och Android** — avvisad: två kodbaser, två utvecklarkonton med
  årsavgift, granskningsprocesser och signeringsnycklar som måste förvaltas över
  styrelseskiften. Helt oproportionerligt för en ideell förening.
- **Cacha bara skalet och hämta data över nätet** — avvisad: skalet utan data ger en tom
  bingobricka. Datat är litet nog att förcacha i sin helhet.

## Konsekvenser

- Cachen måste versioneras och rullas vid varje deploy, annars ser besökare gammalt
  innehåll. Cachenamnet hör till bygget, inte till handredigering.
- Allt sajten behöver måste ligga i bygget. Inga CDN:er, inga externa typsnitt, inga
  externa kartrutor utan att offline-läget är genomtänkt — det binder ihop med ADR 0001.
- iOS har historiskt varit snålare med PWA-funktioner än Android. Installation och
  offline-läge ska verifieras på en riktig iPhone, inte bara i skrivbordsläge.
- Fotografier är den tunga delen. Bildstorlekar och format måste hållas nere, se ADR 0008.
