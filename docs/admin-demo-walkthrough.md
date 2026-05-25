# Admin Demo Walkthrough

**Audience:** Product demo, stakeholder review, UX handoff  
**Surface:** Admin area — System Configuration (`/admin`)  
**Phase:** Phase 1 — Core admin and master data setup  
**Prerequisites:** App running locally; demo data pre-seeded (Organisation, KYC, Picklist, Numbering pages populated)

---

## Overview

The admin experience lets an administrator configure master data, access rules, and system defaults before the operational team starts using transaction screens. This walkthrough covers the full Phase 1 admin surface from the landing page through the key configuration masters.

---

## 1. Landing on the Admin Dashboard

**Route:** `/admin`  
**Page title:** System Configuration  
**Shell:** `AdminShell` wrapping `AdminDashboard`

### What the user sees

- A persistent **GlobalHeader** bar across the top with:
  - The `ID` logo mark and the label **Admin**
  - A **search/command bar** (`Search or type a command…` with `Ctrl K` badge)
  - A **`?` help icon** button on the right
- The **AdminSidebar** on the left listing navigation groups
- The **page header** reading *System Configuration* with the description:  
  *"Configure master data, access controls, and business rules for your organisation. N masters across M modules."*

### Alert banners

Three dismissable alerts appear below the page header (each can be closed with ✕):

| Severity | Message |
|----------|---------|
| Warning  | Organisation Master is not fully configured — tax identifiers are missing |
| Error    | No active KYC rules found — party verification will fail for new records |
| Warning  | Picklist values for Delivery Mode and Payment Terms are not yet defined |

These alerts are contextual pre-flight checks. They are **dismissable per session** via the close button.

### Dashboard sections

Below the alerts, the dashboard is divided into:
1. **Setup Assistant** — guided checklist of the 5 setup areas
2. **Quick Access** — Favourites and Recently Visited cards
3. **All Modules** — full grid of all admin groups and their masters

---

## 2. Understanding the Admin Setup Assistant

**Component:** `AdminSetupAssistant`  
**Location:** First card on the Admin Dashboard

### What it shows

The Setup Assistant title reads **"Setup Assistant"** with the tagline:  
*"Complete these areas before your team starts working with transactions."*

Five setup items are displayed as a vertical checklist:

| # | Item | Status |
|---|------|--------|
| 1 | Organisation Setup | `needs-attention` (amber) |
| 2 | Numbering & Code Setup | `not-started` (grey) |
| 3 | Picklists & Reference Data | `not-started` (grey) |
| 4 | KYC & Verification Rules | `not-started` (grey) |
| 5 | Roles & Access Control | `not-started` (grey) |

Clicking any item navigates directly to the corresponding master page.

### Demo talking point

> "Before anyone creates a Purchase Order or Invoice, the system needs to know who the company is, how documents are numbered, what picklist values are valid, and what KYC rules apply. The Setup Assistant tracks that readiness in one place."

---

## 3. Opening Help — "How This Works"

**Trigger locations:**
- **PageHeader "How this works" button** — shown on each admin page when `helpTopicId` is set; opens the contextual help topic for that page
- **GlobalHeader `?` icon** — opens the global help drawer with the `admin-dashboard` topic by default
- **Within HelpDrawer** — related topic links allow navigation between help articles without leaving the current page

### Help flow

1. User lands on Admin Dashboard
2. Clicks **"How this works"** in the page header → `HelpDrawer` opens with topic `admin-dashboard`
3. User reads the contextual guide; can click related topic links → drawer updates topic in-place
4. User clicks **`?` icon** in GlobalHeader at any time → same drawer opens with current global topic
5. Navigating to a master page (e.g. KYC Setup) resets the help topic to `kyc-setup` automatically

### Demo talking point

> "Every page has its own help topic. Click 'How this works' to see a contextual guide for exactly what you're looking at — no need to open a separate documentation portal."

---

## 4. Using the Command Palette to Open KYC Setup

**Keyboard shortcut:** `Ctrl + K`  
**Click target:** The search bar in the GlobalHeader (`Search or type a command…`)

### Command palette behaviour

- Opens the `CommandPalette` overlay
- Recent masters appear at the top as **"Continue: [Label]"** commands (populated from localStorage)
- Type any keyword to filter; the palette supports fuzzy label + keyword matching

