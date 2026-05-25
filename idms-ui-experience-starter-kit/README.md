# IDMS-UI Experience Starter Kit

This starter kit is a **code-first UI governance package** for the IDMS-UI project. It is designed for a React + TypeScript + Tailwind/MUI-style enterprise UI prototype where the current priority is **light, modern, guided, consistent customer experience**, not backend/database integration.

## What this kit is

This package gives your AI coding platform a strong starting point so it does not create empty folders, TODO-only files, or inconsistent UI patterns.

It contains:

- UI experience rule documents
- Phase 1 implementation plan for Admin + Header + Navigation + Help
- Reusable React/TypeScript experience components
- Help/guidance content files
- Navigation/command registry files
- Governance scripts to catch empty or placeholder files
- Storybook story examples
- AI prompts for safe integration
- Placement manifest explaining exactly where files should go

## What this kit is not

This is not a complete redesign of every screen. It is not backend work. It is not a database layer. It is not a replacement for your current app.

The kit should be copied into the project, then integrated in controlled slices:

1. Admin Dashboard vertical slice
2. Header + Sidebar + Command Palette
3. KYC page with AdminConfigShell
4. Other specialized admin pages
5. Future feature governance

## Recommended process

1. Copy the folders into the root of your IDMS-UI repo.
2. Ask your AI coding tool to read `PLACEMENT_MANIFEST.md` and `AI_INTEGRATION_PROMPTS.md`.
3. Run the first integration prompt only.
4. Build and fix issues.
5. Continue slice by slice.

Do not ask the AI to integrate everything at once.
