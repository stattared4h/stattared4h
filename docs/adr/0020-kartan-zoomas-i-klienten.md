# 0020 — Kartan zoomas i klienten

**Status:** Antagen, 2026-09-07

## Sammanhang

Kartan är byggd vid bygget: en SVG ur platsernas koordinater, med en HTML-markör per plats
ovanpå (`03-§9.1`). Den är en stillbild, och det har räckt — tills nu.

Åtta av gårdens trettio platser ligger i en klunga kring gårdsplanen, inom några tiotal
meter från varandra. I överblick får deras etiketter inte plats; bygget döljer dem som inte
ryms (`02-§5.33`) och besökaren ser en samling markörer som står på varandra. Namnen finns
kvar för skärmläsaren och i listan under kartan (`02-§5.24`), men på en telefon framför
gårdsplanen är det inte bra nog. Gården har bett om att kunna zooma (#51).

Sajten håller på minimal JavaScript (`CL-§1.4`). Hittills är klientkoden små moduler som
var och en letar upp sitt element och gör ingenting om det saknas (`03-§10.2`): meny,
installknapp, dela, offlinerad. Ingen av dem är en interaktionsmodell. Zoomen är det, och
frågan är inte bara *hur* utan *hur mycket* kod som är rimlig.

## Beslut

Kartan zoomas och panoreras i klienten, med egen kod, byggd så här:

**En `transform` på ett omslag.** Ritningen och markörerna ligger i ett gemensamt omslag
som får `translate(x, y) scale(z)`. Markörerna motskalas med `scale(1 / z)` kring sin egen
mittpunkt, så de följer med i ritningens koordinatsystem men behåller sin storlek och sin
träffyta om 44 × 44 px vid varje zoomnivå (`02-§5.43`). En nål på en karta, inte en del av
bilden.

**Räknandet ligger i domänen.** `source/ts/domain/map-view.ts` håller vyn som `{ x, y,
scale }` och räknar zoom kring en ankarpunkt, panorering och gränser — utan att röra ett
enda webbläsar-API. Det går därmed att enhetstesta i Node (`CL-§2.14`), vilket är det som
gör att gränsfallen — nyp i kanten, zoom ut till utgångsläget, drag bortom ritningen — går
att pröva utan en webbläsare. `source/ts/ui/map-zoom.ts` blir tunn: händelser in,
tillstånd ut, en `style`-egenskap satt.

**Tre knappar, inte bara gester.** Zooma in, zooma ut och "Visa hela kartan"
(`02-§5.41`). De ger tangentbordet en väg utan att kartan behöver bli en egen fokusfälla
med tangentbindningar, och de hjälper den som inte nyper. Knapparna är dolda tills
JavaScript kör, som installknappen (`02-§10.11`).

**Kartan fångar inte rullningen.** Vid 1× tar den nyp men inte drag, så en besökare som
rullar förbi startsidan med fingret på kartan rullar sidan (`02-§5.42`). Först när kartan
är inzoomad tar den drag. På dator zoomar `Ctrl`- eller `Cmd`-hjul; vanligt hjul rullar
sidan (`02-§5.40`). Kartan blir aldrig en fälla besökaren inte bett om.

**Tillräckligt långt in visas alla etiketter** (`02-§5.44`), också de bygget döljer i
överblick. Det är hela poängen med zoomen: trängseln som gjorde att de doldes finns inte
längre när ritningen är större. Gränsen är mätt, inte gissad — vid dubbel förstoring
staplar klungans etiketter fortfarande på varandra, vid fyra gånger står de isär.

Utan JavaScript är kartan exakt vad den är i dag — en stillbild — och listan under den bär
informationen (`02-§5.45`). Ingenting hämtas utifrån.

## Övervägda alternativ

**Ett kartbibliotek, till exempel Leaflet.** Avvisat: det vore ett tungt körtidsberoende
(`CL-§2.6`) för en enda sida, det vill ha kartplattor som vi inte får hämta (`02-§5.26`,
ADR 0004), och det löser ett problem vi inte har — vi har ingen världskarta, vi har en
ritning av en gård.

**Native rullning i stället för `transform`:** lägg kartan i en behållare med `overflow:
auto` och låt zoom vara ritningens bredd i procent. Panorering, tangentbord, tröghet och
rullningslister hade kommit gratis, och koden blivit betydligt mindre — ett lockande
alternativ. Avvisat ändå: ett nyp ändrar då bredden varje bildruta, och webbläsaren måste
rastrera om hela ritningen varje gång i stället för att komponera om ett lager. På den
telefon som är utgångsläget blir det hackigt, och nypet är den gest gården faktiskt bad om.
`transform` är det som är jämnt.

**Zoom bara med knappar, inga gester.** Minsta möjliga kod. Avvisat: att inte kunna nypa i
en karta på en telefon är i dag lika förvånande som att inte kunna rulla en sida.

**Att inte zooma alls, och i stället lösa trängseln med etikettplacering** (#50).
Avvisat som ensam lösning: åtta platser inom några tiotal meter får inte plats i överblick
hur klyftigt etiketterna än placeras. Frågan i #50 blir däremot mindre efter zoomen, och
tas upp igen när den här ändringen ligger inne.

## Konsekvenser

Sajten får sin första interaktionsmodell, och därmed en gräns att hålla: det här är kod
som bär en gest, inte en app. Växer kartan till lägeshantering, animeringar och lägen är
det ett tecken på att beslutet ska prövas om, inte på att koden ska växa vidare.

Klientbunten växer med storleksordningen 200 rader. `03-§10.2` gäller fortfarande: modulen
letar upp sitt element och gör ingenting på en sida utan karta.

Kravet att markören ska vara minst 44 × 44 px (`02-§5.27`) blir svårare att kontrollera för
hand, eftersom det nu gäller vid varje zoomnivå. Den manuella kontrollpunkten mäter därför
vid utgångsläget och vid full inzoomning.

Etiketternas placering räknas fortfarande vid bygget för en 360 px bred karta (`03-§9.3`).
Inzoomad står de på samma sidor som i överblick, med mer luft omkring sig. Det är gott nog:
placeringen är en uppskattning, och zoomen ger den marginal den saknade.
