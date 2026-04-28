import type { LucideIcon } from 'lucide-react';
import {
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileCheck2,
  FileMinus2,
  FilePlus2,
  PackageCheck,
  ReceiptText,
  ShoppingBag,
  ShoppingCart,
  Truck,
} from 'lucide-react';
import type { ReactNode, RefObject, UIEvent } from 'react';

export type ActiveLeaf =
  | 'purchase-requisition'
  | 'purchase-order'
  | 'purchase-receipt'
  | 'purchase-invoice'
  | 'sale-order'
  | 'sale-allocation-requisition'
  | 'sale-allocation'
  | 'sale-invoice'
  | 'delivery'
  | null;

export interface SidebarProps {
  onPurchaseRequisitionClick?: () => void;
  onPurchaseOrderClick?: () => void;
  onPurchaseReceiptClick?: () => void;
  onPurchaseInvoiceClick?: () => void;
  onSaleOrderClick?: () => void;
  onSaleAllocationRequisitionClick?: () => void;
  onSaleAllocationClick?: () => void;
  onSaleInvoiceClick?: () => void;
  onDeliveryClick?: () => void;
  activeLeaf?: ActiveLeaf;
}

export interface AppShellProps extends SidebarProps {
  children: ReactNode;
  bottomBar?: ReactNode;
  contentRef?: RefObject<HTMLDivElement | null>;
  contentClassName?: string;
  onContentScroll?: (event: UIEvent<HTMLDivElement>) => void;
  onFormLayoutClick?: () => void;
  onBusinessSettingsClick?: () => void;
}

export interface Level3Item {
  key: string;
  label: string;
  icon?: LucideIcon;
  active?: boolean;
  onClick?: () => void;
  route?: string;
  externalUrl?: string;
  openInNewTab?: boolean;
}

export interface Level2Item {
  label: string;
  level3?: Level3Item[];
  hideLabel?: boolean;
}

export interface Level1Item {
  label: string;
  icon?: LucideIcon;
  level2: Level2Item[];
}

export interface SidebarComponentProps extends SidebarProps {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export interface TopHeaderProps {
  activeLeaf?: ActiveLeaf;
  isSidebarCollapsed: boolean;
  isMobileNavOpen: boolean;
  onToggleNavigation: () => void;
  onFormLayoutClick?: () => void;
  onBusinessSettingsClick?: () => void;
}

export type VoiceState = 'idle' | 'listening' | 'processing' | 'success' | 'error' | 'unsupported';
export type VoiceMode = 'direct' | 'wake' | 'command';

export interface BrowserSpeechRecognitionResult {
  isFinal?: boolean;
  0?: { transcript: string };
}

export interface BrowserSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: { results: ArrayLike<BrowserSpeechRecognitionResult> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
}

export type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

export const menuStructure: Level1Item[] = [
  {
    label: 'Procurement',
    icon: ClipboardList,
    level2: [
      {
        label: 'Pages',
        hideLabel: true,
        level3: [
          {
            key: 'purchase-requisition',
            label: 'Purchase Requisition',
            icon: ClipboardList,
          },
          { key: 'purchase-order', label: 'Purchase Order', icon: ShoppingCart },
          { key: 'purchase-receipt', label: 'Purchase Receipt', icon: PackageCheck },
          { key: 'purchase-invoice', label: 'Purchase Invoice', icon: ReceiptText },
          { key: 'purchase-return-requisition', label: 'Purchase Return Requisition', icon: FileMinus2 },
          { key: 'purchase-return', label: 'Purchase Return', icon: FileCheck2 },
        ],
      },
    ],
  },
  {
    label: 'Sales',
    icon: ShoppingBag,
    level2: [
      {
        label: 'Pages',
        hideLabel: true,
        level3: [
          { key: 'sale-order', label: 'Sale Order', icon: ShoppingBag },
          { key: 'sale-allocation-requisition', label: 'Sale Allocation Requisition', icon: FilePlus2 },
          { key: 'sale-allocation', label: 'Sale Allocation', icon: ClipboardCheck },
          { key: 'sale-invoice', label: 'Sale Invoice', icon: ReceiptText },
          { key: 'delivery', label: 'Delivery', icon: Truck },
          { key: 'sale-return-requisition', label: 'Sale Return Requisition', icon: FileMinus2 },
          { key: 'sale-return', label: 'Sale Return', icon: FileCheck2 },
        ],
      },
    ],
  },
  {
    label: 'Inventory',
    icon: PackageCheck,
    level2: [
      {
        label: 'Pages',
        hideLabel: true,
        level3: [
          {
            key: 'stock-transfer-requisition',
            label: 'Stock Transfer Requisition',
            icon: ClipboardList,
          },
          {
            key: 'stock-transfer',
            label: 'Stock Transfer',
            icon: PackageCheck,
          },
          {
            key: 'stock-adjustment-requisition',
            label: 'Stock Adjustment Requisition',
            icon: FileMinus2,
          },
          {
            key: 'stock-adjustment',
            label: 'Stock Adjustment',
            icon: FileCheck2,
          },
        ],
      },
    ],
  },
  {
    label: 'Services',
    icon: ClipboardCheck,
    level2: [
      {
        label: 'Pages',
        hideLabel: true,
        level3: [
          {
            key: 'appointment',
            label: 'Appointment',
            icon: CalendarDays,
          },
          {
            key: 'service-estimate',
            label: 'Service Estimate',
            icon: FilePlus2,
          },
          {
            key: 'job-card',
            label: 'Job Card',
            icon: ClipboardCheck,
          },
          {
            key: 'spare-issue',
            label: 'Spare Issue',
            icon: PackageCheck,
          },
          {
            key: 'spare-issue-return',
            label: 'Spare Issue Return',
            icon: FileMinus2,
          },
          {
            key: 'service-invoice',
            label: 'Service Invoice',
            icon: ReceiptText,
          },
          {
            key: 'service-invoice-return',
            label: 'Service Invoice Return',
            icon: FileCheck2,
          },
        ],
      },
    ],
  },
];

export function navigateToHash(hash: string) {
  window.location.assign(`${window.location.pathname}${window.location.search}${hash}`);
}

export function getSpeechRecognitionConstructor(): BrowserSpeechRecognitionConstructor | undefined {
  const speechWindow = window as Window & {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  };

  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
}

export function normalizeVoiceText(value: string) {
  return value
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getTranscriptFromResults(results: ArrayLike<BrowserSpeechRecognitionResult>) {
  return Array.from(results)
    .map((result) => result[0]?.transcript ?? '')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getWakeCommand(transcript: string) {
  const normalizedTranscript = normalizeVoiceText(transcript);
  const wakePhraseMatch = normalizedTranscript.match(/\bhi\b/);

  if (!wakePhraseMatch || wakePhraseMatch.index === undefined) {
    return { hasWakePhrase: false, command: transcript.trim() };
  }

  return {
    hasWakePhrase: true,
    command: normalizedTranscript.slice(wakePhraseMatch.index + wakePhraseMatch[0].length).trim(),
  };
}