# Change note template

Written to `engagement/output/changes/{slug}.md`, one file per change. `npm run actions` does not
read it: the note is for people, first the operator in six months, then whoever carries the change
to production. Every field is filled with a real value or with the reason it is empty. No
brackets left in a delivered note.

Sections 1 and 2 are what the requester and the change board read. Sections 3 onward are what the
operator will need when the change misbehaves after a quarterly update.

```markdown
# Change: {slug}
Requested by: {person} | Decider: {person} | Ticket: {key or none} | Date: {date}
Instance: {test instance name} | Effective date: {date} | Update or correction: {which}
Status: built and verified | built, verification pending | designed, not built

## 1. Message to send
Destination: {person, channel} | Language: {language}

{one paragraph per line, no hard line breaks inside a paragraph}

## 2. Not mine
- {decision or action that belongs to someone else, one line each}

## 3. The need, as asked and as understood
Asked: "{verbatim request}"
Need: {the visible outcome, the population, the pages in scope}
Done when: {account, record, action, expected result}

## 4. Mechanism
"{verbatim sentence from the Oracle documentation}" ({page title}, {URL})
What's New checked: {last two updates, and what they said or did not say}

## 5. Location chosen, and the ones rejected
Chosen: {exact place: task, object, rule name, role code}
Rejected: {place}, because {rule from the workflow that decided}

## 6. Before, after
| Object | Where exactly | Before | After |
| ------ | ------------- | ------ | ----- |
| {name} | {navigation path} | {value read, with its date} | {value set} |

Screenshots before: {paths}

## 7. Impact checked
| Direction | Finding |
| --------- | ------- |
| Other roles | {finding or "no effect", with why} |
| Other populations | |
| Other page family | |
| Downstream processes | |
| Provisioning | {and when the next run happens} |
| Reporting | |
| Time | |

## 8. Steps performed, in order
| # | Action | Where exactly | Value |
| - | ------ | ------------- | ----- |

## 9. Verification
Account: {test account} | Role: {role code} | Record: {named record}
In scope: {what was seen, screenshot path}
Out of scope: {what was seen on a record outside the population, screenshot path}
Page families: {Redwood, classic, both, and what was seen on each}
Process run first: {process name and run time, or none needed}

## 10. Transport to production
Owner: {person or team who applies it there}
By: setup export {package name} | re-key list below
| # | Where exactly | Value |
| - | ------------- | ----- |
Processes to run afterwards: {names, in order}
Effective date to use: {date}

## 11. Rollback
{the before values from section 6, and the order to restore them}

## 12. Re-check after the next quarterly update
- {one line per item: what to look at, where, what it should still show}
```
