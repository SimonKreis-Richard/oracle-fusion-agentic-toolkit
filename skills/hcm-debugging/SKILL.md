---
name: hcm-debugging
description: Root-cause triage heuristic for Oracle Fusion Cloud HCM incidents. Use whenever the user mentions a Jira ticket key, reports a bug, quotes an Oracle error (JBO-, ORA-, ADF, REST fault, ESS job failure), asks to triage, investigate, debug, analyse or explain a problem in Oracle HCM, asks why a page or process fails, asks whether something is a Redwood regression, a configuration issue or an Oracle defect, or asks how to escalate to Oracle Support. Produces, in this order, the keystrokes the consultant runs himself, the full text of the message to send to Oracle or to the client, and then the evidence, classification and ranked hypotheses that justify them.
---

# Oracle HCM debugging heuristic

A mandatory sequential workflow. Do not skip a step, do not reorder, do not start writing
hypotheses while still collecting evidence.

The context this runs in: a single AMS consultant supports Oracle Fusion Cloud HCM for one client,
mid Redwood transition. **There is no up-to-date configuration workbook.** The configuration exists
only inside the instances (PROD, DEV1 and friends). Everything you infer comes from the ticket
(text plus screenshots) and from external research, and every claim about the configuration has to
be expressed as something to go and verify, never as something you know.

## Scope: what the operator owns

One AMS consultant runs this. His job has exactly three outputs: reproduce the problem in a test
environment, identify the root cause, and write the message that carries the finding to Oracle or to
the client. Nothing else.

He does **not** own:

- the other bugs living on the instance, however obvious they look while you are in there
- what the client decides to do with the finding
- production: he does not change it, and he is not accountable for what runs there
- the business trade-off between two possible fixes, which is the client call to make

This changes what the report is for. It is not a project status and it is not an improvement plan.
It is a list of keystrokes he executes, followed by the text he sends. Every adjacent finding, every
"while we are here", every decision that belongs to somebody else goes into one NOT MINE line and
gets no action, no effort estimate and no priority.

The test to apply to every proposed step: *does this move the root cause of this ticket, or does it
improve the instance?* Only the first kind survives.

Two consequences to hold on to through the whole workflow:

- **When the root cause is established and nothing else is his to do, the deliverable is the message
  itself**, written out in full, in the right language, ready to paste. Not a summary of what to say.
  The actual text.
- **A step whose owner is someone else is not a step.** It is either a sentence inside the message,
  or a NOT MINE line.

## Settled by the operator, do not re-derive these

Four questions that used to be answered by inference. They are answered. Follow them.

**He applies DEV1 configuration changes himself, directly.** He holds the rights and does not need
anyone's approval for DEV1. So a configuration change in DEV1, followed by a retest, is a normal
DO NOW row and not something to hand back. Production is a different matter entirely: he has no
access there, and nothing in production is ever his row.

**A ticket goes to `my_move: send` when what was ASKED is ready, not when the root cause is proven.**
The threshold is the request, not the certainty. If somebody asked for a recipe and the recipe is
ready, it ships, even with the mechanism unsettled at 45 percent, and the message says plainly what
is settled and what is not. Holding a ready answer hostage to a confidence number is how a ticket
goes silent for three weeks. Worked example: a ticket where a six step diagnostic ladder was
built for a question nobody had asked, while the thing actually requested sat finished.

**Closing beats answering fast.** The send threshold above says a ticket ships as soon as what was
asked is ready. It does **not** mean shipping a reply that guarantees a second round. When a
manipulation the operator can perform today would let the ticket close instead of come back, do the
manipulation first and send once, with the proof attached. A reply that defers costs two context
switches and a week of elapsed time. Ask: what would have to be true for this ticket to leave his
desk for good, and can he make it true this afternoon?

**A ticket sitting in `En attente du client` is temporarily out of reach.** Once the message is sent
and the status is posted, it leaves the active work order entirely until they answer. It is not a
low priority item, it is not his. Set `my_move: wait` the moment the message goes out, so it stops
competing for attention with work he can actually do.

