import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarDays,
  Bell,
  ClipboardList,
  ChevronDown,
  ClipboardCheck,
  FileCheck2,
  FileMinus2,
  FilePlus2,
  Grip,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Mic,
  MicOff,
  PackageCheck,
  ReceiptText,
  Search,
  ShoppingBag,
  ShoppingCart,
  Settings,
  Truck,
  UserCircle2,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../utils/classNames';
import excellonLogo from '../assets/Excellonsoft-Logo.png';
import bajajLogo from '../assets/Bajaj-Logo-Dark.png';
import tataMotorsLogo from '../assets/Tata-Motors-Logo.svg';
import olaLogo from '../assets/Ola-Logo.svg';
import ekaLogo from '../assets/Eka-Logo-White.png';
import heroLogo from '../assets/Hero-Logo.svg';
import royalEnfieldLogo from '../assets/Royal-Enfield-Logo-White.png';
import ThemeSwitcher from './common/ThemeSwitcher';
import GlobalSearchPanel from './common/GlobalSearchPanel';
import { useTheme } from '../theme/useTheme';
import type { GlobalSearchResult } from '../search/globalSearch';
import { resolveVoiceCommand, type VoiceCommandResolution } from '../search/voiceCommand';
import {
  loadRecentSearches,
  recordRecentSearch,
  resolveSearchExperience,
  searchModuleShortcuts,
  searchScopeOptions,
  type SearchRecentEntry,
  type SearchScopeId,
} from '../search/searchExperience';
import type { SearchInsightMatch } from '../search/searchInsights';
import { formatDate } from '../utils/dateFormat';

type ActiveLeaf =
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

interface AppShellProps extends SidebarProps {
  children: React.ReactNode;
  bottomBar?: React.ReactNode;
  contentRef?: React.RefObject<HTMLDivElement | null>;
  contentClassName?: string;
  onContentScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
  onFormLayoutClick?: () => void;
}

interface Level3Item {
  key: string;
  label: string;
  icon?: LucideIcon;
  active?: boolean;
  onClick?: () => void;
}

interface Level2Item {
  label: string;
  level3?: Level3Item[];
  hideLabel?: boolean;
}

interface Level1Item {
  label: string;
  icon?: LucideIcon;
  level2: Level2Item[];
}

