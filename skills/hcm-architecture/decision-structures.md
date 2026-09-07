# Decision structures that come back in Oracle Fusion Cloud HCM

Read from step 4 of the architecture workflow. Each structure has the same shape: the signals
that point each way, the default, and what flips it. The default is a starting point, the signals
of the case decide. The product knowledge behind these (what each layer is) is in the
`fusion-reference` skill.

## 1. Fix or redesign

The recurring question: a symptom keeps coming back on an object, and someone asks whether to fix
it once more or rebuild the object.

| Signal | Points to fix | Points to redesign |
| ------ | ------------- | ------------------ |
| Recurrence | first or second time | the same mechanism, third time or more |
| Exceptions | one population, one case | the workaround has become the process for everyone |
| Origin | a quarterly update or a data change moved something | the object was built for a process the client no longer runs |
| Knowledge | the mechanism is documented and understood | nobody can say why the object is shaped as it is |
| Blast radius of the fix | contained to the object | every fix touches three other things |

**Default: fix**, because a redesign carries a testing surface the client rarely has capacity for.
**Flips** when the workaround has become the process, or when the third recurrence shares the
mechanism of the first two: at that point the fix is the expensive option, it is just paid in
smaller pieces.

## 2. Delivered or extended

The question: Oracle ships something close to the need; is the gap worth an extension?

| Signal | Points to delivered | Points to extended |
| ------ | ------------------- | ------------------ |
| Gap | cosmetic, or a wording | a step in the process the delivered feature cannot do |
| Roadmap | What's New shows the gap closing | the gap has been stable for years |
| Ownership | nobody in the client team owns extensions | someone does, and will still be there |
| Page family | the need is on Redwood, where extension means Visual Builder Studio | the need is on a classic page that is going away anyway |
| Population | everyone | one team with a real specificity |

**Default: delivered, and adapt the process to the gap.** Every extension is re-verified at every
quarterly update by the person who built it, and this product ships four of them a year.
**Flips** when the gap blocks a step the process cannot skip and What's New gives no sign of
closing it.

## 3. Where does this belong

The question: a behaviour is wanted; which layer should carry it?

Walk the layers from the cheapest to own to the most expensive, and stop at the first that can
carry the behaviour for the whole population in scope:

1. **Security**: who can see or do it. If the behaviour is "this role should or should not",
   it is a privilege, a data security policy or a security profile, and nothing else.
2. **Setup**: a delivered option, a lookup, a flexfield, a profile option. If the product has a
   switch for it, the switch.
3. **Page rule**: Transaction Design Studio, Autocomplete rule. If the behaviour is about what a
   page shows or requires, for an action, a role, a country.
4. **Extension**: Visual Builder Studio on Redwood, Page Composer on classic. If the behaviour needs
   logic the rules cannot express.
5. **Data**: if the behaviour is really "the record should say something else", none of the above
   applies. It is a data fix, owned by the data owner.

**The recurring mistake** is carrying a security need at the page layer: hiding a button for a
role instead of removing the privilege. The hidden button reappears on the other page family, in
the REST API, and after the next quarterly update.

## 4. Does this hold together

The question: a set of choices was made, or is proposed; are they consistent?

Check each pair for the tensions this product is known for:

| Pair | Tension to check |
| ---- | ---------------- |
| Position management and manager synchronisation | if assignments synchronise from positions, the position hierarchy has to be maintained with the same rigour as the assignments, and the synchronisation process has to be scheduled everywhere it matters |
| Autoprovisioning and manual role assignment | a role granted by mapping is removed by the mapping when the condition stops holding; a role assigned by hand is not; mixing the two on one role produces "roles disappearing" tickets |
| Role copies and predefined roles | a predefined role changed by Oracle at a quarterly update propagates to nobody's copy; a client running on copies has to read What's New for security changes every quarter |
| Redwood and classic in parallel | every page rule, personalisation and training material exists twice or applies to one family only; the parallel run is a state to leave, not a design |
| Areas of responsibility and security profiles | both can decide who a manager or an HR partner sees; when both are used for the same population, the narrower one wins silently |
| Approvals and the hierarchy they resolve on | an approval rule resolving on the manager hierarchy depends on that hierarchy being refreshed; a rule resolving on positions depends on positions being filled |
| Document types and security profiles | a document type that is not in the profile of a role is invisible to that role, which is correct until someone expects it to be visible |

**The output is a list of pairs with a finding each**, including "consistent" when it is. The
recommendation names the pair that has to be resolved first.

## 5. Which of two

Two viable options, the client wants a recommendation.

Score both on the same five criteria, in this order of weight, and say which criterion decided:

1. **Cost of ownership across quarterly updates**: who re-verifies what, four times a year.
2. **Scope fit**: does it cover the whole population, both page families, all legal employers.
3. **Reversibility**: can it be undone without a data fix.
4. **Transport**: does it move to production by export or by re-key.
5. **Knowledge**: can the client team explain it after the consultant leaves.

When the two options tie on the first three, the choice is the client's, and the message says so
rather than manufacturing a preference.

## 6. What will this drive

The client wants to know what a change pulls in. This is not a decision structure, it is a walk
through `load-and-dependencies.md`, and it ends with the ordered list of what has to be true
first, not with a figure.

## Recurring trade-offs, named once

| Trade-off | The side the default takes | What is given up |
| --------- | -------------------------- | ---------------- |
| Flexibility or maintainability | maintainability | the ability to serve every local exception |
| Personalise now or migrate to Redwood | migrate, when the Redwood page exists for the flow | the quick fix on the classic page |
| Role granularity or administration burden | fewer, broader roles with data security doing the narrowing | the ability to remove one privilege from one person |
| Automation or control | automation through mappings and scheduled processes | the ability to make one exception by hand without it being undone |
| One standard or local exceptions | one standard | the local process that was there before |
| Delivered wording or client wording | delivered | the familiar label, which costs a rule on every page that shows it |

State which side the recommendation takes, and let the client take the other if they value it.
