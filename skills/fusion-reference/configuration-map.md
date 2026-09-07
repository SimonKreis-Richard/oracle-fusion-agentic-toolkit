# Configuration map: where configuration lives, and where it does not

Part of the `fusion-reference` skill. Knowledge only. Quotes are verbatim from the fetched Oracle
page, with title and URL. Sentences without a URL are the author's reading.

**The premise behind this file:** on an AMS engagement there is usually no up-to-date
configuration workbook. The instance is the only source of truth, so knowing where each kind of
configuration lives is knowing where to read. Every place below is named so that a verification
step can point at it.

## The places, and what each one holds

| Place | Holds | Reached through |
| ----- | ----- | --------------- |
| Setup and Maintenance, by offering, functional area and task | the functional setup: structures, document types, absence plans, checklists, lookups, flexfields, profile options, security profiles, role mappings, approval rules | Setup and Maintenance work area, search by task name |
| Profile options | preferences that change behaviour, at site, product or user level | task Manage Administrator Profile Values, by profile option code |
| Lookups | lists of values, by lookup type and code | tasks Manage Common Lookups, Manage Standard Lookups, and the HCM-specific lookup tasks |
| Flexfields | additional attributes on delivered objects | tasks Manage Descriptive Flexfields, Manage Extensible Flexfields, Manage Key Flexfields |
| Security Console | roles, their hierarchy, privileges and data security policies; user accounts | Security Console, by role code |
| HCM Experience Design Studio | Transaction Design Studio rules and Autocomplete rules on classic pages | My Client Groups, HCM Experience Design Studio |
| Visual Builder Studio | Business Rules and extensions on Redwood pages | Visual Builder Studio, the extension project |
| Transaction Console and BPM Worklist | approval rules and workflow task configuration | task Manage Approval Transactions for Human Capital Management, task Manage Task Configurations for Human Capital Management |
| Alerts Composer | event and resource alerts, their templates and schedules | Tools, Alerts Composer |
| Scheduled Processes | schedules, submissions, parameters, history, per instance | Scheduled Processes work area |
| Opt-in features | features delivered disabled and switched on per offering | My Enterprise, New Features, and Offerings |

## Setup and Maintenance: offerings, functional areas, tasks

