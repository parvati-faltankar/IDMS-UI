import React, { useEffect, useMemo, useState } from 'react';
import Dialog, { type DialogProps } from '@mui/material/Dialog';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import useMediaQuery from '@mui/material/useMediaQuery';
import { X } from 'lucide-react';
import {
  getMasterDialogPaperSx,
  getMasterOverlayBackdropSx,
} from '../../experience/components/overlay/overlayTokens';
import { cn } from '../../utils/classNames';

export type EnterpriseFilterSection = {
  id: string;
  label: string;
  summary?: string;
  badgeCount?: number;
  render: () => React.ReactNode;
};

export interface EnterpriseFilterDialogProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  sections: EnterpriseFilterSection[];
  onClose: () => void;
  onApply: () => void;
  onClearAll: () => void;
  applyLabel?: string;
  clearLabel?: string;
  isApplyDisabled?: boolean;
}

const compactFilterMediaQuery =
  '(max-width: 640px), (min-width: 641px) and (max-width: 1024px) and (orientation: portrait)';

function getDialogId(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'enterprise-filter'
  );
}

const EnterpriseFilterDialog: React.FC<EnterpriseFilterDialogProps> = ({
  isOpen,
  title,
  subtitle,
  sections,
  onClose,
  onApply,
  onClearAll,
  applyLabel = 'Apply',
  clearLabel = 'Clear all',
  isApplyDisabled = false,
}) => {
  const isCompactPresentation = useMediaQuery(compactFilterMediaQuery, { noSsr: true });
  const dialogId = getDialogId(title);
  const titleId = `${dialogId}-title`;
  const descriptionId = subtitle ? `${dialogId}-description` : undefined;
  const sectionIds = useMemo(() => sections.map((section) => section.id), [sections]);
  const firstSectionId = sectionIds[0] ?? '';
  const [activeSectionId, setActiveSectionId] = useState(firstSectionId);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setActiveSectionId((currentSectionId) =>
      sectionIds.includes(currentSectionId) ? currentSectionId : firstSectionId
    );
  }, [firstSectionId, isOpen, sectionIds]);

  const activeSection = sections.find((section) => section.id === activeSectionId) ?? sections[0];
  const handleDialogClose: NonNullable<DialogProps['onClose']> = () => {
    onClose();
  };

  const renderContent = (presentation: 'dialog' | 'sheet') => (
    <section
      className={cn(
        'enterprise-filter-dialog',
        presentation === 'sheet' && 'enterprise-filter-dialog--sheet'
      )}
      role={presentation === 'sheet' ? 'dialog' : undefined}
      aria-modal={presentation === 'sheet' ? true : undefined}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <header className="enterprise-filter-dialog__header">
        <div className="enterprise-filter-dialog__header-copy">
          <h2 id={titleId} className="enterprise-filter-dialog__title">
            {title}
          </h2>
          {subtitle && (
            <p id={descriptionId} className="enterprise-filter-dialog__subtitle">
              {subtitle}
            </p>
          )}
        </div>
        <IconButton
          type="button"
          onClick={onClose}
          className="enterprise-filter-dialog__close"
          aria-label={`Close ${title}`}
        >
          <X size={18} />
        </IconButton>
      </header>

      <div className="enterprise-filter-dialog__layout">
        <nav
          className="enterprise-filter-dialog__nav"
          role="tablist"
          aria-label={`${title} sections`}
        >
          {sections.map((section) => {
            const isActive = section.id === activeSection?.id;
            const tabId = `${dialogId}-${section.id}-tab`;
            const panelId = `${dialogId}-${section.id}-panel`;

            return (
              <button
                key={section.id}
                id={tabId}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={panelId}
                className={cn(
                  'enterprise-filter-dialog__nav-item',
                  isActive && 'enterprise-filter-dialog__nav-item--active'
                )}
                onClick={() => setActiveSectionId(section.id)}
              >
                <span className="enterprise-filter-dialog__nav-label">{section.label}</span>
                {Boolean(section.badgeCount) && (
                  <span className="enterprise-filter-dialog__badge">{section.badgeCount}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="enterprise-filter-dialog__content">
          {activeSection ? (
            <section
              id={`${dialogId}-${activeSection.id}-panel`}
              role="tabpanel"
              aria-labelledby={`${dialogId}-${activeSection.id}-tab`}
              className="enterprise-filter-dialog__panel"
            >
              <div className="enterprise-filter-dialog__panel-heading">
                <h3 className="enterprise-filter-dialog__section-title">{activeSection.label}</h3>
                {activeSection.summary && (
                  <p className="enterprise-filter-dialog__section-summary">{activeSection.summary}</p>
                )}
              </div>
              {activeSection.render()}
            </section>
          ) : (
            <div className="enterprise-filter-dialog__empty">No filters available.</div>
          )}
        </div>
      </div>

      <footer className="enterprise-filter-dialog__footer">
        <button
          type="button"
          onClick={onClearAll}
          className="btn btn--ghost enterprise-filter-dialog__clear-button"
        >
          {clearLabel}
        </button>
        <button
          type="button"
          onClick={onApply}
          className="btn btn--primary enterprise-filter-dialog__apply-button"
          disabled={isApplyDisabled}
        >
          {applyLabel}
        </button>
      </footer>
    </section>
  );

  if (isCompactPresentation) {
    return (
      <Drawer
        anchor="bottom"
        open={isOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        slotProps={{
          backdrop: {
            sx: getMasterOverlayBackdropSx(),
          },
          paper: {
            className: 'enterprise-filter-dialog__sheet-paper',
            sx: {
              width: '100vw',
              maxWidth: '100vw',
              maxHeight: '86dvh',
              m: 0,
              borderTop: '1px solid',
              borderColor: 'divider',
              borderRadius: '22px 22px 0 0',
              backgroundColor: 'background.paper',
              backgroundImage: 'none',
              overflow: 'hidden',
            },
          },
        }}
      >
        {renderContent('sheet')}
      </Drawer>
    );
  }

  return (
    <Dialog
      open={isOpen}
      onClose={handleDialogClose}
      keepMounted
      fullWidth
      maxWidth={false}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      slotProps={{
        backdrop: {
          sx: getMasterOverlayBackdropSx(),
        },
        paper: {
          className: 'enterprise-filter-dialog__paper',
          sx: [
            getMasterDialogPaperSx(620),
            {
              overflow: 'hidden',
            },
          ],
        },
      }}
    >
      {renderContent('dialog')}
    </Dialog>
  );
};

export default EnterpriseFilterDialog;
