import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { cn } from '../../utils/classNames';

export const transactionCreateCompactActionsMediaQuery =
  '(max-width: 640px), (min-width: 641px) and (max-width: 1024px) and (orientation: portrait)';

export type TransactionCreateHeaderMetaItem = {
  label: string;
  value: React.ReactNode;
};

export type TransactionCreateHeaderProps = {
  title: string;
  statusLabel?: string;
  meta?: TransactionCreateHeaderMetaItem[];
  onBack?: () => void;
  backLabel: string;
  primaryActions?: React.ReactNode;
  actionRow?: React.ReactNode;
  hideStatus?: boolean;
  hideMeta?: boolean;
  className?: string;
};

const TransactionCreateHeader: React.FC<TransactionCreateHeaderProps> = ({
  title,
  statusLabel,
  meta = [],
  onBack,
  backLabel,
  primaryActions,
  actionRow,
  hideStatus = false,
  hideMeta = false,
  className,
}) => {
  const visibleMeta = hideMeta ? [] : meta.filter((item) => item.value !== null && item.value !== undefined);
  const shouldShowStatus = !hideStatus && Boolean(statusLabel);

  return (
    <header className={cn('transaction-create-header', className)}>
      <div className="transaction-create-header__top">
        <div className="transaction-create-header__identity">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="page-back-button transaction-create-header__back"
              aria-label={backLabel}
            >
              <ArrowLeft size={18} aria-hidden="true" />
            </button>
          )}

          <div className="transaction-create-header__title-wrap">
            <div className="transaction-create-header__title-row">
              <h1 className="brand-page-title transaction-create-header__title">{title}</h1>
              {shouldShowStatus && <span className="transaction-create-header__status">{statusLabel}</span>}
            </div>

            {visibleMeta.length > 0 && (
              <dl className="transaction-create-header__meta" aria-label="Document metadata">
                {visibleMeta.map((item) => (
                  <div key={item.label} className="transaction-create-header__meta-item">
                    <dt className="transaction-create-header__meta-label">{item.label}</dt>
                    <dd className="transaction-create-header__meta-value">{item.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>

        {primaryActions && <div className="transaction-create-header__primary-actions">{primaryActions}</div>}
      </div>

      {actionRow && <div className="transaction-create-header__actions">{actionRow}</div>}
    </header>
  );
};

export default TransactionCreateHeader;