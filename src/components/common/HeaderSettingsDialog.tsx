import React from 'react';
import { LayoutDashboard, Languages, Palette, Printer, Settings, Grip } from 'lucide-react';
import AppDialog from '../app/AppDialog';
import { navigateToHash } from './appShellShared';
import { paths } from '../../routes/routeConfig';

interface HeaderSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  onBusinessSettingsClick?: () => void;
  onFormLayoutClick?: () => void;
}

const shortcutButtonStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto minmax(0, 1fr)',
  alignItems: 'start',
  gap: '10px',
  width: '100%',
  border: '1px solid var(--color-border)',
  borderRadius: '14px',
  background: 'var(--color-surface)',
  padding: '12px 14px',
  color: 'var(--color-text)',
  textAlign: 'left',
  cursor: 'pointer',
  transition: 'background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease',
};

function ShortcutAction({
  icon,
  title,
  helper,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  helper: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      style={shortcutButtonStyle}
      onClick={onClick}
      onMouseEnter={(event) => {
        event.currentTarget.style.borderColor = 'var(--color-nav-active-border)';
        event.currentTarget.style.background = 'var(--color-nav-hover)';
        event.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.borderColor = 'var(--color-border)';
        event.currentTarget.style.background = 'var(--color-surface)';
        event.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 30,
          height: 30,
          borderRadius: 10,
          background: 'var(--color-surface-subtle)',
          color: 'var(--color-primary)',
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <span style={{ display: 'grid', minWidth: 0, gap: 3 }}>
        <span style={{ color: 'var(--color-text)', fontSize: 13, lineHeight: '18px', fontWeight: 500 }}>{title}</span>
        <span style={{ color: 'var(--color-text-muted)', fontSize: 12, lineHeight: '18px', fontWeight: 400 }}>{helper}</span>
      </span>
    </button>
  );
}

const HeaderSettingsDialog: React.FC<HeaderSettingsDialogProps> = ({
  open,
  onClose,
  onBusinessSettingsClick,
  onFormLayoutClick,
}) => {
  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title="Settings"
      description="Open the main workspace settings."
      showCloseButton
      width={760}
      contentClassName="header-settings-dialog__content"
      paperSx={{ maxHeight: 'calc(100vh - 32px)' }}
    >
      <div style={{ display: 'grid', gap: 20 }}>
        <section style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gap: 4 }}>
            <div style={{ color: 'var(--color-text)', fontSize: 14, lineHeight: '20px', fontWeight: 600 }}>Workspace settings</div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: 12, lineHeight: '18px' }}>
              Jump directly to the existing configuration pages.
            </div>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            <ShortcutAction
              icon={<Settings size={16} />}
              title="Business Settings"
              helper="Adjust document workflow rules and conversion defaults."
              onClick={() => {
                onClose();
                if (onBusinessSettingsClick) {
                  onBusinessSettingsClick();
                  return;
                }
                navigateToHash(`#${paths.businessSettings}`);
              }}
            />
            <ShortcutAction
              icon={<Palette size={16} />}
              title="Theme Builder"
              helper="Manage brand themes and the top header appearance."
              onClick={() => {
                onClose();
                navigateToHash(`#${paths.themeBuilder}`);
              }}
            />
            <ShortcutAction
              icon={<Languages size={16} />}
              title="Language Builder"
              helper="Control languages, translations, and fallbacks."
              onClick={() => {
                onClose();
                navigateToHash(`#${paths.languageBuilder}`);
              }}
            />
            <ShortcutAction
              icon={<Printer size={16} />}
              title="Print Builder"
              helper="Design document print layouts and templates."
              onClick={() => {
                onClose();
                navigateToHash(`#${paths.printBuilder}`);
              }}
            />
            <ShortcutAction
              icon={<Grip size={16} />}
              title="Menu Builder"
              helper="Edit the published navigation structure."
              onClick={() => {
                onClose();
                navigateToHash(`#${paths.menuBuilder}`);
              }}
            />
            <ShortcutAction
              icon={<LayoutDashboard size={16} />}
              title="Form Layout"
              helper="Configure the form layout workspace."
              onClick={() => {
                onClose();
                if (onFormLayoutClick) {
                  onFormLayoutClick();
                  return;
                }
                navigateToHash(`#${paths.formLayoutSettings}`);
              }}
            />
          </div>
        </section>
      </div>
    </AppDialog>
  );
};

export default HeaderSettingsDialog;
