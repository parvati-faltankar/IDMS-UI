// ─── Service Type Master — Profile Picker Dialog ─────────────────────────────

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, FileText, RotateCcw, Settings2, Shield, Tag, Wrench } from 'lucide-react';
import AppDialog from '../../../../components/app/AppDialog';
import { PROFILE_SKIP_STEPS, type ServiceProfile } from '../constants/serviceTypeMaster.constants';

// ─── Profile definitions ──────────────────────────────────────────────────────

const PROFILES: Array<{
  key: ServiceProfile;
  label: string;
  description: string;
  icon: React.ReactNode;
  accent: string;
}> = [
  { key: 'warranty', label: 'Warranty Service',     description: 'Asset-linked, contract-backed, claim-driven',  icon: <Shield    size={20} />, accent: '#2563EB' },
  { key: 'contract', label: 'Contract Service',     description: 'AMC / maintenance agreements, saleable',       icon: <FileText  size={20} />, accent: '#7C3AED' },
  { key: 'saleable', label: 'Saleable Service',     description: 'One-time paid service, no contract needed',    icon: <Tag       size={20} />, accent: '#0891B2' },
  { key: 'periodic', label: 'Periodic Maintenance', description: 'Meter / duration triggered, scheduled visits', icon: <RotateCcw size={20} />, accent: '#059669' },
  { key: 'field',    label: 'Field Service',        description: 'On-site technician visits, break-fix repairs', icon: <Wrench    size={20} />, accent: '#D97706' },
  { key: 'custom',   label: 'Custom',               description: 'Full control — configure everything manually', icon: <Settings2 size={20} />, accent: '#6B7280' },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const ServiceTypePickerDialog: React.FC<Props> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<ServiceProfile | null>(null);

  function handleSelect(profile: ServiceProfile) {
    onClose();
    navigate(`/admin/master/service-type-master/new?profile=${encodeURIComponent(profile)}`);
  }

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title="What kind of service are you creating?"
      description="Select a profile and we'll pre-configure the defaults. You can adjust anything on the next steps."
      width={740}
      showCloseButton
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px',
          padding: '4px 0 16px',
        }}
      >
        {PROFILES.map((p) => {
          const isHov = hovered === p.key;
          const skips = PROFILE_SKIP_STEPS[p.key].length;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => handleSelect(p.key)}
              onMouseEnter={() => setHovered(p.key)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '16px 14px',
                border: `1.5px solid ${isHov ? p.accent : 'var(--color-border)'}`,
                borderRadius: '12px',
                background: isHov ? `${p.accent}10` : 'var(--color-surface)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.1s, border-color 0.1s',
                width: '100%',
              }}
            >
              {/* Icon row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div
                  style={{
                    width: '38px', height: '38px', borderRadius: '10px',
                    background: isHov ? `${p.accent}20` : `${p.accent}12`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: p.accent,
                  }}
                >
                  {p.icon}
                </div>
                {isHov && <Check size={14} color={p.accent} strokeWidth={3} />}
              </div>
              {/* Label + description */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2, marginBottom: '4px' }}>
                  {p.label}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                  {p.description}
                </div>
              </div>
              {/* Skip hint */}
              {skips > 0 && (
                <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                  Skips {skips} step{skips > 1 ? 's' : ''}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </AppDialog>
  );
};

export default ServiceTypePickerDialog;
