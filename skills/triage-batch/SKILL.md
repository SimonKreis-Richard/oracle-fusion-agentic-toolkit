---
name: triage-batch
description: Triage a list of Oracle HCM Jira tickets in one run and write your steps and your messages to output/
argument-hint: ticket keys separated by spaces or commas, or a path to a text file holding them
allowed-tools: Bash, Read, Glob, Grep, Write, Edit, WebSearch, WebFetch
---

Triage every ticket in this list: **$ARGUMENTS**

Jira stays read-only for the whole command. GET only, nothing written back to any ticket.

## 1. Ingest the whole list first

If the argument is a file path, pass it through; otherwise pass the keys directly:

```bash
node dist/jira_ingest.js --from-file $ARGUMENTS     # a file of keys
node dist/jira_ingest.js --keys $ARGUMENTS          # keys given inline
```

Build first with `npm install && npm run build` if `dist/jira_ingest.js` is missing. On an
authentication failure, show the credential instructions the script printed and stop: do not triage
tickets you could not fetch.

Ingest everything before analysing anything. It is one authenticated pass, it fails fast, and it
tells you the real size of the run (comment and attachment counts per ticket).

## 2. Read `output-format.md` once

Read `skills/hcm-debugging/output-format.md` before writing the first brief. Every brief in the run
follows it exactly, because `npm run actions` parses the frontmatter, the DO NOW table and the
MESSAGE section, and rejects a brief that drifts.

Two things in that file decide the shape of every brief. First, `my_move`: `investigate` means there
are steps to run, `send` means the analysis is finished and the message is the deliverable, `wait`
means someone else moves first. Second, the scope rule: a row in DO NOW is something the operator
types or clicks himself. Anything owned by Oracle, the client or a colleague belongs in the message
or in NOT MINE.

## 3. Triage each ticket, one at a time

For each key, in the order given:

1. Read `tickets/{KEY}/ticket.md` in full and open **every** image in `tickets/{KEY}/images/`. In
   this corpus the error text, the page state and the configuration values live in the screenshots.
2. Apply the `hcm-debugging` skill end to end: pattern library, evidence, the step 1b split when the
   ticket holds several problems, classification, research through the `oracle-fusion-docs` MCP then
   the web, ranked hypotheses each with one discriminating test and an in-instance verification path,
   then step 5 (his keystrokes, after the owner filter and the root-cause filter) and step 6 (the
   full text of the message).
3. Write `output/tickets/{KEY}.md` in the dense format.

Do not batch the reading of several tickets before writing: finish one brief, then start the next.
A half-read ticket produces a confident brief about the wrong problem.

## 4. Generate the action folder

```bash
npm run actions
```

Fix any `FORMAT ERROR` it reports, then run it again until it is clean.

## 5. Report back

In the conversation, give only:

- the total: how many steps to run, how much keyboard time, how many messages ready to send
- the first ticket to open and its first step, verbatim from `DO-NOW.md`
- anything found that changes priorities across the queue (a live risk, a ticket that is actually
  finished, two tickets that share one root cause)

The detail belongs in the files: `DO-NOW.md` for what he runs, `MESSAGES.md` for what he sends,
`INDEX.md` for where the queue stands. The conversation carries the decisions.

## Deliver as you go

Do not wait for the whole list to finish. As soon as one ticket's root cause is settled, show
its message and the Jira status to set for that ticket, then move on to the next one. A settled
ticket held back until the batch completes is a ticket that could have been closed today and
was not.

## Where the next fact comes from

Work the evidence ladder from the top, and stop at the first rung that settles the question:
the dossier you already have, then the Oracle documentation, then a fact only the client can
produce, then a read in DEV1, and only last a change in DEV1.

Documentation research is the **first** reflex, not a fallback. Quote the page verbatim with its
URL when it describes the observed behaviour. Opening an instance is the expensive rung and has to
earn its place. Asking the client for an extraction they alone can run is a legitimate answer, not
a failure to investigate.

