import React from 'react';

type MasterSubgridTableColumn = {
  key: string;
  label: string;
  width: string;
};

type MasterSubgridTableProps = {
  columns: MasterSubgridTableColumn[];
  children: React.ReactNode;
};

type MasterSubgridTableRowProps = {
  columns: MasterSubgridTableColumn[];
  children: React.ReactNode;
};

type MasterSubgridTableCellProps = {
  width: string;
  children: React.ReactNode;
  tone?: 'default' | 'muted';
  strong?: boolean;
};

export function MasterSubgridTable({
  columns,
  children,
}: MasterSubgridTableProps) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          background: 'rgb(232, 232, 232)',
          border: '1px solid #E5E7EB',
          borderRadius: '10px',
          padding: '0 18px',
          minHeight: '44px',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '10px',
        }}
      >
        {columns.map((column) => (
          <div
            key={column.key}
            style={{
              width: column.width,
              minWidth: column.width,
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--color-text)',
              textAlign: 'left',
            }}
          >
            {column.label}
          </div>
        ))}
      </div>
      <div>{children}</div>
    </div>
  );
}

export function MasterSubgridTableRow({
  columns,
  children,
}: MasterSubgridTableRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '0 18px',
        minHeight: '58px',
        border: '1px solid #E5E7EB',
        borderRadius: '14px',
        background: 'var(--color-surface)',
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
        marginBottom: '10px',
      }}
    >
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        const column = columns[index];
        return React.cloneElement(child as React.ReactElement<{ width?: string }>, {
          width: column?.width,
        });
      })}
    </div>
  );
}

export function MasterSubgridTableCell({
  width,
  children,
  tone = 'default',
  strong = false,
}: MasterSubgridTableCellProps) {
  return (
    <div
      style={{
        width,
        minWidth: width,
        fontSize: '12px',
        fontWeight: strong ? 600 : 500,
        color: tone === 'muted' ? 'var(--color-text-muted)' : 'var(--color-text)',
        textAlign: 'left',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </div>
  );
}
