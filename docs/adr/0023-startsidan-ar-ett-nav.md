# 0023 — Startsidan är ett nav, inte sajtens innehåll

**Status:** Antagen, 2026-09-08

Ersätter beslutet i `02-§5.1` att kartan inte har någon egen adress.

## Sammanhang

Startsidan bar tre ärenden i en enda rulle: kartan med sin platslista, djurslagen på gården
och sökningen på öronmärke. På en telefon i 360 px bredd blev sidan omkring 5 000 px lång.
Ordningen mellan avsnitten var omprövad två gånger — `02-§5.51` grupperade platslistan och
`02-§5.52` flyttade sökningen sist — men båda gångerna handlade det om att sortera rullen,
inte om att korta den. Vilken ordning man än väljer ligger två av tre ärenden i vägen för
det tredje.

Att kartan bodde på startsidan var ett medvetet val, och det hade ett riktigt skäl:
besökaren står i hagen med telefonen och behöver kartan först, och varje nav mellan hen och
kartan kostar ett tryck.

Två saker gör att skälet inte längre bär.

Sajten ska få spel som läser gårdens data (ADR 0009). Ett spel är inte ett avsnitt man
rullar förbi — det är ett eget ärende med en egen sida. Läggs det till i rullen blir
startsidan 7 000 px, och nästa spel 9 000. En struktur som går sönder av sin första
planerade utbyggnad är fel struktur redan i dag.

Och det tryck som skulle sparas sparas oftast inte. Vägen in till en hage är QR-koden på
skylten, som går rakt till `/plats/<id>/` och aldrig passerar startsidan (`02-§5.29`).
Den som ändå börjar på startsidan är oftare hemma i soffan än i hagen.

## Beslut

Startsidan är ett nav. Den säger i en mening vad sajten är och visar därunder ett kort per
ärende: kartan, djuren, och senare ett per spel. Den bär inget innehåll själv.

Kartan får sidan `/karta/` och djurslagen sidan `/djuren/`, tillsammans med sökningen på
öronmärke som hör till samma fråga — *vilket djur är det här?*

Korten ligger i samma rutnät som djurkorten: två i bredd på mobil (`02-§5.64`). Två kort
fyller inte en skärm, och det är avsikten — rutnätet är byggt för att fyllas, och ett nytt
spel blir ett nytt kort utan att något annat ändras.

Menyn speglar navet, med en rad per ärende (`02-§10.5`). Djurslagen ligger som en fälla
under "Djuren" (`02-§10.43`), byggd av `<details>` så att den fungerar utan JavaScript
(`02-§10.44`). Kartan får ingen fälla: trettiofyra platser är en lista att läsa på
kartsidan, inte i en meny.

## Alternativ

**Behålla kartan på startsidan och lägga spelen i menyn.** Avvisat: menyn är då den enda
vägen till halva sajten, och en meny bakom en hamburgare är det svåraste barnet hittar.
Navet visar ärendena; menyn upprepar dem.

**Ett nav som lista i stället för kort.** Avvisat: en rad text är en liten träffyta för en
hand i solsken, och listan säger inte vad ärendet är förrän man läst den. Kortet med symbol
och rubrik känns igen på håll.

**Foton på korten i stället för symboler.** Avvisat: kartan har inget foto som visar vad
den gör, och ett spel kommer inte att ha ett heller. En ritad symbol i samma streck som
kartans markörer (`05-§6.39`) fungerar för varje ärende sajten kan få, och lägger inga nya
filer i ett repo som håller bilderna räknade (ADR 0008).

**Låta `/karta/` vara startsidan och navet ligga på en underadress.** Avvisat: den som
installerat sajten som app startar på `/`, och den som får en länk delad delar oftast `/`.
Adressen `/` ska vara vägen in till allt, inte till ett av ärendena.

## Konsekvenser

Besökaren som börjar på startsidan och vill till kartan trycker en gång extra. Det är
priset, och det betalas av varje ärende som slipper ligga i vägen för de andra.

Den som följt en QR-kod till en hage och sedan vill se kartan når den på ett tryck i
menyn, där "Kartan" ligger överst bland ärendena (`02-§10.5`). Det är därför menyn måste
spegla navet och inte bara upprepa startsidan: utan raden vore vägen tillbaka via
startsidan, alltså två tryck.

Sajten går från fyra sidtyper till sex (`02-§5.1`). Två av dem är sidor utan egen data —
de visar vyer som redan finns — så bygget växer med två mallar, inte med en ny modell.

Varje länk som förut sa "startsidan med kartan" pekar nu på `/karta/`: platssidans tomma
och inaktiva lägen, artsidans okända plats, 404-sidan och offline-sidan. Tillbakaknappen
(`02-§10.40`) går fortsatt till `/`, som nu är navet — vilket är rätt mål för den som kom
utifrån.

Service workern förcachar två sidor till (`02-§7.4`). De byggs ur `collections.all` och
kommer med utan att listan ändras.

Nästa spel ska inte kräva ett nytt beslut. Det blir ett kort i navet, en rad i menyn och en
sida — och om det någon gång inte räcker är det navet som ska prövas om, inte kortet som
ska bli något annat.
