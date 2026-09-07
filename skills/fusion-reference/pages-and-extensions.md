# Pages and extensions: Redwood, classic, and which tool governs what

Part of the `fusion-reference` skill. Knowledge only. Quotes are verbatim from the fetched Oracle
page, with title and URL. Sentences without a URL are the author's reading.

## Two page families, running side by side

Oracle Fusion Cloud HCM currently ships two user interfaces for many flows: the **classic**
pages (also called responsive, built on ADF, URL pattern `/hcmUI/faces/`) and the **Redwood**
pages (built with Visual Builder, URL pattern `/fscmUI/redwood/` or `/hcmUI/redwood/`). A client in
transition runs both, flow by flow, and the same flow can be Redwood for one action and classic
for another.

"Enrich the user experience with the new Enterprise HCM Information pages developed using the
Redwood toolset. The pages are built from the ground up using Visual Builder Studio (VBS) to give
you a unique experience of Oracle applications."
(Redwood Experience for Enterprise HCM Information, Human Resources 24C What's New,
https://docs.oracle.com/en/cloud/saas/readiness/hcm/24c/hure-24c/24C-hr-wn-f32600.htm)

### How a Redwood page is enabled

Each Redwood flow is switched on by one or more **profile options**, historically delivered
disabled, and since 2025 increasingly delivered enabled by default with the classic page going
out of support.

"To use the Redwood Enterprise HCM Information page, you must first enable the following profile
options. They're all disabled by default."
(same page as above)

"In order to work with the new Maintain Areas of Responsibility page, you must first enable the
ORA_HCM_VBCS_PWA_ENABLED profile option. In addition, check if the ORA_PER_AOR_REDWOOD_ENABLED
profile option is also enabled. By default, the profile option is delivered as disabled. If you
want to use the Redwood Maintain Areas of Responsibility page, you need to set the profile option
to Yes."
(Redwood Experience for Areas of Responsibility, Human Resources 24B What's New,
https://docs.oracle.com/en/cloud/saas/readiness/hcm/24b/hure-24b/24B-hr-wn-f32153.htm)

The pattern to remember: a global switch (`ORA_HCM_VBCS_PWA_ENABLED`) plus one
`ORA_<module>_<flow>_REDWOOD_ENABLED` per flow. The profile option code is what a ticket needs, and
the What's New page of the update that introduced the flow names it.

### The direction of travel: Redwood by default, classic unsupported

"Effective Update 26B, the Redwood Document Type Security Profiles page will be enabled by
default."

"The classic Document Type Security Profiles page will no longer be available by default.
However, you can still access the page by manually setting the relevant profile option to No."

"End of Support: The classic Document Type Security Profile page will no longer be supported for
any bug fixes, nor will they be enhanced."
(Change in Default Value of Profile Option for Redwood Document Type Security Profiles, Human
Resources 26B What's New,
https://docs.oracle.com/en/cloud/saas/readiness/hcm/26b/hure-26b/26B-hr-wn-f43349.htm)

"The responsive Areas of responsibility page will be deprecated in a future release."
(Redwood Experience for Areas of Responsibility, 24B, URL above)

Consequence for any question about "since when does this page behave like that": a quarterly
update can flip a flow to Redwood by changing a profile option default. The behaviour change is
then not a defect, it is a different page.

### Security is the same on both families, personalisations are not

"Access to the new Redwood pages for viewing and editing Enterprise HCM Information is controlled
using the same security privileges that control access to the corresponding classic pages."

"If you have personalized any of the existing ADF pages, you need to personalize them again in
Redwood."
(Redwood Experience for Enterprise HCM Information, 24C, URL above)

"If you have any prior Page Composer modifications, they'll need to be redefined in the HCM
Experience Design Studio's Business Rules."
(Redwood Experience for Areas of Responsibility, 24B, URL above)

So: a privilege carries across the two families; a page rule, a personalisation, a defaulting rule
does not, and has to exist once per family.

## The tools, and which page family each one governs

| Tool | Governs | Page family |
| ---- | ------- | ----------- |
| Transaction Design Studio (inside HCM Experience Design Studio) | show or hide fields and sections, make optional ones required, per action, per role, per country | classic (responsive) pages |
| Autocomplete Rules (inside HCM Experience Design Studio) | default and validate field values, by business object | classic pages; some validation rules also fire on Redwood |
| Visual Builder Studio, Express mode, Business Rules | show or hide regions and fields, default and validate values, per page | Redwood pages |
| Visual Builder Studio, application extension | add elements the delivered page does not have, for example a descriptive flexfield on one page for one country | Redwood pages |
| Page Composer | modify UI pages and components, sandbox-based | classic pages only |

### Transaction Design Studio

"HCM Experience Design Studio: The HCM Application extensibility tool to extend responsive pages,
which includes Transaction Design Studio and Autocomplete Rules."

"Transaction Design Studio: A feature of HCM Experience Design Studio used to control the display
of responsive pages."
(Overview of Redwood Application Extension, Extending Redwood Applications for HCM and SCM Using
Visual Builder Studio,
https://docs.oracle.com/en/cloud/saas/human-resources/fauvb/overview-of-redwood-application-extensions.html)

What a rule can and cannot do:

"Parameters vary according to the selected action. You can set all, some, or none of the
parameters. When evaluating the rule at runtime, the application ignores the criteria for
parameters that you haven't set."

"Role: User security roles assigned for performing the action or viewing the page. This LOV shows
all delivered and custom security roles."

"Country: Used when the legal employer doesn't fully support the requirement to create rules by
country."

"You can't add new attributes to a page, but you can hide fields not delivered as required, make
delivered optional fields as required, and enable descriptive flexfields segments."

"This section is shown even for actions that don't use the guided process design but have
different sections of information. You can rename a section, hide sections that aren't delivered as
required, and make optional sections required."
(How You Configure Rules in the Transaction Design Studio, Using Common Features for HCM,
https://docs.oracle.com/en/cloud/saas/human-resources/faucf/how-you-configure-rules-in-the-transaction-design-studio.html)

Two readings that matter in practice. A rule with no role and no country set applies to everyone,
which is how a rule written for one team hides a field from all of them. And a rule can only work
with what the action delivers: it cannot add an attribute, and it cannot make a delivered
required field optional.

### Visual Builder Studio on Redwood

"Express mode is the only mode supported by HCM, SCM, and Procurement."

"Business Rules: A feature of VB Studio used to control the display of regions and fields on a
page. It's the Redwood equivalent of Transaction Design Studio for responsive pages."

"Extension Rule: A rule created within your extension. It corresponds to custom rules in
Transaction Design Studio."

"Application Extension: These changes are made using VB Studio. For example, you want to show a
new descriptive flexfield on a specific page only for a specific country."

"The types of modifications you can make to a Redwood page in VB Studio depends on the page you're
modifying. The changes listed in this guide may not be universally available for all Redwood
pages."
(Overview of Redwood Application Extension, URL above)

"If you can't see business rules for your page, it means it isn't supported for the page as yet."
(Why can't I see business rules for my page?, same guide,
https://docs.oracle.com/en/cloud/saas/human-resources/fauvb/why-can-t-i-see-business-rules-for-my-page.html)

"Business Rules: A feature of VB Studio Express Mode used to personalize Redwood pages including
defaulting and validating field values (new in 24B). Business Rules is page-based."
(Default and Validate Field Values in HCM Redwood Applications, HCM Common 25B What's New,
https://docs.oracle.com/en/cloud/saas/readiness/hcm/25b/hcom-25b/25B-hcm-common-wn-f37446.htm)

The distinction that decides where a rule goes: Transaction Design Studio and Autocomplete Rules
are keyed on the **action or the business object**; Visual Builder Business Rules are keyed on the
**page**. A Redwood page that does not yet expose Business Rules cannot be personalised that way,
and the answer is a wait for a later update, not a workaround.

### Autocomplete Rules

"Autocomplete Rules: A feature of HCM Experience Design Studio used to default and validate field
values in responsive pages. Autocomplete Rules is based on business object."

"The existing validation rules with error from Autocompletes Rules will work in HCM Redwood pages
for Change Assignment and Correct Employment Details processes. This won't require modifying
existing rules."
(Overview of Redwood Application Extension, URL above)

"Keep the benefits of Autocomplete Rules from HCM Experience Design Studio in your Redwood user
experience. Without any changes, your existing validation rules with error (Object Validation rule
type) can trigger now in your Redwood pages."

"If your rules are supported in Business Rules in Express mode and don't validate data from the
backend like HDL, we encourage you to start moving your rules in Business Rules."
(Autocomplete Rules from HCM Experience Design Studio in Redwood Pages, HCM Common 25A What's New,
https://docs.oracle.com/en/cloud/saas/readiness/hcm/25a/hcom-25a/25A-hcm-common-wn-f36561.htm)

So an Autocomplete validation rule can fire on a Redwood page even though nothing in Visual
Builder mentions it. When a Redwood page rejects a value and no Business Rule explains it, the
Autocomplete Rules list is the next place to read.

### Page Composer

"Page Composer is a web-based tool you can use to modify user interface (UI) pages and components
for all products designated for use with Page Composer."
(What's the difference between Page Composer and Application Composer?, Configuring Applications
Using Application Composer,
https://docs.oracle.com/en/cloud/saas/applications-common/oacex/what-s-the-difference-between-page-composer-and-application.html)

Page Composer personalisations live in a sandbox and apply to classic pages. They do not follow a
flow to Redwood (see the 24B sentence above). A client with years of Page Composer changes carries
an inventory to rebuild, flow by flow, as each one moves.

## How to read a page problem with this map

1. Which family is the page? URL pattern, visual style, or the profile option of the flow.
2. Is the element missing, or present and misbehaving? Missing points to security first (same
   privileges on both families), then to a rule of the matching tool.
3. Which tool could have touched it on this family? Transaction Design Studio or Page Composer on
   classic; Business Rules or an extension on Redwood; Autocomplete Rules on both for validation.
4. Did a quarterly update flip the family? The What's New of the last two updates names every
   profile option whose default changed.
