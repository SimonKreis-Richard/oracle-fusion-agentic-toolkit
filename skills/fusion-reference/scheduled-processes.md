# Scheduled processes: what runs, what must be scheduled, and why schedules do not travel

Part of the `fusion-reference` skill. Knowledge only. Quotes are verbatim from the fetched Oracle
page, with title and URL. Sentences without a URL are the author's reading.

## What a scheduled process is

A scheduled process is a job run by Oracle Enterprise Scheduler (ESS), submitted from the
Scheduled Processes work area with parameters, either once or on a schedule. It runs under the
submitting user, with that user's data security. HCM depends on a set of them to keep derived data
current: hierarchies, synchronised assignments, role assignments, search indexes. **None of them is
scheduled out of the box.** An instance where nobody scheduled them has stale derived data, and the
symptoms look like defects in the pages that read it.

The general overview page of the Scheduled Processes guide could not be fetched verbatim at the
time of writing; the sentences below on each process are.

## The processes HCM depends on

### Refresh Manager Hierarchy

"You use the Refresh Manager Hierarchy process to populate the denormalized manager hierarchy
table when person records are migrated from other applications."

"You run the Refresh Manager Hierarchy process in the Scheduled Processes work area. To run the
process, you must have the Human Resource Specialist job role. The process has no default
schedule. You can run the process occasionally to perform a complete refresh of the denormalized
manager hierarchy. You can also specify a schedule to run the process regularly."

