# Product structure: enterprise structures, the person model, date effectivity

Part of the `fusion-reference` skill. Knowledge only. Quotes are verbatim from the fetched Oracle
page, with title and URL. Sentences without a URL are the author's reading.

## Enterprise structures: the containers everything sits in

| Object | What it partitions |
| ------ | ------------------ |
| Enterprise | the whole tenant, one per instance |
| Legal entity, legal employer | who employs the worker; captured on the work relationship |
| Business unit | which business functions and which transactions |
| Legislative data group (LDG) | payroll and legislation-dependent data, one at least per country |
| Department, division, location, job, position, grade | workforce structures, referenced by assignments |

"An enterprise is a collection of legal entities under your common control and management."
(Enterprises, Implementing Payroll for the United States,
https://docs.oracle.com/en/cloud/saas/human-resources/fapus/enterprises-for-the-us.html)

"A legal employer is a legal entity that employs workers. You define a legal entity as a legal
employer in the Oracle Fusion Legal Entity Configurator."

"The legal employer is captured at the work relationship level, and all assignments within that
relationship are automatically with that legal employer."
(What's a legal employer?, Implementing Global Human Resources,
https://docs.oracle.com/en/cloud/saas/human-resources/faigh/what-s-a-legal-employer.html)

"A business unit is a unit of an enterprise that performs one or many business functions that can
be rolled up in a management hierarchy. A business unit can process transactions on behalf of many
legal entities."
(Business Units, Implementing Global Human Resources,
https://docs.oracle.com/en/cloud/saas/human-resources/faigh/business-units.html)

"Legislative data groups are a means of partitioning payroll and related data. At least one
legislative data group is required for each country where the enterprise operates."
(Legislative Data Groups, Implementing Global Human Resources,
https://docs.oracle.com/en/cloud/saas/human-resources/faigh/legislative-data-groups.html)

"The Legal Structures functional area covers tasks related to legal entity setup, the Organization
Structures functional area includes tasks related to business unit setup, and the Workforce
Structures functional area includes tasks related to department, division, trees, jobs, positions,
and other organizations setup."
(Overview of Legal Entities, Business Units, and Divisions, Implementing Global Human Resources,
https://docs.oracle.com/en/cloud/saas/human-resources/faigh/overview-of-legal-entities-business-units-and-divisions.html)

Why the containers matter for daily work: many objects are defined **per legal employer**, **per
LDG** or **per business unit** (document types, lookups with legislation, payroll elements,
absence plans, approval rules by BU). A behaviour that is right for one population and wrong for
another is usually an object that exists for one container and not for the other. The first
question on a "works for them, not for us" symptom is which container each population sits in.

## The person model: person, work relationship, assignment

Three levels, one below the other.

"All workers, nonworkers, and contacts have a single person record in the enterprise identified
by a person number."

"You never terminate a person record. It continues to exist through all of a person's work and
contact relationships in the enterprise."
(Person Records, Using Global Human Resources,
https://docs.oracle.com/en/cloud/saas/human-resources/fawhr/person-records.html)

"The employment model comprises two types of entities, which are work relationships and
assignments."
(Employment Model, Implementing Global Human Resources,
https://docs.oracle.com/en/cloud/saas/human-resources/faigh/employment-model.html)

"A work relationship defines how a person and legal employer are related."

"A person can have only one primary work relationship. All other work relationships are
nonprimary."
(Work Relationships, Using Global Human Resources,
https://docs.oracle.com/en/cloud/saas/human-resources/fawhr/work-relationships.html)

"An assignment provides information about a person's role such as job, position, pay,
compensation, managers, working hours, and location."

"A work relationship must have at least one assignment. Your legal employer may allow multiple
assignments in one work relationship."
(Assignments, Using Global Human Resources,
https://docs.oracle.com/en/cloud/saas/human-resources/fawhr/assignments.html)

What lives where, and what it decides:

| Level | Carries | Decides |
| ----- | ------- | ------- |
| Person | name, identifiers, contacts, documents of record, person number | identity, search, document records |
| Work relationship | legal employer, worker type, start and end dates, primary flag | which legal employer, hence which legislation and which legal-employer-scoped configuration |
| Assignment | job, position, department, manager, location, grade, status, working hours | role provisioning conditions, security by hierarchy, approvals, most functional behaviour |

Almost every role mapping condition, every hierarchy and every approval resolution reads the
**assignment**. A person with two assignments matches a mapping if any one of them does. A
terminated work relationship leaves the person record in place, which is why a former worker still
appears in search and still holds roles until the mapping conditions and the LDAP processes catch
up (see `security-model.md`).

## Date effectivity: history, update, correction

"Date effectivity preserves a history of changes made to the attributes of some objects. As a
Professional user, you can retrieve and edit past and future versions of an object."

"Date-effective objects include one or more physical records. Each record has effective start and
end dates. One record is current and available to transactions. Others are past or take effect in
the future."

"Some objects, such as work relationships, are date-enabled rather than date-effective. They have
start and end dates that define when they're available, but they have no history of changes. New
attribute values overwrite existing attribute values."
(Date Effectivity, Using Common Features for HCM,
https://docs.oracle.com/en/cloud/saas/human-resources/faucf/date-effectivity.html)

"When you update a date-effective object, you insert a physical record in the object's history.
Typically, the inserted record follows the current record and the effective start date is today."
(Examples of Updating Date-Effective Objects, Using Common Features for HCM,
https://docs.oracle.com/en/cloud/saas/human-resources/faucf/examples-of-updating-date-effective-objects.html)

"You can correct most attributes of date-effective objects, regardless of whether they occur in
current, past, or future physical records."

"Because you corrected the object, no change history exists."
(Examples of Correcting Date-Effective Objects, Using Common Features for HCM,
https://docs.oracle.com/en/cloud/saas/human-resources/faucf/examples-of-correcting-date-effective-objects.html)

"Many Oracle HCM Cloud objects are date-effective. That is, they retain a history of changes, each
of which has effective start and end dates."
(Overview of Loading Date-Effective Objects, HCM Data Loader,
https://docs.oracle.com/en/cloud/saas/human-resources/fahdl/overview-of-loading-date-effective-objects.html)

The distinction that matters on every change: an **update** inserts a row as of a date and keeps
the history, so it can be undone by ending or deleting the row. A **correction** overwrites the
row and leaves no trace, so it cannot. Assignments, positions, jobs, departments and many setup
objects are date-effective; work relationships are date-enabled. A "value that changed by itself"
on a date-effective object is a future-dated row that became current, and the history of the
object shows who inserted it and when.

Date effectivity also explains why "as of which date" is part of every fact about an assignment:
the same person record answers differently depending on the effective date the page is viewed at.

## Loading data in bulk

"HCM Data Loader is a powerful tool for bulk-loading and maintaining data. It supports file-based
upload of business objects, components, and component attributes using a flexible, delimited
file."

"You can use HCM Data Loader for data migration, ongoing maintenance of HCM data, and coexistence
scenarios, where core HR data is uploaded regularly."
(Overview of HCM Data Loader, HCM Data Loader,
https://docs.oracle.com/en/cloud/saas/human-resources/fahdl/overview-of-hcm-data-loader.html)

"HCM Spreadsheet Data Loader loads HCM business objects from spreadsheets, which you generate from
spreadsheet templates."
(HCM Spreadsheet Data Loader Templates, HCM Data Loader,
https://docs.oracle.com/en/cloud/saas/human-resources/fahdl/hcm-spreadsheet-data-loader-templates.html)

A load writes the same objects the pages write, under the same date effectivity, and bypasses page
rules and Autocomplete validation unless the rule is an object validation. A record that "could not
have been entered that way" often was not: it was loaded.

## Data versus configuration

A recurring confusion, worth settling in one table. A wrong value on the left is fixed on the
record, by the data owner; a wrong value on the right is a setup change.

| Data (a record) | Configuration (setup) |
| --------------- | --------------------- |
| a person, a work relationship, an assignment, its manager, its department | the department itself, its classification, its hierarchy |
| a document record | the document type, its security profile, its attributes |
| an area of responsibility assigned to a worker | the responsibility type, the security profile that uses it |
| a position's incumbent | the position, its hierarchy, the synchronisation options |
| a role held by a user | the role, its privileges, the mapping that grants it |
| an absence entered | the absence plan, its eligibility |
| an approval in flight | the approval rule |

The `hcm-configuration` skill builds the right column. The left column belongs to the client's
data owners, and the operator's contribution to it is a message naming the record and the value.
