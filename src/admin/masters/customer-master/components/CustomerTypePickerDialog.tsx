import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Building2, Truck, Landmark, Users } from 'lucide-react';
import AppDialog from '../../../../components/app/AppDialog';
import type { CustomerType } from '../types/customerMaster.types';
import { CUSTOMER_TYPE_META } from '../constants/customerMaster.constants';

interface Props {
  open: boolean;
  onClose: () => void;
}

const CUSTOMER_ICONS: Record<CustomerType, React.ReactNode> = {
  'Retail Individual': <User size={26} />,
  'Corporate':         <Building2 size={26} />,
  'Fleet':             <Truck size={26} />,
  'Government':        <Landmark size={26} />,
  'Internal':          <Users size={26} />,
};

const CUSTOMER_TYPES: CustomerType[] = [
  'Retail Individual',
  'Corporate',
  'Fleet',
  'Government',
  'Internal',
];

export default function CustomerTypePickerDialog({ open, onClose }: Props) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<CustomerType | null>(null);

  function handleSelect(type: CustomerType) {
    onClose();
    navigate(`/admin/master/customer-master/new?type=${encodeURIComponent(type)}`);
  }

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title="Select Customer Type"
      width={640}
      actions={
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: '0 18px', height: '34px', fontSize: '13px', fontWeight: 500,
            borderRadius: '8px', border: '1px solid var(--color-border)',
            background: 'transparent', color: 'var(--color-text)', cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      }
    >
      <div style={{ padding: '4px 0 8px' }}>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '20px', lineHeight: 1.5 }}>
          Choose the type of customer you want to add. The form will adapt fields and sections based on the selected type.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {CUSTOMER_TYPES.map((type) => {
            const meta    = CUSTOMER_TYPE_META[type];
            const isHover = hovered === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => handleSelect(type)}
                onMouseEnter={() => setHovered(type)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '12px',
                  padding: '14px 16px', border: `2px solid ${isHover ? meta.color : 'var(--color-border)'}`,
                  borderRadius: '10px', background: isHover ? meta.bgColor : 'var(--color-surface)',
                  cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s, background 0.15s',
                }}
              >
                <span style={{
                  width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0,
                  background: meta.bgColor, color: meta.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${meta.color}30`,
                }}>
                  {CUSTOMER_ICONS[type]}
                </span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: isHover ? meta.color : 'var(--color-text)', marginBottom: '3px' }}>
                    {type}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: 1.45 }}>
                    {meta.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </AppDialog>
  );
}
