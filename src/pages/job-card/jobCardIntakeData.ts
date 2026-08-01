export const JOB_CARD_INTAKE_DRAFT_STORAGE_KEY = 'job-card-intake-draft:v1';

export type JobCardIntakeSource = 'search' | 'appointment';

export interface JobCardIntakeServiceHistory {
  date: string;
  odometer: number;
  reason: string;
  status: 'Closed' | 'Open';
}

export type JobCardComplaintGroupId =
  | 'suggested'
  | 'air-conditioning'
  | 'brakes'
  | 'engine-cooling'
  | 'electrical'
  | 'steering-suspension'
  | 'body-interior'
  | 'noise-vibration';

export interface JobCardComplaintGroup {
  id: JobCardComplaintGroupId;
  label: string;
  helper?: string;
}

export interface JobCardComplaintItem {
  id: string;
  groupId: JobCardComplaintGroupId;
  name: string;
  helper: string;
  tags?: string[];
}

export interface JobCardCustomerVoiceItem {
  id: string;
  groupId: JobCardComplaintGroupId;
  groupLabel: string;
  name: string;
  helper: string;
  remark?: string;
  tags?: string[];
}

export interface JobCardIntakeVehicle {
  id: string;
  registrationNumber: string;
  engineNumber: string;
  vin: string;
  mobileNumber: string;
  customerName: string;
  customerCode: string;
  customerType: string;
  fleetSize: number;
  overdueAmount?: string;
  model: string;
  variant: string;
  color: string;
  year: string;
  fuel: string;
  odometer: number;
  serviceBay?: string;
  serviceAdvisor?: string;
  lastServiceDate: string;
  appointmentTime?: string;
  warrantyStatus: string;
  amcStatus?: string;
  creditStatus?: string;
  openJobCardNumber?: string;
  openJobCardId?: string;
  openedAt?: string;
  openedBy?: string;
  insuranceValidTill?: string;
  history: JobCardIntakeServiceHistory[];
}

export interface JobCardIntakeDraft {
  source: JobCardIntakeSource;
  appointmentId?: string;
  vehicleId: string;
  registrationNumber: string;
  engineNumber: string;
  vin: string;
  mobileNumber: string;
  customerName: string;
  customerCode: string;
  model: string;
  odometer: number;
  serviceType: string;
  concern: string;
  customerVoiceItems?: JobCardCustomerVoiceItem[];
  customerVoiceText?: string;
  clusterUnreadable?: boolean;
  lastRecordedOdometer?: number;
  lastRecordedDate?: string;
  appointmentTime?: string;
  serviceBay?: string;
  serviceAdvisor?: string;
}


export type JobCardAppointmentGroup = 'overdue' | 'next-hour' | 'later-today';
export type JobCardAppointmentArrivalStatus = 'not-arrived' | 'waiting' | 'arrived';
export type JobCardAppointmentCueTone = 'danger' | 'warning' | 'info' | 'success' | 'muted';

