# QA-data

Påhittade djur. **Ingen individ här motsvarar ett verkligt djur på Stättared.**

Datasetet finns av två skäl: testerna ska köras mot data som aldrig ändras när gården
säljer en get, och ett QA-bygge ska kunna visa sajten utan att röra riktigt innehåll.

**Platserna bär däremot gårdens riktiga namn.** Djuren byts ut stup i kvarten, men
hagarna och husen ligger kvar; att hitta på platsnamn gjorde bara QA-kartan obegriplig
att jämföra med gårdens egen. Vilka djur som står på vilken plats är fortfarande
påhittat.

Strukturen är identisk med `source/data/` och följer
[datakontraktet](../../docs/04-DATAKONTRAKT.md). Ändras kontraktet ändras det här
datasetet i samma commit — annars slutar testerna bevaka det de påstår sig bevaka.

Datasetet har **100 namngivna individer** och **32 höns i två räknade bestånd**. De
100 individerna är fördelade på 20 getter, 20 får, 10 kor, 10 hästar, 20 grisar,
18 kaniner och 2 katter. Hönsen är 18 Svarta dvärghöns och 14 Orusthöns. Alla namn,
antal och övriga uppgifter är påhittade.

Art- och rasurvalet följer gårdens sida
[Våra djur](https://www.4h.se/stattared/varadjur/), kompletterat med de två hönsraser
som gården har uppgett för projektet.

## Vad datasetet täcker

De namngivna posterna nedan prövar särskilda kontraktsfall. De övriga individerna
prövar större listor, svensk sortering och att samtliga arter och raser används.

| Post | Fall som prövas |
| --- | --- |
| `rosa` | Fullständigt djur: alla fält satta, tre foton, båda föräldrarna kända |
| `stjarna` | `born` som enbart årtal; mamma till två djur |
| `bocken` | `status: gone`; förälder som lämnat gården; delar foto med andra jämtgetter |
| `lilla-gumman` | Flerordigt namn → id med bindestreck; `born` och `breed` saknas; syskon till Rosa via samma mamma; **delar ett foto med Rosa** — fallet som gjorde bilden till en egen post (ADR 0015) |
| `tuva` | Bara obligatoriska fakta och ett delat foto; saknar ras, födelseuppgift och släkt |
| `snobollen` | Ö i namnet; annan art än de föregående |
| `bagaren` | Hane med foto, i samma hage som en annan art |
| `majros` | Ensam individ av sin art; flera foton, där den första är porträttet |
| `vinter` | `sex: unknown`; art som inte finns på någon plats |
| `bomull` | Förälder med `status: gone` till två djur som finns kvar |
| `nystan` | Barn till ett bortgånget djur; syskon till Dagg |
| `dagg` | Syskon med samma mamma och samma födelsedatum; `status: gone` |

| Plats | Fall som prövas |
| --- | --- |
| `brackebur` | Normalfallet: ett djurslag, koordinater, `note`; **plats med bilder**, varav en delas med Rosa och Lilla Gumman |
| `tamossen` | **Samma djurslag på två platser** — kärnfallet i ADR 0012; `description` med en **markdown-bild**, så bygget prövar `02-§8.12` |
| `lygnslatt-1` | **Flera djurslag i samma hage**; `accessible: false` |
| `b` | Plats vars djurslag delas med `kaninhagen` |
| `a` | Aktiv plats utan djurslag → tom platssida, och en varning i valideringen |
| `d` | Inaktiv plats utan koordinater → QR-koden får inte leda till en död sida |
| `lygnslatt-2` | Nytt djurslag med många individer |
| `honshuset` | Ett djurslag som representeras av räknade bestånd i stället för individer |
| `c` | Ett litet bestånd med bara två individer |
| `grillplatsen-vid-gardsplanen` | Finns för att QA-datat ska innehålla **varje sort i `kind`** (`04-§5.7`), så att kartans åtta symboler alla byggs; `tests/domain/qa-data.test.ts` kräver det |

Varje värde i `kind` finns representerat: `djurplats` i hagarna, `mat` i `cafeet` och
`lottas-vaffelstuga`, `grill` i `grillplatsen-vid-gardsplanen`, `toalett` i
`toaletterna`, `parkering` i de två parkeringarna, `lek` i `lekplatsen` och
`kapphastbanan`, `boende` i `vandrarhemmet` och `husbil` i `stallplatsen`.

Arten `hast` finns medvetet på **ingen** plats, så att artsidan prövas när svaret på
"var finns hästarna?" är att vi inte vet.

## Bilder

Varje bild är en egen post i `images/` med `alt` och `credit`
([ADR 0015](../../docs/adr/0015-bilden-som-egen-post.md)); djur, platser och arter
refererar bild-id:n. Datasetet har cirka 25 bildposter som delas av flera djur, och
varje post används av minst en annan post — annars varnar valideringen (`02-§8.13`).
Alla 100 djur har minst en bildreferens; en plats utan bilder finns kvar för att pröva
det tillåtna fallet.

Bildfilerna i `source/images-qa/` är fotorealistiska AI-bilder med inbränd märkning och
versionshanteras enligt ADR 0017. `npm run qa:images` skapar bara enfärgade
platshållare för filer som ännu saknas. Bildkatalogen följer datasetet (`04-§9.4`), så
QA-bilderna blandas aldrig med gårdens bilder i `source/images/`.

Id:na här är inte hashar av bildfilerna, utan bestämda när datasetet skrevs. En AI-bild
kan då genereras och importeras på nytt utan att alla referenser byter id
(`04-§9.10`).

Kör kommandot innan ett QA-bygge och när en post får en ny bildreferens. En fil som
redan finns lämnas orörd, så en omkörning är omedelbar.
