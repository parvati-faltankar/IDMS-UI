import React, { useState } from 'react';
import { GripVertical, LockKeyhole } from 'lucide-react';
import { cn } from '../../utils/classNames';
import {
  moveGridColumn,
  type FormLayoutConfig,
  updateGridColumnVisibility,
} from '../../utils/formLayoutConfig';

interface GridColumnConfiguratorProps {
  layoutConfig: FormLayoutConfig;
  onChange: (updater: (config: FormLayoutConfig) => FormLayoutConfig) => void;
}

interface ColumnDragPayload {
  gridId: string;
  columnKey: string;
}

const GridColumnConfigurator: React.FC<GridColumnConfiguratorProps> = ({ layoutConfig, onChange }) => {
  const [dragPayload, setDragPayload] = useState<ColumnDragPayload | null>(null);
  const grids = Object.values(layoutConfig.grids ?? {});

  if (grids.length === 0) {
    return null;
  }

  const startDrag = (event: React.DragEvent<HTMLButtonElement>, payload: ColumnDragPayload) => {
    setDragPayload(payload);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/json', JSON.stringify(payload));
  };

  const readPayload = (event: React.DragEvent<HTMLElement>): ColumnDragPayload | null => {
    const rawPayload = event.dataTransfer.getData('application/json');
    if (!rawPayload) {
      return dragPayload;
    }

    try {
      return JSON.parse(rawPayload) as ColumnDragPayload;
    } catch {
      return dragPayload;
    }
  };

  return (
    <section className="grid-column-configurator" aria-label="Grid column configuration">
      <div className="grid-column-configurator__header">
        <div>
          <h3>Grid columns</h3>
          <p>Reorder columns and hide optional columns. Locked columns stay visible to protect document logic.</p>
        </div>
      </div>

      <div className="grid-column-configurator__grids">
        {grids.map((grid) => (
          <div key={grid.id} className="grid-column-configurator__grid">
            <div className="grid-column-configurator__grid-title">
              <strong>{grid.label}</strong>
              <span>{grid.columns.filter((column) => column.visible !== false || column.locked).length} visible</span>
            </div>
            <div className="grid-column-configurator__columns">
              {grid.columns.map((column, columnIndex) => (
                <div
                  key={column.key}
                  className={cn(
                    'grid-column-configurator__column',
                    dragPayload?.gridId === grid.id &&
                      dragPayload.columnKey !== column.key &&
                      'grid-column-configurator__column--drop-target'
                  )}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const payload = readPayload(event);
                    if (payload?.gridId === grid.id) {
                      onChange((currentConfig) =>
                        moveGridColumn(currentConfig, grid.id, payload.columnKey, columnIndex)
                      );
                    }
                    setDragPayload(null);
                  }}
                >
                  <button
                    type="button"
                    draggable
                    className="grid-column-configurator__drag"
                    aria-label={`Move ${column.label}`}
                    onDragStart={(event) => startDrag(event, { gridId: grid.id, columnKey: column.key })}
                    onDragEnd={() => setDragPayload(null)}
                  >
                    <GripVertical size={14} aria-hidden="true" />
                  </button>
                  <label className="grid-column-configurator__visibility">
                    <input
                      type="checkbox"
                      checked={column.visible !== false || column.locked}
                      disabled={column.locked}
                      onChange={(event) =>
                        onChange((currentConfig) =>
                          updateGridColumnVisibility(currentConfig, grid.id, column.key, event.target.checked)
                        )
                      }
                    />
                    <span>{column.label}</span>
                  </label>
                  {column.locked && (
                    <span className="grid-column-configurator__locked">
                      <LockKeyhole size={12} aria-hidden="true" />
                      Locked
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default GridColumnConfigurator;
