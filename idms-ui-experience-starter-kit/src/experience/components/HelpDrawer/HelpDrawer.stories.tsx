import type { Meta, StoryObj } from "@storybook/react";
import { HelpDrawer } from "./HelpDrawer";
import { helpTopics } from "../../help/helpTopics";

const meta: Meta<typeof HelpDrawer> = {
  title: "Experience/HelpDrawer",
  component: HelpDrawer,
  args: {
    open: true,
    topic: helpTopics.find((topic) => topic.id === "admin-dashboard"),
    onClose: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof HelpDrawer>;

export const AdminDashboardHelp: Story = {};

export const KycSetupHelp: Story = {
  args: {
    topic: helpTopics.find((topic) => topic.id === "kyc-setup"),
  },
};

export const MissingTopic: Story = {
  args: {
    topic: undefined,
  },
};
