import React from 'react';

interface CourseCategorySidebarProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const categoryIcons: Record<string, string> = {
  'All': '🎯',
  'Design': '🎨',
  'Development': '💻',
  'Marketing': '📈',
  'Data & Analytics': '📊',
  'Business': '💼',
};

const CourseCategorySidebar: React.FC<CourseCategorySidebarProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
}) => {
  return (
    <div className="bg-white rounded-3xl shadow-card p-6 sticky top-6 transition-colors">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Categories</h3>
      
      <div className="space-y-2">
        {categories.map((category) => {
          const isActive = selectedCategory === category;
          
          return (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                isActive
                  ? 'bg-gradient-to-r from-brand-primary to-brand-primary-light text-white shadow-button-primary'
                  : 'bg-[#F5F7FF] text-text-secondary hover:bg-brand-primary-soft/30 hover:text-brand-primary'
              }`}
            >
              <span className="text-lg">{categoryIcons[category] || '📁'}</span>
              <span className="text-sm font-medium">{category}</span>
            </button>
          );
        })}
      </div>

      {/* Course Count Info */}
      <div className="mt-6 p-4 bg-[#F5F7FF] rounded-2xl transition-colors">
        <p className="text-xs text-text-secondary">
          💡 <span className="font-medium">Tip:</span> Select a category to filter courses by your interests
        </p>
      </div>
    </div>
  );
};

export default CourseCategorySidebar;
