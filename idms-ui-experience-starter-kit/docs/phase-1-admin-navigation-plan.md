# Phase 1: Admin, Header, Navigation, and Help Plan

## Phase Goal

Create the experience foundation for the project before improving transaction screens.

Scope:

- Admin dashboard
- Admin shell
- Admin navigation
- Global/page header pattern
- Help and guidance system
- Reusable admin configuration shell
- Basic governance scripts

Out of scope:

- Backend/database
- API integration
- Transaction screen redesign
- Complete visual regression setup for all pages
- Rewriting all admin pages in one pass

## Phase 1A — Admin Dashboard Vertical Slice

Implement:

- `PageHeader`
- `HelpDrawer`
- `AdminSetupAssistant`
- `helpTopics.ts`
- Admin dashboard integration
- Empty-file and help-topic governance checks

Success criteria:

- Admin dashboard looks cleaner and more guided.
- Page has a clear title, description, help entry, and setup assistant.
- Existing admin route continues to work.
- No transaction screens are touched.

## Phase 1B — Header and Navigation

Implement:

- `GlobalHeader`
- `SmartSidebar`
- `CommandPalette`
- `navigationGroups.ts`
- `commandRegistry.ts`

Success criteria:

- Navigation is grouped and not overwhelming.
- Admin masters are discoverable through group navigation and command search.
- Recent and favorite concepts are available.
- User can quickly open important admin pages.

## Phase 1C — Specialized Admin Shell

Implement:

- `AdminConfigShell`
- `ValidationChecklist`
- `FieldHelpPopover`
- Apply first to `KycSetupPage`
- Then apply to Picklist, Numbering, Code Generation Policy, and Organisation

Success criteria:

- Specialized admin pages share a common structure.
- Each page has help, section navigation, status, and validation guidance.
- Page-specific behavior remains intact.

## Phase 1D — Governance and Future Feature Standard

Implement:

- Story coverage check
- Help topic check
- Component contract check
- Future feature standard check

Success criteria:

- New work cannot silently bypass the UI standards.
- AI-generated empty or placeholder files fail checks.
- Future features follow the same process.

## Migration Rule

Migrate one page at a time. Do not batch-convert all screens until one page is proven.
