export type LanguageDirection = 'ltr' | 'rtl';

export interface LanguageDefinition {
  code: string;
  displayName: string;
  nativeName: string;
  direction: LanguageDirection;
  enabled: boolean;
  isDefault: boolean;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export type TranslationDictionary = Record<string, Record<string, string>>;

export interface ImportTranslationsResult {
  translations: TranslationDictionary;
  warnings: string[];
}

export interface TranslationKeySummary {
  key: string;
  module: string;
  missingLanguageCodes: string[];
  isComplete: boolean;
}
