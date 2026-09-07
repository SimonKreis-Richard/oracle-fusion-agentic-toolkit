---
name: hcm-configuration
description: Build-side workflow for Oracle Fusion Cloud HCM, the counterpart of debugging. Use when something has to be configured, set up, implemented, enabled, created, changed or extended and nothing is broken, for example a change request, a new role or role mapping, a page rule, an approval rule, a lookup, a flexfield, a security profile, a document type, an alert, a checklist, a scheduled process, or an enhancement the client asked for. Produces the framed requirement, the configuration location chosen among the ones that look equivalent, the impact on everything else, the exact steps in the instance, the verification plan and a change note that survives the next quarterly update. Not for incidents or bugs, which belong to hcm-debugging, and not for recommending a design or deciding between a fix and a redesign, which belong to hcm-architecture.
---

# Oracle HCM configuration workflow

Debugging starts from a symptom and walks back to a mechanism. Configuration starts from a need
and walks forward to a change. Same product, same instances, same operator, opposite direction.
What carries over unchanged: **the configuration lives only in the instance, so every claim about
its current state is something to go and read, never something you know.** And **documentation
comes before the instance**: the delivered mechanism is found on docs.oracle.com, not by clicking
around.

Read `engagement/CONTEXT.md` first when it exists. It names the instances, the test accounts and
the constraints of the current engagement. Without it, you are working on the method, not on a
change.

The product knowledge this workflow leans on (where configuration lives, which tool governs which
kind of page change, how security is composed, what scheduled processes do) is in the
`fusion-reference` skill. Open the file it points to when a step below needs it, not before.

## Scope: what the operator delivers

The operator applies configuration changes in the test instance himself, without prior approval,
and never touches production. So his deliverable for a change is:

1. **The change, built and verified in the test instance**, under the target role, on a named
   record.
2. **The change note**: what was changed, where exactly, the values before and after, the effective
   date, how it was verified, how to roll it back. Written so that whoever carries it to production
   can re-key it without asking him anything. This is the seed of the configuration workbook that
   does not exist.
3. **The message** to the requester, in full, ready to paste.

Not his: the business decision behind the request, the production deployment, the other things
that could be improved on the way. Those are one line in NOT MINE or one sentence in the message.

## Step 1: frame the real need

Quote what was literally asked, in the requester's words. Then answer, in one line each:

- **The visible outcome they want.** A user in a role sees or can do what, on which page, for
  which population. "Recruiters should be able to edit offer letters" is a need. "Add the privilege
  X to role Y" is a solution someone already picked, and it may be the wrong one.
- **Who decides** if two ways of getting there conflict. That person is named, and the choice is
  theirs.
- **Done when.** The acceptance criterion, as a test the operator can run: which account, which
  record, which action, which expected result.
- **In and out.** What population, which legal employers or countries, Redwood pages or classic or
  both. A change that silently covers one of the two page families is the most common half-done
  change in this product.

When the request already names a solution, keep both: the solution as requested and the need
behind it. Step 3 decides which one to build.

## Step 2: find the delivered mechanism first

Before designing anything, find what Oracle already ships for this need. Web search restricted to
`docs.oracle.com`, then read the page in full through `fetch_oracle_page` of the
`oracle-fusion-docs` MCP, the only path to the verbatim text. Then:

- **Quote the sentence that describes the mechanism**, with its URL. It goes into the change note
  and, when it changes what the requester decides, into the message.
- **Check What's New** for the last two quarterly updates. A need that was a customisation last
  year is often an opt-in feature this year, and an opt-in beats anything built by hand.
- **Check whether the behaviour is already there and merely hidden** by security, by a page rule or
  by a profile option. In this product, building something that exists is the second most common
  mistake after configuring only one page family.

A change without a documented mechanism behind it is a hypothesis, and it goes to step 4 with that
label.

## Step 3: choose the location among the ones that look equivalent

The same visible effect can usually be produced in several places, and they are not equivalent in
what they cost later. Read [`where-to-configure.md`](where-to-configure.md) for the map, then apply
the rules in this order:

1. **The delivered mechanism over the extension.** A profile option, a setup task, a page rule in
   Transaction Design Studio, before anything built in Visual Builder Studio or by hand.
2. **The narrowest scope that covers the population.** Site level only when everyone is affected.
   One role, one country, one action when that is what was asked.
3. **The one that survives a quarterly update.** Delivered configuration is migrated by Oracle.
   Extensions are the operator's to re-verify every quarter.
4. **The one that transports.** A change that setup export carries to production beats one that has
   to be re-keyed from a screenshot.
5. **The one that leaves a trace.** A named rule, a named role copy, a dated note beat an edit to a
   predefined object.

Name the location chosen and the ones rejected, with the rule that decided. When two locations
survive all five rules, the choice is the client's and step 1 said who decides.

## Step 4: read the current state before changing anything

