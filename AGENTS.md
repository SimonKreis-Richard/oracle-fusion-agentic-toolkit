# AGENTS.md — oracle-fusion-agentic-toolkit

Fichier maître pour tout agent travaillant sur ce dépôt. Lis-le en entier avant de modifier quoi
que ce soit. L'état décisionnel et les options déjà rejetées sont dans
[`memory/PROJECT.md`](memory/PROJECT.md). L'installation est dans [`SETUP.md`](SETUP.md).

## 1. Vue d'ensemble

Plugin **Claude Code** pour un consultant fonctionnel Oracle Fusion Cloud HCM. Trois métiers, un
socle de connaissance partagé : **déboguer** (un ticket Jira devient un diagnostic de cause
racine), **configurer** (une demande devient un changement construit, vérifié et documenté),
**conseiller** (une question de conception devient une recommandation argumentée). Il ne corrige
rien dans Oracle lui-même : chaque skill produit deux choses, et seulement deux.

1. **Les gestes que Simon exécute lui-même**, dans l'ordre, avec le chemin exact dans l'instance.
2. **Le texte du message à envoyer**, complet, à copier-coller, à Oracle ou au client.

Tout le reste (preuves, classification, hypothèses, options, impacts) existe pour justifier ces
deux sorties, pas pour être lu.

### Position dans l'arborescence

**Le dépôt est autonome et ne dépend d'aucun fichier au-dessus de sa racine.** Il vit en pratique
dans un dossier de thème, à côté d'autres outils du même mandat, mais rien dans le code ni dans la
documentation ne doit nommer ce dossier ni ses voisins : ils changent, et chaque mention devient
fausse au déplacement suivant. Le nom du dossier du dépôt, lui, est la source de vérité du nom du
projet.

Une seule conséquence opérationnelle, et elle est réelle : **après tout déplacement ou renommage,
relancer `npm run wire`**, parce que les liens de `.claude/skills/` stockent un chemin absolu.
Voir les pièges connus plus bas.

### Le contexte métier, qui conditionne tout le reste

**Ce dépôt ne contient aucune donnée de mandat.** Le client, les instances, les personnes, les
comptes de test et les contraintes propres à un engagement vivent dans **`engagement/CONTEXT.md`**,
qui est gitignoré. **Lis-le avant de travailler sur un ticket.** S'il est absent, tu travailles sur
le dépôt lui-même, pas sur un mandat.

Deux constantes valent pour tout mandat AMS Oracle et justifient la méthode de ce dépôt :

**Il n'existe généralement aucun cahier de configuration à jour.** La configuration ne vit que dans
les instances. Conséquence non négociable : **toute hypothèse doit être livrée avec le chemin exact
dans l'instance qui permet de la vérifier.** Une hypothèse sans chemin de vérification est
inutilisable.

**Le symptôme et la vérification vivent dans deux instances différentes.** Un bug est observé en
production ; l'opérateur ne peut lire et modifier qu'un environnement de test, copie de la
production avec un décalage. Le détail de ce qui se transpose ou non est dans
`skills/hcm-debugging/SKILL.md`, section « The two environments ».

## 2. Commandes

```bash
npm install          # dependances
npm run build        # tsc -> dist/ ET construit le serveur MCP   <- LE filet principal
npm run ingest -- PROJ-1234      # ou: node dist/jira_ingest.js PROJ-1234
npm run actions      # regenere engagement/output/{DO-NOW,MESSAGES,INDEX}.md
npm run wire         # (re)cree les liens .claude/skills   <- APRES TOUT DEPLACEMENT
npx tsc --noEmit     # typecheck seul
```

Dans une conversation Claude Code ouverte dans ce dossier :

```
/triage PROJ-1234
/triage-batch PROJ-1234 PROJ-1235        (ou un chemin vers engagement/worklist.txt)
```

**Il n'y a ni suite de tests, ni linter, ni formateur. C'est assumé** (voir D4 dans
`memory/PROJECT.md`). Le seul filet automatisé est `tsc`. Un `tsc` vert prouve que ça **compile**,
pas que ça **marche** : après toute modification de logique, lance le smoke-check
(`.claude/skills/smoke-check/SKILL.md`), qui est le seul contrôle de bout en bout.

## 3. Architecture

Le flux complet, de gauche à droite. Rien ne saute d'étape.

