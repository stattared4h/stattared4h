# Datakontrakt

Detta dokument definierar datastrukturen för gårdens data.

Kontraktet ändras inte lättvindigt: sidor och validering bygger på det. Se
[ADR 0002](adr/0002-yaml-som-databas.md) för varför datat är YAML-filer i repot.

**Fältnamnen är engelska, värdena svenska** — se
[ADR 0006](adr/0006-sprak-i-kod-och-dokumentation.md). Varje fält förklaras på svenska
nedan, så att den som redigerar en fil kan slå upp vad det betyder.

---

## 1. Vad datat är till för

Datat finns för **besökaren**. Det är inte en journal, inte ett stambokssystem och
inte ett driftsregister för gården. Det svarar på tre frågor: <!-- 04-§1.1 -->

- Vilka djur finns här, och hur ser de ut?
- Vem är släkt med vem?
- Vilka djurslag går i vilken hage?

Allt som inte tjänar någon av de frågorna hör inte hemma här. <!-- 04-§1.2 -->

---

## 2. Filer och placering

Datat finns i två dataset med identisk struktur: `source/data/` med gårdens riktiga
uppgifter, och `source/data-qa/` med påhittade djur som testerna körs mot. Vilket som
läses styrs av `DATA_DIR`, se [`06-MILJOER.md`](06-MILJOER.md). Bara `*.yaml`-filer läses;
en `README.md` i katalogen är tillåten och ignoreras. Ändras det här kontraktet ändras
QA-datat i samma commit. <!-- 04-§2.3 -->

```text
source/data/
├── species.yaml              # vokabulär: arterna vi känner igen
├── breeds.yaml               # vokabulär: raserna
├── populations.yaml          # djur som redovisas som antal per ras
├── animals/<djur-id>.yaml    # en fil per djur
└── locations/<plats-id>.yaml # en fil per hage eller plats
```

Regeln bakom uppdelningen: **egen fil för det som har en egen publik sida. En
gemensam fil för kontrollerad vokabulär.** <!-- 04-§2.1 -->

Djur och platser har egna sidor, växer i innehåll och redigeras var för sig — därför
egna filer, som aldrig kolliderar när flera redigerar samtidigt. Arter och raser är ett
femtontal poster som ändras några gånger om året och läses bäst som en lista. <!-- 04-§2.2 -->

Vissa djurslag, exempelvis höns, presenteras inte som namngivna individer. De lagras i
`populations.yaml` som ett antal per ras. En art får finnas antingen i `animals/` eller
i `populations.yaml`, aldrig i båda. <!-- 04-§2.4 -->

---

## 3. Identifierare

**Filnamnet är postens id.** `animals/rosa.yaml` har id:t `rosa`. Id:t upprepas inte
inuti filen — det skulle vara samma faktum på två ställen. <!-- 04-§3.1 -->

- Små bokstäver `a–z`, siffror och bindestreck. Inga åäö, inga mellanslag, inga
  versaler. `Lilla Gumman` blir `lilla-gumman`. <!-- 04-§3.2 -->
- Svenska tecken skrivs om: `å` och `ä` blir `a`, `ö` blir `o`. `Snöbollen` blir
  `snobollen`, `Björkhagen` blir `bjorkhagen`. Regeln kan ge id:n som liknar varandra —
  `får` blir `far` — vilket är acceptabelt eftersom id:t aldrig visas för besökaren.
  Skulle två poster få samma id fälls valideringen och den ena får ett förtydligande
  tillägg. <!-- 04-§3.4 -->
- **Ändras aldrig.** Länkar, bokmärken och QR-koder pekar på id:t. Ett djur som byter
  namn behåller sitt id. <!-- 04-§3.3 -->

---

## 4. Djur — `animals/<id>.yaml`

```yaml
name: string                 # djurets namn, t.ex. "Rosa"
species: string              # art-id ur species.yaml
breed: string | null         # ras-id ur breeds.yaml
sex: female | male | unknown
born: YYYY-MM-DD | YYYY | null   # helt datum, eller bara år
mother: string | null        # djur-id, om mamman finns i registret
father: string | null        # djur-id, om pappan finns i registret
status: here | gone          # finns på gården, eller har lämnat den
description: string | null   # markdown, presentationstexten
photos:
  - file: string             # filnamn i source/images/animals/
    alt: string              # alternativtext på svenska, obligatorisk
    credit: string           # fotograf eller rättighetshavare
    portrait: boolean        # true på bilden som används som porträtt
```

