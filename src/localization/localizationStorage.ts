import { DEFAULT_LANGUAGE_CODE } from './i18nConfig';
import { loadLanguages, resolveActiveLanguage } from './languageService';

const STORAGE_KEY = 'localization:selected-language:v1';
export const LOCALIZATION_SELECTED_LANGUAGE_UPDATED_EVENT = 'localization:selected-language:updated';

export function loadSelectedLanguageCode() {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE_CODE;
  }

  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? DEFAULT_LANGUAGE_CODE;
  } catch {
    return DEFAULT_LANGUAGE_CODE;
  }
}

export function saveSelectedLanguageCode(code: string) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, code);
    window.dispatchEvent(new CustomEvent(LOCALIZATION_SELECTED_LANGUAGE_UPDATED_EVENT, { detail: code }));
  }

  return code;
}

export function resolveStoredActiveLanguageCode() {
  const languages = loadLanguages();
  return resolveActiveLanguage(languages, loadSelectedLanguageCode()).code;
}
