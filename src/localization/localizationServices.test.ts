import { describe, expect, it } from 'vitest';
import { sanitizeLanguages, resolveActiveLanguage, getLocaleForLanguage } from './languageService';
import { parseImportedTranslations, resolveTranslation, sanitizeTranslations, summarizeTranslationKeys } from './translationService';

describe('languageService', () => {
  it('keeps seeded defaults and enforces one default language', () => {
    const languages = sanitizeLanguages([
      {
        code: 'hi',
        displayName: 'Hindi Custom',
        nativeName: 'हिन्दी',
        direction: 'ltr',
        enabled: true,
        isDefault: false,
      },
    ]);

    expect(languages.some((language) => language.code === 'en')).toBe(true);
    expect(languages.filter((language) => language.isDefault)).toHaveLength(1);
    expect(languages.find((language) => language.code === 'hi')?.displayName).toBe('Hindi Custom');
  });

  it('falls back to default language when selected language is disabled', () => {
    const languages = sanitizeLanguages([
      {
        code: 'en',
        displayName: 'English',
        nativeName: 'English',
        direction: 'ltr',
        enabled: true,
        isDefault: true,
      },
      {
        code: 'ar',
        displayName: 'Arabic',
        nativeName: 'العربية',
        direction: 'rtl',
        enabled: false,
        isDefault: false,
      },
    ]);

    expect(resolveActiveLanguage(languages, 'ar').code).toBe('en');
    expect(getLocaleForLanguage('ar')).toBe('ar-SA');
  });
});

describe('translationService', () => {
  it('falls back to default language and then key placeholder', () => {
    const translations = sanitizeTranslations({
      'common.save': {
        en: 'Save',
        hi: 'सहेजें',
      },
    });

    expect(resolveTranslation('common.save', translations, 'hi', 'en')).toBe('सहेजें');
    expect(resolveTranslation('common.save', translations, 'ar', 'en')).toBe('Save');
    expect(resolveTranslation('missing.key', translations, 'ar', 'en')).toBe('[missing.key]');
  });

  it('parses imported translation json and reports warnings for invalid values', () => {
    const result = parseImportedTranslations(
      JSON.stringify({
        'common.save': {
          en: 'Save',
          hi: 'सहेजें',
        },
        'common.invalid': {
          en: 10,
        },
      })
    );

    expect(result.translations['common.save']?.hi).toBe('सहेजें');
    expect(result.warnings).toHaveLength(1);
  });

  it('summarizes missing translations by enabled language', () => {
    const translations = sanitizeTranslations({
      'common.cancel': {
        en: 'Cancel',
        hi: '',
      },
    });

    const summary = summarizeTranslationKeys(translations, ['en', 'hi'], 'en').find((item) => item.key === 'common.cancel');
    expect(summary?.isComplete).toBe(false);
    expect(summary?.missingLanguageCodes).toContain('hi');
  });
});
