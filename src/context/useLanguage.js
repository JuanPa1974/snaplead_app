import { useContext } from 'react';
import { LanguageContext } from './language-context-core';

export const useLanguage = () => useContext(LanguageContext);