Obligatoriskt: `name`, `species`, `sex` och `status`. Övrigt får utelämnas. <!-- 04-§4.1 -->

`born` skrivs utan citattecken. YAML läser `2021-04-12` som ett datum och `2016` som ett
heltal; valideraren tar emot båda, och även text, och normaliserar till `YYYY-MM-DD`
eller `YYYY` (`02-§6.7`). <!-- 04-§4.6 -->

### Ingen plats på djuret

Ett djur har **inget** `location`-fält, och får aldrig få ett. Djuren flyttas ofta
individuellt, så en individuell platsuppgift vore inaktuell inom dagar — och ett register
som ljuger är sämre än inget register. Var djurslagen finns står på platsen i stället.
Se [ADR 0012](adr/0012-ingen-individuell-platssparning.md). <!-- 04-§4.2 -->

### Ingen journal

Det finns inga händelser, inga vägningar, inga behandlingar och inga
ankomstdatum. Sådant hör till gårdens drift, inte till besökarens sajt. Ett djur som
lämnat gården får `status: gone` och behålls, så att länkar och historik
överlever. <!-- 04-§4.3 -->

### Stamtavla

`mother` och `father` pekar på djur-id. Avkomma härleds genom att söka baklänges — den
skrivs aldrig in, eftersom den då skulle stå på två ställen och kunna glida
isär. <!-- 04-§4.4 -->

Föräldrar som inte finns i registret utelämnas. Ska en utomstående far nämnas hör det
hemma i `description`. <!-- 04-§4.5 -->

### Räknade bestånd — `populations.yaml`

När gården bara redovisar antal, utan publika individsidor, lagras djuren per art och
ras: <!-- 04-§4.7 -->

```yaml
populations:
  - species: hons
    breed: svart-dvarghons
    count: 18
  - species: hons
    breed: orusthons
    count: 14
```

Alla tre fält är obligatoriska. `count` är ett positivt heltal, arten och rasen måste
finnas i vokabulären och rasen måste höra till arten. Samma kombination får bara stå en
gång. En art med räknade bestånd får inte samtidigt ha poster i `animals/`; det skulle
blanda en exakt lista med ett sammanräknat antal. <!-- 04-§4.8 -->

---

## 5. Platser — `locations/<id>.yaml`

Platsen är sajtens nav: QR-koden på hagen pekar hit, och härifrån väljer besökaren
djuren som finns där. <!-- 04-§5.1 -->

```yaml
name: string                 # platsens namn, t.ex. "Gethagen"
species: [string]            # art-id:n som går här nu — kan vara flera
note: string | null          # kort mänsklig upplysning, t.ex. "Här går bockarna."
description: string | null   # markdown
lat: number | null           # WGS84 i decimalgrader, t.ex. 57.412300
lon: number | null
accessible: boolean          # nåbar med rullstol eller barnvagn
active: boolean              # false för platser som inte används just nu
```

Obligatoriskt: `name`, `species`, `accessible` och `active`. `species` får vara en tom
lista. Övrigt får utelämnas. <!-- 04-§5.6 -->

Regler:

- `species` är listan över **djurslag**, inte individer. Flera djurslag kan gå i samma
  hage, och samma djurslag kan finnas på flera platser. <!-- 04-§5.2 -->
- `accessible` sätts medvetet för varje plats. Utelämnas fältet fälls valideringen — det
  är ingen uppgift att gissa. <!-- 04-§5.3 -->
- En inaktiv plats behålls, så att en uppsatt QR-kod aldrig leder till en död
  sida. <!-- 04-§5.4 -->
- Att flytta ett djurslag är två ändringar: ta bort arten ur en platsfil, lägg till den i
  en annan. Ingen validering kan fånga en glömd halva, eftersom samma djurslag på två
  platser också kan vara sant. <!-- 04-§5.5 -->

---

## 6. Arter — `species.yaml`

