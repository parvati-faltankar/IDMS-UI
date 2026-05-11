import { DEFAULT_LANGUAGE_CODE, seededTranslations } from './i18nConfig';
import type { ImportTranslationsResult, TranslationDictionary, TranslationKeySummary } from './types';

const STORAGE_KEY = 'localization:translations:v1';
export const LOCALIZATION_TRANSLATIONS_UPDATED_EVENT = 'localization:translations:updated';

export function sanitizeTranslations(value: unknown): TranslationDictionary {
  const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const translations: TranslationDictionary = JSON.parse(JSON.stringify(seededTranslations));

  for (const [key, languageMap] of Object.entries(source)) {
    if (!key.trim() || !languageMap || typeof languageMap !== 'object' || Array.isArray(languageMap)) {
      continue;
    }

    const nextLanguageMap = translations[key] ? { ...translations[key] } : {};
    for (const [languageCode, translationValue] of Object.entries(languageMap as Record<string, unknown>)) {
      if (typeof translationValue !== 'string') {
        continue;
      }

      nextLanguageMap[languageCode.trim().toLowerCase()] = translationValue;
    }

    translations[key.trim()] = nextLanguageMap;
  }

  return translations;
}

export function getTranslationModule(key: string) {
  return key.split('.')[0] || 'general';
}

export function resolveTranslation(
  key: string,
  translations: TranslationDictionary,
  selectedLanguageCode: string,
  defaultLanguageCode: string = DEFAULT_LANGUAGE_CODE,
  params?: Record<string, string | number>
) {
  const entry = translations[key];
  const template =
    entry?.[selectedLanguageCode] ??
    entry?.[defaultLanguageCode] ??
    `[${key}]`;

  if (!params) {
    return template;
  }

  return Object.entries(params).reduce(
    (result, [paramKey, paramValue]) => result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue)),
    template
  );
}

export function summarizeTranslationKeys(
  translations: TranslationDictionary,
  enabledLanguageCodes: string[],
  defaultLanguageCode: string
): TranslationKeySummary[] {
  return Object.keys(translations)
    .sort((left, right) => left.localeCompare(right))
    .map((key) => {
      const entry = translations[key] ?? {};
      const missingLanguageCodes = enabledLanguageCodes.filter((languageCode) => {
        const value = entry[languageCode] ?? entry[defaultLanguageCode];
        return !value?.trim();
      });

      return {
        key,
        module: getTranslationModule(key),
        missingLanguageCodes,
        isComplete: missingLanguageCodes.length === 0,
      };
    });
}

export function parseImportedTranslations(rawJson: string): ImportTranslationsResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error('invalid_json');
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('invalid_json');
  }

  const warnings: string[] = [];
  const translations: TranslationDictionary = {};

  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      warnings.push(`Skipped key "${key}" because it does not contain language mappings.`);
      continue;
    }

    const normalizedKey = key.trim();
    const nextValue: Record<string, string> = {};

    for (const [languageCode, translationValue] of Object.entries(value as Record<string, unknown>)) {
      if (typeof translationValue !== 'string') {
        warnings.push(`Skipped ${normalizedKey}.${languageCode} because its value is not a string.`);
        continue;
      }

      nextValue[languageCode.trim().toLowerCase()] = translationValue;
    }

    translations[normalizedKey] = nextValue;
  }

  return {
    translations,
    warnings,
  };
}

export function loadTranslations(): TranslationDictionary {
  if (typeof window === 'undefined') {
    return sanitizeTranslations(seededTranslations);
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    return sanitizeTranslations(rawValue ? JSON.parse(rawValue) : null);
  } catch {
    return sanitizeTranslations(seededTranslations);
  }
}

export function saveTranslations(translations: TranslationDictionary) {
  const sanitized = sanitizeTranslations(translations);

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    window.dispatchEvent(new CustomEvent(LOCALIZATION_TRANSLATIONS_UPDATED_EVENT, { detail: sanitized }));
  }

  return sanitized;
}
