# Excellon Purchase Requisition UI

React + TypeScript + Vite implementation of the Excellon procurement experience, centered around the Purchase Requisition catalogue and create flows.

## What is in this project

- `PurchaseRequisitionCatalogueView` for catalogue, search, filter, and preview workflows
- `CreatePurchaseRequisition` for create and edit flows
- `AppShell` for shared navigation and page framing
- `src/styles/excellon-brand-guidelines.css` as the main brand-token and shared-style source

## Run locally

```bash
npm install
npm run dev
```

Useful scripts:

- `npm run dev` starts the Vite dev server
- `npm run lint` runs ESLint
- `npm run build` performs the TypeScript build and bundles the app
- `npm run preview` previews the production build

## Routing

The app uses hash-based routing in [src/App.tsx](./src/App.tsx).

Primary routes:

- `#/purchase-requisition` opens the Purchase Requisition catalogue
- `#/purchase-requisition/new` opens the create/edit screen
- `#/brand-guidelines` opens the design-system preview

Legacy hash aliases are preserved where they do not interfere with the current flow.

## Project structure

```text
src/
  components/
    AppShell.tsx
    common/
      FormControls.tsx
      SideDrawer.tsx
      StatusBadge.tsx
  hooks/
    useDialogFocusTrap.ts
  styles/
    excellon-brand-guidelines.css
    app-shell.css
  utils/
    classNames.ts
    dateFormat.ts
  App.tsx
  CreatePurchaseRequisition.tsx
  PurchaseRequisitionCatalogueView.tsx
  purchaseRequisitionCatalogueData.ts
  catalogueFilters.ts
```

## Shared component rules

The project-wide reference for reusable UI is:

- [docs/common-components.md](./docs/common-components.md)

Before creating a new button, input, drawer, badge, or page wrapper, check that document first and reuse an existing shared primitive when possible.

## Engineering conventions

- Prefer shared components from `src/components/common`
- Prefer shared helpers from `src/utils` for formatting and class composition
- Keep brand styling inside `src/styles/excellon-brand-guidelines.css`
- Preserve current routes and data contracts during refactors
- Run `npm run lint` before finalizing changes

## Notes

- Catalogue and create flows currently use local/mock purchase-requisition data from [src/purchaseRequisitionCatalogueData.ts](./src/purchaseRequisitionCatalogueData.ts)
- Brand and layout changes should flow through the token system instead of screen-local one-off styling
