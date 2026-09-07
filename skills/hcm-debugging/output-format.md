# Dense output format

The long-form report of the `hcm-debugging` skill is written for one ticket read in full. This file
defines the **portfolio format**: what gets written to `output/` when several tickets are triaged in
one run, so the operator works from one folder instead of scrolling a conversation.

```
output/
├── DO-NOW.md             every step the operator performs himself, in order, checkboxes
├── MESSAGES.md           every ready-to-send text, copy and paste, nothing to compose
├── INDEX.md              one row per ticket: root cause, my move, who blocks it
└── tickets/
    └── {KEY}.md          the dense brief for one ticket
```

The three top-level files are **generated**, never hand written: run `npm run actions` after writing
or editing any brief. The generator reads the frontmatter, the DO NOW table and the MESSAGE section
of every brief, so a brief that does not follow this format is reported as an error instead of being
silently dropped.

## Who this is written for

One AMS consultant. He reproduces problems in a test environment, finds the root cause, and writes
the message that carries that finding to Oracle or to the client. That is the whole job.

He does **not** own the other bugs on the instance, the client's decisions, the production change
process, or the business trade-off between two fixes. Those things exist, they belong in NOT MINE,
one line each, and they never appear as an action.

So the brief answers exactly two questions, in this order:

1. What do I type or click next?
2. What do I send, and to whom?

Everything else in the file is the justification for those two answers, and it sits below them.

## Rules that make the format dense

- Tables over prose. Prose only in ROOT CAUSE, and there it is capped at four lines.
- One line per fact, one step per row. No paragraph inside a table cell.
- Every step names **where exactly**: the Setup and Maintenance task, the profile option code, the
  scheduled process name, the page path, the URL. A step the operator has to interpret is not a step.
- Every step names **done when**: the observable result that tells him to move to the next row. A
  step with no stopping condition is a research project.
- Verbatim error strings on a single unwrapped line, so they stay greppable and pasteable.
- No em dashes, in this file or in anything generated from it.
- Never assert a configuration value. Write the check, not the claim.
- **`severity` is read, not decided.** It mirrors the Jira Priority field of the dossier header:
  `Highest` and `High` give P1, `Medium` gives P2, `Low` and `Lowest` give P3. A disagreement between
  that priority and the real exposure is written as a sentence, never encoded in the field.
- **Every EVIDENCE row names its instance**, PROD or DEV1, and every DO NOW row names the instance it
  is run in. The symptom comes from production and the verification happens in DEV1, so a fact with
  no instance cannot be weighed by the reader.
- **No hard line breaks inside a paragraph of a MESSAGE block.** The message is pasted into a Jira
  comment, an SR box or an email, and every one of those reflows text to its own width. A paragraph
  wrapped at 95 characters arrives as a ragged block with breaks in the middle of sentences. So:
  one paragraph is **one unwrapped line**, however long. Blank lines separate paragraphs. List items,
  URLs and the signature keep their own lines, because those breaks are real. This applies only
  inside the fenced MESSAGE blocks; the rest of the brief stays wrapped for reading on disk.
- **One ticket settled, one delivery.** The moment a ticket's root cause is settled, its
  MESSAGE and its `status_target` are final and are handed over immediately. Never hold a
  finished ticket back so that a batch can be delivered together: a settled ticket left
  undelivered is a ticket the operator cannot close today.

## Per-ticket brief

The file starts with frontmatter. Every field is required, and the generator fails loudly on a
missing one.

```yaml
---
key: PROJ-1234
summary: short title, under 80 characters
status: the Jira status, verbatim
updated: YYYY-MM-DD          # last activity on the ticket
age_days: 175                # days since creation
family: "3 data-specific integrity"   # the primary family, number and name
root_cause: one line, the mechanism, or "not identified yet"
confidence: 100              # percent, in that root cause
my_move: send | investigate | wait
status_target: the Jira status to set once the message is sent, verbatim
                             # A faire | En cours | En attente du client | On Hold | Resolu | Ferme
severity: P1 | P2 | P3       # mirrors the Jira Priority field: Highest and High are P1, Medium is P2, Low and Lowest are P3
effort_hands_on: "3h"        # his own keyboard time to reach closure, not elapsed time
eta_elapsed: "1 to 2 weeks"  # realistic calendar time, dominated by who else has to act
blocked_on: you | reporter | colleague | oracle | business | nothing
next_action: one line, the single thing to do next
---
```

