import React, { useState } from 'react';

const DarkModeToggle: React.FC = () => {
  // Local state only - doesn't affect anything
  const [isDark, setIsDark] = useState(false);

  const handleToggle = () => {
    setIsDark(!isDark);
  };

  return (
    <button
      onClick={handleToggle}
      className="flex items-center gap-2 px-3 py-2 rounded-full bg-white hover:bg-[#E0E5FF] border border-[#EDF0FB] transition-all duration-200 shadow-sm hover:shadow-md"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {/* Icon Container with sliding animation */}
      <div className="relative w-10 h-5 bg-[#E0E5FF] rounded-full transition-colors">
        <div
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-[#304DB5] rounded-full transition-transform duration-200 flex items-center justify-center ${
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
      <span className="text-xs font-medium text-[#5F6473] min-w-[32px]">
        {isDark ? 'Dark' : 'Light'}
      </span>
    </button>
  );
};

export default DarkModeToggle;
