import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { SmartFormDrawer } from './SmartFormDrawer';

const meta: Meta<typeof SmartFormDrawer> = {
  title: 'Experience/SmartFormDrawer',
  component: SmartFormDrawer,
  parameters: { layout: 'fullscreen' },
  args: { open: true, onClose: () => {}, onSave: () => {} },
};
export default meta;

type Story = StoryObj<typeof SmartFormDrawer>;

const fieldStyle: React.CSSProperties = {
  width: '100%', padding: '7px 11px', fontSize: '13px',
  border: '1px solid var(--color-border)', borderRadius: '8px',
  background: 'var(--color-surface)', color: 'var(--color-text)',
  outline: 'none', boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '12px', fontWeight: 500,
  color: 'var(--color-text)', marginBottom: '5px',
};

export const SimpleMasterForm: Story = {
  args: {
    title:    'New Area Master',
    subtitle: 'Add a new geographic area',
    width:    'md',
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={labelStyle}>Area Name <span style={{ color: '#ef4444' }}>*</span></label>
          <input type="text" placeholder="e.g. Mumbai South" style={fieldStyle} />
        </div>
        <div>
          <label style={labelStyle}>Code</label>
          <input type="text" placeholder="Auto-generated if blank" style={fieldStyle} />
        </div>
        <div>
          <label style={labelStyle}>Description</label>
          <textarea rows={3} placeholder="Optional description" style={{ ...fieldStyle, resize: 'vertical' }} />
        </div>
      </div>
    ),
  },
};

export const WithValidationErrors: Story = {
  args: {
    title:            'New Area Master',
    subtitle:         'Fix errors before saving',
    validationErrors: ['Area Name is required.', 'Code must be unique.'],
    isDirty:          true,
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={labelStyle}>Area Name <span style={{ color: '#ef4444' }}>*</span></label>
          <input type="text" style={{ ...fieldStyle, borderColor: '#ef4444' }} />
          <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '3px' }}>Area Name is required.</div>
        </div>
      </div>
    ),
  },
};

export const LoadingState: Story = {
  args: {
    title:   'Loading Form…',
    loading: true,
    children: null,
  },
};