**`severity` mirrors the Jira Priority field. It is not an independent judgement.**
`Highest` and `High` map to P1, `Medium` to P2, `Low` and `Lowest` to P3. Read the value from the
dossier header, do not decide it. When your own reading of the exposure differs from the Jira
priority, that disagreement is a sentence in the brief and, if it would change what somebody does,
one sentence in the message. It is never silently encoded in the sort order.

In practice most tickets carry `Medium`, so severity rarely discriminates and the work order is
cheapest first. That is accepted, not a defect to fix. A separate exposure field was proposed on
2026-08-31 and refused: no extra machinery here.

**SR reply text is produced only when the SR blocks.** Two cases: Oracle's answer conditions what
happens next on the ticket, or the SR is heading for an automatic close and that would lose
something. Otherwise the ticket leaves with its Jira comment alone. An SR that merely exists is not
a reason to write to Oracle.

## The two environments, and what a DEV1 observation is worth

Two facts hold on every ticket, and together they create a permanent asymmetry.

- **A Jira bug is always an observation made in PRODUCTION.** That is where the users are.
- **Anything the operator is asked to look at is always in DEV1.** That is the only instance he can
  reach. He has no production access.

So the symptom lives in one instance and the verification happens in another. That gap is not a flaw
in the method, it is the working condition, and every finding has to state how it crosses it.

DEV1 is a **copy of PROD, a few weeks behind**. Most configuration is therefore identical, which is
what makes a DEV1 read useful in the first place. But two things break the equivalence: the lag, and
the categories that do not follow an environment copy at all.

| Category | Does a DEV1 observation transfer to PROD? |
| -------- | ----------------------------------------- |
| Setup and Maintenance configuration, document types, security profiles, enterprise HCM information | **Yes**, unless it was changed on either side since the refresh |
| Roles, data security policies, role hierarchies | **Yes**, same caveat |
| Transaction Design Studio and VB Studio page rules | **Yes**, same caveat |
| Person and assignment data | **As of the refresh date.** Anything after it is absent |
| **Scheduled processes: schedules, submissions, run history** | **No.** Schedules do not follow the copy. A DEV1 history says nothing about PROD |
| Integrations, outbound endpoints, notification delivery | **No.** Usually reset or disabled in non-production |

Treat this table as a working list, not a closed one. When a category is not on it, say so rather
than assuming.

### The three ways a finding crosses the gap

1. **It transfers.** State the finding, name DEV1 as the instance, and ask them to confirm the same
   value in production. That is one line and it costs them a minute.
2. **It transfers, with the lag as a caveat.** Same, plus a sentence saying the value may have moved
   in production since the refresh.
3. **It does not transfer.** Do not present the DEV1 observation as evidence at all. Ask for the
   production extraction instead, and say why DEV1 cannot answer it. Worked example: the
   test instance scheduled process history was a real finding about that instance and no
   evidence whatsoever about a production symptom.

### The asymmetric trap

- **Symptom reproduced in DEV1**: strong. The cause predates the refresh and is configuration.
- **Symptom NOT reproduced in DEV1**: **ambiguous, and never proof that it is fixed.** It can mean a
  production change made after the refresh, a category that does not travel, a data difference, or
  a different role on the test account. Write "not reproduced in DEV1 on this date, under this
  role", never "works in DEV1".

**Name the instance on every fact.** An evidence row without its instance is unusable, because the
reader cannot tell whether it transfers.

## Step 0: check the pattern library first
Before anything else, grep the engagement's pattern library for the error signature. It lives at
`engagement/patterns.md`, outside this skill, because it holds role names, ticket keys and SR
numbers. If the file does not exist yet, create it from `patterns.template.md` in this directory:

```bash
grep -i "JBO-29000" engagement/patterns.md
```

On a hit, say so explicitly ("this signature matches a known pattern from PROJ-1234"), then
shortcut: go straight to verifying whether the known root cause applies here, instead of
re-deriving the analysis. A pattern is a prior, not a verdict: if the evidence contradicts it, drop
it and run the full workflow.

## Step 1: evidence extraction, before any interpretation

Read `ticket.md` in full and open every image in `images/` (see the `jira-ticket-ingestion` skill).
Then produce a facts table. Facts only, no reading between the lines yet.

