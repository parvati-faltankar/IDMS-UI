import type { Meta, StoryObj } from "@storybook/react";
import { SmartSidebar } from "./SmartSidebar";
import { adminNavigationGroups } from "../../navigation/navigationGroups";

const meta: Meta<typeof SmartSidebar> = {
  title: "Experience/SmartSidebar",
  component: SmartSidebar,
  args: {
    groups: adminNavigationGroups,
    activePath: "/admin/master/kyc-setup",
    favorites: [adminNavigationGroups[0].items[3]],
    recentItems: [adminNavigationGroups[0].items[4], adminNavigationGroups[0].items[2]],
    onNavigate: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof SmartSidebar>;

export const Default: Story = {};

export const Minimal: Story = {
  args: {
    favorites: [],
    recentItems: [],
  },
};
