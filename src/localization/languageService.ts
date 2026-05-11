import { DEFAULT_LANGUAGE_CODE, localeByLanguageCode, seededLanguages } from './i18nConfig';
import type { LanguageDefinition } from './types';

const STORAGE_KEY = 'localization:languages:v1';
export const LOCALIZATION_LANGUAGES_UPDATED_EVENT = 'localization:languages:updated';

function createTimestamp() {
  return new Date().toISOString();
}

export function normalizeLanguageCode(code: string) {
  return code.trim().toLowerCase();
}

export function isValidLanguageCode(code: string) {
  return /^[a-z]{2,3}(?:-[a-z]{2})?$/i.test(code.trim());
}

export function sanitizeLanguages(value: unknown): LanguageDefinition[] {
  const storedLanguages = Array.isArray(value) ? value : [];
  const mergedByCode = new Map<string, LanguageDefinition>();

  for (const seeded of seededLanguages) {
    mergedByCode.set(seeded.code, { ...seeded });
  }

  for (const item of storedLanguages) {
    if (!item || typeof item !== 'object') {
      continue;
    }

    const candidate = item as Partial<LanguageDefinition>;
    const code = normalizeLanguageCode(candidate.code ?? '');
    if (!code || !isValidLanguageCode(code)) {
      continue;
    }

    const existing = mergedByCode.get(code);
    const now = createTimestamp();

    mergedByCode.set(code, {
      code,
      displayName: typeof candidate.displayName === 'string' && candidate.displayName.trim()
        ? candidate.displayName.trim()
        : existing?.displayName ?? code.toUpperCase(),
      nativeName: typeof candidate.nativeName === 'string' && candidate.nativeName.trim()
        ? candidate.nativeName.trim()
        : existing?.nativeName ?? existing?.displayName ?? code.toUpperCase(),
      direction: candidate.direction === 'rtl' ? 'rtl' : existing?.direction ?? 'ltr',
      enabled: typeof candidate.enabled === 'boolean' ? candidate.enabled : existing?.enabled ?? true,
      isDefault: typeof candidate.isDefault === 'boolean' ? candidate.isDefault : existing?.isDefault ?? false,
      icon: typeof candidate.icon === 'string' && candidate.icon.trim() ? candidate.icon.trim() : existing?.icon,
      createdAt: typeof candidate.createdAt === 'string' ? candidate.createdAt : existing?.createdAt ?? now,
      updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : now,
    });
  }

  const languages = Array.from(mergedByCode.values()).sort((left, right) => {
    if (left.isDefault) return -1;
    if (right.isDefault) return 1;
    return left.displayName.localeCompare(right.displayName);
  });

  const preferredDefaultCode =
    languages.find((language) => language.isDefault)?.code ??
    languages.find((language) => language.code === DEFAULT_LANGUAGE_CODE)?.code ??
    languages[0]?.code;

  return languages.map((language) => ({
    ...language,
    isDefault: language.code === preferredDefaultCode,
    enabled: language.code === preferredDefaultCode ? true : language.enabled,
  }));
}

export function resolveDefaultLanguage(languages: LanguageDefinition[]) {
  return languages.find((language) => language.isDefault) ?? languages[0] ?? seededLanguages[0];
}

export function resolveActiveLanguage(languages: LanguageDefinition[], selectedLanguageCode: string | null | undefined) {
  const normalizedCode = normalizeLanguageCode(selectedLanguageCode ?? '');
  const selected = languages.find((language) => language.code === normalizedCode && language.enabled);
  return selected ?? resolveDefaultLanguage(languages);
}

export function getLocaleForLanguage(code: string) {
  return localeByLanguageCode[normalizeLanguageCode(code)] ?? code;
}

export function loadLanguages(): LanguageDefinition[] {
  if (typeof window === 'undefined') {
    return sanitizeLanguages(seededLanguages);
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    return sanitizeLanguages(rawValue ? JSON.parse(rawValue) : null);
  } catch {
    return sanitizeLanguages(seededLanguages);
  }
}

export function saveLanguages(languages: LanguageDefinition[]) {
  const sanitized = sanitizeLanguages(languages);

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    window.dispatchEvent(new CustomEvent(LOCALIZATION_LANGUAGES_UPDATED_EVENT, { detail: sanitized }));
  }

  return sanitized;
}
