import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Globe2,
  Languages,
  PencilLine,
  Plus,
  Search,
  Star,
  Trash2,
  Upload,
} from 'lucide-react';
import AppShell from '../../components/common/AppShell';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import SideDrawer from '../../components/common/SideDrawer';
import { FormField, Input, Select, Textarea } from '../../components/common/FormControls';
import { cn } from '../../utils/classNames';
import { formatDate } from '../../utils/dateFormat';
import { useLocalization } from '../../localization';
import type { LanguageDefinition } from '../../localization';

interface LanguageBuilderProps {
  onBack?: () => void;
}

type BuilderTab = 'languages' | 'translations';
type TranslationStatusFilter = 'all' | 'complete' | 'missing';
type LanguageStatusFilter = 'all' | 'enabled' | 'disabled';

type LanguageFormState = {
  code: string;
  displayName: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  icon: string;
  enabled: boolean;
};

const emptyLanguageForm: LanguageFormState = {
  code: '',
  displayName: '',
  nativeName: '',
  direction: 'ltr',
  icon: '',
  enabled: true,
};

function buildLanguageForm(language?: LanguageDefinition | null): LanguageFormState {
  if (!language) {
    return emptyLanguageForm;
  }

  return {
    code: language.code,
    displayName: language.displayName,
    nativeName: language.nativeName,
    direction: language.direction,
    icon: language.icon ?? '',
    enabled: language.enabled,
  };
}

