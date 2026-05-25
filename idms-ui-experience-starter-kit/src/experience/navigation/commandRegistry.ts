import type { CommandItem } from "./navigationTypes";

export const commandRegistry: CommandItem[] = [
  {
    id: "open-admin-dashboard",
    label: "Open Admin Dashboard",
    description: "Go to the admin setup workspace.",
    actionType: "navigate",
    path: "/admin",
    keywords: ["admin", "setup", "configuration", "dashboard"],
  },
  {
    id: "open-kyc-setup",
    label: "Open KYC Setup",
    description: "Configure KYC proof and attachment rules.",
    actionType: "navigate",
    path: "/admin/master/kyc-setup",
    keywords: ["kyc", "proof", "customer document", "attachment"],
  },
  {
    id: "open-picklist-master",
    label: "Open Picklist Master",
    description: "Configure dropdown values and dependent picklists.",
    actionType: "navigate",
    path: "/admin/master/picklist-master",
    keywords: ["picklist", "dropdown", "dependent", "values"],
  },
  {
    id: "open-numbering-code-setup",
    label: "Open Numbering & Code Setup",
    description: "Configure prefixes and numbering rules.",
    actionType: "navigate",
    path: "/admin/master/numbering-code-setup",
    keywords: ["numbering", "prefix", "code", "series"],
  },
  {
    id: "open-code-generation-policy",
    label: "Open Code Generation Policy",
    description: "Define generated code format and activation rules.",
    actionType: "navigate",
    path: "/admin/master/code-generation-policy",
    keywords: ["code generation", "policy", "format", "sequence"],
  },
  {
    id: "help-admin-dashboard",
    label: "Help: Admin Setup",
    description: "Learn how the admin setup flow works.",
    actionType: "open-help",
    helpTopicId: "admin-dashboard",
    keywords: ["help", "how admin works", "guide"],
  },
];
