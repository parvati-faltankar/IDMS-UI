import React, { useEffect, useMemo, useState } from 'react';
import {
  Ban,
  CheckCircle2,
  ChevronsLeftRight,
  Eye,
  FileText,
  Palette,
  PencilLine,
  Plus,
  RotateCcw,
  Save,
  Search,
  SlidersHorizontal,
  X,
  Upload,
} from 'lucide-react';
import AppShell from '../../components/common/AppShell';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import { FormField, Input, Select, Textarea } from '../../components/common/FormControls';
import { useTheme } from '../../theme/useTheme';
import {
  createThemeDraft,
  getAllowedThemeFonts,
  isValidHexColor,
  loadThemeBuilderThemes,
  saveThemeBuilderThemes,
  upsertThemeBuilderTheme,
  type ThemeBuilderColors,
  type ThemeBuilderLayout,
  type ThemeBuilderStatus,
  type ThemeBuilderTheme,
  type ThemeBuilderTypography,
} from '../../theme/customThemeBuilder';
import { themeRegistry } from '../../theme/themeRegistry';
import { cn } from '../../utils/classNames';
import { formatDate } from '../../utils/dateFormat';

interface ThemeBuilderProps {
  onBack?: () => void;
}

type ThemeBuilderMode = 'list' | 'form';
type SortKey = 'createdAt' | 'updatedAt';

type ListedTheme = ThemeBuilderTheme & { source?: 'built-in' | 'custom' };

const colorFields: Array<{ key: keyof ThemeBuilderColors; label: string; helper: string }> = [
  { key: 'primary', label: 'Primary', helper: 'Main brand and selected action color.' },
  { key: 'secondary', label: 'Secondary', helper: 'Secondary actions and accents.' },
  { key: 'accent', label: 'Accent', helper: 'Highlights, insights, and supporting UI.' },
  { key: 'background', label: 'Background', helper: 'Page and subtle surface background.' },
  { key: 'surface', label: 'Surface', helper: 'Cards, modals, and elevated panels.' },
  { key: 'textPrimary', label: 'Text primary', helper: 'Primary readable body text.' },
  { key: 'textSecondary', label: 'Text secondary', helper: 'Muted text, hints, and metadata.' },
  { key: 'border', label: 'Border', helper: 'Table, input, and panel borders.' },
  { key: 'error', label: 'Error', helper: 'Validation and destructive actions.' },
  { key: 'warning', label: 'Warning', helper: 'Pending or caution states.' },
  { key: 'success', label: 'Success', helper: 'Approved and positive states.' },
  { key: 'info', label: 'Info', helper: 'Informational states and links.' },
  { key: 'headerBackground', label: 'Header background', helper: 'Top navigation background.' },
  { key: 'sidebarBackground', label: 'Sidebar background', helper: 'Left navigation surface.' },
  { key: 'buttonBackground', label: 'Button background', helper: 'Primary button color.' },
  { key: 'link', label: 'Link', helper: 'Document links and clickable text.' },
];

function formatDateLabel(value: string) {
  return value ? formatDate(value) : '-';
}

function getBuiltInThemeList(): ListedTheme[] {
  return Object.values(themeRegistry).map((theme) => ({
    id: `built-in-${theme.key}`,
    key: theme.key,
    name: theme.label,
    shortLabel: theme.shortLabel,
    description: 'Built-in brand theme available in the header dropdown.',
    status: 'published',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    createdBy: 'System',
    logoDataUrl: theme.logoDataUrl,
    source: 'built-in',
    colors: {
      primary: theme.brandScale[500],
      secondary: theme.brandScale[400],
      accent: theme.brandScale[300],
      background: theme.brandScale[50],
      surface: '#ffffff',
      textPrimary: theme.brandScale[900],
      textSecondary: theme.brandScale[700],
      border: theme.brandScale[200],
      error: '#d14343',
      warning: '#d97706',
      success: '#15803d',
      info: theme.brandScale[600],
      headerBackground: theme.brandScale[500],
      sidebarBackground: '#ffffff',
      buttonBackground: theme.brandScale[500],
      link: theme.brandScale[600],
    },
    typography: {
      fontFamily: '"Noto Sans", sans-serif',
      headingFontFamily: '"Noto Sans", sans-serif',
      baseFontSize: '14',
      fontWeight: '500',
      lineHeight: '20',
      buttonTextTransform: 'none',
    },
    layout: {
      borderRadius: '8',
      buttonRadius: '8',
      cardRadius: '8',
      inputRadius: '8',
      spacingScale: '4',
      shadowStyle: 'medium',
    },
  }));
}

