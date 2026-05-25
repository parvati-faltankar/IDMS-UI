# Help Microcopy Library

Reference library for all admin help text, field guidance, and microcopy patterns.
Keep all help text in `src/experience/help/` — never place lengthy guidance directly in form components.

---

## Help Architecture

| Surface | File | Used by |
|---|---|---|
| Help drawer topics | `helpTopics.ts` | `HelpDrawer` via `getHelpTopic(id)` |
| Field popovers | `fieldHelp.ts` | `FieldHelpPopover` via `getFieldHelp(key)` |
| Setup sequence guides | `adminGuides.ts` | `AdminDashboard`, `AdminSetupAssistant` |
| Type definitions | `helpTypes.ts` | All of the above |

---

## Help Topics Registry

Each topic follows `HelpTopic`:
```
id · title · summary · steps[] · tips[] · commonMistakes[] · relatedTopics[]
```

### admin-dashboard
**When**: User opens Admin Setup for the first time or returns after a break.
**What it covers**: Setup sequence, go-live readiness checklist, navigating recently visited items.
**Next step tip**: Start with organisation-master.

### organisation-master
**When**: User is on the Organisation Master form.
**What it covers**: Legal entity details, branches, tax identifiers, branding, activation.
**Common mistake**: Activating before entering tax numbers, skipping branch setup, low-res logo.

### picklist-master
**When**: User opens the Picklist Configuration page.
**What it covers**: Simple vs Dependent vs Multi-level lists, adding values, parent-child mapping, activation.
**Common mistake**: Saving values without activating — dropdown appears empty in transaction forms.

### numbering-code-setup
**When**: User opens the Numbering & Code Setup page.
**What it covers**: Prefix creation, series type, reset frequency, number consumption event, activation.
**Common mistake**: Changing prefix after first use, same prefix for two entity types.

### code-generation-policy
**When**: User opens a Code Generation Policy record.
**What it covers**: Policy-entity mapping, prefix selection, padding, special characters, preview, activation.
**Common mistake**: Using a Draft prefix — policy activation fails.

### kyc-setup
**When**: User opens the KYC Setup page.
**What it covers**: Entity + entity type selection, proof rows, number validation, attachment rules, activation.
**Common mistake**: Leaving proof rows in Draft — validation never applies.

### generic-master-list
**When**: User lands on any admin master list page without a dedicated page.
**What it covers**: Search/filter, status meaning, row actions, bulk operations, adding records.
**Common mistake**: Editing an Active record without checking transaction impact.

### generic-master-form
**When**: User opens any admin master create/edit form without a dedicated form.
**What it covers**: Draft → Active → Inactive lifecycle, tab navigation, Save Draft, validation checklist, activation.
**Common mistake**: Navigating away without saving.

---

## Field Help Registry

Each entry follows `FieldHelp`:
```
key · title · description · example
```

### regexPattern
Use only for government-issued IDs with fixed formats. Common patterns:
- PAN: `^[A-Z]{5}[0-9]{4}[A-Z]$`
- Aadhaar: `^[2-9]{1}[0-9]{11}$`
- Passport: `^[A-Z]{2}[0-9]{8}$`
- GSTIN: `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$`

Leave blank to accept any text within configured length limits.

### prefixValue
- Max 4–6 characters recommended
- Use ALL CAPS by convention: `INV`, `SO`, `PO`, `CUST`, `SUPP`
- Must be unique across all active numbering configurations
- Cannot be changed after first document is generated

### seriesType
- **Numeric**: plain integers — use for most cases
- **Alphanumeric**: letters after numeric limit — use when annual volumes exceed the padding length

### resetFrequency
- **Never**: growing sequence, no resets — use for customer/supplier codes
- **Financial Year**: resets on financial year start configured in Organisation Master — use for invoices, orders
- **Calendar Year**: resets on 1 January — use only if your reporting cycle is calendar-year-based

### numberConsumptionEvent
- **OnSave**: number assigned when draft is saved — risk of gaps from abandoned drafts
- **OnSubmit**: number assigned on formal submission — no gaps, preferred for invoices and audited documents

### allowedSpecialCharacters
Standard separators: `-` (hyphen), `/` (slash).
Avoid: `&`, `<`, `>`, `%`, `#`, `@` — conflict with URLs, HTML, and file systems.

### proofCategory / proofType
Standard categories: Identity · Address · Tax · Business · Financial
Each category can contain multiple proof types with different format rules.

### attachmentRules
- **Required**: blocks submission without file upload — use for primary identity and tax proofs
- **Optional**: user can skip attachment — use for secondary or supporting proofs

### entityType
Match to the most specific available sub-type.
Standard hierarchy: Customer / Supplier / Employee / Partner → Individual / Corporate / Domestic / Foreign

---

## Lifecycle State Microcopy

Use these exact label strings in status badges and chips:

| State | Label | Colour token |
|---|---|---|
| Draft | `Draft` | `--color-status-draft` |
| Active | `Active` | `--color-status-active` |
| Inactive | `Inactive` | `--color-status-inactive` |
| Unsaved changes | `Unsaved changes` | `--color-status-warning` (amber) |
| Saved | `Saved` | `--color-status-active` (green) |

---

## Tone and Style Rules

1. **Be direct** — address the user as "you". Say "Select the entity type" not "The entity type should be selected".
2. **Lead with the action** — start tips and steps with a verb: "Enter", "Select", "Confirm", "Avoid".
3. **Name the consequence** — tell users what happens if they get it wrong: "Causes gaps in numbering", "Blocks submission".
4. **Avoid jargon** — use "document number format" not "input mask pattern"; use "when the counter resets" not "reset epoch".
5. **Keep descriptions under 3 sentences** — if longer, split into steps.
6. **Examples are mandatory for technical fields** — regex, prefix, series type always need an `example`.
7. **Never put help text directly in labels or placeholders** — route through `FieldHelpPopover` or `HelpDrawer`.

---

## Adding a New Help Topic

1. Add entry to `src/experience/help/helpTopics.ts` following the `HelpTopic` type.
2. If required for governance, add the topic ID to `scripts/check-help-topics.js` REQUIRED_TOPICS.
3. Wire the `helpTopicId` prop on the page's `PageHeader` component.
4. Wire `onTopicChange` on the page's `HelpDrawer` to enable related topic navigation.
5. Add the topic to this document under **Help Topics Registry**.

## Adding a New Field Help Entry

1. Add entry to `src/experience/help/fieldHelp.ts` following the `FieldHelp` type.
2. Use the exact field name as the key (e.g., `prefixValue` matches the form field name).
3. Render via `<FieldHelpPopover fieldKey="prefixValue" />` next to the form label.
4. Add the field to this document under **Field Help Registry**.
