import type React from 'react';

export type PageHeaderAction = {
  label: string;
  onClick?: () => void;
  href?: string;
  tone?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: React.ReactNode;
  active?: boolean;
  iconOnly?: boolean;
  title?: string;
};

export type PageHeaderProps = {
  title: string;
  description?: string;
  breadcrumbs?: string[];
  statusLabel?: string;
  statusTone?: 'neutral' | 'draft' | 'active' | 'warning' | 'danger';
  backAction?: PageHeaderAction;
  primaryAction?: PageHeaderAction;
  secondaryActions?: PageHeaderAction[];
  helpTopicId?: string;
  onHelpClick?: (topicId: string) => void;
  compact?: boolean;
  helpIconOnly?: boolean;
  headerVariant?: 'default' | 'appbar';
};
