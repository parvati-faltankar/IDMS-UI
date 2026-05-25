import type React from 'react';

export type AdminConfigSectionCompletion = 'complete' | 'partial' | 'empty';

export type AdminConfigSectionItem = {
  key: string;
  label: string;
  description?: string;
  icon?: React.ElementType;
  completionStatus?: AdminConfigSectionCompletion;
  /** Red badge count — shown when > 0 and no green checkmark */
  badgeCount?: number;
  /** Override to show green checkmark regardless of completionStatus */
  showCheckmark?: boolean;
};

export type AdminConfigShellProgress = {
  completed: number;
  total: number;
};

export type AdminConfigShellProps = {
  /** Section navigation items */
  sections: AdminConfigSectionItem[];
  /** Currently active section key */
  activeSection: string;
  /** Called when user clicks a section in the nav */
  onSectionChange: (key: string) => void;
  /** Optional progress bar at the bottom of the section nav */
  progress?: AdminConfigShellProgress;
  /** Main content area */
  children: React.ReactNode;
};
