/**
 * Menu Tree Component
 * Displays the menu structure with drag-and-drop support
 */

import React, { useState } from 'react';
import { ChevronDown, GripVertical, Plus, Edit2, Trash2 } from 'lucide-react';
import type { MenuSectionData, DragDropPayload, MenuLevelData, MenuItemData } from '../../../utils/menuBuilderTypes';
import { cn } from '../../../utils/classNames';

type DropTarget = {
  type: 'section' | 'level2' | 'item';
  targetId: string;
  position: number;
};

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
  onMoveNode: (payload: DragDropPayload, target: DropTarget) => void;
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
  onMoveNode,
}) => {
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragPayload, setDragPayload] = useState<DragDropPayload | null>(null);

  const startDrag = (event: React.DragEvent, payload: DragDropPayload) => {
    setDragPayload(payload);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/json', JSON.stringify(payload));
    event.dataTransfer.setData('text/plain', JSON.stringify(payload));
  };

  const handleDragOver = (event: React.DragEvent, targetId: string) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'move';
    setDragOverId(targetId);
  };

  const handleDrop = (event: React.DragEvent, target: DropTarget) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOverId(null);
    setDragPayload(null);

    try {
      const rawPayload = event.dataTransfer.getData('application/json') || event.dataTransfer.getData('text/plain');
      const payload = rawPayload ? (JSON.parse(rawPayload) as DragDropPayload) : dragPayload;
      if (!payload) {
        return;
      }
      onMoveNode(payload, target);
    } catch {
      if (dragPayload) {
        onMoveNode(dragPayload, target);
      }
    }
  };

  const handleDragEnd = () => {
    setDragOverId(null);
    setDragPayload(null);
  };

  const handleItemDrop = (event: React.DragEvent, item: MenuItemData, itemIndex: number) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const dropAfter = event.clientY > bounds.top + bounds.height / 2;
    handleDrop(event, {
      type: 'item',
      targetId: item.id,
      position: itemIndex + (dropAfter ? 1 : 0),
    });
  };

  const canRemoveSection = (section: MenuSectionData) => section.level2Groups.length === 0;
  const canRemoveLevel2 = (level2: MenuLevelData) => level2.items.length === 0;

  const renderItem = (item: MenuItemData, level2: MenuLevelData, itemIndex: number) => (
    <div
      key={item.id}
      draggable
      onDragStart={(event) =>
        startDrag(event, {
          type: 'item',
          itemId: item.id,
          sourceParentId: level2.id,
          sourceOrder: itemIndex,
        })
      }
      onDragEnd={handleDragEnd}
      onDragOver={(event) => handleDragOver(event, item.id)}
      onDrop={(event) => handleItemDrop(event, item, itemIndex)}
      className={cn(
        'menu-tree__item flex items-center gap-2 rounded border border-transparent p-2 transition-colors',
        'cursor-move hover:bg-white',
        selectedItemId === item.id && 'bg-blue-100 border-blue-200',
        dragOverId === item.id && 'border-blue-300 bg-blue-50',
        item.isVisible === false && 'opacity-50'
      )}
      onClick={() => onSelectItem(item.id)}
    >
      <GripVertical size={14} className="text-gray-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-700 truncate">{item.label}</div>
        <div className="text-[11px] text-gray-500 truncate">
          {item.key}
          {item.route ? ` • ${item.route}` : item.externalUrl ? ` • ${item.externalUrl}` : ''}
        </div>
      </div>
      <div className="flex gap-1">
        <button
          onClick={(event) => {
            event.stopPropagation();
            onEditItem(item.id);
          }}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
          title="Edit item"
        >
          <Edit2 size={12} />
        </button>
        <button
          onClick={(event) => {
            event.stopPropagation();
            onRemoveItem(item.id);
          }}
          className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors"
          title="Remove item"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-2">
      {sections.length === 0 ? (
        <div className="p-4 text-center text-gray-500 border border-dashed rounded">
          <p className="text-sm">No sections yet. Create one to get started.</p>
        </div>
      ) : (
        sections.map((section) => (
          <div
            key={section.id}
            className={cn('border rounded bg-white', dragOverId === section.id && 'border-blue-300 ring-1 ring-blue-200')}
            onDragOver={(event) => handleDragOver(event, section.id)}
            onDrop={(event) => handleDrop(event, { type: 'section', targetId: section.id, position: section.order })}
          >
            {/* Section Header */}
            <div
              className={cn(
                'flex items-center gap-2 p-3 cursor-pointer hover:bg-gray-50 border-b',
                selectedSectionId === section.id && 'bg-blue-50',
                section.isVisible === false && 'opacity-60'
              )}
              onClick={() => onSelectSection(section.id)}
              draggable
              onDragStart={(event) =>
                startDrag(event, {
                  type: 'section',
                  itemId: section.id,
                  sourceOrder: section.order,
                })
              }
              onDragEnd={handleDragEnd}
            >
              <GripVertical size={16} className="text-gray-400 flex-shrink-0" />
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
                  className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors disabled:opacity-40"
                  title="Remove section"
                  disabled={!canRemoveSection(section)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Section Content (Level2 Groups) */}
            {section.isExpanded && (
              <div className="space-y-1 p-3 bg-gray-50">
                {section.level2Groups.length === 0 ? (
                  <div
                    className={cn(
                      'menu-tree__drop-zone',
                      dragOverId === `${section.id}-empty` && 'menu-tree__drop-zone--active'
                    )}
                    onDragOver={(event) => handleDragOver(event, `${section.id}-empty`)}
                    onDrop={(event) => handleDrop(event, { type: 'section', targetId: section.id, position: 0 })}
                  >
                    No groups. Drop a group here or click + to add one.
                  </div>
                ) : (
                  <>
                  <div
                    className={cn(
                      'menu-tree__drop-zone',
                      dragOverId === `${section.id}-section-drop` && 'menu-tree__drop-zone--active'
                    )}
                    onDragOver={(event) => handleDragOver(event, `${section.id}-section-drop`)}
                    onDrop={(event) => handleDrop(event, { type: 'section', targetId: section.id, position: section.level2Groups.length })}
                  >
                    Drop item here to move into this section
                  </div>
                  {section.level2Groups.map((level2) => (
                    <div
                      key={level2.id}
                      className={cn('border rounded bg-white', dragOverId === level2.id && 'border-blue-300 ring-1 ring-blue-200')}
                      onDragOver={(event) => handleDragOver(event, level2.id)}
                      onDrop={(event) => handleDrop(event, { type: 'level2', targetId: level2.id, position: level2.order })}
                    >
                      {/* Level2 Header */}
                      <div
                        className={cn(
                          'flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-50 border-b',
                          selectedLevel2Id === level2.id && 'bg-blue-50',
                          level2.isVisible === false && 'opacity-60'
                        )}
                        onClick={() => onSelectLevel2(level2.id)}
                        draggable
                        onDragStart={(event) =>
                          startDrag(event, {
                            type: 'level2',
                            itemId: level2.id,
                            sourceParentId: section.id,
                            sourceOrder: level2.order,
                          })
                        }
                        onDragEnd={handleDragEnd}
                      >
                        <GripVertical size={14} className="text-gray-400 flex-shrink-0" />
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
                            className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors disabled:opacity-40"
                            title="Remove group"
                            disabled={!canRemoveLevel2(level2)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Items (Level3) */}
                      {level2.isExpanded && (
                        <div
                          className={cn(
                            'space-y-1 p-2 bg-gray-100 min-h-12',
                            dragOverId === `${level2.id}-items` && 'ring-1 ring-blue-300 bg-blue-50'
                          )}
                          onDragOver={(event) => handleDragOver(event, `${level2.id}-items`)}
                          onDrop={(event) => handleDrop(event, { type: 'level2', targetId: level2.id, position: level2.items.length })}
                        >
                          {level2.items.length === 0 ? (
                            <div
                              className={cn(
                                'menu-tree__drop-zone',
                                dragOverId === `${level2.id}-items` && 'menu-tree__drop-zone--active'
                              )}
                            >
                              No items. Drop menu item here or click + to add one.
                            </div>
                          ) : (
                            <>
                              {level2.items.map((item, itemIndex) => renderItem(item, level2, itemIndex))}
                              <div
                                className={cn(
                                  'menu-tree__drop-zone menu-tree__drop-zone--compact',
                                  dragOverId === `${level2.id}-items` && 'menu-tree__drop-zone--active'
                                )}
                              >
                                Drop here to move to end
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  </>
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
