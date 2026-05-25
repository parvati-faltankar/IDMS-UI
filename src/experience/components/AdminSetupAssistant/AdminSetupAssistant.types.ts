export type AdminSetupStatus = 'complete' | 'in-progress' | 'not-started' | 'needs-attention';

export type AdminSetupItem = {
  id: string;
  label: string;
  description: string;
  status: AdminSetupStatus;
  path?: string;
};

export type AdminSetupAssistantProps = {
  title?: string;
  description?: string;
  items: AdminSetupItem[];
  onOpenItem?: (item: AdminSetupItem) => void;
};
