# oracle-fusion-agentic-toolkit

A Claude Code plugin for an Oracle Fusion Cloud HCM functional consultant.

**Status: work in progress, version 0.1.0.** It is used daily on one engagement, it has no test
suite, and its interfaces can still change. See [What is not here](#what-is-not-here) before you
rely on it.

Seven skills sit on one shared product knowledge base, and each one ends in the same two things:
**the keystrokes you run yourself**, and **the full text of the message you send**.

| Work | What it does |
| --- | --- |
| **Debugging** | Give it a Jira ticket key. It pulls the ticket and every screenshot, rebuilds them as a readable dossier, and produces a root-cause triage. |
| **Configuration** | Turns a request into a change built in the test instance, verified under the target role, and written up in a change note that survives the next quarterly update. |
| **Architecture** | Turns a design question into a recommendation with its options, load drivers and dependencies. Never a figure, never a day estimate. |

```
/triage PROJ-1234
```

**Jira access is strictly read-only.** The ingestion script only ever issues HTTP GET. Nothing here
comments, transitions, edits or deletes anything in Jira. When a comment needs posting, you get the
text and you post it yourself.

**No engagement data ships with this plugin.** Everything belonging to a client lives in
`engagement/`, which is gitignored in full. See [Bring your own engagement](#bring-your-own-engagement).

> Working on this repository rather than using it? Start with [`AGENTS.md`](AGENTS.md), then
> [`memory/PROJECT.md`](memory/PROJECT.md).

## Setup

Full instructions, including the out-of-repo prerequisites: **[`SETUP.md`](SETUP.md)**.

The short version, on a machine with **Node 20 or newer**:

```bash
cp .env.example .env      # then set JIRA_BASE_URL and paste your API token
npm install && npm run build
npm run wire              # then open a NEW Claude Code conversation
```

Two silent failure modes worth knowing before they bite: skills are read **once at conversation
start**, and a link stores an absolute path, so **re-run `npm run wire` after moving or renaming the
folder**. In both cases the symptom is that `/triage` is simply not recognised, with no error.

## Bring your own engagement

The repository carries the method. Your client's reality goes in one gitignored folder:

```
engagement/
├── CONTEXT.md      who the client is, the instances, the people, the constraints
├── PROJECT.md      current ticket state and decisions that name people
├── patterns.md     your pattern library, copied from skills/hcm-debugging/patterns.template.md
├── worklist.txt    the ticket keys you are working
├── tickets/        generated dossiers
└── output/         briefs and the portfolio files below
```

**Put engagement data there and nowhere else.** Nothing outside `engagement/` should name a client,
a person, a custom role or a ticket key. The smoke-check verifies it mechanically.

To work a second client, drop in a different `engagement/`. One plugin, many engagements.

## Usage

### Full triage, the normal entry point

```
/triage PROJ-1234
```

Ingests the ticket if needed, reads the dossier and every screenshot, writes the dense brief to
`engagement/output/tickets/PROJ-1234.md`, then regenerates the three portfolio files below.

### A whole worklist in one run

```
/triage-batch PROJ-1234 PROJ-1235
/triage-batch engagement/worklist.txt
```

### What you actually read afterwards

| File | Content |
| --- | --- |
| `engagement/output/DO-NOW.md` | every step you perform yourself, in work order, with checkboxes |
| `engagement/output/MESSAGES.md` | every ready-to-send text, with the Jira status to set after sending |
| `engagement/output/INDEX.md` | one row per ticket: root cause, my move, who blocks it |
| `engagement/output/tickets/{KEY}.md` | the dense brief behind one ticket, the justification rather than the plan |

Rebuild them at any time from the briefs:

```bash
npm run actions
```

### Ingestion alone

```bash
node dist/jira_ingest.js PROJ-1234
```

Writes `engagement/tickets/PROJ-1234/`: `ticket.md` (header, description, comments in chronological
order, screenshots inline), `raw.json` (payload stripped of avatars and self URLs), `images/` and
`files/`.

Batch: `node dist/jira_ingest.js --jql "project = PROJ AND updated >= -180d" --limit 50`. Sequential,
paced under Jira rate limits, idempotent unless you pass `--force`. Run it with no argument to see
every option. Batch **analysis** is out of scope: this only fills the corpus.

## The skills

Claude Code selects them on its own from their descriptions. Any other agent reads the same table in
[`AGENTS.md`](AGENTS.md) and opens the file directly, since they are plain markdown.

| Skill | Triggers when |
| --- | --- |
| `fusion-reference` | shared product knowledge, no workflow: where configuration lives, Redwood against classic, how security is composed, what the scheduled processes do |
| `jira-ticket-ingestion` | a ticket and its screenshots have to be pulled before any analysis |
| `hcm-debugging` | something is **broken**: an error, a page that refuses, a missing action, a regression after a quarterly |
| `hcm-configuration` | something has to be **built or changed** and nothing is broken |
| `hcm-architecture` | someone asks for **an opinion**: the right way to do it, fix or redesign, which of two options |
| `triage` | the full treatment of one ticket, from ingestion to the message |
| `triage-batch` | the same over a list |

The triggers do not overlap: broken goes to debugging, to build goes to configuration, to recommend
goes to architecture, to know goes to the reference.

## What lives where

```
AGENTS.md                    master context and the universal skill index, read this first
CLAUDE.md                    pointer to AGENTS.md plus Claude Code specifics
SETUP.md                     installation from zero
LICENSE                      MIT
memory/PROJECT.md            tool decisions and rejected options, no engagement data

.claude-plugin/plugin.json   plugin manifest
.mcp.json                    declares the bundled documentation MCP server
skills/                      the product: seven skills, thin SKILL.md plus background files
mcp/                         bundled MCP server, returns Oracle documentation pages verbatim
scripts/jira_ingest.ts       ingestion CLI, the only component that touches Jira
scripts/build_actions.ts     aggregates the briefs into the three portfolio files
scripts/wire_local.mjs       links skills/ into .claude/skills, cross-platform

.claude/skills/smoke-check   repository-development skill, not part of the plugin
engagement/                  everything client-specific, gitignored in full
```

## Portability

This repository is usable by agents other than Claude Code. [`AGENTS.md`](AGENTS.md) is an open
cross-vendor format and carries a table of every skill, its trigger and its path, so an agent
without automatic skill selection gets the same content by reading it. The bundled MCP server
speaks the open Model Context Protocol. The skills themselves are plain markdown.

## What is not here

Stated plainly, because these are choices rather than oversights, and the reasoning is in
[`memory/PROJECT.md`](memory/PROJECT.md).

- **No test suite, no linter, no formatter.** The only automated net is `tsc`, which proves the code
  compiles and nothing more. The end-to-end check is a manual procedure in
  `.claude/skills/smoke-check/SKILL.md`.
- **The MCP server is not yet trimmed.** It still exposes `search_oracle_docs` and `list_modules`
  alongside a static topic index. Web search does that job better, and they are scheduled for
  removal. Only `fetch_oracle_page` matters.
- **`.mcp.json` uses a relative path**, which is what works for a repository opened as a project. An
  installed plugin needs `${CLAUDE_PLUGIN_ROOT}`. See the note at the end of `mcp/README.md`.
- **Batch analysis of tickets is out of scope.** Ingestion is batched; the reasoning is not.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `/triage` is not recognised | the links are dangling, or the conversation predates them. `npm run wire`, then open a **new** conversation. |
| `Missing or invalid Jira credentials` | `.env` absent or incomplete, or the token was revoked. See `SETUP.md`. |
| `Not found (HTTP 404)` on a valid key | the account cannot see that project, or the key has a typo |
| A dossier shows `WARNING: unresolved image reference` | Jira did not return the attachment the comment references. It is genuinely missing from the API response. |
| `npm run actions` fails on a brief | the frontmatter is incomplete. The error names the file and the field. The contract is in `skills/hcm-debugging/output-format.md`. |
| A documentation lookup returns stale content | clear `~/.cache/oracle-fusion-docs` |
| An Oracle page comes back as navigation only | it was not rendered. Try another release of the same page, or a neighbouring guide. |
| Batch stops with `Batch done: ... N failed` | the failed keys are listed on the last line, re-run them individually |

## License

MIT. See [`LICENSE`](LICENSE).
