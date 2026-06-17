import type React from 'react';

type MasterFormActionRailProps = {
  leftActions?: React.ReactNode[];
  rightActions?: React.ReactNode[];
};

function ActionGroup({ actions }: { actions: React.ReactNode[] }) {
  if (actions.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${actions.length}, minmax(0, 1fr))`,
        gap: '12px',
        width: '100%',
      }}
    >
      {actions.map((action, index) => (
        <div
          key={index}
          style={{
            minWidth: 0,
            display: 'flex',
          }}
        >
          <div style={{ width: '100%' }}>{action}</div>
        </div>
      ))}
    </div>
  );
}

export function MasterFormActionRail({
  leftActions = [],
  rightActions = [],
}: MasterFormActionRailProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        justifyContent: 'space-between',
        padding: '14px 24px',
        minHeight: '76px',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <ActionGroup actions={leftActions} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <ActionGroup actions={rightActions} />
      </div>
    </div>
  );
}