const LanguageBuilder: React.FC<LanguageBuilderProps> = ({ onBack }) => {
  const {
    languages,
    enabledLanguages,
    defaultLanguageCode,
    selectedLanguageCode,
    translationSummaries,
    translations,
    t,
    upsertLanguage,
    deleteLanguage,
    toggleLanguageEnabled,
    setDefaultLanguage,
    upsertTranslationKey,
    updateTranslationValue,
    deleteTranslationKey,
    importTranslationsJson,
    exportTranslationsJson,
  } = useLocalization();

  const [activeTab, setActiveTab] = useState<BuilderTab>('languages');
  const [languageSearch, setLanguageSearch] = useState('');
  const [languageStatusFilter, setLanguageStatusFilter] = useState<LanguageStatusFilter>('all');
  const [translationSearch, setTranslationSearch] = useState('');
  const [translationModuleFilter, setTranslationModuleFilter] = useState('all');
  const [translationLanguageFilter, setTranslationLanguageFilter] = useState('all');
  const [translationStatusFilter, setTranslationStatusFilter] = useState<TranslationStatusFilter>('all');
  const [showMissingOnly, setShowMissingOnly] = useState(false);
  const [isLanguageDrawerOpen, setIsLanguageDrawerOpen] = useState(false);
  const [editingLanguageCode, setEditingLanguageCode] = useState<string | null>(null);
  const [languageForm, setLanguageForm] = useState<LanguageFormState>(emptyLanguageForm);
  const [languageFormError, setLanguageFormError] = useState('');
  const [isAddKeyDrawerOpen, setIsAddKeyDrawerOpen] = useState(false);
  const [translationKeyInput, setTranslationKeyInput] = useState('');
  const [translationKeyError, setTranslationKeyError] = useState('');
  const [deleteLanguageCode, setDeleteLanguageCode] = useState<string | null>(null);
  const [deleteTranslationKeyCode, setDeleteTranslationKeyCode] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState('');
  const [builderMessage, setBuilderMessage] = useState('');
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const moduleOptions = useMemo(() => {
    const modules = Array.from(new Set(translationSummaries.map((item) => item.module))).sort((left, right) =>
      left.localeCompare(right)
    );

    return [{ value: 'all', label: t('common.all') }, ...modules.map((module) => ({ value: module, label: module }))];
  }, [t, translationSummaries]);

  const filteredLanguages = useMemo(() => {
    const normalizedSearch = languageSearch.trim().toLowerCase();

    return languages.filter((language) => {
      const matchesSearch =
        !normalizedSearch ||
        language.code.toLowerCase().includes(normalizedSearch) ||
        language.displayName.toLowerCase().includes(normalizedSearch) ||
        language.nativeName.toLowerCase().includes(normalizedSearch);
      const matchesStatus =
        languageStatusFilter === 'all' ||
        (languageStatusFilter === 'enabled' && language.enabled) ||
        (languageStatusFilter === 'disabled' && !language.enabled);

      return matchesSearch && matchesStatus;
    });
  }, [languageSearch, languageStatusFilter, languages]);

  const filteredTranslationSummaries = useMemo(() => {
    const normalizedSearch = translationSearch.trim().toLowerCase();

    return translationSummaries.filter((summary) => {
      const matchesSearch = !normalizedSearch || summary.key.toLowerCase().includes(normalizedSearch);
      const matchesModule = translationModuleFilter === 'all' || summary.module === translationModuleFilter;
      const missingForSelectedLanguage =
        translationLanguageFilter !== 'all' && summary.missingLanguageCodes.includes(translationLanguageFilter);
      const matchesStatus =
        translationStatusFilter === 'all' ||
        (translationStatusFilter === 'complete' && summary.isComplete) ||
        (translationStatusFilter === 'missing' && !summary.isComplete);
      const matchesMissing = !showMissingOnly || !summary.isComplete;
      const matchesLanguage =
        translationLanguageFilter === 'all' ||
        missingForSelectedLanguage ||
        Boolean(translations[summary.key]?.[translationLanguageFilter]?.trim());

      return matchesSearch && matchesModule && matchesStatus && matchesMissing && matchesLanguage;
    });
  }, [
    showMissingOnly,
    translationLanguageFilter,
    translationModuleFilter,
    translationSearch,
    translationStatusFilter,
    translationSummaries,
    translations,
  ]);

  const translationLanguages = useMemo(() => {
    if (translationLanguageFilter === 'all') {
      return languages;
    }

    const selected = languages.find((language) => language.code === translationLanguageFilter);
    const fallback = languages.find((language) => language.code === defaultLanguageCode);
    return [selected, fallback].filter((language, index, items): language is LanguageDefinition =>
      Boolean(language) && items.findIndex((item) => item?.code === language?.code) === index
    );
  }, [defaultLanguageCode, languages, translationLanguageFilter]);

  const totalMissingTranslations = useMemo(
    () => translationSummaries.reduce((sum, item) => sum + item.missingLanguageCodes.length, 0),
    [translationSummaries]
  );

  const openAddLanguage = () => {
    setEditingLanguageCode(null);
    setLanguageForm(emptyLanguageForm);
    setLanguageFormError('');
    setIsLanguageDrawerOpen(true);
  };

  const openEditLanguage = (language: LanguageDefinition) => {
    setEditingLanguageCode(language.code);
    setLanguageForm(buildLanguageForm(language));
    setLanguageFormError('');
    setIsLanguageDrawerOpen(true);
  };

  const handleSaveLanguage = () => {
    const result = upsertLanguage({
      code: languageForm.code,
      originalCode: editingLanguageCode ?? undefined,
      displayName: languageForm.displayName,
      nativeName: languageForm.nativeName,
      direction: languageForm.direction,
      icon: languageForm.icon,
      enabled: languageForm.enabled,
    });

    if (!result.ok) {
      setLanguageFormError(result.error ? t(result.error) : t('common.error'));
      return;
    }

    setBuilderMessage(editingLanguageCode ? `${t('common.update')} ${t('common.language').toLowerCase()}` : `${t('common.add')} ${t('common.language').toLowerCase()}`);
    setIsLanguageDrawerOpen(false);
  };

  const handleAddTranslationKey = () => {
    const result = upsertTranslationKey(translationKeyInput);

    if (!result.ok) {
      setTranslationKeyError(result.error ? t(result.error) : t('common.error'));
      return;
    }

    setTranslationKeyInput('');
    setTranslationKeyError('');
    setIsAddKeyDrawerOpen(false);
    setBuilderMessage(`${t('languageBuilder.addTranslationKey')} ${t('common.success').toLowerCase()}`);
  };

  const handleExportTranslations = () => {
    const json = exportTranslationsJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `translations-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    window.URL.revokeObjectURL(url);
    setBuilderMessage(t('languageBuilder.exportSuccess'));
  };

  const handleImportTranslations = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    const rawJson = await file.text();
    const result = importTranslationsJson(rawJson);

    if (!result.ok) {
      setImportMessage(result.error ? t(result.error) : t('common.error'));
      input.value = '';
      return;
    }

    setImportMessage(result.warnings.length ? result.warnings.join(' ') : t('languageBuilder.importSuccess'));
    setBuilderMessage(t('languageBuilder.importSuccess'));
    input.value = '';
  };

  return (
    <AppShell activeLeaf={null} contentClassName="language-builder-shell">
      <main className="language-builder">
        <section className="language-builder__hero">
          <button
            type="button"
            className="page-back-button"
            onClick={onBack}
            aria-label={t('common.back')}
          >
            <ArrowLeft size={18} />
          </button>
          <div className="language-builder__hero-copy">
            <span className="language-builder__eyebrow">
              <Languages size={15} />
              {t('header.languageBuilder')}
            </span>
            <h1 className="brand-page-title">{t('languageBuilder.title')}</h1>
            <p className="brand-page-subtitle">{t('languageBuilder.subtitle')}</p>
          </div>
          <div className="language-builder__hero-actions">
            {builderMessage && (
              <span className="language-builder__message">
                <CheckCircle2 size={15} />
                {builderMessage}
              </span>
            )}
            <button type="button" className="btn btn--outline btn--icon-left" onClick={() => importInputRef.current?.click()}>
              <Upload size={15} />
              {t('languageBuilder.importTranslations')}
            </button>
            <button type="button" className="btn btn--outline btn--icon-left" onClick={handleExportTranslations}>
              <Download size={15} />
              {t('languageBuilder.exportTranslations')}
            </button>
            <button type="button" className="btn btn--primary btn--icon-left" onClick={openAddLanguage}>
              <Plus size={15} />
              {t('languageBuilder.addLanguage')}
            </button>
            <input ref={importInputRef} type="file" accept="application/json" className="sr-only" onChange={handleImportTranslations} />
          </div>
        </section>

        <section className="language-builder__stats">
          <article className="language-builder__stat-card">
            <span className="language-builder__stat-label">{t('common.languages')}</span>
            <strong>{languages.length}</strong>
            <small>{enabledLanguages.length} {t('common.enabled').toLowerCase()}</small>
          </article>
          <article className="language-builder__stat-card">
            <span className="language-builder__stat-label">{t('common.defaultLanguage')}</span>
            <strong>{languages.find((language) => language.code === defaultLanguageCode)?.nativeName ?? defaultLanguageCode.toUpperCase()}</strong>
            <small>{defaultLanguageCode.toUpperCase()}</small>
          </article>
          <article className="language-builder__stat-card">
            <span className="language-builder__stat-label">{t('languageBuilder.missingTranslations')}</span>
            <strong>{totalMissingTranslations}</strong>
            <small>{translationSummaries.length} keys</small>
          </article>
          <article className="language-builder__stat-card">
            <span className="language-builder__stat-label">{t('header.currentLanguage')}</span>
            <strong>{languages.find((language) => language.code === selectedLanguageCode)?.nativeName ?? selectedLanguageCode.toUpperCase()}</strong>
            <small>{selectedLanguageCode.toUpperCase()}</small>
          </article>
        </section>

        <section className="language-builder__tabbar">
          <button
            type="button"
            className={cn('language-builder__tab', activeTab === 'languages' && 'language-builder__tab--active')}
            onClick={() => setActiveTab('languages')}
          >
            <Globe2 size={16} />
            {t('languageBuilder.languageRegistry')}
          </button>
          <button
            type="button"
            className={cn('language-builder__tab', activeTab === 'translations' && 'language-builder__tab--active')}
            onClick={() => setActiveTab('translations')}
          >
            <Languages size={16} />
            {t('languageBuilder.translationManager')}
          </button>
        </section>

        {activeTab === 'languages' && (
          <section className="language-builder__panel">
            <div className="language-builder__toolbar">
              <div className="language-builder__search">
                <Search size={16} />
                <input
                  value={languageSearch}
                  onChange={(event) => setLanguageSearch(event.target.value)}
                  placeholder={t('languageBuilder.languageSearchPlaceholder')}
                  aria-label={t('languageBuilder.languageSearchPlaceholder')}
                />
              </div>
              <Select
                value={languageStatusFilter}
                aria-label={t('languageBuilder.statusFilter')}
                onChange={(event) => setLanguageStatusFilter(event.target.value as LanguageStatusFilter)}
                options={[
                  { value: 'all', label: t('common.all') },
                  { value: 'enabled', label: t('common.enabled') },
                  { value: 'disabled', label: t('common.disabled') },
                ]}
              />
            </div>

            {filteredLanguages.length === 0 ? (
              <div className="language-builder__empty">{t('languageBuilder.emptyLanguages')}</div>
            ) : (
              <div className="language-builder__language-grid">
                {filteredLanguages.map((language) => (
                  <article key={language.code} className="language-builder__language-card">
                    <div className="language-builder__language-card-head">
                      <div>
                        <div className="language-builder__language-title-row">
                          <h3>{language.displayName}</h3>
                          {language.isDefault && <span className="brand-badge brand-badge--draft">{t('common.default')}</span>}
                          <span className={cn('brand-badge', language.enabled ? 'brand-badge--approved' : 'brand-badge--cancelled')}>
                            {language.enabled ? t('common.enabled') : t('common.disabled')}
                          </span>
                        </div>
                        <p>{language.nativeName}</p>
                      </div>
                      <span className="language-builder__language-code">{language.code.toUpperCase()}</span>
                    </div>

                    <div className="language-builder__language-meta">
                      <span>{t('common.direction')}: {language.direction.toUpperCase()}</span>
                      <span>{t('common.status')}: {language.enabled ? t('common.active') : t('common.inactive')}</span>
                      <span>Updated {formatDate(language.updatedAt)}</span>
                    </div>

                    <div className="language-builder__language-actions">
                      <button type="button" className="btn btn--ghost btn--sm" onClick={() => openEditLanguage(language)}>
                        <PencilLine size={14} />
                        {t('common.edit')}
                      </button>
                      {!language.isDefault && (
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          onClick={() => {
                            const result = setDefaultLanguage(language.code);
                            setBuilderMessage(result.ok ? `${language.displayName} ${t('languageBuilder.setDefault').toLowerCase()}` : t(result.error ?? 'common.error'));
                          }}
                        >
                          <Star size={14} />
                          {t('languageBuilder.setDefault')}
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => {
                          const result = toggleLanguageEnabled(language.code, !language.enabled);
                          setBuilderMessage(result.ok ? `${language.displayName} ${language.enabled ? t('common.disabled').toLowerCase() : t('common.enabled').toLowerCase()}` : t(result.error ?? 'common.error'));
                        }}
                      >
                        {language.enabled ? t('common.disabled') : t('common.enabled')}
                      </button>
                      {!language.isDefault && (
                        <button type="button" className="btn btn--ghost btn--sm btn--danger" onClick={() => setDeleteLanguageCode(language.code)}>
                          <Trash2 size={14} />
                          {t('common.delete')}
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'translations' && (
          <section className="language-builder__panel">
            <div className="language-builder__toolbar language-builder__toolbar--stacked">
              <div className="language-builder__search">
                <Search size={16} />
                <input
                  value={translationSearch}
                  onChange={(event) => setTranslationSearch(event.target.value)}
                  placeholder={t('languageBuilder.translationSearchPlaceholder')}
                  aria-label={t('languageBuilder.translationSearchPlaceholder')}
                />
              </div>
              <div className="language-builder__filters">
                <Select
                  value={translationModuleFilter}
                  aria-label={t('languageBuilder.moduleFilter')}
                  onChange={(event) => setTranslationModuleFilter(event.target.value)}
                  options={moduleOptions}
                />
                <Select
                  value={translationLanguageFilter}
                  aria-label={t('languageBuilder.languageFilter')}
                  onChange={(event) => setTranslationLanguageFilter(event.target.value)}
                  options={[
                    { value: 'all', label: t('common.languages') },
                    ...languages.map((language) => ({ value: language.code, label: `${language.displayName} (${language.code.toUpperCase()})` })),
                  ]}
                />
                <Select
                  value={translationStatusFilter}
                  aria-label={t('languageBuilder.statusFilter')}
                  onChange={(event) => setTranslationStatusFilter(event.target.value as TranslationStatusFilter)}
                  options={[
                    { value: 'all', label: t('common.all') },
                    { value: 'complete', label: t('common.complete') },
                    { value: 'missing', label: t('common.missing') },
                  ]}
                />
                <label className="language-builder__checkbox" aria-label={t('languageBuilder.showMissingOnly')}>
                  <input type="checkbox" checked={showMissingOnly} onChange={(event) => setShowMissingOnly(event.target.checked)} />
                  <span>{t('languageBuilder.showMissingOnly')}</span>
                </label>
                <button type="button" className="btn btn--primary btn--icon-left" onClick={() => setIsAddKeyDrawerOpen(true)}>
                  <Plus size={14} />
                  {t('languageBuilder.addTranslationKey')}
                </button>
              </div>
            </div>

            {importMessage && <div className="language-builder__import-message">{importMessage}</div>}

            {filteredTranslationSummaries.length === 0 ? (
              <div className="language-builder__empty">{t('languageBuilder.emptyTranslations')}</div>
            ) : (
              <div className="language-builder__translation-list">
                {filteredTranslationSummaries.map((summary) => (
                  <article key={summary.key} className="language-builder__translation-card">
                    <div className="language-builder__translation-card-head">
                      <div>
                        <div className="language-builder__translation-key">{summary.key}</div>
                        <div className="language-builder__translation-meta">
                          <span className="brand-badge brand-badge--draft">{summary.module}</span>
                          <span className={cn('brand-badge', summary.isComplete ? 'brand-badge--approved' : 'brand-badge--cancelled')}>
                            {summary.isComplete ? t('common.complete') : `${summary.missingLanguageCodes.length} ${t('common.missing').toLowerCase()}`}
                          </span>
                        </div>
                      </div>
                      <button type="button" className="btn btn--ghost btn--sm btn--danger" onClick={() => setDeleteTranslationKeyCode(summary.key)}>
                        <Trash2 size={14} />
                        {t('common.delete')}
                      </button>
                    </div>

                    <div className="language-builder__translation-grid">
                      {translationLanguages.map((language) => {
                        const value = translations[summary.key]?.[language.code] ?? '';
                        const isMissing = !value.trim();

                        return (
                          <div
                            key={`${summary.key}-${language.code}`}
                            className={cn('language-builder__translation-field', isMissing && 'language-builder__translation-field--missing')}
                          >
                            <div className="language-builder__translation-field-head">
                              <strong>{language.nativeName}</strong>
                              <span>{language.code.toUpperCase()}</span>
                            </div>
                            <Textarea
                              rows={3}
                              value={value}
                              placeholder={t('validation.translationMissing')}
                              onChange={(event) => updateTranslationValue(summary.key, language.code, event.target.value)}
                            />
                            {isMissing && <small>{t('validation.translationMissing')}</small>}
                          </div>
                        );
                      })}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      <SideDrawer
        isOpen={isLanguageDrawerOpen}
        title={editingLanguageCode ? t('languageBuilder.editLanguage') : t('languageBuilder.addLanguage')}
        subtitle={t('languageBuilder.subtitle')}
        onClose={() => setIsLanguageDrawerOpen(false)}
        panelClassName="side-drawer__panel--narrow language-builder__drawer"
        footer={
          <div className="language-builder__drawer-actions">
            <button type="button" className="btn btn--outline" onClick={() => setIsLanguageDrawerOpen(false)}>
              {t('common.cancel')}
            </button>
            <button type="button" className="btn btn--primary" onClick={handleSaveLanguage}>
              {editingLanguageCode ? t('common.update') : t('common.add')}
            </button>
          </div>
        }
      >
        <div className="language-builder__drawer-body">
          <FormField label={t('languageBuilder.languageCode')} required>
            <Input
              value={languageForm.code}
              readOnly={Boolean(editingLanguageCode)}
              onChange={(event) => {
                setLanguageForm((current) => ({ ...current, code: event.target.value }));
                setLanguageFormError('');
              }}
              placeholder="en"
              error={languageFormError}
            />
          </FormField>
          <FormField label={t('languageBuilder.displayName')} required>
            <Input
              value={languageForm.displayName}
              onChange={(event) => setLanguageForm((current) => ({ ...current, displayName: event.target.value }))}
              placeholder="English"
            />
          </FormField>
          <FormField label={t('languageBuilder.nativeName')} required>
            <Input
              value={languageForm.nativeName}
              onChange={(event) => setLanguageForm((current) => ({ ...current, nativeName: event.target.value }))}
              placeholder="English"
            />
          </FormField>
          <FormField label={t('languageBuilder.direction')} required>
            <Select
              value={languageForm.direction}
              onChange={(event) => setLanguageForm((current) => ({ ...current, direction: event.target.value as 'ltr' | 'rtl' }))}
              options={[
                { value: 'ltr', label: 'LTR' },
                { value: 'rtl', label: 'RTL' },
              ]}
            />
          </FormField>
          <FormField label="Flag / Icon" help={t('common.optional')}>
            <Input
              value={languageForm.icon}
              onChange={(event) => setLanguageForm((current) => ({ ...current, icon: event.target.value }))}
              placeholder="Optional emoji or icon code"
            />
          </FormField>
          <label className="language-builder__checkbox language-builder__checkbox--panel">
            <input
              type="checkbox"
              checked={languageForm.enabled}
              onChange={(event) => setLanguageForm((current) => ({ ...current, enabled: event.target.checked }))}
            />
            <span>{t('languageBuilder.enableLanguage')}</span>
          </label>
          {languageFormError && <div className="language-builder__error">{languageFormError}</div>}
        </div>
      </SideDrawer>

      <SideDrawer
        isOpen={isAddKeyDrawerOpen}
        title={t('languageBuilder.addTranslationKey')}
        subtitle={t('languageBuilder.translationManager')}
        onClose={() => setIsAddKeyDrawerOpen(false)}
        panelClassName="side-drawer__panel--narrow language-builder__drawer"
        footer={
          <div className="language-builder__drawer-actions">
            <button type="button" className="btn btn--outline" onClick={() => setIsAddKeyDrawerOpen(false)}>
              {t('common.cancel')}
            </button>
            <button type="button" className="btn btn--primary" onClick={handleAddTranslationKey}>
              {t('common.add')}
            </button>
          </div>
        }
      >
        <div className="language-builder__drawer-body">
          <FormField label={t('languageBuilder.translationKey')} required>
            <Input
              value={translationKeyInput}
              onChange={(event) => {
                setTranslationKeyInput(event.target.value);
                setTranslationKeyError('');
              }}
              placeholder="common.save"
              error={translationKeyError}
            />
          </FormField>
          <FormField label={t('common.module')}>
            <Input value={translationKeyInput.split('.')[0] ?? ''} readOnly />
          </FormField>
          {translationKeyError && <div className="language-builder__error">{translationKeyError}</div>}
        </div>
      </SideDrawer>

      <ConfirmationDialog
        isOpen={Boolean(deleteLanguageCode)}
        title={t('languageBuilder.deleteLanguage')}
        description={t('languageBuilder.deleteConfirm')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onClose={() => setDeleteLanguageCode(null)}
        onConfirm={() => {
          if (!deleteLanguageCode) {
            return;
          }

          const result = deleteLanguage(deleteLanguageCode);
          setBuilderMessage(result.ok ? t('languageBuilder.deleteLanguage') : t(result.error ?? 'common.error'));
          setDeleteLanguageCode(null);
        }}
      />

      <ConfirmationDialog
        isOpen={Boolean(deleteTranslationKeyCode)}
        title={t('common.delete')}
        description={`Delete ${deleteTranslationKeyCode}?`}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onClose={() => setDeleteTranslationKeyCode(null)}
        onConfirm={() => {
          if (!deleteTranslationKeyCode) {
            return;
          }

          deleteTranslationKey(deleteTranslationKeyCode);
          setDeleteTranslationKeyCode(null);
          setBuilderMessage(`${deleteTranslationKeyCode} ${t('common.delete').toLowerCase()}`);
        }}
      />
    </AppShell>
  );
};

export default LanguageBuilder;
