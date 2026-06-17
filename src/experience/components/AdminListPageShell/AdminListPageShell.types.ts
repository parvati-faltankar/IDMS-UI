import type React from 'react';
import type { PageHeaderAction } from '../PageHeader/PageHeader.types';

/**
 * A single metric shown inline in the SmartToolbar summary segment.
 * Renders as compact inline text: "12 Total · 8 Active · 3 Draft".
 */
export type AdminListSummaryItem = {
  /** Short label — e.g. "Total", "Active", "Draft". */
  label: string;
  /** Numeric or string value — e.g. 42, "8 / 12". */
  value: number | string;
  /**
   * Optional tone colours the value.
   * - `success`: green — e.g. Active count
   * - `warning`: amber — e.g. Draft count
   * - `danger`: red — e.g. Inactive or error count
   * - `neutral` (default): standard text colour
   */
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
};

/**
 * A quick-filter chip rendered in the SmartToolbar.
 * Clicking a chip sets `activeQuickFilter` to its `key`.
 */
export type AdminListQuickFilter = {
  /** Unique key — pass as `activeQuickFilter` to activate this chip. */
  key: string;
  /** Display label — e.g. "All", "Active", "Draft". */
  label: string;
  /**
   * Optional count badge shown inside the chip — e.g. shows "(8)" next to "Active".
   * Pass `undefined` to omit.
   */
  count?: number;
};

export type AdminListPageShellProps = {
  // ── Identity ──────────────────────────────────────────────────────────────

  /** Page title — rendered as a compact heading (not marketing-style). */
  title: string;
  /**
   * Short description — one sentence max. Rendered in small muted text
   * below the title row. Omit for very simple pages.
   */
  description?: string;
  /**
   * Breadcrumb segments — e.g. `['Finance & Pricing']` or
   * `['Admin', 'Finance & Pricing']`. Rendered as small muted text above the title.
   */
  breadcrumbs?: string[];

  // ── Actions ───────────────────────────────────────────────────────────────

  /**
   * Primary call-to-action — rendered as a filled button at the right end
   * of the title row — e.g. `{ label: 'New Policy', tone: 'primary', onClick }`.
   */
  primaryAction?: PageHeaderAction;
  /**
   * Secondary actions — rendered as ghost/secondary buttons to the left of
   * the primary action — e.g. Import, Export.
   */
  secondaryActions?: PageHeaderAction[];

  // ── Help ─────────────────────────────────────────────────────────────────

  /**
   * Wires the help (?) icon button in the title row. Must match a topic id
   * in `src/experience/help/helpTopics.ts`.
   */
  helpTopicId?: string;
  onHelpClick?: (topicId: string) => void;

  // ── Summary items (SmartToolbar — left segment) ───────────────────────────

  /**
   * Metric items rendered in the left segment of the SmartToolbar as compact
   * inline text — e.g. "12 Total · 8 Active · 3 Draft · 1 Inactive".
   * Show 2–5 items. Omit for pages with no list data.
   */
  summaryItems?: AdminListSummaryItem[];

  // ── Search (SmartToolbar — right segment) ────────────────────────────────

  /** Controlled search value. Provide together with `onSearchChange`. */
  searchValue?: string;
  /** Placeholder text for the search input. Defaults to "Search…". */
  searchPlaceholder?: string;
  /** Called when the search input changes. */
  onSearchChange?: (value: string) => void;

  // ── Quick filter chips (SmartToolbar — right segment) ────────────────────

  /**
   * Quick-filter chip definitions. Renders as pill buttons next to the search
   * input — e.g. All / Active / Draft / Inactive.
   */
  quickFilterItems?: AdminListQuickFilter[];
  /** Key of the currently active quick filter chip. */
  activeQuickFilter?: string;
  /** Called when the user clicks a quick filter chip. */
  onQuickFilterChange?: (key: string) => void;

  // ── Advanced filter (SmartToolbar — right segment) ───────────────────────

  /**
   * When `true`, the "Filters" button in the toolbar is rendered in active/
   * highlighted state to indicate applied advanced filters.
   */
  advancedFilterActive?: boolean;
  /**
   * Called when the user clicks the "Filters" button.
   * Manage the advanced filter panel/modal outside this component.
   */
  onAdvancedFilterClick?: () => void;

  // ── Extra toolbar content ─────────────────────────────────────────────────

  /**
   * Arbitrary React content appended at the right end of the SmartToolbar.
   * Use for page-count selectors, column visibility toggles, or export buttons.
   * Keep this area minimal.
   */
  toolbarActions?: React.ReactNode;
  /**
   * Controls whether `toolbarActions` render beside the search/actions command
   * row or in the auxiliary toolbar row.
   * - `auto` keeps existing pages stable by preferring the auxiliary row when it
   *   exists and the command row otherwise.
   * - `command` is useful for anchored popovers that should stay beside header
   *   actions.
   * - `toolbar` forces the legacy auxiliary-row placement.
   */
  toolbarActionsPlacement?: 'auto' | 'command' | 'toolbar';

  // ── Content ───────────────────────────────────────────────────────────────

  /** Table, list, or any scrollable content area. */
  children: React.ReactNode;

  // ── Density ───────────────────────────────────────────────────────────────

  /**
   * `compact` reduces PageBar vertical padding and toolbar height.
   * Use on screens where maximum vertical real estate is needed.
   * Defaults to `'default'`.
   */
  density?: 'default' | 'compact';
};