- **Error signatures, verbatim and quoted.** JBO-xxxxx, ORA-xxxxx, ADF faults, REST fault payloads,
  ESS job names, HCM Data Loader messages. Copy them character for character, including the parts
  that look like noise. These strings are the search keys for step 3, and a paraphrase finds
  nothing.
- **Affected business flow and page.** For example Recruiting > Job Offer > Move to HR. Record
  whether the page is Redwood or classic: URL patterns (`/fscmUI/redwood/`, `/hcmUI/faces/`), visual
  style in the screenshots, or explicit mentions of `ORA_*_REDWOOD_ENABLED` profile options.
- **Environments touched.** PROD, DEV1, TEST, and reproducibility in each. "Not tested in DEV" is a
  fact worth recording, it usually points at the cheapest discriminating test.
- **Timeline.** First occurrence date, then what happened around it: quarterly update window (25D,
  26A, 26B), P2T refresh, CAB change, profile option flip, security change, integration go-live.
  Anything a comment mentions with a date goes here.
- **What was already tried, by whom, with what outcome.** Workarounds are evidence about the
  mechanism: a workaround that works tells you as much as an error that repeats.

Quote the source of each fact (which comment, which screenshot). If two comments contradict each
other, record both and say so.

## Step 1a: the SR is evidence, and it is usually the better evidence

Whenever the ticket mentions an Oracle SR number, **stop and ask for the SR transcript before going
any further**. Do not classify, do not rank hypotheses, do not write a brief on the Jira ticket
alone.

The reason is structural, not incidental. The Jira ticket carries what the consultant chose to
report back to the client, in summary, days later. The SR carries what Oracle actually said, in
Oracle words, with dates. In this corpus the two diverge constantly, and the divergence runs one
way: the SR holds more.

What the SR holds that the ticket never does:

- **The root cause, when Oracle found it.** An OWC call note names the object and the fix. That note
  reaches Jira as one sentence like "they provided documentation for a possible solution".
- **Oracle ruling out your leading hypothesis.** A workaround Oracle proposed and then withdrew is
  the strongest evidence you will get against a mechanism, and it rarely survives the trip to Jira.
- **Regressions reported after the ticket went quiet.** A fix that broke again gets reported to
  Oracle first, because that is where the open thread is.
- **A reproduction case.** Requisition number, application number, person number, environment,
  already agreed with Oracle.

When you cannot get the SR, say so in the brief in one line, and cap the confidence of any
hypothesis about what was already tried. An unread SR on a months-old ticket is a hole in the
evidence, and a brief that does not name the hole reads more certain than it is.

## Step 1b: split the ticket before classifying it

Before choosing a family, ask whether the ticket holds **one problem or several**. In this corpus a
ticket that stays open for months is usually two problems wearing one summary: the reported symptom,
then a second one discovered while fixing the first, or a symptom that changed after a configuration
flip or a quarterly.

Signals that a ticket holds more than one problem:

- two error signatures that do not share a mechanism (a data validation and a lock, for example)
- the symptom changes after an intervention: different page, different stage, different scope
  ("now nothing can move forward" after "this one offer fails")
- different environments failing in different ways at the same time
- a comment that says the issue is "different than the initial"

When that happens:

- Label them P1, P2 and so on **in order of first appearance**, and carry those labels through every
  later step: signatures, hypotheses (`P1-H1`, `P2-H1`), actions and questions.
- Classify each problem into its own family. Do not average them into one classification, and do not
  let the loudest one absorb the other.
- Rank them by what blocks the business today, which is rarely the one that opened the ticket.
- Say explicitly, in the verdict, which problems are solved and which are not. A ticket where one
  problem is fixed and the other is not is not "in progress", it is one closed item and one open
  item, and treating it as a single state is what keeps it open.

Keep the ticket as one report. The ticket is the unit the operator works with, the problem is the
unit the analysis works with.

## Step 2: classification into one primary family

Pick one primary family **per problem identified in step 1b**, plus secondary families when a single
problem genuinely mixes mechanisms. Each family comes with the question that discriminates it.

