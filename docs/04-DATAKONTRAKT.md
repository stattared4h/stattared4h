# Datakontrakt

Detta dokument definierar den officiella datastrukturen för gårdens data.

Kontraktet ändras inte lättvindigt: sidor, spel och validering bygger på det. Se
[ADR 0002](adr/0002-yaml-som-databas.md) för varför datat är YAML och inte en
databasmotor.

**Fältnamnen är engelska, värdena svenska** — se [ADR 0006](adr/0006-sprak-i-kod-och-dokumentation.md).
Varje fält förklaras på svenska nedan, så att den som redigerar en fil kan slå upp vad
det betyder.

---

## 1. Filer och placering

| Fil | Innehåll |
| --- | --- |
| `source/data/animals.yaml` | Gårdens djur |
| `source/data/activities.yaml` | Aktiviteter och öppettider |
| `source/data/places.yaml` | Platser på gården, med koordinater |
| `source/data/hunts/<id>.yaml` | En skattjakt per fil |

En fil per ämne håller diffarna små och konflikterna få när flera redigerar
samtidigt. <!-- 04-§1.1 -->

---

## 2. Identifierare

Alla `id`-fält följer samma regler: <!-- 04-§2.1 -->

- Små bokstäver `a–z`, siffror och bindestreck. Inga åäö, inga mellanslag, ingen
  versal. <!-- 04-§2.2 -->
- Härleds från namnet: `Rosa` blir `rosa`, `Lilla Gumman` blir `lilla-gumman`.
- **Ändras aldrig** efter att posten skapats. Länkar, bokmärken och sparat spelframsteg
  pekar på id:t. Ett djur som byter namn behåller sitt id. <!-- 04-§2.3 -->
- Måste vara unikt inom sin fil. Dubbletter fäller valideringen. <!-- 04-§2.4 -->

---

## 3. Djur — `animals.yaml`

```yaml
animals:
  - id: string                 # stabil identifierare, ändras aldrig
    name: string               # djurets namn, t.ex. "Rosa"
    species: string            # art-id ur listan i §3.3, t.ex. "get"
    sex: female | male | unknown
    born: YYYY-MM-DD | YYYY    # helt datum, eller bara år om dagen är okänd
    arrived: YYYY-MM-DD | null # när djuret kom till gården, om det inte fötts här
    status: here | away | remembered
    home: string               # plats-id ur places.yaml, där djuret normalt finns
    description: string        # markdown, presentationstexten på djurets sida
    traits: [string]           # korta egenskaper som visas som etiketter
    clues: [string]            # ledtrådar till "gissa djuret", se §3.4
    photos:
      - file: string           # sökväg i source/images/
        alt: string            # alternativtext på svenska, obligatorisk
        credit: string         # fotograf eller rättighetshavare
        portrait: boolean      # true på den bild som används som porträtt
```

### Obligatoriska fält

`id`, `name`, `species`, `sex`, `status`, `home` och `description` är obligatoriska.
Övriga får utelämnas. <!-- 04-§3.1 -->

### `status`

| Värde | Betydelse |
| --- | --- |
| `here` | Finns på gården nu och visas överallt |
| `away` | Tillfälligt borta, visas men markerad |
| `remembered` | Har lämnat gården, visas bara i minnesavsnittet och deltar inte i spel |

Ett djur raderas aldrig ur filen när det lämnar gården — det får `remembered`. Att radera
posten skulle bryta länkar och göra historien osynlig. <!-- 04-§3.2 -->

### `species`

Arten anges som ett id, och arterna definieras en gång i `source/data/species.yaml` med
svenskt namn i singular och plural samt en ikon. Det gör att "get" och "getter" stavas
likadant överallt. <!-- 04-§3.3 -->

### `clues`

Ledtrådarna används av spelet "gissa vad djuret heter". Varje ledtråd är en fristående
mening som inte avslöjar namnet, ordnade från svårast till lättast. Ett djur behöver minst
tre ledtrådar för att kunna delta i spelet. <!-- 04-§3.4 -->

### Vad ett djur behöver för att vara med i spelen

Kraven uttrycks i datat, inte i koden. Ett djur som inte uppfyller dem hoppas över, och
valideringen påpekar det. <!-- 04-§3.5 -->

| Spel | Krav |
| --- | --- |
| Djurbingo | `status: here` och minst ett foto med `portrait: true` |
| Gissa djuret | `status: here`, ett porträttfoto och minst tre `clues` |
| Skattjakt | Djuret refereras från en post i en skattjaktsfil |

---

## 4. Aktiviteter — `activities.yaml`

