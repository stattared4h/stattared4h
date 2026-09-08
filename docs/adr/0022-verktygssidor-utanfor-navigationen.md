# 0022 — Verktygssidor ligger utanför navigationen, inte bakom ett lås

**Status:** Antagen, 2026-09-08

## Sammanhang

Bildverktyget (`02-§11`) är byggt för redaktören, inte för besökaren vid hagen. Det
ligger ändå i det publika bygget, eftersom sajten är statisk och det inte finns någon
server som kan skilja på vem som frågar ([ADR 0013](0013-faser-admin-nu-skriv-api-sedan.md)).

En sida i menyn skulle förvirra besökaren, hamna i sökresultaten och laddas ner av varje
telefon som installerar appen. Ingetdera är rimligt för ett verktyg som bara en handfull
personer ska öppna.

Frågan är alltså inte *om* sidan är åtkomlig — det är den — utan hur den hålls ur vägen.

## Beslut

Verktygssidor får en svårgissad adress, står i `README.md` och `docs/01-BIDRA.md`, och
finns ingen annanstans: inte i menyn, inte i sidfoten, inte i någon länk från en byggd
sida, och inte i service workerns förcache.

Sidan bär `noindex`, eftersom adressen står i ett publikt README som sökmotorer läser.
`robots.txt` nämner den däremot inte: en `Disallow`-rad vore en skylt som pekar rakt på
adressen, och `robots.txt` är det första en nyfiken läser.

**Adressen är inte ett skydd, och kallas inte ett.** Repot är publikt, README är publikt,
och vem som helst kan läsa adressen där. Det är ofarligt, och det är villkoret för
beslutet: sidan innehåller inga hemligheter, tar inte emot några personuppgifter
([ADR 0010](0010-ingen-sparning-av-besokare.md)), gör inga anrop utanför webbläsaren och
kan inte skriva någonstans. Allt den producerar är filer som redaktören själv laddar upp
på github.com, där behörigheten kontrolleras av GitHub
([ADR 0014](0014-roller-via-github.md)).

Villkoret gäller framåt: en verktygssida som en dag behöver ett skydd får inte klara sig
med en adress. Då behövs fas 2:s server, och beslutet tas om.

## Övervägda alternativ

- **Lägga verktyget i menyn** — avvisad: besökaren vid hagen har inget där att göra, och
  varje extra menypost gör de två som betyder något svårare att hitta.
- **Bygga sidan bara i QA** — avvisad: redaktören arbetar mot produktionens data, och en
  sida som bara finns i förhandsvisningen skulle sluta finnas den dag QA byggs om.
- **Ett lösenord i klienten** — avvisad: ett lösenord som ligger i sidans egen kod är
  inget lösenord. Det skulle ge en känsla av skydd som inte finns, vilket är sämre än
  ingen känsla alls.
- **`Disallow` i `robots.txt`** — avvisad: den publicerar adressen på en fil som är
  gjord för att läsas. `noindex` på sidan gör samma jobb utan att peka.

## Konsekvenser

- Verktyget når den som ska nå det, med ett klick från README, och stör ingen annan.
- Adressen ändras inte i onödan: den står i README och i bidragsguiden, och en ändring
  gör båda fel tills de rättas.
- Kravet `02-§11.5` håller sidan utanför förcachen. Det kostar ett undantag i testet som
  annars kräver att varje byggd sida ligger där — undantaget är skrivet som en egen
  kontroll, så att sidan inte kan smyga in i förcachen utan att ett test fäller.
