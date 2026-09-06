# 0009 — Spel läser gårdens data; de har ingen egen

**Status:** Antagen, 2026-09-06

## Sammanhang

Uppdraget nämner interaktiva spel — djurbingo, gissa vad djuret heter, skattjakter — som ska
hjälpa besökare att upptäcka omgivningarna. De finns ännu inte bland de nedbrutna kraven, så
de är inte planerade i tid, men riktningen ska vara satt innan någon börjar.

Frestelsen är att skriva varje spel för sig med sin egen lilla lista av djur. Det ger listor
som glider isär, så att ett nytt djur dyker upp i bingot men inte i skattjakten.

## Beslut

Spel får ingen egen datakälla. De läser samma djur-, art- och platsdata som resten av sajten.

Ett spel består av två delar. En **regelmodul** som är ren TypeScript utan webbläsar-API:er —
den väljer ut djur, sätter ihop en bingobricka, avgör om ett svar är rätt — och därför går att
enhetstesta i Node. Och en **presentationsdel** som bygger DOM och hanterar klick.

Behöver ett spel något datat inte kan uttrycka, exempelvis ledtrådar till en gissningslek,
läggs det till som **frivilliga fält** i datakontraktet när spelet byggs. Fälten finns inte i
förväg: att lägga in tomma fält för spel som ingen beställt är precis det krångel gården bett
oss undvika.

Vad ett djur behöver för att kunna delta uttrycks i datat, inte i koden. Ett djur utan
porträttfoto kan inte vara med i djurbingo, och valideringen påpekar det i stället för att
spelet tyst hoppar över djuret.

## Övervägda alternativ

- **En egen datafil per spel** — avvisad: garanterad drift, och flera ställen att uppdatera när
  ett djur tillkommer.
- **Slumpa spelinnehåll i byggtid** — avvisad: samma bingobricka varje gång tills sajten byggs
  om. Slumpen hör hemma i webbläsaren, tagen via en injicerad funktion så att testerna kan ge
  den ett fast frö.
- **Hämta speldata från ett API vid spelets start** — avvisad: bryter offline-läget i
  [ADR 0004](0004-pwa-offline-forst.md), vilket är precis där spelen används.

## Konsekvenser

- Ett nytt djur i YAML dyker upp i alla spel det kvalificerar sig för, utan kodändring.
- Spelreglerna går att testa utan webbläsare, vilket gör dem billiga att lita på.
- Datakontraktet växer först när ett spel faktiskt byggs, och växer då additivt — inga
  befintliga filer behöver ändras.
