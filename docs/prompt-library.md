# Prompt Library — IDMS-UI Admin Masters

Reusable prompts for working with admin masters in IDMS-UI.
Copy the prompt, replace bracketed values, and submit to GitHub Copilot or any AI assistant.

All prompts follow the constraints set in `AGENTS.md`:
- No `npm run dev`, `npm run build`, `npm test`, `npm install`, Playwright, Cypress
- Static verification only (read code, check types)
- Do not modify lock files, generated files, or CI config

---

## 1. Add a generic admin master

Use this when the master fits the standard searchable table + tab form experience.
No page component is needed — `MasterListPage` and `MasterFormPage` handle it.

> **Faster alternative:** Run the generator first:
> ```bash
> node scripts/create-admin-master.js \
>   --key [key] --label "[Label]" \
>   --group [group] --description "[description]" \
>   --type generic
> ```
> Then paste the printed snippets into the files.

```
Add a new generic admin master to IDMS-UI.

Master details:
- key: [kebab-case-key]                       e.g. tax-master
- label: [Title Case Label]                   e.g. Tax Master
- description: [one sentence, no period]      e.g. Define tax types and applicable rates
- groupKey: [group]                           e.g. finance

Tasks:
1. Open src/admin/adminNavConfig.ts.
   Find the [group] group and add a new entry using the m() helper:
     m('[key]', '[label]', '[description]'),
   The m() helper auto-sets path to /admin/master/[key].

2. Open src/experience/help/helpTopics.ts.
   Append a new HelpTopic object inside the helpTopics array:
   {
     id: '[key]',
     title: '[label]',
     summary: '[description].',
     steps: [
       { title: 'Navigate to [label]', description: 'Open Admin → [Group] → [label].' },
       { title: 'Create a new record', description: 'Click "New [label]" and fill in the required fields.' },
       { title: 'Activate the record', description: 'Set Status to Active once all fields are validated.' },
     ],
     tips: [
       'Save as Draft first if any required data is missing.',
       'Inactive records are hidden from transaction dropdowns.',
     ],
     commonMistakes: ['Activating before all required fields are set.'],
     relatedTopics: ['admin-dashboard'],
   }

3. Open scripts/check-help-topics.js.
   Add '[key]' to the REQUIRED_TOPICS array.

4. Do NOT create a page component.
5. Do NOT add a route — the existing /:masterKey wildcard already handles it.
6. Do NOT run npm install, npm run dev, npm run build, or npm test.

Verify (static only):
- The id '[key]' in helpTopics.ts matches the key in adminNavConfig.ts exactly.
- '[key]' is present in REQUIRED_TOPICS in check-help-topics.js.
- No TypeScript errors introduced in the modified files.
```

---

## 2. Add a specialized admin master

Use this when the master needs a custom list view, preview drawer, or multi-section form
that `MasterListPage` / `MasterFormPage` cannot provide.

> **Faster alternative:** Run the generator to create the page file automatically:
> ```bash
> node scripts/create-admin-master.js \
>   --key [key] --label "[Label]" \
>   --group [group] --description "[description]" \
>   --type specialized
> ```
> Then follow the printed NEXT STEPS.

