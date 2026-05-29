// ─── Slot Master — Constants ──────────────────────────────────────────────────

import type {
  SlotStatus,
  DayOfWeek,
  MockBranch,
  MockRole,
  MockEmployee,
  SlotRecord,
} from '../types/slotMaster.types';

// ─── Master key ───────────────────────────────────────────────────────────────

export const MASTER_KEY = 'slot-master';

// ─── Status lists / meta ──────────────────────────────────────────────────────

export const SLOT_STATUSES: SlotStatus[] = ['Draft', 'Active', 'Inactive'];

export const SLOT_STATUS_META: Record<SlotStatus, { color: string; bg: string }> = {
  Draft:    { color: '#64748B', bg: '#F1F5F9' },
  Active:   { color: '#15803D', bg: '#DCFCE7' },
  Inactive: { color: '#DC2626', bg: '#FEF2F2' },
};

// ─── Days of week ─────────────────────────────────────────────────────────────

export const ALL_DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const DAY_LABELS: Record<DayOfWeek, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};

// ─── Transaction entities ─────────────────────────────────────────────────────

export const TRANSACTION_ENTITIES: string[] = [
  'Purchase Requisition',
  'Purchase Order',
  'Goods Receipt',
  'Invoice',
  'Credit Note',
  'Debit Note',
  'Sales Order',
  'Delivery Order',
  'Service Request',
  'Appointment',
  'Inspection',
  'Payment',
  'Material Transfer',
  'Return Order',
  'Quality Check',
];

// ─── Mock branch (wired to Branch Master later) ───────────────────────────────

export const MOCK_BRANCH: MockBranch = {
  id: 'BRN-001',
  name: 'Head Office',
  workStart: '09:00',
  workEnd: '18:00',
  breaks: [{ name: 'Lunch Break', start: '13:00', end: '14:00' }],
  workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  holidays: ['2026-01-26', '2026-08-15', '2026-10-02'],
};

// ─── Mock roles ───────────────────────────────────────────────────────────────

export const MOCK_ROLES: MockRole[] = [
  { id: 'ROLE-001', name: 'Service Advisor' },
  { id: 'ROLE-002', name: 'Sales Executive' },
  { id: 'ROLE-003', name: 'Inspection Officer' },
  { id: 'ROLE-004', name: 'Account Manager' },
  { id: 'ROLE-005', name: 'Delivery Executive' },
];

// ─── Mock employees ───────────────────────────────────────────────────────────

export const MOCK_EMPLOYEES: MockEmployee[] = [
  { id: 'EMP-001', name: 'Arjun Sharma',    roleId: 'ROLE-001', isActive: true },
  { id: 'EMP-002', name: 'Priya Desai',     roleId: 'ROLE-001', isActive: true },
  { id: 'EMP-003', name: 'Rahul Mehta',     roleId: 'ROLE-001', isActive: true },
  { id: 'EMP-004', name: 'Sneha Patil',     roleId: 'ROLE-002', isActive: true },
  { id: 'EMP-005', name: 'Vikram Nair',     roleId: 'ROLE-002', isActive: true },
  { id: 'EMP-006', name: 'Kavya Reddy',     roleId: 'ROLE-003', isActive: true },
  { id: 'EMP-007', name: 'Rohan Joshi',     roleId: 'ROLE-003', isActive: false },
  { id: 'EMP-008', name: 'Anita Kulkarni',  roleId: 'ROLE-004', isActive: true },
  { id: 'EMP-009', name: 'Deepak Singh',    roleId: 'ROLE-005', isActive: true },
  { id: 'EMP-010', name: 'Meera Iyer',      roleId: 'ROLE-005', isActive: true },
];

// ─── Default form values ──────────────────────────────────────────────────────

export const DEFAULT_SLOT_FORM: Omit<SlotRecord, 'id' | 'slotCode' | 'createdAt' | 'updatedAt'> = {
  name: '',
  displayName: '',
  entity: '',
  entityTypes: [],
  tagToRole: '',
  taggedEmployees: [],
  branch: MOCK_BRANCH.id,
  startDate: '',
  endDate: '',
  slotStartTime: '',
  slotEndTime: '',
  slotDurationMin: 30,
  timeGapMin: 0,
  activeDays: [...MOCK_BRANCH.workingDays],
  dailySlotCount: 0,
  totalSlotCount: 0,
  totalDays: 0,
  description: '',
  isActive: true,
  status: 'Draft',
  generatedDays: [],
};

// ─── Seed data ────────────────────────────────────────────────────────────────

export const SEED_SLOTS: (SlotRecord & { createdAt: string; updatedAt: string })[] = [
  {
    id: 'slot-seed-1',
    slotCode: 'SLT-0001',
    name: 'Morning Service Slots',
    displayName: 'Morning Service',
    entity: 'Service Request',
    entityTypes: ['Passenger Car', 'SUV'],
    tagToRole: 'ROLE-001',
    taggedEmployees: [
      { employeeId: 'EMP-001', employeeName: 'Arjun Sharma',  role: 'Service Advisor' },
      { employeeId: 'EMP-002', employeeName: 'Priya Desai',   role: 'Service Advisor' },
    ],
    branch: 'BRN-001',
    startDate: '2026-06-01',
    endDate: '2026-06-30',
    slotStartTime: '09:00',
    slotEndTime: '13:00',
    slotDurationMin: 30,
    timeGapMin: 0,
    activeDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    dailySlotCount: 8,
    totalSlotCount: 176,
    totalDays: 22,
    description: 'Morning service slots for June 2026',
    isActive: true,
    status: 'Active',
    generatedDays: [],
    createdAt: '2026-05-01T09:00:00.000Z',
    updatedAt: '2026-05-01T09:00:00.000Z',
  },
  {
    id: 'slot-seed-2',
    slotCode: 'SLT-0002',
    name: 'Afternoon Delivery Slots',
    displayName: 'Afternoon Delivery',
    entity: 'Delivery Order',
    entityTypes: [],
    tagToRole: 'ROLE-005',
    taggedEmployees: [
      { employeeId: 'EMP-009', employeeName: 'Deepak Singh', role: 'Delivery Executive' },
      { employeeId: 'EMP-010', employeeName: 'Meera Iyer',   role: 'Delivery Executive' },
    ],
    branch: 'BRN-001',
    startDate: '2026-06-01',
    endDate: '2026-06-15',
    slotStartTime: '14:00',
    slotEndTime: '18:00',
    slotDurationMin: 60,
    timeGapMin: 10,
    activeDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    dailySlotCount: 3,
    totalSlotCount: 33,
    totalDays: 11,
    description: 'Afternoon delivery slots for first half of June',
    isActive: true,
    status: 'Draft',
    generatedDays: [],
    createdAt: '2026-05-02T10:00:00.000Z',
    updatedAt: '2026-05-02T10:00:00.000Z',
  },
];
