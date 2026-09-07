# QA-data

Påhittade djur och platser. **Ingen post här motsvarar ett verkligt djur på Stättared.**

Datasetet finns av två skäl: testerna ska köras mot data som aldrig ändras när gården
säljer en get, och ett QA-bygge ska kunna visa sajten utan att röra riktigt innehåll.

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
| `rosa` | Fullständigt djur: alla fält satta, två foton, båda föräldrarna kända |
| `stjarna` | `born` som enbart årtal; mamma till två djur |
| `bocken` | `status: gone`; helt utan foton; förälder som lämnat gården |
| `lilla-gumman` | Flerordigt namn → id med bindestreck; `born` och `breed` saknas; syskon till Rosa via samma mamma |
| `tuva` | Minsta möjliga djur — bara de obligatoriska fälten |
| `snobollen` | Ö i namnet; annan art än de föregående |
| `bagaren` | Hane med foto, i samma hage som en annan art |
| `majros` | Ensam individ av sin art; flera foton med ett porträtt |
| `vinter` | `sex: unknown`; art som inte finns på någon plats |
| `bomull` | Förälder med `status: gone` till två djur som finns kvar |
| `nystan` | Barn till ett bortgånget djur; syskon till Dagg |
| `dagg` | Syskon med samma mamma och samma födelsedatum; `status: gone` |

| Plats | Fall som prövas |
| --- | --- |
| `gethagen` | Normalfallet: ett djurslag, koordinater, `note` |
| `bjorkhagen` | **Samma djurslag på två platser** — kärnfallet i ADR 0012 |
| `stora-hagen` | **Flera djurslag i samma hage**; `accessible: false` |
| `smadjurshuset` | Inomhusplats med eget djurslag |
| `ovre-hagen` | Aktiv plats utan djurslag → tom platssida, och en varning i valideringen |
| `gamla-stallet` | Inaktiv plats utan koordinater → QR-koden får inte leda till en död sida |
| `grishagen` | Nytt djurslag med många individer |
| `honshuset` | Ett djurslag som representeras av räknade bestånd i stället för individer |
| `kattvinden` | Ett litet bestånd med bara två individer |

Arten `hast` finns medvetet på **ingen** plats, så att artsidan prövas när svaret på
"var finns hästarna?" är att vi inte vet.

## Vad som ännu saknas

Bildfilerna som posterna refererar finns inte. De skapas när bildkedjan byggs, som
genererade platshållare — inga påhittade fotografier commit:as. Fram till dess kan
valideringen inte kontrollera att en bild existerar.