```
engagement/worklist.txt        les cles de tickets ouverts, ecrit a la main
      |
      v  node dist/jira_ingest.js            (GET Jira uniquement)
engagement/tickets/{KEY}/      ticket.md + raw.json + images/ + files/
      |
      v  /triage ou /triage-batch            (skill hcm-debugging)
engagement/output/tickets/{KEY}.md   le brief dense, frontmatter + sections normalisees
      |
      v  node dist/build_actions.js          (aucun appel reseau)
engagement/output/DO-NOW.md    tous les gestes, dans l'ordre de travail
engagement/output/MESSAGES.md  tous les textes prets a envoyer
engagement/output/INDEX.md     une ligne par ticket : cause racine, mon geste, qui bloque
```

### Les deux scripts

| Fichier | Lignes | Rôle |
|---|---|---|
| `scripts/jira_ingest.ts` | 849 | CLI d'ingestion. **Seul composant qui touche le réseau Jira.** |
| `scripts/build_actions.ts` | 423 | Agrégateur pur : lit les briefs, écrit les trois fichiers de sortie. Aucun réseau. |

`jira_ingest.ts` est sectionné par des bannières `// ──` : Config, Types, Environnement,
HTTP (GET only), Noms de fichiers, Pièces jointes, Stripping de `raw.json`, Conversion du wiki
markup Jira, Rendu du dossier, Filet de pagination des commentaires, Ingestion d'un ticket, Mode
batch. Points sensibles : `getWithRetry` (retry sur 429, 5xx, timeouts), `safeMessage` (rédaction
de l'en-tête `Authorization` avant tout affichage), `ensureAllComments` (Jira tronque les
commentaires au-delà d'une page et ne le signale pas).

`build_actions.ts` : Parsing, Arithmétique du temps, Rendu, Main. Il **valide** les briefs et
échoue bruyamment sur un frontmatter incomplet, ce qui est voulu.

### Les skills, index universel

**Cette table est le point d'entrée pour tout agent qui ne fait pas de sélection automatique.**
Claude Code choisit la skill seul, à partir de sa `description`. Ailleurs, lis la ligne qui
correspond à ta tâche et ouvre le fichier indiqué : ce sont des fichiers markdown ordinaires.

| Skill | Se déclenche quand | Fichier |
|---|---|---|
| `jira-ticket-ingestion` | il faut récupérer un ticket et ses captures avant toute analyse | `skills/jira-ticket-ingestion/SKILL.md` |
| `hcm-debugging` | quelque chose est **cassé** : erreur, page qui refuse, action absente, régression après un trimestriel | `skills/hcm-debugging/SKILL.md` |
| `triage` | l'utilisateur veut le traitement complet d'un ticket, de l'ingestion au message | `skills/triage/SKILL.md` |
| `triage-batch` | plusieurs tickets d'un coup | `skills/triage-batch/SKILL.md` |
| `hcm-configuration` | il faut **construire ou modifier** quelque chose qui n'est pas cassé : demande de changement, rôle, règle de page, lookup, profil de sécurité, traitement planifié | `skills/hcm-configuration/SKILL.md` |
| `hcm-architecture` | on demande **un avis** : la bonne façon de faire, correctif ou refonte, deux options à départager, ce qu'un changement va entraîner. Jamais de chiffre ni de durée | `skills/hcm-architecture/SKILL.md` |
| `fusion-reference` | **socle de connaissance**, sans workflow : comment le produit est structuré, où vit la configuration, Redwood contre classique, ce que gouvernent Transaction Design Studio et Visual Builder Studio, la composition de la sécurité, les traitements planifiés. Lu quand une autre skill y renvoie, ou pour une question de pur savoir produit | `skills/fusion-reference/SKILL.md` |

Les déclencheurs ne se recouvrent pas : *cassé* va au débogage, *à construire* à la configuration,
*à recommander* à l'architecture, *à savoir* au socle. Chaque `SKILL.md` est mince et renvoie à des
fichiers de fond dans son dossier, lus au besoin et non au démarrage :

| Dossier | Fichiers de fond |
|---|---|
| `skills/fusion-reference/` | `product-structure.md`, `configuration-map.md`, `pages-and-extensions.md`, `security-model.md`, `scheduled-processes.md` : le savoir, avec les citations Oracle mot pour mot et leurs URL |
| `skills/hcm-configuration/` | `where-to-configure.md` (même effet, plusieurs endroits, lequel choisir), `change-note.md` (gabarit de la note de changement, écrite dans `engagement/output/changes/`) |
| `skills/hcm-architecture/` | `decision-structures.md` (les décisions récurrentes, signaux, défaut, ce qui le renverse), `load-and-dependencies.md` (inducteurs de charge et dépendances, sans chiffre) |

`skills/hcm-debugging/` porte deux fichiers de fond, lus au besoin et non au démarrage :

- **`output-format.md`** — le contrat de format du brief. **C'est aussi le contrat que
  `scripts/build_actions.ts` parse.** Modifier l'un sans l'autre casse `npm run actions`.
- **`patterns.template.md`** — le gabarit de la bibliothèque de patterns. La vraie bibliothèque est
  **privée** et vit dans `engagement/patterns.md`, parce qu'elle porte des rôles, des tickets et des
  numéros de SR. Elle est **append-only** : une entrée fausse n'est pas supprimée, elle est
  remplacée par une entrée qui la **supersede** explicitement.

`.claude/skills/smoke-check/` est une skill de **développement du dépôt**, versionnée, hors plugin.

### Le serveur MCP embarqué, `mcp/`

Tout le serveur tient dans `mcp/src/index.ts`, sectionné par des bannières `// ──` : config
(`MAX_PAGE_CHARS=15000`, Jina Reader, timeout 25 s), `TOPIC_INDEX` (environ 410 lignes de données,
à élaguer), `ResponseCache` (LRU mémoire plus cache disque JSON), `jinaGet` (trois tentatives,
backoff), les trois outils, le câblage JSON-RPC. Flux de `fetch_oracle_page` : garde-fou de
domaine, cache mémoire, cache disque, Jina Reader, nettoyage, troncature à 15 000 caractères.

Invariants propres au serveur, hérités de son ancien dépôt :

1. **`stdout` est le canal JSON-RPC. Ne jamais y écrire.** Tous les logs passent par
   `console.error`. Un seul `console.log` corrompt le protocole pour tous les clients.
   Vérification : `grep -n "console\.log" mcp/src/index.ts` ne doit rien retourner.
2. **Aucun `export` dans `mcp/src/index.ts`** : c'est un exécutable, pas un module.
3. **Pas de `declaration: true`** dans `mcp/tsconfig.json`, personne ne consomme de `.d.ts`.
4. **La vulnérabilité `hono` signalée par `npm audit` est ignorée sciemment** : dépendance
   transitive du SDK MCP, sur des chemins HTTP qu'un serveur stdio n'exécute jamais. Ne pas
   « corriger » sans demande.
5. **L'URL demandée à `fetch_oracle_page` part chez un tiers**, Jina Reader. Ne jamais y router
   autre chose que `docs.oracle.com`, et surtout rien qui nomme le client.

### Portabilité

Ce dépôt est utilisable par d'autres agents que Claude Code.

| Couche | Portabilité |
|---|---|
| `AGENTS.md`, ce fichier | **universelle**, format ouvert de l'Agentic AI Foundation, une vingtaine d'agents le lisent |
| Le serveur MCP de `mcp/` | **universelle**, MCP est un standard ouvert |
| Le contenu des skills | **universelle**, ce sont des fichiers markdown |
| `.claude-plugin/`, sélection automatique des skills | spécifique à Claude Code |

La valeur de ce dépôt est de la **méthode en prose**, pas de la machinerie. Un agent sans sélection
automatique obtient la même chose en lisant la table ci-dessus.

### Le contrat brief / agrégateur

`output/tickets/{KEY}.md` porte un frontmatter dont `build_actions.ts` exige les champs :
`key, summary, status, updated, age_days, family, root_cause, confidence, my_move, status_target,
severity, effort_hands_on, eta_elapsed, blocked_on, next_action`.

- `my_move` vaut exactement `send`, `investigate` ou `wait`.
- `severity` vaut `P1`, `P2` ou `P3`.
- `status_target` est le statut Jira à poser une fois le message envoyé. Il est rendu
  automatiquement dans `MESSAGES.md`, sous le message, pour qu'un ticket réglé se ferme dans le
  même geste que son envoi.
- Les sections parsées sont `## DO NOW` (un tableau `| # | Action | Where exactly | Done when | Time |`)
  et `## MESSAGE`. Une section MESSAGE commençant par `none` produit un message vide, pas une erreur.
- Une table DO NOW **vide est légale** : c'est un ticket dont l'analyse est finie.
- La colonne `Time` doit contenir une durée réelle (`5m`, `20m`, `2h`), **jamais** S/M/L.
- L'ordre de travail est : sévérité d'abord, puis le moins cher d'abord à sévérité égale.

## 4. Invariants — à ne jamais casser

1. **Jira est strictement en lecture seule. GET uniquement.** Jamais de POST, PUT, PATCH ou DELETE,
   quelle que soit la demande. Pas de commentaire, pas de transition, pas d'édition, jamais. Si
   l'utilisateur veut poster un commentaire, on lui donne le texte et **il le poste lui-même**.
   Vérification : `grep -n "method:" scripts/jira_ingest.ts` ne doit montrer aucun verbe d'écriture.
2. **Les identifiants ne passent que par des variables d'environnement** (`JIRA_BASE_URL`,
   `JIRA_EMAIL`, `JIRA_API_TOKEN`). Jamais en dur, jamais loggés, jamais commités. `safeMessage()`
   rédige l'en-tête `Authorization` avant tout affichage : ne pas contourner cette fonction.
