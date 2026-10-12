import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { translations, Language } from '@/lib/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.en;
  navigateToLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'oldamsterdam-language';
const VALID_LANGUAGES: Language[] = ['en', 'fr', 'de', 'it'];

function detectBrowserLanguage(): Language {
  const browserLang = navigator.language.toLowerCase();
  
  if (browserLang.startsWith('fr')) return 'fr';
  if (browserLang.startsWith('de')) return 'de';
  if (browserLang.startsWith('it')) return 'it';
  
  return 'en';
}

function getLanguageFromPath(): Language | null {
  const path = window.location.pathname;
  const match = path.match(/^\/(en|fr|de|it)\/?/);
  if (match && VALID_LANGUAGES.includes(match[1] as Language)) {
    return match[1] as Language;
  }
  return null;
}

function getStoredLanguage(): Language | null {
  const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (savedLanguage && VALID_LANGUAGES.includes(savedLanguage as Language)) {
    return savedLanguage as Language;
  }
  return null;
}

function getInitialLanguage(): Language {
  const pathLang = getLanguageFromPath();
  if (pathLang) return pathLang;
  
  const storedLang = getStoredLanguage();
  if (storedLang) return storedLang;
  
  return detectBrowserLanguage();
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);
  const [, setLocation] = useLocation();

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  };

  const navigateToLanguage = (lang: Language) => {
    setLanguage(lang);
    setLocation(`/${lang}/`);
  };

  useEffect(() => {
    const pathLang = getLanguageFromPath();
    if (pathLang && pathLang !== language) {
      setLanguage(pathLang);
    }
  }, []);

  const value = {
    language,
    setLanguage,
    t: translations[language],
    navigateToLanguage
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
