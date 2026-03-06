import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

// Keep dummy data for fallback or development if DB is empty
const coursesData: Record<string, any> = {
  // ... (keeping structure minimal or compatible if needed, or largely ignoring if we fully switch)
  // For now, let's assume if ID doesn't match DB, we show not found, 
  // but if we want to suppress errors for demo purposes we could keep it. 
  // I will focus on the REAL implementation.
};

// Define CourseDisplay interface
interface CourseDisplay {
  id: string;
  title: string;
  category: string;
  level: string;
  rating: number;
  reviewCount: number;
  studentsCount: number;
  duration: string;
  price: number;
  originalPrice?: number;
  description: string;
  whatYouLearn: string[];
  tools: string[];
  curriculum: any[];
  reviews: any[];
  coach: {
    name: string;
    avatar: string;
    bio: string;
    studentsCount: number;
    coursesCount: number;
    rating: number;
  } | null;
  includes: string[];
}

const CourseDetail: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'reviews' | 'coach'>('overview');
  const [expandedModules, setExpandedModules] = useState<number[]>([1]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [course, setCourse] = useState<CourseDisplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(false);

  // Check if user is enrolled in the course
  useEffect(() => {
    const checkEnrollment = async () => {
      if (!user || !courseId) return;

      try {
        setCheckingEnrollment(true);
        const { data, error } = await supabase
          .from("enrollments")
          .select("*")
          .eq("profile_id", user.id)
          .eq("course_id", courseId)
          .single();

        if (error && error.code !== "PGRST116") {
          // PGRST116 = no rows returned
          console.error("Error checking enrollment:", error);
        } else if (data) {
          setIsEnrolled(true);
        }
      } catch (err) {
        console.error("Unexpected error checking enrollment:", err);
      } finally {
        setCheckingEnrollment(false);
      }
    };

    checkEnrollment();
  }, [user, courseId]);

  // Fetch course and enrollment status
  useEffect(() => {
    const fetchCourseAndEnrollment = async () => {
      if (!courseId) return;

      try {
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();

        // 1. Fetch Course Details
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select(`
            *,
            category:categories(name),
            coach:profiles!courses_coach_id_fkey(first_name, last_name, bio, avatar:avatar_url)
          `)
          .eq('id', courseId)
          .single();

        if (courseError) throw courseError;

        // 2. Fetch Course Goals
        const { data: goalsData } = await supabase
          .from('course_goals')
          .select('*')
          .eq('course_id', courseId)
          .order('position');

        // 3. Fetch Modules
        const { data: modulesData, error: modulesError } = await supabase
          .from('modules')
          .select('*')
          .eq('course_id', courseId)
          .order('position');

        if (modulesError) throw modulesError;

        // 4. Fetch Content Items (Lessons/Quizzes)
        const moduleIds = modulesData.map(m => m.id);
        const { data: itemsData, error: itemsError } = await supabase
          .from('module_content_with_data')
          .select('*')
          .in('module_id', moduleIds)
          .order('position');

        if (itemsError) throw itemsError;

        // 5. Fetch Enrollment & Progress
        let isUserEnrolled = false;
        let enrollmentDate: string | null = null;
        let userProgress: Record<string, boolean> = {};

        if (user) {
          const { data: enrollment } = await supabase
            .from('enrollments')
            .select('enrolled_at')
            .eq('profile_id', user.id)
            .eq('course_id', courseId)
            .maybeSingle();

          if (enrollment) {
            isUserEnrolled = true;
            enrollmentDate = enrollment.enrolled_at;
            setIsEnrolled(true);

            // Fetch progress
            const { data: progressData } = await supabase
              .from('user_lesson_progress')
              .select('lesson_id, is_completed')
              .eq('user_id', user.id);

            if (progressData) {
              progressData.forEach(p => {
                userProgress[p.lesson_id] = p.is_completed;
              });
            }
          }
        }

        // Helper to check if module is locked via drip
        // Now returns true/false for date/days checks. 
        // Sequential check happens in the loop below.
        const checkDripDateOrDays = (module: any) => {
          if (!isUserEnrolled) return true;

          if (module.drip_mode === 'specific-date' && module.drip_date) {
            return new Date() < new Date(module.drip_date);
          }
          if (module.drip_mode === 'days-after-enrollment' && module.drip_days && enrollmentDate) {
            const unlockDate = new Date(new Date(enrollmentDate).getTime() + module.drip_days * 24 * 60 * 60 * 1000);
            return new Date() < unlockDate;
          }
          return false;
        };

        // Organize content into modules with locking logic
        let previousModuleCompleted = true; // Track previous module status for sequential unlocking

        const structuredCurriculum = modulesData.map((module, index) => {
          // 1. Check basic time-based drip locks
          let isModuleLocked = checkDripDateOrDays(module);

          // 2. Check sequential module lock (after-previous)
          if (module.drip_mode === 'after-previous') {
            if (index > 0 && !previousModuleCompleted) {
              isModuleLocked = true;
            }
          }

          const moduleItems = itemsData.filter(item => item.module_id === module.id) || [];

          // 3. Sequential Lesson Check State (within module)
          let previousLessonCompleted = true;

          const lessonsWithStatus = moduleItems.map((item, idx) => {
            const itemId = item.lesson_id || item.quiz_id;
            const isCompleted = userProgress[itemId] || false;

            let isLessonLocked = isModuleLocked;

            // Enforce sequential lesson order if module is sequential
            if (!isLessonLocked && module.is_sequential) {
              if (idx > 0 && !previousLessonCompleted) {
                isLessonLocked = true;
              }
            }

            // Update tracker for next lesson
            if (isCompleted) {
              previousLessonCompleted = true;
            } else {
              previousLessonCompleted = false;
            }

            return {
              id: itemId,
              title: item.lesson_title || item.quiz_title,
              type: item.content_type,
              duration: item.estimated_duration_minutes ? `${item.estimated_duration_minutes}m` : '5m',
              isLocked: isLessonLocked,
              isCompleted
            };
          });

          // Determine if THIS module is completed (all items completed)
          // Treat empty modules as completed for flow purposes, unless we want to block?
          // Assuming an empty module doesn't block progress.
          const isThisModuleCompleted = moduleItems.length === 0 || moduleItems.every(item => {
            const itemId = item.lesson_id || item.quiz_id;
            return userProgress[itemId] === true;
          });

          // Update global tracker for the NEXT module
          previousModuleCompleted = isThisModuleCompleted;

          return {
            ...module,
            lessons: lessonsWithStatus,
            isLocked: isModuleLocked
          };
        });

        if (courseData) {
          // Map goals to whatYouLearn
          const goals = goalsData ? goalsData.map(g => g.description) : [];

          setCourse({
            id: courseData.id,
            title: courseData.title,
            category: courseData.category?.name || 'General',
            level: courseData.level || 'Beginner',
            rating: 0, // Mock
            reviewCount: 0, // Mock
            studentsCount: 0, // Mock
            duration: courseData.duration_hours ? `${courseData.duration_hours}h` : 'N/A',
            price: courseData.price || 0,
            originalPrice: undefined,
            description: courseData.long_description || courseData.short_description || 'No description available',
            whatYouLearn: goals.length > 0 ? goals : [
              'Master key concepts and practical skills',
              'Apply methodologies to real-world problems',
              'Build a professional portfolio'
            ],
            tools: [],
            curriculum: structuredCurriculum,
            reviews: [],
            coach: courseData.coach ? {
              name: `${courseData.coach.first_name} ${courseData.coach.last_name || ''}`,
              avatar: '👨‍🏫',
              bio: courseData.coach.bio || 'Expert Instructor',
              studentsCount: 0,
              coursesCount: 0,
              rating: 5.0
            } : null,
            includes: ['Lifetime access', 'Certificate of completion']
          });
        }

      } catch (err: any) {
        console.error('Error fetching course/enrollment:', err);
        setCourse(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseAndEnrollment();
  }, [courseId]);

  const toggleModule = (moduleId: number) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    );
  };

  const handleEnroll = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Please log in to enroll.");
        navigate('/login');
        return;
      }

      if (!course) return;

      // Insert enrollment
      const { error } = await supabase
        .from('enrollments')
        .insert({
          profile_id: user.id,
          course_id: course.id
        });

      if (error) {
        // Check for duplicate key error (already enrolled)
        if (error.code === '23505') {
          setIsEnrolled(true);
          alert("You are already enrolled!");
        } else {
          throw error;
        }
      } else {
        alert(`✅ Successfully enrolled in ${course.title}!\n\n🎉 Welcome to the course! You can now access all lessons and materials.`);
        setIsEnrolled(true);
        // Optionally redirect
      }

    } catch (err: any) {
      console.error('Error enrolling:', err);
      alert('Failed to enroll: ' + err.message);
    }
  };

  const handleUnenroll = async () => {
    try {
      if (!user || !course) return;

      // Implement unenroll logic or show instructions
      // For now, simpler to contact support or just remove from enrollments table
      const { error } = await supabase.from('enrollments').delete().match({ profile_id: user.id, course_id: course.id });

      if (error) throw error;

      setIsEnrolled(false);
      alert('You have successfully unenrolled from the course.');
    } catch (error) {
      console.error("Error unenrolling:", error);
      alert("Failed to unenroll.");
    }
  };

  const handleAddToWishlist = () => {
    console.log('Added to wishlist:', course ? course.id : '');
    alert(`❤️ Added to wishlist!\n\n${course ? course.title : 'Course'} has been saved to your wishlist.`);
  };

  if (loading) {
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
            <Link
              to="/student/courses"
              className="inline-block px-6 py-3 bg-gradient-to-r from-brand-primary to-brand-primary-light text-white font-medium rounded-full hover:shadow-lg transition-all"
            >
              Browse courses
            </Link>
          </div>
        </div>
      </StudentAppLayout>
    );
  }

  return (
    <StudentAppLayout>
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
                  {course.rating}
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
          {/* Left: Tabbed Content */}
          <div className="flex-1 min-w-0">
            {/* Tab Bar - Only Overview */}
            <div className="flex gap-2 mb-6 border-b border-[#EDF0FB] dark:border-gray-700">
              {(['overview', 'curriculum', 'reviews', 'coach'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 text-sm font-medium capitalize transition-all ${activeTab === tab
                    ? 'text-brand-primary border-b-2 border-brand-primary'
                    : 'text-text-secondary hover:text-brand-primary'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white dark:bg-dark-background-card rounded-3xl shadow-card p-8">
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary mb-4">
                      About this course
                    </h3>
                    <p className="text-text-secondary dark:text-dark-text-secondary leading-relaxed">
                      {course.description}
                    </p>
                  </div>

                  {course.whatYouLearn && course.whatYouLearn.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary mb-4">
                        What you'll learn
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {course.whatYouLearn.map(
                          (item: string, index: number) => (
                            <div key={index} className="flex items-start gap-3">
                              <span className="text-green-500 mt-1">✓</span>
                              <span className="text-sm text-text-secondary dark:text-dark-text-secondary">
                                {item}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {course.tools && course.tools.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary mb-4">Tools & Technologies</h3>
                      <div className="flex flex-wrap gap-2">
                        {course.tools.map((tool: string) => (
                          <span
                            key={tool}
                            className="px-4 py-2 bg-[#F5F7FF] dark:bg-gray-800 text-brand-primary rounded-full text-sm font-medium"
                          >
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'curriculum' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary mb-4">Course curriculum</h3>
                  {course.curriculum && course.curriculum.length > 0 ? course.curriculum.map((module: any) => (
                    <div key={module.id} className="border border-[#EDF0FB] dark:border-gray-700 rounded-2xl overflow-hidden">
                      <button
                        onClick={() => toggleModule(module.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-[#F5F7FF] dark:hover:bg-gray-800 dark:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <svg
                            className={`w-5 h-5 text-text-muted transition-transform ${expandedModules.includes(module.id) ? 'rotate-90' : ''
                              }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <span className="font-medium text-text-primary dark:text-dark-text-primary">{module.title}</span>
                        </div>
                        <span className="text-sm text-text-muted dark:text-dark-text-muted">{module.lessons?.length || 0} lessons</span>
                      </button>

                      {expandedModules.includes(module.id) && (
                        <div className="bg-[#FAFBFF] p-4 space-y-2">
                          {module.lessons && module.lessons.map((lesson: any) => (
                            <button
                              key={lesson.id}
                              disabled={lesson.isLocked}
                              onClick={() => {
                                // Navigate to lesson player (Not implemented yet)
                                alert(`Navigate to lesson: ${lesson.title}`);
                              }}
                              className={`w-full flex items-center justify-between py-2 px-3 rounded-lg transition-colors text-left ${lesson.isLocked ? 'opacity-60 cursor-not-allowed bg-gray-50 dark:bg-gray-800/50' :
                                'hover:bg-white dark:hover:bg-dark-background-card cursor-pointer'
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                {lesson.isCompleted ? (
                                  <span className="text-green-500 text-lg">✓</span>
                                ) : lesson.isLocked ? (
                                  <span className="text-gray-400 text-sm">🔒</span>
                                ) : (
                                  <span className="text-brand-primary text-sm">▶️</span>
                                )}
                                <span className={`text-sm ${lesson.isLocked ? 'text-gray-400' : 'text-text-secondary dark:text-dark-text-secondary'}`}>
                                  {lesson.title}
                                </span>
                              </div>
                              <span className="text-xs text-text-muted dark:text-dark-text-muted">{lesson.duration}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )) : (
                    <div className="text-center py-8 text-gray-500">No content available yet.</div>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  {course.reviews && course.reviews.length > 0 ? (
                    <>
                      <div className="flex items-center gap-8 pb-6 border-b border-[#EDF0FB] dark:border-gray-700">
                        <div className="text-center">
                          <div className="text-4xl font-bold text-text-primary dark:text-dark-text-primary mb-1">{course.rating}</div>
                          <div className="text-yellow-500 text-xl mb-1">★★★★★</div>
                          <div className="text-sm text-text-muted dark:text-dark-text-muted">{course.reviewCount} reviews</div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        {course.reviews.map((review: any) => (
                          <div key={review.id} className="pb-6 border-b border-[#EDF0FB] dark:border-gray-700 last:border-0">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-2xl flex-shrink-0">
                                {review.avatar}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <p className="font-medium text-text-primary dark:text-dark-text-primary">{review.userName}</p>
                                    <p className="text-xs text-text-muted dark:text-dark-text-muted">{review.date}</p>
                                  </div>
                                  <div className="text-yellow-500">
                                    {'★'.repeat(review.rating)}
                                  </div>
                                </div>
                                <p className="text-sm text-text-secondary dark:text-dark-text-secondary">{review.comment}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-4">⭐</div>
                      <p className="text-text-muted">No reviews yet. Be the first to review this course!</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'coach' && (
                <div className="space-y-6">
                  {course.coach ? (
                    <>
                      <div className="flex items-start gap-6">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-light flex items-center justify-center text-5xl flex-shrink-0">
                          {course.coach.avatar}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-text-primary dark:text-dark-text-primary mb-2">{course.coach.name}</h3>
                          <p className="text-text-secondary dark:text-dark-text-secondary mb-4">{course.coach.bio}</p>

                          <div className="flex gap-6">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-text-primary dark:text-dark-text-primary">{course.coach.studentsCount.toLocaleString()}</div>
                              <div className="text-xs text-text-muted dark:text-dark-text-muted">Students</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-text-primary dark:text-dark-text-primary">{course.coach.coursesCount}</div>
                              <div className="text-xs text-text-muted dark:text-dark-text-muted">Courses</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-text-primary dark:text-dark-text-primary">{course.coach.rating}</div>
                              <div className="text-xs text-text-muted dark:text-dark-text-muted">Rating</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-4">👨‍🏫</div>
                      <p className="text-text-muted">Instructor information coming soon</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Pricing Card */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white dark:bg-dark-background-card rounded-3xl shadow-card p-6 sticky top-6">
              <div className="mb-6">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-3xl font-bold text-text-primary dark:text-dark-text-primary">
                    ${course.price}
                  </span>
                  {course.originalPrice && (
                    <span className="text-lg text-text-muted line-through">
                      ${course.originalPrice}
                    </span>
                  )}
                </div>
                {course.originalPrice && (
                  <span className="text-sm text-green-600 font-medium">
                    Save{" "}
                    {Math.round(
                      ((course.originalPrice - course.price) /
                        course.originalPrice) *
                      100,
                    )}
                    %
                  </span>
                )}
              </div>

              {checkingEnrollment ? (
                <div className="py-8 text-center">
                  <div className="w-8 h-8 border-3 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm text-text-muted">
                    Checking enrollment...
                  </p>
                </div>
              ) : isEnrolled ? (
                <div className="space-y-3 mb-6">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-2xl text-center">
                    <span className="text-green-700 dark:text-green-400 font-medium">
                      ✓ You're enrolled!
                    </span>
                  </div>
                  <Link
                    to={`/student/courses/${course.id}/circle`}
                    className="w-full py-3 px-4 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-medium rounded-full flex items-center justify-center gap-2 hover:shadow-lg hover:scale-[1.02] transition-all"
                  >
                    <span>💬</span>
                    <span>Join Course Circle</span>
                  </Link>
                  <button
                    onClick={handleUnenroll}
                    disabled={enrolling}
                    className="w-full py-3 bg-white dark:bg-gray-800 border-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 font-medium rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {enrolling ? "Processing..." : "Leave Course"}
                  </button>
                </div>
              ) : (
                <div className="space-y-3 mb-6">
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="w-full py-3 bg-gradient-to-r from-brand-primary to-brand-primary-light text-white font-medium rounded-full shadow-button-primary hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {enrolling ? "Enrolling..." : "Enroll now"}
                  </button>
                  <button
                    onClick={handleAddToWishlist}
                    className="w-full py-3 bg-white dark:bg-gray-800 border-2 border-brand-primary text-brand-primary font-medium rounded-full hover:bg-brand-primary-soft dark:hover:bg-gray-700 transition-colors"
                  >
                    Add to wishlist
                  </button>
                </div>
              )}

              <div className="pt-6 border-t border-[#EDF0FB] dark:border-gray-700">
                {course.includes && course.includes.length > 0 && (
                  <>
                    <h4 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary mb-3">
                      This course includes:
                    </h4>
                    <div className="space-y-2">
                      {course.includes.map((item: string, index: number) => (
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
          </div>
        </div>
      </div>
    </StudentAppLayout>
  );
};

export default CourseDetail;