3. **`tickets/` et `output/` sont de la donnée client.** Gitignorés, ils ne quittent pas cette
   machine. Toute nouvelle sortie contenant du contenu de ticket doit être ajoutée au `.gitignore`
   **dans le même geste qui la crée**.
4. **Aucun tiret cadratin** dans le texte généré, les skills ou les gabarits de rapport. Utiliser
   deux-points, virgule ou parenthèses.
5. **Le périmètre de Simon est : reproduire, trouver la cause racine, écrire le message.** Il n'est
   responsable ni des autres bugs de l'instance, ni de ce que le client décide, ni de la production,
   ni de l'arbitrage métier entre deux correctifs. Une action dont il n'est pas le propriétaire est
   **une phrase dans le message ou une ligne NOT MINE, jamais une étape DO NOW**.
6. **Un ticket, un mécanisme.** Deux signatures distinctes dans un même ticket se découpent
   (étape 1b) avant classification. Les fusionner produit une confiance fausse.
7. **Jamais de placeholder dans un message.** Un message est envoyable tel quel ou n'est pas écrit.
8. **`output-format.md` et `build_actions.ts` sont un seul contrat.** Changer les sections ou le
   frontmatter d'un côté sans l'autre casse `npm run actions`.

## 5. Pièges connus

- **Les skills et les commandes sont lues une seule fois, au démarrage de la conversation.** Après
  `npm run wire` ou après avoir modifié un `SKILL.md`, il faut **ouvrir une nouvelle conversation**.
  Une conversation déjà en cours ne verra jamais le changement, sans aucun message d'erreur.
