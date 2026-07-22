# CLAUDE.md — IDMS UI

Guidance for Claude (and any contributor) working in this repository. This file governs an **active design-system migration**. Read it fully before changing UI code, and keep changes compliant with the rules below.

> **Status:** migration in progress. This is a living document — update it as phases land and when conventions change.

---

## 1. What this project is

- **App:** Excellon IDMS UI — an automotive **Dealer / Workshop Management System** (modules: Vehicle, Service, Spare Parts, Finance). Data-heavy internal software: masters, list screens, create/edit forms, dashboards, drawers.
- **Stack:** React 19 + Vite + TypeScript, **Tailwind v4**, **MUI v9** (`@mui/material` + Emotion), `react-router-dom` v7, `lucide-react` icons, `recharts`, Storybook, Vitest.
- **Scale:** ~283 `.tsx/.ts` files; ~30 screens under `src/pages/**` (12 domains), ~121 files under `src/admin/masters/**` (14 modules), higher-order shells in `src/experience/**`, a metadata-driven builder in `src/ui-studio/**`.

## 2. Migration mission

Replace the app's **design-system foundation** with the **Excellon Design System** authored in Claude Design (`claude.ai/design`, project `6f97bcb3-416d-43f9-9b76-5e4c09f6a2e3`), plus make the app fully responsive, cross-browser, and installable as a PWA. Four workstreams:

1. **DS foundation (tokens only)** — adopt Excellon DS colors/type/spacing/radius/shadows; keep existing components.
2. **Full responsive pass** — every screen adapts across mobile / tablet / desktop.
3. **Browser-agnostic** — correct on evergreen browsers.
4. **PWA — installable only** — manifest + icons + minimal service worker (no offline data caching).

## 3. THE NON-NEGOTIABLE RULE

**Design-system + layout changes ONLY. Zero functional change.**

- Do **not** change any screen's behavior, business logic, data flow, form validation, component state, API/service calls, routing targets, or feature set.
- You **may** change: visual tokens (color, typography, spacing, radius, shadow) and responsive **layout** (stacking, horizontal scroll, off-canvas nav, card reflow, breakpoints).
- Every table/list keeps the **same columns, data, sorting, filtering, pagination, and row actions**. Responsive table changes are **presentation only**.
- **The one authorized removal:** the **Theme Builder + multi-brand switching** feature (see §5). Its profile page and menu/header entries are removed cleanly (no dangling routes/links). This is the *only* intended user-facing feature change.
- When in doubt whether a change touches functionality: **stop and ask the user.** Do not resolve ambiguity or a discovered dependency/blocker with a silent assumption.

Every batch of work must be verifiable as "styling/layout only" via `git diff` and a green `npm run test`.

## 4. Locked decisions

| Area | Decision |
|---|---|
| Brand | **Excellon is the ONLY brand.** No multi-brand, no Theme Builder. |
| Appearance | **Light + dark**, using the Excellon DS's own dark-mode token values. No "Excellon 2.0" variant. |
| Fonts | DS typography everywhere: **Poppins** (display/headings, stands in for licensed Strawford), **Noto Sans** (UI/body), **Inter** (data/numerals). The admin area is aligned to these (drop its Plus Jakarta Sans). |
| Tables on mobile | **Adaptive card/stacked view** — rows reflow into stacked label-value cards; same data/actions. |
| Browsers | **Evergreen only** — last ~2 versions of Chrome, Edge, Firefox, Safari + iOS Safari & Android Chrome. |
| PWA | **Installable only** — placeholder brand icon until the official EXCELLON logo SVG is provided; no offline data caching. |

## 5. Token architecture & conventions

**Value-map, not rename.** The repo already consumes CSS-variable token names (`--brand-*`, `--color-primary`, `--color-surface`, `--color-text`, `--color-border`, `--font-family-base`, `--radius-*`, `--space-*`, …). Keep those **names**; re-source their **values** from the Excellon DS. Do not rename tokens or rewrite component/class styling to a new system.

