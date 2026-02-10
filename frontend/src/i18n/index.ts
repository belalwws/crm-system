import en from './messages/en.json';
import ar from './messages/ar.json';

export const locales = ['en', 'ar'] as const;
export type Locale = (typeof locales)[number];

export const rtlLocales: Locale[] = ['ar'];

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ar: 'العربية',
};

export const messages: Record<Locale, typeof en> = {
  en,
  ar,
};

export const defaultLocale: Locale = 'en';

/**
 * Get messages for a locale
 */
export function getMessages(locale: Locale) {
  return messages[locale] || messages.en;
}

/**
 * Check if locale is RTL
 */
export function isRTL(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}

/**
 * Get direction for locale
 */
export function getDirection(locale: Locale): 'ltr' | 'rtl' {
  return isRTL(locale) ? 'rtl' : 'ltr';
}
