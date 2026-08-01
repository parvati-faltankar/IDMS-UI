import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronRight, Search, X } from 'lucide-react';
import { Input, Textarea } from '../../components/common/FormControls';
import { useDialogFocusTrap } from '../../hooks/useDialogFocusTrap';
import { cn } from '../../utils/classNames';
import { formatDate } from '../../utils/dateFormat';
import {
  jobCardComplaintGroups,
  jobCardComplaintItems,
  jobCardIntakeVehicles,
  jobCardTodayAppointments,
  type JobCardComplaintGroupId,
  type JobCardComplaintItem,
  type JobCardCustomerVoiceItem,
  type JobCardIntakeDraft,
  type JobCardIntakeServiceHistory,
  type JobCardIntakeVehicle,
  type JobCardTodayAppointment,
} from './jobCardIntakeData';

interface JobCardNewIntakeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: (draft: JobCardIntakeDraft) => void;
  onOpenExistingJobCard: (documentId: string) => void;
}

type IntakeStep = 1 | 2 | 3;
type IntakeTab = 'search' | 'appointments';
type SearchMatchKind = 'registration' | 'engine' | 'vin' | 'mobile';
type ServiceReadingPolicy = 'required' | 'optional' | 'not-applicable';
type AppointmentFilter = 'not-arrived' | 'mine';

const appointmentGroupOrder: Array<{ id: JobCardTodayAppointment['group']; label: string }> = [
  { id: 'overdue', label: 'Overdue' },
  { id: 'next-hour', label: 'Next hour' },
  { id: 'later-today', label: 'Later today' },
];

const appointmentFilterLabels: Record<AppointmentFilter, string> = {
  'not-arrived': 'Not arrived',
  mine: 'Mine',
};

interface ServiceTypeOption {
  value: string;
  title: string;
  helper: string;
  readingPolicy: ServiceReadingPolicy;
  disabledReason?: string;
  isSuggested?: (vehicle: JobCardIntakeVehicle) => boolean;
  isDisabled?: (vehicle: JobCardIntakeVehicle) => boolean;
}

const serviceTypeOptions: ServiceTypeOption[] = [
  {
    value: 'General service',
    title: 'General service',
    helper: '15,000 km / 12 months',
    readingPolicy: 'required',
  },
  {
    value: 'Free service',
    title: 'Free service',
    helper: 'Coupon valid to 30,000 km or Mar 2027',
    readingPolicy: 'required',
    isSuggested: (vehicle) => Boolean(vehicle.appointmentTime),
  },
  {
    value: 'Running repair',
    title: 'Running repair',
    helper: 'Diagnosis before estimate',
    readingPolicy: 'required',
  },
  {
    value: 'Accident / insurance',
    title: 'Accident / insurance',
    helper: 'Surveyor / claim approval',
    readingPolicy: 'optional',
  },
  {
    value: 'Recall campaign',
    title: 'Recall campaign',
    helper: 'No open campaign on this VIN',
    readingPolicy: 'optional',
  },
  {
    value: 'Pre-delivery inspection',
    title: 'Pre-delivery inspection',
    helper: 'Vehicle already has service history',
    readingPolicy: 'not-applicable',
    disabledReason: 'Vehicle already has service history.',
    isDisabled: (vehicle) => vehicle.history.length > 0,
  },
];

const readingPolicyLabels: Record<ServiceReadingPolicy, string> = {
  required: 'Reading required',
  optional: 'Reading optional',
  'not-applicable': 'Reading not applicable',
};

const odometerFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0,
});

function formatOdometerInput(value: string): string {
  const digits = value.replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  return odometerFormatter.format(Number(digits));
}