1. **Redwood enablement regression.** Behaviour differs from the classic page, onset correlates
   with an `ORA_*_REDWOOD_ENABLED` flip or with a quarterly that forces Redwood.
   *Discriminator: does the classic page work where Redwood fails?*
2. **Configuration or setup issue.** Setup task, profile option, lookup, flexfield, approval rule,
   alert, checklist.
   *Discriminator: does DEV with the same configuration reproduce, and what does the exact setup
   screen show?*
3. **Data-specific integrity.** Position or assignment synchronisation, date effectivity, orphan or
   stale rows, values that drifted after the record was created.
   *Discriminator: does the same flow succeed with different data?*
4. **Concurrency or locking.** ESS job collisions, "another user holds the lock", `JBO-26092`.
   *Discriminator: does the failure correlate in time with scheduled processes or with another user
   working the same record?*
5. **Security and roles.** Data security, areas of responsibility, role-specific rendering, missing
   privilege on a Redwood page.
   *Discriminator: does another role reproduce it on the same record?*
   **The tell that is missed most often: a missing privilege removes the action from the page rather
   than refusing it.** A silent failure where a button, an action in a menu, or the values in a Phase
   and State list are simply absent points here first, ahead of every configuration family. An error
   message means the code ran, which usually means the privilege was there.
6. **Integration.** HDL, REST, OIC, FBDI, third-party feeds.
   *Discriminator: does the failure come from a payload or a scheduled load rather than from the
   UI?*
7. **Oracle product defect.** Everything above is exhausted, or a Knowledge Base article confirms
   the bug.
   *Output: an SR package, see step 5.*

State the family with a confidence percentage and the one fact that decided it.

## Step 3: settle the mechanism from documentation, before touching anything

**This is the first reflex, not a later one.** Before proposing that the operator opens an
instance, before asking the client for anything, try to settle the mechanism from the product
documentation. It is free, it takes minutes, it costs nobody else's time, and a finding that
carries an Oracle URL is worth more to the recipient than the same finding carried by your
reasoning alone.

Do all of it, in this order:

1. **Find the page, then read it.** Web search restricted to `docs.oracle.com`, with **the verbatim
   error string in quotes**, then with the flow name plus the error family. Open what looks relevant
   with `fetch_oracle_page` of the `oracle-fusion-docs` MCP, which is the only path to the verbatim
   text. A page that comes back as navigation only was not rendered: try another release of the same
   page, or a neighbouring guide.
2. Search Oracle Cloud Customer Connect and My Oracle Support Knowledge Base references with web
   search. Prefer exact message matches over topical matches. Collect Doc IDs and thread URLs.
3. When the timeline suggests a regression, check the release notes and What's New for the quarterly
   closest to the first occurrence, and for the one before it.

**Quote it verbatim, with its URL.** When a page describes the observed behaviour, put the sentence
in the message between quotation marks, name the page, give the link. That is the difference between
"this looks like a stale hierarchy" and "Oracle documents this exact fallback, here is the page".
The second one ends the discussion. Worked example: a single documented sentence
about walking up to the grandparent position turned a 70 percent deduction into an 85 percent
finding, and removed the need for any test.

Rules: every finding that enters the report carries its URL or Doc ID. **A finding without a source
does not enter the report.** A community thread is evidence of a shared symptom, not proof of a root
cause: label it as such. When research returns nothing, say that too, because "no public trace of
this message" is itself a signal that pushes toward families 2, 3 and 5 rather than 7.

## Step 4: hypotheses

A ranked list, four at most. Fewer good ones beat four padded ones. Each hypothesis carries exactly:

- **Mechanism**, one or two sentences. What is actually happening in the product, not a restatement
  of the symptom.
- **Confidence** in percent. The set does not have to sum to 100, they are not exclusive.
- **The single cheapest discriminating test.** One test, the one that kills or confirms the
  hypothesis fastest. If your test cannot produce a negative result, it is not a test.
- **The in-instance verification path.** The exact place to look, given that no configuration
  workbook exists:
  - Setup and Maintenance > the exact task name
  - Manage Administrator Profile Values > the exact profile option code
  - BPM Worklist > Task Configuration > the rule set name
  - Scheduled Processes > the exact process name and its recent runs
  - an OTBI subject area, or a specific record checked through the UI
  - the REST resource and endpoint when the flow is integration-driven

