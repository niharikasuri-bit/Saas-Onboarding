# Home onboarding card and in-step experience: research and specification

**Prepared:** 14 October 2026
**Scope:** The "next step" card on Home, resuming setup, and what happens inside each step (Branding, Geography, Departments, Employees, Complaints template) in the DIGIT complaint-management console.
**Builds on:** `saas-onboarding-research.md` and `setup-journey-ux.md` in this folder. This document does not repeat what those files already cover. In particular, it does not restate:
- task-list statuses (GOV.UK)
- automatic completion
- the Shopify setup-guide composition basics
- HubSpot's "skip" problem
- spreadsheet import mechanics (HubSpot, Gusto, Airtable)
- inline creation between Departments and Employees
- WCAG criteria for overlays and status messages

Where this document relies on those findings, it points back to the earlier file.

**How to read the evidence**
- Every claim about a product or guideline links to its source.
- **"Snippet only"** means I saw a search-result summary, not the page itself.
- **"Not verified"** means I looked and could not confirm the claim. No claim has been made in those cases.
- Sections 2 to 5 are recommendations. They are design proposals, not sourced facts.

---

## 1. Findings per research question

### Q1. The "next step" hero card on a dashboard home

**What I could verify**

| Product | What the card or guide shows | Source |
|---|---|---|
| Shopify app Home (homepage template) | The setup guide is the first content card, placed above the metrics. Progress ("0 of 3 steps completed") sits in the card header's supplemental slot. A dismiss icon sits in the header's secondary-actions slot. Dismissal is stored "in local storage or a database". Only one banner should be visible at a time. | [shopify.dev homepage template](https://shopify.dev/docs/api/app-home/v2.0-rc/patterns/templates/homepage) |
| Shopify merchant Home | "While your online store is in private mode, Shopify Home displays setup tasks." After launch, setup is replaced by session data and then by full metrics. **For resume:** a started Sidekick guide's Home card "displays the steps that you've completed and the step to take next". | [Shopify Help: Shopify Home](https://help.shopify.com/en/manual/shopify-admin/shopify-home) |
| Shopify setup guide composition | Step image capped at 80 × 80 px. Progress is text only, with no bar. A toast appears per completed step ("Step 1 completed!"). The example does not define the all-complete state or auto-expand the next step. | [shopify.dev setup guide](https://shopify.dev/docs/api/app-home/patterns/compositions/setup-guide) |
| Zendesk Launchpad | "Launchpad keeps track of your setup progress. To resume a setup that you haven't completed, click **Continue**." It surfaces "uncompleted setup tasks without interrupting your work". A call to action inside Support "will surface uncompleted Launchpad setup activities". The help pages do not say whether progress is saved partway through a wizard. | [Zendesk Launchpad](https://support.zendesk.com/hc/en-us/articles/9932626237338), [Launchpad extension in Support](https://support.zendesk.com/hc/en-us/articles/10417267485466-Announcing-Launchpad-extension-in-Support) |
| Intercom "Getting started" | Three steps, each with a time estimate: install Messenger (about 15 min), invite teammates (about 2 min), automation basics (about 5 min). There are separate variants per use case. | [Intercom](https://www.intercom.com/help/en/articles/3194984-i-m-setting-up-a-new-intercom-workspace-for-customer-onboarding) (snippet only for the minute values) |
| Microsoft 365 admin centre (revamped Setup, Sept 2026) | "Guided setup" dashboard with status cards and a "Next setup steps" grid of 70+ guides. Suggested guides can be hidden. **A blogger reports no progress indicator and no single recommended next step**, and calls the redesign inconsistent. | [Michev blog, 14 Sept 2026](https://michev.info/blog/post/8402/revamped-setup-page-in-the-microsoft-365-admin-center) (secondary, one tenant) |
| Stripe Apps onboarding guidance | Onboarding "needs to be intuitive and polished, with minimal friction". On every page view, check whether onboarding is complete and "display a button to launch your onboarding appropriately". | [Stripe Apps onboarding](https://docs.stripe.com/stripe-apps/onboarding) |

**Answers to the sub-questions**
- **Eyebrow ("Start here").** I found no official source that documents an eyebrow label on a setup card. It is a reasonable design choice, but it is not evidenced.
- **One task, a primary CTA and progress.** Supported by Shopify (progress in the card header, one primary button per step) and Zendesk ("Continue").
- **Time estimates.** Supported by Intercom (above) and Zendesk (covered in the earlier file).
- **"After this".** Not documented by any product I could verify. Shopify's Sidekick card shows "the step to take next", which is the closest analogue.
- **Resume across sessions:**
  - Zendesk resumes the unfinished setup with **Continue**.
  - Shopify's guide card shows completed steps plus the next step.
  - GOV.UK shows the task list at the start of every returning session (see the earlier file).
  - **Not verified:** a "you were last on X" message, or a count of partial progress inside a task on the card, in any of Stripe, Linear, Asana, Notion, HubSpot, Mailchimp, Webflow or Squarespace. Official help pages for those products did not document their home checklists. Search results were third-party guides only ([Mailchimp search](https://oit.caes.uga.edu/mailchimp-newsletter-checklist/), [Squarespace search](https://www.stylefactoryproductions.com/blog/squarespace-launch-checklist)). I make no claims about them.
- **Finished state.**
  - Shopify replaces setup with metrics once the store is live ([Shopify Help](https://help.shopify.com/en/manual/shopify-admin/shopify-home)).
  - Okta removes the guide (earlier file).
- **Dismissed state.** Shopify: the dismissible card is remembered per user ([shopify.dev homepage](https://shopify.dev/docs/api/app-home/v2.0-rc/patterns/templates/homepage)). Microsoft 365: suggested guides can be hidden "for a period or permanently", and all guides stay under "All guides" ([Michev](https://michev.info/blog/post/8402/revamped-setup-page-in-the-microsoft-365-admin-center)).

### Q2. Inside a Branding step

**Live preview of the citizen-facing surface**

| Product | Preview behaviour | Source |
|---|---|---|
| Intercom Messenger | Settings sit on one side and a live preview updates beside them. "When you're happy with your Messenger preview, click Save and set live." Separate palettes and logos for light and dark themes. A tight crop is advised, because logos appear smaller "within the circular frame due to internal padding". | [Intercom: customise the Messenger](https://www.intercom.com/help/en/articles/6612589-customize-the-messenger) |
| Zendesk help centre | Five colours (brand, brand text, text, link, background). "The color updates in the preview window." The colour is saved when you click away. Nothing goes live until **Publish**. Logo recommended at 200 × 50 px. The article does not mention a preview for the logo. | [Zendesk: branding your help center](https://support.zendesk.com/hc/en-us/articles/4408824139546-Branding-your-help-center) |
| Freshdesk portal | "Before making the portal changes live, you can see a preview to understand how it appears on various platforms." It has a device preview in a new tab, **Save and Publish**, and **Reset** to discard edits. | [Freshdesk: customising your customer portal](https://support.freshdesk.com/en/support/solutions/articles/50000003753-customizing-your-customer-portal) |
| Shopify theme editor | "The theme editor displays your theme in a preview window." Shopify recommends duplicating the theme as a backup. Desktop and mobile toggles, undo and redo come from third-party guides only. | [Shopify Help](https://help.shopify.com/en/manual/online-store/themes/customizing-themes/theme-editor); toggles: [Debutify guide](https://help.debutify.com/en/articles/9506486-getting-started-with-the-shopify-theme-editor) (secondary) |
| Okta | Primary colour (buttons), secondary colour (backgrounds), logo, favicon and background image. After saving, "use the dropdown menu to preview your theme on other pages" (sign-in, error, dashboard, emails). | [Okta: set a theme](https://help.okta.com/oie/en-us/Content/Topics/Settings/branding-set-theme.htm) |
| Stripe | Icon (square), logo (non-square), brand colour and accent colour. Files must be JPG or PNG, under 512 KB, and at least 128 × 128 px. A table shows exactly **where each setting appears** (emails, Checkout, customer portal, invoice page, invoice PDF). I did not verify the Dashboard's in-page preview. | [Stripe: branding](https://docs.stripe.com/get-started/account/branding) |
| Shopify brand assets | One central place for assets: default logo (at least 512 px wide), square logo, primary and secondary colours **each with a "contrasting colour"**, cover image, slogan (80 characters) and short description (150 characters). These assets are used "as a default setting" by themes and channels. | [Shopify: managing brand assets](https://help.shopify.com/en/manual/promoting-marketing/managing-brand-assets) |

**Lessons**
1. Show the preview **beside** the controls, updating live.
2. Separate "save" from "go live" (Publish, or Save and set live).
3. Say **where** each setting appears, as Stripe's table does.

**Auto-extracting colours**
- **Intercom:** enter a domain and click **Import** to pull logo and colours, then adjust by hand ([Intercom](https://www.intercom.com/help/en/articles/6612589-customize-the-messenger)).
- **Mailchimp:** "Mailchimp will automatically add colors from your website or landing page". Fonts are also pulled. Logos are uploaded by hand ([Mailchimp Creative Assistant](https://mailchimp.com/help/use-creative-assistant/)).
- **Canva:** Brand Kit Builder builds a kit from a website URL or a PDF of brand guidelines. Canva advises reviewing the extracted content before use (snippet only; [Canva help](https://www.canva.com/help/brand-kit-builder/) returned 403). Extracting a palette from an uploaded logo is described only by third-party bloggers. One blogger warns that the extracted colours are not always the exact brand hex codes ([search result](https://brendacadman.com/how-to-add-brand-colours-to-canvas-brand-kit/)).
- **Cautionary example: Jira Service Desk (Server).** Uploading a logo used to "automatically generate a matching colour in the header". Customers filed a request for manual control, which was resolved in 2021 ([JSDCLOUD-184](https://jira.atlassian.com/browse/JSDCLOUD-184)).
- **Lesson:** suggest colours from the logo, but always let the admin override them and type an exact hex code.

**Accessible contrast checks**
- **Okta (the strongest example).** The Sign-In Widget "automatically adjusts colors to maintain WCAG 1.4.3 accessibility compliance". It "may lighten or darken the selected color, or even change the text color from white to black" when the colour fails 4.5:1 against the button text ([Okta support](https://support.okta.com/help/s/article/hex-code-is-not-accurately-represented-on-the-sign-in-widget)).
  - The side effect: the live page can differ from the preview, which generated a support article.
  - The Themes API lets admins override the auto-detected contrast colour (snippet only, [Okta API](https://developer.okta.com/docs/api/openapi/okta-management/management/tag/Themes/)).
- **Shopify** asks for a contrasting colour per brand colour, but states no ratio ([Shopify brand assets](https://help.shopify.com/en/manual/promoting-marketing/managing-brand-assets)).
- **Shopify themes.** I found no native contrast warning in the theme editor. One theme vendor puts contrast on the store owner ([Fluorescent](https://help.fluorescent.co/ira/general/editing-themes/accessibility)).
- **Zendesk** documents no contrast check ([Zendesk](https://support.zendesk.com/hc/en-us/articles/4408824139546-Branding-your-help-center)).
- **The thresholds:** 4.5:1 for normal text ([W3C 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)) and 3:1 for UI components and graphics ([W3C 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)).
- **Lesson:** check contrast in the open, and never silently change the admin's colour. Okta's silent adjustment caused a preview-versus-live mismatch.

### Q3. Inside a Geography (hierarchy) step

| Product | How hierarchy is defined | Source |
|---|---|---|
| **DIGIT itself** | A boundary hierarchy is "a named structure (e.g., Admin, Revenue, Tax) consisting of multiple nested boundary levels". The default CMS setup is "Country → State → City → Zone → Ward → Locality". "Complaints are typically tagged to the lowest level (leaf node)". Each boundary has a unique code. Each tenant can define its own hierarchy. | [DIGIT docs: boundary hierarchy](https://docs.digit.org/complaints-management/complaints-resolution-v2.10/design/architecture/boundary-hierarchy) |
| DHIS2 (government health) | "DHIS2 only supports a single organisation unit hierarchy in a tree structure, with a single root." "Each organisation unit must have exactly one *parent*". The hierarchy should start from the health administrative areas. Levels should be kept "to the smallest possible number". "Parent-child ratios from 1:4 or more are much more useful". Alternative groupings use groups and group sets, not extra levels. | [DHIS2 maintenance](https://docs.dhis2.org/en/implement/maintenance-and-use/organisation-unit-maintenance.html), [DHIS2 design](https://docs.dhis2.org/en/implement/database-design/organisation-units.html) |
| DHIS2 import | "It is highly recommend to use the Dry run option to test before importing data". Conflicts appear in a table under the import summary. GeoJSON is the recommended format for boundary shapes. Community threads report that a parent reference is mandatory for every unit except the root, and that building top-down is easiest. | [DHIS2 Import/Export](https://docs.dhis2.org/en/use/user-guides/dhis-core-version-master/exchanging-data/importexport.html), [mailing list](https://lists.launchpad.net/dhis2-users/msg16287.html) (secondary) |
| Salesforce Enterprise Territory Management | A territory *model* is a complete system. The territory hierarchy is "the main interaction point, where you create, edit, and delete territories". Territory *types* organise territories but "don't appear on territory model hierarchies". New models start in a **Planning** state and are activated later. | [Salesforce Metadata API: Territory2Model](https://developer.salesforce.com/docs/atlas.en-us.234.0.api_meta.meta/api_meta/meta_territory2model.htm) (snippet only); [Salesforce implementation guide PDF](https://resources.docs.salesforce.com/210/latest/en-us/sfdc/pdf/salesforce_implementing_territory_mgmt2_guide.pdf) (snippet only; the PDF failed to load) |
| Esri Business Analyst | "Standard geographies are country-specific hierarchal geography levels" (for example US: states, counties, tracts, block groups). Each lower feature intersects only one feature at the level above. Boundaries change between data vintages. | [Esri mapping options](https://doc.arcgis.com/en/business-analyst/web/understand-mapping-options.htm), [Esri blog](https://esri.com/arcgis-blog/products/arcgis-online/uncategorized/best-practices-how-to-query-standard-geographies-branches) (snippet only) |
| India Local Government Directory (LGD) | Standard codes for states, districts, sub-districts, blocks, villages and urban and rural local bodies, including wards. Codes change with bifurcations, mergers and renaming. | [India Data Portal mirror](https://ckandev.indiadataportal.com/dataset/lgd-codes) (secondary mirror; the official site is lgdirectory.gov.in, not fetched) |
| Shopify Markets | Groups countries or regions into markets. The primary market cannot be deleted. Markets are limited by plan. This is grouping, not a deep hierarchy, so it is of limited relevance. | [Shopify: managing markets](https://help.shopify.com/manual/markets/managing-markets) (snippet only) |
| Odoo | **Not verified.** I did not research it. | — |

**Answers to the sub-questions**
- **Tree building versus spreadsheet import.** Both exist everywhere. Salesforce builds in a hierarchy view, and DHIS2 offers both the maintenance app and import with a dry run. The earlier file covers spreadsheet import in detail.
- **Templates per country.**
  - Esri ships country-specific standard levels.
  - India has a national code directory (LGD) that could seed a "start from India's official list" option.
  - DIGIT ships a default chain.
  - **I found no product that offers a one-click "country template" for an admin hierarchy.** This would be our own design choice.
- **Validation:**
  - one parent per unit, a single root and unique codes (DHIS2, DIGIT)
  - a dry run before commit (DHIS2)
  - a planning state before activation (Salesforce)
  - few levels, with meaningful ratios (DHIS2)

### Q4. Inside Departments and Employees

| Product | Invite pattern | Source |
|---|---|---|
| Linear | Several emails separated by commas. **Invite as…** role (paid plans). Optionally pick teams to join automatically. Invitees **can be assigned work before they accept**. Approved email domains let people join without an invitation. | [Linear: invite members](https://linear.app/docs/invite-members) |
| Slack | Choose member or guest. Invitations and links expire after 30 days. Admins see a **Pending** tab with **Extend, Resend, Delete** actions. | [Slack: invite](https://slack.com/help/articles/201330256-Invite-new-members-to-your-workspace), [Slack: pending invitations](https://slack.com/intl/en-gb/help/articles/360060363633-Manage-pending-invitations-and-invitation-links-for-your-workspace) |
| GitHub | Choose a role, optionally a team. "You can edit or cancel an invitation any time before the user accepts." Invitations expire after seven days and move to **Failed invitations**. | [GitHub docs](https://docs.github.com/en/organizations/managing-membership-in-your-organization/inviting-users-to-join-your-organization) |
| Notion | Role dropdown (Workspace owner, Membership admin, Member). The invite shows as **pending** until accepted. Temporary members have an expiry date. | [Notion help](https://www.notion.com/help/add-members-admins-guests-and-groups) |
| Zendesk | Name and email, then **Next**, then a **Support role** dropdown. Groups are set on the profile, and "Agents must belong to at least one group". The seat count is shown before adding. | [Zendesk: adding agents](https://support.zendesk.com/hc/en-us/articles/4408886939930-Adding-agents-and-administrators) |
| Zendesk role descriptions | Plain-language role summaries exist in help content, for example "A Staff agent's primary role is to solve tickets." I could not verify whether they appear *inside* the role picker. | [Zendesk custom roles](https://support.zendesk.com/hc/en-us/articles/4408882153882-Custom-agent-roles-Enterprise-) (snippet only) |
| Google Workspace | **Download blank CSV template**. Required columns include an **Org Unit Path**. Upload-time errors must be fixed in the file. Processing errors go to a downloadable log with named error codes (for example `OU INVALID`, `USER ALREADY EXISTS`). Accounts created by CSV get no welcome email. | [Google Workspace: add users from CSV](https://knowledge.workspace.google.com/admin/users/add-or-update-multiple-users-from-a-csv-file) |
| Freshdesk agents | **Not verified.** The only agent CSV import I found is for Freshservice, a sister product, where groups and roles columns take comma-separated values. | [Freshservice](https://support.freshservice.com/support/solutions/articles/232445-importing-agent-information) (different product) |

**Lessons**
- Pending status with resend, extend and delete is standard (Slack, GitHub, Notion).
- Assigning work before acceptance (Linear) means an unaccepted invitation need not block routing setup.
- None of the verified sources show a role picker with descriptions inline. Recommending this rests on NN/g's "help alongside" guidance (earlier file), not on a product precedent.

**Empty states that teach**
- **Carbon:** title "as a positive statement" ("Start by adding data assets"), a body that explains "the next action to populate the space", the primary action under the copy, and an optional decorative image that screen readers skip. "If space is limited, use just text". Where many empty states appear together, text-only may be better ([Carbon empty states](https://carbondesignsystem.com/patterns/empty-states-pattern/)).
- **Atlassian:** the CTA "should always complement the title"; "Be careful of how many call to action buttons are on one page" ([Atlassian empty state](https://atlassian.design/foundations/content/designing-messages/empty-state), [Forge empty state](https://developer.atlassian.com/platform/forge/ui-kit/components/empty-state/)).

### Q5. Inside "create from a template"

| Product | Choosing | Customising | Source |
|---|---|---|---|
| Jira Service Management request types | A library of templates "inspired by industry best practices". "The preview of each template shows the pre-configured fields that appear in the form your customers will fill out." | "you can continue to customize these fields" after creating. Admins drag fields to add, remove or reorder them, rename a field for customers, add a description, or set a preset value and hide the field. The **request form** (what customers see) is separate from the **work item view** (what agents see). | [JSM: request type templates](https://support.atlassian.com/jira-service-management-cloud/docs/the-benefits-of-using-request-type-templates/), [JSM: request form](https://support.atlassian.com/jira-service-management-cloud/docs/configure-the-customer-request-form-and-issue-view-layout-for-a-request/) (snippet only) |
| Zendesk ticket forms | The form includes system fields by default. Only Type and Priority can be removed. | Drag fields from the right onto the form on the left. Conditional fields hide or show fields. A form can be agent-only or visible to end users, with a separate "Title shown to end users". The article does not mention a preview. | [Zendesk: ticket forms](https://support.zendesk.com/hc/en-us/articles/4408846520858-Creating-multiple-ticket-forms-to-support-different-request-types) |
| Asana | "Preview the templates to see what they look like", then **Use template**. | "Once you create a project from a template, you'll be able to edit it". **I found no way to edit before creating.** | [Asana announcement](https://asana.com/inside-asana/introducing-project-templates-asana.md) |
| monday.com | The preview gives a description, images of the included elements, and integrations. | — | Earlier file (snippet only) |

**The common pattern**
1. Preview what is included (read-only).
2. Create with the defaults.
3. Customise afterwards, one part at a time.

Jira also separates the citizen-facing form from the staff view. That maps directly onto our forms and workflow.

### Q6. Seamless transitions

- **Path back.**
  - Stripe Apps: when users leave to complete a step, "clearly indicate how users can return". "Use a call-to-action button to take users back… within the same tab" and "set the correct context so users know exactly what's next" ([Stripe redirects](https://docs.stripe.com/stripe-apps/patterns/redirects)).
  - Multi-step tasks use a focused view "to prevent them from accidentally abandoning the task" ([Stripe progress stepping](https://docs.stripe.com/stripe-apps/patterns/progress-stepping)).
- **Resume.** Zendesk "Continue" (Q1). GOV.UK "save and come back" (earlier file).
- **Save versus publish.** Zendesk, Freshdesk and Intercom all separate editing from going live (Q2). Freshdesk adds **Reset**.
- **The success moment.**
  - GOV.UK confirmation pages "reassure users that they have completed a transaction" and give "details of what happens next and when", plus links to likely next needs ([GOV.UK confirmation pages](https://design-system.service.gov.uk/patterns/confirmation-pages/)).
  - Atlassian: messages that appear often should be "shorter and less celebratory". Always include a way to opt out "without feeling pressured" ([Atlassian](https://atlassian.design/foundations/content/designing-messages/empty-state)).
  - The earlier file covers the arguments against gamification.
- **Not forcing the next step.**
  - Shopify's composition expands steps only when the user toggles them. It does not auto-advance ([shopify.dev](https://shopify.dev/docs/api/app-home/patterns/compositions/setup-guide)).
  - I found no source that recommends auto-redirecting to the next task.

### Q7. Visual style of setup cards (only what sources show)

- **Shopify:**
  - a bordered box with rounded corners and a background
  - progress as text in the header
  - steps as checkbox rows separated by dividers
  - an optional step image capped at 80 px
  - an icon-only dismiss with an accessible label ([setup guide](https://shopify.dev/docs/api/app-home/patterns/compositions/setup-guide), [homepage](https://shopify.dev/docs/api/app-home/v2.0-rc/patterns/templates/homepage))
- **Placement.** The setup card sits first, above metrics. Only one banner at a time ([homepage](https://shopify.dev/docs/api/app-home/v2.0-rc/patterns/templates/homepage)).
- **Illustration:**
  - Carbon treats images as optional, decorative and context-specific, and drops them when space is tight or when several appear together ([Carbon](https://carbondesignsystem.com/patterns/empty-states-pattern/)).
  - Polaris marks empty-state illustrations as decorative, with one primary CTA (snippet only, [Polaris](https://polaris-react.shopify.com/components/layout-and-structure/empty-state)).
- **The GOV.UK confirmation panel** is a static coloured panel with no interactive elements inside it ([GOV.UK](https://design-system.service.gov.uk/patterns/confirmation-pages/)).
- **Not verified:** what 2024–2026 setup cards look like in Stripe, Linear, Notion, Asana, Webflow and Squarespace. I could not view their in-product UI from official sources, so I describe nothing about them.

---

## 2. Specification: the Home onboarding card

### 2.1 Principles
1. **One card, one task, one primary button.** The card guides; the work happens on the step's own page (earlier file, "Home guides, pages do").
2. **The card always shows the most useful unfinished step:**
   - if a step is **In progress**, show that step, and the button reads **Continue**
   - otherwise show the first **Not started** step in the recommended order, and the button reads **Set up**
   - This follows Zendesk's Continue pattern.
3. **Never auto-advance and never redirect.** Completing a step returns control to the admin.
4. **Progress counts real completion only.** Skipped or dismissed steps never count.
5. **No stepper.** The card shows one step plus a quiet "See all steps" link, not a row of numbered dots.

### 2.2 Anatomy (reference copy kept as dictated)

| Slot | Content | Notes |
|---|---|---|
| Card heading | **Let's set up your account** | The `h2` for the card region |
| Eyebrow | **START HERE · 0 of 5 completed** | On later visits "START HERE" becomes **NEXT STEP** or **CONTINUE WHERE YOU LEFT OFF** (see the states). The count is the text equivalent of a thin progress bar. Never show a bar on its own. |
| Step title | **Branding** | Same as the side-nav label (earlier file, naming rules) |
| Description | **Set up your account logo, name and appearance that will show up on the citizen and employee experience.** | One sentence |
| Meta line | About 5 minutes · Can be changed later | Time estimate (Intercom, Zendesk). The values are placeholders to confirm with testing. |
| Resume line | *(only when In progress)* Last saved 2 days ago by Elena · Logo added, colours not yet chosen | Partial progress in plain words |
| After this | **After this: Geography — define the areas you cover** | Sets expectations without a stepper |
| Primary button | **Set up**, or **Continue** when In progress | Opens the step's own page |
| Secondary | See all steps | Expands an in-card list of the five steps with word statuses (earlier file, GOV.UK statuses) |
| Overflow | Hide for now | Not "Don't show again" |

### 2.3 States

**A. First visit (0 of 5)**
- Eyebrow: **START HERE · 0 of 5 completed**.
- Step: Branding, with the reference copy and the **Set up** button.
- Optional: one small decorative illustration (at most about 80 px, empty `alt`), following Carbon and Shopify.

**B. Mid-step (partial progress)**
- Trigger: the admin saved something on a step page, but the step's completion rule is not met.
- Eyebrow: **CONTINUE WHERE YOU LEFT OFF · 1 of 5 completed**.
- Resume line: "Last saved 14 Oct by Elena · 2 of 3 levels named, no wards added yet". This is factual and specific, not "You're almost there!".
- Button: **Continue**. It deep-links to the exact sub-section on the step page that is unfinished (for example Geography > Add areas), not to the top of the page.
- A "you were last on X" message has no verified precedent. It is offered here because it reduces the time needed to reorient; validate it in testing.

**C. Step done (just completed)**
- Shown on the admin's next visit to Home after completing a step.
- The card shows a single quiet line above the next step: "✓ Branding is set up. Citizens will see your logo and colours." This is a factual GOV.UK-style "what happens now", not a celebration.
- The card then shows the next step in state A or B form, with the count updated (**NEXT STEP · 1 of 5 completed**).
- The completion line goes after one visit. A `role="status"` announcement is covered in the earlier file.

**D. Template gated (Geography, Departments or Employees not yet complete)**
- If the next step in order is the Complaints template but its dependencies are not met, the card shows the blocking step instead, with "Needed before you create your complaints template" under the description.
- **See all steps** lists the template as "Cannot start yet", with a **Preview template** link (earlier file).

**E. All done (5 of 5)**
- The card collapses to a one-line confirmation panel: **"Your account is set up. Complaints can now be received and routed to your departments."**
- It has two links: **Review setup** (the step list) and **Hide**. Following GOV.UK confirmation pages, add one "what happens next" line, for example "Share the citizen link" (placeholder).
- After the admin hides it, or after a set period, Home returns to normal content. Setup stays reachable from Help > Setup summary (earlier file, Okta).

**F. Dismissed ("Hide for now")**
- Store the dismissal on the server per user (Shopify).
- Replace the card with a slim, non-modal line at the top of Home: "Setup: 2 of 5 completed · Show". The nav's setup items keep their dots and ticks.
- Never re-show the full card automatically in the same week. Re-show it only if a new required step appears (for example a new dependency).
- The Microsoft 365 "hide for a period or permanently" model is acceptable only if "All steps" stays reachable.

### 2.4 Resume rules (summary)
1. Save on the server, per organisation, with "last saved by" and "last saved at".
2. The card chooses: In progress first, then the first Not started step in order, then the template if unblocked.
3. If two admins work in parallel, show the latest editor's name on the resume line.
4. Deep-link **Continue** to the unfinished sub-section.
5. On the step page, show a slim "Account setup · 2 of 5 · Back to Home" bar (earlier file). On leaving, nothing is lost, because every field saves as a draft.

---

## 3. Specification: inside each step

Common to every step page:
- a slim setup bar with "Back to Home"
- a draft that saves automatically, with a visible "Saved" note
- one primary action
- no auto-redirect when the step completes
- a calm inline completion message with "Next: X →" as a link, not a button that grabs focus (following the Stripe redirect guidance on giving context for what's next)

### 3.1 Branding
- **Layout.** Two columns: controls on the left and a **live preview** on the right (Intercom, Zendesk, Freshdesk). On narrow screens the preview goes below, with a "Show preview" toggle.
- **Preview tabs.** "Citizen app", "Employee app" and "SMS/email". Each tab shows exactly where the logo, name and colour appear. This turns Stripe's "where each setting applies" table into a visual.
- **Controls, in order:**
  1. **Account name.** Pre-filled from sign-up, so it is never typed twice (WCAG 3.3.7, earlier file).
  2. **Logo.** Drag and drop or browse. Constraints stated up front (format, size, minimum pixels), following Stripe and Shopify. Show a crop and padding preview inside a circular frame and a header bar, because Intercom warns that logos look smaller in frames.
  3. **Square icon (optional).** Shopify and Stripe both separate a square icon from a wide logo.
  4. **Primary colour:**
     - "Suggested from your logo" swatches (Intercom, Mailchimp), plus a hex field.
     - The suggestion never overrides a typed value. Jira customers asked for manual control after automatic header colours.
- **Contrast check, shown openly:**
  - Next to the colour, show "Text on this colour: White · 5.2:1 · Passes" or "Fails: 2.9:1. Use darker shade #1A3E8C".
  - Offer the fix as a button the admin chooses. Never silently adjust, which is Okta's preview-versus-live problem.
  - Thresholds: 4.5:1 for text ([W3C 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)) and 3:1 for UI components ([W3C 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)).
- **Save and go live:**
  - **Save** keeps a draft that only admins see.
  - **Publish branding** applies it to citizen and employee surfaces.
  - Add **Reset to DIGIT default** (Freshdesk Reset, Zendesk Revert).
- **Completion rule.** Name, logo and a colour that passes contrast, published.
- **Waiting on a logo.** "Use DIGIT default for now" completes the step with a visible "Default logo" note. It never blocks other steps.

### 3.2 Geography
- **First screen: choose how to start.** Three cards:
  1. **Start from a suggested structure.** Pre-fill levels with DIGIT's default chain, editable ([DIGIT](https://docs.digit.org/complaints-management/complaints-resolution-v2.10/design/architecture/boundary-hierarchy)). A country-specific starter (for India, based on LGD codes) is a design option to validate; I found no product precedent for it.
  2. **Upload a spreadsheet** (mechanics in the earlier file).
  3. **Build it here.**
- **Part A: Levels.**
  - Name the levels top to bottom, for example State > District > Ward.
  - Show a hint, following DHIS2: "Use as few levels as you need. Complaints are tagged to the lowest level."
  - Each level has a name and an optional code prefix.
- **Part B: Areas.**
  - A keyboard-operable tree with one root. Each node has a name, a code and a parent (DHIS2's one-parent rule).
  - "Add district under Karnataka" is an inline action on the row.
  - Show counts per level ("1 state · 4 districts · 37 wards").
- **Validation before commit, run as a dry run (DHIS2):**
  - missing parent
  - duplicate code
  - empty level
  - a level with only one child everywhere, as a soft warning taken from DHIS2's ratio advice
- **Draft until published.** Salesforce-style **Planning** wording: "Draft structure: not used for routing yet". **Publish geography** makes it live.
- **Completion rule.** Levels named, at least one area at the lowest level, published.

### 3.3 Departments
- **Empty state that teaches (Carbon, Atlassian):**
  - Title: "Add the departments that resolve complaints".
  - Body: one sentence on routing.
  - Primary action: **Add department**. Secondary: "Upload a list".
  - Text only, or one small image.
- **Add form:** a name and an optional description. The head of department is picked from Employees, or created inline (earlier file).
- **List rows** show "3 employees" or "No employees yet. Complaints can't be assigned here." This states what is missing without a red error.
- **Completion rule.** At least one department with at least one employee (earlier file).

### 3.4 Employees
- **Add one, or several at once:**
  - name, phone or email
  - **Department** (creatable select)
  - **Role**
  - **Jurisdiction** (pick from Geography)
  - Several emails or phone numbers can be pasted at once, as in Linear's comma-separated entry, then assigned a shared department and role.
- **Role picker with plain-language descriptions.** Each option shows one line, for example "Grievance routing officer: receives new complaints and assigns them to a department".
  - Roles are account-level and shared across templates, so a note under the picker says "Roles are shared by all complaint templates".
  - No verified product shows descriptions inside the picker. This rests on NN/g's help-alongside guidance (earlier file).
- **Bulk upload** follows Google Workspace and the earlier file:
  - a downloadable template
  - required columns marked
  - upload errors fixed in the tool
  - a downloadable error log with plain-language reasons
- **Invitation status per person:**
  - Statuses: **Invited · Pending**, **Active**, **Expired**.
  - Actions: **Resend**, **Extend**, **Cancel invitation** (Slack, GitHub).
  - Pending people can already be assigned to departments and jurisdictions (Linear).
- **Completion rule.** At least one employee in a department, with a role. Pending invitations count, because routing does not depend on acceptance; confirm this with the user.

### 3.5 Complaints template
- **Choose:**
  - Template cards show a read-only "What's included" summary: complaint types, workflow stages, forms and notification channels.
  - **Preview** opens the citizen form as citizens would see it (JSM template preview).
- **Create with defaults.** **Use this template** creates a working draft straight away. Nothing has to be reviewed item by item (earlier file).
- **Customise, with progressive disclosure:**
  - Tabs in plain words: Complaint types · Workflow · Forms · Notifications.
  - Each tab opens in summary view with the most common edits on top. Advanced options (conditions, preset hidden values) sit behind "More options" (JSM, Zendesk).
  - **Forms:** split "What citizens fill in" from "What staff see", following JSM's request form versus work item view.
  - **Workflow:** roles are pickers drawn from account-level roles, and departments are pickers drawn from Departments. Nothing is created twice.
  - **Notifications:** preview with a sample complaint (earlier file).
- **Publish template.** Before publishing, show a check-answers summary (earlier file).
- **Completion rule.** The template is published.

---

## 4. ASCII wireframes

### 4.1 Home card: first visit, mid-step and all done

```
FIRST VISIT
+--------------------------------------------------------------------------+
| Let's set up your account                                    [...] Hide  |
|                                                                          |
|  START HERE · 0 of 5 completed                                           |
|  [==                                                    ]                |
|                                                                          |
|  [img]  Branding                                                         |
|         Set up your account logo, name and appearance that will show     |
|         up on the citizen and employee experience.                       |
|         About 5 minutes · Can be changed later                           |
|                                                                          |
|         After this: Geography — define the areas you cover               |
|                                                                          |
|         [ Set up ]                                   See all steps  v    |
+--------------------------------------------------------------------------+

MID-STEP (Geography partly done)
+--------------------------------------------------------------------------+
| Let's set up your account                                    [...] Hide  |
|  CONTINUE WHERE YOU LEFT OFF · 1 of 5 completed                          |
|  [==========                                            ]                |
|                                                                          |
|  Geography                                              In progress      |
|  Define the areas you cover, from state down to ward.                    |
|  Last saved 14 Oct by Elena · 3 levels named, 0 wards added              |
|                                                                          |
|  After this: Departments — who resolves complaints                       |
|  [ Continue ]                                        See all steps  v    |
+--------------------------------------------------------------------------+

ALL DONE
+--------------------------------------------------------------------------+
| ✓ Your account is set up. Complaints can now be received and routed      |
|   to your departments.                    Review setup  ·  Hide          |
+--------------------------------------------------------------------------+
```

### 4.2 Branding with a live preview

```
+--------------------------------------------------------------------------------+
| Branding                                         Account setup · 0 of 5 · Home |
|                                                               Saved 10:42      |
+---------------------------------------+----------------------------------------+
| Account name                          |  Preview  [Citizen app] [Employee] [SMS]|
| [ Bengaluru City Corporation      ]   |  +----------------------------------+  |
|                                       |  | [LOGO] Bengaluru City Corp.      |  |
| Logo                                  |  |----------------------------------|  |
| +-------------------------------+     |  |  Report a complaint              |  |
| |  Drop a PNG or SVG here       |     |  |  [ File a complaint ]  <- primary|  |
| |  or  Browse                   |     |  |  Track my complaint              |  |
| +-------------------------------+     |  +----------------------------------+  |
| PNG or SVG, under 2 MB, at least      |  Shown on: citizen app header,         |
| 512 px wide. Placeholder limits.      |  employee app, SMS and email footer    |
|                                       |                                        |
| Primary colour                        |                                        |
| Suggested from your logo:             |                                        |
| (o) #1A3E8C  ( ) #2F7D4F  ( ) #C84C0E |                                        |
| Hex [ #1A3E8C ]                       |                                        |
| Text on this colour: White            |                                        |
| 8.9:1  Passes WCAG AA                 |                                        |
|                                       |                                        |
| [ Publish branding ]   Save draft     |                                        |
| Reset to DIGIT default                |                                        |
+---------------------------------------+----------------------------------------+
  (On fail:  "2.9:1  Fails AA for text.  [ Use #1A3E8C instead ]")
```

### 4.3 Geography

```
+--------------------------------------------------------------------------------+
| Geography                                        Account setup · 1 of 5 · Home |
| Draft structure: not used for routing yet                     Saved 11:05      |
+--------------------------------------------------------------------------------+
| 1. Levels                                                         Edit levels  |
|    State  >  District  >  Ward                                                 |
|    Use as few levels as you need. Complaints are tagged to the lowest level.   |
|                                                                                |
| 2. Areas                     1 state · 4 districts · 37 wards                  |
|    [ Upload a spreadsheet ]   Download template                                |
|                                                                                |
|    v Karnataka (KA)                                   + Add district           |
|      v Bengaluru Urban (KA-BU)                        + Add ward               |
|          Ward 1 Koramangala (KA-BU-001)               Edit  ·  Remove          |
|          Ward 2 HSR Layout  (KA-BU-002)               Edit  ·  Remove          |
|      > Mysuru (KA-MY)                    ! 1 issue    + Add ward               |
|                                                                                |
|    Check before publishing                                                     |
|    ! Mysuru: 2 wards share code KA-MY-004. Change one code.     Fix            |
|                                                                                |
| [ Publish geography ]   Check structure                                        |
+--------------------------------------------------------------------------------+
```

---

## 5. Anti-patterns

These are new or specific to the Home card and the step interiors. The general anti-patterns are in `saas-onboarding-research.md`, section 6.

1. **Silently changing the admin's brand colour for contrast.**
   - Okta's automatic adjustment makes the live page differ from the preview ([Okta](https://support.okta.com/help/s/article/hex-code-is-not-accurately-represented-on-the-sign-in-widget)).
   - Show the ratio and offer the fix instead.
2. **Auto-colour from a logo with no manual override.** Jira Service Desk customers asked for manual control ([JSDCLOUD-184](https://jira.atlassian.com/browse/JSDCLOUD-184)).
3. **A preview that differs from what goes live,** or a preview that covers only some settings. Zendesk's article documents a preview for colours but not for the logo ([Zendesk](https://support.zendesk.com/hc/en-us/articles/4408824139546-Branding-your-help-center)).
4. **Branding changes that go live on every keystroke.** Keep save and publish separate (Intercom, Freshdesk).
5. **A setup dashboard with no single next step and no progress.** This is reported of Microsoft 365's revamped Setup ([Michev](https://michev.info/blog/post/8402/revamped-setup-page-in-the-microsoft-365-admin-center)).
6. **Deep hierarchies "because someone asked".** DHIS2 warns against adding levels for other bodies ([DHIS2](https://docs.dhis2.org/en/implement/database-design/organisation-units.html)).
7. **Importing a hierarchy without a dry run** ([DHIS2](https://docs.dhis2.org/en/use/user-guides/dhis-core-version-master/exchanging-data/importexport.html)).
8. **Creating accounts in bulk with no notification.** Google Workspace CSV-created users get no welcome email, so admins must send credentials separately ([Google](https://knowledge.workspace.google.com/admin/users/add-or-update-multiple-users-from-a-csv-file)). Our invitations must be sent and tracked.
9. **Invitations with no visible pending state or expiry** (contrast Slack and GitHub).
10. **Template customisation that starts with everything expanded.** JSM and Zendesk start from a preview or default and let people edit field by field.
11. **Auto-redirecting to the next step on completion,** or a modal "Next step!" that takes focus. No verified source does this, and it breaks "each step in its own place".
12. **Celebration that repeats or patronises** ([Atlassian](https://atlassian.design/foundations/content/designing-messages/empty-state)). Use one factual line, as GOV.UK confirmation does.
13. **A resume line in vague praise** ("You're almost there!"). Say what is saved and what is missing.
14. **A "dismiss forever" with no way back.** Keep "Show" on Home and a setup summary in Help.

---

## 6. Gaps and what was not verified
- **Home checklists in these products:** the in-product setup checklist UI of Stripe Dashboard, Linear, Asana, Notion, HubSpot (resume), Mailchimp, Webflow and Squarespace. I found no official documentation.
- **Freshdesk:** agent CSV import (only Freshservice was found).
- **Odoo:** location hierarchy (not researched).
- **Salesforce:** territory docs were seen only as snippets, because the PDF failed to load.
- **Canva:** Brand Kit Builder (403, snippet only).
- **Eyebrow labels:** "Start here" and "Continue where you left off" have no verified product precedent. Test them.
- **Placeholders:** time estimates, file limits and counts in the wireframes need real values.
