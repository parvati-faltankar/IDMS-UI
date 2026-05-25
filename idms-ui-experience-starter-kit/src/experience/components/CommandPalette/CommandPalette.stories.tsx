import type { Meta, StoryObj } from "@storybook/react";
import { CommandPalette } from "./CommandPalette";
import { commandRegistry } from "../../navigation/commandRegistry";

const meta: Meta<typeof CommandPalette> = {
  title: "Experience/CommandPalette",
  component: CommandPalette,
  args: {
    open: true,
    commands: commandRegistry,
    onClose: () => {},
    onExecute: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof CommandPalette>;

export const Default: Story = {};
