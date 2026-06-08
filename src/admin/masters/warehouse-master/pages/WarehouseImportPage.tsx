import { useMemo, useState } from 'react';
import { Download, FileUp, RefreshCcw, Send, ShieldAlert } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminShell from '../../../AdminShell';
import { AdminListPageShell } from '../../../../experience/components/AdminListPageShell';
import { warehouseMockAdapter } from '../services/warehouseMockAdapter';
import { WAREHOUSE_ROUTES } from '../utils/routeUtils';
import { buildImportCommitPayload, detectPermissionDenied, getReasonCodesForAction, parseWarehouseServiceError, requiresControlledChangeApproval } from '../utils/governanceUtils';
import { WarehouseControlledActionDrawer } from '../components/WarehouseControlledActionDrawer';
import { mockAllPermissions } from '../types/warehouse.permissions';
import type { ImportCommitRequest, ImportValidationResult } from '../types/warehouse.dto';
import type { ImportEntityType, ImportMode } from '../types/warehouse.enums';

const ENTITY_OPTIONS: ImportEntityType[] = ['Warehouse', 'Location', 'BIN', 'ItemEligibility', 'HierarchyTemplate'];
const MODE_OPTIONS: ImportMode[] = ['Dry-Run', 'Incremental', 'Full-Replace'];

export function buildImportSummary(validation: ImportValidationResult | null) {
  if (!validation) return [];
  return [
    { label: 'File', value: validation.fileName },
    { label: 'File size', value: `${validation.fileSize} bytes` },
    { label: 'Template', value: validation.templateVersion ?? 'n/a' },
    { label: 'Total', value: String(validation.totalRows) },
    { label: 'Valid', value: String(validation.validRows) },
    { label: 'Warnings', value: String(validation.warningRows) },
    { label: 'Errors', value: String(validation.errorRows) },
    { label: 'Create', value: String(validation.createCount) },
    { label: 'Update', value: String(validation.updateCount) },
    { label: 'Unchanged', value: String(validation.unchangedCount) },
  ];
}

export function deriveImportChecklist(validation: ImportValidationResult | null, reasonCode: string, reasonDescription: string) {
  if (!validation) return [];
  return [
    { id: 'validated', label: 'Validation has been run', passed: true },
    { id: 'revalidate', label: 'Revalidation will occur before commit', passed: true },
    { id: 'all-or-nothing', label: 'All-or-nothing commit is enforced by default', passed: true },
    { id: 'errors', label: 'No blocking import errors remain', passed: validation.errorRows === 0, detail: 'Resolve validation errors before submit.' },
    { id: 'reason', label: 'Controlled change reason captured', passed: !requiresControlledChangeApproval(validation) || (!!reasonCode && !!reasonDescription.trim()), detail: 'Controlled field changes require reason and approval.' },
  ];
}

export function canSubmitImport(validation: ImportValidationResult | null, reasonCode: string, reasonDescription: string) {
  if (!validation || !validation.canCommit) return false;
  if (!requiresControlledChangeApproval(validation)) return true;
  return Boolean(reasonCode && reasonDescription.trim());
}

export function buildErrorFileContents(validation: ImportValidationResult | null): string {
  if (!validation) return '';
  const failedRows = validation.rows.filter((row) => row.status === 'Error' || row.status === 'Warning');
  return [
    'rowNumber,status,code,name,issues',
    ...failedRows.map((row) => `${row.rowNumber},${row.status},${row.code ?? ''},${row.name ?? ''},"${row.issues.join(' | ')}"`),
  ].join('\n');
}

