import React, { createContext, useState, useEffect, useCallback } from 'react';

export type Translations = Record<string, string | ((args?: any) => string)>;

export interface TranslationContextProps {
  t: (key: string, args?: Record<string, any>) => string;
  language: string;
  setLanguage: (lang: string) => void;
  availableLanguages: { code: string; label: string }[];
}

export const TranslationContext = createContext<TranslationContextProps>({
  t: (key) => key,
  language: 'en-EN',
  setLanguage: () => {},
  availableLanguages: [
    { code: 'en-EN', label: 'English' },
    { code: 'it-IT', label: 'Italiano' },
    { code: 'de-DE', label: 'Deutsch' },
    { code: 'es-ES', label: 'Español' },
    { code: 'fr-FR', label: 'Français' },
  ],
});

const languageFiles: Record<string, () => Promise<any>> = {
  'en-EN': () => import('./en-EN.json'),
  'it-IT': () => import('./it-IT.json'),
  'de-DE': () => import('./de-DE.json'),
  'es-ES': () => import('./es-ES.json'),
  'fr-FR': () => import('./fr-FR.json'),
};

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState('en-EN');
  const [translations, setTranslations] = useState<Translations>({});

  useEffect(() => {
    languageFiles[language]()
      .then((mod) => setTranslations(mod.default || mod))
      .catch(() => setTranslations({}));
  }, [language]);

  const t = useCallback(
    (key: string, args?: Record<string, any>) => {
      let value = translations[key];
      if (!value) return key;
      if (typeof value === 'function') return value(args);
      if (typeof value === 'string' && args) {
        Object.entries(args).forEach(([k, v]) => {
          value = (value as any).replace(new RegExp(`\\{${k}\\}`, 'g'), v);
        });
      }
      return typeof value === 'string' ? value : key;
    },
    [translations]
  );

  const availableLanguages = [
    { code: 'en-EN', label: 'English' },
    { code: 'it-IT', label: 'Italiano' },
    { code: 'de-DE', label: 'Deutsch' },
    { code: 'es-ES', label: 'Español' },
    { code: 'fr-FR', label: 'Français' },
  ];

  return (
    <TranslationContext.Provider value={{ t, language, setLanguage, availableLanguages }}>
      {children}
    </TranslationContext.Provider>
  );
};