`my_move` is the field that routes the ticket, and it has exactly three values:

- **send**: the root cause is established and nothing else is his to do. The MESSAGE section holds
  the text, ready to go. He copies it and the ticket leaves his desk.
- **investigate**: DO NOW holds steps he runs himself, in a test environment, to reach the root
  cause.
- **wait**: someone else has to move first. DO NOW holds the one step that pokes them, and nothing
  else. A ticket sitting in `wait` with an empty MESSAGE is a ticket nobody has been chased on.

Then these sections, in this order, all of them present even when short:

```markdown
# {KEY} - {summary}

## ROOT CAUSE
At most four lines. The mechanism, and the one fact that proves it. When it is not established yet,
say so in the first four words and name what would establish it. No history, no project status.

## DO NOW
| # | Action | Where exactly | Done when | Time |
| - | ------ | ------------- | --------- | ---- |
Only steps he performs himself, in execution order. Imperative, one keyboard action per row.
Write "nothing, the message below closes it" when my_move is send and no step remains.

## MESSAGE
The text to send, in a fenced block, ready to paste with no editing. Above the fence, one line:
destination, recipient, language. Several blocks when several recipients. Write "none" when nothing
has to be sent.

## NOT MINE
| What | Whose | Why it is here |
Adjacent findings, other bugs, business trade-offs, production decisions. One line each. Recorded so
they are not lost, never actionable, never counted in the effort.

## SIGNATURES
Verbatim error strings, one per line, in backticks. Write "none, silent failure" when there is none.

## EVIDENCE
| When | Fact | Source |
Only the facts that carry the root cause. A fact that supports nothing in ROOT CAUSE is history, and
history belongs in the Jira ticket, not here.

## HYPOTHESES
| # | Mechanism | Conf | Discriminating test | Verify in instance |
Drop to a single line saying "settled, see ROOT CAUSE" once the mechanism is proven.

## REGRESSION GUARD
One or two lines. What he re-checks after the next quarterly, and why that check.

## REFERENCES
Bullet list. Every entry carries a URL or a Doc ID. No source, no entry.
```

### Column conventions

- `Time`: a real number, `5m`, `20m`, `2h`. Not S, M, L. He is scheduling his afternoon, not
  estimating a project.
- `Done when`: observable. "The scan returns 0" is observable. "The configuration is correct" is not.
- `effort_hands_on` is the sum of the Time column. `eta_elapsed` is a different number, dominated by
  who else has to act, and it is there so a two-hour ticket is not mistaken for a two-hour wait.
- `severity`: P1 blocks the business or hides a live risk, P2 moves the ticket forward, P3 hygiene.
  It ranks tickets against each other, and no longer ranks rows inside one ticket: DO NOW is a
  sequence, so it runs top to bottom.
- `Conf`: percent. Hypotheses do not have to sum to 100, they are not exclusive.

## The root-cause discipline

A brief covers **one mechanism**: the one that produces the reported symptom. While investigating,
other things surface: an obfuscated script on a public page, a stale profile option, an SR that
investigated the wrong pod. Each of those is one line in NOT MINE and nothing more.

The test to apply to every row of DO NOW: *does this step move the root cause of this ticket, or does
it improve the instance?* Improving the instance is somebody's job, it is not this ticket, and a
brief that mixes the two hands back a to-do list nobody finishes.

## Multi-problem tickets

A ticket that holds several distinct mechanisms gets **one brief with problems labelled P1, P2 and
so on inside the sections** (`## SIGNATURES` groups by problem, hypotheses are prefixed `P1-H1`).
Do not merge them into one classification, and do not split them into several briefs: the ticket is
the unit the operator works with, the problem is the unit the analysis works with.