export default function WarehouseImportPage() {
  const { warehouseId = '' } = useParams<{ warehouseId: string }>();
  const navigate = useNavigate();
  const permissions = mockAllPermissions();
  const [entityType, setEntityType] = useState<ImportEntityType>('Location');
  const [mode, setMode] = useState<ImportMode>('Dry-Run');
  const [fileName, setFileName] = useState('warehouse-import.csv');
  const [fileSize, setFileSize] = useState(2048);
  const [templateVersion, setTemplateVersion] = useState('WM-TPL-1.0');
  const [validation, setValidation] = useState<ImportValidationResult | null>(null);
  const [commitResult, setCommitResult] = useState<string>('');
  const [errorText, setErrorText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [reasonCode, setReasonCode] = useState('');
  const [reasonDescription, setReasonDescription] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');

  const permissionIssues = detectPermissionDenied(permissions, 'warehouse.import');
  const checklist = useMemo(() => deriveImportChecklist(validation, reasonCode, reasonDescription), [validation, reasonCode, reasonDescription]);

  async function runValidation() {
    if (permissionIssues.length > 0) {
      setErrorText(permissionIssues[0].message);
      return;
    }

    const result = await warehouseMockAdapter.validateImport({
      entityType,
      mode,
      warehouseId,
      fileName,
      fileSize,
      templateVersion,
      fileHash: `${fileName}-${fileSize}-${templateVersion}`,
      idempotencyKey: `${entityType}-${fileName}-${fileSize}`,
    });
    setValidation(result);
    setCommitResult('');
    setErrorText('');
  }

  async function submitImport(request: ImportCommitRequest) {
    setSubmitting(true);
    setErrorText('');
    try {
      const result = await warehouseMockAdapter.commitImport(request);
      if (!result.success) {
        setErrorText(result.errors?.join(' ') ?? 'Import submit failed.');
      } else {
        setCommitResult(result.submittedForApproval ? 'Import submitted for approval.' : 'Import committed successfully.');
      }
    } catch (error) {
      setErrorText(parseWarehouseServiceError(error).message);
    } finally {
      setSubmitting(false);
      setApprovalOpen(false);
    }
  }

  async function handleSubmit() {
    if (!validation) return;
    const commitPayload = buildImportCommitPayload(validation, {
      mode,
      reasonCode,
      reasonDescription,
      approvalRoute: requiresControlledChangeApproval(validation) ? 'Master Data Approval' : undefined,
    });
    await submitImport(commitPayload);
  }

  function downloadErrorFile() {
    const contents = buildErrorFileContents(validation);
    setCommitResult(contents ? `Error file prepared: ${validation?.fileName}.errors.csv` : 'No error file content available.');
  }

  return (
    <AdminShell>
      <AdminListPageShell
        title="Warehouse Import"
        description="Validate, review, and submit warehouse-related import batches with governance controls."
        breadcrumbs={['Admin', 'Warehouse & Inventory', 'Warehouse Master', 'Import']}
        primaryAction={{ label: 'Back to Warehouse', onClick: () => navigate(WAREHOUSE_ROUTES.configuration(warehouseId)) }}
        summaryItems={validation ? [
          { label: 'Valid', value: validation.validRows, tone: 'success' },
          { label: 'Warnings', value: validation.warningRows, tone: validation.warningRows > 0 ? 'warning' : 'neutral' },
          { label: 'Errors', value: validation.errorRows, tone: validation.errorRows > 0 ? 'danger' : 'neutral' },
        ] : []}
        toolbarActions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={runValidation} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', cursor: 'pointer' }}>
              <RefreshCcw size={13} />
              Validate
            </button>
            <button type="button" onClick={() => setApprovalOpen(true)} disabled={!canSubmitImport(validation, reasonCode, reasonDescription)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: 'white', cursor: canSubmitImport(validation, reasonCode, reasonDescription) ? 'pointer' : 'not-allowed', opacity: canSubmitImport(validation, reasonCode, reasonDescription) ? 1 : 0.5 }}>
              <Send size={13} />
              Submit
            </button>
          </div>
        }
      >
        <div style={{ display: 'grid', gap: '16px' }}>
          <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', background: 'var(--color-surface)' }}>
            <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--color-border)', fontSize: '13px', fontWeight: 700 }}>Import Workflow</div>
            <div style={{ padding: '16px 18px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: 700 }}>Entity Type</label>
                <select value={entityType} onChange={(event) => setEntityType(event.target.value as ImportEntityType)} style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  {ENTITY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: 700 }}>Import Mode</label>
                <select value={mode} onChange={(event) => setMode(event.target.value as ImportMode)} style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  {MODE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: 700 }}>Template Version</label>
                <input value={templateVersion} onChange={(event) => setTemplateVersion(event.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--color-border)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: 700 }}>Filename</label>
                <input value={fileName} onChange={(event) => setFileName(event.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--color-border)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: 700 }}>File Size (bytes)</label>
                <input type="number" value={fileSize} onChange={(event) => setFileSize(parseInt(event.target.value, 10) || 0)} style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--color-border)' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'end', gap: '8px' }}>
                <button type="button" onClick={() => setCommitResult(`Template ready for ${entityType}: ${templateVersion}`)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                  <Download size={13} />
                  Download Template
                </button>
                <button type="button" onClick={() => setCommitResult(`Upload staged for ${fileName}`)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                  <FileUp size={13} />
                  Upload
                </button>
              </div>
            </div>
          </div>

          {validation && (
            <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', background: 'var(--color-surface)' }}>
              <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--color-border)', fontSize: '13px', fontWeight: 700 }}>Validation Review</div>
              <div style={{ padding: '16px 18px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px 16px' }}>
                {buildImportSummary(validation).map((item) => (
                  <div key={item.label}>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 700 }}>{item.label}</div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text)', marginTop: '2px' }}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '0 18px 16px' }}>
                <div style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#1D4ED8', fontSize: '12px' }}>
                  Validate Only does not mutate data. Commit always revalidates before import.
                </div>
                {requiresControlledChangeApproval(validation) && (
                  <div style={{ marginTop: '10px', padding: '10px 12px', borderRadius: '8px', border: '1px solid #FDE68A', background: '#FFFBEB', color: '#92400E', fontSize: '12px', display: 'flex', gap: '8px' }}>
                    <ShieldAlert size={14} />
                    Controlled field changes detected. Submit will require reason capture and approval routing.
                  </div>
                )}
              </div>
            </div>
          )}

          {validation && (
            <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', background: 'var(--color-surface)' }}>
              <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>Row Review</span>
                <button type="button" onClick={downloadErrorFile} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                  <Download size={13} />
                  Download Error File
                </button>
              </div>
              <div style={{ padding: '10px 18px 18px', display: 'grid', gap: '8px' }}>
                {validation.rows.map((row) => (
                  <div key={row.rowNumber} style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '10px 12px', background: row.status === 'Error' ? '#FEF2F2' : row.status === 'Warning' ? '#FFFBEB' : 'var(--color-surface)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{row.code} - {row.name}</div>
                      <div style={{ fontSize: '11px', fontWeight: 700 }}>{row.status}</div>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                      Action: {row.action ?? 'n/a'}{row.issues.length > 0 ? ` | ${row.issues.join(' ')}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(errorText || commitResult) && (
            <div style={{ padding: '12px 14px', borderRadius: '8px', border: `1px solid ${errorText ? '#FCA5A5' : '#86EFAC'}`, background: errorText ? '#FEF2F2' : '#F0FDF4', color: errorText ? '#991B1B' : '#166534', fontSize: '12px' }}>
              {errorText || commitResult}
            </div>
          )}
        </div>
      </AdminListPageShell>

      <WarehouseControlledActionDrawer
        open={approvalOpen}
        plan={validation ? {
          kind: requiresControlledChangeApproval(validation) ? 'ApproveImport' : 'Activate',
          title: 'Import Review',
          summary: 'Review import impact, reason, approval requirement, and consequence note before submit.',
          impactSummary: [`${validation.entityType} import`, `${validation.totalRows} total rows`, `${validation.createCount} create / ${validation.updateCount} update / ${validation.unchangedCount} unchanged`],
          approvalRequired: requiresControlledChangeApproval(validation),
          approverRoute: requiresControlledChangeApproval(validation) ? 'Master Data Approval' : undefined,
          checklist,
          consequenceNote: requiresControlledChangeApproval(validation)
            ? 'Controlled field changes will be submitted for approval before mutation.'
            : 'Commit will mutate records after successful final revalidation.',
          request: {
            action: 'Activate',
            reasonCode,
            reasonDescription,
            effectiveDate,
            approvalRequired: requiresControlledChangeApproval(validation),
            approvalRoute: requiresControlledChangeApproval(validation) ? 'Master Data Approval' : undefined,
          },
        } : null}
        reasonCode={reasonCode}
        reasonDescription={reasonDescription}
        effectiveDate={effectiveDate}
        saving={submitting}
        onClose={() => setApprovalOpen(false)}
        onReasonCodeChange={setReasonCode}
        onReasonDescriptionChange={setReasonDescription}
        onEffectiveDateChange={setEffectiveDate}
        onConfirm={handleSubmit}
        reasonCodeOptions={getReasonCodesForAction(
          validation && requiresControlledChangeApproval(validation) ? 'ApproveImport' : 'Activate',
        )}
      />
    </AdminShell>
  );
}
