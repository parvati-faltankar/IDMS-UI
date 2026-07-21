export type ServiceCatalogueVariant = 'domain' | 'family' | 'labour';

export type ServiceCatalogueStatus = 'Draft' | 'Active' | 'Inactive';

export interface ServiceCatalogueConfig {
  readonly variant: ServiceCatalogueVariant;
  readonly masterKey: string;
  readonly title: string;
  readonly createLabel: string;
  readonly listPath: string;
  readonly stepIndex: number;
  readonly searchPlaceholder: string;
}

export interface ServiceCatalogueRow {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly status: ServiceCatalogueStatus;
  readonly description: string;
  readonly scopeLevel: string;
  readonly businessUnit: string;
  readonly brand: string;
  readonly region: string;
  readonly updatedAt: string;
  readonly displayName?: string;
  readonly ownerDepartment?: string;
  readonly ownerRole?: string;
  readonly serviceDomain?: string;
  readonly serviceFamily?: string;
  readonly rateType?: string;
  readonly standardRate?: string;
  readonly unitOfMeasure?: string;
}

export const SERVICE_CATALOGUE_CONFIG: Record<ServiceCatalogueVariant, ServiceCatalogueConfig> = {
  domain: {
    variant: 'domain',
    masterKey: 'service-domain',
    title: 'Service Domain',
    createLabel: '+ New Service Domain',
    listPath: '/admin/master/service-domain',
    stepIndex: 0,
    searchPlaceholder: 'Search by domain code, domain name, owner, or region...',
  },
  family: {
    variant: 'family',
    masterKey: 'service-family',
    title: 'Service Family',
    createLabel: '+ New Service Family',
    listPath: '/admin/master/service-family',
    stepIndex: 1,
    searchPlaceholder: 'Search by family code, family name, service domain, or region...',
  },
  labour: {
    variant: 'labour',
    masterKey: 'labour-master',
    title: 'Labour Master',
    createLabel: '+ New Labour Master',
    listPath: '/admin/master/labour-master',
    stepIndex: 3,
    searchPlaceholder: 'Search by labour code, activity name, service family, or rate type...',
  },
};

export const SERVICE_CATALOGUE_ROWS: Record<ServiceCatalogueVariant, ServiceCatalogueRow[]> = {
  domain: [
    {
      id: 'SD-001',
      code: 'AFS',
      name: 'After Sales Service',
      displayName: 'After Sales Service',
      description: 'Top-level service domain for workshop and scheduled service operations.',
      scopeLevel: 'Global',
      businessUnit: 'Passenger Vehicles',
      brand: 'Tata Motors',
      region: 'West Region',
      ownerDepartment: 'After Sales Operations',
      ownerRole: 'Regional Service Manager',
      status: 'Active',
      updatedAt: '2026-04-12',
    },
    {
      id: 'SD-002',
      code: 'BPC',
      name: 'Body & Paint / Collision',
      displayName: 'Body & Paint',
      description: 'Collision and paint operations for accident and cosmetic repair jobs.',
      scopeLevel: 'Regional',
      businessUnit: 'Commercial Vehicles',
      brand: 'Tata Commercial',
      region: 'North Region',
      ownerDepartment: 'Workshop Operations',
      ownerRole: 'Workshop Manager',
      status: 'Draft',
      updatedAt: '2026-05-06',
    },
  ],
  family: [
    {
      id: 'SF-001',
      code: 'PM',
      name: 'Periodic Maintenance',
      serviceDomain: 'After Sales Service',
      description: 'Planned periodic maintenance services based on mileage and schedule.',
      scopeLevel: 'Global',
      businessUnit: 'Passenger Vehicles',
      brand: 'Tata Motors',
      region: 'West Region',
      status: 'Active',
      updatedAt: '2026-04-18',
    },
    {
      id: 'SF-002',
      code: 'RSA-EMR',
      name: 'Emergency Support',
      serviceDomain: 'Roadside Assistance',
      description: 'Breakdown and towing service families for roadside support teams.',
      scopeLevel: 'Regional',
      businessUnit: 'EV Division',
      brand: 'Tata EV',
      region: 'South Region',
      status: 'Draft',
      updatedAt: '2026-05-02',
    },
  ],
  labour: [
    {
      id: 'LM-001',
      code: 'ACT-LAB-087',
      name: 'Cylinder Head Removal & Fitment',
      serviceDomain: 'After Sales Service',
      serviceFamily: 'Periodic Maintenance',
      description: 'Standard labour line for engine head removal and refit operations.',
      scopeLevel: 'Global',
      businessUnit: 'Passenger Vehicles',
      brand: 'Tata Motors',
      region: 'West Region',
      rateType: 'Flat Rate',
      standardRate: '2450',
      unitOfMeasure: 'Hour',
      status: 'Active',
      updatedAt: '2026-04-26',
    },
    {
      id: 'LM-002',
      code: 'ACT-LAB-143',
      name: 'Battery Health Inspection',
      serviceDomain: 'Roadside Assistance',
      serviceFamily: 'Emergency Support',
      description: 'Quick roadside electrical inspection and battery load test activity.',
      scopeLevel: 'Dealer',
      businessUnit: 'EV Division',
      brand: 'Tata EV',
      region: 'South Region',
      rateType: 'Hourly',
      standardRate: '950',
      unitOfMeasure: 'Hour',
      status: 'Draft',
      updatedAt: '2026-05-11',
    },
  ],
};

export const SERVICE_CATALOGUE_STATUS_OPTIONS: ServiceCatalogueStatus[] = ['Draft', 'Active', 'Inactive'];

export const SERVICE_CATALOGUE_BUSINESS_UNIT_OPTIONS = [
  'Passenger Vehicles',
  'Commercial Vehicles',
  'Two-Wheeler',
  'EV Division',
] as const;

export const SERVICE_CATALOGUE_REGION_OPTIONS = [
  'North Region',
  'South Region',
  'East Region',
  'West Region',
  'Dealer Cluster A',
  'Dealer Cluster B',
] as const;

export function getServiceCatalogueConfig(variant: ServiceCatalogueVariant): ServiceCatalogueConfig {
  return SERVICE_CATALOGUE_CONFIG[variant];
}