```
Add a new specialized admin master to IDMS-UI.

Master details:
- key: [kebab-case-key]
- label: [Title Case Label]
- description: [one sentence, no period]
- groupKey: [group]
- sections: [comma-separated section names, e.g. Overview, Settings, Rules, Advanced]

Tasks:
1. Create src/admin/masters/[Pascal]Page.tsx.
   The component MUST follow the approved structure exactly:
   a. Import: AdminShell, AdminPageShell, HelpDrawer, getHelpTopic,
              findMasterByKey, findGroupForMasterKey, recordRecentAdminMaster
   b. Import icons from lucide-react only as needed (Search, X, Plus, MoreHorizontal).
      Do NOT import ArrowLeft or HelpCircle — AdminPageShell owns the header and help button.
   c. Define a MASTER_KEY = '[key]' constant.
   d. Define SECTIONS array for the form toolbar (at minimum: Overview, Settings).
   e. Define the [Pascal]Record TypeScript interface with all domain fields.
   f. Implement renderList() returning:
      <AdminPageShell
        title={master?.label ?? '[label]'}
        description="[description]"
        breadcrumbs={[group?.label ?? '']}
        primaryAction={{ label: 'New [label]', tone: 'primary', onClick: openAddForm }}
        helpTopicId={MASTER_KEY}
        onHelpClick={(id) => { setHelpTopicId(id); setHelpOpen(true); }}
        summaryItems={[Total, Active, Draft, Inactive]}
        toolbar={/* search input + status filter chips */}
      >
        {/* record table with MoreHorizontal menu + empty state */}
      </AdminPageShell>
   g. Implement renderForm() returning:
      <AdminPageShell
        title={currentCode}
        description={formRecord.name}
        breadcrumbs={[group?.label ?? '', master?.label ?? '']}
        statusLabel={editingRecord?.status}
        statusTone={...}
        helpTopicId={MASTER_KEY}
        onHelpClick={(id) => { setHelpTopicId(id); setHelpOpen(true); }}
        primaryAction={...}
        secondaryActions={[...spread, { label: '[label] List', tone: 'ghost' as const, onClick: () => setViewMode('list') }]}
        toolbar={/* segmented section buttons */}
      >
        {/* section panels */}
      </AdminPageShell>
   h. Main return:
      <AdminShell>
        {viewMode === 'list' ? renderList() : renderForm()}
        {helpTopicId && getHelpTopic(helpTopicId) && <HelpDrawer open={helpOpen} topicId={helpTopicId} onClose={() => setHelpOpen(false)} onTopicChange={setHelpTopicId} />}
      </AdminShell>
   i. Do NOT render a second header div. Do NOT add a search bar outside the toolbar prop.
   j. Use tone: 'ghost' as const in secondaryActions arrays to satisfy TypeScript.

2. Add entry to src/admin/adminNavConfig.ts (same as generic step 1).
3. Add help topic to src/experience/help/helpTopics.ts (same as generic step 2).
4. Add id to REQUIRED_TOPICS in scripts/check-help-topics.js.
5. Open src/routes/adminRoutes.tsx:
   a. Add lazy import near the top:
      const [Pascal]Page = React.lazy(() => import('../admin/masters/[Pascal]Page'));
   b. Add route BEFORE the generic /:masterKey wildcard:
      <Route path="/admin/master/[key]" element={<[Pascal]Page />} />
6. Do NOT run npm install, npm run dev, npm run build, or npm test.

Verify (static only):
- helpTopicId="[key]" in the component matches the id in helpTopics.ts.
- '[key]' is in REQUIRED_TOPICS in check-help-topics.js.
- No TypeScript errors in the new and modified files.
- The route is placed before the /:masterKey wildcard in adminRoutes.tsx.
```

---

## 3. Audit an existing admin master

Use this to check whether an existing admin master page is compliant with the
current approved structure (`AdminPageShell`, `helpTopicId`, no duplicate headers).

```
Audit the admin master page at src/admin/masters/[PascalKey]Page.tsx.

Check for these violations and fix any found:

STRUCTURAL VIOLATIONS (blocking — must fix):
1. Does the page import and use AdminPageShell?
   If it still imports AdminConfigShell, migrate it to AdminPageShell.
2. Does the page pass helpTopicId to AdminPageShell?
   If not, add helpTopicId="[key]" and onHelpClick.
3. Does src/experience/help/helpTopics.ts contain id: '[key]' with non-empty steps?
   If not, add a real help topic (not placeholder).
4. Is '[key]' in REQUIRED_TOPICS in scripts/check-help-topics.js?
   If not, add it.
5. Does the page render a duplicate title/header outside AdminPageShell?
   (A second <PageHeader>, a manual <h1>, or a div that duplicates the title.)
   If so, remove it.
6. Does the list view render a search bar outside the toolbar prop of AdminPageShell?
   If so, move it into the toolbar prop or remove the duplicate.

QUALITY VIOLATIONS (should fix):
7. Does AdminPageShell receive summaryItems?
   If not, add Total / Active / Draft / Inactive.
8. Does the form view pass statusLabel and statusTone to AdminPageShell?
   If not, add them.
9. Are there unused imports from lucide-react (ArrowLeft, HelpCircle) left over
   from a previous migration? Remove them.
10. Are there unused variables (totalCountable, completedCount, allOk, computedSections)
    that were only consumed by the removed AdminConfigShell? Remove them.

Do NOT run any commands.
Report all violations found, then apply fixes for each one.
Confirm 0 TypeScript errors after fixes (static check — read types and imports).
```

---

## 4. Migrate AdminConfigShell to AdminPageShell

Use this when a specialized master page still uses the old `AdminConfigShell` inner sidebar.

