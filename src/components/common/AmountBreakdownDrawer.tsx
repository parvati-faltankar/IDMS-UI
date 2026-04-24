import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import SideDrawer from './SideDrawer';
import { cn } from '../../utils/classNames';

interface AmountBreakdownItem {
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'accent' | 'muted';
}

interface AmountBreakdownGroup {
  id: string;
  title: string;
  subtitle?: string;
  items: AmountBreakdownItem[];
  defaultCollapsed?: boolean;
}

interface AmountBreakdownDrawerProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  totalLabel: string;
  totalValue: string;
  items: AmountBreakdownItem[];
  groups?: AmountBreakdownGroup[];
  note?: string;
  onClose: () => void;
}

const AmountBreakdownDrawer: React.FC<AmountBreakdownDrawerProps> = ({
  isOpen,
  title,
  subtitle,
  totalLabel,
  totalValue,
  items,
  groups,
  note,
  onClose,
}) => {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupId: string, defaultCollapsed?: boolean) => {
    setCollapsedGroups((current) => ({
      ...current,
      [groupId]: !(current[groupId] ?? Boolean(defaultCollapsed)),
    }));
  };

  return (
    <SideDrawer
      isOpen={isOpen}
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      panelClassName="side-drawer__panel--narrow amount-breakdown-drawer__panel"
      contentClassName="amount-breakdown-drawer"
      footer={
        <div className="amount-breakdown-drawer__total">
          <span className="amount-breakdown-drawer__total-label">{totalLabel}</span>
          <span className="amount-breakdown-drawer__total-value">{totalValue}</span>
        </div>
      }
    >
      <div className="amount-breakdown-drawer__section">
        <div className="amount-breakdown-drawer__section-title">Amount breakdown</div>

        <div className="amount-breakdown-drawer__list" role="list">
          {items.map((item) => (
            <div key={item.label} className="amount-breakdown-drawer__row" role="listitem">
              <div className="amount-breakdown-drawer__copy">
                <div className="amount-breakdown-drawer__label">{item.label}</div>
                {item.hint && <div className="amount-breakdown-drawer__hint">{item.hint}</div>}
              </div>
              <div
                className={cn(
                  'amount-breakdown-drawer__value',
                  item.tone === 'accent' && 'amount-breakdown-drawer__value--accent',
                  item.tone === 'muted' && 'amount-breakdown-drawer__value--muted'
                )}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {groups && groups.length > 0 && (
        <div className="amount-breakdown-drawer__group-section">
          <div className="amount-breakdown-drawer__section-title">Document-wise breakdown</div>

          {groups.map((group) => {
            const isCollapsed = collapsedGroups[group.id] ?? Boolean(group.defaultCollapsed);

            return (
              <div key={group.id} className="amount-breakdown-drawer__group">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id, group.defaultCollapsed)}
                  className="amount-breakdown-drawer__group-toggle"
                  aria-expanded={!isCollapsed}
                >
                  <div className="amount-breakdown-drawer__group-copy">
                    <div className="amount-breakdown-drawer__group-title">{group.title}</div>
                    {group.subtitle && <div className="amount-breakdown-drawer__group-subtitle">{group.subtitle}</div>}
                  </div>
                  {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </button>

                {!isCollapsed && (
                  <div className="amount-breakdown-drawer__group-body">
                    <div className="amount-breakdown-drawer__list" role="list">
                      {group.items.map((item) => (
                        <div key={`${group.id}-${item.label}`} className="amount-breakdown-drawer__row" role="listitem">
                          <div className="amount-breakdown-drawer__copy">
                            <div className="amount-breakdown-drawer__label">{item.label}</div>
                            {item.hint && <div className="amount-breakdown-drawer__hint">{item.hint}</div>}
                          </div>
                          <div
                            className={cn(
                              'amount-breakdown-drawer__value',
                              item.tone === 'accent' && 'amount-breakdown-drawer__value--accent',
                              item.tone === 'muted' && 'amount-breakdown-drawer__value--muted'
                            )}
                          >
                            {item.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {note && <p className="amount-breakdown-drawer__note">{note}</p>}
    </SideDrawer>
  );
};

export default AmountBreakdownDrawer;
