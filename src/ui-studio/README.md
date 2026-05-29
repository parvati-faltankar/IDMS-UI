# UI Studio R1 Kickoff Module

This module is an isolated R1 kickoff implementation under `src/ui-studio/*` to respect hard-freeze boundaries.

## Included

- Typed metadata contracts (`types.ts`)
- Component registry v1 (`registry/*`)
- Renderer scaffold and runtime resolution (`renderer/*`)
- Create/Edit canonical sample metadata (`metadata/*`)
- Preview simulation contexts (`preview/*`)
- Validation engine for schema and binding checks (`validation/*`)
- Targeted tests for kickoff gates (`*.test.ts`)

## Hard Freeze Compliance

- No existing screens, routes, shared styles, or shared components are modified by this module.
- Integration into app routes/navigation is intentionally deferred until R1 gate pass and explicit approval.

