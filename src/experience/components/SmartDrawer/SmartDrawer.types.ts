export type SmartDrawerWidth = 'sm' | 'md' | 'lg' | 'xl';

export interface SmartDrawerAction {
  label:     string;
  onClick:   () => void;
  tone?:     'primary' | 'danger' | 'outline';
  disabled?: boolean;
  title?:    string;
}

export interface SmartDrawerProps {
  open:              boolean;
  onClose:           () => void;
  title:             string;
  subtitle?:         string;
  statusLabel?:      string;
  statusTone?:       'active' | 'draft' | 'inactive' | 'warning';
  width?:            SmartDrawerWidth;
  /** Footer actions rendered left-to-right. Last action is treated as primary. */
  footerActions?:    SmartDrawerAction[];
  loading?:          boolean;
  /** When true, shows a dirty-state warning before close */
  isDirty?:          boolean;
  /** Message shown in the dirty-state warning. Defaults to generic message. */
  dirtyWarningText?: string;
  children?:         React.ReactNode;
}
