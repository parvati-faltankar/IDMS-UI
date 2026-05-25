import type { Meta, StoryObj } from "@storybook/react";
import { AdminSetupAssistant } from "./AdminSetupAssistant";
import { adminSetupGuide } from "../../help/adminGuides";

const meta: Meta<typeof AdminSetupAssistant> = {
  title: "Experience/AdminSetupAssistant",
  component: AdminSetupAssistant,
  args: {
    items: adminSetupGuide.map((item) => ({
      id: item.id,
      label: item.label,
      description: item.description,
      status: item.defaultStatus,
      path: item.targetPath,
    })),
    onOpenItem: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof AdminSetupAssistant>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    items: [],
  },
};
