import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface UiPreferencesContextType {
  language: string;
  theme: Theme;
  setLanguage: (lang: string) => void;
  setTheme: (theme: Theme) => void;
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

  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      // Logic mirrors index.html to ensure sync
      const persisted = localStorage.getItem('ui-theme') as Theme;
      return persisted || 'light'; // Default to light
    }
    return 'light';
  });

  // Apply theme class to document element
  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    localStorage.setItem('ui-theme', theme);
  }, [theme]);

  // Persist language changes
  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ui-language', lang);
    }
  };

  // Persist theme changes
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <UiPreferencesContext.Provider value={{ language, theme, setLanguage, setTheme }}>
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
