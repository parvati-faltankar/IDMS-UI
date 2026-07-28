import React, { useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { X } from 'lucide-react';
import { cn } from '../../utils/classNames';

export interface ProfilePanelAction {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  onClick?: () => void;
  disabled?: boolean;
  accent?: boolean;
}

export interface ProfilePanelWorkspaceItem {
  id: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  onClick: () => void;
}

export interface ProfilePanelProps {
  open: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  name: string;
  role: string;
  email?: string;
  initials: string;
  settingsLabel: string;
  onOpenSettings: () => void;
  workspaceTitle: string;
  workspaceHint: string;
  workspaceItems: ProfilePanelWorkspaceItem[];
  appearanceControls?: React.ReactNode;
  featuredActions: ProfilePanelAction[];
  utilityActions: ProfilePanelAction[];
}

const CLOSE_ANIMATION_MS = 180;

function getFocusableElements(container: HTMLElement | null) {
  if (!container) {
    return [] as HTMLElement[];
  }

  return Array.from(
    container.querySelectorAll<HTMLElement>(
      [
        'button:not([disabled])',
        '[href]',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(',')
    )
  ).filter((element) => !element.hasAttribute('disabled') && !element.getAttribute('aria-hidden'));
}

const ProfilePanel: React.FC<ProfilePanelProps> = ({
  open,
  onClose,
  triggerRef,
  name,
  role,
  email,
  initials,
  settingsLabel,
  onOpenSettings,
  workspaceTitle,
  workspaceHint,
  workspaceItems,
  appearanceControls,
  featuredActions,
  utilityActions,
}) => {
  const panelRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const focusTimerRef = useRef<number | null>(null);
  const [isRendered, setIsRendered] = useState(open);
  const [isVisible, setIsVisible] = useState(open);

  useEffect(() => {
    if (open) {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }

      setIsRendered(true);
      const raf = window.requestAnimationFrame(() => setIsVisible(true));
      focusTimerRef.current = window.setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 80);

      return () => {
        window.cancelAnimationFrame(raf);
      };
    }

    setIsVisible(false);
    closeTimerRef.current = window.setTimeout(() => {
      setIsRendered(false);
      triggerRef.current?.focus();
    }, CLOSE_ANIMATION_MS);

    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, [open, triggerRef]);

  useEffect(() => {
    if (focusTimerRef.current) {
      window.clearTimeout(focusTimerRef.current);
    }
  }, [isRendered]);

  useEffect(() => {
    if (!isRendered) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) {
        return;
      }

      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return;
      }

      onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const focusables = getFocusableElements(panelRef.current);
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }

      const activeElement = document.activeElement as HTMLElement | null;
      const currentIndex = activeElement ? focusables.indexOf(activeElement) : -1;
      const nextIndex = event.shiftKey
        ? currentIndex <= 0
          ? focusables.length - 1
          : currentIndex - 1
        : currentIndex === -1 || currentIndex === focusables.length - 1
          ? 0
          : currentIndex + 1;

      if (currentIndex === -1 || nextIndex !== currentIndex + (event.shiftKey ? -1 : 1)) {
        event.preventDefault();
        focusables[nextIndex]?.focus();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isRendered, onClose, triggerRef]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
      if (focusTimerRef.current) {
        window.clearTimeout(focusTimerRef.current);
      }
    };
  }, []);

  if (!isRendered) {
    return null;
  }

  return (
    <aside
      ref={panelRef}
      className={cn('app-topbar__profile-panel', isVisible && 'app-topbar__profile-panel--visible')}
      role="dialog"
      aria-modal="false"
      aria-label={`${name} profile panel`}
    >
      <div className="app-topbar__profile-panel-header">
        <div className="app-topbar__profile-panel-identity">
          <div className="app-topbar__avatar app-topbar__avatar--profile-panel" aria-hidden="true">
            {initials}
          </div>
          <div className="app-topbar__profile-panel-identity-copy">
            <div className="app-topbar__profile-panel-name-row">
              <div className="app-topbar__profile-panel-name">{name}</div>
              <button
                ref={closeButtonRef}
                type="button"
                className="app-topbar__profile-panel-close"
                aria-label="Close profile panel"
                onClick={onClose}
              >
                <X size={16} />
              </button>
            </div>
            <div className="app-topbar__profile-panel-role">{role}</div>
            {email && <div className="app-topbar__profile-panel-email">{email}</div>}
            <button type="button" className="app-topbar__profile-panel-settings" onClick={onOpenSettings}>
              {settingsLabel}
            </button>
          </div>
        </div>
      </div>

      <div className="app-topbar__profile-panel-body">
        <section className="app-topbar__workspace-switch app-topbar__workspace-switch--profile-panel" aria-label={workspaceTitle}>
          <div className="app-topbar__workspace-switch-head">
            <span className="app-topbar__workspace-switch-title">{workspaceTitle}</span>
            <span className="app-topbar__workspace-switch-hint">{workspaceHint}</span>
          </div>
          <div className="app-topbar__workspace-switch-options">
            {workspaceItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={cn('app-topbar__workspace-switch-option', item.active && 'app-topbar__workspace-switch-option--active')}
                  aria-pressed={item.active}
                  onClick={item.onClick}
                >
                  <span className="app-topbar__workspace-switch-icon" aria-hidden="true">
                    <Icon size={14} />
                  </span>
                  <span className="app-topbar__workspace-switch-label">{item.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {appearanceControls}

        <section className="app-topbar__profile-panel-section" aria-label="Productivity actions">
          <div className="app-topbar__profile-panel-feature-grid">
            {featuredActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  className={cn(
                    'app-topbar__profile-panel-feature-card',
                    action.accent && 'app-topbar__profile-panel-feature-card--accent'
                  )}
                  disabled={action.disabled}
                  onClick={action.onClick}
                >
                  <span className="app-topbar__profile-panel-feature-icon" aria-hidden="true">
                    <Icon size={18} />
                  </span>
                  <span className="app-topbar__profile-panel-feature-copy">
                    <strong>{action.label}</strong>
                    {action.description && <small>{action.description}</small>}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="app-topbar__profile-panel-section" aria-label="Workspace tools">
          <div className="app-topbar__profile-panel-section-title">Workspace tools</div>
          <div className="app-topbar__profile-panel-utility-list">
            {utilityActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  className={cn(
                    'app-topbar__dropdown-item',
                    'app-topbar__profile-panel-utility-item',
                    action.disabled && 'app-topbar__profile-panel-utility-item--disabled'
                  )}
                  disabled={action.disabled}
                  onClick={action.onClick}
                >
                  <span className="app-topbar__profile-panel-utility-icon" aria-hidden="true">
                    <Icon size={16} />
                  </span>
                  <span className="app-topbar__dropdown-item-copy app-topbar__profile-panel-utility-copy">
                    <strong>{action.label}</strong>
                    {action.description && <small>{action.description}</small>}
                  </span>
                  {action.accent && <span className="app-topbar__profile-panel-utility-badge">New</span>}
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </aside>
  );
};

export default ProfilePanel;
