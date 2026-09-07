---
name: smoke-check
description: Vérifier de bout en bout qu'une modification n'a pas cassé le plugin. Exécute réellement les scripts et le serveur MCP, contrôle le contrat entre le gabarit de brief et l'agrégateur, et revérifie les invariants dont l'absence de donnée client dans l'arbre versionné. À lancer après toute modification de logique, de gabarit de sortie ou de skill, car le projet n'a aucune suite de tests et tsc ne prouve que la compilation.
---

# Smoke-check du plugin

**Pourquoi :** il n'y a ni tests, ni linter. `npm run build` prouve que ça **compile**, pas que ça
**marche**. Cette procédure est le seul contrôle de bout en bout. Elle ne touche jamais Jira en
écriture et n'a besoin d'un jeton qu'à l'étape 6, qui est optionnelle.

Toutes les commandes se lancent depuis la racine du dépôt.

## 1. Build d'abord, obligatoire

```bash
npm run build
```

Doit sortir en code 0. Construit `dist/` **et** `mcp/dist/`. Les étapes suivantes exécutent `dist/`,
pas `scripts/` : sans rebuild, tu testes l'ancien code. C'est l'erreur la plus fréquente ici.

## 2. L'agrégateur tourne et compte juste

```bash
npm run actions
```

Attendu, une ligne de la forme :

```
Wrote DO-NOW.md, MESSAGES.md and INDEX.md from 7 brief(s): 13 step(s), 7 message(s)
```

Contrôles :

- le nombre de briefs égale `ls engagement/output/tickets/*.md | wc -l` ;
- les trois fichiers de `engagement/output/` viennent d'être réécrits ;
- `engagement/output/ACTIONS.md` **n'existe pas** (le script supprime ce vestige) ;
- aucun ticket de `engagement/worklist.txt` n'a disparu de `engagement/output/INDEX.md`.

S'il n'y a pas de dossier `engagement/`, cette étape ne prouve rien : le dépôt est sans mandat.
Le dire dans le compte rendu plutôt que de la déclarer réussie.

## 3. Le contrat brief / agrégateur tient toujours

C'est le point de rupture silencieux du dépôt : `skills/hcm-debugging/output-format.md` décrit le
format, `scripts/build_actions.ts` le parse, et rien ne relie mécaniquement les deux.

```bash
grep -A 20 "REQUIRED_FIELDS" scripts/build_actions.ts
grep -n "^my_move\|^severity\|^status_target\|^root_cause" skills/hcm-debugging/output-format.md
```

Puis vérifier que l'échec est **bruyant** : retirer temporairement une ligne de frontmatter d'un
brief, relancer `npm run actions`, et confirmer que le script nomme le fichier et le champ manquant.
**Remettre la ligne.**

Vérifier aussi qu'un ticket `my_move: send` porteur d'étapes les affiche toujours dans `DO-NOW.md`,
sous « Still yours afterwards ». Cette combinaison a déjà perdu onze étapes en silence.

## 4. Les invariants

```bash
# Jira en lecture seule : aucun verbe d'ecriture
grep -nE "method:\s*[\"']?(POST|PUT|PATCH|DELETE)" scripts/jira_ingest.ts

# Aucun tiret cadratin dans le produit ni dans les sorties generees.
# Ne PAS elargir a .claude/ : ce fichier contient le motif recherche.
grep -rn "—" skills/ engagement/output/ 2>/dev/null

# Aucun identifiant en dur
grep -rnE "api_token\s*=\s*[\"'][A-Za-z0-9]" scripts/ mcp/src/
```

Les trois doivent ne **rien** retourner. La première est l'invariant le plus important du dépôt.

## 5. Aucune donnée client dans l'arbre versionné

**Le contrôle qui transforme la confidentialité en test plutôt qu'en vigilance.**

Construire le motif à partir du mandat courant, puis chercher partout **sauf** dans `engagement/` :

