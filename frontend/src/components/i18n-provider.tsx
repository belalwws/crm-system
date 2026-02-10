'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Locale, defaultLocale, getMessages, getDirection, locales, localeNames, isRTL } from '@/i18n';

type Messages = ReturnType<typeof getMessages>;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
  isRtl: boolean;
  locales: readonly Locale[];
  localeNames: Record<Locale, string>;
}

const I18nContext = createContext<I18nContextType | null>(null);

function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((acc, part) => acc?.[part], obj) ?? path;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('crm-locale');
      if (saved && locales.includes(saved as Locale)) {
        return saved as Locale;
      }
    }
    return defaultLocale;
  });

  const [messages, setMessages] = useState<Messages>(getMessages(locale));

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    setMessages(getMessages(newLocale));
    localStorage.setItem('crm-locale', newLocale);

    // Update document direction for RTL
    document.documentElement.dir = getDirection(newLocale);
    document.documentElement.lang = newLocale;
  }, []);

  useEffect(() => {
    document.documentElement.dir = getDirection(locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback((key: string): string => {
    return getNestedValue(messages, key);
  }, [messages]);

  return (
    <I18nContext.Provider value={{
      locale,
      setLocale,
      t,
      dir: getDirection(locale),
      isRtl: isRTL(locale),
      locales,
      localeNames,
    }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
