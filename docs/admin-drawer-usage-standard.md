# Admin Drawer Usage Standard

This document defines when to use drawers in admin pages, what types of drawers exist,
and how every drawer must be structured. All new admin pages must follow this standard.

---

## 1. Decision rule

| Operation type | Use |
|---|---|
| Quick contextual, reversible, fits in one screen | **Drawer** |
| Complex, long, multi-step, Draft → Active lifecycle | **Full page** |
| Confirmation or small binary decision | **Dialog** |
| Single low-risk field update | **Inline edit** |

Do **not** default to drawers for complex configuration. Drawers are for contextual
operations that keep the user on the list, not replacements for guided setup flows.

---

## 2. Drawer types

### 2a. Preview Drawer
**Purpose:** Show a record's key details from a list without losing table context.

Use when:
- User clicks a row in a list or presses the Eye/View icon.
- User needs to inspect details before deciding to edit.
- The view would otherwise navigate to a full separate page for read-only content.

Do not use when:
- The record has a complex guided form that must be edited on a dedicated page.

Width: `lg` (680 px)

---

### 2b. Quick Create Drawer
**Purpose:** Create a new simple master record without leaving the list.

Use when:
- The master has a small/simple form (≤ 8 fields, no multi-section setup).
- No Draft → Active lifecycle is required.
- The user should return immediately to the same list and position.

Do not use when:
- The form has multiple sections or a guided activation workflow.
- Fields require complex dependency lookups or multi-step config.

Width: `md` (520 px)

---

### 2c. Quick Edit Drawer
**Purpose:** Edit a simple record without leaving the list view.

Use when:
- The record has a small editable form (same criteria as Quick Create).
- The user needs to preserve filters, sort order and table position.

Do not use when:
- The edit requires navigating through multiple steps.
- Fields change other data in complex ways.

Width: `md` (520 px)

---

### 2d. Help Drawer
**Purpose:** Contextual guidance longer than a tooltip but scoped to the current page.

Use when:
- User clicks "How this works" or a field-level help trigger.
- Content is informational, not actionable.

Width: `md` (max-w-md / ~448 px)
Reference: `src/experience/components/HelpDrawer`

---

### 2e. Filter Drawer
**Purpose:** Advanced or optional filtering for table pages.

Use when:
- Filter options are many or optional.
- Common filters remain visible as quick-filter chips.
- The filter panel is too wide for a toolbar row.

Width: `sm` (400 px)

---

### 2f. Review Drawer
**Purpose:** Summary review and confirmation before an activation, publish, or
destructive action.

Use when:
- User is activating, publishing, or confirming a configuration.
- A checklist and summary grid are needed before the final action.

Width: `lg` (680 px)

---

### 2g. Dependency Drawer
**Purpose:** Show linked records, related setup, or downstream dependencies.

Use when:
- User needs to understand what depends on this record before editing or deactivating.

Width: `lg` (680 px)

---

### 2h. Activity / History Drawer
**Purpose:** Audit log, usage stats, recent changes, lifecycle events.

Use when:
- User needs a change history without leaving the current context.

Width: `lg` (680 px)

---

## 3. When NOT to use a drawer

Never use a drawer when:
- The form is long or has multiple sections (3+ sections).
- The workflow includes Draft → Active lifecycle with complex validation.
- The setup requires review across many configuration steps.
- The total content would be taller than `80vh` in a typical drawer.
- The user needs full-page focus without surrounding list context.
- The operation creates side effects that require further navigation.

**Mandatory full-page flows (do not convert to drawers):**
- Organisation Master form
- KYC Setup configuration form
- Picklist multi-level configuration
- Code Generation Policy create/edit
- Numbering & Code Setup configuration

---

## 4. Drawer layout standard

Every drawer — regardless of type — must have:

```
┌─────────────────────────────────────┐
│ Header                              │  ← fixed, flexShrink: 0
│  Title · Subtitle                   │  ← 56–68px total
│  [Status badge?]                    │
│  [Close ×]                          │
├─────────────────────────────────────┤
│ Body                                │  ← flex: 1, overflowY: auto
│  Scrollable content                 │
│  (summary fields / form / review)   │
├─────────────────────────────────────┤
│ Footer                              │  ← fixed, flexShrink: 0
│  [Secondary] ... [Primary]          │  ← 52–60px total
└─────────────────────────────────────┘
```

**Required elements:**
- Header with title, optional subtitle, and a close button (×)
- Scrollable body region
- Footer with clear actions (at minimum a close / cancel action)
- Loading state (skeleton or spinner inside the body)
- Empty state (icon + text inside the body when no data)
- Error state (inline error strip inside the body)
- Dirty-state warning before close if the drawer contains an unsaved form

**Accessibility:**
- `role="dialog"` with `aria-modal="true"` on the drawer root
- Logical focus management — focus moves to drawer on open, returns on close
- Close button has `aria-label="Close"`
- Backdrop click closes the drawer

---

## 5. Width rules

| Token | Pixels | Use |
|---|---|---|
| `sm` | 400 | Narrow: read-only summary, filter |
| `md` | 520 | Quick create/edit, simple form |
| `lg` | 680 | Preview with sections, review, dependency |
| `xl` | 840 | Complex preview, wider detail view |

Do not create custom widths. Use these four tokens.
Do not create drawers wider than `xl` (840 px) — use a full page instead.

---

## 6. Component reference

Use these components from `src/experience/components/`:

| Need | Component |
|---|---|
| Base drawer shell | `SmartDrawer` |
| Record detail preview from list | `SmartPreviewDrawer` |
| Quick create/edit form | `SmartFormDrawer` |
| Activation/review confirmation | `SmartReviewDrawer` |
| Help/guidance content | `HelpDrawer` |

Do not create one-off drawer wrappers outside these. Reuse and extend.

---

## 7. Governance warnings

`npm run ui:governance` runs `scripts/check-drawer-usage.js` which warns on:

| Pattern | Severity |
|---|---|
| Admin list row `onClick` navigates to full page for view-only (no preview drawer) | WARN |
| Drawer component has no close button | WARN |
| Drawer component has no footer | WARN |
| Form drawer has no dirty-state warning implementation | WARN |
| Complex multi-step form forced into a drawer | WARN |
| Drawer body has no overflow scroll | WARN |

---

*See `docs/admin-page-structure-standard.md §11` for integration with the page structure standard.*
