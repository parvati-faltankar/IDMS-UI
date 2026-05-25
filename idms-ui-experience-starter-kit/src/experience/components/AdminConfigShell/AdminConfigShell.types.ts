import type { ReactNode } from "react";
import type { PageHeaderAction } from "../PageHeader/PageHeader.types";

export type AdminConfigSection = {
  id: string;
  label: string;
  description?: string;
  status?: "complete" | "in-progress" | "not-started";
  onClick?: () => void;
};

export type AdminConfigShellProps = {
  title: string;
  description: string;
  breadcrumbs?: string[];
  statusLabel?: string;
  helpTopicId?: string;
  sections: AdminConfigSection[];
  activeSectionId?: string;
  primaryAction?: PageHeaderAction;
  secondaryActions?: PageHeaderAction[];
  onHelpClick?: (topicId: string) => void;
  aside?: ReactNode;
  children: ReactNode;
};
