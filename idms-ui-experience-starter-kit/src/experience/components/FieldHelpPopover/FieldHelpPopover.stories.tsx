import type { Meta, StoryObj } from "@storybook/react";
import { FieldHelpPopover } from "./FieldHelpPopover";

const meta: Meta<typeof FieldHelpPopover> = {
  title: "Experience/FieldHelpPopover",
  component: FieldHelpPopover,
  args: {
    title: "Regex Pattern",
    description: "Use regex only when a document number must follow a strict format.",
    example: "A strict tax ID or passport number format.",
  },
};

export default meta;
type Story = StoryObj<typeof FieldHelpPopover>;

export const Default: Story = {};