```yaml
species:
  - id: string               # t.ex. "get"
    name: string             # singular, "Get"
    plural: string           # "Getter"
    photo:                   # frivillig: bilden i djurslagsrutorna och på artsidan
      file: string           # filnamn i source/images/species/
      alt: string
      credit: string
```

Arten anges en gång här, så att "get" och "getter" stavas likadant överallt. <!-- 04-§6.1 -->

Redaktionell text om en art — vad de äter, hur de beter sig — skrivs som Markdown under
`source/content/arter/<id>.md`, inte i den här filen. Struktur i YAML, prosa i
Markdown. <!-- 04-§6.2 -->

`photo` är frivillig, men valideringen varnar när den saknas, eftersom djurslagsrutan på
platssidan (`05-§6.24`) bygger på den. Saknas bilden visas artens namn på en ljusgrön
platta (`05-§6.20`). <!-- 04-§6.3 -->

---

## 7. Raser — `breeds.yaml`

```yaml
breeds:
  - id: string
    name: string             # t.ex. "Jämtget"
    species: string          # art-id rasen hör till
    heritage: boolean        # true för svensk lantras
```

<!-- 04-§7.1 -->

---

## 8. Härledda vyer

Inget av detta lagras — allt räknas fram i bygget, så att samma faktum aldrig står på
två ställen. <!-- 04-§8.1 -->

| Vy | Härleds ur |
| --- | --- |
| Vilka djur finns på en plats | platsens `species` → djur med den arten och `status: here` |
| Räknade bestånd på en plats | platsens `species` → poster med den arten i `populations.yaml` |
| Var finns ett djurslag | alla platser vars `species` innehåller arten |
| Ett djurs avkomma | djur vars `mother` eller `father` är detta djur |
| Syskon | djur med samma `mother` eller `father` |
| Djur per ras | djur med det `breed`-id:t |

Djurets egen sida påstår aldrig var individen står. Den säger vilken art djuret är, och
länkar till artsidan som visar var arten finns. <!-- 04-§8.2 -->

---

## 9. Bilder

Bilder ligger i `source/images/animals/`, `source/images/species/`,
`source/images/places/` och `source/images/content/`, platt inom varje mapp, med filnamn
som inleds med postens id. <!-- 04-§9.1 -->

YAML refererar **bara filnamnet**, aldrig en sökväg. Bygget avgör var filen bor, så att
lagringen kan bytas utan att datat rörs. <!-- 04-§9.2 -->

Bara webbanpassade bilder läggs i repot — WebP, högst 1600 px och 250 KB. Original bevaras
i gårdens eget arkiv. Se [ADR 0008](adr/0008-bilder-i-repot.md). <!-- 04-§9.3 -->

---

## 10. Validering

Valideringen körs i CI och fäller bygget. Den kontrollerar: <!-- 04-§10.1 -->

- Att obligatoriska fält finns. <!-- 04-§10.2 -->
- Att filnamnen följer id-formatet i §3. <!-- 04-§10.3 -->
- Att `born` är ett giltigt datum eller årtal, och inte i framtiden. <!-- 04-§10.4 -->
- Att varje `species`, `breed`, `mother` och `father` pekar på något som finns. <!-- 04-§10.5 -->
- Att räknade bestånd har positiva heltalsantal, giltig art–ras-kombination och inte
  blandas med individuella poster för samma art. <!-- 04-§10.12 -->
- Att ingen stamtavla går i cirkel, och att ingen är sin egen förälder. <!-- 04-§10.6 -->
- Att varje refererad bildfil finns, har alternativtext och upphovsuppgift, och håller sig
  inom mått- och storleksgränsen. <!-- 04-§10.7 -->
- Att inget djur har ett `location`-fält. <!-- 04-§10.8 -->
- Att inget fält innehåller HTML. Innehåll är markdown eller ren text. <!-- 04-§10.9 -->
- Att inget fält finns som kontraktet inte känner till, så att ett felstavat fältnamn
  inte tyst ignoreras. <!-- 04-§10.11 -->

Valideringen ger dessutom **varningar** som inte fäller bygget, för sådant som är tillåtet
men troligen ett förbiseende: ett djur utan foto, en aktiv plats utan djurslag, en plats
utan koordinater. <!-- 04-§10.10 -->
