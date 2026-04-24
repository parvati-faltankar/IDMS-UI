import type React from 'react';
import DocumentPreviewDrawer from './DocumentPreviewDrawer';
import type { PurchaseRequisitionDocument } from '../../purchaseRequisitionCatalogueData';

interface PurchaseRequisitionPreviewDrawerProps {
  document: PurchaseRequisitionDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (document: PurchaseRequisitionDocument) => void;
  onCancel?: (document: PurchaseRequisitionDocument) => void;
  canEdit?: boolean;
  canCancel?: boolean;
}

const PurchaseRequisitionPreviewDrawer: React.FC<PurchaseRequisitionPreviewDrawerProps> = ({
  document,
  isOpen,
  onClose,
  onEdit,
  onCancel,
  canEdit,
  canCancel,
}) => (
  <DocumentPreviewDrawer
    document={document}
    isOpen={isOpen}
    documentTypeLabel="Purchase Requisition"
    subtitle="Purchase Requisition preview"
    onClose={onClose}
    onEdit={onEdit}
    onCancel={onCancel}
    canEdit={canEdit}
    canCancel={canCancel}
  />
);

export default PurchaseRequisitionPreviewDrawer;
