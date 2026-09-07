# 0016 — Förbundets grafiska profil är källan för logotypen

**Status:** Antagen, 2026-09-07

## Sammanhang

ADR 0007 härledde sajtens identitet ur WordPress-temat på `4h.se` och avvisade uttryckligen
alternativet att vänta på en grafisk profil från förbundet, med motiveringen att det
blockerar arbetet "på något vi inte råder över, och färgerna i temat är i praktiken
profilen".

Den premissen håller inte. Riksförbundet Sveriges 4H har en grafisk profil, antagen 2023 av
kommunikationsgruppen, och den ligger öppet på förbundets sajt. Den definierar logotypens
färg, vilka färger logotypen får ha, hur mycket fri yta som ska lämnas omkring den, och en
palett på nio färger. Den säger också rakt ut att en medlem inte får skapa en egen logga.

Logotypen finns dessutom som vektor. Temat publicerar den bara som PNG, vilket är skälet
till att `source/assets/img/4h-logo.svg` hittills varit en märkt platshållare, men
förbundets dokumentbibliotek publicerar den som en Illustrator-PDF utan bilder och utan
typsnitt — enbart banor.

Två fakta i repot visade sig vara fel mot profilen. Logotypgrönt stod som `#467c45`; det
värdet finns varken i profilen eller i någon av förbundets egna filer. Och paletten i
`docs/05-design/index.md` är hämtad ur temats stilmall, inte ur profilen.

## Beslut

**Den grafiska profilen är källan för 4H:s identitet i det här repot.** Där profilen och
temat säger emot varandra gäller profilen. Beslutet ersätter färghärledningen i ADR 0007;
resten av ADR 0007 — att vi ärver identiteten men bygger egen typografi, spacing och
komponenter — står kvar.

Av profilen följer:

- Logotypgrönt är `#00693f`. Profilen säger uttryckligen att HEX-värdet gäller före PMS.
- Logotypen får bara vara mörkgrön, svart eller vit. Den vita varianten i sidfoten och
  menykortet är därmed tillåten.
- Ingenting läggs ovanpå logotypen, och den vrids, speglas eller ändras inte.
- Frizonen omkring den är en kvadrat motsvarande `H`:ets nedre högra kvadrat till höger och
  under, och en halv kvadrat upptill och till vänster.
- Gården får använda logotypen. Gården får inte skapa en egen.

Logotypen i repot är en **formatkonvertering** av förbundets vektorfil, inte en omritning.
Banorna är oförändrade; det enda som sätts är fyllningsfärgen och, i den vita varianten, en
mask som slår hål på klöverns fyra `H` så att bakgrunden syns igenom — vilket en enfärgad
logotyp kräver. Konverteringen är verifierad mot förbundets egen rasterfil.

Externt källmaterial förs in i ett **källregister** i `docs/09-kallor/index.md`: adress,
hämtdatum, kontrollsumma och vad vi härlett ur det. Registret bär också kontrollsumman för
logotypens banor, så att ett test kan slå fast att konstverket är oförändrat.

Färgtokens migreras **inte** i den här ändringen. Skälet är konkret: profilens andra gröna
`#008b44` klarar inte vit text (4,40:1 mot AA-gränsen 4,5:1), och den primära `#00693f`
klarar både vit text på sig och sig själv som text — vilket betyder att ytfärg och hovring
inte längre kan vara två gröna ur profilen. Det är ett designval med följder för varje sida
och hör hemma i en egen ändring med egen kontrastgenomgång.

## Övervägda alternativ

- **Be förbundet om en SVG** — avvisad: vektorn är redan publik, och att vänta på ett svar
  blockerar en ändring vi kan göra i dag. Frågan ställs den dag vi behöver något registret
  inte täcker.
- **Rita om logotypen som ren SVG** — avvisad, och otillåten. Profilen förbjuder det.
- **Lägga in källfilerna i repot** — delvis avvisad. Logotypens PDF är 783 KB och är den
  direkta källan till en fil vi levererar; den läggs in. Den grafiska profilen är 45 MB och
  läggs inte in — den ligger kvar hos förbundet, med adress, datum och kontrollsumma i
  registret, i linje med principen i ADR 0008 att original inte bor här.
- **Migrera hela paletten nu** — avvisad för den här ändringen, av skälet ovan. Den blir en
  egen ADR när kontrastfrågan är avgjord.
- **Behålla `#467c45`** — avvisad: värdet är felaktigt och finns inte hos förbundet.

## Konsekvenser

- Loggan i sidhuvud, meny och sidfot är förbundets egen, i rätt färg.
- Sajtens gröna tokens avviker tills vidare från profilen, och avvikelsen står dokumenterad
  i `docs/05-design/index.md` §2 i stället för att vara osynlig.
- Externa källor är spårbara. En källa som försvinner från nätet går att känna igen på sin
  kontrollsumma, och en källa som ändras tyst går att upptäcka.
- Vi kan inte göra en gårdslogga. Behöver gården ett eget märke är vägen att be förbundets
  kommunikationsgrupp om ett namnlås, vilket profilen erbjuder.