- **DS tokens** live in `src/styles/excellon-ds/`: `fonts.css` (Noto Sans + Inter + Poppins + Strawford→Poppins alias) and `tokens.css` (the DS ramps `--color-brand-*`, `--color-neutral-*`, `--color-*` semantics + the repo's token names re-valued to them). Light values are exact from the DS; **dark values are derived faithfully** from the DS slate ramp (the DS's own `fig-tokens.css` exceeds the 256 KiB `DesignSync get_file` cap and can't be vendored verbatim — see §8).
- **Override, not bridge.** `tokens.css` is imported **LAST** in `src/index.css` (after `excellon-brand-guidelines.css`), so its `:root` and `:root[data-appearance='dark']` blocks re-value the repo's existing token names by cascade order — no edits to the 414 KB `excellon-brand-guidelines.css`, fully reversible. Import order: `fonts.css` → `tailwindcss` → `excellon-brand-guidelines.css` → `excellon-ds/tokens.css`.
- **Dark mode** stays keyed on the repo's existing `[data-appearance='dark']` toggle (set by `applyAppearanceMode` in `src/theme/themeRegistry.ts`). `tokens.css` has a matching `:root[data-appearance='dark']` block that wins by order. The theme engine's dark mechanism is unchanged (lower risk than repurposing `data-theme`).
- **MUI theme** (`src/theme/materialTheme.ts`) needs concrete color values (it runs `alpha()` math), so its light/dark surface/text/divider/shadow literals are set to the same DS values as `tokens.css` — not `var()`.
- **Never hardcode hex colors** in components/pages. Use tokens. (Known debt: ~137 files, mostly `src/admin/masters/**`, still hold status/chart hex literals — a later token-migration follow-up, out of current scope.)

**Removed with the multi-brand feature:** `src/theme/customThemeBuilder.ts`, `src/pages/profile/ThemeBuilder.tsx`, the brand `<select>` in `src/components/common/ThemeSwitcher.tsx` (keep the light/dark toggle), and the 6 non-Excellon scales in `src/theme/themeRegistry.ts`. References pruned in `src/routes/routeConfig.ts`, `src/routes/routeScreens.ts`, `src/routes/profileRoutes.tsx`, `src/components/common/AppTopHeader.tsx`, `src/utils/menuBuilderNavigation.ts`, and the `index.html` inline theme bootstrap.

## 6. Responsive standards

- **Breakpoints:** Tailwind defaults — sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536. Matching MUI breakpoints; use the shared `useBreakpoint`/`useMediaQuery` helper for JS-driven layout.
- **Shell:** `AppSidebar` collapses to an off-canvas drawer under `lg`; `AppTopHeader` condenses controls into an overflow menu on mobile; `PageHeader` and `MasterFormStepper` compact/stack on small screens.
- **Reusable patterns (use these, don't reinvent):** multi-column forms → single column under `md`; data tables → shared **adaptive card/stacked** wrapper; side-by-side/split panels → stack; drawers/dialogs → full-width / bottom-sheet on mobile.
- **Where these live** — `src/hooks/useBreakpoint.ts` (`useBreakpoint`, `useMediaQuery`, `useMinWidth`); `src/styles/excellon-ds/responsive.css` (adaptive-grid card styles, multi-column collapse for recurring classes, split-view stacking, full-width MUI drawers/dialogs, the overflow guard, and utility classes `.exl-cols-2` / `.exl-cols-3` / `.exl-form-grid`). `CommonDataGrid` already renders as cards below `md` automatically (so `MasterDataTable` and all list/master screens inherit it).
- **Inline grids auto-collapse:** `responsive.css` has an attribute-selector rule that forces any inline `style={{ gridTemplateColumns: '1fr 1fr' | 'repeat(2…' | 'repeat(3…' }}` to a single column below `md` (via `!important`, which beats inline styles). This covers the ~108 bespoke form grids across `admin/masters` with no per-file edits. Grids that start with `minmax(...)` (wide scroll-table headers) are intentionally NOT matched. Very wide inline data tables (matrices) already sit in `overflowX:'auto'` wrappers — leave them.
- **Per-screen work:** wrap fixed multi-column layouts in the utility grid classes (or add the class to `responsive.css`'s collapse list), and remove inline fixed pixel widths.
- No fixed pixel widths that cause horizontal overflow; the page body must never scroll horizontally (wide content scrolls inside its own container).
- **Audit:** `npm run ui:responsive-check` flags inline fixed widths ≥ 480px (the per-screen hit-list).

## 7. Verification (run before considering work done)

- `npm run dev` — no import/build errors.
- **Responsive:** check mobile (375) / tablet (768) / desktop (1280) — no overflow, tables readable, forms stacked, off-canvas sidebar works.
- **No-functional-change gate:** `npm run test` (vitest) green; `git diff` shows only styling/layout edits; routes, form submit/validation, table columns/sorting/filtering/actions unchanged vs `main`.
- **Build/governance:** `npm run build` (`tsc -b` + vite) clean; Storybook renders; `npm run ui:governance` passes.
- **PWA:** after `npm run build && npm run preview`, DevTools → Application shows valid manifest + registered SW + install prompt.

## 7a. PWA (installable only)

Hand-rolled (no `vite-plugin-pwa` dependency), in `public/`: `manifest.webmanifest` (name "Excellon", `display: standalone`, `theme_color #eb6a2c`), `excellon-icon.svg` (**placeholder** brand chevron, maskable-safe), and `sw.js` (minimal, passive fetch handler — **no offline/data caching** by design). Registered from `src/main.tsx` on `load`; linked + `apple-touch-icon` in `index.html`. Verified installable on the dev server. Replace `excellon-icon.svg` with the official EXCELLON PNG icon set (192/512/maskable + apple-touch PNGs for iOS) when the logo is available.

## 8. Open dependencies / blockers

- **DS `fig-tokens.css` can't be vendored verbatim** — it exceeds the 256 KiB `DesignSync get_file` cap, so light values were taken exactly from the DS guideline cards and dark values derived from the DS slate ramp. To make dark byte-exact later, obtain the full `fig-tokens.css` from the Excellon Design System project and reconcile `src/styles/excellon-ds/tokens.css`.
- **Official EXCELLON logo SVG** — needed for crisp PWA icons and brand lockups; a placeholder mark is used until provided.
- **Licensed Strawford web-font files** — Poppins stands in for the display face until these are supplied.

## 9. Useful commands

- Dev: `npm run dev` · Build: `npm run build` · Preview: `npm run preview`
- Test: `npm run test` · Lint: `npm run lint`
- Storybook: `npm run storybook`
- UI governance: `npm run ui:governance` (also `ui:empty-check`, `ui:stories-check`, `ui:contracts-check`, `ui:audit`)