function createDraftFromListedTheme(theme: ListedTheme, customThemes: ThemeBuilderTheme[]) {
  const now = new Date().toISOString();
  const existingOverride = theme.source === 'built-in' ? customThemes.find((item) => item.key === theme.key) : null;

  if (existingOverride) {
    return {
      ...existingOverride,
      updatedAt: now,
    };
  }

  return {
    ...theme,
    id: theme.source === 'built-in' ? `built-in-override-${theme.key}` : theme.id,
    key: theme.key,
    name: theme.name,
    description:
      theme.source === 'built-in'
        ? `Editable configuration for the ${theme.name} header theme.`
        : theme.description,
    status: theme.source === 'built-in' ? 'draft' : theme.status,
    createdAt: theme.source === 'built-in' ? now : theme.createdAt,
    updatedAt: now,
    createdBy: 'Alex Kumar',
    source: 'custom' as const,
  };
}

function getStatusLabel(theme: ThemeBuilderTheme, activeThemeKey: string) {
  if (theme.status === 'published' && theme.key === activeThemeKey) {
    return 'Active';
  }

  if (theme.status === 'deactivated') {
    return 'Inactive';
  }

  return theme.status === 'published' ? 'Published' : 'Draft';
}

function ThemeStatusBadge({ theme, activeThemeKey }: { theme: ListedTheme; activeThemeKey: string }) {
  const label = getStatusLabel(theme, activeThemeKey);
  const tone =
    label === 'Active'
      ? 'brand-badge--approved'
      : label === 'Published'
        ? 'brand-badge--pending'
        : label === 'Inactive'
          ? 'brand-badge--cancelled'
          : 'brand-badge--draft';

  return <span className={cn('brand-badge theme-builder__status', tone)}>{label}</span>;
}

