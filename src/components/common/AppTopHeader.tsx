import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  ClipboardCheck,
  FilePlus2,
  HelpCircle,
  Keyboard,
  MessageSquare,
  Layers,
  LayoutDashboard,
  LogOut,
  Mic,
  MicOff,
  Moon,
  Grip,
  Palette,
  Plus,
  Printer,
  ReceiptText,
  Settings,
  Search,
  Sun,
  ShoppingBag,
  ShoppingCart,
  Menu,
  X,
} from 'lucide-react';
import {
  bajajLogoDark,
  ekaLogoWhite,
  excellonsoftLogo,
  heroLogo,
  olaLogo,
  royalEnfieldLogoWhite,
  tataMotorsLogo,
} from '../../assets/images/image';
import type { GlobalSearchResult } from '../../search/globalSearch';
import {
  loadRecentSearches,
  recordRecentSearch,
  resolveSearchExperience,
  searchModuleShortcuts,
  searchScopeOptions,
  type SearchRecentEntry,
  type SearchScopeId,
} from '../../search/searchExperience';
import type { SearchInsightMatch } from '../../search/searchInsights';
import { resolveVoiceCommand, type VoiceCommandResolution } from '../../search/voiceCommand';
import { useTheme } from '../../theme/useTheme';
import { formatDate } from '../../utils/dateFormat';
import { cn } from '../../utils/classNames';
import { useLocalization } from '../../localization';
import { paths } from '../../routes/routeConfig';
import GlobalSearchPanel from './GlobalSearchPanel';
import HeaderSettingsDialog from './HeaderSettingsDialog';
import ProfilePanel, { type ProfilePanelAction, type ProfilePanelWorkspaceItem } from './ProfilePanel';
import { HelpDrawer } from '../../experience/components/HelpDrawer';
import { getHelpTopic } from '../../experience/help/helpTopics';
import {
  type BrowserSpeechRecognition,
  getSpeechRecognitionConstructor,
  getTranscriptFromResults,
  getWakeCommand,
  navigateToHash,
  type TopHeaderProps,
  type VoiceMode,
  type VoiceState,
} from './appShellShared';


