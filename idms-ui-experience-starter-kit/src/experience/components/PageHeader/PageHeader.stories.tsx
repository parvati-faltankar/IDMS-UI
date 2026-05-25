import type { Meta, StoryObj } from "@storybook/react";
import { PageHeader } from "./PageHeader";

const meta: Meta<typeof PageHeader> = {
  title: "Experience/PageHeader",
  component: PageHeader,
  args: {
    title: "KYC Setup",
    description: "Configure proof requirements, document number validation, and attachment rules by entity and country.",
    breadcrumbs: ["Admin", "Finance & Pricing", "KYC Setup"],
    statusLabel: "Draft",
    statusTone: "draft",
    helpTopicId: "kyc-setup",
    primaryAction: { label: "Activate" },
    secondaryActions: [{ label: "Save Draft" }, { label: "Preview" }],
  },
};

export default meta;
type Story = StoryObj<typeof PageHeader>;

export const Default: Story = {};

export const ActiveConfiguration: Story = {
  args: {
    statusLabel: "Active",
    statusTone: "active",
    primaryAction: { label: "Review" },
    secondaryActions: [{ label: "Deactivate" }],
  },
};

export const Minimal: Story = {
  args: {
    title: "Admin Dashboard",
    description: "Complete essential setup before transaction users begin work.",
    breadcrumbs: ["Admin"],
    statusLabel: undefined,
    primaryAction: undefined,
    secondaryActions: [],
  },
};
