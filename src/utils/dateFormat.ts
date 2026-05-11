import { getLocaleForLanguage, loadLanguages, resolveActiveLanguage } from '../localization/languageService';
import { loadSelectedLanguageCode } from '../localization/localizationStorage';

function getActiveLocale() {
  const languages = loadLanguages();
  const activeLanguage = resolveActiveLanguage(languages, loadSelectedLanguageCode());
  return getLocaleForLanguage(activeLanguage.code);
}

export function formatDate(date: Date | string): string {
  const parsedDate = typeof date === 'string' ? new Date(date) : date;

  return new Intl.DateTimeFormat(getActiveLocale(), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(parsedDate);
}

export function formatDateTime(date: string): { dateLabel: string; timeLabel: string } {
  const parsedDate = new Date(date);

  return {
    dateLabel: formatDate(parsedDate),
    timeLabel: new Intl.DateTimeFormat(getActiveLocale(), {
      hour: 'numeric',
      minute: '2-digit',
    }).format(parsedDate),
  };
}