```bash
grep -rinE "<nom du client>|<PREFIXE>-[0-9]|<noms de personnes>" \
  --exclude-dir=node_modules --exclude-dir=engagement --exclude-dir=dist \
  --exclude-dir=.claude --exclude-dir=.git .
```

Les noms à mettre dans le motif sont dans `engagement/CONTEXT.md` : le client, les personnes, le
préfixe de projet Jira, les comptes de test, les rôles personnalisés.

**Toute occurrence est un défaut à corriger avant de continuer.** Le dépôt ne doit rien savoir du
mandat. Si un exemple a besoin d'une clé de ticket, utiliser `PROJ-1234`.

Vérifier aussi la structure du plugin :

```bash
claude plugin validate .
```

## 6. Le serveur MCP répond

C'est le seul chemin vers du texte Oracle citable mot pour mot, donc son démarrage compte. Le
serveur parle JSON-RPC sur **stdout** et logue sur **stderr**, d'où le `2>/dev/null`. Toujours le
trio `initialize`, `notifications/initialized`, puis l'appel.

```bash
printf '%s\n' \
'{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"smoke","version":"1"}}}' \
'{"jsonrpc":"2.0","method":"notifications/initialized"}' \
'{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' \
| node mcp/dist/index.js 2>/dev/null | grep -o '"name":"[a-z_]*"'
```

Attendu : une ligne par outil exposé, `fetch_oracle_page` obligatoirement présent. Tant que
l'élagage n'est pas fait, `search_oracle_docs` et `list_modules` apparaissent aussi.

Invariant à revérifier dès qu'on a touché `mcp/src/index.ts` : aucune écriture sur stdout.

```bash
grep -n "console\.log" mcp/src/index.ts
```

Doit ne rien retourner. Un seul `console.log` corrompt le protocole pour tous les clients.

**Chemin réseau, seulement si on a touché au cache ou à `jinaGet`.** Passe par Jina Reader, un
tiers : prévoir `timeout 120`, jamais moins, sinon on tue la requête en plein vol et on conclut
à tort à un échec.

```bash
rm -rf ~/.cache/oracle-fusion-docs
printf '%s\n' \
'{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"s","version":"0"}}}' \
'{"jsonrpc":"2.0","method":"notifications/initialized"}' \
'{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"fetch_oracle_page","arguments":{"url":"https://docs.oracle.com/en/cloud/saas/human-resources/faigh/index.html"}}}' \
| timeout 120 node mcp/dist/index.js 2>&1 >/dev/null | grep "fetch_oracle_page"
```

Attendu : un `cache MISS` puis `successfully fetched ... (N chars)`. Un timeout ici est presque
toujours un proxy d'entreprise ou `r.jina.ai` indisponible, pas le code.

## 7. L'ingestion répond, avec jeton, optionnel

Sans argument, l'aide doit s'afficher :

```bash
node dist/jira_ingest.js
```

Avec un `.env` valide, ingérer un ticket connu **dans un dossier jetable** :

```bash
node dist/jira_ingest.js <UNE-CLE-REELLE> --out .smoke-tickets --force
rm -rf .smoke-tickets
```

Attendu : `ticket.md`, `raw.json`, un dossier `images/` non vide, les commentaires en ordre
chronologique strict, et `raw.json` sans URL `self` ni bloc d'avatar.

Si aucun jeton n'est disponible, s'arrêter après l'aide et **le dire**. Ne pas conclure que
l'ingestion fonctionne.

## 8. Le câblage, si on a touché aux skills ou déplacé le dossier

```bash
npm run wire
ls .claude/skills/hcm-debugging
```

Le `ls` doit lister des fichiers. S'il renvoie juste le nom du dossier, les liens sont morts.

**Puis ouvrir une nouvelle conversation Claude Code :** les skills sont lues une seule fois au
démarrage, donc la conversation courante ne verra jamais la modification.

## Compte rendu

Rapporter chaque étape avec son résultat réel, y compris ce qui a été **sauté** et pourquoi.
Ne jamais rapporter une étape non exécutée comme réussie.
