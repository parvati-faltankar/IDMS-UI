import type React from 'react';
import CompactTransactionPreviewDrawer from './CompactTransactionPreviewDrawer';
import type { JobCardDocument } from '../../pages/job-card/jobCardCatalogueData';

interface JobCardPreviewDrawerProps {
  document: JobCardDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (document: JobCardDocument) => void;
  onCancel?: (document: JobCardDocument) => void;
  canEdit?: boolean;
  canCancel?: boolean;
}

const JobCardPreviewDrawer: React.FC<JobCardPreviewDrawerProps> = ({
  document,
  isOpen,
  onClose,
  onEdit,
  onCancel,
  canEdit,
  canCancel,
}) => (
  <CompactTransactionPreviewDrawer
    document={document}
    isOpen={isOpen}
    documentTypeLabel='Job Card'
    subtitle='Job Card preview'
    onClose={onClose}
    onEdit={onEdit}
    onCancel={onCancel}
    canEdit={canEdit}
    canCancel={canCancel}
  />
);

export default JobCardPreviewDrawer;
