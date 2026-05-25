export type ValidationChecklistItemStatus = 'ok' | 'error' | 'warn';

export type ValidationChecklistItem = {
  key: string;
  label: string;
  detail: string;
  status: ValidationChecklistItemStatus;
  /** Navigates to this section key when the item is clicked */
  sectionKey?: string;
  errors?: string[];
};

export type ValidationChecklistProps = {
  items: ValidationChecklistItem[];
  /** Called when the user clicks a checklist item to navigate to its section */
  onNavigateToSection?: (sectionKey: string) => void;
  /** Show the activation summary bar + activate button */
  canActivate?: boolean;
  isReadOnly?: boolean;
  onActivate?: () => void;
};
