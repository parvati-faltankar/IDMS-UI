import type { Meta, StoryObj } from "@storybook/react";
import { ValidationChecklist } from "./ValidationChecklist";

const meta: Meta<typeof ValidationChecklist> = {
  title: "Experience/ValidationChecklist",
  component: ValidationChecklist,
  args: {
    description: "Resolve these items before activating the configuration.",
    items: [
      { id: "overview", label: "Overview complete", description: "Name, entity, and entity type are filled.", status: "pass" },
      { id: "proof", label: "At least one active proof", description: "Add one active proof rule.", status: "fail" },
      { id: "rules", label: "All proof rows are valid", description: "No missing fields or rule conflicts.", status: "pending" },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof ValidationChecklist>;

export const Default: Story = {};