**A hypothesis without a verification path is not admissible.** Drop it or turn it into a question
for step 6.

## Step 5: convert the analysis into his keystrokes

### First, the evidence ladder: where does the next fact come from?

Before writing a single row, ask what would settle the open question, and take the **cheapest rung
that can settle it**. Environment work is the bottom of this ladder, not the top.

| Rung | Source | Cost | Use it when |
| ---- | ------ | ---- | ----------- |
| 1 | **The dossier you already have** | zero | Always check first. The answer is often already in a comment or a screenshot from months ago |
| 2 | **Oracle documentation** | minutes | The question is about how the product behaves. This settles mechanism questions outright |
| 3 | **An extraction or a fact only the client can produce** | his minutes, not yours | The evidence lives in production, or in a decision, or in a history he cannot reach |
| 4 | **A read in DEV1** | 10m to 45m | The question is about this instance's configuration and nobody else can answer it faster |
| 5 | **A change in DEV1, then a retest** | 30m and up | Only to prove a fix works, never to discover what the problem is |

Three consequences, all learned the hard way:

- **Rung 1 before anything.** A check was once handed to the operator that the previous consultant
  had already performed and documented six weeks earlier, with screenshots, in the same ticket.
- **Asking the client is legitimate, not a failure.** When production holds the only evidence and he
  has no production access, the request is addressed to the only person who can execute it. That is
  the owner filter working correctly, not work being handed back.
- **DEV1 is not the default.** It is there if it is needed. Reproducing in DEV1 to confirm something
  that happened in production proves nothing on its own, because the two instances genuinely diverge
  (scheduled processes above all). Say so in the message rather than burning an afternoon.

### Then, the rows themselves

## Step 6: write the message, in full

Every ticket leaves with a text to send, or with an explicit "none". This is the deliverable
whenever the investigation is finished, and it is written out completely: no placeholders, no
"explain that...", no square brackets for him to fill in.

Rules for the message:

- **Voice.** It is written as him, first person, an IBM consultant doing AMS for the client. Not as
  an assistant reporting to him.
- **Language.** Match the destination. Jira comments to the client French-speaking team in French,
  Oracle SR messages in English. When in doubt, follow the language of the last message in that
  thread.
- **Length.** As short as the finding allows. The evidence goes in as numbers, not as narrative:
  "requisition 2502 carries 15 inline colour declarations, 2522 carries one" beats a paragraph.
- **Asks.** Anything he needs from someone else is a sentence in this message, phrased as a request
  with a reason. A question that never gets asked is not an open question, it is a stalled ticket.
- **Boundary.** State the finding and what it implies. Do not decide for the client, do not commit
  production to anything, do not promise a date that depends on someone else.

Several recipients means several blocks, each with its own destination line. When nothing has to be
sent, write "none" and say in one clause why: the analysis is not finished, or he is waiting on a
reply already sent and dated.

## Hard rules


**Deliver each ticket the moment it is settled, never in a batch.** When several tickets are
being worked in one run, a ticket whose root cause is settled is finished: write its message and
name the Jira status to set, and hand both over before touching the next ticket. Holding a
finished ticket until the others catch up costs the operator a day he could have closed it.
- **Never invent configuration values.** The configuration lives in the instance. Any claim about
  the current configuration is phrased as a verification step, never as an assertion. Write "check
  whether `ORA_IRC_CREATE_OFFER_REDWOOD_ENABLED` is set to Y at site level", never "this profile
  option is enabled".
- **Never propose destructive steps in PROD as diagnostics.** No data fix, no purge, no bulk update
  to see what happens. Diagnostics in PROD are read-only. Anything destructive is tested in DEV
  first, and reaches PROD only as a fix with a rollback plan.
- **Verbatim quotes for all error messages, always.** Quote them, never paraphrase, and keep each
  error string on **one unwrapped line** in section 2 of the report. A quote broken across lines is
  no longer greppable and no longer pasteable into an SR or into a search engine, which defeats the
  point of quoting it.
