import type { NavigationGroup } from "./navigationTypes";

export const adminNavigationGroups: NavigationGroup[] = [
  {
    id: "admin-setup",
    label: "Setup Essentials",
    description: "Start here before transaction users begin work.",
    items: [
      { id: "admin-dashboard", label: "Admin Dashboard", path: "/admin", group: "Setup Essentials" },
      { id: "organisation-master", label: "Organisation Master", path: "/admin/master/organisation-master/new", group: "Setup Essentials" },
      { id: "numbering-code-setup", label: "Numbering & Code Setup", path: "/admin/master/numbering-code-setup", group: "Setup Essentials" },
      { id: "picklist-master", label: "Picklist Master", path: "/admin/master/picklist-master", group: "Setup Essentials" },
      { id: "kyc-setup", label: "KYC Setup", path: "/admin/master/kyc-setup", group: "Setup Essentials" },
    ],
  },
  {
    id: "users-roles",
    label: "Users & Roles",
    items: [
      { id: "user-master", label: "User Master", path: "/admin/master/user-master", group: "Users & Roles" },
      { id: "role-master", label: "Role Master", path: "/admin/master/role-master", group: "Users & Roles" },
      { id: "rbac", label: "RBAC", path: "/admin/master/rbac", group: "Users & Roles" },
    ],
  },
  {
    id: "finance-documents",
    label: "Finance & Documents",
    items: [
      { id: "code-generation-policy", label: "Code Generation Policy", path: "/admin/master/code-generation-policy", group: "Finance & Documents" },
      { id: "currency-master", label: "Currency Master", path: "/admin/master/currency-master", group: "Finance & Documents" },
      { id: "print-engine", label: "Print Engine", path: "/admin/master/print-engine", group: "Finance & Documents" },
    ],
  },
];
