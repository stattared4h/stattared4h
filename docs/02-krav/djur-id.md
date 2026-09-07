# Krav — publikt djur-ID

Del av besökarens djurdata. Spåras till #44.

- Ett individuellt djur får ha `publicId`, ett publikt märkningsnummer som besökaren kan läsa på djuret, exempelvis ett öronmärke. Fältet är valfritt och är inte ett internt administrations- eller journal-id. <!-- 02-§6.14 -->
- Ett angivet `publicId` är icke-tom text med bokstäver och siffror; mellanslag och bindestreck får användas som enkel formatering. <!-- 02-§6.15 -->
- Publika ID:n jämförs normaliserat utan skillnad på versaler/gemener, mellanslag eller bindestreck. Två djur får inte ha samma normaliserade ID. <!-- 02-§6.16 -->
- Djursidan visar ID:t med etiketten **Öronmärke**. Startsidan låter besökaren söka på hela ID:t och går direkt till rätt djur. <!-- 02-§5.33 -->
- Sökningen använder exakt normaliserad träff. Suffix-sökning används inte, eftersom en kort ändelse kan passa flera djur och då ge sken av en unik träff. <!-- 02-§5.34 -->
- `populations.yaml` har inget publikt individ-ID eftersom posterna representerar antal, inte individer. <!-- 02-§6.17 -->
- QA-datat innehåller flera formateringsvarianter av publika ID:n och tester för normalisering, sökning och dubblettkontroll. <!-- 02-§6.18 -->