### Demo sequence

1. Press **Ctrl + K** (or click the search bar)
2. Type `kyc` → the result **"KYC & Verification Setup"** appears
3. Press **Enter** or click → navigates to `/admin/master/kyc-setup`
4. The KYC Setup page opens; the `helpTopicId` is already set to `kyc-setup`

### Available commands (relevant to Phase 1 demo)

| Command label | Action |
|---------------|--------|
| Admin Dashboard | navigate → `/admin` |
| Organisation Master | navigate → `/admin/master/organisation-master` |
| KYC & Verification Setup | navigate → `/admin/master/kyc-setup` |
| Picklist Master | navigate → `/admin/master/picklist-master` |
| Numbering & Code Setup | navigate → `/admin/master/numbering-code-setup` |
| Code Generation Policy | navigate → `/admin/master/code-generation-policy` |
| Browse All Admin Masters | navigate → `/admin/masters` |
| Help: Admin Overview | opens help drawer, topic `admin` |
| Help: Organisation Setup | opens help drawer, topic `organisation` |
| Help: Numbering & Codes | opens help drawer, topic `numbering` |
| Help: KYC Rules | opens help drawer, topic `kyc` |
| Help: Picklist Master | opens help drawer, topic `picklist` |

### Demo talking point

> "Power users never have to click through menus. One keystroke, a few characters, and they're on the page they need — even if it's buried five levels deep."

---

## 5. Navigating Admin Groups

**Left sidebar:** `AdminSidebar` — persistent across all admin pages  
**All Modules grid:** Bottom section of the Admin Dashboard

### Sidebar groups

The sidebar lists all admin module groups. The primary Phase 1 groups include:

| Group | Icon colour | Representative masters |
|-------|-------------|----------------------|
| Organisation | Blue | Organisation Master, Branch, Department, Employee, Designation |
| Users & Roles | Purple | User Master, Role Master, Permission Set |
| Location & Territory | Teal | Area Master, Territory, Pin-Code Zone |
| Products & Catalogue | Green | Product Group, Product Master, UOM |
| Finance & Accounts | Orange | Chart of Accounts, Tax Code, Currency |
| Logistics | Slate | Warehouse, Carrier, Delivery Zone |

### All Modules grid

Each module card on the dashboard shows:
- Group icon (coloured badge)
- Group name
- Top 3 master names as links
- **"View all N masters →"** link to see all masters in the group

### Demo sequence

1. Click **"Organisation"** in the sidebar → shows the group's masters in the sidebar panel
2. Click **"Organisation Master"** → navigates to `/admin/master/organisation-master` (form page with demo data pre-filled: *Tata Motors Limited*)
3. Use the **breadcrumb** (`Organisation`) to return to the group list

---

## 6. Opening Picklist Master

**Route:** `/admin/master/picklist-master`  
**Entry points:**
- Setup Assistant item 3: "Picklists & Reference Data"
- Command palette: type `picklist`
- Sidebar: navigate to the relevant group

### What the Picklist Master page shows

The Picklist Master manages reference data lists (like Status values, Document Types, Payment Terms) used across the application. The page uses `AdminConfigShell` with a two-panel layout:

- **Left panel:** List of picklist categories (e.g. Delivery Mode, Payment Terms, Party Type)
- **Right panel:** Values within the selected category, each with its own status

### Demo talking point

> "Picklists are the vocabulary of the system. If a dropdown anywhere in the app says 'Payment Terms', the values in that dropdown come from here. The admin controls the vocabulary."

---

## 7. Understanding Draft / Active / Inactive

This status lifecycle applies across all master records and picklist values:

| Status | Visual | Meaning |
|--------|--------|---------|
| **Active** | Green badge | Record is live and usable in transactions |
| **Inactive** | Grey badge | Record is hidden from transaction screens but retained for history |
| **Draft** | Muted badge | Record is being configured; not yet visible to end users |

### Lifecycle flow

```
New record → Draft → (review/configure) → Active → (retire) → Inactive
```

### Key demo points

