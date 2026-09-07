# Load drivers and dependencies, without numbers

Read from step 5 of the architecture workflow. The client asks how heavy a change is, or when it
can land. The consultant does not answer with a figure. He answers with the dimensions that make it
heavier or lighter, and with the ordered list of what has to be true first. That answer is more
durable than a number and it is the one the client can actually check.

## Load drivers

For each dimension, say which way this case sits, and why. A dimension that does not apply is
written as such.

| Dimension | Lighter when | Heavier when |
| --------- | ------------ | ------------ |
| Roles touched | one role copy | several roles, or a predefined role that many copies inherit from |
| Page families | one family, and it is the one the users are on | both, or the family the users are not on yet |
| Legal employers, countries, business units | one | several, with different rules or legislations |
| Population | one team, one test account covers it | the whole workforce, several personas to test |
| Retroactivity | effective from today | back-dated, with history to correct and processes to re-run |
| Data | no data changes | records to fix, load or convert before the configuration works |
| Testing surface | one flow, one role | roles multiplied by flows multiplied by page families |
| Decisions pending | none, the need is settled | the client has to choose between designs first |
| Delivered or extended | a switch, a rule | an extension with its own pipeline |
| Integrations | none reads the object | an extract, an outbound feed or a downstream system reads it |
| Documentation | the mechanism is documented on docs.oracle.com | no public trace, an SR may be needed |
| Knowledge on the client side | the client team already runs this object | nobody on the client side has touched it |

## Dependencies: what has to be true first

Order matters in this product. A change started before its prerequisite produces a half-configured
state that debugging sees later. The usual chains:

- **Security before pages.** A page rule for a role assumes the role exists and is provisioned.
- **Security profile before role, role before mapping, mapping before provisioning run.** The
  role is not on anyone until the process has run.
- **Value set before flexfield, flexfield before the page rule that requires it.**
- **Position structure before position synchronisation.** Synchronising assignments from positions
  that are not maintained propagates the gaps.
- **Hierarchy refresh before anything that resolves on the hierarchy.** Approvals, areas of
  responsibility, manager self-service.
- **Data cleanup before a load.** A load on top of inconsistent records multiplies the
  inconsistency.
- **Opt-in before configuration of the feature.** Some features do not exist in setup until the
  offering has opted in.
- **The test instance state before the test.** A test instance behind production, or with
  processes not scheduled, does not test the same thing.

Write the chain for the case as an ordered list, one line per link, with who owns each link. The
links owned by someone other than the consultant are where the plan will slip, and the message
names them.

## What slips a plan in this product

These are the causes of slippage that come back, and none of them is the consultant's to control.
The recommendation names the ones that apply so that the client plans around them.

| Cause | What it does to a plan |
| ----- | ---------------------- |
| The quarterly update window | freezes changes for a period, and can move the behaviour being configured; a change straddling an update is tested twice |
| The environment refresh | resets the test instance to a copy of production; work in progress in the test instance is lost, and scheduled processes have to be re-created |
| The client's decision latency | every pending decision in the load drivers is a wait; the plan starts when the last one is taken |
| An open Oracle SR | the answer conditions the design; Oracle's cadence is not the client's |
| The change board cadence | a change that is ready waits for the next board; a change that misses the board waits for the one after |
| The provisioning and synchronisation processes | a change that depends on a process run is invisible until the run; in a test instance where nothing is scheduled, that is forever unless someone submits it |
| Data that nobody owns | a data fix with no owner is a dependency with no date |
| The single consultant | one person, several tickets, one test instance; two changes that both need the same object in the test instance serialise |

## How to say it in the message

One sentence per driver that matters, one ordered list for the chain, one sentence per cause of
slippage that applies. Then, when a figure was asked for: "The figure is not produced here; what
drives it is the list above." No softening, no promise to produce it later.