- **Read every screenshot before writing a single hypothesis.**
- **Read-only Jira.** Never post, transition, edit or delete anything. The report is written to disk
  and shown in the conversation, never pushed to the ticket.
- **One ticket, one mechanism.** The report explains the reported symptom and stops. Anything else
  noticed on the way, however real, is one NOT MINE line: no action, no effort, no priority. Widening
  the scope of a ticket is how a finished analysis turns back into an open ticket.
- **Never hand back a step somebody else has to run.** If Oracle, the client or a colleague has to
  act, the output is a sentence in the message, not a row in DO NOW.
- **Never write a placeholder in a message.** No brackets to fill in, no "explain that". If a fact is
  missing to write the sentence, that missing fact is a DO NOW step, and the message waits.
- **Read the SR before trusting the ticket.** When a ticket names an SR and you have not read it,
  that is a hole in the evidence, and it goes in the brief as one line rather than being left to
  look like completeness.
- **Environment work is the last resort, not the opening move.** Walk the evidence ladder in step 5
  from the top. A DO NOW row that opens an instance must be justified by the fact that no cheaper
  rung could settle the question.
- **Every fact names its instance, and says whether it transfers.** The symptom is always in
  production, the verification is always in DEV1. DEV1 is a copy a few weeks behind, so most
  configuration transfers and some categories do not travel at all. Never write a DEV1 observation
  as if it were a production fact, and never read "not reproduced in DEV1" as "fixed". See the two
  environments section above.
- **Name the exact record.** A step that says "the affected user" or "the recruiter" is not a step.
  Name the account, the requisition number, the person number, the process name. The operator should
  never have to work out who you meant.
- **Every item in a list handed to a client carries its own justification, or it gets cut.** A list
  of five processes where only two govern the symptom is weaker than the list of two. The extra
  entries invite a correction that costs more credibility than they added.
- **Depth stays in the brief, not in the message.** Investigation detail that does not change the
  recipient's next action belongs in EVIDENCE. A message that recites how the finding was reached
  reads as machine output and buries the one thing they need.
- **No em dashes** in any generated report. Use commas, colons, parentheses, periods.

## Two output shapes

- **One ticket asked for on its own:** the long report below, written to
  `tickets/{KEY}/triage-report.md`.
- **A list of tickets triaged in one run:** the dense brief defined in
  [`output-format.md`](output-format.md), written to `output/tickets/{KEY}.md`, followed by
  `npm run actions` which regenerates `output/DO-NOW.md`, `output/MESSAGES.md` and
  `output/INDEX.md`. Read that file before writing the first brief of a run.

Both carry the same analysis, and both obey the scope rule above: his keystrokes first, then the
message, then the justification. The dense format drops the prose, not the content.

## Report template

Write the report to `tickets/{KEY}/triage-report.md` using this template exactly, then show it in
the conversation. Sections 1 to 3 are the deliverable, sections 4 onward are the justification, and
that order is deliberate: he reads down until he knows what to do, then stops.

```markdown
# Triage Report: {KEY} - {summary}
Generated: {date} | Status at analysis: {status} | Environments: {envs}
Root cause: {one line, or "not identified yet"} | My move: send | investigate | wait

## 1. Do now (his keystrokes only, in order: action | where exactly | done when | time)
## 2. Message to send (full text, ready to paste, destination and language named)
## 3. Not mine (adjacent findings and other people decisions, one line each)
## 4. Bug nature (3 sentences max)
## 5. Error signatures (verbatim, quoted, one unwrapped line each)
## 6. Facts and timeline (evidence table from step 1)
## 7. Classification: {family} ({confidence}%)
## 8. Hypotheses (ranked)
   For each: mechanism | confidence % | discriminating test | in-instance verification path
## 9. Regression guard (next quarterly)
## 10. References (MCP/doc/community URLs, Doc IDs)
```

## Closing the loop

When a ticket reaches a confirmed resolution, propose a new entry for `engagement/patterns.md`
in this format:

```
Symptom (verbatim key) -> Family -> Root cause -> Fix -> Source ticket + date
```

Show the proposed entry to the user and **append it only after they confirm**. The library is
append-only: never rewrite or delete an existing entry, add a new one that supersedes it and say
which one it supersedes.
