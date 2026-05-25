export type NavigationItem = {
  id: string;
  label: string;
  path: string;
  group: string;
  description?: string;
  keywords?: string[];
};

export type NavigationGroup = {
  id: string;
  label: string;
  description?: string;
  items: NavigationItem[];
};

export type CommandItem = {
  id: string;
  label: string;
  description?: string;
  keywords?: string[];
  actionType: "navigate" | "open-help" | "create";
  path?: string;
  helpTopicId?: string;
};
