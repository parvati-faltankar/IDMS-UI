# Agent Instructions

## Primary Rule

Work only on the specific task requested by the user. Do not expand scope unless the user explicitly approves it.

## Rate-Limit and Command Discipline

This repository should be handled in a low-command, low-token manner.

Do not run the application unless the user explicitly asks.

Do not run:
- development servers
- production servers
- browser automation
- screenshot tools
- Playwright
- Cypress
- Selenium
- Storybook
- full test suites
- full builds
- full repository formatting
- package installation commands

Examples of commands that require explicit user approval:
- `npm run dev`
- `yarn dev`
- `pnpm dev`
- `npm start`
- `npm run build`
- `pnpm build`
- `yarn build`
- `npm test`
- `pnpm test`
- `yarn test`
- `npx playwright test`
- `npx cypress run`
- `docker compose up`
- `npm install`
- `pnpm install`
- `yarn install`

## Small Fix Behavior

For small bug fixes or one-line changes:

1. Identify the most relevant file(s).
2. Read only what is necessary.
3. Make the smallest safe change.
4. Do not run the project.
5. Do not take screenshots.
6. Do not run unrelated checks.
7. Do not refactor surrounding code unless needed for the fix.

## Verification

Prefer static verification:
- type consistency by reading the code
- import/export checks
- obvious syntax review
- local reasoning
- minimal targeted checks only when necessary

Before running any expensive command, ask the user for permission and explain why it is needed.

## File Scope

Do not modify unrelated files.

Do not modify these unless the task specifically requires it:
- lock files
- generated files
- build output
- dependency files
- environment files
- CI files
- global config files

## Communication

Always summarize:
- files changed
- exact reason for each change
- commands run, if any
- commands intentionally not run
- manual verification the user can do in VS Code
