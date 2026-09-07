---
name: hcm-architecture
description: Design recommendation and direct advice to the client for Oracle Fusion Cloud HCM. Use when the user asks what the right way to do something is, whether a set of choices holds together, whether to fix or redesign, which of two approaches to recommend, how roles, security, positions, approvals, page extensions or integrations should be structured, what drives the load or the dependencies of a change, or how to answer a client who asks for an opinion or a recommendation. Produces a recommendation with the decision structure behind it, the load drivers, the dependencies that slip a plan, the trade-offs, and the full text of the advice to send. Never produces day estimates or figures. Not for something broken, which belongs to hcm-debugging, and not for building a change that is already decided, which belongs to hcm-configuration.
---

# Oracle HCM architecture and design advice

The consultant is asked for an opinion. Not to fix, not to build: to say which way is right, and
why, so that the client can decide. The authority behind the opinion is product knowledge and the
way this product behaves over years of quarterly updates, not seniority. So every recommendation
stands on a documented mechanism, names the option it rejects, and says what would make it flip.

Read `engagement/CONTEXT.md` first when it exists. The product knowledge (where configuration
lives, page families, how security is composed, scheduled processes) is in the `fusion-reference`
skill; open the file it points to when a section below needs it.

## Scope: advise, do not decide

The client decides. The consultant gives a recommendation, the reasons, the trade-off, and the
consequences of each branch. He does **not**:

- decide the business trade-off between two valid designs
- produce a number of days, a date or a cost, for anything, ever (see the rule at the end)
- commit production, a colleague or Oracle to anything
- widen the question into an audit of everything else that could be redesigned

The deliverable is a recommendation brief and the text of the advice, ready to send. The brief is
for him, the text is for them.

## Step 1: frame the question they are actually asking

Quote what was literally asked. Then say which of the recurring question shapes it is, because
each has its own decision structure in [`decision-structures.md`](decision-structures.md):

| Shape | The question underneath |
| ----- | ----------------------- |
| Fix or redesign | Is the recurring symptom a defect in the object, or a sign that the object was built for a different process? |
| Delivered or extended | Does Oracle ship this, and at what cost of ownership does the extension come? |
| Where does this belong | Which layer (security, setup, page rule, extension, data) should carry this behaviour? |
| Does this hold together | Are these choices consistent with each other and with the product's model? |
| Which of two | Two viable options, what decides between them? |
| What will this drive | What will a change pull in, what has to happen first, what will slip it? |

Then name the decider, and what they will do with the answer. A recommendation to someone who
cannot act on it is a memo, and the message has to be addressed to the person who can.

## Step 2: settle the product facts from documentation

A recommendation about this product is only as good as its reading of what the product does.
Before forming an opinion, settle every product fact the recommendation depends on: web search
restricted to `docs.oracle.com` to find the page, `fetch_oracle_page` of the `oracle-fusion-docs`
MCP to read it, and the sentence quoted verbatim with its URL. Check What's New for the last two
quarterlies: an opt-in feature that ships next quarter changes a recommendation made today.

A fact that could not be sourced is stated as an assumption, in the brief and in the message. A
recommendation that hides an assumption is the one that comes back.

## Step 3: lay out the options, honestly

Two to four options, never one. For each, in one line each:

- what it is, in the product's terms (the object, the layer, the mechanism)
- what it costs to own: what has to be re-verified each quarter, what only the builder understands,
  what breaks when the person who built it leaves
- what it does well and what it does badly for the need in step 1
- what it depends on being true first

The option the requester already prefers is on the list and gets the same treatment as the others.
So does "do nothing", when the current state is a real option.

## Step 4: apply the decision structure

Take the structure for the shape identified in step 1 from `decision-structures.md`: the signals
that point each way, the default recommendation, and the conditions under which the default flips.
Walk the signals against the facts of this case and say which way each one points. The
recommendation is what falls out, not what was decided beforehand and dressed up.

When the signals split, say so. A recommendation with a stated confidence and a named condition
("recommended unless the population exceeds one legal employer") is more useful than a confident
one that omits the condition.

## Step 5: name the load drivers and the dependencies, without numbers

The client wants to know what a change will pull in. The answer is a structure, not a figure.
Read [`load-and-dependencies.md`](load-and-dependencies.md) and produce:

- **The load drivers**: which dimensions of this case make it heavier or lighter, and in which
  direction. Number of roles touched, page families in scope, countries or legal employers,
  retroactivity, testing surface, data to convert, decisions the client has to make.
- **The dependencies**: what has to exist or be decided before the change can start, in order.
- **What slips a plan in this product**: the quarterly update window, the environment refresh
  timing, the client's decision latency, an open Oracle SR, the change board cadence, data cleanup
  nobody has scheduled.

This is where the value of the advice lives. A client who understands why a change is heavy
decides better than one who was told it takes so many days.

## Step 6: the trade-offs, stated as such

Every recommendation in this product trades something. Say what: flexibility against
maintainability, a quick personalisation now against a Redwood migration later, role granularity
against administration burden, automation against control, one standard against local exceptions.
Name the side the recommendation takes and what is given up. The client may value the other side,
and that is their call.

## Step 7: write the advice, in full

The message is the deliverable. Rules:

- **As him**, first person, to the named decider, in their language.
- **The recommendation in the first sentence.** Then the reason, then the trade-off, then what
  they need to decide or confirm. Options and their consequences as a short list if there are
  more than two.
- **The documented mechanism quoted**, with its URL, when it carries the argument.
- **Assumptions stated**, each in one clause.
- **No figure, no date, no day count.** When they asked for one, one sentence says what drives the
  load and that the figure is produced elsewhere.
- **No offer of extra work** in the closing. It reads as a commitment.
- **One paragraph per line, no hard line breaks inside a paragraph.** The text is pasted into a
  field that reflows.

## Deliverable: the recommendation brief

Write it to `engagement/output/advice/{slug}.md`. It is not read by `npm run actions`. Template:

```markdown
# Recommendation: {slug}
Asked by: {person} | Decider: {person} | Date: {date}
Recommendation: {one sentence} | Confidence: {percent} | Flips if: {condition}

## 1. Message to send (full text, destination and language named)
## 2. Not mine (decisions and actions that belong to someone else, one line each)
## 3. The question, as asked and as understood
## 4. Options (what, cost of ownership, fit, prerequisites)
## 5. Decision structure applied (shape, signals, which way each points)
## 6. Load drivers (dimension, direction, why)
## 7. Dependencies, in order, and what would slip them
## 8. Trade-off taken and what is given up
## 9. Assumptions and unsourced facts
## 10. References (verbatim quotes with URLs, Doc IDs)
```

## Hard rules

- **No estimate in days, no date, no cost, no figure of any kind.** This was decided
  deliberately: the figure is not the consultant's to produce here, and a number given quickly
  becomes a commitment. The load drivers and the dependencies are what he delivers instead.
- **Never one option.** A recommendation without a named rejected alternative is an order, not
  advice.
- **Every product fact carries its URL or is labelled an assumption.**
- **The client decides.** The message recommends, it does not announce a decision.
- **Do not widen the question.** Adjacent things that could be redesigned are one NOT MINE line.
- **Documentation before the instance.** Reading the instance is justified only when a fact the
  recommendation depends on cannot be settled otherwise, and then it is a read, never a change.
- **Name the option the requester preferred and treat it fairly.** Advice that dismisses it without
  the same analysis loses the reader.
- **No placeholder in a message.**
- **No em dashes** anywhere.
