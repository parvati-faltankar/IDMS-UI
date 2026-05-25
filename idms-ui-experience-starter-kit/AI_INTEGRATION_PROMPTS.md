# AI Integration Prompts

Use these prompts in Copilot, Codex, Claude, or another repo-aware AI coding tool.

## Prompt 1 — Read and plan only

```text
You are working on the IDMS-UI React/TypeScript project.

Read these files first:
- PLACEMENT_MANIFEST.md
- docs/ui-experience-constitution.md
- docs/phase-1-admin-navigation-plan.md
- docs/component-contracts.md
- docs/admin-ux-blueprint.md

Do not modify code yet.

Task:
1. Identify existing files for AdminShell, AdminSidebar, AdminDashboard, and specialized admin pages.
2. Explain how you will integrate the first vertical slice only.
3. Confirm that you will not touch transaction screens.
4. Confirm any package/dependency issues before coding.
```

## Prompt 2 — First vertical slice implementation

```text
Implement only the first vertical slice.

Scope:
- Use src/experience/components/PageHeader in AdminDashboard.
- Use src/experience/components/AdminSetupAssistant in AdminDashboard.
- Use src/experience/components/HelpDrawer with help topic admin-dashboard.
- Preserve existing admin route and behavior.
- Do not touch transaction screens.
- Do not integrate SmartSidebar, CommandPalette, or AdminConfigShell yet.

Rules:
- No empty files.
- No TODO-only files.
- No placeholder UI.
- No lorem ipsum.
- Keep the UI light, modern, and not heavy.
- Reuse existing CSS variables and Tailwind/MUI conventions.

After implementation:
- Run npm run build.
- Run node scripts/check-empty-files.js.
- Run node scripts/check-help-topics.js.
- Fix issues.
- Summarize changed files.
```

## Prompt 3 — Header and navigation phase

```text
Now implement Phase 1B: header and navigation.

Scope:
- Integrate GlobalHeader into the app shell/admin shell if applicable.
- Integrate SmartSidebar into AdminSidebar or use its patterns to improve AdminSidebar.
- Add CommandPalette access from the header.
- Use navigationGroups and commandRegistry.
- Keep admin navigation grouped and minimal.
- Preserve existing admin routes.
- Do not redesign transaction screens.

Success criteria:
- Admin masters are grouped clearly.
- Recently visited and favorites areas are supported or prepared.
- Command palette can navigate to admin dashboard, KYC setup, picklist, numbering, and code generation policy.
- UI remains clean and not heavy.
```

## Prompt 4 — Specialized admin shell phase

```text
Now implement Phase 1C: AdminConfigShell for one page only.

Target page:
- src/admin/masters/KycSetupPage.tsx

Scope:
- Use AdminConfigShell to standardize title, description, section navigation, status, help, and validation area.
- Preserve existing KYC logic and data behavior.
- Use ValidationChecklist where useful.
- Use FieldHelpPopover only for complex fields such as regex, attachment rules, proof category, and entity type.
- Do not convert other admin pages yet.

Success criteria:
- KYC page feels cleaner and more guided.
- Existing functionality remains intact.
- Help topic kyc-setup is connected.
- Build passes.
```

## Prompt 5 — Future feature rule

```text
For every new UI feature from now on, follow docs/future-feature-standard.md.

Before implementation:
- Identify the correct shell.
- Reuse existing experience components.
- Add help content if the feature is admin/configuration-related.
- Add empty/loading/error states where relevant.
- Add or update Storybook stories.
- Do not create one-off layout components without reason.

After implementation:
- Run build.
- Run UI governance scripts.
- Summarize compliance with the UI audit checklist.
```
