import type { Meta, StoryObj } from "@storybook/react";
import { AdminConfigShell } from "./AdminConfigShell";
import { ValidationChecklist } from "../ValidationChecklist/ValidationChecklist";

const meta: Meta<typeof AdminConfigShell> = {
  title: "Experience/AdminConfigShell",
  component: AdminConfigShell,
  args: {
    title: "KYC Setup",
    description: "Configure proof document requirements by entity type and country.",
    breadcrumbs: ["Admin", "Finance & Pricing", "KYC Setup"],
    helpTopicId: "kyc-setup",
    activeSectionId: "overview",
    sections: [
      { id: "overview", label: "Overview", status: "complete" },
      { id: "proofs", label: "Proof Rules", status: "in-progress" },
      { id: "validation", label: "Validation", status: "not-started" },
    ],
    primaryAction: { label: "Activate" },
    secondaryActions: [{ label: "Save Draft" }],
    children: (
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="text-lg font-semibold">Overview</h3>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">This area represents the page-specific form content.</p>
      </div>
    ),
    aside: (
      <ValidationChecklist
        items={[
          { id: "overview", label: "Overview complete", status: "pass" },
          { id: "proof", label: "At least one active proof", status: "fail" },
        ]}
      />
    ),
  },
};

export default meta;
type Story = StoryObj<typeof AdminConfigShell>;

export const Default: Story = {};