"Oracle Functional Setup Manager provides an integrated, end-to-end process for functional
administrators to manage the implementation and maintenance of Oracle Fusion Applications Cloud."
(Overview of Functional Setup Manager, Using Functional Setup Manager 26B,
https://docs.oracle.com/en/cloud/saas/applications-common/26b/oafsm/overview-of-functional-setup-manager.html)

"An offering represents a collection of business processes that are supported by Fusion
Applications. Each subscription of Oracle Cloud provides license to use one or more offerings and
they're the starting point of all implementations. An offering consists of multiple functional
areas and features."

"A functional area represents one or more business sub-processes and activities within its parent
offering. It may represent a core operation of the offering or may represent an optional activity
which may or may not be applicable to your business."

"Setup tasks represent the work necessary to set up an offering and the business processes and
activities that the offering represents to make them ready for transaction processing."

"Tasks representing setup requirements of the offerings and the functional areas are grouped into
task lists and are organized in a hierarchy."
(How Functional Setup Manager Components Work Together, Using Functional Setup Manager 26B,
https://docs.oracle.com/en/cloud/saas/applications-common/26b/oafsm/how-functional-setup-manager-components-work-together.html)

"An implementation project is a list of setup tasks you use to implement your Fusion
Applications."

"When you create an implementation project, typically you generate its initial list of tasks by
selecting one of your enabled offerings. If you plan to use more than one offering, create a
separate implementation project for each one of them."
(How You Use Implementation Projects to Manage Setup, Using Functional Setup Manager 26B,
https://docs.oracle.com/en/cloud/saas/applications-common/26b/oafsm/how-you-use-implementation-projects-to-manage-setup.html)

In practice, the **task name** is the address of a piece of configuration. A verification step
that names the task ("Setup and Maintenance, task Manage Document Types") is executable; one that
names the concept is not. The Workforce Deployment offering carries most of core HR; Recruiting,
Compensation, Benefits, Absence and Payroll have their own offerings or functional areas.

## Profile options

"Profile options are a set of preferences that you use to centrally manage the user interface
settings and application behavior."
(Overview of Profile Options, Using Common Features for HCM,
https://docs.oracle.com/en/cloud/saas/human-resources/faucf/overview-of-profile-options.html)

"The hierarchy in profile levels determines the context for making a profile option effective."

"Site level (lowest): The entire site of deployment"

"User level (highest): A specific user"

"The setting at the highest enabled level takes precedence over the lower levels. User level is
the highest in the hierarchy and always takes precedence over the settings at the site level."
(Hierarchy in Profile Levels, Using Common Features for HCM,
https://docs.oracle.com/en/cloud/saas/human-resources/faucf/hierarchy-in-profile-levels.html)

Two readings. A user who behaves differently from everyone else may hold a **user-level** value
that overrides the site: read the profile option at all levels, not only site. And the Redwood
enablement options (`ORA_..._REDWOOD_ENABLED`, see `pages-and-extensions.md`) are profile
options like any other, with the same levels and the same override.

## Lookups

"Lookups are lists of values in applications. You define a list of values as a lookup type
comprising a set of lookup codes, each code's translated meaning, and optionally a tag."

"The configuration level of a lookup type determines whether the lookups in that lookup type can
be edited."

"The configuration levels are user, extensible, and system."

"Some lookups are designated as extensible, so new lookup codes can be created during
implementation, but the predefined lookup codes can't be modified."

"Once the configuration level is set for a lookup type, it can't be modified. The configuration
level for newly created lookup types is by default set at the User level."
(Overview of Lookups, Using Common Features for HCM,
https://docs.oracle.com/en/cloud/saas/human-resources/faucf/overview-of-lookups.html)

A value that "cannot be added to the list" is a system-level lookup, and the need has to be met
another way. A code that exists but does not show is usually end-dated or disabled on the lookup,
or filtered by a tag or a legislation.

## Flexfields

"A flexfield is a set of placeholder fields associated with business objects and placed on the
application pages to contain additional data."

"Descriptive flexfields are stored in additional columns on the same table as that of the object,
whereas extensible flexfields are stored in a separate extension table."

"Key flexfields consist of one or more segments, where each segment can have a meaning. You can use
key flexfields to enter multipart values, such as a part number, a job code, or an account code."
(Overview of Flexfields, Configuring and Extending Applications 26B,
https://docs.oracle.com/en/cloud/saas/applications-common/26b/oaext/overview-of-flexfields.html)

A flexfield change is not visible until the flexfield is **deployed**, and a segment can be shown
on a page only if the page rule of the matching family enables it (see the Transaction Design
Studio sentence on enabling descriptive flexfield segments in `pages-and-extensions.md`). A
segment that exists, is deployed, and still does not show is a page rule question.

## Approval rules

"Use the Manage Approval Transactions for Human Capital Management task to configure approval
policies for HCM tasks such as Hire or Promote."

"This interface works in conjunction with the BPM Worklist, but enables users to identify
approvers and configure approval rules easily for some frequently performed HCM tasks."

"For any HCM tasks that are not available in the Manage Approval Transactions interface, you can
use the BPM Worklist to configure all aspects of approvals. To configure in the BPM Worklist, use
the Manage Task Configurations for Human Capital Management task."
(Guidelines for Managing Approval Rules, Using Common Features for HCM,
https://docs.oracle.com/en/cloud/saas/human-resources/faucf/guidelines-for-managing-approval-rules.html)

An approval that resolves to the wrong person is either the rule or what it resolves on: a rule on
the manager hierarchy depends on the denormalized hierarchy being refreshed, a rule on a position
depends on the position having an incumbent, a rule on an area of responsibility depends on the
area being assigned. The rule is read in the task above; what it resolves on is data or a
scheduled process (see `scheduled-processes.md`).

## Moving configuration between instances

"Any implementation of Fusion Applications usually requires migrating setup data from one
environment to another at various points in the subscription lifecycle."

"Setup export and import processes help you migrate setup data from test to production."
(Overview of Setup Data Export and Import, Using Functional Setup Manager 26B,
https://docs.oracle.com/en/cloud/saas/applications-common/26b/oafsm/overview-of-setup-data-export-and-import.html)

"A configuration package is the medium used to move setup data from one environment to another."

"After an export process runs successfully, you can download the configuration package as a .zip
file. You can then move this configuration package to the environment where you plan to import the
same setup, upload the file, and run the import."

"You can never export user level profile values."
(Key Information About Setup Data Export and Import Processes, Using Functional Setup Manager 26B,
https://docs.oracle.com/en/cloud/saas/applications-common/26b/oafsm/key-information-about-setup-data-export-and-import-processes.html)

Not everything moves by configuration package. Security Console roles have their own export,
Transaction Design Studio rules and Visual Builder extensions have theirs, Page Composer
personalisations travel by sandbox, and scheduled process schedules do not travel at all. A change
note that names the transport for each object (see the `hcm-configuration` skill) is what makes
the production deployment repeatable.

## Quarterly updates

Oracle delivers an update every quarter, named by year and letter (25D, 26A, 26B, 26C). Features
arrive enabled or disabled; disabled ones are switched on by opt-in, and an opt-in can expire,
meaning the feature turns on by itself at a later update. The verbatim sentences are in
`scheduled-processes.md`, section Quarterly updates and opt-in features. For any "since when" question,
the What's New of the last two updates is the first document to read: it names the profile
options whose defaults changed, the pages that moved to Redwood, and the roles whose privileges
changed.

## What is not configuration

The list that prevents the most wasted effort. None of these is fixed in Setup and Maintenance.

| Not configuration | It is | Fixed by |
| ----------------- | ----- | -------- |
| a person's manager, department, position on the assignment | data | the data owner, on the record, or a synchronisation process |
| a document record, an absence, an approval in flight | data | the data owner |
| the incumbent of a position | data | the data owner |
| a schedule, a submission, a run history | instance data | re-created per instance; never travels |
| an integration endpoint, a notification delivery setting | environment-specific | the technical owner, per instance |
| the code of a delivered page | product | an Oracle SR, with the page family named |
| a value in a user's own preferences | user-level setting | the user, or a user-level profile value |

The `product-structure.md` file carries the fuller data versus configuration table.
