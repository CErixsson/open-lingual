import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import en from './locales/en';
import es from './locales/es';
import sv from './locales/sv';

export type Locale = 'en' | 'es' | 'sv';

const locales: Record<Locale, Record<string, any>> = { en, es, sv };

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: 'en',
  setLocale: () => {},
  t: (key) => key,
});

export const useI18n = () => useContext(I18nContext);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem('linguaflow-locale');
    return (saved as Locale) || 'en';
  });

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('linguaflow-locale', l);
  }, []);

  const t = useCallback((key: string): string => {
    const keys = key.split('.');
    // Try current locale
    let value: any = locales[locale];
    for (const k of keys) {
      value = value?.[k];
    }
    if (typeof value === 'string') return value;
    // Fallback to English
    value = en;
    for (const k of keys) {
      value = value?.[k];
    }
    return typeof value === 'string' ? value : key;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};
