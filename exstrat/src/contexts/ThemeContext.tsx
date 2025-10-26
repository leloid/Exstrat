'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
  language: 'fr' | 'en';
  toggleDarkMode: () => void;
  setLanguage: (lang: 'fr' | 'en') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Charger depuis localStorage ou valeur par défaut (mode clair par défaut)
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguageState] = useState<'fr' | 'en'>('fr');

  // Charger les préférences depuis localStorage au montage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('exstrat_dark_mode');
    const savedLanguage = localStorage.getItem('exstrat_language');
    
    if (savedDarkMode !== null) {
      setIsDarkMode(savedDarkMode === 'true');
    }
    
    if (savedLanguage !== null && (savedLanguage === 'fr' || savedLanguage === 'en')) {
      setLanguageState(savedLanguage);
    }
  }, []);

  // Sauvegarder dans localStorage quand ça change
  useEffect(() => {
    localStorage.setItem('exstrat_dark_mode', isDarkMode.toString());
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('exstrat_language', language);
  }, [language]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const setLanguage = (lang: 'fr' | 'en') => {
    setLanguageState(lang);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, language, toggleDarkMode, setLanguage }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

