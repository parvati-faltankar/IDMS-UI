export type MenuFormData = {
  label: string;
  key?: string;
  description?: string;
  hideLabel?: boolean;
  iconName?: string | null;
  route?: string;
  externalUrl?: string;
  openInNewTab?: boolean;
  isVisible?: boolean;
  parentSectionId?: string;
  parentLevel2Id?: string;
};