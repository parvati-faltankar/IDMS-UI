# Admin Master Factory

Step-by-step instructions for adding new admin masters to IDMS-UI.
Follow the correct path for your master type, then run governance to confirm nothing is broken.

---

## 1. How to add a new generic admin master

A generic master is one that fits the standard list + form experience — a searchable sortable
table of records, each record edited through a tab-based form. Most new masters should be
generic unless there is a documented reason not to be.

**Step 1 — Add an entry to `adminNavConfig.ts`**

Open `src/admin/adminNavConfig.ts`. Find the appropriate group (see groups below).
Add a new entry using the `m()` helper:

```ts
m('tax-master', 'Tax Master', 'Define tax types and applicable rates'),
```

The `m()` helper signature is:
```ts
function m(key: string, label: string, description: string): AdminMasterItem
// → { key, label, description, path: `/admin/master/${key}` }
```

- `key` must be lowercase kebab-case and must be unique across all `adminNavConfig.ts` entries.
- `path` is auto-generated as `/admin/master/{key}` — do not hard-code it.
- `description` is one sentence, sentence-case, no trailing period.

**Step 2 — Add a help topic**

Open `src/experience/help/helpTopics.ts`. Add a `HelpTopic` object:

```ts
{
  id: 'tax-master',
  title: 'Tax Master',
  description: 'Configure tax types and the rates applied to transactions.',
  steps: [
    'Navigate to Finance & Pricing → Tax Master.',
    'Click New Tax to create a tax type.',
    'Set the rate, applicability and effective date.',
    'Activate the record to make it available in transactions.',
  ],
  tips: [
    'Inactive tax types are hidden from transaction dropdowns.',
    'You cannot delete a tax type that is referenced by existing transactions.',
  ],
},
```

Then open `scripts/check-help-topics.js` and add the topic id to `REQUIRED_TOPICS`:

```js
const REQUIRED_TOPICS = [
  'admin-dashboard',
  'organisation-master',
  'numbering-code-setup',
  'picklist-master',
  'code-generation-policy',
  'kyc-setup',
  'tax-master',  // ← add here
];
```

**Step 3 — Register the route**

Open `src/routes/routeConfig.ts`. The generic master list and form routes are already
present as dynamic `/:masterKey` and `/:masterKey/:recordId` entries under the `/admin/master/`
prefix. No new route definition is needed for a generic master — the existing wildcard handles it.

If your new key appears under a group that maps to a specialised shell (e.g. `document-code`),
confirm that no overriding static route blocks the generic handler.

**Step 4 — Done. Verify it works.**

Navigate to `AdminDashboard`, find the new master in the sidebar or via Ctrl+K, and confirm
the generic list view and form view render correctly with `PageHeader` and `HelpDrawer` wired.

---

## 2. How to add a new specialised admin master

Build a specialised page only when the generic `MasterListPage` / `MasterFormPage` cannot
represent the entity — for example, when the list view needs a custom summary strip, custom
row structure, a preview drawer, or when the form view requires `AdminConfigShell` section navigation.

**Step 1 — Follow Step 1 and Step 2 from the generic flow above.**
NavConfig + help topic are always required, regardless of page type.

**Step 2 — Create the page component**

Create a new file: `src/admin/masters/{PascalCaseKey}Page.tsx`

The component must follow this minimum structure:

```tsx
export default function TaxMasterPage() {
  const master = findMasterByKey('tax-master')!;
  const group  = findGroupForMasterKey('tax-master')!;

  // state: records, search, statusFilter, helpOpen, helpTopicId
  // state: previewRecord, openMoreMenuId, showAdvancedFilters

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <PageHeader
        title={master.label}
        description={master.description}
        breadcrumbs={[group.label]}
        primaryAction={{ label: 'New Tax', tone: 'primary', onClick: openAddForm }}
        helpTopicId="tax-master"
        onHelpClick={(id) => { setHelpTopicId(id); setHelpOpen(true); }}
      />

      {/* Summary strip */}

      {/* Toolbar: search + status chips + advanced filter */}

      {/* Table with clickable rows + MoreHorizontal menu */}

      {/* Empty state */}

      {/* Preview drawer (if needed) */}

      <HelpDrawer
        open={helpOpen}
        topicId={helpTopicId}
        onClose={() => setHelpOpen(false)}
        onTopicChange={setHelpTopicId}
      />
    </div>
  );
}
```

