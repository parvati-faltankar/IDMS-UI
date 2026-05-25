import React from 'react';
import { AlertCircle } from 'lucide-react';
import { SmartDrawer } from '../SmartDrawer/SmartDrawer';
import type { SmartFormDrawerProps } from './SmartFormDrawer.types';

export const SmartFormDrawer: React.FC<SmartFormDrawerProps> = ({
  open,
  onClose,
  title,
  subtitle,
  width = 'md',
  onSave,
  onCancel,
  saveLabel   = 'Save',
  cancelLabel = 'Cancel',
  saveDisabled = false,
  isDirty = false,
  dirtyWarningText,
  loading = false,
  validationErrors = [],
  children,
}) => {
  const handleCancel = () => {
    if (onCancel) onCancel();
    else onClose();
  };

  return (
    <SmartDrawer
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      width={width}
      loading={loading}
      isDirty={isDirty}
      dirtyWarningText={dirtyWarningText}
      footerActions={[
        { label: cancelLabel, tone: 'outline',  onClick: handleCancel },
        { label: saveLabel,   tone: 'primary',  onClick: onSave, disabled: saveDisabled },
      ]}
    >
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Validation summary */}
        {validationErrors.length > 0 && (
          <div style={{
            padding: '10px 14px',
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '8px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '6px' }}>
              <AlertCircle size={13} style={{ color: '#DC2626', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#DC2626' }}>
                Please fix {validationErrors.length} error{validationErrors.length > 1 ? 's' : ''} before saving
              </span>
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px' }}>
              {validationErrors.map((e, i) => (
                <li key={i} style={{ fontSize: '11px', color: '#991B1B', lineHeight: 1.5 }}>{e}</li>
              ))}
            </ul>
          </div>
        )}
        {children}
      </div>
    </SmartDrawer>
  );
};
