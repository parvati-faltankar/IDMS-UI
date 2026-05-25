import type { SmartDrawerWidth } from '../SmartDrawer/SmartDrawer.types';

export interface SmartFormDrawerProps {
  open:              boolean;
  onClose:           () => void;
  title:             string;
  subtitle?:         string;
  width?:            SmartDrawerWidth;
  onSave:            () => void;
  onCancel?:         () => void;
  saveLabel?:        string;
  cancelLabel?:      string;
  saveDisabled?:     boolean;
  isDirty?:          boolean;
  dirtyWarningText?: string;
  loading?:          boolean;
  /** Validation errors to display as a summary strip above the form */
  validationErrors?: string[];
  children:          React.ReactNode;
}