- **Une jonction Windows stocke un chemin absolu.** Déplacer ou renommer le dossier laisse les
  liens de `.claude/skills/` pointer dans le vide, et le plugin cesse silencieusement d'exister.
  **C'est déjà arrivé deux fois**, au déplacement du 2026-08-29 et au renommage du dossier de thème
  constaté le 2026-09-07, où les sept liens pointaient encore vers l'ancien chemin.
  Symptôme : `/triage` n'est pas reconnu. Remède : `npm run wire`, puis nouvelle conversation.
- **Supprimer une jonction avec un outil récursif est dangereux sous Windows** : `Remove-Item
  -Recurse` en PowerShell 5.1 peut supprimer *à travers* le lien et vider le vrai dossier `skills/`.
  `scripts/wire_local.mjs` ne retire que ce que `lstat` identifie comme un lien, et laisse tout
  vrai dossier en place. Ne pas « simplifier » ce code.
- **`${CLAUDE_PLUGIN_ROOT}` n'est substitué que pour un plugin installé.** Pour un dépôt ouvert
  comme projet, `.mcp.json` doit porter un chemin relatif, sinon le serveur MCP meurt au démarrage
  avec un `CONNECTION_CLOSED` sans autre explication. À basculer le jour de la publication.
- **Un `SKILL.md` n'est lu qu'au démarrage, et le nom du dossier doit égaler le champ `name`**
  (minuscules, chiffres, tirets). Un dossier de skill sans `SKILL.md` valide est ignoré en silence.
- **Jira tronque les commentaires au-delà d'une page sans le signaler.** `ensureAllComments()` est
  le filet. Un dossier qui paraît incomplet vient très probablement de là.
- **`WARNING: unresolved image reference` dans un dossier** signifie que Jira n'a pas renvoyé la
  pièce jointe référencée par le commentaire. L'image manque réellement dans la réponse de l'API :
  ce n'est pas le script qui l'a perdue.
- **Le cache disque du MCP de documentation** vit dans `~/.cache/oracle-fusion-docs` et survit aux
  redémarrages **et aux rebuilds**. Une doc « périmée » ou un comportement inexplicable après une
  modification vient de là : `rm -rf ~/.cache/oracle-fusion-docs` avant de conclure à un bug.
- **`fetch_oracle_page` tronque à 15 000 caractères.** Une page qui « manque » de contenu est
  tronquée, pas mal parsée : chercher `[... truncated`. Une page qui ne renvoie que la
  navigation du site n'a pas été rendue par Jina : essayer une autre version de la page
  (`.../24d/...`, `.../25b/...`) ou un guide voisin, c'est fréquent et ce n'est pas un bug.
