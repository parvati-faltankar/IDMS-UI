# Future Feature Implementation Standard

Every future UI feature must follow this process.

## Before implementation

1. Identify the user goal.
2. Identify the correct page shell.
3. Identify existing components that should be reused.
4. Define primary action and secondary actions.
5. Define help/guidance needs.
6. Define empty/loading/error states.
7. Define Storybook story requirements.
8. Confirm the feature does not duplicate an existing component.

## During implementation

Rules:

- Use `PageHeader` for page-level title/actions/help.
- Use approved shell components.
- Do not create one-off drawer/dialog/header components.
- Keep UI light and uncluttered.
- Use progressive disclosure.
- Add help content for admin/configuration features.
- Add story files for reusable components.

## After implementation

Run:

- Build
- Empty file check
- Help topic check
- Story check
- UI audit check

## Acceptance checklist

A feature is accepted only if:

- It has one clear primary action.
- Advanced actions are not overexposed.
- It uses approved components or has a documented reason not to.
- It has meaningful labels and empty states.
- It does not introduce duplicate layout patterns.
- It passes governance scripts.
