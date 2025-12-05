import React from 'react';
import { useUiPreferences } from '../../context/UiPreferencesContext';

const DarkModeToggle: React.FC = () => {
  const { theme, setTheme } = useUiPreferences();

  const isDark = theme === 'dark';

  const handleToggle = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <button
      onClick={handleToggle}
      className="flex items-center gap-2 px-3 py-2 rounded-full bg-white dark:bg-dark-background-card hover:bg-[#E0E5FF] dark:hover:bg-gray-700 border border-[#EDF0FB] dark:border-gray-600 transition-all duration-200 shadow-sm hover:shadow-md"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {/* Icon Container with sliding animation */}
      <div className="relative w-10 h-5 bg-[#E0E5FF] dark:bg-gray-700 rounded-full transition-colors">
        <div
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-[#304DB5] dark:bg-blue-500 rounded-full transition-transform duration-200 flex items-center justify-center ${
            isDark ? 'translate-x-5' : 'translate-x-0'
          }`}
        >
          {isDark ? (
            <span className="text-[10px]">🌙</span>
          ) : (
            <span className="text-[10px]">☀️</span>
          )}
        </div>
      </div>

      {/* Label */}
      <span className="text-xs font-medium text-[#5F6473] dark:text-dark-text-secondary min-w-[32px]">
        {isDark ? 'Dark' : 'Light'}
      </span>
    </button>
  );
};

export default DarkModeToggle;
