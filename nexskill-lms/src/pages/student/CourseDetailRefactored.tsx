import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StudentAppLayout from "../../layouts/StudentAppLayout";
import { supabase } from "../../lib/supabaseClient";
import { useCourse } from "../../hooks/useCourse";
import { useEnrollment } from "../../hooks/useEnrollment";
import CourseDetailContent from "../../components/courses/CourseDetailContent";
import CourseEnrollmentCard from "../../components/courses/CourseEnrollmentCard";
import CourseCurriculumTab from "../../components/courses/tabs/CourseCurriculumTab";
import CourseReviewsTab from "../../components/courses/tabs/CourseReviewsTab";
import CourseCoachTab from "../../components/courses/tabs/CourseCoachTab";

/**
 * CourseDetail Page - Clean component focused on presentation
 *
 * Responsibilities:
 * - Page layout and structure
 * - Coordinating child components
 * - User feedback (alerts, navigation)
 *
 * NOT responsible for:
 * - Data fetching (delegated to hooks)
 * - Business logic (delegated to hooks)
 * - Complex state management
 */
const CourseDetailRefactored: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  // Tab State
  const [activeTab, setActiveTab] = useState<
    "overview" | "curriculum" | "reviews" | "coach"
  >("overview");

  // Custom hooks handle all data and business logic
  const { course, loading: loadingCourse, error } = useCourse(courseId);
  const {
    isEnrolled,
    checking,
    loading: enrolling,
    enroll,
    unenroll,
  } = useEnrollment(courseId);

  // Wishlist state
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const checkWishlist = async () => {
      if (!courseId) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('student_wishlist')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle();
      if (data) setIsWishlisted(true);
    };
    checkWishlist();
  }, [courseId]);

  // Simple event handlers that delegate to hooks
  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleEnroll = async () => {
    const result = await enroll();

    if (result.success) {
      showFeedback('success', `Successfully enrolled in ${course?.title}!`);
    } else {
      showFeedback('error', `Failed to enroll: ${result.error}`);
    }
  };

  const handleUnenroll = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to leave ${course?.title}?\n\n` +
      "You will lose access to:\n" +
      "• Course circle discussions\n" +
      "• Progress tracking\n" +
      "• Community features\n\n" +
      "You can re-enroll at any time.",
    );

    if (!confirmed) return;

    const result = await unenroll();

    if (result.success) {
      showFeedback('success', `You have been unenrolled from ${course?.title}.`);
    } else {
      showFeedback('error', `Failed to unenroll: ${result.error}`);
    }
  };

  const handleAddToWishlist = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser || !course) return;
      if (isWishlisted) {
        await supabase.from('student_wishlist').delete().match({ user_id: authUser.id, course_id: course.id });
        setIsWishlisted(false);
      } else {
        await supabase.from('student_wishlist').insert({ user_id: authUser.id, course_id: course.id });
        setIsWishlisted(true);
      }
    } catch (err) {
      console.error('Error updating wishlist:', err);
    }
  };

  // Loading state
  if (loadingCourse) {
    return (
      <StudentAppLayout>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-text-secondary">Loading course...</p>
          </div>
        </div>
      </StudentAppLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <StudentAppLayout>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center text-red-500">
            <h2 className="text-2xl font-bold mb-2">Error Loading Course</h2>
            <p className="mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 text-black"
            >
              Retry
            </button>
          </div>
        </div>
      </StudentAppLayout>
    );
  }

  // Not found state
  if (!course) {
    return (
      <StudentAppLayout>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary mb-2">
              Course not found
            </h2>
            <p className="text-text-secondary dark:text-dark-text-secondary mb-6">
              The course you're looking for doesn't exist.
            </p>
            <p className="text-xs text-gray-400 mb-4">Course ID: {courseId}</p>
            <button
              onClick={() => navigate("/student/courses")}
              className="px-6 py-3 bg-gradient-to-r from-brand-primary to-brand-primary-light text-white font-medium rounded-full hover:shadow-lg transition-all"
            >
              Browse courses
            </button>
          </div>
        </div>
      </StudentAppLayout>
    );
  }

  // Main render - clean and focused
  return (
    <StudentAppLayout>
      {/* Feedback banner */}
      {feedbackMessage && (
        <div className={`px-8 py-3 text-sm font-medium ${feedbackMessage.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
          {feedbackMessage.text}
        </div>
      )}
      {/* Header */}
      <div className="px-8 py-6 border-b border-[#EDF0FB] dark:border-gray-700">
        <button
          onClick={() => navigate("/student/courses")}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-brand-primary mb-4 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to catalog
        </button>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary">
                {course.title}
              </h1>
              <span className="px-3 py-1 bg-brand-primary-soft text-brand-primary rounded-full text-xs font-medium">
                {course.level}
              </span>
            </div>
            <p className="text-sm text-text-secondary dark:text-dark-text-secondary mb-3">
              {course.category}
            </p>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-1">
                <span className="text-yellow-500">★</span>
                <span className="font-semibold text-text-primary dark:text-dark-text-primary">
                  {course.rating.toFixed(1)}
                </span>
                <span className="text-text-muted dark:text-dark-text-muted">
                  ({course.reviewCount} reviews)
                </span>
              </div>
              <div className="flex items-center gap-1 text-text-secondary dark:text-dark-text-secondary">
                <span>👥</span>
                <span>{course.studentsCount.toLocaleString()} students</span>
              </div>
              <div className="flex items-center gap-1 text-text-secondary dark:text-dark-text-secondary">
                <span>⏱️</span>
                <span>{course.duration}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="flex gap-6">
          {/* Left: Course Content */}
          <div className="flex-1 min-w-0">
            {/* Tab Bar */}
            <div className="flex gap-4 mb-6 border-b border-[#EDF0FB] dark:border-gray-700">
              {(["overview", "curriculum", "reviews", "coach"] as const).map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 text-sm font-medium capitalize transition-all border-b-2 ${activeTab === tab
                      ? "text-brand-primary border-brand-primary"
                      : "text-text-secondary border-transparent hover:text-brand-primary"
                      }`}
                  >
                    {tab}
                  </button>
                ),
              )}
            </div>

            <div className="bg-white dark:bg-dark-background-card rounded-3xl shadow-card p-8">
              {activeTab === "overview" && (
                <CourseDetailContent
                  description={course.description}
                  whatYouLearn={course.whatYouLearn}
                  tools={course.tools}
                  isEnrolled={isEnrolled}
                />
              )}

              {activeTab === "curriculum" && (
                <CourseCurriculumTab curriculum={course.curriculum || []} />
              )}

              {activeTab === "reviews" && (
                <CourseReviewsTab
                  reviews={course.reviews || []}
                  rating={course.rating}
                  reviewCount={course.reviewCount}
                />
              )}

              {activeTab === "coach" && (
                <CourseCoachTab coach={course.coach || null} />
              )}
            </div>
          </div>

          {/* Right: Enrollment Card */}
          <div className="w-80 flex-shrink-0">
            <CourseEnrollmentCard
              courseId={course.id}
              price={course.price}
              originalPrice={course.originalPrice}
              includes={course.includes}
              isEnrolled={isEnrolled}
              checking={checking}
              enrolling={enrolling}
              onEnroll={handleEnroll}
              onUnenroll={handleUnenroll}
              onAddToWishlist={handleAddToWishlist}
            />
          </div>
        </div>
      </div>
    </StudentAppLayout>
  );
};

export default CourseDetailRefactored;
