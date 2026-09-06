# 0009 — Spelen är datadrivna och delar gårdens datakälla

**Status:** Antagen, 2026-09-06

## Sammanhang

Sajten ska innehålla flera spel: djurbingo, gissa vad djuret heter, och skattjakter. De
har olika regler men vilar på samma underlag — vilka djur som finns, var de bor, vad som
utmärker dem, och vilka platser på gården som är värda att gå till.

Frestelsen är att skriva varje spel för sig med sin egen lilla lista av djur. Det ger tre
listor som glider isär, så att ett nytt djur dyker upp i bingot men inte i skattjakten,
och en såld get lever kvar i ett av spelen.

## Beslut

Spelen har ingen egen data. De läser samma djur-, plats- och aktivitetsdata som resten av
sajten, genererad från YAML enligt ADR 0002.

Varje spel består av två delar. En **regelmodul** som är ren TypeScript utan
webbläsar-API:er — den väljer ut djur, sätter ihop en bingobricka, avgör om ett svar är
rätt, håller ordning på skattjaktens poster — och därför går att enhetstesta i Node. Och
en **presentationsdel** som bygger DOM och hanterar klick.

Vad ett djur behöver för att kunna vara med i ett spel uttrycks i datat, inte i koden. Ett
djur utan foto kan inte vara med i djurbingo; ett djur utan ledtrådar kan inte vara med i
gissningsleken. Valideringen säger till när något saknas i stället för att spelet tyst
hoppar över djuret.

## Övervägda alternativ

- **En egen datafil per spel** — avvisad: garanterad drift mellan spelen, och tre ställen
  att uppdatera när ett djur tillkommer.
- **Slumpa spelinnehåll i byggtid och baka in det statiskt** — avvisad: samma bingobricka
  varje gång tills sajten byggs om. Slumpen hör hemma i webbläsaren.
- **Hämta speldata från ett API vid spelets start** — avvisad: bryter offline-läget i
  ADR 0004, vilket är precis där spelen används.

## Konsekvenser

- Ett nytt djur i YAML dyker upp i alla spel det kvalificerar sig för, utan kodändring.
  Det är hela poängen.
- Spelreglerna går att testa utan webbläsare, vilket gör dem billiga att lita på.
- Datakontraktet får bära spelens behov — ledtrådar, svårighetsgrad, koordinater. Det gör
  `docs/04-DATAKONTRAKT.md` bredare än en ren djurkatalog, vilket är ett medvetet val.
- Ett spel som kräver något datat inte kan uttrycka blir en ändring av datakontraktet, med
  den granskning det innebär, i stället för en snabbfix i spelkoden.
