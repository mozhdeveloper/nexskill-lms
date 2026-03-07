import React from "react";
import { Link } from "react-router-dom";

interface CourseEnrollmentCardProps {
  courseId: string;
  price: number;
  originalPrice?: number;
  includes?: string[];
  isEnrolled: boolean;
  checking: boolean;
  enrolling: boolean;
  onEnroll: () => void;
  onUnenroll: () => void;
  onAddToWishlist: () => void;
}

const CourseEnrollmentCard: React.FC<CourseEnrollmentCardProps> = ({
  courseId,
  price,
  originalPrice,
  includes,
  isEnrolled,
  checking,
  enrolling,
  onEnroll,
  onUnenroll,
  onAddToWishlist,
}) => {
  return (
    <div className="bg-white dark:bg-dark-background-card rounded-3xl shadow-card p-6 sticky top-6">
      {/* Pricing */}
      <div className="mb-6">
        <div className="flex items-baseline gap-3 mb-2">
          <span className="text-3xl font-bold text-text-primary dark:text-dark-text-primary">
            ${price}
          </span>
          {originalPrice && (
            <span className="text-lg text-text-muted line-through">
              ${originalPrice}
            </span>
          )}
        </div>
        {originalPrice && (
          <span className="text-sm text-green-600 font-medium">
            Save {Math.round(((originalPrice - price) / originalPrice) * 100)}%
          </span>
        )}
      </div>

      {/* Enrollment Actions */}
      {checking ? (
        <div className="py-8 text-center">
          <div className="w-8 h-8 border-3 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-text-muted">Checking enrollment...</p>
        </div>
      ) : isEnrolled ? (
        <div className="space-y-3 mb-6">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-2xl text-center">
            <span className="text-green-700 dark:text-green-400 font-medium">
              ✓ You're enrolled!
            </span>
          </div>
          <Link
            to={`/student/courses/${courseId}/circle`}
            className="w-full py-3 px-4 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-medium rounded-full flex items-center justify-center gap-2 hover:shadow-lg hover:scale-[1.02] transition-all"
          >
            <span>💬</span>
            <span>Join Course Circle</span>
          </Link>
          <button
            onClick={onUnenroll}
            disabled={enrolling}
            className="w-full py-3 bg-white dark:bg-gray-800 border-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 font-medium rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {enrolling ? "Processing..." : "Leave Course"}
          </button>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          <button
            onClick={onEnroll}
            disabled={enrolling}
            className="w-full py-3 bg-gradient-to-r from-brand-primary to-brand-primary-light text-white font-medium rounded-full shadow-button-primary hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {enrolling ? "Enrolling..." : "Enroll now"}
          </button>
          <button
            onClick={onAddToWishlist}
            className="w-full py-3 bg-white dark:bg-gray-800 border-2 border-brand-primary text-brand-primary font-medium rounded-full hover:bg-brand-primary-soft dark:hover:bg-gray-700 transition-colors"
          >
            Add to wishlist
          </button>
        </div>
      )}

      {/* Course Includes */}
      <div className="pt-6 border-t border-[#EDF0FB] dark:border-gray-700">
        {includes && includes.length > 0 && (
          <>
            <h4 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary mb-3">
              This course includes:
            </h4>
            <div className="space-y-2">
              {includes.map((item: string, index: number) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-brand-primary mt-0.5">✓</span>
                  <span className="text-sm text-text-secondary dark:text-dark-text-secondary">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Enrollment Benefits */}
        {!isEnrolled && (
          <div className="mt-6 pt-6 border-t border-[#EDF0FB] dark:border-gray-700">
            <h4 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary mb-3">
              When you enroll:
            </h4>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">💬</span>
                <span className="text-sm text-text-secondary dark:text-dark-text-secondary">
                  Access to Course Circle chat
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">👥</span>
                <span className="text-sm text-text-secondary dark:text-dark-text-secondary">
                  Connect with other students
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-500 mt-0.5">📚</span>
                <span className="text-sm text-text-secondary dark:text-dark-text-secondary">
                  Early access to course materials
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseEnrollmentCard;
