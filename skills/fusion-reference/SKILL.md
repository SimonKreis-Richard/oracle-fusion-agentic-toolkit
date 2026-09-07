---
name: fusion-reference
description: Shared product knowledge on Oracle Fusion Cloud HCM, with no workflow in it. Read it when another skill points here, or when the user asks a plain knowledge question about how the product is put together, where configuration lives and where it does not, Redwood versus classic pages, what Transaction Design Studio governs versus Visual Builder Studio, how security is composed (job, abstract and duty roles, privileges, data security, security profiles, role mappings), or what the scheduled processes do. It contains verbatim Oracle documentation quotes with their URLs. Not for something broken (hcm-debugging), not for building a change (hcm-configuration), not for a recommendation (hcm-architecture).
---

# Oracle Fusion Cloud HCM: the shared reference

This skill is a knowledge base, not a procedure. It exists so that the three workflow skills
(`hcm-debugging`, `hcm-configuration`, `hcm-architecture`) share one description of the product
instead of three that drift apart. Nothing here says what to do: it says how the product is built,
so that a workflow can reason about it.

**How to use it:** open the one file below that the question needs, read it, and cite from it.
Do not read all five. Every file carries verbatim sentences from the Oracle documentation with
their URL: quote those, with the URL, rather than restating them. When a question is not covered,
the answer is on docs.oracle.com, found by web search restricted to that domain and read through
`fetch_oracle_page` of the `oracle-fusion-docs` MCP, which is the only path to the verbatim text.

## The five files

| File | Read it for |
| ---- | ----------- |
| [`product-structure.md`](product-structure.md) | enterprise structures (enterprise, legal employer, business unit, legislative data group), the person model (person, work relationship, assignment), date effectivity, correction versus update, data loading |
| [`configuration-map.md`](configuration-map.md) | where configuration lives: Setup and Maintenance (offerings, functional areas, tasks), profile options and their levels, lookups and their customisation levels, flexfields, approval rules, setup export and import, quarterly updates and opt-in features, and what is **not** configuration |
| [`pages-and-extensions.md`](pages-and-extensions.md) | Redwood versus classic pages and how Redwood is enabled, what Transaction Design Studio governs, what Visual Builder Studio governs, what Page Composer and Autocomplete rules govern, and which of them applies to which page family |
| [`security-model.md`](security-model.md) | role types (abstract, job, duty, aggregate privileges, data roles), function security versus data security, security profiles, role mappings and their conditions, autoprovisioning, areas of responsibility, the LDAP processes, and the one diagnostic tell that matters most |
| [`scheduled-processes.md`](scheduled-processes.md) | what a scheduled process is, the processes that must be scheduled for HCM to behave (manager hierarchy, position synchronisation, autoprovisioning, search keywords, alerts), and why schedules do not follow an environment copy |

## Two constants that every file assumes

**The configuration lives only in the instance.** There is usually no up-to-date configuration
workbook on an AMS engagement. So a fact about the current configuration is something to read in
the instance, with its path, never something to assume.

**Two instances, one symptom.** A problem is observed in production; the consultant can read and
change only a test instance, a copy of production some weeks behind. Configuration mostly
transfers across that gap. Scheduled process schedules, submissions and history do not. The
workflow skills carry the detail of what transfers; the reference only explains why.

## Conventions

- A quoted sentence is copied character for character from the fetched page and carries the page
  title and URL. If a sentence has no URL, it is the author's reading, not Oracle's wording.
- Oracle renames things across updates. Where a name changed (HCM Experience Design Studio and
  Transaction Design Studio, for one), both names are given.
- No engagement data: no client name, no custom role name, no ticket key. Examples use generic
  names.
