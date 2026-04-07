import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { BookOpen, Clock, Users, PlayCircle, ArrowLeft } from 'lucide-react';

interface EnrolledCourse {
  id: string;
  title: string;
  subtitle?: string;
  instructor_name?: string;
  thumbnail_url?: string;
  progress: number;
  completed_lessons: number;
  total_lessons: number;
  level?: string;
  price?: number;
  rating?: number;
  num_reviews?: number;
}

const MyCoursesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'in-progress' | 'completed'>('all');

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      if (!user?.id) {
        console.log('❌ No user ID from useAuth');
        setLoading(false);
        return;
      }

      console.log('🔍 Fetching enrollments for user:', user.id);

      try {
        // Fetch user's enrollments - same as useEnrollment hook
        const { data: enrollments, error: enrollError } = await supabase
          .from('enrollments')
          .select('course_id, enrolled_at')
          .eq('profile_id', user.id);

        if (enrollError) {
          console.error('❌ Error fetching enrollments:', enrollError);
          console.error('Error code:', enrollError.code);
          console.error('Error message:', enrollError.message);
          setEnrolledCourses([]);
          setLoading(false);
          return;
        }

        console.log('✅ Enrollments fetched:', enrollments?.length || 0);
        console.log('📋 Enrollments data:', enrollments);

        if (!enrollments || enrollments.length === 0) {
          console.log('⚠️ No enrollments found for user:', user.id);
          console.log('💡 Check Supabase enrollments table - does profile_id match:', user.id);
          setEnrolledCourses([]);
          setLoading(false);
          return;
        }

        // Fetch course details with price and rating info
        const courseIds = enrollments.map(e => e.course_id);
        console.log('📚 Course IDs to fetch:', courseIds);
        
        const { data: courses, error: coursesError } = await supabase
          .from('courses')
          .select('id, title, subtitle, thumbnail_url, level, price, coach_id')
          .in('id', courseIds);

        if (coursesError) {
          console.error('❌ Error fetching courses:', coursesError);
        }

        console.log('✅ Courses fetched:', courses?.length || 0);
        console.log('📋 Courses data:', courses);

        if (!courses || courses.length === 0) {
          console.log('⚠️ No courses found for the enrolled course IDs');
          setEnrolledCourses([]);
          setLoading(false);
          return;
        }

        // Fetch instructor names
        const coachIds = courses.map(c => c.coach_id).filter(Boolean);
        let profilesMap: Record<string, string> = {};
        
        if (coachIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', coachIds);
          
          if (profilesData) {
            profilesData.forEach((p: any) => {
              profilesMap[p.id] = `${p.first_name || ''} ${p.last_name || ''}`.trim();
            });
          }
        }

        // Fetch course progress
        const { data: progressData } = await supabase
          .from('course_progress')
          .select('course_id, completed_lessons, total_lessons')
          .in('course_id', courseIds)
          .eq('profile_id', user.id);

        console.log('📊 Progress data:', progressData);

        // Fetch reviews for each course
        const coursesWithReviews = await Promise.all(courses.map(async (course: any) => {
          const { data: reviews } = await supabase
            .from('reviews')
            .select('rating')
            .eq('course_id', course.id);
          
          const rating = reviews && reviews.length > 0
            ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
            : 0;
          
          return {
            ...course,
            rating: rating,
            num_reviews: reviews?.length || 0
          };
        }));

        // Combine all data
        const coursesWithDetails: EnrolledCourse[] = coursesWithReviews.map((course: any) => {
          const progress = progressData?.find((p: any) => p.course_id === course.id);
          const totalLessons = progress?.total_lessons || 0;
          const completedLessons = progress?.completed_lessons || 0;
          
          return {
            id: course.id,
            title: course.title || 'Untitled Course',
            subtitle: course.subtitle,
            thumbnail_url: course.thumbnail_url,
            level: course.level,
            price: course.price,
            rating: course.rating,
            num_reviews: course.num_reviews,
            instructor_name: profilesMap[course.coach_id] || 'Unknown Instructor',
            progress: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
            completed_lessons: completedLessons,
            total_lessons: totalLessons,
          };
        });

        console.log('📖 Final enrolled courses:', coursesWithDetails);
        setEnrolledCourses(coursesWithDetails);
      } catch (error) {
        console.error('❌ Error fetching enrolled courses:', error);
        setEnrolledCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledCourses();
  }, [user?.id]);

  // Filter courses
  const filteredCourses = enrolledCourses.filter(course => {
    if (filter === 'completed') return course.progress === 100;
    if (filter === 'in-progress') return course.progress > 0 && course.progress < 100;
    return true;
  });

  const formatDuration = (minutes: number) => {
    if (!minutes || minutes === 0) return '0h';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const handleContinueLearning = (courseId: string) => {
    navigate(`/student/courses/${courseId}`);
  };

  return (
    
      <div className="min-h-screen bg-[color:var(--bg-primary)]">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-[color:var(--color-brand-neon)] via-[color:var(--color-brand-electric)] to-[color:var(--color-brand-primary)] text-white">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Back Button */}
            <button
              onClick={() => navigate('/student/courses')}
              className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back to Dashboard</span>
            </button>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">My Courses</h1>
                <p className="text-white/90 text-lg">
                  {enrolledCourses.length} {enrolledCourses.length === 1 ? 'course' : 'courses'} enrolled
                </p>
              </div>
              <div className="hidden lg:flex items-center gap-3">
                {/* Quick Links */}
                <Link
                  to="/student/messages"
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-all text-white text-sm font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Messages
                </Link>
                <Link
                  to="/student/community"
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-all text-white text-sm font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Community
                </Link>
                <Link
                  to="/student/ai-coach"
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-all text-white text-sm font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  AI Coach
                </Link>
                <Link
                  to="/student/live-classes"
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-all text-white text-sm font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Live Classes
                </Link>
                <Link
                  to="/student/certificates"
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 transition-all text-white text-sm font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  Certificates
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filter Tabs */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  filter === 'all'
                    ? 'bg-[color:var(--color-brand-electric)] text-white shadow-lg shadow-[color:var(--color-brand-electric)]/25'
                    : 'bg-[color:var(--bg-secondary)] text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-glass-hover)]'
                }`}
              >
                All Courses
                <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                  {enrolledCourses.length}
                </span>
              </button>
              <button
                onClick={() => setFilter('in-progress')}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  filter === 'in-progress'
                    ? 'bg-[color:var(--color-brand-electric)] text-white shadow-lg shadow-[color:var(--color-brand-electric)]/25'
                    : 'bg-[color:var(--bg-secondary)] text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-glass-hover)]'
                }`}
              >
                In Progress
                <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                  {enrolledCourses.filter(c => c.progress > 0 && c.progress < 100).length}
                </span>
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  filter === 'completed'
                    ? 'bg-[color:var(--color-brand-electric)] text-white shadow-lg shadow-[color:var(--color-brand-electric)]/25'
                    : 'bg-[color:var(--bg-secondary)] text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-glass-hover)]'
                }`}
              >
                Completed
                <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                  {enrolledCourses.filter(c => c.progress === 100).length}
                </span>
              </button>
            </div>
          </div>

          {/* Courses Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-[color:var(--bg-primary)] rounded-2xl border border-[color:var(--border-base)] overflow-hidden animate-pulse">
                  <div className="aspect-video bg-[color:var(--bg-secondary)]" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-[color:var(--bg-secondary)] rounded w-3/4" />
                    <div className="h-4 bg-[color:var(--bg-secondary)] rounded w-1/2" />
                    <div className="h-2 bg-[color:var(--bg-secondary)] rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-20 bg-[color:var(--bg-primary)] rounded-2xl border border-[color:var(--border-base)]">
              <div className="w-24 h-24 bg-[color:var(--color-brand-electric)]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-12 h-12 text-[color:var(--color-brand-electric)]" />
              </div>
              <h3 className="text-2xl font-bold text-[color:var(--text-primary)] mb-2">
                {filter === 'all' ? 'No courses yet' :
                 filter === 'completed' ? 'No completed courses' : 'No courses in progress'}
              </h3>
              <p className="text-[color:var(--text-secondary)] mb-8 max-w-md mx-auto">
                {filter === 'all'
                  ? "You haven't enrolled in any courses yet. Browse our catalog and start your learning journey!"
                  : filter === 'completed'
                  ? "Complete some courses to see them here. Keep up the great work!"
                  : "Start learning on your enrolled courses to see them here."}
              </p>
              {filter === 'all' && (
                <Link
                  to="/student/courses"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-[color:var(--color-brand-electric)] text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-[color:var(--color-brand-electric)]/25"
                >
                  <BookOpen className="w-5 h-5" />
                  Browse Courses
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className=" flex flex-col group bg-[color:var(--bg-primary)] rounded-2xl border border-[color:var(--border-base)] overflow-hidden hover:shadow-xl hover:border-[color:var(--color-brand-electric)]/20 transition-all duration-300"
                >
                  {/* Thumbnail */}
                  <div
                    className="aspect-video bg-[color:var(--bg-secondary)] relative overflow-hidden cursor-pointer"
                    onClick={() => handleContinueLearning(course.id)}
                  >
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[color:var(--color-brand-electric)]/10 to-[color:var(--color-brand-neon)]/10">
                        <BookOpen className="w-16 h-16 text-[color:var(--color-brand-electric)]/40" />
                      </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      {course.progress === 100 && (
                        <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                          ✓ Completed
                        </span>
                      )}
                      {course.progress > 0 && course.progress < 100 && (
                        <span className="px-3 py-1 bg-[color:var(--color-brand-electric)] text-white text-xs font-semibold rounded-full">
                          In Progress
                        </span>
                      )}
                      {course.level && (
                        <span className="px-3 py-1 bg-[color:var(--bg-primary)]/90 text-[color:var(--text-secondary)] text-xs font-semibold rounded-full">
                          {course.level}
                        </span>
                      )}
                    </div>

                    {/* Play Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-16 h-16 bg-[color:var(--bg-primary)] rounded-full flex items-center justify-center">
                        <PlayCircle className="w-8 h-8 text-[color:var(--color-brand-electric)]" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 pb-2 flex flex-col">
                    {/* Course Title */}
                    <h3 
                      className="font-bold text-gray-900 mb-2 text-lg line-clamp-2 cursor-pointer hover:text-[color:var(--color-brand-electric)] transition-colors"
                      onClick={() => handleContinueLearning(course.id)}
                    >
                      {course.title}
                    </h3>
                    
                  </div>
                  <div className='px-5 pb-5  mt-auto' >
                    {/* Instructor */}
                    {course.instructor_name && course.instructor_name !== 'Unknown Instructor' && (
                      <p className="text-sm text-[color:var(--text-secondary)] mb-2">{course.instructor_name}</p>
                    )}

                    {/* Rating with Stars */}
                    {course.rating && course.rating > 0 ? (
                      <div className="flex items-center gap-2 mb-3 ">
                        <span className="font-bold text-[color:var(--text-primary)]">{course.rating.toFixed(1)}</span>
                        <div className="flex text-yellow-400">
                          {'★'.repeat(Math.floor(course.rating))}
                          {'☆'.repeat(5 - Math.floor(course.rating))}
                        </div>
                        <span className="text-xs text-[color:var(--text-secondary)]">({course.num_reviews})</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-md text-[color:var(--text-secondary)]">No reviews yet</span>
                      </div>
                    )}
                  {/* Progress Bar */}
                    <div className="mb-4 ">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-medium text-[color:var(--text-primary)]">{course.progress}% complete</span>
                        <span className="text-[color:var(--text-secondary)]">{course.completed_lessons}/{course.total_lessons} lessons</span>
                      </div>
                      <div className="w-full h-2.5 bg-[color:var(--bg-secondary)] bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            course.progress === 100 
                              ? 'bg-green-500' 
                              : 'bg-gradient-to-r from-[color:var(--color-brand-neon)] to-[color:var(--color-brand-electric)]'
                          }`}
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleContinueLearning(course.id)}
                      className={`w-full py-3 px-4 rounded-xl font-semibold transition-all self-end mt-auto  ${
                        course.progress === 0
                          ? 'bg-[color:var(--color-brand-electric)] text-white hover:opacity-90'
                          : course.progress === 100
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gradient-to-r from-[color:var(--color-brand-neon)] to-[color:var(--color-brand-electric)] text-white hover:shadow-lg'
                      }`}
                    >
                      {course.progress === 0 ? 'Start Learning' : 
                       course.progress === 100 ? 'Review Course' : 'Continue Learning'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    
  );
};

export default MyCoursesPage;
