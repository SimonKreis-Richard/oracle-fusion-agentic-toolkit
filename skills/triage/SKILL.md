---
name: triage
description: Root-cause triage of an Oracle HCM Jira ticket, ending in the steps you run yourself and the message you send
argument-hint: <TICKET-KEY>, for example PROJ-1234
allowed-tools: Bash, Read, Glob, Grep, Write, WebSearch, WebFetch
---

Run a full root-cause triage of Jira ticket **$ARGUMENTS**.

Jira is read-only for the whole of this command. Never issue anything other than GET against Jira,
and never write anything back to the ticket.

## 1. Get the dossier

Check whether `tickets/$ARGUMENTS/ticket.md` already exists.

- If it does, use it as is.
- If it does not, run the ingestion:

  ```bash
  node dist/jira_ingest.js $ARGUMENTS
  ```

  Build first with `npm install && npm run build` if `dist/jira_ingest.js` is missing.

If the ingestion fails on authentication, show the credential instructions the script printed, then
stop. Do not analyse a ticket you could not fetch, and do not ask the user for their token in the
conversation.

## 2. Read everything

Read `tickets/$ARGUMENTS/ticket.md` in full, then open **every** image in `tickets/$ARGUMENTS/images/`. The exact
error text, the page state and the visible configuration values usually live in the screenshots.
Follow the `jira-ticket-ingestion` skill.

Do not write a single hypothesis before every image has been viewed.

## 3. Apply the debugging heuristic

Follow the `hcm-debugging` skill, all of it, in order:

- step 0, grep `patterns.md` for the error signatures
- step 1, evidence extraction into a facts table
- step 2, classification into one primary family with its discriminator
- step 3, research through the `oracle-fusion-docs` MCP first, then Customer Connect and Knowledge
  Base searches, every finding carrying its URL or Doc ID
- step 4, at most four ranked hypotheses, each with a mechanism, a confidence percentage, one
  discriminating test and an in-instance verification path
- step 5, convert the analysis into his keystrokes: only steps he runs himself, each with where
  exactly, done when, and a real time. Anything owned by Oracle, the client or a colleague is
  dropped from the list and carried by the message instead
- step 6, write the message in full, as him, in the language of the destination, ready to paste

Respect the hard rules, in particular: no invented configuration values (phrase them as verification
steps), no destructive diagnostics in PROD, verbatim error quotes, no em dashes, one ticket one
mechanism, and no placeholder anywhere in a message.

Read the scope section of the skill before step 5. It is the section that decides what counts as a
step: he reproduces, he diagnoses, he writes the message. He does not own the other bugs on the
instance, the client decisions, or production.

## 4. Deliver

Write the report to `tickets/$ARGUMENTS/triage-report.md` following the template in the `hcm-debugging`
skill, then show it in the conversation.

In the conversation, lead with the two things that are actionable: the numbered steps he runs
himself, and the message to send. The analysis stays in the file. Close with one line: the root
cause in a sentence, and whether his move is investigate, send or wait.

## Where the next fact comes from

Work the evidence ladder from the top, and stop at the first rung that settles the question:
the dossier you already have, then the Oracle documentation, then a fact only the client can
produce, then a read in DEV1, and only last a change in DEV1.

Documentation research is the **first** reflex, not a fallback. Quote the page verbatim with its
URL when it describes the observed behaviour. Opening an instance is the expensive rung and has to
earn its place. Asking the client for an extraction they alone can run is a legitimate answer, not
a failure to investigate.

