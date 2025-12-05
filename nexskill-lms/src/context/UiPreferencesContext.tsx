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
      return (localStorage.getItem('ui-theme') as Theme) || 'light';
    }
    return 'light';
  });

  // Apply theme class to document element
  useEffect(() => {
    const root = document.documentElement;
    
    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    if (theme === 'dark') {
      applyTheme(true);
    } else if (theme === 'light') {
      applyTheme(false);
    } else if (theme === 'system') {
      // Detect system preference
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);
      
      // Listen for system theme changes
      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener('change', handler);
      
      return () => mediaQuery.removeEventListener('change', handler);
    }
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
    if (typeof window !== 'undefined') {
      localStorage.setItem('ui-theme', newTheme);
    }
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
