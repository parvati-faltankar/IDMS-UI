import type { RuntimeContext } from '../types';

export const previewContexts: RuntimeContext[] = [
  {
    userId: 'preview-sales-user',
    roles: ['sales'],
    mode: 'preview',
    device: 'desktop',
    channel: 'web',
    workflowState: 'draft',
    tenantId: 'tenant-a',
  },
  {
    userId: 'preview-finance-user',
    roles: ['finance'],
    mode: 'preview',
    device: 'tablet',
    channel: 'web',
    workflowState: 'pending-approval',
    tenantId: 'tenant-a',
  },
  {
    userId: 'preview-warehouse-user',
    roles: ['warehouse'],
    mode: 'preview',
    device: 'mobile',
    channel: 'mobile',
    workflowState: 'approved',
    tenantId: 'tenant-b',
    branchId: 'branch-1',
  },
];

