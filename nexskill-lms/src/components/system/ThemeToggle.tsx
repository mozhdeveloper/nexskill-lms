import React, { useState } from 'react';

type ThemeToggleVariant = 'button' | 'dropdown' | 'compact';

interface ThemeToggleProps {
  variant?: ThemeToggleVariant;
  showLabel?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  variant = 'button', 
  showLabel = true 
}) => {
  // Local state only - doesn't affect anything
  const [localTheme, setLocalTheme] = useState<'light' | 'dark' | 'system'>('light');

  if (variant === 'dropdown') {
    return (
      <div className="relative">
        <label className="block text-sm font-medium text-text-primary mb-2">
          Theme
        </label>
        <select
          value={localTheme}
          onChange={(e) => setLocalTheme(e.target.value as 'light' | 'dark' | 'system')}
          className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary transition-colors"
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
        onClick={() => setLocalTheme(localTheme === 'light' ? 'dark' : 'light')}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        title={`Switch to ${localTheme === 'light' ? 'dark' : 'light'} mode`}
      >
        {localTheme === 'light' ? '🌙' : '☀️'}
      </button>
    );
  }

  // Default button variant with all options
  return (
    <div>
      {showLabel && (
        <label className="block text-sm font-medium text-text-primary mb-3">
          Appearance
        </label>
      )}
      <div className="flex gap-2">
        <button
          onClick={() => setLocalTheme('light')}
          className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
            localTheme === 'light'
              ? 'border-brand-primary bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-2xl">☀️</span>
            <span className="text-sm font-medium text-text-primary">
              Light
            </span>
          </div>
        </button>

        <button
          onClick={() => setLocalTheme('dark')}
          className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
            localTheme === 'dark'
              ? 'border-brand-primary bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-2xl">🌙</span>
            <span className="text-sm font-medium text-text-primary">
              Dark
            </span>
          </div>
        </button>

        <button
          onClick={() => setLocalTheme('system')}
          className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
            localTheme === 'system'
              ? 'border-brand-primary bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-2xl">💻</span>
            <span className="text-sm font-medium text-text-primary">
              System
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default ThemeToggle;
