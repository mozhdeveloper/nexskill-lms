import React from 'react';

interface Course {
  id: string;
  title: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  rating: number;
  reviewCount?: number;
  studentsCount: number;
  duration: string;
  price: number;
  originalPrice?: number;
  isBestseller?: boolean;
  isNew?: boolean;
  thumbnail: string;
  shortDescription: string;
  isEnrolled?: boolean;
  progressPercent?: number;
  completedLessons?: number;
  totalLessons?: number;
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

  const reviewCount = course.reviewCount || 0;
  const isEnrolled = course.isEnrolled || false;
  const progressPercent = course.progressPercent || 0;

  return (
    <div
      onClick={() => onClick(course.id)}
      className="bg-white dark:bg-slate-800 rounded-3xl shadow-card hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer overflow-hidden group">
      {/* Thumbnail */}
      <div className={`relative h-40 bg-gradient-to-br ${gradientClasses[course.thumbnail] || 'from-gray-100 to-gray-200'} dark:opacity-90 flex items-center justify-center`}>
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
          {isEnrolled && (
            <span className="px-3 py-1 bg-green-500 text-white rounded-full text-xs font-medium">
              Enrolled
            </span>
          )}
        </div>

        {/* Placeholder Icon */}
        <div className="text-6xl opacity-20">📚</div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Title */}
        <h3 className="text-base font-semibold text-text-primary dark:text-white mb-2 line-clamp-2 group-hover:text-brand-primary dark:group-hover:text-blue-400 transition-colors">
          {course.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-text-secondary dark:text-slate-400 mb-4 line-clamp-2">
          {course.shortDescription}
        </p>

        {/* Rating with Reviews */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            <span className="text-yellow-500 text-sm">★</span>
            <span className="font-semibold text-text-primary dark:text-white">{course.rating.toFixed(1)}</span>
          </div>
          {reviewCount > 0 && (
            <span className="text-xs text-text-muted dark:text-slate-500">
              ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
            </span>
          )}
        </div>

        {/* Meta Row */}
        <div className="flex items-center gap-4 mb-4 text-xs text-text-muted dark:text-slate-500">
          <div className="flex items-center gap-1">
            <span>👥</span>
            <span>{course.studentsCount.toLocaleString()} students</span>
          </div>
          <div className="flex items-center gap-1">
            <span>⏱️</span>
            <span>{course.duration}</span>
          </div>
        </div>

        {/* Progress Bar for Enrolled Courses */}
        {isEnrolled && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium text-text-primary dark:text-white">Your Progress</span>
              <span className="text-text-muted dark:text-slate-500">{progressPercent}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  progressPercent === 100 
                    ? 'bg-green-500' 
                    : 'bg-gradient-to-r from-brand-primary to-brand-primary-light'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {course.completedLessons !== undefined && course.totalLessons !== undefined && (
              <p className="text-xs text-text-muted dark:text-slate-500 mt-1">
                {course.completedLessons} of {course.totalLessons} lessons completed
              </p>
            )}
            {progressPercent === 100 && (
              <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                🎉 Course completed!
              </p>
            )}
          </div>
        )}

        {/* Pricing & CTA */}
        {!isEnrolled && (
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-text-primary dark:text-white">₱{course.price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              {course.originalPrice && (
                <span className="text-sm text-text-muted dark:text-slate-500 line-through">₱{course.originalPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              )}
            </div>
            <button className="px-4 py-2 bg-brand-primary-soft text-brand-primary text-sm font-medium rounded-full hover:bg-brand-primary hover:text-white transition-colors">
              View details
            </button>
          </div>
        )}

        {/* Continue Learning Button for Enrolled */}
        {isEnrolled && (
          <button className="w-full px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-primary-light text-white text-sm font-medium rounded-full hover:shadow-lg transition-all">
            {progressPercent === 100 ? 'View Certificate' : 'Continue Learning'}
          </button>
        )}
      </div>
    </div>
  );
};

export default CourseGridItem;
