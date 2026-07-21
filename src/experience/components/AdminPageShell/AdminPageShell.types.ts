import type React from 'react';
import type { PageHeaderAction, PageHeaderBadge } from '../PageHeader/PageHeader.types';

export type AdminPageShellSummaryItem = {
  label: string;
  value: number | string;
};

export type AdminPageShellHealthStatus = {
  tone: 'warning' | 'error';
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export type AdminPageShellNavigationMode = 'expanded' | 'collapsed' | 'drawer';

export type AdminPageShellNavigationRenderProps = {
  mode: AdminPageShellNavigationMode;
  closeNavigation?: () => void;
};

export type AdminPageShellProps = {
  title: string;
  description?: string;
  breadcrumbs?: string[];
  statusLabel?: string;
  statusTone?: 'neutral' | 'draft' | 'active' | 'warning' | 'danger';
  badges?: PageHeaderBadge[];
  backAction?: PageHeaderAction;
  primaryAction?: PageHeaderAction;
  secondaryActions?: PageHeaderAction[];
  helpTopicId?: string;
  onHelpClick?: (topicId: string) => void;
  summaryItems?: AdminPageShellSummaryItem[];
  setupHealth?: AdminPageShellHealthStatus;
  maxContentWidth?: number | string;
  variant?: 'default' | 'master-form';
  navigationSlot?:
    | React.ReactNode
    | ((props: AdminPageShellNavigationRenderProps) => React.ReactNode);
  navigationWidth?: number | string;
  collapsedNavigationWidth?: number | string;
  navigationPersistenceKey?: string;
  footer?: React.ReactNode;
  contentPadding?: string;
  contentBackground?: string;
  compactHeader?: boolean;
  helpIconOnly?: boolean;
  headerVariant?: 'default' | 'appbar';
  toolbar?: React.ReactNode;
  children: React.ReactNode;
};
