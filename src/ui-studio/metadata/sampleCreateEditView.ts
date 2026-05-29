import type { ViewMetadata } from '../types';

export const sampleCreateEditView: ViewMetadata = {
  id: 'view-so-create',
  viewCode: 'sale-order-create-default',
  name: 'Sale Order Create',
  entityName: 'sale-order',
  surface: 'create-edit',
  version: '1.0.0',
  layout: {
    id: 'layout-root',
    type: 'root',
    children: [
      {
        id: 'section-header',
        type: 'section',
        componentIds: ['customer-name', 'order-date', 'order-amount', 'sales-owner'],
      },
      {
        id: 'section-actions',
        type: 'section',
        componentIds: ['actions-primary'],
      },
    ],
  },
  components: [
    {
      id: 'customer-name',
      type: 'text-field',
      label: 'Customer Name',
      bindings: [{ type: 'entity-field', source: 'sale-order', fieldPath: 'customerName' }],
    },
    {
      id: 'order-date',
      type: 'date-field',
      label: 'Order Date',
      bindings: [{ type: 'entity-field', source: 'sale-order', fieldPath: 'orderDate' }],
    },
    {
      id: 'order-amount',
      type: 'number-field',
      label: 'Order Amount',
      bindings: [{ type: 'entity-field', source: 'sale-order', fieldPath: 'orderAmount' }],
    },
    {
      id: 'sales-owner',
      type: 'entity-picker',
      label: 'Sales Owner',
      bindings: [{ type: 'relationship', source: 'user', fieldPath: 'displayName' }],
    },
    {
      id: 'actions-primary',
      type: 'action-toolbar',
      label: 'Primary Actions',
    },
  ],
  actions: [
    { id: 'action-save', label: 'Save', commandId: 'sale-order.save', type: 'workflow.transition', payload: { transitionId: 'save-draft' } },
    {
      id: 'action-submit',
      label: 'Submit',
      commandId: 'sale-order.submit',
      type: 'workflow.transition',
      payload: { transitionId: 'submit' },
      requiresConfirmation: true,
    },
  ],
  rules: [
    {
      id: 'rule-submit-lock',
      targetActionId: 'action-submit',
      effect: 'disable',
      condition: { field: 'orderAmount', operator: 'isEmpty' },
    },
  ],
};
