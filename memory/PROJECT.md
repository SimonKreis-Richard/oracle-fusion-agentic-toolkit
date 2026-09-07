# PROJECT.md — état décisionnel

> Mémoire des décisions. **Ce dépôt n'a pas d'historique git, délibérément** (voir D1) : il n'y a
> pas de `git log` à consulter, et aucun message de commit ne porte de raisonnement. Ce fichier est
> la **seule** trace du « pourquoi ». Le tenir à jour à chaque décision structurante.

**Projet :** `oracle-fusion-agentic-toolkit` — plugin Claude Code pour consultant fonctionnel
Oracle Fusion Cloud HCM : triage de cause racine, configuration, conseil d'architecture.
**État au 2026-09-07 :** restructuration terminée (D14, D15), puis passe de wrap-up. Sept skills sur
un socle partagé, serveur MCP embarqué, données de mandat dans `engagement/`, hors de ce dépôt.
Build vert, agrégateur vert, MCP répond, aucune donnée client dans l'arbre versionnable. Reste à
faire, non bloquant : élaguer le MCP (voir les questions ouvertes). **Toujours sans git**, donc rien
n'est récupérable après suppression : voir D1 et la note de wrap-up ci-dessous.

### Note de wrap-up du 2026-09-07
Le dossier de thème a été renommé, ce qui a laissé les sept liens de `.claude/skills/` pointer vers
l'ancien chemin : le plugin avait silencieusement cessé d'exister. `npm run wire` relancé. Deux
fichiers manquaient à la racine, `README.md` et `LICENSE`, tous deux recréés. `mcp/README.md`
décrivait encore le câblage d'avant la fusion, avec un chemin absolu personnel : réécrit.
La contrainte Node réelle est **20**, imposée par `@hono/node-server` 2.x dans le lockfile du MCP,
alors que les deux manifestes déclaraient encore 18 : corrigé.
---

## Décisions actives

### D1 — Pas d'historique git, pas de GitHub pour l'instant
**Date :** 2026-08-29 · **Confiance :** haute
**Critère décisionnel :** projet solo, sans collaboration ni revue. Le `.git` a été supprimé
sciemment lors de la réorganisation des dépôts sous un dossier de thème. Simon veut développer
localement avant d'envisager une publication.
**Conséquence :** ne pas proposer `git init`, ne pas invoquer de SHA, ne pas construire de
procédure qui suppose un historique. **Toute décision structurante doit être écrite ici, sinon
elle est perdue.** Le `.gitignore` est conservé : il documente ce qui est de la donnée client, et
il servira si le dépôt part un jour sur GitHub.

### D2 — Sortie en portefeuille, pas un rapport par ticket
**Date :** 2026-08-26 · **Confiance :** haute
**Critère décisionnel :** Simon travaille sur sept tickets en parallèle, pas sur un. Un rapport
autonome par ticket l'oblige à ouvrir sept fichiers pour savoir quoi faire dans les vingt prochaines
minutes. La question réelle est « quel est mon prochain geste, tous tickets confondus ».
**Conséquence :** `scripts/build_actions.ts` agrège les briefs en trois fichiers :
`DO-NOW.md` (tous les gestes dans l'ordre de travail), `MESSAGES.md` (tous les textes prêts à
envoyer), `INDEX.md` (une ligne par ticket). Le brief dense reste dans `output/tickets/{KEY}.md`
comme pièce justificative, pas comme document de travail.

