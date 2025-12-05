import React from 'react';
import { useUiPreferences } from '../../context/UiPreferencesContext';

type ThemeToggleVariant = 'button' | 'dropdown' | 'compact';

interface ThemeToggleProps {
  variant?: ThemeToggleVariant;
  showLabel?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  variant = 'button', 
  showLabel = true 
}) => {
  const { theme, setTheme } = useUiPreferences();

  if (variant === 'dropdown') {
    return (
      <div className="relative">
        <label className="block text-sm font-medium text-text-primary dark:text-dark-text-primary mb-2">
          Theme
        </label>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
          className="w-full px-4 py-2 bg-white dark:bg-dark-background-card border border-gray-200 dark:border-gray-700 rounded-lg text-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary transition-colors"
        >
          <option value="light">☀️ Light</option>
          <option value="dark">🌙 Dark</option>
          <option value="system">💻 System</option>
        </select>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
    );
  }

  // Default button variant with all options
  return (
    <div>
      {showLabel && (
        <label className="block text-sm font-medium text-text-primary dark:text-dark-text-primary mb-3">
          Appearance
        </label>
      )}
      <div className="flex gap-2">
        <button
          onClick={() => setTheme('light')}
          className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
            theme === 'light'
              ? 'border-brand-primary bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-2xl">☀️</span>
            <span className="text-sm font-medium text-text-primary dark:text-dark-text-primary">
              Light
            </span>
          </div>
        </button>

        <button
          onClick={() => setTheme('dark')}
          className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
            theme === 'dark'
              ? 'border-brand-primary bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-2xl">🌙</span>
            <span className="text-sm font-medium text-text-primary dark:text-dark-text-primary">
              Dark
            </span>
          </div>
        </button>

        <button
          onClick={() => setTheme('system')}
          className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
            theme === 'system'
              ? 'border-brand-primary bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-2xl">💻</span>
            <span className="text-sm font-medium text-text-primary dark:text-dark-text-primary">
              System
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default ThemeToggle;
