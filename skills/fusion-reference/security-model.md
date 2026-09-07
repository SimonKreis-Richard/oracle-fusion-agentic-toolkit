# The security model: how access is composed

Part of the `fusion-reference` skill. Knowledge only. Quotes are verbatim from the fetched Oracle
page, with title and URL. Sentences without a URL are the author's reading.

## The one tell that matters most

**A missing privilege removes the action from the page. It does not refuse it.** A button that is
not there, a menu entry that is absent, values missing from a list: security first. An error
message means the code ran, so the privilege was there, and the cause is configuration, data or a
defect. And the corollary: a test performed under an administrator role makes a security gap
disappear, and makes a broken thing look fixed.

Redwood and classic pages share the same privileges (see `pages-and-extensions.md`). What differs
between the families is the page rules, never the security.

## Roles: the five types

"HCM Cloud defines five types of roles, namely data roles, abstract roles, job roles, aggregate
privileges, and duty roles."

"Job roles represent the job that you hire a worker to perform. Human Resource Analyst and Payroll
Manager are examples of predefined job roles."

"Abstract roles represent a worker's role in the enterprise independently of the job that you hire
the worker to do."

"Data roles combine a worker's job and the data that users with the job must access. For example,
the HCM data role Country Human Resource Specialist combines a job (human resource specialist)
with a data scope (country). You define the data scope of a data role in one or more HCM security
profiles."

"Aggregate privileges combine the functional privilege for an individual task or duty with the
relevant data security policies."

