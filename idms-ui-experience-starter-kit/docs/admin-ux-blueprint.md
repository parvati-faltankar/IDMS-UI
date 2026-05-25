# Admin UX Blueprint

## Admin Experience Goal

The admin panel should feel like a guided setup workspace, not a raw database maintenance area.

Users should be able to answer:

1. What setup is complete?
2. What setup is pending?
3. What should I do next?
4. What does this setting affect?
5. Can I safely activate this configuration?

## Admin Dashboard Structure

Recommended sections:

- PageHeader with help
- AdminSetupAssistant
- Recently visited masters
- Important setup shortcuts
- Needs attention panel
- Optional getting-started guide

## Admin Navigation Structure

Admin groups should follow business meaning:

1. Organisation
2. Users & Roles
3. Location & Territory
4. Business Partners
5. Products & Catalogue
6. Warehouse & Inventory
7. Service Config
8. Complaints & Cases
9. Finance & Pricing
10. Documents & Templates
11. Process & Checklists
12. Workshop Operations

Do not show all masters expanded by default.

## Specialized Admin Page Pattern

Specialized admin pages should use:

- Page title and description
- Status badge: Draft / Active / Inactive
- Section navigation
- Main form area
- Help drawer
- Validation checklist
- Save Draft / Activate actions

Applies to:

- Organisation Master
- Numbering & Code Setup
- Picklist Master
- Code Generation Policy
- KYC Setup

## Generic Master Page Pattern

Generic pages should use:

- PageHeader
- Search
- Minimal filters
- Table/list
- Row actions hidden in menu
- Create/Edit form pattern
- Empty-state guide

## Guidance Rules

Admin pages must include:

- What this page is for
- When to use it
- Setup steps
- Common mistakes
- Activation requirements

## Draft / Active / Inactive Lifecycle Copy

Draft: Configuration is saved but not yet used in runtime workflows.

Active: Configuration is valid and available for transaction/runtime use.

Inactive: Configuration is retained for reference but hidden from new runtime usage.