function ThemeColorPicker({
  field,
  value,
  onChange,
  error,
}: {
  field: (typeof colorFields)[number];
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <div className="theme-builder__color-field">
      <div className="theme-builder__color-head">
        <span className="theme-builder__color-swatch" style={{ background: value }} />
        <div>
          <strong>{field.label}</strong>
          <p>{field.helper}</p>
        </div>
      </div>
      <div className="theme-builder__color-control">
        <input
          type="color"
          value={isValidHexColor(value) ? value : '#000000'}
          onChange={(event) => onChange(event.target.value)}
          aria-label={`${field.label} color picker`}
        />
        <Input value={value} onChange={(event) => onChange(event.target.value)} error={error} aria-label={`${field.label} color value`} />
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

function ThemeLogoUploader({
  theme,
  onChange,
  error,
  onError,
}: {
  theme: ThemeBuilderTheme;
  onChange: (updates: Partial<ThemeBuilderTheme>) => void;
  error?: string;
  onError: (message: string) => void;
}) {
  const handleFileChange = (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) {
      return;
    }

    if (!['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'].includes(file.type)) {
      onError('Logo must be a PNG, JPG, SVG, or WebP file.');
      return;
    }

    if (file.size > 512 * 1024) {
      onError('Logo file must be 512 KB or smaller.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onChange({
        logoDataUrl: typeof reader.result === 'string' ? reader.result : undefined,
        logoName: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="theme-builder__logo-uploader">
      <div className="theme-builder__logo-preview">
        {theme.logoDataUrl ? (
          <img src={theme.logoDataUrl} alt={`${theme.name} logo preview`} />
        ) : (
          <span>{theme.shortLabel || 'TH'}</span>
        )}
      </div>
      <div className="theme-builder__logo-copy">
        <strong>Brand logo</strong>
        <p>PNG, JPG, SVG, or WebP. Maximum 512 KB.</p>
        {theme.logoName && <span>{theme.logoName}</span>}
        {error && <p className="field-error">{error}</p>}
        <div className="theme-builder__logo-actions">
          <label className="btn btn--outline btn--sm btn--icon-left">
            <Upload size={14} />
            Upload logo
            <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={(event) => handleFileChange(event.target.files)} />
          </label>
          {theme.logoDataUrl && (
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => onChange({ logoDataUrl: undefined, logoName: undefined })}>
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ThemeTypographySelector({
  typography,
  onChange,
}: {
  typography: ThemeBuilderTypography;
  onChange: (typography: ThemeBuilderTypography) => void;
}) {
  const fontOptions = getAllowedThemeFonts().map((font) => ({ value: font, label: font.replace(/"/g, '') }));

  return (
    <div className="theme-builder__form-grid">
      <FormField label="Body font" help="Controlled font list keeps the app safe and predictable.">
        <Select
          value={typography.fontFamily}
          onChange={(event) => onChange({ ...typography, fontFamily: event.target.value })}
          options={fontOptions}
        />
      </FormField>
      <FormField label="Heading font">
        <Select
          value={typography.headingFontFamily}
          onChange={(event) => onChange({ ...typography, headingFontFamily: event.target.value })}
          options={fontOptions}
        />
      </FormField>
      <FormField label="Base font size">
        <Input
          type="number"
          min={12}
          max={18}
          value={typography.baseFontSize}
          onChange={(event) => onChange({ ...typography, baseFontSize: event.target.value })}
        />
      </FormField>
      <FormField label="Font weight">
        <Select
          value={typography.fontWeight}
          onChange={(event) => onChange({ ...typography, fontWeight: event.target.value })}
          options={[
            { value: '400', label: 'Regular' },
            { value: '500', label: 'Medium' },
            { value: '600', label: 'Semibold' },
            { value: '700', label: 'Bold' },
          ]}
        />
      </FormField>
      <FormField label="Line height">
        <Input
          type="number"
          min={16}
          max={28}
          value={typography.lineHeight}
          onChange={(event) => onChange({ ...typography, lineHeight: event.target.value })}
        />
      </FormField>
      <FormField label="Button text style">
        <Select
          value={typography.buttonTextTransform}
          onChange={(event) => onChange({ ...typography, buttonTextTransform: event.target.value as ThemeBuilderTypography['buttonTextTransform'] })}
          options={[
            { value: 'none', label: 'Sentence case' },
            { value: 'uppercase', label: 'Uppercase' },
          ]}
        />
      </FormField>
    </div>
  );
}

function ThemePreview({ theme, isExpanded }: { theme: ListedTheme | ThemeBuilderTheme; isExpanded: boolean }) {
  const previewStyle = {
    '--preview-primary': theme.colors.primary,
    '--preview-secondary': theme.colors.secondary,
    '--preview-accent': theme.colors.accent,
    '--preview-bg': theme.colors.background,
    '--preview-surface': theme.colors.surface,
    '--preview-text': theme.colors.textPrimary,
    '--preview-muted': theme.colors.textSecondary,
    '--preview-border': theme.colors.border,
    '--preview-header': theme.colors.headerBackground,
    '--preview-sidebar': theme.colors.sidebarBackground,
    '--preview-button': theme.colors.buttonBackground,
    '--preview-link': theme.colors.link,
    '--preview-font': theme.typography.fontFamily,
    '--preview-radius': `${theme.layout.cardRadius}px`,
    '--preview-button-radius': `${theme.layout.buttonRadius}px`,
  } as React.CSSProperties;

  return (
    <section className={cn('theme-preview', isExpanded && 'theme-preview--expanded')} style={previewStyle}>
      <div className="theme-preview__flag">Preview only</div>
      <div className="theme-preview__topbar">
        <div className="theme-preview__brand">
          {theme.logoDataUrl ? <img src={theme.logoDataUrl} alt="" /> : <span>{theme.shortLabel || 'TH'}</span>}
          <strong>{theme.name || 'Theme preview'}</strong>
        </div>
        <button type="button">Primary action</button>
      </div>
      <div className="theme-preview__body">
        <aside className="theme-preview__sidebar">
          <span className="theme-preview__nav-active">Dashboard</span>
          <span>Documents</span>
          <span>Settings</span>
        </aside>
        <main className="theme-preview__content">
          <div className="theme-preview__card">
            <small>Live sample</small>
            <h3>Purchase workspace</h3>
            <p>This preview shows header, sidebar, cards, text, inputs, buttons, and status colors without applying the theme globally.</p>
            <div className="theme-preview__input">Search documents...</div>
            <div className="theme-preview__actions">
              <button type="button">Save</button>
              <a href="#theme-preview">Open document</a>
            </div>
          </div>
          <div className="theme-preview__swatches">
            {Object.entries(theme.colors).slice(0, 8).map(([key, color]) => (
              <span key={key} title={key} style={{ background: color }} />
            ))}
          </div>
        </main>
      </div>
    </section>
  );
}

function validateTheme(theme: ThemeBuilderTheme, allThemes: ListedTheme[], requirePublishFields: boolean) {
  const errors: Record<string, string> = {};
  if (!theme.name.trim()) {
    errors.name = 'Theme name is required.';
  }

  const duplicate = allThemes.some(
    (item) =>
      item.id !== theme.id &&
      item.key !== theme.key &&
      item.name.trim().toLowerCase() === theme.name.trim().toLowerCase()
  );
  if (duplicate) {
    errors.name = 'Theme name must be unique.';
  }

  Object.entries(theme.colors).forEach(([key, value]) => {
    if (!isValidHexColor(value)) {
      errors[`color:${key}`] = 'Use a valid HEX color.';
    }
  });

  if (requirePublishFields && !theme.shortLabel.trim()) {
    errors.shortLabel = 'Short label is required before publishing.';
  }

  return errors;
}

function ThemeForm({
  draft,
  themes,
  onChange,
  onSaveDraft,
  onPublish,
  onPreview,
  onBack,
  message,
  heading,
}: {
  draft: ThemeBuilderTheme;
  themes: ListedTheme[];
  onChange: (theme: ThemeBuilderTheme) => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  onPreview: () => void;
  onBack: () => void;
  message: string;
  heading: string;
}) {
  const [logoError, setLogoError] = useState('');
  const errors = validateTheme(draft, themes, true);
  const canPublish = Object.keys(errors).length === 0;

  const updateColors = (colors: ThemeBuilderColors) => onChange({ ...draft, colors });
  const updateLayout = (layout: ThemeBuilderLayout) => onChange({ ...draft, layout });

  return (
    <div className="theme-builder theme-builder--form">
      <section className="theme-builder__hero">
        <div>
          <span className="theme-builder__eyebrow">
            <Palette size={15} />
            Theme Builder
          </span>
          <h1 className="brand-page-title">{heading}</h1>
          <p>Create reusable brand themes and publish only when they are ready for the header dropdown.</p>
        </div>
        <div className="theme-builder__hero-actions">
          <button type="button" className="btn btn--outline btn--icon-left" onClick={onBack}>
            <RotateCcw size={15} />
            Cancel
          </button>
          <button type="button" className="btn btn--outline btn--icon-left" onClick={onSaveDraft}>
            <Save size={15} />
            Save Draft
          </button>
          <button type="button" className="btn btn--secondary btn--icon-left" onClick={onPreview}>
            <Eye size={15} />
            Preview
          </button>
          <button type="button" className="btn btn--primary btn--icon-left" disabled={!canPublish} onClick={onPublish}>
            <CheckCircle2 size={15} />
            Publish
          </button>
        </div>
      </section>

      {message && <div className="brand-message theme-builder__message">{message}</div>}

      <div className="theme-builder__editor">
        <div className="theme-builder__form-stack">
          <section className="theme-builder__panel">
            <div className="theme-builder__panel-head">
              <FileText size={18} />
              <div>
                <h2>Basic Details</h2>
                <p>Name, description, and branding users recognize.</p>
              </div>
            </div>
            <div className="theme-builder__form-grid">
              <FormField label="Theme name" required>
                <Input value={draft.name} onChange={(event) => onChange({ ...draft, name: event.target.value })} error={errors.name} />
                {errors.name && <p className="field-error">{errors.name}</p>}
              </FormField>
              <FormField label="Short label" required help="Shown inside compact theme controls.">
                <Input
                  value={draft.shortLabel}
                  maxLength={4}
                  onChange={(event) => onChange({ ...draft, shortLabel: event.target.value.toUpperCase() })}
                  error={errors.shortLabel}
                />
              </FormField>
              <FormField label="Description">
                <Textarea value={draft.description} rows={3} onChange={(event) => onChange({ ...draft, description: event.target.value })} />
              </FormField>
              <ThemeLogoUploader
                theme={draft}
                onChange={(updates) => {
                  setLogoError('');
                  onChange({ ...draft, ...updates });
                }}
                error={logoError}
                onError={setLogoError}
              />
            </div>
          </section>

          <section className="theme-builder__panel">
            <div className="theme-builder__panel-head">
              <Palette size={18} />
              <div>
                <h2>Colors</h2>
                <p>Map brand colors into the app tokens used by header, sidebar, cards, buttons, and states.</p>
              </div>
            </div>
            <div className="theme-builder__color-grid">
              {colorFields.map((field) => (
                <ThemeColorPicker
                  key={field.key}
                  field={field}
                  value={draft.colors[field.key]}
                  error={errors[`color:${field.key}`]}
                  onChange={(value) => updateColors({ ...draft.colors, [field.key]: value })}
                />
              ))}
            </div>
          </section>

          <section className="theme-builder__panel">
            <div className="theme-builder__panel-head">
              <SlidersHorizontal size={18} />
              <div>
                <h2>Typography</h2>
                <p>Controlled font and text settings that work with the current CSS token system.</p>
              </div>
            </div>
            <ThemeTypographySelector typography={draft.typography} onChange={(typography) => onChange({ ...draft, typography })} />
          </section>

          <section className="theme-builder__panel">
            <div className="theme-builder__panel-head">
              <SlidersHorizontal size={18} />
              <div>
                <h2>UI Styling</h2>
                <p>Radius, spacing, and shadow tone for reusable controls.</p>
              </div>
            </div>
            <div className="theme-builder__form-grid">
              {(['borderRadius', 'buttonRadius', 'cardRadius', 'inputRadius'] as const).map((field) => (
                <FormField key={field} label={field.replace(/([A-Z])/g, ' $1').replace(/^./, (value) => value.toUpperCase())}>
                  <Input type="number" min={0} max={24} value={draft.layout[field]} onChange={(event) => updateLayout({ ...draft.layout, [field]: event.target.value })} />
                </FormField>
              ))}
              <FormField label="Spacing scale">
                <Input type="number" min={2} max={8} value={draft.layout.spacingScale} onChange={(event) => updateLayout({ ...draft.layout, spacingScale: event.target.value })} />
              </FormField>
              <FormField label="Shadow style">
                <Select
                  value={draft.layout.shadowStyle}
                  onChange={(event) => updateLayout({ ...draft.layout, shadowStyle: event.target.value as ThemeBuilderLayout['shadowStyle'] })}
                  options={[
                    { value: 'soft', label: 'Soft' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'strong', label: 'Strong' },
                  ]}
                />
              </FormField>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function ThemeActionMenu({
  theme,
  onEdit,
  onPreview,
  onPublish,
  onDeactivate,
  onReactivate,
}: {
  theme: ListedTheme;
  onEdit: () => void;
  onPreview: () => void;
  onPublish: () => void;
  onDeactivate: () => void;
  onReactivate: () => void;
}) {
  const isPublished = theme.status === 'published';
  const isInactive = theme.status === 'deactivated';
  const isBuiltIn = theme.source === 'built-in';

  return (
    <div className="theme-builder__actions">
      <button type="button" className="btn btn--ghost btn--sm" onClick={onEdit}>
        <PencilLine size={14} />
        {isBuiltIn ? 'Customize' : 'Edit'}
      </button>
      <button type="button" className="btn btn--ghost btn--sm" onClick={onPreview}>
        <Eye size={14} />
        Preview
      </button>
      {!isBuiltIn && !isPublished && (
        <button type="button" className="btn btn--outline btn--sm" onClick={onPublish}>
          Publish
        </button>
      )}
      {!isBuiltIn && isInactive ? (
        <button type="button" className="btn btn--outline btn--sm" onClick={onReactivate}>
          Reactivate
        </button>
      ) : !isBuiltIn ? (
        <button type="button" className="btn btn--outline btn--sm" onClick={onDeactivate}>
          <Ban size={14} />
          Deactivate
        </button>
      ) : null}
    </div>
  );
}

function ThemeList({
  themes,
  loading,
  error,
  activeThemeKey,
  search,
  statusFilter,
  sortKey,
  onSearchChange,
  onStatusFilterChange,
  onSortChange,
  onNew,
  onEdit,
  onPreview,
  onPublish,
  onDeactivate,
  onReactivate,
  onRetry,
}: {
  themes: ListedTheme[];
  loading: boolean;
  error: string;
  activeThemeKey: string;
  search: string;
  statusFilter: ThemeBuilderStatus | 'all' | 'active';
  sortKey: SortKey;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: ThemeBuilderStatus | 'all' | 'active') => void;
  onSortChange: (value: SortKey) => void;
  onNew: () => void;
  onEdit: (theme: ListedTheme) => void;
  onPreview: (theme: ListedTheme) => void;
  onPublish: (theme: ListedTheme) => void;
  onDeactivate: (theme: ListedTheme) => void;
  onReactivate: (theme: ListedTheme) => void;
  onRetry: () => void;
}) {
  const filteredThemes = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return [...themes]
      .filter((theme) => {
        const matchesSearch = !normalizedSearch || theme.name.toLowerCase().includes(normalizedSearch);
        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'active' ? theme.status === 'published' && theme.key === activeThemeKey : theme.status === statusFilter);
        return matchesSearch && matchesStatus;
      })
      .sort((left, right) => new Date(right[sortKey]).getTime() - new Date(left[sortKey]).getTime());
  }, [activeThemeKey, search, sortKey, statusFilter, themes]);

  return (
    <div className="theme-builder">
      <section className="theme-builder__hero">
        <div>
          <span className="theme-builder__eyebrow">
            <Palette size={15} />
            Theme Builder
          </span>
          <h1 className="brand-page-title">Theme Builder</h1>
          <p>Create, preview, publish, and manage brand themes used by the header dropdown.</p>
        </div>
        <button type="button" className="btn btn--primary btn--icon-left" onClick={onNew}>
          <Plus size={16} />
          New Theme
        </button>
      </section>

      <section className="theme-builder__toolbar">
        <div className="theme-builder__search">
          <Search size={16} />
          <input type="search" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search themes" />
        </div>
        <Select
          value={statusFilter}
          onChange={(event) => onStatusFilterChange(event.target.value as ThemeBuilderStatus | 'all' | 'active')}
          options={[
            { value: 'all', label: 'All statuses' },
            { value: 'active', label: 'Active' },
            { value: 'draft', label: 'Draft' },
            { value: 'published', label: 'Published' },
            { value: 'deactivated', label: 'Inactive' },
          ]}
        />
        <Select
          value={sortKey}
          onChange={(event) => onSortChange(event.target.value as SortKey)}
          options={[
            { value: 'updatedAt', label: 'Sort by updated' },
            { value: 'createdAt', label: 'Sort by created' },
          ]}
        />
      </section>

      {loading && (
        <div className="theme-builder__state" aria-live="polite">
          Loading themes...
        </div>
      )}

      {error && (
        <div className="theme-builder__state theme-builder__state--error" role="alert">
          {error}
          <button type="button" className="btn btn--outline btn--sm" onClick={onRetry}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && filteredThemes.length === 0 && (
        <div className="theme-builder__empty">
          <Palette size={28} />
          <h2>No themes found</h2>
          <p>Create your first reusable brand theme or adjust the current filters.</p>
          <button type="button" className="btn btn--primary" onClick={onNew}>
            Create Theme
          </button>
        </div>
      )}

      {!loading && !error && filteredThemes.length > 0 && (
        <div className="theme-builder__table-wrap">
          <table className="theme-builder__table">
            <thead>
              <tr>
                <th>Theme</th>
                <th>Status</th>
                <th>Created</th>
                <th>Updated</th>
                <th>Created by</th>
                <th>Preview</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredThemes.map((theme) => (
                <tr key={theme.id}>
                  <td>
                    <div className="theme-builder__theme-cell">
                      <span className="theme-builder__theme-initials">{theme.shortLabel}</span>
                      <span>
                        <strong>{theme.name}</strong>
                        <small>
                          {theme.source === 'built-in' ? 'Built-in' : 'Custom'} theme
                          {theme.description ? ` - ${theme.description}` : ''}
                        </small>
                      </span>
                    </div>
                  </td>
                  <td>
                    <ThemeStatusBadge theme={theme} activeThemeKey={activeThemeKey} />
                  </td>
                  <td>{formatDateLabel(theme.createdAt)}</td>
                  <td>{formatDateLabel(theme.updatedAt)}</td>
                  <td>{theme.createdBy || '-'}</td>
                  <td>
                    <div className="theme-builder__swatch-row">
                      {Object.values(theme.colors).slice(0, 6).map((color, index) => (
                        <span key={`${theme.id}-${color}-${index}`} style={{ background: color }} />
                      ))}
                    </div>
                  </td>
                  <td>
                    <ThemeActionMenu
                      theme={theme}
                      onEdit={() => onEdit(theme)}
                      onPreview={() => onPreview(theme)}
                      onPublish={() => onPublish(theme)}
                      onDeactivate={() => onDeactivate(theme)}
                      onReactivate={() => onReactivate(theme)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const ThemeBuilder: React.FC<ThemeBuilderProps> = () => {
  const { themeKey } = useTheme();
  const [customThemes, setCustomThemes] = useState<ThemeBuilderTheme[]>([]);
  const [mode, setMode] = useState<ThemeBuilderMode>('list');
  const [draft, setDraft] = useState<ThemeBuilderTheme>(() => createThemeDraft());
  const [formHeading, setFormHeading] = useState('New Theme');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ThemeBuilderStatus | 'all' | 'active'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt');
  const [previewTheme, setPreviewTheme] = useState<ListedTheme | ThemeBuilderTheme | null>(null);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [pendingDeactivateTheme, setPendingDeactivateTheme] = useState<ThemeBuilderTheme | null>(null);
  const listedThemes = useMemo<ListedTheme[]>(
    () => {
      const builtInKeys = new Set(Object.keys(themeRegistry));
      return [
        ...getBuiltInThemeList(),
        ...customThemes
          .filter((theme) => !builtInKeys.has(theme.key))
          .map((theme) => ({ ...theme, source: 'custom' as const })),
      ];
    },
    [customThemes]
  );

  const loadThemes = () => {
    setLoading(true);
    setError('');

    window.setTimeout(() => {
      try {
        setCustomThemes(loadThemeBuilderThemes());
      } catch {
        setError('Themes could not be loaded right now.');
      } finally {
        setLoading(false);
      }
    }, 180);
  };

  useEffect(() => {
    loadThemes();
  }, []);

  const persistTheme = (theme: ThemeBuilderTheme, status: ThemeBuilderStatus, successMessage: string) => {
    const nextTheme = {
      ...theme,
      status,
      key: theme.key || `custom-${theme.id}`,
      updatedAt: new Date().toISOString(),
    };
    const nextThemes = upsertThemeBuilderTheme(nextTheme);
    setCustomThemes(nextThemes);
    setDraft(nextTheme);
    setMessage(successMessage);
    setMode('list');
  };

  const handleNew = () => {
    setDraft(createThemeDraft('New theme'));
    setFormHeading('New Theme');
    setMessage('');
    setMode('form');
  };

  const handlePublish = (theme: ThemeBuilderTheme) => {
    const errors = validateTheme(theme, listedThemes, true);
    if (Object.keys(errors).length > 0) {
      setDraft(theme);
      setMode('form');
      setMessage('Resolve validation messages before publishing.');
      return;
    }

    persistTheme(theme, 'published', `${theme.name} published. It is now available in the header theme dropdown.`);
  };

  const handleReactivate = (theme: ThemeBuilderTheme) => {
    persistTheme(theme, 'published', `${theme.name} reactivated and returned to the theme dropdown.`);
  };

  const handleConfirmDeactivate = () => {
    if (!pendingDeactivateTheme) {
      return;
    }

    const nextThemes = saveThemeBuilderThemes(
      customThemes.map((theme) =>
        theme.id === pendingDeactivateTheme.id
          ? { ...theme, status: 'deactivated', updatedAt: new Date().toISOString() }
          : theme
      )
    );
    setCustomThemes(nextThemes);
    setPendingDeactivateTheme(null);
    setMessage(`${pendingDeactivateTheme.name} deactivated. It will not appear in the header dropdown.`);
  };

  if (mode === 'form') {
    return (
      <AppShell activeLeaf={null}>
        <ThemeForm
          draft={draft}
          themes={listedThemes}
          message={message}
          heading={formHeading}
          onChange={setDraft}
          onPreview={() => {
            setPreviewTheme(draft);
            setIsPreviewExpanded(true);
          }}
          onBack={() => {
            setMode('list');
            setMessage('');
          }}
          onSaveDraft={() => persistTheme(draft, 'draft', `${draft.name || 'Theme'} saved as draft.`)}
          onPublish={() => handlePublish(draft)}
        />
      </AppShell>
    );
  }

  return (
    <AppShell activeLeaf={null}>
      {message && <div className="brand-message theme-builder__toast">{message}</div>}
      <ThemeList
        themes={listedThemes}
        loading={loading}
        error={error}
        activeThemeKey={themeKey}
        search={search}
        statusFilter={statusFilter}
        sortKey={sortKey}
        onSearchChange={setSearch}
        onStatusFilterChange={setStatusFilter}
        onSortChange={setSortKey}
        onNew={handleNew}
        onEdit={(theme) => {
          setDraft(createDraftFromListedTheme(theme, customThemes));
          setFormHeading(theme.source === 'built-in' ? 'Customize Theme' : 'Edit Theme');
          setMessage('');
          setMode('form');
        }}
        onPreview={(theme) => {
          setPreviewTheme(theme);
          setIsPreviewExpanded(false);
        }}
        onPublish={(theme) => {
          if (theme.source !== 'built-in') {
            handlePublish(theme);
          }
        }}
        onDeactivate={(theme) => {
          if (theme.source !== 'built-in') {
            setPendingDeactivateTheme(theme);
          }
        }}
        onReactivate={(theme) => {
          if (theme.source !== 'built-in') {
            handleReactivate(theme);
          }
        }}
        onRetry={loadThemes}
      />

      {previewTheme && (
        <div
          className={cn('theme-builder__preview-modal', isPreviewExpanded && 'theme-builder__preview-modal--expanded')}
          role="dialog"
          aria-modal="true"
          aria-label={`${previewTheme.name} preview`}
        >
          <button type="button" className="theme-builder__preview-backdrop" onClick={() => setPreviewTheme(null)} aria-label="Close theme preview" />
          <div className="theme-builder__preview-dialog">
            <div className="theme-builder__preview-header">
              <div>
                <strong>{previewTheme.name}</strong>
                <span>Preview only. The app theme is not changed.</span>
              </div>
              <div className="theme-builder__preview-actions">
                <button
                  type="button"
                  className="btn btn--outline btn--sm btn--icon-left"
                  onClick={() => setIsPreviewExpanded((current) => !current)}
                >
                  <ChevronsLeftRight size={14} />
                  {isPreviewExpanded ? 'Compact' : 'Expand'}
                </button>
                <button type="button" className="btn btn--outline btn--sm btn--icon-left" onClick={() => setPreviewTheme(null)}>
                  <X size={14} />
                  Close
                </button>
              </div>
            </div>
            <ThemePreview theme={previewTheme} isExpanded={isPreviewExpanded} />
          </div>
        </div>
      )}

      <ConfirmationDialog
        isOpen={Boolean(pendingDeactivateTheme)}
        title="Deactivate theme?"
        description={`${pendingDeactivateTheme?.name ?? 'This theme'} will stay visible in Theme Builder but will be removed from the header theme dropdown.`}
        confirmLabel="Deactivate"
        cancelLabel="Keep active"
        onConfirm={handleConfirmDeactivate}
        onClose={() => setPendingDeactivateTheme(null)}
      />
    </AppShell>
  );
};

export default ThemeBuilder;
