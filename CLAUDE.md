# CLAUDE.md

**Lis [`AGENTS.md`](AGENTS.md) — c'est le fichier maître.** Tout le contexte projet y est
(architecture, index des skills, invariants, pièges, style de travail attendu). Ne pas dupliquer son
contenu ici.

État décisionnel de l'outil : [`memory/PROJECT.md`](memory/PROJECT.md).
Installation : [`SETUP.md`](SETUP.md).

**Le mandat en cours, s'il existe, est dans `engagement/CONTEXT.md`.** Ce dossier est gitignoré en
entier et c'est le **seul** endroit où vit une donnée client. Lis-le avant de travailler sur un
ticket. S'il est absent, tu travailles sur le dépôt lui-même, pas sur un mandat.

## Spécificités Claude Code

- **Ce dépôt est un plugin Claude Code**, et il est aussi le dossier dans lequel on le développe.
  - `skills/` est **le produit** : ce qui serait distribué.
  - `.claude/skills/<nom>` sont des **liens** vers eux, créés par `npm run wire`, pour que le plugin
    soit actif dans cette copie de travail sans être installé. Ils sont gitignorés.
  - `.claude/skills/smoke-check/` est une skill de **développement du dépôt**, versionnée, et ne
    fait pas partie du plugin.
- **Après `npm run wire`, ou après avoir modifié un `SKILL.md`, ouvre une NOUVELLE conversation.**
  Les skills sont lues une seule fois au démarrage. Une conversation en cours ne verra rien,
  silencieusement.
- **Un lien stocke un chemin absolu.** Déplacer ou renommer le dossier les laisse pointer dans le
  vide et le plugin cesse d'exister sans message d'erreur. Remède : `npm run wire`.
- **MCP** : le serveur est **embarqué** dans `mcp/`, construit par `npm run build`, et déclaré dans
  `.mcp.json` par un chemin **relatif**, parce que `${CLAUDE_PLUGIN_ROOT}` n'est substitué que
  pour un plugin **installé**, pas pour un dépôt ouvert comme projet. À basculer à la publication. Il fournit `fetch_oracle_page`, qui rend une page Oracle
  en markdown brut. **C'est le seul chemin vers une citation fidèle** : la documentation Oracle est
  rendue côté client, donc `curl` ne récupère qu'une coquille, et `WebFetch` fait résumer la page par
  un modèle intermédiaire. Pour **trouver** une page, `WebSearch` restreint à `docs.oracle.com` fait
  mieux que l'index du serveur.
- **Trois garde-fous à ne jamais oublier** (détail dans `AGENTS.md`) :
  Jira en **lecture seule**, jamais d'écriture ; **aucune donnée client hors de `engagement/`** ;
  **aucun tiret cadratin** dans le texte généré.
