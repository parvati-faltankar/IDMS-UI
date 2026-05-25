import type { Meta, StoryObj } from "@storybook/react";
import { EmptyStateGuide } from "./EmptyStateGuide";

const meta: Meta<typeof EmptyStateGuide> = {
  title: "Experience/EmptyStateGuide",
  component: EmptyStateGuide,
  args: {
    title: "No KYC proof rules configured",
    description: "Add at least one active proof rule before activating this KYC setup.",
    primaryActionLabel: "Add proof rule",
    secondaryActionLabel: "How this works",
  },
};

export default meta;
type Story = StoryObj<typeof EmptyStateGuide>;

export const Default: Story = {};
