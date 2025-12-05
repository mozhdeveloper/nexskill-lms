import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface UiPreferencesContextType {
  language: string;
  setLanguage: (lang: string) => void;
}

const UiPreferencesContext = createContext<UiPreferencesContextType | undefined>(undefined);

interface UiPreferencesProviderProps {
  children: ReactNode;
}

export const UiPreferencesProvider: React.FC<UiPreferencesProviderProps> = ({ children }) => {
  // Initialize from localStorage or defaults
  const [language, setLanguageState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ui-language') || 'en';
    }
    return 'en';
  });

  // Persist language changes
  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ui-language', lang);
    }
  };

  return (
    <UiPreferencesContext.Provider value={{ language, setLanguage }}>
      {children}
    </UiPreferencesContext.Provider>
  );
};

export const useUiPreferences = () => {
  const context = useContext(UiPreferencesContext);
  if (!context) {
    throw new Error('useUiPreferences must be used within UiPreferencesProvider');
  }
  return context;
};