```
Migrate src/admin/masters/[PascalKey]Page.tsx from AdminConfigShell to AdminPageShell.

Reference implementations (in order of complexity):
  Simple:  src/admin/masters/NumberingSettingsPage.tsx
  Medium:  src/admin/masters/PicklistMasterPage.tsx
  Complex: src/admin/masters/CodeGenerationPolicyPage.tsx
           src/admin/masters/KycSetupPage.tsx

Migration steps:
1. Remove these imports:
   - AdminConfigShell (from experience/components/AdminConfigShell)
   - AdminConfigSectionItem (type import — if used only in the sections array)
   - ArrowLeft (from lucide-react — if used only in the form back button)
   - HelpCircle (from lucide-react — if used only in the help button)
   - PageHeader (from experience/components/PageHeader — only if no other usage)

2. Add this import:
   import { AdminPageShell } from '../../experience/components/AdminPageShell';

3. Remove local variables only used in AdminConfigShell:
   - computedSections (useMemo that maps SECTIONS to AdminConfigSectionItem[])
   - allOk / totalCountable / completedCount (if only used in computedSections or
     the progress prop of AdminConfigShell)

4. For the list view (if present):
   - Wrap the content in:
     <AdminPageShell title={...} description={...} breadcrumbs={[...]} primaryAction={...}
       helpTopicId={MASTER_KEY} onHelpClick={...}
       summaryItems={[Total, Active, Draft, Inactive]}
       toolbar={/* search + filter chips */}
     >
       {/* table content only — no wrapping scroll div */}
     </AdminPageShell>
   - Remove the outer wrapper div (flex column, height 100%)
   - Remove the manual summary strip div
   - Remove the toolbar wrapper div (AdminPageShell toolbar prop replaces it)

5. For the form view:
   - Replace the outer div + form header div with <AdminPageShell ...>
   - Move sections navigation into the toolbar prop as a segmented button group
   - Remove <AdminConfigShell sections={...} progress={...}>
   - Remove </AdminConfigShell>
   - Remove the outer closing </div>

6. Fix the alert/banner strip style inside AdminPageShell children:
   Old (incompatible): { flexShrink: 0, padding: '10px 24px', background: ..., borderBottom: ... }
   New (correct):      { marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }

7. Use tone: 'ghost' as const in secondaryActions spread arrays to satisfy TypeScript:
   [...(!condition ? [{ label: '...', tone: 'ghost' as const, onClick: handler }] : []), ...]

8. Do NOT run any commands.
9. After each change, verify no TypeScript errors (static check — read imports and types).

Confirm when done:
- AdminConfigShell fully removed from this file
- No duplicate headers
- helpTopicId wired
- 0 TypeScript errors
```

---

## 5. Add a help topic for an admin master

Use this standalone prompt when you only need to add a missing help topic.

```
Add a help topic for the admin master "[key]" to IDMS-UI.

Tasks:
1. Open src/experience/help/helpTopics.ts.
   Check if id: '[key]' already exists. If it does, stop and report.
   If not, append a new HelpTopic object:
   {
     id: '[key]',
     title: '[label]',
     summary: '[One sentence describing what this page does.]',
     steps: [
       { title: '[Step 1 title]', description: '[What the user does in step 1.]' },
       { title: '[Step 2 title]', description: '[Step 2.]' },
       { title: '[Step 3 title]', description: '[Step 3.]' },
       { title: 'Activate the record', description: 'Set Status to Active once validated.' },
     ],
     tips: [
       '[Practical tip to prevent a common mistake.]',
       '[Edge case or boundary condition to watch for.]',
     ],
     commonMistakes: [
       '[The most common error users make on this page.]',
     ],
     relatedTopics: ['admin-dashboard'],
   }

2. Open scripts/check-help-topics.js.
   Add '[key]' to the REQUIRED_TOPICS array.

3. Do NOT run any commands.

Verify (static only):
- The id '[key]' in helpTopics.ts matches the key string exactly (case-sensitive).
- '[key]' is present in REQUIRED_TOPICS.
- The steps array has at least 3 entries with non-empty title and description.
```

---

## 6. Run governance and interpret results

Use this to run and interpret the governance checks.

> Note: Running commands requires user approval per AGENTS.md.
> If the user has approved running governance, use this prompt.

```
Run the IDMS-UI governance check and report the results.

Command to run:
  npm run ui:governance

Interpret the output:
- ✓ means the check passed.
- ✗ means the check failed — list every failure message exactly as printed.
- For each failure, identify the file and the specific rule violated.
- Do NOT auto-fix failures unless the user confirms.
- Do NOT run npm run dev, npm run build, npm install, or any test command.
```
