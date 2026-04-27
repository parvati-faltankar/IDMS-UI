import React, { useState } from 'react';
import { GripVertical, LockKeyhole, Pin, PinOff, Rows3 } from 'lucide-react';
import SideDrawer from './SideDrawer';
import { cn } from '../../utils/classNames';
import type {
  DataGridColumn,
  DataGridDensity,
  DataGridPinState,
  DataGridStoredPreferences,
} from './dataGridTypes';

interface DataGridConfiguratorProps<TData> {
  isOpen: boolean;
  columns: DataGridColumn<TData>[];
  preferences: DataGridStoredPreferences;
  onClose: () => void;
  onMoveColumn: (columnId: string, targetIndex: number) => void;
  onVisibilityChange: (columnId: string, visible: boolean) => void;
  onPinChange: (columnId: string, pinState: DataGridPinState) => void;
  onGroupByChange: (columnId: string | null) => void;
  onDensityChange: (density: DataGridDensity) => void;
  onReset: () => void;
}

interface ColumnDragPayload {
  columnId: string;
}

const DataGridConfigurator = <TData,>({
  isOpen,
  columns,
  preferences,
  onClose,
  onMoveColumn,
  onVisibilityChange,
  onPinChange,
  onGroupByChange,
  onDensityChange,
  onReset,
}: DataGridConfiguratorProps<TData>) => {
  const [dragPayload, setDragPayload] = useState<ColumnDragPayload | null>(null);

  const orderedColumns = preferences.columnOrder
    .map((columnId) => columns.find((column) => column.id === columnId))
    .filter((column): column is DataGridColumn<TData> => Boolean(column));

  const readPayload = (event: React.DragEvent<HTMLElement>): ColumnDragPayload | null => {
    const rawValue = event.dataTransfer.getData('application/json');
    if (!rawValue) {
      return dragPayload;
    }

    try {
      return JSON.parse(rawValue) as ColumnDragPayload;
    } catch {
      return dragPayload;
    }
  };

  return (
    <SideDrawer
      isOpen={isOpen}
      title="Grid view"
      subtitle="Personalize visible columns, order, grouping, pinning, and density for this catalogue."
      onClose={onClose}
      panelClassName="side-drawer__panel--wide"
      footer={
        <>
          <button type="button" className="btn btn--outline" onClick={onReset}>
            Reset view
          </button>
          <button type="button" className="btn btn--primary" onClick={onClose}>
            Apply
          </button>
        </>
      }
    >
      <section className="catalogue-grid-configurator">
        <div className="catalogue-grid-configurator__section">
          <div className="catalogue-grid-configurator__section-header">
            <div>
              <h3>Columns</h3>
              <p>Drag to reorder columns, hide optional ones, and pin key fields for easier scanning.</p>
            </div>
          </div>

          <div className="catalogue-grid-configurator__columns">
            {orderedColumns.map((column, index) => {
              const isLocked = Boolean(column.locked);
              const isVisible = !preferences.hiddenColumnIds.includes(column.id) || isLocked;
              const pinState = preferences.pinnedLeftColumnIds.includes(column.id)
                ? 'left'
                : preferences.pinnedRightColumnIds.includes(column.id)
                  ? 'right'
                  : null;
              const isGrouped = preferences.groupByColumnId === column.id;

              return (
                <div
                  key={column.id}
                  className={cn(
                    'catalogue-grid-configurator__column',
                    dragPayload?.columnId !== column.id && 'catalogue-grid-configurator__column--ready'
                  )}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const payload = readPayload(event);
                    if (payload) {
                      onMoveColumn(payload.columnId, index);
                    }
                    setDragPayload(null);
                  }}
                >
                  <button
                    type="button"
                    draggable
                    className="catalogue-grid-configurator__drag"
                    aria-label={`Move ${column.label}`}
                    onDragStart={(event) => {
                      const payload = { columnId: column.id };
                      setDragPayload(payload);
                      event.dataTransfer.effectAllowed = 'move';
                      event.dataTransfer.setData('application/json', JSON.stringify(payload));
                    }}
                    onDragEnd={() => setDragPayload(null)}
                  >
                    <GripVertical size={14} />
                  </button>

                  <label className="catalogue-grid-configurator__visibility">
                    <input
                      type="checkbox"
                      checked={isVisible}
                      disabled={isLocked}
                      onChange={(event) => onVisibilityChange(column.id, event.target.checked)}
                    />
                    <span>{column.label}</span>
                  </label>

                  <div className="catalogue-grid-configurator__actions">
                    {column.groupable !== false && column.type !== 'actions' && (
                      <button
                        type="button"
                        className={cn(
                          'catalogue-grid-configurator__action',
                          isGrouped && 'catalogue-grid-configurator__action--active'
                        )}
                        onClick={() => onGroupByChange(isGrouped ? null : column.id)}
                      >
                        <Rows3 size={13} />
                        {isGrouped ? 'Grouped' : 'Group'}
                      </button>
                    )}

                    {column.pinnable !== false && (
                      <>
                        <button
                          type="button"
                          className={cn(
                            'catalogue-grid-configurator__action',
                            pinState === 'left' && 'catalogue-grid-configurator__action--active'
                          )}
                          onClick={() => onPinChange(column.id, pinState === 'left' ? null : 'left')}
                        >
                          <Pin size={13} />
                          Left
                        </button>
                        <button
                          type="button"
                          className={cn(
                            'catalogue-grid-configurator__action',
                            pinState === 'right' && 'catalogue-grid-configurator__action--active'
                          )}
                          onClick={() => onPinChange(column.id, pinState === 'right' ? null : 'right')}
                        >
                          <Pin size={13} />
                          Right
                        </button>
                      </>
                    )}

                    {pinState && (
                      <button
                        type="button"
                        className="catalogue-grid-configurator__action"
                        onClick={() => onPinChange(column.id, null)}
                      >
                        <PinOff size={13} />
                        Unpin
                      </button>
                    )}

                    {isLocked && (
                      <span className="catalogue-grid-configurator__locked">
                        <LockKeyhole size={12} />
                        Locked
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="catalogue-grid-configurator__section">
          <div className="catalogue-grid-configurator__section-header">
            <div>
              <h3>Density</h3>
              <p>Keep the current compact look or add more breathing room for dense reviews.</p>
            </div>
          </div>

          <div className="catalogue-grid-configurator__density">
            {(['compact', 'comfortable'] as DataGridDensity[]).map((density) => (
              <button
                key={density}
                type="button"
                className={cn(
                  'catalogue-grid-configurator__density-option',
                  preferences.density === density && 'catalogue-grid-configurator__density-option--active'
                )}
                onClick={() => onDensityChange(density)}
              >
                <strong>{density === 'compact' ? 'Compact' : 'Comfortable'}</strong>
                <span>{density === 'compact' ? 'Tighter rows for high-volume scanning.' : 'More padding for easier review.'}</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </SideDrawer>
  );
};

export default DataGridConfigurator;
