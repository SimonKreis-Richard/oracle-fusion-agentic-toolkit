# Resolved pattern library

**Copy this file to `engagement/patterns.md` on a new engagement.** It stays there, outside the
repository, because entries carry role names, ticket keys and support request numbers.

Append-only. One entry per resolved signature, newest at the bottom. Grep this file for the error
signature at the start of every triage (step 0 of the `hcm-debugging` skill).

Never rewrite or delete an entry. When an entry turns out to be wrong or incomplete, append a new
one and state which entry it supersedes. Add an entry only after the operator confirms it.

An entry earns its place when it carries the three things a future reader cannot rederive: the
**mechanism**, the **fix that was actually verified**, and the **trap that would have cost a day**.

---

## Example: an action is missing from a page rather than refused

**Symptom (verbatim key):** the action simply is not in the Actions menu. No error, no message.

- **Family:** 5, security and roles.
- **Root cause:** a privilege the role does not carry. A missing privilege **removes** the action
  rather than refusing it, so the page looks like a configuration or rendering problem.
- **Fix:** grant the privileges listed on the Oracle actions and privileges page for that flow, then
  `Regenerate Data Security Grants` in Mode All Roles, then
  `Import User and Role Application Security Data`, then log out and back in **as a user holding the
  affected role**, and retest.
- **Watch for:** testing under an administrator role is the single easiest mistake here. Admin roles
  carry the privilege, so the flow looks healthy and the symptom vanishes. The only test that counts
  runs as a user holding the affected role.
- **Discriminator against family 2:** an error message means the code ran, which usually means the
  privilege was there. Silence and absence point here first.
- **Source:** invented example, replace with your own.

---

## Example: a scheduled process that has no default schedule

**Symptom (verbatim key):** derived data is stale after a release, then corrects itself a day later
with nobody touching a record.

- **Family:** 2, configuration.
- **Root cause:** the process that rebuilds the derived data has **no default schedule**. It runs
  only when somebody submits it, or when a schedule somebody created happens to fire.
- **Fix:** run it after every release, and confirm it is scheduled rather than assuming it is.
- **Watch for:** scheduled processes do **not** follow an environment copy. A test instance history
  says nothing about production, and reproducing there proves nothing.
- **Source:** invented example, replace with your own.
