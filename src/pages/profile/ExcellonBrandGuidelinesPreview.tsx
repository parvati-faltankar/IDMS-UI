import React from 'react';
import AppShell from '../../components/common/AppShell';
import { FormField, Input, Select, Textarea } from '../../components/common/FormControls';

const palette = [
  { label: 'Brand/50', value: 'var(--brand-50)' },
  { label: 'Brand/100', value: 'var(--brand-100)' },
  { label: 'Brand/200', value: 'var(--brand-200)' },
  { label: 'Brand/300', value: 'var(--brand-300)' },
  { label: 'Brand/400', value: 'var(--brand-400)' },
  { label: 'Brand/500', value: 'var(--brand-500)' },
  { label: 'Brand/600', value: 'var(--brand-600)' },
  { label: 'Brand/700', value: 'var(--brand-700)' },
  { label: 'Brand/800', value: 'var(--brand-800)' },
  { label: 'Brand/900', value: 'var(--brand-900)' },
];

const ExcellonBrandGuidelinesPreview: React.FC = () => {
  return (
    <AppShell activeLeaf="purchase-requisition">
      <div className="page-container guidelines-stack">
        <div className="brand-surface guidelines-section guidelines-section--spaced">
          <h1 className="brand-page-title">Excellon Brand Guidelines Preview</h1>
          <p className="brand-page-subtitle">
            Shared tokens, controls, and surfaces sourced from the attached design-system image.
          </p>
        </div>

        <div className="brand-surface guidelines-section guidelines-section--spaced">
          <h2 className="brand-page-title mb-4">Brand Palette</h2>
          <div className="guidelines-grid guidelines-grid--swatches">
            {palette.map((swatch) => (
              <div key={swatch.label} className="brand-surface guidelines-swatch">
                <div className="guidelines-swatch__color" style={{ background: swatch.value }} />
                <div className="guidelines-swatch__meta">
                  <div className="field-label">{swatch.label}</div>
                  <div className="brand-caption brand-muted-text">{swatch.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="brand-surface guidelines-section guidelines-section--spaced">
          <h2 className="brand-page-title mb-4">Typography</h2>
          <div className="guidelines-grid gap-3">
            <div className="text-[var(--font-size-32)] leading-[var(--line-height-44)] font-semibold">Page Title 32/44</div>
            <div className="text-[var(--font-size-24)] leading-[var(--line-height-36)] font-semibold">Section Title 24/36</div>
            <div className="text-[var(--font-size-18)] leading-[var(--line-height-32)] font-medium">Body Lead 18/32</div>
            <div className="text-[var(--font-size-14)] leading-[var(--line-height-24)] font-normal">Base font size 14/24</div>
            <div className="brand-muted-text">Helper text 14/24 using muted foreground.</div>
          </div>
        </div>

        <div className="brand-surface guidelines-section guidelines-section--spaced">
          <h2 className="brand-page-title mb-4">Form Controls</h2>
          <div className="guidelines-grid guidelines-grid--form">
            <FormField label="Label" required help="This is a hint text to help user.">
              <Input placeholder="Enter text" />
            </FormField>

            <FormField label="Select" required help="This is a hint text to help user.">
              <Select
                defaultValue=""
                options={[
                  { value: '', label: 'Select team member' },
                  { value: 'alex-kumar', label: 'Alex Kumar' },
                  { value: 'neha-sharma', label: 'Neha Sharma' },
                ]}
              />
            </FormField>

            <FormField label="Description" help="This is a hint text to help user.">
              <Textarea placeholder="Enter a description..." />
            </FormField>
          </div>
        </div>

        <div className="brand-surface guidelines-section">
          <h2 className="brand-page-title mb-4">Buttons</h2>
          <div className="guidelines-inline-actions">
            <button type="button" className="btn btn--primary">Button CTA</button>
            <button type="button" className="btn btn--secondary">Button CTA</button>
            <button type="button" className="btn btn--outline">Button CTA</button>
            <button type="button" className="btn btn--ghost">Button CTA</button>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default ExcellonBrandGuidelinesPreview;
