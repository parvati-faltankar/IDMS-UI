import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Eye,
  FileText,
  GripVertical,
  ImagePlus,
  LayoutTemplate,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppShell from '../../components/common/AppShell';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import SideDrawer from '../../components/common/SideDrawer';
import { FormField, Input, Select, Textarea } from '../../components/common/FormControls';
import { cn } from '../../utils/classNames';
import { formatDateTime } from '../../utils/dateFormat';
import {
  archivePrintTemplate,
  createPrintTemplateDraft,
  duplicatePrintTemplate,
  loadPrintTemplates,
  loadSampleDocumentForEntity,
  PRINT_TEMPLATE_EVENT,
  renderTemplatePreview,
  savePrintTemplate,
  setDefaultPrintTemplate,
} from '../../print-builder/service';
import { getPrintEntityRegistryItem, printEntityRegistry } from '../../print-builder/entityRegistry';
import type { PrintBlockConfig, PrintEntityType, PrintSectionId, PrintTemplateRecord } from '../../print-builder/types';
import PrintTemplateDocument from '../../print-builder/PrintTemplateDocument';

interface PrintBuilderProps {
  onBack?: () => void;
}

type SortKey = 'name' | 'createdAt' | 'updatedAt';
type BuilderMode = 'catalogue' | 'editor';

const pageSizeOptions = ['A4', 'Letter', 'Legal', 'Custom'] as const;
const orientationOptions = ['portrait', 'landscape'] as const;
const statusFilterOptions = ['all', 'draft', 'active', 'inactive', 'archived'] as const;
const copyModeOptions = ['single', 'duplicate', 'triplicate', 'custom'] as const;
const fontWeightOptions = ['400', '500', '600', '700'] as const;

function navigateToHash(value: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.location.hash = value;
}

function getMode(pathname: string): BuilderMode {
  return pathname.endsWith('/edit') ? 'editor' : 'catalogue';
}

function toFieldOption(token: string, label: string) {
  return { value: token, label };
}

