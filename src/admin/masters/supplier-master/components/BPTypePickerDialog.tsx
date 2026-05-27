import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight,
  Banknote,
  Package,
  Shield,
  Truck,
  UserCheck,
  Users,
  Wrench,
} from 'lucide-react';
import AppDialog from '../../../../components/app/AppDialog';
import type { BPType } from '../types/supplierMaster.types';
import { BP_TYPE_META } from '../constants/supplierMaster.constants';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
}

// ─── Type config ──────────────────────────────────────────────────────────────

const ALL_TYPES: BPType[] = [
  'Supplier',
  'Transporter',
  'Insurance Provider',
  'Financier',
  'Customer',
  'Broker',
  'Agent',
  'Contractor',
];

const TYPE_ICONS: Record<BPType, React.ReactNode> = {
  'Supplier':           <Package size={20} />,
  'Transporter':        <Truck size={20} />,
  'Insurance Provider': <Shield size={20} />,
  'Financier':          <Banknote size={20} />,
  'Customer':           <Users size={20} />,
  'Broker':             <ArrowLeftRight size={20} />,
  'Agent':              <UserCheck size={20} />,
  'Contractor':         <Wrench size={20} />,
};

// ─── Component ────────────────────────────────────────────────────────────────

const BPTypePickerDialog: React.FC<Props> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<BPType | null>(null);

  function handleSelect(type: BPType) {
    onClose();
    navigate(`/admin/supplier-master/new?type=${encodeURIComponent(type)}`);
  }

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title="What type of Business Partner are you adding?"
      description="Select a type to get a tailored onboarding form with relevant steps pre-configured."
      width={700}
      showCloseButton
    >
      {/* Type card grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '10px',
          padding: '4px 0 12px',
        }}
      >
        {ALL_TYPES.map((type) => {
          const meta = BP_TYPE_META[type];
          const icon = TYPE_ICONS[type];
          const isHov = hovered === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => handleSelect(type)}
              onMouseEnter={() => setHovered(type)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '14px 12px',
                border: `1.5px solid ${isHov ? meta.color : 'var(--color-border)'}`,
                borderRadius: '10px',
                background: isHov ? meta.bgColor : 'var(--color-surface)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.1s, border-color 0.1s',
                width: '100%',
              }}
            >
              <span style={{ color: meta.color }}>{icon}</span>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2, marginBottom: '3px' }}>
                  {type}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                  {meta.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </AppDialog>
  );
};

export default BPTypePickerDialog;