"Each predefined duty role represents a logical grouping of privileges that you might want to copy
and edit."
(Which are the role types in HCM Cloud?, Securing HCM Questions and Answers,
https://docs.oracle.com/en/cloud/saas/human-resources/faqas/which-are-the-role-types-in-hcm-cloud.html)

"In Oracle Fusion Applications, users have roles through which they gain access to functions and
data. Users can have any number of roles."
(Role-Based Security, Securing HCM,
https://docs.oracle.com/en/cloud/saas/human-resources/ochus/role-based-security.html)

How they nest, from the user down: a user holds **job roles** (what they were hired to do) and
**abstract roles** (Employee, Line Manager, what everyone in that situation holds). Each inherits
**duty roles** and **aggregate privileges**, which carry the **function security privileges**
(may this user open this task, run this action) and the **data security policies** (on which
records). A **data role** is a job role plus a data scope, the scope being one or more **HCM
security profiles**.

Reading a role in the Security Console: the role hierarchy tab shows what it inherits; the
privileges tab shows the function privileges it ends up with; the data security policies tab shows
on which objects and under which condition. A privilege that the user "should have" is found by
walking down from the role they actually hold, not from the role the request names.

## Function security versus data security

Function security decides which tasks, pages and actions exist for the user. Data security decides
which records those actions apply to.

"By default, users are denied access to all data."

"A data security policy is a grant of a set of privileges to a principal on an object or attribute
group for a given condition."

"When you provision a data role to a user, the data role limits the data access of the inherited
job role to a dimension of data."

"HCM security profiles are used to secure HCM data, such as people and departments."

HCM security profile, as defined in the same guide: "Defines data security conditions on instances
of object types such as person records, positions, and document types without requiring users to
enter SQL code"
(Data Security, Securing Applications 25D,
https://docs.oracle.com/en/cloud/saas/applications-common/25d/facsa/data-security.html)

### HCM security profiles, by object

| Profile type | Secures | Typical criteria |
| ------------ | ------- | ---------------- |
| Person | which person records the role sees | by area of responsibility, by manager hierarchy, by legal employer, department, or a custom criterion |
| Organization | which departments, legal employers, business units | by classification, by hierarchy, by list |
| Position | which positions | by hierarchy, by department, by list |
| Legislative data group | which LDGs, hence which payroll data | by list |
| Payroll, payroll flow | which payrolls and flows | by list |
| Document type | which document record types the role can see and act on | by list, with an include or exclude mode |
| Transaction | which transactions in the Transaction Console | by type |

The one that produces the most "I cannot see it" tickets outside person records is the **document
type security profile**: a document type absent from the profile of a role is simply not there for
that role, on any page. Since update 26B the Redwood page for these profiles is the default (see
`pages-and-extensions.md`).

The person profile has two very different mechanisms: by **manager hierarchy** (depends on the
denormalized hierarchy, see `scheduled-processes.md`) and by **area of responsibility**.

## Areas of responsibility

"Areas of responsibility are responsibilities that a worker has as part of his or her job. Such
responsibilities have a defined scope, such as a country or department."

"Areas of responsibility are a recommended way of securing access to person records."
(Guidelines for Loading Areas of Responsibility, HCM Data Loading Business Objects,
https://docs.oracle.com/en/cloud/saas/human-resources/fahbo/guidelines-for-loading-areas-of-responsibility.html)

"Assigning an area of responsibility doesn't affect the person records the representative can see.
Access to records is controlled through security. Your security administrator can set up security
profiles using areas of responsibility."
(How You Assign Areas of Responsibility, Using Global Human Resources,
https://docs.oracle.com/en/cloud/saas/human-resources/fawhr/how-you-assign-areas-of-responsibility.html)

The sentence to keep: an area of responsibility by itself grants nothing. It is a fact about the
worker that a security profile may reference. An HR partner with the right area and no access has a
profile that does not use it, or a role that does not use that profile.

## Role provisioning: how a user gets a role

### Role mappings

"To provision a role to users, you define a relationship, called a role mapping, between the role
and some conditions."

"Role provisioning occurs automatically if:" "At least one of the user's assignments matches all
role-mapping conditions." and "You select the Autoprovision option for the role in the role
mapping."

Example conditions given on the page: "Department | Finance Department", "Job | Sales Manager",
"HR Assignment Status | Active".

"Users such as line managers can provision roles manually to other users if:" "You select the
Requestable option for the role in the role mapping."

"Users can request a role when managing their own accounts if:" "You select the Self-requestable
option for the role in the role mapping." "Self-requested roles are defined as manually
provisioned."
(Role Mappings, Securing Applications 25D,
https://docs.oracle.com/en/cloud/saas/applications-common/25d/facsa/role-mappings.html)

"Users acquire a role automatically when at least one of their assignments satisfies the
conditions in the relevant role mapping. Provisioning occurs when you create or update worker
assignments."

"Users lose automatically provisioned roles when they no longer satisfy the role-mapping
conditions."

"The Send Pending LDAP Requests process identifies future-dated transactions and manages role
provisioning and deprovisioning at the appropriate time."
(Role Provisioning and Deprovisioning, Securing HCM,
https://docs.oracle.com/en/cloud/saas/human-resources/ochus/role-provisioning-and-deprovisioning.html)

Four readings that decide most provisioning tickets:

1. **All conditions of one mapping are ANDed; several mappings for one role are ORed.** A mapping
   with no condition matches every assignment.
2. **`HR Assignment Status` is the condition that keeps a role from surviving a termination.** A
   mapping without it grants the role to inactive assignments too, and keeps it after they end.
3. **A role granted by mapping is removed by the mapping** when the assignment stops matching. A
   role granted by hand is not. A user "losing a role for no reason" matched a mapping that they
   no longer match; a user "keeping a role they should have lost" had it by hand, or matches another
   mapping.
4. **Provisioning happens on assignment create or update, or when the enterprise-wide process
   runs.** A mapping edited today changes nothing for existing users until one of those two events.

### Autoprovision Roles for All Users

"The Autoprovision Roles for All Users process compares all current user assignments with all
current role mappings."

"Autoprovisioning applies only to roles that have the Autoprovision option enabled in a role
mapping."

"You're recommended to run Autoprovision Roles for All Users after creating or editing role
mappings."

"Avoid running the process more than once in any day. Otherwise, the number of role requests that
the process generates may slow the provisioning process. Only one instance of the process can run
at a time."
(Autoprovisioning, Securing HCM,
https://docs.oracle.com/en/cloud/saas/human-resources/ochus/autoprovisioning.html)

### The LDAP processes

"There are four processes for user and role provisioning. You should run only one of these
processes at a time. These processes should never overlap."

Send Pending LDAP Requests: "Sends to the LDAP directory the requests related to user account
provisioning as well as the requests for adding and removing user roles. You typically use this to
process the provisioning requests created by bulk processes as well as to process future dated
requests that are now active."

Retrieve Latest LDAP Changes: "Updates the Oracle HCM Cloud person records with data coming from
the LDAP directory." And on scheduling it: "Don't schedule to run regularly since it is
unnecessary processing and does not serve any functional purpose."
(Best Practices for User and Role Provisioning in HCM, Securing HCM,
https://docs.oracle.com/en/cloud/saas/human-resources/ochus/best-practices-for-user-and-role-provisioning-in-hcm.html)

"You run Retrieve Latest LDAP Changes if you believe data-integrity or synchronization issues may
have occurred between Oracle Cloud Applications and your LDAP directory server. For example, you
may notice differences between roles on the Security Console and roles on the Create Role Mapping
page. You're also recommended to run this process after any release update."
(Retrieve Latest LDAP Changes, Securing HCM,
https://docs.oracle.com/en/cloud/saas/human-resources/ochus/retrieve-latest-ldap-changes.html)

The full chain, in order: the assignment or the mapping changes, autoprovisioning evaluates and
creates a request, Send Pending LDAP Requests applies it. Schedules and history of these processes
are instance data and do not follow an environment refresh (see `scheduled-processes.md`).

## Custom roles: copy, never edit

"Copying predefined roles and editing the copies is the recommended approach to creating roles."

"Aggregate privileges are never copied. When you copy a job or abstract role, its inherited
aggregate privileges are referred to from your copy."

"By default, a copied role has the same name as its source role with the suffix Custom. The role
codes of copied roles have the suffix _CUSTOM."

"The new role isn't assigned automatically to users who have the original role."
(Guidelines for Copying HCM Roles, Securing HCM,
https://docs.oracle.com/en/cloud/saas/human-resources/ochus/guidelines-for-copying-hcm-roles.html)

Two consequences. A quarterly update can change a predefined role, and that change does not reach
the copies: a client on copies reads the security section of every What's New. And a copy made
with the "copy top role" option still references the delivered aggregate privileges, so a change
Oracle makes to an aggregate privilege does reach the copy.

## How to read an access problem with this map

| Symptom | First place to read |
| ------- | ------------------- |
| Action absent from the page, no error | the role's function privileges, then a page rule of the matching family |
| Records missing, action present | the security profile referenced by the role's data role or data security policy |
| One document type invisible | the document type security profile of the role |
| A role appeared or disappeared "on its own" | the role mappings the assignment matches, with `HR Assignment Status` in mind, then the provisioning process history |
| A new mapping changed nothing | whether the provisioning process has run since, and whether Autoprovision is checked |
| Security Console and role mapping page disagree | Retrieve Latest LDAP Changes, then Send Pending LDAP Requests |
| An HR partner with the right area of responsibility sees nothing | the person security profile, and whether it uses that area |
| Works for the tester, fails for the user | the tester's role, almost always broader than the user's |
