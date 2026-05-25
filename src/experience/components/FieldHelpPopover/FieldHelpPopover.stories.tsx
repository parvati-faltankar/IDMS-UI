import type { Meta, StoryObj } from '@storybook/react';
import { FieldHelpPopover } from './FieldHelpPopover';

const meta: Meta<typeof FieldHelpPopover> = {
  title: 'Experience/FieldHelpPopover',
  component: FieldHelpPopover,
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof FieldHelpPopover>;

// ─── Stories ─────────────────────────────────────────────────────────────────

export const CodePrefix: Story = {
  name: 'Code Prefix field help',
  args: {
    title: 'Code Prefix',
    description:
      'A short alphabetic code prepended to all generated document numbers for this entity type. ' +
      'The prefix distinguishes document series and appears in all references and reports.',
    example: 'PO for Purchase Orders, SO for Sale Orders, GRN for Goods Receipt Notes',
  },
};

export const SeriesType: Story = {
  name: 'Series Type field help',
  args: {
    title: 'Series Type',
    description:
      'Controls how the numeric portion of the document code resets. ' +
      'Annual resets the counter at the start of each financial year. ' +
      'Perpetual never resets — the counter continues indefinitely.',
    example: 'Annual: PO-2526-00001, PO-2627-00001 | Perpetual: PO-00001, PO-00002',
  },
};

export const EntityType: Story = {
  name: 'Entity Type field help',
  args: {
    title: 'Entity Type',
    description:
      'The category of business party this KYC configuration applies to. ' +
      'Each entity type can have a different set of required proof documents per country.',
    example: 'Customer, Supplier, Employee, Vendor, Partner',
  },
};

export const GstNumber: Story = {
  name: 'GST Number field help — no example',
  args: {
    title: 'GST Number',
    description:
      'The Goods and Services Tax identification number issued by the tax authority. ' +
      'Required for tax-registered entities operating in India. ' +
      'This number appears on all tax invoices and GST returns.',
  },
};

export const PicklistLevel: Story = {
  name: 'Picklist Level field help',
  args: {
    title: 'Picklist Level',
    description:
      'Defines the hierarchy position of this picklist within a dependent selection chain. ' +
      'Level 1 is the top-level parent. Level 2 items filter based on the selected Level 1 value.',
    example: 'Level 1: State → Level 2: District → Level 3: City',
  },
};