- **Un timeout de 25 s sur `fetch_oracle_page`** vient presque toujours d'un proxy d'entreprise
  ou d'une indisponibilité de `r.jina.ai`, pas du code.
- **Écrire des scripts jetables en heredoc bash échoue** sur cette machine dès que le contenu
  contient des quotes imbriquées. Écrire le script dans le scratchpad puis `python <chemin>`.
- **Les accents français disparaissent** quand un message est écrit via un script de
  transformation. Toujours relire les blocs français après une passe automatisée.
- **Il n'y a pas d'historique git et c'est délibéré** (voir D1). `git log` n'existe pas. La mémoire
  des décisions est **entièrement** dans `memory/PROJECT.md`. Si tu prends une décision structurante,
  elle n'est nulle part ailleurs : écris-la.

### Le piège de diagnostic Oracle qui revient le plus

**Un privilège manquant fait disparaître l'action de la page, il ne la refuse pas.** Donc :

- une action **absente** oriente vers la sécurité (rôle, privilège, profil de données) ;
- un **message d'erreur** signifie que le code s'est exécuté, donc que le privilège était là, et
  oriente vers la configuration ou un défaut produit.

Corollaire opérationnel : **tester sous un rôle administrateur est l'erreur la plus facile à
commettre.** Elle fait disparaître le symptôme et fait conclure à tort que c'est réparé.

## 6. Setup

Voir [`SETUP.md`](SETUP.md) : jeton Jira, `.env`, build, câblage local, MCP de documentation.

Résumé de ce qui est requis hors dépôt : **Node >= 20**, un **jeton API Jira classique** (pas la
variante scoped), et un accès réseau sortant vers le Jira du mandat et `r.jina.ai`.

## 7. Style de travail attendu avec Simon

Ces règles viennent de corrections explicites de sa part. Elles ne sont pas des préférences
cosmétiques : les ignorer produit du travail qu'il doit refaire.

- **Le minimum de ce qui est attendu.** Les messages destinés à être envoyés (commentaire Jira,
  réponse SR, courriel) sont courts et directs, et ne portent **que** ce qui a été littéralement
  demandé. Pas d'explication du mécanisme que personne n'a demandée, et **jamais** d'offre de
  travail supplémentaire en conclusion (« je peux aussi faire X ») : une offre se lit comme un
  engagement et génère des demandes qu'il devra absorber seul.
- **Avant d'écrire, cite ce qui a été littéralement demandé, et écris à ça.** Erreur type déjà
  commise : construire une échelle de diagnostic en six étapes alors que la demandeuse voulait
  seulement un document pour ouvrir un CAB.
- **Garder un fait non demandé seulement s'il change une décision** que le destinataire est sur le
  point de prendre, et alors en une phrase, pas en section. La profondeur diagnostique reste dans
  le brief sur disque, pas dans le message.
- **Décider seul les détails d'implémentation à faible enjeu** (organisation des fichiers, format
  cosmétique) et les rapporter à la fin, plutôt que de bloquer en cours de route. Réserver les
  questions aux vrais changements de périmètre. Son arbitrage : « ton jugement ici a autorité sur
  la spec initiale » pour les détails de présentation.
- **La documentation d'abord, l'environnement en dernier.** L'ordre pour trancher une question
  ouverte: ce que le dossier contient déjà, puis la documentation Oracle, puis un fait que seul le
  client peut produire, puis une lecture dans DEV1, et seulement en dernier une modification dans
  DEV1. Ouvrir une instance est le barreau cher de cette échelle et doit se justifier. Demander une
  extraction au client n'est pas se décharger, c'est adresser la tâche à la seule personne qui peut
  l'exécuter.
- **Citer Oracle mot pour mot, avec l'URL.** Quand une page décrit le comportement observé, la
  phrase entre guillemets plus le lien valent plus que tout le raisonnement qui y menait. Sur
  un ticket, une seule phrase documentée a fait passer une déduction à 70 % en constat à 85 %,
  et a supprimé le besoin de tout test.
- **Pas de retour à la ligne forcé dans un paragraphe de message.** Le texte est collé dans un
  champ Jira, un SR ou un courriel, qui reflue à sa propre largeur. Un paragraphe coupé à 95
  caractères arrive haché. Un paragraphe, une ligne, aussi longue soit-elle. Les listes, les URL et
  la signature gardent leurs lignes, ces coupures-là sont réelles.
- **Hyperfocus sur la cause racine du ticket.** Ne pas déborder sur les enjeux adjacents, même
  réels. Un constat intéressant hors périmètre va dans NOT MINE, pas dans le plan d'action.
