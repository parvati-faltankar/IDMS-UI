export type PrintEntityType =
  | 'purchase-requisition'
  | 'purchase-order'
  | 'purchase-receipt'
  | 'purchase-invoice'
  | 'sale-order'
  | 'sale-allocation-requisition'
  | 'sale-allocation'
  | 'sale-invoice'
  | 'delivery';

export type PrintTemplateStatus = 'draft' | 'active' | 'inactive' | 'archived';
export type PrintPageSize = 'A4' | 'Letter' | 'Legal' | 'Custom';
export type PrintOrientation = 'portrait' | 'landscape';
export type PrintSectionId = 'header' | 'body' | 'footer';
export type PrintCopyMode = 'single' | 'duplicate' | 'triplicate' | 'custom';
export type PrintBlockType = 'text' | 'field' | 'image' | 'divider' | 'table' | 'signature' | 'copy-label';

export interface PrintCopyLabel {
  id: string;
  label: string;
}

export interface PrintCopyConfig {
  mode: PrintCopyMode;
  labels: PrintCopyLabel[];
}

export interface PrintPageMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface PrintPageSettings {
  size: PrintPageSize;
  orientation: PrintOrientation;
  margins: PrintPageMargins;
  customWidthMm?: number;
  customHeightMm?: number;
}

export interface PrintBlockStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 400 | 500 | 600 | 700;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  padding?: number;
  margin?: number;
  borderWidth?: number;
  borderColor?: string;
  backgroundColor?: string;
  widthMode?: 'auto' | 'full' | 'half';
}

interface PrintBlockBase {
  id: string;
  type: PrintBlockType;
  section: PrintSectionId;
  title: string;
  style: PrintBlockStyle;
}

export interface PrintTextBlock extends PrintBlockBase {
  type: 'text';
  content: string;
}

export interface PrintFieldBlock extends PrintBlockBase {
  type: 'field';
  token: string;
  prefix?: string;
  suffix?: string;
}

export interface PrintImageBlock extends PrintBlockBase {
  type: 'image';
  assetDataUrl?: string;
  altText?: string;
  maxHeight?: number;
}

export interface PrintDividerBlock extends PrintBlockBase {
  type: 'divider';
  thickness: number;
}

export interface PrintTableBlock extends PrintBlockBase {
  type: 'table';
  collectionKey: string;
  columns: string[];
  showTotals?: boolean;
}

export interface PrintSignatureBlock extends PrintBlockBase {
  type: 'signature';
  label: string;
}

export interface PrintCopyLabelBlock extends PrintBlockBase {
  type: 'copy-label';
}

export type PrintBlockConfig =
  | PrintTextBlock
  | PrintFieldBlock
  | PrintImageBlock
  | PrintDividerBlock
  | PrintTableBlock
  | PrintSignatureBlock
  | PrintCopyLabelBlock;

export interface PrintTemplateSection {
  id: PrintSectionId;
  label: string;
  blockIds: string[];
}

export interface PrintTemplateRecord {
  id: string;
  entityType: PrintEntityType;
  name: string;
  description: string;
  status: PrintTemplateStatus;
  isDefault: boolean;
  logoDataUrl?: string;
  logoName?: string;
  page: PrintPageSettings;
  copyConfig: PrintCopyConfig;
  sections: Record<PrintSectionId, PrintTemplateSection>;
  blocks: Record<string, PrintBlockConfig>;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PrintFieldToken {
  token: string;
  label: string;
}

export interface PrintFieldGroup {
  id: string;
  label: string;
  fields: PrintFieldToken[];
}

export interface PrintTableCollection {
  key: string;
  label: string;
  columns: PrintFieldToken[];
}

export interface PrintEntityRegistryItem<TDocument extends object = Record<string, unknown>> {
  id: PrintEntityType;
  label: string;
  route: string;
  sampleDocuments: TDocument[];
  fieldGroups: PrintFieldGroup[];
  tableCollections: PrintTableCollection[];
}

export interface PrintPreviewTableColumn {
  key: string;
  label: string;
}

export interface PrintPreviewTable {
  key: string;
  label: string;
  columns: PrintPreviewTableColumn[];
  rows: Array<Record<string, string>>;
  totals?: Array<{ label: string; value: string }>;
}

export interface PrintPreviewBlockView {
  id: string;
  type: PrintBlockType;
  title: string;
  style: PrintBlockStyle;
  value?: string;
  table?: PrintPreviewTable;
  imageSrc?: string;
  signatureLabel?: string;
}

export interface PrintPreviewPage {
  copyLabel: string;
  header: PrintPreviewBlockView[];
  body: PrintPreviewBlockView[];
  footer: PrintPreviewBlockView[];
}

export interface PrintPreviewModel {
  entityType: PrintEntityType;
  entityLabel: string;
  templateId: string;
  templateName: string;
  documentNumber: string;
  pages: PrintPreviewPage[];
}
