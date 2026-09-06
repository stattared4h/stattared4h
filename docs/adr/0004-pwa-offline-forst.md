# 0004 — Installerbar PWA med offline-först

**Status:** Antagen, 2026-09-06

## Sammanhang

Besökarna använder sajten medan de går runt på gården. Täckningen där är ojämn, och det är
just ute vid hagarna sajten ska svara på "vilka går här?" — längst bort från byggnaderna.

En QR-kod som ger en snurrande laddningsikon är värdelös. Och uppdraget pekar ut installation
på både iOS och Android, så att sajten kan startas från hemskärmen.

## Beslut

Sajten är en installerbar PWA. Ett webbappmanifest och en service worker ingår i bygget.

Service workern förcachar sidskal, CSS, buntade skript och ikoner, samt sidorna för platser
och djur. Strategin är cache först för skal och sidor, och nätverk först med cache som reserv
för fotografier.

En besökare som laddat sajten en gång ska kunna slå upp en hage och ett djur utan uppkoppling.

## Övervägda alternativ

- **Vanlig webbsida utan service worker** — avvisad: löser inte grundproblemet, som är att
  sidorna används där täckningen är sämst.
- **Native-appar för iOS och Android** — avvisad: två kodbaser, två utvecklarkonton med
  årsavgift, och signeringsnycklar som måste förvaltas över styrelseskiften. Oproportionerligt
  för en ideell förening.

## Konsekvenser

- Cachen versioneras och rullas vid varje deploy, annars ser besökare gammalt innehåll.
  Cachenamnet hör till bygget, inte till handredigering.
- Allt sajten behöver måste ligga i bygget. Inga CDN:er och inga externa typsnitt.
- iOS har historiskt varit snålare med PWA-funktioner än Android. Installation och offline-läge
  ska verifieras på en riktig iPhone, inte bara i skrivbordsläge.
- Fotografierna är den tunga delen, vilket är ett av skälen till storleksgränsen i
  [ADR 0008](0008-bilder-i-repot.md).
