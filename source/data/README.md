# Gårdens data

Här bor Stättareds verkliga data om djur, arter, raser och platser, enligt
[datakontraktet](../../docs/04-DATAKONTRAKT.md).

```text
source/data/
├── species.yaml
├── breeds.yaml
├── animals/<djur-id>.yaml
└── locations/<plats-id>.yaml
```

Katalogen är tom tills de första djuren förts in. Testerna körs aldrig mot den här
datan — de använder [`source/data-qa/`](../data-qa/README.md), så att ett test aldrig
kan börja fallera för att gården sålt en get.

Se [`docs/01-BIDRA.md`](../../docs/01-BIDRA.md) för hur en ändring görs.
