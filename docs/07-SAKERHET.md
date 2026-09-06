# Säkerhet i ett publikt repo

Den här sidan riktar sig till den som förvaltar repot. Läs den innan du pushar, och en
gång till innan du lägger till kod som rör konfiguration, hemligheter eller externa
tjänster.

Att göra ett repo publikt delar mer än filerna i den aktuella arbetskopian.
**Git-historik, commit-uppgifter, grenar, taggar, ärenden, pull requests, Actions-loggar
och artefakter är också publika.** Ett lösenord som raderades förra veckan ligger kvar i
förra månadens commit, och publika repon klonas, förgrenas och speglas av automatik inom
minuter.

> **Kortversionen:** commit:a aldrig `.env`, lösenord, tokens eller nycklar, och
> hårdkoda aldrig något som beskriver en verklig värd, ett nätverk eller ett konto.
> Använd platshållare som `example.com` och `192.0.2.10` i dokumentationen.

## 1. Commit:a aldrig inloggningsuppgifter

Lägg aldrig in:

- `.env` eller någon miljöfil med verkliga värden,
- lösenord eller lösenfraser,
- API-nycklar, åtkomsttokens, sessionstokens eller webhook-hemligheter,
- privata SSH-nycklar,
- privata TLS-nycklar och nyckellager,
- JSON-filer för tjänstekonton i molnet,
- `.npmrc` eller `.netrc` med autentisering mot register eller värd,
- anslutningssträngar till databaser som innehåller inloggningsuppgifter,
- autentiseringskakor, testdata eller inspelade HTTP-anrop med verkliga tokens.

`.gitignore` är ett skyddsnät, inte en säkerhetsgräns. Titta på det du är på väg att
commit:a:

```bash
git status
git diff --cached
```

Repot ignorerar `.npmrc`, `.vscode/` och `.idea/` eftersom de är vanliga läckvägar.
Behöver projektet någon gång en incheckad, hemlighetsfri version av en sådan fil läggs
den till medvetet med `git add -f`, efter att innehållet granskats.

## 2. Håll miljöspecifika uppgifter utanför koden

Det publika repot ska innehålla återanvändbar kod och exempel — inte en karta över en
verklig driftmiljö.

Lägg inte in:

- publika eller privata IP-adresser som hör till en verklig värd,
- privata eller administrativa DNS-namn,
- interna adresser, hinknamn, könamn eller projektidentifierare,
- konfiguration för VPN, router eller brandvägg,
- SSH-konfiguration som namnger verkliga värdar,
- skärmbilder eller loggar med adresser, kontonamn eller tokens,
- personuppgifter av något slag.

Läs konfiguration ur miljön i stället för att hårdkoda den:

```js
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error("API_KEY is not set");
}
```

När projektet behöver konfiguration commit:as en `.env.example` med platshållarvärden,
medan den verkliga `.env` stannar lokalt. Repots `.gitignore` släpper igenom
`.env.example` men ignorerar alla andra `.env`-varianter.

Se också till att koden inte läcker hemligheter under körning: logga inte tokens, ta
inte med dem i felmeddelanden, och skicka dem inte till externa felrapporteringstjänster.

## 3. Kom ihåg att git sparar historik

Att ta bort en känslig fil i en senare commit tar **inte** bort den ur tidigare commits.
Granska historiken, inte bara arbetskopian:

```bash
git log --all --stat
git log -p --all
```

Arbetsflödet **Secret scan** kör Gitleaks mot hela historiken vid varje push och pull
request. Kontrollera att det är grönt.

Har en verklig hemlighet någon gång commit:ats: byt ut eller återkalla den först. Att
skriva om historiken kommer i andra hand — en commit:ad hemlighet är röjd, och
omskrivningen når inte kloner, förgreningar eller cacher.

## 4. Kontrollera spårade och ignorerade filer

Se exakt vad git spårar:

```bash
git ls-files
```

Titta på de ignorerade filerna också, så att ett oavsiktligt `git add -f` inte passerar
obemärkt:

```bash
git status --ignored
```

## 5. Kontrollera commit-identitet och metadata

Publika commits exponerar författarens namn och e-postadress i varje commit. Ska en
privat adress inte vara publik, ställ in git att använda GitHubs `noreply`-adress innan
du gör nya commits:

```bash
git config user.email "<id>+<användarnamn>@users.noreply.github.com"
```

Granska vad som redan finns:

```bash
git log --format='%h %an <%ae>' --all
```

Inställningen påverkar bara framtida commits; att ta bort en adress ur befintlig historik
kräver att historiken skrivs om.

