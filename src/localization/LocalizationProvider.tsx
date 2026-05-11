import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_LANGUAGE_CODE } from './i18nConfig';
import {
  isValidLanguageCode,
  loadLanguages,
  resolveActiveLanguage,
  resolveDefaultLanguage,
  saveLanguages,
  LOCALIZATION_LANGUAGES_UPDATED_EVENT,
} from './languageService';
import { loadSelectedLanguageCode, saveSelectedLanguageCode, LOCALIZATION_SELECTED_LANGUAGE_UPDATED_EVENT } from './localizationStorage';
import {
  loadTranslations,
  parseImportedTranslations,
  resolveTranslation,
  saveTranslations,
  summarizeTranslationKeys,
  LOCALIZATION_TRANSLATIONS_UPDATED_EVENT,
} from './translationService';
import type { LanguageDefinition, TranslationDictionary } from './types';

type LocalizationContextValue = {
  languages: LanguageDefinition[];
  enabledLanguages: LanguageDefinition[];
  translations: TranslationDictionary;
  selectedLanguageCode: string;
  defaultLanguageCode: string;
  direction: 'ltr' | 'rtl';
  locale: string;
  t: (key: string, params?: Record<string, string | number>) => string;
  setLanguage: (code: string) => void;
  upsertLanguage: (input: Partial<LanguageDefinition> & Pick<LanguageDefinition, 'code' | 'displayName' | 'nativeName' | 'direction'> & { originalCode?: string }) => { ok: boolean; error?: string };
  deleteLanguage: (code: string) => { ok: boolean; error?: string };
  toggleLanguageEnabled: (code: string, enabled: boolean) => { ok: boolean; error?: string };
  setDefaultLanguage: (code: string) => { ok: boolean; error?: string };
  upsertTranslationKey: (key: string) => { ok: boolean; error?: string };
  updateTranslationValue: (key: string, languageCode: string, value: string) => void;
  deleteTranslationKey: (key: string) => void;
  importTranslationsJson: (rawJson: string) => { ok: boolean; warnings: string[]; error?: string };
  exportTranslationsJson: () => string;
  translationSummaries: ReturnType<typeof summarizeTranslationKeys>;
};

const LocalizationContext = createContext<LocalizationContextValue | null>(null);

function getLocaleFromCode(code: string) {
  switch (code) {
    case 'hi':
      return 'hi-IN';
    case 'ar':
      return 'ar-SA';
    case 'ta':
      return 'ta-IN';
    case 'mr':
      return 'mr-IN';
    default:
      return 'en-US';
  }
}

function applyDocumentDirection(direction: 'ltr' | 'rtl', languageCode: string) {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.setAttribute('dir', direction);
  document.documentElement.setAttribute('lang', languageCode);
  document.body.setAttribute('dir', direction);
  document.body.setAttribute('data-language', languageCode);
  document.body.classList.toggle('app-rtl', direction === 'rtl');
}