Now, and not earlier, the instance. Record the **before** state with the exact path: the task
name, the profile option code, the rule name, the role code, the current values, the effective
dates. Screenshot it. This is the only rollback there will be.

While there, read three things that decide the blast radius:

- **What already touches the object.** Another page rule on the same action, an existing role copy,
  a personalisation on the classic page, an autoprovisioning condition that references the same
  attribute. Two rules on one object produce the bugs that debugging sees six months later.
- **Who uses the object.** How many users hold the role, which legal employers use the document
  type, which processes read the lookup. The count is a fact for the note, not a reason to stop.
- **Date-effective state.** Whether the object is date-tracked, what the current effective row
  is, and whether the change has to be an update as of a date or a correction of the current row.
  The two are not interchangeable and only one of them is reversible.

## Step 5: anticipate what the change breaks elsewhere

For every change, walk this list and write one line per item, including "no effect" when that is
the honest answer. Silence on an item reads as "not checked".

| Direction | Question to answer |
| --------- | ------------------ |
| Other roles | Who else inherits the duty, the privilege or the data security policy that moves? |
| Other populations | Which countries, legal employers or business units share the object? |
| Other page family | Does the classic page need the same change as the Redwood page, or the reverse? |
| Downstream processes | Which scheduled process, extract, integration, alert or approval rule reads the object? |
| Provisioning | Does a role mapping condition, an autoprovision flag or a security profile change who gets what, and when does the next provisioning run happen? |
| Reporting | Does an OTBI subject area or a saved report depend on the old value? |
| Time | From which effective date, and does anything retroactive follow? |

Two traps that recur:

- **Security changes propagate on the next provisioning run, not immediately.** A role mapping
  edit looks inert until `Autoprovision Roles for All Users` runs, and then it applies to everyone
  who matches, not just the person in the request.
- **A change that only affects one page family is invisible to the people on the other one.** Ask
  which one the requester uses before calling it done.

## Step 6: build it, in the test instance, in a consistent order

One row per action, in the order that never leaves the instance half-configured: prerequisites
first (a value set before the flexfield that uses it, a security profile before the role that
references it, a role before the mapping that grants it), the object itself, then anything that
consumes it.

Conventions that make the change survivable:

- **Never edit a predefined object.** Copy it under a client prefix and change the copy. A
  quarterly update can overwrite the predefined one and will not touch the copy.
- **Name things so the note is readable without the instance.** A rule called by what it does and
  for whom beats one called after the ticket.
- **One change at a time when the outcome is uncertain.** Two changes made together and one
  outcome give no information about which one worked.
- **Write the after value into the note the moment it is set**, not at the end.

## Step 7: verify under the target role, on a named record

The acceptance test from step 1, run:

- **as the target role**, on a named test account, never as an administrator. An administrator
  makes a security gap disappear and makes the change look finished when it is not.
- **on a named record** that belongs to the population in scope, and on one that does not, to see
  that the change stayed inside its scope.
- **on both page families** when both are in scope.
- **after the provisioning or synchronisation process** when the change depends on one. Until it
  has run, "no change visible" means nothing.

Screenshot the result. A verification without a screenshot is a claim, and the change note needs
evidence, not claims.

## Step 8: deliver the note, the message, and the transport

Write the change note to `engagement/output/changes/{slug}.md` using the template in
[`change-note.md`](change-note.md). It is not read by `npm run actions`, it is a document for
people. Then the message to the requester: what was built, where, how it was verified, what they
need to do or decide next, in their language, one paragraph per line without hard line breaks.

Production is not his. So the note carries the **transport**: either the setup export that carries
the change, or the re-key list, ordered, with the exact values, for whoever applies it there. It
names the effective date and the processes that must run afterwards.

## Step 9: make it survive the next quarterly update

The last section of the note lists what to re-check after the next update, one line per item:
the page rule still applies, the role copy still carries its duties, the profile option kept its
value, the opt-in feature that could replace this change has or has not shipped. A change without
this list is a future incident with the mechanism already forgotten.

## Hard rules

- **Never invent a current value.** Read it in the instance and record it with its path. Write
  "check what the profile option holds at site level" until it has been read.
- **The test instance only.** Nothing here ever writes to production. The transport section exists
  so that someone else does, with a rollback.
- **Documentation before the instance.** Steps 2 and 3 are settled from docs.oracle.com. Opening the
  instance is step 4 for a reason.
- **Copy, never edit, a predefined object.**
- **Verify under the target role, on a named record, with a screenshot.**
- **Before values are recorded before the change**, not reconstructed after.
- **Record the effective date and whether it was an update or a correction.**
- **Name the exact object.** Task name, profile option code, role code, rule name, account, record.
  "The role" and "the affected page" are not names.
- **Both page families, or say why not.**
- **No placeholder in a message or a note.** A missing fact is a step, and the note waits.
- **No em dashes** anywhere.
- **What belongs to someone else is a sentence in the message or a NOT MINE line, never a step.**