Reponamn, grennamn, commit-meddelanden, ärendetitlar och kodkommentarer är också publik
metadata. Avgör medvetet om namn på personer, kunder, hushåll eller interna projekt hör
hemma där. Det är ett integritetsbeslut även när det inte är en teknisk sårbarhet.

## 6. Beroenden och leveranskedja

Varje beroende körs med samma behörighet som projektet.

- Lägg till ett beroende bara när det verkligen behövs. Föredra standardbiblioteket och
  små, välunderhållna paket.
- Titta på paketets repo, släpphistorik och underhållsstatus innan du lägger till det.
  Var vaksam på namn som liknar populära paket.
- Commit:a låsfilen, så att byggen är reproducerbara och granskningsbara.
- Granska beroendediffen i en pull request, inte bara koddiffen.
- Låt Dependabots grupperade veckovisa pull requests landa i rimlig takt. Kontrollen
  **Dependency review** stoppar pull requests som drar in beroenden med kända allvarliga
  eller kritiska sårbarheter.

CI installerar beroenden med `--ignore-scripts`, så ett komprometterat paket kan inte
köra installationshakar i CI-miljön. Kräver ett bygge verkligen ett livscykelskript,
aktivera det för det enskilda paketet i stället för att ta bort flaggan ur hela
arbetsflödet.

## 7. Säkerhet i GitHub Actions

Arbetsflöden kör tredjepartskod med tillgång till repots token.

- Actions är låsta till fullständiga commit-SHA med en versionskommentar, aldrig till en
  rörlig tagg eller gren. En tagg kan flyttas; en SHA kan det inte.
- Varje arbetsflöde deklarerar `permissions: contents: read` överst och höjer behörighet
  bara i det jobb som behöver det: CodeQL-jobbet har `security-events: write`, deploy-jobbet
  `pages: write` och `id-token: write`, och taggjobbet i produktionsdeployen
  `contents: write`. Inget annat jobb har mer än läsrätt.
- Utcheckningar använder `persist-credentials: false`, så att Actions-token inte blir
  kvar i `.git/config` där bygg- eller testkod kan läsa den.
- Lägg inte till `pull_request_target`, `workflow_run` med indata som inte går att lita
  på, eller egna körmiljöer utan att förstå att de kan exponera hemligheter för kod från
  förgreningar.
- Interpolera aldrig värden som inte går att lita på, till exempel
  `github.event.pull_request.title`, direkt i ett `run:`-block. Skicka dem via `env:`.
- Skriv inte ut hemligheter, och kom ihåg att Actions-loggar i ett publikt repo är
  publika.

När en Action uppdateras:

1. kontrollera repot och släppet uppströms,
2. läs släppanteckningarna,
3. uppdatera den låsta commit-SHA:n,
4. behåll versionskommentaren intill SHA:n,
5. granska den efterföljande körningen.

## 8. Inställningar i GitHub

Vissa skydd bor i repots inställningar snarare än i filer. Kontrollera under
**Settings** att:

- **Secret scanning** och **push protection** är påslagna, så att en pushad hemlighet
  stoppas innan den blir publik,
- **Private vulnerability reporting** är påslaget, så att rapportörer har en privat kanal,
- **Dependabot alerts** och **Dependabot security updates** är påslagna,
- **Code scanning** visar resultat från CodeQL-arbetsflödet,
- regelverket **Protect main** är importerat från
  [`.github/rulesets/main-protection.json`](../.github/rulesets/main-protection.json)
  och tillämpas, så att `main` kräver en pull request med gröna säkerhetskontroller,
- arbetsflödens behörighet är läsbehörig som standard, och Actions inte kan godkänna
  pull requests,
- medarbetares åtkomst följer minsta möjliga behörighet, och varje konto med skrivrätt
  använder tvåfaktorsautentisering.

## Checklista före push

Kontrollera allt det här:

- diffen innehåller inga inloggningsuppgifter, tokens, nycklar eller personuppgifter,
- inga verkliga värdnamn, adresser eller kontoidentifierare finns i kod, tester, testdata
  eller dokumentation,
- `.env` och andra lokala filer är ospårade,
- nya beroenden är granskade, och låsfilen är commit:ad,
- ändringar i arbetsflöden behåller låsta SHA och minsta möjliga behörighet,
- kontrollerna **Secret scan**, **CodeQL** och **Dependency review** är gröna,
- commit-författare och commit-meddelanden håller som publik metadata,
- ingen Actions-logg eller artefakt innehåller känsliga uppgifter.

Se [säkerhetspolicyn](../SECURITY.md) för hur ett säkerhetsproblem rapporteras, och vad
som gäller när en hemlighet hamnat i repot.