function parseOdometerInput(value: string): number | null {
  const digits = value.replace(/\D/g, '');

  if (!digits) {
    return null;
  }

  const parsed = Number(digits);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function getLatestRecordedReading(vehicle: JobCardIntakeVehicle): { odometer: number; date: string } {
  const latestHistoryItem = vehicle.history.reduce<JobCardIntakeServiceHistory | null>((latest, item) => {
    if (!latest || item.date > latest.date) {
      return item;
    }

    return latest;
  }, null);

  return latestHistoryItem
    ? { odometer: latestHistoryItem.odometer, date: latestHistoryItem.date }
    : { odometer: vehicle.odometer, date: vehicle.lastServiceDate };
}

function normalizeSearchValue(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function getSearchMatchKind(vehicle: JobCardIntakeVehicle, query: string): SearchMatchKind | null {
  const normalizedQuery = normalizeSearchValue(query);

  if (!normalizedQuery) {
    return null;
  }

  const searchableFields: Array<[SearchMatchKind, string]> = [
    ['registration', vehicle.registrationNumber],
    ['engine', vehicle.engineNumber],
    ['vin', vehicle.vin],
    ['mobile', vehicle.mobileNumber],
  ];

  return searchableFields.find(([, value]) => normalizeSearchValue(value).includes(normalizedQuery))?.[0] ?? null;
}


function getVehicleSummary(vehicle: JobCardIntakeVehicle): string {
  return [
    vehicle.model,
    vehicle.variant,
    vehicle.year,
    vehicle.fuel,
    `Last service ${formatDate(vehicle.lastServiceDate)}`,
    `${odometerFormatter.format(vehicle.odometer)} km`,
  ].join(' - ');
}

function getShortWarrantyLabel(warrantyStatus: string): string {
  const normalizedStatus = warrantyStatus.toLowerCase();

  if (normalizedStatus.includes('out of warranty')) {
    return 'No warranty';
  }

  if (normalizedStatus.includes('warranty active') || normalizedStatus.includes('in warranty')) {
    return 'In warranty';
  }

  return '';
}

function getGroupedVehicles(vehicles: JobCardIntakeVehicle[]) {
  return vehicles.reduce<Array<{ customerName: string; vehicles: JobCardIntakeVehicle[] }>>((groups, vehicle) => {
    const group = groups.find((item) => item.customerName === vehicle.customerName);

    if (group) {
      group.vehicles.push(vehicle);
      return groups;
    }

    groups.push({ customerName: vehicle.customerName, vehicles: [vehicle] });
    return groups;
  }, []);
}

function getComplaintSearchValue(complaint: JobCardComplaintItem, groupLabel: string): string {
  return normalizeSearchValue(`${complaint.name} ${complaint.helper} ${groupLabel} ${(complaint.tags ?? []).join(' ')}`);
}

const JobCardNewIntakeDialog: React.FC<JobCardNewIntakeDialogProps> = ({
  isOpen,
  onClose,
  onProceed,
  onOpenExistingJobCard,
}) => {
  const [activeStep, setActiveStep] = useState<IntakeStep>(1);
  const [activeTab, setActiveTab] = useState<IntakeTab>('search');
  const [searchTerm, setSearchTerm] = useState('');
  const [appointmentSearchTerm, setAppointmentSearchTerm] = useState('');
  const [activeAppointmentFilters, setActiveAppointmentFilters] = useState<AppointmentFilter[]>([]);
  const [isLaterAppointmentsExpanded, setIsLaterAppointmentsExpanded] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [expandedVehicleId, setExpandedVehicleId] = useState<string | null>(null);
  const [odometer, setOdometer] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [clusterUnreadable, setClusterUnreadable] = useState(false);
  const [complaintSearchTerm, setComplaintSearchTerm] = useState('');
  const [activeComplaintGroupId, setActiveComplaintGroupId] = useState<JobCardComplaintGroupId>('suggested');
  const [selectedComplaintIds, setSelectedComplaintIds] = useState<string[]>([]);
  const [complaintRemarks, setComplaintRemarks] = useState<Record<string, string>>({});
  const [editingComplaintId, setEditingComplaintId] = useState<string | null>(null);
  const [customerVoiceText, setCustomerVoiceText] = useState('');
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const titleId = 'job-card-intake-title';

  const selectedAppointment = useMemo(
    () => jobCardTodayAppointments.find((appointment) => appointment.id === selectedAppointmentId) ?? null,
    [selectedAppointmentId]
  );
  const selectedVehicle = useMemo(
    () => selectedAppointment?.vehicle ?? jobCardIntakeVehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? null,
    [selectedAppointment, selectedVehicleId]
  );
  const appointmentCount = jobCardTodayAppointments.length;
  const visibleVehicles = useMemo(() => {
    if (!searchTerm.trim()) {
      return [];
    }

    return jobCardIntakeVehicles.filter((vehicle) => Boolean(getSearchMatchKind(vehicle, searchTerm)));
  }, [searchTerm]);
  const groupedVehicles = useMemo(() => getGroupedVehicles(visibleVehicles), [visibleVehicles]);
  const appointmentFilterCounts = useMemo<Record<AppointmentFilter, number>>(
    () => ({
      'not-arrived': jobCardTodayAppointments.filter((appointment) => appointment.arrivalStatus === 'not-arrived').length,
      mine: jobCardTodayAppointments.filter((appointment) => Boolean(appointment.isMine)).length,
    }),
    []
  );
  const hasActiveAppointmentQuery = Boolean(appointmentSearchTerm.trim());
  const hasActiveAppointmentFilters = activeAppointmentFilters.length > 0;
  const filteredAppointments = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(appointmentSearchTerm);

    return jobCardTodayAppointments.filter((appointment) => {
      const vehicle = appointment.vehicle;
      const matchesSearch = normalizedQuery
        ? normalizeSearchValue(`${vehicle.registrationNumber} ${vehicle.model} ${vehicle.variant}`).includes(normalizedQuery)
        : true;
      const matchesNotArrived = activeAppointmentFilters.includes('not-arrived')
        ? appointment.arrivalStatus === 'not-arrived'
        : true;
      const matchesMine = activeAppointmentFilters.includes('mine') ? Boolean(appointment.isMine) : true;

      return matchesSearch && matchesNotArrived && matchesMine;
    });
  }, [activeAppointmentFilters, appointmentSearchTerm]);
  const appointmentGroups = useMemo(
    () =>
      appointmentGroupOrder
        .map((group) => ({
          ...group,
          appointments: filteredAppointments.filter((appointment) => appointment.group === group.id),
        }))
        .filter((group) => group.appointments.length > 0),
    [filteredAppointments]
  );
  const shouldCollapseLaterAppointments =
    !isLaterAppointmentsExpanded && !hasActiveAppointmentQuery && !hasActiveAppointmentFilters;
  const visibleAppointmentGroups = useMemo(
    () =>
      appointmentGroups.map((group) => {
        const isCollapsed = group.id === 'later-today' && shouldCollapseLaterAppointments;

        return {
          ...group,
          totalCount: group.appointments.length,
          appointments: isCollapsed ? [] : group.appointments,
          isCollapsed,
        };
      }),
    [appointmentGroups, shouldCollapseLaterAppointments]
  );
  const displayedAppointmentCount = visibleAppointmentGroups.reduce(
    (total, group) => total + group.appointments.length,
    0
  );
  const parsedOdometer = useMemo(() => parseOdometerInput(odometer), [odometer]);
  const lastRecordedReading = useMemo(
    () => (selectedVehicle ? getLatestRecordedReading(selectedVehicle) : null),
    [selectedVehicle]
  );
  const selectedServiceType = useMemo(
    () => serviceTypeOptions.find((option) => option.value === serviceType) ?? null,
    [serviceType]
  );
  const selectedServiceTypeDisabled = Boolean(
    selectedVehicle && selectedServiceType?.isDisabled?.(selectedVehicle)
  );
  const hasSuspectOdometer = Boolean(
    !clusterUnreadable &&
      parsedOdometer !== null &&
      lastRecordedReading &&
      parsedOdometer < lastRecordedReading.odometer
  );
  const selectedServiceNeedsReading = selectedServiceType?.readingPolicy === 'required';
  const hasReadingForService = !selectedServiceNeedsReading || clusterUnreadable || parsedOdometer !== null;
  const canContinueFromVehicle = Boolean(selectedVehicle && !selectedVehicle.openJobCardId);
  const canContinueFromReading = Boolean(
    selectedServiceType && !selectedServiceTypeDisabled && !hasSuspectOdometer && hasReadingForService
  );
  const readingFooterHint = !selectedServiceType
    ? 'Choose a job card type to continue.'
    : selectedServiceTypeDisabled
      ? selectedServiceType.disabledReason ?? 'This job card type is not available for the selected vehicle.'
      : hasSuspectOdometer
        ? 'Reading is lower than the last recorded value.'
        : selectedServiceNeedsReading && !clusterUnreadable && parsedOdometer === null
          ? 'Enter odometer or mark Cluster unreadable.'
          : 'Continue to customer voice.';
  const complaintGroupLabelById = useMemo(
    () =>
      jobCardComplaintGroups.reduce((labels, group) => {
        labels[group.id] = group.label;
        return labels;
      }, {} as Record<JobCardComplaintGroupId, string>),
    []
  );
  const complaintGroupCounts = useMemo(
    () =>
      jobCardComplaintGroups.reduce((counts, group) => {
        counts[group.id] = jobCardComplaintItems.filter((complaint) => complaint.groupId === group.id).length;
        return counts;
      }, {} as Record<JobCardComplaintGroupId, number>),
    []
  );
  const activeComplaintGroup = useMemo(
    () => jobCardComplaintGroups.find((group) => group.id === activeComplaintGroupId) ?? jobCardComplaintGroups[0],
    [activeComplaintGroupId]
  );
  const selectedComplaintSet = useMemo(() => new Set(selectedComplaintIds), [selectedComplaintIds]);
  const selectedComplaints = useMemo(
    () =>
      selectedComplaintIds
        .map((complaintId) => jobCardComplaintItems.find((complaint) => complaint.id === complaintId))
        .filter((complaint): complaint is JobCardComplaintItem => Boolean(complaint)),
    [selectedComplaintIds]
  );
  const filteredComplaintItems = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(complaintSearchTerm);

    if (normalizedQuery) {
      return jobCardComplaintItems.filter((complaint) =>
        getComplaintSearchValue(complaint, complaintGroupLabelById[complaint.groupId]).includes(normalizedQuery)
      );
    }

    return jobCardComplaintItems.filter((complaint) => complaint.groupId === activeComplaintGroupId);
  }, [activeComplaintGroupId, complaintGroupLabelById, complaintSearchTerm]);
  const customerVoiceItems = useMemo<JobCardCustomerVoiceItem[]>(
    () =>
      selectedComplaints.map((complaint) => {
        const remark = complaintRemarks[complaint.id]?.trim();

        return {
          id: complaint.id,
          groupId: complaint.groupId,
          groupLabel: complaintGroupLabelById[complaint.groupId],
          name: complaint.name,
          helper: complaint.helper,
          remark: remark || undefined,
          tags: complaint.tags,
        };
      }),
    [complaintGroupLabelById, complaintRemarks, selectedComplaints]
  );
  const customerVoiceConcern = useMemo(() => {
    const complaintLines = customerVoiceItems.map((item) => (item.remark ? `${item.name} - ${item.remark}` : item.name));
    const ownWords = customerVoiceText.trim();

    if (ownWords) {
      complaintLines.push(`Customer words: ${ownWords}`);
    }

    return complaintLines.join('\n');
  }, [customerVoiceItems, customerVoiceText]);

  const resetCustomerVoiceCapture = () => {
    setComplaintSearchTerm('');
    setActiveComplaintGroupId('suggested');
    setSelectedComplaintIds([]);
    setComplaintRemarks({});
    setEditingComplaintId(null);
    setCustomerVoiceText('');
  };

  const resetDialog = () => {
    setActiveStep(1);
    setActiveTab('search');
    setSearchTerm('');
    setAppointmentSearchTerm('');
    setActiveAppointmentFilters([]);
    setIsLaterAppointmentsExpanded(false);
    setSelectedAppointmentId(null);
    setSelectedVehicleId(null);
    setExpandedVehicleId(null);
    setOdometer('');
    setServiceType('');
    setClusterUnreadable(false);
    resetCustomerVoiceCapture();
  };

  const handleClose = () => {
    resetDialog();
    onClose();
  };

  const { containerRef, handleKeyDown } = useDialogFocusTrap<HTMLDivElement>({
    isOpen,
    onClose: handleClose,
    initialFocusRef: searchInputRef,
    fallbackFocusRef: closeButtonRef,
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    resetDialog();
  }, [isOpen]);

  useEffect(() => {
    if (!selectedVehicle) {
      return;
    }

    const latestReading = getLatestRecordedReading(selectedVehicle);
    setOdometer(formatOdometerInput(String(latestReading.odometer)));
    setClusterUnreadable(false);
    setServiceType(selectedVehicle.openJobCardId ? '' : selectedAppointment?.serviceType ?? (selectedVehicle.appointmentTime ? 'Free service' : ''));
  }, [selectedAppointment, selectedVehicle]);

  const handleTabChange = (nextTab: IntakeTab) => {
    setActiveTab(nextTab);
    setIsLaterAppointmentsExpanded(false);
    setSelectedAppointmentId(null);
    setSelectedVehicleId(null);
    setExpandedVehicleId(null);
    resetCustomerVoiceCapture();
  };

  const handleChangeVehicle = () => {
    setActiveStep(1);
  };

  const handleOdometerChange = (value: string) => {
    setOdometer(formatOdometerInput(value));
  };

  const handleClusterUnreadableChange = (checked: boolean) => {
    setClusterUnreadable(checked);

    if (checked) {
      setOdometer('');
      return;
    }

    if (lastRecordedReading) {
      setOdometer(formatOdometerInput(String(lastRecordedReading.odometer)));
    }
  };

  const handleSelectVehicle = (vehicle: JobCardIntakeVehicle) => {
    setSelectedAppointmentId(null);

    if (vehicle.openJobCardId) {
      setSelectedVehicleId(null);
      return;
    }

    setSelectedVehicleId(vehicle.id);
    resetCustomerVoiceCapture();
  };

  const handleSelectAppointment = (appointment: JobCardTodayAppointment) => {
    if (appointment.vehicle.openJobCardId) {
      handleOpenExistingJobCard(appointment.vehicle.openJobCardId);
      return;
    }

    setSelectedAppointmentId(appointment.id);
    setSelectedVehicleId(null);
    setExpandedVehicleId(null);
    resetCustomerVoiceCapture();
    setActiveStep(2);
  };

  const toggleAppointmentFilter = (filter: AppointmentFilter) => {
    setActiveAppointmentFilters((currentFilters) =>
      currentFilters.includes(filter)
        ? currentFilters.filter((item) => item !== filter)
        : [...currentFilters, filter]
    );
  };

  const handleToggleComplaint = (complaintId: string) => {
    const isCurrentlySelected = selectedComplaintSet.has(complaintId);

    if (isCurrentlySelected) {
      setComplaintRemarks((currentRemarks) => {
        const nextRemarks = { ...currentRemarks };
        delete nextRemarks[complaintId];
        return nextRemarks;
      });
      setEditingComplaintId((currentId) => (currentId === complaintId ? null : currentId));
    }

    setSelectedComplaintIds((currentIds) =>
      isCurrentlySelected ? currentIds.filter((id) => id !== complaintId) : [...currentIds, complaintId]
    );
  };

  const handleComplaintRemarkChange = (complaintId: string, value: string) => {
    setComplaintRemarks((currentRemarks) => ({
      ...currentRemarks,
      [complaintId]: value.slice(0, 240),
    }));
  };

  const handleToggleVehicleDetails = (vehicleId: string) => {
    setExpandedVehicleId((currentId) => (currentId === vehicleId ? null : vehicleId));
  };

  const handleOpenExistingJobCard = (documentId: string) => {
    handleClose();
    onOpenExistingJobCard(documentId);
  };

  const handleProceed = () => {
    if (!selectedVehicle || !canContinueFromReading) {
      return;
    }

    const draftOdometer = parsedOdometer ?? lastRecordedReading?.odometer ?? selectedVehicle.odometer;
    const draft: JobCardIntakeDraft = {
      source: selectedAppointment ? 'appointment' : 'search',
      appointmentId: selectedAppointment?.id,
      vehicleId: selectedVehicle.id,
      registrationNumber: selectedVehicle.registrationNumber,
      engineNumber: selectedVehicle.engineNumber,
      vin: selectedVehicle.vin,
      mobileNumber: selectedVehicle.mobileNumber,
      customerName: selectedVehicle.customerName,
      customerCode: selectedVehicle.customerCode,
      model: selectedVehicle.model,
      odometer: draftOdometer,
      serviceType,
      concern: customerVoiceConcern,
      customerVoiceItems: customerVoiceItems.length > 0 ? customerVoiceItems : undefined,
      customerVoiceText: customerVoiceText.trim() || undefined,
      clusterUnreadable: clusterUnreadable || undefined,
      lastRecordedOdometer: lastRecordedReading?.odometer,
      lastRecordedDate: lastRecordedReading?.date,
      appointmentTime: selectedAppointment?.time ?? selectedVehicle.appointmentTime,
      serviceBay: selectedVehicle.serviceBay,
      serviceAdvisor: selectedVehicle.serviceAdvisor,
    };

    handleClose();
    onProceed(draft);
  };

  const renderStepHeader = () => (
    <div className="job-card-intake-dialog__steps" aria-label="Job card creation steps">
      {[
        { id: 1, label: 'Identify vehicle' },
        { id: 2, label: 'Reading and type' },
        { id: 3, label: 'Customer voice' },
      ].map((step, index) => (
        <React.Fragment key={step.id}>
          <div
            className={cn(
              'job-card-intake-dialog__step',
              activeStep === step.id && 'job-card-intake-dialog__step--active',
              activeStep > step.id && 'job-card-intake-dialog__step--done'
            )}
          >
            <span className="job-card-intake-dialog__step-index">
              {activeStep > step.id ? <Check size={11} /> : step.id}
            </span>
            <span>{step.label}</span>
          </div>
          {index < 2 && <span className="job-card-intake-dialog__step-line" aria-hidden="true" />}
        </React.Fragment>
      ))}
    </div>
  );

  const renderVehicleBadges = (vehicle: JobCardIntakeVehicle) => {
    const shortWarrantyLabel = getShortWarrantyLabel(vehicle.warrantyStatus);

    return (
      <div className="job-card-intake-result__badges">
        {vehicle.appointmentTime && (
          <span className="job-card-intake-badge job-card-intake-badge--success">Appointment {vehicle.appointmentTime}</span>
        )}
        {vehicle.openJobCardNumber && (
          <span className="job-card-intake-badge job-card-intake-badge--warning">
            Job card open - {vehicle.openJobCardNumber}
          </span>
        )}
        {vehicle.creditStatus && <span className="job-card-intake-badge job-card-intake-badge--danger">{vehicle.creditStatus}</span>}
        {vehicle.amcStatus && <span className="job-card-intake-badge job-card-intake-badge--info">{vehicle.amcStatus}</span>}
        {!vehicle.openJobCardNumber && shortWarrantyLabel && <span className="job-card-intake-badge">{shortWarrantyLabel}</span>}
      </div>
    );
  };

  const renderVehicleRow = (vehicle: JobCardIntakeVehicle, rowIndex: number) => {
    const isSelected = selectedVehicleId === vehicle.id;
    const isExpanded = expandedVehicleId === vehicle.id;
    const panelId = `job-card-intake-history-${vehicle.id}`;

    return (
      <article
        key={vehicle.id}
        className={cn(
          'job-card-intake-result',
          isSelected && 'job-card-intake-result--selected',
          vehicle.openJobCardId && 'job-card-intake-result--blocked'
        )}
      >
        <div className="job-card-intake-result__summary">
          <button
            type="button"
            className="job-card-intake-result__select-surface"
            onClick={() => handleSelectVehicle(vehicle)}
            aria-pressed={vehicle.openJobCardId ? undefined : isSelected}
            aria-label={
              vehicle.openJobCardId
                ? `${vehicle.registrationNumber} has an open job card`
                : `Select vehicle ${vehicle.registrationNumber}`
            }
          >
            <span className="job-card-intake-result__index">{rowIndex}</span>
            <span className="job-card-intake-result__content">
              <span className="job-card-intake-plate">
                <span className="job-card-intake-plate__slab">IND</span>
                <span className="job-card-intake-plate__number">{vehicle.registrationNumber}</span>
              </span>
              <span className="job-card-intake-result__vehicle">{getVehicleSummary(vehicle)}</span>
              {renderVehicleBadges(vehicle)}
            </span>
          </button>
          <button
            type="button"
            className="job-card-intake-result__chevron-button"
            onClick={() => handleToggleVehicleDetails(vehicle.id)}
            aria-expanded={isExpanded}
            aria-controls={panelId}
            aria-label={`${isExpanded ? 'Hide' : 'Show'} service history for ${vehicle.registrationNumber}`}
          >
            <ChevronDown size={16} className={cn('job-card-intake-result__chevron', isExpanded && 'job-card-intake-result__chevron--open')} />
          </button>
        </div>

        {isExpanded && (
          <div id={panelId} className="job-card-intake-result__details">
            <div className="job-card-intake-history" role="table" aria-label={`Service history for ${vehicle.registrationNumber}`}>
              <div className="job-card-intake-history__row job-card-intake-history__row--header" role="row">
                <span role="columnheader">Date</span>
                <span role="columnheader">Odometer</span>
                <span role="columnheader">Reason</span>
                <span role="columnheader">Status</span>
              </div>
              {vehicle.history.map((historyItem) => (
                <div key={`${vehicle.id}-${historyItem.date}`} className="job-card-intake-history__row" role="row">
                  <span role="cell">{formatDate(historyItem.date)}</span>
                  <span role="cell">{odometerFormatter.format(historyItem.odometer)} km</span>
                  <span role="cell">{historyItem.reason}</span>
                  <span role="cell">{historyItem.status}</span>
                </div>
              ))}
            </div>
            <div className="job-card-intake-result__meta">
              Warranty {vehicle.warrantyStatus} - VIN {vehicle.vin} - engine {vehicle.engineNumber}
              {vehicle.insuranceValidTill ? ` - insurance to ${formatDate(vehicle.insuranceValidTill)}` : ''}
            </div>
            {vehicle.openJobCardId && (
              <button
                type="button"
                className="job-card-intake-result__existing"
                onClick={() => handleOpenExistingJobCard(vehicle.openJobCardId as string)}
              >
                Open existing job card
              </button>
            )}
          </div>
        )}
      </article>
    );
  };

  const renderAppointmentEmptyState = () => {
    const hasSearch = Boolean(appointmentSearchTerm.trim());
    const hasFilters = activeAppointmentFilters.length > 0;

    if (jobCardTodayAppointments.length === 0) {
      return (
        <div className="job-card-intake-dialog__empty-help">
          <strong>No appointments today</strong>
          <span>New bookings for today will appear here as a time-ordered agenda.</span>
        </div>
      );
    }

    if (hasSearch) {
      return (
        <div className="job-card-intake-dialog__empty-help">
          <strong>No booking found</strong>
          <span>Try a plate number or vehicle model from today&apos;s schedule.</span>
        </div>
      );
    }

    if (hasFilters) {
      return (
        <div className="job-card-intake-dialog__empty-help">
          <strong>No bookings match these filters</strong>
          <span>Clear Not arrived or Mine to see the full day&apos;s schedule.</span>
        </div>
      );
    }

    return null;
  };

  const getAppointmentServiceCue = (serviceLabel: string) => {
    switch (serviceLabel) {
      case 'General service':
        return { label: 'General', tone: 'muted' };
      case 'Free service':
        return { label: 'Free service', tone: 'success' };
      case 'Running repair':
        return { label: 'Running repair', tone: 'warning' };
      case 'Accident / insurance':
        return { label: 'Insurance', tone: 'info' };
      case 'Recall campaign':
        return { label: 'Recall', tone: 'danger' };
      case 'Pre-delivery inspection':
        return { label: 'PDI', tone: 'info' };
      default:
        return { label: serviceLabel, tone: 'muted' };
    }
  };

  const getAppointmentCue = (appointment: JobCardTodayAppointment) => {
    if (appointment.vehicle.openJobCardNumber) {
      return { label: `Open ${appointment.vehicle.openJobCardNumber}`, tone: 'warning' };
    }

    if (appointment.group === 'overdue') {
      return { label: appointment.cueLabel, tone: 'danger' };
    }

    if (appointment.arrivalStatus === 'waiting') {
      return { label: appointment.cueLabel.replace(/^waiting/i, 'Waiting'), tone: 'warning' };
    }

    return getAppointmentServiceCue(appointment.serviceType);
  };

  const renderAppointmentRow = (appointment: JobCardTodayAppointment) => {
    const vehicle = appointment.vehicle;
    const isSelected = selectedAppointmentId === appointment.id;
    const isBlocked = Boolean(vehicle.openJobCardId);
    const appointmentCue = getAppointmentCue(appointment);

    return (
      <button
        key={appointment.id}
        type="button"
        className={cn(
          'job-card-intake-appointment-row',
          isSelected && 'job-card-intake-appointment-row--selected',
          isBlocked && 'job-card-intake-appointment-row--blocked'
        )}
        onClick={() => handleSelectAppointment(appointment)}
        aria-label={
          isBlocked
            ? `Open existing job card for ${vehicle.registrationNumber}`
            : `Start job card for ${vehicle.registrationNumber} appointment at ${appointment.time}`
        }
      >
        <span className="job-card-intake-appointment-row__time">{appointment.time}</span>
        <span className="job-card-intake-appointment-row__vehicle">
          <span className="job-card-intake-plate">
            <span className="job-card-intake-plate__slab">IND</span>
            <span className="job-card-intake-plate__number">{vehicle.registrationNumber}</span>
          </span>
          <span className="job-card-intake-appointment-row__summary">
            {vehicle.model} - {vehicle.color}
          </span>
        </span>
        <span
          className={cn(
            'job-card-intake-appointment-row__cue',
            `job-card-intake-appointment-row__cue--${appointmentCue.tone}`
          )}
        >
          {appointmentCue.label}
        </span>
        <ChevronRight size={14} className="job-card-intake-appointment-row__action" aria-hidden="true" />
      </button>
    );
  };

  const renderAppointmentsTab = () => (
    <div className="job-card-intake-appointments" aria-label="Today's appointments">
      <div className="job-card-intake-appointments__toolbar">
        <label className="job-card-intake-appointments__search">
          <Search size={16} className="job-card-intake-appointments__search-icon" aria-hidden="true" />
          <input
            type="text"
            value={appointmentSearchTerm}
            onChange={(event) => setAppointmentSearchTerm(event.target.value)}
            placeholder={`Narrow ${appointmentCount} bookings by plate or model`}
            className="job-card-intake-appointments__search-input"
          />
          {appointmentSearchTerm && (
            <button
              type="button"
              className="job-card-intake-appointments__clear"
              onClick={() => setAppointmentSearchTerm('')}
              aria-label="Clear appointment search"
            >
              <X size={15} />
            </button>
          )}
        </label>
        <div className="job-card-intake-appointments__filters" aria-label="Appointment filters">
          {(Object.keys(appointmentFilterLabels) as AppointmentFilter[]).map((filter) => {
            const isActive = activeAppointmentFilters.includes(filter);

            return (
              <button
                key={filter}
                type="button"
                className={cn('job-card-intake-appointments__filter', isActive && 'job-card-intake-appointments__filter--active')}
                onClick={() => toggleAppointmentFilter(filter)}
                aria-pressed={isActive}
              >
                <span>{appointmentFilterLabels[filter]}</span>
                <strong>{appointmentFilterCounts[filter]}</strong>
              </button>
            );
          })}
        </div>
      </div>

      <div className="job-card-intake-appointments__summary">
        Showing {displayedAppointmentCount} of {appointmentCount} bookings
      </div>

      {filteredAppointments.length > 0 ? (
        <div className="job-card-intake-appointments__list">
          {visibleAppointmentGroups.map((group) => {
            const isLaterGroup = group.id === 'later-today';
            const showLaterToggle = isLaterGroup && group.totalCount > 0 && !hasActiveAppointmentQuery && !hasActiveAppointmentFilters;

            return (
              <section
                key={group.id}
                className={cn('job-card-intake-appointments__section', `job-card-intake-appointments__section--${group.id}`)}
                aria-label={`${group.label} appointments`}
              >
                <div className="job-card-intake-appointments__section-title">
                  <span>{group.label} - {group.totalCount}</span>
                  {showLaterToggle && (
                    <button
                      type="button"
                      className="job-card-intake-appointments__section-toggle"
                      onClick={() => setIsLaterAppointmentsExpanded((isExpanded) => !isExpanded)}
                      aria-expanded={!group.isCollapsed}
                    >
                      {group.isCollapsed ? 'Show all' : 'Show less'}
                    </button>
                  )}
                </div>
                {group.appointments.length > 0 && (
                  <div className="job-card-intake-appointments__rows">
                    {group.appointments.map(renderAppointmentRow)}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        renderAppointmentEmptyState()
      )}
    </div>
  );

  const renderIdentifyStep = () => (
    <>
      <div className="job-card-intake-dialog__tabs" role="tablist" aria-label="Identify vehicle">
        <button
          type="button"
          className={cn('job-card-intake-dialog__tab', activeTab === 'search' && 'job-card-intake-dialog__tab--active')}
          onClick={() => handleTabChange('search')}
          role="tab"
          aria-selected={activeTab === 'search'}
        >
          Search
        </button>
        <button
          type="button"
          className={cn('job-card-intake-dialog__tab', activeTab === 'appointments' && 'job-card-intake-dialog__tab--active')}
          onClick={() => handleTabChange('appointments')}
          role="tab"
          aria-selected={activeTab === 'appointments'}
        >
          Today's appointments - {appointmentCount}
        </button>
      </div>

      {activeTab === 'search' && (
        <label className="job-card-intake-search">
          <Search size={18} className="job-card-intake-search__icon" aria-hidden="true" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setSelectedVehicleId(null);
              setExpandedVehicleId(null);
            }}
            placeholder="Registration, VIN, engine no., or mobile"
            className="job-card-intake-search__input"
          />
          {searchTerm && (
            <button
              type="button"
              className="job-card-intake-search__clear"
              onClick={() => {
                setSearchTerm('');
                setSelectedVehicleId(null);
                setExpandedVehicleId(null);
                searchInputRef.current?.focus();
              }}
              aria-label="Clear vehicle search"
            >
              <X size={16} />
            </button>
          )}
        </label>
      )}

      {activeTab === 'search' && !searchTerm.trim() && (
        <div className="job-card-intake-dialog__empty-help">
          <strong>Start with whatever you can read off the vehicle</strong>
          <span>The plate is the fastest. Registration, VIN, engine number, and mobile are searched at once.</span>
        </div>
      )}

      {activeTab === 'appointments' && renderAppointmentsTab()}

      {activeTab === 'search' && visibleVehicles.length > 0 && (
        <div className="job-card-intake-dialog__results">
          {groupedVehicles.map((group) => (
            <section key={group.customerName} className="job-card-intake-group">
              <div className="job-card-intake-group__header">
                <div className="job-card-intake-group__avatar" aria-hidden="true">
                  {group.customerName.slice(0, 2).toUpperCase()}
                </div>
                <div className="job-card-intake-group__copy">
                  <strong>{group.customerName}</strong>
                  <span>
                    {group.vehicles[0].customerCode} - {group.vehicles[0].customerType} - {group.vehicles[0].fleetSize} vehicles
                    {group.vehicles[0].overdueAmount ? ` - ${group.vehicles[0].overdueAmount}` : ''}
                  </span>
                </div>
              </div>
              <div className="job-card-intake-group__vehicles">
                {group.vehicles.map((vehicle, index) => renderVehicleRow(vehicle, index + 1))}
              </div>
            </section>
          ))}
        </div>
      )}

      {activeTab === 'search' && searchTerm.trim() && visibleVehicles.length === 0 && (
        <div className="job-card-intake-dialog__empty-help">
          <strong>No vehicle found</strong>
          <span>Try a complete registration, VIN, engine number, or mobile number.</span>
        </div>
      )}
    </>
  );

  const renderReadingStep = () => {
    if (!selectedVehicle || !lastRecordedReading) {
      return null;
    }

    return (
      <div className="job-card-intake-form job-card-intake-reading">
        <div className="job-card-intake-reading__vehicle">
          <span className="job-card-intake-plate">
            <span className="job-card-intake-plate__slab">IND</span>
            <span className="job-card-intake-plate__number">{selectedVehicle.registrationNumber}</span>
          </span>
          <div className="job-card-intake-reading__vehicle-copy">
            <strong>{`${selectedVehicle.model} ${selectedVehicle.variant} - ${selectedVehicle.color}`}</strong>
            <span>{`${selectedVehicle.customerName} - ${selectedVehicle.mobileNumber}`}</span>
          </div>
          <button type="button" className="job-card-intake-reading__change" onClick={handleChangeVehicle}>
            Change
          </button>
        </div>

        <div className="job-card-intake-reading__odometer-row">
          <label className="job-card-intake-field job-card-intake-reading__odometer-field">
            <span>Odometer (km)</span>
            <Input
              type="text"
              inputMode="numeric"
              value={odometer}
              disabled={clusterUnreadable}
              onChange={(event) => handleOdometerChange(event.target.value)}
              placeholder="Enter reading"
            />
          </label>
          <label className="job-card-intake-reading__cluster">
            <input
              type="checkbox"
              checked={clusterUnreadable}
              onChange={(event) => handleClusterUnreadableChange(event.target.checked)}
            />
            <span>Cluster unreadable</span>
          </label>
        </div>

        <div
          className={cn(
            'job-card-intake-reading__record',
            hasSuspectOdometer && 'job-card-intake-reading__record--error',
            clusterUnreadable && 'job-card-intake-reading__record--muted'
          )}
        >
          {hasSuspectOdometer
            ? `Reading is lower than the last recorded ${odometerFormatter.format(lastRecordedReading.odometer)} km on ${formatDate(lastRecordedReading.date)}.`
            : clusterUnreadable
              ? `Cluster unreadable. The job card will use the last recorded ${odometerFormatter.format(lastRecordedReading.odometer)} km from ${formatDate(lastRecordedReading.date)}.`
              : `Last recorded ${odometerFormatter.format(lastRecordedReading.odometer)} km on ${formatDate(lastRecordedReading.date)}. Checked against history as you type, so you can re-read the cluster before you walk away.`}
        </div>

        <section className="job-card-intake-service-picker">
          <div className="job-card-intake-service-picker__grid" role="radiogroup" aria-label="Job card type">
            {serviceTypeOptions.map((option) => {
              const isSelected = serviceType === option.value;
              const isDisabled = Boolean(option.isDisabled?.(selectedVehicle));
              const isSuggested = Boolean(option.isSuggested?.(selectedVehicle));

              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={isDisabled}
                  className={cn(
                    'job-card-intake-service-card',
                    isSelected && 'job-card-intake-service-card--selected',
                    isDisabled && 'job-card-intake-service-card--disabled'
                  )}
                  onClick={() => setServiceType(option.value)}
                >
                  <span className="job-card-intake-service-card__body">
                    <span className="job-card-intake-service-card__head">
                      <strong>{option.title}</strong>
                      <span className="job-card-intake-service-card__badges">
                        <span
                          className={cn(
                            'job-card-intake-service-card__badge',
                            `job-card-intake-service-card__badge--${option.readingPolicy}`
                          )}
                        >
                          {readingPolicyLabels[option.readingPolicy]}
                        </span>
                        {isSuggested && <span className="job-card-intake-service-card__badge job-card-intake-service-card__badge--suggested">Suggested</span>}
                      </span>
                    </span>
                    <span className="job-card-intake-service-card__helper">{isDisabled ? option.disabledReason ?? option.helper : option.helper}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    );
  };

  const renderCustomerVoiceStep = () => {
    if (!selectedVehicle) {
      return null;
    }

    return (
      <div className="job-card-intake-form job-card-intake-customer-voice">
        <div className="job-card-intake-reading__vehicle job-card-intake-customer-voice__vehicle">
          <span className="job-card-intake-plate">
            <span className="job-card-intake-plate__slab">IND</span>
            <span className="job-card-intake-plate__number">{selectedVehicle.registrationNumber}</span>
          </span>
          <div className="job-card-intake-reading__vehicle-copy">
            <strong>{`${selectedVehicle.model} ${selectedVehicle.variant} - ${selectedVehicle.color}`}</strong>
            <span>{`${selectedVehicle.customerName} - ${selectedVehicle.mobileNumber}`}</span>
          </div>
          <button type="button" className="job-card-intake-reading__change" onClick={handleChangeVehicle}>
            Change
          </button>
        </div>

        <section className="job-card-intake-customer-voice__panel" aria-label="Customer complaints">
          <header className="job-card-intake-customer-voice__header">
            <div className="job-card-intake-customer-voice__title">
              <span>Customer complaints</span>
              <strong>{selectedComplaintIds.length === 1 ? '1 selected' : `${selectedComplaintIds.length} selected`}</strong>
            </div>
            <label className="job-card-intake-customer-voice__search">
              <Search size={15} aria-hidden="true" />
              <input
                type="text"
                value={complaintSearchTerm}
                onChange={(event) => setComplaintSearchTerm(event.target.value)}
                placeholder={`Search all ${jobCardComplaintItems.length} items`}
                aria-label="Search customer complaints"
              />
              {complaintSearchTerm && (
                <button
                  type="button"
                  className="job-card-intake-customer-voice__clear"
                  onClick={() => setComplaintSearchTerm('')}
                  aria-label="Clear complaint search"
                >
                  <X size={14} />
                </button>
              )}
            </label>
          </header>

          <div className="job-card-intake-customer-voice__body">
            <nav className="job-card-intake-customer-voice__groups" aria-label="Complaint groups">
              {jobCardComplaintGroups.map((group) => {
                const isActive = !complaintSearchTerm && activeComplaintGroupId === group.id;

                return (
                  <button
                    key={group.id}
                    type="button"
                    className={cn('job-card-intake-customer-voice__group', isActive && 'job-card-intake-customer-voice__group--active')}
                    onClick={() => {
                      setActiveComplaintGroupId(group.id);
                      setComplaintSearchTerm('');
                    }}
                    aria-pressed={isActive}
                  >
                    <span>{group.label}</span>
                    <strong>{complaintGroupCounts[group.id]}</strong>
                  </button>
                );
              })}
            </nav>

            <div className="job-card-intake-customer-voice__list" aria-live="polite">
              {complaintSearchTerm ? (
                <div className="job-card-intake-customer-voice__list-context">Matches across all complaint groups</div>
              ) : activeComplaintGroup?.helper ? (
                <div className="job-card-intake-customer-voice__list-context">{activeComplaintGroup.helper}</div>
              ) : null}
              {filteredComplaintItems.length === 0 ? (
                <div className="job-card-intake-customer-voice__empty">
                  Nothing here matches. Search another phrase or write it in the customer&apos;s words.
                </div>
              ) : (
                filteredComplaintItems.map((complaint) => {
                  const isSelected = selectedComplaintSet.has(complaint.id);
                  const isEditing = editingComplaintId === complaint.id;
                  const remark = complaintRemarks[complaint.id]?.trim();

                  return (
                    <article
                      key={complaint.id}
                      className={cn(
                        'job-card-intake-customer-voice__complaint',
                        isSelected && 'job-card-intake-customer-voice__complaint--selected'
                      )}
                    >
                      <div className="job-card-intake-customer-voice__complaint-row">
                        <label className="job-card-intake-customer-voice__complaint-main">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleComplaint(complaint.id)}
                          />
                          <span className="job-card-intake-customer-voice__complaint-copy">
                            <strong>{complaint.name}</strong>
                            <span>{complaint.helper}</span>
                            {complaint.tags && complaint.tags.length > 0 && (
                              <span className="job-card-intake-customer-voice__tags">
                                {complaint.tags.map((tag) => (
                                  <span key={tag} className="job-card-intake-customer-voice__tag">
                                    {tag}
                                  </span>
                                ))}
                              </span>
                            )}
                          </span>
                        </label>
                        {isSelected && (
                          <button
                            type="button"
                            className="job-card-intake-customer-voice__remark-toggle"
                            onClick={() => setEditingComplaintId(isEditing ? null : complaint.id)}
                          >
                            {isEditing ? 'Done' : remark ? 'Edit remarks' : 'Add remarks'}
                          </button>
                        )}
                      </div>
                      {isSelected && isEditing && (
                        <label className="job-card-intake-customer-voice__remark-field">
                          <span>Remarks for {complaint.name}</span>
                          <Textarea
                            rows={2}
                            maxLength={240}
                            value={complaintRemarks[complaint.id] ?? ''}
                            onChange={(event) => handleComplaintRemarkChange(complaint.id, event.target.value)}
                            placeholder="Add exact customer words, noise timing, side, speed, or condition"
                          />
                        </label>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          </div>

          <label className="job-card-intake-customer-voice__own-words">
            <span>Write complaint in customer&apos;s words</span>
            <Textarea
              rows={3}
              maxLength={500}
              value={customerVoiceText}
              onChange={(event) => setCustomerVoiceText(event.target.value.slice(0, 500))}
              placeholder="Optional. Type anything that is not available in the complaint list."
            />
          </label>
        </section>
      </div>
    );
  };
  return (
    <div
      className={cn('confirmation-dialog job-card-intake-dialog', isOpen && 'confirmation-dialog--open job-card-intake-dialog--open')}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        className="confirmation-dialog__backdrop"
        onClick={handleClose}
        tabIndex={isOpen ? 0 : -1}
        aria-label="Close new job card intake"
      />
      <div
        ref={containerRef}
        className="confirmation-dialog__panel job-card-intake-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={handleKeyDown}
      >
        <header className="job-card-intake-dialog__header">
          <div>
            <h2 id={titleId}>New job card</h2>
            {renderStepHeader()}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="job-card-intake-dialog__close"
            onClick={handleClose}
            aria-label="Close new job card intake"
          >
            <X size={18} />
          </button>
        </header>

        <div className="job-card-intake-dialog__body">
          {activeStep === 1 && renderIdentifyStep()}
          {activeStep === 2 && renderReadingStep()}
          {activeStep === 3 && renderCustomerVoiceStep()}
        </div>

        <footer className="job-card-intake-dialog__footer">
          <div className="job-card-intake-dialog__footer-hint">
            {activeStep === 1 && selectedVehicle?.openJobCardNumber
              ? `Existing job card ${selectedVehicle.openJobCardNumber} is already open for this vehicle.`
              : activeStep === 1
                ? 'Select a vehicle to continue.'
                : activeStep === 2
                  ? readingFooterHint
                  : 'Customer Voice is optional. Create the job card when ready.'}
          </div>
          <div className="job-card-intake-dialog__actions">
            <button
              type="button"
              className="btn btn--outline"
              onClick={activeStep === 1 ? handleClose : () => setActiveStep((current) => (current === 3 ? 2 : 1))}
            >
              {activeStep === 1 ? 'Cancel' : 'Back'}
            </button>
            {activeStep < 3 ? (
              <button
                type="button"
                className="btn btn--primary"
                disabled={activeStep === 1 ? !canContinueFromVehicle : !canContinueFromReading}
                onClick={() => setActiveStep((current) => (current === 1 ? 2 : 3))}
              >
                Next
              </button>
            ) : (
              <button type="button" className="btn btn--primary" onClick={handleProceed}>
                Create Job Card
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
};

export default JobCardNewIntakeDialog;