```yaml
activities:
  - id: string
    title: string              # aktivitetens namn
    kind: recurring | dated    # återkommande eller enskilt tillfälle
    description: string        # markdown
    place: string              # plats-id ur places.yaml
    audience: string | null    # t.ex. "Från 6 år", "Hela familjen"
    booking: none | required | recommended
    link: string | null        # extern länk, t.ex. till bokning

    # när kind: dated
    date: YYYY-MM-DD
    start: "HH:MM"
    end: "HH:MM" | null

    # när kind: recurring
    weekdays: [mon|tue|wed|thu|fri|sat|sun]
    season_start: MM-DD | null # första dagen på säsongen, utan år
    season_end: MM-DD | null
```

Regler: <!-- 04-§4.1 -->

- `end` måste vara efter `start` när båda finns. <!-- 04-§4.2 -->
- En `dated`-aktivitet vars datum passerat visas inte bland kommande aktiviteter, men
  raderas inte ur filen. <!-- 04-§4.3 -->
- En `recurring`-aktivitet utan säsongsfält gäller året runt. <!-- 04-§4.4 -->
- Sorteringen är deterministisk: datum och starttid först, därefter `id`. Två aktiviteter
  kan aldrig byta plats mellan två bygganden. <!-- 04-§4.5 -->

---

## 5. Platser — `places.yaml`

```yaml
places:
  - id: string
    name: string               # platsens namn, t.ex. "Ladugården"
    description: string | null # markdown
    lat: number | null         # WGS84, sex decimaler
    lon: number | null
    accessible: boolean        # nåbar med rullstol eller barnvagn
```

Regler: <!-- 04-§5.1 -->

- Varje `home` i `animals.yaml`, `place` i `activities.yaml` och plats i en skattjakt
  måste peka på ett `id` som finns här. Valideringen kontrollerar det. <!-- 04-§5.2 -->
- `lat` och `lon` får utelämnas för platser som inte ska ligga på kartan, men en plats i
  en skattjakt måste ha koordinater. <!-- 04-§5.3 -->
- `accessible` sätts medvetet för varje plats. Utelämnas fältet fäller valideringen —
  det är ingen uppgift att gissa. <!-- 04-§5.4 -->

---

## 6. Skattjakter — `hunts/<id>.yaml`

```yaml
hunt:
  id: string
  title: string
  description: string          # markdown, vad jakten går ut på
  audience: string             # t.ex. "Från 7 år"
  duration_minutes: number     # ungefärlig tid
  order: fixed | any           # måste posterna tas i ordning?

stations:
  - id: string
    place: string              # plats-id ur places.yaml, måste ha koordinater
    clue: string               # ledtråden som leder hit
    question: string | null    # frågan som besvaras på plats
    answer: string | null      # rätt svar, jämförs okänsligt för versaler och blanksteg
    animal: string | null      # djur-id, om posten handlar om ett djur
    reveal: string             # texten som visas när posten är klarad
```

Regler: <!-- 04-§6.1 -->

- En skattjakt behöver minst tre poster. <!-- 04-§6.2 -->
- Har en post `question` måste den också ha `answer`. <!-- 04-§6.3 -->
- `answer` jämförs efter att versaler, inledande och avslutande blanksteg samt
  dubbla mellanslag normaliserats. Svaret ska vara ett enda ord eller ett kort
  uttryck — inte en mening ett barn ska stava rätt. <!-- 04-§6.4 -->
- Posternas `id` är unika inom jakten, och används för att spara framsteg i
  webbläsaren. De ändras aldrig, för då tappar en pågående jakt sitt läge. <!-- 04-§6.5 -->

---

## 7. Validering

Valideringen körs i CI och fäller bygget. Den kontrollerar: <!-- 04-§7.1 -->

- Att alla obligatoriska fält finns. <!-- 04-§7.2 -->
- Att alla `id` följer formatet i §2 och är unika. <!-- 04-§7.3 -->
- Att datum är giltiga och att sluttid ligger efter starttid. <!-- 04-§7.4 -->
- Att varje referens till en plats, ett djur eller en art pekar på något som
  finns. <!-- 04-§7.5 -->
- Att varje refererad bildfil finns i `source/images/` och har alternativtext och
  upphovsuppgift. <!-- 04-§7.6 -->
- Att inget fält innehåller HTML. Innehåll är markdown eller ren text. <!-- 04-§7.7 -->

Valideringen ger dessutom **varningar** som inte fäller bygget, för sådant som är tillåtet
men troligen ett förbiseende: ett djur utan foto, ett `here`-djur utan ledtrådar, en plats
utan koordinater. <!-- 04-§7.8 -->
