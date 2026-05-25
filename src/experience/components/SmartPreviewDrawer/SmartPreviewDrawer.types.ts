import type { SmartDrawerAction } from '../SmartDrawer/SmartDrawer.types';

export interface PreviewField {
  label:  string;
  value:  React.ReactNode;
  span?:  number;   // 1 (default) or 2 — spans full row width in the field grid
  mono?:  boolean;  // render value in monospace font
  muted?: boolean;  // render value in muted colour
}

export interface PreviewSection {
  title:   string;
  fields:  PreviewField[];
  /** Optional — rendered inline below the fields */
  note?:   string;
}

export interface SmartPreviewDrawerProps {
  open:            boolean;
  onClose:         () => void;
  title:           string;
  subtitle?:       string;
  statusLabel?:    string;
  statusTone?:     'active' | 'draft' | 'inactive' | 'warning';
  /** Quick summary fields shown at the top before sections */
  summaryFields?:  PreviewField[];
  sections?:       PreviewSection[];
  primaryAction?:  SmartDrawerAction;
  secondaryActions?: SmartDrawerAction[];
  dangerAction?:   SmartDrawerAction;
  loading?:        boolean;
  emptyLabel?:     string;
}