function createBlockId() {
  return `print-block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function duplicateTemplate(template: PrintTemplateRecord) {
  return duplicatePrintTemplate(template.id);
}

const PrintBuilder: React.FC<PrintBuilderProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const mode = getMode(location.pathname);
  const templateId = query.get('templateId');
  const createEntityType = (query.get('entityType') as PrintEntityType | null) ?? printEntityRegistry[0]?.id ?? 'sale-order';

  const [templates, setTemplates] = useState<PrintTemplateRecord[]>(() => loadPrintTemplates());
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState<'all' | PrintEntityType>('all');
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilterOptions)[number]>('all');
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt');
  const [previewTemplate, setPreviewTemplate] = useState<PrintTemplateRecord | null>(null);
  const [isEditorPreviewOpen, setIsEditorPreviewOpen] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<PrintTemplateRecord | null>(null);
  const [message, setMessage] = useState('');
  const [draft, setDraft] = useState<PrintTemplateRecord | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<PrintSectionId>('body');
  const [sampleDocumentId, setSampleDocumentId] = useState<string>('');

  useEffect(() => {
    const syncTemplates = () => setTemplates(loadPrintTemplates());
    window.addEventListener(PRINT_TEMPLATE_EVENT, syncTemplates);
    return () => window.removeEventListener(PRINT_TEMPLATE_EVENT, syncTemplates);
  }, []);

  useEffect(() => {
    if (mode !== 'editor') {
      setDraft(null);
      setSelectedBlockId(null);
      setIsEditorPreviewOpen(false);
      return;
    }

    const nextDraft = templates.find((template) => template.id === templateId) ?? createPrintTemplateDraft(createEntityType);
    setDraft(nextDraft);
    setSelectedBlockId(nextDraft.sections.body.blockIds[0] ?? null);
    setSelectedSection('body');
    setSampleDocumentId('');
  }, [createEntityType, mode, templateId, templates]);

  const filteredTemplates = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return [...templates]
      .filter((template) => {
        if (entityFilter !== 'all' && template.entityType !== entityFilter) {
          return false;
        }

        if (statusFilter !== 'all' && template.status !== statusFilter) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        const entityLabel = getPrintEntityRegistryItem(template.entityType)?.label ?? template.entityType;
        return template.name.toLowerCase().includes(normalizedSearch) || entityLabel.toLowerCase().includes(normalizedSearch);
      })
      .sort((left, right) => {
        if (sortKey === 'name') {
          return left.name.localeCompare(right.name);
        }

        return right[sortKey].localeCompare(left[sortKey]);
      });
  }, [entityFilter, search, sortKey, statusFilter, templates]);

  const selectedBlock = draft && selectedBlockId ? draft.blocks[selectedBlockId] ?? null : null;
  const registryItem = draft ? getPrintEntityRegistryItem(draft.entityType) : null;
  const sampleDocument = draft ? loadSampleDocumentForEntity(draft.entityType, sampleDocumentId) : null;
  const editorPreviewModel = draft && sampleDocument ? renderTemplatePreview(draft, sampleDocument) : null;
  const currentSampleDocuments = registryItem?.sampleDocuments ?? [];

  const stats = useMemo(
    () => ({
      total: templates.length,
      active: templates.filter((template) => template.status === 'active').length,
      default: templates.filter((template) => template.isDefault && template.status !== 'archived').length,
      archived: templates.filter((template) => template.status === 'archived').length,
    }),
    [templates]
  );

  const validationMessage = useMemo(() => {
    if (!draft) {
      return '';
    }
    if (!draft.name.trim()) {
      return 'Template name is required.';
    }
    if (!draft.entityType) {
      return 'Document/entity type is required.';
    }
    const totalBlocks = Object.values(draft.sections).reduce((count, section) => count + section.blockIds.length, 0);
    if (totalBlocks === 0) {
      return 'Add at least one printable block before saving.';
    }
    return '';
  }, [draft]);

  const goBack = () => {
    if (mode === 'editor') {
      navigateToHash('#/profile/print-builder');
      return;
    }

    if (onBack) {
      onBack();
      return;
    }

    navigate(-1);
  };

  const openEditor = (nextTemplateId?: string, entityType?: PrintEntityType) => {
    const nextQuery = new URLSearchParams();
    if (nextTemplateId) {
      nextQuery.set('templateId', nextTemplateId);
    }
    if (entityType) {
      nextQuery.set('entityType', entityType);
    }
    navigateToHash(`#/profile/print-builder/edit${nextQuery.toString() ? `?${nextQuery.toString()}` : ''}`);
  };

  const updateDraft = (updater: (currentDraft: PrintTemplateRecord) => PrintTemplateRecord) => {
    setDraft((currentDraft) => (currentDraft ? updater(currentDraft) : currentDraft));
  };

  const addBlock = (block: PrintBlockConfig) => {
    updateDraft((currentDraft) => ({
      ...currentDraft,
      blocks: {
        ...currentDraft.blocks,
        [block.id]: block,
      },
      sections: {
        ...currentDraft.sections,
        [block.section]: {
          ...currentDraft.sections[block.section],
          blockIds: [...currentDraft.sections[block.section].blockIds, block.id],
        },
      },
      updatedAt: new Date().toISOString(),
    }));
    setSelectedBlockId(block.id);
    setSelectedSection(block.section);
  };

  const addTextBlock = () =>
    addBlock({
      id: createBlockId(),
      type: 'text',
      section: selectedSection,
      title: 'Text',
      content: 'New text block',
      style: { fontSize: 13, widthMode: 'full', margin: 4 },
    });

  const addFieldBlock = (token: string, label: string) =>
    addBlock({
      id: createBlockId(),
      type: 'field',
      section: selectedSection,
      title: label,
      token,
      style: { fontSize: 13, widthMode: 'half', margin: 4 },
    });

  const addImageBlock = () =>
    addBlock({
      id: createBlockId(),
      type: 'image',
      section: selectedSection,
      title: 'Image',
      style: { widthMode: 'half', margin: 4 },
    });

  const addDividerBlock = () =>
    addBlock({
      id: createBlockId(),
      type: 'divider',
      section: selectedSection,
      title: 'Divider',
      thickness: 1,
      style: { widthMode: 'full', margin: 4, borderColor: '#d7deea' },
    });

  const addTableBlock = (collectionKey?: string) => {
    const tableCollection = registryItem?.tableCollections.find((collection) => collection.key === collectionKey) ?? registryItem?.tableCollections[0];
    if (!tableCollection) {
      return;
    }

    addBlock({
      id: createBlockId(),
      type: 'table',
      section: selectedSection,
      title: tableCollection.label,
      collectionKey: tableCollection.key,
      columns: tableCollection.columns.slice(0, 6).map((column) => column.token),
      showTotals: true,
      style: { widthMode: 'full', margin: 6 },
    });
  };

  const addSignatureBlock = () =>
    addBlock({
      id: createBlockId(),
      type: 'signature',
      section: selectedSection,
      title: 'Signature',
      label: 'Authorized Signatory',
      style: { widthMode: 'half', textAlign: 'right', margin: 8 },
    });

  const addCopyLabelBlock = () =>
    addBlock({
      id: createBlockId(),
      type: 'copy-label',
      section: selectedSection,
      title: 'Copy label',
      style: { widthMode: 'half', textAlign: 'right', fontWeight: 600, margin: 4 },
    });

  const updateBlock = (blockId: string, updates: Partial<PrintBlockConfig>) => {
    updateDraft((currentDraft) => ({
      ...currentDraft,
      blocks: {
        ...currentDraft.blocks,
        [blockId]: {
          ...currentDraft.blocks[blockId],
          ...updates,
        } as PrintBlockConfig,
      },
      updatedAt: new Date().toISOString(),
    }));
  };

  const moveBlockToSection = (blockId: string, nextSection: PrintSectionId) => {
    updateDraft((currentDraft) => {
      const currentBlock = currentDraft.blocks[blockId];
      if (!currentBlock) {
        return currentDraft;
      }

      const previousSection = currentBlock.section;
      if (previousSection === nextSection) {
        return currentDraft;
      }

      return {
        ...currentDraft,
        blocks: {
          ...currentDraft.blocks,
          [blockId]: {
            ...currentBlock,
            section: nextSection,
          },
        },
        sections: {
          ...currentDraft.sections,
          [previousSection]: {
            ...currentDraft.sections[previousSection],
            blockIds: currentDraft.sections[previousSection].blockIds.filter((id) => id !== blockId),
          },
          [nextSection]: {
            ...currentDraft.sections[nextSection],
            blockIds: [...currentDraft.sections[nextSection].blockIds, blockId],
          },
        },
      };
    });
    setSelectedSection(nextSection);
  };

  const removeBlock = (blockId: string) => {
    updateDraft((currentDraft) => {
      const nextBlocks = { ...currentDraft.blocks };
      const nextBlock = nextBlocks[blockId];
      if (!nextBlock) {
        return currentDraft;
      }

      delete nextBlocks[blockId];

      return {
        ...currentDraft,
        blocks: nextBlocks,
        sections: {
          ...currentDraft.sections,
          [nextBlock.section]: {
            ...currentDraft.sections[nextBlock.section],
            blockIds: currentDraft.sections[nextBlock.section].blockIds.filter((id) => id !== blockId),
          },
        },
        updatedAt: new Date().toISOString(),
      };
    });
    setSelectedBlockId(null);
  };

  const updateCopyMode = (modeValue: PrintTemplateRecord['copyConfig']['mode']) => {
    updateDraft((currentDraft) => {
      const labelsByMode: Record<typeof modeValue, string[]> = {
        single: ['Original'],
        duplicate: ['Original for Customer', 'Duplicate for Accounts'],
        triplicate: ['Original for Customer', 'Duplicate for Accounts', 'Triplicate for Transporter'],
        custom: currentDraft.copyConfig.labels.map((copy) => copy.label).filter(Boolean),
      };

      return {
        ...currentDraft,
        copyConfig: {
          mode: modeValue,
          labels: (labelsByMode[modeValue].length > 0 ? labelsByMode[modeValue] : ['Original']).map((label, index) => ({
            id: currentDraft.copyConfig.labels[index]?.id ?? `copy-${index + 1}`,
            label,
          })),
        },
      };
    });
  };

  const saveCurrentDraft = (status: PrintTemplateRecord['status']) => {
    if (!draft || validationMessage) {
      return;
    }

    const persistedTemplate = savePrintTemplate({
      ...draft,
      status,
      updatedBy: 'Alex Kumar',
      updatedAt: new Date().toISOString(),
    });
    setMessage(status === 'draft' ? `${persistedTemplate.name} saved as draft.` : `${persistedTemplate.name} activated.`);
    setTemplates(loadPrintTemplates());
    openEditor(persistedTemplate.id);
  };

  const publishAndSetDefault = () => {
    if (!draft || validationMessage) {
      return;
    }

    const persistedTemplate = savePrintTemplate({
      ...draft,
      status: 'active',
      updatedBy: 'Alex Kumar',
      updatedAt: new Date().toISOString(),
    });
    const defaultTemplate = draft.isDefault ? setDefaultPrintTemplate(persistedTemplate.id) : persistedTemplate;
    setTemplates(loadPrintTemplates());
    setMessage(
      draft.isDefault
        ? `${defaultTemplate?.name ?? persistedTemplate.name} activated as the default layout.`
        : `${persistedTemplate.name} activated.`
    );
    openEditor(persistedTemplate.id);
  };

  const handleLogoUpload = (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file || !draft) {
      return;
    }

    if (!['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'].includes(file.type)) {
      setMessage('Logo must be a PNG, JPG, SVG, or WebP file.');
      return;
    }

    if (file.size > 512 * 1024) {
      setMessage('Logo file must be 512 KB or smaller.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateDraft((currentDraft) => ({
        ...currentDraft,
        logoDataUrl: typeof reader.result === 'string' ? reader.result : undefined,
        logoName: file.name,
      }));
      setMessage(`${file.name} uploaded.`);
    };
    reader.readAsDataURL(file);
  };

  const previewableTemplate = mode === 'editor' ? (isEditorPreviewOpen ? draft : null) : previewTemplate;
  const previewableModel = previewableTemplate
    ? renderTemplatePreview(
        previewableTemplate,
        loadSampleDocumentForEntity(
          previewableTemplate.entityType,
          mode === 'editor' ? sampleDocumentId : undefined
        ) ?? {}
      )
    : null;

  return (
    <AppShell activeLeaf={null} contentClassName="print-builder-shell">
      {mode === 'editor' && (
          <section className="create-pr-header print-builder-header">
            <div className="create-pr-header__top print-builder-header__top">
              <div className="create-pr-header__title-group print-builder-header__title-group">
                <button type="button" className="page-back-button create-pr-header__back" onClick={goBack} aria-label="Back">
                  <ArrowLeft size={18} />
                </button>
              <div className="create-pr-header__title-wrap">
                <div className="print-builder-header__eyebrow">Print Builder</div>
                <div className="create-pr-header__title-row">
                  <h1 className="brand-page-title create-pr-header__title">
                    {draft?.name || 'Create print layout'}
                  </h1>
                  {draft?.status && (
                    <span className="create-pr-header__status">
                      {draft.status === 'active' ? 'Active' : 'Draft'}
                    </span>
                  )}
                </div>
                <p className="brand-page-subtitle print-builder-header__subtitle">
                  Build a structured print layout with reusable fields, tables, copies, and brand assets.
                </p>
                {message && <div className="print-builder-header__message">{message}</div>}
              </div>
            </div>

            <div className="print-builder-header__action-group">
              <button
                type="button"
                className="btn btn--outline btn--icon-left"
                onClick={() => draft && setIsEditorPreviewOpen(true)}
                disabled={!editorPreviewModel}
              >
                <Eye size={15} />
                Preview
              </button>
              <button type="button" className="btn btn--outline btn--icon-left" onClick={() => saveCurrentDraft('draft')} disabled={Boolean(validationMessage)}>
                <Save size={15} />
                Save Draft
              </button>
              <button type="button" className="btn btn--primary btn--icon-left" onClick={publishAndSetDefault} disabled={Boolean(validationMessage)}>
                <CheckCircle2 size={15} />
                Save & Activate
              </button>
            </div>
          </div>
        </section>
      )}

      <main className="print-builder">
        {mode === 'catalogue' ? (
          <section className="print-builder__hero">
            <div className="print-builder__hero-copy">
              <button type="button" className="page-back-button" onClick={goBack} aria-label="Back">
                <ArrowLeft size={18} />
              </button>
              <div>
                <span className="print-builder__eyebrow">Print Builder</span>
                <h1 className="brand-page-title">Print layouts</h1>
                <p className="brand-page-subtitle">
                  Create, manage, and activate reusable print layouts for every core document.
                </p>
              </div>
            </div>

            <div className="print-builder__hero-actions">
              {message && <span className="print-builder__message">{message}</span>}
              <button type="button" className="btn btn--primary btn--icon-left" onClick={() => openEditor(undefined, createEntityType)}>
                <Plus size={15} />
                Create layout
              </button>
            </div>
          </section>
        ) : null}

        {mode === 'catalogue' ? (
          <>
            <section className="print-builder__stats">
              <article className="print-builder__stat-card">
                <span>Templates</span>
                <strong>{stats.total}</strong>
              </article>
              <article className="print-builder__stat-card">
                <span>Active</span>
                <strong>{stats.active}</strong>
              </article>
              <article className="print-builder__stat-card">
                <span>Defaults</span>
                <strong>{stats.default}</strong>
              </article>
              <article className="print-builder__stat-card">
                <span>Archived</span>
                <strong>{stats.archived}</strong>
              </article>
            </section>

            <section className="print-builder__panel">
              <div className="print-builder__toolbar">
                <div className="print-builder__search">
                  <Search size={16} />
                  <input
                    type="text"
                    value={search}
                    placeholder="Search layouts"
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>

                <select value={entityFilter} onChange={(event) => setEntityFilter(event.target.value as 'all' | PrintEntityType)}>
                  <option value="all">All document types</option>
                  {printEntityRegistry.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>

                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as (typeof statusFilterOptions)[number])}>
                  {statusFilterOptions.map((value) => (
                    <option key={value} value={value}>
                      {value === 'all' ? 'All statuses' : value}
                    </option>
                  ))}
                </select>

                <select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)}>
                  <option value="updatedAt">Recently updated</option>
                  <option value="createdAt">Recently created</option>
                  <option value="name">Name</option>
                </select>
              </div>

              {filteredTemplates.length === 0 ? (
                <div className="print-builder__empty">
                  <LayoutTemplate size={28} />
                  <h3>No print layouts yet</h3>
                  <p>Create the first reusable print layout for your current document modules.</p>
                  <button type="button" className="btn btn--primary" onClick={() => openEditor(undefined, createEntityType)}>
                    Create first layout
                  </button>
                </div>
              ) : (
                <div className="print-builder__table-wrap">
                  <table className="brand-table print-builder__table">
                    <thead className="brand-table-head">
                      <tr>
                        <th>Template</th>
                        <th>Document Type</th>
                        <th>Status</th>
                        <th>Default</th>
                        <th>Created By</th>
                        <th>Created</th>
                        <th>Updated</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTemplates.map((template) => {
                        const entity = getPrintEntityRegistryItem(template.entityType);
                        const { dateLabel: createdDate, timeLabel: createdTime } = formatDateTime(template.createdAt);
                        const { dateLabel: updatedDate, timeLabel: updatedTime } = formatDateTime(template.updatedAt);

                        return (
                          <tr key={template.id}>
                            <td>
                              <div className="print-builder__template-cell">
                                <strong>{template.name}</strong>
                                <span>{template.description || 'No description added.'}</span>
                              </div>
                            </td>
                            <td>{entity?.label ?? template.entityType}</td>
                            <td>
                              <span className={cn('brand-badge', template.status === 'active' && 'brand-badge--approved', template.status === 'draft' && 'brand-badge--draft', template.status === 'inactive' && 'brand-badge--pending', template.status === 'archived' && 'brand-badge--cancelled')}>
                                {template.status}
                              </span>
                            </td>
                            <td>{template.isDefault ? <span className="brand-badge brand-badge--draft">Default</span> : '-'}</td>
                            <td>{template.createdBy}</td>
                            <td>{createdDate}, {createdTime}</td>
                            <td>{updatedDate}, {updatedTime}</td>
                            <td>
                              <div className="print-builder__row-actions">
                                <button type="button" className="btn btn--outline btn--sm" onClick={() => setPreviewTemplate(template)}>
                                  <Eye size={14} />
                                </button>
                                <button type="button" className="btn btn--outline btn--sm" onClick={() => openEditor(template.id)}>
                                  <FileText size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn--outline btn--sm"
                                  onClick={() => {
                                    const duplicated = duplicateTemplate(template);
                                    setTemplates(loadPrintTemplates());
                                    if (duplicated) {
                                      setMessage(`${duplicated.name} created.`);
                                    }
                                  }}
                                >
                                  <Copy size={14} />
                                </button>
                                <button type="button" className="btn btn--outline btn--sm" onClick={() => setArchiveTarget(template)}>
                                  <Trash2 size={14} />
                                </button>
                                {!template.isDefault && template.status === 'active' && (
                                  <button
                                    type="button"
                                    className="btn btn--primary btn--sm"
                                    onClick={() => {
                                      const nextTemplate = setDefaultPrintTemplate(template.id);
                                      setTemplates(loadPrintTemplates());
                                      if (nextTemplate) {
                                        setMessage(`${nextTemplate.name} is now the default ${entity?.label ?? 'document'} layout.`);
                                      }
                                    }}
                                  >
                                    Set default
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        ) : (
          draft && (
            <section className="print-builder__editor">
              <aside className="print-builder__editor-panel print-builder__editor-panel--left">
                <div className="print-builder__panel-head">
                  <h3>Fields & blocks</h3>
                  <p>Select a section, then add printable blocks.</p>
                </div>

                <div className="print-builder__section-picker">
                  {(['header', 'body', 'footer'] as PrintSectionId[]).map((sectionId) => (
                    <button
                      key={sectionId}
                      type="button"
                      className={cn('print-builder__section-chip', selectedSection === sectionId && 'print-builder__section-chip--active')}
                      onClick={() => setSelectedSection(sectionId)}
                    >
                      {draft.sections[sectionId].label}
                    </button>
                  ))}
                </div>

                <div className="print-builder__block-actions">
                  <button type="button" className="btn btn--outline btn--sm" onClick={addTextBlock}>Text</button>
                  <button type="button" className="btn btn--outline btn--sm" onClick={addImageBlock}>Image</button>
                  <button type="button" className="btn btn--outline btn--sm" onClick={addDividerBlock}>Divider</button>
                  <button type="button" className="btn btn--outline btn--sm" onClick={() => addTableBlock()}>Table</button>
                  <button type="button" className="btn btn--outline btn--sm" onClick={addSignatureBlock}>Signature</button>
                  <button type="button" className="btn btn--outline btn--sm" onClick={addCopyLabelBlock}>Copy label</button>
                </div>

                <div className="print-builder__logo-uploader">
                  <div className="print-builder__logo-preview">
                    {draft.logoDataUrl ? <img src={draft.logoDataUrl} alt={draft.logoName || 'Template logo'} /> : <ImagePlus size={18} />}
                  </div>
                  <div className="print-builder__logo-copy">
                    <strong>Template logo</strong>
                    <p>PNG, JPG, SVG, or WebP up to 512 KB.</p>
                    {draft.logoName && <span>{draft.logoName}</span>}
                  </div>
                  <label className="btn btn--outline btn--sm print-builder__upload-button">
                    <Upload size={14} />
                    Upload
                    <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="sr-only" onChange={(event) => handleLogoUpload(event.target.files)} />
                  </label>
                </div>

                {registryItem?.fieldGroups.map((group) => (
                  <section key={group.id} className="print-builder__field-group">
                    <div className="print-builder__field-group-title">{group.label}</div>
                    <div className="print-builder__field-list">
                      {group.fields.map((field) => (
                        <button key={field.token} type="button" className="print-builder__field-pill" onClick={() => addFieldBlock(field.token, field.label)}>
                          {field.label}
                        </button>
                      ))}
                    </div>
                  </section>
                ))}

                {registryItem?.tableCollections.length ? (
                  <section className="print-builder__field-group">
                    <div className="print-builder__field-group-title">Line sections</div>
                    <div className="print-builder__field-list">
                      {registryItem.tableCollections.map((collection) => (
                        <button key={collection.key} type="button" className="print-builder__field-pill" onClick={() => addTableBlock(collection.key)}>
                          {collection.label}
                        </button>
                      ))}
                    </div>
                  </section>
                ) : null}
              </aside>

              <div className="print-builder__editor-canvas">
                <div className="print-builder__canvas-toolbar">
                  <FormField label="Document type">
                    <Select
                      value={draft.entityType}
                      onChange={(event) => {
                        const nextEntityType = event.target.value as PrintEntityType;
                        const nextDraft = createPrintTemplateDraft(nextEntityType);
                        setDraft({
                          ...nextDraft,
                          id: draft.id,
                          name: draft.name || nextDraft.name,
                          description: draft.description,
                          status: draft.status,
                          isDefault: draft.isDefault,
                        });
                        setSelectedBlockId(nextDraft.sections.body.blockIds[0] ?? null);
                        setSelectedSection('body');
                      }}
                    >
                      {printEntityRegistry.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label="Preview sample">
                    <Select value={sampleDocumentId} onChange={(event) => setSampleDocumentId(event.target.value)}>
                      <option value="">Default sample</option>
                      {currentSampleDocuments.map((sample) => (
                        <option key={(sample as { id: string }).id} value={(sample as { id: string }).id}>
                          {String((sample as { number?: string }).number ?? (sample as { id: string }).id)}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                </div>

                {validationMessage && <div className="brand-message brand-message--error">{validationMessage}</div>}

                <div className="print-builder__canvas-sheet">
                  {(['header', 'body', 'footer'] as PrintSectionId[]).map((sectionId) => (
                    <section
                      key={sectionId}
                      className="print-builder__canvas-section"
                      onDragOver={(event) => {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = 'move';
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        const blockId = event.dataTransfer.getData('text/plain');
                        if (!blockId) {
                          return;
                        }
                        moveBlockToSection(blockId, sectionId);
                      }}
                    >
                      <div className="print-builder__canvas-section-head">
                        <strong>{draft.sections[sectionId].label}</strong>
                        <span>{draft.sections[sectionId].blockIds.length} block(s)</span>
                      </div>

                      <div className="print-builder__canvas-section-body">
                        {draft.sections[sectionId].blockIds.map((blockId) => {
                          const block = draft.blocks[blockId];
                          return (
                            <button
                              key={blockId}
                              type="button"
                              draggable
                              onDragStart={(event) => {
                                event.dataTransfer.effectAllowed = 'move';
                                event.dataTransfer.setData('text/plain', blockId);
                              }}
                              className={cn('print-builder__canvas-block', selectedBlockId === blockId && 'print-builder__canvas-block--active')}
                              onClick={() => {
                                setSelectedBlockId(blockId);
                                setSelectedSection(sectionId);
                              }}
                            >
                              <span className="print-builder__canvas-block-grip">
                                <GripVertical size={14} />
                              </span>
                              <span className="print-builder__canvas-block-copy">
                                <strong>{block.title}</strong>
                                <small>{block.type}</small>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>

              </div>

              <aside className="print-builder__editor-panel print-builder__editor-panel--right">
                <div className="print-builder__panel-head">
                  <h3>Template settings</h3>
                  <p>Configure page setup, copy labels, and selected block properties.</p>
                </div>

                <div className="print-builder__form-stack">
                  <FormField label="Template name" required>
                    <Input value={draft.name} onChange={(event) => updateDraft((currentDraft) => ({ ...currentDraft, name: event.target.value }))} />
                  </FormField>

                  <FormField label="Description">
                    <Textarea value={draft.description} onChange={(event) => updateDraft((currentDraft) => ({ ...currentDraft, description: event.target.value }))} rows={3} />
                  </FormField>

                  <label className="print-builder__toggle">
                    <input type="checkbox" checked={draft.isDefault} onChange={(event) => updateDraft((currentDraft) => ({ ...currentDraft, isDefault: event.target.checked }))} />
                    <span>Mark as default for this document type</span>
                  </label>

                  <div className="print-builder__form-grid">
                    <FormField label="Page size">
                      <Select value={draft.page.size} onChange={(event) => updateDraft((currentDraft) => ({ ...currentDraft, page: { ...currentDraft.page, size: event.target.value as PrintTemplateRecord['page']['size'] } }))}>
                        {pageSizeOptions.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                    <FormField label="Orientation">
                      <Select value={draft.page.orientation} onChange={(event) => updateDraft((currentDraft) => ({ ...currentDraft, page: { ...currentDraft.page, orientation: event.target.value as PrintTemplateRecord['page']['orientation'] } }))}>
                        {orientationOptions.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                  </div>

                  <div className="print-builder__form-grid print-builder__form-grid--margins">
                    <FormField label="Top margin (mm)">
                      <Input value={String(draft.page.margins.top)} onChange={(event) => updateDraft((currentDraft) => ({ ...currentDraft, page: { ...currentDraft.page, margins: { ...currentDraft.page.margins, top: Number(event.target.value) || 0 } } }))} />
                    </FormField>
                    <FormField label="Right margin (mm)">
                      <Input value={String(draft.page.margins.right)} onChange={(event) => updateDraft((currentDraft) => ({ ...currentDraft, page: { ...currentDraft.page, margins: { ...currentDraft.page.margins, right: Number(event.target.value) || 0 } } }))} />
                    </FormField>
                    <FormField label="Bottom margin (mm)">
                      <Input value={String(draft.page.margins.bottom)} onChange={(event) => updateDraft((currentDraft) => ({ ...currentDraft, page: { ...currentDraft.page, margins: { ...currentDraft.page.margins, bottom: Number(event.target.value) || 0 } } }))} />
                    </FormField>
                    <FormField label="Left margin (mm)">
                      <Input value={String(draft.page.margins.left)} onChange={(event) => updateDraft((currentDraft) => ({ ...currentDraft, page: { ...currentDraft.page, margins: { ...currentDraft.page.margins, left: Number(event.target.value) || 0 } } }))} />
                    </FormField>
                  </div>

                  <FormField label="Copy mode">
                    <Select value={draft.copyConfig.mode} onChange={(event) => updateCopyMode(event.target.value as PrintTemplateRecord['copyConfig']['mode'])}>
                      {copyModeOptions.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </Select>
                  </FormField>

                  <div className="print-builder__copy-list">
                    {draft.copyConfig.labels.map((copy, index) => (
                      <FormField key={copy.id} label={`Copy label ${index + 1}`}>
                        <Input
                          value={copy.label}
                          onChange={(event) =>
                            updateDraft((currentDraft) => ({
                              ...currentDraft,
                              copyConfig: {
                                ...currentDraft.copyConfig,
                                labels: currentDraft.copyConfig.labels.map((item) =>
                                  item.id === copy.id ? { ...item, label: event.target.value } : item
                                ),
                              },
                            }))
                          }
                          disabled={draft.copyConfig.mode !== 'custom'}
                        />
                      </FormField>
                    ))}
                  </div>

                  {selectedBlock && (
                    <section className="print-builder__selected-block">
                      <div className="print-builder__panel-head print-builder__panel-head--nested">
                        <h3>Selected block</h3>
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => removeBlock(selectedBlock.id)}>
                          Remove
                        </button>
                      </div>

                      <FormField label="Title">
                        <Input value={selectedBlock.title} onChange={(event) => updateBlock(selectedBlock.id, { title: event.target.value } as Partial<PrintBlockConfig>)} />
                      </FormField>

                      <FormField label="Section">
                        <Select value={selectedBlock.section} onChange={(event) => moveBlockToSection(selectedBlock.id, event.target.value as PrintSectionId)}>
                          {(['header', 'body', 'footer'] as PrintSectionId[]).map((sectionId) => (
                            <option key={sectionId} value={sectionId}>
                              {draft.sections[sectionId].label}
                            </option>
                          ))}
                        </Select>
                      </FormField>

                      {'content' in selectedBlock && (
                        <FormField label="Text content">
                          <Textarea value={selectedBlock.content} onChange={(event) => updateBlock(selectedBlock.id, { content: event.target.value } as Partial<PrintBlockConfig>)} rows={3} />
                        </FormField>
                      )}

                      {'token' in selectedBlock && (
                        <>
                          <FormField label="Field">
                            <Select value={selectedBlock.token} onChange={(event) => updateBlock(selectedBlock.id, { token: event.target.value } as Partial<PrintBlockConfig>)}>
                              {registryItem?.fieldGroups.flatMap((group) => group.fields.map((field) => toFieldOption(field.token, `${group.label} • ${field.label}`))).map((field) => (
                                <option key={field.value} value={field.value}>
                                  {field.label}
                                </option>
                              ))}
                            </Select>
                          </FormField>
                          <div className="print-builder__form-grid">
                            <FormField label="Prefix">
                              <Input value={selectedBlock.prefix || ''} onChange={(event) => updateBlock(selectedBlock.id, { prefix: event.target.value } as Partial<PrintBlockConfig>)} />
                            </FormField>
                            <FormField label="Suffix">
                              <Input value={selectedBlock.suffix || ''} onChange={(event) => updateBlock(selectedBlock.id, { suffix: event.target.value } as Partial<PrintBlockConfig>)} />
                            </FormField>
                          </div>
                        </>
                      )}

                      {'collectionKey' in selectedBlock && (
                        <>
                          <FormField label="Line collection">
                            <Select value={selectedBlock.collectionKey} onChange={(event) => updateBlock(selectedBlock.id, { collectionKey: event.target.value } as Partial<PrintBlockConfig>)}>
                              {registryItem?.tableCollections.map((collection) => (
                                <option key={collection.key} value={collection.key}>
                                  {collection.label}
                                </option>
                              ))}
                            </Select>
                          </FormField>
                          <div className="print-builder__checkbox-list">
                            {(registryItem?.tableCollections.find((collection) => collection.key === selectedBlock.collectionKey)?.columns ?? []).map((column) => (
                              <label key={column.token} className="print-builder__checkbox-row">
                                <input
                                  type="checkbox"
                                  checked={selectedBlock.columns.includes(column.token)}
                                  onChange={(event) =>
                                    updateBlock(
                                      selectedBlock.id,
                                      {
                                        columns: event.target.checked
                                          ? [...selectedBlock.columns, column.token]
                                          : selectedBlock.columns.filter((value) => value !== column.token),
                                      } as Partial<PrintBlockConfig>
                                    )
                                  }
                                />
                                <span>{column.label}</span>
                              </label>
                            ))}
                          </div>
                        </>
                      )}

                      {'label' in selectedBlock && (
                        <FormField label="Signature label">
                          <Input value={selectedBlock.label} onChange={(event) => updateBlock(selectedBlock.id, { label: event.target.value } as Partial<PrintBlockConfig>)} />
                        </FormField>
                      )}

                      {'assetDataUrl' in selectedBlock && (
                        <>
                          <div className="print-builder__logo-uploader print-builder__logo-uploader--block">
                            <div className="print-builder__logo-preview">
                              {selectedBlock.assetDataUrl || draft.logoDataUrl ? (
                                <img src={selectedBlock.assetDataUrl || draft.logoDataUrl} alt={selectedBlock.altText || selectedBlock.title} />
                              ) : (
                                <ImagePlus size={18} />
                              )}
                            </div>
                            <label className="btn btn--outline btn--sm print-builder__upload-button">
                              Replace image
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                                className="sr-only"
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  if (!file) {
                                    return;
                                  }
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    updateBlock(selectedBlock.id, { assetDataUrl: typeof reader.result === 'string' ? reader.result : undefined } as Partial<PrintBlockConfig>);
                                  };
                                  reader.readAsDataURL(file);
                                }}
                              />
                            </label>
                          </div>
                          <FormField label="Alt text">
                            <Input value={selectedBlock.altText || ''} onChange={(event) => updateBlock(selectedBlock.id, { altText: event.target.value } as Partial<PrintBlockConfig>)} />
                          </FormField>
                        </>
                      )}

                      <div className="print-builder__form-grid">
                        <FormField label="Font size">
                          <Input value={String(selectedBlock.style.fontSize ?? 13)} onChange={(event) => updateBlock(selectedBlock.id, { style: { ...selectedBlock.style, fontSize: Number(event.target.value) || 13 } } as Partial<PrintBlockConfig>)} />
                        </FormField>
                        <FormField label="Font weight">
                          <Select value={String(selectedBlock.style.fontWeight ?? 500)} onChange={(event) => updateBlock(selectedBlock.id, { style: { ...selectedBlock.style, fontWeight: Number(event.target.value) as 400 | 500 | 600 | 700 } } as Partial<PrintBlockConfig>)}>
                            {fontWeightOptions.map((value) => (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            ))}
                          </Select>
                        </FormField>
                      </div>

                      <div className="print-builder__form-grid">
                        <FormField label="Alignment">
                          <Select value={selectedBlock.style.textAlign ?? 'left'} onChange={(event) => updateBlock(selectedBlock.id, { style: { ...selectedBlock.style, textAlign: event.target.value as 'left' | 'center' | 'right' } } as Partial<PrintBlockConfig>)}>
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                          </Select>
                        </FormField>
                        <FormField label="Width">
                          <Select value={selectedBlock.style.widthMode ?? 'full'} onChange={(event) => updateBlock(selectedBlock.id, { style: { ...selectedBlock.style, widthMode: event.target.value as 'auto' | 'full' | 'half' } } as Partial<PrintBlockConfig>)}>
                            <option value="auto">Auto</option>
                            <option value="full">Full</option>
                            <option value="half">Half</option>
                          </Select>
                        </FormField>
                      </div>

                      <div className="print-builder__form-grid print-builder__form-grid--colors">
                        <FormField label="Text color">
                          <Input value={selectedBlock.style.color || '#0f172a'} onChange={(event) => updateBlock(selectedBlock.id, { style: { ...selectedBlock.style, color: event.target.value } } as Partial<PrintBlockConfig>)} />
                        </FormField>
                        <FormField label="Background">
                          <Input value={selectedBlock.style.backgroundColor || ''} onChange={(event) => updateBlock(selectedBlock.id, { style: { ...selectedBlock.style, backgroundColor: event.target.value } } as Partial<PrintBlockConfig>)} />
                        </FormField>
                      </div>
                    </section>
                  )}
                </div>
              </aside>
            </section>
          )
        )}

        <SideDrawer
          isOpen={Boolean(previewableTemplate && previewableModel)}
          title={previewableTemplate?.name ?? 'Print Preview'}
          subtitle={getPrintEntityRegistryItem(previewableTemplate?.entityType ?? createEntityType)?.label}
          onClose={() => {
            setPreviewTemplate(null);
            setIsEditorPreviewOpen(false);
          }}
          panelClassName="side-drawer__panel--wide print-builder__preview-drawer"
        >
          {previewableModel ? (
            <div className="print-builder__preview-drawer-content">
              <PrintTemplateDocument model={previewableModel} />
            </div>
          ) : null}
        </SideDrawer>

        <ConfirmationDialog
          isOpen={Boolean(archiveTarget)}
          title="Archive print layout?"
          description={archiveTarget ? `${archiveTarget.name} will no longer be available in print selections.` : ''}
          confirmLabel="Archive"
          cancelLabel="Keep layout"
          onConfirm={() => {
            if (!archiveTarget) {
              return;
            }
            archivePrintTemplate(archiveTarget.id);
            setTemplates(loadPrintTemplates());
            setMessage(`${archiveTarget.name} archived.`);
            setArchiveTarget(null);
          }}
          onClose={() => setArchiveTarget(null)}
        />
      </main>
    </AppShell>
  );
};

export default PrintBuilder;
