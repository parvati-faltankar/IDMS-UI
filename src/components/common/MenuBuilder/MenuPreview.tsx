/**
 * Menu Preview Component
 * Displays a live preview of the menu as it will appear in the navigation
 */

import React, { useState } from 'react';
import { ChevronDown, Monitor, Smartphone } from 'lucide-react';
import type { MenuSectionData } from '../../../utils/menuBuilderTypes';
import { cn } from '../../../utils/classNames';
import { getDefaultItemIconName, getDefaultSectionIconName, getIconByName } from '../../../utils/menuBuilderNavigation';

interface MenuPreviewProps {
  sections: MenuSectionData[];
  title?: string;
  className?: string;
}

const MenuPreview: React.FC<MenuPreviewProps> = ({
  sections,
  title = 'Menu Preview',
  className,
}) => {
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
    sections.reduce((acc, section) => ({ ...acc, [section.id]: true }), {})
  );

  const [expandedLevel2s, setExpandedLevel2s] = useState<Record<string, boolean>>({});

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const toggleLevel2 = (level2Id: string) => {
    setExpandedLevel2s((prev) => ({
      ...prev,
      [level2Id]: !prev[level2Id],
    }));
  };

  return (
    <div className={cn('border rounded-lg bg-white shadow-sm', className)}>
      <div className="p-4 border-b flex items-center justify-between gap-3">
        <h3 className="font-semibold text-sm">{title}</h3>
        <div className="inline-flex rounded-md border border-gray-200 bg-gray-50 p-1 text-xs">
          <button
            type="button"
            onClick={() => setPreviewMode('desktop')}
            className={cn(
              'inline-flex items-center gap-1 rounded px-2 py-1 transition-colors',
              previewMode === 'desktop' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
            )}
          >
            <Monitor size={12} />
            Desktop
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode('mobile')}
            className={cn(
              'inline-flex items-center gap-1 rounded px-2 py-1 transition-colors',
              previewMode === 'mobile' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
            )}
          >
            <Smartphone size={12} />
            Mobile
          </button>
        </div>
      </div>

      <div className={cn('p-3', previewMode === 'mobile' ? 'max-w-[280px] mx-auto' : '')}>
        <div className={cn('rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-inner', previewMode === 'mobile' ? 'max-h-[560px] overflow-auto' : 'max-h-96 overflow-auto')}>
          <div className="mb-3 rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white">
            {previewMode === 'desktop' ? 'Desktop sidebar' : 'Mobile drawer'}
          </div>
          <div className="space-y-1">
        {sections.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No menu items to preview</p>
          </div>
        ) : (
          sections.filter((section) => section.isVisible !== false).map((section) => {
            const isExpanded = expandedSections[section.id] ?? true;
            const SectionIcon = getIconByName(section.iconName ?? getDefaultSectionIconName(section.label));

            return (
              <div key={section.id}>
                {/* Section Button */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-left',
                    'hover:bg-gray-50 transition-colors font-medium'
                  )}
                >
                  {SectionIcon && <SectionIcon size={14} />}
                  <ChevronDown
                    size={14}
                    className={cn(isExpanded ? 'rotate-0' : '-rotate-90', 'transition-transform')}
                  />
                  <span>{section.label}</span>
                </button>

                {/* Level2 Groups and Items */}
                {isExpanded && (
                  <div className="ml-4 space-y-1 border-l border-gray-200 pl-0">
                    {section.level2Groups.filter((level2) => level2.isVisible !== false).map((level2) => {
                      const isLevel2Expanded = expandedLevel2s[level2.id] ?? true;
                      const visibleItems = level2.items.filter((item) => item.isVisible !== false);
                      const hasItems = visibleItems.length > 0;
                      const shouldFlattenLevel2 = level2.hideLabel && hasItems;

                      return (
                        <div key={level2.id}>
                          {/* Level2 Header */}
                          {!shouldFlattenLevel2 && (
                            <button
                              onClick={() => hasItems && toggleLevel2(level2.id)}
                              className={cn(
                                'w-full flex items-center gap-2 px-3 py-2 rounded text-xs text-left',
                                'hover:bg-gray-50 transition-colors',
                                !hasItems && 'cursor-default'
                              )}
                              disabled={!hasItems}
                            >
                              {hasItems && (
                                <ChevronDown
                                  size={12}
                                  className={cn(isLevel2Expanded ? 'rotate-0' : '-rotate-90', 'transition-transform')}
                                />
                              )}
                              {hasItems && <span className="flex-shrink-0 w-3" />}
                              {!hasItems && <span className="flex-shrink-0 w-5" />}
                              <span className="text-gray-600">{level2.label}</span>
                            </button>
                          )}

                          {/* Items */}
                          {hasItems && (shouldFlattenLevel2 || isLevel2Expanded) && (
                            <div className={cn(!shouldFlattenLevel2 && 'ml-4 border-l border-gray-200 pl-0')}>
                              {visibleItems.map((item) => {
                                const ItemIcon = getIconByName(item.iconName ?? getDefaultItemIconName(item.key));

                                return (
                                <button
                                  key={item.id}
                                  className={cn(
                                    'w-full flex items-center gap-2 px-3 py-2 rounded text-xs text-left',
                                    'hover:bg-blue-50 text-gray-600 hover:text-gray-900 transition-colors'
                                  )}
                                  disabled
                                >
                                  <span className="flex-shrink-0 w-5">{ItemIcon ? <ItemIcon size={14} /> : null}</span>
                                  <span>{item.label}</span>
                                  <span className="ml-auto text-[10px] uppercase tracking-wide text-gray-400">
                                    {item.externalUrl ? 'External' : item.route || 'Default'}
                                  </span>
                                </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
          </div>
        </div>
      </div>

      <div className="p-3 bg-gray-50 border-t text-xs text-gray-600">
        Live preview reflects visibility, grouping, routing metadata, and section ordering.
      </div>
    </div>
  );
};

export default MenuPreview;
