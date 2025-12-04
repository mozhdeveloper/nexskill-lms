import React from 'react';

interface CourseFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedLevel: string;
  onLevelChange: (level: string) => void;
  sortOption: string;
  onSortChange: (option: string) => void;
}

const levels = ['All', 'Beginner', 'Intermediate', 'Advanced'];
const sortOptions = [
  'Most popular',
  'Highest rated',
  'Newest',
  'Price: low to high',
];

const CourseFilterBar: React.FC<CourseFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedLevel,
  onLevelChange,
  sortOption,
  onSortChange,
}) => {
  return (
    <div className="bg-white rounded-3xl shadow-card p-6 mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search courses"
              className="w-full pl-12 pr-5 py-3 bg-[#F5F7FF] rounded-full text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-primary-light transition-all"
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Level Filter */}
        <div className="flex items-center gap-2">
          {levels.map((level) => (
            <button
              key={level}
              onClick={() => onLevelChange(level)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedLevel === level
                  ? 'bg-brand-primary text-white shadow-button-primary'
                  : 'bg-[#F5F7FF] text-text-secondary hover:bg-brand-primary-soft hover:text-brand-primary'
              }`}
            >
              {level}
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="relative">
          <select
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value)}
            className="pl-4 pr-10 py-3 bg-[#F5F7FF] rounded-full text-sm font-medium text-text-secondary appearance-none focus:outline-none focus:ring-2 focus:ring-brand-primary-light cursor-pointer hover:bg-brand-primary-soft transition-all"
          >
            {sortOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <svg
            className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default CourseFilterBar;
