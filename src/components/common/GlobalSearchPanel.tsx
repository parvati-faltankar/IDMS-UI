import React from 'react';
import {
  Boxes,
  ClipboardList,
  Clock3,
  FileStack,
  LayoutTemplate,
  PackageCheck,
  ReceiptText,
  Search,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Truck,
  Wand2,
} from 'lucide-react';
import { cn } from '../../utils/classNames';
import { formatDate } from '../../utils/dateFormat';
import type { GlobalSearchGroup, GlobalSearchResult } from '../../search/globalSearch';
import type {
  SearchCommandPreview,
  SearchModuleShortcut,
  SearchRecentEntry,
  SearchScopeId,
} from '../../search/searchExperience';
import type { SearchInsightMatch } from '../../search/searchInsights';

interface GlobalSearchPanelProps {
  query: string;
  resultGroups: GlobalSearchGroup[];
  flatResults: GlobalSearchResult[];
  activeSearchIndex: number;
  recentSearches: SearchRecentEntry[];
  shortcuts: SearchModuleShortcut[];
  activeScopeId: SearchScopeId;
  insight: SearchInsightMatch | null;
  commandPreview: SearchCommandPreview | null;
  onHoverResult: (index: number) => void;
  onSelectResult: (result: GlobalSearchResult) => void;
  onSelectCommandPreview: (commandPreview: SearchCommandPreview) => void;
  onSelectRecentSearch: (entry: SearchRecentEntry) => void;
  onSelectShortcut: (shortcut: SearchModuleShortcut) => void;
  onNavigateToInsight?: (insight: SearchInsightMatch) => void;
}

function highlightMatch(value: string, query: string) {
  const normalizedValue = value.toLowerCase();
  const normalizedQuery = query.trim().toLowerCase();
  const matchIndex = normalizedQuery ? normalizedValue.indexOf(normalizedQuery) : -1;

  if (matchIndex < 0) {
    return value;
  }

  return (
    <>
      {value.slice(0, matchIndex)}
      <mark className="app-topbar__search-highlight">
        {value.slice(matchIndex, matchIndex + normalizedQuery.length)}
      </mark>
      {value.slice(matchIndex + normalizedQuery.length)}
    </>
  );
}

function shortcutIcon(shortcut: SearchModuleShortcut) {
  switch (shortcut.icon) {
    case 'procurement':
      return <Boxes size={16} />;
    case 'sales':
      return <ShoppingBag size={16} />;
    case 'purchase-requisition':
      return <ClipboardList size={16} />;
    case 'purchase-order':
      return <ShoppingCart size={16} />;
    case 'purchase-receipt':
      return <PackageCheck size={16} />;
    case 'purchase-invoice':
      return <ReceiptText size={16} />;
    case 'sale-order':
      return <ShoppingBag size={16} />;
    case 'sale-invoice':
      return <ReceiptText size={16} />;
    case 'sale-allocation':
      return <FileStack size={16} />;
    case 'delivery':
      return <Truck size={16} />;
    case 'form-layout':
      return <LayoutTemplate size={16} />;
    default:
      return <Search size={16} />;
  }
}