const AppTopHeader: React.FC<TopHeaderProps> = ({
  activeLeaf = 'purchase-requisition',
  isSidebarCollapsed,
  isMobileNavOpen,
  onToggleNavigation,
  onFormLayoutClick,
  onBusinessSettingsClick,
}) => {
  const { t } = useLocalization();
  const location = useLocation();
  const navigate = useNavigate();
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
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [isHelpActionsOpen, setIsHelpActionsOpen] = useState(false);
  const [helpTopicId, setHelpTopicId] = useState('admin-dashboard');
  const [isHelpDrawerOpen, setIsHelpDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const notificationCount = 3;
  const profileIdentity = {
    initials: 'AK',
    name: 'Alex Kumar',
    role: 'Buyer Lead',
  } as const;
  const quickActionsRef = useRef<HTMLDivElement | null>(null);
  const quickActionTriggerRef = useRef<HTMLButtonElement | null>(null);
  const helpActionsRef = useRef<HTMLDivElement | null>(null);
  const helpActionTriggerRef = useRef<HTMLButtonElement | null>(null);
  const profileTriggerRef = useRef<HTMLButtonElement | null>(null);
  const globalSearchRef = useRef<HTMLDivElement | null>(null);
  const globalSearchInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const voiceModeRef = useRef<VoiceMode>('direct');
  const voiceTimeoutRef = useRef<number | null>(null);
  const voiceStateRef = useRef<VoiceState>('idle');
  const voiceCommandHandledRef = useRef(false);
  const wakeListenerEnabledRef = useRef(false);
  const startVoiceRecognitionRef = useRef<(mode?: VoiceMode) => void>(() => undefined);
  const { themeKey, theme, appearanceMode, setAppearanceMode } = useTheme();
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
  const isMastersWorkspace = location.pathname.startsWith(paths.adminMaster);


  const quickActions = [
    { key: 'job-card', label: 'Job Card', href: '#/job-card', icon: <ClipboardCheck size={16} /> },
    { key: 'service-estimate', label: 'Estimate', href: '#/service-estimate', icon: <FilePlus2 size={16} /> },
    { key: 'purchase-order', label: 'Purchase Order', href: '#/purchase-order/new', icon: <ShoppingCart size={16} /> },
    { key: 'sale-order', label: 'Sale Order', href: '#/sale-order/new', icon: <ShoppingBag size={16} /> },
    { key: 'sale-invoice', label: 'Sale Invoice', href: '#/sale-invoice/new', icon: <ReceiptText size={16} /> },
  ] as const;

  const helpActions = [
    { key: 'page-help', label: 'Help for this page', description: 'Contextual guidance for this page.', topicId: 'admin-dashboard', icon: <HelpCircle size={16} /> },
    { key: 'keyboard-shortcuts', label: 'Keyboard shortcuts', description: 'Search, navigation and productivity commands.', topicId: 'keyboard-shortcuts', icon: <Keyboard size={16} /> },
    { key: 'contact-support', label: 'Contact support', description: 'Create a support request with diagnostics.', topicId: 'contact-support', icon: <MessageSquare size={16} /> },
  ] as const;

  const closeProfilePanel = () => {
    setIsProfileMenuOpen(false);
  };

  const handleProfileTriggerClick = () => {
    setIsQuickActionsOpen(false);
    setIsHelpActionsOpen(false);
    setIsProfileMenuOpen((current) => !current);
  };

  const openProfileSettings = () => {
    closeProfilePanel();
    setIsSettingsOpen(true);
  };

  const openProfileHelpTopic = (topicId: string) => {
    closeProfilePanel();
    openHelpTopic(topicId);
  };

  const profileWorkspaceItems: ProfilePanelWorkspaceItem[] = [
    {
      id: 'transactions',
      label: 'Transactions',
      icon: ReceiptText,
      active: !isMastersWorkspace,
      onClick: () => {
        closeProfilePanel();
        navigate(paths.home);
      },
    },
    {
      id: 'masters',
      label: 'Masters',
      icon: Layers,
      active: isMastersWorkspace,
      onClick: () => {
        closeProfilePanel();
        navigate(paths.adminMaster);
      },
    },
  ];

  const profileAppearanceControls = (
    <section className="app-topbar__workspace-switch app-topbar__workspace-switch--profile-panel" aria-label="Appearance">
      <div className="app-topbar__workspace-switch-head">
        <span className="app-topbar__workspace-switch-title">Appearance</span>
        <span className="app-topbar__workspace-switch-hint">Choose display mode.</span>
      </div>
      <div className="app-topbar__workspace-switch-options" role="radiogroup" aria-label="Display mode">
        <button
          type="button"
          role="radio"
          aria-checked={appearanceMode === 'light'}
          className={cn('app-topbar__workspace-switch-option', appearanceMode === 'light' && 'app-topbar__workspace-switch-option--active')}
          onClick={() => setAppearanceMode('light')}
        >
          <span className="app-topbar__workspace-switch-icon" aria-hidden="true">
            <Sun size={14} />
          </span>
          <span className="app-topbar__workspace-switch-label">Light</span>
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={appearanceMode === 'dark'}
          className={cn('app-topbar__workspace-switch-option', appearanceMode === 'dark' && 'app-topbar__workspace-switch-option--active')}
          onClick={() => setAppearanceMode('dark')}
        >
          <span className="app-topbar__workspace-switch-icon" aria-hidden="true">
            <Moon size={14} />
          </span>
          <span className="app-topbar__workspace-switch-label">Dark</span>
        </button>
      </div>
    </section>
  );
  const profileFeaturedActions: ProfilePanelAction[] = [
    {
      id: 'keyboard-shortcuts',
      label: 'Keyboard shortcuts',
      description: 'Press ? to view shortcuts.',
      icon: Keyboard,
      accent: true,
      onClick: () => openProfileHelpTopic('keyboard-shortcuts'),
    },
    {
      id: 'support-portal',
      label: 'View support portal',
      description: 'Open help and diagnostics.',
      icon: MessageSquare,
      onClick: () => openProfileHelpTopic('contact-support'),
    },
  ];

  const profileUtilityActions: ProfilePanelAction[] = [
    {
      id: 'business-settings',
      label: t('header.businessSettings'),
      icon: Settings,
      onClick: () => {
        closeProfilePanel();
        if (onBusinessSettingsClick) {
          onBusinessSettingsClick();
          return;
        }
        navigateToHash('#/profile/business-settings');
      },
    },
    {
      id: 'print-builder',
      label: t('header.printBuilder'),
      icon: Printer,
      onClick: () => {
        closeProfilePanel();
        navigateToHash('#/profile/print-builder');
      },
    },
    {
      id: 'language-builder',
      label: t('header.languageBuilder'),
      icon: Settings,
      onClick: () => {
        closeProfilePanel();
        navigateToHash('#/profile/language-builder');
      },
    },
    {
      id: 'theme-builder',
      label: t('header.themeBuilder'),
      icon: Palette,
      onClick: () => {
        closeProfilePanel();
        navigateToHash('#/profile/theme-builder');
      },
    },
    {
      id: 'menu-builder',
      label: t('header.menuBuilder'),
      icon: Grip,
      onClick: () => {
        closeProfilePanel();
        navigateToHash('#/profile/menu-builder');
      },
    },
    {
      id: 'form-layout',
      label: t('header.formLayout'),
      icon: LayoutDashboard,
      onClick: () => {
        closeProfilePanel();
        if (onFormLayoutClick) {
          onFormLayoutClick();
          return;
        }
        navigateToHash('#/profile/form-layout');
      },
    },
    {
      id: 'sign-out',
      label: t('header.signOut'),
      description: 'Not configured in this build.',
      icon: LogOut,
      disabled: true,
    },
  ];
  useEffect(() => {
    voiceStateRef.current = voiceState;
  }, [voiceState]);

  const headerLogo =
    theme.logoDataUrl ??
    (themeKey === 'bajaj'
      ? bajajLogoDark
      : themeKey === 'tata-motors'
        ? tataMotorsLogo
        : themeKey === 'ola'
          ? olaLogo
          : themeKey === 'eka'
            ? ekaLogoWhite
            : themeKey === 'hero'
              ? heroLogo
              : themeKey === 'royal-enfield'
                ? royalEnfieldLogoWhite
                : excellonsoftLogo);
  const moduleLabel =
    activeLeaf === 'approval-studio'
      ? t('module.approvalStudio')
      : activeLeaf === 'purchase-requisition' ||
    activeLeaf === 'purchase-order' ||
    activeLeaf === 'purchase-receipt' ||
    activeLeaf === 'purchase-invoice'
      ? t('module.procurement')
      : activeLeaf === 'job-card'
        ? t('module.services')
        : activeLeaf === 'sale-order' ||
          activeLeaf === 'sale-allocation-requisition' ||
          activeLeaf === 'sale-allocation' ||
          activeLeaf === 'sale-invoice' ||
          activeLeaf === 'delivery'
        ? t('module.sales')
        : t('module.workspace');

  function clearVoiceTimeout() {
    if (voiceTimeoutRef.current) {
      window.clearTimeout(voiceTimeoutRef.current);
      voiceTimeoutRef.current = null;
    }
  }

  const closeHelpActions = () => {
    setIsHelpActionsOpen(false);
    window.setTimeout(() => helpActionTriggerRef.current?.focus(), 0);
  };

  const openHelpTopic = (topicId: string) => {
    setHelpTopicId(topicId);
    setIsHelpDrawerOpen(true);
  };
  const closeQuickActions = () => {
    setIsQuickActionsOpen(false);
    window.setTimeout(() => quickActionTriggerRef.current?.focus(), 0);
  };

  const closeSettings = () => {
    setIsSettingsOpen(false);
    window.setTimeout(() => profileTriggerRef.current?.focus(), 0);
  };

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!quickActionsRef.current?.contains(event.target as Node)) {
        setIsQuickActionsOpen(false);
      }

      if (!helpActionsRef.current?.contains(event.target as Node)) {
        setIsHelpActionsOpen(false);
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
        closeQuickActions();
        closeHelpActions();
        setIsHelpDrawerOpen(false);
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
          {isMobileNavOpen ? <X size={18} /> : <Menu size={16} />}
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
        <button
          type="button"
          className={cn('app-topbar__mobile-search-trigger', isGlobalSearchOpen && 'app-topbar__mobile-search-trigger--active')}
          aria-label={t('header.searchPlaceholder')}
          aria-haspopup="dialog"
          aria-expanded={isGlobalSearchOpen}
          onClick={() => {
            setIsQuickActionsOpen(false);
            setIsHelpActionsOpen(false);
            setIsGlobalSearchOpen(true);
            window.setTimeout(() => globalSearchInputRef.current?.focus(), 0);
          }}
        >
          <Search size={16} />
        </button>
        <div
          ref={globalSearchRef}
          className={cn('app-topbar__search-wrap', isGlobalSearchOpen && 'app-topbar__search-wrap--active')}
        >
          <div className={cn('app-topbar__search-shell', isGlobalSearchOpen && 'app-topbar__search-shell--active')}>
            <div className="app-topbar__search-scope">
              <select
                value={selectedSearchScope}
                className="app-topbar__search-scope-select"
                aria-label={t('header.searchScope')}
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
                placeholder={t('header.searchPlaceholder')}
                className="app-topbar__search"
                aria-label={t('header.searchPlaceholder')}
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
                  aria-label={t('common.clear')}
                  title={t('common.clear')}
                >
                  <X size={14} />
                </button>
              )}
              <button
                type="button"
                className={cn(
                  'app-topbar__voice-button',
                  'app-topbar__voice-button--inside',
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
            </div>
          </div>


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
        <div ref={quickActionsRef} className="app-topbar__quick-actions">
          <button
            ref={quickActionTriggerRef}
            type="button"
            className={cn(
              'app-topbar__quick-action',
              'app-topbar__quick-action-trigger',
              isQuickActionsOpen && 'app-topbar__quick-action-trigger--open'
            )}
            aria-label="Quick actions"
            aria-haspopup="menu"
            aria-expanded={isQuickActionsOpen}
            onClick={() => {
              setIsHelpActionsOpen(false);
              setIsQuickActionsOpen((current) => !current);
            }}
          >
            <Plus size={16} />
          </button>

          {isQuickActionsOpen && (
            <div className="app-topbar__dropdown app-topbar__dropdown--quick-actions" role="menu" aria-label="Quick actions">
              <div className="app-topbar__quick-actions-header">
                <div className="app-topbar__quick-actions-copy">
                  <div className="app-topbar__quick-actions-title">Quick actions</div>
                </div>
                <button
                  type="button"
                  className="app-topbar__quick-actions-close"
                  aria-label="Close quick actions"
                  onClick={closeQuickActions}
                >
                  <X size={14} />
                </button>
              </div>

              <div className="app-topbar__quick-actions-list">
                {quickActions.map((action) => (
                  <button
                    key={action.key}
                    type="button"
                    role="menuitem"
                    className={cn('app-topbar__dropdown-item app-topbar__dropdown-item--quick-action')}
                    onClick={() => {
                      closeQuickActions();
                      navigateToHash(action.href);
                    }}
                  >
                    <span className="app-topbar__quick-actions-item-icon">{action.icon}</span>
                    <span className="app-topbar__dropdown-item-copy app-topbar__quick-actions-item-copy">
                      <strong>{action.label}</strong>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div ref={helpActionsRef} className="app-topbar__help">
          <button
            ref={helpActionTriggerRef}
            type="button"
            className={cn('app-topbar__icon-button app-topbar__help-trigger', isHelpActionsOpen && 'app-topbar__help-trigger--open')}
            aria-label="Help and support"
            aria-haspopup="menu"
            aria-expanded={isHelpActionsOpen}
            onClick={() => {
              setIsQuickActionsOpen(false);
              setIsHelpActionsOpen((current) => !current);
            }}
          >
            <HelpCircle size={18} className="app-topbar__icon" />
          </button>

          {isHelpActionsOpen && (
            <div className="app-topbar__dropdown app-topbar__dropdown--help" role="menu" aria-label="Help and support">
              <div className="app-topbar__quick-actions-header">
                <div className="app-topbar__help-copy">
                  <div className="app-topbar__help-title">Help and support</div>
                </div>
                <button
                  type="button"
                  className="app-topbar__quick-actions-close"
                  aria-label="Close help and support"
                  onClick={closeHelpActions}
                >
                  <X size={14} />
                </button>
              </div>

              <div className="app-topbar__help-list">
                {helpActions.map((action) => (
                  <button
                    key={action.key}
                    type="button"
                    role="menuitem"
                    className="app-topbar__dropdown-item app-topbar__dropdown-item--help"
                    onClick={() => {
                      closeHelpActions();
                      openHelpTopic(action.topicId);
                    }}
                  >
                    <span className="app-topbar__help-item-icon">{action.icon}</span>
                    <span className="app-topbar__dropdown-item-copy app-topbar__help-item-copy">
                      <strong>{action.label}</strong>
                      <small>{action.description}</small>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          className="app-topbar__icon-button app-topbar__notification-button"
          aria-label={t('header.notifications')}
        >
          <span className="app-topbar__notification-icon" aria-hidden="true">
            <Bell size={18} className="app-topbar__icon" />
          </span>
          {notificationCount > 0 && (
            <span className="app-topbar__notification-badge" aria-hidden="true">
              <span className="app-topbar__notification-badge-count">{notificationCount}</span>
            </span>
          )}
        </button>

        <div className="app-topbar__profile-menu">
          <button
            ref={profileTriggerRef}
            type="button"
            onClick={handleProfileTriggerClick}
            className={cn('app-topbar__profile-trigger', isProfileMenuOpen && 'app-topbar__profile-trigger--open')}
            aria-label="Open profile panel"
            aria-haspopup="dialog"
            aria-expanded={isProfileMenuOpen}
          >
            <div className="app-topbar__avatar">{profileIdentity.initials}</div>
            <div className="app-topbar__profile-text">
              <div className="app-topbar__profile-name">{profileIdentity.name}</div>
              <div className="app-topbar__profile-role">{profileIdentity.role}</div>
            </div>
            <ChevronDown
              size={16}
              className={cn('app-topbar__profile-chevron', isProfileMenuOpen && 'app-topbar__profile-chevron--open')}
            />
          </button>

          <ProfilePanel
            open={isProfileMenuOpen}
            onClose={closeProfilePanel}
            triggerRef={profileTriggerRef}
            name={profileIdentity.name}
            role={profileIdentity.role}
            initials={profileIdentity.initials}
            settingsLabel="Profile settings"
            onOpenSettings={openProfileSettings}
            workspaceTitle="Workspace mode"
            workspaceHint="Choose where you want to work."
            workspaceItems={profileWorkspaceItems}
            appearanceControls={profileAppearanceControls}
            featuredActions={profileFeaturedActions}
            utilityActions={profileUtilityActions}
          />
        </div>
      </div>
      <HeaderSettingsDialog
        open={isSettingsOpen}
        onClose={closeSettings}
        onBusinessSettingsClick={onBusinessSettingsClick}
        onFormLayoutClick={onFormLayoutClick}
      />
      <HelpDrawer
        open={isHelpDrawerOpen}
        topic={getHelpTopic(helpTopicId)}
        onClose={() => setIsHelpDrawerOpen(false)}
        onTopicChange={(id) => setHelpTopicId(id)}
        titleFallback="Help and support"
      />
    </header>
  );
};

export default AppTopHeader;
