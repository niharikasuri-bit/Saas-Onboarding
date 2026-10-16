# Setup journey UX: evidence and recommended design

Prepared 14 October 2026. Scope: the screen an admin sees after sign-up in the DIGIT complaint-management console, and how they move from account setup to creating a complaints template.

**How to read this.** Every claim about another product or guideline is cited with a URL. Where I could only see a search-result snippet or a third-party description, rather than the official page, I say so. Where I could not verify something, I say that too. The recommendations in section 3 are my synthesis. They are labelled as recommendations, not as facts.

**The model the user confirmed (this replaces the earlier pre-fill model):**
- Nothing in the side nav is set up in advance. Branding, Geography, Departments and Employees all start empty.
- Each task is done on its own page, which is the real settings page in the nav. Home does not do the work inline.
- The complaints template (complaint types, workflow, forms, roles and notifications) comes **after** account setup. When setup is complete, Home tells the admin to start creating the template.

---

## 1. Diagnosis of the current design

| # | Problem | Verdict | Evidence |
|---|---|---|---|
| 1 | **Nav names and task names don't match.** Home says "Look and feel" but the nav says Branding. The same happens with "Areas you will operate" (Geography), "Teams that fix complaints" (Departments) and "People in your teams" (Employees). | **Confirmed. This is the most clear-cut problem.** | NN/g heuristic 4: "Users should not have to wonder whether different words, situations, or actions mean the same thing." Heuristic 6: "The user should not have to remember information from one part of the interface to another." ([NN/g](https://www.nngroup.com/articles/ten-usability-heuristics/)). Shopify's app content guidance says: "Use a single noun, verb, or phrase to describe a specific thing, action, or concept" and "identify and eliminate synonyms for key concepts and actions." ([shopify.dev content](https://shopify.dev/docs/apps/design/content)). A task called "Teams that fix complaints" opens a page called Departments, and the admin has to work out that they are the same thing. |
| 2 | **"Ready to review" and "Looks Good": confirming defaults is busywork.** | **Confirmed. It is also now obsolete, because the user's model has no pre-filling.** | Helpdesk products present defaults as a working starting point, not as items to confirm one by one. Zendesk's standard triggers are a starting point you can "use as they are or clone and edit" ([Zendesk, search-result summary of "About the standard ticket triggers"](https://support.zendesk.com/hc/en-us/articles/4408828984346)). Freshdesk says "All Freshdesk accounts include one default SLA policy", which applies to all tickets ([Freshdesk, search-result summary](https://crmsupport.freshworks.com/support/solutions/articles/37626-understanding-sla-policies)). Jira Service Management templates come with request types and workflows, and "you can always change this later" ([Atlassian](https://support.atlassian.com/jira-service-management-cloud/docs/sign-up-for-a-jira-service-management-site)). None of these sources describe a "review each default" step counted as a setup task. |
| 3 | **Manual "Mark as Done".** | **Confirmed as the wrong default.** Manual completion is acceptable only in narrow cases. | Shopify: "A good setup acts as a quick start, with discrete steps that are **automatically marked as complete**" ([shopify.dev onboarding](https://shopify.dev/docs/apps/design/user-experience/onboarding)). GOV.UK allows a user-declared "Have you completed this section?" only when a task has optional questions, long answers, lookups, or "answers that need checking with someone else" ([GOV.UK pattern](https://design-system.service.gov.uk/patterns/complete-multiple-tasks/)). ServiceNow Guided Setup does use a manual "Mark as complete" checkbox ([ServiceNow docs](https://www.servicenow.com/docs/r/B5UZKOeMGcpyrvR2CNl5Dw/b_5pKLCykO8dttaMSzDV9w)), so manual completion exists in enterprise tools. In our case, though, every task produces data (a logo, boundaries, departments, people) that the system can detect, so manual ticking is unnecessary. |
| 4 | **Split between the Home list and separate intermediate pages** ("Filled in for you" pages and "What you'll need" pages that sit between Home and the real settings page). | **Confirmed.** The problem is the extra intermediate layer, not separate pages as such. | The user wants "everything happens in their own place", and this matches the leading patterns. ServiceNow categories provide "a set of links to the pages in your instance where you perform the configuration" ([ServiceNow](https://www.servicenow.com/docs/r/B5UZKOeMGcpyrvR2CNl5Dw/b_5pKLCykO8dttaMSzDV9w)). Shopify's setup-guide steps hold a short description and one primary button that can `href` to the relevant page ([shopify.dev setup guide](https://shopify.dev/docs/api/app-home/patterns/compositions/setup-guide)). In our design, a "Branding" task page sits in front of the real Branding page, which gives the admin two places for one job. |
| 5 | **Duplicated concepts: the template versus departments and employees.** | **Confirmed. There is also a hidden ordering problem.** | The template's **Roles** tab and the **Employees** page both deal with roles. Complaint types need routing to **Departments**. If roles exist only inside the template, Employees (a foundation task) cannot be fully set up before the template, which contradicts the "foundation first" order. This needs a decision (see Open question 1). The single-term rule above ([shopify.dev content](https://shopify.dev/docs/apps/design/content)) also applies: each concept should have one home and one name. |
| 6 | **Generic placeholder pages** (an empty state, an "Add X" button, "Mark as Done"). | **Confirmed in part.** Empty states are fine on a real settings page. The problem is a generic placeholder page that duplicates it. | Shopify: "Request information from merchants only if it's necessary" and "Onboarding should be brief and direct" ([shopify.dev onboarding](https://shopify.dev/docs/apps/design/user-experience/onboarding)). NN/g on wizards: steps "should be self-sufficient" and should not "require information available elsewhere in the app" ([NN/g wizards](https://www.nngroup.com/articles/wizards/)). For Geography and Employees, the admin often lacks the data in the moment, so these pages need import and delegation options, not a bare "Add" button (see section 2.7). |
| 7 | **A large greeting dominates the area above the fold.** | **Likely, but from inference rather than direct evidence.** | The patterns I found put the guide title, a progress count and the next step first. Shopify uses "0 out of 3 steps completed" with step 1 expanded by default ([shopify.dev setup guide](https://shopify.dev/docs/api/app-home/patterns/compositions/setup-guide)). HubSpot shows progress in the top right of the plan ([HubSpot KB](https://knowledge.hubspot.com/help-and-resources/use-your-home-page)). I found no source that rules against a greeting, so this is a priority judgement. |
| 8 | **The template sits in the same flat list as the foundations.** | **New issue under the confirmed model.** | The user wants the template to come after setup. A flat list of five equal rows does not communicate this. GOV.UK says that with many tasks, you should group them "into steps that reflect stages of the process" ([GOV.UK pattern](https://design-system.service.gov.uk/patterns/complete-multiple-tasks/)). |

---

## 2. Pattern evidence, product by product

### 2.1 The screen after sign-up

- **Shopify (setup guide composition for apps).** It has a heading "Setup Guide", an intro line, and a subdued progress line "0 out of 3 steps completed". Each step has a checkbox with the task name, a description, an optional image (max 80px), one primary button (for example "Upload image") and an optional tertiary button. The guide and step 1 start expanded, and the other steps start collapsed. There is also a "Dismiss Guide" button. ([shopify.dev](https://shopify.dev/docs/api/app-home/patterns/compositions/setup-guide)). Note that the source code allows several steps to be open at once. "Only one open at a time" is not specified.
- **Shopify (app onboarding rules).** "Avoid more than five steps in your onboarding process, as additional steps can lead to merchant drop off." "Including a progress indicator is another good practice." "Give merchants the option to complete the onboarding at a later time." ([shopify.dev onboarding](https://shopify.dev/docs/apps/design/user-experience/onboarding))
- **Shopify (merchant admin).** "While your online store is in private mode, Shopify Home displays setup tasks to help you open your store." Home cards can be dismissed. ([Shopify Help](https://help.shopify.com/en/manual/shopify-admin/shopify-home)). I could not find an official merchant-facing article on skipping or marking done Shopify Home setup tasks.
- **HubSpot (onboarding plan on Home).** Progress appears in the top right. You expand a task with an arrow, then click the button inside it to start. "Skip for now" moves a task into the completed list. A checkmark completes a task manually. ([HubSpot KB](https://knowledge.hubspot.com/help-and-resources/use-your-home-page)). Official HubSpot account setup lists five steps: import contacts, set properties, invite teammates, connect inbox, install tracking code ([HubSpot resources, from a search-result summary](https://resources.hubspot.com/hubspot-account-setup)).
- **Zendesk.**
  - The trial "Welcome page" lists tasks with time estimates ("Your account: About 3 minutes", "Agent productivity: About 8 minutes"), and "The wizard tracks your progress as you complete each task" ([Zendesk trial tasks](https://support.zendesk.com/hc/en-us/articles/4408828624538-Introducing-Zendesk-trial-tasks)).
  - Post-purchase **Launchpad** in Admin Center "organize[s] setup tasks by theme or purpose" and "keeps track of your setup progress". It has a **Continue** button to resume. It also surfaces "uncompleted setup tasks without interrupting your work" inside the agent workspace ([Zendesk Launchpad](https://support.zendesk.com/hc/en-us/articles/9932626237338)).
- **Freshdesk.** The admin guide uses three tiers: "Minimal setup", "Intermediate setup" and "Advanced setup". It says: "we recommend you take your time. Set up features as you need them." ([Freshworks](https://crmsupport.freshworks.com/support/solutions/articles/195383-get-started-as-an-admin-in-freshdesk))
- **Jira Service Management.** Sign-up ends with "create your first service space": choose whether you have used Jira, click "Let's go!", then choose a template. "Don't worry, you can always change this later." ([Atlassian](https://support.atlassian.com/jira-service-management-cloud/docs/sign-up-for-a-jira-service-management-site))
- **ServiceNow Guided Setup.** Configuration is grouped into categories. Each category shows a status (an empty circle for not started, a lock, or a purple circle for completed). It links to the real configuration pages, uses a manual "Mark as complete" checkbox, and saves progress "so you can stop and start again where you left off". You can add notes for others ([ServiceNow](https://www.servicenow.com/docs/r/B5UZKOeMGcpyrvR2CNl5Dw/b_5pKLCykO8dttaMSzDV9w)).
- **Gusto.** Company details come first, then employees, then payroll setup, then verification. "You cannot finish onboarding or process payroll until you respond" to outstanding tasks ([Gusto support, from a search-result summary; direct fetch returned 403](https://support.gusto.com/article/100758300100000/Gusto-onboarding-guide-for-employers)).
- **Not verified:** Stripe's dashboard setup guide UI, Intercom, Linear, Notion, Rippling, Monday.com and ClickUp home checklists. I found Stripe's account checklist doc ([Stripe](https://docs.stripe.com/get-started/checklist/account)) and Linear's setup guide ([Linear](https://linear.app/enablement/guide/set-up)), but I did not review their in-product checklist UI. I make no claims about them.

### 2.2 Templates and defaults

- **Jira Service Management:** templates come preconfigured, and the template "can always [be changed] later" ([Atlassian](https://support.atlassian.com/jira-service-management-cloud/docs/sign-up-for-a-jira-service-management-site)). There is no per-default review step in the sign-up flow.
- **Zendesk:** standard triggers are a starting point for a typical workflow, which you can use as they are or clone and edit ([search-result summary](https://support.zendesk.com/hc/en-us/articles/4408828984346)). The trial "automatically activates your help center for you" and adds sample data ([trial tasks](https://support.zendesk.com/hc/en-us/articles/4408828624538-Introducing-Zendesk-trial-tasks)).
- **Freshdesk:** "Freshdesk creates a default support email for you", and one default SLA policy applies to all tickets ([admin guide](https://crmsupport.freshworks.com/support/solutions/articles/195383-get-started-as-an-admin-in-freshdesk); [SLA, search-result summary](https://crmsupport.freshworks.com/support/solutions/articles/37626-understanding-sla-policies)).
- **monday.com:** before you use a template, its preview gives "a quick description of the workflow it was intended for, show[s] you images of all the included elements" and lists integrations ([monday support, search snippet only; direct fetch returned 403](https://support.monday.com/hc/en-us/articles/360001362625-monday-com-templates)).
- **Defaults research:** NN/g's video advises designers to "Assume that users will not change defaults and plan for this in your designs" ([NN/g video, title and snippet only](https://www.nngroup.com/videos/the-danger-of-defaults/)).
- **Answer:**
  - Products show what a template includes **before** you apply it (a preview with a summary).
  - They then treat the defaults as live and editable later.
  - **I found no example where reviewing each default counts as an onboarding task.**

### 2.3 Task completion

- Shopify: steps are "automatically marked as complete" ([onboarding](https://shopify.dev/docs/apps/design/user-experience/onboarding)). The setup-guide composition says "Mark tasks as complete when merchants finish them" ([setup guide](https://shopify.dev/docs/api/app-home/patterns/compositions/setup-guide)).
- HubSpot: manual checkmark and "skip for now". Skipped tasks count as completed ([HubSpot KB](https://knowledge.hubspot.com/help-and-resources/use-your-home-page)).
- ServiceNow: manual "Mark as complete" ([ServiceNow](https://www.servicenow.com/docs/r/B5UZKOeMGcpyrvR2CNl5Dw/b_5pKLCykO8dttaMSzDV9w)).
- GOV.UK: let the user decide only for tasks with optional questions, long answers, lookups, or answers needing someone else's check ([GOV.UK](https://design-system.service.gov.uk/patterns/complete-multiple-tasks/)).
- **Conclusion:** use automatic completion wherever the system can detect a real result. Manual completion is a fallback for open-ended tasks, not the default.

### 2.4 Inside one task

- Shopify and HubSpot expand a task inline to show a description and **one** button. The button launches the real work ([Shopify](https://shopify.dev/docs/api/app-home/patterns/compositions/setup-guide); [HubSpot](https://knowledge.hubspot.com/help-and-resources/use-your-home-page)).
- ServiceNow links straight to the real configuration pages ([ServiceNow](https://www.servicenow.com/docs/r/B5UZKOeMGcpyrvR2CNl5Dw/b_5pKLCykO8dttaMSzDV9w)).
- GOV.UK makes the whole task row a link ([GOV.UK task list component](https://design-system.service.gov.uk/components/task-list/)).
- **Returning:** Zendesk surfaces unfinished setup tasks inside the working product and has a "Continue" button ([Launchpad](https://support.zendesk.com/hc/en-us/articles/9932626237338)). GOV.UK shows the task list "at the start of each returning session" ([GOV.UK](https://design-system.service.gov.uk/patterns/complete-multiple-tasks/)).
- **Gap:** I found no official source that specifies a "back to setup" banner on settings pages. The return mechanism in section 3 is my recommendation, inferred from these patterns.

### 2.5 Naming consistency

- NN/g heuristics 2, 4 and 6 (quoted in section 1) ([NN/g](https://www.nngroup.com/articles/ten-usability-heuristics/)).
- Shopify: one term per concept, no synonyms ([shopify.dev content](https://shopify.dev/docs/apps/design/content)).
- Polaris button labels use a {verb}+{noun} format, for example "View shipping settings" ([Polaris actionable language, from a search-result summary](https://polaris.shopify.com/content/actionable-language)).
- GOV.UK: task names should give "a reasonable expectation of what that task is about". Keep them short, because long names are harder for screen reader users ([GOV.UK task list](https://design-system.service.gov.uk/components/task-list/)).
- **Conclusion:** the task title should be the nav label. Put the verb in the button.

### 2.6 Status language

- **GOV.UK default statuses:**
  - "Completed": plain black text, no tag.
  - "Incomplete": blue tag.
  - Optional "Not yet started" and "In progress", only if research shows users need them.
  - "Cannot start yet": grey text, and the row is **not a link**.
  - "There is a problem": red, for errors only.
  - "Start with the fewest statuses that might work."
  - Sources: [GOV.UK pattern](https://design-system.service.gov.uk/patterns/complete-multiple-tasks/) and [GOV.UK task list](https://design-system.service.gov.uk/components/task-list/).
- ServiceNow uses visual states (not started, locked, completed) ([ServiceNow](https://www.servicenow.com/docs/r/B5UZKOeMGcpyrvR2CNl5Dw/b_5pKLCykO8dttaMSzDV9w)).
- Our status "Ready to review" has no equivalent in any source I found.

### 2.7 Data the admin doesn't have yet

- **Zendesk:**
  - The CSV data importer adds or updates users ([Zendesk](https://support.zendesk.com/hc/en-us/articles/203661996-Bulk-importing-users)).
  - "If you want to bulk import both users and organizations, you must import organizations first", which mirrors our Departments-before-Employees order.
  - The trial advises adding "only... a few agents to test-drive your site" ([search-result summary of Zendesk trial docs](https://support.zendesk.com/hc/en-us/articles/4408828624538-Introducing-Zendesk-trial-tasks)).
- **Gusto:** "Download the CSV template" gives a blank file with the expected columns ([Gusto CSV upload](https://support.gusto.com/article/999914471000000/Run-payroll-or-pay-contractors-with-CSV-upload/)). This is for payroll data, not employee onboarding.
- **ServiceNow:** you can add notes for others who continue the work ([ServiceNow](https://www.servicenow.com/docs/r/B5UZKOeMGcpyrvR2CNl5Dw/b_5pKLCykO8dttaMSzDV9w)).
- **HubSpot:** setup includes "invite teammates" ([HubSpot resources, from a search-result summary](https://resources.hubspot.com/hubspot-account-setup)).
- **Linear:** assign people to teams before sending invites ([Linear](https://linear.app/enablement/guide/set-up)).
- **Not verified:** I found no official source showing an "ask a colleague to do this task" button on a setup checklist. It is a reasonable recommendation, but I have not verified it as an established pattern.

### 2.8 Visual hierarchy and density

- **Progress count:** "x out of y steps completed" (Shopify), or a progress bar (HubSpot) ([Shopify](https://shopify.dev/docs/api/app-home/patterns/compositions/setup-guide); [HubSpot](https://knowledge.hubspot.com/help-and-resources/use-your-home-page)).
- **The next step open:** Shopify expands step 1 by default.
- **Time estimates:** Zendesk shows them per task ([Zendesk](https://support.zendesk.com/hc/en-us/articles/4408828624538-Introducing-Zendesk-trial-tasks)).
- **Five steps or fewer** ([shopify.dev onboarding](https://shopify.dev/docs/apps/design/user-experience/onboarding)).
- **Dismiss or "later"** ([shopify.dev onboarding](https://shopify.dev/docs/apps/design/user-experience/onboarding)).

### 2.9 Is "foundation first, template second" the right sequence? (added at the user's request)

| Product | Order | Source |
|---|---|---|
| Jira Service Management | **Template first.** You create your first service space from a template right after sign-up. | [Atlassian](https://support.atlassian.com/jira-service-management-cloud/docs/sign-up-for-a-jira-service-management-site) |
| Shopify | **The working object first.** "add your first product, try a few different themes", then a domain. | [Shopify Help](https://help.shopify.com/en/manual/intro-to-shopify/initial-setup/setup-getting-started) |
| Zendesk | **Value first.** Defaults, sample data and a test ticket come before deep configuration. | [Zendesk trial](https://support.zendesk.com/hc/en-us/articles/4408828624538-Introducing-Zendesk-trial-tasks) |
| Freshdesk | **As needed.** "Set up features as you need them." | [Freshworks](https://crmsupport.freshworks.com/support/solutions/articles/195383-get-started-as-an-admin-in-freshdesk) |
| Gusto | **Foundation first, hard gate.** You cannot process payroll until onboarding tasks are done. This is driven by legal and tax prerequisites. | [Gusto, from a search-result summary](https://support.gusto.com/article/100758300100000/Gusto-onboarding-guide-for-employers) |
| ServiceNow | **Locks only for real prerequisites.** "You may need to activate a plugin or complete a prerequisite task to unlock it." | [ServiceNow](https://www.servicenow.com/docs/r/B5UZKOeMGcpyrvR2CNl5Dw/b_5pKLCykO8dttaMSzDV9w) |

**Reading of the evidence:**
1. Helpdesk-style products (closest to complaints) do **not** gate the main working object behind organisation setup. They lead with it, or ship defaults.
2. Hard gating appears where a real dependency exists: Gusto's tax and banking prerequisites, and ServiceNow's prerequisite tasks.
3. GOV.UK says the same thing in rule form: "Where possible, allow users to complete tasks in any order". Use "Cannot start yet" only "because another task must be completed first" ([GOV.UK](https://design-system.service.gov.uk/patterns/complete-multiple-tasks/)).
4. NN/g warns that locked sequences "limit the users' control", "may block access to other parts of the app" and "are not gracefully interruptible" ([NN/g wizards](https://www.nngroup.com/articles/wizards/)).
5. The "time-to-value" argument comes mostly from vendor blogs with weak data. One analysis even disputes that faster is always better ([InnerTrends](https://www.innertrends.com/blog/onboarding-is-it-a-good-idea-to-get-to-first-value-a-s-a-p)). I treat it as a supporting argument only.

**Verdict:**
- The **sequence** (foundation, then template) is defensible for DIGIT, because a complaints template does depend on foundation data: complaint types route to Departments, and workflows assign to people in roles within Geography.
- **Strict gating on everything** is not supported. Branding has no dependency relationship with the template and should not block it.
- **Recommendation:** gate the template only on the foundations it truly needs. Let the admin **preview** the template (read-only) before then, so they can see what's coming.

### 2.10 The handoff moment

- Jira's sign-up ends on "create your first service space" ([Atlassian](https://support.atlassian.com/jira-service-management-cloud/docs/sign-up-for-a-jira-service-management-site)).
- Shopify's first recommended step is "Add your first product" ([Shopify Help](https://help.shopify.com/en/manual/intro-to-shopify/initial-setup/setup-getting-started)).
- Zendesk ends the trial tasks with "Congratulations! You have completed the tasks for your trial account." and then "Set up and go live" ([Zendesk](https://support.zendesk.com/hc/en-us/articles/4408828624538-Introducing-Zendesk-trial-tasks)).
- The common pattern is a named "first X" action with a single primary button. I did not find official documentation of the exact visual design of these handoff screens.

---

## 3. Recommended design

### 3.1 Principles (each traced to the evidence above)

1. **One name per thing.** Task title = nav label. The verb goes on the button. (NN/g #4 and #6; Shopify content rules)
2. **Home guides, pages do.** Home never edits data. Each task opens the real nav page. (ServiceNow links to real pages; the user's "own place" rule)
3. **The system detects completion.** No "Mark as Done", no "Looks Good". (Shopify "automatically marked as complete")
4. **Two stages, five steps.**
   - Stage 1: "Set up your workspace" (4 tasks).
   - Stage 2: "Create your complaints template" (1 task).
   - (Shopify's limit of five or fewer steps; GOV.UK grouping into stages)
5. **Gate only on real dependencies.** The template shows "Cannot start yet" until Geography, Departments and Employees are complete. Branding never blocks. (GOV.UK; ServiceNow; NN/g wizards)
6. **Few statuses.** "Not started", "In progress", "Completed", "Cannot start yet". (GOV.UK: start with the fewest)

### 3.2 Home layout

**Above the fold, in this order:**
1. A one-line title: "Set up your workspace". Drop the large "Welcome, Elena." block, or reduce it to a small line in the header.
2. A progress line: "2 of 4 complete · about 25 minutes left". Use a thin bar plus text, never a bar alone.
3. The **next incomplete task, expanded by default**. This is the single primary action on the screen.
4. The other tasks as collapsed rows.
5. Stage 2 below, visible but locked, so the admin can see where this is heading.

**Task list behaviour (a hybrid accordion that links out):**
- Clicking a row expands it in place. Only one row is open at a time; this is my recommendation, because Shopify does not specify it.
- An expanded row shows:
  - one sentence on what this sets up
  - "What you'll need" (two or three bullets at most)
  - a time estimate
  - **one primary button that opens the real nav page**
  - optional secondary links, for example "Import from a spreadsheet" or "Ask a colleague"
- The row title is the nav label exactly. The button follows {verb}+{noun}: "Set up branding", "Add geography", "Add departments", "Add employees".

**Statuses (tags on the right of each row):**

| Status | When | Style (after GOV.UK) |
|---|---|---|
| Not started | No data saved on that page | Blue tag |
| In progress | Some data saved, but the completion rule is not yet met | Light blue or teal tag |
| Completed | Completion rule met | Plain text with a tick, no tag |
| Cannot start yet | Template only, until its dependencies are complete | Grey text; row not clickable, but it has a separate "Preview template" link |

**How completion is detected (proposed rules, to confirm with the user):**

| Task (nav label) | Completed when |
|---|---|
| Branding | Logo uploaded **and** the primary colour saved (or the admin saves the page with the default colour) |
| Geography | The hierarchy levels are defined **and** at least one boundary exists at the lowest level |
| Departments | At least one department saved |
| Employees | At least one employee saved who is assigned to a department, plus the admin themselves |
| Complaints template | The admin publishes the template ("Use this template", renamed "Publish template") |

If a rule is too weak (for example, one employee), the row still reads "Completed". The admin can keep adding people on the Employees page. That is ongoing work, not onboarding. GOV.UK's user-declared completion ("Have you completed this section?") is the fallback **only** if user testing shows that admins need to decide for themselves when Geography is "done".

**Returning from a settings page (the "own place" rule):**
- While setup is incomplete, every setup page (Branding, Geography, Departments, Employees) shows a slim banner under the page title: `Workspace setup · 2 of 4 complete · Back to setup`. This is my inference from Zendesk surfacing setup tasks "without interrupting your work"; I did not find a documented standard for it.
- When a save meets the completion rule:
  - Show a toast: "Branding completed".
  - The banner changes to: `Next: Geography →  ·  Back to setup`.
  - Do not auto-redirect. Let the admin stay and keep editing.
- The side nav shows a small check next to each completed setup item and a dot next to the next one. The nav itself then reflects progress, so it never contradicts Home.
- After all four are complete, remove the banner.

**The handoff moment (stage 1 to stage 2):**
- When the fourth foundation completes, stage 1 collapses to one line: "Workspace set up · 4 of 4 ✓ · Edit any time from the side nav".
- The top of Home becomes one hero card: **"Start creating your complaints template"**.
- The card shows what the template includes as a summary, never as a list to confirm:
  - "26 complaint types in 6 groups (12 common ones already ticked) · 1 workflow · 3 forms · 4 roles · notifications by SMS and email"
  - Group count and channels are placeholders; replace them with your real data.
- It has one primary button, "Start creating template", and a secondary "Preview what's included".
- On the Complaints Template page, the tabs stay as they are. Its Roles and Departments references are **pickers that use the foundation data**. They never re-create it.

**The template before stage 1 is complete:**
- The row reads "Complaints template · Cannot start yet · Needs Geography, Departments and Employees".
- A "Preview template" link opens a read-only view of the template. This answers the time-to-value concern without breaking the user's sequence.

### 3.3 Naming rules

1. The row title on Home must equal the side-nav label, character for character: Branding, Geography, Departments, Employees, Complaints template.
2. The verb goes on the button only: "Set up branding", "Add geography", "Add departments", "Add employees", "Start creating template".
3. One-line hint text may use plain language, for example "Your logo and colours" or "The areas where you'll handle complaints". The title stays the nav name.
4. The page heading of each settings page is the same nav label.
5. One term per concept across the product. "Department" is never also "team". Note that the Onboarding project memory says "no teams", so "Teams that fix complaints" breaks that rule too.
6. Use sentence case everywhere. Status words are adjectives (GOV.UK).

### 3.4 What to remove

- The "Ready to review" status, the "Filled in for you / Check this looks right" pages and the "Looks Good" button. There is no pre-filling.
- "Mark as Done" on every page.
- The intermediate task pages. Each task links to the real nav page.
- Task-style names that differ from nav labels ("Look and feel", "Areas you will operate", "Teams that fix complaints", "People in your teams").
- The Complaints template as a fifth equal row in one flat list. It moves to stage 2.
- The oversized greeting block above the fold.
- Any separate place where Roles or Departments are defined twice (see Open question 1).

### 3.5 Wireframe: Home during setup

```
+--------------------------------------------------------------------------------+
| DIGIT   [Org name]                                          ? Help    Elena v  |
+--------------+-----------------------------------------------------------------+
| Home         |  Set up your workspace                                          |
| Branding   ✓ |  2 of 4 complete  [#########...........]  about 25 min left     |
| Geography  ● |                                                                 |
| Departments  |  STAGE 1 - YOUR WORKSPACE                                       |
| Employees    |  +-----------------------------------------------------------+  |
| Complaints   |  | ✓ Branding                                    Completed   |  |
|   template   |  +-----------------------------------------------------------+  |
| Integration  |  | v Geography                                [In progress]  |  |
| Translations |  |   The areas where you'll handle complaints, from state    |  |
|              |  |   down to ward.                                           |  |
|              |  |   You'll need: your boundary levels and area names.       |  |
|              |  |   About 10 minutes.                                       |  |
|              |  |   [ Add geography ]   Import from a spreadsheet           |  |
|              |  |                       Ask a colleague to do this          |  |
|              |  +-----------------------------------------------------------+  |
|              |  | > Departments                              [Not started]  |  |
|              |  +-----------------------------------------------------------+  |
|              |  | > Employees                                [Not started]  |  |
|              |  +-----------------------------------------------------------+  |
|              |                                                                 |
|              |  STAGE 2 - YOUR COMPLAINTS SERVICE                              |
|              |  +-----------------------------------------------------------+  |
|              |  |   Complaints template                 Cannot start yet    |  |
|              |  |   Needs Geography, Departments and Employees.             |  |
|              |  |   Preview template                                        |  |
|              |  +-----------------------------------------------------------+  |
|              |                                        Hide setup guide         |
+--------------+-----------------------------------------------------------------+
```
(✓ = completed, ● = next step, shown in the nav as well.)

### 3.6 Wireframe: a task expanded (Departments), and the real page it opens

```
HOME (row expanded)
+-----------------------------------------------------------------+
| v Departments                                      [Not started]|
|   The departments that receive and resolve complaints.          |
|   You'll need: department names and who heads each one.         |
|   About 5 minutes.                                              |
|   [ Add departments ]      Import from a spreadsheet            |
|                            Ask a colleague to do this           |
+-----------------------------------------------------------------+
            |
            v  (opens the real nav page)
DEPARTMENTS PAGE (the real settings page)
+-----------------------------------------------------------------+
| Departments                                                     |
| Workspace setup · 2 of 4 complete ·              Back to setup  |
+-----------------------------------------------------------------+
|  No departments yet.                                            |
|  [ Add department ]   Import from a spreadsheet                 |
+-----------------------------------------------------------------+
            |  admin saves the first department
            v
| Departments                                                     |
| ✓ Departments completed. Next: Employees ->  ·  Back to setup   |
|  Water Supply  ·  Sanitation  ·  [ Add department ]             |
```

### 3.7 Wireframe: the handoff (all four foundations complete)

```
+-----------------------------------------------------------------+
|  Workspace set up · 4 of 4 ✓       Edit any time from the nav   |
+-----------------------------------------------------------------+
|  Start creating your complaints template                        |
|  Choose the complaints people can report, how they're routed    |
|  to your departments, and who gets notified.                    |
|                                                                 |
|  The template includes:                                         |
|   26 complaint types in 6 groups (12 common ones ticked)        |
|   1 workflow · 3 forms · 4 roles · SMS and email notifications  |
|                                                                 |
|  [ Start creating template ]        Preview what's included     |
|  About 15 minutes                                               |
+-----------------------------------------------------------------+
```
The counts here are placeholders. Replace them with the real template data.

---

## 4. Open questions for the user

1. **Roles: foundation or template?** The template has a Roles tab, but Employees need roles. Options:
   - (a) Move role definitions to Employees in stage 1, and let the template only map roles to workflow steps.
   - (b) Keep Roles in the template, and assign roles to employees after publishing. This means Employees is not truly "complete" in stage 1.

   Which matches DIGIT's data model?
2. **Gating strictness.** The evidence favours gating the template only on Geography, Departments and Employees, not Branding, and allowing a read-only **preview** before then. Is a preview acceptable, or should the template be completely hidden until setup is done?
3. **Completion rules.** Are the thresholds in section 3.2 right? For example, is "one department" enough to count as complete, or does Geography need full coverage?
4. **Integration and Translations.** Are they part of setup (stage 1) or optional later work? The evidence suggests five steps or fewer, so I have kept them out.
5. **Delegation.** Should "Ask a colleague to do this" send an invite with access limited to that one area, or a general admin invite? I found no verified product example of task-level delegation, so this needs your decision and a usability test.
6. **Import formats.** Do admins typically have geography and staff lists as spreadsheets (CSV/XLSX), or in another government system? This decides whether import is a secondary link or the primary button.
7. **Dismissing the guide.** Should admins be able to hide the setup guide before finishing? Shopify recommends making non-essential onboarding dismissible.
8. **Wording in the sign-up question.** The "What will you use DIGIT for?" options include a "Health Campaign" option. Your notes on the earlier onboarding prototype banned the word "campaign" for complaint-management products. Should that option be reworded here too?

---

### Verification notes

- **Fetched directly and quoted:** GOV.UK pattern and component, NN/g heuristics and wizards, the shopify.dev setup-guide and onboarding pages, the Shopify Help Home and getting-started pages, the HubSpot KB home page, the Zendesk trial tasks and Launchpad articles, the Freshworks admin guide, ServiceNow Guided Setup, Atlassian sign-up, and shopify.dev content.
- **Search-result summaries only** (the page was blocked or not fetched): Gusto onboarding, monday.com templates, the Zendesk standard triggers article, Freshdesk SLA, Polaris actionable language, HubSpot account setup resources, Zendesk bulk import.
- **Not researched or not verified:** the in-product checklists of Stripe, Intercom, Linear, Notion, Rippling, Monday.com and ClickUp.
