import {
  AlertCircle,
  Building2,
  ClipboardCheck,
  CreditCard,
  Factory,
  FileCode2,
  MapPin,
  Package,
  Shield,
  Users2,
  Warehouse,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface AdminMasterItem {
  key: string;
  label: string;
  description: string;
  path: string;
}

export interface AdminNavGroup {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  masters: AdminMasterItem[];
}

function m(key: string, label: string, description: string): AdminMasterItem {
  return { key, label, description, path: `/admin/master/${key}` };
}

export const adminNavGroups: AdminNavGroup[] = [
  {
    key: 'organisation',
    label: 'Organisation',
    description: 'Configure your organisation, branches, departments and workforce',
    icon: Building2,
    iconBg: '#EFF6FF',
    iconColor: '#2563EB',
    masters: [
      m('organisation-master', 'Organisation Master', 'Define company profile and legal entity details'),
      m('branch-master', 'Branch Master', 'Manage branches, outlets and office locations'),
      m('department-master', 'Department Master', 'Configure departments and cost centres'),
      m('employee-master', 'Employee Master', 'Manage employee records and profiles'),
      m('designation-master', 'Designation Master', 'Define job titles and designations'),
      m('reporting-structure', 'Reporting Structure', 'Set up hierarchical reporting relationships'),
      m('working-hours', 'Working Hours / Break Management', 'Configure shift timings and break schedules'),
      m('holiday-master', 'Holiday Master', 'Define public and company holidays'),
    ],
  },
  {
    key: 'user-access',
    label: 'Users & Roles',
    description: 'Manage users, roles, permissions and approval workflows',
    icon: Shield,
    iconBg: '#F5F3FF',
    iconColor: '#7C3AED',
    masters: [
      m('user-master', 'User Master', 'Create and manage system user accounts'),
      m('role-master', 'Role Master', 'Define user roles and access levels'),
      m('rbac', 'RBAC', 'Role-based access control configuration'),
      m('approval-workflow', 'Approval Workflow Master', 'Design approval chains and escalation rules'),
      m('notification-engine', 'Notification Engine', 'Configure notifications, alerts and triggers'),
    ],
  },
  {
    key: 'location',
    label: 'Location & Territory',
    description: 'Define geographic areas, territories and service zones',
    icon: MapPin,
    iconBg: '#F0FDF4',
    iconColor: '#16A34A',
    masters: [
      { key: 'area-master', label: 'Area Master', description: 'Define geographic areas and regions', path: '/admin/area-dashboard' },
      m('territory', 'Territory', 'Configure sales and service territories'),
      m('beat-route', 'Beat Route', 'Set up field service routes and schedules'),
      m('slot-master', 'Slot Master', 'Configure time slots for scheduling'),
    ],
  },
  {
    key: 'business-partners',
    label: 'Business Partners',
    description: 'Manage suppliers, customers and other business relationships',
    icon: Users2,
    iconBg: '#FFFBEB',
    iconColor: '#D97706',
    masters: [
      { key: 'supplier-master', label: 'Supplier Master', description: 'Manage vendor and supplier profiles', path: '/admin/supplier-master' },
      m('customer-master', 'Customer Master', 'Manage customer profiles and preferences'),
    ],
  },
  {
    key: 'product-catalogue',
    label: 'Products & Catalogue',
    description: 'Configure products, categories, attributes and specifications',
    icon: Package,
    iconBg: '#FFF7ED',
    iconColor: '#EA580C',
    masters: [
      m('product-master', 'Product Master', 'Define product catalog and specifications'),
      m('category-catalogue', 'Category / Catalogue', 'Set up product categories and catalogues'),
      m('sub-category', 'Sub Category', 'Configure product sub-categories'),
      m('product-group', 'Product Group', 'Group related products together'),
      m('attribute', 'Attribute', 'Define product attributes and variants'),
      m('brand', 'Brand', 'Manage product brands and manufacturers'),
      m('unit-of-measurement', 'Unit of Measurement', 'Configure measurement units for products'),
      m('chassis-master', 'Chassis Master', 'Manage chassis numbers and vehicle specifics'),
      m('installbase-master', 'Installbase Master', 'Track installed base and equipment records'),
      m('hex-file-master', 'Hex File Master', 'Manage firmware and hex file versions'),
    ],
  },
  {
    key: 'warehouse',
    label: 'Warehouse & Inventory',
    description: 'Configure warehouses, storage and inventory policies',
    icon: Warehouse,
    iconBg: '#ECFEFF',
    iconColor: '#0891B2',
    masters: [
      m('warehouse-master', 'Warehouse Master', 'Define warehouse locations and zones'),
      m('barcode-qr-process', 'Barcode / QR Code Process', 'Configure barcode and QR code workflows'),
      m('item-return-policy', 'Item Return Policy', 'Set up return and refund rules'),
    ],
  },
  {
    key: 'service',
    label: 'Service Config',
    description: 'Set up service types, packages, contracts and operations',
    icon: Wrench,
    iconBg: '#EEF2FF',
    iconColor: '#4F46E5',
    masters: [
      m('service-type-master', 'Service Type', 'Define categories of services offered'),
      m('service-package', 'Service Package', 'Configure bundled service packages'),
      m('service-labour', 'Service Labour', 'Define labour tasks and standard rates'),
      m('service-contract', 'Service Contract', 'Manage service agreements and AMCs'),
      m('service-group', 'Service Group', 'Group related services together'),
      m('service-campaign', 'Service Campaign', 'Configure seasonal or promotional campaigns'),
      m('service-bom', 'Service BOM', 'Bill of materials for service operations'),
      m('pms', 'PMS (Periodic Maintenance Services)', 'Configure scheduled maintenance schedules'),
      m('pickup-drop-setup', 'Pickup & Drop Setup', 'Configure vehicle pickup and delivery'),
      m('recall-master', 'Recall Master', 'Manage product recall campaigns and notices'),
    ],
  },
  {
    key: 'complaint',
    label: 'Complaints & Cases',
    description: 'Configure complaint types, escalation and follow-up rules',
    icon: AlertCircle,
    iconBg: '#FEF2F2',
    iconColor: '#DC2626',
    masters: [
      m('complaint-master', 'Complaint Master', 'Define complaint categories and handling'),
      m('complaint-group', 'Complaint Group', 'Group complaints by type or department'),
      m('complaint-type', 'Complaint Type', 'Configure specific complaint classifications'),
      m('case-category-master', 'Case Category Master', 'Define case types and workflows'),
      m('activity-escalation', 'Activity & Escalation Master', 'Set escalation rules and timelines'),
      m('follow-up-master', 'Follow Up Master', 'Configure follow-up actions and reminders'),
      m('delay-master', 'Delay Master', 'Define acceptable delay thresholds'),
      m('decline-master', 'Decline Master', 'Configure decline reasons and handling'),
    ],
  },
  {
    key: 'finance',
    label: 'Finance & Pricing',
    description: 'Configure currency, pricing, charges and financial rules',
    icon: CreditCard,
    iconBg: '#F0FDF4',
    iconColor: '#059669',
    masters: [
      m('currency-master', 'Currency Master', 'Define currencies and exchange rates'),
      m('kyc-setup', 'KYC Setup', 'Configure KYC requirements and verification'),
      m('invoice-setup', 'Invoice Setup', 'Define invoice formats and settings'),
      m('invoice-generation-templates', 'Invoice Generation Templates', 'Configure service invoice templates'),
      m('charge-master', 'Charge Master', 'Define charges, fees and penalties'),
      m('charge-rule-master', 'Charge Rule Master', 'Set up charge calculation rules'),
      m('pricing-module', 'Pricing Module', 'Configure pricing tiers and rules'),
      m('claim-master', 'Claim Master', 'Manage warranty and insurance claims setup'),
      m('coupon-management', 'Coupon Management', 'Create and manage discount coupons'),
      m('terms-master', 'Terms Master', 'Define payment and delivery terms'),
      m('cancellation-master', 'Cancellation Master', 'Set up cancellation rules and policies'),
    ],
  },
  {
    key: 'document-code',
    label: 'Documents & Templates',
    description: 'Manage numbering schemes, templates and print configurations',
    icon: FileCode2,
    iconBg: '#F8FAFC',
    iconColor: '#475569',
    masters: [
      m('numbering-code-setup', 'Numbering & Code Setup', 'Configure document numbering and auto-code generation'),
      m('code-generation-policy', 'Code Generation Policy', 'Define how codes and numbers are generated for each entity'),
      m('print-engine', 'Print Engine', 'Configure print layouts and document templates'),
    ],
  },
  {
    key: 'process-checklist',
    label: 'Process & Checklists',
    description: 'Configure checklists, picklists and inspection processes',
    icon: ClipboardCheck,
    iconBg: '#FDF4FF',
    iconColor: '#A21CAF',
    masters: [
      m('checklist-master', 'Checklist Master', 'Create quality and compliance checklists'),
      m('picklist-master', 'Picklist Master', 'Define dropdown values and picklists'),
      m('dependant-picklist', 'Dependant Picklist', 'Configure cascaded dropdown dependencies'),
      m('ffr-process', 'FFR Process', 'Set up fault, failure and resolution workflows'),
      m('inspection-master', 'Inspection Master', 'Define vehicle and equipment inspection forms'),
    ],
  },
  {
    key: 'workshop',
    label: 'Workshop Operations',
    description: 'Configure workshop bays and operational settings',
    icon: Factory,
    iconBg: '#FFF1F2',
    iconColor: '#E11D48',
    masters: [
      m('bay-master', 'Bay Master', 'Configure workshop bays and service stations'),
    ],
  },
];

export const allAdminMasters = adminNavGroups.flatMap((g) =>
  g.masters.map((master) => ({
    ...master,
    groupKey: g.key,
    groupLabel: g.label,
    groupIcon: g.icon,
    groupIconBg: g.iconBg,
    groupIconColor: g.iconColor,
  }))
);

export function findMasterByKey(key: string) {
  return allAdminMasters.find((m) => m.key === key) ?? null;
}

export function findGroupForMasterKey(masterKey: string) {
  return adminNavGroups.find((g) => g.masters.some((m) => m.key === masterKey)) ?? null;
}