### D3 — Le périmètre est : reproduire, trouver la cause racine, écrire le message
**Date :** 2026-08-26 · **Confiance :** haute
**Critère décisionnel :** Simon n'est responsable ni des autres bugs de l'instance, ni des
décisions du client, ni de la production. Une tâche rendue qui appartient à quelqu'un d'autre ne
sera pas faite, et elle fait ressembler une analyse terminée à un ticket ouvert.
**Conséquence :** l'étape 5 de `hcm-debugging/SKILL.md` applique **deux filtres, dans cet ordre** :
le *filtre propriétaire* (retirer toute ligne dont le propriétaire n'est pas lui) puis le *filtre
cause racine* (retirer toute ligne qui améliore l'instance au lieu de faire avancer le mécanisme de
ce ticket). Ce qui survit devient DO NOW ; le reste devient NOT MINE ou une phrase du message.

### D4 — Ni suite de tests, ni linter, ni formateur
**Date :** antérieure à 2026-08-26 · **Confiance :** moyenne
**Critère décisionnel :** deux scripts, zéro dépendance runtime, un seul utilisateur, profil
fonctionnel. Le coût de maintenance d'une suite de tests dépasserait ici son bénéfice, et Simon
n'est pas développeur.
**Conséquence :** le seul filet est `tsc`. Comme `tsc` ne prouve que la compilation, le contrôle de
bout en bout est la skill `.claude/skills/smoke-check/`, exécutée à la main.
**À rouvrir si** `build_actions.ts` gagne de la logique de parsing : c'est le composant qui casserait
silencieusement.

### D5 — `patterns.md` est append-only, avec supersession explicite
**Date :** 2026-08-27 · **Confiance :** haute
**Critère décisionnel :** un pattern faux a été écrit une fois (il nommait à tort un gabarit de
lettre d'offre modifié comme cause du blocage du flux Redwood). Le supprimer aurait effacé
l'information que cette piste avait déjà été explorée et invalidée, ce qui garantit qu'elle sera
re-proposée.
**Conséquence :** on n'efface jamais une entrée. On en ajoute une qui **supersede** la précédente en
la nommant. La bibliothèque grossit ; c'est le prix, et il est faible.

### D6 — Le SR Oracle est une preuve prioritaire sur le ticket Jira
**Date :** 2026-08-27 · **Confiance :** haute
**Critère décisionnel :** sur un ticket de recrutement, l'analyse a été menée sur le ticket Jira alors que la
réponse était dans le transcript du un SR ouvert par la consultante précédente. Résultat : mauvaise famille,
confiance à 45 % sur une conclusion fausse. Le SR contient les échanges avec le support produit ;
le ticket contient le récit du client.
**Conséquence :** étape **1a** dans `SKILL.md`. Un ticket qui mentionne un numéro de SR **arrête le
workflow** jusqu'à ce que le transcript soit en main. On ne classe pas sans lui.

### D7 — Câblage local par jonction **par skill**
**Date :** 2026-08-29 · **Confiance :** haute
**Critère décisionnel :** `.claude/skills` était une jonction vers tout le dossier `skills/`, ce qui
rendait impossible d'y placer une skill de développement du dépôt sans la publier dans le plugin.
La convention des dépôts voisins veut `.claude/skills/` versionné.
**Conséquence :** `wire_local.ps1` crée maintenant une jonction **par skill**
(`.claude/skills/hcm-debugging`, etc.) dans un `.claude/skills/` qui est un vrai dossier.
`.gitignore` ignore `.claude/skills/` en bloc, ce qui suffit depuis que `commands/` a disparu.
Au passage, la suppression des liens utilise `[System.IO.Directory]::Delete()` : `Remove-Item
-Recurse` sur une jonction peut supprimer à travers le lien en PowerShell 5.1.

### D8 — Les durées sont des nombres réels, l'ordre est sévérité puis coût
**Date :** 2026-08-26 · **Confiance :** haute
**Critère décisionnel :** un effort noté S/M/L ne permet pas de répondre à « qu'est-ce que je peux
finir avant la réunion de 14 h ». Une durée s'additionne, une taille non.
**Conséquence :** la colonne `Time` de DO NOW contient `5m`, `20m`, `2h`. `minutes()` les additionne
(une journée vaut sept heures ouvrées) et `workOrder()` trie par sévérité, puis du moins cher au
plus cher à sévérité égale.

### D9 — L'échelle des preuves: documentation d'abord, environnement en dernier
**Date :** 2026-08-31 · **Confiance :** haute
**Critère décisionnel :** trois erreurs de la même famille dans une seule session. Une vérification
demandée à Simon alors que la consultante précédente l'avait faite et documentée six semaines plus tôt dans le même
ticket (un ticket de configuration de page). Une analyse d'historique menée dans DEV1 pour expliquer un symptôme de
production (un ticket de hiérarchie de gestionnaires). Et, à l'inverse, une seule phrase de la documentation Oracle qui a tranché
ce même ticket en deux minutes. Le facteur commun: l'environnement était traité comme le premier
recours alors qu'il est le plus cher.
**Conséquence :** étape 5 de `SKILL.md` s'ouvre sur une échelle à cinq barreaux, du moins cher au
plus cher: le dossier déjà en main, la documentation Oracle, un fait que seul le client peut
produire, une lecture DEV1, une modification DEV1. Une ligne DO NOW qui ouvre une instance doit
être justifiée par l'échec des barreaux au-dessus. L'étape 3 est renommée et devient explicitement
le premier réflexe. Corollaire écrit en règle dure: **DEV1 ne prouve rien sur PROD**, les deux
divergent volontairement et les traitements planifiés en sont le cas le plus net.

### D10 — Les messages ne portent pas de retour à la ligne dans un paragraphe
**Date :** 2026-08-31 · **Confiance :** haute
**Critère décisionnel :** tous les messages produits jusque-là étaient enveloppés à 95 caractères,
comme le reste du brief. Or ils sont collés dans un champ Jira, un SR ou un courriel, qui refluent à
leur propre largeur: le paragraphe arrive haché au milieu des phrases.
**Conséquence :** dans les blocs MESSAGE uniquement, un paragraphe est **une ligne**, aussi longue
soit-elle. Les listes, les URL et la signature gardent leurs lignes propres, ces coupures étant
réelles. Le reste du brief reste enveloppé, il est lu sur disque. Les quatre messages actifs ont été
réécrits à la main plutôt que déroulés par script: distinguer une continuation d'une phrase neuve
sur la ponctuation seule n'est pas fiable, et se tromper recolle deux phrases dans un texte client.

### D11 — L'asymétrie des environnements, nuancée plutôt que binaire
**Date :** 2026-08-31 · **Confiance :** haute
**Critère décisionnel :** la règle écrite le matin même, « DEV1 ne prouve rien sur PROD », était trop
brutale et jetait de la bonne preuve. Simon a corrigé : DEV1 est une **copie de PROD avec quelques
semaines de retard**, donc la majorité de la configuration est identique et une lecture DEV1 vaut
quelque chose. Ce qui ne traverse pas, ce sont le décalage temporel et certaines catégories, les
**traitements planifiés** en tête.
**Conséquence :** `SKILL.md` porte une section fondatrice sur les deux environnements, avec un
tableau par catégorie de ce qui se transpose ou non, et trois façons pour un constat de franchir
l'écart. Deux faits structurels y sont posés : un bug Jira est **toujours** une observation de
production, et ce que Simon peut regarder est **toujours** dans DEV1. Piège nommé explicitement :
« non reproduit en DEV1 » est **ambigu**, jamais une preuve de correction. Chaque ligne de preuve
nomme désormais son instance, règle ajoutée aussi à `output-format.md`.

### D12 — Quatre questions de méthode tranchées par Simon
**Date :** 2026-08-31 · **Confiance :** haute
**Critère décisionnel :** ces quatre points étaient résolus par inférence à chaque ticket, donc
résolus différemment à chaque fois. Posés explicitement, ils ont été tranchés.
**Conséquence :**
1. **Simon applique lui-même les modifications de configuration dans DEV1**, sans accord préalable.
   Une modification DEV1 suivie d'un retest est donc une ligne DO NOW normale. La production reste
   hors de sa portée et n'est jamais une ligne.
2. **`my_move: send` se déclenche quand ce qui a été demandé est prêt**, pas quand la cause racine
   est prouvée. Le seuil est la demande, pas la certitude.
3. **`severity` recopie la priorité Jira** (`Highest`/`High` → P1, `Medium` → P2, `Low`/`Lowest` →
   P3) au lieu de porter un jugement autonome. **Effet de bord constaté immédiatement :** les quatre
   tickets actifs sont tous en `Medium`, donc tous en P2, et la sévérité cesse de discriminer. Le
   tri du portefeuille se réduit de fait au moins cher d'abord. Le désaccord entre la priorité posée
   et l'exposition réelle s'écrit désormais en toutes lettres dans le brief.
4. **Le texte de réponse SR n'est produit que si le SR bloque**, c'est-à-dire si la réponse d'Oracle
   conditionne la suite ou si le SR va se fermer seul. L'existence d'un SR ne suffit pas.

### D13 — Fermer définitivement prime sur répondre vite
**Date :** 2026-09-02 · **Confiance :** haute
**Critère décisionnel :** le seuil d'envoi de D12 (« ce qui a été demandé est prêt ») produisait des
réponses qui garantissaient un second tour. Simon préfère faire la manipulation tout de suite quand
elle permet de clore, plutôt que répondre et revenir. Une réponse qui diffère coûte deux changements
de contexte et une semaine de délai.
**Conséquence :** le seuil d'envoi tient, mais il gagne un départage. Avant d'envoyer, se demander ce
qui devrait être vrai pour que le ticket quitte son bureau définitivement, et si c'est faisable dans
l'après-midi. Si oui, on manipule d'abord et on envoie une seule fois, preuve à l'appui.
Second point, lié : un ticket en **`En attente du client` est temporairement hors de portée** et sort
de l'ordre de travail dès l'envoi. `my_move` passe à `wait`, il cesse de concurrencer le travail
réellement faisable.

### D14 — Un plugin, N mandats, et le MCP embarqué
**Date :** 2026-09-02 · **Confiance :** haute
**Critère décisionnel :** le dépôt portait à la fois la méthode et les données d'un mandat, dans dix
fichiers versionnés. La règle « ne pas mettre de donnée client ici » est une discipline, donc elle
échouait : le fichier le plus enrichi, la bibliothèque de patterns, était le plus contaminé. Par
ailleurs le serveur MCP de documentation vivait dans un dépôt voisin, ce qui coûtait un changement de
contexte quotidien pour un bénéfice de réutilisation théorique, l'unique consommateur étant ce
plugin.
**Conséquence :**
1. **`engagement/` gitignoré en entier** absorbe tout ce qui appartient à un mandat : contexte,
   patterns, worklist, dossiers, briefs. Une seule règle à retenir, et un **contrôle de fuite dans le
   smoke-check** qui la vérifie mécaniquement au lieu de compter sur la vigilance.
2. **Le serveur MCP est embarqué** dans `mcp/`, déclaré dans `.mcp.json` par un **chemin relatif**.
   `${CLAUDE_PLUGIN_ROOT}` avait été essayé d'abord et tuait le serveur au démarrage
   (`CONNECTION_CLOSED`) : la variable n'est substituée que pour un plugin installé, pas pour un
   dépôt ouvert comme projet. À basculer le jour de la publication. Vérifié le 2026-09-02 : la
   documentation Oracle est rendue côté client, donc `curl` ne récupère qu'une coquille et
   `WebFetch` fait résumer la page par un modèle intermédiaire. `fetch_oracle_page` est **le seul
   chemin vers une citation fidèle**, et toute la méthode repose sur des citations envoyées au
   client. En revanche `search_oracle_docs`, `list_modules`, l'index de sujets et le cache disque
   sont dépassés par la recherche web et seront élagués (non fait, non bloquant).
3. **`commands/` migre vers `skills/`**, format hérité selon la documentation Claude Code. Le
   câblage perd un type d'objet et passe à un script Node multiplateforme.
4. **Le miroir `.agents/skills/` est supprimé.** Les skills sont des fichiers markdown à un chemin
   stable : `AGENTS.md` **pointe** vers elles au lieu de les dupliquer, et sert d'index universel
   pour les agents sans sélection automatique. `AGENTS.md` est un format ouvert de l'Agentic AI
   Foundation, lu par une vingtaine d'agents.
5. **Renommé `oracle-fusion-agentic-toolkit`.** Le périmètre s'ouvre à la configuration et au conseil
   d'architecture, le nom devait cesser de dire « triage ».
6. **Pas de git tant que le dépôt n'est pas publié.** D1 tient. `git init` le jour de la
   publication, avec la bascule de `.mcp.json` et la dépréciation de l'ancien paquet npm
   `oracle-fusion-docs-mcp` (action de Simon, hors dépôt).

### D15 — Un socle de savoir partagé et des skills minces, sans skill d'estimation
**Date :** 2026-09-02 · **Confiance :** haute
**Critère décisionnel :** trois métiers (déboguer, configurer, conseiller) partagent le même savoir
produit : où vit la configuration, Redwood contre classique, la composition de la sécurité, les
traitements planifiés. Le dupliquer dans trois skills garantit trois versions qui divergent. Une
seule skill énorme garantit que la sélection automatique hésite et que tout est chargé pour rien.
Sur l'estimation : Simon a écarté toute production de chiffres ou de durées, ce qui est demandé
devient un engagement, et a gardé ce qui avait de la valeur, la recommandation architecturale et
le conseil de conception adressés directement au client.
**Conséquence :**
1. **`skills/fusion-reference/`** porte le savoir, zéro workflow, en cinq fichiers de fond avec les
   citations Oracle mot pour mot et leurs URL. Son `SKILL.md` est un index. Les autres skills y
   **renvoient** et ne le recopient pas. Le nom n'a pas de tiret bas initial : le champ `name`
   d'une skill doit égaler le nom du dossier et n'admet que minuscules, chiffres et tirets.
2. **`skills/hcm-configuration/`** : construire plutôt que réparer. Déclencheur « il faut
   configurer ou modifier », jamais « c'est cassé ». Livrable : le changement construit dans
   l'instance de test, vérifié sous le rôle cible, et une **note de changement** dans
   `engagement/output/changes/`, graine du cahier de configuration qui n'existe pas.
3. **`skills/hcm-architecture/`** : recommandation et conseil au client. Déclencheur « quelle est
   la bonne façon », « correctif ou refonte », « laquelle des deux ». Livrable : une recommandation
   avec ses options, ses inducteurs de charge et ses dépendances, et le texte de l'avis dans
   `engagement/output/advice/`. **Règle dure : aucun chiffre, aucune durée, aucune date.**
4. Les déclencheurs sont **disjoints** : cassé, à construire, à recommander, à savoir. Chaque
   description de skill nomme les deux autres pour dire ce qu'elle ne couvre pas.
5. Ni `changes/` ni `advice/` ne sont lus par `build_actions.ts` : ce sont des documents pour des
   personnes, pas un contrat de format. Le contrat brief / agrégateur reste limité au débogage.

### D16 — Ce qui est hérité du dépôt `oracle-fusion-docs-mcp`, absorbé ici
**Date :** 2026-09-02 · **Confiance :** haute
**Critère décisionnel :** le serveur a été copié à l'identique sous `mcp/` (source, manifeste,
`tsconfig`, licence vérifiés fichier par fichier), mais son dépôt portait aussi huit décisions et
une liste d'options rejetées qui, perdues, seraient re-proposées. Elles sont repliées ici pour que
l'ancien dépôt puisse être supprimé sans perte.
**Conséquence :** les décisions suivantes tiennent pour `mcp/` :
1. **Un seul fichier source.** Ne pas éclater `mcp/src/index.ts` en modules.
2. **Suppression plutôt qu'ajout.** Par défaut, on refuse une feature au serveur. Trois passes de
   suppression de code mort ont déjà eu lieu avant la fusion.
3. **Cache disque en millisecondes natives** ; les anciens fichiers au format secondes sont
   traités comme expirés. Devient sans objet quand le cache disque sera élagué.
4. **Pas de `.d.ts`** : le serveur est un exécutable, pas une bibliothèque.
5. **Vulnérabilité `hono` de `npm audit` ignorée sciemment**, transitive et hors chemin stdio.
6. **`npm publish` uniquement sur demande explicite**, et désormais uniquement pour déprécier :
   le paquet npm `oracle-fusion-docs-mcp` sert encore la `3.0.0`, dont le contenu diffère du
   code fusionné (cache en secondes, `.d.ts` dans le tarball). **Aucune `3.0.1` ne sera publiée.**
   Procédure de dépréciation, sur la machine de Simon : `npm whoami || npm login`, puis
   `npm deprecate oracle-fusion-docs-mcp@"*" "Merged into oracle-fusion-agentic-toolkit"`, puis
   vérifier avec `npm view oracle-fusion-docs-mcp`. `npm unpublish` n'est possible que sous
   conditions de délai et de dépendants ; la dépréciation suffit.
7. **Le lockfile a été régénéré** à la fusion : `@hono/node-server` est passé en 2.x, qui exige
   **Node 20 ou plus** pour le serveur. `SETUP.md` dit désormais Node >= 20.
8. **Le contexte du voisin (`AGENTS.md`, skills) n'est pas copié tel quel** : ses invariants sont
   dans la section « Le serveur MCP embarqué » d'`AGENTS.md`, son smoke-check dans l'étape 6 du
   smoke-check de ce dépôt, sa procédure npm réduite au point 6 ci-dessus. Le dépôt voisin peut
   être supprimé.

---

## Options rejetées

| Option | Date | Raison du rejet |
|---|---|---|
| **`ACTIONS.md`, fichier unique de sortie** | 2026-08-26 | Mélangeait les gestes et les textes à envoyer, deux usages sans rapport : on lit DO-NOW en travaillant, on ouvre MESSAGES pour copier-coller. Remplacé par les trois fichiers de D2. Le script supprime activement l'ancien fichier. |
| **Effort en S/M/L** | 2026-08-26 | Non additionnable, donc inutilisable pour planifier une demi-journée. Voir D8. |
| **Sections MITIGATION et QUESTIONS dans le brief** | 2026-08-26 | MITIGATION proposait presque toujours une action appartenant à quelqu'un d'autre, en violation de D3. QUESTIONS revenait à rendre le travail au lecteur. Retirées du gabarit. |
| **Diagnostiquer par diff DEV1 contre PROD** | 2026-08-27 | Prémisse fausse : les deux instances divergent **volontairement** depuis le 2026-04-14. Un diff renvoie quatre mois de bruit attendu. Tout a été re-fenêtré sur 2026-07-29 au 2026-08-04. |
| **Échelle de diagnostic en six étapes sur un ticket de recrutement** | 2026-08-27 | Personne ne l'avait demandée. la demandeuse voulait la recette pour ouvrir un CAB : ni correctif, ni validation, ni clôture. Le ticket est passé à `my_move: send` et DO NOW à 10 minutes. Cas d'école du style de travail décrit en §7 d'`AGENTS.md`. |
| **Conclure « DEV1 fonctionne » depuis un test réussi** | 2026-08-27 | Le test avait été fait sous un rôle administrateur, or le défaut est **porté par le rôle**. Un rôle administrateur fait disparaître le symptôme. Aucune affirmation sur l'état de DEV1 n'a été conservée. |
| **Un champ `exposure` distinct de `severity`** | 2026-08-31 | Posé explicitement une fois constaté que les quatre tickets actifs sont tous `Medium` dans Jira, donc tous P2, et que la sévérité ne trie plus rien. **Écarté par Simon : le coût suffit.** Le tri se fait au moins cher d'abord et c'est déjà sa façon de travailler. Une exposition réelle reste une phrase dans le message quand elle change une décision, et n'est ni un champ ni une clé de tri. Ne pas reproposer de mécanique supplémentaire ici. |
| **`git init` pour reconstruire un historique** | 2026-08-29 | Contraire à D1. Aucune valeur en solo, et cela recréerait l'illusion qu'un `git log` porte du contexte. |
| **Une skill d'estimation** | 2026-09-02 | Un chiffre donné vite devient un engagement, et l'estimation n'est pas le métier du consultant ici. Ce qui avait de la valeur, les inducteurs de charge et les dépendances, vit dans `hcm-architecture` sans chiffre. Voir D15. |
| **Une méga-skill Oracle HCM** | 2026-09-02 | Tout chargé pour rien, sélection automatique qui hésite, un seul fichier que personne ne relit. Remplacée par un socle plus des skills minces à déclencheurs disjoints. Voir D15. |
| **Publier le plugin via npm** | 2026-09-02 | Les plugins Claude Code se distribuent par marketplace, un dépôt git, pas par npm. `.claude-plugin/marketplace.json` est déjà en place pour ce jour-là. |
| **Un miroir `.agents/skills/` pour les autres agents** | 2026-09-02 | Deux copies d'une source de vérité. `AGENTS.md` pointe vers les fichiers, format ouvert lu par une vingtaine d'agents. Voir D14. |
| **Le cahier de configuration comme livrable du plugin** | 2026-09-02 | Hors périmètre. La note de changement de `hcm-configuration` en est la graine, et c'est assez. |
| **Fuzzy matching, mapping préfixe de table vers module, outil `get_cache_status`, paramètre `max_chars`, outils `search_oracle_table_docs` et compagnie, entrées BIP/OTBI dans l'index** (héritées du dépôt MCP) | 2026-08-29 | Lot d'« améliorations » non sollicité, analysé point par point et écarté par le mainteneur. Multiplier les outils MCP dégrade la sélection côté agent, et le consommateur est un LLM qui reformule seul. Devenu doublement sans objet depuis la décision d'élaguer `search_oracle_docs` et l'index. Ne pas re-proposer. |
| **Réintroduire du Python dans le serveur MCP** | v3 | Réécrit en TypeScript, artefacts Python supprimés. |

---

## Questions ouvertes sur l'outillage

| Question | Confiance / statut |
|---|---|
| Faut-il des tests sur `build_actions.ts` ? | **Ouverte, penchant non** (D4). C'est pourtant le composant qui casserait en silence si le contrat de `output-format.md` dérivait. Le smoke-check couvre le cas nominal. |
| `README.md` doit-il rester en anglais alors que le contexte est en français ? | **Tranchée par l'usage, pas par décision.** `README.md` et les skills sont en anglais (ils sont le produit), `AGENTS.md`, `CLAUDE.md` et ce fichier en français (ils sont le contexte de travail). Conserver cette séparation. |
| Le plugin sera-t-il un jour installé plutôt que câblé par jonctions ? | **Oui, à la publication, date non fixée.** `.claude-plugin/marketplace.json` existe et pointe sur `./`. Ce jour-là : `git init`, `.mcp.json` sur `${CLAUDE_PLUGIN_ROOT}`, dépréciation de l'ancien paquet npm. |
| Élaguer le serveur MCP ? | **Décidé, non fait, non bloquant.** Retirer `search_oracle_docs`, `list_modules`, l'index de sujets et le cache disque, garder `fetch_oracle_page` et le cache mémoire. Le serveur passerait d'environ 1100 à 500 lignes. Retirer alors le piège « cache disque » d'`AGENTS.md` et la ligne du README. |
