# iDMS-UI — Common UI Components & Form Layout Documentation

**Document Version:** 1.0  
**Date:** April 28, 2026  
**Prepared by:** Product Documentation Team  
**Application:** iDMS (Integrated Document Management System)  
**Platform:** Web Application (React + TypeScript)

---

## Purpose of This Document

This document provides a complete, business-friendly guide to every reusable user-interface (UI) component used in the iDMS application. It is written in simple, non-technical language so that business analysts, product owners, quality assurance testers, and end-users can understand:

- **What** each component does
- **Where** it appears on screen
- **How** a user interacts with it
- **Which source files** implement it

A dedicated section also explains the **Form Layout** system — how forms are visually structured, configured, and published.

---

## Intended Audience

| Role | How to use this document |
|---|---|
| Business Analysts | Understand component behavior for requirements mapping |
| Product Owners | Verify feature coverage and completeness |
| QA / Testers | Use as a reference for test-case creation |
| End Users / Trainers | Learn the interface before onboarding |
| Developers (new) | Quickly orient to the reusable component library |

---

## Project Overview

**iDMS** is a full-featured enterprise resource management system covering:

- **Procurement** — Purchase Requisitions, Purchase Orders, Receipts, Invoices, Returns
- **Sales** — Sale Orders, Allocations, Invoices, Deliveries, Returns
- **Inventory** — Stock tracking and warehouse operations
- **Services** — Service-related workflows

The UI is built with **React**, **TypeScript**, and **Material UI (MUI)**, and uses a library of shared, reusable components located in `src/components/common/` and `src/components/app/`.

---

## Table of Contents — Component Files

Each component is documented in its own file for easy reference:

| # | File | Component(s) Covered |
|---|---|---|
| 01 | This file | Cover, Overview, Table of Contents |
| 02 | [02_appshell.md](file:///./screenshots/02_appshell.md) | App Shell (Sidebar + Top Header) |
| 03 | [03_global_search.md](file:///./screenshots/03_global_search.md) | Global Search Panel |
| 04 | [04_common_data_grid.md](file:///./screenshots/04_common_data_grid.md) | Common Data Grid & Sortable Table Header |
| 05 | [05_catalogue_components.md](file:///./screenshots/05_catalogue_components.md) | Insight Cards, View Selector, View Configurator, Filter Drawer |
| 06 | [06_drawers_and_dialogs.md](file:///./screenshots/06_drawers_and_dialogs.md) | Side Drawer, Document Preview, Amount Breakdown, Chart Drawer, Grid Configurator |
| 07 | [07_dialogs_and_feedback.md](file:///./screenshots/07_dialogs_and_feedback.md) | Confirmation Dialog, Cancel Document, Compact Form Dialog, Success Summary, Guided Tour, Tour Invite |
| 08 | [08_form_controls_and_theme.md](file:///./screenshots/08_form_controls_and_theme.md) | Form Controls (Input, Select, Textarea, DatePicker), Status Badge, Theme Switcher, App Button |
| 09 | [09_form_layout_system.md](file:///./screenshots/09_form_layout_system.md) | Form Layout Settings, Editor, Preview, Grid Column Configurator |
| 10 | [10_critical_review_checklist.md](file:///./screenshots/10_critical_review_checklist.md) | Final Review, Devil's Advocate Checklist |

---

## Source File Directory Map

```
src/
├── components/
│   ├── common/           ← All shared/reusable UI components
│   │   ├── AppShell.tsx
│   │   ├── AppSidebar.tsx
│   │   ├── AppTopHeader.tsx
│   │   ├── appShellShared.ts
│   │   ├── CommonDataGrid.tsx
│   │   ├── SortableTableHeader.tsx
│   │   ├── dataGridTypes.ts
│   │   ├── gridKeyboard.ts
│   │   ├── GlobalSearchPanel.tsx
│   │   ├── DatePicker.tsx
│   │   ├── FormControls.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── SideDrawer.tsx
│   │   ├── ConfirmationDialog.tsx
│   │   ├── CancelDocumentDialog.tsx
│   │   ├── CompactFormDialog.tsx
│   │   ├── SuccessSummaryDialog.tsx
│   │   ├── DocumentPreviewDrawer.tsx
│   │   ├── PurchaseRequisitionPreviewDrawer.tsx
│   │   ├── AmountBreakdownDrawer.tsx
│   │   ├── DataGridChartDrawer.tsx
│   │   ├── DataGridConfigurator.tsx
│   │   ├── CatalogueInsightCards.tsx
│   │   ├── CatalogueViewSelector.tsx
│   │   ├── CatalogueViewConfigurator.tsx
│   │   ├── CatalogueFilterDrawer.tsx
│   │   ├── FormLayoutPreviewOverlay.tsx
│   │   ├── GridColumnConfigurator.tsx
│   │   ├── GuidedTour.tsx
│   │   ├── TourInvitePopup.tsx
│   │   ├── ThemeSwitcher.tsx
│   │   └── dataGridTypes.ts
│   └── app/              ← Foundation-level primitives
│       ├── AppButton.tsx
│       ├── AppDialog.tsx
│       ├── AppDrawer.tsx
│       └── AppFormPrimitives.tsx
├── pages/
│   └── form-layout/      ← Form Layout feature pages
│       ├── FormLayoutSettings.tsx
│       └── FormLayoutEditor.tsx
```
