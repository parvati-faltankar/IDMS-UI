import React, { useState } from 'react';
import { GripVertical, Settings } from 'lucide-react';
import SideDrawer from './SideDrawer';
import { cn } from '../../utils/classNames';

export type CatalogueSectionLayoutMode = 'single' | 'two-column';

export interface CatalogueConfigurableSection {
  id: string;
  title: string;
  description?: string;
}

interface CatalogueSectionLayoutSettingsProps {
  title: string;
  subtitle?: string;
  sections: CatalogueConfigurableSection[];
  sectionOrder: string[];
  layoutMode: CatalogueSectionLayoutMode;
  onSectionOrderChange: (sectionOrder: string[]) => void;
  onLayoutModeChange: (layoutMode: CatalogueSectionLayoutMode) => void;
}

function moveItem(items: string[], fromIndex: number, toIndex: number): string[] {
  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
}

const CatalogueSectionLayoutSettings: React.FC<CatalogueSectionLayoutSettingsProps> = ({
  title,
  subtitle,
  sections,
  sectionOrder,
  layoutMode,
  onSectionOrderChange,
  onLayoutModeChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
  const sectionMap = new Map(sections.map((section) => [section.id, section]));
  const orderedSections = sectionOrder
    .map((sectionId) => sectionMap.get(sectionId))
    .filter((section): section is CatalogueConfigurableSection => Boolean(section));

  const handleDrop = (targetSectionId: string) => {
    if (!draggedSectionId || draggedSectionId === targetSectionId) {
      return;
    }

    const fromIndex = sectionOrder.indexOf(draggedSectionId);
    const toIndex = sectionOrder.indexOf(targetSectionId);

    if (fromIndex < 0 || toIndex < 0) {
      return;
    }

    onSectionOrderChange(moveItem(sectionOrder, fromIndex, toIndex));
    setDraggedSectionId(null);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="catalogue-field-settings__trigger"
        aria-label={`Configure ${title}`}
        title="Configure detail layout"
      >
        <Settings size={16} />
      </button>

      <SideDrawer
        isOpen={isOpen}
        title={title}
        subtitle={subtitle ?? 'Reorder document sections and choose the detail layout.'}
        onClose={() => setIsOpen(false)}
        panelClassName="side-drawer__panel--narrow"
        footer={
          <button type="button" onClick={() => setIsOpen(false)} className="btn btn--primary">
            Done
          </button>
        }
      >
        <div className="catalogue-section-settings">
          <section className="catalogue-section-settings__panel">
            <h3>Layout</h3>
            <div className="catalogue-section-settings__segmented" role="radiogroup" aria-label="Detail section layout">
              <button
                type="button"
                className={cn(layoutMode === 'single' && 'catalogue-section-settings__segmented-button--active')}
                onClick={() => onLayoutModeChange('single')}
                role="radio"
                aria-checked={layoutMode === 'single'}
              >
                One per row
              </button>
              <button
                type="button"
                className={cn(layoutMode === 'two-column' && 'catalogue-section-settings__segmented-button--active')}
                onClick={() => onLayoutModeChange('two-column')}
                role="radio"
                aria-checked={layoutMode === 'two-column'}
              >
                Two per row
              </button>
            </div>
          </section>

          <section className="catalogue-section-settings__panel">
            <h3>Sections</h3>
            <div className="catalogue-section-settings__list">
              {orderedSections.map((section) => (
                <div
                  key={section.id}
                  className={cn(
                    'catalogue-section-settings__item',
                    draggedSectionId === section.id && 'catalogue-section-settings__item--dragging'
                  )}
                  draggable
                  onDragStart={(event) => {
                    setDraggedSectionId(section.id);
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('text/plain', section.id);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'move';
                  }}
                  onDrop={() => handleDrop(section.id)}
                  onDragEnd={() => setDraggedSectionId(null)}
                >
                  <GripVertical size={16} />
                  <span>
                    <strong>{section.title}</strong>
                    {section.description && <small>{section.description}</small>}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </SideDrawer>
    </>
  );
};

export default CatalogueSectionLayoutSettings;
