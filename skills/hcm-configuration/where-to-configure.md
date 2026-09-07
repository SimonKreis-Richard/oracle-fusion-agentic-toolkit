# Where to configure: the same effect, several places

Read from step 3 of the configuration workflow. This file does not describe what each place is,
the `fusion-reference` skill does (`configuration-map.md`, `security-model.md`,
`pages-and-extensions.md`). It answers one question: **when several places can produce the visible
effect asked for, which one, and why.**

The five rules from the workflow decide, in order: delivered over extended, narrowest scope,
survives the quarterly, transports, leaves a trace. The table applies them to the cases that come
back.

## Visible effect asked for, and the candidates

| Effect asked for | Candidates, best first | Pick the first unless |
| ---------------- | ---------------------- | --------------------- |
| A user cannot see or do something they should | The role already lacks the privilege or data security (add through a role copy) > a role mapping does not grant the role > a security profile excludes the record > a page rule hides the element > a profile option turns the feature off | The action is present but errors: then it is not security, see hcm-debugging |
| Hide, show or require a field or section on a page | Transaction Design Studio rule (per action, role, country) > Visual Builder Studio extension for a Redwood page > Page Composer on a classic page | The page is not covered by a Transaction Design Studio action, or the rule needs logic the studio cannot express |
| Default or derive a value on a page | Autocomplete rule where supported > Visual Builder Studio business rule on Redwood > a default in the flexfield or value set definition | The value is a business constant: then the setup object, not a page rule |
| Add a custom attribute to an object | Descriptive flexfield (one segment set) > extensible flexfield (multiple contexts, multi-row) > a lookup reused as a value list | Reporting, integration or a page family does not surface the flexfield: check before choosing |
| Add a value to a list | Lookup code on an existing user or extensible lookup > a value set value > a new lookup type | The lookup is system-level: it cannot be extended, and the need has to be met elsewhere |
| Change who approves what | Approval rule in the workflow task configuration > an area of responsibility that changes the approver resolution > a position or department hierarchy change | The request is about the hierarchy being wrong, which is data, not rules |
| Notify someone when something happens | Delivered notification setting > HCM Alert on the object > an approval rule notification step > a scheduled report | The trigger is a data condition without a delivered event: alert |
| Grant a role to a population automatically | Role mapping with conditions and Autoprovision, then the provisioning process > requestable role for managers > self-requestable role > manual assignment | The population cannot be expressed by the mapping conditions: then the design is wrong, see hcm-architecture |
| Restrict which records a role sees | The security profile referenced by the role (person, organization, position, LDG, document type) > a data role with a narrower profile > a role copy with a different data security policy | The restriction is by transaction rather than by record: function security, not data security |
| Turn a feature on or off for everyone | Opt-in feature under the offering > site-level profile option > a page rule that hides it | The feature is wanted for some users only: the profile option at a narrower level, or the role |
| Change the behaviour of a scheduled process | Its parameters at submission > its schedule > a different delivered process that does the same job | The process is running under the wrong user or with the wrong data security: that is the submitting user, not the process |
| Enforce a business rule on entry | Delivered validation or setup option > Autocomplete rule > Visual Builder Studio rule on Redwood > an approval rule that rejects | The rule is really a reporting check after the fact: a report or an alert, not an entry rule |

## Three rules of thumb that decide most cases

1. **If the effect is "the button is not there", the answer is security in nine cases out of ten.**
   A missing privilege removes the action from the page. A page rule that hides it is the
   exception, and it is found by reading Transaction Design Studio for that action, not by adding
   privileges.
2. **If the effect is on a page, ask which page family first.** A rule in Transaction Design Studio
   applies where the studio covers the action. A Page Composer personalisation applies to the
   classic page only. A Visual Builder Studio extension applies to the Redwood page only. The
   request usually names neither, and the requester usually uses one.
3. **If the effect is a value, decide whether it is data or configuration before touching setup.**
   A wrong manager, a wrong department on an assignment, a missing document record are data. They
   are fixed on the record, by the owner of the data, and they do not need a setup change.

## What each candidate costs to own, in one line each

| Place | Who migrates it at the quarterly | Transports by | Trace |
| ----- | -------------------------------- | ------------- | ----- |
| Setup task, profile option, lookup, flexfield | Oracle | setup export and import, or re-key | the task's own history, when it has one |
| Role copy, role mapping, security profile | Oracle keeps the copy, may change the predefined source | re-key, or role export where available | Security Console |
| Transaction Design Studio rule | Oracle, and rules can be affected when an action changes | re-key | the rule list, with the rule name |
| Visual Builder Studio extension | the operator re-verifies every quarter | the extension's own pipeline | the extension project |
| Page Composer personalisation | the operator, and it does not exist on Redwood | sandbox publication or re-key | the sandbox |
| HCM Alert, approval rule | Oracle | re-key | the alert or rule list |
| Scheduled process schedule | nobody: schedules do not follow an environment copy | re-create in each instance | the process history |