"Schedule a full refresh every month or quarter and an incremental refresh every day or week, for
example."
(The Manager Hierarchy: How It's Maintained, Using Global Human Resources,
https://docs.oracle.com/en/cloud/saas/human-resources/fawhr/the-manager-hierarchy-how-it-s-maintained.html)

"You need to run the Refresh Manager Hierarchy process to populate the data to report using the
hierarchical dimensions in OTBI. This process needs to be run every time there's a change in the
worker and supervisor hierarchy."
(Refresh Manager Hierarchies, Creating and Administering Analytics and Reports for HCM,
https://docs.oracle.com/en/cloud/saas/human-resources/fahca/refresh-manager-hierarchies.html)

What reads the denormalized table: OTBI hierarchical dimensions, approval resolution on the
manager hierarchy, manager self-service team views, areas of responsibility by hierarchy. A wrong
manager in one of those with a right manager on the assignment is this process not having run.

### Synchronize Person Assignment from Position

"To synchronize the position changes with the affected assignments, run the Synchronize Person
Assignments from Position process."

"You must schedule this process to run on a regular basis. If you're synchronizing the manager,
then it's recommended to run this process daily."

"Use the Schedule New Process page in the Scheduled Processes work area to run the Synchronize
Person Assignment from Position process."
(Synchronize Person Assignment from Position Process, Implementing Global Human Resources,
https://docs.oracle.com/en/cloud/saas/human-resources/faigh/synchronize-person-assignment-from-position-process.html)

The behaviour the process implements when the manager comes from the position hierarchy:

"When the manager is synchronized from the HCM position hierarchy and you change the parent
position, all assignments inherit the new manager from the current parent position. When you
remove a position from the hierarchy, all child positions move one level up in the hierarchy.
Hence, the grandparent position is the new parent position."

"When you change the position in an existing assignment, the manager value is updated based on
the parent position of the changed position. If the parent position doesn't have an incumbent,
the incumbent in the position in the next level up in the hierarchy is the new manager."
(Position Synchronization, Using Global Human Resources,
https://docs.oracle.com/en/cloud/saas/human-resources/fawhr/position-synchronization.html)

So a manager that "skips a level" is documented behaviour when the parent position is vacant, not
a defect. And a position change that did not reach the assignments is this process not having run.
Note the two spellings Oracle uses on its own pages, "Assignment" and "Assignments": search the
process list with either.

### Autoprovision Roles for All Users

"Autoprovisioning is the automatic allocation or removal of user roles. It occurs for individual
users when you create or update assignments. You can also apply autoprovisioning explicitly for
the enterprise using the Autoprovision Roles for All Users process."

"The Autoprovision Roles for All Users process compares all current user assignments with all
current role mappings."

"The process creates requests immediately to add or remove roles. These requests are processed by
the Send Pending LDAP Requests process."

"You're recommended to run Autoprovision Roles for All Users after creating or editing role
mappings."
(Autoprovisioning, Securing HCM,
https://docs.oracle.com/en/cloud/saas/human-resources/ochus/autoprovisioning.html)

"Don't schedule to run regularly since this job evaluates all the role-mapping rules and
validates them for the entire user population, which is a costly operation."
(Best Practices for User and Role Provisioning in HCM, Securing HCM, row Autoprovision Roles for
All Users,
https://docs.oracle.com/en/cloud/saas/human-resources/ochus/best-practices-for-user-and-role-provisioning-in-hcm.html)

Two consequences. A role mapping edit does nothing to existing users until this process runs, or
until each user's assignment is next updated. And when it runs, it applies to everyone: a mapping
condition that is too wide grants the role to the whole population in one run, and a mapping
condition that is now narrower removes it.

### Send Pending LDAP Requests

"Sends to the LDAP directory the requests related to user account provisioning as well as the
requests for adding and removing user roles. You typically use this to process the provisioning
requests created by bulk processes as well as to process future dated requests that are now
active."

"Schedule at least once a day with Batch Size as A."
(Best Practices for User and Role Provisioning in HCM, row Send Pending LDAP Requests, URL above)

"You're recommended to run the Send Pending LDAP Requests process daily to send future-dated and
bulk requests to your LDAP directory server. Schedule the process in the Scheduled Processes work
area."
(same page, description of the topic Why You Should Run the Send Pending LDAP Requests Process)

The chain to remember: assignment change or mapping change, then autoprovisioning creates a
request, then Send Pending LDAP Requests applies it. A role that "should have been granted" is
checked at each link, in that order. A future-dated hire whose account never appears is the last
link not running.

### Update Person Search Keywords

"Several attributes of person, employment, and profile records are used as person-search
keywords. Keyword values are copied automatically from the originating records to the PER_KEYWORDS
table, where they're indexed to improve search performance."

"Although most changes to the PER_KEYWORDS table are automatic, you need to run the Update Person
Search Keywords process regularly because of these reasons:" followed by "The automatic process
doesn't apply future-dated changes to the PER_KEYWORDS table." and "The process ensures that all
changes are copied to the PER_KEYWORDS table, despite any temporary failures of the automatic
process."

"Schedule the process at least once a day during off peak hours to run with parameter After
Batch Load = Y to process any changed worker data (delta population) and keep keywords
up-to-date."

"If you're running 'Refresh Manager Hierarchy' daily, then set the 'Updated Within the Last N
Days' parameter value as 1 for incremental updates. This prevents the delta population size from
getting larger than 20,000, which would require the job to be run for the entire person
population."
(How You Update Person Search Keywords, Using Global Human Resources,
https://docs.oracle.com/en/cloud/saas/human-resources/fawhr/how-you-update-person-search-keywords.html)

A person who exists but cannot be found in person search, or is found with old values, is this
process. It is also the reason a future-dated change appears in search only after its date and a
run.

### HCM Alerts

Alerts Composer alerts are of two kinds: event alerts, which fire on a change to the object, and
resource alerts, which run on a schedule against a REST resource. The scheduling page could not be
fetched verbatim at the time of writing; the point to keep is that a resource alert that stops
arriving is a schedule question before it is a template question.

## Why schedules do not travel between instances

This is the fact behind the working rule "scheduled processes do not follow an environment copy".
Oracle documents what an environment refresh copies and what it does not.

"An environment refresh copies data from a source environment to a target environment, making a
copy of the source environment onto the target environment."

"The refresh is always performed from the most recent backup version of the source environment,
not the source environment itself. Therefore, some data might not match between the source and
target environments if there was activity on the source environment after the backup was taken."

"During an environment refresh, almost all data is copied."

Data copied: "All data in the Fusion Applications schema", described as "Transactional data and
functional setups".

Data not copied, as listed on the page: "ESS process parameters" ("Instance data"); "Home page
notifications" ("Approval requests"); "Data maintained in the Topology Manager" ("Endpoint URLs to
other environments"); "Environment-specific data" ("Long-running workflows, SOA transaction
tables, and system audit data"); "Single Sign-On (SSO) credentials"; "Security credentials and
OPSS data".
(Refreshing an Environment, Oracle Cloud Infrastructure documentation for Fusion Applications,
https://docs.oracle.com/en-us/iaas/Content/fusion-applications/refresh-environment.htm)

Three readings for daily work:

1. **Functional setups and transactional data transfer.** A configuration read in the test
   instance is worth something, subject to the lag between the backup and today.
2. **ESS instance data does not.** The schedules, the submissions, the run history and the
   parameters of the test instance say nothing about production. A process "never run" in the
   test instance is a fact about the test instance only.
3. **Endpoints and credentials do not.** Integrations, outbound feeds and notification delivery in
   the test instance are reset or pointed elsewhere by design. A feed that "does not arrive" in the
   test instance is not evidence about production.

## Quarterly updates and opt-in features

"Oracle Cloud Applications delivers new updates every quarter. This means every three months
you'll receive new functionality to help you efficiently and effectively manage your business. Some
features are delivered Enabled meaning they are immediately available to end users. Other features
are delivered Disabled meaning you have to take action to make available."

"Occasionally, features delivered Disabled via Opt In may be enabled automatically in a future
update. This is known as an Opt In Expiration."
(Optional Uptake of New Features (Opt In), text common to every What's New, this copy from
https://docs.oracle.com/en/cloud/saas/readiness/scm/26b/proc26b/26B-procurement-wn-t73649.htm)

"You need the Functional Setups User role to review new features introduced after each upgrade of
your cloud services. You need the Configure Oracle Fusion Applications Offering privilege to opt
in to new and available features."
(Review and opt-in to new features after update, Applications Common,
https://docs.oracle.com/en/cloud/saas/applications-common/faqac/review-and-opt-in-new-features.html)

Opt-in expiration is the mechanism by which a behaviour changes "on its own" at an update: a
feature the client never enabled becomes enabled. The What's New of the update lists them.

## How to read a "derived data is wrong" symptom with this map

| Symptom | Process to check first |
| ------- | ---------------------- |
| Wrong manager in approvals, team views or OTBI, right manager on the assignment | Refresh Manager Hierarchy |
| Position changed, assignments did not follow; manager skips a level | Synchronize Person Assignment from Position (and whether the parent position is vacant) |
| Role mapping edited, nobody got or lost the role | Autoprovision Roles for All Users, then Send Pending LDAP Requests |
| Future-dated hire has no account, role requests stuck as pending | Send Pending LDAP Requests |
| Person not found in search, or found with old values | Update Person Search Keywords |
| A scheduled alert stopped arriving | its schedule, before its template |

In every case, the check is in the instance where the symptom was observed. A test instance
history answers for the test instance only.
