import type { Meta, StoryObj } from "@storybook/react";
import { GlobalHeader } from "./GlobalHeader";

const meta: Meta<typeof GlobalHeader> = {
  title: "Experience/GlobalHeader",
  component: GlobalHeader,
  args: {
    appName: "IDMS-UI",
    onOpenCommandPalette: () => {},
    onOpenHelp: () => {},
    rightSlot: <div className="rounded-full bg-[var(--color-surface-subtle)] px-3 py-2 text-sm">Ankit</div>,
  },
};

export default meta;
type Story = StoryObj<typeof GlobalHeader>;

export const Default: Story = {};