See `CodeGenerationPolicyPage.tsx` as the canonical reference implementation for specialised
list pages that use `AdminListPageShell`.

**For specialised list/table pages**, use `AdminListPageShell` as the inner shell:

```tsx
import { AdminListPageShell } from '../../experience/components/AdminListPageShell';

export default function TaxMasterPage() {
  const master = findMasterByKey('tax-master')!;
  const group  = findGroupForMasterKey('tax-master')!;

  // state: records, searchQuery, filterStatus, helpOpen, helpTopicId
  // state: previewRecord, openMoreMenuId, showAdvancedFilters

  return (
    <AdminListPageShell
      title={master.label}
      description={master.description}
      breadcrumbs={['Admin', group.label]}
      primaryAction={{ label: 'New Tax', tone: 'primary', onClick: openAddForm }}
      secondaryActions={[{ label: 'How this works', onClick: () => setHelpOpen(true) }]}
      helpTopicId="tax-master"
      onHelpClick={(id) => { setHelpTopicId(id); setHelpOpen(true); }}
      summaryItems={[
        { label: 'Total',    value: records.length },
        { label: 'Active',   value: records.filter(r => r.status === 'Active').length,   tone: 'success' },
        { label: 'Inactive', value: records.filter(r => r.status === 'Inactive').length, tone: 'danger'  },
      ]}
      searchValue={searchQuery}
      searchPlaceholder="Search code, name\u2026"
      onSearchChange={setSearchQuery}
      quickFilterItems={[
        { key: '',         label: 'All',      count: records.length },
        { key: 'Active',   label: 'Active',   count: records.filter(r => r.status === 'Active').length },
        { key: 'Inactive', label: 'Inactive', count: records.filter(r => r.status === 'Inactive').length },
      ]}
      activeQuickFilter={filterStatus}
      onQuickFilterChange={setFilterStatus}
    >
      {/* Table or EmptyStateGuide */}

      <HelpDrawer
        open={helpOpen}
        topic={cgpHelpTopic}
        onClose={() => setHelpOpen(false)}
        onTopicChange={setHelpTopicId}
      />
    </AdminListPageShell>
  );
}
```

**For specialised form/config pages**, use `AdminPageShell` or `AdminConfigShell` as before.

**Step 3 — Add a static route**

Open `src/routes/createRoutes.tsx`. Import your page and add a route inside the admin routes block:

```tsx
import TaxMasterPage from '../admin/masters/TaxMasterPage';

// inside the admin routes:
{ path: '/admin/master/tax-master', element: <TaxMasterPage /> },
```

The static route must be placed **before** the generic `/:masterKey` wildcard so it takes priority.

**Step 4 — Add a `component-contracts.md` entry**

Open `docs/component-contracts.md`. Add a row for the new component with its required files:

```
| TaxMasterPage | src/admin/masters/TaxMasterPage.tsx | No story required (page-level) |
```

---

## 3. Required adminNavConfig entry fields

Every master item in `adminNavConfig.ts` must supply these fields via the `m()` helper:

| Field | Type | Rules |
|---|---|---|
| `key` | `string` | Unique across all entries. Lowercase kebab-case. Must match the route segment. |
| `label` | `string` | Title-case. This is the display name in the sidebar, dashboard, and PageHeader. |
| `description` | `string` | One sentence. Sentence-case. No trailing period. Used as PageHeader description. |
| `path` (auto) | `string` | Auto-set to `/admin/master/{key}`. Do not set manually. |

The entry must live inside the correct `AdminNavGroup`. Do not create free-floating entries
outside a group. Group assignment determines the sidebar section, dashboard group card, and
the breadcrumb label that appears in PageHeader.

**Available groups:**

| `groupKey` | Label |
|---|---|
| `organisation` | Organisation |
| `user-access` | Users & Roles |
| `location` | Location & Territory |
| `business-partners` | Business Partners |
| `product-catalogue` | Products & Catalogue |
| `warehouse` | Warehouse & Inventory |
| `service` | Service Config |
| `complaint` | Complaints & Cases |
| `finance` | Finance & Pricing |
| `document-code` | Documents & Templates |
| `process-checklist` | Process & Checklists |
| `workshop` | Workshop Operations |

---

## 4. Required help topic

Every admin master must have a real help topic before it ships. Placeholder or empty topics
fail the `check-help-topics` governance script.