export interface JobCardTodayAppointment {
  id: string;
  group: JobCardAppointmentGroup;
  time: string;
  vehicle: JobCardIntakeVehicle;
  serviceType: string;
  cueLabel: string;
  cueTone?: JobCardAppointmentCueTone;
  arrivalStatus: JobCardAppointmentArrivalStatus;
  isMine?: boolean;
}
export const jobCardIntakeVehicles: JobCardIntakeVehicle[] = [
  {
    id: 'vehicle-yodha-1014',
    registrationNumber: 'MH 04 CG 1014',
    engineNumber: 'FLT7001822',
    vin: 'MAT9100274NFL10002',
    mobileNumber: '9820011122',
    customerName: 'Sharma Logistics Pvt Ltd',
    customerCode: '9820011122',
    customerType: 'Corporate',
    fleetSize: 62,
    overdueAmount: 'Rs 2,84,500 overdue',
    model: 'Yodha 1700 4x2',
    variant: 'signal yellow',
    color: 'signal yellow',
    year: '2022',
    fuel: 'diesel',
    odometer: 43460,
    serviceBay: 'Bay 3',
    serviceAdvisor: 'R. Naik',
    lastServiceDate: '2026-07-11',
    appointmentTime: '12:00 pm',
    warrantyStatus: 'Out of warranty as of 28 Jul 2026',
    amcStatus: 'AMC active',
    creditStatus: 'Credit hold',
    insuranceValidTill: '2027-04-12',
    history: [
      { date: '2026-07-11', odometer: 43460, reason: 'Periodic maintenance', status: 'Closed' },
      { date: '2025-08-14', odometer: 35637, reason: 'Running repair - AC cooling', status: 'Closed' },
      { date: '2025-02-03', odometer: 26511, reason: 'Periodic maintenance', status: 'Closed' },
    ],
  },
  {
    id: 'vehicle-ace-1028',
    registrationNumber: 'MH 04 EF 1028',
    engineNumber: 'BS6CNG9981',
    vin: 'MAT53321CNH004390',
    mobileNumber: '9820011122',
    customerName: 'Sharma Logistics Pvt Ltd',
    customerCode: '9820011122',
    customerType: 'Corporate',
    fleetSize: 62,
    overdueAmount: 'Rs 2,84,500 overdue',
    model: 'Ace Gold BS6 CNG',
    variant: 'grey',
    color: 'grey',
    year: '2024',
    fuel: 'diesel',
    odometer: 118400,
    serviceBay: 'Bay 8',
    serviceAdvisor: 'R. Naik',
    lastServiceDate: '2026-07-29',
    warrantyStatus: 'Job card open',
    openJobCardNumber: 'JC-26-04390',
    openJobCardId: 'jc-1003',
    openedAt: '2026-07-29T11:05:00',
    openedBy: 'R. Naik',
    insuranceValidTill: '2027-01-22',
    history: [
      { date: '2026-07-29', odometer: 118400, reason: 'Running repair', status: 'Open' },
      { date: '2026-03-08', odometer: 103910, reason: 'CNG kit inspection', status: 'Closed' },
      { date: '2025-11-18', odometer: 82630, reason: 'Periodic maintenance', status: 'Closed' },
    ],
  },
  {
    id: 'vehicle-intra-1427',
    registrationNumber: 'MH 04 BB 1427',
    engineNumber: 'HDR1427990',
    vin: 'MAT5330090NBB1427',
    mobileNumber: '9820011122',
    customerName: 'Sharma Logistics Pvt Ltd',
    customerCode: '9820011122',
    customerType: 'Corporate',
    fleetSize: 62,
    overdueAmount: 'Rs 2,84,500 overdue',
    model: 'Intra V30 Hi-Deck',
    variant: 'white',
    color: 'white',
    year: '2021',
    fuel: 'diesel',
    odometer: 145530,
    serviceBay: 'Bay 2',
    serviceAdvisor: 'M. Pawar',
    lastServiceDate: '2026-05-21',
    warrantyStatus: 'Out of warranty as of 28 Jul 2026',
    amcStatus: 'AMC active',
    creditStatus: 'Credit hold',
    insuranceValidTill: '2026-12-20',
    history: [
      { date: '2026-05-21', odometer: 145530, reason: 'Periodic maintenance', status: 'Closed' },
      { date: '2025-12-02', odometer: 128880, reason: 'Brake overhaul', status: 'Closed' },
      { date: '2025-06-19', odometer: 109245, reason: 'Running repair - suspension', status: 'Closed' },
    ],
  },
  {
    id: 'vehicle-harrier-5678',
    registrationNumber: 'MH 14 CD 5678',
    engineNumber: 'KRYOTEC5678',
    vin: 'MAT6310124RCD5678',
    mobileNumber: '9876543210',
    customerName: 'Rajesh Kumar',
    customerCode: '9876543210',
    customerType: 'Retail',
    fleetSize: 1,
    model: 'Harrier XZ+',
    variant: 'oberon black',
    color: 'black',
    year: '2023',
    fuel: 'diesel',
    odometer: 61240,
    serviceBay: 'Bay 3',
    serviceAdvisor: 'M. Pawar',
    lastServiceDate: '2026-07-30',
    appointmentTime: '4:20 pm',
    warrantyStatus: 'Warranty active',
    amcStatus: 'AMC active',
    insuranceValidTill: '2027-08-19',
    history: [
      { date: '2026-07-30', odometer: 61240, reason: 'Running repair', status: 'Closed' },
      { date: '2026-01-04', odometer: 52600, reason: 'Periodic maintenance', status: 'Closed' },
    ],
  },
];
interface AppointmentVehicleSeed {
  id: string;
  registrationNumber: string;
  model: string;
  color: string;
  year: string;
  fuel: string;
  odometer: number;
  customerName: string;
  mobileNumber: string;
  lastServiceDate: string;
  serviceBay?: string;
  serviceAdvisor?: string;
  warrantyStatus?: string;
  amcStatus?: string;
  creditStatus?: string;
  openJobCardNumber?: string;
  openJobCardId?: string;
}

