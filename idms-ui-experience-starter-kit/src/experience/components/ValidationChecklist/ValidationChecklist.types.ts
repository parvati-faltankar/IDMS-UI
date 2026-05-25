export type ValidationChecklistStatus = "pass" | "fail" | "pending";

export type ValidationChecklistItem = {
  id: string;
  label: string;
  description?: string;
  status: ValidationChecklistStatus;
  onClick?: () => void;
};

export type ValidationChecklistProps = {
  title?: string;
  description?: string;
  items: ValidationChecklistItem[];
};
