---
name: jira-ticket-ingestion
description: Pull a Jira ticket into a local dossier (chronological markdown plus every screenshot) before analysing it. Use whenever the user mentions a Jira ticket key such as PROJ-1234, pastes a Jira URL, asks to fetch, ingest, read, look at, summarise or investigate a ticket, or asks anything that requires knowing what a ticket actually says. Also use before any triage, since triage without the dossier and its images is not allowed.
---

# Jira ticket ingestion

Turns a Jira ticket into `tickets/{KEY}/`: `ticket.md` (header, description, comments in strict
chronological order, screenshots inline), `raw.json` (stripped payload), `images/` and `files/`.

Jira access is read-only. Never call anything other than GET against Jira, whatever the user asks
for. If the user wants a comment posted or a status changed, tell them to do it in Jira themselves.

## Running the ingestion

The plugin root is `${CLAUDE_PLUGIN_ROOT}` when the plugin is installed, otherwise the repository
directory you are working in. From there:

```bash
node dist/jira_ingest.js PROJ-1234
```

- If `dist/jira_ingest.js` does not exist, run `npm install && npm run build` once, then retry.
- If the script exits with `Missing or invalid Jira credentials`, print its instructions to the user
  and stop. Do not attempt to work around the credential check, and never ask the user to paste a
  token into the conversation: it belongs in the gitignored `.env` file.
- A dossier that already exists is refreshed by re-running the command. Attachments already on disk
  are reused, so a re-run is cheap. `--force` re-downloads them.
- Batch mode fills the corpus without analysing it:
  `node dist/jira_ingest.js --jql "project = PROJ AND updated >= -180d" --limit 50`

Check `tickets/{KEY}/ticket.md` before ingesting: if it is already there and the user did not ask
for a refresh, use it as is.

## Reading a dossier

Read `ticket.md` in full, then **open every file in `images/`**.

Screenshots are primary evidence, not decoration. In this corpus the exact error message, the page
state and the configuration values usually live in the screenshots, not in the text. Never produce a
triage without having viewed every image.

While reading the images, extract:

- the verbatim error text, including the JBO, ORA or REST codes, exactly as displayed
- the page, the URL pattern and whether the UI is Redwood or classic
- the environment banner or pod name if visible
- the configuration values shown on setup screens, which are the only trace of the actual
  configuration this project has

`files/` holds HAR captures, logs and spreadsheets. Open them only when the analysis needs them,
they are usually large.

`raw.json` is the fallback when something in `ticket.md` looks wrong or truncated: it holds the
untouched field values, timestamps and attachment metadata.

## Signs the dossier is incomplete

- a `> WARNING: unresolved image reference` line means a comment points at an attachment Jira did
  not return. Say so in the analysis instead of guessing what the image showed.
- a section `## Attachments not referenced inline` with many images usually means the reporter
  attached evidence without describing it. Those images still count as evidence, open them.
- `(empty description)` on an Incident is itself a fact: the ticket was opened without a written
  problem statement and everything must come from comments and screenshots.
