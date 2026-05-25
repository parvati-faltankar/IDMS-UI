export type PageHeaderAction = {
  label: string;
  onClick?: () => void;
  href?: string;
  tone?: 'primary' | 'secondary' | 'ghost';
};

export type PageHeaderProps = {
  title: string;
  description?: string;
  breadcrumbs?: string[];
  statusLabel?: string;
  statusTone?: 'neutral' | 'draft' | 'active' | 'warning' | 'danger';
  primaryAction?: PageHeaderAction;
  secondaryActions?: PageHeaderAction[];
  helpTopicId?: string;
  onHelpClick?: (topicId: string) => void;
};
