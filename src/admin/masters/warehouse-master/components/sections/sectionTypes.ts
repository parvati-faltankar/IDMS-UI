// ─── Shared types for section components ─────────────────────────────────────
//
// Re-exported by each section so imports stay clean.

import type { HierarchyTemplate, Warehouse, WarehouseLocation } from '../../types/warehouse.types';
import type { UpdateWarehouseInput } from '../../types/warehouse.dto';

export interface SectionSavePayload extends Partial<Omit<UpdateWarehouseInput, 'version'>> {}

export interface ConfigSectionProps {
  warehouse: Warehouse;
  templates: HierarchyTemplate[];
  locations: WarehouseLocation[];
  readOnly: boolean;
  saving: boolean;
  onSave: (payload: SectionSavePayload) => Promise<void>;
}
