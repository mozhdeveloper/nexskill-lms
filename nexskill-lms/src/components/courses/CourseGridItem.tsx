import React from 'react';

interface Course {
  id: string;
  title: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  rating: number;
  studentsCount: number;
  duration: string;
  price: number;
  originalPrice?: number;
  isBestseller?: boolean;
  isNew?: boolean;
  thumbnail: string;
  shortDescription: string;
}

interface CourseGridItemProps {
  course: Course;
  onClick: (courseId: string) => void;
}

const CourseGridItem: React.FC<CourseGridItemProps> = ({ course, onClick }) => {
  const levelColors = {
    Beginner: 'bg-green-100/30 text-green-700',
    Intermediate: 'bg-blue-100/30 text-blue-700',
    Advanced: 'bg-purple-100/30 text-purple-700',
  };

  const gradientClasses: Record<string, string> = {
    'gradient-blue-purple': 'from-blue-100 to-purple-100',
    'gradient-purple-pink': 'from-purple-100 to-pink-100',
    'gradient-pink-orange': 'from-pink-100 to-orange-100',
    'gradient-green-blue': 'from-green-100 to-blue-100',
    'gradient-orange-red': 'from-orange-100 to-red-100',
  };

  return (
    <div
      onClick={() => onClick(course.id)}
      className="bg-white rounded-3xl shadow-card hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer overflow-hidden group"
    >
      {/* Thumbnail */}
      <div className={`relative h-40 bg-gradient-to-br ${gradientClasses[course.thumbnail] || 'from-gray-100 to-gray-200'} flex items-center justify-center`}>
        {/* Level Badge */}
        <div className="absolute top-4 left-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${levelColors[course.level]}`}>
            {course.level}
          </span>
        </div>

        {/* Status Badges */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          {course.isBestseller && (
            <span className="px-3 py-1 bg-orange-500 text-white rounded-full text-xs font-medium">
              Bestseller
            </span>
          )}
          {course.isNew && (
            <span className="px-3 py-1 bg-brand-primary text-white rounded-full text-xs font-medium">
              New
            </span>
          )}
        </div>

        {/* Placeholder Icon */}
        <div className="text-6xl opacity-20">📚</div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Title */}
        <h3 className="text-base font-semibold text-text-primary mb-2 line-clamp-2 group-hover:text-brand-primary transition-colors">
          {course.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-text-secondary mb-4 line-clamp-2">
          {course.shortDescription}
        </p>

        {/* Meta Row */}
        <div className="flex items-center gap-4 mb-4 text-xs text-text-muted">
          <div className="flex items-center gap-1">
            <span className="text-yellow-500">★</span>
            <span className="font-medium text-text-primary">{course.rating}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>👥</span>
            <span>{course.studentsCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>⏱️</span>
            <span>{course.duration}</span>
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-text-primary">${course.price}</span>
            {course.originalPrice && (
              <span className="text-sm text-text-muted line-through">${course.originalPrice}</span>
            )}
          </div>
          <button className="px-4 py-2 bg-brand-primary-soft text-brand-primary text-sm font-medium rounded-full hover:bg-brand-primary hover:text-white transition-colors">
            View details
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseGridItem;