interface AppointmentSeed {
  id: string;
  group: JobCardAppointmentGroup;
  time: string;
  serviceType: string;
  cueLabel: string;
  cueTone?: JobCardAppointmentCueTone;
  arrivalStatus: JobCardAppointmentArrivalStatus;
  isMine?: boolean;
  vehicleId?: string;
  vehicle?: AppointmentVehicleSeed;
}

function makeAppointmentVehicleSeed(
  id: string,
  registrationNumber: string,
  model: string,
  color: string,
  year: string,
  fuel: string,
  odometer: number,
  customerName: string,
  mobileNumber: string,
  lastServiceDate: string,
  serviceBay: string,
  serviceAdvisor: string,
  overrides: Partial<AppointmentVehicleSeed> = {}
): AppointmentVehicleSeed {
  return {
    id,
    registrationNumber,
    model,
    color,
    year,
    fuel,
    odometer,
    customerName,
    mobileNumber,
    lastServiceDate,
    serviceBay,
    serviceAdvisor,
    ...overrides,
  };
}

function createAppointmentVehicle(seed: AppointmentVehicleSeed, appointmentTime: string): JobCardIntakeVehicle {
  const compactRegistration = seed.registrationNumber.replace(/\s/g, '');

  return {
    id: `appointment-${seed.id}`,
    registrationNumber: seed.registrationNumber,
    engineNumber: `ENG${compactRegistration.slice(-8)}`,
    vin: `MAT${compactRegistration.padEnd(14, '0').slice(0, 14)}`,
    mobileNumber: seed.mobileNumber,
    customerName: seed.customerName,
    customerCode: seed.mobileNumber,
    customerType: 'Retail',
    fleetSize: 1,
    model: seed.model,
    variant: seed.color,
    color: seed.color,
    year: seed.year,
    fuel: seed.fuel,
    odometer: seed.odometer,
    serviceBay: seed.serviceBay,
    serviceAdvisor: seed.serviceAdvisor,
    lastServiceDate: seed.lastServiceDate,
    appointmentTime,
    warrantyStatus: seed.warrantyStatus ?? 'Warranty active',
    amcStatus: seed.amcStatus,
    creditStatus: seed.creditStatus,
    openJobCardNumber: seed.openJobCardNumber,
    openJobCardId: seed.openJobCardId,
    insuranceValidTill: '2027-04-30',
    history: [
      {
        date: seed.lastServiceDate,
        odometer: seed.odometer,
        reason: seed.openJobCardId ? 'Running repair' : 'Service visit',
        status: seed.openJobCardId ? 'Open' : 'Closed',
      },
    ],
  };
}

function resolveAppointmentVehicle(seed: AppointmentSeed): JobCardIntakeVehicle {
  if (seed.vehicleId) {
    const existingVehicle = jobCardIntakeVehicles.find((vehicle) => vehicle.id === seed.vehicleId);

    if (existingVehicle) {
      return {
        ...existingVehicle,
        appointmentTime: seed.time,
      };
    }
  }

  if (!seed.vehicle) {
    throw new Error(`Appointment ${seed.id} is missing vehicle details.`);
  }

  return createAppointmentVehicle(seed.vehicle, seed.time);
}