**Register in `src/experience/help/helpTopics.ts`:**

```ts
export const helpTopics: HelpTopic[] = [
  // existing topics ...
  {
    id: 'tax-master',                         // must match PageHeader.helpTopicId
    title: 'Tax Master',
    description: 'One-sentence summary of what this page does.',
    steps: [
      'Step 1 that a first-time user must take.',
      'Step 2.',
      'Step 3.',
      'Step 4 — activate the record to use it in transactions.',
    ],
    tips: [
      'Tip that helps prevent a common mistake.',
      'Edge case to watch out for.',
    ],
  },
];
```

**Register in `scripts/check-help-topics.js`:**

```js
const REQUIRED_TOPICS = [
  // existing ...
  'tax-master',   // ← topic id must appear here
];
```

Failing to add the id to `REQUIRED_TOPICS` means the governance check will not catch a
missing help topic in the future — always do both.

---

## 5. Storybook and governance expectations

### When a Storybook story is required

A `.stories.tsx` file is required for every **new reusable experience component** introduced
as part of the master. If the specialised page is entirely self-contained (no new shared component),
no story is required for the page itself.

New experience components live in `src/experience/components/`. Each must include:
- `ComponentName.tsx`
- `ComponentName.types.ts`
- `ComponentName.stories.tsx`
- `index.ts`

Missing any of these four files will fail `check-component-contracts.js`.

### Governance scripts that must pass

Run `npm run ui:governance` before opening a pull request. It runs six checks:

| Script | What it checks |
|---|---|
| `check-empty-files.js` | No file is empty or contains only placeholder text |
| `check-help-topics.js` | All ids in `REQUIRED_TOPICS` exist in `helpTopics.ts` with non-empty steps |
| `check-stories.js` | Every component directory under `src/experience/components/` has a `.stories.tsx` |
| `check-component-contracts.js` | Every component directory has all four required files |
| `check-future-feature-standard.js` | Required governance docs exist and contain all required sections |
| `check-page-structure.js` | Admin pages use approved shells and wire help correctly |

All six checks must pass. A single failure blocks merge.

Also run `npm run build` to confirm zero TypeScript errors. Governance checks pass even if
the TypeScript compiler has errors — the build check is separate.

---

## 6. Generator — scripts/create-admin-master.js

`scripts/create-admin-master.js` scaffolds a new admin master from the command line.
It validates all required arguments, prints exact `adminNavConfig.ts` and `helpTopics.ts`
snippets for you to copy, and (for specialized masters) writes the full page component.

### Usage

```bash
node scripts/create-admin-master.js --help
```

```bash
# Generic master (no page file — MasterListPage/MasterFormPage handle layout)
node scripts/create-admin-master.js \
  --key tax-master \
  --label "Tax Master" \
  --group finance \
  --description "Define tax types and applicable rates" \
  --type generic

# Specialized master (creates src/admin/masters/WarrantyPolicyPage.tsx)
node scripts/create-admin-master.js \
  --key warranty-policy \
  --label "Warranty Policy" \
  --group service \
  --description "Configure warranty coverage rules for products" \
  --type specialized
```

### Arguments

| Argument | Required | Values |
|---|---|---|
| `--key` | Yes | Unique lowercase kebab-case key |
| `--label` | Yes | Title Case display label |
| `--group` | Yes | One of the 12 valid group keys |
| `--description` | Yes | One sentence, sentence-case, no trailing period |
| `--type` | Yes | `generic` or `specialized` |
| `--help` | No | Print help and exit |

### What the generator does

**For generic:**
- Validates all arguments
- Prints the exact `adminNavConfig.ts` snippet to paste
- Prints the exact `helpTopics.ts` snippet to paste
- Prints the `check-help-topics.js` line to add
- Prints next steps (governance command)

**For specialized:**
- Creates `src/admin/masters/{Pascal}Page.tsx` with:
  - `AdminPageShell` wired: title, description, breadcrumbs, helpTopicId, summaryItems, toolbar, children
  - Summary strip (Total / Active / Draft / Inactive)
  - Search + status filter toolbar (list view)
  - Record table with More menu (Edit, Delete)
  - Empty state for zero records
  - Form with segmented section tabs (Overview / Settings / Advanced)
  - `HelpDrawer` wired
  - No duplicate header, no second command search, no TODO-only sections
