# How great SaaS products handle admin onboarding: research for the DIGIT complaint-management console

**Prepared:** 14 October 2026
**Scope:** Admin and B2B setup flows, with government design patterns as the anchor. It covers 18 products and design systems, and the WCAG 2.2 criteria that apply.
**Method:** Desk research using vendor help centres, developer documentation, design-system guidance, W3C Understanding documents and published research. Every factual claim links to its source. Where a figure exists only in a vendor's own marketing data, the report says so.

**How to read the evidence**
- *Primary* means the vendor's own documentation, design-system guidance or the W3C.
- *Secondary* means third-party teardowns or blogs. These are flagged, and we have not relied on them for anything important.
- Statements about our console's prototype come from the code in `unified-onboarding-experience/src` as it stands today.
- Recommendations are our design proposals, not sourced facts. Each one links to the evidence behind it.

---

## 1. Executive summary: key takeaways

1. **For admin setup, the checklist ("task list") is the backbone, not the tour.**
   - Okta, Shopify, HubSpot, Zendesk, Intercom and GOV.UK all put setup in a persistent, revisitable list of tasks with a status for each ([Okta](https://help.okta.com/oie/en-us/content/topics/security/admin-get-started.htm), [Shopify setup guide](https://shopify.dev/docs/api/app-home/patterns/compositions/setup-guide), [HubSpot home](https://knowledge.hubspot.com/help-and-resources/use-your-home-page), [Zendesk trial tasks](https://support.zendesk.com/hc/en-us/articles/4408828624538-Introducing-Zendesk-trial-tasks), [GOV.UK complete multiple tasks](https://design-system.service.gov.uk/patterns/complete-multiple-tasks/)).
   - Tours are a short, optional orientation layer on top.
2. **Keep tours to three or four steps, and let people start them.**
   - Data from Chameleon, a vendor that sells tours, shows completion falls sharply beyond four or five steps.
   - The same data shows tours that users launch themselves complete at almost double the average rate ([Chameleon 2023](https://www.chameleon.io/benchmark-report-2023), [Chameleon blog](https://www.chameleon.io/blog/chameleon-benchmark-report)).
   - NN/g finds that up-front tutorials are commonly skipped and quickly forgotten ([NN/g](https://www.nngroup.com/articles/onboarding-tutorials/)).
   - Our 3-step tour is the right size. It should stay optional.
3. **Statuses should be words, not just ticks, and should include "Cannot start yet".**
   - GOV.UK found that a labelled status in its own column was easier to read than a tick ([GDS 2017](https://designnotes.blog.gov.uk/2017/04/04/weve-published-the-task-list-pattern)).
   - The pattern now defines Completed, Incomplete, In progress and Cannot start yet ([GOV.UK](https://design-system.service.gov.uk/patterns/complete-multiple-tasks/)).
4. **Let people work in any order, and block only where the data truly depends on another step.**
   - GOV.UK: "Where possible, allow users to complete tasks in any order" ([GOV.UK](https://design-system.service.gov.uk/patterns/complete-multiple-tasks/)).
   - NN/g warns that step-by-step staged flows break down "when the steps are interdependent and users must alternate between them" ([NN/g progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/)).
   - Departments and Employees is exactly this case. It needs inline creation, not a locked sequence.
5. **Separate "what's needed now" from "what's needed before going live".**
   - Stripe lets you test straight away in a sandbox. It asks for verification only before live payments, and tracks requirements as `currently_due`, `eventually_due`, `past_due` and `pending_verification` ([Stripe activation](https://docs.stripe.com/payments/account/activate), [Stripe requirements](https://docs.stripe.com/connect/handling-api-verification)).
   - This model fits our Integration step, where credentials are often missing.
6. **Test credentials should be a first-class path for messaging integrations.**
   - Twilio offers test credentials and "magic" numbers that do not charge or send ([Twilio](https://www.twilio.com/docs/iam/test-credentials)).
   - SendGrid offers single-sender verification "for testing only", and domain authentication before production ([SendGrid](https://www.twilio.com/docs/sendgrid/for-developers/sending-email/sender-identity)).
7. **Bulk import is a core flow, not an extra.** The best imports share the same features:
   - a downloadable template generated from the required fields (HubSpot, Gusto)
   - automatic column matching that the admin can override (Gusto, Airtable)
   - errors fixed inside the tool (HubSpot)
   - a downloadable error file (HubSpot)
   - clear warnings about what cannot be undone (Shopify)
   - Sources: [HubSpot example file](https://knowledge.hubspot.com/import-and-export/download-example-import-file), [HubSpot errors](https://knowledge.hubspot.com/import-and-export/troubleshoot-import-errors), [Gusto](https://support.gusto.com/article/210728164125837/Add-employees), [Airtable](https://support.airtable.com/csv-import-extension), [Shopify](https://help.shopify.com/en/manual/products/import-export/import-products).
8. **Delegation is built into the flow, not added on.**
   - Gusto: when you add someone, you can invite them to enter their own details, which reduces data-entry errors ([Gusto](https://support.gusto.com/article/210728164125837/Hire-new-employees)).
   - HubSpot checklists: assign each task to a person, with a due date ([HubSpot](https://knowledge.hubspot.com/help-and-resources/manage-onboarding-to-do-lists-with-checklists)).
   - Okta's five-task guide includes "add another admin" ([Okta](https://help.okta.com/oie/en-us/content/topics/security/admin-get-started.htm)).
9. **Save and resume must be real (stored on the server), and it must be announced.**
   - GOV.UK One Login places "Save and complete later" under the primary action, warns before sign-out and emails a link to resume ([GOV.UK One Login](https://sign-in.service.gov.uk/documentation/design-recommendations/save-progress)).
   - NN/g: "Allow users to exit the wizard midway and save state" ([NN/g wizards](https://www.nngroup.com/articles/wizards/)).
   - Our prototype currently keeps progress only in memory.
10. **Confirmation is for consequences, not for everything.**
    - NN/g advises keeping confirmation dialogs for serious actions, labelling buttons with the outcome, preferring undo, and reserving "type to confirm" for the rarest, most dangerous actions ([NN/g](https://www.nngroup.com/articles/confirmation-dialog/), [GitHub](https://docs.github.com/en/repositories/creating-and-managing-repositories/deleting-a-repository)).
    - WCAG 3.3.4 requires that data submissions be reversible, checked or confirmed ([W3C](https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html)).
11. **For government users, a calm, plain-English tone works better than gamification.**
    - GOV.UK mandates plain English, the active voice and "you", and discourages "please" ([GOV.UK style](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/style-guides/a-to-z-style-guide/)).
    - A GDS research participant said a task list can feel like "being judged rather than helped" ([GDS](https://designnotes.blog.gov.uk/2017/04/04/weve-published-the-task-list-pattern)).
    - Streak mechanics, which Duolingo uses, can backfire when a streak breaks ([The Decision Lab](https://thedecisionlab.com/fr-CA/insights/consumer-insights/streak-creep-the-perils-of-too-much-gamification)).
12. **Accessibility shapes the onboarding layer itself:**
    - consistent location of help (3.2.6)
    - dismissible, hoverable and persistent pop-ups (1.4.13)
    - focus never fully hidden by floating panels (2.4.11)
    - no re-entry of data (3.3.7)
    - status messages announced (4.1.3)
    - adjustable time-outs (2.2.1)
    - paste-friendly credential fields (3.3.8)
    - Sources: the W3C Understanding documents for each criterion, listed in section 7.

---

## 2. Product-by-product notes

### 2.1 Stripe: account activation, sandboxes, verification requirements
- **Use it first, verify later.**
  - "You can begin using your Stripe account in testing environments as soon as you create it."
  - Verification of the business is needed only "to use a service in live mode" ([Stripe: set up your account](https://docs.stripe.com/payments/account/activate)).
  - New accounts are placed in a sandbox with test API keys on the Dashboard home page ([Stripe testing](https://docs.stripe.com/test-mode)).
- **Sandboxes are isolated and can be shared safely.**
  - You can "invite another user, such as an implementation partner or design agency… without providing them access to your live mode data" ([Stripe sandboxes](https://docs.stripe.com/sandboxes)).
- **It is honest about where test and live overlap.**
  - Stripe warns that settings changed in the older test-mode sandbox "might also change them in live mode".
  - Many pages show a notification box and disable live-only settings while you are in test mode ([Stripe testing](https://docs.stripe.com/test-mode)).
- **Requirements are a model, not just a list.** Stripe Connect exposes:
  - `currently_due` (needed by a deadline)
  - `eventually_due` (needed only if certain thresholds are reached)
  - `past_due` (capabilities already disabled)
  - `pending_verification` (under review, "no action required")
  - `errors`, each with a plain-language `reason`
  - It also says that "you don't need to resubmit previously verified details" ([Stripe requirements](https://docs.stripe.com/connect/handling-api-verification)).
- **Verification takes time, and Stripe says so.** It "can take anywhere from a few minutes to a few business days to verify an image" ([Stripe requirements](https://docs.stripe.com/connect/handling-api-verification)).
- **A separate, browser-remembered account checklist covers security and readiness:**
  - two-factor authentication
  - public details
  - email and SMS alerts
  - bank details
  - team access
  - Source: [Stripe account checklist](https://docs.stripe.com/get-started/account/checklist).

**Lesson for us:** Treat the Integration step as "test now, go live later". Show a requirements model with plain-language reasons. Never ask again for data that has already been verified.

### 2.2 GOV.UK Design System: task list, complete multiple tasks, check answers
- **When to use it.** Use the pattern "only… for longer transactions" that users may complete across several sessions. Show it at the start of each session ([GOV.UK](https://design-system.service.gov.uk/patterns/complete-multiple-tasks/)).
- **Statuses:**
  - Completed (black text, no background)
  - Incomplete
  - optionally, Not yet started and In progress
  - Cannot start yet (grey, row not linked) "because another task must be completed first"
  - There is a problem (only for unavoidable errors)
  - "Begin with the fewest statuses that work" ([GOV.UK](https://design-system.service.gov.uk/patterns/complete-multiple-tasks/)).
- **Self-declared completion.** For tasks with optional questions, or work that needs review, ask "Have you completed this section?" at the end. "Always allow users to go back into a task to change their answer" ([GOV.UK](https://design-system.service.gov.uk/patterns/complete-multiple-tasks/)).
- **Research:**
  - Users tried to click status tags, thinking they were buttons. In response, tags were restyled and the whole row became the link ([GOV.UK task list component](https://design-system.service.gov.uk/components/task-list/), [GDS 2023](https://designnotes.blog.gov.uk/2023/12/15/working-as-a-community-to-iterate-the-task-list-pattern/)).
  - Early research involved 34 users over five rounds. Without groups, "users were unsure what order to do tasks in", and numbered groups "made the page faster for users to scan" ([GDS 2017](https://designnotes.blog.gov.uk/2017/04/04/weve-published-the-task-list-pattern)).
- **Hint text** should be "a single short sentence", used only where there is evidence it is needed ([GOV.UK task list](https://design-system.service.gov.uk/components/task-list/)).
- **Check answers** gives users "a second chance to notice and correct errors before submitting data". Each section has a Change link, and Continue returns users to the summary ([GOV.UK check answers](https://design-system.service.gov.uk/patterns/check-answers/)).
- **Save and return:**
  - "Save and complete later" sits under the primary action on every page.
  - A warning appears if a user signs out without saving.
  - A confirmation email gives a link to resume ([GOV.UK One Login](https://sign-in.service.gov.uk/documentation/design-recommendations/save-progress)).

**Lesson for us:** This is the most directly transferable pattern for a government administrator audience.

### 2.3 Okta: admin "Get started" guide
- **Five tasks:**
  - import users from a directory
  - set up SSO for a first app
  - add another admin
  - choose authenticators
  - create a sign-on policy
- **Behaviour:**
  - "A check mark appears next to each task that you complete."
  - "When all five are complete, the get started option no longer appears on the main menu bar."
  - The guide is highlighted at first sign-in and can be reopened from Dashboard > Getting Started ([Okta](https://help.okta.com/oie/en-us/content/topics/security/admin-get-started.htm)).

**Lesson for us:** Keep the list short and admin-specific. Include delegation ("add another admin") as a task. Retire the guide once everything is done.

### 2.4 Shopify: setup guide and CSV import
- **Setup guide pattern (Shopify's guidance for app developers):**
  - an interactive checklist with progress tracking, on the home page
  - the whole guide collapses, and each step expands
  - each step has a heading, description and action button
  - a dismiss button, with the instruction to "use local storage or a database entry to avoid showing this section again to the same user"
  - Sources: [Shopify setup guide](https://shopify.dev/docs/api/app-home/patterns/compositions/setup-guide), [search summary of homepage template](https://shopify.dev/docs/api/app-home/v2.0-rc/patterns/templates/homepage).
- **Product import:**
  - a sample CSV
  - case-sensitive headers
  - an explicit "Overwrite products with matching handles" option
  - a 15 MB limit
  - a confirmation email
- **Import warnings:**
  - "Product imports started with a CSV file can't be canceled once they begin."
  - Shopify advises exporting a backup first ([Shopify import](https://help.shopify.com/en/manual/products/import-export/import-products)).
- **Customer import:** with overwrite on, records are matched on email address. Duplicate emails within the file keep only the last record ([Shopify customers](https://help.shopify.com/manual/customers/import-export-customers)).

**Lesson for us:** Make overwrite or merge behaviour explicit before import. Advise a backup export. Say plainly when an action cannot be cancelled.

### 2.5 HubSpot: admin setup overview, onboarding plan, checklists, imports
- **Admin setup overview.** HubSpot's admin guide lists, in order:
  1. create the account
  2. secure it
  3. invite the team
  4. account defaults (including branding)
  5. connect apps
  6. AI settings
  7. subscription
  8. help
  - Source: [HubSpot](https://knowledge.hubspot.com/get-started/set-up-your-account).
- **Onboarding plan on Home:**
  - progress appears top right
  - each task can be marked complete or "skip for now"
  - skipped tasks move into the completed list ([HubSpot home](https://knowledge.hubspot.com/help-and-resources/use-your-home-page))
  - This is a weakness: progress then overstates what is actually done.
- **Checklists:**
  - "track steps, assign ownership, and monitor progress"
  - each task has an assignee and a due date
  - templates can be shared across accounts ([HubSpot checklists](https://knowledge.hubspot.com/help-and-resources/manage-onboarding-to-do-lists-with-checklists))
- **Import:**
  - "Download example file" generates a template containing only the required properties, with mapping-ready headers and instruction rows ([HubSpot example file](https://knowledge.hubspot.com/import-and-export/download-example-import-file)).
  - Errors appear during mapping and can be fixed "from within the import tool rather than needing to edit and re-upload your file".
  - A downloadable error file is available.
  - Errors are split into row-level ("all columns in the affected row could not be imported") and value-level ([HubSpot import errors](https://knowledge.hubspot.com/import-and-export/troubleshoot-import-errors)).

**Lesson for us:** Generate the template from our own data model. Distinguish row-level from value-level errors. Never count "skipped" as "done".

### 2.6 Gusto: payroll and HR setup, which has interdependent, compliance-heavy data
- **Self-onboarding.** When adding a person you choose whether they "securely enter their own personal information". Gusto recommends it: "Self-onboarding reduces data-entry errors and saves you setup time." You can choose Skip and enter the details yourself, or cancel self-onboarding later ([Gusto](https://support.gusto.com/article/210728164125837/Hire-new-employees)).
- **Bulk add:**
  - a downloadable CSV template, with required fields marked by an asterisk
  - automatic column matching, with remapping or "Unmatched"
  - a review table where missing required fields are filled in before finishing ([Gusto add employees](https://support.gusto.com/article/210728164125837/Add-employees))
- **Onboarding checklists.** Some tasks (for example the I-9 form) "cannot be deleted because they're required by law" ([Gusto checklists](https://support.gusto.com/article/210728175340400/View-and-complete-onboarding-checklists)).

**Lesson for us:** Mixed responsibility (the admin starts a record, the employee finishes it) cuts admin effort and errors. Mark statutory items as non-removable.

### 2.7 Zendesk: helpdesk setup, the closest analogue to complaint management
- **Questionnaire.** The trial asks questions that tailor the tasks. Business type (B2B, B2C or B2E) decides the sample data. Skipping the questionnaire gives B2C sample data ([Zendesk trial tasks](https://support.zendesk.com/hc/en-us/articles/4408828624538-Introducing-Zendesk-trial-tasks)).
- **Sample data:**
  - "sample data with interactive tours"
  - a "Sample ticket: Meet the ticket" to explore
  - the choice to keep or delete sample data on purchase
- **Progress and setup.** "The wizard tracks your progress as you complete each task." After purchase, setup tasks live in a help panel opened from the "?" icon. Zendesk estimates under 10 minutes per task in its set-up-and-go-live guide ([Zendesk](https://support.zendesk.com/hc/en-us/articles/4408828624538-Introducing-Zendesk-trial-tasks); the per-task estimate is reported via search summary of Zendesk's guide).

**Lesson for us:** A sample complaint flowing through a sample department is the most persuasive way to show why each setup step matters. Let admins delete it in one action.

### 2.8 Freshdesk: tiered setup
- **Three tiers:**
  - "Minimal setup—start like a small team": support email, agents, groups, basic automation
  - "Intermediate setup—make Freshdesk your own": hours, SLAs, import, forms, channels, branding
  - "Advanced": marketplace, AI, knowledge base and so on
- **Guidance and tone:** "Set up features as you need them." On advanced setup: "We won't say that your advanced setup is complete" ([Freshdesk](https://support.freshdesk.com/support/solutions/articles/195383-get-started-as-an-admin-in-freshdesk)).
- **Before starting:** the newer Omni quick start lists what admins should have first: admin access, support email credentials and a list of team members ([Freshdesk Omni](https://support.freshdesk.com/support/solutions/articles/50000011785-getting-started-with-freshdesk-omni)).

**Lesson for us:** Define a "minimum to receive complaints" tier, separate from "complete". Tell admins up front what to gather.

### 2.9 Intercom: checklists in the Messenger
- **Step completion.** A step can be completed manually or automatically, by rules that detect "when a customer has completed a step using data that you're tracking".
- **Step actions:** open a URL, launch a product tour, open a help article, or none.
- **Time estimates.** Each step can show an estimated completion time in minutes.
- **Celebration.** An optional "celebration message" appears once all steps are done.
- **Placement and limits.** Checklists live in a Tasks space, with a badge counter. Up to 25 steps are allowed ([Intercom](https://www.intercom.com/help/en/articles/6661022-getting-started-with-checklists)).

**Lesson for us:** Complete steps automatically from real data rather than "Mark as Done". Show a time estimate per step. Link each step to a tour, an article and the page.

### 2.10 Slack: invitations and approval
- **Invitation approval.** Admins can require approval for invitations. The requester "will be notified" when a request is approved or denied ([Slack](https://slack.com/help/articles/115004854783-Manage-who-can-send-workspace-invitations)).
- **Approved domains.** Requests for people with approved email domains are approved automatically ([Slack](https://slack.com/intl/en-gb/help/articles/115004856503-Manage-how-people-join-your-workspace)).

**Lesson for us:** If several officials share setup, a request-and-approve loop with notifications avoids silent waits. An approved domain (for example the department's `gov.in` domain) can speed up invitations.

### 2.11 Asana: segmentation, invitations, admin-defined onboarding
- **Inviting.** You can invite by email or link and set a permission level (admin, editor, commenter or viewer) ([Asana](https://help.asana.com/s/article/how-to-invite-team-members-to-asana)).
- **Custom flows.** Admins can configure onboarding flows tied to team membership ([Asana custom onboarding](https://help.asana.com/s/article/custom-onboarding); details via search summary, as the page body did not load).
- **Signup questions.** A third-party teardown reports that signup asks about role, team function and goals (secondary: [Tenet](https://www.wearetenet.com/inspirations/saas-design-inspiration/saas-onboarding-design-examples/asana-onboarding)).

### 2.12 Airtable: spreadsheet import and mapping
- **Mapping:**
  - matching column names are auto-matched, and the rest are mapped by hand
  - unmapped columns can be skipped or created as new fields
  - "The extension will remember your field mappings the next time"
- **Merging.** Merge mode updates existing records using a unique "match field" ([Airtable CSV import](https://support.airtable.com/csv-import-extension)).
- **A cautionary report.** A community user said remembered mappings went wrong on a second file and could not be reset ([Airtable community](https://community.airtable.com/other-questions-13/csv-import-block-fixing-field-mappings-17745)).

**Lesson for us:** Remember mappings, but always offer "reset mapping". Use a stable code (for example a boundary code) as the match key for updates.

### 2.13 Notion: templates chosen from onboarding answers
- New users see starter templates in the sidebar, "selected for you based on what you tell us during onboarding". They can delete them ([Notion](https://www.notion.com/help/start-with-a-template)).

**Lesson for us:** Starter content should depend on a segmentation answer and be easy to remove.

### 2.14 Linear: minimal, do-the-real-thing onboarding
- **Official resources** ([Linear start guide](https://linear.app/docs/start-guide)):
  - a demo workspace that "resets on refresh" and excludes settings
  - live onboarding sessions
  - a video library
- **Third-party teardowns** describe a short signup that skips tours and introduces the command menu early. Teammate invitations and integrations can be skipped (secondary: [Supademo](https://supademo.com/content/plg-onboarding-gallery/linear), [Candu](https://www.candu.ai/blog/linear-onboarding-teardown)).

**Lesson for us:** A sandbox where nothing is saved is a safe place to practise, separate from the real setup.

### 2.15 Canva: one segmentation question
- A teardown reports that the first screen asks "What will you be using Canva for?" with large card options. The answer guides later onboarding (secondary: [Tenet](https://wearetenet.com/inspirations/saas-design-inspiration/saas-onboarding-design-examples/canva-onboarding)).

**Lesson for us:** One question, with large tappable options, is enough.

### 2.16 Jira Service Management: templates for service desks
- Atlassian's quick start guide is written for project admins. It starts from templates with "pre-configured request types, workflows" (via search summary of [Atlassian quick start](https://www.atlassian.com/software/jira/service-management/product-guide/getting-started/quick-start-guide); the page body did not load in full).
- Atlassian's Spotlight (coach-mark) guidance, from search summary of [atlassian.design/patterns/spotlight](https://atlassian.design/patterns/spotlight):
  - one spotlight on screen at a time
  - about three lines of copy, leading with the user's benefit
  - users can always skip or dismiss
  - the older onboarding component is deprecated ([Atlassian onboarding component](https://atlassian.design/components/onboarding))

### 2.17 Duolingo: motivation mechanics, and their limits
- **What Duolingo reports.** Streak milestone animations increased the chance that a new learner was still active 7 days later by 1.7%. Allowing two "streak freezes" increased daily active learners by 0.38%. These are Duolingo's own figures, with no published method ([Duolingo blog](https://blog.duolingo.com/how-duolingo-streak-builds-habit)).
- **The downside.** Research summarised by The Decision Lab found that users who break a streak are more likely to stop using a platform altogether ([The Decision Lab](https://thedecisionlab.com/fr-CA/insights/consumer-insights/streak-creep-the-perils-of-too-much-gamification)).

**Lesson for us:** Flexibility ("freeze") beats rigid pressure. For a one-off admin setup, streaks are the wrong tool.

### 2.18 Messaging providers: Twilio and SendGrid, relevant to our Integration step
- **Twilio test credentials:**
  - "Twilio doesn't charge your account, update the state of your account, or connect to real phone numbers."
  - Magic numbers simulate specific failures, for example a blocked recipient or a number that cannot receive SMS ([Twilio](https://www.twilio.com/docs/iam/test-credentials)).
- **SendGrid sender identity.** Single-sender verification "works for testing only". Configure domain authentication "before launching your mail send into production" ([SendGrid](https://www.twilio.com/docs/sendgrid/for-developers/sending-email/sender-identity)).

### 2.19 GitHub: irreversible actions
- **Danger Zone.** Deletion sits in a "Danger Zone" at the bottom of settings and lists its consequences.
- **Typed confirmation.** It asks you to "type the name of the repository" and warns "This action cannot be undone" ([GitHub](https://docs.github.com/en/repositories/creating-and-managing-repositories/deleting-a-repository)).

### Products we could not source reliably
- **Uizard "Onboarding Quest":** we found no public documentation of a Uizard feature with this name. Searches returned only Uizard's employee-onboarding FAQ and an unrelated SDK ([search result](https://uizard.notion.site/Onboarding-Experience-FAQs-94ff7a69243d4547864796d8bb2af0ab)). We have not made claims about it.
- **Figma and Rippling:** the official help pages we needed were not reachable or not relevant, so they are left out.

---

## 3. Pattern library

### 3.1 Overall patterns

**Welcome and segmentation**
- Notion, Zendesk and (per teardowns) Canva and Asana ask a small number of questions and use the answers to choose templates, tasks or sample data ([Notion](https://www.notion.com/help/start-with-a-template), [Zendesk](https://support.zendesk.com/hc/en-us/articles/4408828624538-Introducing-Zendesk-trial-tasks)).
- Zendesk handles the skip case explicitly: skipping still gets a sensible default (B2C sample data).
- Zendesk varies depth by experience: users with "some experience" see "Take it further" links ([Zendesk](https://support.zendesk.com/hc/en-us/articles/4408828624538-Introducing-Zendesk-trial-tasks)).

**Tours compared with checklists, empty states and contextual tips**

| Pattern | Works when | Annoys when | Evidence |
|---|---|---|---|
| Product tour (coach marks) | Orienting someone to the layout; a novel way of interacting; short and user-started | Long, automatic, interrupting a task, or showing obvious controls | Tutorials "slow users down, get in the way" and are skipped ([NN/g](https://www.nngroup.com/articles/onboarding-tutorials/)). Completion falls beyond four or five steps; tours launched from a launcher complete at about 62% against a 30% average (vendor data, [Chameleon 2023](https://www.chameleon.io/benchmark-report-2023)). |
| Checklist / task list | Multi-step setup spread over sessions; admin work | Hidden away, or showing progress that isn't real | [GOV.UK](https://design-system.service.gov.uk/patterns/complete-multiple-tasks/), [Okta](https://help.okta.com/oie/en-us/content/topics/security/admin-get-started.htm), [Shopify](https://shopify.dev/docs/api/app-home/patterns/compositions/setup-guide) |
| Empty state | Every list page before data exists | Left blank, or saying "no data" while still loading | "Totally empty states cause confusion"; give learning cues and "direct pathways" ([NN/g](https://www.nngroup.com/articles/empty-state-interface-design/)) |
| Contextual help (pull) | Complex fields and concepts at the moment of need | Covering the fields it explains | NN/g recommends pull help, help shown alongside each step ("No memorization!"), and help placed beside rather than over fields ([NN/g tutorials](https://www.nngroup.com/articles/onboarding-tutorials/), [NN/g wizards](https://www.nngroup.com/articles/wizards/)) |
| Wizard | Novice users and infrequent setup | Bulk data entry; steps that depend on information from outside the wizard | [NN/g wizards](https://www.nngroup.com/articles/wizards/) |

**Tour fatigue: what the numbers say (all vendor-reported)**
- Chameleon's data from 2020 (published January 2021):
  - three-step tours completed 66% of the time
  - after five steps, completion "dips to below 50%"
  - 76% of users who opened a launcher started a tour ([Chameleon blog](https://www.chameleon.io/blog/chameleon-benchmark-report))
- The 2023 report:
  - average tour completion of 30%
  - four-step tours performed best
  - tours started from launchers completed at 61.65%
  - one in five users who snooze a tour come back to finish it ([Chameleon 2023](https://www.chameleon.io/benchmark-report-2023))
- The 2019 report: 46% completion for 4-step tours against 23% for 5-step tours ([Chameleon 2019 PDF](https://www.chameleon.io/assets/chameleon-product-tour-benchmarks-report-2019.pdf); figures via search summary).
- These figures come from a vendor that sells tour software and vary by year. Use them only as a direction.

### 3.2 Setup checklists

| Question | What good products do | Sources |
|---|---|---|
| **How many items** | Okta has 5. Shopify's examples show 3. Intercom allows up to 25. GOV.UK says simplify first: "Fewer tasks or steps may remove the need for this pattern". Our 6 is within normal range. | [Okta](https://help.okta.com/oie/en-us/content/topics/security/admin-get-started.htm), [Shopify](https://shopify.dev/docs/api/app-home/patterns/compositions/setup-guide), [Intercom](https://www.intercom.com/help/en/articles/6661022-getting-started-with-checklists), [GOV.UK](https://design-system.service.gov.uk/patterns/complete-multiple-tasks/) |
| **Ordering** | Group into numbered stages that reflect the process. Allow any order where possible. Use "Cannot start yet" only for real prerequisites. Zendesk recommends its order but doesn't enforce it. | [GOV.UK](https://design-system.service.gov.uk/patterns/complete-multiple-tasks/), [GDS 2017](https://designnotes.blog.gov.uk/2017/04/04/weve-published-the-task-list-pattern), [Zendesk](https://support.zendesk.com/hc/en-us/articles/4408828624538-Introducing-Zendesk-trial-tasks) |
| **Optional or required** | Freshdesk uses tiers (minimal, intermediate, advanced). Stripe uses `currently_due` and `eventually_due`. Gusto marks statutory tasks as non-removable. GOV.UK shows skipped optional answers as "Not provided". | [Freshdesk](https://support.freshdesk.com/support/solutions/articles/195383-get-started-as-an-admin-in-freshdesk), [Stripe](https://docs.stripe.com/connect/handling-api-verification), [Gusto](https://support.gusto.com/article/210728175340400/View-and-complete-onboarding-checklists), [GOV.UK check answers](https://design-system.service.gov.uk/patterns/check-answers/) |
| **Progress display** | Word statuses per task (GOV.UK). An "X of Y" count (Shopify example: "0 out of 3 steps completed"). Check marks (Okta). Per-step time estimates (Intercom). | [GOV.UK](https://design-system.service.gov.uk/components/task-list/), [Shopify](https://shopify.dev/docs/api/app-home/patterns/compositions/setup-guide), [Okta](https://help.okta.com/oie/en-us/content/topics/security/admin-get-started.htm), [Intercom](https://www.intercom.com/help/en/articles/6661022-getting-started-with-checklists) |
| **Completion** | Automatic completion from real data (Intercom rules). A toast per step (Shopify example). An optional celebration message at the end (Intercom). The guide disappears when done (Okta). | [Intercom](https://www.intercom.com/help/en/articles/6661022-getting-started-with-checklists), [Shopify](https://shopify.dev/docs/api/app-home/patterns/compositions/setup-guide), [Okta](https://help.okta.com/oie/en-us/content/topics/security/admin-get-started.htm) |
| **Dismiss and resume** | Collapse rather than destroy (Shopify chevron). If dismissed, remember it on the server. Always reachable again (Okta: Dashboard > Getting Started; Zendesk: help panel "?"). | [Shopify](https://shopify.dev/docs/api/app-home/patterns/compositions/setup-guide), [Okta](https://help.okta.com/oie/en-us/content/topics/security/admin-get-started.htm), [Zendesk](https://support.zendesk.com/hc/en-us/articles/4408828624538-Introducing-Zendesk-trial-tasks) |
| **Where it lives** | Home page (Shopify, HubSpot). Main menu (Okta). Help panel (Zendesk after purchase). Messenger tasks space (Intercom). | as above, plus [HubSpot](https://knowledge.hubspot.com/help-and-resources/use-your-home-page) |
| **Skipping** | HubSpot's "skip for now" moves the task into *completed* and updates the progress bar. This inflates progress. Better: a distinct "Skipped – do later" state that does not count as done. | [HubSpot](https://knowledge.hubspot.com/help-and-resources/use-your-home-page) |

### 3.3 Difficult things: cross-product patterns
(Section 4 maps these onto our six steps.)

- **Dependencies.**
  - GOV.UK's "Cannot start yet" for hard blocks.
  - NN/g: staged disclosure is "problematic when the steps are interdependent".
  - Inline creation inside a select is a standard component in Atlassian's design system ("Creatable select allows users to create new options", [Atlassian](https://atlassian.design/components/select/creatable-select)).
  - Airtable can create missing select options during import ([Airtable](https://support.airtable.com/csv-import-extension)).
- **Missing information or credentials:**
  - sandbox first (Stripe)
  - test credentials (Twilio)
  - test-only sender (SendGrid)
  - "skip for now" (HubSpot)
  - "Save and complete later" (GOV.UK One Login)
  - "What you'll need" lists before starting (Freshdesk Omni quick start)
- **Bulk import:**
  - template generated from required fields (HubSpot, Gusto)
  - auto-mapping with override (Gusto, Airtable)
  - remembered mappings (Airtable)
  - errors fixed in the tool, with a downloadable error file (HubSpot)
  - explicit overwrite option (Shopify)
  - file limits and "can't be cancelled" warnings (Shopify)
- **Delegation:**
  - self-onboarding invitations (Gusto)
  - task assignees and due dates (HubSpot)
  - "add another admin" as a setup task (Okta)
  - invitation approval with requester notified (Slack)
  - sandbox-only access for partners (Stripe)
- **High-stakes actions:**
  - check answers before submitting (GOV.UK)
  - confirmations used sparingly, with outcome-labelled buttons and undo preferred (NN/g)
  - typed confirmation for rare dangerous actions (GitHub, NN/g)
  - a back-up export before overwriting (Shopify)
- **Empty states that teach:** say what the area is for, how to fill it, and give direct links (NN/g).
- **Sample data:**
  - Zendesk's sample data and sample ticket, with keep or delete on purchase
  - Linear's demo that resets on refresh
- **Verification waits:**
  - Stripe's `pending_verification`, "No action is required", with an honest time range
  - Slack notifies requesters on approval or denial
- **Multiple sessions:**
  - task list shown at the start of each session (GOV.UK)
  - resume email (GOV.UK One Login)
  - wizards that save state (NN/g)
- **Errors and recovery:**
  - GOV.UK error summary: at the top of `main`, focused on load, each error linked to its field, wording matching the inline message, "Error:" prefixed to the page title ([GOV.UK error summary](https://design-system.service.gov.uk/components/error-summary/))
  - Stripe's errors carry a plain-language `reason` plus a machine `code` for translation ([Stripe](https://docs.stripe.com/connect/handling-api-verification))

### 3.4 Help systems
- **Contextual, pull-based help.**
  - Show that help exists, but "do not overwhelm the user with detail until they ask for it".
  - Help must be easy to dismiss *and* easy to find again ([NN/g](https://www.nngroup.com/articles/onboarding-tutorials/)).
  - Place help in a panel beside the form, not over it ([NN/g wizards](https://www.nngroup.com/articles/wizards/)).
- **Help panel holding setup tasks.** Zendesk moves setup tasks into a help panel from the "?" icon after purchase ([Zendesk](https://support.zendesk.com/hc/en-us/articles/4408828624538-Introducing-Zendesk-trial-tasks)). That is the same model as our Help side panel.
- **Linked help per step.** Intercom checklist steps can open an article in place, launch a tour or go to a URL ([Intercom](https://www.intercom.com/help/en/articles/6661022-getting-started-with-checklists)). Okta links each task to its documentation ([Okta](https://help.okta.com/oie/en-us/content/topics/security/admin-get-started.htm)).
- **Human help and live sessions:**
  - Linear offers live onboarding sessions and a video library ([Linear](https://linear.app/docs/start-guide)).
  - Freshdesk runs a "Jumpstart" setup webinar ([Freshworks](https://www.freshworks.com/events/freshdesk-setup-webinar/)).
  - HubSpot's setup guide ends with "Get help" and "Join the Community" ([HubSpot](https://knowledge.hubspot.com/get-started/set-up-your-account)).
- **Consistent help (WCAG 3.2.6).** Help covers:
  - human contact details
  - a contact mechanism
  - self-help
  - chatbots
  - When repeated across pages, these must keep "the same order relative to other page content" ([W3C 3.2.6](https://www.w3.org/WAI/WCAG22/Understanding/consistent-help.html)).
- **"Show me where".** Launchers that let users start guidance themselves outperform automatic tours in vendor data ([Chameleon 2023](https://www.chameleon.io/benchmark-report-2023)). Our "Show me where" is a launcher of exactly this kind.

### 3.5 Motivation and tone
- **What works for admin setup:**
  - progress that reflects reality
  - a clear "what's left"
  - a short, sincere completion message (Intercom's optional celebration message, [Intercom](https://www.intercom.com/help/en/articles/6661022-getting-started-with-checklists))
  - Okta simply removes the guide when done ([Okta](https://help.okta.com/oie/en-us/content/topics/security/admin-get-started.htm))
- **Delight effects.** Chameleon reports 45% completion for tours with "delight animations" (confetti), against a 30% average. This is vendor data from consumer and B2B tools mixed, so it is not evidence for government contexts ([Chameleon 2023](https://www.chameleon.io/benchmark-report-2023)).
- **Government tone, from the GOV.UK style guide** ([GOV.UK style](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/style-guides/a-to-z-style-guide/)):
  - plain English is "mandatory"
  - address the user as "you"
  - use the active voice
  - avoid "please" and "please note"
  - avoid negative contractions such as "can't" and "don't"
  - don't use bold for emphasis
- **Judgement risk.** A task-list research participant said: "It feels like you're being judged rather than helped sometimes" ([GDS](https://designnotes.blog.gov.uk/2017/04/04/weve-published-the-task-list-pattern)). Red "overdue" states and scolding nudges increase that feeling.
- **Gamification limits.**
  - Duolingo's own data shows small gains from streak mechanics.
  - Independent research warns that broken streaks drive drop-off ([Duolingo](https://blog.duolingo.com/how-duolingo-streak-builds-habit), [The Decision Lab](https://thedecisionlab.com/fr-CA/insights/consumer-insights/streak-creep-the-perils-of-too-much-gamification)).
  - Our setup is done once, often by a civil servant under instruction. Points, badges and streaks do not fit. "Quest" naming is acceptable only if the content inside stays sober.
- **Colour meaning.** GDS chose a non-black colour for "COMPLETED" in 2017 because "some users read black as a warning". The 2023 iteration moved to black text with no background so attention goes to tasks still to do ([GDS 2017](https://designnotes.blog.gov.uk/2017/04/04/weve-published-the-task-list-pattern), [GDS 2023](https://designnotes.blog.gov.uk/2023/12/15/working-as-a-community-to-iterate-the-task-list-pattern/)). Test colour meanings with our own users.

### 3.6 Accessibility of onboarding patterns (WCAG 2.2 AA)

| Pattern | Criteria | What it means in practice | Source |
|---|---|---|---|
| Welcome modal | Modal dialog practice | Focus moves in on open. Tab and Shift+Tab stay inside. Escape closes. Focus returns to the element that opened it, or to a logical next element if that no longer exists. | [WAI-ARIA APG dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) |
| Coach-mark tour | 2.4.11 Focus Not Obscured (AA); modal practice | A tour tooltip that does not take focus is a non-modal overlay "at risk of failing" if it covers focusable items. A properly built modal "will always pass". Escape must dismiss. | [W3C 2.4.11](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html) |
| Floating checklist, minimised card, Help panel | 2.4.11 | Sticky or persistent panels must never *entirely* hide the focused element. Use scroll padding, or allow Escape to dismiss persistent content. | [W3C 2.4.11](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html) |
| Hover or focus flyouts (the "next step" flyout) | 1.4.13 Content on Hover or Focus (AA) | Must be dismissible without moving the pointer or focus, hoverable, and persistent. The W3C also notes "there are usually more predictable and accessible means". | [W3C 1.4.13](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html) |
| Tooltips and info icons | 1.4.13; Inclusive Components | Prefer click-triggered "toggletips" announced through a `role="status"` live region. Never put links or buttons inside a tooltip. | [Inclusive Components](https://inclusive-components.design/tooltips-toggletips/) |
| Help location | 3.2.6 Consistent Help (A) | Help mechanisms stay in the same relative order on every page. | [W3C 3.2.6](https://www.w3.org/WAI/WCAG22/Understanding/consistent-help.html) |
| Re-entering data across steps | 3.3.7 Redundant Entry (A) | Information already entered in the same process must be auto-filled or available to select. Browser autocomplete alone does not count. | [W3C 3.3.7](https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html) |
| API keys and passwords in Integration | 3.3.8 Accessible Authentication (AA) | Do not block paste. Support password managers. Avoid one-character code boxes. | [W3C 3.3.8](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html) |
| Imports, bulk changes, deletion | 3.3.4 Error Prevention (AA) | Submissions must be reversible, checked or confirmed. | [W3C 3.3.4](https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html) |
| Progress updates, "step complete", import progress | 4.1.3 Status Messages (AA) | Announce them without moving focus, for example with `role="status"` or a live progress region. | [W3C 4.1.3](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) |
| Long forms and sessions | 2.2.1 Timing Adjustable (A) | Server session time-outs are covered. Warn before the time-out and offer a way to extend it. | [W3C 2.2.1](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html) |
| Spotlight animation, celebration | 2.3.3 Animation from Interactions (AAA, good practice) | Respect `prefers-reduced-motion`. | [W3C 2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) |
| Error handling | GOV.UK error summary | Summary at the top of the page, focused on load, linked to fields. Prefix the page title with "Error:". | [GOV.UK](https://design-system.service.gov.uk/components/error-summary/) |
| Task-list rows | GOV.UK task list | Make the whole row the link. Statuses are non-interactive text. Keep the underline on the task name (WCAG 1.4.1). | [GOV.UK](https://design-system.service.gov.uk/components/task-list/), [GDS 2023](https://designnotes.blog.gov.uk/2023/12/15/working-as-a-community-to-iterate-the-task-list-pattern/) |

**Cognitive load.**
- Help should sit alongside each step ("No memorization!") ([NN/g](https://www.nngroup.com/articles/onboarding-tutorials/)).
- Keep progressive disclosure to two levels ([NN/g](https://www.nngroup.com/articles/progressive-disclosure/)).
- Hint text should be "a single short sentence" ([GOV.UK](https://design-system.service.gov.uk/components/task-list/)).

---

## 4. Handling the difficult things, mapped to our six steps

### Step 1: Branding
**Pain points:** waiting for an official logo or colour sign-off; fear of publishing something citizens will see.

- **Not a blocker.** Make Branding non-blocking, with sensible defaults (DIGIT default theme). Show it as "Incomplete", not "Cannot start yet", for everything else. GOV.UK says to allow any order where possible ([GOV.UK](https://design-system.service.gov.uk/patterns/complete-multiple-tasks/)).
- **Preview before publishing.** Show a live preview of the citizen-facing header and an SMS or email footer. This follows the check-answers idea: a second chance to spot mistakes before submitting ([GOV.UK check answers](https://design-system.service.gov.uk/patterns/check-answers/)).
- **Logo upload errors.** Give specific, fix-it messages in the style of Stripe's `reason` strings, for example "Logo must be PNG or SVG and under 2 MB" ([Stripe](https://docs.stripe.com/connect/handling-api-verification)).
- **Delegation.** Offer "Ask a colleague for the logo". This assigns the task with a due date, in the style of HubSpot checklists ([HubSpot](https://knowledge.hubspot.com/help-and-resources/manage-onboarding-to-do-lists-with-checklists)).

### Step 2: Geography (city > zone > ward)
**Pain points:** deep hierarchies; data held in spreadsheets of varying quality; codes; mistakes that route complaints to the wrong office.

- **Spreadsheet first.** Offer "Download template" generated from *their* chosen levels. It should contain only required columns, with mapping-ready headers and an instruction row, as in HubSpot's "Download example file" ([HubSpot](https://knowledge.hubspot.com/import-and-export/download-example-import-file)).
- **Define levels before data.** Step A is to name the levels (City, Zone, Ward). Step B is to import areas. This is a genuine dependency, so step B shows "Cannot start yet" until step A is done ([GOV.UK](https://design-system.service.gov.uk/patterns/complete-multiple-tasks/)).
- **Mapping:**
  - auto-match columns, with override and an "Unmatched (don't import)" option ([Gusto](https://support.gusto.com/article/210728164125837/Add-employees), [Airtable](https://support.airtable.com/csv-import-extension))
  - remember the mapping, but offer "Reset mapping" because of Airtable's reported failure ([Airtable community](https://community.airtable.com/other-questions-13/csv-import-block-fixing-field-mappings-17745))
- **Validation before commit:**
  - report hierarchy-specific errors such as a ward whose parent zone doesn't exist, duplicate codes, or an empty name
  - split them into "row not imported" and "value not imported" ([HubSpot](https://knowledge.hubspot.com/import-and-export/troubleshoot-import-errors))
  - allow fixes inside the tool, and offer "Download rows with errors"
- **Updates.** Use the boundary code as the match key. Ask explicitly: "Update areas with matching codes / Skip them" ([Shopify](https://help.shopify.com/en/manual/products/import-export/import-products), [Airtable](https://support.airtable.com/csv-import-extension)).
- **Review.** Show a tree preview ("3 cities, 12 zones, 148 wards") with counts per level before the admin confirms (WCAG 3.3.4 "Confirmed", [W3C](https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html)).
- **Recovery.** Recommend an export before re-importing. State plainly if an import cannot be cancelled once started ([Shopify](https://help.shopify.com/en/manual/products/import-export/import-products)).
- **Accessible alternative.** Provide a keyboard-operable tree editor using the add-to-a-list pattern (ask, review a summary list, "add another?") for small authorities and for corrections ([MOJ add to a list](https://design-patterns.service.justice.gov.uk/patterns/add-to-a-list/)).

### Steps 3 and 4: Departments and Employees (mutually dependent)
**Pain points:** an employee must belong to a department, and a department needs at least one employee before it can receive complaints (current prototype copy in `lib/content.ts`).

- **Don't lock either step.** A sequential lock forces the admin back and forth, which NN/g calls problematic for interdependent steps ([NN/g](https://www.nngroup.com/articles/progressive-disclosure/)).
- **Inline creation in both directions:**
  - In the employee form, the Department select offers "+ Create department 'Water Supply'", a creatable select ([Atlassian](https://atlassian.design/components/select/creatable-select)). It creates a minimal department (name only) without leaving the form.
  - In the department form, "Add first employee" opens a small inline form, or lets the admin pick from employees already added.
- **No double entry.** Values entered inline appear as already chosen when the admin later visits the other page (WCAG 3.3.7 Redundant Entry, [W3C](https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html)).
- **Ready versus created.** A department can exist with no employees, but its status is "Not ready: needs at least one employee". This is like Stripe's requirement model: the object exists, but a capability isn't enabled until requirements are met ([Stripe](https://docs.stripe.com/connect/handling-api-verification)).
- **Combined import.** One employees spreadsheet with a Department column. Unknown departments are listed as "will be created" in the review step. This mirrors Airtable's option to create missing select options during import ([Airtable](https://support.airtable.com/csv-import-extension)).
- **Self-onboarding for employees.** The admin enters name, phone, department and role. The employee confirms their own details through an invitation link. Gusto: "Self-onboarding reduces data-entry errors and saves you setup time" ([Gusto](https://support.gusto.com/article/210728164125837/Hire-new-employees)).
- **Roles.** Explain each role in plain words beside the select (as the prototype's "What's a role?" basics already do), shown in a side panel, not a tooltip ([NN/g wizards](https://www.nngroup.com/articles/wizards/)).
- **Delegation.** "Assign this step to a colleague" (for example a department head adds their own staff) with a due date ([HubSpot](https://knowledge.hubspot.com/help-and-resources/manage-onboarding-to-do-lists-with-checklists)). If invitations need approval, notify the requester of the outcome ([Slack](https://slack.com/help/articles/115004854783-Manage-who-can-send-workspace-invitations)).

### Step 5: Notifications (SMS and email templates)
**Pain points:** wording approval; variables; SMS length and cost; errors visible to citizens.

- **Start from defaults.** Pre-fill a plain-English default template for each complaint stage, which the admin edits rather than writes. This is the starter-template approach of Notion and Jira Service Management ([Notion](https://www.notion.com/help/start-with-a-template)).
- **Preview with sample data.** Show the message rendered with a sample complaint, in the style of Zendesk's sample ticket ([Zendesk](https://support.zendesk.com/hc/en-us/articles/4408828624538-Introducing-Zendesk-trial-tasks)).
- **Send a test.** "Send a test to my phone or email" works even before live credentials exist, using provider test modes ([Twilio](https://www.twilio.com/docs/iam/test-credentials), [SendGrid](https://www.twilio.com/docs/sendgrid/for-developers/sending-email/sender-identity)).
- **Explicit completion.** Templates can be done "well enough" without meeting a rule. Use GOV.UK's "Have you completed this section?" question rather than inferring completion ([GOV.UK](https://design-system.service.gov.uk/patterns/complete-multiple-tasks/)).
- **Announce character counts.** Live SMS character and segment counts must be announced politely to screen readers (WCAG 4.1.3, [W3C](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)).

### Step 6: Integration (SMS and email providers, API keys)
**Pain points:** credentials held by IT or a vendor; procurement delays; DNS changes; security.

- **Two tracks: "Test connection" and "Go live".**
  - Let the admin finish setup using a test or sandbox mode, as Stripe does ([Stripe](https://docs.stripe.com/payments/account/activate)).
  - Go-live requirements show as a separate "Needed before going live" list, modelled on `currently_due` and `eventually_due` ([Stripe](https://docs.stripe.com/connect/handling-api-verification)).
- **Mark test mode clearly.** Show a persistent "Test mode: messages are not sent to citizens" banner. Stripe's docs refer to a test data banner, and warn about which settings are shared with live mode ([Stripe testing](https://docs.stripe.com/test-mode)).
- **Ask IT for the credentials.** "Request credentials from a colleague" sends a secure link where IT pastes the keys directly. The admin never handles them. This combines Gusto's self-onboarding and Stripe's sandbox-only partner access ([Gusto](https://support.gusto.com/article/210728164125837/Hire-new-employees), [Stripe sandboxes](https://docs.stripe.com/sandboxes)).
- **Credential fields.** Allow paste and password-manager filling (WCAG 3.3.8, [W3C](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html)). Mask values after saving. Never show keys again in full, following Stripe's guidance to keep secret keys confidential ([Stripe](https://docs.stripe.com/payments/account/activate)).
- **Waiting for verification.** For email domain authentication or a provider's sender-ID approval, show a "Waiting for verification" state with "No action needed from you" wording and an honest time range, in the style of Stripe's `pending_verification` ([Stripe](https://docs.stripe.com/connect/handling-api-verification)). Notify the admin when it resolves ([Slack](https://slack.com/help/articles/115004854783-Manage-who-can-send-workspace-invitations)).
- **Errors in provider terms.** Translate provider error codes into plain-language reasons, for example "This number can't receive SMS" ([Twilio magic numbers](https://www.twilio.com/docs/iam/test-credentials)).

### Cutting across all six steps
- **"Minimum to start receiving complaints" tier.** Define it as at least: one geography level with areas, one department with one employee, and default notifications in test mode. Show it as a milestone separate from "Setup complete" ([Freshdesk tiers](https://support.freshdesk.com/support/solutions/articles/195383-get-started-as-an-admin-in-freshdesk)).
- **Several people sharing the work:**
  - assignee and due date per task ([HubSpot](https://knowledge.hubspot.com/help-and-resources/manage-onboarding-to-do-lists-with-checklists))
  - an "add another administrator" task ([Okta](https://help.okta.com/oie/en-us/content/topics/security/admin-get-started.htm))
  - "last edited by" on each task
- **Multiple sessions:**
  - show the task list first on each return ([GOV.UK](https://design-system.service.gov.uk/patterns/complete-multiple-tasks/))
  - save automatically; "Save and complete later" plus a resume email ([GOV.UK One Login](https://sign-in.service.gov.uk/documentation/design-recommendations/save-progress))
  - warn before session time-out ([W3C 2.2.1](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html))
- **Sample data.** Offer an optional "Explore with sample data" sandbox (sample city, departments and a sample complaint). It is clearly labelled and deletable in one action ([Zendesk](https://support.zendesk.com/hc/en-us/articles/4408828624538-Introducing-Zendesk-trial-tasks), [Linear](https://linear.app/docs/start-guide)). Never mix it into the live setup data.

---

## 5. Recommendations for our console

Priorities:
- **Must** means it is needed for correctness, accessibility or trust.
- **Should** means it is strongly evidenced.
- **Could** means it is worthwhile if there is capacity.

Each recommendation names the prototype part it changes.

### Must

| # | Recommendation | Changes | Evidence |
|---|---|---|---|
| M1 | **Replace the manual "Mark as Done" with derived status.** Each step's status comes from real data (for example Departments is Completed when every department has at least one employee). Keep a GOV.UK-style "Have you completed this section?" question only for Branding and Notifications, where "done" is a judgement. | Section pages (remove the "Mark as Done" card); checklist | [Intercom auto-completion](https://www.intercom.com/help/en/articles/6661022-getting-started-with-checklists), [GOV.UK](https://design-system.service.gov.uk/patterns/complete-multiple-tasks/) |
| M2 | **Use word statuses per task:** Not started, In progress, Completed, Cannot start yet, Waiting for verification, Skipped – do later. Skipped never counts toward "X of 6". Statuses are not clickable, and the whole row is the link. | Checklist rows, side-nav card count, Help panel progress | [GOV.UK task list](https://design-system.service.gov.uk/components/task-list/), [GDS 2023](https://designnotes.blog.gov.uk/2023/12/15/working-as-a-community-to-iterate-the-task-list-pattern/), [HubSpot skip anti-pattern](https://knowledge.hubspot.com/help-and-resources/use-your-home-page) |
| M3 | **Inline creation between Departments and Employees** (creatable department select; "add first employee" from a department), with no re-entry. Remove any implied lock between the two. | Section pages (Departments, Employees); checklist hint text | [Atlassian creatable select](https://atlassian.design/components/select/creatable-select), [NN/g](https://www.nngroup.com/articles/progressive-disclosure/), [W3C 3.3.7](https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html) |
| M4 | **Persist progress, dismissal and tour state on the server for each organisation**, not in component memory, so that several admins and several sessions see the same state. Show the task list on return. | Checklist, quest card, welcome modal (don't show again once seen by this user) | [Shopify dismiss guidance](https://shopify.dev/docs/api/app-home/v2.0-rc/patterns/templates/homepage), [GOV.UK](https://design-system.service.gov.uk/patterns/complete-multiple-tasks/), [NN/g wizards](https://www.nngroup.com/articles/wizards/) |
| M5 | **Integration: test mode first, go live later.** Add a "Test connection" path with a test-mode banner, a "Needed before going live" list, and a "Waiting for verification" state. | Integration section page; checklist status; Help panel tips | [Stripe](https://docs.stripe.com/payments/account/activate), [Stripe requirements](https://docs.stripe.com/connect/handling-api-verification), [Twilio](https://www.twilio.com/docs/iam/test-credentials), [SendGrid](https://www.twilio.com/docs/sendgrid/for-developers/sending-email/sender-identity) |
| M6 | **Spreadsheet import for Geography and Employees:** generated template, auto-mapping with override and reset, validation before commit with errors fixable in place, a downloadable error file, an explicit update-or-skip choice, and a preview with counts before confirming. | Geography and Employees section pages (empty state gets "Import from spreadsheet" next to "Add") | [HubSpot](https://knowledge.hubspot.com/import-and-export/troubleshoot-import-errors), [HubSpot template](https://knowledge.hubspot.com/import-and-export/download-example-import-file), [Gusto](https://support.gusto.com/article/210728164125837/Add-employees), [Shopify](https://help.shopify.com/en/manual/products/import-export/import-products), [W3C 3.3.4](https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html) |
| M7 | **Make the minimised quest card's flyout click-to-open (a toggletip pattern), not hover.** Keep Escape dismissal. Also check that the floating checklist and card never fully cover the focused element (use scroll padding, or move the checklist into the Help panel on narrow screens). | Side-nav quest card; floating checklist | [W3C 1.4.13](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html), [W3C 2.4.11](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html), [Inclusive Components](https://inclusive-components.design/tooltips-toggletips/) |
| M8 | **Announce status changes** ("Departments completed. 3 of 6 done", import progress) through a `role="status"` region without moving focus. Return focus to the opening element when the welcome modal, tour or reminder closes. | Checklist, section pages, Tour, WelcomeModal, QuestReminder | [W3C 4.1.3](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html), [APG dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) |
| M9 | **Keep Help in the same place on every page** (header Help button, then Help panel in a fixed order: progress, page tips, quick answers, resources, contact). | Header and Help panel | [W3C 3.2.6](https://www.w3.org/WAI/WCAG22/Understanding/consistent-help.html) |
| M10 | **Error summary pattern on every section form:** summary at the top, focused, linked to fields, "Error:" in the page title. Messages explain how to fix the problem. | Section pages | [GOV.UK error summary](https://design-system.service.gov.uk/components/error-summary/), [Stripe reasons](https://docs.stripe.com/connect/handling-api-verification) |
| M11 | **Credential fields allow paste and password managers**; mask values after saving. | Integration page | [W3C 3.3.8](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html), [Stripe](https://docs.stripe.com/payments/account/activate) |
| M12 | **Warn before session time-out and save automatically**, so a long Geography import or form never loses work. | All section pages | [W3C 2.2.1](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html), [NN/g wizards](https://www.nngroup.com/articles/wizards/) |

### Should

| # | Recommendation | Changes | Evidence |
|---|---|---|---|
| S1 | **Add a single segmentation question to the welcome modal**, for example "Do you already have a list of your wards and staff in a spreadsheet?" (Yes, spreadsheet / No, I'll add them one by one / Not sure). Use the answer to make Import or Add the primary action on Geography and Employees. Skipping gives a sensible default. Keep "Take a quick tour" and "I'll explore myself". | Welcome modal; section-page empty states | [Zendesk](https://support.zendesk.com/hc/en-us/articles/4408828624538-Introducing-Zendesk-trial-tasks), [Notion](https://www.notion.com/help/start-with-a-template) |
| S2 | **Group the six steps into two numbered stages**, each with a time estimate: "1. Your organisation" (Branding, Geography, Departments, Employees) and "2. Messages" (Notifications, Integration). Add a milestone line: "Ready to receive complaints". | Checklist, Help panel progress, side nav setup group | [GDS 2017](https://designnotes.blog.gov.uk/2017/04/04/weve-published-the-task-list-pattern), [Intercom time estimates](https://www.intercom.com/help/en/articles/6661022-getting-started-with-checklists), [Freshdesk tiers](https://support.freshdesk.com/support/solutions/articles/195383-get-started-as-an-admin-in-freshdesk) |
| S3 | **Assign a task to a colleague**, with an assignee, due date, invitation email and "last edited by". Add "Add another administrator" as an optional checklist item. | Checklist rows (overflow menu); Employees page | [HubSpot](https://knowledge.hubspot.com/help-and-resources/manage-onboarding-to-do-lists-with-checklists), [Okta](https://help.okta.com/oie/en-us/content/topics/security/admin-get-started.htm), [Slack](https://slack.com/help/articles/115004854783-Manage-who-can-send-workspace-invitations) |
| S4 | **Employee self-confirmation by invitation link** (the admin enters the minimum and the employee confirms the rest). | Employees page | [Gusto](https://support.gusto.com/article/210728164125837/Hire-new-employees) |
| S5 | **Rewrite each section's empty state to teach.** Say what it is, why it matters for routing complaints, and give two direct actions (Add / Import), plus "Show me an example". Keep "What you'll need" above it, as the prototype already does. | Section pages | [NN/g empty states](https://www.nngroup.com/articles/empty-state-interface-design/), [Freshdesk Omni prerequisites](https://support.freshdesk.com/support/solutions/articles/50000011785-getting-started-with-freshdesk-omni) |
| S6 | **"Save and complete later" link under each primary action, plus a resume email** listing what's left and who it's assigned to. | Section pages; email | [GOV.UK One Login](https://sign-in.service.gov.uk/documentation/design-recommendations/save-progress) |
| S7 | **Check-answers summary before publishing** Geography and before going live with Notifications and Integration. | Geography, Notifications, Integration pages | [GOV.UK check answers](https://design-system.service.gov.uk/patterns/check-answers/), [W3C 3.3.4](https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html) |
| S8 | **Keep the tour at three steps and make it reachable from Help** ("Replay the tour"). Never start it automatically after the first session. Add "Step 1 of 3", and keep Escape and focus handling as built. | Tour, Help panel resources | [NN/g](https://www.nngroup.com/articles/onboarding-tutorials/), [Chameleon 2023](https://www.chameleon.io/benchmark-report-2023), [Atlassian spotlight](https://atlassian.design/patterns/spotlight) |
| S9 | **Link each checklist row to its three kinds of help:** Go to page, Show me where, and Read how (opens the article inside the Help panel). | Checklist row body; Help panel | [Intercom](https://www.intercom.com/help/en/articles/6661022-getting-started-with-checklists), [Okta](https://help.okta.com/oie/en-us/content/topics/security/admin-get-started.htm) |
| S10 | **Confirmation only for consequential actions** (deleting a department that has employees, re-importing geography that overwrites, switching to live). Buttons name the outcome. Offer undo where possible. Use typed confirmation only for "Delete all geography data". | Section pages | [NN/g](https://www.nngroup.com/articles/confirmation-dialog/), [GitHub](https://docs.github.com/en/repositories/creating-and-managing-repositories/deleting-a-repository) |
| S11 | **Tone pass on all copy:** plain English, "you", active voice, no "please". Replace "Nice work." with a factual completion message, for example "Setup is complete. Complaints can now reach your departments." Consider sentence case for buttons, in line with GOV.UK's move away from capitalised labels (check this against DIGIT conventions). | Quest card, checklist, reminder, welcome modal | [GOV.UK style](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/style-guides/a-to-z-style-guide/), [GDS 2023](https://designnotes.blog.gov.uk/2023/12/15/working-as-a-community-to-iterate-the-task-list-pattern/) |
| S12 | **Retire the checklist when everything is complete**, as Okta does, and leave a "Setup summary" link in Help. Replace "Don't show this again" with "Hide checklist", which can be reversed from Help. | Checklist; side nav card; Help panel | [Okta](https://help.okta.com/oie/en-us/content/topics/security/admin-get-started.htm), [NN/g re-find help](https://www.nngroup.com/articles/onboarding-tutorials/) |

### Could

| # | Recommendation | Changes | Evidence |
|---|---|---|---|
| C1 | **"Explore with sample data" sandbox:** a sample city, two departments, and a sample complaint moving through stages to show why each step matters. Deletable in one click, and never mixed with live data. | Welcome modal (third option) or Help panel resources | [Zendesk](https://support.zendesk.com/hc/en-us/articles/4408828624538-Introducing-Zendesk-trial-tasks), [Linear demo](https://linear.app/docs/start-guide) |
| C2 | **Send a test message** from the Notifications page using provider test credentials. | Notifications page | [Twilio](https://www.twilio.com/docs/iam/test-credentials) |
| C3 | **Live onboarding session sign-up and short videos** in Help resources. | Help panel, Tutorials page | [Linear](https://linear.app/docs/start-guide), [Freshworks webinar](https://www.freshworks.com/events/freshdesk-setup-webinar/) |
| C4 | **A short completion moment** (one calm illustration, no confetti, respects `prefers-reduced-motion`) that also lists what happens next. | Checklist completion state | [Intercom celebration message](https://www.intercom.com/help/en/articles/6661022-getting-started-with-checklists), [W3C 2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) |
| C5 | **Approved email domain** so invitations to official addresses are approved automatically. | Employees / admin settings | [Slack](https://slack.com/intl/en-gb/help/articles/115004856503-Manage-how-people-join-your-workspace) |
| C6 | **Remembered import mappings with "Reset mapping"** for authorities that re-import monthly. | Import flow | [Airtable](https://support.airtable.com/csv-import-extension), [Airtable community](https://community.airtable.com/other-questions-13/csv-import-block-fixing-field-mappings-17745) |

---

## 6. Anti-patterns to avoid

1. **Long, automatic tours.**
   - Tours over four or five steps lose most people (vendor data, [Chameleon](https://www.chameleon.io/blog/chameleon-benchmark-report)).
   - Up-front tutorials are skipped and forgotten ([NN/g](https://www.nngroup.com/articles/onboarding-tutorials/)).
2. **Interrupting a task with feature news.** NN/g's Chase example shows a walkthrough during a stressful task that "did not communicate what the specific improvements were" ([NN/g](https://www.nngroup.com/articles/onboarding-tutorials/)).
3. **Counting skipped tasks as completed.** HubSpot's "skip for now" moves tasks into the completed list and advances the bar ([HubSpot](https://knowledge.hubspot.com/help-and-resources/use-your-home-page)).
4. **Manual "Mark as done" with no link to the data.** Progress becomes fiction, and the next admin trusts it.
5. **Hard sequential locks on interdependent steps** ([NN/g](https://www.nngroup.com/articles/progressive-disclosure/)).
6. **Wizard steps that need information from outside the wizard**, with no way to save ("Wizard steps should be self-sufficient", [NN/g](https://www.nngroup.com/articles/wizards/)).
7. **Clickable-looking status tags** ([GOV.UK](https://design-system.service.gov.uk/components/task-list/)).
8. **Help that covers the fields it explains**, or tooltips containing links and buttons ([NN/g wizards](https://www.nngroup.com/articles/wizards/), [Inclusive Components](https://inclusive-components.design/tooltips-toggletips/)).
9. **Hover-only flyouts** that cannot be dismissed or hovered ([W3C 1.4.13](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html)).
10. **Floating panels that hide the focused control** ([W3C 2.4.11](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html)).
11. **Asking for the same data twice** across Departments and Employees ([W3C 3.3.7](https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html)).
12. **Blocking paste in API key fields** ([W3C 3.3.8](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html)).
13. **Imports that commit before validation**, or that can't be reviewed, with an unclear overwrite policy ([Shopify](https://help.shopify.com/en/manual/products/import-export/import-products), [HubSpot](https://knowledge.hubspot.com/import-and-export/troubleshoot-import-errors)).
14. **Confirmation dialogs everywhere**, generic "Are you sure?" text, or Yes/No buttons ([NN/g](https://www.nngroup.com/articles/confirmation-dialog/)).
15. **Settings that look like test but change live**, without a clear indicator ([Stripe](https://docs.stripe.com/test-mode)).
16. **Silent waits.** A verification or approval with no status, no time range and no notification ([Stripe](https://docs.stripe.com/connect/handling-api-verification), [Slack](https://slack.com/help/articles/115004854783-Manage-who-can-send-workspace-invitations)).
17. **Permanent dismissal with no way back.** Help must be easy to find again ([NN/g](https://www.nngroup.com/articles/onboarding-tutorials/)).
18. **Consumer gamification in a government admin tool** (streaks, points, scolding nudges), and copy that makes officials feel judged ([GDS](https://designnotes.blog.gov.uk/2017/04/04/weve-published-the-task-list-pattern), [The Decision Lab](https://thedecisionlab.com/fr-CA/insights/consumer-insights/streak-creep-the-perils-of-too-much-gamification)).
19. **Sample data mixed into real data** with no one-click removal ([Zendesk](https://support.zendesk.com/hc/en-us/articles/4408828624538-Introducing-Zendesk-trial-tasks)).
20. **Session time-outs that discard work** ([W3C 2.2.1](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html)).

---

## 7. Sources

**Government and design systems**
- GOV.UK Design System, Complete multiple tasks: https://design-system.service.gov.uk/patterns/complete-multiple-tasks/
- GOV.UK Design System, Task list component: https://design-system.service.gov.uk/components/task-list/
- GOV.UK Design System, Check answers: https://design-system.service.gov.uk/patterns/check-answers/
- GOV.UK Design System, Error summary: https://design-system.service.gov.uk/components/error-summary/
- GDS Design Notes (2017), We've published the task list pattern: https://designnotes.blog.gov.uk/2017/04/04/weve-published-the-task-list-pattern
- GDS Design Notes (2023), Working as a community to iterate the task list pattern: https://designnotes.blog.gov.uk/2023/12/15/working-as-a-community-to-iterate-the-task-list-pattern/
- GOV.UK One Login, Save progress: https://sign-in.service.gov.uk/documentation/design-recommendations/save-progress
- GOV.UK A to Z style guide: https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/style-guides/a-to-z-style-guide/
- MOJ Design System, Add to a list: https://design-patterns.service.justice.gov.uk/patterns/add-to-a-list/
- Atlassian Design System, Spotlight: https://atlassian.design/patterns/spotlight
- Atlassian Design System, Onboarding (deprecated): https://atlassian.design/components/onboarding
- Atlassian Design System, Creatable select: https://atlassian.design/components/select/creatable-select

**W3C / WCAG 2.2**
- 1.4.13 Content on Hover or Focus: https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html
- 2.2.1 Timing Adjustable: https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html
- 2.3.3 Animation from Interactions: https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html
- 2.4.11 Focus Not Obscured (Minimum): https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html
- 3.2.6 Consistent Help: https://www.w3.org/WAI/WCAG22/Understanding/consistent-help.html
- 3.3.4 Error Prevention (Legal, Financial, Data): https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html
- 3.3.7 Redundant Entry: https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html
- 3.3.8 Accessible Authentication (Minimum): https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html
- 4.1.3 Status Messages: https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html
- WAI-ARIA Authoring Practices, Modal dialog: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
- Heydon Pickering, Inclusive Components, Tooltips and toggletips: https://inclusive-components.design/tooltips-toggletips/

**Research and UX**
- NN/g, Onboarding tutorials vs contextual help: https://www.nngroup.com/articles/onboarding-tutorials/
- NN/g, Designing empty states in complex applications: https://www.nngroup.com/articles/empty-state-interface-design/
- NN/g, Wizards: https://www.nngroup.com/articles/wizards/
- NN/g, Progressive disclosure: https://www.nngroup.com/articles/progressive-disclosure/
- NN/g, Confirmation dialogs: https://www.nngroup.com/articles/confirmation-dialog/
- Chameleon, Benchmark report blog (vendor data): https://www.chameleon.io/blog/chameleon-benchmark-report
- Chameleon, Benchmark report 2023 (vendor data): https://www.chameleon.io/benchmark-report-2023
- Chameleon, Product tour benchmarks 2019 (vendor data): https://www.chameleon.io/assets/chameleon-product-tour-benchmarks-report-2019.pdf
- Duolingo blog, How the streak builds habit: https://blog.duolingo.com/how-duolingo-streak-builds-habit
- The Decision Lab, Streak creep: https://thedecisionlab.com/fr-CA/insights/consumer-insights/streak-creep-the-perils-of-too-much-gamification

**Products**
- Stripe, Set up your account: https://docs.stripe.com/payments/account/activate
- Stripe, Account checklist: https://docs.stripe.com/get-started/account/checklist
- Stripe, Sandboxes: https://docs.stripe.com/sandboxes
- Stripe, Testing / test mode: https://docs.stripe.com/test-mode
- Stripe, Handle verification with the API: https://docs.stripe.com/connect/handling-api-verification
- Okta, Get started with Okta: https://help.okta.com/oie/en-us/content/topics/security/admin-get-started.htm
- Shopify, Setup guide composition: https://shopify.dev/docs/api/app-home/patterns/compositions/setup-guide
- Shopify, Homepage template: https://shopify.dev/docs/api/app-home/v2.0-rc/patterns/templates/homepage
- Shopify, Importing products with a CSV file: https://help.shopify.com/en/manual/products/import-export/import-products
- Shopify, Importing and exporting customer lists: https://help.shopify.com/manual/customers/import-export-customers
- HubSpot, Set up your HubSpot account: https://knowledge.hubspot.com/get-started/set-up-your-account
- HubSpot, Use HubSpot home (onboarding plan): https://knowledge.hubspot.com/help-and-resources/use-your-home-page
- HubSpot, Manage onboarding to-do lists with checklists: https://knowledge.hubspot.com/help-and-resources/manage-onboarding-to-do-lists-with-checklists
- HubSpot, Generate an example import file: https://knowledge.hubspot.com/import-and-export/download-example-import-file
- HubSpot, Troubleshoot import errors: https://knowledge.hubspot.com/import-and-export/troubleshoot-import-errors
- Gusto, Hire new employees: https://support.gusto.com/article/210728164125837/Hire-new-employees
- Gusto, Add employees: https://support.gusto.com/article/210728164125837/Add-employees
- Gusto, View and complete onboarding checklists: https://support.gusto.com/article/210728175340400/View-and-complete-onboarding-checklists
- Zendesk, Introducing Zendesk trial tasks: https://support.zendesk.com/hc/en-us/articles/4408828624538-Introducing-Zendesk-trial-tasks
- Freshdesk, Get started as an admin: https://support.freshdesk.com/support/solutions/articles/195383-get-started-as-an-admin-in-freshdesk
- Freshdesk, Get started with Freshdesk Omni: https://support.freshdesk.com/support/solutions/articles/50000011785-getting-started-with-freshdesk-omni
- Freshworks, Freshdesk Jumpstart webinar: https://www.freshworks.com/events/freshdesk-setup-webinar/
- Intercom, Getting started with Checklists: https://www.intercom.com/help/en/articles/6661022-getting-started-with-checklists
- Slack, Manage who can send workspace invitations: https://slack.com/help/articles/115004854783-Manage-who-can-send-workspace-invitations
- Slack, Manage how people join your workspace: https://slack.com/intl/en-gb/help/articles/115004856503-Manage-how-people-join-your-workspace
- Asana, How to invite team members: https://help.asana.com/s/article/how-to-invite-team-members-to-asana
- Asana, Custom onboarding: https://help.asana.com/s/article/custom-onboarding
- Airtable, CSV import extension: https://support.airtable.com/csv-import-extension
- Airtable community, CSV import block: fixing field mappings: https://community.airtable.com/other-questions-13/csv-import-block-fixing-field-mappings-17745
- Notion, Start with a template: https://www.notion.com/help/start-with-a-template
- Linear, Start guide: https://linear.app/docs/start-guide
- Atlassian, Jira Service Management quick start guide: https://www.atlassian.com/software/jira/service-management/product-guide/getting-started/quick-start-guide
- Twilio, Test credentials: https://www.twilio.com/docs/iam/test-credentials
- Twilio SendGrid, Sender identity: https://www.twilio.com/docs/sendgrid/for-developers/sending-email/sender-identity
- GitHub, Deleting a repository: https://docs.github.com/en/repositories/creating-and-managing-repositories/deleting-a-repository

**Secondary (third-party teardowns; used only for colour, not for key claims)**
- Supademo, Linear onboarding: https://supademo.com/content/plg-onboarding-gallery/linear
- Candu, Linear onboarding teardown: https://www.candu.ai/blog/linear-onboarding-teardown
- Tenet, Asana onboarding: https://www.wearetenet.com/inspirations/saas-design-inspiration/saas-onboarding-design-examples/asana-onboarding
- Tenet, Canva onboarding: https://wearetenet.com/inspirations/saas-design-inspiration/saas-onboarding-design-examples/canva-onboarding
- Uizard onboarding FAQ (no "Onboarding Quest" found): https://uizard.notion.site/Onboarding-Experience-FAQs-94ff7a69243d4547864796d8bb2af0ab
