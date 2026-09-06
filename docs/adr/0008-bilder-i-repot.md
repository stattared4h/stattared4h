# 0008 — Fotografier commit:as som binärer; härledda format genereras

**Status:** Antagen, 2026-09-06

## Sammanhang

En sajt om gårdens djur står och faller med bilderna. Varje djur behöver ett porträtt, och
spelen — särskilt djurbingo och gissa djuret — bygger helt på att besökaren känner igen
djuret på bild.

Libell löser bildfrågan genom att förbjuda binärer helt och generera all grafik från SVG.
Det fungerar för en app vars enda grafik är ett diagram. Det fungerar inte för fotografier
av kor.

## Beslut

Fotografier commit:as som binärfiler under `source/images/`, i ett originalformat och en
rimlig upplösning. Bygget genererar de härledda formaten: beskurna storlekar för kort,
porträtt och spelbrickor, samt moderna format som WebP. De genererade filerna
versionshanteras inte.

Varje bild har en post i datat med fotograf, upphovsrätt och alternativtext. En bild utan
alternativtext fäller valideringen.

Grafik som *är* form snarare än fotografi — ikoner, appikonen, dekorativa element — ritas
som SVG och genereras till PNG vid behov, i Libells anda.

## Övervägda alternativ

- **Textfritt repo som Libell** — avvisad: fotografier går inte att generera ur kod.
- **Bilder på extern bildtjänst** — avvisad: ett externt beroende med kostnad och
  livslängd, och det bryter offline-läget i ADR 0004.
- **Git LFS** — avvisad: infrastruktur att förvalta för en bildmängd som ryms i vanlig
  git, så länge originalen hålls i rimlig storlek.
- **Commit:a även de härledda formaten** — avvisad: samma bild i sex varianter i historiken
  gör repot tungt utan att tillföra något, eftersom de går att räkna fram.

## Konsekvenser

- Repot växer med bildmängden. Originalen ska hållas nere i storlek; riktigt stora
  originalfiler hör hemma i gårdens eget arkiv, inte här.
- Ett borttaget foto finns kvar i git-historiken. Det spelar roll om en bild måste tas bort
  av upphovsrättsliga skäl eller för att någon på bilden ber om det — då krävs mer än en
  vanlig commit, och `docs/01-BIDRA.md` beskriver det.
- Bygget behöver ett bildbehandlingsbibliotek. Det är ett byggberoende; inget av det når
  besökaren.
- Bilder på identifierbara personer, i synnerhet barn, kräver samtycke. Det är en
  redaktionell regel, inte en teknisk — den står i `docs/05-design/bilder-och-tillganglighet.md`.