- Prints all the same snippets as generic
- Prints the route import and `<Route>` element to add to `adminRoutes.tsx`

### Manual steps still required after running the generator

The generator does not modify existing files automatically (safe by design).
After running:

1. **Paste the `adminNavConfig.ts` snippet** into the correct group in `src/admin/adminNavConfig.ts`
2. **Paste the `helpTopics.ts` snippet** into `src/experience/help/helpTopics.ts`
3. **Add the key to `REQUIRED_TOPICS`** in `scripts/check-help-topics.js`

---

## 7. Smart Column Design

When building a specialised admin master list view, resist the default impulse to add one column
per field. Use the **Smart Admin Table Standard** (`docs/admin-page-structure-standard.md §7`)
to design the table before writing any code.

### Column design process

**Step 1 — List all fields you want to show.**
Write down every field you initially considered putting in the table.

**Step 2 — Classify each field.**

| Category | Column (show) | Preview drawer (demote) |
|---|---|---|
| Primary identity (code, name, label) | ✓ | Also shown in full |
| Business context (scope, module, entity) | ✓ grouped | Full detail |
| Key configuration (main differentiating value) | ✓ grouped | Full detail |
| Technical IDs, audit fields, timestamps | ✗ | ✓ |
| Secondary description text | ✗ | ✓ |

**Step 3 — Group into ≤5 columns using the standard pattern:**

```
Primary Identity | Business Context | Key Configuration | Status / Health | Actions
```

**Step 4 — Design the cell stack for each column.**
Each column cell can show 2–3 stacked items using font-size and colour hierarchy:

- Top row: primary label — 13 px, weight 600, `--color-text`
- Middle row: secondary context — 12 px, weight 500, `--color-text`
- Bottom row: tertiary / muted — 11 px, `--color-text-muted`

**Step 5 — Add a health signal to the Status / Health column.**
Derive a `PolicyHealth`-style type from the entity's field values:

- All required fields set + Active → **Healthy**
- Required fields missing → **Prefix Missing** / **Needs Review**
- Draft with incomplete config → **Draft Incomplete**
- Inactive → **Inactive**

### Example: applying smart column design to a new Warranty Policy master

Initial field list: Policy Code, Policy Name, Applicable For, Product Category, Coverage Type,
Duration (months), Labour Covered, Parts Covered, Status, Created Date.

After applying smart grouping:

| Column | Cell content |
|---|---|
| **Identity** | Policy Code (monospace) + Policy Name |
| **Scope** | Applicable For badge + Product Category |
| **Coverage** | Coverage Type + Duration + Labour/Parts flags |
| **Status / Health** | Status pill + health signal (e.g. "No duration" if Duration is 0) |
| **Actions** | Eye + MoreHorizontal |

Result: 5 columns, all key information visible without opening the record.

### Anti-patterns to avoid

| Anti-pattern | Fix |
|---|---|
| 8 separate technical columns | Group into ≤5 smart columns |
| Created Date as a visible column | Demote to preview drawer |
| Description text as a visible column | Demote to preview drawer or show truncated in Context column |
| 3+ visible action icons per row | Move extras to more menu |
| More menu with no backdrop | Add `<div style={{ position: 'fixed', inset: 0 }} onClick={close} />` |
| Status without health signal | Add `getHealthIndicator()` below the status pill |

See `CodeGenerationPolicyPage.tsx` `renderList()` for a complete worked example.
4. *(Specialized only)* **Add the route** to `src/routes/adminRoutes.tsx` before the `/:masterKey` wildcard
5. **Run:**
   ```bash
   npm run build           # must be 0 TypeScript errors
   npm run ui:governance   # all governance checks must pass
   ```

### Recommended workflow

```
1. Run the generator with --type generic or --type specialized
2. Follow the printed NEXT STEPS exactly
3. Run npm run ui:governance
4. Verify in browser: sidebar entry, Ctrl+K search, PageHeader, HelpDrawer
```

---

## 7. AI prompts

Use these prompts with GitHub Copilot or any AI tool when the generator script alone is
not sufficient (e.g. when adding domain-specific fields to a specialized page, or auditing
an existing master). Replace bracketed values before submitting.

See also `docs/prompt-library.md` for the full prompt library.

### 7a. Add a new generic admin master