interface SidebarComponentProps extends SidebarProps {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

interface TopHeaderProps {
  activeLeaf?: ActiveLeaf;
  isSidebarCollapsed: boolean;
  isMobileNavOpen: boolean;
  onToggleNavigation: () => void;
  onFormLayoutClick?: () => void;
}

type VoiceState = 'idle' | 'listening' | 'processing' | 'success' | 'error' | 'unsupported';
type VoiceMode = 'direct' | 'wake' | 'command';

interface BrowserSpeechRecognitionResult {
  isFinal?: boolean;
  0?: { transcript: string };
}

interface BrowserSpeechRecognition {
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

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

const menuStructure: Level1Item[] = [
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

function navigateToHash(hash: string) {
  window.location.assign(`${window.location.pathname}${window.location.search}${hash}`);
}

function getSpeechRecognitionConstructor(): BrowserSpeechRecognitionConstructor | undefined {
  const speechWindow = window as Window & {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  };

  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
}

function normalizeVoiceText(value: string) {
  return value
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getTranscriptFromResults(results: ArrayLike<BrowserSpeechRecognitionResult>) {
  return Array.from(results)
    .map((result) => result[0]?.transcript ?? '')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getWakeCommand(transcript: string) {
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

const Sidebar: React.FC<SidebarComponentProps> = ({
  isCollapsed,
  onPurchaseRequisitionClick,
  onPurchaseOrderClick,
  onPurchaseReceiptClick,
  onPurchaseInvoiceClick,
  onSaleOrderClick,
  onSaleAllocationRequisitionClick,
  onSaleAllocationClick,
  onSaleInvoiceClick,
  onDeliveryClick,
  activeLeaf = 'purchase-requisition',
  isMobileOpen,
  onCloseMobile,
}) => {
  const isSalesLeaf =
    activeLeaf === 'sale-order' ||
    activeLeaf === 'sale-allocation-requisition' ||
    activeLeaf === 'sale-allocation' ||
    activeLeaf === 'sale-invoice' ||
    activeLeaf === 'delivery';
  const [expandedLevel1, setExpandedLevel1] = useState<Record<string, boolean>>({
    Procurement: !isSalesLeaf,
    Sales: isSalesLeaf,
    Inventory: false,
    Services: false,
  });
  const [expandedLevel2, setExpandedLevel2] = useState<Record<string, boolean>>({
    Procurement_Pages: !isSalesLeaf,
    Sales_Pages: isSalesLeaf,
    Inventory_Pages: false,
    Services_Pages: false,
  });

  const toggleLevel1 = (label: string) => {
    setExpandedLevel1((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const toggleLevel2 = (level1: string, level2: string) => {
    const key = `${level1}_${level2}`;
    setExpandedLevel2((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleLeafClick = (item: Level3Item) => {
    if (item.key === 'purchase-requisition') {
      if (onPurchaseRequisitionClick) {
        onPurchaseRequisitionClick();
      } else {
        navigateToHash('#/purchase-requisition');
      }
    }

    if (item.key === 'purchase-order') {
      if (onPurchaseOrderClick) {
        onPurchaseOrderClick();
      } else {
        navigateToHash('#/purchase-order');
      }
    }

    if (item.key === 'purchase-receipt') {
      if (onPurchaseReceiptClick) {
        onPurchaseReceiptClick();
      } else {
        navigateToHash('#/purchasereceiptlist');
      }
    }

    if (item.key === 'purchase-invoice') {
      if (onPurchaseInvoiceClick) {
        onPurchaseInvoiceClick();
      } else {
        navigateToHash('#/purchaseinvoicelist');
      }
    }

    if (item.key === 'sale-order') {
      if (onSaleOrderClick) {
        onSaleOrderClick();
      } else {
        navigateToHash('#/sale-order');
      }
    }

    if (item.key === 'sale-allocation-requisition') {
      if (onSaleAllocationRequisitionClick) {
        onSaleAllocationRequisitionClick();
      } else {
        navigateToHash('#/sale-allocation-requisition');
      }
    }

    if (item.key === 'sale-allocation') {
      if (onSaleAllocationClick) {
        onSaleAllocationClick();
      } else {
        navigateToHash('#/sale-allocation');
      }
    }

    if (item.key === 'sale-invoice') {
      if (onSaleInvoiceClick) {
        onSaleInvoiceClick();
      } else {
        navigateToHash('#/sale-invoice');
      }
    }

    if (item.key === 'delivery') {
      if (onDeliveryClick) {
        onDeliveryClick();
      } else {
        navigateToHash('#/delivery');
      }
    }

    if (isMobileOpen) {
      onCloseMobile();
    }
  };

  const sidebarCollapsed = isCollapsed && !isMobileOpen;

  return (
    <aside
      className={cn(
        'app-sidebar',
        sidebarCollapsed && 'app-sidebar--collapsed',
        isMobileOpen && 'app-sidebar--mobile-open'
      )}
    >
      <nav className="app-sidebar__nav" aria-label="Primary navigation">
        {menuStructure.map((level1) => {
          const isLevel1Expanded = expandedLevel1[level1.label];

          return (
            <div key={level1.label} className="app-sidebar__group">
              <button
                type="button"
                onClick={() => !sidebarCollapsed && toggleLevel1(level1.label)}
                className={cn(
                  'app-sidebar__level1',
                  sidebarCollapsed && 'app-sidebar__level1--collapsed',
                  isLevel1Expanded && !sidebarCollapsed && 'app-sidebar__level1--expanded'
                )}
                disabled={sidebarCollapsed}
                aria-expanded={sidebarCollapsed ? undefined : isLevel1Expanded}
                title={sidebarCollapsed ? level1.label : undefined}
              >
                {!sidebarCollapsed && (
                  <ChevronDown
                    size={16}
                    className={cn('app-sidebar__chevron', !isLevel1Expanded && 'app-sidebar__chevron--collapsed')}
                  />
                )}
                {!sidebarCollapsed ? (
                  <span>{level1.label}</span>
                ) : (
                  <>
                    {level1.icon ? (
                      <level1.icon size={18} strokeWidth={1.9} aria-hidden="true" />
                    ) : (
                      <span className="app-sidebar__collapsed-label">{level1.label.charAt(0)}</span>
                    )}
                  </>
                )}
              </button>

              {!sidebarCollapsed && isLevel1Expanded && (
                <div className="app-sidebar__level2-wrap">
                  {level1.level2.map((level2) => {
                    const level2Key = `${level1.label}_${level2.label}`;
                    const isLevel2Expanded = expandedLevel2[level2Key];
                    const hasLevel3 = Boolean(level2.level3?.length);
                    const shouldFlattenLevel2 = level2.hideLabel && hasLevel3;

                    return (
                      <div key={level2Key}>
                        {!shouldFlattenLevel2 && (
                          <button
                            type="button"
                            onClick={() => hasLevel3 && toggleLevel2(level1.label, level2.label)}
                            className={cn('app-sidebar__level2', hasLevel3 && isLevel2Expanded && 'app-sidebar__level2--expanded')}
                            aria-expanded={hasLevel3 ? isLevel2Expanded : undefined}
                          >
                            {hasLevel3 ? (
                              <ChevronDown
                                size={14}
                                className={cn(
                                  'app-sidebar__chevron app-sidebar__chevron--small',
                                  !isLevel2Expanded && 'app-sidebar__chevron--collapsed'
                                )}
                              />
                            ) : (
                              <span className="app-sidebar__level2-spacer" />
                            )}
                            <span>{level2.label}</span>
                          </button>
                        )}

                        {hasLevel3 && (shouldFlattenLevel2 || isLevel2Expanded) && (
                          <div className="app-sidebar__level3-wrap">
                            {level2.level3?.map((level3) => (
                              <button
                                key={level3.key}
                                type="button"
                                onClick={() => handleLeafClick(level3)}
                                className={cn('app-sidebar__level3', level3.key === activeLeaf && 'app-sidebar__level3--active')}
                              >
                                {level3.icon && <level3.icon size={15} strokeWidth={1.9} aria-hidden="true" />}
                                <span>{level3.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

    </aside>
  );
};

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeLeaf = 'purchase-requisition',
  isSidebarCollapsed,
  isMobileNavOpen,
  onToggleNavigation,
  onFormLayoutClick,
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [selectedSearchScope, setSelectedSearchScope] = useState<SearchScopeId>('all');
  const [recentSearches, setRecentSearches] = useState<SearchRecentEntry[]>(() => loadRecentSearches());
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [activeSearchIndex, setActiveSearchIndex] = useState(0);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceMessage, setVoiceMessage] = useState('Say a command like “open sale invoice of Neha”.');
  const [voiceSuggestions, setVoiceSuggestions] = useState<GlobalSearchResult[]>([]);
  const [voiceInsight, setVoiceInsight] = useState<SearchInsightMatch | null>(null);
  const [isVoicePanelOpen, setIsVoicePanelOpen] = useState(false);
  const [activeVoiceSuggestionIndex, setActiveVoiceSuggestionIndex] = useState(0);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const globalSearchRef = useRef<HTMLDivElement | null>(null);
  const globalSearchInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const voiceModeRef = useRef<VoiceMode>('direct');
  const voiceTimeoutRef = useRef<number | null>(null);
  const voiceStateRef = useRef<VoiceState>('idle');
  const voiceCommandHandledRef = useRef(false);
  const wakeListenerEnabledRef = useRef(false);
  const startVoiceRecognitionRef = useRef<(mode?: VoiceMode) => void>(() => undefined);
  const { themeKey, theme } = useTheme();
  const deferredSearchQuery = useDeferredValue(globalSearchQuery);
  const searchResolution = useMemo(
    () => resolveSearchExperience(deferredSearchQuery, selectedSearchScope),
    [deferredSearchQuery, selectedSearchScope]
  );
  const flatSearchResults = searchResolution.flatResults;
  const shouldShowSearchPanel = isGlobalSearchOpen;
  const resolvedActiveSearchIndex = Math.min(activeSearchIndex, Math.max(flatSearchResults.length - 1, 0));
  const activeSearchResultId = flatSearchResults[resolvedActiveSearchIndex]
    ? `global-search-result-${flatSearchResults[resolvedActiveSearchIndex].entity}-${flatSearchResults[resolvedActiveSearchIndex].id}`
    : undefined;
  const isVoiceListening = voiceState === 'listening';

  useEffect(() => {
    voiceStateRef.current = voiceState;
  }, [voiceState]);
  const headerLogo =
    themeKey === 'bajaj'
      ? bajajLogo
      : themeKey === 'tata-motors'
        ? tataMotorsLogo
        : themeKey === 'ola'
          ? olaLogo
          : themeKey === 'eka'
            ? ekaLogo
            : themeKey === 'hero'
              ? heroLogo
              : themeKey === 'royal-enfield'
                ? royalEnfieldLogo
                : excellonLogo;
  const moduleLabel =
    activeLeaf === 'purchase-requisition' ||
    activeLeaf === 'purchase-order' ||
    activeLeaf === 'purchase-receipt' ||
    activeLeaf === 'purchase-invoice'
      ? 'Procurement'
      : activeLeaf === 'sale-order' ||
          activeLeaf === 'sale-allocation-requisition' ||
          activeLeaf === 'sale-allocation' ||
          activeLeaf === 'sale-invoice' ||
          activeLeaf === 'delivery'
        ? 'Sales'
        : 'Workspace';

  function clearVoiceTimeout() {
    if (voiceTimeoutRef.current) {
      window.clearTimeout(voiceTimeoutRef.current);
      voiceTimeoutRef.current = null;
    }
  }

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }

      if (!globalSearchRef.current?.contains(event.target as Node) && voiceState !== 'listening') {
        setIsGlobalSearchOpen(false);
        setIsVoicePanelOpen(false);
        setVoiceInsight(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        wakeListenerEnabledRef.current = false;
        setIsProfileMenuOpen(false);
        setIsGlobalSearchOpen(false);
        setIsVoicePanelOpen(false);
        setVoiceInsight(null);
        clearVoiceTimeout();
        recognitionRef.current?.abort();
      }
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [voiceState]);

  useEffect(() => {
    return () => {
      wakeListenerEnabledRef.current = false;
      clearVoiceTimeout();
      recognitionRef.current?.abort();
    };
  }, []);

  const persistRecentSearch = (query: string, scopeId: SearchScopeId = selectedSearchScope) => {
    setRecentSearches(recordRecentSearch(query, scopeId));
  };

  const handleSelectGlobalSearchResult = (
    result: GlobalSearchResult,
    recentQuery: string = globalSearchQuery,
    recentScope: SearchScopeId = selectedSearchScope
  ) => {
    persistRecentSearch(recentQuery, recentScope);
    setGlobalSearchQuery('');
    setIsGlobalSearchOpen(false);
    setActiveSearchIndex(0);
    navigateToHash(result.href);
  };

  const handleVoiceNavigate = (href: string, recentQuery?: string, scopeId: SearchScopeId = 'all') => {
    if (recentQuery) {
      persistRecentSearch(recentQuery, scopeId);
    }
    setIsVoicePanelOpen(false);
    setVoiceSuggestions([]);
    setVoiceInsight(null);
    setActiveVoiceSuggestionIndex(0);
    navigateToHash(href);
  };

  const handleVoiceResolution = (resolution: VoiceCommandResolution) => {
    setVoiceMessage(resolution.message);
    setVoiceSuggestions([]);
    setVoiceInsight(null);

    if (resolution.kind === 'navigate') {
      setVoiceState('success');
      handleVoiceNavigate(resolution.href, resolution.intent.rawText);
      return;
    }

    if (resolution.kind === 'insight') {
      setVoiceState('success');
      setVoiceInsight(resolution.insight);
      setIsVoicePanelOpen(true);
      persistRecentSearch(resolution.query, 'all');
      return;
    }

    if (resolution.kind === 'suggestions') {
      setVoiceState('success');
      setVoiceSuggestions(resolution.suggestions);
      setActiveVoiceSuggestionIndex(0);
      setIsVoicePanelOpen(true);
      persistRecentSearch(resolution.query, 'all');
      return;
    }

    setVoiceState('error');
    setIsVoicePanelOpen(true);
  };

  const startVoiceRecognition = (mode: VoiceMode = 'direct') => {
    const Recognition = getSpeechRecognitionConstructor();

    if (!Recognition) {
      wakeListenerEnabledRef.current = false;
      setVoiceState('unsupported');
      setVoiceTranscript('');
      setVoiceMessage('Voice command is not supported in this browser. You can still use global search.');
      setVoiceSuggestions([]);
      setVoiceInsight(null);
      setIsVoicePanelOpen(true);
      return;
    }

    clearVoiceTimeout();

    recognitionRef.current?.abort();
    voiceModeRef.current = mode;
    voiceCommandHandledRef.current = false;
    const recognition = new Recognition();
    recognitionRef.current = recognition;
    recognition.continuous = mode === 'wake';
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsGlobalSearchOpen(false);
      setVoiceState('listening');
      setVoiceTranscript(mode === 'command' ? 'Hi' : '');
      setVoiceSuggestions([]);
      setVoiceInsight(null);

      if (mode === 'wake') {
        setIsVoicePanelOpen(false);
        setVoiceMessage('Listening quietly for “Hi”.');
        return;
      }

      setIsVoicePanelOpen(true);
      setVoiceMessage(
        mode === 'command'
            ? 'Wake phrase detected. Tell me what to do.'
            : 'Listening... say “Hi” with a command, or speak a command directly.'
      );
    };

    recognition.onresult = (event) => {
      const transcript = getTranscriptFromResults(event.results);
      const currentMode = voiceModeRef.current;

      if (!transcript) {
        if (currentMode === 'wake') {
          return;
        }

        setVoiceState('error');
        setVoiceMessage('I could not hear a command. Please try again.');
        setIsVoicePanelOpen(true);
        setVoiceSuggestions([]);
        setVoiceInsight(null);
        return;
      }

      const wakeCommand = getWakeCommand(transcript);
      const hasFinalTranscript = Array.from(event.results).some((result) => result.isFinal ?? true);

      if (currentMode === 'wake' && !wakeCommand.hasWakePhrase) {
        return;
      }

      setVoiceTranscript(transcript);

      if (!hasFinalTranscript) {
        if (wakeCommand.hasWakePhrase) {
          setIsVoicePanelOpen(true);
        }

        setVoiceMessage(
          wakeCommand.hasWakePhrase
            ? 'Wake phrase detected. Keep speaking your command.'
            : 'Listening... say “Hi” with a command, or speak a command directly.'
        );
        return;
      }

      if (wakeCommand.hasWakePhrase && !wakeCommand.command) {
        setIsVoicePanelOpen(true);
        setVoiceMessage('Hi, I am listening. Say a command like “go to sale order screen”.');
        recognition.stop();
        voiceTimeoutRef.current = window.setTimeout(() => {
          startVoiceRecognition('command');
          voiceTimeoutRef.current = window.setTimeout(() => {
            setVoiceState((current) => (current === 'listening' ? 'error' : current));
            setVoiceMessage('I did not hear a command after “Hi”. Please try again.');
            recognitionRef.current?.abort();
          }, 9000);
        }, 180);
        return;
      }

      const commandToResolve = wakeCommand.hasWakePhrase ? wakeCommand.command : transcript;
      setVoiceTranscript(wakeCommand.hasWakePhrase ? `Hi, ${commandToResolve}` : transcript);
      setVoiceState('processing');
      setIsVoicePanelOpen(true);
      voiceCommandHandledRef.current = true;
      recognition.stop();
      handleVoiceResolution(resolveVoiceCommand(commandToResolve));
    };

    recognition.onerror = (event) => {
      const permissionDenied = event.error === 'not-allowed' || event.error === 'service-not-allowed';
      if (permissionDenied || event.error === 'audio-capture') {
        wakeListenerEnabledRef.current = false;
      }
      setVoiceState('error');
      setVoiceTranscript('');
      setVoiceMessage(
        permissionDenied
          ? 'Microphone permission was denied. Please allow microphone access or use global search.'
          : 'Voice recognition could not complete. Please try again or type your search.'
      );
      setVoiceSuggestions([]);
      setVoiceInsight(null);
      setIsVoicePanelOpen(true);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setVoiceState((current) => (current === 'listening' ? 'idle' : current));

      const shouldResumeWakeListening =
        voiceModeRef.current === 'wake' && wakeListenerEnabledRef.current && !voiceCommandHandledRef.current;

      if (shouldResumeWakeListening) {
        window.setTimeout(() => {
          if (
            wakeListenerEnabledRef.current &&
            !recognitionRef.current &&
            voiceStateRef.current !== 'processing' &&
            voiceStateRef.current !== 'unsupported'
          ) {
            startVoiceRecognitionRef.current('wake');
          }
        }, 450);
      }
    };

    try {
      recognition.start();
    } catch {
      setVoiceState('error');
      setVoiceMessage('Voice recognition is already active. Please wait a moment and try again.');
      setIsVoicePanelOpen(true);
    }
  };

  useEffect(() => {
    startVoiceRecognitionRef.current = startVoiceRecognition;
  });

  useEffect(() => {
    let isCancelled = false;
    let microphonePermission: PermissionStatus | null = null;

    const startWakeListeningIfAllowed = () => {
      if (
        isCancelled ||
        microphonePermission?.state !== 'granted' ||
        recognitionRef.current ||
        voiceStateRef.current === 'listening'
      ) {
        return;
      }

      wakeListenerEnabledRef.current = true;
      startVoiceRecognitionRef.current('wake');
    };

    const initializeWakeListener = async () => {
      if (!navigator.permissions?.query) {
        return;
      }

      try {
        microphonePermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        startWakeListeningIfAllowed();
        microphonePermission.onchange = startWakeListeningIfAllowed;
      } catch {
        // Some browsers do not expose microphone permission state. The mic button still starts voice mode.
      }
    };

    initializeWakeListener();

    return () => {
      isCancelled = true;
      if (microphonePermission) {
        microphonePermission.onchange = null;
      }
    };
  }, []);

  const handleVoiceCommand = () => {
    const isWakeListening = isVoiceListening && voiceModeRef.current === 'wake';

    if (isVoiceListening && !isWakeListening) {
      wakeListenerEnabledRef.current = false;
      recognitionRef.current?.stop();
      clearVoiceTimeout();
      setVoiceState('idle');
      return;
    }

    if (isWakeListening) {
      recognitionRef.current?.abort();
    }

    clearVoiceTimeout();

    setVoiceSuggestions([]);
    setVoiceInsight(null);
    setActiveVoiceSuggestionIndex(0);
    setVoiceTranscript('');
    wakeListenerEnabledRef.current = true;
    startVoiceRecognition('direct');
  };

  const handleVoiceSuggestionKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    result: GlobalSearchResult,
    index: number
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleVoiceNavigate(result.href, voiceTranscript || result.title);
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveVoiceSuggestionIndex(Math.min(index + 1, voiceSuggestions.length - 1));
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveVoiceSuggestionIndex(Math.max(index - 1, 0));
    }
  };

  const handleGlobalSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!shouldShowSearchPanel) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveSearchIndex((current) => Math.min(current + 1, Math.max(flatSearchResults.length - 1, 0)));
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveSearchIndex((current) => Math.max(current - 1, 0));
    }

    if (event.key === 'Enter' && flatSearchResults[resolvedActiveSearchIndex]) {
      event.preventDefault();
      handleSelectGlobalSearchResult(flatSearchResults[resolvedActiveSearchIndex]);
    }

    if (event.key === 'Enter' && !flatSearchResults[resolvedActiveSearchIndex] && searchResolution.commandPreview) {
      event.preventDefault();
      persistRecentSearch(globalSearchQuery, selectedSearchScope);
      setIsGlobalSearchOpen(false);
      setGlobalSearchQuery('');
      navigateToHash(searchResolution.commandPreview.href);
    }

    if (
      event.key === 'Enter' &&
      !flatSearchResults[resolvedActiveSearchIndex] &&
      !searchResolution.commandPreview &&
      searchResolution.insight
    ) {
      event.preventDefault();
      persistRecentSearch(globalSearchQuery, selectedSearchScope);
      setIsGlobalSearchOpen(false);
      setGlobalSearchQuery('');
      navigateToHash(searchResolution.insight.href);
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setIsGlobalSearchOpen(false);
    }
  };

  return (
    <header className="app-topbar">
      <div className="app-topbar__left">
        <button
          type="button"
          onClick={onToggleNavigation}
          className="app-topbar__menu-button"
          aria-label={isMobileNavOpen ? 'Close navigation' : isSidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          aria-expanded={isMobileNavOpen || !isSidebarCollapsed}
        >
          {isMobileNavOpen ? <X size={18} /> : <Grip size={16} />}
        </button>
        <span className="app-topbar__divider" aria-hidden="true" />
        <img
          src={headerLogo}
          alt={theme.label}
          className={cn(
            'app-topbar__logo',
            themeKey === 'bajaj' && 'app-topbar__logo--bajaj',
            themeKey === 'tata-motors' && 'app-topbar__logo--tata-motors',
            themeKey === 'ola' && 'app-topbar__logo--ola',
            themeKey === 'eka' && 'app-topbar__logo--eka',
            themeKey === 'hero' && 'app-topbar__logo--hero',
            themeKey === 'royal-enfield' && 'app-topbar__logo--royal-enfield'
          )}
        />
        <span className="app-topbar__divider app-topbar__divider--wide" aria-hidden="true" />
        <div className="app-topbar__module-label">{moduleLabel}</div>
      </div>

      <div className="app-topbar__center">
        <div
          ref={globalSearchRef}
          className={cn('app-topbar__search-wrap', isGlobalSearchOpen && 'app-topbar__search-wrap--active')}
        >
          <div className={cn('app-topbar__search-shell', isGlobalSearchOpen && 'app-topbar__search-shell--active')}>
            <div className="app-topbar__search-scope">
              <select
                value={selectedSearchScope}
                className="app-topbar__search-scope-select"
                aria-label="Search scope"
                onChange={(event) => {
                  setSelectedSearchScope(event.target.value as SearchScopeId);
                  setActiveSearchIndex(0);
                  setIsGlobalSearchOpen(true);
                }}
              >
                {searchScopeOptions.map((scope) => (
                  <option key={scope.id} value={scope.id}>
                    {scope.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="app-topbar__search-field">
              <Search size={18} className="app-topbar__search-icon" />
              <input
                ref={globalSearchInputRef}
                type="text"
                value={globalSearchQuery}
                placeholder="Search documents, modules, or ask for insights..."
                className="app-topbar__search"
                aria-label="Global navigation search"
                role="combobox"
                aria-expanded={shouldShowSearchPanel}
                aria-controls="global-search-results"
                aria-activedescendant={activeSearchResultId}
                autoComplete="off"
                onChange={(event) => {
                  setGlobalSearchQuery(event.target.value);
                  setActiveSearchIndex(0);
                  setIsGlobalSearchOpen(true);
                }}
                onFocus={() => {
                  setIsGlobalSearchOpen(true);
                }}
                onKeyDown={handleGlobalSearchKeyDown}
              />
              {globalSearchQuery.trim().length > 0 && (
                <button
                  type="button"
                  className="app-topbar__search-clear"
                  onClick={() => {
                    setGlobalSearchQuery('');
                    setActiveSearchIndex(0);
                    setIsGlobalSearchOpen(true);
                    window.setTimeout(() => globalSearchInputRef.current?.focus(), 0);
                  }}
                  aria-label="Clear search"
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <button
            type="button"
            className={cn(
              'app-topbar__voice-button',
              'app-topbar__voice-button--outside',
              isVoiceListening && 'app-topbar__voice-button--listening',
              voiceState === 'error' && 'app-topbar__voice-button--error'
            )}
            onClick={handleVoiceCommand}
            aria-label={isVoiceListening ? 'Stop voice command' : 'Start voice command'}
            aria-pressed={isVoiceListening}
            title={isVoiceListening ? 'Stop listening' : 'Speak a command'}
          >
            {voiceState === 'unsupported' ? <MicOff size={16} /> : <Mic size={16} />}
          </button>

          {shouldShowSearchPanel && (
            <GlobalSearchPanel
              query={globalSearchQuery}
              resultGroups={searchResolution.groups}
              flatResults={flatSearchResults}
              activeSearchIndex={resolvedActiveSearchIndex}
              recentSearches={recentSearches}
              shortcuts={searchModuleShortcuts}
              activeScopeId={selectedSearchScope}
              insight={searchResolution.insight}
              commandPreview={searchResolution.commandPreview}
              onHoverResult={setActiveSearchIndex}
              onSelectResult={handleSelectGlobalSearchResult}
              onSelectRecentSearch={(entry) => {
                setSelectedSearchScope(entry.scopeId);
                setGlobalSearchQuery(entry.query);
                setActiveSearchIndex(0);
                setIsGlobalSearchOpen(true);
                window.setTimeout(() => globalSearchInputRef.current?.focus(), 0);
              }}
              onSelectShortcut={(shortcut) => {
                if (shortcut.scopeId) {
                  setSelectedSearchScope(shortcut.scopeId);
                }
                setActiveSearchIndex(0);
                setIsGlobalSearchOpen(true);
                window.setTimeout(() => globalSearchInputRef.current?.focus(), 0);
              }}
              onSelectCommandPreview={(commandPreview) => {
                persistRecentSearch(globalSearchQuery, selectedSearchScope);
                setIsGlobalSearchOpen(false);
                setGlobalSearchQuery('');
                navigateToHash(commandPreview.href);
              }}
              onNavigateToInsight={(insight) => {
                persistRecentSearch(globalSearchQuery, selectedSearchScope);
                setIsGlobalSearchOpen(false);
                setGlobalSearchQuery('');
                navigateToHash(insight.href);
              }}
            />
          )}

          {isVoicePanelOpen && (
            <div className="app-topbar__voice-panel" role="status" aria-live="polite">
              <div className="app-topbar__voice-panel-header">
                <span
                  className={cn(
                    'app-topbar__voice-orb',
                    isVoiceListening && 'app-topbar__voice-orb--listening',
                    voiceState === 'processing' && 'app-topbar__voice-orb--processing',
                    voiceState === 'error' && 'app-topbar__voice-orb--error'
                  )}
                  aria-hidden="true"
                >
                  {voiceState === 'unsupported' ? <MicOff size={15} /> : <Mic size={15} />}
                </span>
                <div className="app-topbar__voice-copy">
                  <div className="app-topbar__voice-title">
                    {voiceState === 'listening'
                      ? 'Listening'
                      : voiceState === 'processing'
                        ? 'Understanding command'
                        : voiceState === 'unsupported'
                          ? 'Voice unavailable'
                          : voiceState === 'error'
                            ? 'Could not complete'
                            : 'Voice command'}
                  </div>
                  <div className="app-topbar__voice-message">{voiceMessage}</div>
                </div>
                <button
                  type="button"
                  className="app-topbar__voice-close"
                  onClick={() => {
                    wakeListenerEnabledRef.current = false;
                    recognitionRef.current?.abort();
                    clearVoiceTimeout();
                    setIsVoicePanelOpen(false);
                    setVoiceState('idle');
                    setVoiceInsight(null);
                  }}
                  aria-label="Close voice command panel"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="app-topbar__voice-stage" aria-hidden="true">
                <div
                  className={cn(
                    'app-topbar__voice-wave',
                    isVoiceListening && 'app-topbar__voice-wave--listening',
                    voiceState === 'processing' && 'app-topbar__voice-wave--processing',
                    voiceState === 'success' && 'app-topbar__voice-wave--success',
                    voiceState === 'error' && 'app-topbar__voice-wave--error'
                  )}
                >
                  {Array.from({ length: 9 }, (_, index) => (
                    <span key={index} style={{ animationDelay: `${index * 0.08}s` }} />
                  ))}
                </div>
              </div>

              {voiceTranscript && (
                <div className="app-topbar__voice-transcript">
                  <span>You said</span>
                  <strong>{voiceTranscript}</strong>
                </div>
              )}

              {voiceInsight && (
                <button
                  type="button"
                  className="app-topbar__voice-insight"
                  onClick={() => handleVoiceNavigate(voiceInsight.href, voiceTranscript || voiceInsight.title)}
                >
                  <span className="app-topbar__voice-insight-copy">
                    <small>Insight</small>
                    <strong>{voiceInsight.title}</strong>
                    <span>{voiceInsight.description}</span>
                  </span>
                  <span className="app-topbar__voice-insight-value">{voiceInsight.value}</span>
                </button>
              )}

              {voiceSuggestions.length > 0 && (
                <div className="app-topbar__voice-suggestions" role="listbox" aria-label="Voice command matches">
                  {voiceSuggestions.map((result, index) => (
                    <button
                      key={`${result.entity}-${result.id}`}
                      type="button"
                      role="option"
                      aria-selected={index === activeVoiceSuggestionIndex}
                      className={cn(
                        'app-topbar__voice-suggestion',
                        index === activeVoiceSuggestionIndex && 'app-topbar__voice-suggestion--active'
                      )}
                      onMouseEnter={() => setActiveVoiceSuggestionIndex(index)}
                      onKeyDown={(event) => handleVoiceSuggestionKeyDown(event, result, index)}
                      onClick={() => handleVoiceNavigate(result.href, voiceTranscript || result.title)}
                    >
                      <span>
                        <strong>{result.title}</strong>
                        <small>{result.groupLabel}</small>
                      </span>
                      <span className="app-topbar__voice-suggestion-meta">
                        {result.status && <span className="brand-badge">{result.status}</span>}
                        {result.date && <span>{formatDate(result.date)}</span>}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="app-topbar__right">
        <ThemeSwitcher />

        <button type="button" className="app-topbar__icon-button" aria-label="Notifications">
          <Bell size={18} className="app-topbar__icon" />
          <span className="app-topbar__notification-dot" />
        </button>

        <button type="button" className="app-topbar__icon-button app-topbar__icon-button--secondary" aria-label="Help">
          <HelpCircle size={18} className="app-topbar__icon" />
        </button>

        <div ref={profileMenuRef} className="app-topbar__profile-menu">
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen((current) => !current)}
            className={cn('app-topbar__profile-trigger', isProfileMenuOpen && 'app-topbar__profile-trigger--open')}
            aria-label="Open profile menu"
            aria-expanded={isProfileMenuOpen}
          >
            <div className="app-topbar__avatar">AK</div>
            <div className="app-topbar__profile-text">
              <div className="app-topbar__profile-name">Alex Kumar</div>
              <div className="app-topbar__profile-role">Buyer Lead</div>
            </div>
            <ChevronDown
              size={16}
              className={cn('app-topbar__profile-chevron', isProfileMenuOpen && 'app-topbar__profile-chevron--open')}
            />
          </button>

          {isProfileMenuOpen && (
            <div className="app-topbar__dropdown" role="menu" aria-label="Profile actions">
              <button type="button" className="app-topbar__dropdown-item" role="menuitem">
                <UserCircle2 size={16} />
                Profile
              </button>
              <button type="button" className="app-topbar__dropdown-item" role="menuitem">
                <Settings size={16} />
                Preferences
              </button>
              <button
                type="button"
                className="app-topbar__dropdown-item"
                role="menuitem"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  if (onFormLayoutClick) {
                    onFormLayoutClick();
                    return;
                  }
                  navigateToHash('#/profile/form-layout');
                }}
              >
                <LayoutDashboard size={16} />
                Form Layout
              </button>
              <button type="button" className="app-topbar__dropdown-item" role="menuitem">
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

const AppShell: React.FC<AppShellProps> = ({
  children,
  activeLeaf = 'purchase-requisition',
  bottomBar,
  contentClassName,
  contentRef,
  onContentScroll,
  onPurchaseOrderClick,
  onPurchaseReceiptClick,
  onPurchaseInvoiceClick,
  onPurchaseRequisitionClick,
  onSaleOrderClick,
  onSaleAllocationRequisitionClick,
  onSaleAllocationClick,
  onSaleInvoiceClick,
  onDeliveryClick,
  onFormLayoutClick,
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const handleToggleNavigation = () => {
    if (window.innerWidth > 1024) {
      setIsSidebarCollapsed((current) => !current);
      return;
    }

    setIsMobileNavOpen((current) => !current);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setIsMobileNavOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileNavOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <div className="app-shell">
      <TopHeader
        activeLeaf={activeLeaf}
        isSidebarCollapsed={isSidebarCollapsed}
        isMobileNavOpen={isMobileNavOpen}
        onToggleNavigation={handleToggleNavigation}
        onFormLayoutClick={onFormLayoutClick}
      />
      <div className="app-shell__body">
        <Sidebar
          activeLeaf={activeLeaf}
          isCollapsed={isSidebarCollapsed}
          onPurchaseOrderClick={onPurchaseOrderClick}
          onPurchaseReceiptClick={onPurchaseReceiptClick}
          onPurchaseInvoiceClick={onPurchaseInvoiceClick}
          onPurchaseRequisitionClick={onPurchaseRequisitionClick}
          onSaleOrderClick={onSaleOrderClick}
          onSaleAllocationRequisitionClick={onSaleAllocationRequisitionClick}
          onSaleAllocationClick={onSaleAllocationClick}
          onSaleInvoiceClick={onSaleInvoiceClick}
          onDeliveryClick={onDeliveryClick}
          isMobileOpen={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
        />
        <button
          type="button"
          className={cn('app-shell__overlay', isMobileNavOpen && 'app-shell__overlay--visible')}
          onClick={() => setIsMobileNavOpen(false)}
          aria-label="Close navigation overlay"
          aria-hidden={!isMobileNavOpen}
          tabIndex={isMobileNavOpen ? 0 : -1}
        />
        <div className="app-shell__main">
          <div
            ref={contentRef}
            onScroll={onContentScroll}
            className={cn('app-shell__content', contentClassName)}
          >
            {children}
          </div>
          {bottomBar && <div className="app-shell__bottom-bar">{bottomBar}</div>}
        </div>
      </div>
    </div>
  );
};

export default AppShell;