- **Creating** a new master record always starts in **Draft** status
- Records can only be used in transactions when **Active**
- Deactivating a record does not delete historical data — it only prevents new references
- The status filter on list pages defaults to **All Status** (shows Active + Inactive); Draft records are always visible to admins

### Demo talking point

> "Nothing goes live accidentally. A new code or lookup value stays as Draft until the administrator explicitly activates it. Deactivation is reversible — no data is lost."

---

## 8. Using Field Help

**Component:** `FieldHelpPopover` (used within master form pages)  
**Location:** Small `?` icon displayed inline next to form field labels

### What it provides

Each complex or non-obvious field in a master form has an inline help popover that explains:
- What the field means
- How it affects downstream behaviour
- Example values

### Demo sequence on Organisation Master

1. Navigate to `/admin/master/organisation-master`
2. The page opens in **Edit** mode with demo data pre-filled (Tata Motors Limited)
3. Click the `?` icon next to **GST Number** → a popover explains format and validation rules
4. Click the `?` icon next to **Fiscal Year Start** → popover explains impact on financial period setup

### Demo talking point

> "We don't expect the admin to remember every field. Each field that needs explanation has an inline `?` — it answers the question without sending the user to a separate help article."

---

## 9. Returning to a Recently Visited Admin Master

**Feature:** Recently Visited records (localStorage-backed, session-persistent)

### Where it appears

1. **Quick Access card on the Admin Dashboard** — "Recently Visited" section with clock icon
2. **Command palette** — top of the result list, prefixed with **"Continue: [label]"** (up to 3 entries)

### How it works

Every time a user visits a master page (list or form), that master is recorded via `recordRecentAdminMaster()`. On the next session:
- The dashboard Quick Access card shows up to 5 recently visited masters
- The command palette surfaces up to 3 as priority "Continue:" commands

### Demo sequence

1. Navigate to KYC Setup, Picklist Master, and Numbering Settings (in that order)
2. Return to Admin Dashboard (`/admin`)
3. The **Recently Visited** card shows all three entries
4. Press **Ctrl + K** → top three palette results read "Continue: KYC & Verification Setup", "Continue: Picklist Master", "Continue: Numbering & Code Setup"
5. Click one to jump directly back

### Demo talking point

> "The system remembers where you left off. An admin who resumes work the next morning finds their recent masters right at the top — no hunting through menus."

---

## Demo Script (5-Minute Product Walkthrough)

> **Presenter note:** Run this script with demo data pre-loaded and the app on a fresh `/admin` route.

---

**[0:00 — 0:30] Setting the scene**

> "Before the team can start processing orders or invoices, the system needs to be configured. Let me show you the admin setup experience."

Land on `/admin`. Point to the **Setup Assistant** card.

> "The Setup Assistant is our pre-flight checklist. Organisation isn't fully configured yet — you can see it in amber. Everything else hasn't been started. Let me show you how fast it is to move through this."

---

**[0:30 — 1:15] Command palette navigation**

Press **Ctrl + K**. Type `kyc`.

> "I don't need to click through a menu. I'll just type what I want."

Select **KYC & Verification Setup** and open it.

> "One keystroke, one result. We're now in KYC setup. And notice the 'How this works' button at the top right — it opens a context-specific help guide for exactly this page."

---

**[1:15 — 2:00] Help drawer**

Click **"How this works"** on the KYC page.

> "This is the help drawer. It's scoped to the page you're on. If you want to jump to a related topic, you can click the links here without leaving the page."

Click a related topic link to demonstrate in-place navigation.

> "The help context updates as you move around. The admin never has to leave the configuration flow to get guidance."

---

**[2:00 — 2:45] Picklist Master and status lifecycle**

Navigate to **Picklist Master** (Ctrl + K → "picklist" or sidebar).

> "Picklists are the vocabulary of the application. Any dropdown in a transaction screen gets its values from here."

Select the **Payment Terms** category. Point to a **Draft** entry.

> "New values start as Draft — they're invisible to the rest of the system until the admin activates them. No accidental publishing."

---

**[2:45 — 3:30] Organisation Master (pre-filled demo data)**

Navigate to **Organisation Master** (Ctrl + K → "organisation").

> "The organisation master is where we define the legal identity of the company. You can see it's populated with demo data — five sections, each with a completion indicator."

