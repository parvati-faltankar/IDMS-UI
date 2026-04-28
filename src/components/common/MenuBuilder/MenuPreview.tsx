/**
 * Menu Preview Component
 * Displays a live preview of the menu as it will appear in the navigation
 */

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { MenuSectionData } from '../../../utils/menuBuilderTypes';
import { cn } from '../../../utils/classNames';

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
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>

      <div className="p-3 space-y-1 max-h-96 overflow-auto">
        {sections.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No menu items to preview</p>
          </div>
        ) : (
          sections.map((section) => {
            const isExpanded = expandedSections[section.id] ?? true;

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
                  <ChevronDown
                    size={14}
                    className={cn(isExpanded ? 'rotate-0' : '-rotate-90', 'transition-transform')}
                  />
                  <span>{section.label}</span>
                </button>

                {/* Level2 Groups and Items */}
                {isExpanded && (
                  <div className="ml-4 space-y-1 border-l border-gray-200 pl-0">
                    {section.level2Groups.map((level2: any) => {
                      const isLevel2Expanded = expandedLevel2s[level2.id] ?? true;
                      const hasItems = level2.items.length > 0;
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
                              {level2.items.map((item: any) => (
                                <button
                                  key={item.id}
                                  className={cn(
                                    'w-full flex items-center gap-2 px-3 py-2 rounded text-xs text-left',
                                    'hover:bg-blue-50 text-gray-600 hover:text-gray-900 transition-colors'
                                  )}
                                  disabled
                                >
                                  <span className="flex-shrink-0 w-5" />
                                  <span>{item.label}</span>
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
          })
        )}
      </div>

      <div className="p-3 bg-gray-50 border-t text-xs text-gray-600">
        💡 This is a preview of how the menu will appear to users
      </div>
    </div>
  );
};

export default MenuPreview;