const GlobalSearchPanel: React.FC<GlobalSearchPanelProps> = ({
  query,
  resultGroups,
  flatResults,
  activeSearchIndex,
  recentSearches,
  shortcuts,
  activeScopeId,
  insight,
  commandPreview,
  onHoverResult,
  onSelectResult,
  onSelectCommandPreview,
  onSelectRecentSearch,
  onSelectShortcut,
  onNavigateToInsight,
}) => {
  const hasQuery = query.trim().length > 0;
  const hasResults = flatResults.length > 0;
  const shouldShowHelper = !hasQuery;
  const shouldShowEmptyState = hasQuery && !hasResults && !insight && !commandPreview;

  return (
    <div className="app-topbar__search-panel" id="global-search-results">
      <div className="app-topbar__search-panel-layout">
        <aside className="app-topbar__search-panel-sidebar" aria-label="Search support">
          {recentSearches.length > 0 && (
            <section className="app-topbar__search-side-section">
              <div className="app-topbar__search-side-header">
                <span>Recent searches</span>
              </div>

              <div className="app-topbar__search-recent-list">
                {recentSearches.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    className="app-topbar__search-recent-item"
                    onClick={() => onSelectRecentSearch(entry)}
                  >
                    <span className="app-topbar__search-recent-icon">
                      <Clock3 size={14} />
                    </span>
                    <span className="app-topbar__search-recent-copy">
                      <strong>{entry.query}</strong>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="app-topbar__search-side-section">
            <div className="app-topbar__search-side-header">
              <span>Modules & documents</span>
            </div>

            <div className="app-topbar__search-shortcut-list">
              {shortcuts.map((shortcut) => (
                <button
                  key={shortcut.id}
                  type="button"
                  className={cn(
                    'app-topbar__search-shortcut',
                    shortcut.scopeId === activeScopeId && 'app-topbar__search-shortcut--active'
                  )}
                  onClick={() => onSelectShortcut(shortcut)}
                >
                  <span className="app-topbar__search-shortcut-icon">{shortcutIcon(shortcut)}</span>
                  <span className="app-topbar__search-shortcut-copy">
                    <strong>{shortcut.label}</strong>
                  </span>
                </button>
              ))}
            </div>
          </section>
        </aside>

        <section className="app-topbar__search-panel-results" aria-live="polite">
          {shouldShowHelper ? (
            <div className="app-topbar__search-helper">
              <div className="app-topbar__search-helper-heading">Do more with Search!</div>

              <div className="app-topbar__search-helper-block">
                <span className="app-topbar__search-helper-icon">
                  <Search size={16} />
                </span>
                <div className="app-topbar__search-helper-copy">
                  <strong>Get the right answer by searching...</strong>
                  <span className="app-topbar__search-helper-example">"Sale Order of Neha"</span>
                  <span className="app-topbar__search-helper-example">"Open Purchase Order of HPCL"</span>
                </div>
              </div>

              <div className="app-topbar__search-helper-block">
                <span className="app-topbar__search-helper-icon">
                  <Wand2 size={16} />
                </span>
                <div className="app-topbar__search-helper-copy">
                  <strong>Get insights</strong>
                  <span className="app-topbar__search-helper-example">"Today&apos;s total sale"</span>
                  <span className="app-topbar__search-helper-example">"Today&apos;s total purchase"</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              {!shouldShowEmptyState && (
                <div className="app-topbar__search-results-head">
                  <span>Live results</span>
                  <span>{flatResults.length} result{flatResults.length === 1 ? '' : 's'}</span>
                </div>
              )}

              <div className="app-topbar__search-results-scroll">
                {insight && (
                  <button
                    type="button"
                    className="app-topbar__search-insight-card"
                    onClick={() => onNavigateToInsight?.(insight)}
                  >
                    <span className="app-topbar__search-insight-icon">
                      <Sparkles size={16} />
                    </span>
                    <span className="app-topbar__search-insight-copy">
                      <small>Insight</small>
                      <strong>{insight.title}</strong>
                      <span>{insight.description}</span>
                    </span>
                    <span className="app-topbar__search-insight-value">{insight.value}</span>
                  </button>
                )}

                {commandPreview && (
                  <button
                    type="button"
                    className="app-topbar__search-command-card"
                    onClick={() => onSelectCommandPreview(commandPreview)}
                  >
                    <span className="app-topbar__search-command-icon">
                      <Sparkles size={16} />
                    </span>
                    <span className="app-topbar__search-command-copy">
                      <small>Suggested action</small>
                      <strong>{commandPreview.title}</strong>
                      <span>{commandPreview.description}</span>
                    </span>
                  </button>
                )}

                <div className="app-topbar__search-groups">
                  {resultGroups.map((group) => (
                    <section key={group.entity} className="app-topbar__search-group" aria-label={group.label}>
                      <div className="app-topbar__search-group-title">{group.label}</div>
                      {group.results.map((result) => {
                        const resultIndex = flatResults.findIndex(
                          (item) => item.entity === result.entity && item.id === result.id
                        );
                        const isActive = resultIndex === activeSearchIndex;
                        const resultId = `global-search-result-${result.entity}-${result.id}`;

                        return (
                          <button
                            key={`${result.entity}-${result.id}`}
                            id={resultId}
                            type="button"
                            role="option"
                            aria-selected={isActive}
                            className={cn('app-topbar__search-result', isActive && 'app-topbar__search-result--active')}
                            onMouseEnter={() => onHoverResult(resultIndex)}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => onSelectResult(result)}
                          >
                            <span className="app-topbar__search-result-main">
                              <span className="app-topbar__search-result-title">
                                {highlightMatch(result.title, query)}
                              </span>
                              <span className="app-topbar__search-result-subtitle">
                                {highlightMatch(result.subtitle, query)}
                              </span>
                            </span>
                            <span className="app-topbar__search-result-meta">
                              {result.status && <span className="brand-badge">{result.status}</span>}
                              {result.date && <span>{formatDate(result.date)}</span>}
                              {result.amount && <span>{result.amount}</span>}
                            </span>
                            <span className="app-topbar__search-result-description">
                              {highlightMatch(result.description, query)}
                            </span>
                          </button>
                        );
                      })}
                    </section>
                  ))}
                </div>

                {shouldShowEmptyState && (
                  <div className="app-topbar__search-results-empty">
                    No matching results yet. Try a document number, supplier, customer, or a simpler phrase.
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default GlobalSearchPanel;
