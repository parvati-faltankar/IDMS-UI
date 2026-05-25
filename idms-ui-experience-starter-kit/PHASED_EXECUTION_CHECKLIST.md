# Phased Execution Checklist

## Phase 1A — Admin Dashboard vertical slice

- [ ] Copy starter kit into repo.
- [ ] Merge package scripts from `package-scripts-snippet.json`.
- [ ] Ask AI to integrate only PageHeader, HelpDrawer, and AdminSetupAssistant into AdminDashboard.
- [ ] Run build.
- [ ] Run `node scripts/check-empty-files.js`.
- [ ] Run `node scripts/check-help-topics.js`.
- [ ] Confirm no transaction screen changed.

## Phase 1B — Header and navigation

- [ ] Integrate GlobalHeader.
- [ ] Integrate CommandPalette.
- [ ] Improve AdminSidebar using SmartSidebar or its config pattern.
- [ ] Add command navigation for important admin pages.
- [ ] Run build and UI audit.

## Phase 1C — KYC specialized shell

- [ ] Apply AdminConfigShell to KYC Setup only.
- [ ] Add ValidationChecklist.
- [ ] Add FieldHelpPopover for complex fields.
- [ ] Connect kyc-setup help topic.
- [ ] Run build and UI audit.

## Phase 1D — Other specialized admin pages

- [ ] Picklist Master.
- [ ] Numbering & Code Setup.
- [ ] Code Generation Policy.
- [ ] Organisation Master.
- [ ] Run full UI audit.

## Phase 2 — Transaction screens later

Do not start until Phase 1 is stable.