const appointmentSeeds: AppointmentSeed[] = [
  {
    id: 'appt-tigor-7788',
    group: 'overdue',
    time: '08:30',
    serviceType: 'General service',
    cueLabel: '+3h 15m',
    cueTone: 'danger',
    arrivalStatus: 'not-arrived',
    isMine: true,
    vehicle: makeAppointmentVehicleSeed('tigor-7788', 'MH 12 KL 7788', 'Tigor XZ', 'white', '2022', 'petrol', 38420, 'Amit Patil', '9876501001', '2026-03-18', 'Bay 1', 'R. Naik'),
  },
  {
    id: 'appt-harrier-5678',
    group: 'overdue',
    time: '09:00',
    serviceType: 'Running repair',
    cueLabel: 'waiting 22m',
    cueTone: 'warning',
    arrivalStatus: 'waiting',
    vehicleId: 'vehicle-harrier-5678',
  },
  {
    id: 'appt-nexon-1234',
    group: 'overdue',
    time: '10:30',
    serviceType: 'Free service',
    cueLabel: '+1h 15m',
    cueTone: 'danger',
    arrivalStatus: 'not-arrived',
    isMine: true,
    vehicle: makeAppointmentVehicleSeed('nexon-1234', 'MH 12 AB 1234', 'Nexon EV Max XZ+ Lux', 'pristine white', '2023', 'electric', 24150, 'Rajesh Kumar', '9876543221', '2026-03-12', 'Bay 5', 'R. Naik', { amcStatus: 'AMC active' }),
  },
  {
    id: 'appt-yodha-1014',
    group: 'next-hour',
    time: '12:00',
    serviceType: 'Running repair',
    cueLabel: 'running repair',
    cueTone: 'muted',
    arrivalStatus: 'not-arrived',
    isMine: true,
    vehicleId: 'vehicle-yodha-1014',
  },
  {
    id: 'appt-tiago-4400',
    group: 'next-hour',
    time: '12:15',
    serviceType: 'General service',
    cueLabel: 'general service',
    cueTone: 'muted',
    arrivalStatus: 'not-arrived',
    vehicle: makeAppointmentVehicleSeed('tiago-4400', 'MH 15 PQ 4400', 'Tiago XZ', 'red', '2024', 'petrol', 9800, 'Pooja Deshmukh', '9876501002', '2026-04-10', 'Bay 4', 'M. Pawar'),
  },
  {
    id: 'appt-punch-3456',
    group: 'next-hour',
    time: '12:30',
    serviceType: 'Recall campaign',
    cueLabel: 'recall',
    cueTone: 'danger',
    arrivalStatus: 'not-arrived',
    isMine: true,
    vehicle: makeAppointmentVehicleSeed('punch-3456', 'MH 01 ZZ 3456', 'Punch', 'blue', '2024', 'petrol', 9800, 'Neha Shah', '9876501003', '2026-01-28', 'Bay 2', 'R. Naik'),
  },
  {
    id: 'appt-altroz-9234',
    group: 'next-hour',
    time: '12:45',
    serviceType: 'Accident / insurance',
    cueLabel: 'insurance',
    cueTone: 'info',
    arrivalStatus: 'not-arrived',
    vehicle: makeAppointmentVehicleSeed('altroz-9234', 'MH 02 AX 9234', 'Altroz XZ', 'grey', '2021', 'diesel', 57220, 'Kiran Motors Fleet', '9876501004', '2026-02-16', 'Bay 6', 'M. Pawar'),
  },
  {
    id: 'appt-safari-8120',
    group: 'later-today',
    time: '13:15',
    serviceType: 'General service',
    cueLabel: 'general service',
    cueTone: 'muted',
    arrivalStatus: 'not-arrived',
    vehicle: makeAppointmentVehicleSeed('safari-8120', 'MH 03 CD 8120', 'Safari Adventure', 'orcus white', '2022', 'diesel', 68200, 'Sandeep Jadhav', '9876501005', '2026-05-09', 'Bay 7', 'R. Naik'),
  },
  {
    id: 'appt-tigor-6677',
    group: 'later-today',
    time: '13:30',
    serviceType: 'Free service',
    cueLabel: 'free service',
    cueTone: 'success',
    arrivalStatus: 'not-arrived',
    vehicle: makeAppointmentVehicleSeed('tigor-6677', 'MH 05 EX 6677', 'Tigor EV', 'teal blue', '2025', 'electric', 5200, 'GreenCab Mobility', '9876501006', '2026-06-12', 'Bay 1', 'M. Pawar', { amcStatus: 'AMC active' }),
  },
  {
    id: 'appt-nexon-8899',
    group: 'later-today',
    time: '14:00',
    serviceType: 'Running repair',
    cueLabel: 'AC noise',
    cueTone: 'warning',
    arrivalStatus: 'not-arrived',
    isMine: true,
    vehicle: makeAppointmentVehicleSeed('nexon-8899', 'MH 06 FP 8899', 'Nexon XZA+', 'foliage green', '2022', 'petrol', 42780, 'Maya Iyer', '9876501007', '2026-04-22', 'Bay 3', 'R. Naik'),
  },
  {
    id: 'appt-curvv-4412',
    group: 'later-today',
    time: '14:20',
    serviceType: 'Pre-delivery inspection',
    cueLabel: 'PDI',
    cueTone: 'info',
    arrivalStatus: 'not-arrived',
    vehicle: makeAppointmentVehicleSeed('curvv-4412', 'MH 07 GA 4412', 'Curvv EV', 'virtual sunrise', '2026', 'electric', 42, 'Dealer Stock', '9876501008', '2026-07-30', 'Bay 8', 'M. Pawar', { warrantyStatus: 'In warranty' }),
  },
  {
    id: 'appt-ace-1028',
    group: 'later-today',
    time: '14:45',
    serviceType: 'Running repair',
    cueLabel: 'open job card',
    cueTone: 'warning',
    arrivalStatus: 'arrived',
    vehicleId: 'vehicle-ace-1028',
  },
  {
    id: 'appt-tiago-7741',
    group: 'later-today',
    time: '15:00',
    serviceType: 'General service',
    cueLabel: 'general service',
    cueTone: 'muted',
    arrivalStatus: 'not-arrived',
    vehicle: makeAppointmentVehicleSeed('tiago-7741', 'MH 08 HB 7741', 'Tiago NRG', 'foresta green', '2023', 'petrol', 21240, 'Omkar Joshi', '9876501009', '2026-03-02', 'Bay 5', 'R. Naik'),
  },
  {
    id: 'appt-harrier-2188',
    group: 'later-today',
    time: '15:20',
    serviceType: 'Accident / insurance',
    cueLabel: 'claim',
    cueTone: 'info',
    arrivalStatus: 'not-arrived',
    vehicle: makeAppointmentVehicleSeed('harrier-2188', 'MH 09 JD 2188', 'Harrier Fearless', 'sunlit yellow', '2025', 'diesel', 18400, 'Prime Rentals', '9876501010', '2026-06-03', 'Bay 6', 'M. Pawar'),
  },
  {
    id: 'appt-intra-1427',
    group: 'later-today',
    time: '15:45',
    serviceType: 'General service',
    cueLabel: 'fleet',
    cueTone: 'muted',
    arrivalStatus: 'not-arrived',
    vehicleId: 'vehicle-intra-1427',
  },
  {
    id: 'appt-punch-5610',
    group: 'later-today',
    time: '16:00',
    serviceType: 'Recall campaign',
    cueLabel: 'recall',
    cueTone: 'danger',
    arrivalStatus: 'not-arrived',
    isMine: true,
    vehicle: makeAppointmentVehicleSeed('punch-5610', 'MH 10 KS 5610', 'Punch EV', 'empowered oxide', '2025', 'electric', 8600, 'Anaya Rao', '9876501011', '2026-05-18', 'Bay 4', 'R. Naik'),
  },
  {
    id: 'appt-nexon-7032',
    group: 'later-today',
    time: '16:15',
    serviceType: 'Free service',
    cueLabel: 'free service',
    cueTone: 'success',
    arrivalStatus: 'not-arrived',
    vehicle: makeAppointmentVehicleSeed('nexon-7032', 'MH 11 LM 7032', 'Nexon Smart+', 'daytona grey', '2026', 'petrol', 3100, 'Vikram S', '9876501012', '2026-07-02', 'Bay 2', 'M. Pawar'),
  },
  {
    id: 'appt-safari-3020',
    group: 'later-today',
    time: '16:40',
    serviceType: 'Running repair',
    cueLabel: 'brakes',
    cueTone: 'warning',
    arrivalStatus: 'not-arrived',
    vehicle: makeAppointmentVehicleSeed('safari-3020', 'MH 13 NN 3020', 'Safari Accomplished', 'cosmic gold', '2024', 'diesel', 36100, 'Nikhil Verma', '9876501013', '2026-05-25', 'Bay 7', 'R. Naik'),
  },
  {
    id: 'appt-altroz-6501',
    group: 'later-today',
    time: '17:00',
    serviceType: 'General service',
    cueLabel: 'general service',
    cueTone: 'muted',
    arrivalStatus: 'not-arrived',
    vehicle: makeAppointmentVehicleSeed('altroz-6501', 'MH 16 RT 6501', 'Altroz Racer', 'atomic orange', '2024', 'petrol', 17520, 'Sonal Mehta', '9876501014', '2026-04-06', 'Bay 1', 'M. Pawar'),
  },
  {
    id: 'appt-tigor-4108',
    group: 'later-today',
    time: '17:20',
    serviceType: 'General service',
    cueLabel: 'general service',
    cueTone: 'muted',
    arrivalStatus: 'not-arrived',
    isMine: true,
    vehicle: makeAppointmentVehicleSeed('tigor-4108', 'MH 17 UV 4108', 'Tigor XM', 'magnetic red', '2020', 'petrol', 74200, 'Ajay Mistry', '9876501015', '2026-02-27', 'Bay 8', 'R. Naik', { warrantyStatus: 'Out of warranty as of 28 Jul 2026' }),
  },
  {
    id: 'appt-nexon-2220',
    group: 'later-today',
    time: '17:45',
    serviceType: 'Accident / insurance',
    cueLabel: 'survey',
    cueTone: 'info',
    arrivalStatus: 'not-arrived',
    vehicle: makeAppointmentVehicleSeed('nexon-2220', 'MH 18 WX 2220', 'Nexon Creative', 'flame red', '2023', 'diesel', 29340, 'Shield Insurance Desk', '9876501016', '2026-05-05', 'Bay 5', 'M. Pawar'),
  },
  {
    id: 'appt-punch-7144',
    group: 'later-today',
    time: '18:00',
    serviceType: 'Free service',
    cueLabel: 'free service',
    cueTone: 'success',
    arrivalStatus: 'not-arrived',
    vehicle: makeAppointmentVehicleSeed('punch-7144', 'MH 19 YA 7144', 'Punch Adventure', 'tropical mist', '2026', 'petrol', 2400, 'Rohan Kapoor', '9876501017', '2026-07-12', 'Bay 3', 'R. Naik'),
  },
  {
    id: 'appt-tiago-3301',
    group: 'later-today',
    time: '18:20',
    serviceType: 'Running repair',
    cueLabel: 'noise',
    cueTone: 'warning',
    arrivalStatus: 'not-arrived',
    vehicle: makeAppointmentVehicleSeed('tiago-3301', 'MH 20 ZB 3301', 'Tiago XT', 'arizona blue', '2022', 'cng', 51880, 'CityLine Cabs', '9876501018', '2026-04-28', 'Bay 6', 'M. Pawar'),
  },
  {
    id: 'appt-curvv-9730',
    group: 'later-today',
    time: '18:40',
    serviceType: 'Pre-delivery inspection',
    cueLabel: 'PDI',
    cueTone: 'info',
    arrivalStatus: 'not-arrived',
    vehicle: makeAppointmentVehicleSeed('curvv-9730', 'MH 21 CC 9730', 'Curvv Creative', 'opera blue', '2026', 'diesel', 35, 'Dealer Stock', '9876501019', '2026-07-31', 'Bay 2', 'R. Naik'),
  },
  {
    id: 'appt-harrier-6804',
    group: 'later-today',
    time: '19:00',
    serviceType: 'General service',
    cueLabel: 'general service',
    cueTone: 'muted',
    arrivalStatus: 'not-arrived',
    vehicle: makeAppointmentVehicleSeed('harrier-6804', 'MH 22 DE 6804', 'Harrier Pure+', 'ash grey', '2023', 'diesel', 46800, 'Ramesh Kulkarni', '9876501020', '2026-03-15', 'Bay 8', 'M. Pawar'),
  },
  {
    id: 'appt-safari-5088',
    group: 'later-today',
    time: '19:20',
    serviceType: 'Running repair',
    cueLabel: 'pickup',
    cueTone: 'warning',
    arrivalStatus: 'not-arrived',
    isMine: true,
    vehicle: makeAppointmentVehicleSeed('safari-5088', 'MH 23 FG 5088', 'Safari Dark', 'oberon black', '2024', 'diesel', 30940, 'Westside Travels', '9876501021', '2026-06-01', 'Bay 4', 'R. Naik'),
  },
];

