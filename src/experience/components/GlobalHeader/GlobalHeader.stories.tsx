import type { Meta, StoryObj } from '@storybook/react';
import { GlobalHeader } from './index';

const meta: Meta<typeof GlobalHeader> = {
  title: 'Experience/GlobalHeader',
  component: GlobalHeader,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div style={{ background: 'var(--color-surface-subtle)', minHeight: '120px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof GlobalHeader>;

// ─── Stories ─────────────────────────────────────────────────────────────────

export const Default: Story = {
  name: 'Default — app name only',
  args: {
    appName: 'Admin',
  },
};

export const WithActions: Story = {
  name: 'With command palette and help callbacks',
  args: {
    appName: 'Admin',
    onOpenCommandPalette: () => console.log('Open command palette'),
    onOpenHelp: () => console.log('Open help'),
  },
};

export const CustomAppName: Story = {
  name: 'Custom app name — IDMS',
  args: {
    appName: 'IDMS',
    onOpenCommandPalette: () => console.log('Open command palette'),
    onOpenHelp: () => console.log('Open help'),
  },
};

export const WithRightSlot: Story = {
  name: 'With right-slot content',
  args: {
    appName: 'Admin',
    onOpenCommandPalette: () => console.log('Open command palette'),
    onOpenHelp: () => console.log('Open help'),
    rightSlot: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            fontSize: '12px',
            padding: '4px 10px',
            borderRadius: '20px',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-muted)',
            background: 'var(--color-surface)',
          }}
        >
          Excellon Motors
        </span>
        <div
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            background: 'var(--color-primary)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          AM
        </div>
      </div>
    ),
  },
};

export const FullFeatured: Story = {
  name: 'Full featured — org chip, user avatar, and actions',
  args: {
    appName: 'Admin',
    onOpenCommandPalette: () => console.log('Open command palette'),
    onOpenHelp: () => console.log('Open help'),
    rightSlot: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span
          style={{
            fontSize: '11px',
            padding: '3px 8px',
            borderRadius: '20px',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-muted)',
            background: 'var(--color-surface-subtle)',
          }}
        >
          🏢 Excellon Motors Pvt. Ltd.
        </span>
        <span
          style={{
            fontSize: '11px',
            padding: '3px 8px',
            borderRadius: '20px',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-muted)',
            background: 'var(--color-surface-subtle)',
          }}
        >
          FY 2025–26
        </span>
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'var(--color-primary)',
            color: 'var(--color-primary-contrast)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          RK
        </div>
      </div>
    ),
  },
};
