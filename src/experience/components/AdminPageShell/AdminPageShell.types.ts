import type React from 'react';
import type { PageHeaderAction } from '../PageHeader/PageHeader.types';

/** A single metric shown in the summary strip below the page header. */
export type AdminPageShellSummaryItem = {
  /** Short label — e.g. "Total", "Active", "Inactive". */
  label: string;
  /** The numeric or string value — e.g. 42, "12 / 20". */
  value: number | string;
};

/** Optional setup health strip — shown when a configuration is incomplete. */
export type AdminPageShellHealthStatus = {
  /** 'warning' renders an amber strip; 'error' renders a red strip. */
  tone: 'warning' | 'error';
  /** One-sentence message — e.g. "Numbering policy not configured yet." */
  message: string;
  /** Optional call-to-action label — e.g. "Configure now". */
  actionLabel?: string;
  onAction?: () => void;
};

export type AdminPageShellProps = {
  // ── Identity ──────────────────────────────────────────────────────────────
  title: string;
  description?: string;
  breadcrumbs?: string[];

  // ── Status ────────────────────────────────────────────────────────────────
  statusLabel?: string;
  statusTone?: 'neutral' | 'draft' | 'active' | 'warning' | 'danger';

  // ── Page-level actions ────────────────────────────────────────────────────
  primaryAction?: PageHeaderAction;
  secondaryActions?: PageHeaderAction[];

  // ── Help ─────────────────────────────────────────────────────────────────
  /**
   * Wires the "How this works" button inside PageHeader. Must match a topic id
   * registered in `src/experience/help/helpTopics.ts`.
   */
  helpTopicId?: string;
  onHelpClick?: (topicId: string) => void;

  // ── Summary strip ─────────────────────────────────────────────────────────
  /**
   * Metric tiles rendered below PageHeader and above the toolbar. Show 3–6
   * items. Omit the strip entirely for simple pages with no list view.
   */
  summaryItems?: AdminPageShellSummaryItem[];

  // ── Setup health ──────────────────────────────────────────────────────────
  /**
   * Optional attention strip rendered between PageHeader and the summary strip.
   * Use to surface a blocking configuration gap without hiding it in the help drawer.
   */
  setupHealth?: AdminPageShellHealthStatus;

  // ── Layout ────────────────────────────────────────────────────────────────
  /**
   * When provided, the content area is constrained to this width and centred.
   * Useful for narrow config forms. Leave undefined for full-width table pages.
   */
  maxContentWidth?: number | string;

  // ── Slots ─────────────────────────────────────────────────────────────────
  /**
   * Toolbar row — place search input, filter chips, and the "Filters" button here.
   * Rendered between the summary strip and the main content area.
   */
  toolbar?: React.ReactNode;

  /** Main page content — table, form body, or config content. */
  children: React.ReactNode;
};
