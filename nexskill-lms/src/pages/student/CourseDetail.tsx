import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

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
  const [enrolling] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Parse description to convert markdown-style lists to proper HTML
  const renderDescription = (text: string) => {
    if (!text) return <p className="text-text-secondary dark:text-dark-text-secondary leading-relaxed">No description available.</p>;

    // Normalize newlines
    const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalizedText.split('\n');
    
    const elements: React.ReactNode[] = [];
    let currentList: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // Check if line is a list item
      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('• ')) {
        currentList.push(trimmedLine.substring(2));
      } else {
        // If we have pending list items, render them first
        if (currentList.length > 0) {
          elements.push(
            <ul key={`list-${i}`} className="list-disc list-inside space-y-1 my-3 ml-2">
              {currentList.map((item, idx) => (
                <li key={idx} className="text-text-secondary dark:text-dark-text-secondary leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          );
          currentList = [];
        }
        
        // Render paragraph if not empty
        if (trimmedLine) {
          elements.push(
            <p key={`p-${i}`} className="text-text-secondary dark:text-dark-text-secondary leading-relaxed mb-4">
              {trimmedLine}
            </p>
          );
        } else {
          // Empty line = spacing
          elements.push(<div key={`space-${i}`} className="h-2" />);
        }
      }
    }

    // Don't forget remaining list items
    if (currentList.length > 0) {
      elements.push(
        <ul key="list-final" className="list-disc list-inside space-y-1 my-3 ml-2">
          {currentList.map((item, idx) => (
            <li key={idx} className="text-text-secondary dark:text-dark-text-secondary leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      );
    }

    return <div className="space-y-2">{elements}</div>;
  };

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

        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select(`
            *,
            category:categories(name),
            coach:profiles!courses_coach_id_fkey(first_name, last_name)
          `)
          .eq('id', courseId)
          .single();

        if (courseError) throw courseError;

        const { data: goalsData } = await supabase
          .from('course_goals')
          .select('*')
          .eq('course_id', courseId)
          .order('position');

        const { data: modulesData, error: modulesError } = await supabase
          .from('modules')
          .select('*')
          .eq('course_id', courseId)
          .order('position');

        if (modulesError) throw modulesError;

        const moduleIds = modulesData.map(m => m.id);
        const { data: itemsData, error: itemsError } = await supabase
          .from('module_content_with_data')
          .select('*')
          .in('module_id', moduleIds)
          .order('position');

        if (itemsError) throw itemsError;

        const [enrollCountResult, reviewsResult, wishlistResult] = await Promise.all([
          supabase.from('enrollments').select('profile_id', { count: 'exact', head: true }).eq('course_id', courseId),
          supabase.from('reviews').select('rating').eq('course_id', courseId),
          user ? supabase.from('student_wishlist').select('id').eq('user_id', user.id).eq('course_id', courseId).maybeSingle() : Promise.resolve({ data: null, error: null })
        ]);

        const enrollmentCount = enrollCountResult.count ?? 0;
        const reviewRows = reviewsResult.data || [];
        const avgRating = reviewRows.length > 0 ? Math.round((reviewRows.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewRows.length) * 10) / 10 : 0;
        if (wishlistResult.data) setIsWishlisted(true);

        let coachStudentsCount = 0;
        let coachCoursesCount = 0;
        let coachRating = 0;
        let coachBio = '';
        if (courseData.coach_id) {
          const [coachCoursesResult, coachReviewsResult, coachProfileResult] = await Promise.all([
            supabase.from('courses').select('id').eq('coach_id', courseData.coach_id),
            supabase.from('reviews').select('rating').in('course_id',
              (await supabase.from('courses').select('id').eq('coach_id', courseData.coach_id)).data?.map((c: any) => c.id) || []
            ),
            supabase.from('coach_profiles').select('bio').eq('id', courseData.coach_id).maybeSingle(),
          ]);
          coachBio = coachProfileResult.data?.bio || '';
          const coachCourseIds = coachCoursesResult.data?.map((c: any) => c.id) || [];
          coachCoursesCount = coachCourseIds.length;
          if (coachCourseIds.length > 0) {
            const { count } = await supabase.from('enrollments').select('profile_id', { count: 'exact', head: true }).in('course_id', coachCourseIds);
            coachStudentsCount = count ?? 0;
          }
          const coachReviews = coachReviewsResult.data || [];
          coachRating = coachReviews.length > 0 ? Math.round((coachReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / coachReviews.length) * 10) / 10 : 0;
        }

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

        let previousModuleCompleted = true;

        const structuredCurriculum = modulesData.map((module, index) => {
          let isModuleLocked = checkDripDateOrDays(module);
          if (module.drip_mode === 'after-previous') {
            if (index > 0 && !previousModuleCompleted) {
              isModuleLocked = true;
            }
          }

          const moduleItems = itemsData.filter(item => item.module_id === module.id) || [];
          let previousLessonCompleted = true;

          const lessonsWithStatus = moduleItems.map((item, idx) => {
            const itemId = item.lesson_id || item.quiz_id;
            const isCompleted = userProgress[itemId] || false;
            let isLessonLocked = isModuleLocked;

            if (!isLessonLocked && module.is_sequential) {
              if (idx > 0 && !previousLessonCompleted) {
                isLessonLocked = true;
              }
            }

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

          const isThisModuleCompleted = moduleItems.length === 0 || moduleItems.every(item => {
            const itemId = item.lesson_id || item.quiz_id;
            return userProgress[itemId] === true;
          });

          previousModuleCompleted = isThisModuleCompleted;

          return {
            ...module,
            lessons: lessonsWithStatus,
            isLocked: isModuleLocked
          };
        });

        if (courseData) {
          const goals = goalsData ? goalsData.map(g => g.description) : [];

          setCourse({
            id: courseData.id,
            title: courseData.title,
            category: courseData.category?.name || 'General',
            level: courseData.level || 'Beginner',
            rating: avgRating,
            reviewCount: reviewRows.length,
            studentsCount: enrollmentCount,
            duration: courseData.duration_hours ? `${courseData.duration_hours}h` : 'N/A',
            price: courseData.price || 0,
            originalPrice: undefined,
            description: courseData.long_description || courseData.short_description || 'No description available',
            whatYouLearn: goals,
            tools: [],
            curriculum: structuredCurriculum,
            reviews: [],
            coach: courseData.coach ? {
              name: `${courseData.coach.first_name} ${courseData.coach.last_name || ''}`,
              avatar: '👨‍🏫',
              bio: coachBio,
              studentsCount: coachStudentsCount,
              coursesCount: coachCoursesCount,
              rating: coachRating
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
        navigate('/login');
        return;
      }
      if (!course) return;
      const { error } = await supabase
        .from('enrollments')
        .insert({ profile_id: user.id, course_id: course.id });
      if (error && error.code !== '23505') throw error;
      setIsEnrolled(true);
    } catch (err: any) {
      console.error('Error enrolling:', err);
    }
  };

  const handleUnenroll = async () => {
    const confirmed = window.confirm(
      `⚠️ WARNING: Leave ${course?.title}?\n\n` +
        "By leaving this course, you will:\n" +
        "• Lose ALL your progress (lessons completed, quiz attempts, scores)\n" +
        "• Lose all your quiz answers and submissions\n" +
        "• Lose access to Course Circle discussions\n" +
        "• Lose all feedback and coach review history\n\n" +
        "This action CANNOT be undone. If you re-enroll later, you'll start from scratch.\n\n" +
        "Are you sure you want to continue?"
    );
    if (!confirmed) return;

    try {
      if (!user || !course) return;

      console.log('🗑️ LEAVE COURSE: Starting cleanup for course', course.id, 'user', user.id);

      // STEP 1: Get all modules
      const { data: modules } = await supabase.from('modules').select('id').eq('course_id', course.id);
      const moduleIds = modules?.map(m => m.id) || [];
      console.log('  Modules found:', moduleIds.length);

      if (moduleIds.length === 0) {
        console.log('  No modules, deleting enrollment only');
        await supabase.from('enrollments').delete().match({ profile_id: user.id, course_id: course.id });
        setIsEnrolled(false);
        window.location.reload();
        return;
      }

      // STEP 2: Get all lesson IDs from module_content_items
      const { data: lessonRefs } = await supabase
        .from('module_content_items')
        .select('content_id')
        .in('module_id', moduleIds)
        .eq('content_type', 'lesson');
      const lessonIds = lessonRefs?.map(l => l.content_id) || [];
      console.log('  Lessons found:', lessonIds.length, lessonIds);

      // STEP 3: Get all quiz IDs (from module AND lesson content items)
      const { data: moduleQuizzes } = await supabase
        .from('module_content_items')
        .select('content_id')
        .in('module_id', moduleIds)
        .eq('content_type', 'quiz');

      const { data: lessonQuizRefs } = await supabase
        .from('lesson_content_items')
        .select('content_id')
        .in('lesson_id', lessonIds)
        .eq('content_type', 'quiz');

      const allQuizIds = [
        ...(moduleQuizzes?.map(q => q.content_id) || []),
        ...(lessonQuizRefs?.map(q => q.content_id) || [])
      ];
      console.log('  Quizzes found:', allQuizIds.length, allQuizIds);

      // STEP 4: Get all attempt IDs for this student
      let attemptIds: string[] = [];
      if (allQuizIds.length > 0) {
        const { data: attempts } = await supabase
          .from('quiz_attempts')
          .select('id')
          .eq('user_id', user.id)
          .in('quiz_id', allQuizIds);
        attemptIds = attempts?.map(a => a.id) || [];
        console.log('  Quiz attempts found:', attemptIds.length);
      }

      // STEP 5: Delete quiz data
      if (attemptIds.length > 0) {
        console.log('  Deleting quiz data...');
        const { data: submissionIds } = await supabase.from('quiz_submissions').select('id').in('quiz_attempt_id', attemptIds);
        const subIds = submissionIds?.map(s => s.id) || [];
        
        if (subIds.length > 0) {
          const { error: fbErr } = await supabase.from('quiz_feedback').delete().in('quiz_submission_id', subIds);
          console.log('    quiz_feedback deleted:', fbErr?.message || `${subIds.length} rows`);
        }
        
        const { error: qsErr } = await supabase.from('quiz_submissions').delete().in('quiz_attempt_id', attemptIds);
        console.log('    quiz_submissions deleted:', qsErr?.message || `${attemptIds.length} rows`);
        
        const { error: qrErr } = await supabase.from('quiz_responses').delete().in('attempt_id', attemptIds);
        console.log('    quiz_responses deleted:', qrErr?.message || `${attemptIds.length} rows`);
        
        const { error: qaErr } = await supabase.from('quiz_attempts').delete().in('id', attemptIds);
        console.log('    quiz_attempts deleted:', qaErr?.message || `${attemptIds.length} rows`);
      }

      // STEP 6: Delete lesson progress (CRITICAL)
      if (lessonIds.length > 0) {
        console.log('  Deleting lesson progress for', lessonIds.length, 'lessons...');
        
        // Delete from lesson_content_item_progress first (FK dependency)
        const { error: lcipErr } = await supabase
          .from('lesson_content_item_progress')
          .delete()
          .eq('user_id', user.id)
          .in('lesson_id', lessonIds);
        console.log('    lesson_content_item_progress delete:', lcipErr?.message || 'SUCCESS');

        const { error: ulpErr } = await supabase
          .from('user_lesson_progress')
          .delete()
          .eq('user_id', user.id)
          .in('lesson_id', lessonIds);
        console.log('    user_lesson_progress delete:', ulpErr?.message || 'SUCCESS');

        const { error: lasErr } = await supabase
          .from('lesson_access_status')
          .delete()
          .eq('user_id', user.id)
          .in('lesson_id', lessonIds);
        console.log('    lesson_access_status delete:', lasErr?.message || 'SUCCESS');
      }

      // STEP 7: Delete module progress
      try {
        const { error } = await supabase
          .from('user_module_progress')
          .delete()
          .eq('user_id', user.id)
          .in('module_id', moduleIds);
        console.log('    user_module_progress delete:', error?.message || 'SUCCESS');
      } catch {
        console.log('    user_module_progress: table not found, skipping');
      }

      // STEP 8: Verify deletion
      const { data: remaining } = await supabase
        .from('user_lesson_progress')
        .select('lesson_id')
        .eq('user_id', user.id)
        .in('lesson_id', lessonIds);
      console.log('    Remaining progress after delete:', remaining?.length || 0);

      // STEP 9: Delete enrollment
      const { error } = await supabase.from('enrollments').delete().match({ profile_id: user.id, course_id: course.id });
      if (error) throw error;
      console.log('✅ Enrollment deleted');

      setIsEnrolled(false);
      alert(`You have left ${course.title}. All your progress has been removed.`);
      window.location.reload();
    } catch (error) {
      console.error('❌ Error unenrolling:', error);
      alert('Failed to leave course. Check console for details.');
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
            {/* Tab Bar */}
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
                    {renderDescription(course.description)}
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
                                if (!lesson.isLocked) navigate(`/student/courses/${courseId}/lessons/${lesson.id}`);
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
                    ₱{course.price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </span>
                  {course.originalPrice && (
                    <span className="text-lg text-text-muted line-through">
                      ₱{course.originalPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
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