import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(localStorage.getItem('lang') || 'en');
  const [translations, setTranslations] = useState({});

  const loadTranslations = async (lang) => {
    try {
      const res = await fetch(`/static/translations/${lang}.json`);
      if (res.ok) {
        const data = await res.json();
        setTranslations(data);
      }
    } catch (err) {
      console.error("Failed to load translations for", lang, err);
    }
  };

  useEffect(() => {
    loadTranslations(language);
  }, [language]);

  const changeLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem('lang', lang);
  };

  const t = (key, fallback = '') => {
    return translations[key] || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