Click between sections. Show the **Legal & Tax** section.

> "The required fields are highlighted. The section completion state shows at a glance what's still missing."

---

**[3:30 — 4:15] Recently visited and quick access**

Return to `/admin`.

> "Three masters visited. Let me show you what the system does with that."

Point to the **Recently Visited** Quick Access card showing KYC, Picklist, Organisation.

Press **Ctrl + K** — show the "Continue:" commands at the top.

> "The command palette surfaces the last three places you were. Coming back tomorrow, the admin picks up exactly where they left off."

---

**[4:15 — 5:00] Wrap-up**

> "To summarise: every master has contextual help built in, a status lifecycle that prevents accidental activation, and a command palette that eliminates menu hunting. The Setup Assistant keeps the pre-flight checklist visible until the system is ready. That's Phase 1 admin readiness."

---

## Acceptance Criteria for Demo Readiness

All items below must pass before a stakeholder demo is delivered.

### Navigation

- [ ] `/admin` loads the Admin Dashboard with the Setup Assistant visible
- [ ] All 5 Setup Assistant items are clickable and navigate to the correct master page
- [ ] The command palette opens with `Ctrl + K` and with a click on the GlobalHeader search bar
- [ ] Typing `kyc` in the palette surfaces "KYC & Verification Setup" as a result
- [ ] Typing `picklist` in the palette surfaces "Picklist Master" as a result
- [ ] Typing `organisation` in the palette surfaces "Organisation Master" as a result
- [ ] Sidebar groups render without overflow or clipping on 1280 × 800 viewport

### Help system

- [ ] Clicking **"How this works"** on any admin page opens the HelpDrawer with the page's specific help topic
- [ ] Clicking the **`?` icon** in the GlobalHeader opens the HelpDrawer
- [ ] Clicking a related topic link inside the HelpDrawer updates the topic in-place without closing the drawer
- [ ] HelpDrawer closes with the ✕ button and via Escape key

### Status lifecycle

- [ ] Creating a new master record defaults to **Draft** status
- [ ] Active records show a green status badge
- [ ] Inactive records show a grey badge
- [ ] Draft records show a muted badge
- [ ] Status filter on list pages shows Active and Inactive by default; admin can select any status

### Recently visited

- [ ] Visiting a master page adds it to the "Recently Visited" card on the Admin Dashboard
- [ ] The command palette shows up to 3 "Continue: [label]" commands after at least one master is visited
- [ ] Recently visited data persists across a page refresh (localStorage)

### Alerts

- [ ] The three alert banners render on the Admin Dashboard with correct severity colours (amber/red/amber)
- [ ] Each alert is individually dismissable with the ✕ button
- [ ] Dismissed alerts do not reappear on the same page session

### Demo data

- [ ] Organisation Master opens in edit mode with *Tata Motors Limited* demo data pre-filled across all 5 sections
- [ ] KYC Setup page loads without errors and shows a list of verification rule categories
- [ ] Picklist Master loads without errors and shows picklist categories in the left panel
- [ ] Numbering Settings page loads without errors and shows prefix/format configuration

### Build and governance

- [ ] `npm run build` — zero TypeScript errors in `src/admin/**` and `src/experience/**`
- [ ] `npm run ui:governance` — all 6 governance checks pass (empty-files, help-topics, stories, component-contracts, future-feature-standard, page-structure)

---

## Microcopy Changes Made for Demo Readiness

| File | Change | Reason |
|------|--------|--------|
| `src/admin/AdminDashboard.tsx` | "Setup assistant" → "Setup Assistant" | Sentence case inconsistency; looks unpolished in demo |
| `src/admin/AdminDashboard.tsx` | Alert 2: "No approval workflow…" → "No active KYC rules found…" | Original message refers to a Phase 2 feature (approval workflows); replaced with Phase 1-relevant context |
| `src/admin/AdminDashboard.tsx` | Alert 3: "Warehouse zone mapping…" → "Picklist values for Delivery Mode and Payment Terms…" | Warehouse is out of Phase 1 scope; picklist gap is directly demonstrable |
| `src/admin/AdminDashboard.tsx` | Added `onTopicChange` to `HelpDrawer` | Without it, clicking related topic links in the dashboard's help drawer did nothing |
