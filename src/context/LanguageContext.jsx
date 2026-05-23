import React, { useState } from 'react';
import { translations } from '../i18n';
import { LanguageContext } from './language-context-core';

const getInitialLanguage = () => {
  const savedLang = localStorage.getItem('snapleadLanguage');
  if (savedLang && (savedLang === 'es' || savedLang === 'en')) {
    return savedLang;
  }
  localStorage.setItem('snapleadLanguage', 'es');
  return 'es';
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(getInitialLanguage);

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('snapleadLanguage', lang);
  };

  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
