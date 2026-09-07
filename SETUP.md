# SETUP.md — installation depuis zéro

Tout ce qui est nécessaire pour rendre ce dépôt opérationnel sur une machine neuve, y compris ce
qui ne vit **pas** dans le dépôt. Document de référence : `README.md` renvoie ici.

Compter dix minutes, dont l'essentiel à attendre la création du jeton Jira.

## 0. Prérequis hors dépôt

| Prérequis | Pourquoi | Vérifier |
|---|---|---|
| **Node.js >= 20** | `fetch` et `AbortController` natifs, zéro dépendance runtime | `node --version` |
| **Rien d'autre** | `npm run wire` est un script Node, il fonctionne sur Windows, macOS et Linux | inclus avec Node |
| **Compte Jira du mandat** | l'ingestion tourne avec **tes** permissions, pas davantage | ouvrir le Jira de ton organisation |
| **Réseau sortant** | ton instance Jira, et `r.jina.ai` pour le MCP de documentation | un proxy d'entreprise est la cause la plus fréquente de timeout |

Aucun secret n'est requis pour **développer** le dépôt : `npm run build` et `npm run actions`
fonctionnent hors ligne et sans jeton. Le jeton n'est nécessaire que pour **ingérer** un ticket.

## 1. Créer un jeton API Jira

Une session de navigateur n'est pas réutilisable par un script : l'API a besoin de son propre jeton.

1. Ouvrir <https://id.atlassian.com/manage-profile/security/api-tokens>, connecté avec le compte
   utilisé pour Jira.
2. **Create API token**. Prendre le **classique**, pas la variante *scoped* : les jetons scoped
   exigent une autre URL de base et ne sont pas gérés ici.
3. Libellé `oracle-fusion-toolkit`, choisir une expiration, **copier le jeton immédiatement**. Il n'est
   affiché qu'une fois.
4. Il se révoque depuis la même page, à tout moment, sans rien casser d'autre.

## 2. Renseigner les identifiants

```bash
cp .env.example .env          # Windows cmd : copy .env.example .env
```

```
JIRA_BASE_URL=https://your-company.atlassian.net
JIRA_EMAIL=prenom.nom@exemple.com
JIRA_API_TOKEN=le jeton cree a l etape 1
```

`.env` est gitignoré. Des variables d'environnement de même nom sont **prioritaires** sur le
fichier, donc une machine de CI peut s'en passer entièrement. Le jeton n'est jamais journalisé :
`safeMessage()` rédige l'en-tête `Authorization` avant tout affichage d'erreur.

## 3. Construire

```bash
npm install && npm run build
```

TypeScript est une dépendance de développement uniquement. La sortie va dans `dist/`, qui est
gitignoré : c'est normal, on la régénère.

## 4. Activer le plugin dans ce dossier

```bash
npm run wire
```

Crée un lien `.claude/skills/<nom>` vers chaque dossier de `skills/`, pour qu'une conversation
Claude Code ouverte ici reconnaisse `/triage`, `/triage-batch` et les autres skills. Le script est
en Node, donc multiplateforme : jonctions NTFS sur Windows, liens symboliques ailleurs.

**Deux pièges, tous deux silencieux :**

- **Les skills sont lues une seule fois, au démarrage de la conversation.** Ouvrir une **nouvelle**
  conversation après le câblage. Une conversation en cours ne verra rien.
- **Un lien stocke un chemin absolu.** Relancer `npm run wire` après **tout déplacement ou
  renommage** du dossier.

Symptôme des deux : `/triage` n'est pas reconnu, sans message d'erreur.

## 5. Le serveur MCP de documentation

Il est **embarqué** dans `mcp/` et construit par `npm run build`. Rien à installer, aucun paquet à
télécharger. `.mcp.json` le déclare et le démarre à la demande.

Il fournit `fetch_oracle_page`, qui rend une page `docs.oracle.com` en markdown brut. **C'est le
seul chemin vers une citation fidèle** : la documentation Oracle est rendue côté client, donc `curl`
ne récupère qu'une coquille JavaScript, et un outil de fetch qui résume la page fait passer la
citation par un modèle intermédiaire. Pour **trouver** une page, une recherche web restreinte à
`docs.oracle.com` fait mieux.

> **À changer le jour de la publication.** `.mcp.json` porte un chemin **relatif**, qui fonctionne
> quand le dépôt est ouvert comme projet. Un plugin **installé** résout ses chemins autrement et
> attend `"args": ["${CLAUDE_PLUGIN_ROOT}/mcp/dist/index.js"]`. Vérifié le 2026-09-02 : la variable
> n'est pas substituée hors installation, et Node meurt alors sur la chaîne littérale, ce qui se
> présente comme un `CONNECTION_CLOSED` sans autre explication.

## 6. Vérifier que tout répond

```bash
npx tsc --noEmit
npm run actions
node dist/jira_ingest.js
```

Attendu : `tsc` silencieux et code de sortie 0 ; `actions` écrit les trois fichiers de `engagement/output/` ;
`jira_ingest.js` sans argument affiche son bloc d'aide.

Le contrôle complet, jeton inclus, est décrit dans `.claude/skills/smoke-check/SKILL.md`.

## 7. Ce qui n'existe pas

Pas de suite de tests, pas de linter, pas de formateur, pas d'historique git. Ce sont des choix,
pas des oublis : voir D1 et D4 dans [`memory/PROJECT.md`](memory/PROJECT.md).
