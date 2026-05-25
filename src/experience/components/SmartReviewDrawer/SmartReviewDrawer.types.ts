export interface ReviewChecklistItem {
  id:      string;
  label:   string;
  passed:  boolean;
  detail?: string;
}

export interface ReviewSummaryField {
  label: string;
  value: React.ReactNode;
}

export interface SmartReviewDrawerProps {
  open:            boolean;
  onClose:         () => void;
  title:           string;
  subtitle?:       string;
  /** Short one-sentence description of what this review is for */
  description?:    string;
  summaryFields?:  ReviewSummaryField[];
  checklist?:      ReviewChecklistItem[];
  /** Warning message shown below checklist when not all items pass */
  warningText?:    string;
  /** Consequence note shown in the footer area (e.g. "Once active, fields will be locked") */
  consequenceNote?: string;
  confirmLabel?:   string;
  cancelLabel?:    string;
  onConfirm:       () => void;
  onCancel?:       () => void;
  /** Disable confirm when true (e.g. not all checklist items pass) */
  confirmDisabled?: boolean;
  loading?:        boolean;
}