```
Add a new generic admin master to IDMS-UI.

Master details:
- key: [kebab-case-key]
- label: [Title Case Label]
- description: [One sentence description, sentence-case, no period]
- groupKey: [one of: organisation | user-access | location | business-partners |
             product-catalogue | warehouse | service | complaint |
             finance | document-code | process-checklist | workshop]

Tasks:
1. Add the master to the correct group in src/admin/adminNavConfig.ts using the m() helper.
2. Add a HelpTopic object to src/experience/help/helpTopics.ts with:
   - id matching the key
   - title matching the label
   - description (one sentence)
   - steps array (4 steps that walk a first-time user through typical usage)
   - tips array (2 short tips)
3. Add the topic id to the REQUIRED_TOPICS array in scripts/check-help-topics.js.
4. Do NOT create a new page component — the generic MasterListPage and MasterFormPage
   handle this key automatically.
5. Do NOT modify any route files — the existing wildcard route covers it.
6. Do NOT run npm install, npm run dev, or npm test.

After making the changes, verify:
- No TypeScript errors in the modified files (static check only).
- The help topic id in helpTopics.ts matches the key exactly.
- The id is present in check-help-topics.js REQUIRED_TOPICS.
```

### 7b. Add a new specialized admin master

```
Add a new specialized admin master to IDMS-UI.

Master details:
- key: [kebab-case-key]
- label: [Title Case Label]
- description: [One sentence description, sentence-case, no period]
- groupKey: [one of: organisation | user-access | location | business-partners |
             product-catalogue | warehouse | service | complaint |
             finance | document-code | process-checklist | workshop]

Context:
- The file src/admin/masters/{PascalKey}Page.tsx already exists (generated by
  scripts/create-admin-master.js --type specialized).
- You are adding domain-specific fields and sections to it.

Tasks:
1. Replace the placeholder "Settings" section with real fields for this master.
   Use the same inline-style pattern as existing specialized pages
   (CodeGenerationPolicyPage.tsx, KycSetupPage.tsx, OrgMasterFormPage.tsx).
2. Replace the placeholder "Advanced" section if the master has advanced config fields
   (effective dates, visibility rules, etc.); otherwise remove it from SECTIONS.
3. Update the SEED_RECORDS array to reflect real-world sample data.
4. Update the ${pascal}Record interface to include all relevant domain fields.
5. Add the adminNavConfig.ts entry (m() helper in the correct group).
6. Add the helpTopics.ts entry with real steps and tips (not placeholder text).
7. Add the id to REQUIRED_TOPICS in scripts/check-help-topics.js.
8. Add the lazy import and <Route> to src/routes/adminRoutes.tsx BEFORE the /:masterKey wildcard.
9. Do NOT run npm install, npm run dev, npm run build, or npm test.
10. Do NOT add a second header — AdminPageShell already renders the page header.
11. Do NOT add a second search bar in the form view — the toolbar prop handles it.

After making the changes:
- Verify no TypeScript errors (static check only — read imports, check types).
- Confirm helpTopicId matches the key in adminNavConfig.ts exactly.
```

### 7c. Audit an existing admin master

```
Audit the admin master page at src/admin/masters/[PascalKey]Page.tsx.

Check for these violations and fix any that exist:

STRUCTURAL VIOLATIONS (must fix):
1. Does the page use AdminPageShell? If it still uses AdminConfigShell, migrate it.
2. Does the page pass helpTopicId to AdminPageShell? If not, add it.
3. Is there a matching id in src/experience/help/helpTopics.ts? If not, add a real topic.
4. Is the id listed in scripts/check-help-topics.js REQUIRED_TOPICS? If not, add it.
5. Does the page render a duplicate header (PageHeader inside AdminPageShell, or a manual
   title div)? If so, remove it — AdminPageShell owns the header.
6. Does the list view have a duplicate search bar outside the toolbar prop? Remove it.

QUALITY VIOLATIONS (should fix):
7. Are any import statements for removed components still present (ArrowLeft, HelpCircle,
   AdminConfigShell, AdminConfigSectionItem)? Remove them.
8. Are there any unused local variables (totalCountable, completedCount, allOk,
   computedSections) that were only used in the removed shell? Remove them.
9. Does AdminPageShell receive summaryItems? If not, add Total / Active / Draft / Inactive.
10. Does the form view pass statusLabel and statusTone to AdminPageShell? If not, add them.

Do NOT run any commands. Report all violations found and apply fixes for each one.
```