export const jobCardTodayAppointments: JobCardTodayAppointment[] = appointmentSeeds.map((seed) => ({
  id: seed.id,
  group: seed.group,
  time: seed.time,
  vehicle: resolveAppointmentVehicle(seed),
  serviceType: seed.serviceType,
  cueLabel: seed.cueLabel,
  cueTone: seed.cueTone,
  arrivalStatus: seed.arrivalStatus,
  isMine: seed.isMine,
}));

export const jobCardComplaintGroups: JobCardComplaintGroup[] = [
  { id: 'suggested', label: 'Suggested', helper: 'Most likely for this vehicle today' },
  { id: 'air-conditioning', label: 'Air conditioning' },
  { id: 'brakes', label: 'Brakes' },
  { id: 'engine-cooling', label: 'Engine and cooling' },
  { id: 'electrical', label: 'Electrical' },
  { id: 'steering-suspension', label: 'Steering and suspension' },
  { id: 'body-interior', label: 'Body and interior' },
  { id: 'noise-vibration', label: 'Noise and vibration' },
];

export const jobCardComplaintItems: JobCardComplaintItem[] = [
  {
    id: 'suggested-ac-cools-stops',
    groupId: 'suggested',
    name: 'Air conditioning cools, then stops after some time',
    helper: 'Reported 9 days ago on JC-26-03918',
    tags: ['Repeat'],
  },
  {
    id: 'suggested-brake-noise',
    groupId: 'suggested',
    name: 'Brake noise when braking',
    helper: 'Safety category - customer words are recommended',
    tags: ['Safety'],
  },
  {
    id: 'suggested-periodic-maintenance',
    groupId: 'suggested',
    name: 'Periodic maintenance due',
    helper: 'PMS 2 due at 30,000 km - 4,660 km away',
    tags: ['Due'],
  },
  {
    id: 'suggested-fuel-pump-recall',
    groupId: 'suggested',
    name: 'Recall - fuel pump relay inspection',
    helper: 'Campaign R-2026-014 open on this VIN',
    tags: ['Recall'],
  },
  { id: 'ac-not-cooling', groupId: 'air-conditioning', name: 'AC not cooling', helper: 'Air is warm or cooling is weak' },
  { id: 'ac-cools-stops', groupId: 'air-conditioning', name: 'AC cools, then stops', helper: 'Cooling drops after driving for some time' },
  { id: 'ac-blower-noise', groupId: 'air-conditioning', name: 'Blower noise', helper: 'Noise from vents or blower motor' },
  { id: 'ac-water-drip', groupId: 'air-conditioning', name: 'Water dripping inside cabin', helper: 'Water seen near dashboard or floor area' },
  { id: 'brake-noise', groupId: 'brakes', name: 'Noise when braking', helper: 'Squeal, grinding, or rubbing noise' },
  { id: 'brake-pedal-hard', groupId: 'brakes', name: 'Brake pedal hard', helper: 'Pedal effort is high or response is delayed' },
  { id: 'brake-pull', groupId: 'brakes', name: 'Vehicle pulls while braking', helper: 'Vehicle moves left or right during braking' },
  { id: 'brake-warning-lamp', groupId: 'brakes', name: 'Brake warning lamp', helper: 'Warning indicator appears on cluster' },
  { id: 'engine-overheating', groupId: 'engine-cooling', name: 'Engine overheating', helper: 'Temperature warning or steam observed' },
  { id: 'coolant-leakage', groupId: 'engine-cooling', name: 'Coolant leakage', helper: 'Coolant level drops or leak marks seen' },
  { id: 'engine-misfire', groupId: 'engine-cooling', name: 'Engine misfire', helper: 'Rough running, jerks, or unstable idle' },
  { id: 'low-pickup', groupId: 'engine-cooling', name: 'Low pickup', helper: 'Vehicle lacks power under acceleration' },
  { id: 'battery-drain', groupId: 'electrical', name: 'Battery drains overnight', helper: 'Vehicle does not start after standing' },
  { id: 'headlamp-not-working', groupId: 'electrical', name: 'Headlamp not working', helper: 'One or more lamps are inoperative' },
  { id: 'infotainment-restarts', groupId: 'electrical', name: 'Infotainment restarts', helper: 'Screen turns off, reboots, or freezes' },
  { id: 'cluster-warning-lamp', groupId: 'electrical', name: 'Warning lamp on cluster', helper: 'Customer reports warning light on dashboard' },
  { id: 'steering-vibration', groupId: 'steering-suspension', name: 'Steering vibration', helper: 'Vibration felt through steering wheel' },
  { id: 'vehicle-pulls', groupId: 'steering-suspension', name: 'Vehicle pulls left or right', helper: 'Needs correction to keep straight line' },
  { id: 'suspension-noise', groupId: 'steering-suspension', name: 'Suspension noise on bumps', helper: 'Knock, thud, or rattle over bad roads' },
  { id: 'uneven-tyre-wear', groupId: 'steering-suspension', name: 'Uneven tyre wear', helper: 'Tyre wear pattern is abnormal' },
  { id: 'door-rattle', groupId: 'body-interior', name: 'Door rattle', helper: 'Noise from door pad or latch area' },
  { id: 'water-leakage', groupId: 'body-interior', name: 'Water leakage', helper: 'Water entering cabin or boot' },
  { id: 'seat-adjustment', groupId: 'body-interior', name: 'Seat adjustment issue', helper: 'Seat movement or locking problem' },
  { id: 'dashboard-noise', groupId: 'body-interior', name: 'Dashboard noise', helper: 'Rattle or squeak from dashboard area' },
  { id: 'idle-vibration', groupId: 'noise-vibration', name: 'Cabin vibration at idle', helper: 'Vibration felt when vehicle is stationary' },
  { id: 'humming-at-speed', groupId: 'noise-vibration', name: 'Humming noise at speed', helper: 'Noise increases with vehicle speed' },
  { id: 'rear-rattle', groupId: 'noise-vibration', name: 'Rattle from rear', helper: 'Noise from rear cabin, tailgate, or suspension' },
  { id: 'tyre-noise', groupId: 'noise-vibration', name: 'Tyre noise', helper: 'Road noise or tyre roar reported' },
];