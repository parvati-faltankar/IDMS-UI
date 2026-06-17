import type React from 'react';
import { AdminPageShell } from './AdminPageShell';
import type {
  AdminPageShellNavigationMode,
  AdminPageShellProps,
} from './AdminPageShell.types';
import { MasterFormStepper } from './MasterFormStepper';
import type { MasterFormStepItem } from './MasterFormStepper.types';

type NavigationSupplement =
  | React.ReactNode
  | ((props: { mode: AdminPageShellNavigationMode }) => React.ReactNode);

export type MasterCreateFormShellProps = {
  title: string;
  backAction?: AdminPageShellProps['backAction'];
  statusLabel?: AdminPageShellProps['statusLabel'];
  statusTone?: AdminPageShellProps['statusTone'];
  primaryAction?: AdminPageShellProps['primaryAction'];
  secondaryActions?: AdminPageShellProps['secondaryActions'];
  helpTopicId?: AdminPageShellProps['helpTopicId'];
  onHelpClick?: AdminPageShellProps['onHelpClick'];
  navigationPersistenceKey?: AdminPageShellProps['navigationPersistenceKey'];
  steps: MasterFormStepItem[];
  activeStepId: string;
  onStepChange: (stepId: string) => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  navigationWidth?: AdminPageShellProps['navigationWidth'];
  navigationSupplement?: NavigationSupplement;
};

export function MasterCreateFormShell({
  title,
  backAction,
  statusLabel,
  statusTone,
  primaryAction,
  secondaryActions,
  helpTopicId,
  onHelpClick,
  navigationPersistenceKey,
  steps,
  activeStepId,
  onStepChange,
  children,
  footer,
  navigationWidth = 220,
  navigationSupplement,
}: MasterCreateFormShellProps) {
  return (
    <AdminPageShell
      variant="master-form"
      headerVariant="appbar"
      title={title}
      backAction={backAction}
      statusLabel={statusLabel}
      statusTone={statusTone}
      primaryAction={primaryAction}
      secondaryActions={secondaryActions}
      helpTopicId={helpTopicId}
      onHelpClick={onHelpClick}
      navigationPersistenceKey={navigationPersistenceKey}
      navigationWidth={navigationWidth}
      footer={footer}
      navigationSlot={({ mode, closeNavigation }) => (
        <>
          <MasterFormStepper
            steps={steps}
            activeStepId={activeStepId}
            onStepChange={onStepChange}
            mode={mode}
            onRequestClose={closeNavigation}
          />
          {navigationSupplement
            ? typeof navigationSupplement === 'function'
              ? navigationSupplement({ mode })
              : mode === 'collapsed'
                ? null
                : navigationSupplement
            : null}
        </>
      )}
    >
      {children}
    </AdminPageShell>
  );
}
