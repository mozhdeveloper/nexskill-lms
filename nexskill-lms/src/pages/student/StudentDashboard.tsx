import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import { useUser } from '../../context/UserContext';
import { supabase } from '../../lib/supabaseClient';
import { BookOpen, Clock, Star, TrendingUp, PlayCircle, ArrowRight, Award } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  subtitle?: string;
  thumbnail_url?: string;
  instructor_name?: string;
  price?: number;
  rating?: number;
  num_students?: number;
  level?: string;
  category?: string;
}

interface EnrolledCourse {
  id: string;
  title: string;
  thumbnail_url?: string;
  progress: number;
  completed_lessons: number;
  total_lessons: number;
  has_unread_feedback?: boolean;
}

const StudentDashboard: React.FC = () => {
  const { profile: currentUser } = useUser();
  const navigate = useNavigate();
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    inProgress: 0,
    completed: 0,
    hoursLearned: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser?.id) {
        setLoading(false);
        return;
      }

      try {
        // Fetch featured/popular courses
        const { data: coursesData } = await supabase
          .from('courses')
          .select(`
            id,
            title,
            subtitle,
            thumbnail_url,
            level,
            category,
            price,
            profiles (first_name, last_name)
          `)
          .eq('verification_status', 'approved')
          .order('created_at', { ascending: false })
          .limit(6);

        if (coursesData) {
          const courses = coursesData.map((course: any) => ({
            id: course.id,
            title: course.title,
            subtitle: course.subtitle,
            thumbnail_url: course.thumbnail_url,
            level: course.level,
            category: course.category,
            price: course.price,
            instructor_name: `${course.profiles?.first_name || ''} ${course.profiles?.last_name || ''}`.trim(),
          }));
          setFeaturedCourses(courses);
        }

        // Fetch unread quiz feedback
        const { data: unreadSubmissions } = await supabase
          .from('quiz_submissions')
          .select('quiz_id, id')
          .eq('user_id', currentUser.id)
          .is('student_read_at', null)
          .neq('status', 'pending_review');

        const unreadQuizIds = unreadSubmissions?.map(s => s.quiz_id) || [];
        
        // Map quiz IDs to course IDs
        const { data: quizCourseMapping } = await supabase
          .from('module_content_items')
          .select('content_id, module_id, modules(course_id)')
          .in('content_id', unreadQuizIds)
          .eq('content_type', 'quiz');

        const coursesWithUnreadFeedback = new Set<string>();
        quizCourseMapping?.forEach((item: any) => {
          if (item.modules?.course_id) {
            coursesWithUnreadFeedback.add(item.modules.course_id);
          }
        });

        // Fetch enrolled courses with progress
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select(`
            course_id,
            courses (
              id,
              title,
              thumbnail_url
            ),
            course_progress (
              completed_lessons,
              total_lessons
            )
          `)
          .eq('student_id', currentUser.id);

        if (enrollments) {
          const enrolled = enrollments.map((enrollment: any) => {
            const progress = enrollment.course_progress?.[0];
            const totalLessons = progress?.total_lessons || 0;
            const completedLessons = progress?.completed_lessons || 0;
            
            return {
              id: enrollment.course_id,
              title: enrollment.courses?.title || 'Course',
              thumbnail_url: enrollment.courses?.thumbnail_url,
              progress: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
              completed_lessons: completedLessons,
              total_lessons: totalLessons,
              has_unread_feedback: coursesWithUnreadFeedback.has(enrollment.course_id),
            };
          });

          setEnrolledCourses(enrolled);

          // Calculate stats
          const inProgress = enrolled.filter(c => c.progress > 0 && c.progress < 100).length;
          const completed = enrolled.filter(c => c.progress === 100).length;
          
          setStats({
            totalCourses: enrolled.length,
            inProgress,
            completed,
            hoursLearned: Math.round(enrolled.reduce((acc, c) => acc + (c.completed_lessons * 0.5), 0)),
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser?.id]);

  const formatDuration = (minutes: number) => {
    if (!minutes || minutes === 0) return '0h';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  return (
    <StudentAppLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="max-w-3xl">
              <h1 className="text-5xl font-bold mb-4">
                Welcome back, {currentUser?.firstName || 'Student'}! 👋
              </h1>
              <p className="text-xl text-purple-100 mb-8">
                Continue your learning journey and explore new courses
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/student/my-courses"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-purple-700 font-semibold rounded-xl hover:bg-purple-50 transition-all shadow-lg"
                >
                  <BookOpen className="w-5 h-5" />
                  My Courses
                </Link>
                <Link
                  to="/student/courses"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-purple-800/50 text-white font-semibold rounded-xl hover:bg-purple-800/70 transition-all backdrop-blur-sm"
                >
                  Browse Courses
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-sm text-gray-500">Total Courses</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalCourses}</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm text-gray-500">In Progress</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.inProgress}</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Award className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm text-gray-500">Completed</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-sm text-gray-500">Hours Learned</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats.hoursLearned}h</p>
            </div>
          </div>
        </div>

        {/* Continue Learning Section */}
        {enrolledCourses.length > 0 && (
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Continue Learning</h2>
              <Link
                to="/student/my-courses"
                className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {enrolledCourses.slice(0, 3).map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all cursor-pointer"
                  onClick={() => navigate(`/student/courses/${course.id}`)}
                >
                  <div className="aspect-video bg-gray-100 relative">
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-indigo-100">
                        <BookOpen className="w-12 h-12 text-purple-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <PlayCircle className="w-12 h-12 text-white" />
                    </div>
                    {/* Notification Badge */}
                    {course.has_unread_feedback && (
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-red-500 text-white text-[10px] font-bold rounded-full shadow-lg z-10 animate-pulse border border-white/20">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                        NEW FEEDBACK
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 mb-3 line-clamp-1">{course.title}</h3>
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{course.progress}% complete</span>
                        <span className="text-gray-500">{course.completed_lessons}/{course.total_lessons}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>
                    <button className="w-full py-2.5 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-all">
                      Continue Learning
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Featured Courses Section */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Featured Courses</h2>
            <Link
              to="/student/courses"
              className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
            >
              Browse All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCourses.map((course) => (
              <Link
                key={course.id}
                to={`/student/courses/${course.id}`}
                className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all"
              >
                <div className="aspect-video bg-gray-100 relative overflow-hidden">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-indigo-100">
                      <BookOpen className="w-12 h-12 text-purple-400" />
                    </div>
                  )}
                  {course.level && (
                    <span className="absolute top-3 left-3 px-3 py-1 bg-white/90 text-gray-700 text-xs font-semibold rounded-full">
                      {course.level}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-700 transition-colors">
                    {course.title}
                  </h3>
                  {course.instructor_name && (
                    <p className="text-sm text-gray-500 mb-3">{course.instructor_name}</p>
                  )}
                  {course.price && (
                    <p className="text-xl font-bold text-purple-600">${course.price}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </StudentAppLayout>
  );
};

export default StudentDashboard;