export const LocalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [languages, setLanguages] = useState<LanguageDefinition[]>(() => loadLanguages());
  const [translations, setTranslations] = useState<TranslationDictionary>(() => loadTranslations());
  const [selectedLanguageCode, setSelectedLanguageCode] = useState(() => loadSelectedLanguageCode());

  const defaultLanguage = useMemo(() => resolveDefaultLanguage(languages), [languages]);
  const activeLanguage = useMemo(
    () => resolveActiveLanguage(languages, selectedLanguageCode),
    [languages, selectedLanguageCode]
  );
  const enabledLanguages = useMemo(
    () => languages.filter((language) => language.enabled),
    [languages]
  );

  useEffect(() => {
    applyDocumentDirection(activeLanguage.direction, activeLanguage.code);
    if (selectedLanguageCode !== activeLanguage.code) {
      setSelectedLanguageCode(activeLanguage.code);
      saveSelectedLanguageCode(activeLanguage.code);
    }
  }, [activeLanguage.code, activeLanguage.direction, selectedLanguageCode]);

  useEffect(() => {
    const syncLanguages = () => setLanguages(loadLanguages());
    const syncTranslations = () => setTranslations(loadTranslations());
    const syncSelectedLanguage = () => setSelectedLanguageCode(loadSelectedLanguageCode());

    window.addEventListener(LOCALIZATION_LANGUAGES_UPDATED_EVENT, syncLanguages);
    window.addEventListener(LOCALIZATION_TRANSLATIONS_UPDATED_EVENT, syncTranslations);
    window.addEventListener(LOCALIZATION_SELECTED_LANGUAGE_UPDATED_EVENT, syncSelectedLanguage);
    window.addEventListener('storage', syncLanguages);
    window.addEventListener('storage', syncTranslations);
    window.addEventListener('storage', syncSelectedLanguage);

    return () => {
      window.removeEventListener(LOCALIZATION_LANGUAGES_UPDATED_EVENT, syncLanguages);
      window.removeEventListener(LOCALIZATION_TRANSLATIONS_UPDATED_EVENT, syncTranslations);
      window.removeEventListener(LOCALIZATION_SELECTED_LANGUAGE_UPDATED_EVENT, syncSelectedLanguage);
      window.removeEventListener('storage', syncLanguages);
      window.removeEventListener('storage', syncTranslations);
      window.removeEventListener('storage', syncSelectedLanguage);
    };
  }, []);

  const persistLanguages = (nextLanguages: LanguageDefinition[]) => {
    const saved = saveLanguages(nextLanguages);
    setLanguages(saved);
    return saved;
  };

  const persistTranslations = (nextTranslations: TranslationDictionary) => {
    const saved = saveTranslations(nextTranslations);
    setTranslations(saved);
    return saved;
  };

  const value = useMemo<LocalizationContextValue>(() => {
    const t = (key: string, params?: Record<string, string | number>) =>
      resolveTranslation(key, translations, activeLanguage.code, defaultLanguage.code, params);

    return {
      languages,
      enabledLanguages,
      translations,
      selectedLanguageCode: activeLanguage.code,
      defaultLanguageCode: defaultLanguage.code,
      direction: activeLanguage.direction,
      locale: getLocaleFromCode(activeLanguage.code),
      t,
      setLanguage: (code: string) => {
        const nextLanguage = resolveActiveLanguage(languages, code);
        setSelectedLanguageCode(nextLanguage.code);
        saveSelectedLanguageCode(nextLanguage.code);
      },
      upsertLanguage: (input) => {
        const normalizedCode = input.code.trim().toLowerCase();
        const normalizedOriginalCode = input.originalCode?.trim().toLowerCase();
        if (!isValidLanguageCode(normalizedCode)) {
          return { ok: false, error: 'validation.invalidLanguageCode' };
        }

        const now = new Date().toISOString();
        const existing = languages.find((language) => language.code === (normalizedOriginalCode ?? normalizedCode));
        const duplicate = languages.find(
          (language) => language.code === normalizedCode && language.code !== normalizedOriginalCode
        );

        if (duplicate) {
          return { ok: false, error: 'validation.duplicateLanguageCode' };
        }

        const nextLanguages = existing
          ? languages.map((language) =>
              language.code === normalizedCode
                ? {
                    ...language,
                    displayName: input.displayName.trim(),
                    nativeName: input.nativeName.trim(),
                    direction: input.direction,
                    icon: input.icon?.trim() || undefined,
                    enabled: input.enabled ?? language.enabled,
                    updatedAt: now,
                  }
                : language
            )
          : [
              ...languages,
              {
                code: normalizedCode,
                displayName: input.displayName.trim(),
                nativeName: input.nativeName.trim(),
                direction: input.direction,
                enabled: input.enabled ?? true,
                isDefault: false,
                icon: input.icon?.trim() || undefined,
                createdAt: now,
                updatedAt: now,
              },
            ];

        persistLanguages(nextLanguages);
        return { ok: true };
      },
      deleteLanguage: (code: string) => {
        const normalizedCode = code.trim().toLowerCase();
        const target = languages.find((language) => language.code === normalizedCode);
        if (!target) {
          return { ok: true };
        }

        if (target.isDefault) {
          return { ok: false, error: 'validation.defaultLanguageDeleteBlocked' };
        }

        const nextLanguages = languages.filter((language) => language.code !== normalizedCode);
        persistLanguages(nextLanguages);

        if (activeLanguage.code === normalizedCode) {
          const fallbackLanguage = resolveActiveLanguage(nextLanguages, DEFAULT_LANGUAGE_CODE);
          setSelectedLanguageCode(fallbackLanguage.code);
          saveSelectedLanguageCode(fallbackLanguage.code);
        }

        return { ok: true };
      },
      toggleLanguageEnabled: (code: string, enabled: boolean) => {
        const normalizedCode = code.trim().toLowerCase();
        const target = languages.find((language) => language.code === normalizedCode);
        if (!target) {
          return { ok: true };
        }

        if (target.isDefault && !enabled) {
          return { ok: false, error: 'validation.defaultLanguageDisableBlocked' };
        }

        const nextLanguages = languages.map((language) =>
          language.code === normalizedCode
            ? { ...language, enabled, updatedAt: new Date().toISOString() }
            : language
        );
        persistLanguages(nextLanguages);

        if (!enabled && activeLanguage.code === normalizedCode) {
          const fallbackLanguage = resolveActiveLanguage(nextLanguages, defaultLanguage.code);
          setSelectedLanguageCode(fallbackLanguage.code);
          saveSelectedLanguageCode(fallbackLanguage.code);
        }

        return { ok: true };
      },
      setDefaultLanguage: (code: string) => {
        const normalizedCode = code.trim().toLowerCase();
        if (!languages.some((language) => language.code === normalizedCode)) {
          return { ok: false, error: 'validation.defaultLanguageRequired' };
        }

        const nextLanguages = languages.map((language) => ({
          ...language,
          isDefault: language.code === normalizedCode,
          enabled: language.code === normalizedCode ? true : language.enabled,
          updatedAt: new Date().toISOString(),
        }));
        persistLanguages(nextLanguages);
        return { ok: true };
      },
      upsertTranslationKey: (key: string) => {
        const normalizedKey = key.trim();
        if (!normalizedKey) {
          return { ok: false, error: 'validation.required' };
        }

        if (translations[normalizedKey]) {
          return { ok: false, error: 'validation.duplicateTranslationKey' };
        }

        persistTranslations({
          ...translations,
          [normalizedKey]: {},
        });
        return { ok: true };
      },
      updateTranslationValue: (key: string, languageCode: string, translationValue: string) => {
        persistTranslations({
          ...translations,
          [key]: {
            ...(translations[key] ?? {}),
            [languageCode]: translationValue,
          },
        });
      },
      deleteTranslationKey: (key: string) => {
        const nextTranslations = { ...translations };
        delete nextTranslations[key];
        persistTranslations(nextTranslations);
      },
      importTranslationsJson: (rawJson: string) => {
        try {
          const result = parseImportedTranslations(rawJson);
          persistTranslations({
            ...translations,
            ...result.translations,
          });

          return { ok: true, warnings: result.warnings };
        } catch {
          return { ok: false, warnings: [], error: 'validation.invalidImportJson' };
        }
      },
      exportTranslationsJson: () => JSON.stringify(translations, null, 2),
      translationSummaries: summarizeTranslationKeys(
        translations,
        enabledLanguages.map((language) => language.code),
        defaultLanguage.code
      ),
    };
  }, [activeLanguage.code, activeLanguage.direction, defaultLanguage.code, enabledLanguages, languages, translations]);

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
};

export function useLocalization() {
  const context = useContext(LocalizationContext);

  if (!context) {
    throw new Error('useLocalization must be used within LocalizationProvider');
  }

  return context;
}
