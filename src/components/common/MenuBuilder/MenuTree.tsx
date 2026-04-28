/**
 * Menu Tree Component
 * Displays the menu structure with drag-and-drop support
 */

import React, { useState } from 'react';
import { ChevronDown, GripVertical, Plus, Edit2, Trash2 } from 'lucide-react';
import type { MenuSectionData, DragDropPayload } from '../../../utils/menuBuilderTypes';
import { cn } from '../../../utils/classNames';

interface MenuTreeProps {
  sections: MenuSectionData[];
  selectedSectionId: string | null;
  selectedLevel2Id: string | null;
  selectedItemId: string | null;
  onSelectSection: (sectionId: string | null) => void;
  onSelectLevel2: (level2Id: string | null) => void;
  onSelectItem: (itemId: string | null) => void;
  onToggleSection: (sectionId: string) => void;
  onToggleLevel2: (level2Id: string) => void;
  onAddLevel2: (sectionId: string) => void;
  onAddItem: (level2Id: string) => void;
  onEditSection: (sectionId: string) => void;
  onEditLevel2: (level2Id: string) => void;
  onEditItem: (itemId: string) => void;
  onRemoveSection: (sectionId: string) => void;
  onRemoveLevel2: (level2Id: string) => void;
  onRemoveItem: (itemId: string) => void;
  onDragStart: (payload: DragDropPayload) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDropItem: (level2Id: string, payload: DragDropPayload, position: number) => void;
}

const MenuTree: React.FC<MenuTreeProps> = ({
  sections,
  selectedSectionId,
  selectedLevel2Id,
  selectedItemId,
  onSelectSection,
  onSelectLevel2,
  onSelectItem,
  onToggleSection,
  onToggleLevel2,
  onAddLevel2,
  onAddItem,
  onEditSection,
  onEditLevel2,
  onEditItem,
  onRemoveSection,
  onRemoveLevel2,
  onRemoveItem,
  onDragStart,
  onDragOver,
  onDropItem,
}) => {
  const [dragOverLevel2Id, setDragOverLevel2Id] = useState<string | null>(null);

  const handleDragOverLevel2 = (e: React.DragEvent, level2Id: string) => {
    e.preventDefault();
    onDragOver(e);
    setDragOverLevel2Id(level2Id);
  };

  const handleDropLevel2 = (e: React.DragEvent, level2Id: string) => {
    e.preventDefault();
    setDragOverLevel2Id(null);
    try {
      const payload = JSON.parse(e.dataTransfer.getData('application/json')) as DragDropPayload;
      onDropItem(level2Id, payload, 0);
    } catch {
      // Invalid drag data
    }
  };

  return (
    <div className="space-y-2">
      {sections.length === 0 ? (
        <div className="p-4 text-center text-gray-500 border border-dashed rounded">
          <p className="text-sm">No sections yet. Create one to get started.</p>
        </div>
      ) : (
        sections.map((section) => (
          <div key={section.id} className="border rounded bg-white">
            {/* Section Header */}
            <div
              className={cn(
                'flex items-center gap-2 p-3 cursor-pointer hover:bg-gray-50 border-b',
                selectedSectionId === section.id && 'bg-blue-50'
              )}
              onClick={() => onSelectSection(section.id)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSection(section.id);
                }}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                <ChevronDown
                  size={16}
                  className={cn(!section.isExpanded && 'transform -rotate-90')}
                />
              </button>
              <span className="text-sm font-semibold flex-1">{section.label}</span>
              <div className="flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddLevel2(section.id);
                  }}
                  className="p-1 hover:bg-blue-100 rounded text-blue-600 transition-colors"
                  title="Add group"
                >
                  <Plus size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditSection(section.id);
                  }}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="Edit section"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveSection(section.id);
                  }}
                  className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors"
                  title="Remove section"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Section Content (Level2 Groups) */}
            {section.isExpanded && (
              <div className="space-y-1 p-3 bg-gray-50">
                {section.level2Groups.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">No groups. Click + to add one.</p>
                ) : (
                  section.level2Groups.map((level2: any) => (
                    <div key={level2.id} className="border rounded bg-white">
                      {/* Level2 Header */}
                      <div
                        className={cn(
                          'flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-50 border-b',
                          selectedLevel2Id === level2.id && 'bg-blue-50'
                        )}
                        onClick={() => onSelectLevel2(level2.id)}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleLevel2(level2.id);
                          }}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          <ChevronDown
                            size={14}
                            className={cn(!level2.isExpanded && 'transform -rotate-90')}
                          />
                        </button>
                        {!level2.hideLabel && (
                          <span className="text-xs font-medium flex-1 text-gray-600">{level2.label}</span>
                        )}
                        {level2.hideLabel && (
                          <span className="text-xs text-gray-400 italic flex-1">Flattened</span>
                        )}
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddItem(level2.id);
                            }}
                            className="p-1 hover:bg-green-100 rounded text-green-600 transition-colors"
                            title="Add item"
                          >
                            <Plus size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditLevel2(level2.id);
                            }}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="Edit group"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveLevel2(level2.id);
                            }}
                            className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors"
                            title="Remove group"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Items (Level3) */}
                      {level2.isExpanded && (
                        <div
                          className="space-y-1 p-2 bg-gray-100 min-h-12"
                          onDragOver={(e) => handleDragOverLevel2(e, level2.id)}
                          onDrop={(e) => handleDropLevel2(e, level2.id)}
                        >
                          {level2.items.length === 0 ? (
                            <p className="text-xs text-gray-500 italic p-2">No items. Click + to add one.</p>
                          ) : (
                            level2.items.map((item, index) => (
                              <div
                                key={item.id}
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.effectAllowed = 'move';
                                  e.dataTransfer.setData(
                                    'application/json',
                                    JSON.stringify({
                                      type: 'item',
                                      itemId: item.id,
                                      sourceParentId: level2.id,
                                      sourceOrder: index,
                                    } as DragDropPayload)
                                  );
                                  onDragStart({
                                    type: 'item',
                                    itemId: item.id,
                                    sourceParentId: level2.id,
                                    sourceOrder: index,
                                  });
                                }}
                                className={cn(
                                  'flex items-center gap-2 p-2 rounded cursor-move hover:bg-white transition-colors',
                                  selectedItemId === item.id && 'bg-blue-100',
                                  dragOverLevel2Id === level2.id && 'bg-blue-200'
                                )}
                                onClick={() => onSelectItem(item.id)}
                              >
                                <GripVertical size={14} className="text-gray-400 flex-shrink-0" />
                                <span className="text-xs flex-1">
                                  {item.label}
                                  {item.key && <span className="text-gray-500"> ({item.key})</span>}
                                </span>
                                <div className="flex gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onEditItem(item.id);
                                    }}
                                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                                    title="Edit item"
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onRemoveItem(item.id);
                                    }}
                                    className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors"
                                    title="Remove item"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default MenuTree;
