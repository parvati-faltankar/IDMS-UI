export type AdminGuideStep = {
  id: string;
  label: string;
  description: string;
  targetPath: string;
  defaultStatus: "complete" | "in-progress" | "not-started" | "needs-attention";
};

export const adminSetupGuide: AdminGuideStep[] = [
  {
    id: "organisation-master",
    label: "Organisation Master",
    description: "Confirm legal entity, contact, tax, and branding details.",
    targetPath: "/admin/master/organisation-master/new",
    defaultStatus: "complete",
  },
  {
    id: "numbering-code-setup",
    label: "Numbering & Code Setup",
    description: "Prepare prefixes and number generation rules.",
    targetPath: "/admin/master/numbering-code-setup",
    defaultStatus: "in-progress",
  },
  {
    id: "picklist-master",
    label: "Picklist Master",
    description: "Configure dropdown values and dependencies.",
    targetPath: "/admin/master/picklist-master",
    defaultStatus: "not-started",
  },
  {
    id: "kyc-setup",
    label: "KYC Setup",
    description: "Define proof and attachment requirements.",
    targetPath: "/admin/master/kyc-setup",
    defaultStatus: "needs-attention",
  },
  {
    id: "role-master",
    label: "Roles & Access",
    description: "Prepare user roles and permission model.",
    targetPath: "/admin/master/role-master",
    defaultStatus: "not-started",
  },
];
